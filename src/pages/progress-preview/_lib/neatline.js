/* Client module for the "neatline" design-study option (PREVIEW ONLY).
   Lives here rather than inline in the .astro page for the same reason
   src/features/pipeline-progress/ui/progress.js does: a page's markup and its behaviour
   are different jobs, and the inline form is not type-checked the way a module is. */
import { initPreview, formatElapsed, clockIn } from "./harness.js";

export function initNeatline() {
  const sheet = document.querySelector(".nl-sheet");
  const indexEl = document.getElementById("nlIndex");
  const els = {
    title: document.getElementById("nlTitle"),
    dek: document.getElementById("nlDek"),
    sheetNo: document.getElementById("nlSheetNo"),
    elapsed: document.getElementById("nlElapsed"),
    cleared: document.getElementById("nlCleared"),
    last: document.getElementById("nlLast"),
    local: document.getElementById("nlLocal"),
    localLbl: document.getElementById("nlLocalLbl"),
    localWrap: document.getElementById("nlLocalWrap"),
    attempts: document.getElementById("nlAttempts"),
    stuck: document.getElementById("nlStuck"),
    done: document.getElementById("nlDone"),
    cta: document.getElementById("nlCta"),
    fix: document.getElementById("nlFix"),
    live: document.getElementById("nlLive"),
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let items = [];
  let lastSpoken = "";

  function buildIndex(m) {
    indexEl.innerHTML = "";
    items = m.view.stages.map((stage) => {
      const li = document.createElement("li");
      li.className = "nl-item";
      li.innerHTML =
        '<span class="nl-mark" aria-hidden="true"></span>' +
        '<span class="nl-name"></span>' +
        '<span class="nl-lead" aria-hidden="true"></span>' +
        '<span class="nl-data"><span class="nl-at"></span><span class="nl-took"></span></span>';
      li.querySelector(".nl-name").textContent = stage.label;
      indexEl.appendChild(li);
      return li;
    });
  }

  function render(m) {
    const v = m.view;
    if (!items.length) buildIndex(m);

    els.title.textContent = m.title;
    els.sheetNo.textContent = v.isDone ? "Sheet complete" : "Sheet in progress";
    els.dek.innerHTML = v.isDone
      ? "Drawn, checked and filed. Every perishable fact on it was verified against a <b>primary source</b> before it was published."
      : "Not drawn yet. A research agent is working through the stages below, and nothing " +
        "reaches the sheet until it has been checked against a <b>primary source</b>.";

    v.stages.forEach((stage, i) => {
      const li = items[i];
      const t = m.timing[i];
      const isNow = !stage.done && i === v.currentIndex && !!m.fixture.state;
      li.className = "nl-item" +
        (stage.done ? " is-done" : isNow ? " is-now" : " is-todo") +
        (isNow && v.isStuck ? " is-stalled" : "");

      const at = li.querySelector(".nl-at");
      const took = li.querySelector(".nl-took");
      if (stage.done && t.at) {
        at.textContent = clockIn(m.tz, t.at);
        took.textContent = t.tookMs != null ? formatElapsed(t.tookMs) : "";
      } else if (stage.done) {
        // `published` is probed, never stamped — so it has a state but no clock time,
        // and printing one would be an invention.
        at.textContent = "";
        took.textContent = "live";
      } else if (isNow) {
        at.textContent = v.isStuck ? "stalled" : "running";
        took.textContent = t.runMs != null ? formatElapsed(t.runMs) : "";
      } else {
        at.textContent = "";
        took.textContent = "—";
      }
    });

    const doneCount = v.stages.filter((s) => s.done).length;
    els.cleared.innerHTML = doneCount + " <span>of " + v.stages.length + "</span>";
    els.last.textContent = m.fixture.state
      ? formatElapsed(Date.now() - new Date(m.fixture.state.updatedAt).getTime()) + " ago"
      : "—";
    els.localWrap.hidden = !m.tz;
    if (m.tz) {
      els.local.textContent = m.clock;
      els.localLbl.textContent = m.title;
    }

    els.stuck.hidden = !v.isStuck;
    if (v.isStuck) {
      els.stuck.innerHTML =
        "<b>Nothing has been committed for over twenty minutes.</b> That is a stall, not a " +
        "failure — some destinations are genuinely harder to source, and a run that is cut " +
        "off resumes from the last cleared stage above rather than starting again. The " +
        "confirmation comment on your issue holds a direct link for coming back later.";
    }

    els.attempts.hidden = !(v.attempts > 1);
    if (v.attempts > 1) {
      els.attempts.innerHTML = "<b>Attempt " + v.attempts + ".</b> Earlier runs stopped early; " +
        "each resumed from the last cleared stage rather than starting over.";
    }

    els.done.hidden = !v.isDone;
    els.cta.href = m.guideHref;
    els.fix.hidden = !!m.fixture.state;

    const cur = v.stages[v.currentIndex];
    const spoken = v.isDone
      ? "All six stages cleared. Your guide is ready."
      : doneCount + " of " + v.stages.length + " stages cleared. " +
        (v.isStuck ? "Stalled: nothing committed in over twenty minutes." : "Running: " + (cur ? cur.label : "") + ".");
    if (spoken !== lastSpoken) { els.live.textContent = spoken; lastSpoken = spoken; }

    tick(m);
  }

  function tick(m) {
    els.elapsed.textContent = formatElapsed(m.elapsedMs);
    const i = m.view.currentIndex;
    if (!m.view.isDone && items[i]) {
      const t = m.timing[i];
      if (t && t.runMs != null) items[i].querySelector(".nl-took").textContent = formatElapsed(t.runMs);
    }
    if (m.fixture.state) {
      els.last.textContent = formatElapsed(Date.now() - new Date(m.fixture.state.updatedAt).getTime()) + " ago";
    }
  }

  initPreview({ render, tick });

  if (!reduced) {
    sheet.classList.add("nl-pending");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sheet.classList.add("nl-in");
      sheet.classList.remove("nl-pending");
    }));
  }

  document.getElementById("nlFixForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const typed = (document.getElementById("nlFixInput").value || "").trim().toLowerCase();
    if (!typed) return;
    const p = new URLSearchParams(location.search);
    p.set("slug", typed);
    location.search = p.toString();
  });

}
