/* The guide's own types, derived from the Zod schema — never hand-written.
 *
 * M6: the repo carried ~150 `any`s and `no-explicit-any` was switched OFF as a recorded debt.
 * Almost all of them were one shape: a function walking guide JSON, or an `.astro` component
 * receiving a section it then indexes into. The real type already existed — it's whatever
 * `content.config.ts`'s Zod schema infers — but nothing named it, so every consumer reached for
 * `any` instead. This file names it once.
 *
 * Derived, not declared: `GuideData` follows `CollectionEntry<"guides">["data"]`, so a schema
 * change propagates to every consumer automatically and a stale hand-written interface can
 * never drift from what the build actually validates.
 */
import type { CollectionEntry } from "astro:content";

/** One guide's validated data — the object `content.config.ts` produces. */
export type GuideData = CollectionEntry<"guides">["data"];

/** One member of the section discriminated union (`type` is the discriminant). */
export type Section = GuideData["sections"][number];

/** Every section `type` string the schema allows. */
export type SectionType = Section["type"];

/** Narrow the union to one section kind: `SectionOf<"days">` has `items`, `SectionOf<"map">`
 *  has `center`, and TypeScript enforces which fields each one actually has. This is the whole
 *  payoff of the discriminated union — a block renderer can stop guessing. */
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

/** A `days` section's individual day, and a `sights` section's individual item — the two
 *  element types that get mapped over most often across the codebase. */
export type DayItem = SectionOf<"days">["items"][number];
export type SightItem = SectionOf<"sights">["items"][number];

