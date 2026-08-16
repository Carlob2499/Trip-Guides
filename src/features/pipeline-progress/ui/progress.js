/* New Guide pipeline progress cockpit — the "tangible viewing progress" surface, and the place
   the run's open decisions get answered. Reads ?slug= from the URL, polls the injectable gateway
   (real impl: raw.githubusercontent.com, no auth, no backend) for scripts/pipeline.mjs's own
   checkpoint state, and paints it as a route map, three phase bars, an elapsed clock and a note
   panel. All data access goes through ../gateway.ts (never `fetch` a URL directly here) so this
   file only renders and schedules.

   THE ONE RULE THIS FILE EXISTS TO KEEP: nothing here may claim more than the pipeline reported.
   The plane sits at the last CLEARED station, never at an interpolated guess at the current one.
   The station ring pulses only while a run is genuinely live — docs/reference/motion.md: a pulse
   over a dead run is the page lying. The sourcing, judgments and "worth knowing" panels stay in
   their honest-empty form until real telemetry exists (model/run-events.ts), and there is no
   demo feed anywhere in this file to make them look busy in the meantime.

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
  derivePageState, deriveStatusPill, deriveProgressLine, derivePhases, deriveNotePanel,
  PHASE_STATUS_LABEL, STAGE_SHORT, fetchTone, fetchHost,
} from "../index";
import {
  STATION_T, bezierPoint, bezierAngle, arcLengthFraction, bezierLength,
  clamp01, dampToward, planeDrift,
} from "../../../lib/route-geometry";
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
// Nothing emits guides-intake/<slug>/events.json yet, so the read 404s every time. Ask a few
// times in case a run turns telemetry on mid-flight, then stop spending a request per tick on a
// file that isn't coming. The panels are already showing the truthful "not reported yet" copy.
const EVENT_PROBES = 3;

export function initProgress() {
  const root = document.getElementById("pgRoot");
  if (!root) return;

  const byId = (id) => document.getElementById(id);
  const els = {
    main: byId("pgMain"),
    form: byId("pgSlugForm"),
    input: byId("pgSlugInput"),
    slugLabel: byId("pgSlug"),
    pill: byId("pgStatusPill"),
    line: byId("pgLine"),
    timer: byId("pgTimer"),
    steps: byId("pgSteps"),
    route: byId("pgRoute"),
    routeAlt: byId("pgRouteAlt"),
    routeFlown: byId("pgRouteFlown"),
    routeGlow: byId("pgRouteGlow"),
    stations: byId("pgStations"),
    plane: byId("pgPlane"),
    phases: byId("pgPhases"),
    fetchList: byId("pgFetchList"),
    fetchEmpty: byId("pgFetchEmpty"),
    fetchDot: byId("pgFetchDot"),
    judgeList: byId("pgJudgeList"),
    judgeEmpty: byId("pgJudgeEmpty"),
    nugList: byId("pgNugList"),
    nugEmpty: byId("pgNugEmpty"),
    statsNote: byId("pgStatsNote"),
    stats: {
      pages: byId("pgStatPages"), facts: byId("pgStatFacts"),
      kept: byId("pgStatKept"), dropped: byId("pgStatDropped"),
    },
    notifyBtn: byId("pgNotifyBtn"),
    notifyStatus: byId("pgNotifyStatus"),
    done: byId("pgDone"),
    doneLink: byId("pgDoneLink"),
    correction: byId("pgCorrection"),
    note: byId("pgNote"),
    noteHead: byId("pgNoteHead"),
    notePlaceholder: byId("pgNotePlaceholder"),
    noteIssue: byId("pgNoteIssue"),
    noteLive: byId("pgNoteLive"),
    qList: byId("pgQList"),
    qSend: byId("pgQSend"),
    qStatus: byId("pgQStatus"),
    proposals: byId("pgProposals"),
    pList: byId("pgPList"),
    keyPanel: byId("pgKeyPanel"),
    keyToggle: byId("pgKeyToggle"),
    keyForm: byId("pgKeyForm"),
    keyInput: byId("pgKeyInput"),
    keyClear: byId("pgKeyClear"),
    keyStatus: byId("pgKeyStatus"),
  };

  const gateway = createGithubGateway({ owner: OWNER, repo: NAME });
  const cfgEl = byId("pgConfig");
  const cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  const base = cfg.base || "/";
  const repo = cfg.repo || OWNER + "/" + NAME;

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
  let hasRun = false;
  let tickTimer = null;
  let pollTimer = null;
  let stopped = false;
  let eventProbesLeft = EVENT_PROBES;

  /** The last derived view, kept so a frame write or a re-measure has something to draw. */
  let view = deriveProgress(null, { now: new Date(), published: false });
  let page = "empty";
  let noteState = "monitoring";
  let openQuestions = [];

  // Owner state. `owner` is a UI gate only — the Worker re-checks the key on every request, so a
  // visitor who flips this in a console gets 401s, not access.
  let owner = false;
  let sending = false;
  /** id → the answer being drafted, kept OUTSIDE the render so a poll tick can't wipe typing. */
  const answers = new Map();
  let renderedQuestionKey = "";

  // Every string that reaches the DOM below comes from a ledger the pipeline wrote, so it is
  // trusted-ish — but it is still content this page did not author, and innerHTML on it would
  // make a stray "<" in a venue name a rendering bug at best. Build nodes, set textContent.
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ── The route map ────────────────────────────────────────────────────────────────────── */

  const reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: null };
  /** Arc length of the drawn path. The browser's own measurement when it can give one (exact),
   *  the pure sampler when the SVG is detached or display:none and getTotalLength() returns 0. */
  let routeLen = 0;
  /** Where the plane is drawn, in Bézier parameter. Eases toward `targetT` a frame at a time. */
  let shownT = 0;
  let targetT = 0;
  let rafId = 0;

  function measureRoute() {
    if (!els.routeFlown) return;
    var measured = typeof els.routeFlown.getTotalLength === "function" ? els.routeFlown.getTotalLength() : 0;
    routeLen = measured > 0 ? measured : bezierLength();
  }

  /** The one place the plane and the flown line are written — always together, always from the
   *  same `t`, so the nose can never point along a stretch the line hasn't reached. */
  function writeFrame(t) {
    if (!routeLen) measureRoute();
    var clamped = clamp01(t);
    var drawn = routeLen * arcLengthFraction(clamped);
    [els.routeFlown, els.routeGlow].forEach(function (path) {
      if (!path) return;
      path.style.strokeDasharray = routeLen;
      path.style.strokeDashoffset = routeLen - drawn;
    });
    if (els.plane) {
      var p = bezierPoint(clamped);
      els.plane.setAttribute(
        "transform",
        "translate(" + p[0].toFixed(2) + "," + p[1].toFixed(2) + ") rotate(" + bezierAngle(clamped).toFixed(2) + ")",
      );
    }
  }

  function frame() {
    rafId = 0;
    // Deliberately NOT gated on `stopped`: polling stops the moment a run finishes, and the
    // plane still has a last glide into its final station to complete. The loop ends itself
    // (below) once there is nothing left to move.
    if (document.hidden) return;
    var live = page === "running" || page === "awaiting";
    // Damped easing toward the last cleared station, plus a sub-pixel sway — and the sway has
    // ZERO amplitude unless a run is actually live, because a plane that keeps breathing over a
    // finished or stalled run is the page inventing activity.
    shownT = dampToward(shownT, targetT);
    writeFrame(shownT + (live ? planeDrift(Date.now()) : 0));
    // Keep the loop alive only while there is something to animate. Settling within a
    // sub-pixel of the target and going quiet is the difference between a live surface and a
    // page that burns a phone battery drawing the same frame forever.
    if (live || Math.abs(targetT - shownT) > 0.0005) rafId = requestAnimationFrame(frame);
  }

  function syncPlane() {
    var doneCount = view.stages.filter(function (s) { return s.done; }).length;
    // The plane sits at the last station the pipeline actually cleared. Interpolating toward the
    // NEXT one would be animating a guess: the run reports at stage boundaries and nowhere else.
    targetT = doneCount === 0 ? 0 : STATION_T[doneCount - 1];
    // The plane's empty-state ghosting is CSS off the page's own data-state — nothing to write
    // here. (It cannot use the `hidden` property either way: this is an SVG <g>.)
    if (els.route) els.route.setAttribute("data-live", page === "running" || page === "awaiting" ? "1" : "0");

    if (reduceMotion.matches) {
      // It cuts, it does not soften: jump to the finished frame and never schedule a loop.
      shownT = targetT;
      writeFrame(shownT);
      return;
    }
    // A synchronous frame on every state change, so a tab that was hidden (where rAF never
    // fires) is correct the instant it is looked at rather than one animation-frame later.
    writeFrame(shownT);
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function renderStations() {
    if (!els.stations) return;
    // With no run attached, EVERY station is "todo". deriveProgress still reports a currentIndex
    // of 0 (a view of nothing has to start somewhere), and painting that station accent-filled
    // would claim scaffolding is under way when nothing has been asked for — the colour version
    // of the pulse-over-a-dead-run lie motion.md names.
    var noRun = page === "empty";
    var nodes = els.stations.querySelectorAll(".pg-station");
    for (var i = 0; i < nodes.length; i++) {
      var stage = view.stages[i];
      nodes[i].setAttribute(
        "data-state",
        noRun || !stage ? "todo" : stage.done ? "done" : i === view.currentIndex ? "current" : "todo",
      );
    }
  }

  /* ── Text equivalents ─────────────────────────────────────────────────────────────────── */

  function renderSteps() {
    // Nodes, never innerHTML — same rule as the question cards below. The labels are this
    // file's own constants today, which is exactly how an innerHTML template survives long
    // enough to meet a label that isn't.
    if (!els.steps) return;
    var noRun = page === "empty";
    els.steps.textContent = "";
    view.stages.forEach(function (s, i) {
      var state = noRun ? "not started" : s.done ? "cleared" : i === view.currentIndex ? "under way" : "not started";
      els.steps.appendChild(el("li", null, s.label + " — " + state));
    });
    if (els.routeAlt) {
      var doneCount = view.stages.filter(function (x) { return x.done; }).length;
      var current = view.stages[view.currentIndex];
      // Same honesty as the dots above: the text equivalent must not report a stage "currently"
      // under way for a page nobody has attached a run to.
      els.routeAlt.textContent = noRun
        ? "Six research stages plotted along a flight path. No run attached, so none of them has started."
        : "Six research stages plotted along a flight path. " + doneCount + " of " + view.stages.length +
          " cleared" + (current ? ", currently " + STAGE_SHORT[current.key] : "") + ".";
    }
  }

  function renderTick() {
    // Ticks from page-load time even before the first state fetch resolves — startedAt gets
    // corrected to the real createdAt the moment a state file is actually found (see poll()),
    // so the timer feels alive immediately instead of frozen at 0s during the initial wait.
    if (els.timer) els.timer.textContent = formatElapsed(Date.now() - startedAt);
  }

  /* ── Phases ───────────────────────────────────────────────────────────────────────────── */

  function renderPhases() {
    if (!els.phases) return;
    var built = derivePhases(page, view);
    // Rebuild only when the shape changes; otherwise write the fill so the bar transitions
    // rather than snapping back from a fresh node.
    if (els.phases.children.length !== built.length) {
      els.phases.textContent = "";
      built.forEach(function (p) {
        var wrap = el("div", "pg-phase");
        wrap.dataset.phase = p.key;
        var top = el("div", "pg-phase-top");
        top.appendChild(el("span", "pg-phase-label", p.label));
        top.appendChild(el("span", "pg-phase-status"));
        var track = el("div", "pg-phase-track");
        track.appendChild(el("div", "pg-phase-fill"));
        wrap.appendChild(top);
        wrap.appendChild(track);
        wrap.appendChild(el("p", "pg-phase-blurb", p.blurb));
        els.phases.appendChild(wrap);
      });
    }
    built.forEach(function (p, i) {
      var wrap = els.phases.children[i];
      if (!wrap) return;
      wrap.setAttribute("data-tone", p.status === "cleared" ? "green" : p.status === "active" ? "accent" : "muted");
      wrap.querySelector(".pg-phase-status").textContent = PHASE_STATUS_LABEL[p.status];
      wrap.querySelector(".pg-phase-fill").style.setProperty("--pg-fill", p.fill.toFixed(3));
    });
  }

  /* ── Live telemetry panels ────────────────────────────────────────────────────────────── */

  /** Renders whatever the run reported — and, when it reported nothing, leaves the honest-empty
   *  copy the markup already carries rather than substituting anything invented. */
  function renderEvents(events) {
    var live = !!events && events.available;
    if (els.fetchDot) els.fetchDot.hidden = !(live && page === "running");
    if (els.fetchEmpty) els.fetchEmpty.hidden = live && events.fetches.length > 0;
    if (els.judgeEmpty) els.judgeEmpty.hidden = live && events.decisions.length > 0;
    if (els.nugEmpty) els.nugEmpty.hidden = live && events.nuggets.length > 0;
    if (els.statsNote) els.statsNote.hidden = !!(live && events.counters);

    if (els.fetchList) {
      els.fetchList.textContent = "";
      (live ? events.fetches : []).forEach(function (f) {
        var row = el("li", "pg-log-row");
        row.setAttribute("data-tone", fetchTone(f.status));
        var host = el("span", "pg-log-host", fetchHost(f.url));
        host.title = f.url;
        row.appendChild(host);
        row.appendChild(el("span", "pg-log-status", f.status ? String(f.status) : "—"));
        els.fetchList.appendChild(row);
      });
      els.fetchList.scrollTop = els.fetchList.scrollHeight;
    }

    if (els.judgeList) {
      els.judgeList.textContent = "";
      (live ? events.decisions : []).forEach(function (d) {
        var row = el("li", "pg-log-row pg-log-row--judge");
        row.setAttribute("data-tone", d.kind === "reject" ? "warn" : d.kind === "decision" ? "accent" : "green");
        row.appendChild(el("span", "pg-log-kind", d.kind === "reject" ? "dropped" : d.kind === "decision" ? "call" : "checked"));
        row.appendChild(el("span", "pg-log-text", d.text));
        els.judgeList.appendChild(row);
      });
    }

    if (els.nugList) {
      els.nugList.textContent = "";
      (live ? events.nuggets : []).forEach(function (n) {
        var item = el("li", "pg-nug");
        item.appendChild(el("p", "pg-nug-text", n.text));
        item.appendChild(el("p", "pg-nug-src", n.source));
        els.nugList.appendChild(item);
      });
    }

    var counters = live ? events.counters : null;
    ["pages", "facts", "kept", "dropped"].forEach(function (key) {
      var node = els.stats[key];
      // An em dash, not a zero: "nothing reported" and "reported zero" are different claims.
      if (node) node.textContent = counters ? String(counters[key]) : "—";
    });
  }

  /* ── The note panel ───────────────────────────────────────────────────────────────────── */

  function renderNotePanel() {
    if (!els.note) return;
    var panel = deriveNotePanel(page, noteState);
    els.note.setAttribute("data-tone", panel.tone);
    if (els.noteHead) els.noteHead.textContent = panel.heading;
    if (els.notePlaceholder) {
      els.notePlaceholder.hidden = panel.placeholder == null;
      if (panel.placeholder) els.notePlaceholder.textContent = panel.placeholder;
    }
    // The stalled state has no endpoint to offer, so it points at the thing that DOES carry the
    // last word: the run's own issue. A search href rather than a number, because state.json
    // never records which issue started the run.
    if (els.noteIssue) {
      els.noteIssue.hidden = page !== "stalled";
      els.noteIssue.href =
        "https://github.com/" + repo + "/issues?q=" + encodeURIComponent("is:issue " + (slug || ""));
    }
    if (els.noteLive) els.noteLive.hidden = !panel.acceptsInput;
    if (els.qSend) els.qSend.hidden = !panel.acceptsInput || !owner;
  }

  /* ── Decision points (questions + blocking forks) ─────────────────────────────────────── */

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
    // The escape hatch: a non-blocking question already has a default the run will take, so
    // "that's fine" has to be one tap and not a retyping of the assumption.
    if (q.assumption && !q.blocking) {
      var accept = el("button", "pg-q-accept", "Accept the assumption");
      accept.type = "button";
      accept.addEventListener("click", function () {
        answers.set(q.id, q.assumption);
        input.value = q.assumption;
        syncSend();
      });
      wrap.appendChild(accept);
    }
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

  function renderQuestions() {
    if (!els.qList) return;
    if (!openQuestions.length) { renderedQuestionKey = ""; els.qList.textContent = ""; return; }

    // Rebuild ONLY when the set of open questions actually changes. A poll tick every 15s that
    // replaced these nodes would throw away half-typed answers and drop keyboard focus to
    // <body> mid-sentence — the same trap the change-request chips document.
    var key = openQuestions.map(function (q) { return q.id + ":" + q.status; }).join("|") + "|" + (owner ? "o" : "-");
    if (key !== renderedQuestionKey) {
      renderedQuestionKey = key;
      els.qList.textContent = "";
      openQuestions.forEach(function (q) { els.qList.appendChild(renderQuestionCard(q)); });
    }
    syncSend();
  }

  function sendAnswers() {
    var payload = buildAnswerPayload(slug, draftEntries());
    if (!payload.answers.length || sending) return;
    sending = true;
    noteState = "processing";
    renderNotePanel();
    syncSend();
    if (els.qStatus) els.qStatus.textContent = "Sending…";
    createWorkerGateway({ ownerKey: readOwnerKey() }).sendAnswers(payload).then(function (res) {
      sending = false;
      if (res.ok) {
        answers.clear();
        renderedQuestionKey = "";
        noteState = "resumed";
        if (els.qStatus) els.qStatus.textContent = "Answer sent — the guide will absorb it.";
        // Back to watching after the confirmation has been read. The run itself is what clears
        // the question; this only stops the panel claiming a send is still in flight.
        setTimeout(function () { noteState = "monitoring"; renderNotePanel(); }, 3000);
      } else {
        noteState = "awaiting";
        if (els.qStatus) els.qStatus.textContent = res.message;
      }
      renderNotePanel();
      syncSend();
    });
  }

  /* ── Revision proposals (owner only) ──────────────────────────────────────────────────── */

  function renderProposals(list) {
    if (!els.pList || !els.proposals) return;
    if (!owner || !list.length) { els.proposals.hidden = true; return; }
    els.proposals.hidden = false;
    els.pList.textContent = "";
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

  /* ── "Tell me when it's done" ─────────────────────────────────────────────────────────── */

  const BASE_TITLE = document.title;
  /** Exactly two things are worth interrupting someone for: the guide is ready, and the run
   *  cannot continue without them. Each fires at most once per page load, and never for a state
   *  the page was ALREADY in when it loaded — a notification about something that happened
   *  before you opened the tab is noise. */
  const notified = { done: false, awaiting: false };
  let notifyArmed = false;
  /** The page state the last render painted, and whether a transition out of it is worth
   *  announcing. Both reset on a slug change: opening a page whose run is ALREADY finished is
   *  not news, so the first poll-driven render only records where things stand. */
  let priorPage = null;
  let announceReady = false;

  function badgeTitle(on) {
    document.title = on ? "● " + BASE_TITLE : BASE_TITLE;
  }

  function announce(kind, body) {
    if (notified[kind]) return;
    notified[kind] = true;
    // The title badge is the fallback that always works — no permission, no API, and visible
    // the moment the tab is glanced at.
    if (document.hidden) badgeTitle(true);
    if (!notifyArmed || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      new Notification("Waypoint — " + (slug || "your guide"), { body: body, tag: "wp-" + kind });
    } catch (e) { /* some browsers reject constructed notifications outside a service worker */ }
  }

  function initNotify() {
    if (!els.notifyBtn) return;
    if (typeof Notification === "undefined") {
      els.notifyBtn.hidden = true;
      if (els.notifyStatus) {
        els.notifyStatus.textContent = "This browser can't send notifications — leave the tab open and its title will change instead.";
      }
      return;
    }
    if (Notification.permission === "granted") {
      notifyArmed = true;
      els.notifyBtn.hidden = true;
      if (els.notifyStatus) els.notifyStatus.textContent = "You'll get one notification when it's ready.";
      return;
    }
    if (Notification.permission === "denied") {
      els.notifyBtn.hidden = true;
      if (els.notifyStatus) els.notifyStatus.textContent = "Notifications are blocked for this site — the tab's title will change instead.";
      return;
    }
    // Asked ONCE, and only from the button's own gesture: a permission prompt on page load is
    // the thing everyone denies reflexively, which then blocks it permanently.
    els.notifyBtn.addEventListener("click", function () {
      els.notifyBtn.disabled = true;
      Promise.resolve(Notification.requestPermission()).then(function (perm) {
        notifyArmed = perm === "granted";
        els.notifyBtn.hidden = notifyArmed;
        els.notifyBtn.disabled = false;
        if (els.notifyStatus) {
          els.notifyStatus.textContent = notifyArmed
            ? "You'll get one notification when it's ready."
            : "No problem — the tab's title will change instead.";
        }
      });
    });
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

  /* ── Render ───────────────────────────────────────────────────────────────────────────── */

  function render() {
    page = derivePageState({ view: view, hasRun: hasRun, openQuestions: openQuestions.length });
    if (page !== "awaiting" && noteState === "awaiting") noteState = "monitoring";
    if (page === "awaiting" && noteState === "monitoring") noteState = "awaiting";

    if (els.main) els.main.setAttribute("data-state", page);
    var pill = deriveStatusPill(page, view);
    if (els.pill) {
      els.pill.textContent = pill.text;
      els.pill.setAttribute("data-tone", pill.tone);
    }
    if (els.line) els.line.textContent = deriveProgressLine(page, view);

    renderSteps();
    renderStations();
    renderPhases();
    renderQuestions();
    renderNotePanel();
    syncPlane();

    if (els.done) els.done.hidden = page !== "done";
    if (page === "done" && els.doneLink) {
      els.doneLink.href = base.replace(/\/$/, "") + "/guides/" + slug + "/";
    }

    if (announceReady && page !== priorPage) {
      if (page === "done") announce("done", "Your guide is ready to read.");
      else if (page === "awaiting") announce("awaiting", "The research needs one answer before it can carry on.");
    }
    priorPage = page;
    announceReady = true;

    if (page === "done") stop();
  }

  async function poll() {
    if (stopped) return;
    const wantEvents = eventProbesLeft > 0;
    const [state, published, questions, events] = await Promise.all([
      gateway.fetchState(slug),
      gateway.isPublished(slug),
      gateway.fetchQuestions(slug),
      wantEvents ? gateway.fetchRunEvents(slug) : Promise.resolve(null),
    ]);

    if (wantEvents) {
      if (events && events.available) eventProbesLeft = EVENT_PROBES;
      else eventProbesLeft -= 1;
      renderEvents(events);
    }

    if (state) {
      if (!lastState) startedAt = new Date(state.createdAt).getTime();
      lastState = state;
      hasRun = true;
      if (els.correction) els.correction.hidden = true;
    } else if (guessed && Date.now() - startedAt > GUESS_GRACE_MS) {
      // The guessed slug never resolved within a generous grace window — likely a same-name
      // collision picked a different slug server-side. Offer the manual correction rather than
      // polling a dead guess forever.
      if (els.correction) els.correction.hidden = false;
    }
    openQuestions = questions.filter(function (q) { return q.status === "open"; });
    // Render even when state is still null — deriveProgress(null, …) is a valid "nothing
    // cleared yet" view, so the map shows what's COMING immediately, not a blank panel while
    // waiting for the very first successful fetch.
    view = deriveProgress(state, { now: new Date(), published: published });
    render();
  }

  function start() {
    if (!slug) {
      if (els.correction) els.correction.hidden = false;
      render();
      return;
    }
    if (els.slugLabel) els.slugLabel.textContent = slug;
    renderTick();
    // No pre-poll render: the server-rendered markup already says "No run yet" honestly, and
    // rendering "empty" here would make the first real state look like a transition INTO it.
    poll();
    loadProposals();
    pollTimer = setInterval(poll, POLL_MS);
    tickTimer = setInterval(renderTick, TICK_MS);
  }

  function stop() {
    stopped = true;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
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
      hasRun = false;
      priorPage = null;
      announceReady = false;
      eventProbesLeft = EVENT_PROBES;
      startedAt = Date.now();
      history.replaceState(null, "", location.pathname + "?slug=" + encodeURIComponent(slug));
      start();
    });
  }

  measureRoute();
  renderEvents(null);
  initNotify();
  initKeyPanel();
  start();

  // The route has no intrinsic pixel size until it is laid out, so its length has to be
  // re-measured whenever the box it lives in changes — a rotation, a font load, or a container
  // query flipping the grid all change it, and a stale length draws the flown line to the wrong
  // place. Cheap, and only while a run is live.
  if (typeof ResizeObserver === "function" && els.route) {
    new ResizeObserver(function () {
      measureRoute();
      writeFrame(shownT);
    }).observe(els.route);
  }
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", syncPlane);
  }

  // Stop polling a hidden/backgrounded tab — resumes on the next visibility change instead of
  // burning a request every 15s while nobody's watching. rAF is already suspended by the
  // browser there, so the frame it would have drawn is written synchronously on the way back.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      return;
    }
    badgeTitle(false);
    measureRoute();
    syncPlane();
    if (!stopped && slug && !pollTimer) {
      poll();
      pollTimer = setInterval(poll, POLL_MS);
    }
  });
}
