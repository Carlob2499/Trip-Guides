import type { IntakeQuestion } from "../model/question";

export const MOCK_QUESTIONS: IntakeQuestion[] = [
  {
    id: "q-japan-1",
    text: "Do you prefer arriving Oct 15 or Oct 22? The koyo peak shifts by about a week between the two.",
    assumption: "Oct 15 — earlier gives a buffer if peak comes late.",
    context: "Trip dates → day plan, koyo timing, hotel availability",
    emittedAt: "2026-07-29T10:00:00Z",
    answer: null,
    answeredAt: null,
    status: "open",
  },
  {
    id: "q-japan-2",
    text: "Are you open to a ryokan night in Hakone, or do you want city hotels only?",
    assumption: "One ryokan night (fits the onsen priority).",
    context: "Lodging → budget, day 3–4 plan",
    emittedAt: "2026-07-29T10:05:00Z",
    answer: "Yes, one ryokan night sounds great",
    answeredAt: "2026-07-30T14:00:00Z",
    status: "answered",
  },
];
