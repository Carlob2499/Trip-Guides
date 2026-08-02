# Research Efficiency — model economy, judicious searching, social/video leads

Binding operational rules for every research/recert pass. The backbone must be sustainable on a
**Claude Pro** plan: research is executed by **Sonnet** (default) or **light Opus** (reconciliation
/ judgment-heavy passes only). Fable/heavy-Opus sessions are for *designing the pipeline*, never for
running research. These rules exist so verification quality stays Korea-tier while tokens and
searches stay Pro-sized. They encode what past passes learned — follow them instead of rediscovering.

## Model economy

| Work | Model |
|---|---|
| Research passes (Pass A + Pass B), recert re-verification | **Sonnet** |
| Reconcile A+B conflicts; anchor-event verification on an event trip | Sonnet, or **light Opus** if genuinely contested |
| Formatting, ledger cleanup, mechanical sweeps | Haiku (or stay in Sonnet) |
| Pipeline/skill/workflow design | Fable/Opus — separate sessions, not research |

**Checkpoint often** (`npm run pipeline -- --slug X --checkpoint <stage>` + commit). Pro sessions
are shorter than Max ones; the P2 spine exists precisely so a session can end at any checkpoint and
the next one resumes without re-research. Plan-mode first on any multi-section pass: plan cheap,
execute the plan, don't wander.

## Search budget (per fact / per venue)

- **Scripts before web, always.** `lookup-venue.mjs` (does a venue still exist · hours ·
  address — never ask the model, never infer from a blog), `lookup-place.mjs` (coords/place_id), `lookup-tz.mjs`
  (time zone — offline, resolves from the coords `lookup-place.mjs` just gave you, so do
  it in the SAME step, not a separate search round), `search-commons.mjs` (photos),
  `fetch-wikivoyage.mjs` (grounding leads) answer for free — never web-search what a
  script answers. A time-zone web search ("is Arizona on daylight saving") is *slower and
  less reliable* than the one-line, zero-network `lookup-tz.mjs` call — if you catch
  yourself about to search for a time zone, stop and run the script instead.
- **Some facts are ALREADY geography- or country-driven at render time — don't
  re-research them per guide.** Weather reads live from the guide's own `map` section
  coordinates (Open-Meteo) — no research step needed beyond setting the map correctly.
  Currency code, public holidays, and emergency numbers are correctly resolved from the
  guide's `country` field (`src/data/countries.mjs`) *as long as `country` holds the
  actual country name* — never a state, province, or other sub-region (that was the
  Hawaii/Arizona bug's root cause: a state name in the `country` field broke every
  country-keyed lookup at once, not just time zone). If a destination is a US state,
  Canadian province, etc., `country` is still `"United States"` / `"Canada"` — the
  state/province belongs in the title, kicker, and body copy, not in the field that
  drives currency/holiday/emergency lookups.
- **Reuse before re-search.** The verification ledger, the intake doc, and the existing guide are
  first stops. Never re-verify a fact the ledger already carries with a current date. In recert,
  start from the flagged fact's own `source_url`.
- **Go direct-to-primary.** Guess the official domain and fetch it (`WebFetch`) before searching.
  One venue's official page usually answers all four questions (where / how / when / book) in ONE
  fetch — batch by *venue*, not by *fact*.
- **Reserve budget for the standing duties — do them DURING the pass, not as an
  afterthought.** Pass A: ≥3 searches for the phrases/language card and ≥2 for the footage
  scout. Pass B: ≥2 searches for resident phrases/slang. Duties starve when the main
  sights spend the whole budget first; the run report states how many searches each duty
  actually used.
- **Two rounds, then decide.** Max ~2 searches + 1–2 fetches per fact. If no T0/T1 source
  surfaces, apply the stopping conditions (verification-rules §5): flag `⚠` or omit. More
  searching past that point produces confidence, not verification.
- **Discovery gets its own floor now — the two-round rule is a VERIFICATION cap, not a
  breadth cap (S2/S3, 2026-08-02).** The registry and `lookup-venue.mjs` made verification
  much cheaper per fact; spend the freed budget on breadth, and the candidates floors
  (16/10/6 considered per ranked priority) are the minimum that spend must produce. Sweeping
  a "best <priority> in <city>" landscape to FILL the candidates table is discovery, not
  per-fact verification — do it before climbing to T0 on the survivors, and record every
  rejection with its one-line reason as you go.
- **Search precisely.** `site:` queries on the official domain; the venue's native-language name
  (the local-language official page is often the true T0 — fetch it and translate, don't keep
  searching English).
- **Video transcripts are cheap Pass B leads.** `yt-dlp` pulls a YouTube transcript with zero
  media download (rules + the ~4-per-pass cap: "Social & video lead sourcing" below). A failed
  pull is bot-blocked: mark and move on — transcripts are an aide, never a dependency.

## Discovery layer — the Research skill (interactive sessions ONLY)

When a pass runs interactively on the creator's machine, the global `Research` skill
(`~/.claude/skills/Research/`) may open each pass as a **discovery** accelerant — one
Standard-mode call per pass, at the start, never per-fact:

- **Pass A** — one call to map the backbone landscape (must-dos, transit structure, entry-rule
  shape) before climbing to T0 sources fact by fact.
- **Pass B** — one call for community leads; its source-routing (Reddit/YouTube/X before web
  search) is exactly Pass B's resident angle.

**The bar does not move.** Everything the Research skill returns is a **T2 lead** — verified
against a T0 primary source before it enters the guide, recorded in the ledger like any other
lead. Never cite its output, never let it substitute for the per-fact fetch discipline above.
Discovery ≠ verification: the skill finds *what to check*; the native fetch confirms *what is true*.

**Never in CI.** The headless pipeline (`research-pass.yml`) has no API keys and no local
services; its agents use native web search/fetch + the aides below. A pass without the Research
skill is a normal pass, not a degraded one.

## Social & video lead sourcing — Pass B aides

Video and social platforms hold real local knowledge (what residents actually eat, when the
famous spot is empty, which "must-see" is a queue) — but they are **T2 leads, never citations**.
Everything here obeys the same bar as the rest of Pass B: verified against a T0 primary source
before it enters the guide, or it doesn't enter.

### Binding rules

- **Leads-only.** No fact sourced from a video, post, or social roundup ships on that
  source's authority. The citation is always the official page; the social source is the
  *trail*, recorded in the reconciliation ledger's B-only rows.
- **"Viral" is a lead signal AND a crowd warning — never a quality signal.** A viral spot
  is a crowd forecast: pair any viral find with the crowd-reality + off-peak note, and
  check whether it's exactly the tourist trap Pass B exists to route around.
- **Corroborate before "locals" phrasing.** A "locals go here" / "local favorite" claim
  needs ≥2 independent social/resident sources (e.g. a transcript AND a resident forum
  thread) — one creator's opinion gets neutral phrasing, not a local's endorsement.
- **Inside the existing budget, not on top of it.** This is part of Pass B's search
  budget above. Max ~4 transcripts per full pass; skip transcripts entirely on narrow
  single-section re-runs unless the section is food/sights.
- **Failure never blocks the pass.** Every mechanism below is an aide. If a tool is
  missing or a platform blocks, apply the bot-blocked doctrine — mark it in the ledger,
  move on, ≤2 attempts. A pass with zero transcripts is a normal pass, not a degraded one.

### YouTube — transcripts via yt-dlp (never media)

The one platform with a clean keyless path: `yt-dlp` pulls a video's subtitles/transcript
without downloading any media. CI installs it best-effort (research-pass.yml); locally,
check `yt-dlp --version` first — if absent, skip to the indirect route below.

1. **Find candidates by web search**, not by browsing: `"<city> travel vlog"`,
   `"<city> what locals eat"`, `"living in <city>"`. Prefer recent uploads (≤18 months —
   perishable facts age) and resident/long-stay creators over drive-by tour compilations.
2. **Pull the transcript only:**

   ```
   yt-dlp --skip-download --write-auto-subs --write-subs \
     --sub-langs "en.*" --sub-format vtt -o "/tmp/yt-%(id)s" "<url>"
   ```

   Then read the `.vtt` and extract venue names, claims, and timing tips into the ledger
   as T2 leads. Add the destination's language to `--sub-langs` when the best creators
   are local (translate, don't skip).
3. **Failure = bot-blocked doctrine.** yt-dlp missing, a 403/429, or a video with no
   subs: mark and move on. Never retry-loop; never treat a failed pull as a finding.

### TikTok / Instagram — indirect only

No sanctioned programmatic access exists for this repo's use (TikTok's Research API is
gated to vetted academic institutions; Instagram's Graph API is business-gated with
capped hashtag search — both verified 2026-07-30, re-check terms before ever revisiting),
and scraping either platform is forbidden here. The signal still arrives: viral spots get
written up within days by web-indexed blogs, local news, and roundup sites.

- Search `"<city> tiktok famous <food|spot|cafe>"`, `"<venue> instagram crowds"`.
- The roundup is an aggregator: leads only, per the search-budget rules above.
- A spot's viral status is itself a datum — it predicts queues. Fold it into the
  crowd-reality note once the venue itself is T0-verified.

## Fetch discipline — learned from this repo's own audits

- **A HEAD/first 404 can be a live page** (visitseoul.net answered HEAD 404 / GET 200 for every
  URL). If a fetch fails oddly, retry the plain page once; judge by content, not status.
- **Bot-blocked (403/429/Cloudflare) → don't burn retries.** Mark it blocked in the ledger and
  find a different primary. Two attempts max.
- **Reader mirror as a SECOND attempt, not a first.** When a primary page returns bloated HTML
  or blocks a plain fetch, `https://r.jina.ai/<url>` returns the same page as clean markdown —
  keyless at 20 req/min (verified 2026-08-02), so no config and no secret. It counts inside the
  same two-attempt budget, never on top of it. **The citation NEVER changes:** `source_url` is
  always the venue's/operator's own URL — the mirror is how you READ the page, not where the
  fact came from. A `r.jina.ai/...` URL in a guide is a defect. If the mirror is down or also
  blocked, that is the second attempt spent: apply the stopping conditions and flag or omit.
- **Aggregators die; officials persist** (the MangoPlate lesson — a dead-since-2020 aggregator
  shipped from training data). Aggregators are *leads only*; the citation is always the official
  page. Never cite what you didn't fetch.
- **Don't paste pages into the ledger.** Extract the row (claim · value · tier+URL · date · flag)
  and move on. The ledger is evidence, not an archive.

## Token hygiene

- Don't re-read files already in context (CLAUDE.md and this skill auto-load — never re-Read them).
- Read only the group file a fact lives in, never the assembled guide.
- Keep the completion report to the standard format — the ledger table plus one line per category.
