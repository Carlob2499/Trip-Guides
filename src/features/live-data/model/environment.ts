export interface EnvironmentValue {
  observedAt: string;
  usAqi: number | null;
  uvIndex: number | null;
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: "MINOR" | "MODERATE" | "SEVERE" | "EXTREME" | "UNKNOWN";
  urgency: string;
  startsAt: string | null;
  expiresAt: string | null;
  instruction: string[];
  source: string;
}

export interface ActionableEnvironment {
  aqi: EnvironmentValue | null;
  uv: EnvironmentValue | null;
  alerts: WeatherAlert[];
}

export function parseOpenMeteoEnvironment(value: unknown): EnvironmentValue | null {
  const current = (value as { current?: Record<string, unknown> })?.current;
  if (!current || typeof current.time !== "string") return null;
  const aqi = typeof current.us_aqi === "number" && current.us_aqi >= 0 && current.us_aqi <= 500 ? current.us_aqi : null;
  const uv = typeof current.uv_index === "number" && current.uv_index >= 0 && current.uv_index <= 30 ? current.uv_index : null;
  if (aqi === null && uv === null) return null;
  return { observedAt: current.time, usAqi: aqi, uvIndex: uv };
}

/** Normal conditions are intentionally absent from the projection. */
export function actionableEnvironment(environment: EnvironmentValue | null, alerts: WeatherAlert[]): ActionableEnvironment | null {
  const actionableAlerts = alerts.filter((alert) =>
    ["MODERATE", "SEVERE", "EXTREME"].includes(alert.severity) || ["IMMEDIATE", "EXPECTED"].includes(alert.urgency));
  const aqi = environment?.usAqi != null && environment.usAqi >= 101 ? environment : null;
  const uv = environment?.uvIndex != null && environment.uvIndex >= 8 ? environment : null;
  return actionableAlerts.length || aqi || uv ? { aqi, uv, alerts: actionableAlerts } : null;
}

export function validAlerts(value: unknown): value is WeatherAlert[] {
  return Array.isArray(value) && value.every((alert) => {
    const a = alert as WeatherAlert;
    return !!a && typeof a.id === "string" && typeof a.title === "string" &&
      ["MINOR", "MODERATE", "SEVERE", "EXTREME", "UNKNOWN"].includes(a.severity) &&
      typeof a.urgency === "string" && Array.isArray(a.instruction) && a.instruction.every((line) => typeof line === "string") &&
      typeof a.source === "string";
  });
}

