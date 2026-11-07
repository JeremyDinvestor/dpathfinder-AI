import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import darkImg from "../assets/hero-dark.jpg";
import lightImg from "../assets/hero-light.jpg";

// One hero image per theme. `lids` are eyelid boxes in % of the image, so they stay on the eyes
// at every screen size. The lid colours were sampled from the skin around the eyes in each image.
const SETS = [
  { cls: "thd", src: darkImg, vars: { "--ar": 1.7352, "--lt": "#021d3e", "--lb": "#021b42", "--ll": "rgba(120,190,255,.85)", "--ls": "rgba(2,29,62,.9)" },
    lids: [[18.0, 24.0, 27.0, 21.0], [60.3, 24.0, 27.0, 21.0]] },
  { cls: "thl", src: lightImg, vars: { "--ar": 1.7198, "--lt": "#6a87b7", "--lb": "#92b6e8", "--ll": "rgba(30,41,59,.85)", "--ls": "rgba(106,135,183,.9)" },
    lids: [[18.3, 24.0, 27.0, 25.0], [59.3, 24.0, 27.0, 25.0]] },
];

function NeuralCanvas() {
  const ref = useRef(null);
  const { theme } = useTheme();
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rgb = theme === "dark" ? "96,165,250" : "37,99,235";
    let W = 1, H = 1, nodes = [], raf = 0;

    const fit = () => {
      const r = c.getBoundingClientRect();
      W = c.width = Math.max(1, r.width | 0);
      H = c.height = Math.max(1, r.height | 0);
      nodes = Array.from({ length: Math.round(Math.min(64, Math.max(22, W / 20))) }, () => ({
        x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: 1 + Math.random() * 1.6, p: Math.random() * 6.28,
      }));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);

    const frame = (t) => {
      ctx.clearRect(0, 0, W, H);
      const reach = Math.min(150, W / 6);
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < reach) {
          ctx.strokeStyle = `rgba(${rgb},${0.38 * (1 - d / reach)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const a of nodes) {
        const glow = 0.5 + 0.5 * Math.sin((t || 0) / 1200 + a.p);
        ctx.fillStyle = `rgba(${rgb},${0.45 + 0.5 * glow})`;
        ctx.shadowColor = `rgb(${rgb})`;
        ctx.shadowBlur = theme === "dark" ? 8 : 4;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0;
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > W) a.vx *= -1;
          if (a.y < 0 || a.y > H) a.vy *= -1;
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame(0);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [theme]);
  return <canvas className="neu" ref={ref} />;
}

export default function HeroBackdrop() {
  return (
    <div className="hbg" aria-hidden="true">
      {SETS.map((s) => (
        <div className={`hbx ${s.cls}`} style={s.vars} key={s.cls}>
          <img src={s.src} alt="" />
          {s.lids.flatMap(([l, t, w, h], i) =>
            ["up", "dn"].map((k) => <i key={`${i}${k}`} className={`lid ${k}`} style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }} />)
          )}
        </div>
      ))}
      <NeuralCanvas />
    </div>
  );
}
