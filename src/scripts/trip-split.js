/* Waypoint Trip Split — the group budget calculator. Extracted from the TripSplit.astro
   inline script into a module, and re-keyed from array indices to STABLE IDS (members and
   expenses each carry an `id`; expenses reference the payer by member id; custom split is a
   { memberId: amount } map). Indices were fine for a solo calculator but would clobber under
   live multi-device sync — ids let concurrent edits merge. Behavior is otherwise identical to
   before; old index-based localStorage saves are migrated on load.

   Live sync (src/features/firebase) binds on top of this in a follow-up: mutations go through
   persist()/the store seam, and a room's records drive the same state. With no Firebase config
   or no joined trip, this stays exactly today's local-only calculator. */

import { settle } from "../lib/settle";

(function () {
  var wrap = document.getElementById("tripSplit");
  if (!wrap) return;

  var SK = "tg-split-" + (wrap.dataset.sk || "guide");
  var state = { members: [], expenses: [], customSplit: false };

  function newId() { return "i" + Math.random().toString(36).slice(2, 9); }

  /* ── persistence (local; the sync layer extends persist()) ────────────────── */
  function load() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(SK) || "null"); } catch (_) { return; }
    var migrated = migrate(raw);
    applyState(migrated);
    // Upgrade an old index-based save to the id-keyed format on disk immediately, so it
    // isn't re-migrated every load and the stored shape matches what sync will use.
    if (raw && migrated !== raw) persist();
  }
  function persist() {
    try { localStorage.setItem(SK, JSON.stringify(state)); } catch (_) {}
  }
  function applyState(s) {
    if (!s || typeof s !== "object") return false;
    if (Array.isArray(s.members))           state.members     = s.members;
    if (Array.isArray(s.expenses))          state.expenses    = s.expenses;
    if (typeof s.customSplit === "boolean") state.customSplit = s.customSplit;
    return true;
  }
  // Bring an old index-based save (members without ids; expense.paidBy = index;
  // customAmts = array) up to the id-keyed model, preserving existing budgets.
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
      } else if (e && e.split && typeof e.split === "object") {
        split = e.split;
      }
      var payIdx = e ? parseInt(e.paidBy, 10) : 0;
      var paidBy = ids[(isNaN(payIdx) || payIdx >= ids.length || payIdx < 0) ? 0 : payIdx] || (ids[0] || "");
      return { id: (e && e.id) || newId(), paidBy: paidBy, desc: (e && e.desc) || "", amount: (e && e.amount != null) ? e.amount : null, split: split };
    });
    return { members: members, expenses: expenses, customSplit: !!s.customSplit };
  }

  /* ── utilities ───────────────────────────── */
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmtUSD(v) { return "$" + (Math.round(Math.abs(v) * 100) / 100).toFixed(2); }
  function memberPos(id) { for (var i = 0; i < state.members.length; i++) if (state.members[i].id === id) return i; return -1; }
  function memberById(id) { var p = memberPos(id); return p === -1 ? null : state.members[p]; }
  function memberName(id) { var p = memberPos(id); return p === -1 ? "?" : (state.members[p].name || ("Person " + (p + 1))); }

  /* ── member rendering ────────────────────── */
  function renderMembers() {
    var list = document.getElementById("sMemberList");
    if (!list) return;
    if (!state.members.length) {
      list.innerHTML = "<p class='split-empty'>Add the people splitting costs.</p>";
      return;
    }
    list.innerHTML = state.members.map(function (m, i) {
      return "<div class='sm-row'>" +
        "<span class='sm-idx'>" + (i + 1) + "</span>" +
        "<input class='split-in sm-name' type='text' placeholder='Name'" +
          " value='" + esc(m.name) + "' data-mid='" + m.id + "' data-field='name' />" +
        "<input class='split-in sm-pay' type='text' placeholder='Venmo / Zelle / Kakao Pay…'" +
          " value='" + esc(m.payment || "") + "' data-mid='" + m.id + "' data-field='payment' />" +
        "<button class='split-del' type='button' data-del-m='" + m.id + "'" +
          " aria-label='Remove " + esc(m.name || "person") + "'>×</button>" +
        "</div>";
    }).join("");

    list.querySelectorAll("[data-field]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var m = memberById(this.dataset.mid);
        if (!m) return;
        m[this.dataset.field] = this.value;
        persist();
        if (this.dataset.field === "name") renderNewRowOptions();
        renderResults();
      });
    });
    list.querySelectorAll("[data-del-m]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = this.dataset.delM, p = memberPos(id);
        if (p === -1) return;
        state.members.splice(p, 1);
        state.expenses.forEach(function (e) {
          if (e.paidBy === id) e.paidBy = state.members.length ? state.members[0].id : "";
          if (e.split) delete e.split[id];
        });
        persist(); render();
      });
    });
  }

  /* ── expense rendering ───────────────────── */
  function memberOptions(selId) {
    var chosen = memberPos(selId) !== -1 ? selId : (state.members[0] && state.members[0].id);
    return state.members.map(function (m, i) {
      return "<option value='" + m.id + "'" + (m.id === chosen ? " selected" : "") + ">" +
        esc(m.name || ("Person " + (i + 1))) + "</option>";
    }).join("");
  }
  function renderNewRowOptions() {
    var sel = document.getElementById("sNewPayer");
    if (!sel) return;
    var keep = sel.value;
    sel.innerHTML = memberOptions(keep);
  }

  function evenSplit(total) {
    var n = state.members.length, even = total / (n || 1), map = {};
    state.members.forEach(function (m) { map[m.id] = parseFloat(even.toFixed(2)); });
    return map;
  }

  function renderExpenses() {
    var newCard = document.getElementById("sNewCard");
    var list = document.getElementById("sExpenseList");
    if (!list) return;

    var hasMembers = state.members.length > 0;
    if (newCard) newCard.hidden = !hasMembers;

    if (!hasMembers) {
      list.innerHTML = "<p class='split-empty'>Add people first, then record who paid what.</p>";
      return;
    }
    if (!state.expenses.length) {
      list.innerHTML = "<p class='split-empty'>No expenses yet — fill in the row above and tap + Add expense.</p>";
      return;
    }

    list.innerHTML = state.expenses.map(function (exp) {
      var customBlock = "";
      if (state.customSplit) {
        var total = parseFloat(exp.amount) || 0;
        if (!exp.split || Object.keys(exp.split).length !== state.members.length) exp.split = evenSplit(total);
        var sumCA = state.members.reduce(function (a, m) { return a + (parseFloat(exp.split[m.id]) || 0); }, 0);
        var diff = Math.abs(sumCA - total);
        customBlock =
          "<div class='se-custom" + (diff > 0.015 ? " se-custom--warn" : "") + "'>" +
          state.members.map(function (m, mi) {
            return "<label class='se-cl'><span class='se-cl-name'>" + esc(m.name || ("P" + (mi + 1))) + "</span>" +
              "<input class='split-in se-ca' type='number' min='0' step='0.01' inputmode='decimal'" +
              " value='" + (parseFloat(exp.split[m.id]) || 0).toFixed(2) + "'" +
              " data-eid='" + exp.id + "' data-mid='" + m.id + "' /></label>";
          }).join("") +
          (diff > 0.015 ? "<span class='se-warn'>Shares sum " + fmtUSD(sumCA) + " — total is " + fmtUSD(total) + "</span>" : "") +
          "</div>";
      }

      return "<div class='se-row' data-eid='" + exp.id + "'>" +
        "<div class='se-main'>" +
        "<select class='split-in se-payer' data-eid='" + exp.id + "'>" + memberOptions(exp.paidBy) + "</select>" +
        "<input class='split-in se-desc' type='text' placeholder='What for?'" +
          " value='" + esc(exp.desc || "") + "' data-eid='" + exp.id + "' data-field='desc' />" +
        "<div class='se-amt-wrap'><span class='se-cur'>$</span>" +
        "<input class='split-in se-amt' type='number' min='0' step='0.01' inputmode='decimal' placeholder='0.00'" +
          " value='" + (exp.amount != null ? String(exp.amount) : "") + "'" +
          " data-eid='" + exp.id + "' data-field='amount' /></div>" +
        "<button class='split-del' type='button' data-del-e='" + exp.id + "' aria-label='Remove expense'>×</button>" +
        "</div>" + customBlock + "</div>";
    }).join("");

    function expById(id) { for (var i = 0; i < state.expenses.length; i++) if (state.expenses[i].id === id) return state.expenses[i]; return null; }

    list.querySelectorAll(".se-payer").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var e = expById(this.dataset.eid); if (!e) return;
        e.paidBy = this.value;
        persist(); renderResults();
      });
    });
    list.querySelectorAll("[data-field]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var e = expById(this.dataset.eid); if (!e) return;
        var fld = this.dataset.field;
        e[fld] = fld === "amount" ? (parseFloat(this.value) || null) : this.value;
        if (fld === "amount" && !state.customSplit) e.split = evenSplit(parseFloat(this.value) || 0);
        persist();
        // Don't re-render the list here — it would drop focus mid-keystroke.
        renderResults();
      });
    });
    list.querySelectorAll(".se-ca").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var e = expById(this.dataset.eid); if (!e) return;
        if (!e.split) e.split = {};
        e.split[this.dataset.mid] = parseFloat(this.value) || 0;
        persist(); renderResults();
      });
    });
    list.querySelectorAll("[data-del-e]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = this.dataset.delE;
        for (var i = 0; i < state.expenses.length; i++) if (state.expenses[i].id === id) { state.expenses.splice(i, 1); break; }
        persist(); renderExpenses(); renderResults();
      });
    });
  }

  /* ── results (uses the tested pure settle()) ── */
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

    var ids = state.members.map(function (m) { return m.id; });
    var calc = settle(ids, state.expenses.map(function (e) { return { paidBy: e.paidBy, amount: e.amount, split: e.split }; }), state.customSplit);

    if (bDiv) {
      bDiv.innerHTML = state.members.map(function (m) {
        var bal = calc.balances[m.id] || 0, abs = Math.abs(bal);
        var cls = bal > 0.005 ? "sb-owed" : bal < -0.005 ? "sb-owes" : "sb-even";
        var verb = bal > 0.005 ? "is owed" : bal < -0.005 ? "owes" : "settled ✓";
        return "<div class='sb-row " + cls + "'>" +
          "<span class='sb-name'>" + esc(memberName(m.id)) + "</span>" +
          "<span class='sb-verb'>" + verb + "</span>" +
          "<span class='sb-amt'>" + (abs > 0.005 ? fmtUSD(abs) : "—") + "</span></div>";
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
          return "<div class='st-row'><div class='st-parties'>" +
            "<span class='st-from'>" + esc(memberName(t.from)) + "</span>" +
            "<span class='st-arrow'>→</span>" +
            "<span class='st-to'>" + esc(memberName(t.to)) + "</span></div>" +
            "<div class='st-amt-row'><span class='st-usd'>" + fmtUSD(t.amt) + "</span></div>" +
            (payMethod ? "<div class='st-via'>via " + esc(payMethod) + "</div>" : "") + "</div>";
        }).join("");
      }
    }
  }

  function render() { renderMembers(); renderNewRowOptions(); renderExpenses(); renderResults(); }

  /* ── button wiring ───────────────────────── */
  var addPerson = document.getElementById("sAddPerson");
  if (addPerson) addPerson.addEventListener("click", function () {
    state.members.push({ id: newId(), name: "", payment: "" });
    persist(); renderMembers(); renderNewRowOptions(); renderExpenses();
  });

  var addExpense = document.getElementById("sAddExpense");
  var newPayerEl = document.getElementById("sNewPayer");
  var newDescEl = document.getElementById("sNewDesc");
  var newAmtEl = document.getElementById("sNewAmt");
  if (addExpense) {
    addExpense.addEventListener("click", function () {
      if (!state.members.length) return;
      var amt = parseFloat(newAmtEl.value);
      if (!amt || amt <= 0) { newAmtEl.focus(); return; }
      var payer = memberPos(newPayerEl.value) !== -1 ? newPayerEl.value : state.members[0].id;
      state.expenses.push({ id: newId(), paidBy: payer, desc: newDescEl.value || "", amount: amt, split: evenSplit(amt) });
      persist(); renderExpenses(); renderResults();
      newDescEl.value = ""; newAmtEl.value = "";
      newDescEl.focus();
    });
    [newPayerEl, newDescEl, newAmtEl].forEach(function (el) {
      if (el) el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); addExpense.click(); }
      });
    });
  }

  /* split mode */
  var modeEven = document.getElementById("sModeEven"), modeCustom = document.getElementById("sModeCustom");
  function syncModeUI() {
    if (modeEven)   modeEven.classList.toggle("scm-active", !state.customSplit);
    if (modeCustom) modeCustom.classList.toggle("scm-active", state.customSplit);
  }
  syncModeUI();
  if (modeEven)   modeEven.addEventListener("click", function () { state.customSplit = false; persist(); syncModeUI(); renderExpenses(); renderResults(); });
  if (modeCustom) modeCustom.addEventListener("click", function () { state.customSplit = true; persist(); syncModeUI(); renderExpenses(); renderResults(); });

  /* Copy the who-pays-who result as text for the group chat. */
  var copySettleBtn = document.getElementById("sCopySettle");
  if (copySettleBtn) {
    var copyDefault = copySettleBtn.textContent;
    copySettleBtn.addEventListener("click", function () {
      var ids = state.members.map(function (m) { return m.id; });
      var calc = settle(ids, state.expenses.map(function (e) { return { paidBy: e.paidBy, amount: e.amount, split: e.split }; }), state.customSplit);
      var lines = calc.txns.map(function (t) {
        var via = (memberById(t.to) || {}).payment;
        return memberName(t.from) + " → " + memberName(t.to) + ": " + fmtUSD(t.amt) + (via ? " (via " + via + ")" : "");
      });
      var text = lines.length ? "Settle-up:\n" + lines.join("\n") : "All square — no transfers needed.";
      function flash(ok) {
        copySettleBtn.textContent = ok ? "✓ Copied" : "Copy failed";
        setTimeout(function () { copySettleBtn.textContent = copyDefault; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash(true); }, function () { flash(false); });
      } else flash(false);
    });
  }

  /* Guard the scroll-wheel-changes-focused-number-input footgun. */
  wrap.addEventListener("wheel", function (e) {
    var t = e.target;
    if (t && t.tagName === "INPUT" && t.type === "number" && document.activeElement === t) e.preventDefault();
  }, { passive: false });

  /* ── init ─────────────────────────────────── */
  load();
  render();
})();
