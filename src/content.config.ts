import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { contrastRatio } from "./lib/contrast";

// Light page background (base.css `--bg`). A guide `theme.primary` becomes the
// site `--accent`, painted as link/tab/label text on this surface — so it must
// stay legible against it. Keep in sync with base.css if that token changes.
const LIGHT_BG = "#e9ebe3";
// 3.0:1 is WCAG's minimum for large-text / UI-component contrast, and is the
// empirically-calibrated floor of the project's own country accent palette
// (the tightest, #b07a1f, sits at ~3.16:1). Below this, accent UI turns
// illegible on the cream background — fail the build loudly rather than ship it.
const MIN_ACCENT_CONTRAST = 3.0;

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
  z.object({ type: z.literal("panel"),  group: z.string(), title: z.string().optional(), body: z.string().optional(), checklist: z.array(z.string()).optional(), ...collapse }),
  z.object({ type: z.literal("prose"),  group: z.string(), title: z.string().optional(), body: z.string().optional(), ...collapse }),
  z.object({ type: z.literal("list"),   group: z.string(), title: z.string().optional(), items: z.array(z.string()), ...collapse }),
  z.object({ type: z.literal("routes"), group: z.string(), title: z.string().optional(), steps: z.array(z.string()) }),
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
  })) }),
  z.object({ type: z.literal("sights"), group: z.string(), title: z.string().optional(), items: z.array(z.object({
    name: z.string(), kicker: z.string().optional(), body: z.string().optional(),
    img: z.object({ file: z.string(), alt: z.string().optional() }).optional(),
    map: coord.optional(),
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

const guides = defineCollection({
  // Every .json file in src/content/guides/ becomes one guide page.
  loader: glob({ pattern: "**/*.json", base: "./src/content/guides" }),
  schema: z.object({
    kicker: z.string().optional(),
    title: z.string(),
    dek: z.string().optional(),
    footer: z.string().optional(),
    country: z.string(),          // sets the default accent colour (see src/lib/themes.ts)
    // Optional override of the country-derived palette. Hex only; when absent,
    // src/lib/themes.ts's country lookup remains the sole colour source.
    theme: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }).refine(
      // `primary` is the colour actually painted as accent UI on the page
      // background (it becomes `--accent`), so it's the one that can break
      // legibility. secondary/accent are exposed as CSS vars but not yet
      // consumed as on-background text, so they aren't gated here — add a
      // check against their own surface if/when something renders them.
      (t) => contrastRatio(t.primary, LIGHT_BG) >= MIN_ACCENT_CONTRAST,
      (t) => ({
        message: `theme.primary ${t.primary} has only ${contrastRatio(t.primary, LIGHT_BG).toFixed(2)}:1 contrast against the light background ${LIGHT_BG} — needs ≥${MIN_ACCENT_CONTRAST}:1 to stay legible as accent text. Pick a deeper/more saturated colour.`,
        path: ["primary"],
      }),
    ).optional(),
    verified: z.string().optional(),  // freshness metadata for the maker/AI — NOT shown to travelers, EXCEPT a ⚠-prefixed value (e.g. an unconfirmed draft), which renders as a warning pill in the masthead
    draft: z.boolean().optional(),    // true = a "Guide-to-be" scaffold; listed in the home page's draft tier, not the curated grid
    intro: z.string().optional(),
    sections: z.array(section),
  }),
});

export const collections = { guides };
