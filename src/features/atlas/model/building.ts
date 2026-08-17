/* Which "Guide-to-be" (content.config.ts's own word for a `draft: true` scaffold) the hub
   still shows as being BUILT, and which it says nothing about at all.

   Deliberately NOT named "in progress". On this very page `.atlas-stamp--progress` /
   "IN PROGRESS" already means *the trip is happening right now* — it is one of the three
   trip-status stamps SPEC-COMPONENTS.md §6 specifies (COMPLETE · IN PROGRESS · UPCOMING),
   and design-handoff/README.md §"Sheet list" pins that series to relevance-to-today. A guide
   being researched and a trip being taken are different claims about different things; one
   word for both would render them identically in the same list.

   The rule is TWO conditions and needs BOTH:
     1. the guide's `_guide.json` still carries `draft: true`, and
     2. its own run state (guides-intake/<slug>/state.json) has NOT cleared `verified`.

   Condition 2 is load-bearing, not belt-and-braces. `japan` was the motivating case: its run
   reached `verified` in July 2026 while it stayed `draft: true`, hidden deliberately pending a
   full regeneration (CONTEXT.md, "Japan's defects are frozen in the FIXTURE"; commit 4513f97).
   A draft whose run has finished is not a guide being built — it is a guide being withheld —
   and the hub has nothing honest to say about it. (Japan itself was deleted outright for a
   fresh redo shortly after, 2026-08-15 — see CONTEXT.md — but the rule the case motivated
   still matters for whatever guide is next held back this way.) */

import type { PipelineStage } from "../../pipeline-progress/index";

/** The slice of guides-intake/<slug>/state.json this rule reads. Typed loose on purpose: the
    file is `JSON.parse`d straight off disk with no schema in front of it, so every level is
    optional. `pipeline-progress` owns the full `PipelineState`; importing `PipelineStage` from
    it means renaming a stage there breaks this file at typecheck rather than silently. */
export interface RunStateLike {
  stages?: Partial<Record<PipelineStage, string | null>> | null;
}

/** The slice of a V2 run record (guides-intake/<slug>/run.v2.json) this rule reads. Same loose
    posture as RunStateLike: `JSON.parse`d off disk, every level optional. */
export interface RunStateV2Like {
  status?: string | null;
  stages?: Partial<Record<string, { status?: string | null } | null>> | null;
}

export interface BuildingGuideInput {
  slug: string;
  title: string;
  country?: string | null;
  /** `_guide.json`'s own `draft` flag — absent/false on every published guide. */
  draft?: boolean;
  /** Parsed run state, or null when the file is missing, unreadable or unparseable. */
  state?: RunStateLike | null;
  /** Parsed V2 run record, when one exists on main (a landed V2 run). Null otherwise. */
  runV2?: RunStateV2Like | null;
}

export interface BuildingGuide {
  slug: string;
  title: string;
  /** The row's sub-line — null whenever the title already says it (a fresh scaffold's title
      IS its country, so printing both would be one datum drawn twice as if it were two,
      which CLAUDE.md's uniform-application guardrail forbids). */
  country: string | null;
}

/** True only for a draft guide whose run state exists and has not yet finished its research.
 *
 *  No run state on disk — never scaffolded, deleted, or unreadable — reads as FALSE, not as
 *  "probably building". The page can only vouch for a run it can actually see, and refusing
 *  rather than guessing is the same call `scripts/geocode-venues.mjs` makes when a result
 *  doesn't match the name it asked about.
 *
 *  V2 (M7): a landed V2 run record on main is the newer, truer word on the same question — a
 *  run whose own status is `complete` (or whose critic stage completed) is finished research,
 *  so a still-draft guide with one is a guide being WITHHELD, not built (the same Japan case
 *  the V1 `verified` condition exists for). */
export function isGuideBuilding(guide: Pick<BuildingGuideInput, "draft" | "state" | "runV2">): boolean {
  if (guide.draft !== true) return false;
  if (guide.runV2) {
    if (guide.runV2.status === "complete") return false;
    if (guide.runV2.stages?.critic?.status === "complete") return false;
    return true; // a V2 run exists and has not finished — building, whatever V1's file says
  }
  if (!guide.state) return false;
  return !guide.state.stages?.verified;
}

/** The hub's building rows, in the order given (the content collection's own, i.e. by slug).
    Nothing here is date-sorted: a guide being built has no trip window to sort by, and
    inventing one from the run's clock would be a build-time snapshot of a moving figure. */
export function deriveBuildingGuides(guides: readonly BuildingGuideInput[]): BuildingGuide[] {
  return guides.filter(isGuideBuilding).map((g) => {
    const country = g.country?.trim() || null;
    const saysSomethingNew = country != null && !g.title.toLowerCase().includes(country.toLowerCase());
    return { slug: g.slug, title: g.title, country: saysSomethingNew ? country : null };
  });
}
