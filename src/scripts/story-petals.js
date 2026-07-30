/* Seasonal particle motifs for the title-card intro (schema `introMotif`,
   content.config.ts — honesty rule R18: a motif is declared only where it is
   seasonally true for the trip). One engine, four registered systems:

     koyo-leaves  — autumn momiji drift on a right-to-left wind (japan, Oct–Nov)
     summer-rain  — soft jangma drizzle, thin slanted streaks (korea, mid-July)
     poplar-fluff — June seed-fluff floating on light air (denmark, "poppelfnug")
     desert-dust  — golden dust motes with a slow shimmer (us/Sedona, high desert)

   Pure canvas, tokens-free by design (weather doesn't dark-mode). start(canvas)
   reads data-motif, returns stop(); story.css owns fade in/out, story-open.js owns
   the lifecycle. An unknown motif falls back to koyo-leaves rather than crashing. */

function leafDraw(ctx, p) {
  var s = p.s;
  ctx.rotate(p.rot);
  ctx.fillStyle = p.c;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.55, s * 0.8, s * 0.5, 0, s);
  ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.9, -s * 0.55, 0, -s);
  ctx.fill();
}

function streakDraw(ctx, p) {
  // A drizzle streak leaning with its own velocity vector.
  ctx.strokeStyle = p.c;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(p.vx * 1.6, p.s);
  ctx.stroke();
}

function moteDraw(ctx, p) {
  ctx.fillStyle = p.c;
  ctx.beginPath();
  ctx.arc(0, 0, p.s, 0, Math.PI * 2);
  ctx.fill();
}

var MOTIFS = {
  "koyo-leaves": {
    n: 26, draw: leafDraw,
    colors: ["#b5502a", "#c9772b", "#8f3d20", "#d99c3b", "#a34a22"],
    size: [7, 16], vx: [-1.9, -0.6], vy: [0.35, 1.05],
    sway: 0.5, fall: 0.25, spin: 0.07, alpha: [0.5, 0.92],
  },
  "summer-rain": {
    n: 64, draw: streakDraw,
    colors: ["rgba(200,212,224,0.55)", "rgba(178,194,210,0.45)", "rgba(220,228,236,0.35)"],
    size: [9, 17],            // streak length
    vx: [-1.6, -0.9], vy: [7, 11],
    sway: 0, fall: 0, spin: 0, alpha: [0.25, 0.5],
    spawnTop: true,           // rain arrives from above, not the side
  },
  "poplar-fluff": {
    n: 22, draw: moteDraw,
    colors: ["rgba(255,255,255,0.9)", "rgba(245,242,235,0.8)", "rgba(255,253,248,0.7)"],
    size: [2.5, 6], vx: [-0.45, 0.35], vy: [0.12, 0.5],
    sway: 0.9, fall: 0.3, spin: 0, alpha: [0.35, 0.8],
    blur: 3,                  // soft-edged seed fluff
  },
  "desert-dust": {
    n: 34, draw: moteDraw,
    colors: ["#d9a441", "#c9772b", "#c69a5a", "#e0b96a"],
    size: [1.2, 3.2], vx: [-0.6, -0.15], vy: [0.08, 0.3],
    sway: 0.5, fall: 0.18, spin: 0, alpha: [0.2, 0.6],
    shimmer: true,            // alpha slowly pulses — dust catching the light
  },
};

function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

export function start(canvas) {
  var ctx = canvas.getContext("2d");
  if (!ctx) return function () {};
  var M = MOTIFS[canvas.getAttribute("data-motif")] || MOTIFS["koyo-leaves"];

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  function size() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();

  function spawn(initial) {
    var fromTop = M.spawnTop || (!initial && Math.random() < 0.35);
    return {
      x: initial ? Math.random() * W : (fromTop ? Math.random() * W : W + 10 + Math.random() * 40),
      y: initial ? Math.random() * H : (fromTop ? -15 - Math.random() * 30 : Math.random() * H * 0.85),
      s: rand(M.size[0], M.size[1]),
      vx: rand(M.vx[0], M.vx[1]),
      vy: rand(M.vy[0], M.vy[1]),
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * (M.spin * 2),
      sway: Math.random() * Math.PI * 2,
      c: M.colors[(Math.random() * M.colors.length) | 0],
      o: rand(M.alpha[0], M.alpha[1]),
    };
  }
  var parts = [];
  for (var i = 0; i < M.n; i++) parts.push(spawn(true));

  var raf = 0, running = true, t = 0;
  function frame() {
    if (!running) return;
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    if (M.blur) { ctx.shadowBlur = M.blur; }
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.sway += 0.022;
      p.x += p.vx + (M.sway ? Math.sin(p.sway) * M.sway : 0);
      p.y += p.vy + (M.fall ? Math.cos(p.sway * 0.7) * M.fall : 0);
      p.rot += p.vr;
      if (p.x < -40 || p.x > W + 50 || p.y > H + 40) parts[i] = spawn(false);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = M.shimmer ? p.o * (0.65 + 0.35 * Math.sin(t * 2 + p.sway * 3)) : p.o;
      if (M.blur) ctx.shadowColor = p.c;
      M.draw(ctx, p);
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  var onResize = function () { size(); };
  window.addEventListener("resize", onResize);

  return function stop() {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    // Last frame stays; story.css fades the canvas out during the pan.
  };
}
