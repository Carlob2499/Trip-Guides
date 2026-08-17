# Pass B — local, authentic, crowd-aware

Guide slug: {{slug}}

You are stage 2 of four independent agent sessions, and your value depends on independence from
Pass A. Your checkout may physically contain Pass A's committed work, so the wall is THIS
contract and it is absolute: do not read, open or reference ANY file under
`src/content/guides/{{slug}}/`. Your findings go to their own file; a third agent merges them
with Pass A's guide. (The V2 pipeline prepares a workspace that excludes Pass A's outputs
mechanically; this V1 pass relies on you honoring the boundary.)

## Read first

- `.claude/skills/waypoint-guide-author/SKILL.md` — Pass B: the resident/blog/forum angle, the
  different questions you ask, and the claim-dependent verification bar (objective facts climb
  to a primary source; experiential findings corroborate via ≥2 recent independent firsthand
  sources).
- `references/verification-rules.md` — the tier ladder for objective claims and the
  corroboration bar for experiential ones (§3).
- `references/research-efficiency.md` — the binding search budget, the reserved duty budget
  (resident phrases/slang ≥2 searches), and "Social & video lead sourcing": yt-dlp is installed
  best-effort on this runner (transcripts only, ~4 max; a failed install or pull is bot-blocked —
  mark it and move on, never retry-loop), TikTok/IG via web-indexed roundups only, viral is a
  crowd warning and never a citation, "locals" phrasing needs ≥2 independent sources.

## Stage contract

- Read ONLY `guides-intake/{{slug}}/intake.md` (the traveler's frozen intent) and
  `guides-intake/{{slug}}/ledger.md`, plus the skill files above. Never the guide directory,
  never Pass A's work.
- If `ledger.md` carries a non-empty `## Discovery leads (Pass B — native-first)` table, those
  rows are your starting map — T2 leads from a native-language sweep. Verify each to T0 like any
  other lead and set its Status cell to `verified` or `rejected: <reason>`. An empty or absent
  table means nothing: proceed on your native aides as the skill describes.
- Write findings to `guides-intake/{{slug}}/passB.json` as a JSON array:
  ```json
  [
    {
      "item": "Sight / restaurant / tip name",
      "category": "crowd | alternative | timing | novel | food | transit | language",
      "finding": "What you found (the traveler-facing insight)",
      "source_url": "https://...",
      "verified_on": "YYYY-MM-DD",
      "replaces": "optional — the obvious pick this replaces, if any"
    }
  ]
  ```
  Every entry needs `source_url` and `verified_on`. Omit what you could not verify — and note
  that a later gate requires each entry here to receive a written verdict during reconcile, so an
  entry you would not defend is one you should not write.
- Append the candidates you evaluated — shipped AND rejected, one-line reasons — to `ledger.md`'s
  `## Candidates considered` tables. Your resident-angle rejections ("tourist trap, locals go to
  X") are exactly the rows that make the consideration set worth keeping.
- Finish the stage:
  `npm run pipeline -- --slug {{slug}} --checkpoint passB && git add -A && git commit -m "research({{slug}}): Pass B" && git push`
- STOP there. Do not edit the guide, reconcile, or verify — separate agents do that. If
  wall-clock runs short, commit what you have.
