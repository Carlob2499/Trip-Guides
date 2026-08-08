/* Real-SHAPED seed for the trip-tools tests — the silo contract's `mocks/` requirement.
   Modelled on Korea's structure (a budget section, a days section with waypoints, sights
   carrying closed_days, checklists in two places) without being Korea's data: a test that
   asserted against the live guide would start failing the next time a fact was recerted. */

import type { ToolsRecordInput } from "../model/tools-record";

export const KOREA_LIKE: ToolsRecordInput = {
  slug: "koreaish",
  title: "A Country",
  country: "South Korea",
  tz: "Asia/Seoul",
  storeKey: "tg-koreaish",
  firstDayDate: "Wed Jul 8",
  lastDayDate: "Wed Jul 15",
  sections: [
    {
      type: "panel", group: "Plan", title: "Before you go",
      checklist: [
        { text: "Buy the arena tickets", due: "2026-06-01", source_url: "https://example.com/t", verified_on: "2026-08-08" },
        "Pack a plug adapter",
      ],
    },
    {
      type: "budget", group: "Money", title: "What it costs",
      // Present precisely so the record can be asserted NOT to copy it anywhere.
      items: [{ label: "Accommodation", est: 180, basis: "day", per: "group" }],
    } as never,
    {
      type: "sights", group: "Sights", title: "The sights",
      items: [
        { name: "The Old Palace", closed_days: ["tue"], verified_on: "2026-07-29", source_url: "https://example.com/p" },
        { name: "The Hill", map: { lat: 37.58, lng: 126.98 } },
      ],
    } as never,
    {
      type: "days", group: "Days", title: "The journey",
      items: [
        {
          date: "Wed Jul 8", title: "Arrival",
          checklist: ["Bring cash for the market"],
          waypoints: [
            { name: "Airport", lat: 37.460, lng: 126.440 },
            { name: "Hotel", lat: 37.566, lng: 126.978 },
            { name: "Airport shops", lat: 37.462, lng: 126.442 },
          ],
        },
        {
          // Carries stops but only one is located — the honest "skipped" case.
          date: "Thu Jul 9", title: "Palaces",
          waypoints: [{ name: "The Old Palace", lat: 37.579, lng: 126.977 }, { name: "Somewhere unmapped" }],
        },
      ],
    } as never,
  ],
};
