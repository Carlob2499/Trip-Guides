/* Public API of the live-data feature — the two third-party data services a guide reads at
   runtime: the ECB exchange rate (Frankfurter) and the forecast (Open-Meteo).

   They share a shape, which is why they share a silo: fetch once → validate hard → cache by
   UTC day → render, or fail without saying anything. Both were IIFEs inside guide-ui.js
   (~285 lines) where their validators — the sanity bands that stop a 10x-wrong rate or a
   200°C day reaching a traveler — had no tests at all. The decisions now live in model/
   with 34 of them.

   Consumers import ONLY from here. Both take config and are inert without it, so a guide
   with no currency or no map section simply doesn't light them up. */

export { initRate, getLastRate } from "./ui/rate.js";
export { initWeather } from "./ui/weather.js";

// Re-exported for tests and for anything that needs to judge rate/forecast data without
// touching the DOM.
export { inBand, fmtRate, isCacheFresh, parseRateResponse, SANITY } from "./model/rate";
export { wxIcon, wxDayOk, wxValidate, weatherWindow } from "./model/weather";
