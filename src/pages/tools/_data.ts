/* Build-time data for the Tools screen: one TripTools per published trip.

   It lives beside the routes rather than in src/lib/ because it is not pure logic — it
   reaches for `astro:content` and the build's holiday files, so it can only ever run inside
   a build. src/lib/ is the tested-logic shelf; a module no unit test can construct does not
   belong on it. The shape it returns is the silo's (trip-tools' `TripTools`).

   Shared by `/tools/` and `/tools/<slug>/` so the two pages cannot disagree about what a
   trip's tools contain — the whole point of the README's one-data-load guard, made
   structural by computing it once here instead of once per page. */

import { getCollection } from "astro:content";
import { flattenSections } from "../../features/exports/index";
import { deriveToolsRecord, type TripTools } from "../../features/trip-tools/index";
import { buildHolidayInfo, deriveTripYear, type RawHoliday } from "../../lib/holidays";
import { firstDayDateOf, lastDayDateOf, relevanceOrder, deriveGuideRecord } from "../../features/atlas/index";
import { countryData, COUNTRY_CODES } from "../../data/countries.mjs";
import { sheetOrder, ordinalFor } from "../../lib/sheet-order";

// Same build-time holiday source the guide pages read (scripts/fetch-holidays.mjs writes it).
const holidayData = import.meta.glob("../../data/holidays/*.json", { eager: true, import: "default" }) as Record<string, RawHoliday[]>;

/** Every published trip's tools, in the hub's own relevance order (ongoing → upcoming → past). */
export async function loadTripTools(now: Date = new Date()): Promise<TripTools[]> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const curated = (await getCollection("guides")).filter((g) => !g.data.draft);

  const order = sheetOrder(
    curated.map((g) => ({
      slug: g.id,
      firstDayDate: firstDayDateOf(g.data.sections),
      lastDayDate: lastDayDateOf(g.data.sections),
      kicker: g.data.kicker ?? null,
    })),
    now,
  );

  const built = curated.map((g) => {
    const flat = flattenSections(g.data.sections || []);
    const firstDayDate = firstDayDateOf(g.data.sections);
    const lastDayDate = lastDayDateOf(g.data.sections);
    const tz = g.data.tz ?? countryData(g.data.country)?.tz ?? null;

    const record = deriveToolsRecord({
      slug: g.id,
      title: g.data.title,
      country: g.data.country,
      tz,
      // Identical derivation to GuideLayout's — the split calculator on this screen must
      // land on the SAME ledger as the one in the guide, not a second one beside it.
      storeKey: (g.id || "guide").replace(/\W+/g, "").toLowerCase(),
      sections: flat as never,
      firstDayDate,
      lastDayDate,
    });

    const cc = COUNTRY_CODES[g.data.country] ?? null;
    const holSec = flat.find((s: { type?: string }) => s.type === "holidays") as { year?: number } | undefined;
    const year = holSec?.year || deriveTripYear(firstDayDate, now);
    const rows = cc ? holidayData[`../../data/holidays/${cc}-${year}.json`] : null;
    const holidays = holSec ? buildHolidayInfo(rows, firstDayDate, lastDayDate, year) : null;

    // relevanceOrder() reads a GuideRecord, so build the same one the hub does rather than
    // re-implementing "which trip matters right now" a second time.
    const guideRecord = deriveGuideRecord(
      {
        slug: g.id, title: g.data.title, dek: g.data.dek ?? null, kicker: g.data.kicker ?? null,
        country: g.data.country, tz, cover: null, sections: g.data.sections,
        facts: (g.data.facts ?? null) as Record<string, { value?: string; state?: string }> | null,
        ordinal: ordinalFor(order, g.id),
      },
      now,
    );

    return { tools: { record, href: `${base}/guides/${g.id}/`, holidays, cc } as TripTools, guideRecord };
  });

  return relevanceOrder(built.map((b) => b.guideRecord))
    .map((rec) => built.find((b) => b.guideRecord.slug === rec.slug)!.tools);
}
