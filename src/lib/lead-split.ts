// Progressive-disclosure split for prose/panel bodies (the density pass).
// A card shows its FIRST paragraph as the lead; everything after folds behind
// a "More detail" toggle. Content is never altered or dropped — only deferred.
// Split only when the remainder is substantial (folding one short sentence is
// worse than showing it).
//
// M4/creator priority: v2 adds a content-aware refusal — a fold that hides an
// unconfirmed-fact warning or a numbered/bulleted procedure defeats the site's
// own Honest property (CLAUDE.md: "gaps are stated, not filled" extends to "warnings
// are not hidden behind a tap"). If the WOULD-BE-FOLDED remainder contains a ⚠ flag
// or a <ul>/<ol>, the card shows everything instead of folding — never a partial
// move of the cut point (which risks splitting a warning's own sentence in half).
const OPERATIONAL_CONTENT = /⚠|<ul[\s>]|<ol[\s>]/;

// The automatic refusal above catches content that LOOKS operational (a ⚠ flag, a procedure).
// It cannot catch content that only a reader knows is operational: an embassy's 24/7 line, a
// 24-hour pharmacy's address and night-bell instruction, a fine you incur by walking down the
// wrong lane, or the two things you must do in the arrivals hall before leaving it. Those read
// as ordinary prose and fold silently — which is how a guide ends up hiding its emergency
// numbers one tap deep, against the site's own "surfacing beats sourcing" doctrine.
//
// So the maker gets an explicit veto: `fold: false` on a panel/prose section means this body
// never folds, however long it runs. Deliberately a veto and not a force — there is no
// `fold: true`, because a section short enough to stay inline should never be pushed behind a
// tap just because someone set a flag.

export interface SplitLead {
  lead: string;
  more: string | null;
  /** Paragraph count inside `more`, for the caller to build an honest label
   *  ("More detail · 3 more paragraphs") when no custom moreLabel is set. 0 when
   *  `more` isn't paragraph-per-tag (a bare list, say) — callers should omit the
   *  count rather than show a misleading "0 more". */
  moreParagraphCount: number;
  /** A short plain-text (tags stripped) preview of `more`'s opening, for the
   *  fade-out preview line. Empty when there's nothing folded. */
  morePreview: string;
}

function truncateAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const sentenceEnd = /[.!?]\s/g;
  let last = -1;
  let m: RegExpExecArray | null;
  while ((m = sentenceEnd.exec(text)) !== null) {
    if (m.index + 1 > max) break;
    last = m.index + 1;
  }
  if (last > max * 0.4) return text.slice(0, last);
  return text.slice(0, max).trimEnd() + "…";
}

export function splitLead(body: string | undefined | null, fold?: boolean): SplitLead {
  const html = String(body || "");
  if (fold === false) return { lead: html, more: null, moreParagraphCount: 0, morePreview: "" };
  const cut = html.indexOf("</p>");
  if (cut === -1) return { lead: html, more: null, moreParagraphCount: 0, morePreview: "" };
  const lead = html.slice(0, cut + 4);
  const more = html.slice(cut + 4).trim();

  // Substance check on the remainder's TEXT (tags stripped) — short tails stay inline.
  const moreText = more.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (moreText.length < 260) return { lead: html, more: null, moreParagraphCount: 0, morePreview: "" };

  if (OPERATIONAL_CONTENT.test(more)) return { lead: html, more: null, moreParagraphCount: 0, morePreview: "" };

  const moreParagraphCount = (more.match(/<p[\s>]/g) || []).length;
  const morePreview = truncateAtSentence(moreText, 120);
  return { lead, more, moreParagraphCount, morePreview };
}

/** The toggle's visible label: a custom moreLabel wins outright (a maker-chosen label
 *  already tells the reader more than a count would); otherwise "More detail" plus an
 *  honest, computed count when one exists. */
export function moreDetailLabel(moreLabel: string | undefined | null, paragraphCount: number): string {
  if (moreLabel) return moreLabel;
  return paragraphCount > 0
    ? `More detail · ${paragraphCount} more paragraph${paragraphCount === 1 ? "" : "s"}`
    : "More detail";
}
