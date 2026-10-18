import { geoAzimuthalEqualArea, geoCircle } from 'd3-geo';
import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';

import { clamp } from '@/components/countries/world';

/** What the map looks at: a point on the globe and how far around it. */
export interface View {
  centre: [number, number];
  /** Degrees from the centre to the shorter edge of the stage. */
  radius: number;
}

// From a close look at a microstate out to a whole hemisphere.
export const MIN_RADIUS = 0.5;
export const MAX_RADIUS = 90;

// Each step of + or − (or wheel notch) changes the radius by this factor.
const ZOOM_STEP = 1.6;

// Movement (px) below which a press counts as a tap rather than a drag.
const TAP_SLOP = 8;

interface Press {
  pointers: Map<number, [number, number]>;
  /** Where the single pointer went down, and the view at that moment. */
  start: [number, number] | null;
  startView: View;
  moved: boolean;
  pinch: number;
}

/**
 * A globe to turn and zoom, shared by every map: one finger turns it, two pinch,
 * the wheel and `zoom` step. An azimuthal projection centred on the view keeps
 * whatever is in the middle undistorted, Greenland and New Zealand included.
 *
 * `start` may be null while the data is loading; the first non-null start becomes
 * the view. A press that hardly moves is a tap, and `onTap` gets the element it
 * landed on.
 */
export function useGlobe({
  start,
  size,
  padding,
  onTap,
}: {
  start: View | null;
  size: { width: number; height: number } | null;
  /** Room between the view circle and the edge of the stage, in px. */
  padding: number;
  onTap?: (target: Element) => void;
}) {
  const [view, setView] = useState<View | null>(start);
  const press = useRef<Press>({
    pointers: new Map(),
    start: null,
    startView: start ?? { centre: [0, 0], radius: MAX_RADIUS },
    moved: false,
    pinch: 0,
  });

  useEffect(() => {
    if (start) setView((current) => current ?? start);
  }, [start]);

  const projection = useMemo(() => {
    if (!view || !size || size.width === 0 || size.height === 0) return null;
    return geoAzimuthalEqualArea()
      .rotate([-view.centre[0], -view.centre[1]])
      .clipAngle(90)
      .fitExtent(
        [
          [padding, padding],
          [size.width - padding, size.height - padding],
        ],
        geoCircle().center(view.centre).radius(view.radius)(),
      );
  }, [view, size, padding]);

  // Functional updates: two taps before a re-render must both count.
  function zoom(steps: number) {
    setView(
      (current) =>
        current && {
          ...current,
          radius: clamp(current.radius / ZOOM_STEP ** steps, MIN_RADIUS, MAX_RADIUS),
        },
    );
  }

  function onPointer(event: PointerEvent<Element>) {
    if (!view) return;
    const state = press.current;
    const point: [number, number] = [event.clientX, event.clientY];

    if (event.type === 'pointerdown') {
      state.pointers.set(event.pointerId, point);
      if (state.pointers.size === 1) {
        state.start = point;
        state.startView = view;
        state.moved = false;
      } else {
        state.pinch = 0;
        state.moved = true;
      }
      return;
    }

    if (event.type === 'pointermove') {
      if (!state.pointers.has(event.pointerId)) return;
      state.pointers.set(event.pointerId, point);
      const points = [...state.pointers.values()];
      if (points.length === 2) {
        const [a, b] = points as [[number, number], [number, number]];
        const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (state.pinch === 0) {
          state.pinch = distance;
          state.startView = view;
        } else if (distance > 0) {
          const radius = state.startView.radius * (state.pinch / distance);
          setView({ ...state.startView, radius: clamp(radius, MIN_RADIUS, MAX_RADIUS) });
        }
        return;
      }
      if (!state.start || !projection) return;
      const dx = point[0] - state.start[0];
      const dy = point[1] - state.start[1];
      if (!state.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
      state.moved = true;
      // Drag the map under the finger: move the centre the other way.
      const perPixel = 180 / Math.PI / projection.scale();
      const [lon, lat] = state.startView.centre;
      setView({
        ...state.startView,
        centre: [lon - dx * perPixel, clamp(lat + dy * perPixel, -80, 80)],
      });
      return;
    }

    // pointerup / pointercancel
    const wasTap = event.type === 'pointerup' && state.pointers.size === 1 && !state.moved;
    state.pointers.delete(event.pointerId);
    if (state.pointers.size === 0) state.start = null;
    if (wasTap && onTap) onTap(event.target as Element);
  }

  return {
    view,
    setView,
    projection,
    zoom,
    canZoomIn: !!view && view.radius > MIN_RADIUS,
    canZoomOut: !!view && view.radius < MAX_RADIUS,
    /** Spread on the stage element. */
    handlers: {
      onWheel: (event: WheelEvent<Element>) => zoom(event.deltaY < 0 ? 0.5 : -0.5),
      onPointerDown: onPointer,
      onPointerMove: onPointer,
      onPointerUp: onPointer,
      onPointerCancel: onPointer,
    },
  };
}
