/** share — the share modal (QR, copy-link, WhatsApp/email) and the standalone
    "Share trip summary" button.

    initSharePanel() takes the page's shared scroll-lock functions as parameters rather
    than owning its own — the mobile sheet (guide-ui.js) and this modal coordinate a
    single body-scroll-lock counter so opening one while the other is open doesn't let
    closing either re-enable page scroll underneath the other. */
export { initSharePanel } from "./ui/share-panel.js";
export { buildPageUrl, buildWhatsAppShareUrl, buildMailtoUrl, buildSummaryShareText } from "./model/share-links";
