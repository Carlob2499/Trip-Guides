/* Waypoint hub — the "Make a new guide" modal: open/close/backdrop/Escape/focus-trap, and
   the submit handler. Two submit paths:
     · ZERO-CLICK (W5) — when the Cloudflare intake proxy is configured (intake-proxy-config.js),
       POST the intake straight to the Worker, which files the issue for the visitor (no GitHub
       account, no click), then send this tab to the progress tracker.
     · FALLBACK — proxy not configured, or its request failed: open a prefilled GitHub issue in a
       new tab (the one-click path) exactly as before, then send this tab to the tracker.
   The FALLBACK is the original behavior; the zero-click path is pure progressive enhancement.

   A2: extracted from an `is:inline define:vars={{ base }}` script in index.astro. `base` (the
   site's BASE_URL) is read from `document.body.dataset.base`. */

import { trapFocus } from "../../../scripts/util.js";
import { INTAKE_PROXY } from "../intake-proxy-config.js";

// Best-effort slug guess, mirroring scaffold-guide.mjs's slugify (a collision gets "-2"
// server-side; the bot's issue comment carries the authoritative link either way).
function guessSlug(country) {
  return country.normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "guide";
}

// Get a Cloudflare Turnstile token if a site key is configured. Fully defensive: any hiccup
// (script blocked, timeout, no key) resolves to "" so the caller falls through to the GitHub
// path rather than trapping the user — the Worker rejects a missing token only when ITS secret is
// set, and that rejection just triggers the same fallback.
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

export function initNewGuideModal() {
  const base = document.body.getAttribute("data-base") || "";
  const openBtn = document.getElementById("btnNewGuide");
  const modal = document.getElementById("ngModal");
  const backdrop = document.getElementById("ngBackdrop");
  const closeBtn = document.getElementById("ngClose");
  const form = document.getElementById("ngForm");
  const errEl = document.getElementById("ngErr");
  if (!openBtn || !modal) return;
  const repo = modal.getAttribute("data-repo");

  function openModal() {
    modal.removeAttribute("hidden");
    if (backdrop) backdrop.classList.add("open");
    const c = document.getElementById("ngCountry");
    if (c) c.focus();
  }
  function closeModal() {
    modal.setAttribute("hidden", "");
    if (backdrop) backdrop.classList.remove("open");
    openBtn.focus();
  }
  openBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
  });
  trapFocus(modal, function () { return !modal.hasAttribute("hidden"); });

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  // Collect the intake by ISSUE-FORM field id — the exact keys renderIssueBody / the GitHub issue
  // template consume, so the proxy and the fallback file identical issues.
  function collectRaw(country) {
    return {
      country,
      cities: val("ngCities"),
      dates: [val("ngStart"), val("ngEnd")].filter(Boolean).join(" to "),
      anchor: val("ngAnchor"),
      travelers: val("ngTravelers"),
      party: val("ngParty"),
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

  function toProgress(country, slug) {
    location.href = base + "/progress/?slug=" + encodeURIComponent(slug || guessSlug(country)) +
      "&country=" + encodeURIComponent(country);
  }

  // FALLBACK: prefilled GitHub issue in a new tab (the original one-click path).
  function fallbackToGitHub(raw, country) {
    const params = new URLSearchParams();
    params.set("template", "new-guide.yml");
    params.set("labels", "new-guide");
    params.set("title", "New guide: " + country);
    for (const [k, v] of Object.entries(raw)) params.set(k, v);
    window.open("https://github.com/" + repo + "/issues/new?" + params.toString(), "_blank", "noopener");
    closeModal();
    toProgress(country);
  }

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const country = val("ngCountry");
      if (!country) {
        if (errEl) { errEl.textContent = "Country is required."; errEl.removeAttribute("hidden"); }
        return;
      }
      const raw = collectRaw(country);

      // ZERO-CLICK: file via the Worker when configured. Any failure falls through to GitHub.
      if (INTAKE_PROXY.url) {
        try {
          const turnstileToken = await getTurnstileToken(INTAKE_PROXY.turnstileSiteKey);
          const res = await fetch(INTAKE_PROXY.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.assign({ turnstileToken }, raw)),
          });
          if (res.ok) {
            const data = await res.json();
            closeModal();
            toProgress(country, data.slug);
            return;
          }
        } catch (_) {
          // network/proxy error — fall through to the GitHub path so the user still succeeds.
        }
      }
      fallbackToGitHub(raw, country);
    });
  }
}
