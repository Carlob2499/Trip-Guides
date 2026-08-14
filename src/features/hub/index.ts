/* The hub feature's public surface (sealed-silo contract, architecture.md) — the only door
   another module may import through. The hub is the /new intake wizard: question flow,
   booking-doc parsing (txt/eml/ics/csv + lazy PDF), and submission to the intake proxy. */
export { initIntakeFlow } from "./ui/intake-flow.js";
