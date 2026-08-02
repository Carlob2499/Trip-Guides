/* Client module for the "two-passes" design-study option (PREVIEW ONLY).
   Lives here rather than inline in the .astro page for the same reason
   src/features/pipeline-progress/ui/progress.js does: a page's markup and its behaviour
   are different jobs, and the inline form is not type-checked the way a module is. */
import { initPreview, formatElapsed, clockIn } from "./harness.js";

export function initTwoPasses() {
  const wrap = document.querySelector(".tp-wrap");
  const graph = document.getElementById("tpGraph");
  const els = {
    title: document.getElementById("tpTitle"),
    dek: document.getElementById("tpDek"),
    elapsed: document.getElementById("tpElapsed"),
    tally: document.getElementById("tpTally"),
    attempts: document.getElementById("tpAttempts"),
    stuck: document.getElementById("tpStuck"),
    done: document.getElementById("tpDone"),
    cta: document.getElementById("tpCta"),
    fix: document.getElementById("tpFix"),
    live: document.getElementById("tpLive"),
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The only structural fact this direction adds, and it comes from STAGE_ORDER itself,
  // not from a hand-drawn picture: these two stages are the branch.
  const BRANCH = new Set(["passA", "passB"]);

  let rows = [];
  let lastSpoken = "";

  function buildGraph(m) {
    graph.innerHTML = "";
    rows = m.view.stages.map((stage, i) => {
      const li = document.createElement("li");
      li.className = "tp-node-row" + (BRANCH.has(stage.key) ? " is-branch" : "");
      li.style.setProperty("--i", String(i));
      li.innerHTML =
        '<span class="tp-gut" aria-hidden="true">' +
          (BRANCH.has(stage.key) ? '<span class="tp-elbow"></span>' : "") +
          '<span class="tp-dot"></span>' +
        "</span>" +
        '<span class="tp-body"><b></b><i></i></span>' +
        '<span class="tp-data"><b></b><i></i></span>';
      const parts = stage.label.split(" — ");
      li.querySelector(".tp-body b").textContent = parts[0];
      li.querySelector(".tp-body i").textContent = parts.slice(1).join(" — ");
      // Name the fork once, on the row where it opens.
      if (stage.key === "passA") {
        const cap = document.createElement("em");
        cap.className = "tp-brace";
        cap.textContent = "Two independent passes, run in order";
        li.querySelector(".tp-body").prepend(cap);
      }
      graph.appendChild(li);
      return li;
    });
  }

  function render(m) {
    const v = m.view;
    if (!rows.length) buildGraph(m);

    els.title.textContent = m.title;
    els.dek.innerHTML = v.isDone
      ? "Both passes were run, reconciled into one guide, verified, and published. " +
        "<b>Every perishable fact in it traces to a primary source.</b>"
      : "Two research passes run over this destination, one after the other and " +
        "independently of each other — one for what is <b>canonical and verifiable</b>, one " +
        "for what is <b>local and crowd-aware</b> — and are then reconciled into a single guide.";

    const doneCount = v.stages.filter((s) => s.done).length;

    v.stages.forEach((stage, i) => {
      const li = rows[i];
      const t = m.timing[i];
      const isNow = !stage.done && i === v.currentIndex && !!m.fixture.state;
      li.className = "tp-node-row" + (BRANCH.has(stage.key) ? " is-branch" : "") +
        (stage.done ? " is-done" : isNow ? " is-now" : " is-todo") +
        (isNow && v.isStuck ? " is-stalled" : "") +
        // A trunk segment is coloured only when BOTH nodes it joins have reported.
        // The accent therefore stops dead at the last cleared node — it never reaches
        // toward a stage that hasn't happened.
        (i >= 1 && i <= doneCount - 1 ? " seg-top-done" : "") +
        (i <= doneCount - 2 ? " seg-bot-done" : "");

      const d = li.querySelector(".tp-data");
      if (stage.done && t.at) {
        d.querySelector("b").textContent = t.tookMs != null ? formatElapsed(t.tookMs) : "cleared";
        d.querySelector("i").textContent = clockIn(m.tz, t.at);
      } else if (stage.done) {
        d.querySelector("b").textContent = "live";
        d.querySelector("i").textContent = "";
      } else if (isNow) {
        d.querySelector("b").textContent = t.runMs != null ? formatElapsed(t.runMs) : "";
        d.querySelector("i").textContent = v.isStuck ? "stalled" : "running";
      } else {
        d.querySelector("b").textContent = "—";
        d.querySelector("i").textContent = "";
      }
    });

    els.tally.innerHTML = "<b>" + doneCount + "</b> of " + v.stages.length + " stages cleared" +
      (m.fixture.state
        ? " · last checkpoint " + formatElapsed(Date.now() - new Date(m.fixture.state.updatedAt).getTime()) + " ago"
        : " · no checkpoint yet");

    els.stuck.hidden = !v.isStuck;
    if (v.isStuck) {
      els.stuck.innerHTML =
        "<b>The branch has been quiet for over twenty minutes.</b> That is a stall, not a " +
        "failure. A run that gets cut off resumes from the last cleared node above rather " +
        "than starting the graph again — which is why the pass that has already landed stays " +
        "landed. The confirmation comment on your issue holds a direct link for later.";
    }

    els.attempts.hidden = !(v.attempts > 1);
    if (v.attempts > 1) {
      els.attempts.innerHTML = "<b>Attempt " + v.attempts + ".</b> Earlier runs stopped early; " +
        "each resumed from the last cleared node rather than re-running the passes above it.";
    }

    els.done.hidden = !v.isDone;
    els.cta.href = m.guideHref;
    els.fix.hidden = !!m.fixture.state;

    const cur = v.stages[v.currentIndex];
    const spoken = v.isDone
      ? "All six stages cleared. Your guide is live."
      : doneCount + " of " + v.stages.length + " cleared. " +
        (v.isStuck ? "Stalled: nothing committed in over twenty minutes." : "Running: " + (cur ? cur.label : "") + ".");
    if (spoken !== lastSpoken) { els.live.textContent = spoken; lastSpoken = spoken; }

    tick(m);
  }

  function tick(m) {
    els.elapsed.textContent = formatElapsed(m.elapsedMs);
    const i = m.view.currentIndex;
    if (!m.view.isDone && rows[i]) {
      const t = m.timing[i];
      if (t && t.runMs != null) rows[i].querySelector(".tp-data b").textContent = formatElapsed(t.runMs);
    }
  }

  initPreview({ render, tick });

  if (!reduced) {
    wrap.classList.add("tp-pending");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.classList.add("tp-in");
      wrap.classList.remove("tp-pending");
    }));
  }

  document.getElementById("tpFixForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const typed = (document.getElementById("tpFixInput").value || "").trim().toLowerCase();
    if (!typed) return;
    const p = new URLSearchParams(location.search);
    p.set("slug", typed);
    location.search = p.toString();
  });

}
