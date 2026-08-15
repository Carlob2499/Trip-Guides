/* Waypoint /new — the composed intake flow (R4, 2026-08-05):
     A · Drop Zone      — bookings first; the parser prefills what it can
     B · Ranked Board   — tap what the trip is FOR into rank order (replaces 3×7 dropdowns
                          + duplicate topic chips — the critique's densest-moment flag)
     C · Interview tail — one question per screen, ONLY for what's still blank
     D · The Manifest   — the trip describing itself; every blank reopens its real field
   Progressive enhancement over the flat form (the no-JS base markup): fields are
   re-parented, never duplicated — the flat form stays the single source of truth and
   intake-submit.js reads the SAME ids it always has. Pure logic: model/intake.ts,
   model/wizard.ts (parser). Motion: lazy GSAP, reduced-motion honored. */

import { reducedMotion } from "../../../scripts/util.js";
import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { parseBookingDocument, formatParsedNote } from "../model/wizard";
import { RANK_CARDS, TOPIC_CHIPS, rankToFields, nextTailSteps, manifestSegments } from "../model/intake";
import { initIntakeSubmit } from "./intake-submit.js";

export function initIntakeFlow() {
  var form = document.getElementById("ngForm");
  var errEl = document.getElementById("ngErr");
  if (!form) return;
  initIntakeSubmit(form, errEl);

  /* ── Map the flat form's fields (same re-parenting contract as the old wizard) ── */
  var fields = {};
  Array.prototype.forEach.call(form.querySelectorAll(".ng-row"), function (row) {
    var input = row.querySelector("input,select,textarea");
    if (input) fields[input.id] = row;
  });
  Array.prototype.forEach.call(form.querySelectorAll(".ng-field"), function (el) {
    if (el.closest(".ng-row")) return;
    var input = el.querySelector("input,select,textarea");
    if (input) fields[input.id] = el;
  });
  var submitBtn = form.querySelector(".ng-submit");

  /* Hidden holder INSIDE the form — unmounted fields keep their form association and
     their values; getElementById reads them wherever they sit. */
  var holder = document.createElement("div");
  holder.className = "itk-holder";
  holder.hidden = true;
  Object.keys(fields).forEach(function (id) { holder.appendChild(fields[id]); });
  form.insertBefore(holder, form.firstChild);
  if (submitBtn) submitBtn.hidden = true;

  var stage = document.createElement("div");
  stage.className = "itk-stage";
  form.insertBefore(stage, holder);

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function values() {
    var out = {};
    Object.keys(fields).forEach(function (id) { out[id] = val(id); });
    ["ngStart", "ngEnd"].forEach(function (id) { out[id] = val(id); });
    return out;
  }

  /* ── Screen plumbing ─────────────────────────────────────────────────────────── */
  var screens = [];   // built lazily; each is {el, onEnter?}
  var cur = -1, animating = false;
  function show(idx, dir) {
    if (animating || idx === cur) return;
    var from = cur >= 0 ? screens[cur].el : null, to = screens[idx].el;
    cur = idx;
    if (screens[idx].onEnter) screens[idx].onEnter();
    if (!from || reducedMotion()) {
      if (from) from.hidden = true;
      to.hidden = false;
      focusHead(to);
      return;
    }
    animating = true;
    /* Idempotent settle + safety timer: GSAP's ticker rides requestAnimationFrame, and a
       tab that isn't compositing (backgrounded mid-tap, iOS low-power) never fires it —
       the tween freezes mid-flight and `animating` would deadlock the whole flow. If the
       animation hasn't completed in 900ms, land the transition without it. */
    var settled = false;
    function settle(gsap) {
      if (settled) return;
      settled = true;
      from.hidden = true;
      to.hidden = false;
      if (gsap) { gsap.set(from, { clearProps: "all" }); gsap.set(to, { clearProps: "all" }); }
      else { from.removeAttribute("style"); to.removeAttribute("style"); }
      animating = false;
      focusHead(to);
    }
    var safety = setTimeout(function () { settle(null); }, 900);
    import("gsap").then(function (mod) {
      var gsap = mod.gsap || mod.default;
      gsap.to(from, { x: dir < 0 ? 46 : -46, autoAlpha: 0, duration: 0.2, ease: "power2.in", onComplete: function () {
        if (settled) return;
        from.hidden = true; gsap.set(from, { clearProps: "all" });
        to.hidden = false;
        gsap.fromTo(to, { x: dir < 0 ? -46 : 46, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: "power3.out", onComplete: function () {
          clearTimeout(safety); settle(gsap);
        } });
      } });
    }).catch(function () { clearTimeout(safety); settle(null); });
  }
  function focusHead(el) {
    var head = el.querySelector(".itk-ask");
    if (head) { head.setAttribute("tabindex", "-1"); head.focus({ preventScroll: false }); }
  }
  function screen(cls) {
    var el = document.createElement("div");
    el.className = "itk-screen " + cls;
    el.hidden = true;
    stage.appendChild(el);
    return el;
  }
  function nav(el, opts) {
    var bar = document.createElement("div");
    bar.className = "itk-nav";
    if (opts.back !== false) {
      var back = document.createElement("button");
      back.type = "button"; back.className = "itk-back"; back.textContent = "← Back";
      back.addEventListener("click", function () { show(Math.max(0, cur - 1), -1); });
      bar.appendChild(back);
    }
    var next = document.createElement("button");
    next.type = "button"; next.className = "itk-next" + (opts.accent ? " itk-next-acc" : "");
    next.textContent = opts.label || "Next →";
    next.addEventListener("click", opts.go);
    bar.appendChild(next);
    el.appendChild(bar);
    return next;
  }
  function ask(el, big, sub) {
    var head = document.createElement("p"); head.className = "itk-ask"; head.textContent = big; el.appendChild(head);
    if (sub) { var subEl = document.createElement("p"); subEl.className = "itk-sub"; subEl.textContent = sub; el.appendChild(subEl); }
  }
  /* A <select> rendered as the flow's one control idiom: a row of pills bound to the real
     select, which stays in the holder (a raw dropdown appears only in the no-JS flat form).
     Board and tail share this — the certainty rows are the same mechanism pace/style/budget
     have always used, so a pill row is built fresh on every rebuild and reads its checked
     state back off the select. */
  function pillRow(parent, id, head) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var headEl = document.createElement("p");
    headEl.className = "itk-minihead"; headEl.textContent = head;
    parent.appendChild(headEl);
    var row = document.createElement("div");
    row.className = "itk-topics";
    row.setAttribute("role", "radiogroup");
    row.setAttribute("aria-label", head);
    Array.prototype.forEach.call(sel.options, function (opt) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "itk-chip";
      btn.textContent = opt.value === "" ? "no preference" : opt.text;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(sel.value === opt.value));
      if (sel.value === opt.value) btn.classList.add("itk-chip-on");
      btn.addEventListener("click", function () {
        sel.value = opt.value;
        Array.prototype.forEach.call(row.children, function (chip) {
          chip.classList.remove("itk-chip-on"); chip.setAttribute("aria-checked", "false");
        });
        btn.classList.add("itk-chip-on"); btn.setAttribute("aria-checked", "true");
      });
      row.appendChild(btn);
    });
    parent.appendChild(row);
  }
  /* Ids the tail renders as a pill row instead of appending their .ng-field — the certainty
     selects, which ride beside the field they qualify (model/intake.ts's TAIL_STEPS note).
     ngBudgetCertainty is here for its heading only; budget lives on the board, so its row is
     built there. */
  var PILL_HEADS = {
    ngDatesCertainty: "How firm are these dates?",
    ngAnchorCertainty: "How firm is the anchor?",
    ngBudgetCertainty: "How firm is that budget?",
  };

  /* ── A · Drop Zone ───────────────────────────────────────────────────────────── */
  var parsedNotes = [];
  var sA = screen("itk-a");
  ask(sA, "Throw me your bookings.", "Flight confirmation, hotel email, calendar invite — dates, country and party prefill themselves. Nothing is uploaded; it's read right here.");
  var dz = document.createElement("label");
  dz.className = "itk-dz";
  dz.innerHTML = '<span class="itk-dz-big">Drop files or tap to browse</span>' +
    '<span class="itk-dz-sub">.pdf · .txt · .eml · .ics · .md</span>' +
    '<input type="file" id="ngDoc" accept=".pdf,.txt,.eml,.ics,.md,.csv" hidden multiple />';
  sA.appendChild(dz);
  var dzOut = document.createElement("ul");
  dzOut.className = "itk-found"; dzOut.hidden = true;
  sA.appendChild(dzOut);
  ["dragover", "dragleave", "drop"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) {
      e.preventDefault();
      dz.classList.toggle("itk-dz-hot", ev === "dragover");
      if (ev === "drop" && e.dataTransfer) readFiles(e.dataTransfer.files);
    });
  });
  dz.addEventListener("change", function (e) { if (e.target.id === "ngDoc") readFiles(e.target.files); });
  function readFiles(list) {
    Array.prototype.forEach.call(list || [], function (file) {
      var isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      var reader = new FileReader();
      if (isPdf) {
        reader.onload = function () {
          import("../model/pdf-text")
            .then(function (mod) { return mod.extractPdfText(reader.result); })
            .then(function (text) { parseDoc(text, file.name); })
            .catch(function () { parseDoc("", file.name); });
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = function () { parseDoc(String(reader.result || ""), file.name); };
        reader.readAsText(file);
      }
    });
  }
  function setIfEmpty(id, value) {
    var el = document.getElementById(id);
    if (el && !el.value && value) el.value = value;
  }
  function parseDoc(text, name) {
    var doc = parseBookingDocument(text);
    if (doc.isoDates.length) {
      setIfEmpty("ngStart", doc.isoDates[0]);
      setIfEmpty("ngEnd", doc.isoDates[doc.isoDates.length - 1]);
    }
    if (doc.countries.length === 1) setIfEmpty("ngCountry", doc.countries[0]);
    parsedNotes.push(formatParsedNote(name, doc));
    var li = document.createElement("li");
    li.textContent = name + " — " + doc.summary;
    dzOut.appendChild(li);
    dzOut.hidden = false;
  }
  nav(sA, { back: false, label: "Continue →", accent: true, go: function () { show(1, 1); } });
  var skipA = sA.querySelector(".itk-next");
  skipA.setAttribute("aria-label", "Continue — with or without documents");

  /* ── B · Ranked Board ────────────────────────────────────────────────────────── */
  var sB = screen("itk-b");
  ask(sB, "What is this trip for?", "Tap your top three, in order. Everything unranked is simply researched lighter.");
  var slotRow = document.createElement("div");
  slotRow.className = "itk-slots";
  slotRow.innerHTML = [0, 1, 2].map(function (i) {
    return '<div class="itk-slot" data-slot="' + i + '"><span>Priority #' + (i + 1) + "</span></div>";
  }).join("");
  sB.appendChild(slotRow);
  var board = document.createElement("div");
  board.className = "itk-board";
  board.setAttribute("role", "group");
  board.setAttribute("aria-label", "Trip priorities — tap up to three in rank order");
  sB.appendChild(board);
  var ranked = [];
  function drawBoard() {
    board.innerHTML = "";
    RANK_CARDS.forEach(function (card) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "itk-card";
      var idx = ranked.indexOf(card.value);
      if (idx > -1) { btn.classList.add("itk-card-on"); btn.textContent = "#" + (idx + 1) + " · " + card.label; }
      else btn.textContent = card.label;
      btn.setAttribute("aria-pressed", String(idx > -1));
      btn.addEventListener("click", function () {
        var pos = ranked.indexOf(card.value);
        if (pos > -1) ranked.splice(pos, 1);
        else if (ranked.length < 3) ranked.push(card.value);
        var priorities = rankToFields(ranked);
        document.getElementById("ngPriority1").value = priorities.priority1;
        document.getElementById("ngPriority2").value = priorities.priority2;
        document.getElementById("ngPriority3").value = priorities.priority3;
        drawBoard();
      });
      board.appendChild(btn);
    });
    Array.prototype.forEach.call(slotRow.children, function (slot, i) {
      if (ranked[i]) {
        var card = RANK_CARDS.filter(function (entry) { return entry.value === ranked[i]; })[0];
        slot.className = "itk-slot itk-slot-on";
        slot.innerHTML = "<em>#" + (i + 1) + "</em>" + (card ? card.label : ranked[i]);
      } else {
        slot.className = "itk-slot";
        slot.innerHTML = "<span>Priority #" + (i + 1) + "</span>";
      }
    });
  }
  drawBoard();
  var topicsHead = document.createElement("p");
  topicsHead.className = "itk-minihead"; topicsHead.textContent = "Also research:";
  sB.appendChild(topicsHead);
  var topicsWrap = document.createElement("div");
  topicsWrap.className = "itk-topics";
  topicsWrap.setAttribute("role", "group");
  topicsWrap.setAttribute("aria-label", "Extra research topics");
  var picked = new Set();
  TOPIC_CHIPS.forEach(function (topic) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "itk-chip"; btn.textContent = topic;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      var on = !picked.has(topic);
      if (on) picked.add(topic); else picked.delete(topic);
      btn.classList.toggle("itk-chip-on", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    topicsWrap.appendChild(btn);
  });
  sB.appendChild(topicsWrap);
  // Pace / style / budget as pill rows bound to the real selects — budget's certainty right
  // after budget, the field it qualifies.
  [
    ["ngPace", "How do we move?"],
    ["ngTravelStyle", "Leaning where?"],
    ["ngBudget", "On what footing?"],
    ["ngBudgetCertainty", PILL_HEADS.ngBudgetCertainty],
  ].forEach(function (pair) { pillRow(sB, pair[0], pair[1]); });
  nav(sB, { go: function () { goReview(); } });

  /* ── C · Interview tail (built at entry — asks only what's still blank) ─────── */
  var tailBuilt = [];
  function buildTailScreens() {
    // Tear down previous tail screens (a Back → re-Next rebuild keeps them fresh).
    tailBuilt.forEach(function (scr) {
      Array.prototype.forEach.call(scr.el.querySelectorAll(".ng-field, .ng-row"), function (field) { holder.appendChild(field); });
      stage.removeChild(scr.el);
      screens.splice(screens.indexOf(scr), 1);
    });
    tailBuilt = [];
    var steps = nextTailSteps(values(), ranked);
    steps.forEach(function (st, i) {
      var el = screen("itk-c");
      ask(el, st.ask, st.sub);
      st.ids.forEach(function (id) {
        // A certainty select renders as pills beside the field it qualifies; its .ng-field
        // stays in the holder, exactly as the board's pace/style/budget selects do.
        if (PILL_HEADS[id]) { pillRow(el, id, PILL_HEADS[id]); return; }
        // ngEnd lives inside ngStart's .ng-row (fields are keyed by a row's FIRST input),
        // so fields["ngEnd"] is rightly undefined — the row arrives via ngStart.
        var field = fields[id];
        if (field && !el.contains(field)) el.appendChild(field);
      });
      var isLast = i === steps.length - 1;
      var required = st.ids.indexOf("ngCountry") > -1;
      var scr = { el: el };
      screens.push(scr); tailBuilt.push(scr);
      nav(el, {
        label: isLast ? "Review →" : "Next →",
        go: function () {
          if (required && !val("ngCountry")) {
            if (errEl) {
              errEl.textContent = "Country is required.";
              errEl.removeAttribute("hidden");
              el.appendChild(errEl);
            }
            var countryEl = document.getElementById("ngCountry");
            if (countryEl) countryEl.focus();
            return;
          }
          if (errEl) errEl.setAttribute("hidden", "");
          show(cur + 1, 1);
        },
      });
    });
    // NOTE: no show() here — goReview() reorders the manifest to the end FIRST, then
    // advances. Showing from here would land on the not-yet-moved manifest.
  }

  /* ── D · The Manifest ────────────────────────────────────────────────────────── */
  var sD = screen("itk-d");
  ask(sD, "This is your trip.", "Tap any underlined part to change it — then send it to research.");
  var mani = document.createElement("p");
  mani.className = "itk-mani";
  sD.appendChild(mani);
  var drawer = document.createElement("div");
  drawer.className = "itk-drawer"; drawer.hidden = true;
  sD.appendChild(drawer);
  function labelFor(id, raw) {
    if (id === "ngStart") {
      var dates = [val("ngStart"), val("ngEnd")].filter(Boolean).join(" → ");
      return dates || raw;
    }
    return val(id) || raw;
  }
  function drawManifest() {
    mani.innerHTML = "";
    manifestSegments(values()).forEach(function (seg) {
      if (seg.field === undefined) {
        mani.appendChild(document.createTextNode(seg.text));
        return;
      }
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "itk-blank";
      var shown = labelFor(seg.field, seg.ghost || "");
      btn.textContent = shown;
      if (!val(seg.field) && !(seg.field === "ngStart" && (val("ngStart") || val("ngEnd")))) btn.classList.add("itk-blank-ghost");
      btn.addEventListener("click", function () { openDrawer(seg.field); });
      mani.appendChild(btn);
    });
  }
  function openDrawer(id) {
    Array.prototype.forEach.call(drawer.querySelectorAll(".ng-field, .ng-row"), function (field) { holder.appendChild(field); });
    var field = fields[id];
    if (!field) return;
    drawer.appendChild(field);
    drawer.hidden = false;
    var input = field.querySelector("input,select,textarea");
    if (input) { input.focus(); }
  }
  drawer.addEventListener("input", drawManifest);
  drawer.addEventListener("change", drawManifest);
  var send = document.createElement("button");
  send.type = "button"; send.className = "itk-send";
  send.textContent = "Send it to research →";
  send.addEventListener("click", function () {
    if (!val("ngCountry")) {
      if (errEl) { errEl.textContent = "Country is required."; errEl.removeAttribute("hidden"); sD.appendChild(errEl); }
      openDrawer("ngCountry");
      return;
    }
    if (typeof form.requestSubmit === "function") form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { cancelable: true }));
  });
  var sendNote = document.createElement("p");
  sendNote.className = "itk-sub itk-send-note";
  // Two paths, two honest sentences (batch 3). With the backend configured the traveler never
  // touches GitHub, so naming it here was describing plumbing they'd never see; unconfigured,
  // the next tap really does open a GitHub issue and hiding that would be the dishonest half.
  sendNote.textContent = WAYPOINT_BACKEND.url
    ? "Sending starts the research and takes you to the live progress page."
    : "Sending opens a prefilled request for you to submit, then takes you to the live progress page.";
  var backBar = document.createElement("div");
  backBar.className = "itk-nav";
  var backD = document.createElement("button");
  backD.type = "button"; backD.className = "itk-back"; backD.textContent = "← Back";
  backD.addEventListener("click", function () { show(cur - 1, -1); });
  backBar.appendChild(backD);
  backBar.appendChild(send);
  sD.appendChild(backBar);
  sD.appendChild(sendNote);

  /* Fold parsed docs + extra topics into comments on submit (capture: runs before
     intake-submit builds the payload) — byte-identical mechanism to the old wizard. */
  form.addEventListener("submit", function () {
    var comments = document.getElementById("ngComments");
    if (!comments) return;
    var extra = [];
    if (picked.size) extra.push("Research focus: " + Array.from(picked).join(", "));
    if (parsedNotes.length) extra.push("Parsed from uploaded documents:\n" + parsedNotes.join("\n"));
    if (extra.length) comments.value = (comments.value ? comments.value + "\n\n" : "") + extra.join("\n\n");
  }, true);

  /* ── Assemble ────────────────────────────────────────────────────────────────── */
  screens.push({ el: sA });                 // 0
  screens.push({ el: sB });                 // 1
  screens.push({ el: sD, onEnter: drawManifest }); // 2 — tail screens splice in before this at buildTail()
  // Keep the manifest LAST whatever the tail did: buildTail() pushes tail screens to the
  // end, so re-order — tail slots sit between board and manifest.
  function goReview() {
    buildTailScreens();
    // Keep the manifest LAST whatever the tail did — tail screens sit between board and it.
    var maniScreen = null;
    for (var i = 0; i < screens.length; i++) if (screens[i].el === sD) maniScreen = screens.splice(i, 1)[0];
    if (maniScreen) screens.push(maniScreen);
    show(cur + 1, 1); // first tail screen, or the manifest when nothing is blank
  }
  show(0, 1);
}
