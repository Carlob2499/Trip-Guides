/* New Guide pipeline progress tracker — the "tangible viewing progress" surface. Reads ?slug=
   from the URL (set by index.astro right after the New-guide form opens the GitHub issue tab —
   see its inline script), polls the injectable gateway (real impl: raw.githubusercontent.com,
   no auth, no backend) for scripts/pipeline.mjs's own checkpoint state, and renders a live
   elapsed timer + a step-by-step checklist. All data access goes through ../gateway.ts (never
   `fetch` a GitHub URL directly here) so this file only renders and schedules polls.

   The slug in the URL is a CLIENT-SIDE GUESS (predictSlug mirrors scaffold-guide.mjs's
   slugify()) — a same-name collision appends "-2" server-side, which this can't predict. If the
   guess never resolves, a manual correction input lets the visitor paste the real slug from
   their GitHub issue-confirmation comment (which always carries a `?slug=` progress link built
   from the REAL slug — see new-guide.yml). Honest-by-design: never claim progress for a guide
   this can't actually find. */
import { deriveProgress, formatElapsed, predictSlug, STAGE_ORDER, createGithubGateway } from "../index";

const REPO = "Carlob2499/Trip-Guides";
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
  };

  const gateway = createGithubGateway({ owner: OWNER, repo: NAME });
  const cfgEl = document.getElementById("pgConfig");
  const cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  const base = cfg.base || "/";

  const params = new URLSearchParams(location.search);
  let slug = (params.get("slug") || "").trim().toLowerCase();
  let guessed = !slug && !!params.get("country");
  if (!slug && params.get("country")) slug = predictSlug(params.get("country"));

  let startedAt = Date.now();
  let lastState = null;
  let tickTimer = null;
  let pollTimer = null;
  let stopped = false;

  function renderSteps(view) {
    els.steps.innerHTML = "";
    view.stages.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "pg-step" + (s.done ? " is-done" : i === view.currentIndex ? " is-current" : "");
      li.innerHTML =
        '<span class="pg-step-icon" aria-hidden="true">' + (s.done ? "✓" : i === view.currentIndex ? "●" : "○") + "</span>" +
        '<span class="pg-step-label">' + s.label + "</span>";
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
    els.bar.style.width = view.percent + "%";
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

  async function poll() {
    if (stopped) return;
    const [state, published] = await Promise.all([gateway.fetchState(slug), gateway.isPublished(slug)]);

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
    pollTimer = setInterval(poll, POLL_MS);
    tickTimer = setInterval(renderTick, TICK_MS);
  }

  function stop() {
    stopped = true;
    if (pollTimer) clearInterval(pollTimer);
    if (tickTimer) clearInterval(tickTimer);
  }

  if (els.form) {
    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      const typed = (els.input.value || "").trim().toLowerCase();
      if (!typed) return;
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
