/* Change-request wizard — DOM wiring. All decisions live in ../model/change-request.ts.
   Progressive enhancement: the footer pill is a REAL link to the prefilled GitHub issue and
   keeps working with JS off. This intercepts the click and offers the guided version instead.

   Batch 3 added the worker path: with the backend configured and an owner key stored, the final
   step POSTs the request and confirms in place instead of navigating to GitHub. Every piece of
   GitHub-facing copy is therefore mode-dependent (MODE_COPY) — the markup carries the GitHub
   wording as its no-JS default and this file swaps it when the worker path is live. */

import {
  sectionOptions,
  validateStep,
  remainingChars,
  buildRequestUrl,
  buildRequestPayload,
  submitMode,
  MODE_COPY,
  SENT_COPY,
  CHANGE_MAX,
} from "../model/change-request";
import { createChangeGateway } from "../gateway.js";
import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { readOwnerKey } from "../../../scripts/owner-key.js";

export function initChangeRequest(cfg, lockScroll, unlockScroll) {
  var trigger = document.getElementById("btnChangeRequest");
  var modal = document.getElementById("crModal");
  var backdrop = document.getElementById("crBackdrop");
  if (!trigger || !modal || !backdrop) return;

  var repo = modal.getAttribute("data-repo");
  var slug = modal.getAttribute("data-slug");
  if (!repo || !slug) return; // nothing to file against — leave the plain link alone

  // Same containing-block trap the share panel documents: these are authored inside page
  // chrome that carries a backdrop-filter, and a filtered ancestor becomes the containing
  // block for position:fixed — so the modal would anchor to the chrome instead of the
  // viewport and fly off-screen once scrolled. Reparent both to <body>.
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  if (backdrop.parentElement !== document.body) document.body.appendChild(backdrop);

  var elStepOf = modal.querySelector("[data-cr-stepof]");
  var elOptions = modal.querySelector("[data-cr-options]");
  var elHint = modal.querySelector("[data-cr-hint]");
  var elTextarea = modal.querySelector("[data-cr-change]");
  var elCount = modal.querySelector("[data-cr-count]");
  var elErr = modal.querySelector("[data-cr-err]");
  // The step-2 error slot lives inside the step-2 pane, which is HIDDEN on the review step —
  // a send failure written there would be invisible. The review pane carries its own.
  var elSendErr = modal.querySelector("[data-cr-send-err]");
  var elReview = modal.querySelector("[data-cr-review]");
  var elReviewNote = modal.querySelector("[data-cr-review-note]");
  var elFoot = modal.querySelector("[data-cr-foot]");
  var elSent = modal.querySelector("[data-cr-sent]");
  var btnBack = modal.querySelector("[data-cr-back]");
  var btnNext = modal.querySelector("[data-cr-next]");
  var btnClose = modal.querySelector("[data-cr-close]");
  var elNav = modal.querySelector(".cr-nav");
  var panes = modal.querySelectorAll("[data-cr-pane]");

  var STEPS = 3;
  var step = 0;
  var state = { section: "", change: "" };
  var options = sectionOptions(cfg && cfg.navSections);
  // Resolved per OPEN, not once at boot: the owner can paste their key from the progress page
  // in another tab and come back to this one without a reload.
  var mode = "github";
  var copy = MODE_COPY.github;
  var sending = false;

  if (elTextarea) elTextarea.setAttribute("maxlength", String(CHANGE_MAX));

  // Chips are built ONCE and only their pressed state is updated afterwards. Rebuilding them
  // on each pick would destroy the element the user just activated, dropping keyboard focus to
  // <body> mid-flow — fine with a mouse, a dead end with a keyboard.
  function syncPressed() {
    for (var i = 0; i < chipEls.length; i++) {
      chipEls[i].setAttribute("aria-pressed", String(state.section === options[i].value));
    }
  }

  var chipEls = [];
  function buildOptions() {
    if (!elOptions) return;
    elOptions.innerHTML = "";
    chipEls = options.map(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cr-chip";
      b.textContent = opt.label;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        state.section = opt.value;
        if (elHint) elHint.textContent = opt.hint || "";
        syncPressed();
      });
      elOptions.appendChild(b);
      return b;
    });
  }

  function renderCount() {
    if (!elCount) return;
    var left = remainingChars(state.change);
    elCount.textContent = left + " characters left";
    elCount.classList.toggle("cr-count-low", left < 120);
  }

  function renderReview() {
    if (!elReview) return;
    var picked = options.find(function (o) { return o.value === state.section; });
    elReview.innerHTML = "";
    var add = function (term, desc) {
      var dt = document.createElement("dt"); dt.textContent = term;
      var dd = document.createElement("dd"); dd.textContent = desc;
      elReview.appendChild(dt); elReview.appendChild(dd);
    };
    add("Guide", slug);
    add("Where", state.section || (picked ? picked.label : "Not sure — the editor will find it"));
    add("What's wrong", state.change.trim());
  }

  function render() {
    for (var i = 0; i < panes.length; i++) {
      if (i === step) panes[i].removeAttribute("hidden");
      else panes[i].setAttribute("hidden", "");
    }
    if (elStepOf) elStepOf.textContent = "Step " + (step + 1) + " of " + STEPS;
    if (btnBack) btnBack.hidden = step === 0;
    if (btnNext) btnNext.textContent = step === STEPS - 1 ? copy.next : "Next";
    if (elErr) elErr.textContent = "";
    if (elSendErr) elSendErr.textContent = "";
    if (step === 2) renderReview();
  }

  /** The one confirmation the worker path gets: the wizard's own panes go away and the modal
      says what actually happened. Nothing here mentions where the request went — the whole
      point of the configured path is that the reporter never learns. */
  function renderSent() {
    for (var i = 0; i < panes.length; i++) panes[i].setAttribute("hidden", "");
    if (elStepOf) elStepOf.textContent = "";
    if (elNav) elNav.hidden = true;
    if (elFoot) elFoot.hidden = true;
    if (elSent) {
      elSent.textContent = SENT_COPY;
      elSent.hidden = false;
      elSent.focus();
    }
  }

  function open(e) {
    if (e) e.preventDefault();
    step = 0;
    sending = false;
    mode = submitMode({ backendUrl: WAYPOINT_BACKEND.url, hasOwnerKey: !!readOwnerKey() });
    copy = MODE_COPY[mode];
    if (elReviewNote) elReviewNote.textContent = copy.review;
    if (elFoot) { elFoot.textContent = copy.foot; elFoot.hidden = false; }
    if (elSent) elSent.hidden = true;
    if (elNav) elNav.hidden = false;
    // null = nothing chosen yet, which is distinct from "" = the explicit "I'm not sure".
    // Without that distinction the escape hatch renders pre-selected before the reader picks.
    state = { section: null, change: "" };
    if (elTextarea) elTextarea.value = "";
    if (elHint) elHint.textContent = "";
    buildOptions();
    syncPressed();
    renderCount();
    render();
    modal.removeAttribute("hidden");
    backdrop.classList.add("open");
    if (lockScroll) lockScroll();
    trigger.setAttribute("aria-expanded", "true");
    var first = modal.querySelector(".cr-chip");
    if (first) first.focus();
  }

  function close() {
    modal.setAttribute("hidden", "");
    backdrop.classList.remove("open");
    if (unlockScroll) unlockScroll();
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  function next() {
    if (sending) return;
    var v = validateStep(step, state);
    if (!v.ok) { if (elErr) elErr.textContent = v.error; return; }
    if (step < STEPS - 1) { step += 1; render(); return; }

    if (mode === "worker") {
      // Async is SAFE here only because nothing after the await opens a window or navigates —
      // the result is rendered into this same modal. The GitHub branch below must stay
      // synchronous for exactly the opposite reason (see its comment).
      sending = true;
      if (btnNext) { btnNext.disabled = true; btnNext.textContent = "Sending…"; }
      var gateway = createChangeGateway({ ownerKey: readOwnerKey() });
      gateway.submitChange(buildRequestPayload(slug, state)).then(function (res) {
        sending = false;
        if (btnNext) { btnNext.disabled = false; btnNext.textContent = copy.next; }
        if (res.ok) { renderSent(); return; }
        if (elSendErr) elSendErr.textContent = res.message;
      });
      return;
    }

    // FINAL step. The URL is built and navigation happens SYNCHRONOUSLY inside this click —
    // no await anywhere on this path. An `await` here would put window.open outside the user
    // gesture and popup blockers would eat it silently (CLAUDE.md boundary check #2, the bug
    // that would have made the wizard file nothing and report nothing). Same-tab navigation
    // avoids the question entirely.
    window.location.href = buildRequestUrl(repo, slug, state);
  }

  trigger.addEventListener("click", open);
  if (btnClose) btnClose.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  if (btnBack) btnBack.addEventListener("click", function () { if (step > 0) { step -= 1; render(); } });
  if (btnNext) btnNext.addEventListener("click", next);
  if (elTextarea) {
    elTextarea.addEventListener("input", function () {
      state.change = elTextarea.value;
      renderCount();
      if (elErr) elErr.textContent = "";
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) close();
  });
}
