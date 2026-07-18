# Animated Browsing — the "trip unfolds" motion system

The presentation north-star (counterpart to `docs/PIPELINE.md`). The goal, in the creator's
words: a **unique, truly animated way to browse** that feels social-media-native (a Snapchat-story
first-open, scroll-driven motion, parallax) **and delivers information better** — tighter formatting,
deliberate alignment, higher retention, less aimless scrolling.

## The one idea

**A guide browses like a story, day by day.** A trip's real spine is its *days*, so the signature
motion device is a **segmented story rail whose segments ARE the days** — an 8-day trip shows 8
segments. It opens the guide (auto-advancing through the days like an Instagram/Snapchat story) and
will later *become* the itinerary's navigation. One device that unifies the arrival animation, the
browsing metaphor, and the information structure — and it could only belong to a travel guide
("structure is information," not decoration). This is grounded in the subject, not a generic motion
trend bolted on.

## Direction history (so we don't relitigate)

- **Kept (V1):** the hub card → guide masthead **View Transition morph** (browser-native cross-doc,
  no SPA) + the optional `cover` schema field. This is the "card opens into the guide."
- **Dropped (V2):** the palette **duotone graphic cards** — reverted. It read as "graphic poster,"
  which wasn't the goal; the hub cards stay photo-forward.
- **Now (V3):** motion. The magical open is a **one-time, first-open animation**, and motion is added
  broadly in the social-media idiom (story reveal, parallax, scroll-driven reveals).

## Motion system (grounded in current technique)

- **Native CSS scroll-driven animations** (`animation-timeline: scroll()/view()`) are the backbone
  for scroll motion: off-main-thread, no JS, progressive-enhanced (Chrome/Edge since 2023, Safari 26;
  a plain page elsewhere). This fits the offline-first, perf-budgeted site far better than
  scroll-listener JS, and it's where award galleries have moved ("scrollytelling" — each scroll
  reveals the next part).
- **First-open story intro** (shipped, V3a): the day-segmented rail + staggered cover-text reveal,
  once per guide (localStorage), skippable, reduced-motion-off, fault-safe (content is never left
  hidden). Owns the arrival on first visit so `gsap-hero.js` stands down; repeat visits get the
  normal quick arrival.
- **Existing, kept:** hero parallax + Ken Burns (`hero-parallax.js`), the GSAP masthead arrival
  (`gsap-hero.js`, repeat visits), scroll-reveal (`reveal.js`).

## Information delivery (the retention half)

Motion is only half the brief. The other half: deliver the right thing with **less scrolling**.
- **One idea per view.** The itinerary story-mode (V3c) shows one day at a time (tap/swipe to
  advance) instead of a long scroll — the socially-native, high-retention way to read a plan.
- **Deliberate alignment.** A consistent editorial measure for prose; **data in the mono face on a
  right rail** (dates, prices, transit) so the eye separates story from facts at a glance.
- **Tighter formatting.** Denser cards, lead-first bodies, cut vertical sprawl — the reader reaches
  the answer (where / how / when / book) without hunting.

## Phases

| Step | Deliverable | State |
|------|-------------|-------|
| **V1 · Magical open** | Cross-doc View Transition morph (card → masthead) + optional `cover` field | shipped |
| **V3a · First-open day-story intro** | Segmented **days** rail + staggered cover reveal, once per guide, reduced-motion-safe; `gsap-hero` stands down first visit | **shipping now** |
| **V3b · Scroll-driven CSS** | Move reveals/progress to `animation-timeline: view()/scroll()` (off-main-thread), add a scroll "journey progress"; keep JS fallback | next |
| **V3c · Story-mode itinerary** | The days rail becomes navigation: a full-screen, swipeable day-by-day deck (one day per view) — the big less-scroll / retention payoff | after V3b |
| **V3d · Info-density & alignment** | Editorial measure + mono data-rail alignment; denser lead-first cards across block types | after V3c |
| **V4 · Per-country identity** | Palette auto-extracted from the cover (node-vibrant), one signature motion set, motion-doctrine doc | later |

## Guardrails (inherited, non-negotiable)

- **Reduced-motion**: every motion has a `prefers-reduced-motion` off-path; the site is fully usable
  and readable without any animation.
- **Fault-safe**: content is never hidden waiting on JS — reveals live under a JS-added class and the
  base state is always visible.
- **Perf budget + offline**: prefer native CSS motion (off-main-thread) over JS; no new heavy deps.
- **Verify** in `astro preview` :4322 (never `astro dev` — OneDrive stale CSS), at mobile 375px +
  desktop, dark + light, reduced-motion.

## Sources (motion research, Jul 2026)

- [MDN — Scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [Chrome for Developers — Animate on scroll](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [WebKit — Scroll-driven animations with just CSS](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
- [Figma — Web design trends 2026](https://www.figma.com/resource-library/web-design-trends/)
- [Lovable — Scrolling design patterns 2026](https://lovable.dev/guides/scrolling-designs-patterns-when-to-use)
