/* Waypoint intake — the SUBMIT seam, extracted from the retired new-guide-modal.js
   (R4, 2026-08-05: the intake moved from the hub's 440px modal to the /new page; the
   modal shell — open/close/backdrop/focus-trap — died with the modal, the submit
   machinery did not change by one key). Two paths, exactly as before:
     · ZERO-CLICK — backend configured (src/lib/backend-config.js): POST the intake to
       the Worker, which files the record; then this tab goes to the progress tracker.
       The traveler never sees GitHub on this path.
     · FALLBACK — backend off or failed: prefilled GitHub issue. `afterAwait` is still
       load-bearing (post-await window.open dies silently to popup blockers — Boundary
       Checks #2 caught that in W-series; navigate THIS tab instead).

   Batch 3 moved the config out of this silo to src/lib/backend-config.js (three features
   share it now) and put the bytes-on-the-wire in src/lib/worker-client.js. The two paths,
   the field ids and the fallback semantics are unchanged. */

import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { postToWorker } from "../../../lib/worker-client.js";

// Best-effort slug guess, mirroring scaffold-guide.mjs's slugify (a collision gets "-2"
// server-side; the bot's issue comment carries the authoritative link either way).
export function guessSlug(country) {
  return country.normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "guide";
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

// Collect the intake by ISSUE-FORM field id — the exact keys renderIssueBody / the GitHub
// issue template consume, so the proxy and the fallback file identical issues. UNCHANGED
// from the modal era; this object IS the pipeline seam.
function collectRaw(country) {
  return {
    country,
    cities: val("ngCities"),
    dates: [val("ngStart"), val("ngEnd")].filter(Boolean).join(" to "),
    "dates-certainty": val("ngDatesCertainty"),
    "departure-airport": val("ngDepartureAirport"),
    anchor: val("ngAnchor"),
    "anchor-certainty": val("ngAnchorCertainty"),
    travelers: val("ngTravelers"),
    party: val("ngParty"),
    constraints: val("ngConstraints"),
    "passport-countries": val("ngPassports"),
    pace: val("ngPace"),
    "travel-style": val("ngTravelStyle"),
    priority1: val("ngPriority1"),
    priority2: val("ngPriority2"),
    priority3: val("ngPriority3"),
    niche: val("ngNiche"),
    budget: val("ngBudget"),
    "budget-certainty": val("ngBudgetCertainty"),
    comments: val("ngComments"),
  };
}

/** Wire the /new page's form. `repo` comes from the form's data-repo attribute. */
export function initIntakeSubmit(form, errEl) {
  const base = document.body.getAttribute("data-base") || "";
  const repo = form.getAttribute("data-repo");

  function toProgress(country, slug) {
    location.href = base + "/progress/?slug=" + encodeURIComponent(slug || guessSlug(country)) +
      "&country=" + encodeURIComponent(country);
  }

  function githubIssueUrl(raw, country) {
    const params = new URLSearchParams();
    params.set("template", "new-guide.yml");
    params.set("labels", "new-guide");
    params.set("title", "New guide: " + country);
    for (const [k, v] of Object.entries(raw)) params.set(k, v);
    return "https://github.com/" + repo + "/issues/new?" + params.toString();
  }

  function fallbackToGitHub(raw, country, afterAwait) {
    const url = githubIssueUrl(raw, country);
    if (afterAwait) { location.href = url; return; }
    window.open(url, "_blank", "noopener");
    toProgress(country);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const country = val("ngCountry");
    if (!country) {
      if (errEl) { errEl.textContent = "Country is required."; errEl.removeAttribute("hidden"); }
      return;
    }
    const raw = collectRaw(country);

    let proxyTried = false;
    if (WAYPOINT_BACKEND.url) {
      proxyTried = true;
      // Never throws (worker-client resolves a result either way), so a backend that is down
      // still falls through to the GitHub path and the traveler still succeeds.
      const res = await postToWorker("intake", raw);
      if (res.ok) {
        toProgress(country, res.data.slug);
        return;
      }
    }
    fallbackToGitHub(raw, country, proxyTried);
  });
}
