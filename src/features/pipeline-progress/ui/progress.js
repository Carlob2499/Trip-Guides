/* New Guide pipeline progress tracker — the "tangible viewing progress" surface, and (batch 3)
   the place the run's open decisions get answered. Reads ?slug= from the URL, polls the
   injectable gateway (real impl: raw.githubusercontent.com, no auth, no backend) for
   scripts/pipeline.mjs's own checkpoint state, and renders a live elapsed timer + a
   step-by-step checklist. All data access goes through ../gateway.ts (never `fetch` a URL
   directly here) so this file only renders and schedules polls.

   Three owner-gated controls sit alongside the read-only view — answering intake questions,
   choosing on a blocking fork, and approving a feedback-driven revision proposal. Each posts to
   the site's backend Worker with the key stored in this browser, and NONE of them render until
   one is stored (the key replaced the deleted approval labels, so without it the Worker 401s and
   the control would be a button that can only fail).

   The slug in the URL is a CLIENT-SIDE GUESS (predictSlug mirrors scaffold-guide.mjs's
   slugify()) — a same-name collision appends "-2" server-side, which this can't predict. If the
   guess never resolves, a manual correction input lets the visitor paste the real slug.
   Honest-by-design: never claim progress for a guide this can't actually find. */
import {
  deriveProgress, formatElapsed, predictSlug, normalizeSlug, createGithubGateway, createWorkerGateway,
} from "../index";
import { buildAnswerPayload } from "../../intake-questions/index";
import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { readOwnerKey, storeOwnerKey, clearOwnerKey, OWNER_KEY_MIN } from "../../../scripts/owner-key.js";

const OWNER = "Carlob2499";
const NAME = "Trip-Guides";
const POLL_MS = 15000;
const TICK_MS = 1000;
// Give a guessed slug a real chance to resolve before offering the manual-correction input —
// scaffolding (new-guide.yml's own commit) can take upward of 30-60s after the issue is filed.
const GUESS_GRACE_MS = 90000;

export function initProgress() {
  const root = document.getElementById("pgRoot");
  if (!root) return;

  const els = {
    form: document.getElementById("pgSlugForm"),
    input: document.getElementById("pgSlugInput"),
    slugLabel: document.getElementById("pgSlug"),
    waiting: document.getElementById("pgWaiting"),
    timer: document.getElementById("pgTimer"),
    bar: document.getElementById("pgBarFill"),
    percent: document.getElementById("pgPercent"),
    steps: document.getElementById("pgSteps"),
    stuckNote: document.getElementById("pgStuckNote"),
    done: document.getElementById("pgDone"),
    doneLink: document.getElementById("pgDoneLink"),
    correction: document.getElementById("pgCorrection"),
    questions: document.getElementById("pgQuestions"),
    qList: document.getElementById("pgQList"),
    qSend: document.getElementById("pgQSend"),
    qStatus: document.getElementById("pgQStatus"),
    proposals: document.getElementById("pgProposals"),
    pList: document.getElementById("pgPList"),
    keyPanel: document.getElementById("pgKeyPanel"),
    keyToggle: document.getElementById("pgKeyToggle"),
    keyForm: document.getElementById("pgKeyForm"),
    keyInput: document.getElementById("pgKeyInput"),
    keyClear: document.getElementById("pgKeyClear"),
    keyStatus: document.getElementById("pgKeyStatus"),
  };

  const gateway = createGithubGateway({ owner: OWNER, repo: NAME });
  const cfgEl = document.getElementById("pgConfig");
  const cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  const base = cfg.base || "/";

  const params = new URLSearchParams(location.search);
  // Same shape scaffold-guide.mjs's slugify() emits and scripts/lib/slug.mjs validates. The
  // slug arrives from ?slug= and ends up in an href, so anything not matching is dropped
  // rather than linked — the page's own "paste the real slug" correction path handles it.
  // normalizeSlug() is the ONE check, shared with the correction form's submit handler below.
  let slug = normalizeSlug(params.get("slug"));
  let guessed = !slug && !!params.get("country");
  if (!slug && params.get("country")) slug = predictSlug(params.get("country"));

  let startedAt = Date.now();
  let lastState = null;
  let tickTimer = null;
  let pollTimer = null;
  let stopped = false;

  // Owner state. `owner` is a UI gate only — the Worker re-checks the key on every request, so a
  // visitor who flips this in a console gets 401s, not access.
  let owner = false;
  let sending = false;
  /** id → the answer being drafted, kept OUTSIDE the render so a poll tick can't wipe typing. */
  const answers = new Map();
  let renderedQuestionKey = "";

  function renderSteps(view) {
    // Nodes, never innerHTML — same rule as the question cards below (see el()). The labels are
    // this file's own constants today, which is exactly how an innerHTML template survives long
    // enough to meet a label that isn't.
    els.steps.textContent = "";
    view.stages.forEach((s, i) => {
      const li = el("li", "pg-step" + (s.done ? " is-done" : i === view.currentIndex ? " is-current" : ""));
      const icon = el("span", "pg-step-icon", s.done ? "✓" : i === view.currentIndex ? "●" : "○");
      icon.setAttribute("aria-hidden", "true");
      li.appendChild(icon);
      li.appendChild(el("span", "pg-step-label", s.label));
      els.steps.appendChild(li);
    });
  }

  function renderTick() {
    // Ticks from page-load time even before the first state fetch resolves — startedAt gets
    // corrected to the real createdAt the moment a state file is actually found (see poll()),
    // so the timer feels alive immediately instead of frozen at 0s during the initial wait.
    const elapsed = Date.now() - startedAt;
    els.timer.textContent = formatElapsed(elapsed);
  }

  function render(view) {
    // A 0..1 scale factor, not a width — the bar is transform-driven (progress.css) so a
    // poll tick costs a composite rather than a layout pass.
    els.bar.style.setProperty("--pg-progress", (view.percent / 100).toFixed(4));
    els.percent.textContent = view.percent + "%";
    renderSteps(view);
    els.stuckNote.hidden = !view.isStuck;

    if (view.isDone) {
      stop();
      els.waiting.hidden = true;
      els.done.hidden = false;
      const url = base.replace(/\/$/, "") + "/guides/" + slug + "/";
      els.doneLink.href = url;
    }
  }

  /* ── Decision points (questions + blocking forks) ─────────────────────────────────────── */

  // Every string below comes from a ledger the pipeline wrote, so it is trusted-ish — but it is
  // still content this page did not author, and innerHTML on it would make a stray "<" in a
  // venue name a rendering bug at best. Build nodes, set textContent.
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderQuestionCard(q) {
    var card = el("div", "pg-q-card" + (q.blocking ? " is-blocking" : ""));
    if (q.blocking) card.appendChild(el("p", "pg-q-badge", "Waiting on you"));
    card.appendChild(el("p", "pg-q-text", q.text));
    if (q.assumption) {
      var assumed = el("p", "pg-q-assumed");
      // A fork STOPPED the run, so nothing is being assumed — saying "if you don't answer" there
      // would promise a default that doesn't exist.
      assumed.appendChild(el("span", "pg-q-assumed-label", q.blocking ? "Recommended:" : "If you don't answer:"));
      assumed.appendChild(document.createTextNode(" " + q.assumption));
      card.appendChild(assumed);
    }
    if (q.context) card.appendChild(el("p", "pg-q-context", q.context));
    if (owner) card.appendChild(renderAnswerControl(q));
    return card;
  }

  /** Free text, or the fork's own options as chips — a fork has a fixed set by definition
   *  (a blocking one carries at least two), and typing one of two known answers is a worse
   *  interaction AND a chance to type something the run can't match. */
  function renderAnswerControl(q) {
    var wrap = el("div", "pg-q-answer");
    if (q.options && q.options.length) {
      var group = el("div", "pg-q-options");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Choose an option");
      q.options.forEach(function (opt) {
        var b = el("button", "pg-q-opt", opt);
        b.type = "button";
        b.setAttribute("aria-pressed", String(answers.get(q.id) === opt));
        b.addEventListener("click", function () {
          answers.set(q.id, opt);
          Array.prototype.forEach.call(group.children, function (child) {
            child.setAttribute("aria-pressed", String(child.textContent === opt));
          });
          syncSend();
        });
        group.appendChild(b);
      });
      wrap.appendChild(group);
      return wrap;
    }
    var input = document.createElement("input");
    input.type = "text";
    input.className = "pg-q-input";
    input.placeholder = "Your answer";
    input.setAttribute("aria-label", "Answer: " + q.text);
    input.value = answers.get(q.id) || "";
    input.addEventListener("input", function () {
      answers.set(q.id, input.value);
      syncSend();
    });
    wrap.appendChild(input);
    return wrap;
  }

  function draftEntries() {
    var out = [];
    answers.forEach(function (answer, id) { out.push({ id: id, answer: answer }); });
    return out;
  }

  function syncSend() {
    if (!els.qSend) return;
    els.qSend.disabled = sending || buildAnswerPayload(slug, draftEntries()).answers.length === 0;
  }

  function renderQuestions(questions) {
    if (!els.qList || !els.questions) return;
    var open = questions.filter(function (q) { return q.status === "open"; });
    if (!open.length) { els.questions.hidden = true; return; }
    els.questions.hidden = false;
    if (els.qSend) els.qSend.hidden = !owner;

    // Rebuild ONLY when the set of open questions actually changes. A poll tick every 15s that
    // replaced these nodes would throw away half-typed answers and drop keyboard focus to
    // <body> mid-sentence — the same trap the change-request chips document.
    var key = open.map(function (q) { return q.id + ":" + q.status; }).join("|") + "|" + (owner ? "o" : "-");
    if (key !== renderedQuestionKey) {
      renderedQuestionKey = key;
      els.qList.innerHTML = "";
      open.forEach(function (q) { els.qList.appendChild(renderQuestionCard(q)); });
    }
    syncSend();
  }

  function sendAnswers() {
    var payload = buildAnswerPayload(slug, draftEntries());
    if (!payload.answers.length || sending) return;
    sending = true;
    syncSend();
    if (els.qStatus) els.qStatus.textContent = "Sending…";
    createWorkerGateway({ ownerKey: readOwnerKey() }).sendAnswers(payload).then(function (res) {
      sending = false;
      if (res.ok) {
        answers.clear();
        renderedQuestionKey = "";
        if (els.qStatus) els.qStatus.textContent = "Answer sent — the guide will absorb it.";
      } else if (els.qStatus) {
        els.qStatus.textContent = res.message;
      }
      syncSend();
    });
  }

  /* ── Revision proposals (owner only) ──────────────────────────────────────────────────── */

  function renderProposals(list) {
    if (!els.pList || !els.proposals) return;
    if (!owner || !list.length) { els.proposals.hidden = true; return; }
    els.proposals.hidden = false;
    els.pList.innerHTML = "";
    list.forEach(function (p) {
      var card = el("div", "pg-p-card");
      card.appendChild(el("p", "pg-p-title", p.title));
      if (p.reason) card.appendChild(el("p", "pg-p-reason", p.reason));
      var status = el("p", "pg-p-status");
      var btn = el("button", "pg-p-approve", "Approve this revision");
      btn.type = "button";
      btn.addEventListener("click", function () {
        btn.disabled = true;
        status.textContent = "Starting…";
        createWorkerGateway({ ownerKey: readOwnerKey() }).approveRevision({ slug: slug, issue: p.issue })
          .then(function (res) {
            if (res.ok) {
              btn.remove();
              status.textContent = "Approved — the revision is running.";
              loadProposals();
            } else {
              btn.disabled = false;
              status.textContent = res.message;
            }
          });
      });
      card.appendChild(btn);
      card.appendChild(status);
      els.pList.appendChild(card);
    });
  }

  // Deliberately not on the poll loop — api.github.com allows 60 unauthenticated requests per
  // hour per IP and the state poll already spends 240 (see gateway.fetchProposals).
  function loadProposals() {
    if (!owner || !slug) { renderProposals([]); return; }
    gateway.fetchProposals(slug).then(renderProposals);
  }

  /* ── The owner key ────────────────────────────────────────────────────────────────────── */

  function syncOwner() {
    owner = !!WAYPOINT_BACKEND.url && !!readOwnerKey();
    if (els.keyPanel) els.keyPanel.hidden = !WAYPOINT_BACKEND.url;
    if (els.keyStatus) {
      els.keyStatus.textContent = owner
        ? "Key stored in this browser — answer and approve controls are on."
        : "No key stored. Progress still updates; answering and approving need a key.";
    }
    if (els.keyClear) els.keyClear.hidden = !owner;
  }

  function initKeyPanel() {
    syncOwner();
    if (els.keyToggle && els.keyForm) {
      els.keyToggle.addEventListener("click", function () {
        var show = els.keyForm.hidden;
        els.keyForm.hidden = !show;
        els.keyToggle.setAttribute("aria-expanded", String(show));
        // NEVER prefill with the stored key — a key that can be read off the screen is a key
        // that leaks to whoever is looking at it (or to a screenshot).
        if (show && els.keyInput) { els.keyInput.value = ""; els.keyInput.focus(); }
      });
    }
    if (els.keyForm) {
      els.keyForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var stored = storeOwnerKey(els.keyInput ? els.keyInput.value : "");
        if (els.keyInput) els.keyInput.value = "";
        if (!stored) {
          if (els.keyStatus) els.keyStatus.textContent = "That key looks too short (" + OWNER_KEY_MIN + " characters or more).";
          return;
        }
        els.keyForm.hidden = true;
        if (els.keyToggle) els.keyToggle.setAttribute("aria-expanded", "false");
        syncOwner();
        renderedQuestionKey = "";
        poll();
        loadProposals();
      });
    }
    if (els.keyClear) {
      els.keyClear.addEventListener("click", function () {
        clearOwnerKey();
        answers.clear();
        syncOwner();
        renderedQuestionKey = "";
        renderProposals([]);
        poll();
      });
    }
    if (els.qSend) els.qSend.addEventListener("click", sendAnswers);
  }

  async function poll() {
    if (stopped) return;
    const [state, published, questions] = await Promise.all([
      gateway.fetchState(slug), gateway.isPublished(slug), gateway.fetchQuestions(slug),
    ]);

    if (state) {
      if (!lastState) startedAt = new Date(state.createdAt).getTime();
      lastState = state;
      els.correction.hidden = true;
    } else if (guessed && Date.now() - startedAt > GUESS_GRACE_MS) {
      // The guessed slug never resolved within a generous grace window — likely a same-name
      // collision picked a different slug server-side. Offer the manual correction rather than
      // polling a dead guess forever.
      els.correction.hidden = false;
    }
    // Render even when state is still null — deriveProgress(null, ...) is a valid "nothing
    // cleared yet" view, so the checklist shows what's COMING immediately, not a blank panel
    // while waiting for the very first successful fetch.
    render(deriveProgress(state, { now: new Date(), published }));
    renderQuestions(questions);
  }

  function start() {
    if (!slug) {
      els.correction.hidden = false;
      return;
    }
    els.slugLabel.textContent = slug;
    els.waiting.hidden = false;
    renderTick();
    poll();
    loadProposals();
    pollTimer = setInterval(poll, POLL_MS);
    tickTimer = setInterval(renderTick, TICK_MS);
  }

  function stop() {
    stopped = true;
    if (pollTimer) clearInterval(pollTimer);
    if (tickTimer) clearInterval(tickTimer);
  }

  if (els.form) {
    // A typed slug gets the SAME check the ?slug= one does. It travels to exactly the same three
    // places (an href, a raw.githubusercontent.com URL, a Worker POST body), and "the visitor
    // typed it" is not a provenance — a link can tell someone what to paste.
    if (els.input) {
      els.input.addEventListener("input", function () { els.input.setCustomValidity(""); });
    }
    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      els.input.setCustomValidity("");
      const typed = normalizeSlug(els.input.value);
      if (!typed) {
        // Native message, no new markup: says what is wrong instead of silently doing nothing.
        els.input.setCustomValidity("A slug is lowercase letters, digits and single hyphens — e.g. south-korea.");
        els.input.reportValidity();
        return;
      }
      stop();
      stopped = false;
      slug = typed;
      guessed = false;
      lastState = null;
      startedAt = Date.now();
      history.replaceState(null, "", location.pathname + "?slug=" + encodeURIComponent(slug));
      start();
    });
  }

  initKeyPanel();
  start();

  // Stop polling a hidden/backgrounded tab — resumes on the next visibility change instead of
  // burning a request every 15s while nobody's watching.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    } else if (!stopped && slug && !pollTimer) {
      poll();
      pollTimer = setInterval(poll, POLL_MS);
    }
  });
}
