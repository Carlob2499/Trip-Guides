/* Client module for the "departures" design-study option (PREVIEW ONLY).
   Lives here rather than inline in the .astro page for the same reason
   src/features/pipeline-progress/ui/progress.js does: a page's markup and its behaviour
   are different jobs, and the inline form is not type-checked the way a module is. */
import { initPreview, formatElapsed, clockIn } from "./harness.js";

export function initDepartures() {
  const rowsEl = document.getElementById("dpRows");
  const els = {
    title: document.getElementById("dpTitle"),
    elapsed: document.getElementById("dpElapsed"),
    local: document.getElementById("dpLocal"),
    localLbl: document.getElementById("dpLocalLbl"),
    localWrap: document.getElementById("dpLocalWrap"),
    tally: document.getElementById("dpTally"),
    updated: document.getElementById("dpUpdated"),
    attempts: document.getElementById("dpAttempts"),
    stuck: document.getElementById("dpStuck"),
    done: document.getElementById("dpDone"),
    cta: document.getElementById("dpCta"),
    fix: document.getElementById("dpFix"),
    live: document.getElementById("dpLive"),
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- the flap ---------------------------------------------------------
     Solari mechanics, honestly: one drum per character, turning FORWARD only
     through a fixed sequence, decelerating onto the target. The board cannot
     display a character it was not driven to, which is the property that makes
     this motion trustworthy rather than decorative.

     The one concession to docs/reference/motion.md's timing vocabulary (orchestrated
     arrivals <= ~1s): a real drum may spin through 30+ characters, which would
     run past 4 seconds. The travel is capped at 7 steps, so the mechanism reads
     without the page holding the reader for a full board cycle. */
  const SEQ = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const MAX_STEPS = 7;
  const STEP_MS = 92;
  const CASCADE_MS = 46;

  function makeCell() {
    const cell = document.createElement("span");
    cell.className = "dp-cell";
    const face = document.createElement("span");
    face.className = "dp-face";
    face.textContent = " ";
    cell.appendChild(face);
    cell._face = face;
    cell._char = " ";
    return cell;
  }

  function driveCell(cell, target, delay) {
    if (cell._char === target) return;
    if (reduced) {
      // Reduced motion gets the finished frame, not a faster animation.
      cell._char = target;
      cell._face.textContent = target;
      return;
    }
    const from = SEQ.indexOf(cell._char) < 0 ? 0 : SEQ.indexOf(cell._char);
    const to = SEQ.indexOf(target) < 0 ? 0 : SEQ.indexOf(target);
    let dist = (to - from + SEQ.length) % SEQ.length;
    if (dist === 0) dist = SEQ.length;
    const steps = Math.min(MAX_STEPS, dist);
    const first = (from + dist - steps + SEQ.length) % SEQ.length;
    cell._char = target;

    clearTimeout(cell._t);
    let i = 0;
    const run = () => {
      const ch = i === steps ? target : SEQ[(first + i) % SEQ.length];
      cell.classList.remove("is-flipping");
      void cell.offsetWidth; // restart the keyframe
      cell.classList.add("is-flipping");
      setTimeout(() => { cell._face.textContent = ch; }, 62);
      i++;
      if (i <= steps) cell._t = setTimeout(run, STEP_MS + i * 6); // decelerate onto target
      else cell._t = setTimeout(() => cell.classList.remove("is-flipping"), 140);
    };
    cell._t = setTimeout(run, delay);
  }

  function setStatus(holder, word, kind) {
    holder.className = "dp-status st-" + kind;
    holder.setAttribute("aria-label", word);
    const chars = word.padEnd(7, " ").slice(0, 7).split("");
    chars.forEach((ch, i) => driveCell(holder.children[i], ch, i * CASCADE_MS));
  }

  /* ---- rows ------------------------------------------------------------- */
  let rows = [];
  function buildRows(m) {
    rowsEl.innerHTML = "";
    rows = m.view.stages.map((stage, i) => {
      const li = document.createElement("li");
      li.className = "dp-row";
      li.innerHTML =
        '<span class="dp-num">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="dp-stage"><b></b><i></i></span>' +
        '<span class="dp-right"><span class="dp-status st-waiting" role="img"></span>' +
        '<span class="dp-time"></span></span>';
      const holder = li.querySelector(".dp-status");
      for (let c = 0; c < 7; c++) holder.appendChild(makeCell());
      // The stage's own label, split at the em-dash it already carries: name on the
      // first line, the pipeline's own description of the work on the second.
      const parts = stage.label.split(" — ");
      li.querySelector(".dp-stage b").textContent = parts[0];
      li.querySelector(".dp-stage i").textContent = parts.slice(1).join(" — ");
      rowsEl.appendChild(li);
      return li;
    });
  }

  let lastSpoken = "";

  function render(m) {
    const v = m.view;
    if (!rows.length) buildRows(m);

    els.title.textContent = m.title;
    els.localWrap.hidden = !m.tz;
    if (m.tz) {
      els.local.textContent = m.clock;
      els.localLbl.textContent = m.title;
    }
    // Every clock time on this board is the DESTINATION's, the way a real board shows
    // its own city's time — so the column says which city, taken from the IANA zone
    // itself rather than from a second table that could disagree with it.
    const city = m.tz ? m.tz.split("/").pop().replace(/_/g, " ") : "";
    document.getElementById("dpTimeCol").textContent = city ? "Time · " + city : "Time";

    v.stages.forEach((stage, i) => {
      const li = rows[i];
      const t = m.timing[i];
      const isNow = !stage.done && i === v.currentIndex && !!m.fixture.state;
      li.classList.toggle("is-done", stage.done);
      li.classList.toggle("is-now", isNow);

      const word = stage.done ? "CLEARED" : isNow ? (v.isStuck ? "STALLED" : "RUNNING") : "WAITING";
      const kind = stage.done ? "cleared" : isNow ? (v.isStuck ? "stalled" : "running") : "waiting";
      setStatus(li.querySelector(".dp-status"), word, kind);

      // Time column. A cleared stage shows the clock time it cleared and how long it
      // took; a running stage shows how long it has been running; a waiting stage shows
      // an em-dash, because it has no time yet and inventing one is the whole sin.
      const time = li.querySelector(".dp-time");
      if (stage.done && t.at) {
        time.classList.remove("is-blank");
        time.innerHTML = clockIn(m.tz, t.at) + "<i>" + (t.tookMs != null ? formatElapsed(t.tookMs) : "&nbsp;") + "</i>";
      } else if (stage.done) {
        // `published` is derived by probing the live page, never stamped by the pipeline.
        time.classList.remove("is-blank");
        time.innerHTML = "live<i>&nbsp;</i>";
      } else if (isNow) {
        time.classList.remove("is-blank");
        time.innerHTML = formatElapsed(t.runMs || 0) + "<i>running</i>";
      } else {
        time.classList.add("is-blank");
        time.innerHTML = "—<i>&nbsp;</i>";
      }
    });

    const doneCount = v.stages.filter((s) => s.done).length;
    els.tally.innerHTML = "<b>" + doneCount + "</b> of <b>" + v.stages.length + "</b> cleared";
    els.updated.textContent = m.fixture.state
      ? "last checkpoint " + formatElapsed(Date.now() - new Date(m.fixture.state.updatedAt).getTime()) + " ago"
      : "no checkpoint yet";

    els.stuck.hidden = !v.isStuck;
    if (v.isStuck) {
      els.stuck.innerHTML =
        "<b>Stalled, not failed.</b> Nothing has been committed for over twenty minutes. " +
        "Some destinations are genuinely harder to source, and a run that gets cut off " +
        "resumes from its last cleared stage rather than starting again. The confirmation " +
        "comment on your issue carries a direct link if you'd rather come back later.";
    }

    els.attempts.hidden = !(v.attempts > 1);
    if (v.attempts > 1) {
      els.attempts.innerHTML = "<b>Attempt " + v.attempts + ".</b> Earlier runs stopped early; " +
        "each one resumed from the last cleared stage above rather than starting over.";
    }

    els.done.hidden = !v.isDone;
    els.cta.href = m.guideHref;
    els.fix.hidden = !!m.fixture.state;

    const cur = v.stages[v.currentIndex];
    const spoken = v.isDone
      ? "All six stages cleared. Your guide is live."
      : doneCount + " of " + v.stages.length + " cleared. " +
        (v.isStuck ? "Stalled: no checkpoint in over twenty minutes." : "Running: " + (cur ? cur.label : "") + ".");
    if (spoken !== lastSpoken) { els.live.textContent = spoken; lastSpoken = spoken; }

    tick(m);
  }

  function tick(m) {
    els.elapsed.textContent = formatElapsed(m.elapsedMs);
    if (m.tz) els.local.textContent = m.clock;
    const i = m.view.currentIndex;
    if (!m.view.isDone && rows[i]) {
      const t = m.timing[i];
      const time = rows[i].querySelector(".dp-time");
      if (t && t.runMs != null && time) time.innerHTML = formatElapsed(t.runMs) + "<i>running</i>";
    }
  }

  initPreview({ render, tick });

  document.getElementById("dpFixForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const typed = (document.getElementById("dpFixInput").value || "").trim().toLowerCase();
    if (!typed) return;
    const p = new URLSearchParams(location.search);
    p.set("slug", typed);
    location.search = p.toString();
  });

}
