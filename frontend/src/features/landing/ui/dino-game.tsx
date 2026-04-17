
import { useRef, useEffect, useCallback } from "react";

const W = 600;
const H = 120;
const GROUND = 100;
const DINO_H = 22;
const CACTUS_W = 10;
const GRAVITY = 1600;
const JUMP_VEL = -400;
const BASE_SPEED = 150;

interface Cactus { x: number; h: number }

interface State {
  dinoY: number;
  velY: number;
  jumping: boolean;
  cacti: Cactus[];
  elapsed: number;
  score: number;
  speed: number;
  phase: "idle" | "running" | "dead";
  spawnCd: number;
  legTick: number;
}

function mkState(): State {
  return {
    dinoY: GROUND - DINO_H,
    velY: 0,
    jumping: false,
    cacti: [],
    elapsed: 0,
    score: 0,
    speed: BASE_SPEED,
    phase: "idle",
    spawnCd: 1.5,
    legTick: 0,
  };
}

export function DinoGame() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const st = useRef(mkState());
  const last = useRef(-1);
  const label = useRef<HTMLSpanElement>(null);

  const input = useCallback(() => {
    const s = st.current;
    if (s.phase === "dead") {
      st.current = mkState();
      st.current.phase = "running";
      last.current = -1;
      return;
    }
    if (s.phase === "idle") {
      s.phase = "running";
      last.current = -1;
      return;
    }
    if (!s.jumping) {
      s.velY = JUMP_VEL;
      s.jumping = true;
    }
  }, []);

  useEffect(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;

    const frame = (now: number) => {
      // Delta time in seconds
      let dt: number;
      if (last.current < 0) {
        dt = 0.016;
      } else {
        dt = (now - last.current) / 1000;
      }
      last.current = now;

      // Clamp: skip big gaps (tab switch, etc)
      if (dt > 0.05) dt = 0.016;

      const s = st.current;

      if (s.phase === "running") {
        // Gravity
        s.velY += GRAVITY * dt;
        s.dinoY += s.velY * dt;
        if (s.dinoY >= GROUND - DINO_H) {
          s.dinoY = GROUND - DINO_H;
          s.velY = 0;
          s.jumping = false;
        }

        s.elapsed += dt;
        s.legTick += dt;
        s.score = Math.floor(s.elapsed * 6);
        s.speed = BASE_SPEED + s.score * 0.45;

        // Spawn
        s.spawnCd -= dt;
        if (s.spawnCd <= 0) {
          s.spawnCd = Math.max(0.7, 1.5 - s.score * 0.006) + Math.random() * 0.4;
          s.cacti.push({ x: W + 10, h: 16 + Math.random() * 10 });
        }

        // Move
        const dx = s.speed * dt;
        for (let i = 0; i < s.cacti.length; i++) s.cacti[i].x -= dx;
        if (s.cacti.length && s.cacti[0].x < -CACTUS_W) s.cacti.shift();

        // Hit test
        for (const cc of s.cacti) {
          if (56 > cc.x + 2 && 44 < cc.x + CACTUS_W - 2 && s.dinoY + DINO_H > GROUND - cc.h) {
            s.phase = "dead";
            break;
          }
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, W, H);

      // Ground
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();

      // Ground dots
      ctx.fillStyle = "#e2e8f0";
      const off = s.phase === "running" ? (s.elapsed * s.speed) % 16 : 0;
      for (let x = -off; x < W; x += 16) {
        ctx.fillRect(x, GROUND + 4, 3, 1);
        ctx.fillRect(x + 8, GROUND + 7, 2, 1);
      }

      // Dino
      const dc = s.phase === "dead" ? "#94a3b8" : "#64748b";
      const alt = s.phase === "running" && !s.jumping && Math.floor(s.legTick * 10) % 2 === 0;
      dino(ctx, 40, s.dinoY, dc, alt);

      // Cacti
      const cc = s.phase === "dead" ? "#cbd5e1" : "#94a3b8";
      for (const c2 of s.cacti) cactus(ctx, c2.x, GROUND - c2.h, c2.h, cc);

      // Label (DOM, no re-render)
      if (label.current) {
        label.current.textContent =
          s.phase === "idle" ? "нажми чтобы играть" :
          s.phase === "dead" ? `${s.score} · нажми заново` :
          String(s.score);
      }

      raf.current = requestAnimationFrame(frame);
    };

    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); input(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [input]);

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={input}
      onTouchStart={(e) => { e.preventDefault(); input(); }}
    >
      <canvas ref={cvs} width={W} height={H} className="w-full max-w-[600px]" style={{ imageRendering: "pixelated" }} />
      <span ref={label} className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-brand text-[11px] tracking-widest text-slate-400" />
    </div>
  );
}

function dino(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, alt: boolean) {
  ctx.fillStyle = c;
  ctx.fillRect(x + 4, y + 6, 12, 10);
  ctx.fillRect(x + 10, y, 10, 8);
  ctx.fillStyle = "#f8fafc"; ctx.fillRect(x + 16, y + 2, 2, 2); ctx.fillStyle = c;
  ctx.fillRect(x + 14, y + 6, 6, 2);
  ctx.fillRect(x, y + 8, 6, 4);
  ctx.fillRect(x - 2, y + 6, 4, 4);
  if (alt) { ctx.fillRect(x + 6, y + 16, 3, 6); ctx.fillRect(x + 13, y + 18, 3, 4); }
  else     { ctx.fillRect(x + 6, y + 18, 3, 4); ctx.fillRect(x + 13, y + 16, 3, 6); }
  ctx.fillRect(x + 14, y + 10, 4, 2);
}

function cactus(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x + 3, y, 4, h);
  if (h > 18) {
    ctx.fillRect(x, y + 4, 3, 3); ctx.fillRect(x, y + 4, 2, 8);
    ctx.fillRect(x + 7, y + 8, 3, 3); ctx.fillRect(x + 8, y + 8, 2, 6);
  }
}
