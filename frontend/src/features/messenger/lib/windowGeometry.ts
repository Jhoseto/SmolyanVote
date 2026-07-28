export interface WindowRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowPoint {
  x: number;
  y: number;
}

/**
 * Chat windows have one fixed footprint — there is no manual resizing. The
 * only two states are "docked card" and "fullscreen", which keeps every open
 * window aligned on the same grid instead of a pile of arbitrary rectangles.
 */
export const WINDOW_W = 372;
export const WINDOW_H = 552;
/** Width the card grows by while the info panel is open. */
export const INFO_W = 232;

const EDGE = 14;
const TOP_EDGE = 76;
/** Keeps windows clear of the bottom-right FAB + minimized-bubble rail. */
const RAIL_W = 80;
const TILE_GAP = 10;

function viewport(): { w: number; h: number } {
  if (typeof window === "undefined") return { w: 1440, h: 900 };
  return { w: window.innerWidth, h: window.innerHeight };
}

/** The fixed card size, shrunk only when the viewport itself is smaller. */
export function windowSize(infoOpen: boolean): { w: number; h: number } {
  const vp = viewport();
  return {
    w: Math.min(WINDOW_W + (infoOpen ? INFO_W : 0), vp.w - EDGE * 2),
    h: Math.min(WINDOW_H, vp.h - TOP_EDGE - EDGE),
  };
}

export function fullscreenRect(): WindowRect {
  const vp = viewport();
  return {
    x: EDGE,
    y: TOP_EDGE,
    w: Math.max(320, vp.w - RAIL_W - EDGE),
    h: Math.max(320, vp.h - TOP_EDGE - EDGE),
  };
}

/** Pulls a card back into view — used while dragging and after a resize. */
export function clampPosition(point: WindowPoint, size: { w: number; h: number }): WindowPoint {
  const vp = viewport();
  return {
    x: Math.min(Math.max(point.x, EDGE), Math.max(EDGE, vp.w - size.w - EDGE)),
    y: Math.min(Math.max(point.y, TOP_EDGE - 32), Math.max(TOP_EDGE - 32, vp.h - size.h - EDGE)),
  };
}

/**
 * New cards tile right-to-left along the bottom edge, the way a desktop
 * messenger lines its conversations up next to the rail. Once the row is full
 * the sequence wraps back to the right with a small vertical offset.
 */
export function tilePosition(openCount: number): WindowPoint {
  const vp = viewport();
  const size = windowSize(false);
  const right = vp.w - RAIL_W - EDGE;
  const slot = size.w + TILE_GAP;
  const perRow = Math.max(1, Math.floor((right - EDGE) / slot));
  const column = openCount % perRow;
  const wrap = Math.floor(openCount / perRow);
  return clampPosition(
    {
      x: right - size.w - column * slot,
      y: vp.h - EDGE - size.h - wrap * 24,
    },
    size,
  );
}
