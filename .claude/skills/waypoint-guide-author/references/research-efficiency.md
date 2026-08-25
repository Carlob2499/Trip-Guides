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

## Interactive fan-out limits (binding — 2026-08-22, after the Aug 21 crash)

An interactive research pass on 2026-08-21 ran **20–27 live subagents for 13 minutes** (8
researchers plus the forks they spawned), fired ~1,950 tool calls, and Windows killed the
hook shell (`bash.exe` AppHang). Two earlier hangs (Jul 25/26) came from single sessions whose
transcripts had grown past 25 MB. These limits exist so neither repeats:

- **At most 4 researchers live at once.** Queue the rest; start the next when one reports.
- **Researchers never delegate.** Every researcher brief carries this line verbatim:
  `You must not call Agent, fork, or spawn any subagent. Do the research yourself and report.`
  A researcher that ends its turn without findings is re-run with the same line, not forked.
- **One shared WebSearch pool of 200 per session.** Budget it up front: 4 researchers × ~40
  searches leaves headroom for reconcile. Past 150 used, researchers switch to `WebFetch` of
  known URLs only.
- **Session size ceiling.** At every checkpoint run `node scripts/session-size-check.mjs` — when
  it reports the transcript above **5 MB or 100 turns**, commit, write the handoff, and resume in
  a fresh session (`/resume` or a new session reading `docs/HANDOFF.md`). Do not push on: a 25 MB
  transcript is what hung the app in July.
- **Fork flag.** `CLAUDE_CODE_FORK_SUBAGENT` in `~/.claude/settings.json` is what let researchers
  fork. Research sessions run with it unset; it stays on only for pipeline-design sessions.

## Search budget (per ENTITY — a venue, route, or event; D2, 2026-08-13)

- **Batch by entity, not by mention.** Research a venue/route/event ONCE; every fact it yields
  shares one kebab `entity:` id (`src/content.config.ts`). Never re-research the same thing

- **Batch by entity, not by mention.** Research a venue/route/event ONCE; every fact it yields
  shares one kebab `entity:` id (`src/content.config.ts`). Never re-research the same thing
  because a second prose mention needs a number.
- **Budget scales with `risk` (0–4 on the fact), not a flat per-fact cap:**

  | Risk | R0 | R1 | R2 (default — the old flat cap) | R3 (plan-critical) | R4 (mandatory-surfaced) |
  |---|---|---|---|---|---|
  | Searches | 0 | 1 | 2 | 3–4 | uncapped, logged |

R4 (advisories, visa/health) MUST reach the guide — an omitted R4 fact is worse than an
unconfirmed one. Past budget, the stopping conditions apply (`verification-rules.md` §7): flag
`⚠` or omit — more searching produces confidence, not verification.
- **Scripts before web, always.** The deterministic lookup scripts (SKILL.md "Never guess what
  a script can verify" — the one catalog) answer coords/place_id, venue status/hours/address,
  time zone, Commons photos, and grounding leads for free — never web-search what a script
  answers. A time-zone web search ("is Arizona on daylight saving") is *slower and less
  reliable* than the one-line, zero-network `lookup-tz.mjs` call — if you catch yourself about
  to search for a time zone, stop and run the script instead.
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
- **Discovery is ADAPTIVE, not quota-driven — the per-entity budget above is a VERIFICATION
  cap, not a breadth cap. No fixed candidate, search, or find quotas exist at any
  level.** Research scales to the destination: a small town may
  hold three serious options, Tokyo may demand dozens. Stop discovering when BOTH hold: (1) new
  searches mostly produce duplicates or clearly weaker options, and (2) unresolved evidence is
  unlikely to change the final recommendation. **Record that stop** — the trend the last
  searches showed and the unresolved-evidence answer — in the run's saturation record (V2:
  `evidence.v2.json`'s `saturation`; the ledger's candidates tables remain the human trail).
  A stop is EARNED, never assumed: while searches still surface novel serious options, or an
  unresolved disagreement could flip a recommendation, keep going. Sweeping a "best <priority>
  in <city>" landscape to FILL the candidates table is discovery, not per-entity verification —
  do it before climbing to T0 on the survivors, and record every rejection with its one-line
  reason as you go.
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
- **Pass B** — the one place a FULL deep-research sweep is sanctioned (creator's ruling).
  See "Pass B deep discovery" below.

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
   `src/data/destinations/<slug>.json`'s `languages` + `t0Domains` — read it first, never
   guess the destination's language. The English ones are a supplement, not the base. Prioritize
   sources ON the destination's own web — the ccTLD, the local platforms — and translate what
   comes back; never skip a source for being non-English. Every lead records its source
   language.
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
B runs its native aides exactly as before; the dossier accelerates Pass B's discovery, it isn't
a second gate or a quota.

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
- **Source access is recorded, never inflated.** How you reached a source is itself a fact, in
  three states: **fetched** — you retrieved and read the origin page itself; **search-preview**
  — a search-result snippet (discovery, not verification); **blocked** — the origin refused or
  failed (record the block and seek a legitimate alternative rather than promoting a preview).
  Reader/mirror/proxy services (r.jina.ai, Google cache, 12ft.io, archive snapshots,
  translation proxies) are NEVER the origin — cite the true origin you actually fetched, or
  record it blocked. Where an evidence schema carries `source.access` (V2), record the state
  there; where it doesn't, the ledger note carries it.
- **Don't paste pages into the ledger.** Extract the row (claim · value · tier+URL · date · flag)
  and move on. The ledger is evidence, not an archive.

### Security challenges are an environment boundary — never a research obstacle to solve

Binding, no exceptions. A CAPTCHA, Cloudflare Turnstile, "verify you are human" interstitial,
login wall, MFA/passkey prompt, or any other security verification is where research on that
origin **stops**. Never attempt one in Claude's embedded browser — it is not a puzzle to work
around, and doing so has reproducibly crashed the session.

- **Stop interacting with that origin immediately.** Do not reopen the challenge to confirm it.
- **Record the access fact**: `source.access = "blocked"` where the evidence schema carries it,
  and a ledger note where it doesn't. A blocked authority is honest data, not a failure.
- **Never promote a search-result preview to verification.** A snippet is a lead, not a source.
- **Find another legitimate authority** — operator page, official/reference source — or leave the
  claim explicitly unverified (`⚠`) or omit it under the normal evidence rules.
- **One blocked source never fails the pass.** Mark it, keep any useful lead, continue; the
  stopping rule is still saturation plus the normal risk/verification budget, never "keep trying
  the blocked site."
- **Prefer non-interactive retrieval by default** — `WebSearch`/`WebFetch` and direct official
  pages. The embedded browser is not warranted merely because a plain fetch is inconvenient, and
  a research task must never become an account-authentication task.

Full operational rules, and the execution-plane separation that goes with them:
`docs/reference/claude-research-runtime.md` (the authority — this is the short binding form).

## Token hygiene

- Don't re-read files already in context (CLAUDE.md and this skill auto-load — never re-Read
  them).
- Read only the group file a fact lives in, never the assembled guide.
- Keep the completion report to the standard format — the ledger table plus one line per
  category.

