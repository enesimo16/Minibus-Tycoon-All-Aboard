export type PathPoint = readonly [number, number];

function samePoint(a: PathPoint, b: PathPoint): boolean {
  return Math.abs(a[0] - b[0]) < 0.0001 && Math.abs(a[1] - b[1]) < 0.0001;
}

/**
 * Replaces hard polyline corners with short quadratic arcs.
 *
 * The curve stays inside the intersection: only the final `radius` metres of
 * the incoming/outgoing road segments are rounded. Vehicles therefore turn
 * smoothly without cutting across neighbouring parcels.
 */
export function roundPathCorners(
  input: readonly PathPoint[],
  radius = 1.05,
  cornerSamples = 5,
): PathPoint[] {
  if (input.length < 3) return input.map((point) => [point[0], point[1]]);

  const closed = samePoint(input[0], input[input.length - 1]);
  const points = closed ? input.slice(0, -1) : [...input];
  const result: PathPoint[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (!closed && (index === 0 || index === points.length - 1)) {
      result.push([point[0], point[1]]);
      continue;
    }

    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const incomingX = point[0] - previous[0];
    const incomingZ = point[1] - previous[1];
    const outgoingX = next[0] - point[0];
    const outgoingZ = next[1] - point[1];
    const incomingLength = Math.hypot(incomingX, incomingZ);
    const outgoingLength = Math.hypot(outgoingX, outgoingZ);

    if (incomingLength < 0.001 || outgoingLength < 0.001) {
      result.push([point[0], point[1]]);
      continue;
    }

    const inX = incomingX / incomingLength;
    const inZ = incomingZ / incomingLength;
    const outX = outgoingX / outgoingLength;
    const outZ = outgoingZ / outgoingLength;
    const directionDot = inX * outX + inZ * outZ;

    // Straight or near-U-turn sections are kept intact.
    if (Math.abs(directionDot) > 0.985) {
      result.push([point[0], point[1]]);
      continue;
    }

    const cut = Math.min(radius, incomingLength * 0.32, outgoingLength * 0.32);
    const before: PathPoint = [point[0] - inX * cut, point[1] - inZ * cut];
    const after: PathPoint = [point[0] + outX * cut, point[1] + outZ * cut];
    result.push(before);

    for (let sample = 1; sample <= cornerSamples; sample += 1) {
      const t = sample / cornerSamples;
      const inverse = 1 - t;
      result.push([
        inverse * inverse * before[0] +
          2 * inverse * t * point[0] +
          t * t * after[0],
        inverse * inverse * before[1] +
          2 * inverse * t * point[1] +
          t * t * after[1],
      ]);
    }
  }

  if (closed && result.length > 0) {
    result.push([result[0][0], result[0][1]]);
  }
  return result;
}
