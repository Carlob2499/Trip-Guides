/* Reminders / Notable Items — the group's shared scratchpad for the things a guide can't
   know in advance: the Airbnb door code, the time everyone agreed to meet, a booking link.
   From real trip feedback: "Should have an optional REMINDERS or NOTABLE ITEMS tab for things
   like AirBnb code, agreed times for meetup, links, etc."

   Same zero-setup shared-room model as Trip Split: everyone on the guide edits ONE list, no
   codes, no buttons (src/features/firebase). Each item is its own record, so two people adding
   at once merge instead of clobbering. Falls back to this device's localStorage when Firebase
   isn't configured, so the tab still works as a private notepad. */

import { hasFirebase, joinTrip, normalizeCode } from "../../firebase/index.js";
import { buildReminder, sortReminders } from "../model/reminders";

export function initReminders() {
  var wrap = document.getElementById("tripRemind");
  if (!wrap) return;

  var storeKey = wrap.getAttribute("data-sk") || "guide";
  var LS_KEY = "tg-remind-" + storeKey;
  var listEl = wrap.querySelector("#rmList");
  var textEl = wrap.querySelector("#rmText");
  var labelEl = wrap.querySelector("#rmLabel");
  var addBtn = wrap.querySelector("#rmAdd");
  var liveEl = wrap.querySelector("#rmLive");
  if (!listEl || !textEl || !addBtn) return;

  var room = null;
  var items = {}; // id -> record

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function setLive(state, text) {
    if (!liveEl) return;
    liveEl.hidden = false;
    liveEl.setAttribute("data-state", state);
    var t = liveEl.querySelector("#rmLiveText");
    if (t) t.textContent = text;
  }

  /* ── local fallback (no Firebase configured) ─────────────────────────────── */
  function loadLocal() {
    try { items = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { items = {}; }
  }
  function saveLocal() {
    if (room) return; // the room is the source of truth once synced
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch (e) {}
  }
  function newId() { return "r" + Math.random().toString(36).slice(2, 9); }

  /* ── ops — route to the room when synced, else mutate local ──────────────── */
  function opAdd(rec) {
    if (room) { room.collection("reminders").add(rec); }
    else { items[newId()] = Object.assign({ createdAt: Date.now() }, rec); saveLocal(); render(); }
  }
  function opRemove(id) {
    if (room) { room.collection("reminders").remove(id); }
    else { delete items[id]; saveLocal(); render(); }
  }
  function opPin(id, pinned) {
    if (room) { room.collection("reminders").update(id, { pinned: pinned }); }
    else { if (items[id]) { items[id].pinned = pinned; saveLocal(); render(); } }
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

    listEl.querySelectorAll("[data-pin]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-pin");
        opPin(id, !(items[id] && items[id].pinned));
      });
    });
    listEl.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { opRemove(this.getAttribute("data-del")); });
    });
  }

  function submit() {
    var rec = buildReminder({ text: textEl.value, label: labelEl ? labelEl.value : "" });
    if (!rec) { textEl.focus(); return; }
    opAdd(rec);
    textEl.value = "";
    if (labelEl) labelEl.value = "";
    textEl.focus();
  }
  addBtn.addEventListener("click", submit);
  textEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  });

  /* ── init: join the one shared room for this guide, else run local ───────── */
  if (hasFirebase()) {
    render();
    setLive("connecting", "Connecting to your group’s shared list…");
    joinTrip(normalizeCode(storeKey)).then(function (r) {
      room = r;
      room.collection("reminders").onChange(function (map) {
        items = map || {};
        setLive("live", "Live · shared with everyone on this guide.");
        render();
      });
    }).catch(function () {
      setLive("offline", "Offline — saved on this device only.");
      loadLocal(); render();
    });
  } else {
    loadLocal();
    render();
  }
}
