/** Traveler-facing homes for every authored guide section. */
export const TRAVELER_DESTINATION_ORDER = ["Days", "Food", "Explore", "Essentials"] as const;

export type TravelerDestinationName = (typeof TRAVELER_DESTINATION_ORDER)[number];
export type CanonicalSectionHome = TravelerDestinationName | "Sources & verification";
export type GuideRoute = "days" | "food" | "explore" | "essentials" | "sources" | "recap" | "tools";

export interface SectionLike {
  type: string;
  group?: string | null;
  title?: string | null;
  name?: string | null;
}

export interface ProjectedSection<T extends SectionLike = SectionLike> {
  section: T;
  index: number;
  rawGroup: string;
  home: CanonicalSectionHome;
}

export interface TravelerDestination<T extends SectionLike = SectionLike> {
  name: TravelerDestinationName;
  sections: ProjectedSection<T>[];
}

export interface TravelerProjection<T extends SectionLike = SectionLike> {
  destinations: TravelerDestination<T>[];
  sources: ProjectedSection<T>[];
}

export interface LegacyRouteAnchor {
  id: `grp-${number}`;
  route: GuideRoute;
}

const norm = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

function isSources(group: string): boolean {
  return /^(sources?|references?|evidence|verification)$/.test(group);
}

function isSourcesType(type: string): boolean {
  return /^(sources?|references?|evidence|verification)$/.test(type);
}

function isEssentials(group: string): boolean {
  return /^(plan|essentials?|transit|getting around|arrival(?:\s*(?:&|and)\s*transit)?|money(?:\s*(?:&|and)\s*budget)?|budget|health(?:\s*(?:&|and)\s*safety)?|safety|etiquette(?:\s*(?:&|and)\s*language)?|language)$/.test(group);
}

function isShoppingSubject(text: string): boolean {
  return /\b(shop(?:ping|s)?|souvenirs?|collectibles?|merch(?:andise)?|retail|malls?|tax refund)\b/.test(text);
}

function isFoodSubject(text: string): boolean {
  return /\b(food|dining|dishes|eat(?:ing)?|restaurants?|breakfast|lunch|dinner|cafes?|coffee|drinks?|bars?|cuisine|ordering)\b/.test(text);
}

export function canonicalHome(section: SectionLike): CanonicalSectionHome {
  const group = norm(section.group || "More");
  const subject = norm(section.title || section.name);

  if (isSources(group) || isSourcesType(norm(section.type))) return "Sources & verification";
  if (section.type === "days" || group === "days") return "Days";
  if (isEssentials(group)) return "Essentials";

  const foodGroup = /\b(food|dining|restaurants?|eating)\b/.test(group);
  const combinedShoppingGroup = foodGroup && /\bshopping\b/.test(group);
  if (combinedShoppingGroup && isShoppingSubject(subject) && !isFoodSubject(subject)) return "Explore";
  // A title alone cannot override its authored context: side-trip and event sections often
  // mention where to eat, but remain part of the destination/activity the traveler chose.
  if (foodGroup) return "Food";

  return "Explore";
}

export function routeForHome(home: CanonicalSectionHome): Exclude<GuideRoute, "recap" | "tools"> {
  if (home === "Sources & verification") return "sources";
  return home.toLowerCase() as Lowercase<TravelerDestinationName>;
}

export function projectTravelerDestinations<T extends SectionLike>(sections: readonly T[]): TravelerProjection<T> {
  const grouped = new Map<TravelerDestinationName, ProjectedSection<T>[]>(
    TRAVELER_DESTINATION_ORDER.map((name): [TravelerDestinationName, ProjectedSection<T>[]] => [name, []]),
  );
  const sources: ProjectedSection<T>[] = [];

  sections.forEach((section, index) => {
    const home = canonicalHome(section);
    const projected = { section, index, rawGroup: section.group || "More", home };
    if (home === "Sources & verification") sources.push(projected);
    else grouped.get(home)!.push(projected);
  });

  return {
    destinations: TRAVELER_DESTINATION_ORDER
      .map((name) => ({ name, sections: grouped.get(name)! }))
      .filter((destination) => destination.sections.length > 0),
    sources,
  };
}

export function legacyRouteAnchors(
  sections: readonly SectionLike[],
  { hasLearnings }: { hasLearnings: boolean },
): LegacyRouteAnchor[] {
  const firstByRawGroup = new Map<string, SectionLike>();
  for (const section of sections) {
    const rawGroup = section.group || "More";
    if (!firstByRawGroup.has(rawGroup)) firstByRawGroup.set(rawGroup, section);
  }

  const anchors: LegacyRouteAnchor[] = Array.from(firstByRawGroup.values(), (section, index) => ({
    id: `grp-${index}`,
    route: routeForHome(canonicalHome(section)),
  }));
  if (hasLearnings) anchors.push({ id: `grp-${anchors.length}`, route: "recap" });
  anchors.push({ id: `grp-${anchors.length}`, route: "tools" });
  return anchors;
}
