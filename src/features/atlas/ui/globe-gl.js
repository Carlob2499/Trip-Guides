/* WebGL globe skin — the Atlas sphere's BODY, in three.js.
 *
 * WHY THIS EXISTS. The d3 canvas globe draws a correct orthographic projection and reads flat:
 * land is one fill, the terminator is a hard wedge, and the limb ends on a bare edge with no
 * atmosphere. Those are not tuning faults — a 2D projection has no lighting model to tune. This
 * module puts the same world on a real sphere so light can behave like light: a soft day/night
 * terminator, specular that lands on ocean and dies on land, and a fresnel atmosphere.
 *
 * WHAT IT IS NOT — and this is the whole safety argument. It is a SKIN, not a globe. It owns no
 * rotation, no drag, no flight, no zoom, no guide data and no events. atlas-map.js keeps all of
 * that, unchanged and still tested; every frame it hands this module the rotation and radius it
 * already computed, and this module paints a sphere at exactly that orientation and size. The
 * pins, arcs, brand country tint and hit-testing continue to come from d3's own projection, so
 * they cannot drift out of register with the art — there is only one source of orientation.
 *
 * That is also why the camera is ORTHOGRAPHIC. d3.geoOrthographic is literally an orthographic
 * projection; a perspective camera would place the 3D coastline a few pixels off the 2D pin that
 * is supposed to be standing on it, and the error would grow toward the limb. Orthographic, with
 * the sphere scaled to d3's own pixel radius, makes the two projections the same projection.
 * tests/visual/map-geometry.spec.ts holds that alignment.
 *
 * BUDGET. Reached only through a dynamic import() from atlas-map.js, so three.js lands in an
 * on-demand chunk and never enters any page's first-paint graph (check-perf-budget.mjs derives
 * "on-demand" structurally from exactly that). Textures are build-time WebP baked from the
 * already-vendored topology — see scripts/gen-earth-texture.mjs. Nothing is fetched from a CDN.
 *
 * The import list is explicit rather than `import * as THREE` so Rollup can tree-shake the small
 * three.js surface this file touches out of a ~600 KB library.
 */

import {
  WebGLRenderer, Scene, OrthographicCamera, Mesh, Group,
  SphereGeometry, ShaderMaterial, TextureLoader, Vector3,
  BackSide, SRGBColorSpace, NoColorSpace, LinearFilter, AdditiveBlending, Color,
} from "three";

/* The sphere is built at unit radius and SCALED to d3's pixel radius each frame, so one mesh
   serves every viewport and the resize path allocates nothing. The atmosphere shell is kept
   tight: d3 sizes its disc to (min(w,h)/2 - 14), so a shell much beyond ~1.03 gets clipped by
   the pane's own edge on the short axis and the halo ends in a straight cut. */
const ATMO_SCALE = 1.028;

/* Half-depth of the orthographic frustum, in world units (== CSS pixels here). The sphere's
   radius is d3's `k`, a few hundred pixels at most, so 4000 leaves the whole planet inside the
   slab at every viewport with room to spare. */
const DEPTH_HALF = 4000;

/* ── Shaders ──────────────────────────────────────────────────────────────────────────────
   Two programs, both short on purpose: a shader nobody can read is a shader nobody can fix. */

const GLOBE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* uSun is a WORLD-space direction. The globe group rotates under it, so the lit face changes as
   the reader drags — the sun stays put and the planet turns, which is the way round that makes
   the terminator mean something. */
const GLOBE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform sampler2D uMask;
  uniform vec3 uSun;
  uniform vec3 uNightTint;
  uniform vec3 uRimColor;
  varying vec2 vUv;
  varying vec3 vNormal;

  /* The exact sRGB transfer curve, not a 2.2 gamma approximation — the linear segment near black
     is what keeps the night side's deep navies from going flat. */
  vec3 linearToSRGB(vec3 c) {
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
    return clamp(mix(hi, lo, step(c, vec3(0.0031308))), 0.0, 1.0);
  }

  void main() {
    vec3 base = texture2D(uMap, vUv).rgb;
    float land = texture2D(uMask, vUv).r;
    vec3 n = normalize(vNormal);
    vec3 sun = normalize(uSun);

    /* Soft terminator, spread wide. This is a MAP before it is a render: the night side carries
       pins, labels and route arcs the reader has to be able to see, so the day/night split is a
       shift in warmth and level, never a fade to black. An astronomically faithful terminator
       looked spectacular and hid half the content — the wide smoothstep and the high night floor
       below are a deliberate trade of realism for legibility. */
    float day = smoothstep(-0.78, 0.78, dot(n, sun));

    /* Night keeps most of the map's own value and leans toward the frame's navy, so coastlines
       stay readable on the dark limb. A globe whose night side is a void loses half its
       information — and every pin sitting on it. */
    vec3 night = mix(base * 0.66, uNightTint, 0.28);
    vec3 lit = base * 1.32;
    vec3 col = mix(night, lit, day);

    /* Specular on water only: land == 1 kills it. That is what makes the oceans read as a
       different MATERIAL from the continents rather than just a different colour. Tight and faint
       on purpose — under an orthographic camera the view direction is constant, so a broad
       highlight becomes one big stationary blob sitting on the middle of the planet. */
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 h = normalize(sun + viewDir);
    float spec = pow(max(dot(n, h), 0.0), 120.0) * (1.0 - land) * day;
    col += vec3(0.34, 0.50, 0.68) * spec * 0.30;

    /* Inner rim: a thin cool lift exactly at the limb, sitting under the atmosphere shell.
       Without it the sphere's edge meets the outer glow with a visible seam. */
    float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.2);
    col += uRimColor * rim * 0.55;

    /* Encode back to sRGB. The colour map is flagged SRGBColorSpace, so WebGL2 hands this shader
       LINEAR samples and all the lighting above is correctly done in linear space — but a raw
       ShaderMaterial gets none of three's automatic output conversion, so writing col straight
       out would put linear values in an sRGB buffer and crush every mid-tone toward black. That
       is not a brightness preference; it is the missing half of the colour pipeline. */
    gl_FragColor = vec4(linearToSRGB(col), 1.0);
  }
`;

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Back-faced additive shell: rendering the INSIDE of a slightly larger sphere puts the glow
   outside the planet's silhouette instead of over its face. */
const ATMO_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uSun;
  uniform float uStrength;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    float fres = pow(1.0 - abs(n.z), 3.4);
    /* Brightest where the air is actually being lit. A uniform halo reads as a sticker. */
    float sun = smoothstep(-0.75, 0.45, dot(n, normalize(uSun)));
    gl_FragColor = vec4(uColor, fres * uStrength * (0.28 + 0.72 * sun));
  }
`;

/**
 * World-space direction to the sun for an instant — the sub-solar point as a unit vector, in the
 * same frame the sphere's own geometry uses (see the UV note in mountGlobeSkin).
 */
export function sunDirection(date = new Date()) {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  /* Sub-solar longitude: the sun is overhead at noon local mean solar time. */
  const lng = (12 - utcHours) * 15;
  /* Declination, low-precision (Cooper): ±23.44° over the year, good to about a degree — far
     below what a 900 px sphere can resolve. */
  const dayOfYear = Math.floor((date - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000);
  const decl = 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81)) * (Math.PI / 180);
  const latRad = decl;
  const lngRad = lng * (Math.PI / 180);
  /* Same parameterisation as the sphere's UVs: +Y is north, and longitude runs so that the
     texture's prime meridian sits at the geometry's. */
  return new Vector3(
    -Math.cos(latRad) * Math.cos(lngRad + Math.PI / 2),
    Math.sin(latRad),
    Math.cos(latRad) * Math.sin(lngRad + Math.PI / 2),
  );
}

/**
 * Mount the WebGL skin into `host`.
 * Resolves to a controller, or null when WebGL or the textures are unavailable — in which case
 * the caller simply keeps painting the canvas globe it already has.
 *
 * @param {HTMLElement} host  positioned element to append the canvas to
 * @param {object} opts
 * @param {string} opts.base  site base path, for the texture URLs
 */
export async function mountGlobeSkin(host, { base = "" } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    return null; // no WebGL — caller keeps the canvas globe
  }

  /* DPR capped at 2, the same ceiling the canvas globe uses: a 3x phone gains nothing visible on
     a sphere this size and pays for it in fill rate. */
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);

  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  /* Pointer-events off is load-bearing: the canvas globe above it owns drag, wheel and click, and
     this layer must never intercept them. */
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";

  const loader = new TextureLoader();
  const load = (file) => new Promise((resolve, reject) => {
    loader.load(`${base}/textures/${file}`, resolve, undefined, () => reject(new Error(file)));
  });

  let map, mask;
  try {
    [map, mask] = await Promise.all([load("earth-map.webp"), load("earth-mask.webp")]);
  } catch {
    renderer.dispose();
    return null; // textures missing — canvas globe, not an untextured grey ball
  }
  /* The colour map is colour and gets the sRGB decode; the mask is DATA — a land/ocean flag —
     and must stay untouched, or "is this land" comes back through a gamma curve. */
  map.colorSpace = SRGBColorSpace;
  mask.colorSpace = NoColorSpace;
  for (const t of [map, mask]) { t.minFilter = LinearFilter; t.magFilter = LinearFilter; }

  /* Lighting colours come from the stylesheet (atlas-world.css --globe-*, which resolve to the
     --frame-* register in base.css), so the shader carries no palette of its own to drift out of
     step. Read once at mount: the globe lives in .spatial, which is dark in BOTH themes, so there
     is no theme flip to follow.

     There is deliberately NO hex fallback here. Hard-coding one would put a second copy of the
     palette in a file the design gate cannot treat as a token source, which is the exact drift
     this indirection exists to prevent — so if the tokens are absent the skin declines to mount
     and the canvas globe keeps drawing, rather than inventing colours of its own. */
  const styles = getComputedStyle(host);
  const tone = (prop) => styles.getPropertyValue(prop).trim();
  const [nightTone, rimTone, atmoTone] = ["--globe-night", "--globe-rim", "--globe-atmo"].map(tone);
  if (!nightTone || !rimTone || !atmoTone) {
    renderer.dispose();
    return null;
  }

  const scene = new Scene();
  /* Pixel-unit orthographic frustum, rebuilt on resize: 1 world unit == 1 CSS pixel, so scaling
     the sphere to d3's radius `k` puts its limb exactly on d3's disc. */
  /* The depth range has to CONTAIN the sphere, and the sphere is scaled to d3's pixel radius —
     hundreds of world units, not one. A near/far of 0.1/100 clips all but a thin slab through the
     middle of the planet, which renders as a disc with no visible geometry. DEPTH_HALF is well
     clear of any radius a viewport can ask for. */
  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, DEPTH_HALF * 2);
  camera.position.set(0, 0, DEPTH_HALF);

  const world = new Group();
  scene.add(world);

  const uSun = { value: sunDirection() };
  const globeMat = new ShaderMaterial({
    vertexShader: GLOBE_VERT,
    fragmentShader: GLOBE_FRAG,
    uniforms: {
      uMap: { value: map },
      uMask: { value: mask },
      uSun,
      uNightTint: { value: new Color(nightTone) },
      uRimColor: { value: new Color(rimTone) },
    },
  });
  const globe = new Mesh(new SphereGeometry(1, 96, 64), globeMat);
  world.add(globe);

  const atmoMat = new ShaderMaterial({
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    uniforms: { uColor: { value: new Color(atmoTone) }, uSun, uStrength: { value: 0.85 } },
    transparent: true,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false,
  });
  const atmo = new Mesh(new SphereGeometry(1, 64, 48), atmoMat);
  world.add(atmo);

  let onLost = null;
  const handleLost = (e) => { e.preventDefault(); onLost?.(); };
  canvas.addEventListener("webglcontextlost", handleLost, false);

  /* The sun moves a degree every four minutes; once a minute is already finer than the sphere can
     show, and matches the cadence the canvas globe rebuilds its terminator on. */
  const sunTimer = setInterval(() => { uSun.value.copy(sunDirection()); }, 60_000);

  /* FIRST child, not appended: this layer is the sphere's body and everything the canvas globe
     still draws — the brand tint on guide countries, the route arcs, the limb — has to sit ON TOP
     of it. Appending would bury the whole information layer under the art. */
  host.insertBefore(canvas, host.firstChild);

  let w = 0;
  let h = 0;

  return {
    canvas,

    /** Match the drawing buffer and frustum to the host's CSS pixel box. */
    resize(nextW, nextH) {
      w = Math.max(1, nextW | 0);
      h = Math.max(1, nextH | 0);
      renderer.setSize(w, h, false);
      camera.left = -w / 2; camera.right = w / 2;
      camera.top = h / 2; camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
    },

    /**
     * Paint one frame at d3's exact orientation and scale.
     * @param {[number, number]} rotate d3.geoOrthographic().rotate() — [lambda, phi], degrees
     * @param {number} k  d3 projection scale: the sphere's radius in CSS pixels
     */
    render(rotate, k) {
      if (!w || !h) return;
      /* d3's rotate([λ,φ]) turns the sphere so the point at (-λ,-φ) faces the viewer. Two things
         have to be right for the coastline to land under the pins d3 placed:

         LONGITUDE. three's SphereGeometry starts its UV seam at -X, which puts longitude -90°
         (not 0°) at +Z, facing the camera. Centring longitude L therefore needs a Y rotation of
         (-90 - L), and L is -λ, so the angle is (λ - 90).

         ORDER. d3 swings longitude first and then tilts latitude. Three's 'XYZ' Euler composes
         as Rx·Ry — the Y rotation applied first, then X — which is that same order. 'YXZ' would
         tilt first and shear the result away from d3 everywhere off the equator. */
      world.rotation.set(
        -rotate[1] * (Math.PI / 180),
        (rotate[0] - 90) * (Math.PI / 180),
        0,
        "XYZ",
      );
      globe.scale.setScalar(k);
      atmo.scale.setScalar(k * ATMO_SCALE);
      renderer.render(scene, camera);
    },

    onContextLost(fn) { onLost = fn; },

    dispose() {
      clearInterval(sunTimer);
      canvas.removeEventListener("webglcontextlost", handleLost);
      globe.geometry.dispose();
      atmo.geometry.dispose();
      globeMat.dispose();
      atmoMat.dispose();
      map.dispose();
      mask.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
