// REAL fixtures lifted verbatim from the preserved Tottori validation branch, so the post-#105
// regressions reproduce the historical failures instead of restating them synthetically.
//
//   reconcile baseline        b153af3350afb3eeb320cf99e393a788ebb00ab6
//   first retained critic out b7fadadb4856d38cc400018169002dc580b4478f
//
// Nothing here is edited: the two 600 m evidence records are the R-E scar exactly as reconcile
// wrote them (differently worded, one per pass, `independent: null` on both); the transit file
// pair is the R-A scar exactly as the critic left it (an ordinary guide file rewritten with
// substantive factual corrections while facts.json stayed byte-identical).

const clone = (value) => JSON.parse(JSON.stringify(value));

/** facts.json at BOTH states — byte-identical across the critic pass. That identity is the
    defect: PR #105's reconcile step diffed only this file and reported "nothing changed". */
export const TOTTORI_FACTS = "{\n  \"fx-rate-usd-jpy\": {\n    \"claim\": \"Reference USD to JPY exchange rate (informational \u2014 not a card or exchange-counter rate)\",\n    \"value\": \"\u2248\u00a5159 per US$1\",\n    \"source_url\": \"https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=USD&To=JPY\",\n    \"verified_on\": \"2026-08-26\",\n    \"shelf_life\": \"fx\",\n    \"state\": \"approx\",\n    \"tier\": \"secondary\"\n  }\n}\n";

/** guides/tottori/05-transit.json before the critic (b153af3) and after it (b7fadad, read from
    its post-composition name 03-transit.json — composition renumbers, the critic does not). */
export const TOTTORI_TRANSIT_BEFORE = "[\n  {\n    \"type\": \"routes\",\n    \"group\": \"Transit\",\n    \"title\": \"Key transit routes\",\n    \"phase\": \"daily\",\n    \"source_url\": \"https://hinomarubus.co.jp/timetable_route/3455/?tab=2\",\n    \"verified_on\": \"2026-08-26\",\n    \"steps\": [\n      \"<b>Tottori Station \u2192 Kurayoshi Station</b> (San'in Main Line): limited express (Super Hakuto / Super Oki / Super Matsukaze) takes \u224830 min; a local train covers the same route in \u224860 min with no reserved-seat fee. With luggage and a group of 8, the local train's lack of seat reservations is a real trade-off against the express's speed \u2014 worth deciding per day rather than defaulting to whichever train is next.\",\n      \"<b>Kurayoshi Station \u2192 Shirakabe Dozo-gun</b>: city-route bus, \u224810\u201315 min, alight at the Akagawara/Shirakabe-Dozogun stop, then a short walk. The district's tourist information center (inside Akagawara Building No. 10) opens 9:00\u201317:00.\",\n      \"<b>Kurayoshi Station \u2192 Misasa Onsen</b> (Hinomaru Bus, Kamii-Misasa/Misasa Line, route 72/73): the trip's one consequential transfer. \u224820\u201326 min to the Misasa-area stops, roughly hourly on weekdays with a ~100-minute gap in early afternoon (12:22 \u2192 14:04 departures from Kurayoshi). Last confirmed weekday departure toward Misasa: <b>19:08</b>. \u26a0 Exact fare unconfirmed \u2014 the operator's own fare table is a PDF that couldn't be read; secondhand sources put it around \u00a5340\u2013\u00a5480, pay cash on board. A 2-day unlimited local-bus pass (\u00a51,300) covers this and neighboring Misasa-area routes if the group expects multiple rides.\",\n      \"It's a standard fare-box route bus, not a coach \u2014 no dedicated luggage hold, so boarding 8 people with suitcases takes longer than a solo traveler's transfer, and standing for the ride is a real cost for the 2 low-mobility travelers in the group. Build any Kurayoshi activity (like dinner) to end with real buffer before <b>19:08</b>, not against it. Kurayoshi Station itself is fully step-free (elevators, no escalators, to all 3 platforms) \u2014 the last-mile choice outside the station is what actually needs planning, not the train transfer.\",\n      \"<b>Kurayoshi Station \u2192 Misasa Onsen</b>, two reserved alternatives to the public bus: some Misasa ryokan (e.g. Misasakan) run a free reserved shuttle from the station on fixed pickup times (14:10/15:30/16:20/17:30, advance booking only \u2014 ask when you book the room); or reserve a 9-seat Hinomaru Hire jumbo taxi (0858-22-3155, \u00a5740 flagfall + \u00a590/279m metered, advance reservation required, not a station hail) that moves the whole party of 8 plus hand luggage in one vehicle instead of splitting across 2 regular taxis. After the last bus (19:08), one of these two is the practical way to Misasa that night \u2014 neither is walk-up, so arrange it by phone before the group is stranded, not after.\",\n      \"<b>Misasa Onsen \u2192 Kurayoshi Station</b> (return): morning weekday service is more frequent than the evening, with departures from around 7:30 onward \u2014 a safer window for a departure-day transfer than trying to catch a late-morning connection.\"\n    ]\n  },\n  {\n    \"type\": \"map\",\n    \"group\": \"Transit\",\n    \"title\": \"Orientation map\",\n    \"phase\": \"daily\",\n    \"center\": {\n      \"lat\": 35.5011,\n      \"lng\": 134.2351\n    },\n    \"span\": 0.08\n  }\n]\n";

export const TOTTORI_TRANSIT_AFTER = "[\n  {\n    \"type\": \"routes\",\n    \"group\": \"Transit\",\n    \"title\": \"Key transit routes\",\n    \"phase\": \"daily\",\n    \"source_url\": \"https://hinomarubus.co.jp/timetable_route/3450/?tab=2\",\n    \"verified_on\": \"2026-08-26\",\n    \"steps\": [\n      \"<b>Tottori Station \u2192 Kurayoshi Station</b> (San'in Main Line): limited express (Super Hakuto / Super Oki / Super Matsukaze) takes \u224830 min; a local train covers the same route in \u224860 min with no reserved-seat fee. With luggage and a group of 8, the local train's lack of seat reservations is a real trade-off against the express's speed \u2014 worth deciding per day rather than defaulting to whichever train is next.\",\n      \"<b>Kurayoshi Station \u2192 Shirakabe Dozo-gun</b>: city-route bus, \u224810\u201315 min, alight at the Akagawara/Shirakabe-Dozogun stop, then a short walk. The district's tourist information center (inside Akagawara Building No. 10) opens 9:00\u201317:00.\",\n      \"<b>Kurayoshi Station \u2192 Misasa Onsen</b> (Hinomaru Bus, Kamii-Misasa Line \u4e0a\u4e95\u4e09\u671d\u7dda, routes 70/71): the trip's one consequential transfer. Weekday departures from Kurayoshi Station run 7:45 through <b>19:25</b>, and 19:25 is the last one \u2014 it reaches the Misasa depot (\u4e09\u671d\u8eca\u5eab) at 19:52. The ride is not a fixed length: the direct runs take \u224820\u201327 min, while the variants routed via Kosei Hospital and Kurayoshi East High take \u224840\u201350 min, so read the column for the run you are actually catching. The biggest daytime hole is 13:20 \u2192 14:40 \u2014 80 minutes with nothing. \u26a0 Exact fare unconfirmed \u2014 the operator's own fare table is a PDF that couldn't be read; secondhand sources put it around \u00a5340\u2013\u00a5480, pay cash on board.\",\n      \"Hinomaru's <i>other</i> Misasa line (routes 72/73) starts from Ikuta depot in west Kurayoshi and never calls at Kurayoshi Station \u2014 its timetable is easy to find and useless to this group. Check the route name \u4e0a\u4e95\u4e09\u671d\u7dda before you trust a departure time.\",\n      \"It's a standard fare-box route bus, not a coach \u2014 no dedicated luggage hold, so boarding 8 people with suitcases takes longer than a solo traveler's transfer, and standing for the ride is a real cost for the 2 low-mobility travelers in the group. Build any Kurayoshi activity (like dinner) to end with real buffer before <b>19:25</b>, not against it. Kurayoshi Station itself is fully step-free (elevators, no escalators, to all 3 platforms) \u2014 the last-mile choice outside the station is what actually needs planning, not the train transfer.\",\n      \"<b>Kurayoshi Station \u2192 Misasa Onsen</b>, two reserved alternatives to the public bus: some Misasa ryokan (e.g. Misasakan) run a free reserved shuttle from the station on fixed pickup times (14:10/15:30/16:20/17:30, advance booking only \u2014 ask when you book the room); or reserve a 9-seat Hinomaru Hire jumbo taxi (0858-22-3155, \u00a5740 flagfall + \u00a590/279m metered, advance reservation required, not a station hail) that moves the whole party of 8 plus hand luggage in one vehicle instead of splitting across 2 regular taxis. After the last bus (19:25), one of these two is the practical way to Misasa that night \u2014 neither is walk-up, so arrange it by phone before the group is stranded, not after.\",\n      \"<b>To Sanbutsu-ji / Nageiredo (\u4e09\u5fb3\u5c71)</b>: the same 70/71 line runs on past Misasa to the <b>\u4e09\u5fb3\u5c71\u99d0\u8eca\u5834</b> (Mitokusan parking) stop \u2014 that is how a car-free party reaches the temple, and it is a handful of runs a day, not a shuttle. Weekday departures from Kurayoshi Station at 8:35 and 9:40 call at the Misasa Onsen bus centre (\u4e09\u671d\u6e29\u6cc9\u89b3\u5149\u5546\u5de5\u30bb\u30f3\u30bf\u30fc\u524d) at 8:55 and 9:59 and reach Mitokusan at 9:10 and 10:14 \u2014 a \u224815-minute ride from the onsen town. Weekday returns from \u4e09\u5fb3\u5c71\u99d0\u8eca\u5834 leave at 10:25, 11:40, 12:50, 14:08, 15:19, 16:12 and 17:23 (last). Pick the return before you start up the mountain, not after.\",\n      \"<b>Misasa Onsen \u2192 Kurayoshi Station</b> (return): weekday departures from the Misasa Onsen bus centre (\u4e09\u671d\u6e29\u6cc9\u89b3\u5149\u5546\u5de5\u30bb\u30f3\u30bf\u30fc\u524d) start before 7:40 and run through 18:21. Morning service is denser than the evening service the group relied on for the Day 2 transfer \u2014 a safer window for moving eight people and their luggage on a departure day.\"\n    ]\n  },\n  {\n    \"type\": \"map\",\n    \"group\": \"Transit\",\n    \"title\": \"Orientation map\",\n    \"phase\": \"daily\",\n    \"center\": {\n      \"lat\": 35.47,\n      \"lng\": 134.04\n    },\n    \"span\": 0.21\n  }\n]\n";

/** The four evidence records the R-E/R-F regressions rest on, verbatim from b153af3. */
export const tottoriEvidenceRecords = () => clone([
  {
    "id": "ev-yohaijo-details",
    "candidateId": "c-mitokusan-nageiredo-viewing-platform",
    "claim": "A free public viewing platform (Nageiredo Yohaijo) at the foot of Mitokusan was completed and dedicated in November 2022, roughly 600m from Nageiredo itself (partial view, obstructed by trees); it has designated accessible parking and lets visitors view the National Treasure hall without climbing and regardless of weather.",
    "kind": "objective",
    "origin": "passA",
    "source": {
      "url": "https://www.town.misasa.tottori.jp/1593/31543.html",
      "kind": "official",
      "access": "fetched",
      "language": "ja",
      "publishedAt": "2022-11-19",
      "family": "misasa-town",
      "independent": null,
      "appliesToYears": [
        2026
      ]
    },
    "verifiedOn": "2026-08-26",
    "firsthand": null,
    "freshness": {
      "perishable": true,
      "shelfLife": "venue",
      "recheckOn": "2027-02-22"
    }
  },
  {
    "id": "ev-nageiredo-viewing-platform",
    "candidateId": "c-mitokusan-nageiredo-viewing-platform--accessible-alternative",
    "claim": "Without climbing, Nageiredo can only be seen from one place: the free roadside 'Haiden' viewing platform at the foot of Mitokusan — official wording: the only place besides climbing to see it — fitted with Nikon telescopes after a 2022 renovation, about 600m from the hall; the platform has 2 standard parking spaces plus 1 accessible parking space, with Mitokusan's own parking areas as overflow.",
    "kind": "objective",
    "origin": "passB",
    "source": {
      "url": "https://misasaonsen.jp/sightseeings/sightseeing-12431/",
      "kind": "official",
      "access": "fetched",
      "language": "ja",
      "publishedAt": null,
      "family": "misasaonsen-official",
      "independent": null,
      "appliesToYears": []
    },
    "verifiedOn": "2026-08-26",
    "firsthand": null,
    "freshness": {
      "perishable": true,
      "shelfLife": "venue",
      "recheckOn": "2026-10-13"
    }
  },
  {
    "id": "ev-jumbo-taxi",
    "candidateId": "c-kurayoshi-misasa-transfer--jumbo-taxi",
    "claim": "Hinomaru Hire's Kurayoshi office (0858-22-3155) offers 9-seat jumbo taxis — enough to fit a party of 8 plus hand luggage in one vehicle — as well as UD wheelchair-accessible taxis; jumbo taxis require advance reservation and are not available as a walk-up station-rank service. Standard meter rates in Tottori prefecture run ¥740 for the first 1.5km then ¥90 per 279m (regular cars) or ¥790/¥100 per 224m (large cars), per the Tottori Prefecture Hire-Taxi Association's published tariff.",
    "kind": "objective",
    "origin": "passB",
    "source": {
      "url": "https://www.hinomaru-hire.com/taxi/",
      "kind": "operator",
      "access": "fetched",
      "language": "ja",
      "publishedAt": null,
      "family": "hinomaru-hire-official",
      "independent": null,
      "appliesToYears": []
    },
    "verifiedOn": "2026-08-26",
    "firsthand": null,
    "freshness": {
      "perishable": true,
      "shelfLife": "transit",
      "recheckOn": "2026-10-13"
    }
  },
  {
    "id": "ev-kurayoshi-station-accessible",
    "candidateId": null,
    "claim": "JR Kurayoshi Station (rebuilt as an elevated station in 2011) has no-step access from both its north and south entrances through to the ticket gates, and elevators (no escalators) reach all three platforms from inside the gates; accessible toilets are available outside the ticket gates. The train-side transfer itself is fully step-free — the onward bus/shuttle/taxi choice outside the station is the actual constraint for this party, not the station transfer.",
    "kind": "objective",
    "origin": "passB",
    "source": {
      "url": "https://eki.jr-odekake.net/barrierfree?id=0640715",
      "kind": "official",
      "access": "fetched",
      "language": "ja",
      "publishedAt": null,
      "family": "jr-odekake-official",
      "independent": null,
      "appliesToYears": []
    },
    "verifiedOn": "2026-08-26",
    "firsthand": null,
    "freshness": {
      "perishable": true,
      "shelfLife": "venue",
      "recheckOn": "2026-10-13"
    }
  }
]);

/** The reconciliation rows as reconcile actually wrote them: `ev-nageiredo-viewing-platform`
    declares corroboration of Pass A's `ev-yohaijo-details` in PROSE only, and `ev-jumbo-taxi`
    says "supersedes Pass A's weak taxi fallback" while naming no record. */
export const tottoriReconciliationRows = () => clone([
  {
    "findingId": "ev-nageiredo-viewing-platform",
    "disposition": "adopt",
    "note": "Corroborates Pass A's ev-yohaijo-details (same platform, same ~600m/partial-view facts) and adds the exact parking count (2 standard + 1 accessible) and the Nikon-telescope/'only other viewing point' framing. Folded into the Nageiredo Yohaijo sights entry."
  },
  {
    "findingId": "ev-jumbo-taxi",
    "disposition": "replace",
    "note": "Supersedes Pass A's weak taxi fallback (Nikko/Chuo Taxi, only fare figure dated to 2009, 2 cars needed for 8 people) with a concretely-sourced 9-seat jumbo taxi option (Hinomaru Hire, published current metered tariff, single vehicle for the whole party). Adopted as the primary reserved fallback in the transport finding and the Day 2 plan_b; Pass A's original taxi operators are kept as a secondary walk-up mention since they remain a real, if less-suited, option."
  }
,
  {
    "findingId": "ev-kurayoshi-station-accessible",
    "disposition": "adopt",
    "note": "New station-accessibility finding not in Pass A, directly relevant to the intake's binding mobility constraint. Folded into the transit section and the transport finding's doorToDoor field — establishes that the constraint sits in the onward bus/shuttle/taxi choice, not the train transfer itself."
  }
]);

export const tottoriCandidates = () => clone([
  {
    "id": "c-mitokusan-nageiredo-viewing-platform",
    "name": "Mitokusan Nageiredo Viewing Platform",
    "branch": null,
    "priority": "culture",
    "status": "shipped",
    "shortlisted": true,
    "reason": null,
    "worth": null
  },
  {
    "id": "c-kurayoshi-misasa-transfer--jumbo-taxi",
    "name": "Kurayoshi-Misasa Transfer",
    "branch": "Jumbo Taxi",
    "priority": "anchor-transport",
    "status": "shipped",
    "shortlisted": true,
    "reason": null,
    "worth": "worth-the-effort"
  },
  {
    "id": "c-mitokusan-nageiredo-viewing-platform--accessible-alternative",
    "name": "Mitokusan Nageiredo Viewing Platform",
    "branch": "Accessible Alternative",
    "priority": "culture-history",
    "status": "shipped",
    "shortlisted": true,
    "reason": null,
    "worth": null
  }
]);

/** The BINDING mobility ask, verbatim: covered, reason null, resting on the disproven 600 m
    records among others. */
export const tottoriConstraintsAsk = () => clone({
  "id": "constraints",
  "ask": "BINDING mobility: 2 of 8 travelers have low walking tolerance; luggage carried on the Kurayoshi-Misasa transfer; assume no rental car unless research concludes otherwise and says so explicitly.",
  "status": "covered",
  "where": [
    "05-transit.json#key-transit-routes",
    "07-sights.json#nageiredo-yohaijo-viewing-platform",
    "07-sights.json#sanbutsu-ji-the-nageiredo-climb",
    "06-days.json#misasa-onsen-nageiredo-the-onsen-town-and-crab"
  ],
  "evidenceIds": [
    "ev-kurayoshi-station-accessible",
    "ev-yohaijo-details",
    "ev-nageiredo-viewing-platform",
    "ev-jumbo-taxi",
    "ev-ryokan-shuttle",
    "ev-mitokusan-fees-rules",
    "ev-mitokusan-nageiredo-rules"
  ],
  "reason": null
});

/** Two UNRELATED Tottori entities whose evidence claims both carry the ordinary value "¥800":
    the Sand Museum's adult admission and Mitokusan's climbing permit / waraji rental. Verbatim
    from b153af3. Any rule that retires evidence because another claim CONTAINS a corrected
    string retires both when either one moves — the R-A supersession defect, on real data. */
export const tottoriRepeatedValueRecords = () => clone([
    {
      "id": "ev-sand-museum-hours-price",
      "candidateId": "c-sand-museum",
      "claim": "Sand Museum hours are 9:00-18:00 with last entry at 17:30; adult admission is ¥800.",
      "kind": "objective",
      "origin": "passA",
      "source": {
        "url": "https://www.sand-museum.jp/information/",
        "kind": "official",
        "access": "fetched",
        "language": "ja",
        "publishedAt": null,
        "family": "sand-museum",
        "independent": null,
        "appliesToYears": [
          2026
        ]
      },
      "verifiedOn": "2026-08-26",
      "firsthand": null,
      "freshness": {
        "perishable": true,
        "shelfLife": "hours",
        "recheckOn": "2026-10-13"
      }
    },
    {
      "id": "ev-mitokusan-nageiredo-rules",
      "candidateId": "c-mitokusan-sanbutsuji-nageiredo-climb",
      "claim": "Climbing to Nageiredo requires reception at the temple office between 8:00 and 15:00 (last descent by 16:30), costs ¥1,200 total for one adult (¥400 main-hall admission + ¥800 climbing permit; ¥1,150/adult for groups of 20+), bars solo climbers (a minimum of two people is required), and requires non-metal-spike hiking shoes or rental waraji straw sandals (¥800) if footwear is judged unsuitable at the gate check. The route closes in bad weather and is typically closed for snow from December through March.",
      "kind": "objective",
      "origin": "passB",
      "source": {
        "url": "https://www.mitokusan.jp/",
        "kind": "official",
        "access": "fetched",
        "language": "ja",
        "publishedAt": null,
        "family": "mitokusan-official",
        "independent": null,
        "appliesToYears": []
      },
      "verifiedOn": "2026-08-26",
      "firsthand": null,
      "freshness": {
        "perishable": true,
        "shelfLife": "venue",
        "recheckOn": "2026-10-13"
      }
    }
  ]);

/** The Sand Museum admission as a canonical facts.json row. `¥800` is the figure the guide
    really states at 07-sights.json#/0/items/1/body in b153af3 and the figure
    `ev-sand-museum-hours-price` really sources; the row is the canonical shape production
    facts.json rows use for exactly this kind of short, widely repeated currency value. */
export const TOTTORI_ADMISSION_FACTS = (value) => JSON.stringify({
  "sand-museum-admission": {
    claim: "Sand Museum adult admission",
    value,
    source_url: "https://www.sand-museum.jp/information/",
    verified_on: "2026-08-26",
    shelf_life: "venue",
    state: "exact",
    tier: "primary",
  },
}, null, 2) + "\n";
