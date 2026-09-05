import type { JsonTransport } from "../../runtime-overlay";
import { parseOpenMeteoEnvironment, type EnvironmentValue, type WeatherAlert } from "../model/environment";

export interface Coordinate { latitude: number; longitude: number; }

export class OpenMeteoEnvironmentAdapter {
  readonly #fetch: typeof fetch;
  constructor(fetchPort: typeof fetch = fetch) { this.#fetch = fetchPort; }

  async current(point: Coordinate, signal?: AbortSignal): Promise<EnvironmentValue> {
    const query = new URLSearchParams({
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      current: "us_aqi,uv_index",
      timezone: "auto",
    });
    const response = await this.#fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${query}`, { signal });
    if (!response.ok) throw new Error(`Open-Meteo air quality ${response.status}`);
    const parsed = parseOpenMeteoEnvironment(await response.json());
    if (!parsed) throw new Error("Open-Meteo returned invalid environment data");
    return parsed;
  }
}

export class GoogleWeatherAlertsAdapter {
  readonly #post: JsonTransport;
  constructor(post: JsonTransport) { this.#post = post; }
  async alerts(point: Coordinate, languageCode = "en", signal?: AbortSignal): Promise<WeatherAlert[]> {
    return await this.#post("runtime/weather-alerts", { ...point, languageCode }, signal) as WeatherAlert[];
  }
}
