/* Change-request wizard — pure decision layer. No DOM, no network.
   The wizard's job is to turn "something on this page is wrong" into an issue body the
   modify pipeline can act on WITHOUT the reporter knowing what a slug or a section is. */

import { sanitizeSection, CHANGE_MAX, CHANGE_MIN, buildModifyIssueUrl } from "../../../lib/modify-schema.mjs";

export type NavSection = { group: string; titles: string[] };
export type SectionOption = { value: string; label: string; hint: string };

/** The literal option meaning "I don't know which tab" — sent as an empty hint, which the
    modify agent already handles by finding the section itself. */
export const NOT_SURE = "";

/**
 * Build the picker's options from the guide's own nav structure.
 *
 * GROUPS, not individual section titles, for two reasons: `section` is a *hint that narrows the
 * pass to one tab*, and section titles routinely contain punctuation the hint's allowlist
 * rejects (em dashes, in particular) — offering one would mean sending a value the parser
 * silently drops. The titles still appear as a hint line so the reporter can tell which tab
 * holds their thing.
 */
export const HINT_MAX_TITLES = 3;

export function sectionOptions(navSections: NavSection[] | null | undefined): SectionOption[] {
  const out: SectionOption[] = [];
  for (const s of navSections ?? []) {
    const value = sanitizeSection(s?.group ?? "");
    if (!value) continue; // a group name the hint rules reject is better omitted than mangled
    const titles = (s.titles ?? []).filter((t) => t && t !== s.group);
    // The hint orients, it does not enumerate. A content-heavy tab can hold a dozen sections,
    // and printing all of them turns a one-line cue into a wall the reader has to parse.
    const shown = titles.slice(0, HINT_MAX_TITLES);
    const more = titles.length - shown.length;
    out.push({
      value,
      label: s.group,
      hint: shown.join(" · ") + (more > 0 ? ` · +${more} more` : ""),
    });
  }
  out.push({ value: NOT_SURE, label: "I'm not sure", hint: "let the editor find it" });
  return out;
}

/** `section` is null until the reader picks — distinct from "" (the explicit "I'm not sure"). */
export type WizardState = { section: string | null; change: string };

/** Step 0 = pick a tab (always satisfiable — "I'm not sure" is valid).
    Step 1 = describe the change (the only required input). */
export function validateStep(step: number, state: WizardState): { ok: boolean; error: string } {
  if (step === 1) {
    const text = (state.change ?? "").trim();
    if (!text) return { ok: false, error: "Tell us what's wrong so the editor knows what to check." };
    // Same floor the Worker enforces (CHANGE_MIN), asked for here in friendlier words — the
    // reporter should never get past this step only to be rejected by the backend.
    if (text.length < CHANGE_MIN) return { ok: false, error: "A little more detail — what should it say instead?" };
  }
  return { ok: true, error: "" };
}

/** Characters left before the cap. Surfaced so the reporter sees the limit before hitting it,
    rather than discovering their text was cut after the fact. */
export function remainingChars(change: string): number {
  return CHANGE_MAX - (change ?? "").length;
}

/** The final URL. Slug comes from the page, never typed by the reporter. */
export function buildRequestUrl(repo: string, slug: string, state: WizardState): string {
  return buildModifyIssueUrl(repo, {
    slug,
    change: (state.change ?? "").trim(),
    section: sanitizeSection(state.section ?? ""),
  });
}

/** The payload the Worker's POST /change validates — same three values the prefilled URL
    carries, so the two paths file the same request. */
export function buildRequestPayload(slug: string, state: WizardState) {
  return {
    slug,
    change: (state.change ?? "").trim(),
    section: sanitizeSection(state.section ?? ""),
  };
}

/**
 * Which path this reporter's request takes.
 *
 * `worker` — the request is POSTed to the backend, which files and starts it. Requires BOTH a
 * configured backend AND a stored owner key, because POST /change is owner-gated: it replaced
 * the deleted `modify-approved` label, so the thing that used to say "the owner allowed this
 * run" is now the key. Without one the Worker would 401 and the reporter would have done the
 * whole wizard for an error.
 *
 * `github` — the pre-batch-3 path, unchanged: a prefilled issue the reporter submits themselves.
 * This is what every ordinary reader gets, and it is not a degraded experience — it is the only
 * honest one, since a stranger's request genuinely does need the owner in the loop.
 */
export type SubmitMode = "worker" | "github";

export function submitMode(cfg: { backendUrl?: string; hasOwnerKey?: boolean } | null | undefined): SubmitMode {
  return cfg?.backendUrl && cfg.hasOwnerKey ? "worker" : "github";
}

/** Per-mode copy, here rather than in the markup because the two paths make DIFFERENT promises
    and the wizard must never make the wrong one: the worker path files immediately (no second
    confirmation screen exists), the GitHub path hands over a draft the reporter still submits. */
export const MODE_COPY: Record<SubmitMode, { review: string; next: string; foot: string }> = {
  worker: {
    review: "Here's what gets sent. Sending it starts the edit — there's no further step.",
    next: "Send request →",
    foot: "The request is queued the moment you send it; track it on the progress page.",
  },
  github: {
    review: "Here's what gets sent. You'll see it again on GitHub before anything is filed.",
    next: "Continue on GitHub →",
    foot: "Opens a prefilled GitHub issue — you press submit. Filing it changes nothing on its own; the site owner reviews every request before any edit runs.",
  },
};

/** What the reporter sees once a worker-path request lands. */
export const SENT_COPY = "Your request is queued — track it on the progress page.";

export { CHANGE_MAX };
