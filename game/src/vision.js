// Vision math: what a guard or a camera can actually see.
// One job: line-of-sight tests and vision-cone tests, shared by guards and cameras.

/** Does segment (x1,y1)-(x2,y2) cross rectangle r? */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  // Slab test on each axis; a zero-length axis is parallel and either inside or outside.
  for (const [p, d, lo, hi] of [[x1, dx, r.x, r.x + r.w], [y1, dy, r.y, r.y + r.h]]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

/** True when no wall or furniture blocks the view from (x1,y1) to (x2,y2). */
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (let i = 0; i < blockers.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, blockers[i])) return false;
  }
  return true;
}

/** Angle from (x1,y1) to (x2,y2), in radians. */
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Smallest absolute difference between two angles, in radians. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/**
 * Is the target inside a vision cone? `halfAngle` is half the cone's width.
 * Returns 0 outside the cone, otherwise 1 at the rim rising to 1 at the centre
 * of the cone — callers multiply by a distance falloff of their own.
 */
export function coneFactor(eyeX, eyeY, eyeAngle, halfAngle, targetX, targetY) {
  const d = angleDiff(angleTo(eyeX, eyeY, targetX, targetY), eyeAngle);
  if (d > halfAngle) return 0;
  return 1 - (d / halfAngle) * 0.5;
}

/** Euclidean distance between two points. */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}
