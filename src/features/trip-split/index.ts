/** trip-split — the group budget calculator: id-keyed members/expenses,
    minimum-transfer settlement, Firebase-backed shared live room per guide
    (the zero-setup design — see the memory/README notes: no codes, no share
    links; that is settled, intended behavior).

    Public surface (the ONLY sanctioned imports from outside this silo):
    - settle()        — pure settlement math (float API, id-keyed)
    - computeSplits() — deterministic minor-unit split engine
                        (EQUAL / EXACT / PERCENTAGE / SHARES; ported from
                        WayFinder — shares always sum exactly to the total)
    - formatMinor(), CURRENCY_EXPONENT, SplitError — money helpers
    Importing this module also boots the calculator UI (self-mounting on
    #tripSplit, exactly as the old src/scripts module did). */
export { settle } from "./model/settle";
export type { SettleExpense, SettleResult, SettleTxn } from "./model/settle";
export { normalizeMember, normalizeExpense } from "./model/records";
export type { SplitMember, SplitExpense } from "./model/records";
export { computeSplits, formatMinor, CURRENCY_EXPONENT, SplitError } from "./model/money";
export type { SplitMethod, SplitParticipant, SplitResult } from "./model/money";
import "./ui/trip-split.js";
