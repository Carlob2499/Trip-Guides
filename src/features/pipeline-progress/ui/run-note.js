import { createGithubGateway } from "../gateway";
import { normalizeSlug, predictSlug } from "../model/progress";
import {
  createRunNoteWorkerGateway,
  resolveRunNoteTarget,
  runNoteFailureMessage,
} from "../run-note";
import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { readOwnerKey } from "../../../scripts/owner-key.js";

const OWNER = "Carlob2499";
const NAME = "Trip-Guides";
const NOTE_MAX = 2000;

function currentSlug() {
  const params = new URLSearchParams(location.search);
  const direct = normalizeSlug(params.get("slug"));
  if (direct) return direct;
  const country = params.get("country");
  return country ? predictSlug(country) : null;
}

function resolutionCopy(reason) {
  if (reason === "conflict") return "Two runs are active, so Waypoint will not guess which one should receive a note.";
  if (reason === "malformed") return "The run record is malformed. Nothing can be sent until the run state is repaired.";
  if (reason === "stale") return "The run changed. Refresh before sending a note.";
  if (reason === "network") return "Waypoint could not verify this run. Nothing was sent.";
  return "Owner notes are available only for a verified V2 run.";
}

/**
 * Attach the owner-only V2 note control to the existing Progress note panel.
 *
 * This module does not poll. The main Progress controller already owns polling, and adding another
 * unauthenticated GitHub request every 15 seconds just to discover an issue number would waste the
 * public API budget. We resolve on load/key/slug changes and re-resolve immediately before SEND.
 * The Worker then performs the same exact-run check independently before it writes anything.
 */
export function initRunNote() {
  const panel = document.getElementById("pgNote");
  if (!panel || panel.dataset.runNoteInit === "1") return;
  panel.dataset.runNoteInit = "1";

  const cfgEl = document.getElementById("pgConfig");
  let cfg = {};
  try { cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {}; } catch { cfg = {}; }
  const repoFull = String(cfg.repo || `${OWNER}/${NAME}`);
  const [ownerName = OWNER, repoName = NAME] = repoFull.split("/");
  const base = cfg.base || "/";
  const gateway = createGithubGateway({ owner: ownerName, repo: repoName, siteBase: base });

  const form = document.createElement("form");
  form.className = "pg-run-note";
  form.hidden = true;
  form.setAttribute("aria-labelledby", "pgRunNoteLabel");

  const label = document.createElement("label");
  label.id = "pgRunNoteLabel";
  label.className = "pg-key-label";
  label.htmlFor = "pgRunNoteText";
  label.textContent = "Note to this V2 run";

  const textarea = document.createElement("textarea");
  textarea.id = "pgRunNoteText";
  textarea.rows = 3;
  textarea.maxLength = NOTE_MAX;
  textarea.placeholder = "Add context for this exact research run…";
  textarea.autocomplete = "off";
  textarea.style.cssText = "display:block;width:100%;min-height:92px;margin:.45rem 0 .65rem;padding:.65rem .75rem;border:1px solid var(--rule);border-radius:0;background:var(--card);color:var(--ink);font:inherit;line-height:1.45;resize:vertical";

  const actions = document.createElement("div");
  actions.className = "pg-note-actions";
  const send = document.createElement("button");
  send.type = "submit";
  send.className = "pg-btn pg-btn--go";
  send.textContent = "Send note";
  const status = document.createElement("p");
  status.className = "pg-q-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  actions.append(send, status);
  form.append(label, textarea, actions);
  panel.appendChild(form);

  let target = null;
  let refreshEpoch = 0;
  let sending = false;

  function hide() {
    target = null;
    form.hidden = true;
    send.disabled = false;
  }

  async function refresh() {
    const epoch = ++refreshEpoch;
    status.textContent = "";
    if (!WAYPOINT_BACKEND.url || !readOwnerKey()) {
      hide();
      return;
    }
    const slug = currentSlug();
    if (!slug) {
      hide();
      return;
    }
    const resolved = await resolveRunNoteTarget({
      slug,
      gateway,
      owner: ownerName,
      repo: repoName,
    });
    if (epoch !== refreshEpoch) return;
    if (!resolved.ok) {
      hide();
      return;
    }
    target = resolved.target;
    form.hidden = false;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (sending) return;
    const note = textarea.value.trim();
    if (!note) {
      status.textContent = "Write a note first.";
      textarea.focus();
      return;
    }
    const slug = currentSlug();
    const ownerKey = readOwnerKey();
    if (!slug || !ownerKey) {
      status.textContent = "Owner key or run identity is missing. Nothing was sent.";
      hide();
      return;
    }

    sending = true;
    send.disabled = true;
    status.textContent = "Verifying this exact run…";
    const resolved = await resolveRunNoteTarget({
      slug,
      gateway,
      owner: ownerName,
      repo: repoName,
    });
    if (!resolved.ok) {
      status.textContent = resolutionCopy(resolved.reason);
      sending = false;
      send.disabled = false;
      if (resolved.reason !== "network") hide();
      return;
    }

    target = resolved.target;
    status.textContent = "Sending…";
    const worker = createRunNoteWorkerGateway({ ownerKey });
    const result = await worker.sendNote(target, note);
    if (result.ok) {
      textarea.value = "";
      status.textContent = "Note sent to this run.";
    } else {
      status.textContent = runNoteFailureMessage(result);
    }
    sending = false;
    send.disabled = false;
  });

  // These controls mutate key/URL state in the main Progress controller. Listen AFTER its own
  // handler and refresh on the next task, so `history.replaceState()` and key storage are already
  // complete before we derive the new target.
  ["pgKeyForm", "pgSlugForm"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("submit", function () { setTimeout(refresh, 0); });
  });
  const keyClear = document.getElementById("pgKeyClear");
  if (keyClear) keyClear.addEventListener("click", function () { setTimeout(refresh, 0); });
  window.addEventListener("popstate", refresh);
  window.addEventListener("online", refresh);

  refresh();
}
