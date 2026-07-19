# Feature Backlog — researched, scored, creator-approved (2026-07-18)

Ten features derived from market research (Wanderlog/TripIt/Polarsteps feature analysis), 2026
group-travel survey data (CIT Bank "peace tax": 45% financial conflict, 61% social-pressure
overspend), and the free-API reality (paid travel APIs rejected — **the research pipeline is the
free, verified backend** wherever possible). All ten: mobile/desktop scaled, obvious to non-tech
users, non-gimmick, universal across trips, $0 API cost, 1–2 Sonnet sessions each.

**Build rule:** implementation sessions run on **SONNET** (remind the creator to switch models at
session start — HANDOFF.md carries the reminder). One feature per session; ship loop every time.

## Approved wave (build in this order)

| # | Feature | Core | Integration | Notes |
|---|---------|------|-------------|-------|
| 1 | **"Get me there" transit deep-links** | One-tap open-in buttons (Google/Apple + country-native apps: Naver/Kakao…) on every stop/sight, from verified coords/place_ids | Shared component in stop/sight cards; country→app map in `countries.mjs` | Fixes the Google-reachability bias the Korea post-mortem flagged. FIRST build. |
| 5 | **Arrival-day autopilot** | Guided "just landed" sequence: transfer choice, immigration checklist, SIM/T-money, driver card, hotel address in native script | Reuses the story-mode chassis over existing Plan/Getting-around data; lives in the **Trip kit** tab | Airport-transfer standard already mandates the content. |
| 6 | **Phrase cards + speak** | 15–20 verified situational cards (allergy/taxi/help), native script big-type + romanization, offline, free browser TTS (Web Speech API) | New `phrases` block type; UI in **Trip kit**; pipeline generates + verifies the set | Extends show-the-driver / `local_script_name`. |
| 7 | **Entry-requirements card** | Visa/ETA + passport-validity for the party's home country — pipeline-researched, source+date stamped, recert-refreshed | Panel convention in Plan (+ **Trip kit** echo); intake home-country drives it | The pipeline-as-backend exemplar. NEVER a paid visa API. |
| 8 | **Sun & daylight strip** | Sunrise/sunset/golden hour per trip day, pure client-side math (no API, no dep) | `live-data` model fn + day-card chip + Focus Today "daylight left" | |
| 9 | **Advisory pill** | Official travel-advisory level + primary link, shown ONLY when elevated (honest-blank doctrine) | SOS silo extension + hub badge; source fetched at build/recert — **verify the official free source before building** | |
| 10 | **Trip recap card** | Post-trip shareable image (days, done-vs-skipped from learnings, group spend) via the existing sharp OG generator | OG-generator reuse + learnings silo | Feeds TRAVELER_PATTERNS (the loop's social payoff). |

**New surface decision:** ONE new tool tab — **Trip kit** (houses #5 autopilot, #6 phrases,
#7 entry card). Tool tabs are layout chrome (outside `tabBudget`) but spend reader attention;
this is the single deliberate spend.

## Held (not rejected — one word revives them)

| # | Feature | Why it was proposed |
|---|---------|---------------------|
| 2 | **Prep timeline (T-minus deadlines on the booking checklist)** | "Coordination failure kills group trips" — the strongest discourse finding. Additive `due` field; zero API. |
| 3 | **Budget pact + actual-vs-plan** | 61% overspend from social pressure; intake budget vs Trip Split live actuals. Zero API. |

## Dropped

| # | Feature | Decision |
|---|---------|----------|
| 4 | Reservation vault | Creator: skip entirely — travelers keep email/wallet apps for confirmations. |

## Sources

[App-landscape comparison](https://blueplanit.co/blog/best-travel-planning-apps-thorough-reviews-of-tripadvisor-travel-mapper) ·
[TripIt alternatives](https://www.wandrly.app/alternatives/tripit) ·
[CIT Bank peace-tax survey (Jun 2026)](https://newsroom.firstcitizens.com/2026-06-23-82-of-Group-Travelers-Will-Pay-a-Peace-Tax-to-Avoid-Money-Arguments,-CIT-Bank-Survey-Finds) ·
[Group-cost discourse](https://monkeytravel.app/blog/group-trip-budget-how-to-split-costs) ·
[Free travel APIs reality](https://www.altexsoft.com/techtalks/how-to-get-free-travel-apis/)
