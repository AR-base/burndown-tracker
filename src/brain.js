/* Particle brain on a canvas: a slowly turning 3-D cloud of points shaped like a brain (two hemispheres,
   cerebellum, brain stem), with faint synapses and travelling pulses. Anchors mark the ten areas of a
   project manager's work; the caller draws its labels in HTML and gets the anchors' screen positions
   back to link them. Decorative only (aria-hidden): every action lives in real buttons. */
const Brain = (() => {
  const COLORS = { violet: '#8556F7', lav: '#D3AFFE', white: '#F9FAFA', gold: '#EBCA4C', pink: '#F28DC7', cyan: '#4FD1E8', good: '#5DD6A6', warn: '#F0A840', bad: '#F25F7A' };
  // where each knowledge area sits on the brain (x forward, y up), roughly following what that part of the brain does
  const ANCHORS = {
    integration: [0.98, 0.18], scope: [0.62, 0.62], schedule: [0.1, 0.8], cost: [-0.42, 0.66], quality: [-0.92, 0.2],
    resources: [0.38, -0.12], communication: [0.82, -0.2], risk: [-0.35, 0.18], procurement: [-0.74, -0.52], stakeholders: [-0.02, -0.32]
  };
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function geometry(n = 1700) {
    const R = rng(7), pts = [];
    const dir = () => { const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u); return [s * Math.cos(a), u, s * Math.sin(a)]; };
    const pick = () => { const r = R(); return r < 0.05 ? 'gold' : r < 0.09 ? 'pink' : r < 0.13 ? 'cyan' : r < 0.22 ? 'white' : r < 0.55 ? 'lav' : 'violet'; };
    const push = (x, y, z, kind) => pts.push({ x, y, z, c: pick(), s: 0.6 + R() * 0.9, kind, tw: R() * Math.PI * 2 });
    // cerebrum: two hemispheres with folds (gyri) and a flattened base
    for (const side of [-1, 1]) for (let i = 0; i < n * 0.39; i++) {
      const [dx, dy, dz] = dir();
      const fold = 1 + 0.055 * Math.sin(10 * dx + 3 * Math.sin(6 * dy)) * Math.cos(9 * dy + 4 * dz) + 0.03 * Math.sin(17 * dz + 5 * dx);
      let x = dx * 1.04 * fold, y = dy * 0.74 * fold + 0.1, z = dz * 0.47 * fold + side * 0.45;
      if (y < -0.36) { if (x > -0.1 && x < 0.75) y = Math.max(y, -0.52 + 0.06 * Math.sin(x * 6)); else y = -0.36 + (y + 0.36) * 0.25; }
      if (side * z < 0.05) continue;                                        // longitudinal fissure
      push(x, y, z, 'c');
    }
    // cerebellum: small, finely striped, under the back of the brain
    for (let i = 0; i < n * 0.13; i++) {
      const [dx, dy, dz] = dir(); const f = 1 + 0.07 * Math.sin(dy * 30);
      push(-0.7 + dx * 0.36 * f, -0.5 + dy * 0.22 * f, dz * 0.62, 'b');
    }
    // brain stem
    for (let i = 0; i < n * 0.05; i++) {
      const a = R() * Math.PI * 2, h = R();
      push(-0.3 - h * 0.12 + Math.cos(a) * 0.11, -0.5 - h * 0.55, Math.sin(a) * 0.11, 's');
    }
    // a few points inside, for depth
    for (let i = 0; i < n * 0.08; i++) {
      const [dx, dy, dz] = dir(), r = Math.cbrt(R()) * 0.85;
      push(dx * r * 0.95, dy * r * 0.6 + 0.08, dz * r * 0.85, 'i');
    }
    // synapses: link some points to a close neighbour
    const edges = [];
    for (let i = 0; i < pts.length; i += 3) {
      let best = -1, bd = 0.032;
      for (let j = 0; j < pts.length; j += 2) {
        if (j === i) continue;
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z, d = dx * dx + dy * dy + dz * dz;
        if (d < bd && d > 0.004) { bd = d; best = j; }
      }
      if (best >= 0) edges.push([i, best]);
    }
    // anchors: the outermost point near each target, on the hemisphere facing the viewer (negative z is near)
    const anchors = {};
    for (const [id, [ax, ay]] of Object.entries(ANCHORS)) {
      let best = 0, bs = Infinity;
      pts.forEach((p, i) => { if (p.kind === 'i') return; const d = (p.x - ax) ** 2 + (p.y - ay) ** 2 + p.z * 0.08; if (p.z < -0.2 && d < bs) { bs = d; best = i; } });
      anchors[id] = best;
    }
    return { pts, edges, anchors };
  }

  function sprite(color, size = 32) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, color); gr.addColorStop(0.22, color); gr.addColorStop(0.45, color + '55'); gr.addColorStop(1, color + '00');
    g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
  }

  /* create(canvas, opts) → controller
     opts.offsetX: horizontal position of the brain centre (0..1 of the canvas width)
     opts.scale: brain size relative to the smaller canvas side
     opts.targets(): screen points [{id, x, y}] the anchors are linked to (canvas pixels, CSS units) */
  function create(canvas, opts = {}) {
    const noop = { start() {}, stop() {}, focus() {}, status() {}, redraw() {}, anchors: () => ({}), destroy() {} };
    if (!canvas || typeof canvas.getContext !== 'function' || /jsdom/i.test(navigator.userAgent || '')) return noop;
    const ctx = canvas.getContext('2d'); if (!ctx) return noop;
    const G = geometry(opts.count || 1700), S = {}; Object.entries(COLORS).forEach(([k, v]) => { S[k] = sprite(v); });
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, running = false, focusId = null, statusOf = {}, t0 = performance.now(), px = 0, py = 0, screen = {};
    const pulses = [];
    function resize() {
      const r = canvas.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      draw(performance.now());                // resizing clears the canvas: always repaint
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro ? ro.observe(canvas) : window.addEventListener('resize', resize);
    const clamp = v => Math.max(-0.5, Math.min(0.5, v));
    const onMove = ev => { if (!running) return; const r = canvas.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return; px = clamp((ev.clientX - r.left) / r.width - 0.5); py = clamp((ev.clientY - r.top) / r.height - 0.5); };
    if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });

    function draw(now) {
      const t = reduced ? 0 : now - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const yaw = -0.55 + Math.sin(t * 0.00018) * 0.42 + px * 0.5, pitch = 0.12 + py * 0.25;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const o = typeof opts.place === 'function' ? opts.place(W, H) : opts;
      const size = Math.min(W, H) * (o.scale || 0.34), ox = W * (o.offsetX ?? 0.5), oy = o.cy != null ? o.cy : H * (o.offsetY ?? 0.5);
      const proj = p => {
        const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;           // turn around the vertical axis
        const y2 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;               // tilt
        const k = 3.4 / (3.4 + z2 * 0.9);
        return { x: ox + x1 * size * k, y: oy - y2 * size * k, z: z2, k };
      };
      const P = G.pts.map(proj), dens = Math.max(0.75, Math.min(1.5, size / 240));
      const fp = focusId != null ? G.pts[G.anchors[focusId]] : null;
      const fcol = focusId != null ? (statusOf[focusId] || 'gold') : null;
      ctx.globalCompositeOperation = 'lighter';
      // synapses
      ctx.lineWidth = 0.6;
      for (const [a, b] of G.edges) {
        const A = P[a], B = P[b], depth = (A.z + B.z) / 2;
        ctx.strokeStyle = `rgba(178,141,240,${0.05 + Math.max(0, -depth) * 0.12})`;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      // particles
      for (let i = 0; i < P.length; i++) {
        const p = G.pts[i], q = P[i];
        let col = p.c, sz = (2.2 + p.s * 2.6) * q.k * dens, alpha = 0.35 + Math.max(0, -q.z) * 0.45 + 0.12 * Math.sin(t * 0.002 + p.tw);
        if (fp) { const d = (p.x - fp.x) ** 2 + (p.y - fp.y) ** 2 + (p.z - fp.z) ** 2; if (d < 0.11) { col = fcol; sz *= 1.5; alpha = Math.min(1, alpha + 0.45); } else alpha *= 0.55; }
        ctx.globalAlpha = Math.max(0.05, Math.min(1, alpha));
        ctx.drawImage(S[col] || S.violet, q.x - sz, q.y - sz, sz * 2, sz * 2);
      }
      // links from anchors to the HTML labels, with pulses travelling along them
      screen = {}; Object.entries(G.anchors).forEach(([id, i]) => { screen[id] = P[i]; });
      const targets = typeof opts.targets === 'function' ? opts.targets() : [];
      ctx.globalAlpha = 1;
      for (const tg of targets) {
        const a = screen[tg.id]; if (!a) continue;
        const on = tg.id === focusId, c = COLORS[statusOf[tg.id] || 'lav'];
        const mx = (a.x + tg.x) / 2, my = a.y;
        ctx.strokeStyle = c; ctx.globalAlpha = on ? 0.95 : 0.32; ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, tg.x, tg.y); ctx.stroke();
        ctx.globalAlpha = on ? 1 : 0.8; ctx.drawImage(S[statusOf[tg.id] || 'lav'], a.x - (on ? 9 : 6), a.y - (on ? 9 : 6), on ? 18 : 12, on ? 18 : 12);
        if (!reduced) {
          const u = ((t * (on ? 0.0011 : 0.0004) + tg.id.length * 0.13) % 1), iu = 1 - u;
          const x = iu * iu * tg.x + 2 * iu * u * mx + u * u * a.x, y = iu * iu * tg.y + 2 * iu * u * my + u * u * a.y;
          ctx.globalAlpha = 0.9; ctx.drawImage(S.white, x - 4, y - 4, 8, 8);
        }
      }
      // random synapse firing
      if (!reduced && Math.random() < 0.18) pulses.push({ e: G.edges[(Math.random() * G.edges.length) | 0], t: now });
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pu = pulses[i], u = (now - pu.t) / 600; if (u > 1) { pulses.splice(i, 1); continue; }
        const A = P[pu.e[0]], B = P[pu.e[1]];
        ctx.globalAlpha = 1 - u; ctx.drawImage(S.gold, A.x + (B.x - A.x) * u - 5, A.y + (B.y - A.y) * u - 5, 10, 10);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function loop(now) { if (!running) return; if (document.visibilityState !== 'hidden') draw(now); raf = requestAnimationFrame(loop); }
    resize();
    const api = {
      start() { if (reduced) { draw(performance.now()); return; } if (!running) { running = true; raf = requestAnimationFrame(loop); } },
      stop() { running = false; cancelAnimationFrame(raf); },
      focus(id) { focusId = id; if (!running) draw(performance.now()); },
      status(map) { statusOf = map || {}; if (!running) draw(performance.now()); },
      redraw() { resize(); },
      anchors: () => screen,
      destroy() { this.stop(); ro ? ro.disconnect() : window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); }
    };
    canvas.__brain = api;
    return api;
  }
  return { create, geometry, ANCHORS };
})();
if (typeof module !== 'undefined') module.exports = Brain;
