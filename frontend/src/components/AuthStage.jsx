import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import headUrl from "../assets/head.png";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Reads the bright dots of the original head image (public/src/assets/head.png).
function samplePoints() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data, pts = [];
      for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) {
        const i = (y * c.width + x) * 4;
        if (Math.max(d[i], d[i + 1], d[i + 2]) > 95) pts.push([x, y, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]);
      }
      const step = Math.ceil(pts.length / 22000);
      resolve(step > 1 ? pts.filter((_, i) => i % step === 0) : pts);
    };
    img.onerror = reject;
    img.src = headUrl;
  });
}

// Turns those dots into a 3D point cloud. The depth is an estimate (an oval head shape plus a nose),
// so this is a convincing 3D shape built from the photo, not a scan.
function buildHead(P, dark) {
  const xs = P.map((p) => p[0]).sort((a, b) => a - b), ys = P.map((p) => p[1]).sort((a, b) => a - b);
  const q = (arr, f) => arr[Math.floor(arr.length * f)];
  const x0 = q(xs, 0.01), x1 = q(xs, 0.99), y0 = q(ys, 0.01), y1 = q(ys, 0.99);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, s = 2 / (y1 - y0), a = ((x1 - x0) / 2) * s, depth = a * 0.8;
  const pos = [], col = [], gpos = [], gcol = [];
  for (const p of P) {
    const x = (p[0] - cx) * s, y = -(p[1] - cy) * s, r2 = (x / a) ** 2 + y * y;
    const glow = p[4] > 0.6 && p[2] < 0.5 && p[4] - p[2] > 0.3; // the blue eyes
    let z;
    if (r2 <= 1) z = depth * Math.sqrt(1 - r2) + 0.1 * Math.exp(-((x / a) ** 2 * 40 + (y - 0.33) ** 2 * 60));
    else if (r2 < 1.5 && Math.abs(x) > a * 0.85) z = depth * 0.12; // ears
    else z = (Math.random() - 0.5) * 1.4; // loose stars
    const k = dark
      ? (glow ? [0.25, 0.65, 1] : [Math.min(1, p[2] * 1.1), Math.min(1, p[3] * 1.1), Math.min(1, p[4] * 1.1)])
      : (glow ? [0.05, 0.3, 0.85] : [0.05, 0.1, 0.22]);
    pos.push(x, y, z); col.push(...k);
    if (glow) { gpos.push(x, y, z + 0.02); gcol.push(...k); }
    if (r2 <= 1 && Math.random() < 0.4) { pos.push(x, y, -z * 0.9); col.push(...(dark ? k.map((v) => v * 0.4) : k)); }
  }
  return { pos: new Float32Array(pos), col: new Float32Array(col), gpos: new Float32Array(gpos), gcol: new Float32Array(gcol) };
}

const RINGS = [[430, 110, -14, 330], [360, 80, 12, 520], [480, 130, -4, 430]];
const NODES = [[917, 226], [83, 434], [852, 595], [148, 445], [979, 397]];

// The left panel of the sign-in / sign-up pages: orbit rings, particles and the 3D head.
// `focus` = { on, k }: on = a form field is focused, k = which field (0 is the middle one).
export default function AuthStage({ focus }) {
  const { theme } = useTheme();
  const hd = useRef(null), cv = useRef(null), ptc = useRef(null);
  const target = useRef({ ty: 0, tx: 0, f: 0 }); // where the head wants to point (radians)
  const current = useRef({ y: 0, x: 0 });
  const [ready, setReady] = useState(false);

  // Clicking a field: turn clearly toward the form. On narrow screens the form is below, so look down.
  useEffect(() => {
    const t = target.current, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, narrow = matchMedia("(max-width:860px)").matches;
    t.f = focus.on ? 1 : 0;
    if (!focus.on || reduce) { t.ty = 0; t.tx = 0; }
    else { t.ty = narrow ? 0.1 : 0.62; t.tx = narrow ? 0.38 + focus.k * 0.14 : 0.06 + focus.k * 0.1; }
  }, [focus]);

  // Gentle mouse tracking (never on touch, never with reduced motion, not while a field is focused).
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const move = (e) => {
      const t = target.current;
      if (t.f || mq.matches || e.pointerType === "touch" || !hd.current) return;
      const r = hd.current.getBoundingClientRect();
      t.ty = clamp(((e.clientX - (r.left + r.width / 2)) / innerWidth) * 0.5, -0.17, 0.17);
      t.tx = clamp(((e.clientY - (r.top + r.height / 2)) / innerHeight) * 0.2, -0.07, 0.07);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  // The 3D head (three.js is loaded only on these two pages).
  useEffect(() => {
    let stop = false, raf = 0, renderer, ro, group;
    (async () => {
      try {
        const [T, P] = await Promise.all([import("three"), samplePoints()]);
        if (stop) return;
        T.ColorManagement.enabled = false;
        const dark = theme === "dark", m = buildHead(P, dark), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        renderer = new T.WebGLRenderer({ canvas: cv.current, alpha: true, antialias: true });
        renderer.outputColorSpace = T.LinearSRGBColorSpace;
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        renderer.setClearColor(0, 0);
        const scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 0.1, 50);
        group = new T.Group(); group.rotation.order = "YXZ"; scene.add(group);

        const tc = document.createElement("canvas"); tc.width = tc.height = 64;
        const tx = tc.getContext("2d"), g = tx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.5, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
        tx.fillStyle = g; tx.fillRect(0, 0, 64, 64);
        const dot = new T.CanvasTexture(tc);
        const layer = (p, c, size, additive) => {
          const geo = new T.BufferGeometry();
          geo.setAttribute("position", new T.BufferAttribute(p, 3));
          geo.setAttribute("color", new T.BufferAttribute(c, 3));
          group.add(new T.Points(geo, new T.PointsMaterial({ size, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: additive && dark ? T.AdditiveBlending : T.NormalBlending, opacity: additive ? 0.85 : 1 })));
        };
        layer(m.pos, m.col, 0.016, false);
        layer(m.gpos, m.gcol, 0.085, true);

        const fit = () => {
          const w = cv.current.clientWidth || 300, h = cv.current.clientHeight || 300, tn = Math.tan((15 * Math.PI) / 180);
          renderer.setSize(w, h, false);
          cam.aspect = w / h;
          cam.position.z = Math.max(1.15 / tn, 0.8 / (tn * cam.aspect));
          cam.updateProjectionMatrix();
        };
        fit();
        ro = new ResizeObserver(fit); ro.observe(cv.current);
        setReady(true);

        const t0 = performance.now();
        const loop = () => {
          if (stop) return;
          const t = (performance.now() - t0) / 1000, k = reduce ? 1 : 0.07, tg = target.current, cu = current.current;
          cu.y += (tg.ty - cu.y) * k; cu.x += (tg.tx - cu.x) * k;
          group.rotation.y = cu.y + (reduce ? 0 : Math.sin(t * 0.5) * 0.04);
          group.rotation.x = cu.x + (reduce ? 0 : Math.sin(t * 0.7) * 0.015);
          renderer.render(scene, cam);
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch { /* WebGL unavailable: the original image below stays visible as the fallback */ }
    })();
    return () => {
      stop = true; cancelAnimationFrame(raf); ro?.disconnect();
      group?.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      renderer?.dispose(); setReady(false);
    };
  }, [theme]);

  // Floating particles behind the head.
  useEffect(() => {
    const c = ptc.current, ctx = c.getContext("2d"), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, dark = theme === "dark";
    let W = 1, H = 1, raf = 0;
    const P = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, v: 0.00004 + Math.random() * 0.00012, p: Math.random() * 6.28, blue: Math.random() < 0.35 }));
    const fit = () => { const r = c.getBoundingClientRect(); W = c.width = Math.max(1, r.width | 0); H = c.height = Math.max(1, r.height | 0); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(c);
    const frame = (t) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        const a = reduce ? 0.7 : 0.35 + 0.55 * Math.abs(Math.sin((t || 0) / 1500 + p.p));
        ctx.beginPath();
        ctx.fillStyle = p.blue ? `rgba(${dark ? "96,165,250" : "29,78,216"},${a})` : `rgba(${dark ? "226,240,255" : "30,41,59"},${a * 0.8})`;
        ctx.shadowColor = dark ? "#3b82f6" : "rgba(29,78,216,.5)"; ctx.shadowBlur = p.blue ? 8 : 3;
        ctx.arc(p.x * W, p.y * H, p.r, 0, 6.283); ctx.fill();
        if (!reduce) { p.y -= p.v * 16; if (p.y < -0.02) p.y = 1.02; }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame(0);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [theme]);

  return (
    <>
      <div className="rgw" aria-hidden="true">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="rg">
          <g fill="none">
            {RINGS.map(([rx, ry, a, cy], i) => (
              <g key={i} transform={`rotate(${a} 500 ${cy})`}>
                <ellipse cx="500" cy={cy} rx={rx} ry={ry} style={{ stroke: "var(--ac)" }} strokeOpacity=".35" strokeWidth="1.4" />
                <ellipse className={`rs r${i}`} cx="500" cy={cy} rx={rx} ry={ry} style={{ stroke: "var(--cy)" }} strokeWidth="2.6" strokeLinecap="round" pathLength="100" strokeDasharray="9 91" />
              </g>
            ))}
          </g>
          <g style={{ fill: "var(--cy)" }}>
            {NODES.map(([x, y], i) => <circle key={i} className="nd2" style={{ animationDelay: `${i * 0.6}s` }} cx={x} cy={y} r="4.5" />)}
          </g>
        </svg>
        <canvas className="ptc" ref={ptc} />
      </div>
      <div className={`hd${ready ? " ready" : ""}`} aria-hidden="true" ref={hd}>
        <canvas ref={cv} />
        <img src={headUrl} alt="" />
      </div>
    </>
  );
}
