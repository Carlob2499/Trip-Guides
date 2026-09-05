/* Says, at build time, which config-gated integrations this build carries — names only, never
   values (docs/reference/integrations.md). A missing key is information, not a failure: every
   surface degrades honestly without it, so this never exits non-zero. */
import { readFileSync } from "node:fs";

function fromDotEnv(name) {
  try {
    const m = readFileSync(".env", "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    return m ? m[1].trim() : "";
  } catch { return ""; }
}
const has = (name) => Boolean((process.env[name] || fromDotEnv(name)).replace(/^["']|["']$/g, ""));

const firebase = readFileSync("src/features/firebase/firebase-config.js", "utf8");
const backend = readFileSync("src/lib/backend-config.js", "utf8");
const rows = [
  ["Google Maps", has("PUBLIC_GMAPS_KEY") ? "configured" + (has("PUBLIC_GMAPS_MAP_ID") ? " (cloud style)" : " (DEMO_MAP_ID style)") : "not configured — OpenStreetMap embed is the map"],
  ["Firebase live sync", /apiKey:\s*"[^"]+"/.test(firebase) && /databaseURL:\s*"[^"]+"/.test(firebase) ? "configured" : "not configured — Split is local-only"],
  ["Intake Worker", /url:\s*"https?:\/\/[^"]+"/.test(backend) ? "configured" : "not configured — prefilled GitHub issues"],
];
console.log("[integrations] " + rows.map(([k, v]) => `${k}: ${v}`).join(" · "));
