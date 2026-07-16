/* Reminders / Notable Items — the group's shared scratchpad for the things a guide can't
   know in advance: the Airbnb door code, the time everyone agreed to meet, a booking link.
   From real trip feedback (summarized): the group wanted an optional Reminders/Notable-Items
   tab for door codes, agreed meetup times, links.

   Same zero-setup shared-room model as Trip Split: everyone on the guide edits ONE list, no
   codes, no buttons. ALL data access goes through the silo's injectable gateway (which talks
   to src/features/firebase or localStorage) — this file only renders and routes events. The
   network join is deferred until the tab is actually opened: the panel ships hidden, and a
   hidden list is no reason to hold a live subscription on every page view. */

import { esc } from "../../../scripts/util.js";
import { buildReminder, sortReminders } from "../model/reminders";
import { createGateway } from "../gateway.js";

export function initReminders(opts) {
  var wrap = document.getElementById("tripRemind");
  if (!wrap) return;

  var storeKey = wrap.getAttribute("data-sk") || "guide";
  var listEl = wrap.querySelector("#rmList");
  var textEl = wrap.querySelector("#rmText");
  var labelEl = wrap.querySelector("#rmLabel");
  var addBtn = wrap.querySelector("#rmAdd");
  var liveEl = wrap.querySelector("#rmLive");
  if (!listEl || !textEl || !addBtn) return;

  var gw = (opts && opts.gateway) || createGateway(storeKey);
  var items = {}; // id -> record, mirrored from the gateway

  function setLive(state, text) {
    if (!liveEl) return;
    liveEl.hidden = false;
    liveEl.setAttribute("data-state", state);
    var t = liveEl.querySelector("#rmLiveText");
    if (t && text) t.textContent = text;
  }

  var KIND_ICON = { code: "🔑", time: "🕘", link: "🔗", note: "📌" };

  function render() {
    var list = Object.keys(items).map(function (id) {
      return Object.assign({ id: id }, items[id]);
    });
    if (!list.length) {
      listEl.innerHTML = '<p class="rm-empty">Nothing yet. Add the door code, the time you agreed to meet, a link — anything the guide can\'t know in advance.</p>';
      return;
    }
    listEl.innerHTML = sortReminders(list).map(function (r) {
      var isLink = r.kind === "link";
      var href = isLink ? (/^https?:\/\//i.test(r.text) ? r.text : "https://" + r.text) : null;
      return '<div class="rm-item' + (r.pinned ? " rm-item-pinned" : "") + '" data-id="' + esc(r.id) + '">' +
        '<span class="rm-ico" aria-hidden="true">' + (KIND_ICON[r.kind] || KIND_ICON.note) + "</span>" +
        '<span class="rm-body">' +
          (r.label ? '<span class="rm-label">' + esc(r.label) + "</span>" : "") +
          (isLink
            ? '<a class="rm-text rm-link" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + esc(r.text) + "</a>"
            : '<span class="rm-text' + (r.kind === "code" ? " rm-code" : "") + '">' + esc(r.text) + "</span>") +
        "</span>" +
        '<button class="rm-pin" type="button" data-pin="' + esc(r.id) + '" aria-pressed="' + (r.pinned ? "true" : "false") +
          '" aria-label="' + (r.pinned ? "Unpin" : "Pin to top") + '">' + (r.pinned ? "★" : "☆") + "</button>" +
        '<button class="rm-del" type="button" data-del="' + esc(r.id) + '" aria-label="Delete reminder">×</button>' +
        "</div>";
    }).join("");
  }

  // ONE delegated listener instead of two per row rebuilt on every sync event.
  listEl.addEventListener("click", function (e) {
    var pin = e.target.closest && e.target.closest("[data-pin]");
    if (pin) { var id = pin.getAttribute("data-pin"); gw.setPinned(id, !(items[id] && items[id].pinned)); return; }
    var del = e.target.closest && e.target.closest("[data-del]");
    if (del) gw.remove(del.getAttribute("data-del"));
  });

  function submit() {
    var rec = buildReminder({ text: textEl.value, label: labelEl ? labelEl.value : "" });
    if (!rec) { textEl.focus(); return; }
    gw.add(rec);
    textEl.value = "";
    if (labelEl) labelEl.value = "";
    textEl.focus();
  }
  addBtn.addEventListener("click", submit);
  textEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  });

  gw.onChange(function (map) {
    items = map || {};
    render();
  });

  var connected = false;
  function connect() {
    if (connected) return;
    connected = true;
    render(); // paint the empty shell immediately, whatever the source
    if (!gw.hasSync()) { gw.connect(); return; } // local notepad — no status line needed
    setLive("connecting", "Connecting to your group’s shared list…");
    gw.connect().then(function () {
      setLive("live", "Live · shared with everyone on this guide.");
    }).catch(function () {
      setLive("offline", "Offline — saved on this device only.");
    });
  }

  /* Defer the join until the panel is first shown (guide-ui flips `hidden` on tab pick);
     connect immediately if it's already visible (deep link straight to the tab). */
  if (!wrap.hidden) connect();
  else {
    var mo = new MutationObserver(function () {
      if (!wrap.hidden) { mo.disconnect(); connect(); }
    });
    mo.observe(wrap, { attributes: true, attributeFilter: ["hidden"] });
  }
}
