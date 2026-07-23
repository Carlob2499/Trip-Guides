/* F1 (docs/PLAN_TRAVELER_FEATURES.md): a checklist item is a bare string on every guide with
   no book-by deadline for it, or an upgraded { text, due?, ... } object once one is sourced
   (content.config.ts's `checklistItem` union) — every renderer of a checklist needs the
   display text regardless of which shape a given item is, so that extraction lives once here. */
export interface ChecklistItemObject {
  text: string;
  due?: string;
  note?: string;
  source_url?: string;
  verified_on?: string;
}
export type ChecklistItem = string | ChecklistItemObject;

export function checklistText(item: ChecklistItem): string {
  return typeof item === "string" ? item : item.text;
}
