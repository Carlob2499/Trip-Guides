/* Prose tag allowlist — the ONE home (extracted from content.config.ts, Phase 2.1).
   Guide bodies render via `set:html` in 30+ places, so any string that reaches the
   reader as HTML must be confined to this small, safe tag set — nothing that can
   execute script or navigate to a dangerous scheme. The guide collection schema walks
   every HTML-bearing field through findUnsafeHtml; non-schema HTML surfaces (the
   panel-preview fixtures) import it directly so they ride the same gate rather than
   growing a second checker that can drift (the #39 divergence lesson). */

export const ALLOWED_TAGS = new Set(["p", "b", "i", "a", "ul", "li", "ol", "br"]);

// `<span data-addr-kr="...">` is a load-bearing feature, not decoration: field-tools.js
// / guide-ui.js query it to power tap-to-copy native-script addresses. Allowed ONLY in
// that exact single-attribute shape — no other attribute (in particular no `on\w+=`)
// rides along on the same tag.
const SPAN_ADDR_RE = /^<span\s+data-addr-kr\s*=\s*(?:"[^"]*"|'[^']*')\s*>$/i;

export function findUnsafeHtml(value: string): string | null {
  // Any tag not in the allowlist (opening or closing).
  const tagRe = /<\/?\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(value))) {
    const tag = m[1].toLowerCase();
    if (tag === "span") {
      if (m[0] === "</span>" || SPAN_ADDR_RE.test(m[0])) continue;
      return `disallowed <span> shape (only [data-addr-kr] is permitted)`;
    }
    if (!ALLOWED_TAGS.has(tag)) return `disallowed tag <${tag}>`;
    // on\w+= handler attribute on an otherwise-allowed tag.
    if (/\bon\w+\s*=/i.test(m[0])) return `event handler attribute in <${tag}>`;
    // javascript: scheme on an href.
    if (tag === "a" && /href\s*=\s*["']?\s*javascript:/i.test(m[0])) {
      return `javascript: href in <a>`;
    }
  }
  return null;
}
