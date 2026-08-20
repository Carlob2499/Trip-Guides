// Shared PURE logic for the Worker's OWNER endpoints (/change, /answer, /approve) — the
// batch-3 twin of intake-proxy.mjs, and here for the same two reasons: it gets bundled into the
// Worker AND unit-tested by the existing vitest scripts glob, so the validation the deployed
// endpoint actually runs is the validation the tests actually exercise.
//
// worker/index.mjs stays I/O only. Everything below is a pure function over a request body.
//
// ── The auth boundary ────────────────────────────────────────────────────────────────────
// These three endpoints REPLACE the deleted approval-label gate. Before batch 3, a change run
// could not start until the owner applied `modify-approved`/`revision-approved` in GitHub —
// the label WAS the authentication. With the labels gone the front door is the site, so the
// gate moves here: a shared secret (Worker env var OWNER_KEY) sent as `X-Owner-Key`. Nothing
// else changed about what a change run may do; only who may start one, and where that is
// checked. /intake stays open (anonymous travelers file guide requests) and keeps the per-IP
// rate limit as its only guard.
//
// Unset OWNER_KEY ⇒ 503 "not configured", never "open" — a half-deployed Worker must fail
// CLOSED on the write endpoints, the opposite of the rate limit's deliberate fail-open (that
// one only ever costs quota; these three start pipeline runs).

import { isValidSlug } from "./lib/slug.mjs";
import { sanitizeChange, sanitizeSection, CHANGE_MAX, CHANGE_MIN } from "../src/lib/modify-schema.mjs";

export { CHANGE_MAX, CHANGE_MIN };

/** Header the owner endpoints authenticate with. One definition — the Worker reads it, the
    site sends it, the README documents it. */
export const OWNER_KEY_HEADER = "X-Owner-Key";

/** An answer is one traveler reply — at most one change request's worth of prose. Same cap for
    the same reason: bound it before it can be silently truncated downstream. */
export const ANSWER_MAX = CHANGE_MAX;
/** More than this many answers in one POST is not a person answering their guide's questions. */
export const ANSWERS_MAX = 20;
/** Question and fork ids the pipeline emits: `q-<slug>-<n>`, `fork-<slug>-<n>`. Lowercase,
    hyphen-separated, bounded — the same shape discipline isValidSlug applies to slugs, because
    these ids end up in JSON that a workflow input carries. */
export const ID_RE = /^[a-z][a-z0-9-]{0,63}$/;

/** The workflow every owner endpoint dispatches, and the sources it accepts (pinned contract
    with .github/workflows/change.yml — a value not in this set is a bug, not a request). */
export const CHANGE_SOURCES = ["request", "staleness", "answers", "date-lock", "feedback"];

const err = (status, message) => ({ ok: false, status, error: message });
const ok = (value) => ({ ok: true, value });

/**
 * Constant-time-ish string compare for the owner key.
 *
 * Not `===`: a native string compare returns on the first differing byte, which leaks a
 * character-by-character oracle to anyone who can time the endpoint. This leaks LENGTH only,
 * which is the standard trade (and Workers' own crypto.subtle.timingSafeEqual is a
 * runtime-specific extension this stays independent of — a pure loop is testable and portable).
 *
 * An empty `expected` NEVER matches, whatever is provided — an unconfigured Worker must not be
 * unlockable by sending an empty header.
 */
export function keyMatches(expected, provided) {
  const a = typeof expected === "string" ? expected : "";
  const b = typeof provided === "string" ? provided : "";
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * The gate itself, as a pure decision: given the configured key and the one on the request,
 * either let it through or say exactly which failure it is.
 *   · no key configured → 503, the endpoint does not exist yet (distinct from "wrong key", so
 *     the owner can tell "I never set OWNER_KEY" from "my key is wrong" without reading logs).
 *   · wrong/missing header → 401. Deliberately identical for both: an attacker learns nothing
 *     about whether a header was present.
 */
export function ownerGate(configuredKey, providedKey) {
  if (!configuredKey) return err(503, "owner endpoints are not configured");
  if (configuredKey.length < OWNER_KEY_MIN_LEN) return err(503, "owner endpoints are misconfigured: OWNER_KEY is too short");
  if (!keyMatches(configuredKey, providedKey)) return err(401, "unauthorized");
  return { ok: true };
}

// ── Brute force, and a key worth brute-forcing ─────────────────────────────────────────────
// The gate above is a single shared secret on a public URL with no account, no lockout and no
// second factor — so the only thing between a wrong key and the right one is how many wrong ones
// an attacker may try. Unthrottled, /change answers a guess in milliseconds, forever.

/** Failed owner-gate attempts allowed from one IP per window before the routes stop answering. */
export const OWNER_FAIL_MAX = 10;
/** One hour. Fixed window (not sliding) — same shape as the intake counter, one KV read. */
export const OWNER_FAIL_WINDOW_MS = 60 * 60 * 1000;

/** The KV key the failure counter lives under. Same namespace and same `<what>:<ip>:<bucket>`
    shape as the intake limiter's `rl:` key, so one RATE binding serves both counters. */
export function ownerFailKey(ip, now = Date.now()) {
  return `of:${ip}:${Math.floor(now / OWNER_FAIL_WINDOW_MS)}`;
}

/** True once this IP has burned its budget of wrong keys for the window. A fixed window lets an
    attacker who straddles the boundary get at most 2×MAX in an hour — the standard trade for a
    counter that costs a single read, and still ~20 guesses/hour against a 32-char secret. */
export function ownerThrottled(failures) {
  return (Number(failures) || 0) >= OWNER_FAIL_MAX;
}

/** Server-side minimum for OWNER_KEY — the width of `openssl rand -hex 16`, which the README
    already tells the owner to generate. The site's own paste check (src/scripts/owner-key.js,
    OWNER_KEY_MIN) is a mis-paste guard on an input box; THIS is the authority, because the
    Worker is the boundary and the site is not the only thing that can call it. */
export const OWNER_KEY_MIN_LEN = 32;

/** What /health reports about the owner endpoints:
 *    "OFF"         unset ⇒ all three 503 (fail closed).
 *    "WEAK"        configured, but short enough to be worth guessing. Owner routes fail closed
 *                  with 503 until it is replaced; health keeps the diagnosis explicit.
 *    "configured"  at or over the minimum.
 */
export function ownerKeyHealth(configuredKey) {
  const key = typeof configuredKey === "string" ? configuredKey : "";
  if (!key) return "OFF";
  return key.length < OWNER_KEY_MIN_LEN ? "WEAK" : "configured";
}

/** Every endpoint below starts here: a slug that is safe as a path segment, a branch name and
    a workflow input. Rejecting is always right — a slug the pipeline can't address is a run
    that would fail later, noisily, having already spent an issue or a dispatch. */
function requireSlug(raw) {
  const slug = String(raw ?? "").trim().toLowerCase();
  if (!isValidSlug(slug)) return err(400, "invalid slug");
  return ok(slug);
}

/**
 * POST /change — {slug, section, change} → the fields a `modify-request` issue is rendered from.
 * `change` is required and sanitised (control chars, cap, field-marker escaping); `section` is
 * the one value that reaches the agent's prompt channel, so it goes through the allowlist that
 * DROPS anything injection-shaped rather than mangling it (src/lib/modify-schema.mjs).
 */
export function validateChangeRequest(raw) {
  const body = raw && typeof raw === "object" ? raw : {};
  const slug = requireSlug(body.slug);
  if (!slug.ok) return slug;
  const change = sanitizeChange(body.change);
  if (!change) return err(400, "change text is required");
  // The wizard asks for this too, in friendlier words — but the wizard is not the boundary. This
  // endpoint is reachable without it, and a two-word "wrong" files an issue naming no fact for
  // the pipeline to check.
  if (change.length < CHANGE_MIN) return err(400, `change text is too short (${CHANGE_MIN} characters or more)`);
  return ok({ slug: slug.value, change, section: sanitizeSection(body.section) });
}

/**
 * POST /answer — {slug, answers:[{id, answer}]}. Traveler answers to intake questions AND the
 * option a blocking fork was resolved with travel the same route: both are "the human decided
 * X for decision-point Y", and change.yml absorbs them with source "answers".
 */
export function validateAnswersRequest(raw) {
  const body = raw && typeof raw === "object" ? raw : {};
  const slug = requireSlug(body.slug);
  if (!slug.ok) return slug;

  const list = Array.isArray(body.answers) ? body.answers : null;
  if (!list || list.length === 0) return err(400, "answers must be a non-empty array");
  if (list.length > ANSWERS_MAX) return err(400, `too many answers (max ${ANSWERS_MAX})`);

  const answers = [];
  const seen = new Set();
  for (const item of list) {
    const id = String(item?.id ?? "").trim();
    if (!ID_RE.test(id)) return err(400, "invalid answer id");
    if (seen.has(id)) return err(400, `duplicate answer for ${id}`);
    seen.add(id);
    // Answers are DATA — they are absorbed as an amendment, never spliced into a prompt — but
    // they still ride through JSON and a markdown ledger, so the same control-char/marker
    // neutralising the change text gets applies here.
    const answer = sanitizeChange(item?.answer).slice(0, ANSWER_MAX);
    if (!answer) return err(400, `empty answer for ${id}`);
    answers.push({ id, answer });
  }
  return ok({ slug: slug.value, answers });
}

/**
 * POST /approve — {slug, issue}. The owner approving a feedback-driven revision proposal; the
 * issue number is the proposal's own record, which change.yml reads the plan from.
 */
export function validateApproveRequest(raw) {
  const body = raw && typeof raw === "object" ? raw : {};
  const slug = requireSlug(body.slug);
  if (!slug.ok) return slug;
  const issue = Number(body.issue);
  if (!Number.isInteger(issue) || issue <= 0) return err(400, "invalid issue number");
  return ok({ slug: slug.value, issue });
}

/**
 * The `plan_json` string change.yml receives for source "answers". A workflow_dispatch input is
 * always a STRING, so the structure travels as JSON and is parsed by the run — this function is
 * the single place that shape is written, so the Worker and the tests can't disagree about it.
 */
export function answersPlanJson({ slug, answers }) {
  return JSON.stringify({ source: "answers", slug, answers });
}

/** workflow_dispatch inputs must all be strings — a number here is a 422 from the API, which
    reads as "the workflow rejected the run" rather than "the Worker sent the wrong type". */
export function changeDispatchInputs({ source, slug, issue, planJson }) {
  if (!CHANGE_SOURCES.includes(source)) throw new Error(`unknown change source "${source}"`);
  const inputs = { slug, source };
  if (issue != null) inputs.issue = String(issue);
  if (planJson != null) inputs.plan_json = String(planJson);
  return inputs;
}
