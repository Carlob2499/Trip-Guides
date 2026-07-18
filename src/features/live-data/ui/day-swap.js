/* Weather day-swap advisory — DOM half (decisions in ../model/day-swap.ts).
   When the forecast shows rain on an explicitly-tagged `env:"outdoor"` day and a dry
   `env:"indoor"` day sits in the same window, append ONE advisory line under the
   weather strip. Advisory only — it never reorders anything; the traveler decides.
   Silent whenever data is missing (no env tags, past trip, no forecast): a guide that
   says nothing is honest, one that guesses is not. */

import { daySwapAdvice } from "../model/day-swap";
import { getLastWx } from "./weather.js";

function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

export function initDaySwap(cfg) {
  var days = (cfg && cfg.daysForBanner) || [];
  if (!days.some(function (d) { return d.env === "outdoor" || d.env === "indoor"; })) return; // untagged guide — stay silent

  function show(daily) {
    var advice = daySwapAdvice(days, daily);
    if (!advice) return;
    var wxWrap = document.getElementById("wxWrap");
    if (!wxWrap || wxWrap.querySelector(".wx-swap")) return; // no mount, or already shown
    var p = document.createElement("p");
    p.className = "wx-swap";
    p.setAttribute("role", "note");
    p.innerHTML = "☂ Rain likely <b>" + esc(advice.rain.date) + "</b> — “" + esc(advice.rain.title) +
      "” is an outdoor day. “" + esc(advice.dry.title) + "” (" + esc(advice.dry.date) +
      ") looks dry and indoor-friendly — consider swapping.";
    wxWrap.appendChild(p);
  }

  var wx = getLastWx();
  if (wx) show(wx);
  else document.addEventListener("tg:wx", function (e) {
    if (e.detail && e.detail.daily) show(e.detail.daily);
  });
}
