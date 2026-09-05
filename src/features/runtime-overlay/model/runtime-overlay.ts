export type OverlayStatus = "available" | "stale" | "offline" | "error" | "unconfigured";

export interface RuntimeOverlay<T> {
  readonly status: OverlayStatus;
  readonly source: string;
  readonly fetchedAt: string | null;
  readonly expiresAt: string | null;
  readonly stale: boolean;
  readonly value: Readonly<T> | null;
  readonly error?: string;
}

export interface OverlayCache {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

interface CachedOverlay<T> {
  source: string;
  fetchedAt: string;
  expiresAt: string;
  staleUntil: string;
  value: T;
}

export interface RuntimeOverlayOptions {
  source: string;
  enabled: boolean;
  ttlMs: number;
  staleTtlMs?: number;
  cache?: OverlayCache | null;
  now?: () => number;
  online?: () => boolean;
  timeoutMs?: number;
  version?: string;
}

export interface LoadOptions<T> {
  cacheKey: string;
  load: (signal: AbortSignal) => Promise<T>;
  validate?: (value: unknown) => value is T;
}

const inflight = new Map<string, Promise<RuntimeOverlay<unknown>>>();

function readonlyValue<T>(input: T): Readonly<T> {
  const value = input && typeof input === "object"
    ? (typeof structuredClone === "function" ? structuredClone(input) : JSON.parse(JSON.stringify(input))) as T
    : input;
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === "object" && !Object.isFrozen(child)) readonlyValue(child);
    }
  }
  return value as Readonly<T>;
}

function state<T>(input: RuntimeOverlay<T>): RuntimeOverlay<T> {
  return Object.freeze(input);
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error || "request failed");
}

export class RuntimeOverlayClient {
  readonly #source: string;
  readonly #enabled: boolean;
  readonly #ttlMs: number;
  readonly #staleTtlMs: number;
  readonly #cache: OverlayCache | null;
  readonly #now: () => number;
  readonly #online: () => boolean;
  readonly #timeoutMs: number;
  readonly #version: string;

  constructor(options: RuntimeOverlayOptions) {
    this.#source = options.source;
    this.#enabled = options.enabled;
    this.#ttlMs = Math.max(1, options.ttlMs);
    this.#staleTtlMs = Math.max(this.#ttlMs, options.staleTtlMs ?? this.#ttlMs * 4);
    this.#cache = options.cache ?? null;
    this.#now = options.now ?? Date.now;
    this.#online = options.online ?? (() => true);
    this.#timeoutMs = Math.max(1, options.timeoutMs ?? 12_000);
    this.#version = options.version ?? "v1";
  }

  #read<T>(key: string, validate?: (value: unknown) => value is T): CachedOverlay<T> | null {
    if (!this.#cache) return null;
    try {
      const raw = this.#cache.get(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedOverlay<T>;
      if (!parsed || parsed.source !== this.#source || !parsed.fetchedAt || !parsed.expiresAt || !parsed.staleUntil) return null;
      if (validate && !validate(parsed.value)) return null;
      if (Date.parse(parsed.staleUntil) <= this.#now()) {
        this.#cache.remove(key);
        return null;
      }
      return parsed;
    } catch {
      try { this.#cache.remove(key); } catch { /* blocked storage is equivalent to a miss */ }
      return null;
    }
  }

  #fromCache<T>(cached: CachedOverlay<T>, status: "available" | "stale" | "offline"): RuntimeOverlay<T> {
    return state({
      status,
      source: cached.source,
      fetchedAt: cached.fetchedAt,
      expiresAt: cached.expiresAt,
      stale: status !== "available",
      value: readonlyValue(cached.value),
    });
  }

  async load<T>({ cacheKey, load, validate }: LoadOptions<T>): Promise<RuntimeOverlay<T>> {
    if (!this.#enabled) {
      return state({ status: "unconfigured", source: this.#source, fetchedAt: null, expiresAt: null, stale: false, value: null });
    }

    const key = `${this.#source}:${this.#version}:${cacheKey}`;
    const cached = this.#read<T>(key, validate);
    const now = this.#now();
    if (cached && Date.parse(cached.expiresAt) > now) return this.#fromCache(cached, "available");
    if (!this.#online()) {
      return cached
        ? this.#fromCache(cached, "offline")
        : state({ status: "offline", source: this.#source, fetchedAt: null, expiresAt: null, stale: false, value: null });
    }

    const pending = inflight.get(key);
    if (pending) return pending as Promise<RuntimeOverlay<T>>;

    const request = (async (): Promise<RuntimeOverlay<T>> => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.#timeoutMs);
        let value: T;
        try {
          value = await Promise.race([
            load(controller.signal),
            new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("provider request timed out")), { once: true })),
          ]);
        } finally {
          clearTimeout(timer);
        }
        if (validate && !validate(value)) throw new Error("provider returned invalid data");
        const fetchedAt = new Date(this.#now()).toISOString();
        const envelope: CachedOverlay<T> = {
          source: this.#source,
          fetchedAt,
          expiresAt: new Date(this.#now() + this.#ttlMs).toISOString(),
          staleUntil: new Date(this.#now() + this.#staleTtlMs).toISOString(),
          value,
        };
        try { this.#cache?.set(key, JSON.stringify(envelope)); } catch { /* cache is best-effort */ }
        return this.#fromCache(envelope, "available");
      } catch (error) {
        if (cached) return this.#fromCache(cached, "stale");
        return state({
          status: "error",
          source: this.#source,
          fetchedAt: null,
          expiresAt: null,
          stale: false,
          value: null,
          error: messageOf(error),
        });
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, request as Promise<RuntimeOverlay<unknown>>);
    return request;
  }
}

export function sessionOverlayCache(storage: Storage): OverlayCache {
  return {
    get: (key) => storage.getItem(`tg-live:${key}`),
    set: (key, value) => storage.setItem(`tg-live:${key}`, value),
    remove: (key) => storage.removeItem(`tg-live:${key}`),
  };
}
