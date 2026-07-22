// Escapes JSON for safe embedding inside an HTML <script type="application/json"> element.
// Without this, a payload string containing "</script>" can terminate the script element
// early and let attacker-controlled markup (e.g. <img onerror=...>) execute as HTML.
export const jsonEmbed = (x: unknown): string =>
  JSON.stringify(x).replace(/</g, "\\u003c");
