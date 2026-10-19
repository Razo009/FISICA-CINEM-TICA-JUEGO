export type ObserverType = 'port' | 'boat' | 'other_boat';

export interface Point2D {
  x: number;
  y: number;
  time?: number; // seconds
}

/**
 * Calculates straight line Euclidean distance between two points in km
 */
export function calculateEuclideanDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates total accumulated distance along a path of points (Scalar quantity, always >= 0)
 */
export function calculateTotalDistance(points: Point2D[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += calculateEuclideanDistance(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Calculates displacement vector from start to end (Vector quantity: magnitude, dx, dy, angle)
 */
export function calculateDisplacement(pStart: Point2D, pEnd: Point2D): {
  magnitude: number;
  dx: number;
  dy: number;
  angleDeg: number;
} {
  const dx = pEnd.x - pStart.x;
  const dy = pEnd.y - pStart.y;
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  // Angle in degrees standard Cartesian (0 deg = East, 90 deg = North)
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return {
    magnitude,
    dx,
    dy,
    angleDeg,
  };
}

/**
 * Divides the trajectory into discrete stages/segments for educational analysis
 */
export interface TrajectorySegment {
  index: number;
  name: string;
  startPoint: Point2D;
  endPoint: Point2D;
  distance: number;
}

export function calculateSegments(points: Point2D[], targetSegmentCount = 4): TrajectorySegment[] {
  if (points.length < 2) return [];

  const totalDist = calculateTotalDistance(points);
  if (totalDist < 0.05) {
    return [
      {
        index: 1,
        name: 'Tramo 1',
        startPoint: points[0],
        endPoint: points[points.length - 1],
        distance: totalDist,
      },
    ];
  }

  const segmentCount = Math.min(targetSegmentCount, Math.max(2, Math.floor(points.length / 5)));
  const segmentTargetDist = totalDist / segmentCount;
  const segments: TrajectorySegment[] = [];

  let currentDist = 0;
  let segStartIndex = 0;
  let segIndex = 1;

  for (let i = 1; i < points.length; i++) {
    const stepDist = calculateEuclideanDistance(points[i - 1], points[i]);
    currentDist += stepDist;

    const isLastPoint = i === points.length - 1;
    if (currentDist >= segmentTargetDist || isLastPoint) {
      if (segments.length < segmentCount - 1 || isLastPoint) {
        segments.push({
          index: segIndex,
          name: `Tramo ${segIndex}`,
          startPoint: points[segStartIndex],
          endPoint: points[i],
          distance: currentDist,
        });
        segIndex++;
        segStartIndex = i;
        currentDist = 0;
      }
    }
  }

  return segments;
}

/**
 * Classifies the trajectory based on its geometrical path
 */
export function classifyTrajectory(points: Point2D[], totalDist: number, displacementMag: number): string {
  if (points.length < 3 || totalDist < 0.2) return 'Punto o reposo';

  // If displacement is almost 0 while distance is substantial, it is a closed loop / circular trajectory
  if (displacementMag < 0.35 && totalDist > 1.0) {
    return 'Cerrada / Circular';
  }

  // Ratio of displacement to distance. If ratio is very close to 1 (> 0.96), it's virtually a straight line
  const linearityRatio = displacementMag / Math.max(0.0001, totalDist);
  if (linearityRatio > 0.95) {
    return 'Rectilínea';
  }

  return 'Curvilínea';
}

/**
 * Transforms world coordinates to a given observer's reference frame
 * - 'port': origin is at port (0, 0)
 * - 'boat': origin is at the player's boat (boat is always (0, 0))
 * - 'other_boat': origin is at the autonomous other boat
 */
export function transformPointToObserver(
  worldPoint: Point2D,
  observer: ObserverType,
  boatPos: Point2D,
  otherBoatPos: Point2D,
  portPos: Point2D = { x: 0, y: 0 }
): Point2D {
  switch (observer) {
    case 'port':
      return {
        x: worldPoint.x - portPos.x,
        y: worldPoint.y - portPos.y,
        time: worldPoint.time,
      };
    case 'boat':
      return {
        x: worldPoint.x - boatPos.x,
        y: worldPoint.y - boatPos.y,
        time: worldPoint.time,
      };
    case 'other_boat':
      return {
        x: worldPoint.x - otherBoatPos.x,
        y: worldPoint.y - otherBoatPos.y,
        time: worldPoint.time,
      };
  }
}

/**
 * Format a number to 1 or 2 decimals with sign
 */
export function formatCoord(val: number): string {
  return (val >= 0 ? '+' : '') + val.toFixed(1);
}

/**
 * Format time in seconds to mm:ss
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
