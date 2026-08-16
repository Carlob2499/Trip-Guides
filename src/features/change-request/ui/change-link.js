/* The guide page's "Request a change" pill — keeps its href pointing at /change/ with the slug
   AND the tab the reader is actually looking at.

   This is all that remains on the guide page of what used to be a 3-step modal wizard. The
   wizard is gone: the request surface is a page now (src/pages/change.astro), which is the only
   place a guide picker, a live advisory and a section map fit. What the modal did well —
   never making the reader type a slug or name a section — this preserves by putting both in
   the link.

   Progressive enhancement is intact and simpler than before: the pill is a REAL link that the
   layout server-renders with the slug already in it, so it works with JS off. This only adds
   `&tab=`, which is a refinement, not a requirement — a reader who arrives without one just
   starts on the guide with no tab preselected. */

/**
 * @param {{ order?: string[] }} cfg — the guide's tab groups, in nav order. `tg:section` reports
 *   the active group as an INDEX into this array (it is the scroll spy's own vocabulary).
 */
export function initChangeLink(cfg) {
  const pill = document.getElementById("btnChangeRequest");
  if (!pill) return;

  const order = (cfg && cfg.order) || [];
  const href = pill.getAttribute("href") || "";
  // The layout renders the base link; anything this file does is an edit of that, never a
  // replacement — if the base is missing or not ours, leave it exactly as authored.
  if (!href || href.indexOf("/change/") === -1) return;
  const stem = href.split("&tab=")[0];

  document.addEventListener("tg:section", (e) => {
    const cat = e && e.detail ? e.detail.cat : null;
    const group = typeof cat === "number" ? order[cat] : null;
    pill.setAttribute("href", group ? stem + "&tab=" + encodeURIComponent(group) : stem);
  });
}
