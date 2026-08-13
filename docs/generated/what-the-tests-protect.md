# What the tests protect

**Generated — do not edit.** `node scripts/test-index.mjs` rebuilds it; CI fails if it is stale.

Every line below is a check that runs on every push. A **bold** line is a promise this
product makes to whoever is holding it on a trip; the lines under it are the specific ways
that promise is verified. If a promise ever stops being true, one of its checks goes red and
nothing ships.

1896 checks · 1896 carry a stated promise · 162 files

## Can everyone read it

**Anyone can read every screen — text stays legible and controls stay usable, in both light and dark.**

- form controls are >=16px so iOS never zoom-traps  <sub>tests/visual/a11y.spec.ts:525</sub>
- every page passes an automated accessibility scan  <sub>tests/visual/a11y.spec.ts:573</sub>
- each guide uses its own readable accent colour, not another guide's  <sub>tests/visual/a11y.spec.ts:661</sub>
- what's-next banner is legible  <sub>tests/visual/a11y.spec.ts:695</sub>
- ⌁ with every sheet closed, nothing inside one is focusable  <sub>tests/visual/a11y.spec.ts:750</sub>
- ⌁ an open sheet traps focus, Escape closes it, and focus comes back to the opener  <sub>tests/visual/a11y.spec.ts:769</sub>
- every visible target clears 44px — …, …  <sub>tests/visual/a11y.spec.ts:851</sub>

**Search reaches anything in a guide, from anywhere in it.**

- the palette opens via …  <sub>tests/visual/palette.spec.ts:30</sub>
- typing filters the list, and Escape closes and returns focus  <sub>tests/visual/palette.spec.ts:36</sub>
- Enter on the selected row jumps to it and closes the palette  <sub>tests/visual/palette.spec.ts:58</sub>
- a result row's hint is a plain secondary line, not the footer's rule  <sub>tests/visual/palette.spec.ts:69</sub>
- the open palette passes axe in … mode  <sub>tests/visual/palette.spec.ts:90</sub>

## The hub — the globe and the trip list

**The home page works: the globe, the trip list, and every route from there into a guide.**

- the sheet list is reachable with JavaScript entirely disabled (D4's server-rendered door)  <sub>tests/visual/atlas-hub.spec.ts:14</sub>
- reduced-motion: the cover does not animate and the hub is immediately reachable  <sub>tests/visual/atlas-hub.spec.ts:34</sub>
- a second visit in the same session never shows the cover  <sub>tests/visual/atlas-hub.spec.ts:45</sub>
- the table header collapses to a search button instead of following you down the list  <sub>tests/visual/atlas-hub.spec.ts:62</sub>
- the search field still works with no JavaScript, and no dead button is offered  <sub>tests/visual/atlas-hub.spec.ts:93</sub>
- every trip row carries its own cover plate, asked for at plate size  <sub>tests/visual/atlas-hub.spec.ts:103</sub>
- mobile globe: each surveyed country names itself without being tapped  <sub>tests/visual/atlas-hub.spec.ts:126</sub>
- desktop keeps its full pincards and shows no phone chips  <sub>tests/visual/atlas-hub.spec.ts:154</sub>
- the globe carries a hideable readout for the featured trip, and remembers the choice  <sub>tests/visual/atlas-hub.spec.ts:163</sub>
- the dock stands down while another bottom surface owns the screen  <sub>tests/visual/atlas-hub.spec.ts:187</sub>
- the dock is a globe surface only — no JS, and no phone dock on desktop  <sub>tests/visual/atlas-hub.spec.ts:202</sub>
- the ping sheet's grip is a real handle — dragging it down dismisses the sheet  <sub>tests/visual/atlas-hub.spec.ts:218</sub>
- the ping sheet stops transitioning while a thumb owns its transform  <sub>tests/visual/atlas-hub.spec.ts:268</sub>
- closing the ping sheet returns the globe to the world and lets it spin again  <sub>tests/visual/atlas-hub.spec.ts:311</sub>
- mobile: the brand, the view switch and the header buttons share one row  <sub>tests/visual/atlas-hub.spec.ts:353</sub>
- mobile: the globe dock spans the screen and clears the FAB by stacking, not by inset  <sub>tests/visual/atlas-hub.spec.ts:378</sub>
- tapping a pin shows the trip's cover, asked for at the size it is drawn  <sub>tests/visual/atlas-hub.spec.ts:403</sub>
- mobile: ＋ New guide lives in the menu, not as a bare glyph in the header  <sub>tests/visual/atlas-hub.spec.ts:439</sub>
- mobile: picking a pin haloes it, marks its row, and pauses the spin  <sub>tests/visual/atlas-hub.spec.ts:457</sub>
- mobile: leaving for a guide and coming back keeps the sheet selected  <sub>tests/visual/atlas-hub.spec.ts:481</sub>
- a pick on open water clears the selection instead of stranding a halo  <sub>tests/visual/atlas-hub.spec.ts:494</sub>
- desktop: a pin card reads as a card, not as a raw browser link  <sub>tests/visual/atlas-hub.spec.ts:511</sub>
- desktop: a pin card's cover is asked for at the size it is drawn  <sub>tests/visual/atlas-hub.spec.ts:526</sub>

## Money, tools and taking it with you

**A guide's tools run on that guide's own data, and no door leads to the deleted screen.**

- the station renders every tool for the guide it lives in  <sub>tests/visual/trip-tools.spec.ts:25</sub>
- the jet-lag panel is NOT here — it moved to Plan, and did not get left in both  <sub>tests/visual/trip-tools.spec.ts:35</sub>
- Reminders kept its panel when its tool tab was retired  <sub>tests/visual/trip-tools.spec.ts:46</sub>
- the calculator is on the guide's own ledger key  <sub>tests/visual/trip-tools.spec.ts:57</sub>
- no budget figure from the guide has leaked into the split panel  <sub>tests/visual/trip-tools.spec.ts:66</sub>
- reminder ticks persist per guide, including the ones behind the disclosure  <sub>tests/visual/trip-tools.spec.ts:73</sub>
- route order says straight-line, so nobody reads it as walking time  <sub>tests/visual/trip-tools.spec.ts:86</sub>
- no surface still links to the retired /tools/ screen  <sub>tests/visual/trip-tools.spec.ts:93</sub>
- ⌁ the hub carries no tools door at all — at either width  <sub>tests/visual/trip-tools.spec.ts:103</sub>
- a guide's own rail is the way in, and it opens the station  <sub>tests/visual/trip-tools.spec.ts:115</sub>
- the station's content is in the page without JavaScript  <sub>tests/visual/trip-tools.spec.ts:123</sub>

**The map and calendar files a guide hands out are valid, and open in real apps.**

- built exports  <sub>tests/visual/exports.spec.ts:46</sub>
- the repo has guides to check (guards a vacuous pass)  <sub>tests/visual/exports.spec.ts:48</sub>
- ….gpx is well-formed GPX 1.1  <sub>tests/visual/exports.spec.ts:53</sub>
- ….ics is well-formed iCalendar  <sub>tests/visual/exports.spec.ts:83</sub>
- at least one guide actually produced each export  <sub>tests/visual/exports.spec.ts:154</sub>

**The printed budget sheet says exactly what the calculator on screen says.**

- the PDF button stays hidden until there is spending, then appears  <sub>tests/visual/budget-sheet.spec.ts:58</sub>
- clicking it prints a two-page sheet on <body> and then removes it  <sub>tests/visual/budget-sheet.spec.ts:72</sub>
- the printed figures are the ones the calculator shows  <sub>tests/visual/budget-sheet.spec.ts:98</sub>
- non-Latin names survive, and payment handles never reach the file  <sub>tests/visual/budget-sheet.spec.ts:122</sub>

**The shared trip budget never quietly changes what anyone owes.**

- a pre-V2 trip migrates in place without changing what anyone owes  <sub>tests/visual/trip-split-v2.spec.ts:50</sub>
- a person added later does not inherit expenses recorded before they arrived  <sub>tests/visual/trip-split-v2.spec.ts:66</sub>
- an amount typed in won stores the rate it was converted at  <sub>tests/visual/trip-split-v2.spec.ts:79</sub>
- Mark paid settles a debt, and Undo puts it back  <sub>tests/visual/trip-split-v2.spec.ts:100</sub>
- the split rule belongs to one expense, not to the whole trip  <sub>tests/visual/trip-split-v2.spec.ts:118</sub>
- the newest expense sits at the top, next to the form that made it  <sub>tests/visual/trip-split-v2.spec.ts:152</sub>
- search and filters narrow the list without touching the totals  <sub>tests/visual/trip-split-v2.spec.ts:165</sub>
- the filter bar stays out of the way on a short trip  <sub>tests/visual/trip-split-v2.spec.ts:193</sub>
- categories drive a spend breakdown, and stay hidden until one exists  <sub>tests/visual/trip-split-v2.spec.ts:198</sub>
- deleting an expense is reversible, and the balances come back exactly  <sub>tests/visual/trip-split-v2.spec.ts:214</sub>
- undoing a person's removal also un-does the rewrites it caused  <sub>tests/visual/trip-split-v2.spec.ts:235</sub>
- the undo bar can be dismissed, and a second deletion supersedes the first  <sub>tests/visual/trip-split-v2.spec.ts:256</sub>

## The guide page itself

**A saved guide opens with no signal at all.**

- offline confidence  <sub>tests/visual/offline.spec.ts:36</sub>
- the shell loads with zero network once the service worker controls the page  <sub>tests/visual/offline.spec.ts:43</sub>
- the colophon's offline confirmation reflects REAL Cache Storage state, not navigator.onLine  <sub>tests/visual/offline.spec.ts:58</sub>
- guide "…" loads with zero network once controlled  <sub>tests/visual/offline.spec.ts:75</sub>
- a guide NOT in the precache (never visited) fails honestly rather than silently — offline-pill explains it  <sub>tests/visual/offline.spec.ts:87</sub>
- map tiles are NOT precached (documented limitation, not a bug) — sw.js has no map-tile caching logic  <sub>tests/visual/offline.spec.ts:104</sub>

**Nothing hides under a phone's notch or home bar.**

- …: declares viewport-fit=cover, or every safe-area inset is dead  <sub>tests/visual/safe-area.spec.ts:24</sub>
- guide chrome pads for a cutout instead of hard-coding its offsets  <sub>tests/visual/safe-area.spec.ts:31</sub>

**Nothing runs off the side of a phone screen, so no sentence ever loses its ending.**

- …: fits a 375px phone without horizontal overflow  <sub>tests/visual/no-h-overflow.spec.ts:55</sub>

**Sections open, close, and stay how you left them — even with JavaScript switched off.**

- Panel gates — korea/Essentials on the real guide page  <sub>tests/visual/panels.spec.ts:34</sub>
- JS off: every Panel renders open, no toggle or grip is drawn  <sub>tests/visual/panels.spec.ts:36</sub>
- restore: a previously-collapsed Panel is shut at first paint, with zero transitions  <sub>tests/visual/panels.spec.ts:78</sub>
- staging: [data-panel-anim] lands in a later task than [data-panel-ready]  <sub>tests/visual/panels.spec.ts:139</sub>

**Sharing a guide sends the exact page you are looking at, not the front door.**

- opening the share panel sets WhatsApp/email links to the correctly-encoded current URL + title  <sub>tests/visual/share-panel.spec.ts:13</sub>
- the copy-link button carries the same URL shown in the panel  <sub>tests/visual/share-panel.spec.ts:34</sub>
- the share URL updates to a section-specific #grp-N deep link when a numbered tab is active  <sub>tests/visual/share-panel.spec.ts:43</sub>
- Escape closes the share modal and returns focus to the trigger  <sub>tests/visual/share-panel.spec.ts:58</sub>
- the open share panel passes axe in … mode  <sub>tests/visual/share-panel.spec.ts:81</sub>
- the QR paints in the live theme tokens  <sub>tests/visual/share-panel.spec.ts:122</sub>

**The '?' explains a control without covering the page or losing half its own sentence.**

- a panel's explanation is off the screen but in the page  <sub>tests/visual/hint.spec.ts:35</sub>
- hovering reveals it, and so does keyboard focus — on CSS alone  <sub>tests/visual/hint.spec.ts:49</sub>
- with no script at all, the explanation is still IN the document  <sub>tests/visual/hint.spec.ts:65</sub>
- tapping opens it — the case hover cannot serve — and Escape closes it  <sub>tests/visual/hint.spec.ts:80</sub>
- asking what a panel is does not collapse the panel  <sub>tests/visual/hint.spec.ts:94</sub>
- only one hint is open at a time  <sub>tests/visual/hint.spec.ts:105</sub>
- every hint bubble stays on screen when opened at 375px  <sub>tests/visual/hint.spec.ts:120</sub>

**The research progress page animates smoothly instead of stuttering.**

- the progress bar fills by transform, anchored to the left edge  <sub>tests/visual/progress-bar.spec.ts:6</sub>

**You can report a problem with a guide without leaving the page or losing what you typed.**

- the trigger is a real prefilled link, so the flow survives JS being off  <sub>tests/visual/change-request.spec.ts:17</sub>
- clicking opens the wizard instead of navigating away  <sub>tests/visual/change-request.spec.ts:28</sub>
- the modal is reparented to <body> so `fixed` is viewport-relative, not chrome-relative  <sub>tests/visual/change-request.spec.ts:36</sub>
- tab chips are built from the guide's own nav, plus an explicit escape hatch  <sub>tests/visual/change-request.spec.ts:50</sub>
- picking a tab keeps focus on the chip and marks exactly one pressed  <sub>tests/visual/change-request.spec.ts:61</sub>
- the description step refuses an empty report and accepts a real one  <sub>tests/visual/change-request.spec.ts:78</sub>
- Escape closes the wizard and returns focus to the trigger  <sub>tests/visual/change-request.spec.ts:99</sub>
- the wizard fits the viewport at 375px and its textarea clears the iOS zoom floor  <sub>tests/visual/change-request.spec.ts:111</sub>
- the submit button keeps its label on hover  <sub>tests/visual/change-request.spec.ts:131</sub>

## Other browser checks

**Defects fixed in the R5 cycle stay fixed.**

- ⌁ 9.1 every station has its panel and every panel its station  <sub>tests/visual/pins.spec.ts:11</sub>
- ⌁ 9.3 the sheet both animates and leaves the tab order  <sub>tests/visual/pins.spec.ts:34</sub>
- ⌁ 9.4 no money surface renders a tone name where a figure belongs  <sub>tests/visual/pins.spec.ts:52</sub>
- ⌁ 9.5 the same trip data renders at phone and desktop width  <sub>tests/visual/pins.spec.ts:78</sub>
- ⌁ 9.6 the tools run on the guide they are in, with no slug to forget  <sub>tests/visual/pins.spec.ts:99</sub>
- the pins delegated above still have somewhere to live  <sub>tests/visual/pins.spec.ts:120</sub>

**Every checked section shows the date it was checked, and every aged-out one says so instead.**

- every verified section carries exactly one verification mark  <sub>tests/visual/section-stamp.spec.ts:24</sub>
- ⌁ past its shelf life the stamp gives way to the downgrade pill  <sub>tests/visual/section-stamp.spec.ts:50</sub>
- the stamp is a mark, not a control  <sub>tests/visual/section-stamp.spec.ts:68</sub>

**No number on a guide contradicts the thing it is counting.**

- ⌁ no stated station or group count disagrees with the rail  <sub>tests/visual/copy-honesty.spec.ts:20</sub>
- ⌁ any stated expense or transfer count equals the rows beneath it  <sub>tests/visual/copy-honesty.spec.ts:39</sub>
- ⌁ no placeholder copy survives onto the page  <sub>tests/visual/copy-honesty.spec.ts:81</sub>
- ⌁ no guide hardcodes a count its own data could produce  <sub>tests/visual/copy-honesty.spec.ts:96</sub>

**The masthead says where the trip goes and what is next, each exactly once.**

- the cities lead the plate line, at reading scale  <sub>tests/visual/plate-line.spec.ts:28</sub>
- ⌁ the coordinate pair and the plate number are gone from the guide  <sub>tests/visual/plate-line.spec.ts:38</sub>
- ⌁ the eyebrow and the plate line never say the same thing  <sub>tests/visual/plate-line.spec.ts:47</sub>
- the next leg appears mid-trip, naming a real stop from the day cards  <sub>tests/visual/plate-line.spec.ts:60</sub>
- ⌁ the next leg is absent before the trip and after it  <sub>tests/visual/plate-line.spec.ts:73</sub>
- the live-state column stamps the trip's state, and the stamp follows the clock  <sub>tests/visual/plate-line.spec.ts:82</sub>
- ⌁ the counted progress row agrees with the checklist it counts  <sub>tests/visual/plate-line.spec.ts:102</sub>
- ⌁ a guide with nothing to count renders no progress row  <sub>tests/visual/plate-line.spec.ts:115</sub>
- ⌁ a plate line with nothing to say is shorter, never padded  <sub>tests/visual/plate-line.spec.ts:125</sub>
- ⌁ the resume line is absent from the DOM until there IS one  <sub>tests/visual/plate-line.spec.ts:139</sub>

## Using a guide on the road

**A suggested walking order is only offered on days where it genuinely saves you distance.**

- desktop  <sub>tests/visual/route-opt.spec.ts:24</sub>
- a chip appears on the one real day where reordering genuinely helps, and nowhere else  <sub>tests/visual/route-opt.spec.ts:28</sub>
- tapping the chip opens a sheet with the real suggested stop order  <sub>tests/visual/route-opt.spec.ts:37</sub>
- Apply reorders the visible stop list and Restore undoes it exactly  <sub>tests/visual/route-opt.spec.ts:49</sub>
- an applied reorder survives a reload (per-device localStorage, not guide JSON)  <sub>tests/visual/route-opt.spec.ts:70</sub>
- Escape closes the sheet without applying anything  <sub>tests/visual/route-opt.spec.ts:82</sub>

**Emergency numbers are two taps away and readable in a hurry.**

- SOS button opens the sheet, numbers render from guide data, focus lands inside  <sub>tests/visual/sos.spec.ts:10</sub>
- Escape closes the SOS sheet  <sub>tests/visual/sos.spec.ts:31</sub>
- Tab wraps focus inside the open SOS sheet instead of escaping to the page (R3)  <sub>tests/visual/sos.spec.ts:42</sub>
- clicking the backdrop closes the sheet and returns focus to the trigger  <sub>tests/visual/sos.spec.ts:66</sub>
- the SOS sheet owns its drag gesture outright  <sub>tests/visual/sos.spec.ts:90</sub>
- the groups sheet splits the gesture: shell drags, list scrolls  <sub>tests/visual/sos.spec.ts:99</sub>

**Moving between the days and sections of a guide always lands where you meant to go.**

- desktop  <sub>tests/visual/itinerary.spec.ts:34</sub>
- deep-link #grp-3 lands on Itinerary (guide-ui hash routing beats jump-to-today)  <sub>tests/visual/itinerary.spec.ts:38</sub>
- clicking a numbered tab switches the visible panel (guide-ui + scroll-memory)  <sub>tests/visual/itinerary.spec.ts:45</sub>
- rail ARIA: ArrowRight roves focus + activates the next station, panels are labelled regions  <sub>tests/visual/itinerary.spec.ts:55</sub>
- day-rail: a day chip becomes active; one chip per day  <sub>tests/visual/itinerary.spec.ts:79</sub>
- spine: a reading-rail tick drives the real guide tab  <sub>tests/visual/itinerary.spec.ts:89</sub>
- spine: read ticks fill by transform, not by animating height  <sub>tests/visual/itinerary.spec.ts:103</sub>
- print-day: every day card has a print button + full-pack button exists  <sub>tests/visual/itinerary.spec.ts:129</sub>
- mobile  <sub>tests/visual/itinerary.spec.ts:138</sub>
- swipe-tabs: a leftward touch swipe on #content advances one tab  <sub>tests/visual/itinerary.spec.ts:142</sub>
- the reading progress bar fills by transform, never by width  <sub>tests/visual/itinerary.spec.ts:171</sub>
- mobile: the bottom-bar indicator is scaled to its slot, not resized to it  <sub>tests/visual/itinerary.spec.ts:199</sub>

**The full-screen day view is readable, and you can always get out of it.**

- opening story mode locks the page and lands on day 1  <sub>tests/visual/story-mode.spec.ts:38</sub>
- Escape closes it and gives the page back  <sub>tests/visual/story-mode.spec.ts:45</sub>
- the open deck passes axe in … mode  <sub>tests/visual/story-mode.spec.ts:54</sub>
- every --dark-* ink clears 4.5:1 against the worst pixel of the real painted ground  <sub>tests/visual/story-mode.spec.ts:66</sub>

**The on-the-road tools run on live data, never a stale copy.**

- currency converter converts a typed USD amount off the live rate (render ok-branch)  <sub>tests/visual/field-tools.spec.ts:32</sub>
- masthead burn tile sums the logged split amounts  <sub>tests/visual/field-tools.spec.ts:59</sub>
- a ?stops= link decodes, keeps only <day>-<idx> keys, merges, and scrubs the URL  <sub>tests/visual/field-tools.spec.ts:83</sub>

**The progress figure at the top of a section tells the truth about where you are in it.**

- the track runs through the exact centre of the stations  <sub>tests/visual/journey-line.spec.ts:38</sub>
- no second bar slides along the track over the circles  <sub>tests/visual/journey-line.spec.ts:44</sub>
- the station you are in fills as you scroll it  <sub>tests/visual/journey-line.spec.ts:64</sub>
- a section you have moved on from stays solid, and one you have not is empty  <sub>tests/visual/journey-line.spec.ts:81</sub>
- the route walked survives a reload within the same visit  <sub>tests/visual/journey-line.spec.ts:93</sub>

## Content rules

**A guide cannot ship in a broken shape — the build refuses malformed or incomplete content.**

- accepts a freshly scaffolded guide, facet seeds included  <sub>src/content.config.test.ts:49</sub>
- accepts a panelGroups entry naming an all-carded, all-titled group  <sub>src/content.config.test.ts:59</sub>
- rejects a panelGroups entry that names no real group (the typo failure mode)  <sub>src/content.config.test.ts:69</sub>
- accepts a panel group containing own-cards types (the SECTION is the Panel, not each item)  <sub>src/content.config.test.ts:75</sub>
- rejects a panel group containing an untitled section (the title is the Panel's id)  <sub>src/content.config.test.ts:91</sub>
- rejects duplicate titles within a panel group (the title is the storage id)  <sub>src/content.config.test.ts:98</sub>
- accepts weather and holidays in a panel group (hostable-but-not-carded: the Panel hides with their empty wrapper)  <sub>src/content.config.test.ts:108</sub>
- passes at exactly the default budget (10 groups)  <sub>src/content.config.test.ts:121</sub>
- fails past the default budget (11 groups) with an issue on tabBudget  <sub>src/content.config.test.ts:127</sub>
- respects a raised per-guide tabBudget  <sub>src/content.config.test.ts:134</sub>
- still fails a guide that exceeds its own raised tabBudget  <sub>src/content.config.test.ts:140</sub>
- passes a mid-value colour legible on both grounds  <sub>src/content.config.test.ts:149</sub>
- rejects a colour illegible against the light background  <sub>src/content.config.test.ts:156</sub>
- rejects a colour illegible against the dark background even though it passes light  <sub>src/content.config.test.ts:165</sub>
- rejects a theme colour not shaped like #RRGGBB  <sub>src/content.config.test.ts:174</sub>
- rejects a ≈ figure with no verified_on under strict provenance  <sub>src/content.config.test.ts:183</sub>
- accepts the same ≈ figure once verified_on is present  <sub>src/content.config.test.ts:194</sub>
- does not gate ≈ figures when provenance isn't declared strict  <sub>src/content.config.test.ts:212</sub>
- does not require verified_on for an honestly-flagged ⚠ gap under strict provenance  <sub>src/content.config.test.ts:219</sub>
- rejects a learnings day whose date matches no itinerary day  <sub>src/content.config.test.ts:233</sub>
- accepts a learnings day whose date matches a real itinerary day  <sub>src/content.config.test.ts:244</sub>
- rejects a skipped stop whose declared group names no real section group  <sub>src/content.config.test.ts:254</sub>
- accepts a skipped stop whose declared group is real  <sub>src/content.config.test.ts:268</sub>
- rejects a roomId shorter than the RTDB write-gate minimum  <sub>src/content.config.test.ts:283</sub>
- accepts a 16-char lowercase-alphanumeric roomId  <sub>src/content.config.test.ts:288</sub>
- requires source_url + verified_on on an entry-requirements row  <sub>src/content.config.test.ts:293</sub>
- accepts a fully-provenanced entry-requirements row  <sub>src/content.config.test.ts:300</sub>
- rejects an advisory level outside 1–4  <sub>src/content.config.test.ts:316</sub>
- accepts a guide with no region set (every pre-existing guide)  <sub>src/content.config.test.ts:332</sub>
- accepts a single-state region alongside a real country  <sub>src/content.config.test.ts:337</sub>
- accepts a multi-state region string  <sub>src/content.config.test.ts:342</sub>
- still requires country even when region is set  <sub>src/content.config.test.ts:347</sub>
- passes clean allowlisted HTML  <sub>src/content.config.test.ts:356</sub>
- rejects a <script> tag in body  <sub>src/content.config.test.ts:363</sub>
- rejects an onerror= handler on an <img>  <sub>src/content.config.test.ts:371</sub>
- rejects a javascript: href  <sub>src/content.config.test.ts:378</sub>
- allows the data-addr-kr span (field-tools tap-to-copy)  <sub>src/content.config.test.ts:385</sub>
- rejects a span carrying any other attribute  <sub>src/content.config.test.ts:392</sub>
- checks list items too  <sub>src/content.config.test.ts:399</sub>
- accepts a guide with archived: true  <sub>src/content.config.test.ts:409</sub>
- accepts a guide with archived omitted (default unset, not required)  <sub>src/content.config.test.ts:414</sub>
- rejects a non-boolean archived value  <sub>src/content.config.test.ts:419</sub>
- accepts the classic Commons cover unchanged (no existing guide regresses)  <sub>src/content.config.test.ts:426</sub>
- accepts a direct royalty-free src WITH credit + license  <sub>src/content.config.test.ts:431</sub>
- rejects a direct src without credit/license — the honesty apparatus travels with the widened horizon  <sub>src/content.config.test.ts:439</sub>
- rejects an http (non-https) src  <sub>src/content.config.test.ts:445</sub>
- rejects file + src together (two still sources, one slot)  <sub>src/content.config.test.ts:452</sub>
- rejects an empty cover object (needs file, src, or video)  <sub>src/content.config.test.ts:460</sub>
- accepts video with required credit + license (poster optional — the photo cover is the poster)  <sub>src/content.config.test.ts:465</sub>
- rejects video missing credit or license  <sub>src/content.config.test.ts:473</sub>
- accepts a video-only cover (poster falls back to the first sight photo downstream)  <sub>src/content.config.test.ts:480</sub>
- accepts the classic Commons file unchanged (no existing guide regresses)  <sub>src/content.config.test.ts:494</sub>
- accepts a direct royalty-free src WITH credit + license  <sub>src/content.config.test.ts:499</sub>
- rejects a direct src without credit/license — attribution travels in the data or not at all  <sub>src/content.config.test.ts:507</sub>
- rejects an http (non-https) src  <sub>src/content.config.test.ts:513</sub>
- rejects file + src together (two sources, one slot)  <sub>src/content.config.test.ts:520</sub>
- rejects an img object with neither file nor src  <sub>src/content.config.test.ts:528</sub>
- rejects a non-https creditUrl  <sub>src/content.config.test.ts:533</sub>
- accepts descriptors whose keys are real section groups  <sub>src/content.config.test.ts:542</sub>
- rejects a descriptor key no section uses (a group rename must error, not silently orphan the line)  <sub>src/content.config.test.ts:547</sub>
- accepts a sourced rain alternate  <sub>src/content.config.test.ts:564</sub>
- rejects an alternate with no source — a refuge claim is perishable like any other  <sub>src/content.config.test.ts:575</sub>
- rejects a trigger outside rain/closure  <sub>src/content.config.test.ts:582</sub>
- plan_b body rides the prose tag allowlist (a <script> there fails like anywhere else)  <sub>src/content.config.test.ts:589</sub>
- accepts a fact with none of risk/entity/evidence — every pre-existing row's shape  <sub>src/content.config.test.ts:613</sub>
- accepts risk 0 through 4  <sub>src/content.config.test.ts:619</sub>
- rejects risk outside 0-4, and rejects a non-integer risk  <sub>src/content.config.test.ts:627</sub>
- accepts a kebab-case entity id  <sub>src/content.config.test.ts:635</sub>
- rejects an entity id that isn't kebab-case  <sub>src/content.config.test.ts:643</sub>
- accepts evidence up to 240 chars, rejects past it  <sub>src/content.config.test.ts:651</sub>
- accepts all three together on one row (the eventual R3/R4 shape)  <sub>src/content.config.test.ts:659</sub>

## Design system and shared rules

**A card's summary line is the guide's own first sentence, never a generated one.**

- keeps short bodies whole  <sub>src/lib/lead-split.test.ts:7</sub>
- splits at the first paragraph when the remainder is substantial  <sub>src/lib/lead-split.test.ts:12</sub>
- never drops content — lead + more re-compose the body  <sub>src/lib/lead-split.test.ts:20</sub>
- handles empty/undefined  <sub>src/lib/lead-split.test.ts:26</sub>
- refuses to fold a remainder carrying a ⚠ flag — shows everything instead  <sub>src/lib/lead-split.test.ts:33</sub>
- refuses to fold a remainder carrying a <ul> (steps) — shows everything instead  <sub>src/lib/lead-split.test.ts:40</sub>
- refuses to fold a remainder carrying an <ol> (numbered procedure)  <sub>src/lib/lead-split.test.ts:47</sub>
- fold:false vetoes a split that would otherwise happen  <sub>src/lib/lead-split.test.ts:57</sub>
- leaves folding untouched when fold is undefined or true (veto only, never a force)  <sub>src/lib/lead-split.test.ts:69</sub>
- uses a custom label verbatim, no count suffix  <sub>src/lib/lead-split.test.ts:79</sub>
- falls back to an honest computed count when unlabeled  <sub>src/lib/lead-split.test.ts:82</sub>
- drops the count when it can't be computed (0)  <sub>src/lib/lead-split.test.ts:86</sub>

**A day's whole-route link only exists when the guide really knows the route.**

- chains every stop between the first and the last  <sub>src/lib/transit-links.route.test.ts:9</sub>
- omits the waypoints parameter entirely for a two-stop day  <sub>src/lib/transit-links.route.test.ts:17</sub>
- skips a stop with no coordinates rather than guessing one from its name  <sub>src/lib/transit-links.route.test.ts:24</sub>
- returns null when fewer than two stops are locatable — a point is not a route  <sub>src/lib/transit-links.route.test.ts:31</sub>
- rejects NaN and Infinity, which are numbers but not places  <sub>src/lib/transit-links.route.test.ts:41</sub>

**A fact past its shelf life is flagged as needing a re-check.**

- fresh fact well inside its shelf life  <sub>src/lib/staleness.test.ts:10</sub>
- verified today is age 0 and fresh  <sub>src/lib/staleness.test.ts:17</sub>
- exactly at the shelf-life boundary is NOT yet stale (> not >=)  <sub>src/lib/staleness.test.ts:23</sub>
- one day past the boundary is stale  <sub>src/lib/staleness.test.ts:30</sub>
- accepts a named category  <sub>src/lib/staleness.test.ts:36</sub>
- the SAME date is judged differently per category — the whole point of having them  <sub>src/lib/staleness.test.ts:45</sub>
- SHELF_LIFE_DAYS has no inherited-key collisions (the UI's hasOwnProperty guard)  <sub>src/lib/staleness.test.ts:59</sub>
- null/undefined/malformed dates return null (caller decides rendering)  <sub>src/lib/staleness.test.ts:69</sub>
- a future verified_on yields negative age and is not stale  <sub>src/lib/staleness.test.ts:76</sub>
- past its life: age, the overrun, and the category that judged it  <sub>src/lib/staleness.test.ts:87</sub>
- inside the final third: the ageing heads-up, and no warn glyph to hide  <sub>src/lib/staleness.test.ts:94</sub>
- silence is the healthy state — no reading at all with room to spare  <sub>src/lib/staleness.test.ts:101</sub>
- the glyph is separable, so a chip can hide it from AT without re-parsing the line  <sub>src/lib/staleness.test.ts:105</sub>

**A guide never claims you are on a day of a trip you are not on.**

- marks today `now`, the day after `next`, and the rest around it  <sub>src/lib/day-state.test.ts:12</sub>
- ⌁ has NO `now` day before the trip starts — day 1 is first, not current  <sub>src/lib/day-state.test.ts:16</sub>
- ⌁ has no `now` day after the trip has finished  <sub>src/lib/day-state.test.ts:26</sub>
- marks exactly one day `now` and at most one `next`  <sub>src/lib/day-state.test.ts:32</sub>
- gives the last day no `next` — there is no day after the trip  <sub>src/lib/day-state.test.ts:40</sub>
- returns null for a date it cannot resolve rather than guessing a state  <sub>src/lib/day-state.test.ts:45</sub>
- compares calendar dates, not timestamps — 23:50 and 00:10 are different days  <sub>src/lib/day-state.test.ts:51</sub>

**A guide's colours come from its own cover image.**

- returns the committed extracted palette for korea/denmark  <sub>src/lib/palettes.test.ts:11</sub>
- returns null for a guide with no extracted palette  <sub>src/lib/palettes.test.ts:16</sub>
- explicit theme wins over everything  <sub>src/lib/palettes.test.ts:22</sub>
- extracted palette wins over the country accent  <sub>src/lib/palettes.test.ts:25</sub>
- falls back to the country accent when nothing else exists  <sub>src/lib/palettes.test.ts:30</sub>
- gives all three stops from the extracted palette when one exists  <sub>src/lib/palettes.test.ts:36</sub>
- collapses every stop to the single resolved accent when no palette exists  <sub>src/lib/palettes.test.ts:41</sub>
- an explicit theme overrides the WHOLE set, not just primary (a guide's own choice wins outright)  <sub>src/lib/palettes.test.ts:46</sub>

**A guide's headline counts match what is actually in it.**

- counts guides, source_url occurrences (at any depth), and distinct hostnames  <sub>src/lib/guide-stats.test.ts:8</sub>
- ignores a source_url with an empty/falsy value  <sub>src/lib/guide-stats.test.ts:23</sub>
- does not throw on a malformed source_url — skips it from the source count but still counts the fact  <sub>src/lib/guide-stats.test.ts:28</sub>
- returns zeros for an empty guide list, without throwing  <sub>src/lib/guide-stats.test.ts:35</sub>
- normalizes www. so it doesn't double-count the same real-world source  <sub>src/lib/guide-stats.test.ts:39</sub>
- matches the real repo content's order of magnitude (sanity check against actual guides)  <sub>src/lib/guide-stats.test.ts:44</sub>
- finds the most recent verified_on at any depth  <sub>src/lib/guide-stats.test.ts:74</sub>
- returns null when nothing carries a date — the honest blank, not a fabricated today  <sub>src/lib/guide-stats.test.ts:84</sub>
- ignores non-ISO values rather than ranking them as dates  <sub>src/lib/guide-stats.test.ts:88</sub>
- compares across guides, not just within one  <sub>src/lib/guide-stats.test.ts:92</sub>

**A pin is only placed where there are verified coordinates.**

- slugifies display names stably  <sub>src/lib/map-pins.test.ts:15</sub>
- first map gets center + own points + all guide sights  <sub>src/lib/map-pins.test.ts:33</sub>
- later maps get only their own center/points — no sights  <sub>src/lib/map-pins.test.ts:40</sub>
- guide with sights but map listed after them still binds sights to first map  <sub>src/lib/map-pins.test.ts:46</sub>
- map without valid center is excluded entirely  <sub>src/lib/map-pins.test.ts:51</sub>
- scaffold guide (no sights, no points) → single center pin  <sub>src/lib/map-pins.test.ts:56</sub>
- maps each itinerary day to a PlannerDay with its stops  <sub>src/lib/map-pins.test.ts:77</sub>
- defaults a day's energy to "balanced" when absent  <sub>src/lib/map-pins.test.ts:85</sub>
- only emits pins for stops with valid coordinates  <sub>src/lib/map-pins.test.ts:90</sub>
- ids each pin with its day index + slug + stop index (stable, collision-safe)  <sub>src/lib/map-pins.test.ts:96</sub>
- reports hasCoords: false when no waypoint anywhere has valid coordinates  <sub>src/lib/map-pins.test.ts:101</sub>
- returns empty days/pins for a guide with no days section  <sub>src/lib/map-pins.test.ts:108</sub>
- treats a days section with an empty items array as having no days  <sub>src/lib/map-pins.test.ts:112</sub>
- pins venues alongside sights on the primary map  <sub>src/lib/map-pins.test.ts:133</sub>
- tags each pin with its section group, so the map can filter by it  <sub>src/lib/map-pins.test.ts:139</sub>
- carries place_id through when the content has one, null when it doesn't  <sub>src/lib/map-pins.test.ts:145</sub>
- still skips anything without coordinates rather than guessing a location  <sub>src/lib/map-pins.test.ts:151</sub>
- lists each category once, in first-seen order, ignoring the centre  <sub>src/lib/map-pins.test.ts:165</sub>
- returns nothing when there is nothing to filter  <sub>src/lib/map-pins.test.ts:169</sub>

**A place shown as open on a given day really is open that day.**

- maps Date#getDay() to the schema's 3-letter codes  <sub>src/lib/closed-days.test.ts:7</sub>
- formats one day  <sub>src/lib/closed-days.test.ts:15</sub>
- formats several days in order  <sub>src/lib/closed-days.test.ts:19</sub>
- returns null for absent/empty — honest blank, no row at all  <sub>src/lib/closed-days.test.ts:23</sub>
- true when the weekday is in the list  <sub>src/lib/closed-days.test.ts:31</sub>
- false when it isn't, or the list is absent  <sub>src/lib/closed-days.test.ts:34</sub>
- flags a waypoint scheduled on its matched venue's closed day  <sub>src/lib/closed-days.test.ts:46</sub>
- matches case/whitespace-insensitively  <sub>src/lib/closed-days.test.ts:55</sub>
- stays silent when the day doesn't fall on a closed day  <sub>src/lib/closed-days.test.ts:63</sub>
- stays silent when the waypoint matches nothing, or matches an item with no closed_days  <sub>src/lib/closed-days.test.ts:71</sub>

**A sheet dismisses on a real drag and springs back on a stray touch.**

- dismisses on a long enough drag  <sub>src/scripts/sheet-drag.test.ts:10</sub>
- dismisses on a short but fast downward flick  <sub>src/scripts/sheet-drag.test.ts:15</sub>
- ignores a tap or a jitter however fast it registers  <sub>src/scripts/sheet-drag.test.ts:20</sub>
- never dismisses on an upward drag  <sub>src/scripts/sheet-drag.test.ts:25</sub>
- falls back to velocity when the sheet has no measurable height  <sub>src/scripts/sheet-drag.test.ts:29</sub>
- scales with the sheet — a short sheet dismisses sooner  <sub>src/scripts/sheet-drag.test.ts:34</sub>

**A transit link opens the right route in a real transit app.**

- builds Google Maps + Apple Maps directions links from lat/lng  <sub>src/lib/transit-links.test.ts:7</sub>
- appends destination_place_id to the Google link when a place_id is given  <sub>src/lib/transit-links.test.ts:16</sub>
- omits destination_place_id when no place_id is given  <sub>src/lib/transit-links.test.ts:21</sub>
- returns Naver Map for South Korea with the confirmed nmap:// scheme  <sub>src/lib/transit-links.test.ts:28</sub>
- returns an empty array for a country with no confirmed native scheme  <sub>src/lib/transit-links.test.ts:37</sub>
- never guesses Kakao Map — no entry exists for South Korea beyond Naver  <sub>src/lib/transit-links.test.ts:42</sub>
- orders universal links first, native apps last  <sub>src/lib/transit-links.test.ts:49</sub>
- is just the universal pair for a country with no native app  <sub>src/lib/transit-links.test.ts:54</sub>

**Airport codes and names resolve to the real airport, never a guess.**

- every entry has real lat/lng/label  <sub>src/data/airports.test.ts:7</sub>
- carries the two D14-required codes  <sub>src/data/airports.test.ts:19</sub>
- resolves a known code  <sub>src/data/airports.test.ts:26</sub>
- is case-insensitive and trims whitespace (authored text, not a validated enum)  <sub>src/data/airports.test.ts:30</sub>
- returns null for an unknown code or absent input — honest absence, never a guessed point  <sub>src/data/airports.test.ts:35</sub>

**Contrast is measured to the published standard, not estimated.**

- leaves a colour alone when it already passes  <sub>src/lib/contrast.test.ts:16</sub>
- rescues the exact colours that shipped unreadable to the live site  <sub>src/lib/contrast.test.ts:23</sub>
- holds for every accent in the shipped palette, on every surface  <sub>src/lib/contrast.test.ts:36</sub>
- darkens only as far as it must, even from the worst starting point  <sub>src/lib/contrast.test.ts:45</sub>
- preserves hue order — the result is a darker shade, not a different colour  <sub>src/lib/contrast.test.ts:55</sub>
- LIGHTENS on dark surfaces instead of darkening  <sub>src/lib/contrast.test.ts:63</sub>
- honours a custom target, so large-text surfaces can ask for 3.0  <sub>src/lib/contrast.test.ts:82</sub>
- is 0 for black and 1 for white  <sub>src/lib/contrast.test.ts:91</sub>
- is 21 for black vs white (WCAG max)  <sub>src/lib/contrast.test.ts:98</sub>
- is 1 for identical colours  <sub>src/lib/contrast.test.ts:102</sub>
- is order-independent  <sub>src/lib/contrast.test.ts:106</sub>
- passes the tightest shipping accent and fails a pale disaster on the light bg  <sub>src/lib/contrast.test.ts:115</sub>

**Country facts — emergency numbers, currency, time zone — are looked up, never invented.**

- assigns a continent to EVERY country — a new country can't ship without one  <sub>src/data/countries.test.ts:7</sub>
- has no continent entry for a country that doesn't exist (no stale keys)  <sub>src/data/countries.test.ts:12</sub>
- only uses continents the filter UI knows how to order  <sub>src/data/countries.test.ts:17</sub>
- resolves aliases the same way countryData does  <sub>src/data/countries.test.ts:24</sub>
- splits the Americas rather than lumping them (the reason this isn't derived from tz)  <sub>src/data/countries.test.ts:32</sub>
- puts Iceland in Europe despite its Atlantic/ time zone  <sub>src/data/countries.test.ts:37</sub>
- returns null for unknown/empty input instead of guessing  <sub>src/data/countries.test.ts:42</sub>
- returns a verified entry for a researched country  <sub>src/data/countries.test.ts:50</sub>
- US and Mexico now have verified 911 entries, not the generic EU fallback  <sub>src/data/countries.test.ts:55</sub>
- Portugal has no verified entry of its own but gets the honest EU-112 fallback, flagged  <sub>src/data/countries.test.ts:65</sub>
- returns null for a country with neither a verified entry nor EU-112 coverage  <sub>src/data/countries.test.ts:71</sub>
- resolves every country a real guide currently uses  <sub>src/data/countries.test.ts:78</sub>
- resolves an alias the same way continentFor does  <sub>src/data/countries.test.ts:85</sub>
- returns null for a country with no recorded numeric id — honest absence, never guessed  <sub>src/data/countries.test.ts:90</sub>

**Data embedded in a page cannot break out of it or be tampered with.**

- round-trips a clean payload  <sub>src/lib/json-embed.test.ts:7</sub>
- neutralizes a </script> breakout payload  <sub>src/lib/json-embed.test.ts:12</sub>

**Every guide's colour scheme keeps its text readable against its own background.**

- gives the SAME tokens to both surfaces for the same accent  <sub>src/lib/accent-tokens.test.ts:20</sub>
- guarantees AA for text on every light surface the site actually paints  <sub>src/lib/accent-tokens.test.ts:31</sub>
- guarantees AA for text on every dark surface too  <sub>src/lib/accent-tokens.test.ts:40</sub>
- guarantees AA for text sitting ON an accent fill, identically in both themes  <sub>src/lib/accent-tokens.test.ts:51</sub>
- keeps TINT_MAX honest against what the stylesheets actually do  <sub>src/lib/accent-tokens.test.ts:63</sub>
- matches the defaults baked into base.css for the no-guide accent  <sub>src/lib/accent-tokens.test.ts:104</sub>
- keeps the identity colour untouched — only the text shade is adjusted  <sub>src/lib/accent-tokens.test.ts:117</sub>
- falls back to the accent when no raw colour is supplied  <sub>src/lib/accent-tokens.test.ts:125</sub>
- emits both ink CANDIDATES and never the resolved token  <sub>src/lib/accent-tokens.test.ts:132</sub>
- carries surface-specific extras without disturbing the shared contract  <sub>src/lib/accent-tokens.test.ts:146</sub>

**Every price and figure in a guide traces to one sourced, dated entry.**

- treats _guide.json and facts.json as reserved, not sections  <sub>src/lib/facts.test.ts:33</sub>
- accepts real section files  <sub>src/lib/facts.test.ts:39</sub>
- ignores non-json entries  <sub>src/lib/facts.test.ts:44</sub>
- renders a clean fact as-is  <sub>src/lib/facts.test.ts:51</sub>
- defaults to clean when state is absent  <sub>src/lib/facts.test.ts:54</sub>
- renders the value plain, then the ≈ approx. pill as a real allowlisted <a>  <sub>src/lib/facts.test.ts:69</sub>
- links straight at the source — works with zero JS  <sub>src/lib/facts.test.ts:73</sub>
- carries every popover field as data-*, for provenance-dot.js to build the same popover  <sub>src/lib/facts.test.ts:78</sub>
- omits data-tier when the fact carries none  <sub>src/lib/facts.test.ts:85</sub>
- HTML-escapes a claim carrying quotes or angle brackets  <sub>src/lib/facts.test.ts:88</sub>
- strips to honest plain text for the .ics/.gpx exports (tags dropped, inner text kept)  <sub>src/lib/facts.test.ts:92</sub>
- names itself 'approx.' so the ≈ isn't announced twice  <sub>src/lib/facts.test.ts:99</sub>
- keeps the range whole and puts the pill after it, not between the halves  <sub>src/lib/facts.test.ts:118</sub>
- reads as one honest range in the .ics/.gpx plain-text exports too  <sub>src/lib/facts.test.ts:124</sub>
- leaves a spaced dash alone — that is prose punctuation, not a range  <sub>src/lib/facts.test.ts:129</sub>
- leaves a clean fact's following text exactly where the author put it  <sub>src/lib/facts.test.ts:134</sub>
- matches kebab ids only  <sub>src/lib/facts.test.ts:141</sub>
- collects every referenced id across a nested structure, deduped  <sub>src/lib/facts.test.ts:146</sub>
- rejects markup in a fact value — it would bypass the prose tag allowlist  <sub>src/lib/facts.test.ts:157</sub>
- substitutes into deeply nested strings and leaves everything else alone  <sub>src/lib/facts.test.ts:165</sub>
- applies the ≈ marker (value + the ≈ approx. pill) from the record's state  <sub>src/lib/facts.test.ts:181</sub>
- reports an unknown id instead of failing silently  <sub>src/lib/facts.test.ts:186</sub>
- does not mutate the input tree  <sub>src/lib/facts.test.ts:193</sub>
- handles a guide with no registry at all — the dormant case  <sub>src/lib/facts.test.ts:199</sub>
- substitutes every occurrence of a repeated fact — the one-edit-updates-everywhere property  <sub>src/lib/facts.test.ts:207</sub>
- flags a registered fact nothing references  <sub>src/lib/facts.test.ts:216</sub>
- is empty when everything is referenced  <sub>src/lib/facts.test.ts:219</sub>

**Every text size comes from the type scale, so nothing is arbitrarily sized.**

- the scale actually parsed out of base.css  <sub>src/styles/type-scale.test.ts:121</sub>
- no bare font-size literal outside the declared scale or the justified exceptions  <sub>src/styles/type-scale.test.ts:129</sub>
- text-entry controls are >=16px, so iOS does not zoom the page on focus  <sub>src/styles/type-scale.test.ts:180</sub>
- every --text-* token referenced anywhere in src is actually declared in base.css  <sub>src/styles/type-scale.test.ts:218</sub>

**Grouped figures put each item in the right band.**

- groups sections under their declared `group`  <sub>src/lib/buckets.test.ts:13</sub>
- defaults ungrouped sections to 'More'  <sub>src/lib/buckets.test.ts:21</sub>
- preserves first-appearance order of groups, not alphabetical/sorted order  <sub>src/lib/buckets.test.ts:28</sub>
- retains the original array index alongside each section  <sub>src/lib/buckets.test.ts:34</sub>
- returns empty structures for an empty sections array  <sub>src/lib/buckets.test.ts:42</sub>

**Guide prose can only use the small set of safe tags, and bad markup fails the build.**

- passes clean allowlisted HTML  <sub>src/lib/prose-html.test.ts:11</sub>
- rejects a tag outside the allowlist  <sub>src/lib/prose-html.test.ts:17</sub>
- rejects an event-handler attribute on an allowed tag  <sub>src/lib/prose-html.test.ts:21</sub>
- rejects a javascript: href  <sub>src/lib/prose-html.test.ts:25</sub>
- permits the single-attribute data-addr-kr span shape and nothing else on span  <sub>src/lib/prose-html.test.ts:29</sub>
- allowlist stays the documented CLAUDE.md set  <sub>src/lib/prose-html.test.ts:35</sub>
- fixture "…" body is allowlist-clean  <sub>src/lib/prose-html.test.ts:47</sub>

**Jet-lag advice is based on the real time difference, including daylight saving.**

- Seoul from LA — a real eastward trip (dest +9, origin -7, 16h gap)  <sub>src/lib/jetlag.test.ts:7</sub>
- LA from Seoul — the return leg is westward and adapts faster  <sub>src/lib/jetlag.test.ts:18</sub>
- westward is never charged more days than eastward for the SAME gap  <sub>src/lib/jetlag.test.ts:29</sub>
- stays inside the +0.4h dead zone — a half-hour zone crossing is not jet lag  <sub>src/lib/jetlag.test.ts:37</sub>
- a direction past the dead zone can STILL be negligible if under 1 hour total  <sub>src/lib/jetlag.test.ts:42</sub>
- a 1+ hour gap that also exceeds the direction threshold is NOT negligible  <sub>src/lib/jetlag.test.ts:48</sub>
- negative diff at exactly -0.4 stays in the dead zone  <sub>src/lib/jetlag.test.ts:53</sub>
- under 1 hour is negligible even with a clear direction  <sub>src/lib/jetlag.test.ts:57</sub>
- melatonin tip appears at exactly 7h and not at 6.9h  <sub>src/lib/jetlag.test.ts:62</sub>
- rounds the hour gap to 1 decimal place  <sub>src/lib/jetlag.test.ts:69</sub>
- computes the body-clock-at-11pm anchor correctly for a large eastward gap  <sub>src/lib/jetlag.test.ts:74</sub>
- wraps the body-clock anchor past midnight for a westward gap  <sub>src/lib/jetlag.test.ts:80</sub>
- body-clock anchor never leaves the [0,24) range regardless of gap sign  <sub>src/lib/jetlag.test.ts:86</sub>
- handles a fractional-offset origin (Mumbai UTC+5:30) without drifting  <sub>src/lib/jetlag.test.ts:98</sub>
- zero gap (same zone) is negligible  <sub>src/lib/jetlag.test.ts:107</sub>

**Light and dark themes both resolve to a complete, readable set of colours.**

- returns the currency entry for a known country  <sub>src/lib/themes.test.ts:7</sub>
- returns null for an unknown country  <sub>src/lib/themes.test.ts:15</sub>
- returns the theme color for a known country  <sub>src/lib/themes.test.ts:21</sub>
- falls back to the default accent for an unknown country  <sub>src/lib/themes.test.ts:25</sub>
- returns the IANA time zone for a known country  <sub>src/lib/themes.test.ts:31</sub>
- returns null for an unknown country  <sub>src/lib/themes.test.ts:35</sub>
- returns the same color when the factor is 0  <sub>src/lib/themes.test.ts:41</sub>
- darkens each channel independently and proportionally  <sub>src/lib/themes.test.ts:45</sub>
- goes fully black at factor 1  <sub>src/lib/themes.test.ts:50</sub>
- every country with a holiday COUNTRY_CODE also has a currency and an IANA time zone (single-source countries.mjs)  <sub>src/lib/themes.test.ts:56</sub>
- every country with a holiday COUNTRY_CODE also has a theme accent (no undefined colour in the UI)  <sub>src/lib/themes.test.ts:63</sub>

**No stylesheet reads a design value that does not exist.**

- found the stylesheets and their declarations at all  <sub>src/styles/var-defined.test.ts:69</sub>
- reads no custom property that nothing declares  <sub>src/styles/var-defined.test.ts:75</sub>

**One number decides the phone/tablet cut, so no two surfaces can disagree about it.**

- found the stylesheets and their markers at all  <sub>src/styles/breakpoints.test.ts:63</sub>
- ⌁ no marked query has drifted from the constant it names  <sub>src/styles/breakpoints.test.ts:68</sub>
- ⌁ the marked sites are exactly the documented ones  <sub>src/styles/breakpoints.test.ts:86</sub>
- ⌁ every @container guide query carries a marker  <sub>src/styles/breakpoints.test.ts:97</sub>
- ⌁ no script re-hardcodes a shared breakpoint in a matchMedia query  <sub>src/styles/breakpoints.test.ts:115</sub>

**Photos are requested at the size they are shown, not full size.**

- asks Commons for a server-rendered thumbnail  <sub>src/lib/img-width.test.ts:9</sub>
- substitutes a direct CDN URL's own {w} token, everywhere it appears  <sub>src/lib/img-width.test.ts:13</sub>
- leaves a single-size URL alone rather than inventing a parameter for it  <sub>src/lib/img-width.test.ts:17</sub>
- does not append a second width when the caller already set one  <sub>src/lib/img-width.test.ts:22</sub>
- joins with & when the URL already carries a query  <sub>src/lib/img-width.test.ts:26</sub>
- rounds a fractional width — the endpoint takes integers  <sub>src/lib/img-width.test.ts:30</sub>
- passes null/undefined straight through  <sub>src/lib/img-width.test.ts:34</sub>
- offers 1x and 2x for a resizable URL  <sub>src/lib/img-width.test.ts:42</sub>
- returns null when the URL already pins a width — both entries would be the same file  <sub>src/lib/img-width.test.ts:46</sub>
- returns null for a single-size URL — a srcset of one size is a lie about choice  <sub>src/lib/img-width.test.ts:50</sub>
- credits Commons when the URL is a Commons FilePath URL  <sub>src/lib/img-width.test.ts:57</sub>
- ⌁ never turns a CDN hostname into an attribution  <sub>src/lib/img-width.test.ts:62</sub>

**Public holidays around a trip come from real published data for that country and year.**

- parses a plain weekday + month + day string  <sub>src/lib/holidays.test.ts:7</sub>
- is tolerant of commas  <sub>src/lib/holidays.test.ts:12</sub>
- ignores a trailing/leading year token and uses the passed-in year  <sub>src/lib/holidays.test.ts:17</sub>
- returns null for null/undefined/empty input  <sub>src/lib/holidays.test.ts:22</sub>
- returns null when no month token is present  <sub>src/lib/holidays.test.ts:28</sub>
- returns null when no day token is present  <sub>src/lib/holidays.test.ts:32</sub>
- returns null for pure garbage  <sub>src/lib/holidays.test.ts:36</sub>
- uses the build year when the trip date is later in the same year  <sub>src/lib/holidays.test.ts:42</sub>
- rolls forward to next year when the trip date is >31 days in the past  <sub>src/lib/holidays.test.ts:47</sub>
- does NOT roll forward for a date within the last 31 days  <sub>src/lib/holidays.test.ts:53</sub>
- falls back to the current year when the date string is unparseable  <sub>src/lib/holidays.test.ts:58</sub>
- returns null when the holiday list isn't an array  <sub>src/lib/holidays.test.ts:75</sub>
- returns null when the trip dates can't be resolved  <sub>src/lib/holidays.test.ts:80</sub>
- returns a non-null result with empty arrays when there's data but nothing nearby  <sub>src/lib/holidays.test.ts:84</sub>
- partitions holidays into during/near-before/near-after on the 3-day shoulder boundary  <sub>src/lib/holidays.test.ts:92</sub>
- computes relative-day labels for near-before/near-after entries  <sub>src/lib/holidays.test.ts:101</sub>
- marks national vs regional holidays from the `global` flag  <sub>src/lib/holidays.test.ts:107</sub>
- formats tripLabel within a single month  <sub>src/lib/holidays.test.ts:113</sub>
- formats tripLabel across two months  <sub>src/lib/holidays.test.ts:118</sub>
- defaults the end date to the start date when lastDayDate is omitted  <sub>src/lib/holidays.test.ts:123</sub>
- ignores malformed entries in the holiday list instead of throwing  <sub>src/lib/holidays.test.ts:129</sub>
- credits the aggregator when the rows carry no provenance of their own  <sub>src/lib/holidays.test.ts:137</sub>
- credits the publisher's own domain when a row is primary-sourced  <sub>src/lib/holidays.test.ts:142</sub>
- follows the data when only part of a file has been re-sourced  <sub>src/lib/holidays.test.ts:152</sub>

**Section figures are built from the guide's own content and never invent a label.**

- returns one stop per day with month shown on first stop and month changes only  <sub>src/lib/anchors.test.ts:14</sub>
- gives above-line words to first and last stops only, clamped from their own titles  <sub>src/lib/anchors.test.ts:19</sub>
- preserves the raw date for client today-matching  <sub>src/lib/anchors.test.ts:28</sub>
- refuses a shape for fewer than two days (one dot is not a timeline)  <sub>src/lib/anchors.test.ts:32</sub>
- sums verified legs and names the day's first and last stops  <sub>src/lib/anchors.test.ts:45</sub>
- returns km: null (never a partial sum) when any consecutive pair lacks coordinates  <sub>src/lib/anchors.test.ts:53</sub>
- returns null entirely for fewer than two waypoints  <sub>src/lib/anchors.test.ts:64</sub>
- matches a known distance (Seoul Station → Daejeon Station ≈ 140 km)  <sub>src/lib/anchors.test.ts:71</sub>
- is zero for identical points  <sub>src/lib/anchors.test.ts:76</sub>
- extracts each step's bold lead, cut at its em-dash detail  <sub>src/lib/anchors.test.ts:82</sub>
- decodes entities and strips nested tags inside the lead  <sub>src/lib/anchors.test.ts:91</sub>
- skips lead-less steps and refuses a figure below two stations  <sub>src/lib/anchors.test.ts:99</sub>
- clamps at a word boundary with an ellipsis and strips trailing punctuation  <sub>src/lib/anchors.test.ts:106</sub>
- passes short strings through untouched  <sub>src/lib/anchors.test.ts:109</sub>

**Shared helpers used across the whole site behave the same everywhere.**

- escapes the single quote that breaks out of a single-quoted attribute  <sub>src/scripts/util.test.ts:28</sub>
- escapes < and > so no tag can form  <sub>src/scripts/util.test.ts:34</sub>
- escapes all five metacharacters and nothing else  <sub>src/scripts/util.test.ts:42</sub>
- coerces null/undefined to empty string, never throws  <sub>src/scripts/util.test.ts:47</sub>
- returns the DESTINATION calendar day, not the device/UTC day  <sub>src/scripts/util.test.ts:54</sub>
- handles the year boundary across timezones  <sub>src/scripts/util.test.ts:59</sub>
- returns null for a missing or invalid timezone (caller falls back)  <sub>src/scripts/util.test.ts:65</sub>
- copies the legacy key's value to the new key when the new key is empty  <sub>src/scripts/util.test.ts:73</sub>
- never overwrites a new key that already has data  <sub>src/scripts/util.test.ts:79</sub>
- no-ops when legacyKey === newKey (the common case — slug already equals normalized title)  <sub>src/scripts/util.test.ts:85</sub>
- no-ops when there's no legacy key at all  <sub>src/scripts/util.test.ts:91</sub>
- no-ops when the legacy key has nothing to migrate  <sub>src/scripts/util.test.ts:97</sub>

**Terrain shading on the globe is drawn from real elevation data.**

- is deterministic — the same seed produces byte-identical terrain  <sub>src/lib/terrain.test.ts:7</sub>
- different seeds produce different ridgelines (every guide gets its own terrain)  <sub>src/lib/terrain.test.ts:13</sub>
- seedFromSlug is stable and distinct across the real guide slugs  <sub>src/lib/terrain.test.ts:19</sub>
- returns the requested layer count as closed bottom-anchored paths  <sub>src/lib/terrain.test.ts:25</sub>
- every ridge point stays inside the paintable band (no ridge in the sky cap or under the floor)  <sub>src/lib/terrain.test.ts:35</sub>
- ridges overshoot the viewBox on both sides so CSS drift never reveals an edge  <sub>src/lib/terrain.test.ts:50</sub>
- far layers sit higher (taller relief) than near layers — painted perspective  <sub>src/lib/terrain.test.ts:59</sub>

**Text on a coloured background gets its colour from that background, never a guess.**

- found stylesheets to scan  <sub>src/styles/on-fill.test.ts:36</sub>
- never sets a literal colour in a rule that paints a token-driven fill  <sub>src/styles/on-fill.test.ts:40</sub>

**The design system's colours stay above the readability floor in both themes.**

- actually sliced the light and dark scopes out of base.css  <sub>src/styles/atlas-tokens.test.ts:66</sub>
- never re-declares an alias in a dark block  <sub>src/styles/atlas-tokens.test.ts:94</sub>
- leaves every superseded token name working, unchanged  <sub>src/styles/atlas-tokens.test.ts:103</sub>
- sits in the 9.5-10.5px band the handoff flagged, which is SMALL text  <sub>src/styles/atlas-tokens.test.ts:113</sub>
- clears 4.5:1 on every surface, in both themes, as var(--aink)  <sub>src/styles/atlas-tokens.test.ts:124</sub>
- would FAIL if the kicker used the identity colour instead — the reason it uses --aink  <sub>src/styles/atlas-tokens.test.ts:135</sub>
- has a token in that band to be read at — --text-nano, the existing floor  <sub>src/styles/atlas-tokens.test.ts:165</sub>
- inverts between themes rather than holding one fixed value  <sub>src/styles/atlas-tokens.test.ts:189</sub>
- re-maps between themes — a fixed #fff is exactly the bug this replaced  <sub>src/styles/atlas-tokens.test.ts:209</sub>
- declares the four safe-area insets with a 0px fallback  <sub>src/styles/atlas-tokens.test.ts:216</sub>
- declares --hdr-h with a static fallback and no JS writer yet  <sub>src/styles/atlas-tokens.test.ts:226</sub>
- keeps R2's tonal spread after the lift — the card still separates from the page  <sub>src/styles/atlas-tokens.test.ts:251</sub>
- darkens the ink and lightens the paper — the direction of the whole change  <sub>src/styles/atlas-tokens.test.ts:260</sub>
- keeps the rules visible against every surface they draw on  <sub>src/styles/atlas-tokens.test.ts:269</sub>
- leaves --accent untouched — a guide's colour is a fact about the guide  <sub>src/styles/atlas-tokens.test.ts:278</sub>
- declares no glare theme in the shipped CSS  <sub>src/styles/atlas-tokens.test.ts:290</sub>
- ships exactly two theme scopes  <sub>src/styles/atlas-tokens.test.ts:294</sub>

**The map-contour background draws without distorting or overflowing.**

- is deterministic — the same seed produces byte-identical rings  <sub>src/lib/contours.test.ts:7</sub>
- different seeds produce different rings (real variety, not one hardcoded shape)  <sub>src/lib/contours.test.ts:13</sub>
- returns exactly `rings` polylines, each a well-formed SVG points string  <sub>src/lib/contours.test.ts:19</sub>
- later rings are farther from center on average than earlier ones (they nest outward)  <sub>src/lib/contours.test.ts:28</sub>
- returns an empty ring list for 0 rings, without throwing  <sub>src/lib/contours.test.ts:39</sub>
- respects a custom viewBox  <sub>src/lib/contours.test.ts:43</sub>

**The plate line says where this trip goes and what is next, or says nothing.**

- takes the cities and leaves the dates to the eyebrow  <sub>src/lib/plate-line.test.ts:10</sub>
- accepts an en dash as well as an em dash  <sub>src/lib/plate-line.test.ts:14</sub>
- ⌁ renders nothing for a kicker with no city half  <sub>src/lib/plate-line.test.ts:18</sub>
- ⌁ never guesses which half of an unpunctuated kicker is a place  <sub>src/lib/plate-line.test.ts:27</sub>
- ⌁ declines a single-city kicker rather than trusting the dash alone  <sub>src/lib/plate-line.test.ts:33</sub>
- takes what cityLine leaves  <sub>src/lib/plate-line.test.ts:44</sub>
- ⌁ keeps a kicker with no city half whole rather than halving it  <sub>src/lib/plate-line.test.ts:48</sub>
- ⌁ never renders the same words as cityLine — the halves cannot overlap  <sub>src/lib/plate-line.test.ts:54</sub>
- returns null for no kicker at all  <sub>src/lib/plate-line.test.ts:67</sub>
- names the next timed stop from today's own day  <sub>src/lib/plate-line.test.ts:87</sub>
- skips a stop with no time rather than printing a leg with no departure  <sub>src/lib/plate-line.test.ts:91</sub>
- moves to the next day once today's stops are behind it  <sub>src/lib/plate-line.test.ts:95</sub>
- counts the whole of today as ahead, not the hours left in it  <sub>src/lib/plate-line.test.ts:99</sub>
- ⌁ says nothing once the trip is over  <sub>src/lib/plate-line.test.ts:106</sub>
- ⌁ says nothing BEFORE the trip either, however real the first departure is  <sub>src/lib/plate-line.test.ts:111</sub>
- ⌁ says nothing when no stop anywhere carries a time  <sub>src/lib/plate-line.test.ts:120</sub>
- ⌁ says nothing for a guide whose days are not calendar dates  <sub>src/lib/plate-line.test.ts:125</sub>
- ⌁ says nothing for a guide with no days at all  <sub>src/lib/plate-line.test.ts:132</sub>
- reads the days in date order, not the order the file happens to list them in  <sub>src/lib/plate-line.test.ts:138</sub>

**Time-zone offsets are correct across daylight-saving changes.**

- is DST-AWARE for a zone that observes it — the entire reason this exists over a fixed table  <sub>src/lib/tz-offset.test.ts:10</sub>
- is DST-aware for a northern-hemisphere zone too (opposite season, opposite shift)  <sub>src/lib/tz-offset.test.ts:17</sub>
- returns a stable offset for a zone with no DST, in every season  <sub>src/lib/tz-offset.test.ts:22</sub>
- handles a fractional (half-hour) zone  <sub>src/lib/tz-offset.test.ts:27</sub>
- returns null for an unknown/invalid IANA zone rather than throwing  <sub>src/lib/tz-offset.test.ts:31</sub>
- returns null for null/undefined input  <sub>src/lib/tz-offset.test.ts:38</sub>

**Today, days-to-go and this-trip-is-over are correct on every day of a trip.**

- resolves a normal label to the current year  <sub>src/lib/trip-dates.test.ts:9</sub>
- keeps a RECENTLY past date in the current year — a just-finished trip is not upcoming  <sub>src/lib/trip-dates.test.ts:13</sub>
- rolls a LONG-past date forward to next year — the December-writing-for-January case  <sub>src/lib/trip-dates.test.ts:19</sub>
- pivots at the 180-day boundary, not at 'any past date'  <sub>src/lib/trip-dates.test.ts:25</sub>
- returns null for relative labels — those guides legitimately have no trip dates  <sub>src/lib/trip-dates.test.ts:34</sub>
- returns null for absent/garbage input rather than an Invalid Date  <sub>src/lib/trip-dates.test.ts:39</sub>
- reports a concluded trip as past — the guard that stops weather forecasting a finished trip  <sub>src/lib/trip-dates.test.ts:53</sub>
- reports an ongoing trip  <sub>src/lib/trip-dates.test.ts:60</sub>
- the last day is INCLUSIVE — a trip is not past on its final day  <sub>src/lib/trip-dates.test.ts:66</sub>
- counts days until an upcoming trip  <sub>src/lib/trip-dates.test.ts:72</sub>
- clamps a malformed range (end before start) instead of yielding a negative length  <sub>src/lib/trip-dates.test.ts:79</sub>
- a single-day trip is 1 day, not 0  <sub>src/lib/trip-dates.test.ts:86</sub>
- no usable dates → hasDates false and every derived flag safe  <sub>src/lib/trip-dates.test.ts:90</sub>
- a missing lastDayDate falls back to the start day, not null  <sub>src/lib/trip-dates.test.ts:96</sub>
- formats from LOCAL calendar components, zero-padded  <sub>src/lib/trip-dates.test.ts:104</sub>
- reads the Date's own local getters, so it always agrees with how the Date was built  <sub>src/lib/trip-dates.test.ts:109</sub>
- resolves into the given year with no inference at all  <sub>src/lib/trip-dates.test.ts:121</sub>
- null for a non-calendar label, same contract as the inferring resolver  <sub>src/lib/trip-dates.test.ts:127</sub>
- windows are identical whatever `now` a build runs at — only the STATUS moves  <sub>src/lib/trip-dates.test.ts:134</sub>
- a range wrapping the year boundary rolls its END forward, not clamped  <sub>src/lib/trip-dates.test.ts:143</sub>
- collapses the month when both ends share one  <sub>src/lib/trip-dates.test.ts:154</sub>
- names both months when the trip crosses one  <sub>src/lib/trip-dates.test.ts:158</sub>
- ⌁ formats from the dates, never from the kicker's own text  <sub>src/lib/trip-dates.test.ts:162</sub>
- ⌁ a half-known window is not a range  <sub>src/lib/trip-dates.test.ts:169</sub>

**Trips are numbered and ordered consistently everywhere they appear.**

- orders guides chronologically by trip start, 1-based  <sub>src/lib/sheet-order.test.ts:9</sub>
- is stable regardless of input order  <sub>src/lib/sheet-order.test.ts:22</sub>
- sorts undated guides last, in their given order, still numbered  <sub>src/lib/sheet-order.test.ts:34</sub>
- extracts the year every real guide's kicker carries  <sub>src/lib/sheet-order.test.ts:48</sub>
- null when no year is stated — falls back to now-relative inference  <sub>src/lib/sheet-order.test.ts:52</sub>
- produces D6's settled order today  <sub>src/lib/sheet-order.test.ts:72</sub>
- produces the SAME order on a build after the 180-day rollover would have fired  <sub>src/lib/sheet-order.test.ts:76</sub>
- finds the requested guide's number  <sub>src/lib/sheet-order.test.ts:86</sub>
- null for an unknown slug  <sub>src/lib/sheet-order.test.ts:98</sub>

## Feature logic

**A budget upgraded to a newer format still says what everyone owed before.**

- round-trips a complete record unchanged — the sync-echo path  <sub>src/features/trip-split/model/records.test.ts:21</sub>
- PRESERVES participants — the exact field the sync mapper dropped  <sub>src/features/trip-split/model/records.test.ts:25</sub>
- participants null means EVERYONE, and must not become an empty array  <sub>src/features/trip-split/model/records.test.ts:29</sub>
- keeps amountMinor 0 as 0, not null — 0 is a real amount  <sub>src/features/trip-split/model/records.test.ts:37</sub>
- maps a missing amount to null, not undefined or 0  <sub>src/features/trip-split/model/records.test.ts:41</sub>
- defaults text fields to '' so the UI never renders 'undefined'  <sub>src/features/trip-split/model/records.test.ts:47</sub>
- defaults the method to EQUAL and rejects a method it does not know  <sub>src/features/trip-split/model/records.test.ts:54</sub>
- preserves weights including a meaningful zero  <sub>src/features/trip-split/model/records.test.ts:60</sub>
- falls back to the base currency rather than trusting an unknown code  <sub>src/features/trip-split/model/records.test.ts:66</sub>
- keeps order when present and undefined when not — both are legitimate  <sub>src/features/trip-split/model/records.test.ts:72</sub>
- produces the SAME shape from a local record and a sync record  <sub>src/features/trip-split/model/records.test.ts:77</sub>
- converts a float dollar amount into integer cents  <sub>src/features/trip-split/model/records.test.ts:85</sub>
- rounds a float that cannot be represented exactly, instead of truncating it  <sub>src/features/trip-split/model/records.test.ts:92</sub>
- keeps a legacy amount of 0 as 0 rather than losing the record  <sub>src/features/trip-split/model/records.test.ts:97</sub>
- carries a legacy float split map into integer weights  <sub>src/features/trip-split/model/records.test.ts:101</sub>
- does NOT force the method — the trip-wide flag lives outside this record  <sub>src/features/trip-split/model/records.test.ts:106</sub>
- prefers an explicit V2 field over its legacy counterpart  <sub>src/features/trip-split/model/records.test.ts:112</sub>
- leaves baseMinor null for a foreign expense with no captured conversion  <sub>src/features/trip-split/model/records.test.ts:117</sub>
- keeps a captured conversion when there is one  <sub>src/features/trip-split/model/records.test.ts:123</sub>
- discards a nonsense rate rather than storing it  <sub>src/features/trip-split/model/records.test.ts:129</sub>
- round-trips a complete record  <sub>src/features/trip-split/model/records.test.ts:137</sub>
- defaults name/payment to '' so an empty new member renders blank, not 'undefined'  <sub>src/features/trip-split/model/records.test.ts:142</sub>
- gives the local and synced creation paths an identical shape  <sub>src/features/trip-split/model/records.test.ts:146</sub>
- keeps order when present  <sub>src/features/trip-split/model/records.test.ts:152</sub>
- round-trips a complete record  <sub>src/features/trip-split/model/records.test.ts:158</sub>
- coerces a missing or unusable amount to 0 rather than NaN  <sub>src/features/trip-split/model/records.test.ts:163</sub>
- rounds a fractional amount to whole minor units  <sub>src/features/trip-split/model/records.test.ts:168</sub>
- defaults text fields to ''  <sub>src/features/trip-split/model/records.test.ts:172</sub>
- gives every member the room's own id and rewrites every reference to them  <sub>src/features/trip-split/model/records.test.ts:202</sub>
- keeps the money and the shape untouched — this remaps identity, nothing else  <sub>src/features/trip-split/model/records.test.ts:216</sub>
- drops the old record id so the room assigns its own, and reorders from zero  <sub>src/features/trip-split/model/records.test.ts:224</sub>
- passes an unmapped reference through instead of emptying it  <sub>src/features/trip-split/model/records.test.ts:232</sub>
- survives an empty or malformed ledger rather than throwing into the UI  <sub>src/features/trip-split/model/records.test.ts:240</sub>

**A group's agreed spending limit is tracked honestly against what was actually spent.**

- returns null with nothing entered yet — honest blank, not a guessed $0  <sub>src/features/budget-pact/model/pact.test.ts:12</sub>
- returns null for a section with no items at all  <sub>src/features/budget-pact/model/pact.test.ts:16</sub>
- counts trip-basis costs from day one, day-basis costs only for elapsed days  <sub>src/features/budget-pact/model/pact.test.ts:20</sub>
- flags over-plan spend with the unsigned delta and 'over' status  <sub>src/features/budget-pact/model/pact.test.ts:28</sub>
- flags under-plan spend with the unsigned delta and 'under' status  <sub>src/features/budget-pact/model/pact.test.ts:34</sub>
- before departure (daysElapsed 0), only trip-basis costs are expected  <sub>src/features/budget-pact/model/pact.test.ts:40</sub>
- clamps elapsed days to the section's own trip length once the trip is over  <sub>src/features/budget-pact/model/pact.test.ts:47</sub>
- never lets a negative daysElapsed (shouldn't happen, but defensive) underflow the plan  <sub>src/features/budget-pact/model/pact.test.ts:53</sub>
- carries the currency through untouched  <sub>src/features/budget-pact/model/pact.test.ts:58</sub>

**A reported problem reaches the maker with enough detail to act on.**

- offers one option per tab, plus an explicit escape hatch  <sub>src/features/change-request/model/change-request.test.ts:21</sub>
- shows the tab's own section titles as a hint, minus the one that just repeats the tab  <sub>src/features/change-request/model/change-request.test.ts:27</sub>
- truncates a content-heavy tab's hint instead of printing a wall of titles  <sub>src/features/change-request/model/change-request.test.ts:34</sub>
- keeps ampersands — real tab names use them and the hint allowlist permits them  <sub>src/features/change-request/model/change-request.test.ts:41</sub>
- omits a group whose name the hint rules would reject, rather than sending a mangled value  <sub>src/features/change-request/model/change-request.test.ts:45</sub>
- survives a guide with no nav data at all  <sub>src/features/change-request/model/change-request.test.ts:51</sub>
- lets the tab step through even with no tab chosen — 'not sure' is a valid answer  <sub>src/features/change-request/model/change-request.test.ts:58</sub>
- requires a description  <sub>src/features/change-request/model/change-request.test.ts:62</sub>
- rejects a description too short to act on  <sub>src/features/change-request/model/change-request.test.ts:68</sub>
- accepts a real report  <sub>src/features/change-request/model/change-request.test.ts:72</sub>
- counts down from the cap  <sub>src/features/change-request/model/change-request.test.ts:78</sub>
- targets the modify template and self-applies the request label  <sub>src/features/change-request/model/change-request.test.ts:87</sub>
- carries the slug from the page, not from the reporter  <sub>src/features/change-request/model/change-request.test.ts:94</sub>
- prefills the change text verbatim  <sub>src/features/change-request/model/change-request.test.ts:100</sub>
- omits the section entirely when the reporter isn't sure  <sub>src/features/change-request/model/change-request.test.ts:105</sub>
- drops an injection-shaped section rather than forwarding it  <sub>src/features/change-request/model/change-request.test.ts:109</sub>
- caps an over-long description so it can't be silently truncated by the URL  <sub>src/features/change-request/model/change-request.test.ts:115</sub>

**A shared budget with nothing in it says so, instead of inventing a debt.**

- ⌁ reports zero, not a guess  <sub>src/features/trip-split/__tests__/empty.test.ts:15</sub>
- ⌁ leaves every net at zero so the UI can render an em dash, never +0.00  <sub>src/features/trip-split/__tests__/empty.test.ts:19</sub>
- ⌁ produces no transfers, so settle-up has nothing to offer  <sub>src/features/trip-split/__tests__/empty.test.ts:31</sub>
- found the silo's real source files  <sub>src/features/trip-split/__tests__/empty.test.ts:52</sub>
- defines no seeding function anywhere in the silo  <sub>src/features/trip-split/__tests__/empty.test.ts:56</sub>
- never reads a guide's budget section — the one import that would make seeding possible  <sub>src/features/trip-split/__tests__/empty.test.ts:62</sub>
- ⌁ takes the guide's day count as a divisor and never as a row  <sub>src/features/trip-split/__tests__/empty.test.ts:70</sub>
- splits one expense equally across three, and the nets sum to zero  <sub>src/features/trip-split/__tests__/empty.test.ts:88</sub>
- bills an UNKNOWN payer to the first member rather than dropping the expense  <sub>src/features/trip-split/__tests__/empty.test.ts:95</sub>
- takes a two-person split from the PARTICIPANT SET, never an invented per value  <sub>src/features/trip-split/__tests__/empty.test.ts:107</sub>
- sums paid to the total for a random 20-expense set (property)  <sub>src/features/trip-split/__tests__/empty.test.ts:117</sub>

**A shared link points at the exact section being shared, correctly encoded.**

- adds a #grp-N deep link for a numbered active tab  <sub>src/features/share/model/share-links.test.ts:9</sub>
- returns the bare base URL when no tab is active  <sub>src/features/share/model/share-links.test.ts:13</sub>
- returns the bare base URL for a SPECIAL panel (budget/vote/remind/learn) — not numeric  <sub>src/features/share/model/share-links.test.ts:18</sub>
- returns the bare base URL for an empty string tab id  <sub>src/features/share/model/share-links.test.ts:25</sub>
- accepts tab index 0 — falsy but a real, valid tab  <sub>src/features/share/model/share-links.test.ts:29</sub>
- rejects a non-purely-numeric tab id (defensive against unexpected markup)  <sub>src/features/share/model/share-links.test.ts:34</sub>
- URL-encodes the shared link  <sub>src/features/share/model/share-links.test.ts:41</sub>
- encodes both subject and body independently  <sub>src/features/share/model/share-links.test.ts:49</sub>
- encodes an ampersand in the title so it can't be mistaken for a mailto param separator  <sub>src/features/share/model/share-links.test.ts:57</sub>
- joins the summary and the URL with a blank line  <sub>src/features/share/model/share-links.test.ts:66</sub>
- does not mutate or trim the summary text  <sub>src/features/share/model/share-links.test.ts:70</sub>

**A shared trip room cannot be guessed into, and a settled trip stops accepting edits.**

- accepts the shape rules.json requires (16-40 lowercase alphanumerics)  <sub>src/features/firebase/model/room.test.ts:13</sub>
- rejects a guide SLUG, which is what actually shipped and broke  <sub>src/features/firebase/model/room.test.ts:19</sub>
- rejects the near-misses too — 15 chars, uppercase, punctuation, non-strings  <sub>src/features/firebase/model/room.test.ts:27</sub>
- the regex is anchored — a valid code buried in junk is not a valid code  <sub>src/features/firebase/model/room.test.ts:37</sub>
- returns the roomId when the guide declares a valid one  <sub>src/features/firebase/model/room.test.ts:44</sub>
- NEVER falls back to the storeKey — an absent roomId means local-only  <sub>src/features/firebase/model/room.test.ts:51</sub>
- an INVALID roomId is local-only too, not a best effort  <sub>src/features/firebase/model/room.test.ts:57</sub>
- survives a missing or malformed config without throwing  <sub>src/features/firebase/model/room.test.ts:61</sub>
- classifies the rejection this incident actually produced  <sub>src/features/firebase/model/room.test.ts:69</sub>
- treats network and unknown failures as TRANSIENT, so the outbox keeps them  <sub>src/features/firebase/model/room.test.ts:78</sub>
- accepts a valid code from the fragment, with or without a leading #  <sub>src/features/firebase/model/room.test.ts:93</sub>
- ignores an absent, empty or unrelated fragment  <sub>src/features/firebase/model/room.test.ts:97</sub>
- applies the SAME 16-40 char rule as any other room code  <sub>src/features/firebase/model/room.test.ts:104</sub>
- survives a malformed percent-escape instead of throwing  <sub>src/features/firebase/model/room.test.ts:111</sub>
- a valid override beats the guide's committed roomId  <sub>src/features/firebase/model/room.test.ts:119</sub>
- an invalid override never overrides the committed room  <sub>src/features/firebase/model/room.test.ts:122</sub>
- called with one argument it behaves exactly as before (no regression)  <sub>src/features/firebase/model/room.test.ts:126</sub>
- an override still works when the guide declares no room at all  <sub>src/features/firebase/model/room.test.ts:130</sub>
- unlocked during the trip and through the whole grace window  <sub>src/features/firebase/model/room.test.ts:139</sub>
- locks once the grace window is fully past  <sub>src/features/firebase/model/room.test.ts:144</sub>
- an UNDATED trip is never locked — guessing about a live trip is the worse failure  <sub>src/features/firebase/model/room.test.ts:148</sub>
- the grace window is honoured exactly, and is configurable  <sub>src/features/firebase/model/room.test.ts:153</sub>

**A suggested stop order is genuinely shorter than the planned one, or is not offered.**

- finds a materially shorter order for a genuine zigzag and reports the saving  <sub>src/features/route-opt/model/optimize.test.ts:26</sub>
- returns null under 3 located waypoints  <sub>src/features/route-opt/model/optimize.test.ts:34</sub>
- excludes waypoints with no coordinates from consideration entirely  <sub>src/features/route-opt/model/optimize.test.ts:41</sub>
- returns null when a day is already near-optimal (below the honest-blank threshold)  <sub>src/features/route-opt/model/optimize.test.ts:50</sub>
- is deterministic — the same input always returns the same suggestion  <sub>src/features/route-opt/model/optimize.test.ts:60</sub>
- real guide data: Korea's Tue Jul 14 shopping day fires, every other day of the trip stays silent  <sub>src/features/route-opt/model/optimize.test.ts:66</sub>
- 2-opt improves on the nearest-neighbour seed when the seed is provably suboptimal  <sub>src/features/route-opt/model/optimize.test.ts:85</sub>
- nearest-neighbour always starts at the day's real first stop  <sub>src/features/route-opt/model/optimize.test.ts:93</sub>

**A swipe between sections is distinguished from a scroll or a tap.**

- claims a clearly horizontal drag  <sub>src/features/mobile-nav/model/gesture.test.ts:9</sub>
- refuses a diagonal — a stolen scroll is worse than a missed swipe  <sub>src/features/mobile-nav/model/gesture.test.ts:12</sub>
- refuses anything shorter than the lock distance  <sub>src/features/mobile-nav/model/gesture.test.ts:15</sub>
- refuses a pure vertical scroll  <sub>src/features/mobile-nav/model/gesture.test.ts:19</sub>
- advances one group on a long leftward drag  <sub>src/features/mobile-nav/model/gesture.test.ts:25</sub>
- goes back one group on a long rightward drag  <sub>src/features/mobile-nav/model/gesture.test.ts:28</sub>
- springs back on a short, slow drag  <sub>src/features/mobile-nav/model/gesture.test.ts:31</sub>
- commits a short but fast flick  <sub>src/features/mobile-nav/model/gesture.test.ts:34</sub>
- does not let a fast jitter inside the axis lock commit  <sub>src/features/mobile-nav/model/gesture.test.ts:37</sub>
- honours the exact distance boundary (30% of width)  <sub>src/features/mobile-nav/model/gesture.test.ts:40</sub>
- honours the exact velocity boundary (0.5 px/ms)  <sub>src/features/mobile-nav/model/gesture.test.ts:44</sub>
- never navigates out of a tool panel (cur < 0)  <sub>src/features/mobile-nav/model/gesture.test.ts:48</sub>
- does not run past the last or first group  <sub>src/features/mobile-nav/model/gesture.test.ts:51</sub>
- is true only in the direction that runs out of groups  <sub>src/features/mobile-nav/model/gesture.test.ts:58</sub>
- treats a tool panel as an edge in both directions  <sub>src/features/mobile-nav/model/gesture.test.ts:64</sub>
- tracks the finger nearly 1:1 inside the range  <sub>src/features/mobile-nav/model/gesture.test.ts:71</sub>
- rubber-bands at an end and never runs away  <sub>src/features/mobile-nav/model/gesture.test.ts:74</sub>
- keeps the sign of the drag  <sub>src/features/mobile-nav/model/gesture.test.ts:79</sub>

**A swipe through a day is read as the traveller meant it, not as an accidental tap.**

- advances one day on a clear leftward swipe  <sub>src/features/itinerary/model/gesture.test.ts:11</sub>
- goes back one day on a clear rightward swipe  <sub>src/features/itinerary/model/gesture.test.ts:15</sub>
- ignores a swipe too short to commit (|dx| < 72)  <sub>src/features/itinerary/model/gesture.test.ts:19</sub>
- ignores a too-vertical swipe (|dy| > 46)  <sub>src/features/itinerary/model/gesture.test.ts:24</sub>
- ignores a too-slow swipe (dt > 650)  <sub>src/features/itinerary/model/gesture.test.ts:29</sub>
- never navigates from an unresolved position (cur < 0)  <sub>src/features/itinerary/model/gesture.test.ts:34</sub>
- does not run past the last or first day  <sub>src/features/itinerary/model/gesture.test.ts:38</sub>

**A traveller's own reordering of sections survives a reload.**

- round-trips through serializeOrder  <sub>src/features/panel/model/order.test.ts:8</sub>
- returns [] for junk: bad JSON, non-arrays, null  <sub>src/features/panel/model/order.test.ts:12</sub>
- drops non-strings, empties, over-long ids and duplicates  <sub>src/features/panel/model/order.test.ts:19</sub>
- caps at MAX_PANELS  <sub>src/features/panel/model/order.test.ts:24</sub>
- no saved order → the declared order, as a fresh array  <sub>src/features/panel/model/order.test.ts:31</sub>
- saved order wins for the ids it knows  <sub>src/features/panel/model/order.test.ts:38</sub>
- saved ids the page no longer has are dropped  <sub>src/features/panel/model/order.test.ts:42</sub>
- new ids append at the end in declared order — never shuffled into the arrangement  <sub>src/features/panel/model/order.test.ts:46</sub>
- moves to every valid position  <sub>src/features/panel/model/order.test.ts:54</sub>
- no-op: dropping where it already was returns the SAME array  <sub>src/features/panel/model/order.test.ts:61</sub>
- unknown id and empty sequence return the SAME array  <sub>src/features/panel/model/order.test.ts:65</sub>
- out-of-bounds clamps to the ends, never throws or drops  <sub>src/features/panel/model/order.test.ts:71</sub>
- never mutates its input  <sub>src/features/panel/model/order.test.ts:77</sub>
- normalises like the collapse key but under its own prefix  <sub>src/features/panel/model/order.test.ts:84</sub>

**A weather-driven suggestion to swap two days only fires when it genuinely helps.**

- classifies WMO precipitation bands  <sub>src/features/live-data/model/day-swap.test.ts:16</sub>
- matches 'Mon D' labels to ISO forecast dates by month+day  <sub>src/features/live-data/model/day-swap.test.ts:25</sub>
- suggests swapping a rainy outdoor day with the nearest dry indoor day  <sub>src/features/live-data/model/day-swap.test.ts:35</sub>
- stays silent without explicit env tags (no prose guessing)  <sub>src/features/live-data/model/day-swap.test.ts:48</sub>
- stays silent when the indoor day is also wet, or no indoor day exists  <sub>src/features/live-data/model/day-swap.test.ts:55</sub>
- never advises rearranging past days  <sub>src/features/live-data/model/day-swap.test.ts:69</sub>
- mixed days neither trigger nor receive a swap  <sub>src/features/live-data/model/day-swap.test.ts:83</sub>
- picks the NEAREST dry indoor day when several qualify  <sub>src/features/live-data/model/day-swap.test.ts:93</sub>

**An edit made with no signal is not lost; it is sent when the signal returns.**

- adds an entry keyed by its full path  <sub>src/features/firebase/model/outbox.test.ts:7</sub>
- evicts the oldest entries once over the cap (bounded storage)  <sub>src/features/firebase/model/outbox.test.ts:12</sub>
- does not mutate the input outbox  <sub>src/features/firebase/model/outbox.test.ts:21</sub>
- removes an acked entry  <sub>src/features/firebase/model/outbox.test.ts:29</sub>
- returns the same identity when the path is absent (no needless write)  <sub>src/features/firebase/model/outbox.test.ts:33</sub>
- returns only the entries under the given room base  <sub>src/features/firebase/model/outbox.test.ts:46</sub>
- does not match a room whose name is a prefix of another (roomA vs roomAB)  <sub>src/features/firebase/model/outbox.test.ts:54</sub>
- returns [] when nothing matches  <sub>src/features/firebase/model/outbox.test.ts:59</sub>

**Answers given when requesting a guide survive intact to the person building it.**

- every card value is an exact issue-template enum string  <sub>src/features/hub/model/intake.test.ts:18</sub>
- covers the full enum — no priority silently unreachable from the board  <sub>src/features/hub/model/intake.test.ts:21</sub>
- topic chips never collide with enum values (they are the also-research tier)  <sub>src/features/hub/model/intake.test.ts:24</sub>
- maps tap order to priority order and pads with empty  <sub>src/features/hub/model/intake.test.ts:30</sub>
- asks everything when nothing is filled (except niche without a niche rank)  <sub>src/features/hub/model/intake.test.ts:40</sub>
- skips a step when ALL of its fields are filled — the drop zone's whole point  <sub>src/features/hub/model/intake.test.ts:45</sub>
- still asks a step when only ONE of its fields is filled  <sub>src/features/hub/model/intake.test.ts:52</sub>
- asks the niche question ONLY when a ranked priority is the niche enum  <sub>src/features/hub/model/intake.test.ts:56</sub>
- whitespace-only counts as empty  <sub>src/features/hub/model/intake.test.ts:60</sub>
- every id is a real flat-form field id (the seam: intake-submit collects by these)  <sub>src/features/hub/model/intake.test.ts:67</sub>
- renders ghosts for an empty intake and never invents a value  <sub>src/features/hub/model/intake.test.ts:76</sub>
- includes optional sentences only when their values exist  <sub>src/features/hub/model/intake.test.ts:84</sub>
- drops empty text separators  <sub>src/features/hub/model/intake.test.ts:92</sub>

**Book-by dates are counted back from the real trip dates.**

- collects dated items from panel checklists AND per-day checklists, ignoring bare strings  <sub>src/features/trip-kit/model/book-by.test.ts:9</sub>
- buckets overdue (<0 days), soon (0-14 days), and later (>14 days) correctly  <sub>src/features/trip-kit/model/book-by.test.ts:21</sub>
- carries note and source_url through, defaulting to null when absent  <sub>src/features/trip-kit/model/book-by.test.ts:33</sub>
- returns an empty array for a guide with no dated checklist items — never invents one  <sub>src/features/trip-kit/model/book-by.test.ts:42</sub>
- ignores sections of other types entirely  <sub>src/features/trip-kit/model/book-by.test.ts:49</sub>

**Currency conversions use a dated, sourced rate — never a remembered one.**

- accepts a rate at the seed value for a currency with no explicit band  <sub>src/features/live-data/model/rate.test.ts:12</sub>
- rejects an order-of-magnitude error on a derived-band currency  <sub>src/features/live-data/model/rate.test.ts:17</sub>
- still tolerates a genuinely large market move, so a volatile currency isn't rejected for moving  <sub>src/features/live-data/model/rate.test.ts:22</sub>
- keeps the hand-tuned band where one exists, rather than deriving over it  <sub>src/features/live-data/model/rate.test.ts:27</sub>
- still accepts anything for a currency with neither a band nor a seed rate  <sub>src/features/live-data/model/rate.test.ts:32</sub>
- accepts a real KRW rate and rejects an order-of-magnitude error  <sub>src/features/live-data/model/rate.test.ts:39</sub>
- is inclusive at the band edges  <sub>src/features/live-data/model/rate.test.ts:45</sub>
- accepts ANY rate for an unlisted currency — unknown is not invalid  <sub>src/features/live-data/model/rate.test.ts:52</sub>
- catches a plausible-looking cross-currency mixup  <sub>src/features/live-data/model/rate.test.ts:58</sub>
- renders big rates whole and small rates with decimals  <sub>src/features/live-data/model/rate.test.ts:67</sub>
- does NOT round a sub-1 rate to a useless integer — the bug this shape exists to avoid  <sub>src/features/live-data/model/rate.test.ts:73</sub>
- handles the boundaries between the three formats  <sub>src/features/live-data/model/rate.test.ts:79</sub>
- accepts a complete cache stamped today  <sub>src/features/live-data/model/rate.test.ts:89</sub>
- rejects yesterday's cache  <sub>src/features/live-data/model/rate.test.ts:92</sub>
- rejects a partial cache rather than rendering undefined  <sub>src/features/live-data/model/rate.test.ts:95</sub>
- rejects null/undefined  <sub>src/features/live-data/model/rate.test.ts:100</sub>
- pulls the rate and date out of a real Frankfurter shape  <sub>src/features/live-data/model/rate.test.ts:107</sub>
- throws when the requested currency is absent — never returns undefined as a rate  <sub>src/features/live-data/model/rate.test.ts:112</sub>
- throws on non-finite values  <sub>src/features/live-data/model/rate.test.ts:118</sub>
- throws on an out-of-band rate, naming it — the caller falls back rather than showing it  <sub>src/features/live-data/model/rate.test.ts:123</sub>
- treats 0 as missing — a zero rate would divide-by-zero the budget  <sub>src/features/live-data/model/rate.test.ts:128</sub>

**Each trip's summary on the home page is derived from its own guide, not restated by hand.**

- finds the first map section's center in file order, across nested sections  <sub>src/features/atlas/model/guide-record.test.ts:12</sub>
- resolves Fukuoka as japan's anchor — its own first map section, no override needed  <sub>src/features/atlas/model/guide-record.test.ts:21</sub>
- null for a guide with no map section — honest absence, never a guessed point  <sub>src/features/atlas/model/guide-record.test.ts:30</sub>
- skips a map section with no center  <sub>src/features/atlas/model/guide-record.test.ts:36</sub>
- takes the leading city before a middle-dot list  <sub>src/features/atlas/model/guide-record.test.ts:42</sub>
- takes the leading city before a comma-qualified region  <sub>src/features/atlas/model/guide-record.test.ts:46</sub>
- takes the leading city before an em dash with no comma/dot  <sub>src/features/atlas/model/guide-record.test.ts:50</sub>
- null for an absent kicker — never invented  <sub>src/features/atlas/model/guide-record.test.ts:54</sub>
- undated when tripWindow has no resolvable dates  <sub>src/features/atlas/model/guide-record.test.ts:62</sub>
- upcoming for a future trip  <sub>src/features/atlas/model/guide-record.test.ts:65</sub>
- ongoing when today falls inside the window  <sub>src/features/atlas/model/guide-record.test.ts:68</sub>
- past once the window has closed  <sub>src/features/atlas/model/guide-record.test.ts:71</sub>
- resolves a confirmed row through the gazetteer  <sub>src/features/atlas/model/guide-record.test.ts:77</sub>
- resolves an unconfirmed row too, but marks it unconfirmed  <sub>src/features/atlas/model/guide-record.test.ts:83</sub>
- is case-insensitive on the stored code  <sub>src/features/atlas/model/guide-record.test.ts:88</sub>
- null when there's no traveler-origin row, no facts at all, or an unresolvable code  <sub>src/features/atlas/model/guide-record.test.ts:92</sub>
- prefers a Commons file  <sub>src/features/atlas/model/guide-record.test.ts:101</sub>
- falls back to a direct src  <sub>src/features/atlas/model/guide-record.test.ts:105</sub>
- falls back to the video poster when that's all there is  <sub>src/features/atlas/model/guide-record.test.ts:108</sub>
- null for no cover at all — Stage C owns the richer fallback chain, not this  <sub>src/features/atlas/model/guide-record.test.ts:112</sub>
- composes every field from the guide's own content, nothing invented  <sub>src/features/atlas/model/guide-record.test.ts:135</sub>
- status is pinned by the kicker's year — a finished trip never becomes 'upcoming' again on a later build  <sub>src/features/atlas/model/guide-record.test.ts:154</sub>
- a scaffold guide with none of the optional content resolves every field to an honest null, never a crash  <sub>src/features/atlas/model/guide-record.test.ts:163</sub>

**Every tool runs on the selected trip's own record.**

- carries the trip's identity through unchanged  <sub>src/features/trip-tools/__tests__/tools-record.test.ts:10</sub>
- counts the book-ahead reminders the panel's kicker prints  <sub>src/features/trip-tools/__tests__/tools-record.test.ts:17</sub>
- counts distinct closed places, not closure rows  <sub>src/features/trip-tools/__tests__/tools-record.test.ts:22</sub>
- admits the days it could not order rather than hiding them  <sub>src/features/trip-tools/__tests__/tools-record.test.ts:27</sub>
- copies no budget row into any tool — the split ledger is real spend only  <sub>src/features/trip-tools/__tests__/tools-record.test.ts:33</sub>
- returns an empty-but-valid record for a guide with no tool-shaped content  <sub>src/features/trip-tools/__tests__/tools-record.test.ts:41</sub>

**Everything a trip asks you to book ahead is surfaced before it is too late.**

- reads a URL as a link  <sub>src/features/reminders/model/reminders.test.ts:7</sub>
- reads a clock time as a time  <sub>src/features/reminders/model/reminders.test.ts:12</sub>
- reads a short alphanumeric token with a digit as a code  <sub>src/features/reminders/model/reminders.test.ts:18</sub>
- does NOT mistake a door code for a time (no clock punctuation)  <sub>src/features/reminders/model/reminders.test.ts:23</sub>
- prefers link over code/time when the text is a URL containing digits  <sub>src/features/reminders/model/reminders.test.ts:27</sub>
- falls back to a plain note  <sub>src/features/reminders/model/reminders.test.ts:31</sub>
- rejects an empty body  <sub>src/features/reminders/model/reminders.test.ts:38</sub>
- keeps the label + trims, and infers the kind  <sub>src/features/reminders/model/reminders.test.ts:44</sub>
- honours an explicit valid kind over inference  <sub>src/features/reminders/model/reminders.test.ts:52</sub>
- ignores a bogus kind and infers instead  <sub>src/features/reminders/model/reminders.test.ts:56</sub>
- caps runaway text/label  <sub>src/features/reminders/model/reminders.test.ts:60</sub>
- coerces pinned to a real boolean  <sub>src/features/reminders/model/reminders.test.ts:66</sub>
- puts pinned first, then newest — a pin never sinks below a later note  <sub>src/features/reminders/model/reminders.test.ts:73</sub>
- orders multiple pins newest-first among themselves  <sub>src/features/reminders/model/reminders.test.ts:82</sub>
- does not mutate the input and survives empty/missing fields  <sub>src/features/reminders/model/reminders.test.ts:90</sub>
- every seed carries the full stored shape (model fields + sync-added fields)  <sub>src/features/reminders/model/reminders.test.ts:106</sub>
- each seed's stored kind matches what inferKind derives from its text  <sub>src/features/reminders/model/reminders.test.ts:118</sub>
- buildReminder round-trips each seed's authorable fields unchanged  <sub>src/features/reminders/model/reminders.test.ts:122</sub>

**Follow-up questions asked during intake are the ones the answers actually warrant.**

- returns null for clean text  <sub>src/features/intake-questions/__tests__/question.test.ts:26</sub>
- catches pipeline vocabulary  <sub>src/features/intake-questions/__tests__/question.test.ts:30</sub>
- catches all declared banned terms  <sub>src/features/intake-questions/__tests__/question.test.ts:34</sub>
- passes a valid question  <sub>src/features/intake-questions/__tests__/question.test.ts:42</sub>
- rejects missing id  <sub>src/features/intake-questions/__tests__/question.test.ts:46</sub>
- rejects missing text  <sub>src/features/intake-questions/__tests__/question.test.ts:50</sub>
- rejects banned terms in text  <sub>src/features/intake-questions/__tests__/question.test.ts:54</sub>
- rejects banned terms in assumption  <sub>src/features/intake-questions/__tests__/question.test.ts:59</sub>
- formats and parses back  <sub>src/features/intake-questions/__tests__/question.test.ts:66</sub>
- returns empty for missing section  <sub>src/features/intake-questions/__tests__/question.test.ts:77</sub>
- all mock questions pass validation  <sub>src/features/intake-questions/__tests__/question.test.ts:83</sub>

**Forecasts are read correctly and say plainly when there is no data.**

- maps each WMO band to its symbol, and never emoji  <sub>src/features/live-data/model/weather.test.ts:17</sub>
- falls back for an unknown code instead of rendering blank  <sub>src/features/live-data/model/weather.test.ts:25</sub>
- accepts real temperatures  <sub>src/features/live-data/model/weather.test.ts:32</sub>
- rejects a Fahrenheit payload — the unit error the band exists to catch  <sub>src/features/live-data/model/weather.test.ts:35</sub>
- rejects nulls and non-numbers rather than rendering them  <sub>src/features/live-data/model/weather.test.ts:40</sub>
- is inclusive at the physical bounds  <sub>src/features/live-data/model/weather.test.ts:45</sub>
- accepts the real Open-Meteo sample  <sub>src/features/live-data/model/weather.test.ts:52</sub>
- TRIMS trailing incomplete days instead of throwing the forecast away  <sub>src/features/live-data/model/weather.test.ts:58</sub>
- HARD-fails on a bad value in the middle — that's an anomaly, not an edge artifact  <sub>src/features/live-data/model/weather.test.ts:70</sub>
- rejects mismatched array lengths — the shape that would index past the end  <sub>src/features/live-data/model/weather.test.ts:76</sub>
- rejects absent/empty/garbage payloads  <sub>src/features/live-data/model/weather.test.ts:81</sub>
- returns null when EVERY day is bad rather than an empty strip  <sub>src/features/live-data/model/weather.test.ts:88</sub>
- upcoming trip: locates the start date inside the forecast  <sub>src/features/live-data/model/weather.test.ts:97</sub>
- ongoing trip: shows the REMAINING days, not the original length  <sub>src/features/live-data/model/weather.test.ts:103</sub>
- past trip → null (nothing to show)  <sub>src/features/live-data/model/weather.test.ts:112</sub>
- trip beyond the forecast horizon → null, NOT a misleading nearby forecast  <sub>src/features/live-data/model/weather.test.ts:117</sub>
- no trip dates → generic next-7 from today  <sub>src/features/live-data/model/weather.test.ts:122</sub>
- never asks for more days than the forecast holds  <sub>src/features/live-data/model/weather.test.ts:127</sub>
- reads a location's current temperature and code  <sub>src/features/live-data/model/weather.test.ts:136</sub>
- returns null rather than a row that shows nothing useful  <sub>src/features/live-data/model/weather.test.ts:141</sub>
- rejects out-of-band readings — a Fahrenheit payload must not render as °C  <sub>src/features/live-data/model/weather.test.ts:149</sub>
- keeps 0 °C and code 0, which a truthiness check would drop  <sub>src/features/live-data/model/weather.test.ts:154</sub>

**Labels on the globe never sit on top of each other.**

- takes the first seat (directly above the pin) and marks it a tail  <sub>src/features/atlas/model/solver.test.ts:13</sub>
- never overlaps a passed-in obstacle  <sub>src/features/atlas/model/solver.test.ts:25</sub>
- later cards route around earlier ones placed in the same pass (no two seats overlap)  <sub>src/features/atlas/model/solver.test.ts:37</sub>
- solves in the order given — does not re-sort by position  <sub>src/features/atlas/model/solver.test.ts:48</sub>
- re-solves the WHOLE pass with plates hidden when the full-height pass can't go clean, and takes it if clean  <sub>src/features/atlas/model/solver.test.ts:59</sub>
- a card with no plate (compactH: null) cannot shrink even during the compaction retry  <sub>src/features/atlas/model/solver.test.ts:85</sub>
- returns clean:false and a least-bad position when nothing fits  <sub>src/features/atlas/model/solver.test.ts:98</sub>
- still returns one seat per input card even when every seat is bad  <sub>src/features/atlas/model/solver.test.ts:107</sub>
- clamps a pin near the edge so its card still respects PAD  <sub>src/features/atlas/model/solver.test.ts:117</sub>

**Map pins group and split apart at sensible zoom levels instead of piling up.**

- puts the null island at the centre of the zoom-0 world tile  <sub>src/features/maps/model/cluster.test.ts:12</sub>
- doubles resolution per zoom level  <sub>src/features/maps/model/cluster.test.ts:16</sub>
- survives a pole without returning NaN — a typo'd coordinate must not vanish  <sub>src/features/maps/model/cluster.test.ts:23</sub>
- keeps neighbours apart at street zoom  <sub>src/features/maps/model/cluster.test.ts:38</sub>
- merges close pins as you zoom out, and leaves distant ones alone  <sub>src/features/maps/model/cluster.test.ts:43</sub>
- returns a real coordinate for the cluster centre, usable as a Directions target  <sub>src/features/maps/model/cluster.test.ts:52</sub>
- is order-independent — the same pins always group the same way  <sub>src/features/maps/model/cluster.test.ts:58</sub>
- clusters by SCREEN distance, applying the Mercator projection to latitude  <sub>src/features/maps/model/cluster.test.ts:64</sub>
- drops non-finite coordinates instead of poisoning a cluster with NaN  <sub>src/features/maps/model/cluster.test.ts:77</sub>
- returns an empty list for no pins  <sub>src/features/maps/model/cluster.test.ts:85</sub>

**Money is stored and split in whole minor units, so nothing is lost to rounding.**

- converts won to cents at the guide rate  <sub>src/features/trip-split/model/money.test.ts:7</sub>
- handles a two-decimal foreign currency  <sub>src/features/trip-split/model/money.test.ts:12</sub>
- passes a base-currency amount straight through, rate or no rate  <sub>src/features/trip-split/model/money.test.ts:17</sub>
- refuses to invent a number when the rate is missing or nonsense  <sub>src/features/trip-split/model/money.test.ts:22</sub>
- refuses an unknown currency rather than guessing its decimal places  <sub>src/features/trip-split/model/money.test.ts:29</sub>
- rejects a non-integer amount — minor units are whole by definition  <sub>src/features/trip-split/model/money.test.ts:33</sub>
- rounds to the nearest cent rather than truncating  <sub>src/features/trip-split/model/money.test.ts:37</sub>
- respects zero-decimal currencies (KRW minor unit = won)  <sub>src/features/trip-split/model/money.test.ts:46</sub>
- respects two-decimal currencies (DKK minor unit = øre)  <sub>src/features/trip-split/model/money.test.ts:52</sub>
- fails loudly on unknown currencies instead of guessing the exponent  <sub>src/features/trip-split/model/money.test.ts:57</sub>
- splits an indivisible amount deterministically (10000 / 3)  <sub>src/features/trip-split/model/money.test.ts:67</sub>
- splits a divisible amount evenly (13500 / 3)  <sub>src/features/trip-split/model/money.test.ts:76</sub>
- always sums exactly to the total (invariant sweep)  <sub>src/features/trip-split/model/money.test.ts:81</sub>
- splits 45000 KRW by 2/1/1 shares  <sub>src/features/trip-split/model/money.test.ts:93</sub>
- sums exactly with awkward share ratios  <sub>src/features/trip-split/model/money.test.ts:98</sub>
- splits 62550 øre 60/40  <sub>src/features/trip-split/model/money.test.ts:105</sub>
- handles fractional percentages and still sums exactly  <sub>src/features/trip-split/model/money.test.ts:110</sub>
- rejects percentages that do not sum to 100  <sub>src/features/trip-split/model/money.test.ts:119</sub>
- passes through exact minor-unit amounts  <sub>src/features/trip-split/model/money.test.ts:127</sub>
- rejects exact amounts that do not sum to the total  <sub>src/features/trip-split/model/money.test.ts:136</sub>
- rejects non-integer exact weights  <sub>src/features/trip-split/model/money.test.ts:142</sub>
- rejects a negative total  <sub>src/features/trip-split/model/money.test.ts:150</sub>
- rejects a non-integer total  <sub>src/features/trip-split/model/money.test.ts:154</sub>
- rejects an empty participant list  <sub>src/features/trip-split/model/money.test.ts:158</sub>
- rejects duplicate members  <sub>src/features/trip-split/model/money.test.ts:162</sub>
- rejects missing weights for weighted methods  <sub>src/features/trip-split/model/money.test.ts:166</sub>
- rejects all-zero weights  <sub>src/features/trip-split/model/money.test.ts:170</sub>
- exposes a machine-readable error code  <sub>src/features/trip-split/model/money.test.ts:176</sub>
- hands the leftover to the largest remainder, not to whoever happens to be first  <sub>src/features/trip-split/model/money.test.ts:192</sub>
- breaks an exact tie by input order, so the same person pays it every time  <sub>src/features/trip-split/model/money.test.ts:199</sub>
- returns identical output for identical input  <sub>src/features/trip-split/model/money.test.ts:208</sub>

**On-the-ground sums — currency, spend so far — are arithmetically right.**

- reports no-rate until a rate is loaded (the cold-cache state)  <sub>src/features/field-tools/model/field-math.test.ts:8</sub>
- reports empty when a rate is present but no amount is typed  <sub>src/features/field-tools/model/field-math.test.ts:14</sub>
- converts both directions once seeded (pins the warm-cache path)  <sub>src/features/field-tools/model/field-math.test.ts:18</sub>
- round-trips a value through both conversions  <sub>src/features/field-tools/model/field-math.test.ts:23</sub>
- handles zero and negative amounts without special-casing  <sub>src/features/field-tools/model/field-math.test.ts:30</sub>
- round-trips a checked-stops map  <sub>src/features/field-tools/model/field-math.test.ts:38</sub>
- drops keys that are not the <day>-<idx> shape (tamper resistance)  <sub>src/features/field-tools/model/field-math.test.ts:42</sub>
- never pollutes the prototype from a crafted payload  <sub>src/features/field-tools/model/field-math.test.ts:54</sub>
- returns {} for garbage instead of throwing  <sub>src/features/field-tools/model/field-math.test.ts:64</sub>
- sums the raw entered amounts on a real split blob  <sub>src/features/field-tools/model/field-math.test.ts:73</sub>
- treats blank / non-numeric amounts as zero  <sub>src/features/field-tools/model/field-math.test.ts:77</sub>
- tolerates a missing, null, or malformed blob (returns 0, never throws)  <sub>src/features/field-tools/model/field-math.test.ts:81</sub>

**Opening and closing a section is remembered, per guide, per device.**

- parses a JSON string  <sub>src/features/panel/model/collapse.test.ts:10</sub>
- accepts an already-parsed object  <sub>src/features/panel/model/collapse.test.ts:13</sub>
- returns {} for unparseable strings, arrays, null and primitives  <sub>src/features/panel/model/collapse.test.ts:16</sub>
- drops values that are not booleans  <sub>src/features/panel/model/collapse.test.ts:25</sub>
- keeps an explicit false — it records a reader who opened a Panel that ships collapsed  <sub>src/features/panel/model/collapse.test.ts:28</sub>
- drops an empty or over-long id  <sub>src/features/panel/model/collapse.test.ts:31</sub>
- keeps an id at exactly the length cap  <sub>src/features/panel/model/collapse.test.ts:35</sub>
- stops at the entry cap so a hand-edited store cannot grow without bound  <sub>src/features/panel/model/collapse.test.ts:39</sub>
- round-trips through parseCollapsed  <sub>src/features/panel/model/collapse.test.ts:47</sub>
- writes both decisions  <sub>src/features/panel/model/collapse.test.ts:51</sub>
- drops non-boolean values a caller may have grafted on  <sub>src/features/panel/model/collapse.test.ts:54</sub>
- collapses an open panel  <sub>src/features/panel/model/collapse.test.ts:61</sub>
- opens a collapsed panel  <sub>src/features/panel/model/collapse.test.ts:64</sub>
- toggles against the markup default when the reader has never decided  <sub>src/features/panel/model/collapse.test.ts:67</sub>
- ignores the markup default once the reader has decided  <sub>src/features/panel/model/collapse.test.ts:71</sub>
- does not mutate the input  <sub>src/features/panel/model/collapse.test.ts:74</sub>
- leaves other panels untouched  <sub>src/features/panel/model/collapse.test.ts:79</sub>
- ignores an empty id  <sub>src/features/panel/model/collapse.test.ts:82</sub>
- records both decisions, without mutating  <sub>src/features/panel/model/collapse.test.ts:89</sub>
- is a no-op when the reader's stored decision already matches  <sub>src/features/panel/model/collapse.test.ts:95</sub>
- records an untouched panel even when the value matches the open default  <sub>src/features/panel/model/collapse.test.ts:100</sub>
- ignores an empty id  <sub>src/features/panel/model/collapse.test.ts:103</sub>
- refuses a decision parseCollapsed would drop, rather than losing it on reload  <sub>src/features/panel/model/collapse.test.ts:107</sub>
- still updates a panel already in a full store  <sub>src/features/panel/model/collapse.test.ts:115</sub>
- every decision it records survives the round trip  <sub>src/features/panel/model/collapse.test.ts:120</sub>
- defaults to open for an unknown panel  <sub>src/features/panel/model/collapse.test.ts:127</sub>
- falls back to the markup default for an untouched panel  <sub>src/features/panel/model/collapse.test.ts:130</sub>
- lets the reader's decision outrank the markup default, both ways  <sub>src/features/panel/model/collapse.test.ts:133</sub>
- namespaces per scope so one scope never reads another's state  <sub>src/features/panel/model/collapse.test.ts:140</sub>
- normalizes the way GuideLayout derives storeKey  <sub>src/features/panel/model/collapse.test.ts:145</sub>
- collapses scopes that normalize the same — pinned, because changing it would silently repartition every reader's stored state  <sub>src/features/panel/model/collapse.test.ts:148</sub>
- falls back to a named default rather than a bare prefix  <sub>src/features/panel/model/collapse.test.ts:152</sub>

**Packing advice follows the real forecast for the real dates.**

- returns null with no forecast or no slice  <sub>src/features/live-data/model/packing.test.ts:18</sub>
- flags rain gear only when the slice actually has wet-code days  <sub>src/features/live-data/model/packing.test.ts:24</sub>
- does not mention rain when every day is dry  <sub>src/features/live-data/model/packing.test.ts:31</sub>
- flags layers only when the day/night spread crosses the threshold  <sub>src/features/live-data/model/packing.test.ts:36</sub>
- flags sun protection only when daylight is long, and never invents a UV figure  <sub>src/features/live-data/model/packing.test.ts:44</sub>
- returns null (not an empty items array) when nothing crosses any threshold  <sub>src/features/live-data/model/packing.test.ts:53</sub>
- only reads the slice window, ignoring forecast days outside it  <sub>src/features/live-data/model/packing.test.ts:58</sub>

**Reading down hides the chrome; any intent to go back brings it straight back.**

- yields once downward travel passes the threshold  <sub>src/features/mobile-nav/model/yield.test.ts:11</sub>
- SURVIVES the scroll-anchor rebound that broke the first cut  <sub>src/features/mobile-nav/model/yield.test.ts:16</sub>
- keeps a rebound from resetting the downward accumulator  <sub>src/features/mobile-nav/model/yield.test.ts:23</sub>
- returns the chrome on a deliberate upward flick  <sub>src/features/mobile-nav/model/yield.test.ts:27</sub>
- does not return the chrome on an upward nudge below the threshold  <sub>src/features/mobile-nav/model/yield.test.ts:33</sub>
- accumulates upward movement across samples before returning  <sub>src/features/mobile-nav/model/yield.test.ts:39</sub>
- never yields inside the top zone, whatever the travel  <sub>src/features/mobile-nav/model/yield.test.ts:48</sub>
- stands down and resets while an overlay is open  <sub>src/features/mobile-nav/model/yield.test.ts:52</sub>
- ignores sub-pixel noise entirely  <sub>src/features/mobile-nav/model/yield.test.ts:57</sub>
- re-yields after a return, without needing a fresh page load  <sub>src/features/mobile-nav/model/yield.test.ts:63</sub>

**Route order on the Tools screen is computed from mapped stops only, and says so.**

- reports the guide's own order as legs plus a total  <sub>src/features/trip-tools/__tests__/route-plan.test.ts:18</sub>
- suggests a shorter order only when one exists, and shows what it saves  <sub>src/features/trip-tools/__tests__/route-plan.test.ts:25</sub>
- stays silent on a day that is already in a sensible order  <sub>src/features/trip-tools/__tests__/route-plan.test.ts:34</sub>
- counts stops that have no coordinates instead of dropping them silently  <sub>src/features/trip-tools/__tests__/route-plan.test.ts:46</sub>
- omits a day that cannot be ordered at all  <sub>src/features/trip-tools/__tests__/route-plan.test.ts:55</sub>
- survives malformed input instead of throwing  <sub>src/features/trip-tools/__tests__/route-plan.test.ts:60</sub>
- rounds to one decimal — the honest precision for a straight-line estimate  <sub>src/features/trip-tools/__tests__/route-plan.test.ts:67</sub>

**Search can find anything that is actually in a guide.**

- shapes a prose section into a record, matching the prototype's crumb/snippet/hay contract  <sub>src/features/atlas/model/search-index.test.ts:7</sub>
- strips HTML tags from the snippet/hay, never leaks markup into search text  <sub>src/features/atlas/model/search-index.test.ts:22</sub>
- truncates a long snippet at 150 chars with a trailing ellipsis  <sub>src/features/atlas/model/search-index.test.ts:32</sub>
- does not truncate a short snippet  <sub>src/features/atlas/model/search-index.test.ts:39</sub>
- pulls text from items — bare strings and name/label/claim + body/correction/note objects  <sub>src/features/atlas/model/search-index.test.ts:45</sub>
- pulls text from steps and checklist entries too  <sub>src/features/atlas/model/search-index.test.ts:63</sub>
- falls back to the group name as title when the section has none  <sub>src/features/atlas/model/search-index.test.ts:72</sub>
- returns null for a section with no searchable text at all — never an empty row  <sub>src/features/atlas/model/search-index.test.ts:77</sub>
- matches the four real guides' own title fields (no parallel slug->name registry)  <sub>src/features/atlas/model/search-index.test.ts:82</sub>
- builds one record per searchable section, in order, skipping empty ones  <sub>src/features/atlas/model/search-index.test.ts:94</sub>
- index tracks each record's ORIGINAL position, not its position after skipped sections are dropped  <sub>src/features/atlas/model/search-index.test.ts:104</sub>
- empty array in, empty array out  <sub>src/features/atlas/model/search-index.test.ts:115</sub>

**Sections have a stable default order rather than an accidental one.**

- bands: full-width open < full-width collapsed < open < collapsed  <sub>src/features/panel/model/sort.test.ts:13</sub>
- full-width sorts first, whatever the declared order says  <sub>src/features/panel/model/sort.test.ts:22</sub>
- open sorts before collapsed  <sub>src/features/panel/model/sort.test.ts:31</sub>
- the two rules compose: a collapsed full-width Panel stays in the full-width band  <sub>src/features/panel/model/sort.test.ts:39</sub>
- ties inside a band break by the scope's declared order  <sub>src/features/panel/model/sort.test.ts:49</sub>
- does not mutate its input  <sub>src/features/panel/model/sort.test.ts:58</sub>
- is deterministic over repeated calls  <sub>src/features/panel/model/sort.test.ts:65</sub>
- handles the empty and single-Panel cases  <sub>src/features/panel/model/sort.test.ts:75</sub>

**Sunrise and sunset times are computed for the destination, not the reader's location.**

- matches Seoul reference within 5 minutes  <sub>src/features/live-data/model/sun.test.ts:13</sub>
- matches Copenhagen reference within 5 minutes  <sub>src/features/live-data/model/sun.test.ts:20</sub>
- golden hour brackets sunrise/sunset symmetrically  <sub>src/features/live-data/model/sun.test.ts:27</sub>
- reports day length consistent with sunset - sunrise  <sub>src/features/live-data/model/sun.test.ts:33</sub>
- flags midnight sun above the Arctic Circle in summer  <sub>src/features/live-data/model/sun.test.ts:39</sub>
- flags polar night above the Arctic Circle in winter  <sub>src/features/live-data/model/sun.test.ts:47</sub>
- counts down from now when mid-day  <sub>src/features/live-data/model/sun.test.ts:58</sub>
- counts from sunrise when queried before dawn  <sub>src/features/live-data/model/sun.test.ts:63</sub>
- returns null after sunset  <sub>src/features/live-data/model/sun.test.ts:70</sub>
- renders 24h HH:MM in the given IANA time zone  <sub>src/features/live-data/model/sun.test.ts:77</sub>
- renders in UTC when no time zone is given  <sub>src/features/live-data/model/sun.test.ts:82</sub>
- returns an em dash for a null date  <sub>src/features/live-data/model/sun.test.ts:87</sub>
- falls back to the system/UTC format when the time zone string is invalid  <sub>src/features/live-data/model/sun.test.ts:91</sub>

**Text pulled out of an uploaded booking PDF is the text that was in it.**

- accepts a normal booking confirmation (well under 10 MB)  <sub>src/features/hub/model/pdf-text.test.ts:10</sub>
- rejects a file over the 10 MB cap  <sub>src/features/hub/model/pdf-text.test.ts:14</sub>
- treats exactly 10 MB as acceptable (boundary)  <sub>src/features/hub/model/pdf-text.test.ts:17</sub>

**The arrival plan follows the flight and the destination's real first-day logistics.**

- derives a plan from the first days item, preserving order  <sub>src/features/trip-kit/model/arrival.test.ts:7</sub>
- falls back to the date as title when title is missing  <sub>src/features/trip-kit/model/arrival.test.ts:27</sub>
- returns empty steps/checklist arrays rather than omitting them, when absent  <sub>src/features/trip-kit/model/arrival.test.ts:31</sub>
- returns null for a guide with no days section (draft scaffold)  <sub>src/features/trip-kit/model/arrival.test.ts:39</sub>
- never invents coordinates for a step that has none  <sub>src/features/trip-kit/model/arrival.test.ts:45</sub>

**The bottom bar shows the sections this traveller actually uses.**

- parses a JSON string  <sub>src/features/mobile-nav/model/rank.test.ts:9</sub>
- returns {} for junk, arrays, null and unparseable strings  <sub>src/features/mobile-nav/model/rank.test.ts:12</sub>
- drops non-numeric, negative, zero and non-finite values  <sub>src/features/mobile-nav/model/rank.test.ts:18</sub>
- floors fractional counts  <sub>src/features/mobile-nav/model/rank.test.ts:21</sub>
- increments without mutating the input  <sub>src/features/mobile-nav/model/rank.test.ts:27</sub>
- starts a new group at 1  <sub>src/features/mobile-nav/model/rank.test.ts:33</sub>
- ignores an empty name  <sub>src/features/mobile-nav/model/rank.test.ts:36</sub>
- falls back to guide order when nothing has been opened  <sub>src/features/mobile-nav/model/rank.test.ts:43</sub>
- sorts most-used first  <sub>src/features/mobile-nav/model/rank.test.ts:46</sub>
- breaks ties by guide order, not counts-object insertion order  <sub>src/features/mobile-nav/model/rank.test.ts:49</sub>
- ignores counts for groups this guide does not have  <sub>src/features/mobile-nav/model/rank.test.ts:52</sub>
- always seats the current group first  <sub>src/features/mobile-nav/model/rank.test.ts:58</sub>
- does not duplicate the current group when it is also the most-used  <sub>src/features/mobile-nav/model/rank.test.ts:61</sub>
- shows the top-ranked groups when a tool panel is open (current = -1)  <sub>src/features/mobile-nav/model/rank.test.ts:64</sub>
- ignores an out-of-range current index instead of seating a phantom slot  <sub>src/features/mobile-nav/model/rank.test.ts:67</sub>
- honours a wider slot count and never exceeds the group count  <sub>src/features/mobile-nav/model/rank.test.ts:70</sub>
- returns nothing for zero slots  <sub>src/features/mobile-nav/model/rank.test.ts:74</sub>
- keeps a surviving group in the slot it already occupies  <sub>src/features/mobile-nav/model/rank.test.ts:80</sub>
- fills empty slots on first render  <sub>src/features/mobile-nav/model/rank.test.ts:85</sub>
- drops a group that left the set and seats the newcomer in its place  <sub>src/features/mobile-nav/model/rank.test.ts:88</sub>
- nulls a slot with nothing left to hold  <sub>src/features/mobile-nav/model/rank.test.ts:91</sub>
- ignores a stale slot value that is no longer promoted  <sub>src/features/mobile-nav/model/rank.test.ts:94</sub>
- leaves a short name alone  <sub>src/features/mobile-nav/model/rank.test.ts:100</sub>
- keeps the head of a compound name  <sub>src/features/mobile-nav/model/rank.test.ts:103</sub>
- truncates at a word boundary when the head is still too long  <sub>src/features/mobile-nav/model/rank.test.ts:107</sub>
- cuts mid-word rather than leaving a useless stub  <sub>src/features/mobile-nav/model/rank.test.ts:110</sub>
- returns empty for empty input  <sub>src/features/mobile-nav/model/rank.test.ts:113</sub>
- renders where the reader left off  <sub>src/features/mobile-nav/model/rank.test.ts:119</sub>
- collapses whitespace from DOM text  <sub>src/features/mobile-nav/model/rank.test.ts:122</sub>
- returns null when there is nothing remembered — an honest blank  <sub>src/features/mobile-nav/model/rank.test.ts:125</sub>
- truncates a very long section title  <sub>src/features/mobile-nav/model/rank.test.ts:131</sub>
- seats the CURRENT group for every one of the 13 — not just the first two  <sub>src/features/mobile-nav/model/rank.test.ts:150</sub>
- still seats the current group when another is far more used  <sub>src/features/mobile-nav/model/rank.test.ts:159</sub>
- gives an unopened group no count at all — order falls back to the guide's own  <sub>src/features/mobile-nav/model/rank.test.ts:167</sub>
- does not make a tapped right-hand slot jump to the left  <sub>src/features/mobile-nav/model/rank.test.ts:172</sub>
- abbreviates only where a slot cannot hold the name, and keeps it readable  <sub>src/features/mobile-nav/model/rank.test.ts:181</sub>
- is always a marked prefix of the real name — never a different string  <sub>src/features/mobile-nav/model/rank.test.ts:193</sub>
- cuts mid-word ONLY when the name offers no word boundary to cut at  <sub>src/features/mobile-nav/model/rank.test.ts:204</sub>
- keeps the FULL name available even where the visible one was cut  <sub>src/features/mobile-nav/model/rank.test.ts:222</sub>
- returns no resume line for a guide never opened — never a default string  <sub>src/features/mobile-nav/model/rank.test.ts:231</sub>

**The budget summary's figures are the ledger's figures.**

- totals every real expense and divides by the party size  <sub>src/features/trip-split/model/summary.test.ts:23</sub>
- omits per-day rather than guessing when the guide has no dated days  <sub>src/features/trip-split/model/summary.test.ts:33</sub>
- ignores half-typed rows with no amount  <sub>src/features/trip-split/model/summary.test.ts:40</sub>
- counts — and excludes — an expense whose currency was never converted  <sub>src/features/trip-split/model/summary.test.ts:47</sub>
- splits paid and share out of the balance the calculator already shows  <sub>src/features/trip-split/model/summary.test.ts:59</sub>
- net always equals settle()'s balance, and the three net out to zero  <sub>src/features/trip-split/model/summary.test.ts:70</sub>
- paid minus share is the net, per person, when nothing has been settled  <sub>src/features/trip-split/model/summary.test.ts:77</sub>
- a recorded payment moves the net without touching paid or share  <sub>src/features/trip-split/model/summary.test.ts:82</sub>
- names both sides of every transfer  <sub>src/features/trip-split/model/summary.test.ts:95</sub>
- records who paid and how many shared each line  <sub>src/features/trip-split/model/summary.test.ts:106</sub>
- keeps the entered foreign amount beside the converted one  <sub>src/features/trip-split/model/summary.test.ts:115</sub>
- leaves the native fields null for a base-currency expense  <sub>src/features/trip-split/model/summary.test.ts:126</sub>
- gives each person only the lines they actually shared, summing to their share  <sub>src/features/trip-split/model/summary.test.ts:132</sub>
- every person's share adds back up to the trip total, to the minor unit  <sub>src/features/trip-split/model/summary.test.ts:143</sub>
- rolls categories up, biggest first, and conserves the total  <sub>src/features/trip-split/model/summary.test.ts:150</sub>
- gathers uncategorised spend under one honest label rather than hiding it  <sub>src/features/trip-split/model/summary.test.ts:158</sub>
- labels an undescribed expense instead of printing a bare amount  <sub>src/features/trip-split/model/summary.test.ts:169</sub>
- falls back to Person N for an unnamed member  <sub>src/features/trip-split/model/summary.test.ts:175</sub>
- returns a printable empty summary with no members or expenses  <sub>src/features/trip-split/model/summary.test.ts:185</sub>
- honours per-expense weights, including on a subset expense  <sub>src/features/trip-split/model/summary.test.ts:195</sub>

**The calendar and map files a guide produces contain the guide's real days and places.**

- passes through an already-flat list unchanged  <sub>src/features/exports/model/exports.test.ts:44</sub>
- recursively flattens nested `sections`  <sub>src/features/exports/model/exports.test.ts:49</sub>
- handles null/undefined input gracefully  <sub>src/features/exports/model/exports.test.ts:57</sub>
- skips falsy entries in the sections array  <sub>src/features/exports/model/exports.test.ts:62</sub>
- collects a map section's center with its title  <sub>src/features/exports/model/exports.test.ts:68</sub>
- falls back to '<Country> map point' when a map section has no title  <sub>src/features/exports/model/exports.test.ts:73</sub>
- collects sights items that carry a `map` coord, falling back to '<Country> sight'  <sub>src/features/exports/model/exports.test.ts:78</sub>
- de-dupes on the exact lat,lng,name triplet  <sub>src/features/exports/model/exports.test.ts:90</sub>
- keeps two points that share coordinates but have different names  <sub>src/features/exports/model/exports.test.ts:101</sub>
- rejects non-finite or non-numeric coordinates  <sub>src/features/exports/model/exports.test.ts:109</sub>
- includes day-item waypoints with coords and skips coordless ones  <sub>src/features/exports/model/exports.test.ts:124</sub>
- returns an empty array for a guide with no sections  <sub>src/features/exports/model/exports.test.ts:140</sub>
- emits one event per day-card item with a parseable date  <sub>src/features/exports/model/exports.test.ts:147</sub>
- skips items whose date string doesn't parse, without throwing  <sub>src/features/exports/model/exports.test.ts:157</sub>
- defaults the title to 'Trip day' when missing  <sub>src/features/exports/model/exports.test.ts:163</sub>
- uses `note` for desc, falling back to `fit`, and converts HTML to plain text  <sub>src/features/exports/model/exports.test.ts:168</sub>
- omits `desc` entirely when neither note nor fit is present  <sub>src/features/exports/model/exports.test.ts:183</sub>
- ignores non-`days` sections  <sub>src/features/exports/model/exports.test.ts:188</sub>
- uses the title alone when there's no dek, no days, no waypoints  <sub>src/features/exports/model/exports.test.ts:195</sub>
- defaults the title to 'Trip Guide' when missing  <sub>src/features/exports/model/exports.test.ts:199</sub>
- appends the dek (converted from HTML) after an em dash  <sub>src/features/exports/model/exports.test.ts:203</sub>
- decodes each entity exactly once, so an escaped entity survives as text  <sub>src/features/exports/model/exports.test.ts:212</sub>
- keeps a literal ampersand from &amp; without eating what follows  <sub>src/features/exports/model/exports.test.ts:217</sub>
- lists planned days with their date prefix when present  <sub>src/features/exports/model/exports.test.ts:221</sub>
- lists up to 8 key spots and adds a '+N more' suffix beyond that  <sub>src/features/exports/model/exports.test.ts:229</sub>
- omits the 'Key spots' line entirely when there are no waypoints  <sub>src/features/exports/model/exports.test.ts:236</sub>
- produces a valid GPX 1.1 document with one <wpt> per waypoint  <sub>src/features/exports/model/exports.test.ts:242</sub>
- XML-escapes special characters in names/titles  <sub>src/features/exports/model/exports.test.ts:251</sub>
- still emits a well-formed document with zero waypoints  <sub>src/features/exports/model/exports.test.ts:258</sub>
- produces a VCALENDAR with one VEVENT per day event  <sub>src/features/exports/model/exports.test.ts:266</sub>
- uses CRLF line endings throughout  <sub>src/features/exports/model/exports.test.ts:279</sub>
- omits DESCRIPTION when the day has no note/fit  <sub>src/features/exports/model/exports.test.ts:286</sub>
- escapes commas, semicolons, and newlines in ICS text fields  <sub>src/features/exports/model/exports.test.ts:292</sub>
- folds long SUMMARY lines to <=75 octets per physical line and round-trips the original text  <sub>src/features/exports/model/exports.test.ts:299</sub>
- folds multibyte (emoji) content without splitting a code point across lines  <sub>src/features/exports/model/exports.test.ts:312</sub>
- returns a well-formed calendar with zero day events  <sub>src/features/exports/model/exports.test.ts:327</sub>
- multiplies day-basis items by the trip's day count and leaves trip-basis items alone  <sub>src/features/exports/model/exports.test.ts:336</sub>
- defaults to 1 day when `days` is absent  <sub>src/features/exports/model/exports.test.ts:341</sub>
- returns 0 for a missing or empty section  <sub>src/features/exports/model/exports.test.ts:345</sub>
- reproduces Korea's hand-written 21-of-37 stat from its real waypoints + skips  <sub>src/features/exports/model/exports.test.ts:355</sub>
- reports hasRecap: false and zeroed skip stats when there is no learnings block  <sub>src/features/exports/model/exports.test.ts:387</sub>
- never returns a negative hit count even if skips outnumber waypoints  <sub>src/features/exports/model/exports.test.ts:396</sub>
- pulls spendTotal from the guide's budget section, or null when there is none  <sub>src/features/exports/model/exports.test.ts:404</sub>

**The clock shown for a destination is that destination's real local time.**

- formats HH:MM and the zone in the given tz, 24h  <sub>src/features/atlas/model/local-time.test.ts:7</sub>
- ⌁ the zone follows the reader's own DST, because it is derived and not a table  <sub>src/features/atlas/model/local-time.test.ts:12</sub>
- null when tz is absent — never guessed  <sub>src/features/atlas/model/local-time.test.ts:20</sub>
- null for an unresolvable tz string, never throws  <sub>src/features/atlas/model/local-time.test.ts:26</sub>

**The database refuses writes the app should never make.**

- has a rule for every field of an expense  <sub>src/features/firebase/rules.test.ts:48</sub>
- has a rule for every field of a member  <sub>src/features/firebase/rules.test.ts:52</sub>
- has a payments collection, with a rule for every field of a payment  <sub>src/features/firebase/rules.test.ts:56</sub>
- still accepts the legacy pre-V2 expense fields, so existing rooms stay editable  <sub>src/features/firebase/rules.test.ts:62</sub>
- keeps the room-code length gate that makes the code itself the lock  <sub>src/features/firebase/rules.test.ts:68</sub>

**The day rail fits every day on screen when it can, and scrolls when it cannot.**

- is off for short trips — a 3-day rail is faster to tap than to scrub  <sub>src/features/mobile-nav/model/scrub.test.ts:7</sub>
- is off past the fit limit, where chips fall under the minimum target size  <sub>src/features/mobile-nav/model/scrub.test.ts:11</sub>
- is off for a guide with no days at all  <sub>src/features/mobile-nav/model/scrub.test.ts:15</sub>
- maps the left edge to the first day and the right edge to the last  <sub>src/features/mobile-nav/model/scrub.test.ts:23</sub>
- maps a mid-rail position to the day under it  <sub>src/features/mobile-nav/model/scrub.test.ts:27</sub>
- clamps past either end instead of running off  <sub>src/features/mobile-nav/model/scrub.test.ts:31</sub>
- lands exactly on a boundary at the start of that day's band  <sub>src/features/mobile-nav/model/scrub.test.ts:35</sub>
- returns 0 rather than NaN for a degenerate rail  <sub>src/features/mobile-nav/model/scrub.test.ts:39</sub>

**The new-guide questionnaire cannot be completed with missing or contradictory answers.**

- has exactly three steps, in the expected order  <sub>src/features/hub/model/wizard.test.ts:7</sub>
- every field id is assigned to exactly one step (no orphans, no duplicates)  <sub>src/features/hub/model/wizard.test.ts:11</sub>
- Country and the anchor event are both in step 0 (Where & when)  <sub>src/features/hub/model/wizard.test.ts:17</sub>
- allows moving forward from step 0 to 1 when Country is filled  <sub>src/features/hub/model/wizard.test.ts:26</sub>
- blocks moving forward from step 0 to 1 when Country is empty  <sub>src/features/hub/model/wizard.test.ts:31</sub>
- blocks moving forward from step 0 when Country is whitespace-only  <sub>src/features/hub/model/wizard.test.ts:38</sub>
- allows moving BACKWARD from step 1 to 0 regardless of Country  <sub>src/features/hub/model/wizard.test.ts:44</sub>
- the Country guard only applies when LEAVING step 0 — moving 1→2 needs no country  <sub>src/features/hub/model/wizard.test.ts:49</sub>
- refuses to go past the last step  <sub>src/features/hub/model/wizard.test.ts:54</sub>
- refuses to go before the first step  <sub>src/features/hub/model/wizard.test.ts:61</sub>
- extracts ISO dates, sorted and deduped, and builds a summary  <sub>src/features/hub/model/wizard.test.ts:69</sub>
- normalizes a bare-digit date (YYYYMMDD) to YYYY-MM-DD when word-bounded  <sub>src/features/hub/model/wizard.test.ts:76</sub>
- extracts flight numbers, capped at 6  <sub>src/features/hub/model/wizard.test.ts:88</sub>
- extracts lodging lines by keyword, capped at 4, ignoring long paragraphs  <sub>src/features/hub/model/wizard.test.ts:95</sub>
- reports 'no structured data found' for text with none of the above  <sub>src/features/hub/model/wizard.test.ts:109</sub>
- combines all three signals into one summary line, in order  <sub>src/features/hub/model/wizard.test.ts:117</sub>
- formats a note with no lodging lines as a single line  <sub>src/features/hub/model/wizard.test.ts:126</sub>
- appends lodging lines, indented, when present  <sub>src/features/hub/model/wizard.test.ts:132</sub>
- recognises a country named in the document  <sub>src/features/hub/model/wizard.test.ts:144</sub>
- resolves an alias to the canonical name the pipeline accepts  <sub>src/features/hub/model/wizard.test.ts:149</sub>
- dedupes an alias and its canonical name into one entry  <sub>src/features/hub/model/wizard.test.ts:153</sub>
- returns EVERY match so the caller can refuse to guess between them  <sub>src/features/hub/model/wizard.test.ts:156</sub>
- does not match a country name embedded inside another word  <sub>src/features/hub/model/wizard.test.ts:162</sub>
- is empty when no known country appears — an honest blank, not a guess  <sub>src/features/hub/model/wizard.test.ts:165</sub>

**The rail always shows this guide's own stops — never a list someone forgot to update.**

- ends … Sources, Field log, Tools when the guide has a learnings record  <sub>src/features/guide-rail/__tests__/stations.test.ts:26</sub>
- ends … Sources, Tools when it does not — Field log is ABSENT, not empty  <sub>src/features/guide-rail/__tests__/stations.test.ts:31</sub>
- derives the count from the guide — Korea 13, Sedona 9  <sub>src/features/guide-rail/__tests__/stations.test.ts:46</sub>
- numbers stations contiguously from zero, whatever the guide  <sub>src/features/guide-rail/__tests__/stations.test.ts:53</sub>
- gives every station a unique key  <sub>src/features/guide-rail/__tests__/stations.test.ts:60</sub>
- survives a name with an ampersand or a non-ASCII character, unescaped  <sub>src/features/guide-rail/__tests__/stations.test.ts:68</sub>
- renders every real group name in full — nothing is truncated on the way to the rail  <sub>src/features/guide-rail/__tests__/stations.test.ts:79</sub>
- is one station's share of the rail — never a shared constant  <sub>src/features/guide-rail/__tests__/stations.test.ts:90</sub>
- places the fill at index / count  <sub>src/features/guide-rail/__tests__/stations.test.ts:98</sub>
- never divides by zero — a one-station rail owns the whole line  <sub>src/features/guide-rail/__tests__/stations.test.ts:106</sub>
- clamps an out-of-range index rather than running off the rail  <sub>src/features/guide-rail/__tests__/stations.test.ts:117</sub>
- produces a valid geometry for every station of every real guide  <sub>src/features/guide-rail/__tests__/stations.test.ts:122</sub>

**The research progress page reports the real state of a run, including when it fails.**

- returns an all-not-done view with zero elapsed when no state exists yet  <sub>src/features/pipeline-progress/model/progress.test.ts:8</sub>
- marks only scaffold done right after scaffolding, current index at passA  <sub>src/features/pipeline-progress/model/progress.test.ts:18</sub>
- reflects mid-research progress (passA + passB done, reconcile next)  <sub>src/features/pipeline-progress/model/progress.test.ts:27</sub>
- is NOT done when verified but not yet published  <sub>src/features/pipeline-progress/model/progress.test.ts:34</sub>
- is fully done once verified AND published  <sub>src/features/pipeline-progress/model/progress.test.ts:42</sub>
- flags isStuck when updatedAt is stale and the pipeline isn't done  <sub>src/features/pipeline-progress/model/progress.test.ts:49</sub>
- never flags isStuck once the pipeline is fully done, no matter how old  <sub>src/features/pipeline-progress/model/progress.test.ts:55</sub>
- does not flag isStuck while genuinely still progressing (recent update)  <sub>src/features/pipeline-progress/model/progress.test.ts:61</sub>
- clamps elapsed to zero rather than going negative for a clock skew edge case  <sub>src/features/pipeline-progress/model/progress.test.ts:67</sub>
- renders seconds only under a minute  <sub>src/features/pipeline-progress/model/progress.test.ts:74</sub>
- renders minutes + seconds under an hour  <sub>src/features/pipeline-progress/model/progress.test.ts:78</sub>
- pads single-digit seconds  <sub>src/features/pipeline-progress/model/progress.test.ts:82</sub>
- renders hours + padded minutes at/over an hour  <sub>src/features/pipeline-progress/model/progress.test.ts:86</sub>
- floors fractional seconds  <sub>src/features/pipeline-progress/model/progress.test.ts:90</sub>
- lowercases and hyphenates  <sub>src/features/pipeline-progress/model/progress.test.ts:96</sub>
- strips accents  <sub>src/features/pipeline-progress/model/progress.test.ts:100</sub>
- collapses punctuation runs into one hyphen  <sub>src/features/pipeline-progress/model/progress.test.ts:104</sub>
- falls back to "guide" for empty input  <sub>src/features/pipeline-progress/model/progress.test.ts:108</sub>

**The section highlighted as where-you-are is the one actually on screen.**

- picks the card whose center is closest to the viewport center  <sub>src/features/itinerary/model/scroll-spy.test.ts:8</sub>
- picks the first card when the deck is scrolled to the start  <sub>src/features/itinerary/model/scroll-spy.test.ts:12</sub>
- picks the last card when the deck is scrolled to the end  <sub>src/features/itinerary/model/scroll-spy.test.ts:16</sub>
- resolves an exact tie to the earlier index  <sub>src/features/itinerary/model/scroll-spy.test.ts:20</sub>
- returns 0 for an empty deck (never called live, but must not throw)  <sub>src/features/itinerary/model/scroll-spy.test.ts:25</sub>
- selects the deepest day whose top has crossed the fold  <sub>src/features/itinerary/model/scroll-spy.test.ts:36</sub>
- returns 0 while the first day is still below the fold  <sub>src/features/itinerary/model/scroll-spy.test.ts:40</sub>
- selects the last day once everything has scrolled past  <sub>src/features/itinerary/model/scroll-spy.test.ts:44</sub>
- treats top exactly at the threshold as crossed (<= 0)  <sub>src/features/itinerary/model/scroll-spy.test.ts:48</sub>
- stops at the first gap — does not skip to a later crossed day  <sub>src/features/itinerary/model/scroll-spy.test.ts:52</sub>
- stops measuring at the first card below the fold (early break)  <sub>src/features/itinerary/model/scroll-spy.test.ts:57</sub>

**The Tools screen's reminders are that trip's own, not another trip's.**

- recognises the words a guide actually uses for securing something  <sub>src/features/trip-tools/__tests__/reminders.test.ts:7</sub>
- leaves packing-list items alone  <sub>src/features/trip-tools/__tests__/reminders.test.ts:14</sub>
- collects section-level and per-day checklists into one list  <sub>src/features/trip-tools/__tests__/reminders.test.ts:21</sub>
- puts booking items first and flags them  <sub>src/features/trip-tools/__tests__/reminders.test.ts:30</sub>
- sorts dated booking items soonest first, ahead of undated ones  <sub>src/features/trip-tools/__tests__/reminders.test.ts:39</sub>
- carries a due date's provenance rather than restating a bare date  <sub>src/features/trip-tools/__tests__/reminders.test.ts:52</sub>
- shows an instruction once when a section and its day both carry it  <sub>src/features/trip-tools/__tests__/reminders.test.ts:64</sub>
- gives two long items that share a 48-char prefix different ids  <sub>src/features/trip-tools/__tests__/reminders.test.ts:72</sub>
- survives malformed input instead of throwing  <sub>src/features/trip-tools/__tests__/reminders.test.ts:79</sub>

**The trip that matters right now is the one shown first.**

- puts ongoing first, then upcoming (soonest first), then past (most recent first), undated last  <sub>src/features/atlas/model/relevance.test.ts:9</sub>
- does not mutate the input array  <sub>src/features/atlas/model/relevance.test.ts:23</sub>
- never throws on a null tiebreak date  <sub>src/features/atlas/model/relevance.test.ts:33</sub>
- maps each live status to its exact spec string  <sub>src/features/atlas/model/relevance.test.ts:43</sub>
- null for undated — no guessed feature  <sub>src/features/atlas/model/relevance.test.ts:48</sub>

**Trip feedback becomes patterns — a raw private critique is never shown to anyone.**

- clamps ratings to integer 1..5 and omits missing/invalid  <sub>src/features/learnings/model/feedback.test.ts:7</sub>
- returns null for wholly empty input  <sub>src/features/learnings/model/feedback.test.ts:15</sub>
- strips empty/anonymous skips and trims + caps text  <sub>src/features/learnings/model/feedback.test.ts:20</sub>
- coerces visited values to booleans  <sub>src/features/learnings/model/feedback.test.ts:29</sub>
- keeps an optional day only when non-empty  <sub>src/features/learnings/model/feedback.test.ts:34</sub>
- counts done/total from the merged visited map  <sub>src/features/learnings/model/feedback.test.ts:41</sub>
- lets later records win per stop  <sub>src/features/learnings/model/feedback.test.ts:46</sub>
- collects skipped stops with the latest reason  <sub>src/features/learnings/model/feedback.test.ts:55</sub>
- handles empty / nullish input  <sub>src/features/learnings/model/feedback.test.ts:65</sub>
- counts by declared group, highest first  <sub>src/features/learnings/model/feedback.test.ts:78</sub>
- EXCLUDES ungrouped stops rather than bucketing them  <sub>src/features/learnings/model/feedback.test.ts:85</sub>
- breaks count ties by group name so the render is deterministic  <sub>src/features/learnings/model/feedback.test.ts:93</sub>
- returns [] for absent/empty/ungrouped input — caller renders nothing, not an empty heading  <sub>src/features/learnings/model/feedback.test.ts:102</sub>

**Two phones editing the same trip end up agreeing, not overwriting each other.**

- returns a 10-character code  <sub>src/features/firebase/sync.test.ts:28</sub>
- draws only from the unambiguous alphabet  <sub>src/features/firebase/sync.test.ts:32</sub>
- never contains a visually-ambiguous character (0/o/1/l/i)  <sub>src/features/firebase/sync.test.ts:38</sub>
- lowercases and strips anything that isn't a-z0-9  <sub>src/features/firebase/sync.test.ts:48</sub>
- strips RTDB-unsafe characters specifically ( . $ # [ ] / )  <sub>src/features/firebase/sync.test.ts:52</sub>
- truncates to 40 characters  <sub>src/features/firebase/sync.test.ts:56</sub>
- returns an empty string for null, undefined, or empty input  <sub>src/features/firebase/sync.test.ts:61</sub>
- reportError never calls ready() when Firebase isn't configured  <sub>src/features/firebase/sync.test.ts:69</sub>
- bumpCounter never calls ready() when Firebase isn't configured  <sub>src/features/firebase/sync.test.ts:75</sub>
- bumpCounter never calls ready() when no path is given, even if configured  <sub>src/features/firebase/sync.test.ts:81</sub>
- bumpCounter calls ready() once configured and given a path  <sub>src/features/firebase/sync.test.ts:88</sub>
- stops calling ready() after 5 configured calls in a session  <sub>src/features/firebase/sync.test.ts:107</sub>

**Undo puts the budget back exactly as it was, including what a deletion rewrote.**

- hands the departed member's expenses to the first person still on the trip  <sub>src/features/trip-split/model/undo.test.ts:31</sub>
- drops them from weights and from participant snapshots  <sub>src/features/trip-split/model/undo.test.ts:37</sub>
- clears the snapshot rather than leaving an expense shared by nobody  <sub>src/features/trip-split/model/undo.test.ts:46</sub>
- leaves expenses that never referenced them completely alone  <sub>src/features/trip-split/model/undo.test.ts:52</sub>
- restores every touched field exactly — the removal is fully reversible  <sub>src/features/trip-split/model/undo.test.ts:59</sub>
- empties the payer field when the last person leaves  <sub>src/features/trip-split/model/undo.test.ts:69</sub>
- does not mutate the records it plans over  <sub>src/features/trip-split/model/undo.test.ts:75</sub>
- snapshots the sharer list by copy, so undo cannot be edited out from under itself  <sub>src/features/trip-split/model/undo.test.ts:97</sub>
- touches only the keys the patch carries  <sub>src/features/trip-split/model/undo.test.ts:110</sub>
- writes an explicit null — restoring 'the whole group' is a real value, not a skip  <sub>src/features/trip-split/model/undo.test.ts:118</sub>

**Usage counting carries no personal information of any kind.**

- lowercases and dashes a human label  <sub>src/features/telemetry/model/telemetry.test.ts:8</sub>
- strips diacritics (so Pokémon keys are stable ASCII)  <sub>src/features/telemetry/model/telemetry.test.ts:13</sub>
- trims leading/trailing dashes and caps at 40 chars  <sub>src/features/telemetry/model/telemetry.test.ts:18</sub>
- returns empty string for garbage / empty input  <sub>src/features/telemetry/model/telemetry.test.ts:25</sub>
- builds telemetry/<guide>/<kind>/<name>  <sub>src/features/telemetry/model/telemetry.test.ts:33</sub>
- returns null when guide or name sanitize to empty (never writes a bad key)  <sub>src/features/telemetry/model/telemetry.test.ts:38</sub>
- ranks tabs and tools by count, guides by total opens  <sub>src/features/telemetry/model/telemetry.test.ts:45</sub>
- breaks count ties by name ascending (stable output)  <sub>src/features/telemetry/model/telemetry.test.ts:54</sub>
- tolerates missing / malformed nodes without throwing  <sub>src/features/telemetry/model/telemetry.test.ts:59</sub>

**What is shut on a given day is read from real holiday and opening-hours data.**

- maps a JS Sunday-first date onto the schema's Monday-first vocabulary  <sub>src/features/trip-tools/__tests__/closures.test.ts:7</sub>
- groups places by the weekday they are shut, Monday first  <sub>src/features/trip-tools/__tests__/closures.test.ts:26</sub>
- carries each place's own check date and source, where it has them  <sub>src/features/trip-tools/__tests__/closures.test.ts:32</sub>
- omits entries with no closed_days rather than guessing from prose  <sub>src/features/trip-tools/__tests__/closures.test.ts:40</sub>
- returns an empty list — an admitted blank — when nothing declares a closure  <sub>src/features/trip-tools/__tests__/closures.test.ts:45</sub>
- lists a place once per weekday even when two sections carry it  <sub>src/features/trip-tools/__tests__/closures.test.ts:50</sub>
- ignores a weekday value the schema would never allow  <sub>src/features/trip-tools/__tests__/closures.test.ts:58</sub>
- counts distinct places, not closure rows  <sub>src/features/trip-tools/__tests__/closures.test.ts:62</sub>

**Who owes whom is settled in the fewest transfers, and the totals always balance.**

- divides evenly among ONLY the named participants  <sub>src/features/trip-split/model/settle.test.ts:13</sub>
- treats absent/empty participants as the whole group (legacy records settle unchanged)  <sub>src/features/trip-split/model/settle.test.ts:24</sub>
- ignores participant ids that are no longer members (deleted mid-trip)  <sub>src/features/trip-split/model/settle.test.ts:33</sub>
- falls back to the whole group if every participant was deleted  <sub>src/features/trip-split/model/settle.test.ts:42</sub>
- charges a solo participant their own expense entirely (nets to zero)  <sub>src/features/trip-split/model/settle.test.ts:48</sub>
- mixes group and subset expenses correctly  <sub>src/features/trip-split/model/settle.test.ts:55</sub>
- ignores a stale weight for someone excluded from the expense  <sub>src/features/trip-split/model/settle.test.ts:68</sub>
- zero-sum weights fall back to even across the PARTICIPANTS, not the group  <sub>src/features/trip-split/model/settle.test.ts:82</sub>
- weights still win over an even split among the participants  <sub>src/features/trip-split/model/settle.test.ts:95</sub>
- a snapshotted expense is untouched when a fourth person joins later  <sub>src/features/trip-split/model/settle.test.ts:117</sub>
- a LEGACY record with no snapshot still re-splits — documented, not fixed retroactively  <sub>src/features/trip-split/model/settle.test.ts:125</sub>
- splitting 100 three ways loses nothing  <sub>src/features/trip-split/model/settle.test.ts:133</sub>
- distributes the odd minor unit rather than dropping it  <sub>src/features/trip-split/model/settle.test.ts:140</sub>
- conserves the total across many awkward amounts  <sub>src/features/trip-split/model/settle.test.ts:148</sub>
- two expenses in one trip can split differently  <sub>src/features/trip-split/model/settle.test.ts:160</sub>
- PERCENTAGE weights allocate proportionally and sum exactly  <sub>src/features/trip-split/model/settle.test.ts:173</sub>
- does not throw when typed EXACT shares fail to add up (the form warns; the engine copes)  <sub>src/features/trip-split/model/settle.test.ts:182</sub>
- a payment discharges the payer's debt  <sub>src/features/trip-split/model/settle.test.ts:196</sub>
- settling everyone leaves no transfers at all  <sub>src/features/trip-split/model/settle.test.ts:203</sub>
- a partial payment leaves the remainder outstanding  <sub>src/features/trip-split/model/settle.test.ts:212</sub>
- overpaying flips the balance rather than silently clamping  <sub>src/features/trip-split/model/settle.test.ts:217</sub>
- ignores payments naming someone who is no longer a member  <sub>src/features/trip-split/model/settle.test.ts:223</sub>
- returns nothing for no members  <sub>src/features/trip-split/model/settle.test.ts:231</sub>
- zeroes out with members but no expenses  <sub>src/features/trip-split/model/settle.test.ts:235</sub>
- splits a single expense evenly (2 people)  <sub>src/features/trip-split/model/settle.test.ts:241</sub>
- splits evenly 3 ways and minimizes transfers  <sub>src/features/trip-split/model/settle.test.ts:248</sub>
- nets out mutual expenses into the fewest transfers  <sub>src/features/trip-split/model/settle.test.ts:255</sub>
- honors weights normalized to the total  <sub>src/features/trip-split/model/settle.test.ts:269</sub>
- falls back to even when weights sum to zero  <sub>src/features/trip-split/model/settle.test.ts:279</sub>
- ignores blank amounts and unknown payers  <sub>src/features/trip-split/model/settle.test.ts:285</sub>
- skips a foreign-currency expense whose conversion was never captured  <sub>src/features/trip-split/model/settle.test.ts:297</sub>

## Build and publishing rules

**A destination's time zone is looked up from its verified coordinates.**

- resolves Sedona, AZ to America/Phoenix — the exact bug this exists to prevent  <sub>scripts/__tests__/lookup-tz.test.mjs:14</sub>
- resolves Honolulu, HI to Pacific/Honolulu  <sub>scripts/__tests__/lookup-tz.test.mjs:20</sub>
- resolves Seoul to Asia/Seoul (cross-check against an existing guide's known-good tz)  <sub>scripts/__tests__/lookup-tz.test.mjs:25</sub>
- returns an error for non-finite coordinates instead of guessing  <sub>scripts/__tests__/lookup-tz.test.mjs:30</sub>
- accepts numeric strings the same as numbers (CLI argv is always a string)  <sub>scripts/__tests__/lookup-tz.test.mjs:36</sub>

**A draft guide is invisible to site search, not just the curated grid.**

- drops any guide whose meta carries draft: true  <sub>scripts/build-search-index.test.mjs:15</sub>
- keeps a guide with no draft key at all (the normal, published shape)  <sub>scripts/build-search-index.test.mjs:20</sub>
- emits no record for a draft guide once publishedOnly has filtered it out  <sub>scripts/build-search-index.test.mjs:27</sub>

**A draft only becomes a published guide once it meets every requirement.**

- extracts a labeled field from a rendered issue body  <sub>scripts/__tests__/graduate-guide.test.mjs:16</sub>
- normalizes GitHub's _No response_ placeholder to empty  <sub>scripts/__tests__/graduate-guide.test.mjs:22</sub>
- returns empty for a missing field or empty body  <sub>scripts/__tests__/graduate-guide.test.mjs:27</sub>
- accepts lowercase-digits-single-hyphens  <sub>scripts/__tests__/graduate-guide.test.mjs:35</sub>
- rejects anything else  <sub>scripts/__tests__/graduate-guide.test.mjs:40</sub>
- resolves the flat-file shape  <sub>scripts/__tests__/graduate-guide.test.mjs:57</sub>
- resolves the split-directory shape  <sub>scripts/__tests__/graduate-guide.test.mjs:63</sub>
- returns null when neither shape exists  <sub>scripts/__tests__/graduate-guide.test.mjs:70</sub>
- graduates a flat-file draft — removes the draft key, preserves everything else  <sub>scripts/__tests__/graduate-guide.test.mjs:74</sub>
- graduates a split-directory draft — writes only _guide.json, never touches section files  <sub>scripts/__tests__/graduate-guide.test.mjs:84</sub>
- fails NOT_FOUND when neither shape exists  <sub>scripts/__tests__/graduate-guide.test.mjs:100</sub>
- fails NOT_DRAFT when the guide has already graduated (no draft key)  <sub>scripts/__tests__/graduate-guide.test.mjs:105</sub>
- prefers the flat file if both shapes somehow exist (defensive tie-break, not an expected case)  <sub>scripts/__tests__/graduate-guide.test.mjs:111</sub>

**A guide cannot publish with unsourced facts or broken references.**

- a clean published guide PASSes with no blockers  <sub>scripts/__tests__/verify-guide.test.mjs:28</sub>
- an empty-body section FAILs on the research (P0) gate  <sub>scripts/__tests__/verify-guide.test.mjs:39</sub>
- recency is advisory — a stale published guide still PASSes the verdict  <sub>scripts/__tests__/verify-guide.test.mjs:49</sub>
- a draft is exempt from recency  <sub>scripts/__tests__/verify-guide.test.mjs:57</sub>
- dead links (with --network) block the verdict  <sub>scripts/__tests__/verify-guide.test.mjs:63</sub>
- a Commons API failure marks content unverifiable and blocks (fail-closed, not fail-open)  <sub>scripts/__tests__/verify-guide.test.mjs:72</sub>
- every link probe failing (network outage) marks content unverifiable and blocks  <sub>scripts/__tests__/verify-guide.test.mjs:82</sub>
- a single flaky error link among otherwise-checked links stays advisory — still PASSes  <sub>scripts/__tests__/verify-guide.test.mjs:92</sub>
- a clean network check (no dead links, no missing photos, no outage) PASSes  <sub>scripts/__tests__/verify-guide.test.mjs:100</sub>
- a guide with no facts.json reports hygiene n/a and is unaffected  <sub>scripts/__tests__/verify-guide.test.mjs:116</sub>
- a malformed value in facts.json is surfaced in hygiene, but never blocks the verdict  <sub>scripts/__tests__/verify-guide.test.mjs:122</sub>
- a facts.json with none of the three defect classes reports hygiene clean  <sub>scripts/__tests__/verify-guide.test.mjs:132</sub>
- renders a passing scorecard with the marker, table, and checklist  <sub>scripts/__tests__/verify-guide.test.mjs:150</sub>
- renders NEEDS WORK with a collapsible blocking-findings list  <sub>scripts/__tests__/verify-guide.test.mjs:159</sub>
- shows a draft's recency as n/a and stale recency as advisory  <sub>scripts/__tests__/verify-guide.test.mjs:169</sub>
- lists dead links + missing photos when content failed  <sub>scripts/__tests__/verify-guide.test.mjs:174</sub>
- renders unverifiable content distinctly from a clean pass  <sub>scripts/__tests__/verify-guide.test.mjs:182</sub>
- renders a PASS header and the human checklist  <sub>scripts/__tests__/verify-guide.test.mjs:203</sub>
- renders NEEDS WORK with each blocking finding listed  <sub>scripts/__tests__/verify-guide.test.mjs:212</sub>
- reports content as skipped when --network wasn't run  <sub>scripts/__tests__/verify-guide.test.mjs:223</sub>
- reports dead links and missing photos when content failed  <sub>scripts/__tests__/verify-guide.test.mjs:227</sub>
- reports unverifiable content as a distinct do-NOT-publish state  <sub>scripts/__tests__/verify-guide.test.mjs:235</sub>
- reports draft recency as n/a  <sub>scripts/__tests__/verify-guide.test.mjs:245</sub>
- reports stale sections with their category/age/shelf-life  <sub>scripts/__tests__/verify-guide.test.mjs:250</sub>
- notes a `verified` field with no parseable date  <sub>scripts/__tests__/verify-guide.test.mjs:262</sub>
- returns an error and no results when --slug names a guide that doesn't exist  <sub>scripts/__tests__/verify-guide.test.mjs:285</sub>
- evaluates every guide when no --slug is given  <sub>scripts/__tests__/verify-guide.test.mjs:293</sub>
- filters to just the named guide when --slug is given  <sub>scripts/__tests__/verify-guide.test.mjs:303</sub>
- runs the network audits and folds dead links / missing photos into content when --network is set  <sub>scripts/__tests__/verify-guide.test.mjs:311</sub>
- folds a Commons API failure into an unverifiable, failing verdict (fail-closed on outage)  <sub>scripts/__tests__/verify-guide.test.mjs:325</sub>
- never runs the network audits when --network is not set  <sub>scripts/__tests__/verify-guide.test.mjs:336</sub>
- returns n/a for a slug without coverage.json (pre-P3 guide)  <sub>scripts/__tests__/verify-guide.test.mjs:346</sub>
- pre-P3 guides without coverage.json get coverage n/a and still PASS  <sub>scripts/__tests__/verify-guide.test.mjs:354</sub>

**A guide request cannot arrive missing the answers it needs.**

- has the same fields, in the same order, as the issue form  <sub>scripts/__tests__/intake-schema.test.mjs:49</sub>
- field "…" matches the form (kind, label, options)  <sub>scripts/__tests__/intake-schema.test.mjs:54</sub>
- maps direct fields  <sub>scripts/__tests__/intake-schema.test.mjs:87</sub>
- splits dates into start/end  <sub>scripts/__tests__/intake-schema.test.mjs:101</sub>
- collects priorities in rank order, dropping the null-ish choice  <sub>scripts/__tests__/intake-schema.test.mjs:106</sub>
- treats _No response_ and null-ish dropdown defaults as unset  <sub>scripts/__tests__/intake-schema.test.mjs:110</sub>
- validates: country required, extras allowed  <sub>scripts/__tests__/intake-schema.test.mjs:117</sub>
- renders "…"  <sub>scripts/__tests__/intake-schema.test.mjs:132</sub>

**A guide request submitted from the site reaches the maker intact.**

- a rendered body parses back to the same answers a human submission would  <sub>scripts/__tests__/intake-proxy.test.mjs:13</sub>
- renders '_No response_' for empty fields (so they parse back as unset)  <sub>scripts/__tests__/intake-proxy.test.mjs:35</sub>
- labels (auto-research) under the cap  <sub>scripts/__tests__/intake-proxy.test.mjs:45</sub>
- accepts but withHOLDS the label at/over the cap (queued for owner approval)  <sub>scripts/__tests__/intake-proxy.test.mjs:49</sub>
- rejects outright over the hard max  <sub>scripts/__tests__/intake-proxy.test.mjs:54</sub>
- honors custom thresholds  <sub>scripts/__tests__/intake-proxy.test.mjs:58</sub>
- derives the pair the Worker feeds intakeRateDecision  <sub>scripts/__tests__/intake-proxy.test.mjs:65</sub>
- AUTO_CAP=0 queues EVERYTHING for approval rather than rejecting everything  <sub>scripts/__tests__/intake-proxy.test.mjs:68</sub>
- falls back to the default rather than DISABLING the cap on a garbage value  <sub>scripts/__tests__/intake-proxy.test.mjs:77</sub>
- mirrors the scaffolder's slugify  <sub>scripts/__tests__/intake-proxy.test.mjs:86</sub>

**A guide's sources are primary ones, not a pile of aggregators.**

- groups subdomains into their registrable domain  <sub>scripts/__tests__/check-source-mix.test.mjs:15</sub>
- keeps two-label public suffixes whole — visitor.co.jp is not co.jp  <sub>scripts/__tests__/check-source-mix.test.mjs:19</sub>
- returns null for garbage rather than throwing  <sub>scripts/__tests__/check-source-mix.test.mjs:23</sub>
- counts distinct domains and the top share  <sub>scripts/__tests__/check-source-mix.test.mjs:29</sub>
- passes a healthy mix and fails a monoculture past the ceiling  <sub>scripts/__tests__/check-source-mix.test.mjs:40</sub>
- the ceiling is a ratchet: set above the measured worst real guide (us, 25%)  <sub>scripts/__tests__/check-source-mix.test.mjs:48</sub>
- detects destination-ccTLD presence  <sub>scripts/__tests__/check-source-mix.test.mjs:52</sub>
- reports ccTLD as n/a for the US — .us is unused by real US institutions  <sub>scripts/__tests__/check-source-mix.test.mjs:60</sub>
- handles a guide with zero citations without dividing by zero  <sub>scripts/__tests__/check-source-mix.test.mjs:66</sub>

**A looked-up location must match the venue's name, or it is left blank.**

- ignores case, accents and punctuation  <sub>scripts/__tests__/geocode-venues.test.mjs:17</sub>
- prefers a written address — the strongest disambiguator the guide already holds  <sub>scripts/__tests__/geocode-venues.test.mjs:26</sub>
- falls back through area, then city, then country  <sub>scripts/__tests__/geocode-venues.test.mjs:31</sub>
- sends the bare name when the guide offers no context at all  <sub>scripts/__tests__/geocode-venues.test.mjs:37</sub>
- accepts an exact match  <sub>scripts/__tests__/geocode-venues.test.mjs:43</sub>
- accepts a longer official name containing the guide's name  <sub>scripts/__tests__/geocode-venues.test.mjs:47</sub>
- accepts word-order and article differences via token overlap  <sub>scripts/__tests__/geocode-venues.test.mjs:52</sub>
- REJECTS a substitution — the failure that would ship a wrong coordinate  <sub>scripts/__tests__/geocode-venues.test.mjs:56</sub>
- rejects a result with no coordinates rather than writing a partial record  <sub>scripts/__tests__/geocode-venues.test.mjs:62</sub>
- rejects lookup errors and not-founds, carrying the reason through  <sub>scripts/__tests__/geocode-venues.test.mjs:66</sub>
- does not accept on short-word overlap alone  <sub>scripts/__tests__/geocode-venues.test.mjs:73</sub>
- returns only items still missing something, and says which  <sub>scripts/__tests__/geocode-venues.test.mjs:92</sub>
- ignores sections that do not describe places  <sub>scripts/__tests__/geocode-venues.test.mjs:99</sub>
- folds Nordic letters instead of shredding the word  <sub>scripts/__tests__/geocode-venues.test.mjs:108</sub>
- lets a Danish venue match itself  <sub>scripts/__tests__/geocode-venues.test.mjs:114</sub>
- refuses a class of thing that is, by design, everywhere  <sub>scripts/__tests__/geocode-venues.test.mjs:124</sub>
- leaves real venues alone, including parenthetical local-script names  <sub>scripts/__tests__/geocode-venues.test.mjs:131</sub>
- is enforced by acceptMatch before any name comparison  <sub>scripts/__tests__/geocode-venues.test.mjs:137</sub>
- rejects a same-named place on another continent  <sub>scripts/__tests__/geocode-venues.test.mjs:154</sub>
- rejects a same-named place in another city of the same country  <sub>scripts/__tests__/geocode-venues.test.mjs:161</sub>
- keeps every genuine result in the file  <sub>scripts/__tests__/geocode-venues.test.mjs:166</sub>
- declines to judge when there are too few results to establish a centre  <sub>scripts/__tests__/geocode-venues.test.mjs:171</sub>
- leaves already-rejected rows untouched  <sub>scripts/__tests__/geocode-venues.test.mjs:176</sub>
- judges an anchored row against its OWN coordinates, not the file median  <sub>scripts/__tests__/geocode-venues.test.mjs:199</sub>
- still rejects an anchored row whose place_id result lands somewhere else entirely  <sub>scripts/__tests__/geocode-venues.test.mjs:206</sub>
- excludes anchored rows from the median used to judge everyone else  <sub>scripts/__tests__/geocode-venues.test.mjs:213</sub>
- measures the Tokyo→Osaka gap that motivated the check  <sub>scripts/__tests__/geocode-venues.test.mjs:228</sub>

**A migrated fact's value never carries a stray trailing separator, and the**

- strips a trailing comma  <sub>scripts/__tests__/migrate-facts.test.mjs:19</sub>
- strips a trailing period  <sub>scripts/__tests__/migrate-facts.test.mjs:22</sub>
- strips a run of trailing separators  <sub>scripts/__tests__/migrate-facts.test.mjs:25</sub>
- leaves a clean value untouched  <sub>scripts/__tests__/migrate-facts.test.mjs:28</sub>
- leaves an interior decimal untouched  <sub>scripts/__tests__/migrate-facts.test.mjs:31</sub>
- does not swallow the separator in a comma-separated list of options  <sub>scripts/__tests__/migrate-facts.test.mjs:40</sub>
- does not swallow a full stop ending a sentence  <sub>scripts/__tests__/migrate-facts.test.mjs:45</sub>
- does not swallow a trailing comma with nothing after it  <sub>scripts/__tests__/migrate-facts.test.mjs:50</sub>
- still captures a full comma-grouped, decimal value intact  <sub>scripts/__tests__/migrate-facts.test.mjs:55</sub>
- still captures plain thousands-grouping (¥11,410, unit-first JPY)  <sub>scripts/__tests__/migrate-facts.test.mjs:60</sub>
- still captures unit-last currency codes (100 DKK)  <sub>scripts/__tests__/migrate-facts.test.mjs:65</sub>
- never emits a raw/value ending in a bare separator, across all three MONEY_RE branches  <sub>scripts/__tests__/migrate-facts.test.mjs:70</sub>
- collapses the SAME claim + value cited from two different source_urls into one row  <sub>scripts/__tests__/migrate-facts.test.mjs:101</sub>
- does NOT collapse the same value under a DIFFERENT claim label — only the stem must match  <sub>scripts/__tests__/migrate-facts.test.mjs:139</sub>
- still collapses repeats from the SAME source (the original one-fact-one-row behavior)  <sub>scripts/__tests__/migrate-facts.test.mjs:167</sub>
- produces clean values end-to-end from fixture-shaped prose (no trailing punctuation reaches facts.json)  <sub>scripts/__tests__/migrate-facts.test.mjs:187</sub>

**A new guide starts from a valid, complete skeleton every time.**

- lowercases and hyphenates  <sub>scripts/__tests__/scaffold-guide.test.mjs:16</sub>
- strips accents  <sub>scripts/__tests__/scaffold-guide.test.mjs:20</sub>
- collapses runs of non-alphanumeric characters into one hyphen  <sub>scripts/__tests__/scaffold-guide.test.mjs:24</sub>
- strips leading/trailing hyphens  <sub>scripts/__tests__/scaffold-guide.test.mjs:28</sub>
- falls back to "guide" for empty/falsy input  <sub>scripts/__tests__/scaffold-guide.test.mjs:32</sub>
- produces one label per day in an inclusive range  <sub>scripts/__tests__/scaffold-guide.test.mjs:40</sub>
- produces a single label when start === end  <sub>scripts/__tests__/scaffold-guide.test.mjs:44</sub>
- falls back to a single day when end is missing  <sub>scripts/__tests__/scaffold-guide.test.mjs:48</sub>
- falls back to a single day when end is before start  <sub>scripts/__tests__/scaffold-guide.test.mjs:52</sub>
- returns [] when start can't be parsed  <sub>scripts/__tests__/scaffold-guide.test.mjs:56</sub>
- caps at 30 days for an overlong range  <sub>scripts/__tests__/scaffold-guide.test.mjs:61</sub>
- wires weather + holidays + map when the country resolves to capital coords  <sub>scripts/__tests__/scaffold-guide.test.mjs:67</sub>
- omits weather/holidays/map for an unrecognized country (never invents coords)  <sub>scripts/__tests__/scaffold-guide.test.mjs:75</sub>
- prefers explicit coords over the country capital  <sub>scripts/__tests__/scaffold-guide.test.mjs:83</sub>
- defaults to 7 generic day cards when no dayLabels are given  <sub>scripts/__tests__/scaffold-guide.test.mjs:89</sub>
- uses supplied dayLabels verbatim, one day card each  <sub>scripts/__tests__/scaffold-guide.test.mjs:95</sub>
- adds a Highlights section only when a niche is given  <sub>scripts/__tests__/scaffold-guide.test.mjs:102</sub>
- is born draft:true, provenance:strict, with the draft stamp and a valid roomId  <sub>scripts/__tests__/scaffold-guide.test.mjs:109</sub>
- titles the guide from cities + country when no explicit title is given  <sub>scripts/__tests__/scaffold-guide.test.mjs:117</sub>
- prefers an explicit title over the derived one  <sub>scripts/__tests__/scaffold-guide.test.mjs:122</sub>
- uses the country's currency symbol in the budget section, defaulting to $  <sub>scripts/__tests__/scaffold-guide.test.mjs:127</sub>
- sizes the budget's `days` to the itinerary length  <sub>scripts/__tests__/scaffold-guide.test.mjs:134</sub>
- passes the intake budget target through to the budget section  <sub>scripts/__tests__/scaffold-guide.test.mjs:139</sub>
- omits budgetTarget when no budget answer is given  <sub>scripts/__tests__/scaffold-guide.test.mjs:144</sub>
- seeds a valid Composer phase on every foldable-group section, and none on Plan/Days/Sources  <sub>scripts/__tests__/scaffold-guide.test.mjs:152</sub>
- fills in the supplied answers  <sub>scripts/__tests__/scaffold-guide.test.mjs:166</sub>
- leaves blanks honest (no invented placeholder text) when answers are missing  <sub>scripts/__tests__/scaffold-guide.test.mjs:188</sub>
- maps each priority to its group with 1-indexed rank  <sub>scripts/__tests__/scaffold-guide.test.mjs:197</sub>
- first priority to claim a group wins (Food before Shopping)  <sub>scripts/__tests__/scaffold-guide.test.mjs:204</sub>
- returns empty for no priorities  <sub>scripts/__tests__/scaffold-guide.test.mjs:209</sub>
- maps niche interest to Highlights  <sub>scripts/__tests__/scaffold-guide.test.mjs:213</sub>
- maps every known priority label to a group  <sub>scripts/__tests__/scaffold-guide.test.mjs:217</sub>
- applies rank to sections whose group matches a priority  <sub>scripts/__tests__/scaffold-guide.test.mjs:225</sub>
- does not add rank to groups with no matching priority  <sub>scripts/__tests__/scaffold-guide.test.mjs:233</sub>
- no priorities means no ranks anywhere  <sub>scripts/__tests__/scaffold-guide.test.mjs:239</sub>
- extracts non-empty asks from answers  <sub>scripts/__tests__/scaffold-guide.test.mjs:246</sub>
- omits empty/missing answers  <sub>scripts/__tests__/scaffold-guide.test.mjs:261</sub>
- includes niche only when provided  <sub>scripts/__tests__/scaffold-guide.test.mjs:266</sub>
- parses normal --flag value pairs  <sub>scripts/__tests__/scaffold-guide.test.mjs:275</sub>
- a flag directly followed by another flag gets true, NOT the next flag's name as its value  <sub>scripts/__tests__/scaffold-guide.test.mjs:281</sub>
- a trailing flag with nothing after it gets true, not undefined-as-a-string  <sub>scripts/__tests__/scaffold-guide.test.mjs:288</sub>
- handles an all-flags-no-values argv without throwing  <sub>scripts/__tests__/scaffold-guide.test.mjs:294</sub>
- extracts a bare, deliberately-capitalized code  <sub>scripts/__tests__/scaffold-guide.test.mjs:300</sub>
- extracts a code mentioned inline, capitalized, among lowercase prose  <sub>scripts/__tests__/scaffold-guide.test.mjs:304</sub>
- does NOT guess from a lowercase word — a false positive would be worse than no row  <sub>scripts/__tests__/scaffold-guide.test.mjs:309</sub>
- does not guess from a bare city name with no code at all  <sub>scripts/__tests__/scaffold-guide.test.mjs:314</sub>
- null for empty/absent input  <sub>scripts/__tests__/scaffold-guide.test.mjs:323</sub>

**A research run cannot be marked done while sources are missing.**

- flags an undated precise-looking hour with no verified_on, as advisory only  <sub>scripts/audit/check-research.test.mjs:19</sub>
- flags an undated price figure with no verified_on, as advisory only  <sub>scripts/audit/check-research.test.mjs:29</sub>
- does not flag a section that carries verified_on  <sub>scripts/audit/check-research.test.mjs:38</sub>
- extends to item-level provenance on days/sights/budget (previously skipped entirely)  <sub>scripts/audit/check-research.test.mjs:47</sub>
- does not flag an item that already carries its own verified_on  <sub>scripts/audit/check-research.test.mjs:71</sub>
- does not flag durable prose with no hour/price-looking text  <sub>scripts/audit/check-research.test.mjs:85</sub>
- does not flag a day whose only hard fact lives in an already-dated plan_b  <sub>scripts/audit/check-research.test.mjs:99</sub>
- still flags a day whose OWN body has an undated hard fact alongside a covered plan_b  <sub>scripts/audit/check-research.test.mjs:117</sub>
- promotes an undated price to a blocking warn on a strict guide  <sub>scripts/audit/check-research.test.mjs:137</sub>
- stays advisory (info, non-blocking) on a non-strict guide with the identical fact  <sub>scripts/audit/check-research.test.mjs:147</sub>
- a dated price on a strict guide stays clean (no D2 finding at all)  <sub>scripts/audit/check-research.test.mjs:156</sub>
- an honestly ⚠-flagged figure stays advisory even on a strict guide — the flag is not a violation to escalate  <sub>scripts/audit/check-research.test.mjs:166</sub>
- promotes item-level undated figures too — the gap the schema's DATED_TYPES gate never covered  <sub>scripts/audit/check-research.test.mjs:176</sub>
- promotes an item-level undated ≈ the same as a bare figure — ≈ is not exempt, only ⚠ is  <sub>scripts/audit/check-research.test.mjs:188</sub>
- never flags a list[] item at the item level — a bare string has no field to hang a per-item verified_on on  <sub>scripts/audit/check-research.test.mjs:200</sub>
- still catches a list[] section's undated hard fact at the SECTION level, promoted to warn under strict  <sub>scripts/audit/check-research.test.mjs:212</sub>

**A research run's own record cannot contradict itself.**

- counts only truthy stages  <sub>scripts/__tests__/check-run-integrity.test.mjs:60</sub>
- no state / no stages → 0  <sub>scripts/__tests__/check-run-integrity.test.mjs:63</sub>
- attributes each stage to the FIRST commit that recorded it, not the latest  <sub>scripts/__tests__/check-run-integrity.test.mjs:70</sub>
- carries the stage's own checkpoint timestamp  <sub>scripts/__tests__/check-run-integrity.test.mjs:77</sub>
- un-cleared stages are absent  <sub>scripts/__tests__/check-run-integrity.test.mjs:80</sub>
- a healthy run produces no findings  <sub>scripts/__tests__/check-run-integrity.test.mjs:86</sub>
- REGRESSION (F1a · Japan, literal history): the commit labelled Pass A already carried every stage  <sub>scripts/__tests__/check-run-integrity.test.mjs:90</sub>
- REGRESSION (F1 · Japan): a burst of distinct commits is still caught  <sub>scripts/__tests__/check-run-integrity.test.mjs:99</sub>
- two stages sharing one commit are caught as BATCHED_COMMIT  <sub>scripts/__tests__/check-run-integrity.test.mjs:112</sub>
- a stage inherited from a PRIOR run is never blamed on this one  <sub>scripts/__tests__/check-run-integrity.test.mjs:121</sub>
- a run that clears a single stage has nothing to violate  <sub>scripts/__tests__/check-run-integrity.test.mjs:128</sub>
- the gap floor is configurable — a stricter floor condemns a run the default clears  <sub>scripts/__tests__/check-run-integrity.test.mjs:132</sub>
- the default floor sits far below any real stage duration  <sub>scripts/__tests__/check-run-integrity.test.mjs:141</sub>
- no new commit and no stage advanced → VOID  <sub>scripts/__tests__/check-run-integrity.test.mjs:148</sub>
- a new commit → not void  <sub>scripts/__tests__/check-run-integrity.test.mjs:151</sub>
- a stage advanced → not void even if HEAD somehow matches  <sub>scripts/__tests__/check-run-integrity.test.mjs:154</sub>
- a REGRESSED stage count is not treated as progress  <sub>scripts/__tests__/check-run-integrity.test.mjs:157</sub>
- a void run says so unmistakably and names the green-status trap  <sub>scripts/__tests__/check-run-integrity.test.mjs:163</sub>
- a clean run reports both gates green  <sub>scripts/__tests__/check-run-integrity.test.mjs:168</sub>
- findings are listed with their kind  <sub>scripts/__tests__/check-run-integrity.test.mjs:173</sub>
- points at the committed intake state file  <sub>scripts/__tests__/check-run-integrity.test.mjs:185</sub>

**A research run's record is appended, never overwritten.**

- includes workflow, slug, model, attempts, and run url  <sub>scripts/__tests__/append-run-report.test.mjs:11</sub>
- omits the attempts line when there is no state file (attempts null)  <sub>scripts/__tests__/append-run-report.test.mjs:24</sub>
- appends the agent's run-report note when present  <sub>scripts/__tests__/append-run-report.test.mjs:29</sub>
- degrades gracefully with missing fields  <sub>scripts/__tests__/append-run-report.test.mjs:35</sub>

**A revision plan is checked before anything is changed.**

- accepts a well-formed plan with no blocking forks  <sub>scripts/__tests__/validate-revision-plan.test.mjs:29</sub>
- rejects a plan naming a section that does not exist (the silent-void seam)  <sub>scripts/__tests__/validate-revision-plan.test.mjs:33</sub>
- rejects a nonexistent rippleCheck group too  <sub>scripts/__tests__/validate-revision-plan.test.mjs:40</sub>
- rejects an over-cap plan with the route-to-research-pass message (Q5 default)  <sub>scripts/__tests__/validate-revision-plan.test.mjs:46</sub>
- rejects an empty reResearch with the route-to-modify message  <sub>scripts/__tests__/validate-revision-plan.test.mjs:55</sub>
- surfaces blocking forks as exit-3 semantics — valid plan, forks returned  <sub>scripts/__tests__/validate-revision-plan.test.mjs:61</sub>
- a blocking fork without options/recommendation is a plan ERROR, not a gate  <sub>scripts/__tests__/validate-revision-plan.test.mjs:73</sub>
- rejects a self-correct budget above the cap  <sub>scripts/__tests__/validate-revision-plan.test.mjs:81</sub>
- rejects garbage without throwing  <sub>scripts/__tests__/validate-revision-plan.test.mjs:87</sub>

**A revision request is read exactly as written, and a malformed one is refused.**

- splits a comma list and trims each token  <sub>scripts/__tests__/parse-revise-issue.test.mjs:12</sub>
- drops tokens that fail the injection guard, keeps the rest  <sub>scripts/__tests__/parse-revise-issue.test.mjs:17</sub>
- caps the list to stop a comma-bomb  <sub>scripts/__tests__/parse-revise-issue.test.mjs:22</sub>
- returns empty for blank / undefined  <sub>scripts/__tests__/parse-revise-issue.test.mjs:27</sub>
- accepts a bare ISO date  <sub>scripts/__tests__/parse-revise-issue.test.mjs:34</sub>
- drops anything else  <sub>scripts/__tests__/parse-revise-issue.test.mjs:38</sub>
- parses a well-formed revise issue body  <sub>scripts/__tests__/parse-revise-issue.test.mjs:49</sub>
- falls back to the MODIFY template's shape (escalated issue, ruling #1)  <sub>scripts/__tests__/parse-revise-issue.test.mjs:58</sub>
- lowercases and trims the slug, rejects invalid ones  <sub>scripts/__tests__/parse-revise-issue.test.mjs:69</sub>
- throws when neither template's change field is present  <sub>scripts/__tests__/parse-revise-issue.test.mjs:74</sub>
- sections and deadline are optional  <sub>scripts/__tests__/parse-revise-issue.test.mjs:78</sub>

**A stylesheet nothing imports ships as a file nobody sees.**

- found the stylesheets  <sub>scripts/__tests__/no-orphan-stylesheets.test.mjs:51</sub>
- ⌁ every .css file is imported by at least one other file  <sub>scripts/__tests__/no-orphan-stylesheets.test.mjs:55</sub>
- ⌁ the gate can actually fail — each sheet is vouched for by its OWN path  <sub>scripts/__tests__/no-orphan-stylesheets.test.mjs:67</sub>
- ⌁ the Tools station's own stylesheet is imported by the guide layout  <sub>scripts/__tests__/no-orphan-stylesheets.test.mjs:84</sub>
- ⌁ every allowance still names a file that exists  <sub>scripts/__tests__/no-orphan-stylesheets.test.mjs:90</sub>

**A venue that has closed down cannot stay in a guide.**

- collects venues items and named map points, not sights or prose  <sub>scripts/__tests__/check-venue-status.test.mjs:27</sub>
- builds a scoped query  <sub>scripts/__tests__/check-venue-status.test.mjs:31</sub>
- is n/a with no key — inert until configured, never a silent pass  <sub>scripts/__tests__/check-venue-status.test.mjs:38</sub>
- passes when everything is OPERATIONAL  <sub>scripts/__tests__/check-venue-status.test.mjs:44</sub>
- BLOCKS on CLOSED_PERMANENTLY — the MangoPlate class  <sub>scripts/__tests__/check-venue-status.test.mjs:51</sub>
- only ADVISES on notFound — a fuzzy query miss must not block a guide  <sub>scripts/__tests__/check-venue-status.test.mjs:61</sub>
- only ADVISES on CLOSED_TEMPORARILY  <sub>scripts/__tests__/check-venue-status.test.mjs:69</sub>
- treats a full outage as n/a, not a clean bill — fail-closed like the link checker  <sub>scripts/__tests__/check-venue-status.test.mjs:75</sub>
- a single API error skips that venue without inventing a finding  <sub>scripts/__tests__/check-venue-status.test.mjs:81</sub>
- passes trivially on a guide with no venues at all  <sub>scripts/__tests__/check-venue-status.test.mjs:88</sub>

**An automated guide edit must state exactly what it is changing.**

- has the same fields, in the same order  <sub>scripts/__tests__/modify-schema.test.mjs:50</sub>
- labels match exactly — the parser matches on these strings  <sub>scripts/__tests__/modify-schema.test.mjs:54</sub>
- field kinds match  <sub>scripts/__tests__/modify-schema.test.mjs:58</sub>
- required-ness matches  <sub>scripts/__tests__/modify-schema.test.mjs:62</sub>
- the form self-applies the label the workflow gates on  <sub>scripts/__tests__/modify-schema.test.mjs:66</sub>
- round-trips through the parser — what the wizard sends is what the pipeline reads  <sub>scripts/__tests__/modify-schema.test.mjs:72</sub>
- uses the template the workflow expects  <sub>scripts/__tests__/modify-schema.test.mjs:89</sub>
- omits blank optional fields instead of sending empty params  <sub>scripts/__tests__/modify-schema.test.mjs:94</sub>
- caps the change text at the documented limit  <sub>scripts/__tests__/modify-schema.test.mjs:99</sub>
- is the same function the parser applies  <sub>scripts/__tests__/modify-schema.test.mjs:106</sub>

**An edit request is read exactly as written, and a malformed one is refused.**

- keeps a normal section label untouched  <sub>scripts/__tests__/parse-modify-issue.test.mjs:12</sub>
- collapses a multi-line injection payload to its (safe) first line  <sub>scripts/__tests__/parse-modify-issue.test.mjs:19</sub>
- blanks a single-line value carrying structural / injection punctuation  <sub>scripts/__tests__/parse-modify-issue.test.mjs:27</sub>
- caps length at 80 characters  <sub>scripts/__tests__/parse-modify-issue.test.mjs:34</sub>
- returns empty for empty / undefined / null  <sub>scripts/__tests__/parse-modify-issue.test.mjs:38</sub>
- parses a well-formed issue body  <sub>scripts/__tests__/parse-modify-issue.test.mjs:49</sub>
- sanitizes the section field as part of parsing  <sub>scripts/__tests__/parse-modify-issue.test.mjs:57</sub>
- lowercases and trims the slug  <sub>scripts/__tests__/parse-modify-issue.test.mjs:63</sub>
- throws on a missing slug  <sub>scripts/__tests__/parse-modify-issue.test.mjs:68</sub>
- throws on an invalid / path-traversal slug  <sub>scripts/__tests__/parse-modify-issue.test.mjs:72</sub>
- throws on a missing change  <sub>scripts/__tests__/parse-modify-issue.test.mjs:78</sub>

**Assembling a guide from its parts loses nothing and reorders nothing.**

- is deterministic: same units ⇒ byte-identical output  <sub>scripts/__tests__/compose-guide.test.mjs:39</sub>
- is idempotent: composing a composition changes nothing further  <sub>scripts/__tests__/compose-guide.test.mjs:47</sub>
- CATALOG: every real guide composes without error and without losing a single unit  <sub>scripts/__tests__/compose-guide.test.mjs:55</sub>
- IDENTITY: the dense guides (korea, denmark) compose to exactly themselves  <sub>scripts/__tests__/compose-guide.test.mjs:65</sub>
- SPINE: a near-empty foldable spine group folds unit-by-unit to each unit's phase host  <sub>scripts/__tests__/compose-guide.test.mjs:80</sub>
- SPINE: Plan, Days and Sources never fold, however small  <sub>scripts/__tests__/compose-guide.test.mjs:97</sub>
- MERGE: a below-threshold theme folds; unit count is always preserved  <sub>scripts/__tests__/compose-guide.test.mjs:106</sub>
- ORDER: a folded arrival never hoists its host's tab slot (the us fold's lesson)  <sub>scripts/__tests__/compose-guide.test.mjs:114</sub>
- ANCHOR: a top-2-ranked theme with real weight keeps its tab and is immune to budget merges  <sub>scripts/__tests__/compose-guide.test.mjs:130</sub>
- ORDER: rank pulls a tagged theme forward in the non-spine block; Sources stays last  <sub>scripts/__tests__/compose-guide.test.mjs:142</sub>
- BUDGET + ⚠ GUARD: a forced merge that would relocate a flagged unit fails loudly, not silently  <sub>scripts/__tests__/compose-guide.test.mjs:152</sub>
- BUDGET: without a ⚠ in the smallest candidate, the forced merge proceeds and lands within budget  <sub>scripts/__tests__/compose-guide.test.mjs:166</sub>
- derives weight from items and prose length — never a stored field  <sub>scripts/__tests__/compose-guide.test.mjs:180</sub>
- sees a ⚠ anywhere in the unit  <sub>scripts/__tests__/compose-guide.test.mjs:185</sub>
- lets drafts through  <sub>scripts/__tests__/compose-guide.test.mjs:192</sub>
- refuses a live guide without the creator's explicit flag  <sub>scripts/__tests__/compose-guide.test.mjs:195</sub>
- lets a live guide through ONLY with --creator-signed  <sub>scripts/__tests__/compose-guide.test.mjs:198</sub>
- checking the guide with a standing proposal (us) leaves every byte on disk untouched  <sub>scripts/__tests__/compose-guide.test.mjs:204</sub>

**Build tool versions stay pinned, so a build is reproducible.**

- both package.json files still declare an esbuild version/range at all  <sub>scripts/__tests__/esbuild-pin.test.mjs:27</sub>
- the pin is a same-major-line version as astro's declared minimum (0.x, not a different major)  <sub>scripts/__tests__/esbuild-pin.test.mjs:32</sub>
- the pin's minor version is not more than one ahead of astro's declared minimum minor  <sub>scripts/__tests__/esbuild-pin.test.mjs:39</sub>

**Code checks run over the whole repository, with nothing quietly excluded.**

- every lintable file under a CI-ignored path is also eslint-ignored  <sub>scripts/__tests__/lint-ci-scope.test.mjs:69</sub>

**Colours pulled from a cover image are real colours from that image.**

- picks the dominant hue of a solid vivid-red image  <sub>scripts/__tests__/extract-palette.test.mjs:20</sub>
- picks the dominant hue of a solid vivid-green image  <sub>scripts/__tests__/extract-palette.test.mjs:30</sub>
- returns null for an all-gray image (every pixel below the saturation floor)  <sub>scripts/__tests__/extract-palette.test.mjs:37</sub>
- returns null for a near-black (crushed) image  <sub>scripts/__tests__/extract-palette.test.mjs:42</sub>
- returns null for a near-white (blown) image  <sub>scripts/__tests__/extract-palette.test.mjs:47</sub>
- prefers a smaller vivid subject over a larger, more saturated sky/water field (the sky-suppression rule)  <sub>scripts/__tests__/extract-palette.test.mjs:52</sub>
- keeps the sky/water hue when nothing else clears the subject threshold (open ocean — honest, not forced)  <sub>scripts/__tests__/extract-palette.test.mjs:74</sub>
- finds a passing lightness for a saturated hue, closest to the requested l0  <sub>scripts/__tests__/extract-palette.test.mjs:83</sub>
- the picked colour actually passes the ≥3.0:1 floor on both grounds  <sub>scripts/__tests__/extract-palette.test.mjs:90</sub>

**Every guide has its own shared-budget room, and a swap leaves a trail.**

- there is at least one guide to check (guards a vacuous pass)  <sub>scripts/__tests__/guide-room-id.test.mjs:49</sub>
- every guide declares a roomId matching what the RTDB rules require  <sub>scripts/__tests__/guide-room-id.test.mjs:53</sub>
- no two guides share a room code — one code is one trip's budget  <sub>scripts/__tests__/guide-room-id.test.mjs:68</sub>
- an uncommitted roomId change is declared, not silent  <sub>scripts/__tests__/guide-room-id.test.mjs:79</sub>

**Every guide is stored in the same shape, with no exceptions.**

- there is at least one guide to check (guards a vacuous pass)  <sub>scripts/__tests__/guide-shape-uniform.test.mjs:19</sub>
- no guide is a flat <slug>.json — every trip is a directory  <sub>scripts/__tests__/guide-shape-uniform.test.mjs:23</sub>
- every guide directory has a _guide.json and at least one NN-<group>.json  <sub>scripts/__tests__/guide-shape-uniform.test.mjs:33</sub>
- every guide directory carries a facts.json — the perishable-fact registry  <sub>scripts/__tests__/guide-shape-uniform.test.mjs:47</sub>

**Every guide's accent colour keeps its text readable.**

- no stylesheet paints text straight from --accent — --accent-ink/--aink only  <sub>scripts/__tests__/accent-ink-contract.test.mjs:64</sub>

**Everything flagged verify-before-you-go is re-checked before departure.**

- finds a guide whose trip starts within 7 days, sorted soonest-first  <sub>scripts/pretrip-check.test.mjs:66</sub>
- excludes a trip more than 7 days out  <sub>scripts/pretrip-check.test.mjs:73</sub>
- excludes a trip already in the past  <sub>scripts/pretrip-check.test.mjs:78</sub>
- excludes a draft guide even if its dates would otherwise qualify  <sub>scripts/pretrip-check.test.mjs:83</sub>
- excludes an archived guide even if its dates would otherwise qualify  <sub>scripts/pretrip-check.test.mjs:88</sub>
- skips a guide with no days[] section at all, rather than throwing  <sub>scripts/pretrip-check.test.mjs:93</sub>
- includes a trip starting exactly today (0 days out)  <sub>scripts/pretrip-check.test.mjs:98</sub>
- reports an honest 'nothing in window' when the list is empty  <sub>scripts/pretrip-check.test.mjs:112</sub>
- reports a guide with no stale facts as current  <sub>scripts/pretrip-check.test.mjs:117</sub>
- reports a guide WITH stale facts and points at the recert commands  <sub>scripts/pretrip-check.test.mjs:124</sub>

**Exchange rates are refreshed from the published source with the date recorded.**

- rounds high-magnitude currencies to whole units  <sub>scripts/__tests__/refresh-fx.test.mjs:12</sub>
- keeps one decimal in the tens  <sub>scripts/__tests__/refresh-fx.test.mjs:16</sub>
- keeps three decimals below ten, where EUR/GBP live  <sub>scripts/__tests__/refresh-fx.test.mjs:19</sub>
- returns null for a non-finite value rather than emitting NaN into source  <sub>scripts/__tests__/refresh-fx.test.mjs:23</sub>
- always includes USD as exactly 1 without asking the API  <sub>scripts/__tests__/refresh-fx.test.mjs:32</sub>
- reports currencies the feed does not publish instead of inventing them  <sub>scripts/__tests__/refresh-fx.test.mjs:42</sub>
- throws a named error on a non-ok response rather than writing a broken table  <sub>scripts/__tests__/refresh-fx.test.mjs:50</sub>
- emits a parseable block carrying the as-of date  <sub>scripts/__tests__/refresh-fx.test.mjs:56</sub>
- replaces the existing block in place, leaving surrounding source untouched  <sub>scripts/__tests__/refresh-fx.test.mjs:63</sub>
- throws rather than silently appending when the block can't be found  <sub>scripts/__tests__/refresh-fx.test.mjs:79</sub>
- returns a sorted, de-duplicated set of the codes actually in use  <sub>scripts/__tests__/refresh-fx.test.mjs:85</sub>

**Generated room codes are long and random enough not to be guessed.**

- defaults to 16 characters — the RTDB rules' write-gate minimum  <sub>scripts/__tests__/gen-room-id.test.mjs:12</sub>
- honors an explicit length  <sub>scripts/__tests__/gen-room-id.test.mjs:16</sub>
- draws only from lowercase letters and digits  <sub>scripts/__tests__/gen-room-id.test.mjs:21</sub>
- matches the roomId schema regex in content.config.ts  <sub>scripts/__tests__/gen-room-id.test.mjs:27</sub>
- produces different ids across calls  <sub>scripts/__tests__/gen-room-id.test.mjs:31</sub>

**Guide writing stays readable — no new wall-of-text paragraphs, no sentence-shaped prices.**

- scans real guide content rather than passing on an empty set  <sub>scripts/__tests__/prose-shape.test.mjs:14</sub>
- thresholds still reflect the corpus they were measured from  <sub>scripts/__tests__/prose-shape.test.mjs:21</sub>
- introduces no new over-long paragraph and no new sentence-shaped price  <sub>scripts/__tests__/prose-shape.test.mjs:29</sub>
- the baseline never grows silently  <sub>scripts/__tests__/prose-shape.test.mjs:44</sub>

**Old facts are caught before a guide is republished.**

- flags a stale verified_on on a section itself  <sub>scripts/audit/check-staleness.test.mjs:83</sub>
- flags a stale verified_on nested inside a section's items[]  <sub>scripts/audit/check-staleness.test.mjs:90</sub>
- does not flag an item with no verified_on  <sub>scripts/audit/check-staleness.test.mjs:98</sub>
- flags a stale fact that lives in facts.json, not in a section  <sub>scripts/audit/check-staleness.test.mjs:106</sub>
- names the fact by id AND claim, so the punch list is greppable  <sub>scripts/audit/check-staleness.test.mjs:117</sub>
- leaves a fact inside its shelf life alone  <sub>scripts/audit/check-staleness.test.mjs:123</sub>
- skips an archived guide entirely, listing it in `archived` not `sections`/`stale`  <sub>scripts/audit/check-staleness.test.mjs:130</sub>
- check-staleness.mjs's copy deep-equals src/lib/staleness.ts's  <sub>scripts/audit/check-staleness.test.mjs:139</sub>

**One build serves every screen — no device decides which layout a reader gets.**

- found the source tree  <sub>scripts/__tests__/no-device-checks.test.mjs:85</sub>
- ⌁ no unlisted file branches on a device or a viewport number  <sub>scripts/__tests__/no-device-checks.test.mjs:89</sub>
- ⌁ every allowance still points at a file that exists and still needs it  <sub>scripts/__tests__/no-device-checks.test.mjs:111</sub>
- ⌁ the guide body itself has none at all  <sub>scripts/__tests__/no-device-checks.test.mjs:125</sub>

**Patterns drawn from feedback reflect what people actually reported.**

- a healthy trip trips nothing  <sub>scripts/__tests__/feedback-signals.test.mjs:21</sub>
- low overall rating trips  <sub>scripts/__tests__/feedback-signals.test.mjs:25</sub>
- low pacing trips even when overall is fine  <sub>scripts/__tests__/feedback-signals.test.mjs:31</sub>
- heavy skips trip at >= 3 per submission  <sub>scripts/__tests__/feedback-signals.test.mjs:36</sub>
- 2 skips per submission does NOT trip  <sub>scripts/__tests__/feedback-signals.test.mjs:42</sub>
- multiple signals stack on one slug  <sub>scripts/__tests__/feedback-signals.test.mjs:47</sub>
- null ratings (no numeric feedback) never trip rating signals  <sub>scripts/__tests__/feedback-signals.test.mjs:54</sub>
- ignores malformed rows without throwing  <sub>scripts/__tests__/feedback-signals.test.mjs:58</sub>
- exports the thresholds so the workflow summary can name them  <sub>scripts/__tests__/feedback-signals.test.mjs:63</sub>

**Project docs stay within budget and every file they reference exists.**

- docs/handoff.md is within its line budget (move old snapshots to docs/archive/)  <sub>scripts/__tests__/docs-integrity.test.mjs:44</sub>
- no reference points at a doc that does not exist  <sub>scripts/__tests__/docs-integrity.test.mjs:68</sub>
- src, scripts, docs (minus archive), workflows, and root files are clean  <sub>scripts/__tests__/docs-integrity.test.mjs:91</sub>
- no .astro template hardcodes a root-absolute href  <sub>scripts/__tests__/docs-integrity.test.mjs:113</sub>

**Proposed venues are checked before they can enter a guide.**

- returns null when the section is absent — a pre-standard guide is n/a, never failed  <sub>scripts/__tests__/check-candidates.test.mjs:19</sub>
- parses per-priority tables, skipping header and separator rows  <sub>scripts/__tests__/check-candidates.test.mjs:23</sub>
- stops at the next ## section — Amendments rows never leak in  <sub>scripts/__tests__/check-candidates.test.mjs:33</sub>
- passes a table meeting the default floors, with every shipped name present in the guide  <sub>scripts/__tests__/check-candidates.test.mjs:44</sub>
- fails a thin consideration set by count, naming the floor  <sub>scripts/__tests__/check-candidates.test.mjs:50</sub>
- fails a shipped row that appears nowhere in the guide — the anti-padding cross-check  <sub>scripts/__tests__/check-candidates.test.mjs:56</sub>
- honors per-guide researchFloors over the defaults — the tabBudget precedent  <sub>scripts/__tests__/check-candidates.test.mjs:62</sub>
- gates only ranks 1-3; a fourth table is bonus depth  <sub>scripts/__tests__/check-candidates.test.mjs:69</sub>
- FAILS an empty section on a post-standard guide — the thinness this exists to measure  <sub>scripts/__tests__/check-candidates.test.mjs:75</sub>
- default floors are the documented 16/8 · 10/5 · 6/3  <sub>scripts/__tests__/check-candidates.test.mjs:81</sub>

**Re-checking a fact updates its date only when it was genuinely re-checked.**

- unions guide-level and per-section stale slugs, sorted  <sub>scripts/__tests__/recert.test.mjs:23</sub>
- keeps both the guide-stamp and the section findings per guide  <sub>scripts/__tests__/recert.test.mjs:27</sub>
- a section-only stale guide has no guide-stamp entry  <sub>scripts/__tests__/recert.test.mjs:33</sub>
- never includes drafts or clean guides  <sub>scripts/__tests__/recert.test.mjs:38</sub>
- empty staleness → empty work-list  <sub>scripts/__tests__/recert.test.mjs:43</sub>
- tolerates missing arrays  <sub>scripts/__tests__/recert.test.mjs:47</sub>
- lists each stale fact + its source and the re-verify instruction  <sub>scripts/__tests__/recert.test.mjs:55</sub>
- a clean / unknown guide reports nothing to do  <sub>scripts/__tests__/recert.test.mjs:65</sub>

**Splitting an imported guide into the standard shape loses nothing.**

- lowercases and hyphenates  <sub>scripts/__tests__/split-guide.test.mjs:15</sub>
- collapses punctuation runs  <sub>scripts/__tests__/split-guide.test.mjs:18</sub>
- strips leading/trailing hyphens  <sub>scripts/__tests__/split-guide.test.mjs:21</sub>
- groups contiguous sections by first-appearance order  <sub>scripts/__tests__/split-guide.test.mjs:27</sub>
- treats a missing `group` as the literal group "(none)"  <sub>scripts/__tests__/split-guide.test.mjs:39</sub>
- throws when a group reappears non-contiguously  <sub>scripts/__tests__/split-guide.test.mjs:44</sub>
- does not throw for immediately-repeated same-group entries  <sub>scripts/__tests__/split-guide.test.mjs:53</sub>
- returns NOT_FOUND when the source file doesn't exist  <sub>scripts/__tests__/split-guide.test.mjs:68</sub>
- returns NO_SECTIONS for a guide with no sections array  <sub>scripts/__tests__/split-guide.test.mjs:73</sub>
- returns NON_CONTIGUOUS and leaves the source file untouched  <sub>scripts/__tests__/split-guide.test.mjs:79</sub>
- splits a valid guide into _guide.json + NN-<group>.json files, removing the monolith  <sub>scripts/__tests__/split-guide.test.mjs:92</sub>
- groups a missing `group` field under the literal file name "(none)" → none.json  <sub>scripts/__tests__/split-guide.test.mjs:129</sub>

**The content auditor judges a guide against its own rules, consistently.**

- returns top-level sections unchanged when none nest  <sub>scripts/__tests__/audit-lib.test.mjs:16</sub>
- recursively inlines nested `sections` arrays in place of their parent  <sub>scripts/__tests__/audit-lib.test.mjs:21</sub>
- handles multiple levels of nesting  <sub>scripts/__tests__/audit-lib.test.mjs:33</sub>
- treats a missing/undefined sections array as empty  <sub>scripts/__tests__/audit-lib.test.mjs:38</sub>
- skips falsy entries  <sub>scripts/__tests__/audit-lib.test.mjs:43</sub>
- extracts an inline href citation with double quotes  <sub>scripts/__tests__/audit-lib.test.mjs:49</sub>
- extracts an inline href citation with single quotes  <sub>scripts/__tests__/audit-lib.test.mjs:53</sub>
- extracts a structured source_url field  <sub>scripts/__tests__/audit-lib.test.mjs:57</sub>
- dedupes repeated citations  <sub>scripts/__tests__/audit-lib.test.mjs:61</sub>
- collects both kinds together, in first-seen order  <sub>scripts/__tests__/audit-lib.test.mjs:66</sub>
- returns an empty array when there is nothing to extract  <sub>scripts/__tests__/audit-lib.test.mjs:71</sub>
- ignores non-http(s) hrefs  <sub>scripts/__tests__/audit-lib.test.mjs:75</sub>
- collects img.file across sights items  <sub>scripts/__tests__/audit-lib.test.mjs:81</sub>
- ignores non-sights sections  <sub>scripts/__tests__/audit-lib.test.mjs:90</sub>
- ignores items with no img.file  <sub>scripts/__tests__/audit-lib.test.mjs:95</sub>
- dedupes a photo reused across multiple sights  <sub>scripts/__tests__/audit-lib.test.mjs:100</sub>
- looks inside nested sections (via flatten)  <sub>scripts/__tests__/audit-lib.test.mjs:107</sub>
- ignores a direct src — the Commons API has no authority over it  <sub>scripts/__tests__/audit-lib.test.mjs:114</sub>
- collects direct img.src across sights items  <sub>scripts/__tests__/audit-lib.test.mjs:121</sub>
- resolves the {w} width token so the probe hits a real URL  <sub>scripts/__tests__/audit-lib.test.mjs:131</sub>
- ignores Commons files — those carry an authoritative missing flag instead  <sub>scripts/__tests__/audit-lib.test.mjs:136</sub>
- dedupes and looks inside nested sections  <sub>scripts/__tests__/audit-lib.test.mjs:141</sub>
- parses a full 'D Mon YYYY' date  <sub>scripts/__tests__/audit-lib.test.mjs:153</sub>
- parses a bare 'Mon YYYY' date with no day component  <sub>scripts/__tests__/audit-lib.test.mjs:158</sub>
- recognizes every month abbreviation  <sub>scripts/__tests__/audit-lib.test.mjs:163</sub>
- tolerates a longer word + trailing period built on the 3-letter abbreviation  <sub>scripts/__tests__/audit-lib.test.mjs:170</sub>
- returns null for text with no date-like content  <sub>scripts/__tests__/audit-lib.test.mjs:177</sub>
- returns null for empty/falsy input  <sub>scripts/__tests__/audit-lib.test.mjs:181</sub>
- returns null for an unrecognized month-like token  <sub>scripts/__tests__/audit-lib.test.mjs:187</sub>
- computes whole days between two dates  <sub>scripts/__tests__/audit-lib.test.mjs:193</sub>
- defaults `now` to the current time when omitted  <sub>scripts/__tests__/audit-lib.test.mjs:199</sub>
- rounds to the nearest whole day across a fractional gap  <sub>scripts/__tests__/audit-lib.test.mjs:205</sub>
- returns a negative number for a date in the future relative to now  <sub>scripts/__tests__/audit-lib.test.mjs:211</sub>
- reads a flat-file guide  <sub>scripts/__tests__/audit-lib.test.mjs:227</sub>
- reads a directory-shaped (split) guide, assembling sections in filename-sort order  <sub>scripts/__tests__/audit-lib.test.mjs:235</sub>
- skips a directory with no _guide.json (not a guide dir)  <sub>scripts/__tests__/audit-lib.test.mjs:258</sub>
- skips a malformed guide file (invalid JSON) rather than throwing  <sub>scripts/__tests__/audit-lib.test.mjs:264</sub>
- ignores non-JSON files at the top level  <sub>scripts/__tests__/audit-lib.test.mjs:272</sub>
- E8·2: when a slug has both shapes, the flat file wins (shared tie-break, same as resolveGuidePath)  <sub>scripts/__tests__/audit-lib.test.mjs:277</sub>

**The forms used to file work match what the automation expects to read.**

- has the same field ids, in the same order  <sub>scripts/__tests__/issue-forms.test.mjs:48</sub>
- labels match exactly — the parsers match on these strings  <sub>scripts/__tests__/issue-forms.test.mjs:52</sub>
- kinds and required-ness match  <sub>scripts/__tests__/issue-forms.test.mjs:56</sub>
- every form opens with the identical slug field object  <sub>scripts/__tests__/issue-forms.test.mjs:63</sub>
- resolves a label by id  <sub>scripts/__tests__/issue-forms.test.mjs:69</sub>
- THROWS on an unknown id rather than returning undefined  <sub>scripts/__tests__/issue-forms.test.mjs:73</sub>
- revise form → parseReviseIssue  <sub>scripts/__tests__/issue-forms.test.mjs:85</sub>
- ESCALATED modify form → parseReviseIssue falls back to modify's labels  <sub>scripts/__tests__/issue-forms.test.mjs:100</sub>
- graduate form → parseIssueBody  <sub>scripts/__tests__/issue-forms.test.mjs:116</sub>

**The frozen Japan defect evidence, independent of the live guide's fate.**

- the fixture list is non-empty (guards a vacuous pass)  <sub>scripts/__tests__/japan-regression-fixture.test.mjs:44</sub>
- documents all 12 cases, one `## Case N` heading each  <sub>scripts/__tests__/japan-regression-fixture.test.mjs:71</sub>
- case 1 is split into the 1a/1b sub-cases  <sub>scripts/__tests__/japan-regression-fixture.test.mjs:79</sub>
- records case 1a as a NEGATIVE case — the C2 false-positive guard  <sub>scripts/__tests__/japan-regression-fixture.test.mjs:89</sub>
- every frozen file is listed in the manifest's table  <sub>scripts/__tests__/japan-regression-fixture.test.mjs:93</sub>

**The guide-building pipeline runs its stages in order and stops when one fails.**

- no state → the first stage  <sub>scripts/__tests__/pipeline.test.mjs:22</sub>
- scaffold cleared → passA  <sub>scripts/__tests__/pipeline.test.mjs:25</sub>
- all cleared → null (done)  <sub>scripts/__tests__/pipeline.test.mjs:28</sub>
- respects order even with a later stage set out of sequence  <sub>scripts/__tests__/pipeline.test.mjs:32</sub>
- no state → a scaffold-it-first hint  <sub>scripts/__tests__/pipeline.test.mjs:38</sub>
- in-progress → checklist + a NEXT action  <sub>scripts/__tests__/pipeline.test.mjs:41</sub>
- all cleared → ready for graduation  <sub>scripts/__tests__/pipeline.test.mjs:46</sub>
- initState clears scaffold and nothing else  <sub>scripts/__tests__/pipeline.test.mjs:53</sub>
- initState is idempotent — never wipes progress  <sub>scripts/__tests__/pipeline.test.mjs:60</sub>
- checkpoint advances the next stage and persists  <sub>scripts/__tests__/pipeline.test.mjs:67</sub>
- checkpoint is idempotent (re-clearing a stage doesn't error)  <sub>scripts/__tests__/pipeline.test.mjs:76</sub>
- an unknown stage is rejected  <sub>scripts/__tests__/pipeline.test.mjs:82</sub>
- full run reaches done  <sub>scripts/__tests__/pipeline.test.mjs:86</sub>
- starts a fresh guide at attempt 1  <sub>scripts/__tests__/pipeline.test.mjs:94</sub>
- increments on every call and persists  <sub>scripts/__tests__/pipeline.test.mjs:100</sub>
- self-heals when called with no prior state at all  <sub>scripts/__tests__/pipeline.test.mjs:109</sub>
- --slug ../../x exits non-zero and writes nothing outside guides-intake  <sub>scripts/__tests__/pipeline.test.mjs:118</sub>
- scaffold has no predecessor — never blocked  <sub>scripts/__tests__/pipeline.test.mjs:133</sub>
- allows a stage whose predecessor is committed  <sub>scripts/__tests__/pipeline.test.mjs:137</sub>
- REGRESSION (F1 · Japan): blocks passB while passA lives only in the working tree  <sub>scripts/__tests__/pipeline.test.mjs:142</sub>
- blocks every later stage the same way  <sub>scripts/__tests__/pipeline.test.mjs:148</sub>
- no committed state at all → the predecessor is missing, not silently allowed  <sub>scripts/__tests__/pipeline.test.mjs:153</sub>
- no state → nextStage scaffold, exists false, attempts 0  <sub>scripts/__tests__/pipeline.test.mjs:159</sub>
- in-progress state → the correct nextStage and attempts carried through  <sub>scripts/__tests__/pipeline.test.mjs:163</sub>
- all stages cleared → nextStage is null (JSON-serializable, not undefined)  <sub>scripts/__tests__/pipeline.test.mjs:168</sub>

**The guide-writing instructions are themselves tested against known cases.**

- returns one window per keyword occurrence, scoped around it  <sub>scripts/__tests__/run-skill-evals.test.mjs:23</sub>
- finds nothing when the keyword is absent  <sub>scripts/__tests__/run-skill-evals.test.mjs:28</sub>
- PASSES when every SPAREX touchpoint shows the new price and none the old  <sub>scripts/__tests__/run-skill-evals.test.mjs:34</sub>
- FAILS (catches the regression) when a touchpoint is left stale  <sub>scripts/__tests__/run-skill-evals.test.mjs:41</sub>
- FAILS when the change landed in only one place (didn't propagate)  <sub>scripts/__tests__/run-skill-evals.test.mjs:47</sub>
- detects a preserved draft flag and its absence  <sub>scripts/__tests__/run-skill-evals.test.mjs:54</sub>

**The plain-English list of what the tests protect stays complete and current.**

- finds the suite at all  <sub>scripts/__tests__/test-index.test.mjs:12</sub>
- every test states, in one plain line, what it protects  <sub>scripts/__tests__/test-index.test.mjs:17</sub>
- the promises are sentences a non-coder can read, not identifiers  <sub>scripts/__tests__/test-index.test.mjs:27</sub>
- the committed document matches what the generator produces  <sub>scripts/__tests__/test-index.test.mjs:40</sub>
- reads a template-literal name and an apostrophe without truncating either  <sub>scripts/__tests__/test-index.test.mjs:49</sub>
- no NEW test file is mostly explanation, and no old one gets worse  <sub>scripts/__tests__/test-index.test.mjs:119</sub>
- the recorded density debt only ever shrinks  <sub>scripts/__tests__/test-index.test.mjs:136</sub>

**The pre-departure check reaches every item that asked to be re-verified.**

- is 0 when the guide has no recert entry (nothing stale)  <sub>scripts/__tests__/pretrip-check.test.mjs:14</sub>
- counts stale sections plus the guide-level stamp  <sub>scripts/__tests__/pretrip-check.test.mjs:17</sub>
- dispatches an in-window guide with stale facts and no recert in flight  <sub>scripts/__tests__/pretrip-check.test.mjs:25</sub>
- does NOT dispatch when nothing is stale  <sub>scripts/__tests__/pretrip-check.test.mjs:30</sub>
- does NOT dispatch when a recert is already in flight (dedupe)  <sub>scripts/__tests__/pretrip-check.test.mjs:36</sub>
- prefers the 'nothing stale' reason over the in-flight one when both apply  <sub>scripts/__tests__/pretrip-check.test.mjs:42</sub>

**The second research pass really covered what the first pass left open.**

- lowercases, strips punctuation and diacritics  <sub>scripts/__tests__/check-passb-coverage.test.mjs:23</sub>
- matches exact and parenthesized names  <sub>scripts/__tests__/check-passb-coverage.test.mjs:31</sub>
- matches token-wise when the table rephrases  <sub>scripts/__tests__/check-passb-coverage.test.mjs:34</sub>
- rejects an item that appears nowhere  <sub>scripts/__tests__/check-passb-coverage.test.mjs:37</sub>
- passes when every entry has a verdict, including explicit rejections  <sub>scripts/__tests__/check-passb-coverage.test.mjs:43</sub>
- fails and names the silently dropped entry  <sub>scripts/__tests__/check-passb-coverage.test.mjs:52</sub>
- fails everything when the reconciliation section is absent  <sub>scripts/__tests__/check-passb-coverage.test.mjs:58</sub>
- only matches inside the reconciliation section, not the whole intake doc  <sub>scripts/__tests__/check-passb-coverage.test.mjs:64</sub>
- skips cleanly on empty or missing Pass B  <sub>scripts/__tests__/check-passb-coverage.test.mjs:70</sub>
- passes a pass meeting every floor  <sub>scripts/__tests__/check-passb-coverage.test.mjs:87</sub>
- fails a thin pass on total count  <sub>scripts/__tests__/check-passb-coverage.test.mjs:93</sub>
- fails when the crowd/timing angle is missing — even with plenty of entries  <sub>scripts/__tests__/check-passb-coverage.test.mjs:99</sub>
- counts `timing` toward crowd and `alternative` toward novel  <sub>scripts/__tests__/check-passb-coverage.test.mjs:106</sub>
- documented floors: 8 total, 3 crowd/timing, 2 novel/alternative  <sub>scripts/__tests__/check-passb-coverage.test.mjs:115</sub>

**The site keeps looking like one designed thing — no new stray corner, colour or shadow.**

- actually reaches the checker instead of scoring an empty run  <sub>scripts/__tests__/drift-real.test.mjs:12</sub>
- introduces no new drift and makes no existing file worse  <sub>scripts/__tests__/drift-real.test.mjs:21</sub>
- the recorded drift debt only ever shrinks  <sub>scripts/__tests__/drift-real.test.mjs:34</sub>
- every exemption is a named class carrying its own justification  <sub>scripts/__tests__/drift-real.test.mjs:42</sub>
- classifies against the real source line, not the checker's truncated echo  <sub>scripts/__tests__/drift-real.test.mjs:51</sub>

**Trip feedback exports carry the survey answers and nothing personal.**

- maps roomId → slug and skips guides without a roomId  <sub>scripts/__tests__/export-feedback.test.mjs:36</sub>
- attributes submissions to slugs and drops rooms with no matching guide  <sub>scripts/__tests__/export-feedback.test.mjs:45</sub>
- keeps only submissions newer than the per-slug marker  <sub>scripts/__tests__/export-feedback.test.mjs:54</sub>
- treats everything as new when the marker is empty  <sub>scripts/__tests__/export-feedback.test.mjs:60</sub>
- advances to the max createdAt per slug, carrying prior values forward  <sub>scripts/__tests__/export-feedback.test.mjs:67</sub>
- averages ratings, lists skips, and keeps freeform + a count (agent-only)  <sub>scripts/__tests__/export-feedback.test.mjs:75</sub>

**Two facts.json rows sharing a value from different sources, a malformed**

- catches the frozen fixture's case 9: ¥11,410 attributed to two different sources  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:34</sub>
- does not flag the same value from the SAME source (that's a normal shared fact)  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:42</sub>
- does not flag the same value under UNRELATED claims (no shared significant words)  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:50</sub>
- does not flag on a SINGLE shared word — the threshold is 2, on purpose  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:58</sub>
- ignores the reserved traveler-origin row  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:66</sub>
- produces ZERO findings across every real, shipped guide's facts.json  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:74</sub>
- catches the frozen fixture's three known malformed values  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:82</sub>
- does not flag a clean value  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:87</sub>
- flags a trailing period as well as a trailing comma  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:92</sub>
- documents the true positives already shipped in korea (4) and us (1)  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:97</sub>
- catches the frozen fixture's three bare, repeated stems  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:112</sub>
- does not flag a bare stem used for only ONE value  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:117</sub>
- does not flag a claim WITH a leaf (a → segment) even if it repeats  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:122</sub>
- documents the true positives already present in korea and denmark  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:132</sub>
- reports n/a for a guide with no facts.json  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:144</sub>
- reports clean when a facts.json has none of the three defect classes  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:148</sub>
- the frozen Japan fixture triggers all three distinct flag classes (≥3 findings)  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:157</sub>
- korea/us/denmark are 'advisory' (documented true positives), never 'clean' as of this corpus snapshot  <sub>scripts/__tests__/check-facts-hygiene.test.mjs:167</sub>

**Venue details are taken from the source, never filled in from memory.**

- status check asks for Essentials + Pro only, never an Enterprise field  <sub>scripts/__tests__/lookup-venue.test.mjs:40</sub>
- hours check adds the Enterprise fields  <sub>scripts/__tests__/lookup-venue.test.mjs:50</sub>
- an unknown check falls back to the cheap mask, never the expensive one  <sub>scripts/__tests__/lookup-venue.test.mjs:57</sub>
- reports which SKUs each check bills, so a run can account for what it spent  <sub>scripts/__tests__/lookup-venue.test.mjs:61</sub>
- exposes exactly the two supported checks  <sub>scripts/__tests__/lookup-venue.test.mjs:66</sub>
- flattens a hours-check place into the shape a guide fact wants  <sub>scripts/__tests__/lookup-venue.test.mjs:72</sub>
- turns a permanently-closed venue into still_operating:false — the whole point  <sub>scripts/__tests__/lookup-venue.test.mjs:86</sub>
- distinguishes 'not returned' from 'closed' — an absent status is null, not false  <sub>scripts/__tests__/lookup-venue.test.mjs:93</sub>
- omits hours fields entirely on a status check, so callers can't read stale blanks as data  <sub>scripts/__tests__/lookup-venue.test.mjs:100</sub>
- returns a clean error when no key is configured (inert until configured)  <sub>scripts/__tests__/lookup-venue.test.mjs:108</sub>
- rejects an empty query without spending a call  <sub>scripts/__tests__/lookup-venue.test.mjs:113</sub>
- surfaces Google's own reason on an HTTP error instead of throwing  <sub>scripts/__tests__/lookup-venue.test.mjs:120</sub>
- never leaks the api key into an error string  <sub>scripts/__tests__/lookup-venue.test.mjs:129</sub>
- turns a thrown network failure into an error result  <sub>scripts/__tests__/lookup-venue.test.mjs:137</sub>
- reports notFound for an empty result set  <sub>scripts/__tests__/lookup-venue.test.mjs:145</sub>
- sends the key and mask as headers, and the query as a POST body  <sub>scripts/__tests__/lookup-venue.test.mjs:150</sub>
- returns the normalized place on success  <sub>scripts/__tests__/lookup-venue.test.mjs:168</sub>

**What is live on the site is what was meant to ship.**

- includes flat and directory guides with no draft flag  <sub>scripts/__tests__/verify-live.test.mjs:36</sub>
- excludes guides marked draft:true, in either shape  <sub>scripts/__tests__/verify-live.test.mjs:42</sub>
- treats draft:false and a missing draft key as published  <sub>scripts/__tests__/verify-live.test.mjs:49</sub>
- skips a directory with no _guide.json and malformed JSON without throwing  <sub>scripts/__tests__/verify-live.test.mjs:55</sub>
- returns [] for a nonexistent dir  <sub>scripts/__tests__/verify-live.test.mjs:62</sub>
- matches the slug-anchored guide href  <sub>scripts/__tests__/verify-live.test.mjs:68</sub>
- does not match a different slug or a partial  <sub>scripts/__tests__/verify-live.test.mjs:71</sub>
- is safe on non-string input  <sub>scripts/__tests__/verify-live.test.mjs:75</sub>
- is ok when every published guide is reachable and listed  <sub>scripts/__tests__/verify-live.test.mjs:83</sub>
- flags a guide whose own URL does not return 200 as unreachable  <sub>scripts/__tests__/verify-live.test.mjs:91</sub>
- flags a reachable-but-unlinked guide as unlisted (the Sedona failure mode)  <sub>scripts/__tests__/verify-live.test.mjs:102</sub>
- does not check listing for a guide that itself 404s (one problem, not two)  <sub>scripts/__tests__/verify-live.test.mjs:113</sub>
- reports no-homepage when a reachable guide can't be listing-checked  <sub>scripts/__tests__/verify-live.test.mjs:119</sub>
- treats a missing status entry as unreachable  <sub>scripts/__tests__/verify-live.test.mjs:124</sub>
- returns ok on the first attempt when the site is healthy (no retries)  <sub>scripts/__tests__/verify-live.test.mjs:154</sub>
- retries while unlisted, then succeeds once propagation catches up  <sub>scripts/__tests__/verify-live.test.mjs:167</sub>
- gives up after the retry budget and reports the problem  <sub>scripts/__tests__/verify-live.test.mjs:180</sub>
- is a no-op (ok) when there are no published guides  <sub>scripts/__tests__/verify-live.test.mjs:190</sub>

