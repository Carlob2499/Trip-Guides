# Where the tests are blind

**Generated — do not edit.** `npm run mutate` rebuilds it.

A passing test suite proves the tests *ran*. It does not prove they would *catch* anything.
So this breaks the code on purpose — thousands of small sabotages, one at a time — and
records which ones no test noticed. Every line below is a change someone could make to this
product tomorrow without a single test going red.

**76% of 5974 deliberate breakages were caught.**
1275 slipped past the tests. 150 were in code no test touches at all.

This number is never 100% and is not meant to be — some sabotages produce code that behaves
identically, and some are in places not worth the cost of a test. It is a map of the thin ice,
not a grade.

| Area | Caught | Slipped past | Untouched by any test |
| --- | --- | --- | --- |
| The hub — the globe and the map | 799 | 360 | 61 |
| Money — the shared trip budget | 666 | 149 | 22 |
| Reminders, feedback and the pipeline | 598 | 144 | 16 |
| Dates, time zones and freshness | 515 | 138 | 4 |
| Live conditions — weather, daylight, closures | 448 | 116 | 7 |
| Guide content and how it renders | 226 | 101 | 9 |
| Taking a guide with you — exports and sharing | 251 | 97 | 6 |
| Using a guide on the road | 408 | 75 | 15 |
| Navigation, panels and gestures | 418 | 46 | 0 |
| Colour and legibility | 132 | 27 | 8 |
| Syncing between phones | 74 | 13 | 1 |
| Everything else | 14 | 9 | 1 |

## The gaps worth reading

Up to ten per area — the rest are in the full report.

### The hub — the globe and the map

- Someone changed an and to an or and nothing failed.  <sub>src/features/atlas/model/relevance.ts:24</sub>
  `if (a.status === "upcoming") return (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/atlas/model/relevance.ts:25</sub>
  `if (a.status === "past") return (b.end?.getTime() ?? -Infinity) - (a.end?.getTime() ?? -Infinity);`
- Someone removed a guard against missing data and nothing failed.  <sub>src/features/atlas/model/relevance.ts:24</sub>
  `if (a.status === "upcoming") return (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity);`
- Someone changed an and to an or and nothing failed.  <sub>src/features/atlas/model/relevance.ts:25</sub>
  `if (a.status === "past") return (b.end?.getTime() ?? -Infinity) - (a.end?.getTime() ?? -Infinity);`
- Someone removed a guard against missing data and nothing failed.  <sub>src/features/atlas/model/relevance.ts:25</sub>
  `if (a.status === "past") return (b.end?.getTime() ?? -Infinity) - (a.end?.getTime() ?? -Infinity);`
- Someone removed a guard against missing data and nothing failed.  <sub>src/features/atlas/model/relevance.ts:25</sub>
  `if (a.status === "past") return (b.end?.getTime() ?? -Infinity) - (a.end?.getTime() ?? -Infinity);`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/atlas/model/search-index.ts:48</sub>
  `return String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/atlas/model/search-index.ts:56</sub>
  `if (it && typeof it === "object") {`
- Someone changed an and to an or and nothing failed.  <sub>src/features/atlas/model/search-index.ts:56</sub>
  `if (it && typeof it === "object") {`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/atlas/model/search-index.ts:56</sub>
  `if (it && typeof it === "object") {`
- …and 350 more.

### Money — the shared trip budget

- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/trip-split/model/money.ts:63</sub>
  `if (!ratePerBase || !Number.isFinite(ratePerBase) || ratePerBase <= 0) return null;`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/trip-split/model/money.ts:97</sub>
  `this.name = 'SplitError';`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/trip-split/model/money.ts:109</sub>
  `'INVALID_AMOUNT',`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/trip-split/model/money.ts:108</sub>
  ``amountMinor must be a non-negative integer in minor units, got ${amountMinor}`,`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/trip-split/model/money.ts:113</sub>
  `throw new SplitError('at least one participant is required', 'NO_PARTICIPANTS');`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/trip-split/model/money.ts:113</sub>
  `throw new SplitError('at least one participant is required', 'NO_PARTICIPANTS');`
- Someone deleted the body of a block entirely and nothing failed.  <sub>src/features/trip-split/model/money.ts:112</sub>
  `if (participants.length === 0) {`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/trip-split/model/money.ts:117</sub>
  `throw new SplitError('duplicate memberId in participants', 'DUPLICATE_MEMBER');`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/trip-split/model/money.ts:117</sub>
  `throw new SplitError('duplicate memberId in participants', 'DUPLICATE_MEMBER');`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-split/model/money.ts:122</sub>
  `if (p.weight === undefined || !Number.isSafeInteger(p.weight) || p.weight < 0) {`
- …and 139 more.

### Reminders, feedback and the pipeline

- Someone emptied a list and nothing failed.  <sub>src/features/change-request/model/change-request.ts:27</sub>
  `for (const s of navSections ?? []) {`
- Someone removed a guard against missing data and nothing failed.  <sub>src/features/change-request/model/change-request.ts:28</sub>
  `const value = sanitizeSection(s?.group ?? "");`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/change-request/model/change-request.ts:41</sub>
  `out.push({ value: NOT_SURE, label: "I'm not sure", hint: "let the editor find it" });`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/change-request/model/change-request.ts:54</sub>
  `if (text.length < 10) return { ok: false, error: "A little more detail — what should it say instead?" };`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/change-request/model/change-request.ts:54</sub>
  `if (text.length < 10) return { ok: false, error: "A little more detail — what should it say instead?" };`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/change-request/model/change-request.ts:56</sub>
  `return { ok: true, error: "" };`
- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/features/change-request/model/change-request.ts:69</sub>
  `change: (state.change ?? "").trim(),`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/change-request/model/change-request.ts:12</sub>
  `export const NOT_SURE = "";`
- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/features/intake-questions/model/question.ts:45</sub>
  `if (!q.text?.trim()) errs.push("missing text");`
- Someone removed a guard against missing data and nothing failed.  <sub>src/features/intake-questions/model/question.ts:45</sub>
  `if (!q.text?.trim()) errs.push("missing text");`
- …and 134 more.

### Dates, time zones and freshness

- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:20</sub>
  `if (typeof w !== "number" || !isFinite(w)) return false;`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:20</sub>
  `if (typeof w !== "number" || !isFinite(w)) return false;`
- Someone changed an and to an or and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:20</sub>
  `if (typeof w !== "number" || !isFinite(w)) return false;`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:21</sub>
  `return (w >= 51 && w <= 67) || (w >= 71 && w <= 77) || (w >= 80 && w <= 86) || (w >= 95 && w <= 99);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:21</sub>
  `return (w >= 51 && w <= 67) || (w >= 71 && w <= 77) || (w >= 80 && w <= 86) || (w >= 95 && w <= 99);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:21</sub>
  `return (w >= 51 && w <= 67) || (w >= 71 && w <= 77) || (w >= 80 && w <= 86) || (w >= 95 && w <= 99);`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:21</sub>
  `return (w >= 51 && w <= 67) || (w >= 71 && w <= 77) || (w >= 80 && w <= 86) || (w >= 95 && w <= 99);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:21</sub>
  `return (w >= 51 && w <= 67) || (w >= 71 && w <= 77) || (w >= 80 && w <= 86) || (w >= 95 && w <= 99);`
- Someone changed a pattern-match rule and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:29</sub>
  `const m = /([A-Z][a-z]{2})\s+(\d{1,2})/.exec(String(dayDate || ""));`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/day-swap.ts:30</sub>
  `if (!m || MONTHS[m[1]] === undefined) return -1;`
- …and 128 more.

### Live conditions — weather, daylight, closures

- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/packing.ts:29</sub>
  `if (!daily || !slice || slice.count <= 0) return null;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/live-data/model/packing.ts:29</sub>
  `if (!daily || !slice || slice.count <= 0) return null;`
- Someone changed an and to an or and nothing failed.  <sub>src/features/live-data/model/packing.ts:31</sub>
  `for (let i = slice.startI; i < slice.startI + slice.count && i < daily.time.length; i++) idx.push(i);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/packing.ts:31</sub>
  `for (let i = slice.startI; i < slice.startI + slice.count && i < daily.time.length; i++) idx.push(i);`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/live-data/model/packing.ts:31</sub>
  `for (let i = slice.startI; i < slice.startI + slice.count && i < daily.time.length; i++) idx.push(i);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/packing.ts:31</sub>
  `for (let i = slice.startI; i < slice.startI + slice.count && i < daily.time.length; i++) idx.push(i);`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/live-data/model/packing.ts:31</sub>
  `for (let i = slice.startI; i < slice.startI + slice.count && i < daily.time.length; i++) idx.push(i);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/live-data/model/packing.ts:32</sub>
  `if (!idx.length) return null;`
- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/features/live-data/model/packing.ts:37</sub>
  `const tempMinC = Math.min(...lows);`
- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/features/live-data/model/packing.ts:36</sub>
  `const tempMaxC = Math.max(...highs);`
- …and 106 more.

### Guide content and how it renders

- Someone forced a decision to always go one way and nothing failed.  <sub>src/lib/lead-split.ts:41</sub>
  `if (text.length <= max) return text;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/lead-split.ts:41</sub>
  `if (text.length <= max) return text;`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/lib/lead-split.ts:41</sub>
  `if (text.length <= max) return text;`
- Someone changed a pattern-match rule and nothing failed.  <sub>src/lib/lead-split.ts:42</sub>
  `const sentenceEnd = /[.!?]\s/g;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/lead-split.ts:41</sub>
  `if (text.length <= max) return text;`
- Someone changed a pattern-match rule and nothing failed.  <sub>src/lib/lead-split.ts:42</sub>
  `const sentenceEnd = /[.!?]\s/g;`
- Someone flipped a sign and nothing failed.  <sub>src/lib/lead-split.ts:43</sub>
  `let last = -1;`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/lib/lead-split.ts:45</sub>
  `while ((m = sentenceEnd.exec(text)) !== null) {`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/lead-split.ts:45</sub>
  `while ((m = sentenceEnd.exec(text)) !== null) {`
- Someone deleted the body of a block entirely and nothing failed.  <sub>src/lib/lead-split.ts:45</sub>
  `while ((m = sentenceEnd.exec(text)) !== null) {`
- …and 91 more.

### Taking a guide with you — exports and sharing

- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/features/exports/model/exports.ts:46</sub>
  `return String(s)`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/exports/model/exports.ts:50</sub>
  `.replace(/&lt;/g, "<").replace(/&gt;/g, ">")`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/exports/model/exports.ts:50</sub>
  `.replace(/&lt;/g, "<").replace(/&gt;/g, ">")`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/exports/model/exports.ts:51</sub>
  `.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")`
- Someone changed a pattern-match rule and nothing failed.  <sub>src/features/exports/model/exports.ts:51</sub>
  `.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/exports/model/exports.ts:51</sub>
  `.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/exports/model/exports.ts:51</sub>
  `.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")`
- Someone blanked out a piece of text and nothing failed.  <sub>src/features/exports/model/exports.ts:52</sub>
  `.replace(/&nbsp;/g, " ")`
- Someone changed a pattern-match rule and nothing failed.  <sub>src/features/exports/model/exports.ts:53</sub>
  `.replace(/<a\b[^>]*>(.*?)<\/a>/gis, "$1")   // keep link text, drop the tag`
- Someone changed a pattern-match rule and nothing failed.  <sub>src/features/exports/model/exports.ts:53</sub>
  `.replace(/<a\b[^>]*>(.*?)<\/a>/gis, "$1")   // keep link text, drop the tag`
- …and 87 more.

### Using a guide on the road

- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:60</sub>
  `if (!w || !w.name) continue;`
- Someone changed an and to an or and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:60</sub>
  `if (!w || !w.name) continue;`
- Someone changed an and to an or and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:61</sub>
  `if (typeof w.lat === "number" && typeof w.lng === "number") points.push({ name: w.name, lat: w.lat, lng: w.lng`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:61</sub>
  `if (typeof w.lat === "number" && typeof w.lng === "number") points.push({ name: w.name, lat: w.lat, lng: w.lng`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:61</sub>
  `if (typeof w.lat === "number" && typeof w.lng === "number") points.push({ name: w.name, lat: w.lat, lng: w.lng`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:64</sub>
  `if (points.length < 2) continue;`
- Someone changed ArrowFunction and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:71</sub>
  `names: opt.order.map((i) => points[i].name),`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:79</sub>
  `date: d.date || "",`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:79</sub>
  `date: d.date || "",`
- Someone changed an and to an or and nothing failed.  <sub>src/features/trip-tools/model/route-plan.ts:79</sub>
  `date: d.date || "",`
- …and 65 more.

### Navigation, panels and gestures

- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/mobile-nav/model/gesture.ts:28</sub>
  `return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > AXIS_LOCK_PX;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/mobile-nav/model/gesture.ts:43</sub>
  `if (cur < 0) return null; // a tool panel is open — it is entered and left deliberately`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/mobile-nav/model/gesture.ts:47</sub>
  `const fast = Math.abs(vx) >= COMMIT_VELOCITY && Math.abs(dx) > AXIS_LOCK_PX;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/mobile-nav/model/gesture.ts:49</sub>
  `const next = dx < 0 ? cur + 1 : cur - 1;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/mobile-nav/model/gesture.ts:50</sub>
  `if (next < 0 || next >= count) return null;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/mobile-nav/model/gesture.ts:68</sub>
  `const next = dx < 0 ? cur + 1 : cur - 1;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/mobile-nav/model/gesture.ts:69</sub>
  `return next < 0 || next >= count;`
- Someone deleted the body of a block entirely and nothing failed.  <sub>src/features/mobile-nav/model/rank.ts:22</sub>
  `try { obj = JSON.parse(raw); } catch { return {}; }`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/mobile-nav/model/rank.ts:24</sub>
  `if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/mobile-nav/model/rank.ts:29</sub>
  `if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);`
- …and 36 more.

### Colour and legibility

- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/contrast.ts:9</sub>
  `return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);`
- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/lib/contrast.ts:57</sub>
  `return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/lib/contrast.ts:77</sub>
  `const worst = bgs.reduce((w, c) => (contrastRatio(fg, c) < contrastRatio(fg, w) ? c : w));`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/lib/contrast.ts:77</sub>
  `const worst = bgs.reduce((w, c) => (contrastRatio(fg, c) < contrastRatio(fg, w) ? c : w));`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/contrast.ts:77</sub>
  `const worst = bgs.reduce((w, c) => (contrastRatio(fg, c) < contrastRatio(fg, w) ? c : w));`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/contrast.ts:77</sub>
  `const worst = bgs.reduce((w, c) => (contrastRatio(fg, c) < contrastRatio(fg, w) ? c : w));`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/contrast.ts:71</sub>
  `if (bgs.every((bg) => contrastRatio(fg, bg) >= target)) return fg;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/contrast.ts:78</sub>
  `const lighten = relativeLuminance(worst) < 0.18;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/lib/contrast.ts:80</sub>
  `for (let i = 0; i < 96; i++) {`
- Someone counted the wrong way and nothing failed.  <sub>src/lib/contrast.ts:80</sub>
  `for (let i = 0; i < 96; i++) {`
- …and 17 more.

### Syncing between phones

- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/firebase/model/room.ts:23</sub>
  `return typeof value === "string" && ROOM_ID_RE.test(value);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/firebase/model/room.ts:36</sub>
  `if (typeof hash !== "string" || !hash) return "";`
- Someone changed an and to an or and nothing failed.  <sub>src/features/firebase/model/room.ts:36</sub>
  `if (typeof hash !== "string" || !hash) return "";`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/firebase/model/room.ts:36</sub>
  `if (typeof hash !== "string" || !hash) return "";`
- Someone changed a pattern-match rule and nothing failed.  <sub>src/features/firebase/model/room.ts:37</sub>
  `const m = /(?:^#|&|^)room=([^&]+)/.exec(hash);`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/firebase/model/room.ts:38</sub>
  `if (!m) return "";`
- Someone deleted the body of a block entirely and nothing failed.  <sub>src/features/firebase/model/room.ts:42</sub>
  `} catch {`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/firebase/model/room.ts:86</sub>
  `if (!(now instanceof Date) || isNaN(now.getTime())) return false;`
- Someone changed an and to an or and nothing failed.  <sub>src/features/firebase/model/room.ts:86</sub>
  `if (!(now instanceof Date) || isNaN(now.getTime())) return false;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/firebase/model/room.ts:92</sub>
  `return now.getTime() > unlockUntil.getTime();`
- …and 3 more.

### Everything else

- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:55</sub>
  `const dayItems = sections`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:56</sub>
  `.filter((s) => s?.type === "days")`
- Someone removed a guard against missing data and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:56</sub>
  `.filter((s) => s?.type === "days")`
- Someone removed a call, such as the copy that keeps data from being shared and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:66</sub>
  `const withStops = dayItems.filter((d) => Array.isArray(d?.waypoints) && d.waypoints.length > 0).length;`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:66</sub>
  `const withStops = dayItems.filter((d) => Array.isArray(d?.waypoints) && d.waypoints.length > 0).length;`
- Someone changed an and to an or and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:66</sub>
  `const withStops = dayItems.filter((d) => Array.isArray(d?.waypoints) && d.waypoints.length > 0).length;`
- Someone forced a decision to always go one way and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:66</sub>
  `const withStops = dayItems.filter((d) => Array.isArray(d?.waypoints) && d.waypoints.length > 0).length;`
- Someone removed a guard against missing data and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:66</sub>
  `const withStops = dayItems.filter((d) => Array.isArray(d?.waypoints) && d.waypoints.length > 0).length;`
- Someone changed a comparison, so a boundary shifted by one and nothing failed.  <sub>src/features/trip-tools/model/tools-record.ts:66</sub>
  `const withStops = dayItems.filter((d) => Array.isArray(d?.waypoints) && d.waypoints.length > 0).length;`

