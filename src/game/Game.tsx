import { useEffect, useRef, useState } from 'react';
import spacecraftUrl from '../assets/spacecraft.svg';
import ufoUrl from '../assets/ufo.svg';

interface GameProps {
  onExit: () => void;
}

interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
}

const CANVAS_W = 800;
const CANVAS_H = 600;

// Fire keys: Space, Ctrl, Enter (+ left mouse button handled separately)
const FIRE_KEYS = new Set(['Space', 'Control', 'ControlLeft', 'ControlRight', 'Enter', 'NumpadEnter']);
// Move keys: up/down arrows (+ W/S as a bonus)
const UP_KEYS = new Set(['ArrowUp', 'KeyW']);
const DOWN_KEYS = new Set(['ArrowDown', 'KeyS']);

export default function Game({ onExit }: GameProps) {
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load background image
    const bgImg = new Image();
    bgImg.src = '/night-sky.webp';

    // Load sprite images
    const shipImg = new Image();
    shipImg.src = spacecraftUrl;
    const ufoImg = new Image();
    ufoImg.src = ufoUrl;

    const keys = new Set<string>();
    let mouseDown = false;

    const player: Player = { x: 60, y: CANVAS_H / 2 - 20, w: 40, h: 40, speed: 300 };
    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let score = 0;
    let running = true;
    let lastTime = performance.now();
    let enemyTimer = 0;
    let fireCooldown = 0;
    let rafId = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (FIRE_KEYS.has(e.code) || UP_KEYS.has(e.code) || DOWN_KEYS.has(e.code)) e.preventDefault();
      keys.add(e.code);
      if (e.code === 'Escape') onExit();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouseDown = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouseDown = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // account for CSS scaling of the canvas
      const scale = CANVAS_H / rect.height;
      const y = (e.clientY - rect.top) * scale - player.h / 2;
      player.y = Math.max(0, Math.min(CANVAS_H - player.h, y));
    };

    // touch: drag to move, hold to fire
    const updateTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      const scale = CANVAS_H / rect.height;
      const y = (t.clientY - rect.top) * scale - player.h / 2;
      player.y = Math.max(0, Math.min(CANVAS_H - player.h, y));
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      mouseDown = true;
      updateTouch(e);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      updateTouch(e);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) mouseDown = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    const tryFire = (dt: number) => {
      fireCooldown -= dt;
      const wantFire =
        mouseDown || [...FIRE_KEYS].some((k) => keys.has(k));
      if (wantFire && fireCooldown <= 0) {
        bullets.push({ x: player.x + player.w, y: player.y + player.h / 2, vx: 500, vy: 0 });
        fireCooldown = 0.2;
      }
    };

    const spawnEnemy = () => {
      const h = 30;
      const y = Math.random() * (CANVAS_H - h);
      const speed = 80 + Math.random() * 120;
      enemies.push({ x: CANVAS_W + 40, y, w: 40, h, vx: -speed });
    };

    const update = (dt: number) => {
      // player vertical movement
      let dir = 0;
      if ([...UP_KEYS].some((k) => keys.has(k))) dir -= 1;
      if ([...DOWN_KEYS].some((k) => keys.has(k))) dir += 1;
      player.y = Math.max(0, Math.min(CANVAS_H - player.h, player.y + dir * player.speed * dt));

      tryFire(dt);

      // spawn enemies
      enemyTimer -= dt;
      if (enemyTimer <= 0) {
        spawnEnemy();
        enemyTimer = 0.8 + Math.random() * 1.2;
      }

      // move bullets
      bullets = bullets.filter((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        return b.x < CANVAS_W;
      });

      // move enemies & collisions
      enemies = enemies.filter((en) => {
        en.x += en.vx * dt;
        // bullet hits
        for (const b of bullets) {
          if (b.x > en.x && b.x < en.x + en.w && b.y > en.y && b.y < en.y + en.h) {
            b.x = CANVAS_W + 999; // consume bullet
            score += 10;
            return false;
          }
        }
        // enemy reaches left side of canvas or the player
        if (
          en.x <= 0 ||
          (en.x < player.x + player.w &&
            en.x + en.w > player.x &&
            en.y < player.y + player.h &&
            en.y + en.h > player.y)
        ) {
          running = false;
          setGameOver(true); // show game over overlay
        }
        return en.x + en.w > 0;
      });
    };

    const draw = () => {
      // background with stars
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // background image
      if (bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
      }
      // player ship
      if (shipImg.complete && shipImg.naturalWidth > 0) {
        ctx.drawImage(shipImg, player.x - 10, player.y - 10, player.w + 20, player.h + 20);
      } else {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(player.x, player.y, player.w, player.h);
      }
      ctx.fillStyle = '#ff0';
      for (const b of bullets) ctx.fillRect(b.x, b.y, 10, 3);
      for (const en of enemies) {
        if (ufoImg.complete && ufoImg.naturalWidth > 0) {
          ctx.drawImage(ufoImg, en.x - 5, en.y - 10, en.w + 10, en.h + 20);
        } else {
          ctx.fillStyle = '#f33';
          ctx.fillRect(en.x, en.y, en.w, en.h);
        }
      }
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${score}`, 12, 24);
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [gameOver, onExit]);

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="max-h-full max-w-full touch-none cursor-crosshair border border-neutral-700"
      />
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/75">
          <h2 className="font-mono text-6xl font-bold tracking-widest text-red-500">GAME OVER</h2>
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => setGameOver(false)} className={restartButtonClass}>
              Start Again
            </button>
            <button onClick={onExit} className={restartButtonClass}>
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const restartButtonClass =
  'w-56 cursor-pointer rounded border-2 border-green-500 bg-zinc-900 px-0 py-3 text-lg text-green-500 transition-colors hover:bg-green-500 hover:text-black';
