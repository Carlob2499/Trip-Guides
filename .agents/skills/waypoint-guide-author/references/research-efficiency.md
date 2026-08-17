# Research Efficiency — model economy, judicious searching, social/video leads

Binding operational rules for every research/recert pass. The backbone must be sustainable on a
**Claude Pro** plan: research is executed by **Sonnet** (default) or **light Opus**
(reconciliation / judgment-heavy passes only). Fable/heavy-Opus sessions are for *designing the
pipeline*, never for running research. Follow these — they encode what past passes learned, so
quality stays Korea-tier while tokens and searches stay Pro-sized.

## Model economy

| Work | Model |
|---|---|
| Research passes (Pass A + Pass B), recert re-verification | **Sonnet** |
| Reconcile A+B conflicts; anchor-event verification on an event trip | Sonnet, or **light Opus** if genuinely contested |
| Formatting, ledger cleanup, mechanical sweeps | Haiku (or stay in Sonnet) |
| Pipeline/skill/workflow design | Fable/Opus — separate sessions, not research |

**Checkpoint often** — Pro sessions run shorter than Max ones, so a session should end at a
committed checkpoint and resume without re-research. Each stage's own prompt in `prompts/` carries
the exact checkpoint command; this file governs how much you spend before reaching one. Plan-mode
first on any multi-section pass: plan cheap, execute the plan, don't wander.

## Search budget (per ENTITY — a venue, route, or event; D2, 2026-08-13)

- **Batch by entity, not by mention.** Research a venue/route/event ONCE; every fact it yields
  shares one kebab `entity:` id (`src/content.config.ts`). Never re-research the same thing
  because a second prose mention needs a number.
- **Budget scales with `risk` (0–4 on the fact), not a flat per-fact cap:**

  | Risk | R0 | R1 | R2 (default — the old flat cap) | R3 (plan-critical) | R4 (mandatory-surfaced) |
  |---|---|---|---|---|---|
  | Searches | 0 | 1 | 2 | 3–4 | uncapped, logged |

R4 (advisories, visa/health) MUST reach the guide — an omitted R4 fact is worse than an
unconfirmed one. Past budget, the stopping conditions apply (`verification-rules.md` §5): flag
`⚠` or omit — more searching produces confidence, not verification.
- **Scripts before web, always.** `lookup-venue.mjs` (does a venue still exist · hours · address
  — never ask the model, never infer from a blog), `lookup-place.mjs` (coords/place_id),
  `lookup-tz.mjs` (time zone — offline, resolves from the coords `lookup-place.mjs` just gave
  you, so do it in the SAME step, not a separate search round), `search-commons.mjs` (photos),
  `fetch-wikivoyage.mjs` (grounding leads) answer for free — never web-search what a script
  answers. A time-zone web search ("is Arizona on daylight saving") is *slower and less reliable*
  than the one-line, zero-network `lookup-tz.mjs` call — if you catch yourself about to search
  for a time zone, stop and run the script instead.
- **Some facts are ALREADY geography- or country-driven at render time — don't re-research them
  per guide.** Weather reads live from the guide's own `map` section coordinates (Open-Meteo) —
  no research step needed beyond setting the map correctly. Currency code, public holidays, and
  emergency numbers resolve from the guide's `country` field (`src/data/countries.mjs`) *as long
  as it holds the actual country name* — never a state/province (a state name there broke every
  country-keyed lookup at once, the Hawaii/Arizona bug's root cause). A US state or Canadian
  province still gets `country: "United States"` / `"Canada"`; the sub-region belongs in the
  title, kicker, and body copy only.
- **Reuse before re-search.** The verification ledger, the intake doc, and the existing guide are
  first stops. Never re-verify a fact the ledger already carries with a current date. In recert,
  start from the flagged fact's own `source_url`.
- **Go direct-to-primary.** Guess the official domain and fetch it (`WebFetch`) before searching.
  One venue's official page usually answers all four questions (where / how / when / book) in ONE
  fetch.
- **Reserve budget for the standing duties — do them DURING the pass, not as an afterthought.**
  Pass A: ≥3 searches for the phrases/language card and ≥2 for the footage scout. Pass B: ≥2
  searches for resident phrases/slang. Duties starve when the main sights spend the whole budget
  first; the run report states how many searches each duty actually used.
- **Discovery gets its own floor now — the per-entity budget above is a VERIFICATION cap, not a
  breadth cap (S2/S3, 2026-08-02).** The registry and `lookup-venue.mjs` made verification much
  cheaper per entity; spend the freed budget on breadth, and the candidates floors (16/10/6
  considered per ranked priority) are the minimum that spend must produce. Sweeping a "best
  <priority> in <city>" landscape to FILL the candidates table is discovery, not per-entity
  verification — do it before climbing to T0 on the survivors, and record every rejection with
  its one-line reason as you go.
- **Search precisely.** `site:` queries on the official domain; the venue's native-language name
  (the local-language official page is often the true T0 — fetch it and translate, don't keep
  searching English).
- **Video transcripts are cheap Pass B leads.** `yt-dlp` pulls a YouTube transcript with zero
  media download (rules + the ~4-per-pass cap: "Social & video lead sourcing" below). A failed
  pull is bot-blocked: mark and move on — transcripts are an aide, never a dependency.

## Discovery layer — the Research skill (interactive sessions ONLY)

When a pass runs interactively on the creator's machine, the global `Research` skill
(`~/.claude/skills/Research/`) may open each pass as a **discovery** accelerant:

- **Pass A** — ONE Standard-mode call to map the backbone landscape (must-dos, transit structure,
  entry-rule shape) before climbing to T0 sources fact by fact. Pass A gets no more than this:
  its sources are official pages that native search reaches fine.
- **Pass B** — the one place a FULL deep-research sweep is sanctioned (creator's ruling,
  2026-08-02). See "Pass B deep discovery" below.

**The bar does not move.** Everything the Research skill returns is a **T2 lead** — verified
against a T0 primary source before it enters the guide, recorded in the ledger like any other
lead. Never cite its output. Discovery ≠ verification: the skill finds *what to check*; the
native fetch confirms *what is true*.

**Never in CI.** The headless pipeline (`research-pass.yml`) has no API keys or local services;
its agents use native web search/fetch + the aides below — a pass without the Research skill is a
normal pass, not a degraded one.

### Pass B deep discovery — native-first, anti-default (interactive; feeds the headless pass)

Pass B's charter is the resident angle, and residents do not write in English — an
English-prompted search under-samples the exact layer B exists to find (Naver blogs, Tabelog,
local news, hobbyist forums, the destination-language subreddit equivalents). A deep-research
sweep scoped to Pass B closes that, under three binding rules:

1. **Native-first, by construction.** Query language(s) and known-good source domains come from
   `src/data/destinations/<slug>.json`'s `languages` + `t0Domains` (D1/D2) — read it first, never
   guess the destination's language. The English ones are a supplement, not the base. Prioritize
   sources ON the destination's own web — the ccTLD, the local platforms — and translate what
   comes back; never skip a source for being non-English. Every lead records its source language
   (also why S5 measures ccTLD presence).
2. **Anti-default filter, stated in the sweep's own prompt.** EXCLUDE anything appearing in the
   destination's English-language top-10/"must-see" lists — Pass A already has those, and
   re-discovering them burns the sweep on what a generic guide knows. This matters MORE on a
   heavily touristed destination, not less — the English layer is most polluted where the crowds
   are. Viral status is a crowd warning to note, never a lead's merit.
3. **Dossier out, leads only.** Findings land in the intake doc's `## Discovery leads (Pass B —
   native-first)` table — lead · source + language · why it isn't the tourist default · status.
   They are T2 LEADS: the headless (or interactive) Pass B verifies each to T0 before anything
   enters passB.json, marks the table row `verified` / `rejected: <reason>`, and the rejected
   ones still feed the candidates table — a disproved native lead is a good rejection row.

**Cost posture:** one sweep per NEW guide, run interactively where the keys live, before (or
alongside) dispatching the pipeline. An empty/absent dossier changes nothing — the headless Pass
B runs its native aides exactly as before; the dossier accelerates the S4 floors, it isn't a
second gate.

## Social & video lead sourcing — Pass B aides

Video and social platforms hold real local knowledge (what residents actually eat, when the
famous spot is empty, which "must-see" is a queue) — but they are **T2 leads, never citations**,
verified against a T0 primary source before entering the guide, same as the rest of Pass B.

### Binding rules

- **Leads-only.** No fact sourced from a video, post, or social roundup ships on that source's
  authority. The citation is always the official page; the social source is the *trail*, recorded
  in the reconciliation ledger's B-only rows.
- **"Viral" is a lead signal AND a crowd warning — never a quality signal.** A viral spot is a
  crowd forecast: pair any viral find with the crowd-reality + off-peak note, and check whether
  it's exactly the tourist trap Pass B exists to route around.
- **Corroborate before "locals" phrasing.** A "locals go here" / "local favorite" claim needs ≥2
  independent social/resident sources (e.g. a transcript AND a resident forum thread) — one
  creator's opinion gets neutral phrasing, not a local's endorsement.
- **Inside the existing budget, not on top of it.** This is part of Pass B's search budget above.
  Max ~4 transcripts per full pass; skip transcripts entirely on narrow single-section re-runs
  unless the section is food/sights.
- **Failure never blocks the pass.** Every mechanism below is an aide. If a tool is missing or a
  platform blocks, apply the bot-blocked doctrine — mark it in the ledger, move on, ≤2 attempts.
  A pass with zero transcripts is a normal pass, not a degraded one.

### YouTube — transcripts via yt-dlp (never media)

The one platform with a clean keyless path: `yt-dlp` pulls a video's subtitles/transcript without
downloading any media. Check `yt-dlp --version` before relying on it — if absent, skip to the
indirect route below.

1. **Find candidates by web search**, not by browsing: `"<city> travel vlog"`, `"<city> what
   locals eat"`, `"living in <city>"`. Prefer recent uploads (≤18 months — perishable facts age)
   and resident/long-stay creators over drive-by tour compilations.
2. **Pull the transcript only:**

   ```
   yt-dlp --skip-download --write-auto-subs --write-subs \
     --sub-langs "en.*" --sub-format vtt -o "/tmp/yt-%(id)s" "<url>"
   ```

Then read the `.vtt` and extract venue names, claims, and timing tips into the ledger as T2
leads. Add the destination's language to `--sub-langs` when the best creators are local
(translate, don't skip).
3. **Failure = bot-blocked doctrine.** yt-dlp missing, a 403/429, or a video with no subs: mark
   and move on. Never retry-loop; never treat a failed pull as a finding.

### TikTok / Instagram — indirect only

No sanctioned programmatic access exists for this repo's use (TikTok's Research API is gated to
vetted academic institutions; Instagram's Graph API is business-gated with capped hashtag search
— both verified 2026-07-30, re-check before revisiting), and scraping either platform is
forbidden here. The signal still arrives: viral spots get written up within days by web-indexed
blogs, local news, and roundup sites.

- Search `"<city> tiktok famous <food|spot|cafe>"`, `"<venue> instagram crowds"`.
- The roundup is an aggregator: leads only, per the search-budget rules above.
- A spot's viral status is itself a datum — it predicts queues. Fold it into the crowd-reality
  note once the venue itself is T0-verified.

## Fetch discipline — learned from this repo's own audits

- **A HEAD/first 404 can be a live page** (visitseoul.net answered HEAD 404 / GET 200 for every
  URL). If a fetch fails oddly, retry the plain page once; judge by content, not status.
- **Bot-blocked (403/429/Cloudflare) → don't burn retries.** Mark it blocked in the ledger and
  find a different primary. Two attempts max.
- **Reader mirror as a SECOND attempt, not a first.** When a primary page returns bloated HTML or
  blocks a plain fetch, `https://r.jina.ai/<url>` returns the same page as clean markdown —
  keyless at 20 req/min (verified 2026-08-02). It counts inside the same two-attempt budget,
  never on top of it. **The citation NEVER changes:** `source_url` is always the
  venue's/operator's own URL — the mirror is how you READ the page, not where the fact came from
  (a `r.jina.ai/...` URL in a guide is a defect). Mirror also down or blocked → that's the second
  attempt spent: apply the stopping conditions and flag or omit.
- **Aggregators die; officials persist** (the MangoPlate lesson — a dead-since-2020 aggregator
  shipped from training data). Aggregators are *leads only*; cite the official page, never what
  you didn't fetch.
- **Don't paste pages into the ledger.** Extract the row (claim · value · tier+URL · date · flag)
  and move on. The ledger is evidence, not an archive.

## Token hygiene

- Don't re-read files already in context (CLAUDE.md and this skill auto-load — never re-Read
  them).
- Read only the group file a fact lives in, never the assembled guide.
- Keep the completion report to the standard format — the ledger table plus one line per
  category.

