# Image sourcing — finding, licensing, and wiring guide photos

Binding for every photo that lands in a guide: `sights[].img` and `cover`. Adapted
from the `fetching-images` skill (warren-claude-code-plugin-marketplace) to this
repo's schema and verification law — where the two disagree, this file wins.

**The rule photos inherit from facts:** a filename or URL you *recalled* is a guessed
fact. Every image ships because a script or a fetch confirmed it resolves, never
because it looked right.

---

## 1. Pick the source

Two sources are allowed, in this order:

| | `img.file` — Wikimedia Commons | `img.src` — direct royalty-free URL |
|---|---|---|
| Licence check | **Machine-verifiable** — MediaWiki API confirms the File: page | Not verifiable — you assert it |
| Attribution | Commons File page IS the credit (rendered automatically) | `credit` + `license` **required in the data** |
| Audit | `check-photos.mjs` → authoritative `missing` flag | `check-photos.mjs` → reachability probe |
| Use when | A fitting Commons file exists | Commons has nothing honest for this subject |

**Prefer Commons.** It is the only source whose existence and licence the build can
prove, and its credit needs no hand-maintenance. Reach for `img.src` when Commons
genuinely has no honest photo of the subject — not to save a search round.

Both may not be set on one item; the schema rejects `file` + `src` together.

---

## 2. Commons workflow (`img.file`)

```bash
node scripts/search-commons.mjs "Fushimi Inari Taisha" --limit 6
```

Returns only filenames that **provably exist** (search in the File namespace, then a
second call confirming each is not `missing`). Empty output is a real answer: no
fitting file — omit the image, or fall to §3.

```json
{ "name": "Fushimi Inari Taisha", "img": { "file": "Fushimi Inari Taisha 01.jpg", "alt": "Vermilion torii tunnel climbing the hillside" } }
```

**Never hand-build a Commons URL.** The `/commons/[a]/[ab]/` path segments are an MD5
of the filename — unpredictable, and a guessed one 404s. Rendering derives the URL from
the filename via `Special:FilePath`; your job ends at the filename.

---

## 3. Direct royalty-free workflow (`img.src`)

Allowed sources — no-attribution-required licences only:

- **Pexels** (pexels.com) · **Unsplash** (unsplash.com) · **Pixabay** (pixabay.com)
- **Flickr Commons** (flickr.com/commons) — public-domain institutional archives

```json
{
  "name": "Sedona red rocks",
  "img": {
    "src": "https://images.pexels.com/photos/12345/sedona.jpg?w={w}",
    "alt": "Layered red sandstone buttes at golden hour",
    "credit": "Jane Doe · Pexels",
    "license": "Pexels License",
    "creditUrl": "https://www.pexels.com/photo/12345/"
  }
}
```

- `src` must be **https** and should carry a `{w}` width token where the CDN supports
  one — it is substituted per breakpoint to build a real srcset. Without it the photo
  is served single-size to every device (works, but costs mobile readers bandwidth).
- `credit` + `license` are **schema-required** with `src` — the build fails without
  them. That is the trade for a source whose licence nothing can machine-check.
- `creditUrl` is optional; given, the credit chip links it, otherwise it renders as
  plain text. Both surface in the card and the lightbox.

**Verify before committing** — a broken URL renders a failure plate to real readers:

```bash
curl -sI "https://images.pexels.com/photos/12345/sedona.jpg" | grep -iE "^(HTTP|content-type)"
# want: HTTP/2 200 · content-type: image/jpeg
```

---

## 4. Forbidden

- **Fair use is not a route here.** Waypoint guides are a published public website.
  The four-factor test is a litigation defence, not a licence — it does not apply to
  a copyrighted photo we simply want. Use Commons or a CC0 source, or ship no photo.
- **"Google Images" is not a source.** It indexes; it does not license.
- **No hot-linking arbitrary sites.** Only Commons' `Special:FilePath` and the CDN
  domains in §3 — someone's blog or a hotel's own site is neither licensed nor stable.
- **No watermark ≠ free.** No stated licence means no.
- **Never invent alt text from the filename.** Alt describes what is *in* the frame
  for a reader who cannot see it; if you have not seen the photo, keep it factual and
  short, or omit `alt` rather than fabricate a scene.

---

## 5. Honesty (R18 — applies to sight photos exactly as it does to covers)

A photo must honestly represent what **this traveller on these dates** will see:
right place, right season, right identity. Cherry blossom on an autumn trip, a summer
beach on a winter itinerary, or a landmark this trip never visits is dishonest framing
however beautiful the shot. **No photo is a fine outcome** — a text sight card is a
complete card, not a degraded one.

Do not add photos to pad a thin sights section. Breadth comes from research
(CLAUDE.md: Sights and Food are repositories), never from decoration.

---

## 6. Checklist — before any photo ships

- [ ] Source is Commons (`file`) or an allowed CC0 CDN (`src`) — never both on one item
- [ ] Commons filename came from `search-commons.mjs`, not memory
- [ ] Direct URL is https, `curl -I` → 200 + `content-type: image/*`
- [ ] Direct URL carries `credit` + `license` (and `{w}` where supported)
- [ ] Seasonally and geographically honest for THIS trip (R18)
- [ ] `alt` describes the frame, not the filename
- [ ] `npm run build` passes, and `node scripts/audit/check-photos.mjs` reports it resolving
