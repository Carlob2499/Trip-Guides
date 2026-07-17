/* Jet-lag calculator — DOM wiring + HTML rendering only. All the actual decisions
   (direction, days to adapt, the body-clock anchor, the melatonin threshold) live in
   ../lib/jetlag.ts, tested there. Timezone resolution lives in ../lib/tz-offset.ts.

   Single-purpose, single-mount module — this is the "small client behavior" CLAUDE.md
   says stays in src/scripts/ rather than earning its own feature silo. */

import { computeJetLag } from "../lib/jetlag";
import { tzOffsetHours } from "../lib/tz-offset";

export function initJetLag() {
  var jlBtn = document.getElementById("jlToggle");
  var jlPanel = document.getElementById("jlPanel");
  if (!jlBtn || !jlPanel) return;

  // Destination offset computed from its IANA zone (DST-aware), not a fixed number.
  var destOffset = tzOffsetHours(jlPanel.getAttribute("data-dest-tz"), new Date());
  if (destOffset == null) return;

  jlBtn.addEventListener("click", function () {
    var wasHidden = jlPanel.hasAttribute("hidden");
    if (wasHidden) {
      jlPanel.removeAttribute("hidden");
      jlBtn.setAttribute("aria-expanded", "true");
    } else {
      jlPanel.setAttribute("hidden", "");
      jlBtn.setAttribute("aria-expanded", "false");
    }
  });

  function render(advice) {
    var out = document.getElementById("jlOutput");
    if (!out) return;

    if (advice.negligible) {
      out.innerHTML = "<p class='jl-none'>Under 1 hour of difference — no meaningful jet lag expected.</p>";
      out.removeAttribute("hidden");
      return;
    }

    var harder = advice.direction === "east" ? " — eastward crossings are tougher" : " — westward tends to be easier";

    var html = "";
    html += "<p class='jl-result'>";
    html += "<strong>" + advice.hours + "-hour gap, flying " + advice.direction + harder + ".</strong> ";
    html += "Expect roughly <strong>" + advice.days + " day" + (advice.days === 1 ? "" : "s") + "</strong> to fully adapt.";
    html += "</p>";
    html += "<p style='font-size:.84rem;color:var(--muted);margin-bottom:.5rem;line-height:1.45'>";
    html += "At 11 pm local on your first night, your body will still feel like it's <strong>" + advice.bodyClockAt11pmLocal + "</strong> back home.";
    html += "</p>";
    html += "<ul class='jl-tips'>";
    html += "<li>Get <strong>morning sunlight on arrival day</strong> — the single most effective clock reset</li>";
    if (advice.direction === "east") {
      html += "<li>Stay awake until <strong>local 10–11 pm</strong> no matter how tired — sleeping too early makes it worse</li>";
      html += "<li>If you wake in the night, stay in dim light; avoid phones and bright screens until 7 am</li>";
    } else {
      html += "<li>Westward is easier — avoid napping more than 20 minutes on your first afternoon</li>";
      html += "<li>Get outside in the morning; resisting the urge to sleep in accelerates adjustment</li>";
    }
    html += "<li>Drink water on the flight; skip alcohol and heavy meals 4 hours before landing</li>";
    if (advice.showMelatoninTip) {
      html += "<li>Large gap: melatonin 0.5–1 mg at local bedtime can help on nights 1–3 — check with your doctor first</li>";
    }
    html += "</ul>";

    out.innerHTML = html;
    out.removeAttribute("hidden");
  }

  function recalc() {
    var sel = document.getElementById("jlOrigin");
    var out = document.getElementById("jlOutput");
    if (!sel || !out) return;
    if (!sel.value) { out.setAttribute("hidden", ""); return; }
    var origOffset = parseFloat(sel.value);
    if (isNaN(origOffset)) { out.setAttribute("hidden", ""); return; }
    render(computeJetLag(destOffset, origOffset));
  }

  var originSel = document.getElementById("jlOrigin");
  if (originSel) originSel.addEventListener("change", recalc);
}
