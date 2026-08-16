/* The owner's triage queue (/progress/triage/) — DOM wiring. Every decision lives in
   ../model/triage.ts.

   OWNER-ONLY, and gated the same way every other maker control is: a key stored in this browser
   plus a configured backend. Without both, the queue never renders and the page says why. The
   Worker re-checks the key server-side, so this gate is about not showing someone a wall of
   buttons that can only 401.

   NOT reachable from traveller navigation. Its one entry point is the /change/ page's segmented
   control, whose second half is itself unhidden only when a key is stored (ui/change-page.js).

   The "started" marks are SESSION state, deliberately. They record what this browser sent in the
   last few minutes — which is exactly what the dispatch line claims — and nothing more. Persisting
   them would make the page assert days later that a run is "under way" with no way to know whether
   it finished, failed or was reverted. */

import {
  toRequestCards,
  toProposalCards,
  mergeQueue,
  buildTriagePayload,
  suggestionLine,
  dispatchNote,
  queueCountLine,
  STARTED_STAMP,
  STARTED_NOTE,
  WAITING_STAMP,
  PROPOSAL_NOTE,
  NO_SLUG_NOTE,
  QUEUE_EMPTY,
  QUEUE_UNREAD,
  QUEUE_LOCKED,
  LOAD_FAILED,
} from "../model/triage";
import { CATEGORY_LABEL, CATEGORY_TONE } from "../model/advisory";
import { createChangeGateway, createTriageGateway } from "../gateway.js";
import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { readOwnerKey } from "../../../scripts/owner-key.js";
/* The neighbour silo, through its PUBLIC surface — never into its ui/ or model/. That is the
   sealed-silo rule's one permitted door, and the proposal read and the /approve write behind it are
   already real, already wired and already tested; a second copy of either here would be a second
   thing to keep true (docs/archive/INDEX.md → PLAN_PIPELINE_SURFACES, Reconciliation 2: reused
   as-is).

   LAZY on purpose. Importing that index at module scope pulls the whole progress-page module in
   with it (~24KB), and because this file is exported from the same feature index as initChangePage,
   a static import put all of it on /change/ — a page every requester reaches and which never
   triages anything. import() makes it a split chunk instead: fetched when the queue actually reads,
   which is to say only after the owner gate above has already passed. */
const pipelineProgress = () => import("../../pipeline-progress/index");

/** The prototype staggers the first four arrivals and lets the rest paint together. Past four the
    stagger stops reading as sequence and starts reading as lag. */
const STAGGER_MAX = 4;
const STAGGER_MS = 45;

export function initTriagePage() {
  const root = document.getElementById("cpTriageRoot");
  const cfgEl = document.getElementById("cpTriageConfig");
  if (!root || !cfgEl) return;

  let cfg;
  try {
    cfg = JSON.parse(cfgEl.textContent || "{}");
  } catch (_) {
    return; // a malformed config leaves the server-rendered page exactly as it is
  }

  const guides = cfg.guides || [];
  const owner = cfg.owner || "";
  const repo = cfg.repo || "";

  const elGate = root.querySelector("[data-cp-tri-gate]");
  const elQueue = root.querySelector("[data-cp-tri-queue]");
  const elCount = root.querySelector("[data-cp-tri-count]");
  const elList = root.querySelector("[data-cp-tri-list]");
  const elEmpty = root.querySelector("[data-cp-tri-empty]");
  const elDispatch = root.querySelector("[data-cp-tri-dispatch]");

  const isOwner = !!WAYPOINT_BACKEND.url && !!readOwnerKey();
  if (!isOwner) {
    if (elGate) { elGate.textContent = QUEUE_LOCKED; elGate.hidden = false; }
    return;
  }
  if (elGate) elGate.hidden = true;
  if (elQueue) elQueue.hidden = false;

  /* Cards this browser has started, by key. Session-scoped on purpose (see the header). */
  const started = new Map();

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderDispatch() {
    if (!elDispatch) return;
    elDispatch.textContent = dispatchNote(started.size);
    // Green only once something really is under way — the bar is the one place on this page that
    // reports state rather than offering a decision.
    elDispatch.setAttribute("data-live", String(started.size > 0));
  }

  /* ── One card ─────────────────────────────────────────────────────────────────────────── */

  function buildCard(card, index) {
    const article = el("article", "cp-tri");
    article.setAttribute("data-started", "false");
    if (card.category) article.setAttribute("data-tone", CATEGORY_TONE[card.category]);

    const stripe = el("span", "cp-tri-stripe");
    stripe.setAttribute("aria-hidden", "true");
    article.appendChild(stripe);

    const body = el("div", "cp-tri-body");

    const top = el("div", "cp-tri-top");
    if (card.category) top.appendChild(el("span", "cp-cat", CATEGORY_LABEL[card.category]));
    const stamp = el("span", "cp-tri-stamp", WAITING_STAMP);
    top.appendChild(stamp);
    body.appendChild(top);

    body.appendChild(el("h2", "cp-tri-title", card.title));
    body.appendChild(el("p", "cp-tri-who", card.who));
    // The requester's own words, verbatim and unstyled beyond the reading scale. Paraphrasing the
    // one piece of primary evidence on the card would defeat the card.
    body.appendChild(el("p", "cp-tri-words", card.body));

    const foot = el("div", "cp-tri-foot");
    const status = el("p", "cp-tri-status");
    status.setAttribute("role", "status");

    if (!card.slug) {
      // Nothing to POST a slug with, so no buttons: a control that can only fail is not a control.
      foot.appendChild(el("span", "cp-tri-suggest", NO_SLUG_NOTE));
    } else if (card.kind === "proposal") {
      // ONE button. POST /approve takes {slug, issue} and no text, so a "quick fix" and a "full
      // re-check" would send byte-identical payloads — two buttons offering one outcome.
      foot.appendChild(el("span", "cp-tri-suggest", PROPOSAL_NOTE));
      foot.appendChild(makeButton(card, "full", "Start the re-check", article, stamp, foot, status));
    } else {
      foot.appendChild(el("span", "cp-tri-suggest", suggestionLine(card.weight)));
      foot.appendChild(makeButton(card, "quick", "Quick fix", article, stamp, foot, status));
      foot.appendChild(makeButton(card, "full", "Full re-check", article, stamp, foot, status));
    }

    body.appendChild(foot);
    body.appendChild(status);
    article.appendChild(body);

    article.style.setProperty("--cp-tri-delay", Math.min(index, STAGGER_MAX) * STAGGER_MS + "ms");
    return article;
  }

  function makeButton(card, choice, label, article, stamp, foot, status) {
    const btn = el("button", "cp-tri-btn", label);
    btn.type = "button";
    btn.setAttribute("data-choice", choice);
    btn.addEventListener("click", () => {
      const buttons = foot.querySelectorAll(".cp-tri-btn");
      buttons.forEach((b) => { b.disabled = true; });
      status.textContent = "Starting…";

      send(card, choice).then((res) => {
        if (!res.ok) {
          buttons.forEach((b) => { b.disabled = false; });
          status.textContent = res.message;
          return;
        }
        buttons.forEach((b) => b.remove());
        article.setAttribute("data-started", "true");
        stamp.textContent = STARTED_STAMP[choice];
        status.textContent = STARTED_NOTE[card.kind];
        started.set(card.key, choice);
        renderDispatch();
        renderCount();
      });
    });
    return btn;
  }

  /** The two endpoints, one per card kind — see model/triage.ts for why they differ.
      Both gateways RESOLVE on failure rather than rejecting, so the only rejection to catch here is
      the lazy chunk itself failing to arrive; without that guard the button would sit on "Starting…"
      forever with nothing said. */
  function send(card, choice) {
    const ownerKey = readOwnerKey();
    if (card.kind === "proposal") {
      return pipelineProgress().then(
        ({ createWorkerGateway }) =>
          createWorkerGateway({ ownerKey }).approveRevision({ slug: card.slug, issue: card.issue }),
        () => ({ ok: false, message: LOAD_FAILED }),
      );
    }
    return createChangeGateway({ ownerKey }).submitChange(buildTriagePayload(card, choice));
  }

  /* ── The queue ────────────────────────────────────────────────────────────────────────── */

  let queue = [];

  function renderCount() {
    if (elCount) elCount.textContent = queueCountLine(queue.length - started.size);
  }

  function renderQueue(list, unread) {
    queue = list;
    if (!elList) return;
    elList.textContent = "";
    list.forEach((card, i) => elList.appendChild(buildCard(card, i)));
    if (elEmpty) {
      elEmpty.hidden = list.length > 0;
      elEmpty.textContent = unread ? QUEUE_UNREAD : QUEUE_EMPTY;
    }
    renderCount();
    renderDispatch();
  }

  /* Both populations, in parallel. Proposals are fetched PER GUIDE because that is the shape of
     the shipped reader — it slug-filters what the repo-wide label returns. With a handful of
     published guides that is a handful of requests, once, on an owner-only page; it is nowhere
     near a poll loop and nowhere near the unauthenticated hourly allowance. */
  function load() {
    const reads = createTriageGateway({ owner, repo });

    const requests = reads.fetchRequests();
    const proposals = pipelineProgress().then(
      ({ createGithubGateway }) => {
        const github = createGithubGateway({ owner, repo });
        return Promise.all(
          guides.map((g) =>
            github.fetchProposals(g.slug).then(
              (list) => toProposalCards(list, g.slug, guides),
              () => [],
            ),
          ),
        );
      },
      // The chunk never arrived. The request half of the queue is already loading and is worth
      // showing on its own, so this half simply contributes nothing rather than taking the page down.
      () => [],
    );

    Promise.all([requests, proposals]).then(([issues, proposalCards]) => {
      // null (not []) is "the read failed" — the empty line has to say something different then.
      const unread = issues === null;
      const requestCards = toRequestCards(issues || [], guides);
      renderQueue(mergeQueue(requestCards, ...proposalCards), unread);
    });
  }

  renderDispatch();
  load();
}
