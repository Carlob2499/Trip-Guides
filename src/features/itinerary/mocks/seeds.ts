/**
 * Real-shaped seeds for the itinerary model tests — representative touch
 * gestures and a day-card layout, so the numbers under test read like the
 * ones the UI actually measures.
 */

/* Committing swipes (|dx|≥72, |dy|<46, dt<650). dx<0 = leftward = next. */
export const SWIPE_NEXT = { dx: -120, dy: 12, dt: 260 };
export const SWIPE_PREV = { dx: 130, dy: -8, dt: 300 };

/* A phone day-deck: 8 cards 300px wide at 320px pitch, viewport center 187.
   Card i center = 150 - scrollOffset + i*320; here the 2nd card sits nearest. */
export const DECK_CENTERS = [-30, 290, 610, 930, 1250, 1570, 1890, 2210];
export const DECK_VIEWPORT_CENTER = 187;

/* A vertical list mid-scroll: tops relative to the viewport, fold at 150.
   Days 0–2 have scrolled past the fold; day 3 is still below. */
export const LIST_TOPS = [-620, -300, 40, 360, 700, 1040];
export const LIST_FOLD = 150;
