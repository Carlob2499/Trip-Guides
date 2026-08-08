// Cover screen (README §1, D21) — the first thing a visitor sees, once per session.
// Auto-opens after 4200ms; any click or wheel opens it immediately. Dismissal: supporting
// elements fade, the wordmark FLIPs into the header's own wordmark, the globe flies in
// beneath (already zoomed on the most relevant trip), then a circular iris reveals the hub.
// Reduced motion collapses the whole sequence to a single cut (README "Reduced motion
// disables everything, it does not soften it").

import { reducedMotion } from "../../../scripts/util.js";

const AUTO_OPEN_MS = 4200;
const SESSION_KEY = "tg-atlas-cover-seen";
const FLY_DUR = 1700;
const IRIS_DELAY = 380;
const IRIS_DUR = 780;

export function initCover(root = document) {
  const cover = root.querySelector("[data-atlas-cover]");
  if (!cover) return;

  let seen = false;
  try { seen = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* storage unavailable */ }
  if (seen) { cover.remove(); return; }
  cover.setAttribute("data-open", "");
  // Native `autofocus` is a no-op while the element is `display:none` at parse time — focus
  // the one actionable control by hand once it's actually visible, so a keyboard/screen
  // reader user lands somewhere useful instead of having to guess the cover is there.
  cover.querySelector("[data-cover-cta]")?.focus();

  let dismissing = false;
  let autoOpenTimer = null;

  function markSeen() {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* storage unavailable */ }
  }

  function dismiss() {
    if (dismissing) return;
    dismissing = true;
    clearTimeout(autoOpenTimer);
    document.removeEventListener("keydown", onKeydown);
    markSeen();

    const finish = () => cover.remove();
    if (reducedMotion()) { finish(); return; }

    cover.style.pointerEvents = "none";

    // 1 — everything but the wordmark drops away
    cover.querySelectorAll("[data-cover-fade]").forEach((el, i) => {
      el.style.transition = "opacity .26s ease, transform .26s ease";
      el.style.transitionDelay = `${i * 30}ms`;
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
    });

    // 2 — the wordmark FLIPs into the header's wordmark
    const cw = cover.querySelector("[data-ref-coverword]");
    const hw = root.querySelector("[data-ref-headword]");
    if (cw && hw) {
      const a = cw.getBoundingClientRect(), b = hw.getBoundingClientRect();
      const s = b.height / a.height;
      const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      cw.style.transformOrigin = "center";
      cw.style.transition = "transform .62s cubic-bezier(.22,1,.36,1) .12s";
      cw.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
    }

    // 3 — the globe flies in beneath, already zoomed on the most relevant trip (content is
    // king: the slug comes from the same relevance-ordered "quick" pick the table view's
    // quick card uses, stamped onto the cover server-side). A no-op if the map hasn't
    // finished lazy-loading d3/topojson yet — flyIn() itself guards that.
    const map = root.querySelector("atlas-map");
    const flySlug = cover.dataset.flySlug;
    if (map && flySlug && typeof map.flyIn === "function") map.flyIn(flySlug, FLY_DUR);

    // 4 — the cover opens a circular iris from its centre
    const cx = cover.clientWidth / 2, cy = cover.clientHeight / 2;
    const maxR = Math.hypot(cx, cy) * 1.05;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0 - IRIS_DELAY) / IRIS_DUR));
      const r = ease(p) * maxR;
      const mask = `radial-gradient(circle at 50% 50%, transparent ${r.toFixed(1)}px, #000 ${(r + 1.5).toFixed(1)}px)`;
      cover.style.webkitMaskImage = mask;
      cover.style.maskImage = mask;
      if (p < 1) requestAnimationFrame(step);
      else finish();
    };
    requestAnimationFrame(step);
  }

  // The CTA is a real <button> — Enter/Space activate it natively and bubble a click to
  // the cover's own listener above. Escape is the one extra keyboard affordance a
  // mouse-free visitor needs to get past the cover at all.
  function onKeydown(e) {
    if (e.key === "Escape") dismiss();
  }

  cover.addEventListener("click", dismiss);
  cover.addEventListener("wheel", dismiss, { once: true, passive: true });
  document.addEventListener("keydown", onKeydown);

  autoOpenTimer = setTimeout(dismiss, AUTO_OPEN_MS);
}
