/* Waypoint New-Guide wizard — making a guide painfully easy.
   Three numbered steps (the site's bearing language), GSAP slide transitions,
   research-topic customization, and document upload with auto-parsing:
   drop a booking confirmation (.txt/.eml/.ics/.md) and the wizard prefills
   dates and attaches a parsed trip summary for the researcher.
   Output is the same prefilled GitHub issue the pipeline already consumes —
   every downstream step (scaffold, the research self-correction pass, graduation)
   is untouched, so new guides inherit the whole feature set automatically. */

import { reducedMotion } from "../../../scripts/util.js";

(function () {
  var form = document.getElementById("ngForm");
  var modal = document.getElementById("ngModal");
  if (!form || !modal) return;

  /* ── Carve the existing form into steps ─────────────────────────────────
     Step 1 Where & when · Step 2 Who & style · Step 3 What to research.
     The fields already exist; the wizard re-parents them (no data change).

     .ng-row (the date pair) wraps two .ng-field labels — querying both classes
     together double-matched the nested labels and silently overwrote the row's
     mapping with just the start-date label, orphaning "End date" outside the
     step it belonged to (previously masked because nothing sat between Start
     and End; adding Anchor event between them made the misplacement visible).
     Map rows first, then only .ng-field elements that AREN'T already part of
     a mapped row. */
  var fields = {};
  Array.prototype.forEach.call(form.querySelectorAll(".ng-row"), function (row) {
    var input = row.querySelector("input,select,textarea");
    if (input) fields[input.id] = row; // key the whole row by its first input (start date)
  });
  Array.prototype.forEach.call(form.querySelectorAll(".ng-field"), function (el) {
    if (el.closest(".ng-row")) return; // already captured via its row above
    var input = el.querySelector("input,select,textarea");
    if (input) fields[input.id] = el;
  });

  var steps = [
    { title: "Where & when", ids: ["ngCountry", "ngCities", "ngStart", "ngAnchor"] },
    { title: "Who & style", ids: ["ngTravelers", "ngParty", "ngPace", "ngTravelStyle", "ngBudget"] },
    { title: "What to research", ids: ["ngPriority1", "ngPriority2", "ngPriority3", "ngNiche", "ngComments"] },
  ];

  var stepEls = steps.map(function (s, i) {
    var el = document.createElement("div");
    el.className = "ngw-step";
    el.dataset.step = i;
    var head = document.createElement("p");
    head.className = "ngw-head";
    head.innerHTML = "<span class='ngw-num'>" + String(i + 1).padStart(2, "0") + "</span>" + s.title;
    el.appendChild(head);
    s.ids.forEach(function (id) {
      var f = fields[id];
      if (f && !el.contains(f)) el.appendChild(f);
    });
    return el;
  });

  /* Research-topic chips (step 3) — the "customize what to research" ask.
     Selected topics travel in the issue's comments field, which the intake
     already carries into the generation brief. */
  var TOPICS = ["Food & dining", "Nightlife", "Museums & culture", "Nature & outdoors",
    "Shopping", "Gaming & anime", "Events & festivals", "Day trips", "Photo spots", "Wellness"];
  var chipsWrap = document.createElement("div");
  chipsWrap.className = "ngw-chips";
  chipsWrap.setAttribute("role", "group");
  chipsWrap.setAttribute("aria-label", "Research topics");
  var chipHead = document.createElement("p");
  chipHead.className = "ngw-chips-label";
  chipHead.textContent = "Research these for me:";
  var picked = new Set();
  TOPICS.forEach(function (t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ngw-chip";
    b.textContent = t;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () {
      var on = !picked.has(t);
      if (on) picked.add(t); else picked.delete(t);
      b.classList.toggle("ngw-chip-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    chipsWrap.appendChild(b);
  });
  stepEls[2].insertBefore(chipsWrap, stepEls[2].children[1] || null);
  stepEls[2].insertBefore(chipHead, chipsWrap);

  /* Document upload + auto-parse (step 1): dates prefill, summary attaches. */
  var docWrap = document.createElement("div");
  docWrap.className = "ngw-doc";
  docWrap.innerHTML =
    '<label class="ngw-doc-btn">📄 Have bookings? Drop a confirmation (.txt / .eml / .ics / .md)' +
    '<input type="file" id="ngDoc" accept=".txt,.eml,.ics,.md,.csv" hidden multiple /></label>' +
    '<p class="ngw-doc-out" id="ngDocOut" hidden></p>';
  stepEls[0].appendChild(docWrap);
  var parsedNotes = [];
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "ngDoc") {
      Array.prototype.forEach.call(e.target.files || [], function (file) {
        var reader = new FileReader();
        reader.onload = function () { parseDoc(String(reader.result || ""), file.name); };
        reader.readAsText(file);
      });
    }
  });
  function parseDoc(text, name) {
    var out = document.getElementById("ngDocOut");
    var found = [];
    // ISO + iCal dates → prefill start/end with min/max.
    var iso = (text.match(/\b(20\d{2})-?(0[1-9]|1[0-2])-?(0[1-9]|[12]\d|3[01])\b/g) || [])
      .map(function (s) { return s.replace(/(\d{4})-?(\d{2})-?(\d{2})/, "$1-$2-$3"); })
      .filter(function (s, i, a) { return a.indexOf(s) === i; }).sort();
    if (iso.length) {
      var sEl = document.getElementById("ngStart"), eEl = document.getElementById("ngEnd");
      if (sEl && !sEl.value) sEl.value = iso[0];
      if (eEl && !eEl.value) eEl.value = iso[iso.length - 1];
      found.push(iso.length + " date" + (iso.length > 1 ? "s" : "") + " (" + iso[0] + " → " + iso[iso.length - 1] + ")");
    }
    // Flight numbers + likely confirmation codes — attached, never guessed at.
    var flights = (text.match(/\b[A-Z]{2}\s?\d{2,4}\b/g) || []).slice(0, 6);
    if (flights.length) found.push("flights: " + flights.join(", "));
    var hotels = (text.split(/\r?\n/).filter(function (l) {
      return /hotel|hostel|airbnb|check-?in|reservation/i.test(l) && l.trim().length < 120;
    }).slice(0, 4));
    if (hotels.length) found.push("lodging lines: " + hotels.length);
    parsedNotes.push("From " + name + ": " + (found.join(" · ") || "no structured data found") +
      (hotels.length ? "\n  " + hotels.map(function (l) { return l.trim(); }).join("\n  ") : ""));
    if (out) {
      out.hidden = false;
      out.textContent = "✓ Parsed " + name + (found.length ? " — " + found.join(" · ") : " — nothing recognized (it still attaches as notes)");
    }
  }

  /* Fold parsed docs + topic picks into the comments field on submit (the
     existing submit handler reads #ngComments — no pipeline change). */
  form.addEventListener("submit", function () {
    var c = document.getElementById("ngComments");
    if (!c) return;
    var extra = [];
    if (picked.size) extra.push("Research focus: " + Array.from(picked).join(", "));
    if (parsedNotes.length) extra.push("Parsed from uploaded documents:\n" + parsedNotes.join("\n"));
    if (extra.length) c.value = (c.value ? c.value + "\n\n" : "") + extra.join("\n\n");
  }, true); // capture — runs before the existing submit handler builds the URL

  /* ── Assemble + navigate ────────────────────────────────────────────── */
  var deck = document.createElement("div");
  deck.className = "ngw-deck";
  stepEls.forEach(function (el) { deck.appendChild(el); });
  var nav = document.createElement("div");
  nav.className = "ngw-nav";
  nav.innerHTML =
    '<button type="button" class="ngw-back" hidden>← Back</button>' +
    '<span class="ngw-dots">' + steps.map(function (_, i) {
      return "<span class='ngw-dot" + (i === 0 ? " ngw-dot-on" : "") + "'></span>";
    }).join("") + "</span>" +
    '<button type="button" class="ngw-next">Next →</button>';
  var submitBtn = form.querySelector(".ng-submit");
  var errEl = document.getElementById("ngErr");
  form.insertBefore(deck, form.firstChild);
  form.insertBefore(nav, submitBtn);
  if (errEl) form.insertBefore(errEl, nav);

  var cur = 0, animating = false;
  var backBtn = nav.querySelector(".ngw-back");
  var nextBtn = nav.querySelector(".ngw-next");
  var dots = nav.querySelectorAll(".ngw-dot");
  function sync() {
    stepEls.forEach(function (el, i) { el.classList.toggle("ngw-on", i === cur); });
    backBtn.hidden = cur === 0;
    nextBtn.hidden = cur === steps.length - 1;
    if (submitBtn) submitBtn.hidden = cur !== steps.length - 1;
    dots.forEach(function (d, i) { d.classList.toggle("ngw-dot-on", i <= cur); });
  }
  function go(dir) {
    if (animating) return;
    var next = cur + dir;
    if (next < 0 || next >= steps.length) return;
    if (dir > 0 && cur === 0) {
      var c = document.getElementById("ngCountry");
      if (c && !c.value.trim()) {
        if (errEl) { errEl.textContent = "Country is required."; errEl.removeAttribute("hidden"); }
        c.focus();
        return;
      }
      if (errEl) errEl.setAttribute("hidden", "");
    }
    var fromEl = stepEls[cur], toEl = stepEls[next];
    cur = next;
    var reduced = reducedMotion();
    if (reduced) { sync(); return; }
    animating = true;
    import("gsap").then(function (m) {
      var gsap = m.gsap || m.default;
      gsap.to(fromEl, { x: dir > 0 ? -46 : 46, autoAlpha: 0, duration: 0.22, ease: "power2.in", onComplete: function () {
        sync();
        gsap.set(fromEl, { clearProps: "all" });
        gsap.fromTo(toEl, { x: dir > 0 ? 46 : -46, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.32, ease: "power3.out", onComplete: function () {
            animating = false;
            gsap.set(toEl, { clearProps: "all" });
          } });
      } });
    }).catch(function () { animating = false; sync(); });
  }
  backBtn.addEventListener("click", function () { go(-1); });
  nextBtn.addEventListener("click", function () { go(1); });
  sync();
})();
