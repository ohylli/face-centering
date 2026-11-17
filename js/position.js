// Pure logic: turns a detected face box into per-axis levels.
// No browser APIs here, so it can be unit tested in Node.

/**
 * Level conventions (all integers):
 *  x: negative = left, positive = right (from the user's own perspective).
 *     magnitude 0 centered, 1 "a little", 2 plain, 3 "far".
 *  y: negative = down, positive = up. Same magnitudes as x.
 *  d: negative = distant, positive = close.
 *     magnitude 0 ok, 1 "a little", 2 plain.
 */

/** Center tolerance (as a fraction of half the frame) per tolerance setting. */
export const TOLERANCES = {
  tight: 0.06,
  normal: 0.1,
  loose: 0.16,
};

/** Boundaries above the center tolerance, for "a little" -> plain -> "far". */
const XY_OUTER = [0.35, 0.65];
const XY_MARGIN = 0.03;

/** Distance works on log2(faceSize / idealSize). */
const D_BOUNDARIES = [0.25, 0.6]; // ~19 % and ~52 % bigger (or smaller) than ideal
const D_MARGIN = 0.07;

/**
 * Offsets of the face from the frame center, each in roughly [-1, 1].
 * The camera image is not mirrored, so the user's left appears on the
 * image's right; `swapLeftRight` handles cameras that already mirror.
 *
 * @param {{x:number,y:number,width:number,height:number}} box face box in pixels
 * @param {number} frameW
 * @param {number} frameH
 * @param {{swapLeftRight?:boolean, idealSize?:number}} [opts]
 */
export function offsets(box, frameW, frameH, opts = {}) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  let x = -(cx - frameW / 2) / (frameW / 2);
  if (opts.swapLeftRight) x = -x;
  const y = -(cy - frameH / 2) / (frameH / 2);
  const size = box.height / frameH;
  const ideal = opts.idealSize ?? 0.4;
  const d = Math.log2(size / ideal);
  return { x, y, d, size };
}

/**
 * Magnitude-with-direction level for one axis, with hysteresis: a boundary
 * must be passed by `margin` before the level changes, in either direction.
 *
 * @param {number} value signed offset
 * @param {number[]} boundaries ascending magnitudes separating levels 0|1|2|...
 * @param {number} prev previous signed level (0 if none)
 * @param {number} margin hysteresis margin
 */
export function axisLevel(value, boundaries, prev, margin) {
  const sign = Math.sign(value);
  const abs = Math.abs(value);
  // Crossing to the other side means we passed through the center zone.
  const prevMag = Math.sign(prev) === sign ? Math.abs(prev) : 0;
  let mag = 0;
  for (let i = 0; i < boundaries.length; i++) {
    // Boundary i separates level i from level i+1.
    const b = i < prevMag ? boundaries[i] - margin : boundaries[i] + margin;
    if (abs >= b) mag = i + 1;
    else break;
  }
  return mag === 0 ? 0 : sign * mag;
}

/**
 * @param {{x:number,y:number,d:number}} off
 * @param {{x:number,y:number,d:number}|null} prev previous levels
 * @param {{tolerance?:string, distance?:boolean}} [opts]
 */
export function levels(off, prev, opts = {}) {
  const tol = TOLERANCES[opts.tolerance] ?? TOLERANCES.normal;
  const xy = [tol, ...XY_OUTER];
  const p = prev ?? { x: 0, y: 0, d: 0 };
  return {
    x: axisLevel(off.x, xy, p.x, XY_MARGIN),
    y: axisLevel(off.y, xy, p.y, XY_MARGIN),
    d: opts.distance === false ? 0 : axisLevel(off.d, D_BOUNDARIES, p.d, D_MARGIN),
  };
}

export function isCentered(lv) {
  return lv.x === 0 && lv.y === 0 && lv.d === 0;
}

/** Stable string key for a state; `null` levels means no face. */
export function stateKey(lv) {
  return lv ? `${lv.x},${lv.y},${lv.d}` : 'none';
}

/** Exponential smoothing of the face box to reduce jitter. */
export function smoothBox(prev, next, alpha = 0.5) {
  if (!prev) return { ...next };
  const mix = (a, b) => a + (b - a) * alpha;
  return {
    x: mix(prev.x, next.x),
    y: mix(prev.y, next.y),
    width: mix(prev.width, next.width),
    height: mix(prev.height, next.height),
  };
}

/** Pick the largest detection's bounding box, or null. */
export function largestBox(detections) {
  let best = null;
  for (const det of detections ?? []) {
    const b = det.boundingBox;
    if (!b) continue;
    if (!best || b.width * b.height > best.width * best.height) {
      best = { x: b.originX, y: b.originY, width: b.width, height: b.height };
    }
  }
  return best;
}
