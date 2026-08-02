/* Client module for the "first-light" design-study option (PREVIEW ONLY).
   Lives here rather than inline in the .astro page for the same reason
   src/features/pipeline-progress/ui/progress.js does: a page's markup and its behaviour
   are different jobs, and the inline form is not type-checked the way a module is. */
import { initPreview, formatElapsed, shortLabel } from "./harness.js";
import { generateTerrain, seedFromSlug } from "../../../lib/terrain";

export function initFirstLight() {
  const page = document.getElementById("flPage");
  const line = document.getElementById("flLine");
  const els = {
    elapsed: document.getElementById("flElapsed"),
    eyebrow: document.getElementById("flEyebrow"),
    title: document.getElementById("flTitle"),
    dek: document.getElementById("flDek"),
    count: document.getElementById("flCount"),
    fill: document.getElementById("flFill"),
    tip: document.getElementById("flTip"),
    now: document.getElementById("flNow"),
    attempts: document.getElementById("flAttempts"),
    stuck: document.getElementById("flStuck"),
    done: document.getElementById("flDone"),
    cta: document.getElementById("flCta"),
    fix: document.getElementById("flFix"),
    live: document.getElementById("flLive"),
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stops = [];
  let lastSpoken = "";

  /* Re-key the cover to THIS guide. The terrain generator is the same pure module the
     build uses for every other guide's cover (src/lib/terrain.ts) — same seed, byte-
     identical ridgeline — just called in the browser because the slug isn't known until
     the query string exists. */
  function paintScene(m) {
    const atlas = document.querySelector(".paint-atlas");
    const svg = document.querySelector(".pa-terrain");
    if (!atlas || !svg) return;
    const terrain = generateTerrain({ seed: seedFromSlug(m.slug) });
    svg.setAttribute("viewBox", `0 0 ${terrain.width} ${terrain.height}`);
    for (const layer of terrain.layers) {
      const p = svg.querySelector(`[data-pa-layer="${layer.depth}"]`);
      if (p) p.setAttribute("d", layer.d);
    }
    if (m.tz) atlas.setAttribute("data-paint-tz", m.tz);
    atlas.setAttribute("data-sky", m.sky);
  }

  function buildRail(m) {
    for (const s of stops) s.remove();
    line.style.setProperty("--edge", 50 / m.view.stages.length + "%");
    stops = m.view.stages.map((stage, i) => {
      const el = document.createElement("span");
      el.className = "fl-stop";
      el.style.setProperty("--i", String(i));
      el.innerHTML =
        '<span class="fl-dot"></span>' +
        '<span class="fl-name"></span>' +
        '<span class="fl-took"></span>';
      el.querySelector(".fl-name").textContent = shortLabel(stage.label);
      line.appendChild(el);
      return el;
    });
  }

  function render(m) {
    const v = m.view;
    paintScene(m);
    if (!stops.length) buildRail(m);

    els.title.textContent = m.title;
    // The eyebrow states a fact or says nothing. With no ?country= there is no time zone,
    // so there is no destination clock to show — an honest blank, not the viewer's own
    // clock relabelled as the destination's.
    els.eyebrow.innerHTML = m.tz
      ? '<span class="fl-eyebrow-dot"></span>' + m.clock + " in " + m.title + " right now"
      : '<span class="fl-eyebrow-dot"></span>' + (v.isDone ? "Ready" : "Being written now");
    // The dek is the page's claim about itself, so it has to move with the state — a
    // finished guide still saying "being researched right now" is the page lying quietly.
    els.dek.textContent = v.isDone
      ? "Researched, reconciled, verified and published. Every perishable fact in it was checked against a primary source first."
      : "Being researched and written right now. Nothing appears here until it has been checked against a primary source.";

    const doneCount = v.stages.filter((s) => s.done).length;
    els.count.innerHTML = "<b>" + doneCount + "</b> of " + v.stages.length + " stages";

    v.stages.forEach((stage, i) => {
      const el = stops[i];
      const t = m.timing[i];
      el.classList.toggle("is-done", stage.done);
      el.classList.toggle("is-now", !stage.done && i === v.currentIndex && !!m.fixture.state);
      el.querySelector(".fl-took").textContent = t.tookMs != null ? formatElapsed(t.tookMs) : "";
    });

    // The fill stops DEAD ON the centre of the last cleared station. It never creeps
    // into a stage that hasn't reported and it never eases toward "nearly there" — the
    // two lies every faux-progress bar tells. Zero cleared stages means zero fill.
    const n = v.stages.length;
    const width = Math.max(0, doneCount - 1) * (100 / n);
    els.fill.style.width = doneCount === 0 ? "0" : width + "%";
    els.tip.style.left = "calc(" + (50 / n) + "% + " + width + "%)";
    els.tip.hidden = doneCount === 0 || v.isDone;

    // The running stage, named in full — the rail's station label is an abbreviation of
    // this exact string (harness.shortLabel), never a second wording.
    const cur = v.stages[v.currentIndex];
    if (v.isDone) {
      els.now.innerHTML = '<span class="fl-now-k">Done</span><span class="fl-now-v">Verified, built, published</span>';
    } else if (!m.fixture.state) {
      els.now.innerHTML = '<span class="fl-now-k">Waiting</span><span class="fl-now-v">No checkpoint yet</span>' +
        '<span class="fl-now-t">the first commit usually lands within a minute</span>';
    } else {
      // The full STAGE_LABEL, verbatim — the rail's station text is an abbreviation of
      // this string, so the reader never has to trust a second wording of the same fact.
      const run = m.timing[v.currentIndex].runMs;
      els.now.innerHTML =
        '<span class="fl-now-k">Running</span>' +
        '<span class="fl-now-v">' + cur.label + "</span>" +
        (run != null ? '<span class="fl-now-t">for ' + formatElapsed(run) + "</span>" : "");
    }

    page.classList.toggle("is-stalled", v.isStuck);
    els.stuck.hidden = !v.isStuck;
    if (v.isStuck) {
      els.stuck.innerHTML =
        "<b>Nothing has moved for a while.</b> It hasn't failed — some destinations are " +
        "genuinely harder to source, and a run that gets cut off resumes from its last " +
        "checkpoint. If it stays like this, the confirmation comment on your issue has a " +
        "direct link you can come back to.";
    }

    // attempts is real pipeline state the shipping page never surfaces.
    const a = v.attempts;
    els.attempts.hidden = !(a > 1);
    if (a > 1) els.attempts.innerHTML = "<b>Attempt " + a + ".</b> An earlier run stopped early; this one picked up from the last cleared stage rather than starting over.";

    els.done.hidden = !v.isDone;
    els.cta.href = m.guideHref;
    els.fix.hidden = !!m.fixture.state;

    const spoken = v.isDone ? "Your guide is ready." : doneCount + " of " + v.stages.length + " stages complete. " + (v.isStuck ? "No progress for over twenty minutes." : "Now running: " + cur.label + ".");
    if (spoken !== lastSpoken) { els.live.textContent = spoken; lastSpoken = spoken; }

    tick(m);
  }

  function tick(m) {
    els.elapsed.textContent = formatElapsed(m.elapsedMs);
    // The running stage's own clock advances with the page clock — same fact, one second
    // apart, so they must never disagree by a render cycle.
    const run = m.view.isDone ? null : m.timing[m.view.currentIndex]?.runMs;
    const t = els.now.querySelector(".fl-now-t");
    if (t && run != null) t.textContent = "for " + formatElapsed(run);
  }

  initPreview({ render, tick });

  /* The overture — once, on arrival. Fault-safe: the finished frame is the default and
     the pending state is only ever added when motion is welcome. */
  if (!reduced) {
    page.classList.add("fl-pending");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      page.classList.add("fl-in");
      page.classList.remove("fl-pending");
    }));
  }

  document.getElementById("flFixForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const typed = (document.getElementById("flFixInput").value || "").trim().toLowerCase();
    if (!typed) return;
    const p = new URLSearchParams(location.search);
    p.set("slug", typed);
    location.search = p.toString();
  });

}
