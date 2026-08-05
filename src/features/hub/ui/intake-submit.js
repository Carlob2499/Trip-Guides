/* Waypoint intake — the SUBMIT seam, extracted from the retired new-guide-modal.js
   (R4, 2026-08-05: the intake moved from the hub's 440px modal to the /new page; the
   modal shell — open/close/backdrop/focus-trap — died with the modal, the submit
   machinery did not change by one key). Two paths, exactly as before:
     · ZERO-CLICK — intake proxy configured (intake-proxy-config.js): POST the intake to
       the Worker, which files the issue; then this tab goes to the progress tracker.
     · FALLBACK — proxy off or failed: prefilled GitHub issue. `afterAwait` is still
       load-bearing (post-await window.open dies silently to popup blockers — Boundary
       Checks #2 caught that in W-series; navigate THIS tab instead). */

import { INTAKE_PROXY } from "../intake-proxy-config.js";

// Best-effort slug guess, mirroring scaffold-guide.mjs's slugify (a collision gets "-2"
// server-side; the bot's issue comment carries the authoritative link either way).
export function guessSlug(country) {
  return country.normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "guide";
}

// Cloudflare Turnstile token if a site key is configured. Fully defensive: any hiccup
// resolves to "" so the caller falls through to the GitHub path rather than trapping
// the user — the Worker rejects a missing token only when ITS secret is set.
function getTurnstileToken(siteKey) {
  return new Promise(function (resolve) {
    if (!siteKey) return resolve("");
    let done = false;
    const finish = (t) => { if (!done) { done = true; resolve(t || ""); } };
    function run() {
      try {
        let el = document.getElementById("ngTurnstile");
        if (!el) { el = document.createElement("div"); el.id = "ngTurnstile"; el.style.display = "none"; document.body.appendChild(el); }
        const id = window.turnstile.render(el, {
          sitekey: siteKey, size: "invisible",
          callback: finish, "error-callback": () => finish(""),
        });
        window.turnstile.execute(id);
      } catch (_) { finish(""); }
    }
    if (window.turnstile) run();
    else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true; s.onload = run; s.onerror = () => finish("");
      document.head.appendChild(s);
    }
    setTimeout(() => finish(""), 8000);
  });
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

// Collect the intake by ISSUE-FORM field id — the exact keys renderIssueBody / the GitHub
// issue template consume, so the proxy and the fallback file identical issues. UNCHANGED
// from the modal era; this object IS the pipeline seam.
export function collectRaw(country) {
  return {
    country,
    cities: val("ngCities"),
    dates: [val("ngStart"), val("ngEnd")].filter(Boolean).join(" to "),
    anchor: val("ngAnchor"),
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
    if (INTAKE_PROXY.url) {
      proxyTried = true;
      try {
        const turnstileToken = await getTurnstileToken(INTAKE_PROXY.turnstileSiteKey);
        const res = await fetch(INTAKE_PROXY.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign({ turnstileToken }, raw)),
        });
        if (res.ok) {
          const data = await res.json();
          toProgress(country, data.slug);
          return;
        }
      } catch (_) {
        // network/proxy error — fall through to the GitHub path so the user still succeeds.
      }
    }
    fallbackToGitHub(raw, country, proxyTried);
  });
}
