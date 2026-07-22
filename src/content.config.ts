import { defineCollection, z } from "astro:content";
import { contrastRatio } from "./lib/contrast";

// Light page background (base.css `--bg`). A guide `theme.primary` becomes the
// site `--accent`, painted as link/tab/label text on this surface — so it must
// stay legible against it. Keep in sync with base.css if that token changes.
const LIGHT_BG = "#e9ebe3";
// Dark page background (base.css dark-mode `--bg`). The accent is NOT re-mapped in
// dark mode, so a theme.primary must stay legible on BOTH grounds — a light-only
// gate shipped a 2.33:1 dark-mode bug in WayPoint-V2; gate both, always.
const DARK_BG = "#14181c";
// 3.0:1 is WCAG's minimum for large-text / UI-component contrast, and is the
// empirically-calibrated floor of the project's own country accent palette
// (the tightest, #b07a1f, sits at ~3.16:1). Below this, accent UI turns
// illegible on the cream background — fail the build loudly rather than ship it.
const MIN_ACCENT_CONTRAST = 3.0;

// ADDITIVE provenance for perishable facts (prices, hours, transit, availability).
// Optional everywhere — every pre-existing guide builds unchanged. When present:
// source_url = the primary source consulted; verified_on = the YYYY-MM-DD it was
// checked. These power the weekly recert audit (link HEAD-checks + shelf-life
// flagging) and the staleness UI; inline <a href> citations remain equally valid.
const provenance = {
  source_url: z.string().url().optional(),
  verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Which shelf life judges this fact — the categories in src/lib/staleness.ts
  // (fx 7d · transit 90d · hours 90d · venue 180d · default 90d). Omit for `default`.
  // Without this, every dated fact was judged at a blanket 90 days, which is wrong in
  // both directions: an exchange rate is stale in a week, and a venue's existence is
  // still good at four months. The categories existed in staleness.ts from the start
  // and nothing ever passed one — this is the field that makes them real.
  shelf_life: z.enum(["fx", "transit", "hours", "venue", "default"]).optional(),
};

// A point on the map.
const coord = z.object({ lat: z.number(), lng: z.number() });

// A named, individually-addressable map point (distinct from the section's own
// `center`/`span`). place_id is verified-or-flagged, never guessed: an unverified
// value is literally the string "__VERIFICATION_REQUIRED__" (CLAUDE.md accuracy rule 4).
const mapPoint = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  place_id: z.string().optional(),
  local_script_name: z.string().optional(), // native-script name for taxi/local display
});

// The kinds of section a guide can contain. Each one lists the fields it
// needs; if a content file gets one wrong, the build fails with a clear message.
// NOTE: when adding a new type here, also add it to Block.astro and CLAUDE.md.

// Shared counter shape used by the `raids` type.
const counter = z.object({
  pokemon: z.string(),
  fast:    z.string(),
  charged: z.string(),
  typing:  z.string(),
});

// Opt-in collapse/expand for a section's whole card. `collapsible` renders it as a
// native <details>/<summary> (tap the title to fold); `defaultOpen` (default true)
// controls its initial state. Native <details> state is unmanaged/session-only —
// same convention the `raids`/`habitats` per-item <details> already use, so this
// stays consistent rather than adding a bespoke persistence layer.
const collapse = {
  collapsible: z.boolean().optional(),
  defaultOpen: z.boolean().optional(),
};

const section = z.discriminatedUnion("type", [
  z.object({ type: z.literal("panel"),  group: z.string(), title: z.string().optional(), body: z.string().optional(), checklist: z.array(z.string()).optional(), ...collapse, ...provenance }),
  z.object({ type: z.literal("prose"),  group: z.string(), title: z.string().optional(), body: z.string().optional(), ...collapse, ...provenance }),
  z.object({ type: z.literal("list"),   group: z.string(), title: z.string().optional(), items: z.array(z.string()), ...collapse, ...provenance }),
  z.object({ type: z.literal("routes"), group: z.string(), title: z.string().optional(), steps: z.array(z.string()), ...provenance }),
  z.object({ type: z.literal("map"),    group: z.string(), title: z.string().optional(), center: coord, span: z.number().optional(), points: z.array(mapPoint).optional() }),
  // weather — live 7-day Open-Meteo strip. No coords here: reads lat/lng from the
  // guide's first `map` section at runtime (so it needs no per-guide config). If the
  // guide has no map section the block stays hidden. `note` is an optional caption.
  z.object({ type: z.literal("weather"), group: z.string(), title: z.string().optional(), note: z.string().optional() }),
  // holidays — public holidays for the trip, fetched at BUILD time from Nager.Date
  // into src/data/holidays/{CC}-{year}.json (offline-safe, no client JS). The country
  // comes from themes.ts COUNTRY_CODES; the dates come from the guide's `days` section.
  // `year` is optional (defaults to the derived trip year). The block highlights any
  // holiday during the trip, notes ones just before/after, and hides if no data file
  // exists for the country/year.
  z.object({ type: z.literal("holidays"), group: z.string(), title: z.string().optional(), note: z.string().optional(), year: z.number().int().optional() }),
  z.object({ type: z.literal("days"),   group: z.string(), title: z.string().optional(), items: z.array(z.object({
    date: z.string(), title: z.string(),
    pace: z.string().optional(), note: z.string().optional(), body: z.string().optional(), fit: z.string().optional(),
    checklist: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(), // e.g. "Closed Mondays", "Advance booking required"
    // Explicit exertion tag for the Low-Energy toggle, on a spectrum (not derived
    // from `pace` — that's a free-text schedule narrative, not a strenuousness
    // rating, so inferring one from it would be a guess). Defaults to "balanced"
    // so a freshly generated day always has a valid value (no empty-string crash);
    // existing guides validate identically since every day implicitly was
    // "balanced" before this field existed. The toggle only dims days explicitly
    // tagged "packed".
    energy: z.enum(["packed", "balanced", "slow"]).default("balanced"),
    // ADDITIVE: where the day mostly happens. Explicit tag, same reasoning as `energy`
    // (never inferred from prose — that would be a guess). Powers the weather day-swap
    // advisory: rain forecast on an `outdoor` day + a dry `indoor` day in the same
    // window → an advisory suggesting the swap. Absent = the advisory stays silent
    // for that day. Research passes should set it when writing days.
    env: z.enum(["outdoor", "indoor", "mixed"]).optional(),
    // ADDITIVE: one-sentence glanceable day summary, derived from the day's own
    // researched content (never new facts). Rendered huge in Focus Today and as
    // the day card's lead line. Researched guides should always set it.
    tldr: z.string().optional(),
    // ADDITIVE (Plan view): ordered stops for the day. Powers the day-synced
    // planner map (pins + route line per day), the day stop-list, and GPX export.
    // All optional — guides adopt incrementally; coords must come from a verified
    // source (scripts/lookup-place.mjs), never guessed. `time` is a display label
    // ("08:00", "≈14:30"); day granularity stays honest when it's absent.
    waypoints: z.array(z.object({
      name: z.string(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      time: z.string().optional(),
      note: z.string().optional(),
    })).optional(),
    ...provenance,
  })) }),
  z.object({ type: z.literal("sights"), group: z.string(), title: z.string().optional(), items: z.array(z.object({
    name: z.string(), kicker: z.string().optional(), body: z.string().optional(),
    img: z.object({ file: z.string(), alt: z.string().optional() }).optional(),
    map: coord.optional(),
    ...provenance,
  })) }),
  z.object({ type: z.literal("budget"), group: z.string(), title: z.string().optional(),
    intro: z.string().optional(), currency: z.string().optional(), days: z.number().positive().optional(),
    // party must be a positive integer: BudgetBlock.astro divides trip totals by it
    // for the per-person view, so 0 or a negative value would render $Infinity/$NaN.
    party: z.number().int().positive().optional(),
    items: z.array(z.object({
      label: z.string(),
      basis: z.enum(["day", "trip"]),   // per-day cost (× days) or a one-off trip cost
      est: z.number(),                  // midpoint estimate in the guide's currency
      low:  z.number().optional(),      // low-end estimate (same basis as est)
      high: z.number().optional(),      // high-end estimate (same basis as est)
      category: z.string().optional(),  // groups items under a labelled category header
      per: z.enum(["person", "group"]).optional(), // "group" ÷ party in per-person view
      note: z.string().optional(),
      split_type: z.enum(["equal", "individual", "group"]).optional(),   // TripSplit hydration filter
      payment_preference: z.enum(["Cash Only", "Contactless", "Credit Card"]).optional(),
      ...provenance,
    })) }),
  // habitats — GO Fest habitat rotation as a responsive card grid; replaces the dense
  // comma-lists that used to live in prose. Each window renders as one card (day + time +
  // type theme + spawn/raid chips + priority targets), so the data segments cleanly and
  // reflows from a multi-column grid on desktop to a single column on mobile.
  z.object({ type: z.literal("habitats"), group: z.string(), title: z.string().optional(), note: z.string().optional(),
    windows: z.array(z.object({
      day:     z.string(),                        // "Sat Jul 11"
      time:    z.string(),                        // "10:00–13:00"
      name:    z.string(),                        // "Stormfire Peaks"
      types:   z.array(z.string()).optional(),    // type theme chips, e.g. ["Ice","Electric","Fire"]
      raids:   z.array(z.string()).optional(),    // 5★ / Mega bosses in the window (chips)
      targets: z.array(z.string()).optional(),    // priority pick chips (highlighted)
      mega:    z.string().optional(),             // all-window Super Mega note
      tip:     z.string().optional(),             // short tactical footnote (weakness/pass budget/etc.)
    })).min(1), ...collapse }),
  // infogrid — a grid of small icon-labeled fact cards; replaces dense bullet-list
  // "here's everything you need to know" prose with scannable, low-text-density tiles.
  z.object({ type: z.literal("infogrid"), group: z.string(), title: z.string().optional(), note: z.string().optional(),
    cards: z.array(z.object({
      icon:  z.string().optional(),   // single emoji/glyph, e.g. "🎟️"
      label: z.string(),              // short heading, e.g. "9 free raid passes/day"
      body:  z.string().optional(),   // one short clause of detail (inline HTML ok: <b>, <a>)
    })).min(1), ...collapse }),
  // tierlist — ranked chip groups (S/A/B priority tiers, or "skip vs fresh" divergence
  // groups); replaces paragraph-of-prose priority rankings with scannable chip rows.
  z.object({ type: z.literal("tierlist"), group: z.string(), title: z.string().optional(), note: z.string().optional(),
    tiers: z.array(z.object({
      tier:  z.string(),                       // group label, e.g. "S — do these no matter what"
      icon:  z.string().optional(),            // single emoji/glyph shown before the label
      chips: z.array(z.string()).min(1),       // short pick names; prefix "✨" inline for shiny-eligible
      hot:   z.array(z.string()).optional(),   // chip text(s) to render highlighted/must-do
      body:  z.string().optional(),            // optional 1–2 line elaboration (inline HTML ok)
    })).min(1), ...collapse }),
  // raids — structured raid boss counter tables; replaces hand-written HTML in prose bodies.
  // Each boss renders as a collapsible <details> card with a typed counter table.
  // `strategy` may contain simple inline HTML (<b>, <a>); no block elements.
  z.object({ type: z.literal("raids"),  group: z.string(), title: z.string().optional(), ...collapse,
    bosses: z.array(z.object({
      name:        z.string(),
      tier:        z.enum(["3-star", "5-star", "primal", "shadow", "super-mega"]),
      typing:      z.array(z.string()).min(1),
      shiny_odds:  z.string(),
      shiny_note:  z.string().optional(),
      trainers:    z.string(),
      note:        z.string().optional(),   // e.g. "GO Fest moveset: Counter + Psystrike"
      strategy:    z.string(),              // inline HTML allowed (<b>, <a>)
      counters:    z.array(counter).min(1).max(10),
    })) }),
]);

// Guide loader — accepts BOTH content shapes (convergence Phase 4):
//   · <slug>.json                — a single-file guide (legacy; scaffolds/drafts
//                                  still author this way)
//   · <slug>/ directory          — the siloed shape: _guide.json (all top-level
//                                  fields except sections) + NN-<group>.json
//                                  files, each an ARRAY of that tab group's
//                                  sections; filename sort (the NN prefix)
//                                  reproduces the original section order.
// Split a monolith with `node scripts/split-guide.mjs <slug>`. The assembled
// data validates against the exact same schema as a single-file guide, and the
// built HTML is byte-identical either way (that is the migration gate).
const guideLoader = {
  name: "waypoint-guides",
  load: async ({ store, parseData, generateDigest }: any) => {
    const { readdir, readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const DIR = path.join(process.cwd(), "src", "content", "guides");
    store.clear();
    const entries = await readdir(DIR, { withFileTypes: true });
    for (const e of entries) {
      let id: string, raw: Record<string, unknown>;
      if (e.isFile() && e.name.endsWith(".json")) {
        id = e.name.replace(/\.json$/, "");
        raw = JSON.parse(await readFile(path.join(DIR, e.name), "utf8"));
      } else if (e.isDirectory()) {
        const files = (await readdir(path.join(DIR, e.name))).filter((f) => f.endsWith(".json"));
        if (!files.includes("_guide.json")) continue; // not a guide dir
        id = e.name;
        const meta = JSON.parse(await readFile(path.join(DIR, e.name, "_guide.json"), "utf8"));
        const sections: unknown[] = [];
        for (const f of files.filter((f) => f !== "_guide.json").sort()) {
          const part = JSON.parse(await readFile(path.join(DIR, e.name, f), "utf8"));
          if (!Array.isArray(part)) throw new Error(`${e.name}/${f} must be a JSON array of sections`);
          sections.push(...part);
        }
        raw = { ...meta, sections };
      } else continue;
      const data = await parseData({ id, data: raw });
      store.set({ id, data, digest: generateDigest(data) });
    }
  },
};

const guides = defineCollection({
  // Every guide in src/content/guides/ becomes one page — single-file or
  // directory shape alike (see guideLoader above).
  loader: guideLoader,
  schema: z.object({
    kicker: z.string().optional(),
    title: z.string(),
    dek: z.string().optional(),
    footer: z.string().optional(),
    country: z.string(),          // sets the default accent colour (see src/lib/themes.ts)
    // Optional IANA time zone override, e.g. "America/Phoenix". A country-level default
    // (src/lib/themes.ts's tzFor) is wrong the moment a destination's local time differs
    // from its country's "typical" zone — Hawaii and Arizona both proved this by hours,
    // and it isn't a two-state problem: ANY country can have this same gap (a Canadian
    // province, a Russian region, a Brazilian state). Research passes should ALWAYS set
    // this explicitly once the guide's destination coordinates are verified — resolve it
    // with `node scripts/lookup-tz.mjs <lat> <lng>` (offline, boundary-accurate), never
    // guessed and never left to the country default. Absent = falls back to tzFor(country),
    // which stays correct for guides where the country and its typical zone genuinely
    // match (Denmark, South Korea, ...).
    tz: z.string().regex(/^[A-Za-z]+(?:\/[A-Za-z_+-]+)+$/).optional(),
    // Optional override of the country-derived palette. Hex only; when absent,
    // src/lib/themes.ts's country lookup remains the sole colour source.
    theme: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }).superRefine((t: { primary: string }, ctx: any) => {
      // `primary` is the colour actually painted as accent UI on the page background (it
      // becomes `--accent`), so it's the one that can break legibility. It renders on BOTH
      // grounds (dark mode does not re-map --accent), so gate both — a mid-value colour passes
      // both; a very dark accent passes light-only and turns illegible in dark mode.
      // secondary/accent are exposed as CSS vars but not yet consumed as on-background text,
      // so they aren't gated — add a check against their own surface if/when something renders them.
      const light = contrastRatio(t.primary, LIGHT_BG);
      if (light < MIN_ACCENT_CONTRAST) {
        ctx.addIssue({
          code: "custom",
          path: ["primary"],
          message: `theme.primary ${t.primary} has only ${light.toFixed(2)}:1 contrast against the light background ${LIGHT_BG} — needs ≥${MIN_ACCENT_CONTRAST}:1 to stay legible as accent text. Pick a deeper/more saturated colour.`,
        });
      }
      const dark = contrastRatio(t.primary, DARK_BG);
      if (dark < MIN_ACCENT_CONTRAST) {
        ctx.addIssue({
          code: "custom",
          path: ["primary"],
          message: `theme.primary ${t.primary} has only ${dark.toFixed(2)}:1 contrast against the dark background ${DARK_BG} — needs ≥${MIN_ACCENT_CONTRAST}:1 on both grounds. Pick a mid-value colour (or supply a lighter tone).`,
        });
      }
    }).optional(),
    // Optional per-trip COVER art (docs/MOTION.md) — the shared element that morphs from the
    // hub card into the guide masthead. A Wikimedia Commons `File:` name (verifiable licensing, same
    // as sights[].img). When absent, the hub card + masthead fall back to the guide's first sight
    // photo, so no existing guide regresses. `focal` is an optional CSS object-position (e.g.
    // "50% 30%") to keep the subject framed across the card ↔ hero size change.
    cover: z.object({
      file: z.string(),
      alt: z.string().optional(),
      credit: z.string().optional(),
      focal: z.string().optional(),
    }).optional(),
    // Optional situational phrase cards (docs/FEATURES.md #6) — a guide-level field, NOT a
    // section type: it's consumed by exactly one surface (the Trip kit tool tab), so it
    // deliberately sits outside the sections/bucket()/tabBudget system entirely — a "phrases"
    // section type routed through the normal per-group tabs would risk an empty/broken tab
    // if a future guide gave it a `group` (bucket() groups ALL sections blindly; Block.astro
    // has no case for a type it doesn't route). Same reasoning as `cover`: one additive field,
    // one consumer, zero risk to the existing tab system. `lang` is a BCP-47 tag (e.g. "ko-KR")
    // for the Web Speech API voice; each item's provenance is independently verified — a wrong
    // native-script phrase is actively unsafe (a traveler may show it to someone in a real
    // situation), so ship/flag/omit applies per-phrase, never a guessed transliteration.
    phrases: z.object({
      lang: z.string().optional(),
      items: z.array(z.object({
        situation: z.string(),        // e.g. "I have a food allergy"
        native: z.string(),           // native-script phrase — VERIFIED only
        romanization: z.string().optional(),
        note: z.string().optional(),  // usage note, e.g. "point + show this screen"
        ...provenance,
      })),
    }).optional(),
    // Optional entry-requirements card (docs/FEATURES.md #7) — one row per traveler home
    // country (a party can mix passports), guide-level for the SAME reason as `phrases`
    // (one consumer: Trip kit; sidesteps the bucket()/tabBudget system). Deliberately
    // stricter than `phrases`: `source_url` + `verified_on` are REQUIRED here, not the
    // general-purpose optional `...provenance` — a bare, undated visa/entry claim is not
    // a lesser version of this fact, it is a DIFFERENT (dangerous) claim, so the schema
    // itself refuses to let one ship. Never a paid visa API (see docs/FEATURES.md's own
    // cost screen) — this is pipeline-researched from each country's official entry page.
    entry: z.array(z.object({
      homeCountry: z.string(),        // the traveler's passport country, e.g. "United States"
      visa: z.string(),               // e.g. "Visa-free — K-ETA required, up to 90 days"
      passportValidity: z.string().optional(), // e.g. "6 months beyond entry date"
      note: z.string().optional(),
      source_url: z.string().url(),
      verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })).optional(),
    // Optional travel-advisory pill (docs/FEATURES.md #9) — the destination's current
    // official advisory level, guide-level (one destination country per guide, same
    // simplification `map`/`weather` already make). Always RECORD what was checked
    // (even a normal Level 1), so a re-check never reads as "never verified" — but the
    // pill itself renders ONLY when level >= 2 (honest-blank: normal precautions is not
    // news). Primary source only — travel.state.gov (US State Dept) is bot-gated against
    // plain fetches, so unlike `holidays` this is NOT build-time-fetched; it's
    // pipeline/recert-researched like `entry`, same required source_url + verified_on.
    advisory: z.object({
      level: z.number().int().min(1).max(4),
      title: z.string(),              // e.g. "Exercise Increased Caution"
      summary: z.string().optional(), // one-line reason, from the advisory's own text
      source_url: z.string().url(),
      verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).optional(),
    verified: z.string().optional(),  // freshness metadata for the maker/AI — NOT shown to travelers, EXCEPT a ⚠-prefixed value (e.g. an unconfirmed draft), which renders as a warning pill in the masthead
    draft: z.boolean().optional(),    // true = a "Guide-to-be" scaffold; listed in the home page's draft tier, not the curated grid
    // OPT-IN provenance enforcement. Absent = loose (every guide written before this
    // gate existed keeps building untouched, and a partial backfill stays honest rather
    // than being forced to fake dates it doesn't have). "strict" = this guide promises
    // that any section CLAIMING a check carries the date of that check; see the
    // superRefine below. New guides should be born strict.
    provenance: z.enum(["strict"]).optional(),
    // How many distinct content `group`s (= nav tabs) this guide may carry. Default 10.
    // Per-guide because guides legitimately differ: Korea's anchor events earn it groups
    // Denmark has no use for. This replaces a prose rule in the design doctrine that
    // nothing enforced — Korea quietly reached 11 content groups (15 tabs on screen) and
    // no gate noticed. Declare a number here and the build holds you to it; the cost of
    // a new tab becomes a deliberate, reviewable edit instead of a silent drift.
    // NOT counted: the four tool tabs (Budget/Vote/Reminders/Learnings). They're layout
    // chrome shipped by GuideLayout to every guide, not this guide's content — but note
    // each one still spends a slot of the reader's attention, which is why they're capped
    // separately in the layout rather than being free.
    tabBudget: z.number().int().positive().optional(),
    // Salted, unguessable id for this guide's shared Trip-Split / feedback / reminders room
    // (16–40 lowercase alphanumerics, crypto-random, committed once by scripts/gen-room-id.mjs).
    // Absent = legacy: the room falls back to the short guide slug, which the RTDB rules freeze
    // read-only (writes require code length >= 16). New guides are born with one so their room is
    // both writable and unguessable. Separate from `storeKey` (localStorage namespace) by design.
    roomId: z.string().regex(/^[a-z0-9]{16,40}$/).optional(),
    intro: z.string().optional(),
    // ADDITIVE + OPTIONAL — the curated post-mortem: what REALLY happened vs the plan.
    // Hand-authored by the maker from the raw trip feedback (never auto-generated, never
    // a dump of travelers' verbatim critiques — those stay private). Absent on every guide
    // until a trip has been reflected on, so existing guides validate byte-identically.
    // Its presence is what surfaces the reality layer: the Learnings tab renders it, and
    // each `days[].date` that matches an itinerary day grows a Plan ⇄ Actual toggle.
    learnings: z.object({
      verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // when this post-mortem was written
      summary: z.string().optional(),          // lead paragraph for the Learnings tab
      keyLearnings: z.array(z.string()).optional(), // what we learned about how we travel
      changed: z.array(z.string()).optional(),     // what I changed in the guide as a result
      days: z.array(z.object({
        date: z.string(),                      // must match a days[].date, e.g. "Mon Jul 13"
        actually: z.string().optional(),       // what really happened that day
        skipped: z.array(z.object({
          stop: z.string(),
          reason: z.string().optional(),
          // Which content `group` this stop belonged to — MAKER-DECLARED, never inferred.
          // It's what lets the Learnings tab total up which parts of a guide didn't
          // survive contact. Deliberately not derived by matching stop names against
          // section text: that's fuzzy matching, and a confident wrong answer here would
          // quietly mis-teach the next guide. Omit it when the stop doesn't clearly
          // belong to one group — an absent group just sits the stop out of the tally,
          // which is the honest outcome. Validated below against the guide's real groups.
          group: z.string().optional(),
        })).optional(),
      })).optional(),
    }).optional(),
    sections: z.array(section),
  }).superRefine((g: any, ctx: any) => {
    // NOTE: each check below is its own block and must not `return` — an early return
    // here exits the whole superRefine and silently skips every later check.

    // 1. The Plan ⇄ Actual join key is the day's date STRING, so a reworded label would
    // silently drop that day's whole reality layer. Fail the build instead: every
    // learnings day must name a date that exists in some itinerary days block.
    const learnDays: { date: string }[] = g.learnings?.days ?? [];
    if (learnDays.length) {
      const itinDates = new Set(
        g.sections
          .filter((s: any) => s.type === "days")
          .flatMap((s: any) => s.items.map((d: any) => d.date)),
      );
      for (const d of learnDays) {
        if (!itinDates.has(d.date)) {
          ctx.addIssue({
            code: "custom",
            path: ["learnings", "days"],
            message: `learnings day "${d.date}" matches no itinerary days[].date — its Plan ⇄ Actual toggle would silently not render. Itinerary dates: ${[...itinDates].join(", ") || "(none)"}`,
          });
        }
      }
    }

    // 1b. A skipped stop's declared `group` must name a real group. Same failure mode as
    // the date check above: a typo or a renamed group wouldn't error, it would just drop
    // that stop out of the "what didn't survive contact" tally — under-reporting the
    // damage, silently, which is the one thing the reality layer must never do.
    if (learnDays.length) {
      const realGroups = new Set(g.sections.map((s: any) => s.group));
      for (const d of learnDays as any[]) {
        for (const sk of d.skipped ?? []) {
          if (sk.group && !realGroups.has(sk.group)) {
            ctx.addIssue({
              code: "custom",
              path: ["learnings", "days"],
              message: `learnings skipped stop "${sk.stop}" declares group "${sk.group}", which no section uses — it would vanish from the skipped-by-group tally instead of erroring. Real groups: ${[...realGroups].join(" · ")}`,
            });
          }
        }
      }
    }

    // 2. Tab budget — distinct content groups become nav tabs, so this is the density
    // gate. Applies to every guide (default 10), because the failure it catches is drift
    // nobody notices: a group is added one section at a time and the tab bar grows on its
    // own. Excludes the four tool tabs — they're layout chrome, identical on every guide.
    const DEFAULT_TAB_BUDGET = 10;
    const budget = g.tabBudget ?? DEFAULT_TAB_BUDGET;
    const groups = [...new Set(g.sections.map((s: any) => s.group))];
    if (groups.length > budget) {
      ctx.addIssue({
        code: "custom",
        path: ["tabBudget"],
        message: `${groups.length} content groups exceeds this guide's tab budget of ${budget} — the nav bar also carries 4 tool tabs on top, so the reader would face ${groups.length + 4}. Merge two groups, or raise tabBudget deliberately if this guide has earned them. Groups: ${groups.join(" · ")}`,
      });
    }

    // 3. Provenance gate — only for guides that opted in with `provenance: "strict"`.
    // The rule encodes the ≈/⚠ distinction from the guide-author skill's
    // verification-rules §4: `≈` means *sourced-and-approximate* — it is a positive
    // claim to have CHECKED a figure, so it owes the date of that check. `⚠` means
    // *known gap, unconfirmed by design* and is exempt: it already tells the reader the
    // fact is unverified. A section carrying `≈` with no `verified_on` is claiming a
    // check it can't evidence, which is the "guessed figure wearing a ≈" the rules call
    // a fabrication — so it fails the build rather than shipping.
    if (g.provenance === "strict") {
      // Only these four accept section-level verified_on (see `section` above); the
      // others carry provenance per-item or not at all, so gating them here would
      // demand a field their schema rejects.
      const DATED_TYPES = new Set(["panel", "prose", "list", "routes"]);
      g.sections.forEach((s: any, i: number) => {
        if (!DATED_TYPES.has(s.type) || s.verified_on) return; // returns from the forEach cb only
        if (!JSON.stringify(s).includes("≈")) return;
        ctx.addIssue({
          code: "custom",
          path: ["sections", i, "verified_on"],
          message: `section ${i} ("${s.title ?? s.group}", type "${s.type}") uses ≈ but has no verified_on. Under provenance:"strict", ≈ asserts a fact was checked and found approximate — so it owes the date it was checked. Either add verified_on (+ source_url), or downgrade the figure to ⚠ if it was never actually confirmed.`,
        });
      });
    }
  }),
});

export const collections = { guides };
