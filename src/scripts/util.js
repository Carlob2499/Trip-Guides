/* Shared client helpers. Bundled once by Astro across the modules that import
   it (guide bundle + hub bundle), so this is the single home for the tiny
   cross-module checks that were previously copy-pasted per file. */

/* True when the visitor has asked the OS to minimize motion. Callers gate
   every non-essential animation / smooth-scroll behind this. */
export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* A single short vibration for a confirmed tap. No-ops silently where the
   Vibration API is absent (all desktop, iOS Safari) — callers don't guard. */
export function tapHaptic() {
  try { navigator.vibrate && navigator.vibrate(9); } catch (e) {}
}
