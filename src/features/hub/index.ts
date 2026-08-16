/* The hub feature's public surface (sealed-silo contract, architecture.md) — the only door
   another module may import through. The hub is the /new intake: the preflight checklist
   (six sections, completeness meter, head-to-head priorities, fork gate), booking-doc
   parsing (txt/eml/ics/csv + lazy PDF), and submission to the intake proxy. */
export { initIntakeChecklist } from "./ui/intake-checklist.js";
