import { useEffect, useMemo, useRef } from 'react';

const PIECES = 60;
const DURATION_MS = 1100;
const COLOURS = ['bg-emerald-500', 'bg-amber-400', 'bg-sky-500', 'bg-rose-500', 'bg-violet-500'];

interface Piece {
  colour: string;
  /** Final offset from the origin, in px. */
  x: number;
  y: number;
  spin: number;
  delay: number;
  round: boolean;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => {
    // A fan pointing up: -150° to -30°, so the burst rises from the answer.
    const angle = ((-150 + Math.random() * 120) * Math.PI) / 180;
    const distance = 160 + Math.random() * 220;
    return {
      colour: COLOURS[i % COLOURS.length]!,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      spin: (Math.random() - 0.5) * 720,
      delay: Math.random() * 80,
      round: Math.random() < 0.3,
    };
  });
}

/**
 * A small confetti burst, replayed every time `burst` changes. Plain elements
 * animated with the Web Animations API, so it needs no library; skipped when
 * the player prefers reduced motion.
 */
export default function Confetti({ burst }: { burst: number }) {
  const container = useRef<HTMLDivElement>(null);
  // New pieces per burst; `burst` is the trigger, not a value used inside.
  const pieces = useMemo(() => (burst > 0 ? makePieces() : []), [burst]);

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
            transform: `translate(${piece.x * 1.15}px, ${piece.y + 90}px) rotate(${piece.spin}deg)`,
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
      className="pointer-events-none absolute inset-x-0 bottom-40 z-10"
      aria-hidden
    >
      {pieces.map((piece, i) => (
        <span
          key={`${burst}-${i}`}
          className={`absolute left-1/2 h-3.5 w-2 opacity-0 ${piece.round ? 'rounded-full' : 'rounded-[1px]'} ${piece.colour}`}
        />
      ))}
    </div>
  );
}
