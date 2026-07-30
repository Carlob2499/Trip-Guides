/* Koyo-leaf particle drift for the title-card intro (motif "koyo-leaves",
   schema-gated in content.config.ts — honesty rule R18: only on trips where autumn
   foliage is seasonally true). Pure canvas, ~26 leaves in an autumn palette drifting
   on a right-to-left wind with flutter — the alpha-transition feel of the reference,
   built from tokensized code instead of stock video. start(canvas) returns stop();
   story.css owns the fade in/out, story-open.js owns the lifecycle. */

export function start(canvas) {
  var ctx = canvas.getContext("2d");
  if (!ctx) return function () {};

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

  // Autumn momiji palette — fixed by the motif, not the theme (leaves don't dark-mode).
  var COLORS = ["#b5502a", "#c9772b", "#8f3d20", "#d99c3b", "#a34a22"];
  var N = 26, leaves = [];

  function spawn(initial) {
    return {
      x: initial ? Math.random() * W : W + 10 + Math.random() * 40,
      y: Math.random() * H * (initial ? 1 : 0.85),
      s: 7 + Math.random() * 9,
      vx: -(0.6 + Math.random() * 1.3),
      vy: 0.35 + Math.random() * 0.7,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.07,
      sway: Math.random() * Math.PI * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      o: 0.5 + Math.random() * 0.42,
    };
  }
  for (var i = 0; i < N; i++) leaves.push(spawn(true));

  function drawLeaf(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.o;
    ctx.fillStyle = p.c;
    var s = p.s;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.55, s * 0.8, s * 0.5, 0, s);
    ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.9, -s * 0.55, 0, -s);
    ctx.fill();
    ctx.restore();
  }

  var raf = 0, running = true;
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < leaves.length; i++) {
      var p = leaves[i];
      p.sway += 0.022;
      p.x += p.vx + Math.sin(p.sway) * 0.5;
      p.y += p.vy + Math.cos(p.sway * 0.7) * 0.25;
      p.rot += p.vr;
      if (p.x < -40 || p.y > H + 40) leaves[i] = spawn(false);
      drawLeaf(p);
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
