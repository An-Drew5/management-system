import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

// ─── Data ────────────────────────────────────────────────────────────────────

interface PerformanceBar {
  label: string;
  value: number; // 0–100
  color: string; // Tailwind bg-* class
  textColor: string;
}

const BARS: PerformanceBar[] = [
  {
    label: "Mathematics",
    value: 87,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
  },
  {
    label: "Science",
    value: 72,
    color: "bg-emerald-400",
    textColor: "text-emerald-500",
  },
  {
    label: "Literature",
    value: 58,
    color: "bg-amber-400",
    textColor: "text-amber-600",
  },
  {
    label: "History",
    value: 34,
    color: "bg-rose-500",
    textColor: "text-rose-600",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ bar }: { bar: PerformanceBar }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600 font-medium">{bar.label}</span>
        <span className={`font-semibold ${bar.textColor}`}>{bar.value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${bar.color} transition-all duration-700`}
          style={{ width: `${bar.value}%` }}
        />
      </div>
    </div>
  );
}

function DashboardCard() {
  return (
    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-sm mx-auto">
      {/* Card header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
            Overview
          </p>
          <h3 className="text-base font-bold text-slate-800 mt-0.5">
            Student Performance
          </h3>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-4">
        {BARS.map((bar) => (
          <ProgressBar key={bar.label} bar={bar} />
        ))}
      </div>

      {/* Footer stat */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
        <span className="text-slate-400">Class average</span>
        <span className="text-slate-700 font-semibold">62.8%</span>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Entrance timeline ──────────────────────────────────────────────
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5 },
      )
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.75 },
          "-=0.2",
        )
        .fromTo(
          subtextRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.65 },
          "-=0.4",
        )
        .fromTo(
          buttonsRef.current!.children,
          { opacity: 0, y: 16, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12 },
          "-=0.35",
        )
        .fromTo(
          cardWrapRef.current,
          { opacity: 0, x: 60 },
          { opacity: 1, x: 0, duration: 0.85, ease: "power2.out" },
          "-=0.55",
        );

      // ── Glow entrance ─────────────────────────────────────────────────
      gsap.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out", delay: 0.3 },
      );

      // ── Floating loop on card ──────────────────────────────────────────
      gsap.to(cardWrapRef.current, {
        y: -14,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.2,
      });

      // ── Subtle glow pulse ──────────────────────────────────────────────
      gsap.to(glowRef.current, {
        scale: 1.08,
        opacity: 0.75,
        duration: 3.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.5,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // ── Button hover helpers (micro-interactions) ────────────────────────────
  function onBtnEnter(e: React.MouseEvent<HTMLButtonElement>) {
    gsap.to(e.currentTarget, {
      scale: 1.05,
      duration: 0.2,
      ease: "power2.out",
    });
  }
  function onBtnLeave(e: React.MouseEvent<HTMLButtonElement>) {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: "power2.inOut" });
  }
  function onBtnDown(e: React.MouseEvent<HTMLButtonElement>) {
    gsap.to(e.currentTarget, { scale: 0.97, duration: 0.1 });
  }
  function onBtnUp(e: React.MouseEvent<HTMLButtonElement>) {
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.1 });
  }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100vh-7rem)] w-full bg-[#234F1E] overflow-hidden flex items-center"
    >
      {/* ── Background glow blobs ─────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={glowRef}
          className="absolute -top-32 -left-40 w-[640px] h-[640px] rounded-full bg-[#3DED97]/10 blur-3xl"
        />
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-[#3DED97]/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-[#1a3a15]/60 blur-2xl" />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* ── Left: Text content ──────────────────────────────────────── */}
        <div className="flex flex-col items-start gap-6">
          {/* Badge */}
          <span
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#3DED97]/40 bg-[#3DED97]/10 text-[#3DED97] text-xs font-semibold tracking-wide opacity-0"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#3DED97] animate-pulse" />
            School Management SaaS
          </span>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-[#F8F7F2] opacity-0"
          >
            Smarter School <span className="text-[#3DED97]">Management</span>{" "}
            Starts Here
          </h1>

          {/* Subtext */}
          <p
            ref={subtextRef}
            className="text-lg text-[#F8F7F2]/70 leading-relaxed max-w-lg opacity-0"
          >
            Track student performance, manage academics, and empower teachers
            with real-time insights.
          </p>

          {/* CTA buttons */}
          <div ref={buttonsRef} className="flex flex-wrap gap-4 mt-2">
            <button
              onMouseEnter={onBtnEnter}
              onMouseLeave={onBtnLeave}
              onMouseDown={onBtnDown}
              onMouseUp={onBtnUp}
              onClick={() => navigate("/signup")}
              className="opacity-0 px-7 py-3.5 rounded-xl bg-[#3DED97] hover:bg-[#2fd984] text-[#1a3a15] font-semibold text-sm shadow-lg shadow-[#3DED97]/20 transition-colors duration-200 cursor-pointer"
            >
              Get Started
            </button>
            <button
              onMouseEnter={onBtnEnter}
              onMouseLeave={onBtnLeave}
              onMouseDown={onBtnDown}
              onMouseUp={onBtnUp}
              onClick={() => navigate("/login")}
              className="opacity-0 px-7 py-3.5 rounded-xl border border-[#3DED97] hover:bg-[#3DED97]/10 text-[#3DED97] font-semibold text-sm transition-colors duration-200 backdrop-blur-sm cursor-pointer"
            >
              Login
            </button>
          </div>

          {/* Social proof micro-row */}
          <div className="flex items-center gap-3 mt-4 text-sm text-[#F8F7F2]/50">
            <div className="flex -space-x-2">
              {["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981"].map((c, i) => (
                <span
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-[#234F1E] flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: c }}
                >
                  {["A", "T", "S", "G"][i]}
                </span>
              ))}
            </div>
            <span>Trusted by 1,200+ schools worldwide</span>
          </div>
        </div>

        {/* ── Right: Animated dashboard card ──────────────────────────── */}
        <div
          ref={cardWrapRef}
          className="relative flex justify-center lg:justify-end opacity-0"
        >
          {/* Decorative ring behind card */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-80 w-80 rounded-full border border-[#3DED97]/15" />
            <div className="absolute h-96 w-96 rounded-full border border-[#3DED97]/8" />
          </div>

          {/* Card itself */}
          <div className="relative z-10">
            {/* Tiny stat pills above card */}
            <div className="flex gap-3 mb-4 justify-center">
              <span className="px-3 py-1 rounded-full bg-[#3DED97]/15 border border-[#3DED97]/30 text-[#3DED97] text-xs font-medium">
                ↑ 12% this term
              </span>
              <span className="px-3 py-1 rounded-full bg-[#F8F7F2]/10 border border-[#F8F7F2]/20 text-[#F8F7F2]/70 text-xs font-medium">
                428 active students
              </span>
            </div>

            <DashboardCard />

            {/* Tiny floating badge below card */}
            <div className="mt-4 flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-[#1a3a15]/60 border border-[#3DED97]/20 text-[#F8F7F2]/50 text-xs font-medium backdrop-blur-sm">
                Last updated: just now
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subtle bottom gradient fade ──────────────────────────────────── */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#1a3a15]/60 to-transparent" />
    </section>
  );
}
