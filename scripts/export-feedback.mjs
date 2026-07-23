// Exports NEW traveler feedback out of Firebase RTDB for the LEARN loop (W2). Called by
// .github/workflows/feedback-export.yml: this script reads trips/<roomId>/feedback via a
// READ-ONLY service account, keeps only submissions newer than the last sync, and writes a
// runner-only working file the synthesis agent then turns into a review PR (learnings/<slug>.md
// + the guide's public `learnings` block + docs/TRAVELER_PATTERNS.md deltas).
//
// PRIVACY (binding — "The Learnings Loop" in CLAUDE.md):
//   · trips/* stays auth-gated in rules.json; this reads it with an Admin-scoped credential in CI,
//     never opening public access.
//   · The working file CONTAINS freeform (the agent needs it to summarize) but is GITIGNORED and
//     never committed. The agent is instructed to summarize freeform and NEVER paste it verbatim
//     into the PR, learnings/<slug>.md, or the public `learnings` block. Raw critiques never ship.
//   · The sync marker (learnings/.sync.json: { <slug>: <lastCreatedAt epoch ms> }) advances only
//     when the agent's PR — which updates it — is merged, so a failed/abandoned run re-exports the
//     same feedback next time instead of silently losing it.
//
// Auth: google-auth-library mints an OAuth2 access token from the service account (the documented
// server-to-server flow), then a plain RTDB REST GET reads /trips. No firebase-admin (152 pkgs,
// heavy) — the light official lib + fetch is enough for one read.
//
//   FIREBASE_SERVICE_ACCOUNT='<service-account JSON>' node scripts/export-feedback.mjs [--dry-run]

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JWT } from "google-auth-library";
import { readGuides, isMain } from "./audit/lib.mjs";
import { FIREBASE_CONFIG } from "../src/features/firebase/firebase-config.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SYNC_MARKER = path.join(ROOT, "learnings", ".sync.json");
const WORKING_FILE = path.join(ROOT, "feedback-export.working.json"); // gitignored; agent reads it

// RTDB REST needs an OAuth2 token with these two scopes (Firebase's documented server auth).
const RTDB_SCOPES = [
  "https://www.googleapis.com/auth/firebase.database",
  "https://www.googleapis.com/auth/userinfo.email",
];

/* ─────────────────────────── pure core (unit-tested) ─────────────────────────── */

// roomId → slug, from each guide's _guide.json `roomId`. A guide with no roomId isn't in the map,
// so its (nonexistent) feedback room can't be mis-attributed.
export function buildRoomIndex(guides) {
  const idx = {};
  for (const { slug, guide } of guides || []) {
    const roomId = guide?.roomId;
    if (roomId) idx[roomId] = slug;
  }
  return idx;
}

// Flatten the RTDB /trips snapshot into per-submission records attributed to a guide slug.
// trips shape: { <roomId>: { feedback: { <fid>: <record> }, members?, expenses? } }.
export function flattenFeedback(trips, roomIndex) {
  const out = [];
  for (const roomId of Object.keys(trips || {})) {
    const slug = roomIndex[roomId];
    if (!slug) continue; // feedback for a room with no matching guide — can't attribute, skip
    const feedback = trips[roomId]?.feedback || {};
    for (const fid of Object.keys(feedback)) {
      const record = feedback[fid] || {};
      out.push({ slug, roomId, fid, createdAt: Number(record.createdAt) || 0, record });
    }
  }
  return out;
}

// Only submissions strictly newer than the last-synced createdAt for their slug.
export function filterNew(records, marker) {
  return (records || []).filter((r) => r.createdAt > ((marker || {})[r.slug] || 0));
}

// The advanced marker: max createdAt seen per slug, carrying prior values forward.
export function nextMarker(records, prevMarker) {
  const next = { ...(prevMarker || {}) };
  for (const r of records || []) next[r.slug] = Math.max(next[r.slug] || 0, r.createdAt);
  return next;
}

// Group new records per slug for the agent's working file. Ratings averaged; skips listed;
// freeform INCLUDED (agent-only, gitignored file) with a count for the PR body's summary line.
export function summarize(records) {
  const bySlug = {};
  for (const r of records || []) {
    const s = (bySlug[r.slug] ||= {
      slug: r.slug, count: 0,
      ratings: { overall: [], pacing: [], food: [] }, skips: [], freeform: [],
    });
    s.count++;
    for (const k of ["overall", "pacing", "food"]) {
      const v = Number(r.record?.ratings?.[k]);
      if (Number.isFinite(v) && v >= 1) s.ratings[k].push(v);
    }
    for (const sk of r.record?.skips || []) if (sk?.stop) s.skips.push({ stop: sk.stop, reason: sk.reason || "" });
    const f = String(r.record?.freeform || "").trim();
    if (f) s.freeform.push(f);
  }
  const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  return Object.values(bySlug).map((s) => ({
    slug: s.slug,
    count: s.count,
    ratings: { overall: avg(s.ratings.overall), pacing: avg(s.ratings.pacing), food: avg(s.ratings.food) },
    skips: s.skips,
    freeformCount: s.freeform.length,
    freeform: s.freeform, // agent-only; gitignored working file; NEVER verbatim in a PR
  }));
}

/* ─────────────────────────── impure (network / fs) ─────────────────────────── */

async function fetchTrips(serviceAccount, databaseURL) {
  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: RTDB_SCOPES,
  });
  const { access_token: token } = await client.authorize();
  const res = await fetch(`${databaseURL.replace(/\/$/, "")}/trips.json?access_token=${token}`);
  if (!res.ok) throw new Error(`RTDB read failed: ${res.status} ${res.statusText}`);
  return (await res.json()) || {};
}

async function readMarker() {
  try {
    return JSON.parse(await readFile(SYNC_MARKER, "utf8"));
  } catch {
    return {}; // no marker yet → everything is new
  }
}

export async function runExport({ dryRun = false } = {}) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  if (!sa.client_email || !sa.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not set (need the read-only service-account JSON)");
  }
  const [guides, marker] = await Promise.all([readGuides(), readMarker()]);
  const roomIndex = buildRoomIndex(guides);
  const trips = await fetchTrips(sa, FIREBASE_CONFIG.databaseURL);
  const all = flattenFeedback(trips, roomIndex);
  const fresh = filterNew(all, marker);
  const summaries = summarize(fresh);
  const proposedMarker = nextMarker(fresh, marker);

  const working = {
    generatedFor: "waypoint feedback-export (W2) — agent-only, DO NOT COMMIT",
    newSubmissionCount: fresh.length,
    slugs: summaries.map((s) => s.slug),
    proposedMarker, // the agent writes this into learnings/.sync.json as part of its PR
    summaries,
  };

  console.log(`[export-feedback] ${fresh.length} new submission(s) across ${summaries.length} guide(s): ${working.slugs.join(", ") || "none"}`);
  if (!dryRun) {
    await writeFile(WORKING_FILE, JSON.stringify(working, null, 2));
    console.log(`[export-feedback] wrote ${path.relative(ROOT, WORKING_FILE)} (gitignored)`);
  }
  return working;
}

if (isMain(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  await runExport({ dryRun });
}
