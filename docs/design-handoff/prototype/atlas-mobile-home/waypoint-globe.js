/* <waypoint-globe> — compact canvas recreation of the repo's <atlas-map> (src/features/atlas/ui/atlas-map.js)
   for design mockups. Same visual grammar: card-paper sphere, graticule, sunken countries,
   oxide guide countries, day/night terminator, pulsing pins, limb shading.
   Colors read from CSS custom props on the host (--card/--sunken/--rule2/--muted/--bg), like the repo.
   Attrs: center="lng,lat" · zoom · spin (deg/s, "0" pauses) · pins='[{"lng":..,"lat":..,"surveyed":true}]'
          · offset-y (px shift of sphere centre) · dark (present = dark night tint) · src (topojson) */
(function () {
  if (customElements.get("waypoint-globe")) return;
  var RAD = Math.PI / 180;
  var GUIDE_IDS = { 392: 1, 840: 1, 410: 1, 208: 1 }; // Japan, US, Korea, Denmark (src/data/countries.mjs COUNTRY_ISO_NUMERIC)
  var worldPromise = null;

  function decode(topo) {
    var s = topo.transform.scale, tr = topo.transform.translate;
    var arcs = topo.arcs.map(function (a) {
      var x = 0, y = 0;
      return a.map(function (p) { x += p[0]; y += p[1]; return [x * s[0] + tr[0], y * s[1] + tr[1]]; });
    });
    function ring(idx) {
      var pts = [];
      idx.forEach(function (i) {
        var a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
        if (pts.length) a = a.slice(1);
        pts = pts.concat(a);
      });
      return pts;
    }
    function thin(r) {
      if (r.length <= 30) return r;
      var out = [];
      for (var i = 0; i < r.length; i += 2) out.push(r[i]);
      if (out[out.length - 1] !== r[r.length - 1]) out.push(r[r.length - 1]);
      return out;
    }
    var out = [];
    topo.objects.countries.geometries.forEach(function (g) {
      var rings = [];
      if (g.type === "Polygon") rings = g.arcs.map(ring);
      else if (g.type === "MultiPolygon") g.arcs.forEach(function (p) { p.forEach(function (r) { rings.push(ring(r)); }); });
      out.push({ id: +g.id, rings: rings.map(thin) });
    });
    return out;
  }
  function loadWorld(src) {
    if (!worldPromise) worldPromise = fetch(src).then(function (r) { return r.json(); }).then(decode);
    return worldPromise;
  }
  // repo atlas-map.js subsolar()
  function subsolar(date) {
    var jd = date / 864e5 + 2440587.5, n = jd - 2451545.0;
    var L = (280.460 + 0.9856474 * n) % 360;
    var g = ((357.528 + 0.9856003 * n) % 360) * RAD;
    var lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    var eps = (23.439 - 4e-7 * n) * RAD;
    var dec = Math.asin(Math.sin(eps) * Math.sin(lambda)) / RAD;
    var ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / RAD;
    var gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    return [((ra - gmst * 15 + 540) % 360) - 180, dec];
  }
  function circle90(clng, clat) {
    var pts = [], p1 = clat * RAD;
    for (var i = 0; i <= 72; i++) {
      var th = (i / 72) * 2 * Math.PI;
      var p2 = Math.asin(Math.cos(p1) * Math.cos(th));
      var l2 = clng * RAD + Math.atan2(Math.sin(th) * Math.cos(p1), -Math.sin(p1) * Math.sin(p2));
      pts.push([l2 / RAD, p2 / RAD]);
    }
    return pts;
  }
  function inRing(ring, lng, lat) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function cssVar(el, prop, fb) {
    var v = getComputedStyle(el).getPropertyValue(prop).trim();
    return v || fb;
  }

  class WaypointGlobe extends HTMLElement {
    static get observedAttributes() { return ["spin", "center", "zoom", "focus", "pins"]; }
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.display = "block";
      if (getComputedStyle(this).position === "static") this.style.position = "relative";
      var cv = this._cv = document.createElement("canvas");
      cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
      this.appendChild(cv);
      this._rot = this._parseCenter();
      var self = this;
      loadWorld(this.getAttribute("src") || "public/data/countries-110m.json").then(function (w) {
        self._world = w; self._start();
      }).catch(function (e) { console.error("waypoint-globe: world load failed", e); self._start(); });
      this._ro = new ResizeObserver(function () { self._size(); });
      this._ro.observe(this);
      this._visible = true;
      this._io = new IntersectionObserver(function (es) { self._visible = es[es.length - 1].isIntersecting; self._dirty = true; }, { threshold: 0 });
      this._io.observe(this);
      this._size();
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    attributeChangedCallback(n) {
      if (n === "center") this._rot = this._parseCenter();
      this._dirty = true;
    }
    /* invert the orthographic projection at element-local px,py → {lng,lat,countryId|null}, or null off-sphere */
    pick(px, py) {
      var w = this._w, h = this._h;
      var zoom = parseFloat(this.getAttribute("zoom") || "1");
      var offY = parseFloat(this.getAttribute("offset-y") || "0");
      var R = (Math.min(w, h) / 2 - 8) * zoom, cx = w / 2, cy = h / 2 + offY;
      var X = (px - cx) / R, Y = -(py - cy) / R, d = X * X + Y * Y;
      if (d > 1) return null;
      var Z = Math.sqrt(1 - d), cL = this._rot[0], cP = this._rot[1];
      var sinP = Math.sin(cP * RAD), cosP = Math.cos(cP * RAD);
      var lat = Math.asin(cosP * Y + sinP * Z) / RAD;
      var lng = cL + Math.atan2(X, cosP * Z - sinP * Y) / RAD;
      lng = ((lng + 540) % 360) - 180;
      var id = null;
      if (this._world) for (var i = 0; i < this._world.length && id === null; i++)
        for (var r = 0; r < this._world[i].rings.length; r++)
          if (inRing(this._world[i].rings[r], lng, lat)) { id = this._world[i].id; break; }
      return { lng: lng, lat: lat, countryId: id };
    }
    _parseCenter() {
      var c = (this.getAttribute("center") || "-127,26").split(",");
      return [parseFloat(c[0]) || 0, parseFloat(c[1]) || 0];
    }
    _size() {
      var w = this.clientWidth || 300, h = this.clientHeight || 300;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._w = w; this._h = h;
      this._cv.width = Math.round(w * dpr); this._cv.height = Math.round(h * dpr);
      this._cx = this._cv.getContext("2d");
      this._cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._limb = null;
      this._dirty = true;
    }
    _colors() {
      return {
        card: cssVar(this, "--card", "#f8faf3"), sunken: cssVar(this, "--sunken", "#d2d7c8"),
        rule2: cssVar(this, "--rule2", "#a3ac98"), muted: cssVar(this, "--muted", "#4e5747"),
        bg: cssVar(this, "--bg", "#dfe3d9"),
      };
    }
    _start() {
      if (this._raf) return;
      this._dirty = true;
      // guarantee a first paint even if the RAF loop's visibility gate is stale
      try { this._draw(performance.now(), false); } catch (e) { console.error(e); }
      var self = this, last = performance.now();
      // Dirty-flag loop (mirrors the repo's atlas-map.js): idle frames cost nothing —
      // a static globe (spin=0, off-screen, or reduced motion) redraws only when marked dirty.
      var loop = function (t) {
        self._raf = requestAnimationFrame(loop);
        var dt = Math.min(48, t - last); last = t;
        if (document.hidden) return;
        if (!self._visible && !self._dirty) return;
        var spin = parseFloat(self.getAttribute("spin") || "11");
        var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        var animating = spin > 0 && !reduced;
        if (animating) self._rot[0] = (self._rot[0] + dt * spin / 1000) % 360;
        if (!animating && !self._dirty) return;
        self._dirty = false;
        self._draw(t, animating);
      };
      this._raf = requestAnimationFrame(loop);
    }
    _ringPath(ring, cL, cP, cx, cy, R) {
      var sinP = Math.sin(cP * RAD), cosP = Math.cos(cP * RAD);
      var pts = null, prev = null, any = false, ctx = this._cx;
      for (var i = 0; i < ring.length; i++) {
        var lng = ring[i][0], lat = ring[i][1];
        var a = (lng - cL) * RAD, ph = lat * RAD;
        var cph = Math.cos(ph), sph = Math.sin(ph), ca = Math.cos(a);
        var X = cph * Math.sin(a);
        var Y = cosP * sph - sinP * cph * ca;
        var Z = sinP * sph + cosP * cph * ca;
        var cur = [X, Y, Z];
        if (Z > 0) {
          if (prev && prev[2] <= 0) { // entering
            var t = prev[2] / (prev[2] - Z);
            var Xc = prev[0] + t * (X - prev[0]), Yc = prev[1] + t * (Y - prev[1]);
            var n = Math.hypot(Xc, Yc) || 1;
            if (!any) { ctx.moveTo(cx + R * Xc / n, cy - R * Yc / n); any = true; }
            else ctx.lineTo(cx + R * Xc / n, cy - R * Yc / n);
          }
          if (!any) { ctx.moveTo(cx + R * X, cy - R * Y); any = true; }
          else ctx.lineTo(cx + R * X, cy - R * Y);
        } else if (prev && prev[2] > 0) { // exiting
          var t2 = prev[2] / (prev[2] - Z);
          var Xe = prev[0] + t2 * (X - prev[0]), Ye = prev[1] + t2 * (Y - prev[1]);
          var n2 = Math.hypot(Xe, Ye) || 1;
          ctx.lineTo(cx + R * Xe / n2, cy - R * Ye / n2);
        }
        prev = cur;
      }
      return any;
    }
    _line(ring, cL, cP, cx, cy, R) {
      // stroke-only polyline (graticule) — breaks at the limb instead of chording across
      var sinP = Math.sin(cP * RAD), cosP = Math.cos(cP * RAD), ctx = this._cx, pen = false;
      for (var i = 0; i < ring.length; i++) {
        var a = (ring[i][0] - cL) * RAD, ph = ring[i][1] * RAD;
        var cph = Math.cos(ph);
        var X = cph * Math.sin(a);
        var Y = cosP * Math.sin(ph) - sinP * cph * Math.cos(a);
        var Z = sinP * Math.sin(ph) + cosP * cph * Math.cos(a);
        if (Z > 0) { if (pen) ctx.lineTo(cx + R * X, cy - R * Y); else { ctx.moveTo(cx + R * X, cy - R * Y); pen = true; } }
        else pen = false;
      }
    }
    _draw(time, animating) {
      var ctx = this._cx; if (!ctx) return;
      var w = this._w, h = this._h, c = this._colors();
      var dark = this.hasAttribute("dark");
      var zoom = parseFloat(this.getAttribute("zoom") || "1");
      var offY = parseFloat(this.getAttribute("offset-y") || "0");
      var R = (Math.min(w, h) / 2 - 8) * zoom;
      var cx = w / 2, cy = h / 2 + offY;
      var cL = this._rot[0], cP = this._rot[1];
      ctx.clearRect(0, 0, w, h);
      // sphere
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832);
      ctx.fillStyle = c.card; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = c.rule2; ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip();
      // graticule (15°) + equator/prime meridian index lines
      ctx.beginPath();
      for (var lat = -75; lat <= 75; lat += 15) {
        var par = []; for (var x = -180; x <= 180; x += 5) par.push([x, lat]);
        this._line(par, cL, cP, cx, cy, R);
      }
      for (var lng = -180; lng < 180; lng += 15) {
        var mer = []; for (var y = -85; y <= 85; y += 5) mer.push([lng, y]);
        this._line(mer, cL, cP, cx, cy, R);
      }
      ctx.globalAlpha = 0.42; ctx.lineWidth = 0.5; ctx.strokeStyle = c.rule2; ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      var eq = []; for (var x2 = -180; x2 <= 180; x2 += 4) eq.push([x2, 0]);
      var pm = []; for (var y2 = -90; y2 <= 90; y2 += 4) pm.push([0, y2]);
      this._line(eq, cL, cP, cx, cy, R); this._line(pm, cL, cP, cx, cy, R);
      ctx.lineWidth = 1.1; ctx.strokeStyle = c.rule2; ctx.stroke();
      // countries
      if (this._world) {
        var plain = [], guides = [];
        for (var i = 0; i < this._world.length; i++) (GUIDE_IDS[this._world[i].id] ? guides : plain).push(this._world[i]);
        ctx.beginPath();
        for (var p = 0; p < plain.length; p++) for (var r = 0; r < plain[p].rings.length; r++) this._ringPath(plain[p].rings[r], cL, cP, cx, cy, R);
        ctx.fillStyle = c.sunken; ctx.fill();
        ctx.lineWidth = 0.6; ctx.strokeStyle = c.rule2; ctx.stroke();
        ctx.beginPath();
        for (var g2 = 0; g2 < guides.length; g2++) for (var r2 = 0; r2 < guides[g2].rings.length; r2++) this._ringPath(guides[g2].rings[r2], cL, cP, cx, cy, R);
        ctx.fillStyle = "rgba(156,68,33,.32)"; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = "#9c4421"; ctx.stroke();
      }
      // terminator
      var min = Math.floor(Date.now() / 60000);
      if (min !== this._nightMin) {
        var anti = subsolar(new Date());
        this._night = circle90(anti[0] + 180, -anti[1]);
        this._nightMin = min;
      }
      if (this._night) {
        ctx.beginPath(); this._ringPath(this._night, cL, cP, cx, cy, R);
        ctx.fillStyle = dark ? "rgba(0,0,0,.30)" : "rgba(15,19,23,.17)"; ctx.fill();
        ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.strokeStyle = c.rule2; ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.restore();
      // pins (bare pings, mobile spec)
      var pins = [];
      try { pins = JSON.parse(this.getAttribute("pins") || "[]"); } catch (e) { }
      var sinP = Math.sin(cP * RAD), cosP = Math.cos(cP * RAD);
      var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      for (var k = 0; k < pins.length; k++) {
        var pn = pins[k];
        var a3 = (pn.lng - cL) * RAD, ph3 = pn.lat * RAD;
        var cph3 = Math.cos(ph3);
        var X3 = cph3 * Math.sin(a3);
        var Y3 = cosP * Math.sin(ph3) - sinP * cph3 * Math.cos(a3);
        var Z3 = sinP * Math.sin(ph3) + cosP * cph3 * Math.cos(a3);
        if (Z3 < 0.08) continue;
        var px = cx + R * X3, py = cy - R * Y3;
        if (animating && !reduced) { // pulse only while the globe is live — a paused globe is a still sheet
          var t3 = ((time + k * 700) % 2400) / 2400;
          ctx.beginPath(); ctx.arc(px, py, 8 + 14 * t3, 0, 6.2832);
          ctx.strokeStyle = "rgba(156,68,33," + (0.55 * Math.max(0, 1 - t3 / 0.7)) + ")";
          ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(px, py, 6.5, 0, 6.2832);
        ctx.fillStyle = pn.surveyed ? "#9c4421" : c.muted;
        ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = c.bg; ctx.stroke();
      }
      // focus halo — steady ring on the selected pin
      var foc = (this.getAttribute("focus") || "").split(",");
      if (foc.length === 2) {
        var fl = parseFloat(foc[0]), fp = parseFloat(foc[1]) * RAD;
        var a4 = (fl - cL) * RAD, cph4 = Math.cos(fp);
        var X4 = cph4 * Math.sin(a4);
        var Y4 = cosP * Math.sin(fp) - sinP * cph4 * Math.cos(a4);
        var Z4 = sinP * Math.sin(fp) + cosP * cph4 * Math.cos(a4);
        if (Z4 > 0.08) {
          var fx = cx + R * X4, fy = cy - R * Y4;
          ctx.beginPath(); ctx.arc(fx, fy, 12, 0, 6.2832);
          ctx.lineWidth = 2; ctx.strokeStyle = dark ? "#d98a94" : "#9c4421"; ctx.stroke();
          ctx.beginPath(); ctx.arc(fx, fy, 17, 0, 6.2832);
          ctx.globalAlpha = 0.45; ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
      // limb shading
      if (!this._limb || this._limbDark !== dark || this._limbR !== R) {
        var gr = ctx.createRadialGradient(cx - R * 0.22, cy - R * 0.26, R * 0.1, cx, cy, R);
        if (dark) { gr.addColorStop(0, "rgba(255,255,255,.05)"); gr.addColorStop(0.62, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.34)"); }
        else { gr.addColorStop(0, "rgba(255,255,255,.16)"); gr.addColorStop(0.6, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(23,29,36,.17)"); }
        this._limb = gr; this._limbDark = dark; this._limbR = R;
      }
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832);
      ctx.fillStyle = this._limb; ctx.fill();
    }
  }
  customElements.define("waypoint-globe", WaypointGlobe);
})();
