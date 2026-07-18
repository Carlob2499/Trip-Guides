/**
 * Real-shaped seeds for the telemetry model tests — mirror the RTDB `telemetry` subtree the
 * aggregation script reads: guide -> { tabs: {name:count}, tools: {name:count} }.
 */
export const RAW_TELEMETRY = {
  southkorea: {
    tabs: { "getting-around": 41, food: 58, sights: 22, "pokemon-go": 12 },
    tools: { split: 19, reminders: 7 },
  },
  denmark: {
    tabs: { itinerary: 15, sights: 9 },
    tools: { split: 3 },
  },
} as const;
