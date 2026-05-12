"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Loader Component ────────────────────────────────────────────────────────

const WORD = "Nexion";
const LETTER_DELAYS = [0.5, 0.65, 0.8, 0.95, 1.1, 1.25];
const STATUS_STEPS: [number, string][] = [
  [0, "Waking up…"],
  [700, "Gathering knowledge…"],
  [1500, "Almost there…"],
  [2600, "Welcome aboard ✦"],
];

function NexionLoader({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [revealedLetters, setRevealedLetters] = useState<boolean[]>(
    Array(WORD.length).fill(false)
  );
  const [statusText, setStatusText] = useState("Waking up…");
  const [logoHovered, setLogoHovered] = useState(false);
  const [logoColorIdx, setLogoColorIdx] = useState(0);

  const logoColors = [
    "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    "linear-gradient(135deg,#6366f1,#4338ca)",
    "linear-gradient(135deg,#0ea5e9,#0369a1)",
    "linear-gradient(135deg,#06b6d4,#0e7490)",
  ];

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  const startSequence = useCallback(() => {
    LETTER_DELAYS.forEach((delay, i) => {
      addTimer(() => {
        setRevealedLetters((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, delay * 1000);
    });
    STATUS_STEPS.forEach(([delay, text]) => {
      addTimer(() => setStatusText(text), 1900 + delay);
    });
    addTimer(() => onDone(), 4500);
  }, [addTimer, onDone]);

  // Mouse-reactive particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const setSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.6 + 0.4,
      opacity: Math.random() * 0.35 + 0.07,
    }));
    let animId: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      pts.forEach((p) => {
        // Gentle mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 80 && dist > 0) {
          p.vx += (dx / dist) * 0.04;
          p.vy += (dy / dist) * 0.04;
        }
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,179,237,${p.opacity})`;
        ctx.fill();
      });
      pts.forEach((a, i) =>
        pts.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,179,237,${0.07 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        })
      );
      animId = requestAnimationFrame(draw);
    }
    draw();
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.parentElement?.addEventListener("mousemove", handleMouse);
    return () => {
      cancelAnimationFrame(animId);
      canvas.parentElement?.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  useEffect(() => {
    startSequence();
    return clearAllTimers;
  }, [startSequence, clearAllTimers]);

  const handleLogoClick = () => {
    setLogoColorIdx((prev) => (prev + 1) % logoColors.length);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#060a10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: "'Georgia', serif",
        overflow: "hidden",
        animation: "loaderFadeOut 0.5s 4.5s ease forwards",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loaderFadeOut { to { opacity: 0; pointer-events: none; } }
        @keyframes nexionLogoIn { from{opacity:0;transform:scale(0.3) rotate(-20deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes nexionLetterUp { to{opacity:1;transform:translateY(0)} }
        @keyframes nexionFadeUp { to{opacity:1;transform:translateY(0)} }
        @keyframes nexionPulse { 0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes nexionSpin { to{transform:rotate(360deg)} }
        @keyframes nexionBarFill { 0%{width:0} 20%{width:22%} 55%{width:58%} 80%{width:79%} 100%{width:100%} }
        @keyframes greetFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .loader-logo-box:hover { transform: scale(1.08) rotate(3deg) !important; box-shadow: 0 0 32px rgba(59,130,246,0.4) !important; }
      ` }} />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "35%", left: "50%",
        transform: "translate(-50%,-50%)", width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(56,120,200,0.09) 0%, transparent 68%)",
        pointerEvents: "none",
        animation: "nexionPulse 3s ease-in-out infinite",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>

        {/* Greeting — appears first */}
        <div style={{
          fontSize: "13px", color: "#60a5fa", letterSpacing: "0.14em",
          fontFamily: "monospace", textTransform: "uppercase",
          opacity: 0, animation: "greetFadeUp 0.6s 0.2s ease forwards",
        }}>
          ✦ &nbsp; Hey there — glad you&apos;re here &nbsp; ✦
        </div>

        {/* Logo */}
        <div
          onClick={handleLogoClick}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          title="Click to change color"
          style={{
            width: "72px", height: "72px", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            animation: "nexionLogoIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.3s both",
          }}
        >
          <div
            className="loader-logo-box"
            style={{
              width: "58px", height: "58px", borderRadius: "14px",
              background: logoColors[logoColorIdx],
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "26px", fontWeight: 700, color: "#fff", fontFamily: "monospace",
              transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, background 0.4s ease",
              userSelect: "none",
              boxShadow: logoHovered ? "0 0 32px rgba(59,130,246,0.4)" : "0 0 0 rgba(0,0,0,0)",
            }}
          >
            N
          </div>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1.5px solid transparent",
            borderTopColor: "rgba(99,179,237,0.7)",
            borderRightColor: "rgba(99,179,237,0.2)",
            animation: "nexionSpin 1.4s linear infinite",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: "6px", left: "6px",
            width: "60px", height: "60px", borderRadius: "50%",
            border: "0.5px solid transparent",
            borderBottomColor: "rgba(59,130,246,0.35)",
            animation: "nexionSpin 2.2s linear infinite reverse",
            pointerEvents: "none",
          }} />
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex" }}>
          {WORD.split("").map((ch, i) => (
            <span
              key={i}
              style={{
                fontSize: "48px", fontWeight: 400, color: "#e8edf5",
                letterSpacing: "0.04em", fontFamily: "'Georgia', serif",
                display: "inline-block",
                opacity: revealedLetters[i] ? 1 : 0,
                transform: revealedLetters[i] ? "translateY(0)" : "translateY(18px)",
                transition: revealedLetters[i]
                  ? `opacity 0.5s cubic-bezier(0.34,1.4,0.64,1) ${LETTER_DELAYS[i]}s, transform 0.5s cubic-bezier(0.34,1.4,0.64,1) ${LETTER_DELAYS[i]}s`
                  : "none",
                userSelect: "none",
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Friendly intro line */}
        <div style={{
          fontSize: "14px", color: "#94a3b8", letterSpacing: "0.04em",
          fontFamily: "Georgia, serif", fontStyle: "italic",
          opacity: 0, transform: "translateY(6px)",
          animation: "nexionFadeUp 0.5s 1.5s ease forwards",
          textAlign: "center", maxWidth: "280px", lineHeight: "1.6",
        }}>
          Your research companion, ready to help
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: "11px", color: "#334155", letterSpacing: "0.18em",
          fontFamily: "monospace", textTransform: "uppercase",
          opacity: 0, transform: "translateY(6px)",
          animation: "nexionFadeUp 0.5s 1.7s ease forwards",
        }}>
          Thesis AI &nbsp;·&nbsp; Powered by Gemini + Groq
        </div>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          opacity: 0, animation: "nexionFadeUp 0.4s 1.9s ease forwards",
        }}>
          <div style={{ width: "40px", height: "0.5px", background: "rgba(59,130,246,0.3)" }} />
          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(59,130,246,0.5)" }} />
          <div style={{ width: "40px", height: "0.5px", background: "rgba(59,130,246,0.3)" }} />
        </div>

        {/* Progress bar */}
        <div style={{ opacity: 0, animation: "nexionFadeUp 0.4s 2.0s ease forwards" }}>
          <div style={{
            width: "200px", height: "1.5px", background: "rgba(255,255,255,0.06)",
            borderRadius: "2px", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: 0,
              background: "linear-gradient(90deg,#1d4ed8,#60a5fa,#93c5fd)",
              borderRadius: "2px",
              animation: "nexionBarFill 2.2s 2.1s cubic-bezier(0.4,0,0.2,1) forwards",
            }} />
          </div>
          <div style={{
            fontSize: "10px", color: "#3b82f6", letterSpacing: "0.14em",
            fontFamily: "monospace", marginTop: "10px", textAlign: "center", minHeight: "14px",
          }}>
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interactive Headline ─────────────────────────────────────────────────────

function InteractiveHeadline({ heroVisible }: { heroVisible: boolean }) {
  const line1 = ["Let", "me", "help", "with"];
  const line2 = [{ word: "your", grad: false }, { word: "thesis.", grad: true }];
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const wordStyle = (word: string, isGrad: boolean): React.CSSProperties => {
    const active = hoveredWord === word;
    if (isGrad) {
      return {
        display: "inline-block",
        fontStyle: "italic",
        backgroundImage: active
          ? "linear-gradient(90deg, #93c5fd, #fff, #bfdbfe)"
          : "linear-gradient(90deg, #60a5fa, #93c5fd, #bfdbfe)",
        backgroundSize: "200% 100%",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
        backgroundPosition: "0% 0%",
        backgroundColor: "transparent",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        transition: "transform 0.3s cubic-bezier(0.34,1.4,0.64,1), filter 0.3s ease",
        transform: active ? "translateY(-4px) scale(1.04)" : "translateY(0) scale(1)",
        filter: active ? "brightness(1.3)" : "brightness(1)",
        cursor: "default",
      };
    }
    return {
      display: "inline-block",
      color: active ? "#e2e8f0" : "#e8edf5",
      transition: "transform 0.3s cubic-bezier(0.34,1.4,0.64,1), color 0.25s ease, text-shadow 0.3s ease",
      transform: active ? "translateY(-4px)" : "translateY(0)",
      textShadow: active ? "0 0 28px rgba(148,197,253,0.35)" : "none",
      cursor: "default",
    };
  };

  return (
    <h1
      style={{
        fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: "400",
        lineHeight: "1.2", letterSpacing: "-0.02em",
        marginBottom: "1.2rem", maxWidth: "820px",
        fontFamily: "Georgia, serif",
        opacity: heroVisible ? 1 : 0,
        transform: heroVisible ? "translateY(0)" : "translateY(24px)",
        transition: "all 0.6s 0.15s cubic-bezier(0.34,1.2,0.64,1)",
        userSelect: "none",
      }}
    >
      <span style={{ display: "block" }}>
        {line1.map((w) => (
          <span
            key={w}
            onMouseEnter={() => setHoveredWord(w)}
            onMouseLeave={() => setHoveredWord(null)}
            style={{ ...wordStyle(w, false), marginRight: "0.28em" }}
          >{w}</span>
        ))}
      </span>
      <span style={{ display: "block" }}>
        {line2.map(({ word, grad }) => (
          <span
            key={word}
            onMouseEnter={() => setHoveredWord(word)}
            onMouseLeave={() => setHoveredWord(null)}
            style={{ ...wordStyle(word, grad), marginRight: !grad ? "0.28em" : "0" }}
          >{word}</span>
        ))}
      </span>
    </h1>
  );
}

// ─── Interactive Subheadline ──────────────────────────────────────────────────

function InteractiveSubline({ heroVisible }: { heroVisible: boolean }) {
  const text = "Hi, I'm Nexion — your friendly AI research partner. I read your papers, find related literature, and help you write with confidence. Powered by multi-AI intelligence built for academic depth.";
  const words = text.split(" ");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <p
      style={{
        fontSize: "1rem",
        maxWidth: "460px", lineHeight: "1.8",
        marginBottom: "2.5rem", fontFamily: "Georgia, serif",
        opacity: heroVisible ? 1 : 0,
        transform: heroVisible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s 0.28s ease",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {words.map((word, i) => {
        const isNexion = word === "Nexion" || word === "Nexion";
        const dist = hoveredIdx !== null ? Math.abs(i - hoveredIdx) : 999;
        const isActive = dist === 0;
        const isNear = dist === 1;
        return (
          <span
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              color: isActive
                ? isNexion ? "#93c5fd" : "#cbd5e1"
                : isNear
                ? "#7d93ae"
                : "#64748b",
              transform: isActive ? "translateY(-2px)" : "translateY(0)",
              transition: "color 0.2s ease, transform 0.25s cubic-bezier(0.34,1.4,0.64,1)",
              fontWeight: isNexion && isActive ? 500 : "inherit",
              textShadow: isActive && isNexion ? "0 0 16px rgba(96,165,250,0.3)" : "none",
            }}
          >{word}</span>
        );
      })}
    </p>
  );
}

// ─── Magnetic Button ──────────────────────────────────────────────────────────

function MagneticButton({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const label = typeof children === "string" ? children : "";
  const showArrow = label.includes("→");
  const showIcon = !showArrow && label.toLowerCase().includes("pdf");

  return (
    <Link
      href={href}
      className={`nexion-btn ${primary ? "nexion-btn-primary" : "nexion-btn-secondary"}`}
    >
      <span>{showArrow ? label.replace("→", "").trim() : label}</span>
      {showArrow && <span className="nexion-btn-arrow">→</span>}
      {showIcon && <span className="nexion-btn-icon">⬆</span>}
    </Link>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "2rem",
        background: hovered ? "rgba(59,130,246,0.04)" : "#060a10",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.3s ease",
        cursor: "default",
      }}
    >
      <div style={{
        fontSize: "20px", marginBottom: "0.8rem",
        color: hovered ? "#60a5fa" : "#3b82f6",
        fontFamily: "monospace",
        transition: "color 0.3s, transform 0.3s",
        transform: hovered ? "scale(1.2) rotate(5deg)" : "scale(1) rotate(0deg)",
        display: "inline-block",
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: "13px", fontWeight: "600", marginBottom: "0.5rem",
        letterSpacing: "0.03em",
        color: hovered ? "#f1f5f9" : "#e2e8f0",
        fontFamily: "Georgia, serif",
        transition: "color 0.2s",
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: "12px", color: hovered ? "#64748b" : "#475569",
        lineHeight: "1.8", fontFamily: "Georgia, serif", transition: "color 0.2s",
      }}>
        {desc}
      </p>
      {/* Subtle bottom line reveal on hover */}
      <div style={{
        marginTop: "1.5rem", height: "1px",
        background: "linear-gradient(90deg, #3b82f6, transparent)",
        transform: hovered ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "left",
        transition: "transform 0.4s cubic-bezier(0.34,1.2,0.64,1)",
      }} />
    </div>
  );
}

// ─── Tech Pill ────────────────────────────────────────────────────────────────

function TechPill({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: "11px",
        color: hovered ? "#93c5fd" : "#475569",
        letterSpacing: "0.06em",
        fontFamily: "monospace",
        padding: "6px 16px",
        border: `1px solid ${hovered ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "4px",
        transition: "color 0.2s, border-color 0.2s, background 0.2s, transform 0.2s",
        background: hovered ? "rgba(59,130,246,0.06)" : "transparent",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        cursor: "default",
      }}
    >
      {label}
    </span>
  );
}

// ─── Hero Logo Mark ───────────────────────────────────────────────────────────

function HeroLogoMark() {
  const [hovered, setHovered] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const colors = [
    "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    "linear-gradient(135deg,#6366f1,#4338ca)",
    "linear-gradient(135deg,#0ea5e9,#0369a1)",
  ];
  return (
    <div
      onClick={() => setColorIdx((p) => (p + 1) % colors.length)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to change color"
      style={{ position: "relative", width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
    >
      <div style={{
        width: "48px", height: "48px", borderRadius: "12px",
        background: colors[colorIdx],
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px", fontWeight: 700, color: "#fff", fontFamily: "monospace",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
        transform: hovered ? "rotate(8deg) scale(1.12)" : "rotate(0) scale(1)",
        boxShadow: hovered ? "0 0 28px rgba(59,130,246,0.45)" : "0 0 0 rgba(0,0,0,0)",
      }}>N</div>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid transparent", borderTopColor: "rgba(99,179,237,0.7)", borderRightColor: "rgba(99,179,237,0.2)", animation: "nexionSpin 1.8s linear infinite", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        border: `1px solid ${hovered ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.3)"}`,
        borderRadius: "999px", padding: "5px 16px",
        marginBottom: "2rem", fontSize: "11px", color: hovered ? "#93c5fd" : "#60a5fa",
        letterSpacing: "0.08em",
        background: hovered ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.06)",
        fontFamily: "monospace",
        transition: "all 0.25s ease",
        cursor: "default",
        transform: hovered ? "scale(1.03)" : "scale(1)",
      }}
    >
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: "#3b82f6", display: "inline-block",
        animation: "badgePulse 2s ease-in-out infinite",
      }} />
      THESIS AI · POWERED BY GEMINI + GROQ
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const [loaderDone, setLoaderDone] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const router = useRouter();

  // ── Redirect logged-in users straight to /chat ──────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/chat");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/chat");
    });

    return () => subscription.unsubscribe();
  }, [router]);
  // ────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number; size: number; opacity: number;
    }[] = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.35 + 0.08,
      });
    }

    let animId: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      particles.forEach((p) => {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 100 && dist > 0) {
          p.vx += (dx / dist) * 0.03;
          p.vy += (dy / dist) * 0.03;
        }
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 179, 237, ${p.opacity})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 179, 237, ${0.07 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouse);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  useEffect(() => {
    if (loaderDone) {
      setTimeout(() => setHeroVisible(true), 100);
    }
  }, [loaderDone]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes badgePulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroBgPulse {
          0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 1;   transform: translate(-50%,-50%) scale(1.08); }
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .get-started-btn:hover {
          background: linear-gradient(135deg,#2563eb,#1d4ed8) !important;
          box-shadow: 0 8px 28px rgba(29,78,216,0.45) !important;
          transform: translateY(-2px) !important;
        }
        .nexion-btn {
          display: inline-flex; align-items: center; gap: 8px;
          position: relative; overflow: hidden;
          padding: 14px 32px; border-radius: 8px;
          text-decoration: none; font-size: 14px;
          letter-spacing: 0.02em; font-family: Georgia, serif;
          cursor: pointer; user-select: none;
          transition: background 0.3s ease, color 0.3s ease, box-shadow 0.35s ease,
            border-color 0.3s ease, transform 0.3s cubic-bezier(0.34,1.4,0.64,1);
        }
        .nexion-btn::before {
          content: ''; position: absolute; inset: 0;
          opacity: 0; transition: opacity 0.35s ease; border-radius: 8px;
        }
        .nexion-btn-primary { background: #1d4ed8; color: #fff; border: 1px solid transparent; }
        .nexion-btn-primary::before { background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%); }
        .nexion-btn-primary:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-color: rgba(96,165,250,0.35);
          box-shadow: 0 6px 24px rgba(29,78,216,0.5), 0 0 0 1px rgba(96,165,250,0.15);
          transform: translateY(-2px);
        }
        .nexion-btn-primary:hover::before { opacity: 1; }
        .nexion-btn-primary:active { transform: translateY(0px) scale(0.98); box-shadow: 0 2px 10px rgba(29,78,216,0.35); }
        .nexion-btn-secondary {
          background: rgba(255,255,255,0.03); color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .nexion-btn-secondary::before { background: linear-gradient(135deg, rgba(96,165,250,0.06) 0%, transparent 60%); }
        .nexion-btn-secondary:hover {
          background: rgba(255,255,255,0.07); color: #e2e8f0;
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 4px 18px rgba(0,0,0,0.25); transform: translateY(-2px);
        }
        .nexion-btn-secondary:hover::before { opacity: 1; }
        .nexion-btn-secondary:active { transform: translateY(0px) scale(0.98); }
        .nexion-btn-arrow { display: inline-block; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .nexion-btn-primary:hover .nexion-btn-arrow { transform: translateX(5px); }
        .nexion-btn-icon { display: inline-block; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease; opacity: 0.65; }
        .nexion-btn-secondary:hover .nexion-btn-icon { transform: translateY(-3px); opacity: 1; }
        @keyframes nexionSpin { to{transform:rotate(360deg)} }
      ` }} />

      {!loaderDone && (
        <NexionLoader onDone={() => {
          setTimeout(() => setLoaderDone(true), 500);
        }} />
      )}

      <main style={{
        minHeight: "100vh", background: "#060a10",
        color: "#e8edf5", fontFamily: "'Georgia', serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Animated particle background */}
        <canvas
          ref={canvasRef}
          style={{
            position: "fixed", top: 0, left: 0,
            width: "100%", height: "100%",
            pointerEvents: "none", zIndex: 0,
          }}
        />

        {/* Radial glow */}
        <div style={{
          position: "fixed", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(56,120,200,0.08) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
          animation: "heroBgPulse 6s ease-in-out infinite",
        }} />

        {/* Hero */}
        <section style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "4.5rem 2rem 2rem",
        }}>
          {/* Nexion logo + name — hero identity mark */}
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            marginBottom: "2.2rem",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.5s 0.05s cubic-bezier(0.34,1.2,0.64,1)",
          }}>
            <HeroLogoMark />
            <span style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontWeight: "600", letterSpacing: "0.02em",
              fontFamily: "Georgia, serif", color: "#f1f5f9",
            }}>Nexion</span>
          </div>

          <Badge />

          <InteractiveHeadline heroVisible={heroVisible} />

          <InteractiveSubline heroVisible={heroVisible} />

          <div style={{
            display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s 0.4s ease",
          }}>
            <MagneticButton href="/chat" primary>
              Get Started →
            </MagneticButton>
          </div>
        </section>

        {/* Features */}
        <section style={{
          position: "relative", zIndex: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1px", margin: "2rem 2rem",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px", overflow: "hidden",
          background: "rgba(255,255,255,0.03)",
        }}>
          {[
            {
              icon: "◈",
              title: "PDF Analysis",
              desc: "Upload your thesis or paper. Nexion reads every page and answers questions about your own research.",
            },
            {
              icon: "⟳",
              title: "Smart Fallback",
              desc: "Gemini, Groq, and OpenRouter work as one. If one hits a limit, another takes over instantly.",
            },
            {
              icon: "◎",
              title: "Literature Search",
              desc: "Find related studies by meaning, not just keywords. Semantic search across academic sources.",
            },
            {
              icon: "∴",
              title: "Citation Help",
              desc: "Get properly formatted citations in APA, MLA, or Chicago. No more manual formatting.",
            },
          ].map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </section>

        {/* AI Stack */}
        <section style={{
          position: "relative", zIndex: 10,
          textAlign: "center", padding: "1.5rem 2rem 2.5rem",
        }}>
          <p style={{
            fontSize: "11px", letterSpacing: "0.12em", color: "#334155",
            marginBottom: "1.5rem", fontFamily: "monospace",
          }}>
            POWERED BY
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {["Gemini 1.5 Flash", "Groq LLaMA 3", "OpenRouter", "Next.js 14", "Supabase"].map((t) => (
              <TechPill key={t} label={t} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}