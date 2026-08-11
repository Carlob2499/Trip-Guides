`ProvenanceDot` goes after any resolved fact whose value can go stale.

The popover it opens carries, in this order and with no exceptions: the claim → `✓ CHECKED <date>` → the staleness reading → the source link (`SOURCE · host ↗`) or `NO PUBLIC SOURCE`.

Staleness uses `SHELF_LIFE_DAYS` (fx 7, transit 90, hours 90, venue 180, default 90). Past its life → `⚠ N DAYS OLD` in ochre; inside the final third → `AGEING — N DAYS LEFT`; otherwise no line at all. Silence is the healthy state.
