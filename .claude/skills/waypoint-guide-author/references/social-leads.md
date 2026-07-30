# Social & Video Lead Sourcing — Pass B aides

Extends Pass B's resident/blog/forum angle with video and social platforms. These sources
hold real local knowledge (what residents actually eat, when the famous spot is empty,
which "must-see" is a queue) — but they are **T2 leads, never citations**. Everything here
obeys the same bar as the rest of Pass B: verified against a T0 primary source before it
enters the guide, or it doesn't enter.

## Binding rules

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
  budget (research-efficiency.md). Max ~4 transcripts per full pass; skip transcripts
  entirely on narrow single-section re-runs unless the section is food/sights.
- **Failure never blocks the pass.** Every mechanism below is an aide. If a tool is
  missing or a platform blocks, apply the bot-blocked doctrine — mark it in the ledger,
  move on, ≤2 attempts. A pass with zero transcripts is a normal pass, not a degraded one.

## YouTube — transcripts via yt-dlp (never media)

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

## TikTok / Instagram — indirect only

No sanctioned programmatic access exists for this repo's use (TikTok's Research API is
gated to vetted academic institutions; Instagram's Graph API is business-gated with
capped hashtag search — both verified 2026-07-30, re-check terms before ever revisiting),
and scraping either platform is forbidden here. The signal still arrives: viral spots get
written up within days by web-indexed blogs, local news, and roundup sites.

- Search `"<city> tiktok famous <food|spot|cafe>"`, `"<venue> instagram crowds"`.
- The roundup is an aggregator: leads only, per research-efficiency.md.
- A spot's viral status is itself a datum — it predicts queues. Fold it into the
  crowd-reality note once the venue itself is T0-verified.

Interactive (non-CI) sessions may also have broader local sweep tooling (e.g. a
last-30-days social search skill); use whatever is available as an additional lead
source **under these same rules** — the platform never changes the bar.
