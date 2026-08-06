/* <atlas-map> — 3D spinning globe for the Waypoint Atlas front.
   Real geometry (world-atlas TopoJSON, Natural Earth) on a d3 orthographic projection.

   Performance model (tuned for low-end machines):
     · three canvas layers — static contour field, the globe, and the instrument furniture —
       so only the globe layer redraws per frame.
     · two geometry tiers: a decimated land set while moving, full detail once settled.
     · terminator polygon rebuilt once a minute, not once a frame.
     · atlas-pos throttled to ~12/s (the page handler measures DOM, so per-frame dispatch
       forced a synchronous layout every frame).
     · adaptive: rolling frame time over 22ms drops to the fast tier permanently and, if it
       stays slow, rebuilds at devicePixelRatio 1.
     · nothing draws while the tab is hidden or the globe is scrolled out of view.

   Emits (bubbling): 'atlas-pos' {kr:{x,y,v},…, w, h, center, zoom} · 'atlas-select' {code, name}
   Public: flyIn(code,dur) · flyTo(code,dur) · zoomBy(f) · resetView() · toggleSpin()
   Attributes: home-base="lon,lat,LABEL" · spin-speed="deg per second" */
(function () {
  const GUIDES = { 410: "kr", 392: "jp", 208: "dk", 840: "us" };
  const ANCHORS = { kr: [126.980, 37.5707], jp: [139.692, 35.689], dk: [12.568, 55.676], us: [-111.761, 34.8697] };
  const NAMES = { kr: "South Korea", jp: "Japan", dk: "Denmark", us: "Sedona, Arizona" };
  const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  const HOME_DEFAULT = { p: [-118.4085, 33.9416], label: "LAX · HOME BASE" };
  let worldPromise = null;
  const loadWorld = () => (worldPromise = worldPromise || fetch(WORLD_URL).then(r => r.json()));
  const cssVar = (el, prop, fallback) => getComputedStyle(el).getPropertyValue(prop).trim() || fallback;

  function subsolar(date) {
    const rad = Math.PI / 180;
    const jd = date / 86400000 + 2440587.5, n = jd - 2451545.0;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * rad;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
    const eps = (23.439 - 0.0000004 * n) * rad;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda)) / rad;
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / rad;
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    return [((ra - gmst * 15 + 540) % 360) - 180, dec];
  }
  function bearing(a, b) {
    const r = Math.PI / 180, p1 = a[1] * r, p2 = b[1] * r, dl = (b[0] - a[0]) * r;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  const distanceKm = (a, b) => window.d3.geoDistance(a, b) * 6371;

  // Drop intermediate vertices from big rings — invisible at globe scale, ~3x cheaper to clip.
  function decimate(feature, keep) {
    const thin = (ring) => {
      if (ring.length <= 12) return ring;
      const out = [];
      for (let i = 0; i < ring.length - 1; i += keep) out.push(ring[i]);
      out.push(ring[ring.length - 1]);
      return out.length >= 4 ? out : ring;
    };
    const g = feature.geometry;
    if (!g) return feature;
    const map = (coords, depth) => depth === 0 ? thin(coords) : coords.map(c => map(c, depth - 1));
    const depth = g.type === "Polygon" ? 1 : g.type === "MultiPolygon" ? 2 : 0;
    return { type: "Feature", id: feature.id, properties: feature.properties,
      geometry: { type: g.type, coordinates: map(g.coordinates, depth) } };
  }

  class AtlasMap extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.display = "block";
      if (getComputedStyle(this).position === "static") this.style.position = "relative";
      this._mount = document.createElement("div");
      this._mount.style.cssText = "position:absolute;inset:0;overflow:hidden";
      this.appendChild(this._mount);
      const style = document.createElement("style");
      style.textContent = [
        "@keyframes am-pulse{0%{r:10;opacity:.55}70%{r:24;opacity:0}100%{r:24;opacity:0}}",
        ".am-pulse{fill:none;stroke:#9c4421;stroke-width:2;animation:am-pulse 2.4s ease-out infinite}",
        "@media (prefers-reduced-motion: reduce){.am-pulse{animation:none;opacity:0}}"
      ].join("\n");
      this.appendChild(style);
      this._rot = [-127, -26];
      this._slow = 0; this._frames = 0; this._acc = 0; this._degraded = 0;
      this._visible = true;
      this._waitLibs(() => loadWorld().then(w => { this._world = w; this._build(); }).catch(e => console.warn("atlas-map: world load failed", e)));
      this._ro = new ResizeObserver(() => { if (this._world) this._build(); });
      this._ro.observe(this);
      this._mo = new MutationObserver(() => { this._readTheme(); this._dirty = true; this._furnDirty = true; });
      this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      this._io = new IntersectionObserver(es => { this._visible = es[0].isIntersecting; }, { threshold: 0 });
      this._io.observe(this);
      this._onVis = () => { this._dirty = true; };
      document.addEventListener("visibilitychange", this._onVis);
    }
    disconnectedCallback() {
      [this._ro, this._mo, this._io].forEach(o => o && o.disconnect());
      document.removeEventListener("visibilitychange", this._onVis);
      if (this._loop) cancelAnimationFrame(this._loop);
      this._loop = null; this._flying = false;
      clearTimeout(this._resume); clearTimeout(this._flyEnd);
    }
    _waitLibs(cb, n) {
      if (window.d3 && window.topojson) return cb();
      if ((n || 0) > 100) return console.warn("atlas-map: d3/topojson never arrived");
      setTimeout(() => this._waitLibs(cb, (n || 0) + 1), 100);
    }
    _readTheme() {
      this._dark = document.documentElement.getAttribute("data-theme") === "dark";
      this._c = {
        card: cssVar(this, "--card", "#f8faf3"), sunken: cssVar(this, "--sunken", "#d2d7c8"),
        rule: cssVar(this, "--rule", "#bec6b2"), rule2: cssVar(this, "--rule2", "#a3ac98"),
        muted: cssVar(this, "--muted", "#4e5747"), bg: cssVar(this, "--bg", "#dfe3d9")
      };
    }
    _layer(w, h, dpr, extraCss) {
      const cv = document.createElement("canvas");
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;" + (extraCss || "");
      this._mount.appendChild(cv);
      const cx = cv.getContext("2d", { alpha: true });
      cx.scale(dpr, dpr);
      return { cv, cx };
    }
    _build() {
      const d3 = window.d3, topojson = window.topojson, self = this;
      const w = this.clientWidth || 800, h = this.clientHeight || 480;
      if (!w || !h) return;
      this._dims = { w, h };
      this._reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (this._loop) { cancelAnimationFrame(this._loop); this._loop = null; }
      this._readTheme();

      const R = Math.min(w, h) / 2 - 14;
      this._R = R;
      if (!this._k || this._k < R * 0.5) this._k = R;
      this._targetK = this._k;
      this._spinDeg = Number(this.getAttribute("spin-speed")) || 11;

      const ha = (this.getAttribute("home-base") || "").split(",");
      this._home = ha.length >= 2 && !isNaN(+ha[0])
        ? { p: [+ha[0], +ha[1]], label: (ha[2] || "HOME BASE").trim() } : HOME_DEFAULT;

      // geometry, built once per dataset: full detail + a decimated tier for motion
      if (!this._geom || this._geom.src !== this._world) {
        const feats = topojson.feature(this._world, this._world.objects.countries).features;
        const fast = feats.map(f => decimate(f, 3));
        // bounding cap per feature: centroid + angular radius, so hidden-hemisphere
        // countries can be skipped outright instead of walked and clipped away
        const cap = (f) => {
          const ctr = d3.geoCentroid(f);
          let rad = 0;
          const walk = (co, depth) => {
            if (depth === 0) { const dd = d3.geoDistance(ctr, co); if (dd > rad) rad = dd; return; }
            for (const c2 of co) walk(c2, depth - 1);
          };
          const g = f.geometry;
          walk(g.coordinates, g.type === "Polygon" ? 2 : 3);
          return { ctr, rad };
        };
        const caps = feats.map(cap);
        feats.forEach((f, i) => { f.__cap = caps[i]; });
        fast.forEach((f, i) => { f.__cap = caps[i]; });
        this._geom = {
          src: this._world, feats,
          full: { plain: feats.filter(f => !GUIDES[+f.id]), guides: feats.filter(f => GUIDES[+f.id]) },
          fast: { plain: fast.filter(f => !GUIDES[+f.id]), guides: fast.filter(f => GUIDES[+f.id]) }
        };
      }
      this._arcs = Object.keys(ANCHORS).map(code => {
        const interp = d3.geoInterpolate(this._home.p, ANCHORS[code]);
        const pts = [];
        for (let i = 0; i <= 40; i++) pts.push(interp(i / 40));
        return { code, line: { type: "LineString", coordinates: pts } };
      });
      if (this._arcT == null) this._arcT = 0;
      this._nightGen = d3.geoCircle().radius(90).precision(4);
      this._nightGeom = null; this._nightMin = -1;

      // layers
      this._mount.innerHTML = "";
      const dpr = this._degraded > 1 ? 1 : Math.min(window.devicePixelRatio || 1, 1.6);
      this._dpr = dpr;

      const bg = this._layer(w, h, dpr);
      { const bx = bg.cx; let s = 17;
        const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
        bx.globalAlpha = 0.45;
        [[w * 0.1, h * 0.2], [w * 0.06, h * 0.9], [w * 0.94, h * 0.14], [w * 0.9, h * 0.86]].forEach(([cx, cy]) => {
          for (let r = 1; r <= 6; r++) {
            const base = 30 * r + rnd() * 18, wob = [];
            for (let k = 0; k < 4; k++) wob.push(rnd() * 20 - 10);
            bx.beginPath();
            for (let a = 0; a <= 56; a++) {
              const th = (a / 56) * Math.PI * 2;
              let rad = base;
              for (let k = 0; k < 4; k++) rad += wob[k] * Math.sin((k + 2) * th + k * 1.7);
              const px = cx + rad * Math.cos(th), py = cy + rad * Math.sin(th);
              a ? bx.lineTo(px, py) : bx.moveTo(px, py);
            }
            bx.strokeStyle = r % 3 === 0 ? this._c.rule2 : this._c.rule;
            bx.lineWidth = r % 3 === 0 ? 1 : 0.7;
            bx.stroke();
          }
        });
        bx.globalAlpha = 1;
      }

      this._limb = null; // gradients belong to the context that made them
      const globe = this._layer(w, h, dpr, "cursor:grab;touch-action:none");
      this._canvas = globe.cv; this._ctx = globe.cx;
      const furn = this._layer(w, h, dpr, "pointer-events:none");
      this._furnCtx = furn.cx;
      this._furnDirty = true;

      const proj = this._proj = d3.geoOrthographic().translate([w / 2, h / 2]).scale(this._k).clipAngle(90).rotate(this._rot);
      proj.precision(0.7);
      this._prec = 0.7;
      this._path = d3.geoPath(proj, this._ctx);
      this._grat = d3.geoGraticule10();
      this._gratCoarse = d3.geoGraticule().step([30, 30])();
      this._indexLines = { type: "MultiLineString", coordinates: [
        d3.range(-180, 181, 4).map(x => [x, 0]),
        d3.range(-90, 91, 4).map(y => [0, y])
      ] };
      this._tropics = { type: "MultiLineString", coordinates: [
        d3.range(-180, 181, 6).map(x => [x, 23.4368]),
        d3.range(-180, 181, 6).map(x => [x, -23.4368])
      ] };

      const svg = d3.select(this._mount).append("svg")
        .attr("viewBox", "0 0 " + w + " " + h).attr("width", "100%").attr("height", "100%")
        .style("position", "absolute").style("inset", "0").style("pointer-events", "none");
      this._pins = {}; this._pinAt = {};
      Object.keys(ANCHORS).forEach(code => {
        const g = svg.append("g").style("pointer-events", "auto").style("cursor", "pointer")
          .on("click", ev => {
            if (self._dragged) return;
            ev.stopPropagation();
            self._target = code; self._furnDirty = true;
            self.dispatchEvent(new CustomEvent("atlas-select", { bubbles: true, detail: { code, name: NAMES[code] } }));
          });
        if (!this._reduced) g.append("circle").attr("class", "am-pulse").attr("r", 10);
        g.append("circle").attr("r", 22).attr("fill", "transparent");
        g.append("circle").attr("r", code === "kr" ? 9 : 7)
          .style("fill", code === "kr" ? "#9c4421" : "var(--muted)").style("stroke", "var(--bg)").attr("stroke-width", 2.5);
        this._pins[code] = g.node();
      });

      d3.select(this._canvas).call(d3.drag()
        .on("start", () => { this._hold = true; this._dragged = false; clearTimeout(this._resume); this._canvas.style.cursor = "grabbing"; })
        .on("drag", (ev) => {
          this._dragged = true;
          const sens = 68 / this._k;
          this._rot[0] = (this._rot[0] + ev.dx * sens) % 360;
          this._rot[1] = Math.max(-72, Math.min(72, this._rot[1] - ev.dy * sens));
          this._dirty = true;
        })
        .on("end", () => { this._canvas.style.cursor = "grab"; this._resume = setTimeout(() => { this._hold = false; this._dragged = false; }, 2400); }));

      this._canvas.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        const stepF = Math.exp(-Math.max(-60, Math.min(60, ev.deltaY)) * 0.0016);
        this._targetK = Math.max(R * 0.9, Math.min(R * 5, (this._targetK || this._k) * stepF));
        this._hold = true;
        clearTimeout(this._resume);
        this._resume = setTimeout(() => { this._hold = false; }, 1400);
      }, { passive: false });

      this._canvas.addEventListener("click", (ev) => {
        if (this._dragged) return;
        const r = this._canvas.getBoundingClientRect();
        const p = this._proj.invert([ev.clientX - r.left, ev.clientY - r.top]);
        if (!p) return;
        let hit = null;
        for (const f of this._geom.feats) { if (d3.geoContains(f, p)) { hit = f; break; } }
        if (hit && GUIDES[+hit.id]) { this._target = GUIDES[+hit.id]; this._furnDirty = true; }
        this.dispatchEvent(new CustomEvent("atlas-select", { bubbles: true,
          detail: { code: hit ? (GUIDES[+hit.id] || null) : null, name: hit ? ((hit.properties && hit.properties.name) || "") : "" } }));
      });

      this._dirty = true;
      this._start();
    }

    _start() {
      let last = performance.now();
      const frame = (t) => {
        this._loop = requestAnimationFrame(frame);
        const dt = Math.min(48, t - last);
        last = t;
        if (!this._visible || document.hidden) return;

        let moved = false;
        if (this._targetK != null && Math.abs(this._targetK - this._k) > 0.25) {
          this._k += (this._targetK - this._k) * Math.min(1, dt / 190);
          this._proj.scale(this._k);
          moved = true;
        }
        if (this._arcT < 1) { this._arcT = Math.min(1, this._arcT + dt / 1200); moved = true; }
        if (!this._reduced && !this._hold && !this._flying && !this._paused) {
          this._rot[0] = (this._rot[0] + dt * (this._spinDeg / 1000) * (this._R / this._k)) % 360;
          moved = true;
        }
        if (!moved && !this._dirty) return;
        this._dirty = false;
        this._proj.rotate(this._rot);

        const t0 = performance.now();
        this._draw(moved || this._hold || this._flying);
        // adaptive quality: sustained slow frames drop detail, then resolution
        const cost = performance.now() - t0;
        this._acc += cost; this._frames++;
        if (this._frames >= 45) {
          const avg = this._acc / this._frames;
          this._acc = 0; this._frames = 0;
          if (avg > 9 && this._degraded === 0) { this._degraded = 1; }
          else if (avg > 16 && this._degraded === 1) { this._degraded = 2; this._build(); return; }
          else if (avg < 5 && this._degraded === 1) { this._degraded = 0; }
        }
        // the page handler measures DOM on every atlas-pos, so throttle it hard
        this._emit();
      };
      this._loop = requestAnimationFrame(frame);
    }

    _draw(moving) {
      const { w, h } = this._dims, ctx = this._ctx, path = this._path, c = this._c;
      const lo = moving || this._degraded > 0;
      const wantPrec = lo ? 4 : 0.7;
      if (wantPrec !== this._prec) { this._proj.precision(wantPrec); this._prec = wantPrec; }
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath(); ctx.arc(w / 2, h / 2, this._k, 0, 6.2832);
      ctx.fillStyle = c.card; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = c.rule2; ctx.stroke();

      if (!(lo && this._degraded > 1)) {
        ctx.beginPath(); path(lo ? this._gratCoarse : this._grat);
        ctx.globalAlpha = 0.42; ctx.lineWidth = 0.5; ctx.strokeStyle = c.rule2; ctx.stroke();
        if (!lo) {
          ctx.beginPath(); path(this._tropics);
          ctx.globalAlpha = 0.3; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
        // index contours — the equator and prime meridian read at full strength, so the
        // spin has a fixed reference rather than 36 identical lines
        ctx.beginPath(); path(this._indexLines);
        ctx.lineWidth = 1.1; ctx.strokeStyle = c.rule2; ctx.stroke();
      }

      const tier = lo ? this._geom.fast : this._geom.full;
      const centre0 = [-this._rot[0], -this._rot[1]];
      const geoDist = window.d3.geoDistance;
      const HALF = Math.PI / 2;
      const drawSet = (set) => {
        for (const f of set) {
          const cap = f.__cap;
          if (cap && geoDist(cap.ctr, centre0) - cap.rad > HALF) continue; // wholly behind the globe
          path(f);
        }
      };
      ctx.beginPath(); drawSet(tier.plain);
      ctx.fillStyle = c.sunken; ctx.fill();
      if (!lo) { ctx.lineWidth = 0.6; ctx.strokeStyle = c.rule2; ctx.stroke(); }
      ctx.beginPath(); drawSet(tier.guides);
      ctx.fillStyle = "rgba(156,68,33,.32)"; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "#9c4421"; ctx.stroke();

      const centre = [-this._rot[0], -this._rot[1]];
      if (this._arcT > 0.001) {
        ctx.save();
        ctx.setLineDash([5, 5]); ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(156,68,33,.72)";
        ctx.beginPath();
        for (const a of this._arcs) {
          const n = a.line.coordinates.length;
          const cut = Math.max(2, Math.round(n * this._arcT));
          path({ type: "LineString", coordinates: a.line.coordinates.slice(0, cut) });
        }
        ctx.stroke();
        ctx.restore();
        const hp = this._proj(this._home.p);
        if (window.d3.geoDistance(this._home.p, centre) < 1.5) {
          ctx.beginPath(); ctx.arc(hp[0], hp[1], 4.5, 0, 6.2832);
          ctx.fillStyle = c.bg; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = "#9c4421"; ctx.stroke();
          if (!lo) {
            ctx.font = "600 9px 'Source Sans 3', system-ui, sans-serif";
            ctx.fillStyle = c.muted;
            ctx.fillText(this._home.label, hp[0] + 9, hp[1] + 3);
          }
        }
      }

      // terminator — the polygon only changes as the sun moves, so rebuild once a minute
      const min = Math.floor(Date.now() / 60000);
      if (min !== this._nightMin) {
        const anti = subsolar(new Date());
        this._nightGeom = this._nightGen.center([anti[0] + 180, -anti[1]])();
        this._nightMin = min;
      }
      { const full = this._dark ? "rgba(0,0,0,.30)" : "rgba(15,19,23,.17)";
        ctx.beginPath(); path(this._nightGeom);
        ctx.fillStyle = full; ctx.fill();
        // dusk band: a few shrinking caps stacked at low alpha turn the hard edge into a gradient
        if (!lo) {
          const bands = [[86, .05], [82, .05], [78, .04]];
          for (const [r, a] of bands) {
            ctx.beginPath(); path(this._nightGen.radius(r)());
            ctx.fillStyle = this._dark ? "rgba(0,0,0," + a + ")" : "rgba(15,19,23," + a + ")";
            ctx.fill();
          }
          this._nightGen.radius(90);
        }
        ctx.beginPath(); path(this._nightGeom);
        ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.strokeStyle = c.rule2; ctx.stroke(); ctx.globalAlpha = 1;
      }

      // pins — SVG, only touched when they actually move
      const d3 = window.d3;
      for (const code in ANCHORS) {
        const p = this._proj(ANCHORS[code]);
        const vis = d3.geoDistance(ANCHORS[code], centre) < 1.42;
        const node = this._pins[code], prev = this._pinAt[code];
        const x = Math.round(p[0] * 10) / 10, y = Math.round(p[1] * 10) / 10;
        if (!prev || prev.x !== x || prev.y !== y) node.setAttribute("transform", "translate(" + x + "," + y + ")");
        if (!prev || prev.v !== vis) vis ? node.removeAttribute("display") : node.setAttribute("display", "none");
        this._pinAt[code] = { x, y, v: vis, fx: p[0], fy: p[1] };
      }
      // limb shading — a faint darkening toward the rim so the disc reads as a sphere
      { const cx = w / 2, cy = h / 2, k = this._k;
        if (!this._limb || this._limbK !== k || this._limbDark !== this._dark || this._limbW !== w || this._limbH !== h) {
          const g = ctx.createRadialGradient(cx - k * 0.22, cy - k * 0.26, k * 0.1, cx, cy, k);
          if (this._dark) {
            g.addColorStop(0, "rgba(255,255,255,.05)");
            g.addColorStop(0.62, "rgba(0,0,0,0)");
            g.addColorStop(1, "rgba(0,0,0,.34)");
          } else {
            g.addColorStop(0, "rgba(255,255,255,.16)");
            g.addColorStop(0.6, "rgba(0,0,0,0)");
            g.addColorStop(1, "rgba(23,29,36,.17)");
          }
          this._limb = g; this._limbK = k; this._limbDark = this._dark; this._limbW = w; this._limbH = h;
        }
        ctx.beginPath(); ctx.arc(cx, cy, k, 0, 6.2832);
        ctx.fillStyle = this._limb; ctx.fill();
      }
      this._furniture();
    }

    _emit() {
      const { w, h } = this._dims;
      const D = this._detail || (this._detail = { w, h, center: [0, 0], zoom: 1, kr: { x: 0, y: 0, v: false }, jp: { x: 0, y: 0, v: false }, dk: { x: 0, y: 0, v: false }, us: { x: 0, y: 0, v: false } });
      D.w = w; D.h = h;
      D.center[0] = -this._rot[0]; D.center[1] = -this._rot[1];
      D.zoom = this._k / this._R;
      for (const code in ANCHORS) {
        const p = this._pinAt[code], slot = D[code];
        if (p) { slot.x = p.fx; slot.y = p.fy; slot.v = p.v; }
      }
      this.dispatchEvent(new CustomEvent("atlas-pos", { bubbles: true, detail: D }));
    }

    // instrument furniture on its own layer — only repainted when a reading changes
    _furniture() {
      const { w, h } = this._dims, c = this._c, R = this._R;
      const centre = [-this._rot[0], -this._rot[1]];
      let target = this._target;
      if (!target) {
        let best = Infinity;
        for (const code in ANCHORS) {
          const dd = distanceKm(centre, ANCHORS[code]);
          if (dd < best) { best = dd; target = code; }
        }
      }
      const brg = bearing(centre, ANCHORS[target]);
      if (this._needle == null) this._needle = brg;
      else {
        const diff = ((brg - this._needle + 540) % 360) - 180;
        if (Math.abs(diff) > 0.3) { this._needle = (this._needle + diff * 0.18 + 360) % 360; this._dirty = true; }
      }
      const km = Math.round(distanceKm(centre, ANCHORS[target]));
      const kmPerPx = 6371 / R * (R / this._k);
      let stepKm = 2000, px = stepKm / kmPerPx;
      while (px > 130) { stepKm /= 2; px = stepKm / kmPerPx; }
      while (px < 55) { stepKm *= 2; px = stepKm / kmPerPx; }
      const sig = (w < 620 ? "n" : "w") + "|" + target + "|" + Math.round(this._needle) + "|" + Math.round(brg) + "|" + km + "|" + stepKm + "|" + (this._dark ? 1 : 0) + "|" + w + "x" + h;
      if (sig === this._furnSig && !this._furnDirty) return;
      this._furnSig = sig; this._furnDirty = false;

      const ctx = this._furnCtx;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = c.rule2; ctx.lineWidth = 1;
      const P = 14, T = 16;
      [[P, P, 1, 1], [w - P, P, -1, 1], [P, h - P, 1, -1], [w - P, h - P, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(x + sx * T, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * T); ctx.stroke();
      });
      const narrow = w < 620;
      const rx = narrow ? w / 2 : w - 58, ry = narrow ? 52 : 66, rr = narrow ? 20 : 24;
      ctx.beginPath(); ctx.arc(rx, ry, rr, 0, 6.2832); ctx.stroke();
      for (let a = 0; a < 360; a += 15) {
        const t = (a - 90) * Math.PI / 180;
        const inner = a % 90 === 0 ? rr - 8 : a % 45 === 0 ? rr - 5 : rr - 3;
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(t) * inner, ry + Math.sin(t) * inner);
        ctx.lineTo(rx + Math.cos(t) * rr, ry + Math.sin(t) * rr);
        ctx.stroke();
      }
      ctx.font = "700 8.5px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillStyle = c.muted; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(([lbl, a]) => {
        const t = (a - 90) * Math.PI / 180;
        ctx.fillText(lbl, rx + Math.cos(t) * (rr + 8), ry + Math.sin(t) * (rr + 8));
      });
      const nt = (this._needle - 90) * Math.PI / 180, nx = Math.cos(nt), ny = Math.sin(nt);
      ctx.beginPath();
      ctx.moveTo(rx + nx * (rr - 5), ry + ny * (rr - 5));
      ctx.lineTo(rx - ny * 4.5 - nx * 5, ry + nx * 4.5 - ny * 5);
      ctx.lineTo(rx + ny * 4.5 - nx * 5, ry - nx * 4.5 - ny * 5);
      ctx.closePath(); ctx.fillStyle = "#9c4421"; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rx - nx * (rr - 7), ry - ny * (rr - 7)); ctx.lineTo(rx - nx * 5, ry - ny * 5);
      ctx.lineWidth = 1.4; ctx.strokeStyle = c.muted; ctx.stroke();
      ctx.beginPath(); ctx.arc(rx, ry, 2.4, 0, 6.2832);
      ctx.fillStyle = c.bg; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = c.muted; ctx.stroke();
      ctx.font = "640 9.5px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillStyle = "#9c4421";
      ctx.fillText(target.toUpperCase() + "  " + String(Math.round(brg)).padStart(3, "0") + "°", rx, ry + rr + 16);
      ctx.font = "600 8.5px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillStyle = c.muted;
      ctx.fillText(km.toLocaleString() + " km", rx, ry + rr + 28);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const bx2 = 22, by2 = h - 30;
      ctx.strokeStyle = c.muted; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx2, by2 - 4); ctx.lineTo(bx2, by2); ctx.lineTo(bx2 + px, by2); ctx.lineTo(bx2 + px, by2 - 4);
      ctx.stroke();
      ctx.font = "600 9.5px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillStyle = c.muted;
      ctx.fillText(Math.round(stepKm).toLocaleString() + " km", bx2, by2 - 8);
    }

    flyTo(code, dur) {
      if (!window.d3 || !this._proj || !ANCHORS[code]) return false;
      this._target = code; this._furnDirty = true;
      const [lon, lat] = ANCHORS[code];
      const startRot = this._rot.slice(), startK = this._k, endK = this._R * 2.1;
      const endLon = startRot[0] + (((-lon - startRot[0] + 540) % 360) - 180);
      const t0 = performance.now(), d2 = dur || 1100;
      const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this._flying = true;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / d2), e = ease(p);
        this._rot = [startRot[0] + (endLon - startRot[0]) * e, startRot[1] + (-lat - startRot[1]) * e];
        this._k = startK + (endK - startK) * e; this._targetK = this._k;
        this._proj.rotate(this._rot).scale(this._k);
        this._dirty = true;
        if (p < 1) requestAnimationFrame(step);
        else { this._flying = false; this._hold = true; clearTimeout(this._resume); this._resume = setTimeout(() => { this._hold = false; }, 2600); }
      };
      clearTimeout(this._flyEnd);
      this._flyEnd = setTimeout(() => { this._flying = false; }, d2 + 150);
      requestAnimationFrame(step);
      return true;
    }
    zoomBy(f) {
      if (!this._R) return;
      this._targetK = Math.max(this._R * 0.9, Math.min(this._R * 5, (this._targetK || this._k) * f));
      this._hold = true; clearTimeout(this._resume);
      this._resume = setTimeout(() => { this._hold = false; }, 1400);
    }
    resetView() { this._targetK = this._R; this._hold = false; this._target = null; this._furnDirty = true; this._dirty = true; }
    toggleSpin() { this._paused = !this._paused; this._dirty = true; return !this._paused; }
    flyIn(code, dur) {
      if (!window.d3 || !this._proj || !ANCHORS[code]) return false;
      const [lon, lat] = ANCHORS[code], R = this._R;
      const startRot = [-lon, -lat], endRot = [-127, -26];
      const startK = R * 3.2, endK = R;
      this._flying = true;
      this._rot = startRot.slice(); this._k = startK; this._targetK = endK;
      this._proj.rotate(this._rot).scale(this._k);
      this._dirty = true;
      const t0 = performance.now();
      const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur), e = ease(p);
        this._rot = [startRot[0] + (endRot[0] - startRot[0]) * e, startRot[1] + (endRot[1] - startRot[1]) * e];
        this._k = startK + (endK - startK) * e; this._targetK = this._k;
        this._proj.rotate(this._rot).scale(this._k);
        this._dirty = true;
        if (p < 1) requestAnimationFrame(step);
        else { this._flying = false; this._targetK = endK; }
      };
      clearTimeout(this._flyEnd);
      this._flyEnd = setTimeout(() => { this._flying = false; }, dur + 150);
      requestAnimationFrame(step);
      return true;
    }
  }
  if (!customElements.get("atlas-map")) customElements.define("atlas-map", AtlasMap);
})();
