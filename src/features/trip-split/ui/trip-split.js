/* Waypoint Trip Split — the group budget calculator, id-keyed, with automatic Firebase
   live sync. Two modes, chosen automatically — no code, no buttons:
     · SHARED LIVE (whenever Firebase is configured): every device viewing a guide joins
       ONE room keyed by that guide (trips/<guide>), so the whole group edits a single
       budget. Every mutation writes a RECORD (two people editing at once merge, never
       clobber); remote changes rebuild state + re-render — deferred while you're mid-
       keystroke so a teammate's edit never yanks your caret.
     · ON-DEVICE (only if Firebase isn't configured): state lives in localStorage, a
       private offline calculator exactly as before.
   Firebase itself lives in src/features/firebase (the silo); this file only imports its
   public API.

   ─ V2 (2026-08-02) ────────────────────────────────────────────────────────────────────
   Money is integer minor units end to end (model/records.ts explains the shape). Four
   behaviour changes ride along:
     · Split method is per EXPENSE, not per trip, so the old global ÷Even/Custom toggle is
       gone and each row owns its own rule.
     · Participants are SNAPSHOTTED when an expense is created, so a traveller who joins on
       day 5 no longer retroactively owes for day 1.
     · Amounts are entered in the currency actually paid, converted once at the guide's
       live rate and stored with that rate.
     · Settling is recorded. "Mark paid" writes a payment, so a discharged debt leaves the
       screen instead of being suggested forever.
   Each row's supporting controls (category, split rule, who shared, weights) live behind a
   per-row disclosure. Collapsed is the default because a 40-expense trip was measured at
   10.4 phone screens with the old always-open chips row. */

import { settle } from "../model/settle";
import { buildBudgetSummary } from "../model/summary";
import { previewBudgetSummary } from "./budget-sheet.js";
import { formatMinor, toBaseMinor, BASE_CURRENCY, CURRENCY_EXPONENT } from "../model/money";
import { normalizeExpense, normalizeMember, normalizePayment, rekeyForRoom } from "../model/records";
import { planMemberRemoval, applyExpensePatch } from "../model/undo";
import { hasFirebase, joinTrip, roomId as guideRoomId, isPostTripLocked } from "../../firebase/index.js";
import { getLastRate } from "../../live-data/index.js";
import { tripWindow } from "../../../lib/trip-dates";
import { esc, migrateStorageKey } from "../../../scripts/util.js";

(function () {
  var wrap = document.getElementById("tripSplit");
  if (!wrap) return;

  // The guide's own config island, read once — the lock below, the currency the traveller
  // is actually spending, and the PDF summary's header all need it.
  var CFG = (function () {
    try {
      var el = document.getElementById("tgConfig");
      return el ? JSON.parse(el.textContent || "{}") : {};
    } catch (e) { return {}; }
  })();

  /* M5 — POST-TRIP LOCK. Two weeks after the last day, this guide's budget stops being a live
     scratchpad and becomes the trip's financial record: the numbers keep rendering (and keep
     feeding the recap + Plan⇄Actual), but nothing new can be typed into a settled trip, and a
     room code committed to a public repo stops being a standing write invitation.
     Client-side only — no database or rules change, so no existing figure can be altered or
     lost by this. An undated guide is never locked (see model/room.ts). */
  var LOCKED = (function () {
    try {
      var cfg = CFG;
      // OPT-IN per guide (content.config.ts `budgetLock`), default OFF. Freezing a surface
      // people type into is a real behaviour change: defaulting it on would have silently
      // locked Korea's live budget four days after this shipped. The creator turns it on for
      // a trip that is genuinely settled.
      if (!cfg.budgetLock) return false;
      var win = tripWindow(cfg.firstDayDate, cfg.lastDayDate, new Date());
      return isPostTripLocked(win.end, new Date());
    } catch (e) { return false; }
  })();

  var SK = "tg-split-" + (wrap.dataset.sk || "guide");
  // R8: migrate this guide's on-device (solo-mode) split cache from the old
  // title-derived key — only relevant when Firebase isn't configured (SHARED LIVE
  // mode reads from the room, keyed by roomId, which this does not touch).
  var legacyStoreKey = document.body.getAttribute("data-legacy-storekey") || null;
  migrateStorageKey(localStorage, SK, legacyStoreKey ? "tg-split-" + legacyStoreKey : null);

  var state = { members: [], expenses: [], payments: [] };
  var room = null;      // Firebase room when synced, else null
  var offFns = [];      // room onChange unsubscribers
  var open = {};        // per-row disclosure state, id -> true (view state, never persisted)
  // Find-one-among-many. View state only: filtering NEVER touches the balances, the total or
  // the printed sheet — a filtered list that also filtered the maths would quietly answer a
  // different question than the one on screen.
  var filter = { q: "", who: "", cat: "" };
  /* Below this many expenses, scanning beats searching and a filter bar is just chrome. */
  var FILTER_FROM = 6;
  /* One slot, holding the last deletion. Deleting is the only action here that destroys
     something nobody can reconstruct — the × sits 32px from an amount field on a phone, the
     room is editable by anyone with the guide link, and until now a mistap was final.
     ONE slot, not a stack: a second delete supersedes the first, which is the standard and
     keeps the reversal a single unambiguous "put that back". No timer — a wrong deletion is
     often noticed a minute later, and a window that closes on its own would be a window
     that closes exactly when it is needed. It clears when undone, dismissed, or superseded. */
  var undoSlot = null;

  function newId() { return "i" + Math.random().toString(36).slice(2, 9); }
  function nextOrder() { return Date.now(); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  /* ── currency ─────────────────────────────────────────────────────────────
     The traveller pays in the destination's money; the trip settles in one currency so
     that a single set of transfers closes it. Each expense stores what was typed AND the
     conversion captured at that moment (model/records.ts). */
  var LOCAL_CUR = (CFG.curCode && CURRENCY_EXPONENT[CFG.curCode] !== undefined && CFG.curCode !== BASE_CURRENCY)
    ? CFG.curCode : null;

  function currentRate() {
    var live = getLastRate();
    if (live && live.rate && live.code === LOCAL_CUR) return { rate: live.rate, date: live.date || todayISO() };
    if (CFG.curCode === LOCAL_CUR && CFG.curFallbackRate) {
      return { rate: CFG.curFallbackRate, date: CFG.curFallbackAsOf || todayISO() };
    }
    return null;
  }
  function exponentOf(cur) {
    var exp = CURRENCY_EXPONENT[cur];
    return exp === undefined ? 2 : exp;
  }
  /** Typed text -> integer minor units of `cur`. null for blank/unparseable. */
  function toMinor(text, cur) {
    if (text == null || String(text).trim() === "") return null;
    var amount = parseFloat(String(text).replace(/,/g, ""));
    if (!isFinite(amount) || amount < 0) return null;
    return Math.round(amount * Math.pow(10, exponentOf(cur)));
  }
  /** Integer minor units -> a plain editable number string (no symbol, no grouping). */
  function minorToInput(minor, cur) {
    if (minor == null) return "";
    var exp = exponentOf(cur);
    return exp ? (minor / Math.pow(10, exp)).toFixed(exp) : String(minor);
  }
  function fmtBase(minor) { return formatMinor(Math.abs(Math.round(minor || 0)), BASE_CURRENCY); }
  function fmtCur(minor, cur) {
    try { return formatMinor(Math.round(minor || 0), cur); }
    catch (e) { return String(minor); }
  }
  /** Everything an expense needs to know about money, derived once from what was typed. */
  function moneyFields(text, cur) {
    var amountMinor = toMinor(text, cur);
    if (cur === BASE_CURRENCY) {
      return { amountMinor: amountMinor, currency: cur, rate: null, rateDate: null, baseMinor: amountMinor };
    }
    var rateInfo = currentRate();
    return {
      amountMinor: amountMinor,
      currency: cur,
      rate: rateInfo ? rateInfo.rate : null,
      rateDate: rateInfo ? rateInfo.date : null,
      baseMinor: amountMinor == null ? null : toBaseMinor(amountMinor, cur, rateInfo && rateInfo.rate),
    };
  }

  /* ── local persistence (solo mode) ────────────────────────────────────────── */
  function load() {
    var rawText;
    try { rawText = localStorage.getItem(SK); } catch (_) { return; }
    var raw;
    try { raw = JSON.parse(rawText || "null"); } catch (_) { return; }
    var migrated = migrate(raw);
    applyState(migrated);
    if (raw && migrated !== raw) {
      // A trip's expense history is not reproducible — nobody remembers what the taxi cost
      // three weeks later. Before the upgraded shape overwrites the old one, keep the
      // pre-migration blob under its own key, once. It costs a few KB and it is the
      // difference between "the upgrade had a bug" and "the records are gone".
      try {
        if (!localStorage.getItem(SK + "-pre-v2")) localStorage.setItem(SK + "-pre-v2", rawText);
      } catch (_) {}
      persist();
    }
  }
  function persist() {
    if (room) return; // synced: the room is the source of truth, not localStorage
    try { localStorage.setItem(SK, JSON.stringify(state)); } catch (_) {}
  }
  function applyState(saved) {
    if (!saved || typeof saved !== "object") return false;
    if (Array.isArray(saved.members))  state.members  = saved.members.map(normalizeMember);
    if (Array.isArray(saved.expenses)) state.expenses = saved.expenses.map(normalizeExpense);
    if (Array.isArray(saved.payments)) state.payments = saved.payments.map(normalizePayment);
    return true;
  }
  /** Bring a saved trip up to the current shape. Two eras are handled: pre-id records
      (members keyed by array index), and pre-V2 records (float dollars + one trip-wide
      custom-split flag). The flag is the reason this lives here rather than in
      records.ts — it is trip meta, and this is the only place it is in scope. */
  function migrate(saved) {
    if (!saved || typeof saved !== "object" || !Array.isArray(saved.members)) return saved;
    var needsIds = saved.members.some(function (member) { return member && !member.id; });
    var wasCustom = saved.customSplit === true;
    var preV2 = saved.expenses && saved.expenses.some(function (exp) { return exp && exp.amountMinor === undefined; });
    if (!needsIds && !wasCustom && !preV2) return saved;

    var ids = saved.members.map(function (member) { return (member && member.id) || newId(); });
    var members = saved.members.map(function (member, i) { return normalizeMember(Object.assign({}, member, { id: ids[i] })); });
    var expenses = (Array.isArray(saved.expenses) ? saved.expenses : []).map(function (exp) {
      var split = null;
      if (exp && Array.isArray(exp.customAmts)) {
        split = {};
        exp.customAmts.forEach(function (amt, i) { if (ids[i] != null) split[ids[i]] = parseFloat(amt) || 0; });
      } else if (exp && exp.split && typeof exp.split === "object") { split = exp.split; }
      var payIdx = exp ? parseInt(exp.paidBy, 10) : 0;
      var paidBy = (exp && ids.indexOf(exp.paidBy) !== -1) ? exp.paidBy
        : ids[(isNaN(payIdx) || payIdx >= ids.length || payIdx < 0) ? 0 : payIdx] || (ids[0] || "");
      var out = normalizeExpense(Object.assign({}, exp, { id: (exp && exp.id) || newId(), paidBy: paidBy, split: split }));
      // The trip-wide flag becomes each expense's own rule, which is the whole point of V2.
      if (wasCustom && out.weights) out.method = "EXACT";
      // Old records have no snapshot. Freeze one now from the members they were shared with,
      // so the next person to join doesn't retroactively join every past expense.
      if (!out.participants) out.participants = ids.slice();
      return out;
    });
    return { members: members, expenses: expenses, payments: [] };
  }

  /* ── utilities ───────────────────────────── */
  function memberPos(id) { for (var i = 0; i < state.members.length; i++) if (state.members[i].id === id) return i; return -1; }
  function memberById(id) { var pos = memberPos(id); return pos === -1 ? null : state.members[pos]; }
  function memberName(id) { var pos = memberPos(id); return pos === -1 ? "?" : (state.members[pos].name || ("Person " + (pos + 1))); }
  function expenseById(id) { for (var i = 0; i < state.expenses.length; i++) if (state.expenses[i].id === id) return state.expenses[i]; return null; }
  function allIds() { return state.members.map(function (member) { return member.id; }); }
  // Who shares an expense: its own snapshot, or the whole group for a legacy record that
  // never had one.
  function sharersOf(exp) {
    var named = (exp && exp.participants || []).filter(function (id) { return memberPos(id) !== -1; });
    return named.length ? named : allIds();
  }

  /* ── mutation ops — route to the room when synced, else mutate local state ─────
     In synced mode the mutation writes one record; the room's onChange echo (fired
     locally by Realtime Database, so it feels instant) rebuilds state and re-renders. */
  function opAddMember() {
    if (LOCKED) return;
    if (room) { room.collection("members").add({ name: "", payment: "", order: nextOrder() }); }
    else { state.members.push(normalizeMember({ id: newId() })); persist(); renderMembers(); renderNewRowOptions(); renderExpenses(); }
  }
  function opMemberField(id, field, value) {
    if (LOCKED) return;
    if (room) { var patch = {}; patch[field] = value; room.collection("members").update(id, patch); }
    else { var member = memberById(id); if (member) { member[field] = value; persist(); if (field === "name") renderNewRowOptions(); renderResults(); } }
  }
  /** Strip a patch's `id` — it addresses the record, it is not a field of it. */
  function patchBody(patch) {
    var out = {};
    Object.keys(patch).forEach(function (key) { if (key !== "id") out[key] = patch[key]; });
    return out;
  }
  /* Removing a person REWRITES other records — who paid, split weights, participant
     snapshots. Both modes now apply one plan computed by model/undo.js, which also hands
     back the exact before-state, so the reversal is the plan run backwards rather than a
     second guess at what the removal did. */
  function opMemberDel(id) {
    if (LOCKED) return;
    var pos = memberPos(id); if (pos === -1) return;
    var member = state.members[pos];
    var plan = planMemberRemoval(state.members, state.expenses, id);
    setUndo({
      kind: "member",
      label: member.name || "that person",
      id: id,
      index: pos,
      record: (roomRawMembers && roomRawMembers[id]) || null,
      member: Object.assign({}, member),
      restore: plan.restore,
    });
    if (room) {
      room.collection("members").remove(id);
      plan.patches.forEach(function (patch) { room.collection("expenses").update(patch.id, patchBody(patch)); });
    } else {
      state.members.splice(pos, 1);
      plan.patches.forEach(function (patch) { var expense = expenseById(patch.id); if (expense) applyExpensePatch(expense, patch); });
      persist(); render();
    }
    renderUndo();
  }
  function opAddExpense(data) {
    if (LOCKED) return;
    if (room) { room.collection("expenses").add(Object.assign({ order: nextOrder() }, data)); }
    else { state.expenses.push(normalizeExpense(Object.assign({ id: newId() }, data))); persist(); renderExpenses(); renderResults(); }
  }
  function opExpenseField(id, patch) {
    if (LOCKED) return;
    if (room) { room.collection("expenses").update(id, patch); }
    else { var expense = expenseById(id); if (expense) { Object.assign(expense, patch); persist(); renderResults(); } }
  }
  function opExpenseWeight(id, mid, value) {
    if (LOCKED) return;
    var expense = expenseById(id);
    var next = expense && expense.weights ? Object.assign({}, expense.weights) : {};
    // Only EXACT weights are MONEY and belong in minor units. Shares ("2" vs "1") and
    // percentages ("60") are plain numbers — running them through toMinor() stored 200 and
    // 6000, which kept the ratio right but redisplayed the wrong figure and made the
    // percentage total permanently fail its own "must make 100" check.
    if (expense && expense.method === "EXACT") {
      next[mid] = toMinor(value, expense.currency || BASE_CURRENCY) || 0;
    } else {
      var num = parseFloat(String(value).replace(/,/g, ""));
      next[mid] = isFinite(num) && num >= 0 ? num : 0;
    }
    opExpenseField(id, { weights: next });
    refreshWeightWarning(id);
  }

  /* The "these don't add up" warning has to track what is being typed RIGHT NOW. A full
     renderExpenses() would rebuild the input under the caret mid-keystroke, so the warning
     is recomputed and swapped in place instead. */
  function refreshWeightWarning(id) {
    var row = wrap.querySelector('.se-row[data-eid="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    var expense = expenseById(id);
    if (!row || !expense || expense.method === "EQUAL") return;
    var box = row.querySelector(".se-custom");
    if (!box) return;
    var cur = expense.currency || BASE_CURRENCY;
    var typed = sharersOf(expense).reduce(function (sum, mid) { return sum + (Number(expense.weights && expense.weights[mid]) || 0); }, 0);
    var msg = null;
    if (expense.method === "EXACT" && typed !== (expense.amountMinor || 0)) {
      msg = "Shares add up to " + fmtCur(typed, cur) + " — the expense is " + fmtCur(expense.amountMinor || 0, cur);
    } else if (expense.method === "PERCENTAGE" && typed !== 100) {
      msg = "Percentages add up to " + typed + " — they need to make 100";
    }
    box.classList.toggle("se-custom--warn", !!msg);
    var el = box.querySelector(".se-warn");
    if (msg && !el) {
      el = document.createElement("span");
      el.className = "se-warn";
      box.appendChild(el);
    }
    if (el) {
      if (msg) el.textContent = msg;
      else el.remove();
    }
  }
  function opExpenseDel(id) {
    if (LOCKED) return;
    var pos = -1;
    for (var i = 0; i < state.expenses.length; i++) if (state.expenses[i].id === id) { pos = i; break; }
    if (pos === -1) return;
    setUndo({
      kind: "expense",
      label: state.expenses[pos].desc || "that expense",
      id: id,
      index: pos,
      // The room's RAW record, when there is one: it carries createdBy/createdAt, which are
      // what a legacy record with no `order` is sorted by. Restoring from the normalized
      // copy would drop them and float the row to the top of the list.
      record: (roomRawExpenses && roomRawExpenses[id]) || null,
      expense: Object.assign({}, state.expenses[pos]),
    });
    if (room) { room.collection("expenses").remove(id); }
    else { state.expenses.splice(pos, 1); persist(); renderExpenses(); renderResults(); }
    renderUndo();
  }

  /* ── undo ────────────────────────────────────────────────────────────────── */
  function setUndo(entry) { undoSlot = entry; }
  /** Everything the record shape defines, minus the id (which is the key, not a field). */
  function recordBody(obj) {
    var out = {};
    Object.keys(obj).forEach(function (key) { if (key !== "id" && obj[key] !== undefined) out[key] = obj[key]; });
    return out;
  }
  function undoLast() {
    var undo = undoSlot;
    if (!undo || LOCKED) return;
    undoSlot = null;
    if (undo.kind === "expense") {
      // set(), not add(): the ORIGINAL id comes back, so nothing that referenced it dangles
      // and the row lands in its old place rather than at the end.
      if (room) room.collection("expenses").set(undo.id, undo.record || recordBody(undo.expense));
      else { state.expenses.splice(Math.min(undo.index, state.expenses.length), 0, undo.expense); persist(); }
    } else {
      if (room) {
        room.collection("members").set(undo.id, undo.record || recordBody(undo.member));
        undo.restore.forEach(function (patch) { room.collection("expenses").update(patch.id, patchBody(patch)); });
      } else {
        state.members.splice(Math.min(undo.index, state.members.length), 0, undo.member);
        undo.restore.forEach(function (patch) { var expense = expenseById(patch.id); if (expense) applyExpensePatch(expense, patch); });
        persist();
      }
    }
    // In synced mode the room's own echo re-renders; render() here anyway so the on-device
    // path updates and the undo bar clears the moment it is used, in both modes.
    render();
    renderUndo();
  }
  function renderUndo() {
    var bar = document.getElementById("sUndo");
    if (!bar) return;
    bar.hidden = !undoSlot;
    if (!undoSlot) return;
    var txt = document.getElementById("sUndoText");
    if (txt) {
      txt.textContent = "Removed " + (undoSlot.kind === "member" ? "" : "“") + undoSlot.label +
        (undoSlot.kind === "member" ? " from the trip" : "”");
    }
  }
  // Toggle one person in/out of an expense. Excluding the last sharer is refused — an
  // expense nobody shares has no meaning.
  function opToggleSharer(eid, mid) {
    if (LOCKED) return;
    var expense = expenseById(eid); if (!expense) return;
    var cur = sharersOf(expense);
    var next = cur.indexOf(mid) !== -1 ? cur.filter(function (id) { return id !== mid; }) : cur.concat([mid]);
    if (!next.length) return;
    var patch = { participants: next };
    // Drop weights for anyone excluded: a stale amount must never keep charging someone who
    // was not part of the expense.
    if (expense.weights) {
      var weights = {};
      next.forEach(function (id) { if (expense.weights[id] != null) weights[id] = expense.weights[id]; });
      patch.weights = weights;
    }
    opExpenseField(eid, patch);
  }
  function opAddPayment(from, to, baseMinor) {
    if (LOCKED) return;
    var rec = { from: from, to: to, baseMinor: Math.round(baseMinor), on: todayISO(), note: "" };
    if (room) { room.collection("payments").add(Object.assign({ order: nextOrder() }, rec)); }
    else { state.payments.push(normalizePayment(Object.assign({ id: newId() }, rec))); persist(); renderResults(); }
  }
  function opPaymentDel(id) {
    if (LOCKED) return;
    if (room) { room.collection("payments").remove(id); }
    else { state.payments = state.payments.filter(function (payment) { return payment.id !== id; }); persist(); renderResults(); }
  }

  /* ── member rendering ────────────────────── */
  function renderMembers() {
    var list = document.getElementById("sMemberList");
    if (!list) return;
    if (!state.members.length) { list.innerHTML = "<p class='split-empty'>Add the people splitting costs.</p>"; return; }
    list.innerHTML = state.members.map(function (member, i) {
      // esc() the record id too, not just display strings: ids are Firebase keys, and a
      // crafted key (via a direct REST write) could otherwise break out of the single-quoted
      // attribute. getAttribute decodes on read-back, so the id round-trips unchanged.
      var mid = esc(member.id);
      return "<div class='sm-row'>" +
        "<span class='sm-idx'>" + (i + 1) + "</span>" +
        "<input class='split-in sm-name' type='text' placeholder='Name' value='" + esc(member.name) + "' data-mid='" + mid + "' data-field='name' aria-label='Name of person " + (i + 1) + "' />" +
        "<input class='split-in sm-pay' type='text' placeholder='Venmo / Zelle / Kakao Pay…' value='" + esc(member.payment || "") + "' data-mid='" + mid + "' data-field='payment' aria-label='Payment handle for " + esc(member.name || "person " + (i + 1)) + "' />" +
        "<button class='split-del' type='button' data-del-m='" + mid + "' aria-label='Remove " + esc(member.name || "person") + "'>×</button>" +
        "</div>";
    }).join("");
    list.querySelectorAll("[data-field]").forEach(function (inp) {
      inp.addEventListener("input", function () { opMemberField(this.dataset.mid, this.dataset.field, this.value); });
    });
    list.querySelectorAll("[data-del-m]").forEach(function (btn) {
      btn.addEventListener("click", function () { opMemberDel(this.dataset.delM); });
    });
  }

  /* ── expense rendering ───────────────────── */
  function memberOptions(selId) {
    var chosen = memberPos(selId) !== -1 ? selId : (state.members[0] && state.members[0].id);
    return state.members.map(function (member, i) {
      return "<option value='" + esc(member.id) + "'" + (member.id === chosen ? " selected" : "") + ">" + esc(member.name || ("Person " + (i + 1))) + "</option>";
    }).join("");
  }
  function currencyOptions(sel) {
    if (!LOCAL_CUR) return "";
    return [LOCAL_CUR, BASE_CURRENCY].map(function (code) {
      return "<option value='" + code + "'" + (code === sel ? " selected" : "") + ">" + code + "</option>";
    }).join("");
  }
  var METHOD_LABEL = { EQUAL: "Split evenly", EXACT: "Exact amounts", SHARES: "Shares", PERCENTAGE: "Percentages" };
  var METHOD_SHORT = { EQUAL: "Even", EXACT: "Exact", SHARES: "Shares", PERCENTAGE: "%" };
  function methodOptions(sel) {
    return Object.keys(METHOD_LABEL).map(function (key) {
      return "<option value='" + key + "'" + (key === sel ? " selected" : "") + ">" + METHOD_LABEL[key] + "</option>";
    }).join("");
  }
  /* Question four of the add flow: who shares it. Everyone in by default (the snapshot
     rule); a tap takes a name out for THIS expense only. Reset after every add. */
  var newParts = null;
  function newPartIds() {
    return newParts === null ? allIds() : newParts.filter(function (id) { return memberPos(id) !== -1; });
  }
  function renderNewParts() {
    var host = document.getElementById("sNewParts");
    if (!host) return;
    var on = newPartIds();
    host.hidden = state.members.length < 2;
    host.innerHTML = "<span class='se-parts-lbl'>Split between</span>" + state.members.map(function (member, mi) {
      var isOn = on.indexOf(member.id) !== -1;
      return "<button type='button' class='se-part" + (isOn ? " se-part-on" : "") + "' data-newpart='" + esc(member.id) +
        "' aria-pressed='" + (isOn ? "true" : "false") + "'>" + esc(member.name || ("P" + (mi + 1))) + "</button>";
    }).join("");
    host.querySelectorAll("[data-newpart]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = this.dataset.newpart, cur = newPartIds();
        var next = cur.indexOf(id) !== -1 ? cur.filter(function (x) { return x !== id; }) : cur.concat([id]);
        if (!next.length) return; // an expense nobody shares is not an expense
        newParts = next;
        renderNewParts();
      });
    });
  }
  function renderNewRowOptions() {
    var sel = document.getElementById("sNewPayer");
    if (sel) sel.innerHTML = memberOptions(sel.value);
    renderNewParts();
    var cur = document.getElementById("sNewCur");
    if (cur) {
      if (!LOCAL_CUR) { cur.hidden = true; }
      else if (!cur.options.length) { cur.innerHTML = currencyOptions(LOCAL_CUR); cur.hidden = false; }
    }
  }

  function weightLabel(method, cur) {
    if (method === "PERCENTAGE") return "%";
    if (method === "SHARES") return "shares";
    return cur;
  }

  /* ── finding one expense among many ───────────────────────────────────────
     A 40-expense trip measured 7,875px — 9.7 phone screens — and rows are already near
     their floor (94px of a mobile row is two 44px touch targets). The remaining scale
     problem is not row height, it is having to scroll past forty rows to reach one. */
  function categoriesInUse() {
    var seen = {}, out = [];
    state.expenses.forEach(function (expense) {
      var cat = (expense.category || "").trim();
      if (cat && !seen[cat]) { seen[cat] = 1; out.push(cat); }
    });
    return out.sort();
  }
  function filterActive() { return !!(filter.q || filter.who || filter.cat); }
  function matchesFilter(expense) {
    if (filter.cat && (expense.category || "").trim() !== filter.cat) return false;
    // WHO PAID, not "who is involved". Tried the latter first: with even splits everyone
    // shares everything, so filtering 40 expenses by a person returned all 40. The payer is
    // the axis that actually discriminates, and it is the one the row already shows.
    if (filter.who && expense.paidBy !== filter.who) return false;
    if (filter.q) {
      var hay = ((expense.desc || "") + " " + (expense.category || "")).toLowerCase();
      if (hay.indexOf(filter.q.toLowerCase()) === -1) return false;
    }
    return true;
  }
  function renderFilterBar(total, shown) {
    var bar = document.getElementById("sFilter");
    if (!bar) return;
    bar.hidden = total < FILTER_FROM;
    if (bar.hidden) return;

    var who = document.getElementById("sFilterWho");
    if (who) {
      who.innerHTML = "<option value=''>Paid by anyone</option>" + state.members.map(function (member, i) {
        return "<option value='" + esc(member.id) + "'" + (member.id === filter.who ? " selected" : "") + ">" +
          esc(member.name || ("Person " + (i + 1))) + "</option>";
      }).join("");
    }
    var cat = document.getElementById("sFilterCat");
    if (cat) {
      var cats = categoriesInUse();
      cat.hidden = !cats.length; // nothing categorised yet → the control would offer nothing
      cat.innerHTML = "<option value=''>All categories</option>" + cats.map(function (catName) {
        return "<option value='" + esc(catName) + "'" + (catName === filter.cat ? " selected" : "") + ">" + esc(catName) + "</option>";
      }).join("");
    }
    var clear = document.getElementById("sFilterClear");
    if (clear) clear.hidden = !filterActive();

    // The honesty line. A filtered list beside an unfiltered total invites exactly one wrong
    // conclusion, so say plainly which is which.
    var note = document.getElementById("sFilterNote");
    if (note) {
      if (!filterActive()) { note.hidden = true; note.textContent = ""; }
      else {
        note.hidden = false;
        note.textContent = shown === 0
          ? "Nothing matches."
          : "Showing " + shown + " of " + total + " — the balances below still cover every expense.";
      }
    }
  }

  function renderExpenses() {
    var newCard = document.getElementById("sNewCard");
    var list = document.getElementById("sExpenseList");
    if (!list) return;
    var hasMembers = state.members.length > 0;
    if (newCard) newCard.hidden = !hasMembers;
    if (!hasMembers) { renderFilterBar(0, 0); list.innerHTML = "<p class='split-empty'>Add people first, then record who paid what.</p>"; return; }
    if (!state.expenses.length) { renderFilterBar(0, 0); list.innerHTML = "<p class='split-empty'>No expenses yet — fill in the row above and tap + Add expense.</p>"; return; }

    // NEWEST FIRST. The entry form sits at the top of this card, so appending put every new
    // expense off the bottom of the screen: you added one and then had to scroll to see that
    // it had landed. Reversed here, in the view only — `state.expenses` stays chronological,
    // which is the order the printed sheet reads in and the order settlement is computed from.
    var ordered = state.expenses.slice().reverse();
    var visible = ordered.filter(matchesFilter);
    renderFilterBar(state.expenses.length, visible.length);
    if (!visible.length) {
      list.innerHTML = "<p class='split-empty'>No expenses match — clear the filter to see all " + state.expenses.length + ".</p>";
      applyLock();
      return;
    }

    list.innerHTML = visible.map(function (exp) {
      var eid = esc(exp.id); // escaped Firebase key for every attribute below
      var shareIds = sharersOf(exp);
      var cur = exp.currency || BASE_CURRENCY;
      var isOpen = !!open[exp.id];

      // Collapsed summary line: the split method is always stated in words (F3 — "Even ·
      // 4 people", "Exact · 2 people"), then whatever else is non-default.
      var meta = [];
      meta.push((METHOD_SHORT[exp.method] || exp.method) + " · " + shareIds.length + (shareIds.length === 1 ? " person" : " people"));
      if (exp.category) meta.push(esc(exp.category));
      if (cur !== BASE_CURRENCY && exp.baseMinor != null) meta.push("≈ " + fmtBase(exp.baseMinor));
      if (cur !== BASE_CURRENCY && exp.baseMinor == null) meta.push("rate unavailable");

      var details = "";
      if (isOpen) {
        var partChips = state.members.length > 1
          ? "<div class='se-parts'><span class='se-parts-lbl'>Split between</span>" +
              state.members.map(function (member, mi) {
                var on = shareIds.indexOf(member.id) !== -1;
                return "<button type='button' class='se-part" + (on ? " se-part-on" : "") + "' data-eid='" + eid +
                  "' data-pid='" + esc(member.id) + "' aria-pressed='" + (on ? "true" : "false") + "'>" +
                  esc(member.name || ("P" + (mi + 1))) + "</button>";
              }).join("") + "</div>"
          : "";

        var weightBlock = "";
        if (exp.method !== "EQUAL") {
          var typed = shareIds.reduce(function (sum, id) { return sum + (Number(exp.weights && exp.weights[id]) || 0); }, 0);
          var target = exp.method === "EXACT" ? (exp.amountMinor || 0) : (exp.method === "PERCENTAGE" ? 100 : 0);
          var mismatch = exp.method === "EXACT" ? Math.abs(typed - target) > 0
            : exp.method === "PERCENTAGE" ? Math.abs(typed - 100) > 0 : false;
          weightBlock = "<div class='se-custom" + (mismatch ? " se-custom--warn" : "") + "'>" +
            shareIds.map(function (id) {
              var mi = memberPos(id), member = state.members[mi];
              var raw = Number(exp.weights && exp.weights[id]) || 0;
              var val = exp.method === "EXACT" ? minorToInput(raw, cur) : String(raw);
              return "<label class='se-cl'><span class='se-cl-name'>" + esc(member.name || ("P" + (mi + 1))) + "</span>" +
                "<input class='split-in se-ca' type='number' min='0' step='any' inputmode='decimal' value='" + esc(val) +
                "' data-eid='" + eid + "' data-mid='" + esc(id) + "' aria-label='" + esc((member.name || "person") + " " + weightLabel(exp.method, cur)) + "' /></label>";
            }).join("") +
            (mismatch
              ? "<span class='se-warn'>" + (exp.method === "EXACT"
                  ? "Shares add up to " + fmtCur(typed, cur) + " — the expense is " + fmtCur(exp.amountMinor || 0, cur)
                  : "Percentages add up to " + typed + " — they need to make 100") + "</span>"
              : "") + "</div>";
        }

        details = "<div class='se-more'>" +
          "<div class='se-more-row'>" +
            "<label class='se-field'><span class='se-field-lbl'>Category</span>" +
              "<input class='split-in se-cat' type='text' list='sCatList' placeholder='e.g. Food' value='" + esc(exp.category || "") + "' data-eid='" + eid + "' /></label>" +
            "<label class='se-field'><span class='se-field-lbl'>How to split</span>" +
              "<select class='split-in se-method' data-eid='" + eid + "'>" + methodOptions(exp.method) + "</select></label>" +
          "</div>" + partChips + weightBlock + "</div>";
      }

      return "<div class='se-row" + (isOpen ? " se-row-open" : "") + "' data-eid='" + eid + "'><div class='se-main'>" +
        "<input class='split-in se-desc' type='text' placeholder='What for?' value='" + esc(exp.desc || "") + "' data-eid='" + eid + "' data-field='desc' aria-label='What the expense was for' />" +
        "<select class='split-in se-payer' data-eid='" + eid + "' aria-label='Who paid'>" + memberOptions(exp.paidBy) + "</select>" +
        "<div class='se-amt-wrap'>" +
          (LOCAL_CUR
            ? "<select class='se-cur-sel' data-eid='" + eid + "' aria-label='Currency'>" + currencyOptions(cur) + "</select>"
            : "<span class='se-cur'>$</span>") +
          "<input class='split-in se-amt' type='number' min='0' step='any' inputmode='decimal' placeholder='0.00' value='" + esc(minorToInput(exp.amountMinor, cur)) + "' data-eid='" + eid + "' data-field='amount' aria-label='Amount' /></div>" +
        "<button class='split-del' type='button' data-del-e='" + eid + "' aria-label='Remove expense'>×</button>" +
        "</div>" +
        "<div class='se-sub'>" +
          "<button class='se-toggle' type='button' data-open='" + eid + "' aria-expanded='" + (isOpen ? "true" : "false") + "'>" +
            (isOpen ? "Hide details" : "Details") + "</button>" +
          (meta.length ? "<span class='se-meta'>" + meta.map(esc).join(" · ") + "</span>" : "") +
        "</div>" + details + "</div>";
    }).join("");

    list.querySelectorAll(".se-payer").forEach(function (sel) {
      sel.addEventListener("change", function () { opExpenseField(this.dataset.eid, { paidBy: this.value }); });
    });
    list.querySelectorAll(".se-desc").forEach(function (inp) {
      inp.addEventListener("input", function () { opExpenseField(this.dataset.eid, { desc: this.value }); });
    });
    list.querySelectorAll(".se-amt").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var expense = expenseById(this.dataset.eid);
        opExpenseField(this.dataset.eid, moneyFields(this.value, (expense && expense.currency) || BASE_CURRENCY));
      });
    });
    list.querySelectorAll(".se-cur-sel").forEach(function (sel) {
      sel.addEventListener("change", function () {
        // Re-derive from what is currently typed, in the newly chosen currency: the digits
        // on screen are what the traveller means, whatever label sits beside them.
        var row = this.closest(".se-row");
        var amt = row && row.querySelector(".se-amt");
        opExpenseField(this.dataset.eid, moneyFields(amt ? amt.value : "", this.value));
        renderExpenses(); renderResults();
      });
    });
    list.querySelectorAll(".se-cat").forEach(function (inp) {
      inp.addEventListener("input", function () { opExpenseField(this.dataset.eid, { category: this.value }); });
    });
    list.querySelectorAll(".se-method").forEach(function (sel) {
      sel.addEventListener("change", function () {
        opExpenseField(this.dataset.eid, { method: this.value });
        renderExpenses(); renderResults();
      });
    });
    list.querySelectorAll(".se-part").forEach(function (btn) {
      btn.addEventListener("click", function () { opToggleSharer(this.dataset.eid, this.dataset.pid); renderExpenses(); renderResults(); });
    });
    list.querySelectorAll(".se-ca").forEach(function (inp) {
      inp.addEventListener("input", function () { opExpenseWeight(this.dataset.eid, this.dataset.mid, this.value); });
    });
    list.querySelectorAll("[data-del-e]").forEach(function (btn) {
      btn.addEventListener("click", function () { opExpenseDel(this.dataset.delE); });
    });
    list.querySelectorAll("[data-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = this.dataset.open;
        open[id] = !open[id];
        renderExpenses();
      });
    });
    applyLock();
  }

  /* ── results (uses the tested pure settle()) ── */
  function computeSettle() {
    return settle(allIds(), state.expenses, state.payments);
  }
  function renderResults() {
    var card = document.getElementById("sResults");
    var bDiv = document.getElementById("sBalances"), sDiv = document.getElementById("sSettlements");
    var sCount = document.getElementById("sSettleCount"), totUSD = document.getElementById("sTotalUSD");
    var pdfBtn = document.getElementById("sSavePdf");
    var catWrap = document.getElementById("sCategories"), catList = document.getElementById("sCatBreakdown");
    var payWrap = document.getElementById("sPaid"), payList = document.getElementById("sPaidList");
    var hasData = state.members.length && state.expenses.length;
    if (!hasData) {
      if (card) card.hidden = true;
      if (pdfBtn) pdfBtn.hidden = true;
      return;
    }
    if (card) card.hidden = false;
    if (pdfBtn) pdfBtn.hidden = false;

    var sum = buildBudgetSummary(state.members, state.expenses, state.payments, dayCount());
    if (totUSD) totUSD.textContent = fmtBase(sum.total);
    var calc = { balances: {}, txns: sum.txns };
    sum.people.forEach(function (person) { calc.balances[person.id] = person.net; });

    if (bDiv) {
      bDiv.innerHTML = sum.people.map(function (person) {
        var abs = Math.abs(person.net);
        var cls = person.net > 0 ? "sb-owed" : person.net < 0 ? "sb-owes" : "sb-even";
        var verb = person.net > 0 ? "is owed" : person.net < 0 ? "owes" : "settled ✓";
        return "<div class='sb-row " + cls + "'><span class='sb-name'>" + esc(person.name) + "</span><span class='sb-verb'>" + verb + "</span><span class='sb-amt'>" + (abs ? fmtBase(abs) : "—") + "</span></div>";
      }).join("");
    }

    if (sDiv) {
      if (!sum.txns.length) {
        sDiv.innerHTML = "<p class='split-settle-ok'>All square — no transfers needed.</p>";
        if (sCount) sCount.textContent = "";
      } else {
        if (sCount) sCount.textContent = sum.txns.length + " payment" + (sum.txns.length > 1 ? "s" : "");
        sDiv.innerHTML = sum.txns.map(function (txn) {
          var payMethod = (memberById(txn.to) || {}).payment || "";
          return "<div class='st-row'><div class='st-parties'><span class='st-from'>" + esc(txn.fromName) + "</span><span class='st-arrow'>→</span><span class='st-to'>" + esc(txn.toName) + "</span></div>" +
            "<div class='st-amt-row'><span class='st-usd'>" + fmtBase(txn.amtMinor) + "</span></div>" +
            (payMethod ? "<div class='st-via'>via " + esc(payMethod) + "</div>" : "") +
            "<button class='st-done' type='button' data-pay-from='" + esc(txn.from) + "' data-pay-to='" + esc(txn.to) + "' data-pay-amt='" + txn.amtMinor + "'>Mark paid</button>" +
            "</div>";
        }).join("");
        sDiv.querySelectorAll("[data-pay-from]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            opAddPayment(this.dataset.payFrom, this.dataset.payTo, parseInt(this.dataset.payAmt, 10) || 0);
          });
        });
      }
    }

    // Where it went. Only worth a surface once something is categorised — an all-
    // "Uncategorised" bar teaches nothing.
    if (catWrap && catList) {
      var real = sum.byCategory.filter(function (cat) { return cat.category !== "Uncategorised"; });
      if (!real.length) { catWrap.hidden = true; }
      else {
        catWrap.hidden = false;
        var top = sum.byCategory[0].total || 1;
        catList.innerHTML = sum.byCategory.map(function (cat) {
          var pct = Math.round((cat.total / (sum.total || 1)) * 100);
          return "<div class='sc-cat'><span class='sc-cat-name'>" + esc(cat.category) + "</span>" +
            "<span class='sc-cat-bar'><span class='sc-cat-fill' style='width:" + Math.max(2, Math.round((cat.total / top) * 100)) + "%'></span></span>" +
            "<span class='sc-cat-amt'>" + fmtBase(cat.total) + "</span>" +
            "<span class='sc-cat-pct'>" + pct + "%</span></div>";
        }).join("");
      }
    }

    // Settled payments, with an undo — the only destructive action here that is easy to
    // mistap, and the record is the point.
    if (payWrap && payList) {
      if (!state.payments.length) { payWrap.hidden = true; }
      else {
        payWrap.hidden = false;
        payList.innerHTML = state.payments.map(function (payment) {
          return "<div class='sp-row'><span class='sp-who'>" + esc(memberName(payment.from)) + " → " + esc(memberName(payment.to)) + "</span>" +
            "<span class='sp-amt'>" + fmtBase(payment.baseMinor) + "</span>" +
            (payment.on ? "<span class='sp-on'>" + esc(payment.on) + "</span>" : "") +
            "<button class='sp-undo' type='button' data-undo-p='" + esc(payment.id) + "' aria-label='Undo this payment'>Undo</button></div>";
        }).join("");
        payList.querySelectorAll("[data-undo-p]").forEach(function (btn) {
          btn.addEventListener("click", function () { opPaymentDel(this.dataset.undoP); });
        });
      }
    }
    applyLock();
  }

  function dayCount() {
    return Array.isArray(CFG.daysForBanner) && CFG.daysForBanner.length ? CFG.daysForBanner.length : null;
  }

  function render() {
    renderMembers(); renderNewRowOptions(); renderExpenses(); renderResults();
    applyLock();
  }

  /* M5 — make the lock VISIBLE and real, not just an early-return in the op functions.
     Runs after every render because the rows are rebuilt from scratch each time. Disabling
     the controls is the honest presentation: a field that accepts your typing and silently
     discards it is precisely the "slow failure wearing a helpful face" model/room.ts warns
     about. The figures themselves stay fully readable — that is the whole point of keeping
     the record. */
  function applyLock() {
    if (!LOCKED) return;
    wrap.setAttribute("data-locked", "1");
    wrap.querySelectorAll("input, select, button").forEach(function (el) {
      if (el.closest("[data-split-lock-note]")) return;
      // The summary PDF is a READ of the record, not a write to it — a settled trip is
      // precisely when someone wants to send round what it cost. Same for the per-row
      // disclosure and the filter controls: searching a finished trip for "what did the
      // hotel come to" is the main thing anyone does with it afterwards.
      if (el.id === "sSavePdf" || el.classList.contains("se-toggle")) return;
      if (el.closest("#sFilter")) return;
      el.disabled = true;
    });
    if (!wrap.querySelector("[data-split-lock-note]")) {
      var note = document.createElement("p");
      note.className = "split-lock-note";
      note.setAttribute("data-split-lock-note", "");
      note.setAttribute("role", "note");
      note.textContent =
        "This trip is settled — the budget is now a read-only record. Totals and who-owes-who stay here for good.";
      wrap.insertBefore(note, wrap.firstChild);
    }
  }

  /* ── live sync (records → state) ──────────────────────────────────────────── */
  function orderedFrom(map) {
    return Object.keys(map || {}).map(function (id) { return Object.assign({ id: id }, map[id]); })
      .sort(function (a, b) { return (a.order || a.createdAt || 0) - (b.order || b.createdAt || 0); });
  }
  function isEditingList() {
    var active = document.activeElement;
    return !!(active && active.closest && (active.closest("#sMemberList") || active.closest("#sExpenseList")));
  }
  var pendingRemote = false;
  // Remote change → always refresh results; defer the list re-render while the user is
  // mid-keystroke in a list input (so a teammate's edit never yanks their caret), and
  // flush it when they blur.
  function renderRemote() {
    renderResults();
    if (isEditingList()) { pendingRemote = true; return; }
    renderMembers(); renderNewRowOptions(); renderExpenses();
  }
  wrap.addEventListener("focusout", function () {
    setTimeout(function () { if (pendingRemote && !isEditingList()) { pendingRemote = false; render(); } }, 60);
  });

  /* A pre-V2 SHARED room keeps its split rule in `meta.customSplit` — trip-wide, exactly the
     design V2 replaced. Reading those expenses without it would treat a room that had Custom
     amounts switched on as an even split: same stored numbers, different balances, no
     warning. So the flag is still read, and applied as each expense's own EXACT method until
     someone edits that expense and gives it a rule of its own. Rooms are never rewritten by
     this — the server's records are left exactly as they are. */
  var roomRawExpenses = null;
  // The raw member map too — undo restores a deleted record verbatim (see opMemberDel), and
  // the normalized copy has already dropped createdBy/createdAt.
  var roomRawMembers = null;
  var roomLegacyCustom = false;

  function applyRoomExpenses() {
    if (!roomRawExpenses) return;
    state.expenses = orderedFrom(roomRawExpenses).map(function (raw) {
      var expense = normalizeExpense(raw);
      if (roomLegacyCustom && raw.method === undefined && expense.weights) expense.method = "EXACT";
      // Legacy room records carry no participant snapshot. Freeze the current group for
      // display/settlement only; nothing is written back, so this stays a read.
      if (!expense.participants) expense.participants = allIds();
      return expense;
    });
  }

  function bindRoom(joinedRoom) {
    room = joinedRoom;
    var members = joinedRoom.collection("members"), expenses = joinedRoom.collection("expenses"),
        payments = joinedRoom.collection("payments"), meta = joinedRoom.doc("meta");
    offFns.push(members.onChange(function (map) {
      // Was a hand-copied field list — the same shape of code that dropped `participants`
      // from expenses. Both echoes now go through the one normalizer.
      roomRawMembers = map;
      state.members = orderedFrom(map).map(normalizeMember);
      applyRoomExpenses(); // snapshots for legacy records follow the current roster
      renderRemote();
    }));
    offFns.push(expenses.onChange(function (map) {
      roomRawExpenses = map;
      applyRoomExpenses();
      renderRemote();
    }));
    offFns.push(payments.onChange(function (map) {
      state.payments = orderedFrom(map).map(normalizePayment);
      renderRemote();
    }));
    // meta may arrive before or after the expenses, so re-derive on either.
    offFns.push(meta.onChange(function (val) {
      roomLegacyCustom = !!(val && val.customSplit === true);
      applyRoomExpenses();
      renderRemote();
    }));
    setLive("live", "Live · shared with everyone on this guide.");
    offerStrandedRescue();
  }

  /* ── stranded solo-mode data ──────────────────────────────────────────────────
     A guide that gains a `roomId` switches source of truth: autoConnect() joins the room and
     never calls load(), by design ("the room is the single source of truth, so devices never
     inject stale copies"). Correct for a room that has data. Wrong for the case nobody
     designed for — a trip that was ALREADY entered in solo mode before the roomId existed.
     Korea is the live instance: it gained one in f50ca17, and the ledger typed during the trip
     is still sitting in this device's localStorage, unread, while the panel shows an empty room.

     persist() refuses to write while `room` is set, so that data has never been at risk of
     being overwritten — it is only invisible. This makes it visible again.

     Deliberately an OFFER, never automatic. Pushing one device's copy into a room every other
     device also reads is a genuine fork: if two people both kept a solo ledger, silently
     merging picks a winner and nobody is told. The reader knows which device was the real one;
     this asks them. It also only appears when the room is EMPTY, so it can never compete with
     a shared ledger that is already in use. */
  function strandedLocal() {
    var keys = [SK, SK + "-pre-v2"];
    if (legacyStoreKey) keys.push("tg-split-" + legacyStoreKey);
    for (var i = 0; i < keys.length; i++) {
      var raw;
      try { raw = localStorage.getItem(keys[i]); } catch (_) { continue; }
      if (!raw) continue;
      var parsed;
      try { parsed = JSON.parse(raw); } catch (_) { continue; }
      var memberCount = parsed && Array.isArray(parsed.members) ? parsed.members.length : 0;
      var expenseCount = parsed && Array.isArray(parsed.expenses) ? parsed.expenses.length : 0;
      if (memberCount || expenseCount) return { key: keys[i], data: parsed, members: memberCount, expenses: expenseCount };
    }
    return null;
  }

  function offerStrandedRescue() {
    if (!room) return;
    // Only into an EMPTY room. A room with anything in it is the group's real ledger.
    if (state.members.length || state.expenses.length) return;
    var found = strandedLocal();
    if (!found) return;
    var host = document.getElementById("sLive");
    if (!host || document.getElementById("sRescue")) return;

    var box = document.createElement("div");
    box.id = "sRescue";
    box.className = "s-rescue";
    var msg = document.createElement("p");
    msg.className = "s-rescue-msg";
    msg.textContent =
      "This device has a saved budget for this trip — " + found.members + " " +
      (found.members === 1 ? "person" : "people") + " and " + found.expenses + " " +
      (found.expenses === 1 ? "expense" : "expenses") + " — from before this guide had a shared room. " +
      "The shared room is empty. Restoring copies it in for everyone on this guide.";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "s-rescue-go";
    btn.textContent = "Restore this device's budget";
    btn.addEventListener("click", function () {
      btn.disabled = true;
      /* The identity remap is the whole risk here and it lives in model/records.ts, tested:
         a room mints its own ids, so every reference to a person (paidBy, participants, the
         weights map, both ends of a payment) has to move with them. Get it wrong and the
         amounts all arrive intact, the totals still add up, and the BALANCES are quietly
         wrong — the failure mode that does not look like one. `mint` is the room's own add(),
         which returns the new id synchronously. */
      var rekeyed = rekeyForRoom(migrate(found.data), function (member, i) {
        return room.collection("members").add({
          name: (member && member.name) || "", payment: (member && member.payment) || "", order: i,
        });
      });
      rekeyed.expenses.forEach(function (expense) { room.collection("expenses").add(expense); });
      rekeyed.payments.forEach(function (payment) { room.collection("payments").add(payment); });
      box.remove();
    });
    box.appendChild(msg);
    box.appendChild(btn);
    host.parentNode.insertBefore(box, host.nextSibling);
  }

  // Passive status line (no buttons). state = "connecting" | "live" | "offline".
  function setLive(stateName, text) {
    var el = document.getElementById("sLive");
    if (!el) return;
    el.hidden = false;
    el.setAttribute("data-state", stateName);
    var liveText = document.getElementById("sLiveText");
    if (liveText && text) liveText.textContent = text;
    // The room is world-readable only when sync is actually live — surface the privacy
    // notice then, and only then (local-only mode exposes nothing off-device).
    var priv = document.getElementById("sPrivacy");
    if (priv) priv.hidden = stateName !== "live";
  }

  // Join the one shared room for this guide. No code, no UI — the guide's salted roomId IS the
  // room, so every device viewing the same guide edits the same budget automatically. The
  // room is the single source of truth (no local seed), so devices never inject stale copies.
  function autoConnect() {
    var code = guideRoomId();
    if (!code) { load(); render(); return; }
    setLive("connecting", "Connecting to your group’s live budget…");
    joinTrip(code).then(function (joinedRoom) {
      bindRoom(joinedRoom);
    }).catch(function () {
      setLive("offline", "Offline — changes are saved on this device only.");
      load(); render();
    });
  }

  /* ── button wiring ───────────────────────── */
  var addPerson = document.getElementById("sAddPerson");
  if (addPerson) addPerson.addEventListener("click", opAddMember);

  var addExpense = document.getElementById("sAddExpense");
  var newPayerEl = document.getElementById("sNewPayer"), newDescEl = document.getElementById("sNewDesc"),
      newAmtEl = document.getElementById("sNewAmt"), newCurEl = document.getElementById("sNewCur");
  if (addExpense) {
    addExpense.addEventListener("click", function () {
      if (!state.members.length) return;
      var cur = (newCurEl && newCurEl.value) || LOCAL_CUR || BASE_CURRENCY;
      var money = moneyFields(newAmtEl.value, cur);
      if (!money.amountMinor) { newAmtEl.focus(); return; }
      var payer = memberPos(newPayerEl.value) !== -1 ? newPayerEl.value : state.members[0].id;
      opAddExpense(Object.assign({
        paidBy: payer,
        desc: newDescEl.value || "",
        method: "EQUAL",
        weights: null,
        // SNAPSHOT. The sharers as chosen right now — not "whoever the group turns
        // out to be later", which is what silently re-split day-1 dinners.
        participants: newPartIds(),
        category: "",
      }, money));
      newDescEl.value = ""; newAmtEl.value = ""; newParts = null; renderNewParts(); newDescEl.focus();
    });
    [newPayerEl, newDescEl, newAmtEl].forEach(function (el) {
      if (el) el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addExpense.click(); } });
    });
  }

  /* ── Save summary as PDF ──────────────────────────────────────────────────
     Opens an on-screen preview (issue #47) rather than printing straight away — see
     budget-sheet.js for why, and for the synchronous-gesture constraint that still
     applies once the preview's own Print button is clicked (CLAUDE.md boundary check
     #2 — the popup-blocker trap). */
  function currencyForSheet() {
    var live = getLastRate();
    if (live && live.rate) {
      return { code: live.code, rate: live.rate, date: live.date, live: !live.locked, locked: !!live.locked };
    }
    if (CFG.curCode && CFG.curFallbackRate) {
      return { code: CFG.curCode, rate: CFG.curFallbackRate, date: CFG.curFallbackAsOf || null, live: false, locked: false };
    }
    return null;
  }

  function sheetMeta() {
    var titleEl = document.querySelector(".mast-title") || document.querySelector(".masthead h1");
    var hero = document.querySelector(".mast-img");
    var range = [CFG.firstDayDate, CFG.lastDayDate].filter(Boolean).join(" – ");
    return {
      title: (titleEl && titleEl.textContent.trim()) || document.title.replace(/\s+—\s+Waypoint$/, ""),
      dateRange: range,
      // currentSrc so the printed sheet uses the srcset candidate the browser actually
      // fetched — it is already in cache, which a different URL would not be.
      coverSrc: hero ? (hero.currentSrc || hero.getAttribute("src")) : null,
      currency: currencyForSheet(),
      generatedOn: new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
      url: location.origin + location.pathname,
    };
  }

  var savePdfBtn = document.getElementById("sSavePdf");
  if (savePdfBtn) {
    savePdfBtn.addEventListener("click", function () {
      var summaryData = buildBudgetSummary(state.members, state.expenses, state.payments, dayCount());
      previewBudgetSummary(summaryData, sheetMeta());
    });
  }

  /* Filter controls. These live outside #sExpenseList so that rebuilding the list on every
     keystroke cannot destroy the input the traveller is typing into. */
  var filterQ = document.getElementById("sFilterQ");
  if (filterQ) filterQ.addEventListener("input", function () { filter.q = this.value.trim(); renderExpenses(); });
  var filterWho = document.getElementById("sFilterWho");
  if (filterWho) filterWho.addEventListener("change", function () { filter.who = this.value; renderExpenses(); });
  var filterCat = document.getElementById("sFilterCat");
  if (filterCat) filterCat.addEventListener("change", function () { filter.cat = this.value; renderExpenses(); });
  var filterClear = document.getElementById("sFilterClear");
  if (filterClear) {
    filterClear.addEventListener("click", function () {
      filter = { q: "", who: "", cat: "" };
      if (filterQ) filterQ.value = "";
      renderExpenses();
      if (filterQ) filterQ.focus();
    });
  }

  var undoBtn = document.getElementById("sUndoBtn");
  if (undoBtn) undoBtn.addEventListener("click", undoLast);
  var undoDismiss = document.getElementById("sUndoDismiss");
  if (undoDismiss) undoDismiss.addEventListener("click", function () { undoSlot = null; renderUndo(); });

  var copySettleBtn = document.getElementById("sCopySettle");
  if (copySettleBtn) {
    var copyDefault = copySettleBtn.textContent;
    copySettleBtn.addEventListener("click", function () {
      var calc = computeSettle();
      var lines = calc.txns.map(function (txn) {
        var via = (memberById(txn.to) || {}).payment;
        return memberName(txn.from) + " → " + memberName(txn.to) + ": " + fmtBase(txn.amtMinor) + (via ? " (via " + via + ")" : "");
      });
      var text = lines.length ? "Settle-up:\n" + lines.join("\n") : "All square — no transfers needed.";
      function done(ok) { copySettleBtn.textContent = ok ? "✓ Copied" : "Copy failed"; setTimeout(function () { copySettleBtn.textContent = copyDefault; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  }

  /* Guard the scroll-wheel-changes-focused-number-input footgun. */
  wrap.addEventListener("wheel", function (e) {
    var target = e.target;
    if (target && target.tagName === "INPUT" && target.type === "number" && document.activeElement === target) e.preventDefault();
  }, { passive: false });

  /* ── init ─────────────────────────────────── */
  if (hasFirebase()) {
    render();       // paint the empty shell immediately, then connect to the shared room
    autoConnect();
  } else {
    load();         // no config → private on-device calculator, exactly as before
    render();
  }
})();
