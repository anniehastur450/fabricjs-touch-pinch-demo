
interface Point {
  x: number;
  y: number;
}

export interface Pinch {
  dx: number;
  dy: number;
  scale: number;
  rotation: number;
  prevCentroid: Point;
  nextCentroid: Point;
}

export function calculateCentroid(points: Point[]): Point {
  let [xs, ys] = [0, 0];
  for (const point of points) {
    xs += point.x;
    ys += point.y;
  }
  return {
    x: xs / points.length,
    y: ys / points.length
  }
}

export function calculateAverageDistance(points: Point[]): number {
  const { x: xs, y: ys } = calculateCentroid(points);
  let d = 0;
  for (const point of points) {
    d += Math.hypot(point.x - xs, point.y - ys);
  }
  return d / points.length;
}

function positiveMod(a: number, b: number): number {
  return (a % b + b) % b;
}

// maps angle to [-pi, pi)
function normalizeRelativeAngle(angle: number): number {
  return positiveMod(angle + Math.PI, 2 * Math.PI) - Math.PI;
}

export function calculateAverageAngleDisplacement(prevPoints: Point[], nextPoints: Point[]): number {
  if (prevPoints.length !== nextPoints.length) {
    throw new Error('prevPoints and nextPoints must have the same length');
  }
  const prevCentroid = calculateCentroid(prevPoints);
  const nextCentroid = calculateCentroid(nextPoints);
  let d = 0;
  for (let i = 0; i < prevPoints.length; i++) {
    const prevPoint = prevPoints[i];
    const nextPoint = nextPoints[i];
    const prevAngle = Math.atan2(prevPoint.y - prevCentroid.y, prevPoint.x - prevCentroid.x);
    const nextAngle = Math.atan2(nextPoint.y - nextCentroid.y, nextPoint.x - nextCentroid.x);
    d += normalizeRelativeAngle(nextAngle - prevAngle);
  }
  return d / prevPoints.length;
}

export function calculatePinch(prevPoints: Point[], nextPoints: Point[]): Pinch {
  const prevCentroid = calculateCentroid(prevPoints);
  const nextCentroid = calculateCentroid(nextPoints);
  const prevDistance = calculateAverageDistance(prevPoints);
  const nextDistance = calculateAverageDistance(nextPoints);
  const rotation = calculateAverageAngleDisplacement(prevPoints, nextPoints);
  const scale = nextDistance / prevDistance;
  const dx = nextCentroid.x - prevCentroid.x;
  const dy = nextCentroid.y - prevCentroid.y;
  return {
    dx,
    dy,
    scale,
    rotation,
    prevCentroid,
    nextCentroid
  };
}

