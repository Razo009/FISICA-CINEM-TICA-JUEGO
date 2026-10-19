export type ObserverType = 'port' | 'boat' | 'other_boat';

export interface Point2D {
  x: number;
  y: number;
  time?: number; // seconds
}

export interface BoatState {
  x: number; // in km
  y: number; // in km
  vx: number; // velocity km/h
  vy: number;
  speed: number; // km/h
  heading: number; // radians (0 = pointing East/Right, PI/2 = North/Up, etc.)
  rudderAngle: number; // radians
  throttle: number; // -1 to 1
}

export interface OtherBoatState {
  x: number;
  y: number;
  heading: number;
  speed: number;
  pathIndex: number;
}

export interface Landmark {
  id: string;
  name: string;
  x: number; // km
  y: number; // km
  radius: number; // km
  type: 'port' | 'island' | 'lighthouse' | 'buoy';
  color?: string;
  description?: string;
}

export interface Mission {
  id: number;
  title: string;
  concept: string;
  description: string;
  goalType: 'reach_island' | 'travel_distance' | 'target_displacement' | 'closed_loop' | 'observer_quiz';
  targetValue?: number;
  targetTolerance?: number;
  targetLandmarkId?: string;
  quizQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface NavigationReportData {
  initialPosition: Point2D;
  finalPosition: Point2D;
  trajectoryType: string;
  totalDistance: number;
  displacementMagnitude: number;
  displacementVector: { dx: number; dy: number; angleDeg: number };
  observer: ObserverType;
  timeElapsedSeconds: number;
  missionTitle: string;
  learnedConcepts: string[];
}

export interface GamepadState {
  connected: boolean;
  id: string;
  leftStickX: number;
  leftStickY: number;
  rightStickX: number;
  rightStickY: number;
  rt: number;
  lt: number;
  buttonA: boolean;
  buttonB: boolean;
  buttonX: boolean;
  buttonY: boolean;
  buttonLB: boolean;
  buttonRB: boolean;
  buttonStart: boolean;
  buttonBack: boolean;
}
