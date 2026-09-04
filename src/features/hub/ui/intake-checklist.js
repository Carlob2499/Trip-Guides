/* Waypoint /new — the PREFLIGHT CHECKLIST (2026-08-15; docs/archive/INDEX.md →
   PLAN_PIPELINE_SURFACES, commit B).

   Six collapsible sections over the intake schema, a completeness meter that reports what is
   actually answered, head-to-head matchups where three priority dropdowns used to be, and a
   pre-dispatch fork gate that asks only the clarifying questions THE ANSWERS raise.

   Progressive enhancement, same contract the composed flow had: new.astro renders every real
   control inside its section, and this file adds chrome on top of them. Nothing is duplicated
   and nothing is re-parented, so intake-submit.js reads the same ids it always has. Pure
   logic: model/checklist.ts (grouping, status, meter, tally, forks) and model/wizard.ts (the
   booking parser). Motion: none — sections cut open, and the only transition on the page is
   the meter's scaleX, which reduced motion cancels. */

import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { parseBookingDocument, formatParsedNote } from "../model/wizard";
import { TOPIC_CHIPS, rankToFields } from "../model/intake";
import {
  SECTIONS, STAMP_LABEL, allStates, meterFill, clearedLabel, blanksLine, nextSection,
  MATCH_CATEGORIES, MATCHUPS, rankFromPicks, deriveForks, forksCleared,
} from "../model/checklist";
import { guessSlug, initIntakeSubmit } from "./intake-submit.js";

/* Session, not local: an intake is one sitting. A reload, a back-navigation or a tab
   restore keeps everything; next week's traveler starts clean rather than inheriting
   someone else's half-answered trip. */
var STORE = "wp-intake-v1";

export function initIntakeChecklist() {
  var form = document.getElementById("ngForm");
  var errEl = document.getElementById("ngErr");
  if (!form) return;
  initIntakeSubmit(form, errEl);

  var saved = load();
  var skipped = saved.skipped;
  var picks = saved.picks;
  var forkPicks = saved.forkPicks;
  var openId = saved.open;
  var parsedNotes = [];
  var topics = new Set(saved.topics);

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function byId(id) { return document.getElementById(id); }
  function val(id) { var node = byId(id); return node ? node.value.trim() : ""; }
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }

  function readVals() {
    var out = {};
    SECTIONS.forEach(function (sec) {
      sec.fields.forEach(function (f) {
        f.dom.forEach(function (id) { out[id] = val(id); });
      });
    });
    return out;
  }

  function load() {
    var blank = { skipped: [], picks: [], forkPicks: {}, open: null, vals: {}, topics: [] };
    try {
      var raw = sessionStorage.getItem(STORE);
      if (!raw) return blank;
      var s = JSON.parse(raw) || {};
      return {
        skipped: Array.isArray(s.skipped) ? s.skipped : [],
        picks: Array.isArray(s.picks) ? s.picks : [],
        forkPicks: s.forkPicks && typeof s.forkPicks === "object" ? s.forkPicks : {},
        open: typeof s.open === "string" ? s.open : null,
        vals: s.vals && typeof s.vals === "object" ? s.vals : {},
        topics: Array.isArray(s.topics) ? s.topics : [],
      };
    } catch (e) { return blank; } // private mode / disabled storage: the page still works
  }
  function save() {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({
        vals: readVals(), skipped: skipped, open: openId, picks: picks, forkPicks: forkPicks,
        topics: Array.from(topics),
      }));
    } catch (e) { /* storage full or blocked — never worth losing the form over */ }
  }

  /* matchIdx and the running scores are DERIVED from `picks` rather than stored beside it:
     one truth, so a restored session cannot disagree with itself about which matchup is next. */
  function matchIdx() { return Math.min(picks.length, MATCHUPS.length); }

  /* ── Restore ─────────────────────────────────────────────────────────────────── */
  Object.keys(saved.vals).forEach(function (id) {
    var node = byId(id);
    if (node && !node.value) node.value = saved.vals[id];
  });
  writePriorities();

  /* ── Meter ───────────────────────────────────────────────────────────────────── */
  var meter = el("div", "itk-meter");
  var track = el("div", "itk-meter-track");
  track.appendChild(el("span", "itk-meter-fill"));
  var meterRow = el("div", "itk-meter-row");
  var clearedEl = el("strong", "itk-meter-cleared", "0 of 6 done");
  clearedEl.setAttribute("role", "status");
  var blanksEl = el("span", "itk-meter-blanks", "");
  meterRow.appendChild(clearedEl);
  meterRow.appendChild(blanksEl);
  meter.appendChild(track);
  meter.appendChild(meterRow);
  form.insertBefore(meter, form.firstChild);

  /* ── Sections ────────────────────────────────────────────────────────────────── */
  var secs = [];
  SECTIONS.forEach(function (sec) {
    var node = form.querySelector('[data-sec="' + sec.id + '"]');
    if (!node) return;
    var head = node.querySelector(".itk-sec-head");
    var body = node.querySelector("[data-body]");
    var stamp = el("span", "itk-stamp", STAMP_LABEL.todo);
    head.appendChild(stamp);

    var foot = el("div", "itk-sec-foot");
    var skip = el("button", "itk-skip", "Skip — assume this for me");
    skip.type = "button";
    skip.addEventListener("click", function () {
      var at = skipped.indexOf(sec.id);
      if (at > -1) skipped.splice(at, 1);
      else {
        skipped.push(sec.id);
        var after = nextSection(allStates(readVals(), skipped), sec.id);
        openSection(after ? after.id : null);
      }
      render(); save();
    });
    var next = el("button", "itk-next-sec", "Next →");
    next.type = "button";
    next.addEventListener("click", function () {
      var after = nextSection(allStates(readVals(), skipped), sec.id);
      openSection(after ? after.id : null);
      if (!after) dispatchRow.scrollIntoView({ block: "center" });
    });
    foot.appendChild(skip);
    foot.appendChild(next);
    body.appendChild(foot);

    node.addEventListener("toggle", function () {
      // The question deck (intake-deck.js) keeps every section open and shows one row at a time.
      if (form.hasAttribute("data-deck")) return;
      if (!node.open) { if (openId === sec.id) openId = null; save(); return; }
      openId = sec.id;
      secs.forEach(function (other) { if (other.id !== sec.id) other.node.open = false; });
      save();
    });

    secs.push({ id: sec.id, sec: sec, node: node, mark: node.querySelector("[data-mark]"), stamp: stamp, skip: skip, next: next, body: body });
  });

  function openSection(id) {
    secs.forEach(function (s) { s.node.open = s.id === id; });
    openId = id;
  }

  /* ── A · booking drop zone (Trip) ────────────────────────────────────────────────
     Kept from the composed flow: it is the one control that fills three answers at once,
     and the parser (model/wizard.ts, model/pdf-text.ts) reads files in the page — nothing
     is uploaded. It opens the Trip section because those are the fields it prefills. */
  var tripSec = secs.filter(function (s) { return s.id === "trip"; })[0];
  if (tripSec) {
    var dz = el("label", "itk-dz");
    dz.innerHTML = '<span class="itk-dz-big">Drop your bookings, or tap to browse</span>' +
      '<span class="itk-dz-sub">.pdf · .txt · .eml · .ics · .md — read here, never uploaded</span>' +
      '<input type="file" id="ngDoc" accept=".pdf,.txt,.eml,.ics,.md,.csv" hidden multiple />';
    var dzOut = el("ul", "itk-found");
    dzOut.hidden = true;
    tripSec.body.insertBefore(dzOut, tripSec.body.firstChild);
    tripSec.body.insertBefore(dz, tripSec.body.firstChild);
    ["dragover", "dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) {
        e.preventDefault();
        dz.classList.toggle("itk-dz-hot", ev === "dragover");
        if (ev === "drop" && e.dataTransfer) readFiles(e.dataTransfer.files);
      });
    });
    dz.addEventListener("change", function (e) { if (e.target.id === "ngDoc") readFiles(e.target.files); });
  }
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
    var node = byId(id);
    if (node && !node.value && value) node.value = value;
  }
  function parseDoc(text, name) {
    var doc = parseBookingDocument(text);
    if (doc.isoDates.length) {
      setIfEmpty("ngStart", doc.isoDates[0]);
      setIfEmpty("ngEnd", doc.isoDates[doc.isoDates.length - 1]);
    }
    if (doc.countries.length === 1) setIfEmpty("ngCountry", doc.countries[0]);
    parsedNotes.push(formatParsedNote(name, doc));
    dzOut.appendChild(el("li", null, name + " — " + doc.summary));
    dzOut.hidden = false;
    render(); save();
  }

  /* ── B · head-to-head priorities ─────────────────────────────────────────────────
     Five either-ors replace three dropdowns of seven. The real selects stay in the DOM
     (hidden here, visible with scripts off) and this writes them on every tap, so a
     traveler who dispatches mid-run still files the ranking they have so far. */
  var prioSec = secs.filter(function (s) { return s.id === "priorities"; })[0];
  var vsA, vsB, vsCount, podium, matchWrap, resetBtn;
  if (prioSec) {
    var fallback = prioSec.body.querySelector('[data-fallback="priorities"]');
    if (fallback) fallback.hidden = true;

    matchWrap = el("div", "itk-row itk-row-match");
    var mCtl = el("div", "itk-ctl");
    mCtl.appendChild(el("p", "itk-q", "What is this trip for?"));
    mCtl.appendChild(el("p", "itk-eg", "Five either-ors. Pick the one you'd rather lose a morning to."));
    var vs = el("div", "itk-vs");
    vsA = el("button", "itk-vs-btn"); vsA.type = "button";
    vsB = el("button", "itk-vs-btn"); vsB.type = "button";
    vs.appendChild(vsA);
    vs.appendChild(el("span", "itk-vs-mid", "VS"));
    vs.appendChild(vsB);
    mCtl.appendChild(vs);
    vsCount = el("p", "itk-vs-count", "");
    vsCount.setAttribute("role", "status");
    mCtl.appendChild(vsCount);
    podium = el("ol", "itk-podium");
    mCtl.appendChild(podium);
    resetBtn = el("button", "itk-reset", "Run them again");
    resetBtn.type = "button";
    resetBtn.addEventListener("click", function () { picks = []; writePriorities(); render(); save(); });
    mCtl.appendChild(resetBtn);
    matchWrap.appendChild(mCtl);
    matchWrap.appendChild(el("p", "itk-note",
      "Where the research spends its time — your top pick gets the deepest dig, and nothing you skip is dropped, only researched lighter."));
    prioSec.body.insertBefore(matchWrap, prioSec.body.firstChild);

    vsA.addEventListener("click", function () { pick(0); });
    vsB.addEventListener("click", function () { pick(1); });

    // The also-research tier — topic chips that fold into comments, exactly as before.
    var topicHead = el("p", "itk-minihead", "Also research:");
    prioSec.body.insertBefore(topicHead, prioSec.body.querySelector(".itk-sec-foot"));
    var topicWrap = el("div", "itk-topics");
    topicWrap.setAttribute("role", "group");
    topicWrap.setAttribute("aria-label", "Extra research topics");
    TOPIC_CHIPS.forEach(function (topic) {
      var chip = el("button", "itk-chip", topic);
      chip.type = "button";
      chip.classList.toggle("itk-chip-on", topics.has(topic));
      chip.setAttribute("aria-pressed", String(topics.has(topic)));
      chip.addEventListener("click", function () {
        var on = !topics.has(topic);
        if (on) topics.add(topic); else topics.delete(topic);
        chip.classList.toggle("itk-chip-on", on);
        chip.setAttribute("aria-pressed", String(on));
        save();
      });
      topicWrap.appendChild(chip);
    });
    prioSec.body.insertBefore(topicWrap, prioSec.body.querySelector(".itk-sec-foot"));
  }

  function pick(side) {
    var pair = MATCHUPS[matchIdx()];
    if (!pair) return;
    picks.push(MATCH_CATEGORIES[pair[side]].value);
    writePriorities();
    render(); save();
  }
  function writePriorities() {
    var ranked = rankToFields(rankFromPicks(picks));
    ["priority1", "priority2", "priority3"].forEach(function (key, i) {
      var sel = byId("ngPriority" + (i + 1));
      if (sel) sel.value = ranked[key];
    });
  }

  /* ── C · the fork gate ───────────────────────────────────────────────────────────
     Rebuilt only when the SET of forks changes, so typing in a field never yanks a card
     out from under the cursor. Each choice writes the real select behind it. */
  var gate = el("div", "itk-gate");
  var gateHead = el("p", "itk-gate-head", "");
  gate.appendChild(gateHead);
  var gateBody = el("div", "itk-gate-body");
  gate.appendChild(gateBody);
  gate.hidden = true;

  var dispatchRow = el("div", "itk-dispatch");
  var go = el("button", "itk-go", "All set — see it running →");
  go.type = "submit";
  var goNote = el("p", "itk-go-note", WAYPOINT_BACKEND.url
    ? "Sending starts the research and takes you to the live progress page."
    : "Sending opens a prefilled request for you to submit, then takes you to the live progress page.");
  var goWhere = el("p", "itk-go-where", "");
  dispatchRow.appendChild(go);
  dispatchRow.appendChild(goNote);
  dispatchRow.appendChild(goWhere);

  var plain = form.querySelector("[data-plain-submit]");
  form.insertBefore(gate, errEl || plain);
  form.insertBefore(dispatchRow, errEl || plain);
  if (plain) plain.hidden = true;

  var forkKey = null;
  function renderForks(vals) {
    var forks = deriveForks(vals, forkPicks);
    var moveFocus = false;
    var key = forks.map(function (f) { return f.id; }).join("|");
    if (key !== forkKey) {
      // An answered fork leaves the queue, so the card the traveller just clicked is about to
      // be removed. Keyboard focus would fall to <body> and lose their place entirely, so it
      // moves to whatever replaced it — the next question, or the send control it just unlocked.
      moveFocus = forkKey !== null && gate.contains(document.activeElement);
      forkKey = key;
      gateBody.innerHTML = "";
      forks.forEach(function (fork) { gateBody.appendChild(buildFork(fork)); });
    }
    gate.hidden = forks.length === 0;
    setText(gateHead, forks.length === 1
      ? "One thing worth settling before this goes out"
      : "Two things worth settling before this goes out");
    var cleared = forksCleared(forks, forkPicks);
    go.hidden = !cleared;
    // After go.hidden, never before: a hidden element takes no focus.
    if (moveFocus) {
      var moveTo = gateBody.querySelector(".itk-chip") || (cleared ? go : null);
      if (moveTo) moveTo.focus();
    }
    return cleared;
  }
  function buildFork(fork) {
    var card = el("div", "itk-fork");
    card.appendChild(el("p", "itk-fork-q", fork.question));
    card.appendChild(el("p", "itk-fork-why", fork.why));
    var sel = byId(fork.dom);
    var row = el("div", "itk-fork-opts");
    row.setAttribute("role", "radiogroup");
    row.setAttribute("aria-label", fork.question);
    if (sel) {
      Array.prototype.forEach.call(sel.options, function (opt) {
        var chip = el("button", "itk-chip");
        chip.type = "button";
        chip.textContent = opt.value === "" ? "leave it open" : opt.text;
        if (opt.value === fork.recommend) chip.appendChild(el("span", "itk-rec", "recommended"));
        chip.setAttribute("role", "radio");
        var chosen = forkPicks[fork.id] === opt.value;
        chip.setAttribute("aria-checked", String(chosen));
        if (chosen) chip.classList.add("itk-chip-on");
        chip.addEventListener("click", function () {
          sel.value = opt.value;
          forkPicks[fork.id] = opt.value;
          Array.prototype.forEach.call(row.children, function (other) {
            other.classList.remove("itk-chip-on");
            other.setAttribute("aria-checked", "false");
          });
          chip.classList.add("itk-chip-on");
          chip.setAttribute("aria-checked", "true");
          render(); save();
        });
        row.appendChild(chip);
      });
    }
    card.appendChild(row);
    return card;
  }

  /* ── Render ──────────────────────────────────────────────────────────────────── */
  function render() {
    var vals = readVals();
    var states = allStates(vals, skipped);

    meter.style.setProperty("--itk-fill", String(meterFill(states)));
    setText(clearedEl, clearedLabel(states));
    setText(blanksEl, blanksLine(vals));

    secs.forEach(function (s, i) {
      var state = states[i];
      s.mark.textContent = state === "done" ? "✓" : state === "assumed" ? "!" : String(i + 1);
      s.mark.className = "itk-mark itk-mark-" + (state === "done" || state === "assumed" ? state : "todo");
      s.stamp.textContent = STAMP_LABEL[state];
      s.stamp.className = "itk-stamp itk-stamp-" + state;
      s.node.classList.toggle("itk-sec-skipped", state === "assumed");
      s.skip.textContent = state === "assumed" ? "Actually, I'll answer it" : "Skip — assume this for me";
      var after = nextSection(states, s.id);
      s.next.textContent = after ? "Next: " + after.title + " →" : "That's everything →";
    });

    if (prioSec) {
      var idx = matchIdx();
      var pair = MATCHUPS[idx];
      var running = Boolean(pair);
      matchWrap.querySelector(".itk-vs").hidden = !running;
      resetBtn.hidden = running || picks.length === 0;
      if (pair) {
        vsA.textContent = MATCH_CATEGORIES[pair[0]].label;
        vsB.textContent = MATCH_CATEGORIES[pair[1]].label;
      }
      setText(vsCount, running
        ? "Matchup " + (idx + 1) + " of " + MATCHUPS.length
        : "All " + MATCHUPS.length + " done");
      var ranked = rankFromPicks(picks);
      podium.innerHTML = "";
      ranked.forEach(function (value, place) {
        var card = MATCH_CATEGORIES.filter(function (c) { return c.value === value; })[0];
        var li = el("li", "itk-podium-item" + (place === 0 ? " itk-podium-first" : ""));
        li.appendChild(el("span", "itk-podium-n", "#" + (place + 1)));
        li.appendChild(el("span", "itk-podium-lab", card ? card.label : value));
        podium.appendChild(li);
      });
      podium.hidden = ranked.length === 0;
    }

    renderForks(vals);
    var country = vals.ngCountry;
    var basePath = document.body.getAttribute("data-base") || "";
    setText(goWhere, country ? "Next stop: " + basePath + "/progress/?slug=" + guessSlug(country) : "");
    goWhere.hidden = !country;
  }

  form.addEventListener("input", function () { render(); save(); });
  form.addEventListener("change", function () { render(); save(); });

  /* The gate, and the comments fold, in one CAPTURE listener — capture listeners on the
     target run before bubble ones, so this sees the submit before intake-submit.js builds
     the payload. Two jobs, in this order:
       1. An unanswered fork stops the dispatch. `stopImmediatePropagation` is the part that
          matters: preventDefault alone only cancels the browser's own submission, and
          intake-submit's handler would still POST. The keyboard path (Enter in a text field,
          which submits through the hidden no-JS button) lands here too, so the gate cannot
          be walked around.
       2. Parsed documents + extra topics fold into comments — the mechanism the composed
          flow used, unchanged. */
  form.addEventListener("submit", function (e) {
    if (!forksCleared(deriveForks(readVals(), forkPicks), forkPicks)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      gate.scrollIntoView({ block: "center" });
      var first = gate.querySelector(".itk-chip");
      if (first) first.focus();
      return;
    }
    var comments = byId("ngComments");
    if (!comments) return;
    var extra = [];
    if (topics.size) extra.push("Research focus: " + Array.from(topics).join(", "));
    if (parsedNotes.length) extra.push("Parsed from uploaded documents:\n" + parsedNotes.join("\n"));
    if (extra.length) comments.value = (comments.value ? comments.value + "\n\n" : "") + extra.join("\n\n");
  }, true);

  /* Printing wants the whole intake, not the one section that happens to be open. The page
     renders every section open with scripts off, so this only restores what JS collapsed. */
  var openBeforePrint = null;
  window.addEventListener("beforeprint", function () {
    openBeforePrint = openId;
    secs.forEach(function (s) { s.node.open = true; });
  });
  window.addEventListener("afterprint", function () { openSection(openBeforePrint); });

  // One section open at a time — the checklist's whole point is that you can see where you are.
  openSection(openId || SECTIONS[0].id);
  render();
}
