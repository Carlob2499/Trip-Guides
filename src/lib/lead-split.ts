// Progressive-disclosure split for prose/panel bodies (the density pass).
// A card shows its FIRST paragraph as the lead; everything after folds behind
// a native <details> "More detail" toggle. Content is never altered or
// dropped — only deferred. Split only when the remainder is substantial
// (folding one short sentence is worse than showing it).
export function splitLead(body: string | undefined | null): { lead: string; more: string | null } {
  const html = String(body || "");
  const cut = html.indexOf("</p>");
  if (cut === -1) return { lead: html, more: null };
  const lead = html.slice(0, cut + 4);
  const more = html.slice(cut + 4).trim();
  // Substance check on the remainder's TEXT (tags stripped) — short tails stay inline.
  const moreText = more.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (moreText.length < 260) return { lead: html, more: null };
  return { lead, more };
}
