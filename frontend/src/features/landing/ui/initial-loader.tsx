
import { useEffect, useState, useRef } from "react";

export function InitialLoader() {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit" | "done">("enter");
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Phase 1: enter — text reveals + progress bar fills (0 → 800ms)
    const enterTimer = setTimeout(() => setPhase("hold"), 800);

    // Phase 2: hold — brief pause at 100% (800 → 1400ms)
    const holdTimer = setTimeout(() => setPhase("exit"), 1400);

    // Phase 3: exit — curtain slides up (1400 → 2100ms)
    const exitTimer = setTimeout(() => setPhase("done"), 2100);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center bg-white transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        phase === "exit" ? "-translate-y-full" : "translate-y-0"
      }`}
      aria-label="Загрузка"
    >
      {/* Brand name with clip reveal */}
      <div className="overflow-hidden">
        <h1
          className="font-brand text-[clamp(1.75rem,5vw,3rem)] font-semibold tracking-[0.2em] text-slate-900 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: phase === "enter" ? "translateY(100%)" : "translateY(0)",
          }}
        >
          ПУЛЬСАР
        </h1>
      </div>

      {/* Progress line */}
      <div className="mt-5 h-[1px] w-[clamp(120px,20vw,200px)] overflow-hidden bg-slate-200">
        <div
          ref={progressRef}
          className="h-full origin-left bg-slate-900 transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform:
              phase === "enter" ? "scaleX(0)" : "scaleX(1)",
          }}
        />
      </div>

      {/* Subtle tagline */}
      <div className="overflow-hidden">
        <p
          className="mt-4 text-[11px] font-light tracking-[0.3em] uppercase text-slate-400 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-300"
          style={{
            transform: phase === "enter" ? "translateY(100%)" : "translateY(0)",
            opacity: phase === "enter" ? 0 : 1,
          }}
        >
          горячие лиды из Telegram
        </p>
      </div>
    </div>
  );
}
