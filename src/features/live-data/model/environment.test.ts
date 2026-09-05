import { describe, expect, it } from "vitest";
import { actionableEnvironment, parseOpenMeteoEnvironment } from "./environment";

describe("environment overlays", () => {
  it("validates Open-Meteo AQI and UV without taking over the routine forecast", () => {
    expect(parseOpenMeteoEnvironment({ current: { time: "2026-09-04T12:00", us_aqi: 112, uv_index: 8.2 } })).toEqual({
      observedAt: "2026-09-04T12:00", usAqi: 112, uvIndex: 8.2,
    });
    expect(parseOpenMeteoEnvironment({ current: { time: "now", us_aqi: 900, uv_index: -2 } })).toBeNull();
  });

  it("hides normal conditions and keeps only actionable disruption", () => {
    expect(actionableEnvironment({ observedAt: "now", usAqi: 40, uvIndex: 4 }, [])).toBeNull();
    const alert = { id: "a", title: "Flash flood warning", severity: "SEVERE" as const, urgency: "IMMEDIATE", startsAt: null, expiresAt: null, instruction: ["Move to higher ground"], source: "NOAA" };
    expect(actionableEnvironment({ observedAt: "now", usAqi: 120, uvIndex: 2 }, [alert])).toEqual({
      aqi: { observedAt: "now", usAqi: 120, uvIndex: 2 }, uv: null, alerts: [alert],
    });
  });
});

