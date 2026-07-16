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
   public API. */

import { settle } from "../model/settle";
import { hasFirebase, joinTrip, normalizeCode } from "../../firebase/index.js";

(function () {
  var wrap = document.getElementById("tripSplit");
  if (!wrap) return;

  var SK = "tg-split-" + (wrap.dataset.sk || "guide");
  var state = { members: [], expenses: [], customSplit: false };
  var room = null;      // Firebase room when synced, else null
  var offFns = [];      // room onChange unsubscribers

  function newId() { return "i" + Math.random().toString(36).slice(2, 9); }
  function nextOrder() { return Date.now(); }

  /* ── local persistence (solo mode) ────────────────────────────────────────── */
  function load() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(SK) || "null"); } catch (_) { return; }
    var migrated = migrate(raw);
    applyState(migrated);
    if (raw && migrated !== raw) persist(); // upgrade an old index-based save on disk once
  }
  function persist() {
    if (room) return; // synced: the room is the source of truth, not localStorage
    try { localStorage.setItem(SK, JSON.stringify(state)); } catch (_) {}
  }
  function applyState(s) {
    if (!s || typeof s !== "object") return false;
    if (Array.isArray(s.members))           state.members     = s.members;
    if (Array.isArray(s.expenses))          state.expenses    = s.expenses;
    if (typeof s.customSplit === "boolean") state.customSplit = s.customSplit;
    return true;
  }
  function migrate(s) {
    if (!s || typeof s !== "object" || !Array.isArray(s.members)) return s;
    var needs = s.members.some(function (m) { return m && !m.id; });
    if (!needs) return s;
    var ids = s.members.map(function (m) { return (m && m.id) || newId(); });
    var members = s.members.map(function (m, i) { return { id: ids[i], name: (m && m.name) || "", payment: (m && m.payment) || "" }; });
    var expenses = (Array.isArray(s.expenses) ? s.expenses : []).map(function (e) {
      var split = null;
      if (e && Array.isArray(e.customAmts)) {
        split = {};
        e.customAmts.forEach(function (amt, i) { if (ids[i] != null) split[ids[i]] = parseFloat(amt) || 0; });
      } else if (e && e.split && typeof e.split === "object") { split = e.split; }
      var payIdx = e ? parseInt(e.paidBy, 10) : 0;
      var paidBy = ids[(isNaN(payIdx) || payIdx >= ids.length || payIdx < 0) ? 0 : payIdx] || (ids[0] || "");
      return { id: (e && e.id) || newId(), paidBy: paidBy, desc: (e && e.desc) || "", amount: (e && e.amount != null) ? e.amount : null, split: split, participants: (e && e.participants) || null };
    });
    return { members: members, expenses: expenses, customSplit: !!s.customSplit };
  }

  /* ── utilities ───────────────────────────── */
  function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fmtUSD(v) { return "$" + (Math.round(Math.abs(v) * 100) / 100).toFixed(2); }
  function memberPos(id) { for (var i = 0; i < state.members.length; i++) if (state.members[i].id === id) return i; return -1; }
  function memberById(id) { var p = memberPos(id); return p === -1 ? null : state.members[p]; }
  function memberName(id) { var p = memberPos(id); return p === -1 ? "?" : (state.members[p].name || ("Person " + (p + 1))); }
  function expenseById(id) { for (var i = 0; i < state.expenses.length; i++) if (state.expenses[i].id === id) return state.expenses[i]; return null; }
  // Who shares an expense: its own participant list, or the whole group when it has none
  // (which is every expense recorded before participants existed).
  function sharersOf(exp) {
    var named = (exp && exp.participants || []).filter(function (id) { return memberPos(id) !== -1; });
    return named.length ? named : state.members.map(function (m) { return m.id; });
  }
  function isSharer(exp, id) { return sharersOf(exp).indexOf(id) !== -1; }
  // Even split across the given ids (defaults to everyone). Keyed by id, so the map itself
  // never charges a non-participant.
  function evenSplit(total, ids) {
    var list = (ids && ids.length) ? ids : state.members.map(function (m) { return m.id; });
    var even = total / (list.length || 1), map = {};
    list.forEach(function (id) { map[id] = parseFloat(even.toFixed(2)); });
    return map;
  }
  // Toggle one person in/out of an expense. Excluding the last sharer is refused — an
  // expense nobody shares has no meaning and would divide by zero.
  function opToggleSharer(eid, mid) {
    var e = expenseById(eid); if (!e) return;
    var cur = sharersOf(e);
    var next = cur.indexOf(mid) !== -1 ? cur.filter(function (x) { return x !== mid; }) : cur.concat([mid]);
    if (!next.length) return;
    var patch = { participants: next };
    if (!state.customSplit) patch.split = evenSplit(parseFloat(e.amount) || 0, next);
    opExpenseField(eid, patch);
  }

  /* ── mutation ops — route to the room when synced, else mutate local state ─────
     In synced mode the mutation writes one record; the room's onChange echo (fired
     locally by Realtime Database, so it feels instant) rebuilds state and re-renders. */
  function opAddMember() {
    if (room) { room.collection("members").add({ name: "", payment: "", order: nextOrder() }); }
    else { state.members.push({ id: newId(), name: "", payment: "" }); persist(); renderMembers(); renderNewRowOptions(); renderExpenses(); }
  }
  function opMemberField(id, field, value) {
    if (room) { var p = {}; p[field] = value; room.collection("members").update(id, p); }
    else { var m = memberById(id); if (m) { m[field] = value; persist(); if (field === "name") renderNewRowOptions(); renderResults(); } }
  }
  function opMemberDel(id) {
    if (room) {
      room.collection("members").remove(id);
      var fallback = (state.members.filter(function (x) { return x.id !== id; })[0] || {}).id || "";
      state.expenses.forEach(function (e) {
        if (e.paidBy === id) room.collection("expenses").update(e.id, { paidBy: fallback });
        if (e.split && (id in e.split)) { var s = Object.assign({}, e.split); delete s[id]; room.collection("expenses").update(e.id, { split: s }); }
        // Drop the departed member from any expense that named them, so no ghost id is left
        // in the shared room. If they were the ONLY named sharer, clear the list entirely —
        // that reverts the expense to the whole group rather than leaving it shared by nobody.
        if (e.participants && e.participants.indexOf(id) !== -1) {
          var pruned = e.participants.filter(function (x) { return x !== id; });
          room.collection("expenses").update(e.id, { participants: pruned.length ? pruned : null });
        }
      });
    } else {
      var pos = memberPos(id); if (pos === -1) return;
      state.members.splice(pos, 1);
      state.expenses.forEach(function (e) {
        if (e.paidBy === id) e.paidBy = state.members.length ? state.members[0].id : "";
        if (e.split) delete e.split[id];
        if (e.participants) { var pr = e.participants.filter(function (x) { return x !== id; }); e.participants = pr.length ? pr : null; }
      });
      persist(); render();
    }
  }
  function opAddExpense(data) {
    if (room) { room.collection("expenses").add(Object.assign({ order: nextOrder() }, data)); }
    else { state.expenses.push(Object.assign({ id: newId() }, data)); persist(); renderExpenses(); renderResults(); }
  }
  function opExpenseField(id, patch) {
    if (room) { room.collection("expenses").update(id, patch); }
    else { var e = expenseById(id); if (e) { Object.assign(e, patch); persist(); renderResults(); } }
  }
  function opExpenseSplit(id, mid, value) {
    var e = expenseById(id);
    var cur = e && e.split ? Object.assign({}, e.split) : {};
    cur[mid] = parseFloat(value) || 0;
    if (room) { room.collection("expenses").update(id, { split: cur }); }
    else { if (e) { e.split = cur; persist(); renderResults(); } }
  }
  function opExpenseDel(id) {
    if (room) { room.collection("expenses").remove(id); }
    else { for (var i = 0; i < state.expenses.length; i++) if (state.expenses[i].id === id) { state.expenses.splice(i, 1); break; } persist(); renderExpenses(); renderResults(); }
  }
  function opSetCustomSplit(v) {
    if (room) { room.doc("meta").update({ customSplit: v }); }
    else { state.customSplit = v; persist(); syncModeUI(); renderExpenses(); renderResults(); }
  }

  /* ── member rendering ────────────────────── */
  function renderMembers() {
    var list = document.getElementById("sMemberList");
    if (!list) return;
    if (!state.members.length) { list.innerHTML = "<p class='split-empty'>Add the people splitting costs.</p>"; return; }
    list.innerHTML = state.members.map(function (m, i) {
      return "<div class='sm-row'>" +
        "<span class='sm-idx'>" + (i + 1) + "</span>" +
        "<input class='split-in sm-name' type='text' placeholder='Name' value='" + esc(m.name) + "' data-mid='" + m.id + "' data-field='name' />" +
        "<input class='split-in sm-pay' type='text' placeholder='Venmo / Zelle / Kakao Pay…' value='" + esc(m.payment || "") + "' data-mid='" + m.id + "' data-field='payment' />" +
        "<button class='split-del' type='button' data-del-m='" + m.id + "' aria-label='Remove " + esc(m.name || "person") + "'>×</button>" +
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
    return state.members.map(function (m, i) {
      return "<option value='" + m.id + "'" + (m.id === chosen ? " selected" : "") + ">" + esc(m.name || ("Person " + (i + 1))) + "</option>";
    }).join("");
  }
  function renderNewRowOptions() {
    var sel = document.getElementById("sNewPayer");
    if (!sel) return;
    sel.innerHTML = memberOptions(sel.value);
  }
  function renderExpenses() {
    var newCard = document.getElementById("sNewCard");
    var list = document.getElementById("sExpenseList");
    if (!list) return;
    var hasMembers = state.members.length > 0;
    if (newCard) newCard.hidden = !hasMembers;
    if (!hasMembers) { list.innerHTML = "<p class='split-empty'>Add people first, then record who paid what.</p>"; return; }
    if (!state.expenses.length) { list.innerHTML = "<p class='split-empty'>No expenses yet — fill in the row above and tap + Add expense.</p>"; return; }

    list.innerHTML = state.expenses.map(function (exp) {
      var shareIds = sharersOf(exp);
      // Only offer the who-shared-this row when there's actually a subset to pick — with
      // one person it's noise.
      var partBlock = state.members.length > 1
        ? "<div class='se-parts'><span class='se-parts-lbl'>Split between</span>" +
            state.members.map(function (m, mi) {
              var on = shareIds.indexOf(m.id) !== -1;
              return "<button type='button' class='se-part" + (on ? " se-part-on" : "") + "' data-eid='" + exp.id +
                "' data-pid='" + m.id + "' aria-pressed='" + (on ? "true" : "false") + "'>" +
                esc(m.name || ("P" + (mi + 1))) + "</button>";
            }).join("") +
            (shareIds.length < state.members.length
              ? "<span class='se-parts-note'>÷ " + shareIds.length + "</span>" : "") +
          "</div>"
        : "";

      var customBlock = "";
      if (state.customSplit) {
        var total = parseFloat(exp.amount) || 0;
        // Custom amounts are only offered for the people actually sharing the expense.
        if (!exp.split || Object.keys(exp.split).length !== shareIds.length) exp.split = evenSplit(total, shareIds);
        var sumCA = shareIds.reduce(function (a, id) { return a + (parseFloat(exp.split[id]) || 0); }, 0);
        var diff = Math.abs(sumCA - total);
        customBlock = "<div class='se-custom" + (diff > 0.015 ? " se-custom--warn" : "") + "'>" +
          shareIds.map(function (id) {
            var mi = memberPos(id), m = state.members[mi];
            return "<label class='se-cl'><span class='se-cl-name'>" + esc(m.name || ("P" + (mi + 1))) + "</span>" +
              "<input class='split-in se-ca' type='number' min='0' step='0.01' inputmode='decimal' value='" + (parseFloat(exp.split[id]) || 0).toFixed(2) + "' data-eid='" + exp.id + "' data-mid='" + id + "' /></label>";
          }).join("") +
          (diff > 0.015 ? "<span class='se-warn'>Shares sum " + fmtUSD(sumCA) + " — total is " + fmtUSD(total) + "</span>" : "") + "</div>";
      }
      return "<div class='se-row' data-eid='" + exp.id + "'><div class='se-main'>" +
        "<select class='split-in se-payer' data-eid='" + exp.id + "'>" + memberOptions(exp.paidBy) + "</select>" +
        "<input class='split-in se-desc' type='text' placeholder='What for?' value='" + esc(exp.desc || "") + "' data-eid='" + exp.id + "' data-field='desc' />" +
        "<div class='se-amt-wrap'><span class='se-cur'>$</span>" +
        "<input class='split-in se-amt' type='number' min='0' step='0.01' inputmode='decimal' placeholder='0.00' value='" + (exp.amount != null ? String(exp.amount) : "") + "' data-eid='" + exp.id + "' data-field='amount' /></div>" +
        "<button class='split-del' type='button' data-del-e='" + exp.id + "' aria-label='Remove expense'>×</button>" +
        "</div>" + partBlock + customBlock + "</div>";
    }).join("");

    list.querySelectorAll(".se-payer").forEach(function (sel) {
      sel.addEventListener("change", function () { opExpenseField(this.dataset.eid, { paidBy: this.value }); });
    });
    list.querySelectorAll("[data-field]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var fld = this.dataset.field;
        var patch = {};
        patch[fld] = fld === "amount" ? (parseFloat(this.value) || null) : this.value;
        // Re-even only across whoever actually shares this expense, not the whole group.
        if (fld === "amount" && !state.customSplit) patch.split = evenSplit(parseFloat(this.value) || 0, sharersOf(expenseById(this.dataset.eid) || {}));
        opExpenseField(this.dataset.eid, patch);
      });
    });
    list.querySelectorAll(".se-part").forEach(function (btn) {
      btn.addEventListener("click", function () { opToggleSharer(this.dataset.eid, this.dataset.pid); });
    });
    list.querySelectorAll(".se-ca").forEach(function (inp) {
      inp.addEventListener("input", function () { opExpenseSplit(this.dataset.eid, this.dataset.mid, this.value); });
    });
    list.querySelectorAll("[data-del-e]").forEach(function (btn) {
      btn.addEventListener("click", function () { opExpenseDel(this.dataset.delE); });
    });
  }

  /* ── results (uses the tested pure settle()) ── */
  function computeSettle() {
    var ids = state.members.map(function (m) { return m.id; });
    return settle(ids, state.expenses.map(function (e) { return { paidBy: e.paidBy, amount: e.amount, split: e.split, participants: e.participants }; }), state.customSplit);
  }
  function renderResults() {
    var card = document.getElementById("sResults"), summary = document.getElementById("sSummary");
    var bDiv = document.getElementById("sBalances"), sDiv = document.getElementById("sSettlements");
    var sCount = document.getElementById("sSettleCount"), totUSD = document.getElementById("sTotalUSD");
    if (!state.members.length || !state.expenses.length) {
      if (card) card.hidden = true;
      if (summary) summary.hidden = true;
      return;
    }
    if (card) card.hidden = false;
    if (summary) summary.hidden = false;
    var total = state.expenses.reduce(function (s, e) { return s + (parseFloat(e.amount) || 0); }, 0);
    if (totUSD) totUSD.textContent = "$" + total.toFixed(2);
    var calc = computeSettle();
    if (bDiv) {
      bDiv.innerHTML = state.members.map(function (m) {
        var bal = calc.balances[m.id] || 0, abs = Math.abs(bal);
        var cls = bal > 0.005 ? "sb-owed" : bal < -0.005 ? "sb-owes" : "sb-even";
        var verb = bal > 0.005 ? "is owed" : bal < -0.005 ? "owes" : "settled ✓";
        return "<div class='sb-row " + cls + "'><span class='sb-name'>" + esc(memberName(m.id)) + "</span><span class='sb-verb'>" + verb + "</span><span class='sb-amt'>" + (abs > 0.005 ? fmtUSD(abs) : "—") + "</span></div>";
      }).join("");
    }
    if (sDiv) {
      if (!calc.txns.length) {
        sDiv.innerHTML = "<p class='split-settle-ok'>All square — no transfers needed.</p>";
        if (sCount) sCount.textContent = "";
      } else {
        if (sCount) sCount.textContent = calc.txns.length + " payment" + (calc.txns.length > 1 ? "s" : "");
        sDiv.innerHTML = calc.txns.map(function (t) {
          var payMethod = (memberById(t.to) || {}).payment || "";
          return "<div class='st-row'><div class='st-parties'><span class='st-from'>" + esc(memberName(t.from)) + "</span><span class='st-arrow'>→</span><span class='st-to'>" + esc(memberName(t.to)) + "</span></div>" +
            "<div class='st-amt-row'><span class='st-usd'>" + fmtUSD(t.amt) + "</span></div>" +
            (payMethod ? "<div class='st-via'>via " + esc(payMethod) + "</div>" : "") + "</div>";
        }).join("");
      }
    }
  }
  function render() { renderMembers(); renderNewRowOptions(); renderExpenses(); renderResults(); }

  /* ── live sync (records → state) ──────────────────────────────────────────── */
  function orderedFrom(map) {
    return Object.keys(map || {}).map(function (id) { return Object.assign({ id: id }, map[id]); })
      .sort(function (a, b) { return (a.order || a.createdAt || 0) - (b.order || b.createdAt || 0); });
  }
  function isEditingList() {
    var a = document.activeElement;
    return !!(a && a.closest && (a.closest("#sMemberList") || a.closest("#sExpenseList")));
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

  function bindRoom(r) {
    room = r;
    var members = r.collection("members"), expenses = r.collection("expenses"), meta = r.doc("meta");
    offFns.push(members.onChange(function (map) {
      state.members = orderedFrom(map).map(function (m) { return { id: m.id, name: m.name || "", payment: m.payment || "", order: m.order }; });
      renderRemote();
    }));
    offFns.push(expenses.onChange(function (map) {
      state.expenses = orderedFrom(map).map(function (e) { return { id: e.id, paidBy: e.paidBy || "", desc: e.desc || "", amount: e.amount != null ? e.amount : null, split: e.split || null, order: e.order }; });
      renderRemote();
    }));
    offFns.push(meta.onChange(function (v) { if (v && typeof v.customSplit === "boolean") { state.customSplit = v.customSplit; syncModeUI(); renderRemote(); } }));
    setLive("live", "Live · shared with everyone on this guide.");
  }

  // Passive status line (no buttons). state = "connecting" | "live" | "offline".
  function setLive(stateName, text) {
    var el = document.getElementById("sLive");
    if (!el) return;
    el.hidden = false;
    el.setAttribute("data-state", stateName);
    var t = document.getElementById("sLiveText");
    if (t && text) t.textContent = text;
  }

  // Join the one shared room for this guide. No code, no UI — the guide's storeKey IS the
  // room, so every device viewing the same guide edits the same budget automatically. The
  // room is the single source of truth (no local seed), so devices never inject stale copies.
  function autoConnect() {
    var roomId = normalizeCode(wrap.dataset.sk || "guide");
    if (!roomId) { load(); render(); return; }
    setLive("connecting", "Connecting to your group’s live budget…");
    joinTrip(roomId).then(function (r) {
      bindRoom(r); // room.onChange populates state + renders; flips the indicator to Live
    }).catch(function () {
      // Couldn't reach Firebase — fall back to this device's local copy so the tool still works.
      setLive("offline", "Offline — changes are saved on this device only.");
      load(); render();
    });
  }

  /* ── button wiring ───────────────────────── */
  var addPerson = document.getElementById("sAddPerson");
  if (addPerson) addPerson.addEventListener("click", opAddMember);

  var addExpense = document.getElementById("sAddExpense");
  var newPayerEl = document.getElementById("sNewPayer"), newDescEl = document.getElementById("sNewDesc"), newAmtEl = document.getElementById("sNewAmt");
  if (addExpense) {
    addExpense.addEventListener("click", function () {
      if (!state.members.length) return;
      var amt = parseFloat(newAmtEl.value);
      if (!amt || amt <= 0) { newAmtEl.focus(); return; }
      var payer = memberPos(newPayerEl.value) !== -1 ? newPayerEl.value : state.members[0].id;
      opAddExpense({ paidBy: payer, desc: newDescEl.value || "", amount: amt, split: evenSplit(amt) });
      newDescEl.value = ""; newAmtEl.value = ""; newDescEl.focus();
    });
    [newPayerEl, newDescEl, newAmtEl].forEach(function (el) {
      if (el) el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addExpense.click(); } });
    });
  }

  var modeEven = document.getElementById("sModeEven"), modeCustom = document.getElementById("sModeCustom");
  function syncModeUI() {
    if (modeEven)   modeEven.classList.toggle("scm-active", !state.customSplit);
    if (modeCustom) modeCustom.classList.toggle("scm-active", state.customSplit);
  }
  if (modeEven)   modeEven.addEventListener("click", function () { opSetCustomSplit(false); });
  if (modeCustom) modeCustom.addEventListener("click", function () { opSetCustomSplit(true); });

  var copySettleBtn = document.getElementById("sCopySettle");
  if (copySettleBtn) {
    var copyDefault = copySettleBtn.textContent;
    copySettleBtn.addEventListener("click", function () {
      var calc = computeSettle();
      var lines = calc.txns.map(function (t) {
        var via = (memberById(t.to) || {}).payment;
        return memberName(t.from) + " → " + memberName(t.to) + ": " + fmtUSD(t.amt) + (via ? " (via " + via + ")" : "");
      });
      var text = lines.length ? "Settle-up:\n" + lines.join("\n") : "All square — no transfers needed.";
      function done(ok) { copySettleBtn.textContent = ok ? "✓ Copied" : "Copy failed"; setTimeout(function () { copySettleBtn.textContent = copyDefault; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  }

  /* Guard the scroll-wheel-changes-focused-number-input footgun. */
  wrap.addEventListener("wheel", function (e) {
    var t = e.target;
    if (t && t.tagName === "INPUT" && t.type === "number" && document.activeElement === t) e.preventDefault();
  }, { passive: false });

  /* ── init ─────────────────────────────────── */
  syncModeUI();
  if (hasFirebase()) {
    render();       // paint the empty shell immediately, then connect to the shared room
    autoConnect();
  } else {
    load();         // no config → private on-device calculator, exactly as before
    render();
  }
})();
