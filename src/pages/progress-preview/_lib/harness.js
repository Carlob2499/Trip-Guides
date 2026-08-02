/* PREVIEW-ONLY runtime for the /progress/ design study (src/pages/progress-preview/).

   Stands in for src/features/pipeline-progress/ui/progress.js's gateway polling: instead of
   hitting raw.githubusercontent.com every 15 s, it feeds a fixture through the REAL, unmodified
   deriveProgress() from the silo. Everything a direction renders therefore comes from the same
   ProgressView the shipping page renders — if it looks right here it is driven by real data
   there, and a direction cannot accidentally invent a field the pipeline doesn't have.

   The one thing it adds on top of ProgressView is DERIVED-FROM-TIMESTAMPS detail the live page
   already has in hand and throws away: how long each cleared stage took, and how long the
   current one has been running. Both are subtraction on `state.stages`, not new data. */
import { deriveProgress, formatElapsed, STAGE_ORDER } from "../../../features/pipeline-progress/index";
import { FIXTURES, fixtureFor } from "./fixtures";

export { formatElapsed, STAGE_ORDER, FIXTURES };

/** Same thresholds as PaintedAtlas.astro's inline script — a painter's sky, not astronomy. */
export function skyFor(hour) {
  return hour >= 21 || hour < 5 ? "night" : hour < 8 ? "dawn" : hour < 17 ? "day" : "dusk";
}

/** Destination hour from an IANA zone, or the viewer's own hour when we have no zone. */
export function hourIn(tz) {
  try {
    return parseInt(
      new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz || undefined }).format(new Date()),
      10
    );
  } catch {
    return new Date().getHours();
  }
}

/** "14:07" in the destination's own zone (or the viewer's, when unknown). */
export function clockIn(tz, d) {
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz || undefined }).format(d || new Date());
  } catch {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d || new Date());
  }
}

/**
 * Rail-width abbreviation of a stage's REAL label — derived, never a second hand-written list
 * that could drift from STAGE_LABEL. Cut at the em-dash the labels already use to separate
 * name from description; if what's left still won't fit a station, keep its first word.
 * The full label is always shown in full somewhere on the page, never replaced by this.
 *   "Pass A — canonical & verified"  -> "Pass A"
 *   "Scaffold created"               -> "Scaffold"
 *   "Reconcile A + B → one guide"    -> "Reconcile"
 */
export function shortLabel(label) {
  const head = String(label || "").split(" — ")[0].trim();
  return head.length <= 12 ? head : head.split(/\s+/)[0];
}

/** The descriptive half of a stage label, when it has one ("canonical & verified"). */
export function labelDetail(label) {
  const parts = String(label || "").split(" — ");
  return parts.length > 1 ? parts.slice(1).join(" — ").trim() : "";
}

/** Title-case a slug for display when no ?country= was passed. Presentation of the slug the
 *  page already has — not a lookup, not a guess about the destination. */
export function slugTitle(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Per-stage timing derived by subtraction on the timestamps deriveProgress already returned.
 * · cleared stage  -> `tookMs` (this stage's `at` minus the previous cleared `at`, or createdAt)
 * · current stage  -> `runMs`  (now minus the last cleared `at`, or createdAt)
 * · `published`    -> neither; pipeline.mjs never stamps it, so it has no honest duration
 *                    and gets null rather than a number that looks measured.
 */
export function stageTiming(view, state, now) {
  const t0 = state ? new Date(state.createdAt).getTime() : now;
  let prev = t0;
  return view.stages.map((s, i) => {
    const measurable = s.key !== "published";
    if (s.done && s.at && measurable) {
      const at = new Date(s.at).getTime();
      const tookMs = Math.max(0, at - prev);
      prev = at;
      return { tookMs, runMs: null, at: new Date(at) };
    }
    if (s.done) return { tookMs: null, runMs: null, at: null }; // published: done, never timed
    if (i === view.currentIndex && state) return { tookMs: null, runMs: Math.max(0, now - prev), at: null };
    return { tookMs: null, runMs: null, at: null };
  });
}

const PLAY_SEQUENCE = ["unknown", "scaffold", "passA", "mid", "verified", "done"];

/**
 * Boot a preview. `render(model)` is called on every state change; `tick(model)` every second.
 * The model carries the real ProgressView plus the identity and timing context above.
 */
export function initPreview({ render, tick }) {
  const cfgEl = document.getElementById("pvConfig");
  const cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  const params = new URLSearchParams(location.search);

  const slug = (params.get("slug") || "testland").trim().toLowerCase();
  const country = (params.get("country") || "").trim();
  const ident = cfg.countries?.[country.toLowerCase()] || cfg.house || {};
  const tz = ident.tz || "";

  // Accent identity, applied exactly the way accentStyle() applies it on every real surface:
  // both ink CANDIDATES travel, base.css picks between them per theme. Writing --accent-ink
  // directly here would shadow that choice and pin one shade onto both themes.
  const root = document.documentElement;
  if (ident.a) {
    root.style.setProperty("--accent", ident.a);
    root.style.setProperty("--accent-ink-light", ident.il);
    root.style.setProperty("--accent-ink-dark", ident.id);
    root.style.setProperty("--on-accent", ident.oa);
  }

  let key = params.get("state") || "mid";
  const playing = params.get("play") === "1";
  let playIdx = Math.max(0, PLAY_SEQUENCE.indexOf(key));

  function model() {
    const fx = fixtureFor(key);
    const now = Date.now();
    const view = deriveProgress(fx.state, { now: new Date(now), published: fx.published });
    // deriveProgress reports 0 elapsed when no state file exists yet; the live page ticks from
    // page-load in that case so the timer reads alive rather than frozen. Mirrored here.
    const elapsedMs = fx.state ? view.elapsedMs : now - bootedAt;
    return {
      view,
      fixture: fx,
      elapsedMs,
      timing: stageTiming(view, fx.state, now),
      slug,
      country,
      title: country || slugTitle(slug),
      tz,
      hour: hourIn(tz),
      // ?sky= is a PREVIEW-ONLY override so all four painted moods can be reviewed in one
      // sitting. It exists in this harness and nowhere near the shipping page, where the sky
      // is only ever the destination's real hour.
      sky: params.get("sky") || skyFor(hourIn(tz)),
      clock: clockIn(tz),
      base: cfg.base || "",
      guideHref: (cfg.base || "") + "/guides/" + slug + "/",
    };
  }

  const bootedAt = Date.now();
  render(model());
  setInterval(() => tick(model()), 1000);

  // The preview switcher — a real control, not chrome: reviewing a state machine means
  // stepping through it. Radio-style links so each state is a shareable URL.
  document.querySelectorAll("[data-pv-state]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      key = el.getAttribute("data-pv-state");
      params.set("state", key);
      history.replaceState(null, "", location.pathname + "?" + params.toString());
      document.querySelectorAll("[data-pv-state]").forEach((b) => b.setAttribute("aria-current", String(b === el)));
      render(model());
    });
    el.setAttribute("aria-current", String(el.getAttribute("data-pv-state") === key));
  });

  if (playing) {
    setInterval(() => {
      playIdx = (playIdx + 1) % PLAY_SEQUENCE.length;
      key = PLAY_SEQUENCE[playIdx];
      document.querySelectorAll("[data-pv-state]").forEach((b) => b.setAttribute("aria-current", String(b.getAttribute("data-pv-state") === key)));
      render(model());
    }, 4200);
  }
}
