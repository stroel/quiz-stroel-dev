import { useEffect, useMemo, useRef } from 'react';

const PIECES = 90;
const DURATION_MS = 1300;
const COLOURS = ['bg-emerald-500', 'bg-amber-400', 'bg-sky-500', 'bg-rose-500', 'bg-violet-500'];

interface Piece {
  /** Which bottom corner it is fired from. */
  side: 'left' | 'right';
  colour: string;
  /** Final offset from the origin, in px. */
  x: number;
  y: number;
  spin: number;
  delay: number;
  round: boolean;
}

/**
 * Two cannons in the bottom corners, each firing up and inwards, so the burst
 * crosses the whole screen whatever its size.
 */
function makePieces(width: number, height: number): Piece[] {
  const reach = Math.hypot(width, height);
  return Array.from({ length: PIECES }, (_, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    // 35° to 80° above the horizon, towards the middle of the screen.
    const elevation = ((35 + Math.random() * 45) * Math.PI) / 180;
    const distance = reach * (0.35 + Math.random() * 0.4);
    const x = Math.cos(elevation) * distance;
    return {
      side,
      colour: COLOURS[i % COLOURS.length]!,
      x: side === 'left' ? x : -x,
      y: -Math.sin(elevation) * distance,
      spin: (Math.random() - 0.5) * 720,
      delay: Math.random() * 120,
      round: Math.random() < 0.3,
    };
  });
}

/**
 * A confetti burst over the whole screen, replayed every time `burst` changes. Plain elements
 * animated with the Web Animations API, so it needs no library; skipped when
 * the player prefers reduced motion.
 */
export default function Confetti({ burst }: { burst: number }) {
  const container = useRef<HTMLDivElement>(null);
  // New pieces per burst; `burst` is the trigger, not a value used inside.
  const pieces = useMemo(
    () => (burst > 0 ? makePieces(window.innerWidth, window.innerHeight) : []),
    [burst],
  );

  // Animate once per burst. A ref callback would restart on every re-render,
  // and the round re-renders ten times a second while the timer runs.
  useEffect(() => {
    if (!container.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = [...container.current.children];
    const animations = pieces.map((piece, i) =>
      elements[i]?.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${piece.x}px, ${piece.y}px) rotate(${piece.spin / 2}deg)`,
            opacity: 1,
            offset: 0.6,
          },
          {
            // Gravity: the last part of the flight drifts down and fades.
            transform: `translate(${piece.x * 1.1}px, ${piece.y * 0.75}px) rotate(${piece.spin}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: DURATION_MS,
          delay: piece.delay,
          easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)',
          fill: 'forwards',
        },
      ),
    );
    return () => animations.forEach((animation) => animation?.cancel());
  }, [pieces]);

  return (
    <div
      ref={container}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {pieces.map((piece, i) => (
        <span
          key={`${burst}-${i}`}
          className={`absolute bottom-0 h-3.5 w-2 opacity-0 ${piece.side === 'left' ? 'left-0' : 'right-0'} ${piece.round ? 'rounded-full' : 'rounded-[1px]'} ${piece.colour}`}
        />
      ))}
    </div>
  );
}
