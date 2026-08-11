# UI kit — trip tools

Four tools behind one screen, all built from panels. Recreated from
`src/features/trip-split/`, `src/lib/holidays.ts`, and the guides' own `checklist` arrays.

| Tool | Comes from | Never |
| --- | --- | --- |
| Split | `trip-split/model/{money,records,settle}.ts` | re-derive settlement in the UI |
| Closures | `data/holidays/{CC}-2026.json` + `lib/holidays.ts` | guess a country's holidays |
| Reminders | `checklist` arrays already in the guide JSON | author a checklist item |
| Route | mapped points in the guide | present it as transit time |

**Jetlag is not here.** R5 moved it into the Plan group: its one useful output is the
body-clock reading on arrival night, which is a fact about the flight, read once before
departure. The model (`lib/jetlag.ts`, ±0.4h dead zone) is unchanged.

**Trip Split is NOT seeded from the guide's budget.** This is a deliberate reversal of the
original handoff. An estimate is not a debt; seeding "meals per day, $32" produces a
settle-up demanding transfers for money nobody spent. The forecast keeps its home in the
budget panel in Essentials, labelled as a forecast. The ledger's correct first-run state is
empty: $0.00, no nets, "Nothing recorded yet — add what you paid."

The ledger ships **empty** — `$0.00`, no nets, no transfers, "nothing recorded yet — add what
you paid", and the where-it-went bars hidden rather than drawn at zero. That is the first-run
state and it is the one to build. The guide's budget forecast stays in Money & budget.

**One guard, one place.** Every entry into Tools loads the trip's data via `ensureGuide(slug)`
guarded on the tools screen itself, not at the call sites — the call site that forgets is the
one that ships.
