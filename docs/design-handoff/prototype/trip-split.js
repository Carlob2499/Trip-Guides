/* trip-split.js — settlement engine ported verbatim in behaviour from the repo's
   src/features/trip-split/model/{money,settle,summary}.ts. Integer minor units throughout,
   largest-remainder allocation, payments discharge debt, minimum-transfers greedy settle.
   No DOM, no formatting — the UI renders what these return. */
(function (root) {
  "use strict";

  // ---- money.ts: allocate a total across members with no rounding drift ----
  function computeSplits(totalMinor, method, parts) {
    var total = Math.round(Number(totalMinor) || 0);
    var n = parts.length;
    if (!n || !total) return parts.map(function (p) { return { memberId: p.memberId, amountMinor: 0 }; });

    var weights;
    if (method === "EQUAL") weights = parts.map(function () { return 1; });
    else weights = parts.map(function (p) { return Math.max(0, Number(p.weight) || 0); });

    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    if (sum <= 0) weights = parts.map(function () { return 1; }), sum = n;

    // floor each share, then hand out the leftover minor units by largest remainder so the
    // parts sum EXACTLY to the total (the repo's fix for the missing-cent phantom balance)
    var exact = weights.map(function (w) { return (total * w) / sum; });
    var floors = exact.map(function (x) { return Math.floor(x); });
    var used = floors.reduce(function (a, b) { return a + b; }, 0);
    var left = total - used;
    var order = exact
      .map(function (x, i) { return { i: i, rem: x - Math.floor(x) }; })
      .sort(function (a, b) { return b.rem - a.rem || a.i - b.i; });
    for (var k = 0; k < left; k++) floors[order[k % n].i] += 1;

    return parts.map(function (p, i) { return { memberId: p.memberId, amountMinor: floors[i] }; });
  }

  // ---- settle.ts ----
  function expenseShares(memberIds, exp) {
    var out = {};
    var total = Number(exp.baseMinor) || 0;
    if (!total) return out;
    var named = (exp.participants || []).filter(function (id) { return memberIds.indexOf(id) !== -1; });
    var sharers = named.length ? named : memberIds;
    if (!sharers.length) return out;

    var method = exp.method || "EQUAL";
    var shares;
    if (method === "EQUAL") {
      shares = computeSplits(total, "EQUAL", sharers.map(function (id) { return { memberId: id }; }));
    } else {
      var weighted = sharers.map(function (id) {
        return { memberId: id, weight: Math.max(0, Number(exp.weights && exp.weights[id]) || 0) };
      });
      var sum = weighted.reduce(function (a, p) { return a + p.weight; }, 0);
      shares = sum > 0
        ? computeSplits(total, "SHARES", weighted)
        : computeSplits(total, "EQUAL", sharers.map(function (id) { return { memberId: id }; }));
    }
    shares.forEach(function (s) { if (s.amountMinor) out[s.memberId] = s.amountMinor; });
    return out;
  }

  function settle(memberIds, expenses, payments) {
    payments = payments || [];
    var balances = {};
    memberIds.forEach(function (id) { balances[id] = 0; });
    if (!memberIds.length) return { balances: balances, txns: [] };

    expenses.forEach(function (exp) {
      var total = Number(exp.baseMinor) || 0;
      if (!total) return;
      var payer = memberIds.indexOf(exp.paidBy) !== -1 ? exp.paidBy : memberIds[0];
      balances[payer] += total;
      var shares = expenseShares(memberIds, exp);
      memberIds.forEach(function (id) { balances[id] -= shares[id] || 0; });
    });

    payments.forEach(function (p) {
      var amt = Math.round(Number(p.baseMinor) || 0);
      if (!amt) return;
      if (memberIds.indexOf(p.from) === -1 || memberIds.indexOf(p.to) === -1) return;
      balances[p.from] += amt;
      balances[p.to] -= amt;
    });

    var creds = memberIds.filter(function (id) { return balances[id] > 0; }).map(function (id) { return { id: id, amt: balances[id] }; });
    var debts = memberIds.filter(function (id) { return balances[id] < 0; }).map(function (id) { return { id: id, amt: -balances[id] }; });
    creds.sort(function (a, b) { return b.amt - a.amt || (a.id < b.id ? -1 : 1); });
    debts.sort(function (a, b) { return b.amt - a.amt || (a.id < b.id ? -1 : 1); });

    var txns = [], ci = 0, di = 0;
    while (ci < creds.length && di < debts.length) {
      var pay = Math.min(creds[ci].amt, debts[di].amt);
      if (pay > 0) txns.push({ from: debts[di].id, to: creds[ci].id, amtMinor: pay });
      creds[ci].amt -= pay;
      debts[di].amt -= pay;
      if (creds[ci].amt <= 0) ci++;
      if (debts[di].amt <= 0) di++;
    }
    return { balances: balances, txns: txns };
  }

  // ---- summary.ts ----
  var UNTITLED = "Unlabelled expense";
  var UNCATEGORISED = "Uncategorised";

  function buildBudgetSummary(members, expenses, payments, days) {
    payments = payments || [];
    var ids = members.map(function (m) { return m.id; });
    var nameOf = {};
    members.forEach(function (m, i) { nameOf[m.id] = (m.name || "").trim() || ("Person " + (i + 1)); });

    var real = expenses.filter(function (e) { return (Number(e.baseMinor) || 0) > 0; });
    var unconvertedCount = expenses.filter(function (e) {
      return !(Number(e.baseMinor) || 0) && (Number(e.amountMinor) || 0) > 0;
    }).length;

    var total = real.reduce(function (s, e) { return s + (Number(e.baseMinor) || 0); }, 0);
    var calc = settle(ids, real, payments);

    var paid = {}, share = {}, byPersonItems = {}, catTotals = {};
    ids.forEach(function (id) { paid[id] = 0; share[id] = 0; byPersonItems[id] = []; });

    var items = real.map(function (e) {
      var baseMinor = Number(e.baseMinor) || 0;
      var payer = ids.indexOf(e.paidBy) !== -1 ? e.paidBy : ids[0];
      if (payer) paid[payer] += baseMinor;

      var shares = expenseShares(ids, e);
      var sharerIds = ids.filter(function (id) { return (shares[id] || 0) > 0; });
      var desc = (e.desc || "").trim() || UNTITLED;
      sharerIds.forEach(function (id) {
        share[id] += shares[id];
        byPersonItems[id].push({ desc: desc, share: shares[id] });
      });

      var category = (e.category || "").trim() || UNCATEGORISED;
      if (!catTotals[category]) catTotals[category] = { total: 0, count: 0 };
      catTotals[category].total += baseMinor;
      catTotals[category].count += 1;

      var nativeMinor = Number(e.amountMinor) || 0;
      var foreign = !!e.currency && nativeMinor > 0 && nativeMinor !== baseMinor;
      return {
        desc: desc,
        payerName: payer ? nameOf[payer] : "—",
        baseMinor: baseMinor,
        nativeMinor: foreign ? nativeMinor : null,
        nativeCurrency: foreign ? e.currency : null,
        category: category,
        sharerCount: sharerIds.length,
        sharerNames: sharerIds.map(function (id) { return nameOf[id]; })
      };
    });

    var people = members.map(function (m) {
      return { id: m.id, name: nameOf[m.id], paid: paid[m.id] || 0, share: share[m.id] || 0, net: calc.balances[m.id] || 0 };
    });
    var txns = calc.txns.map(function (t) {
      return { from: t.from, to: t.to, fromName: nameOf[t.from] || "?", toName: nameOf[t.to] || "?", amtMinor: t.amtMinor };
    });
    var byPerson = members.map(function (m) {
      return { id: m.id, name: nameOf[m.id], total: share[m.id] || 0, items: byPersonItems[m.id] || [] };
    });
    var byCategory = Object.keys(catTotals).map(function (category) {
      return { category: category, total: catTotals[category].total, count: catTotals[category].count };
    }).sort(function (a, b) { return b.total - a.total || (a.category < b.category ? -1 : 1); });

    var settledMinor = payments.reduce(function (s, p) { return s + (Math.round(Number(p.baseMinor)) || 0); }, 0);
    var d = typeof days === "number" && days > 0 ? days : null;

    return {
      total: total, memberCount: members.length, expenseCount: real.length,
      perPerson: members.length ? Math.round(total / members.length) : 0,
      days: d, perDay: d ? Math.round(total / d) : null,
      people: people, txns: txns, items: items, byPerson: byPerson, byCategory: byCategory,
      settledCount: payments.length, settledMinor: settledMinor, unconvertedCount: unconvertedCount
    };
  }

  root.TripSplit = { computeSplits: computeSplits, expenseShares: expenseShares, settle: settle, buildBudgetSummary: buildBudgetSummary };
})(window);
