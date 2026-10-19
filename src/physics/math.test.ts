import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEuclideanDistance,
  calculateTotalDistance,
  calculateDisplacement,
  calculateSegments,
  classifyTrajectory,
  transformPointToObserver,
  formatTime,
} from './math.ts';

test('calculateEuclideanDistance calculates straight line distance correctly', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 3, y: 4 };
  assert.equal(calculateEuclideanDistance(p1, p2), 5);
});

test('calculateTotalDistance accumulates path distance correctly', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 3 },
  ];
  // 2 units + 3 units = 5 units
  assert.equal(calculateTotalDistance(points), 5);
});

test('calculateDisplacement produces magnitude, dx, dy and angle', () => {
  const start = { x: 0, y: 0 };
  const end = { x: 6, y: 8 };
  const disp = calculateDisplacement(start, end);
  assert.equal(disp.magnitude, 10);
  assert.equal(disp.dx, 6);
  assert.equal(disp.dy, 8);
  assert.ok(disp.angleDeg > 50 && disp.angleDeg < 55); // atan2(8,6) is ~53.13 deg
});

test('closed loop movement has distance > 0 but displacement = 0', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
    { x: 0, y: 0 },
  ];
  const distance = calculateTotalDistance(points);
  const disp = calculateDisplacement(points[0], points[points.length - 1]);
  assert.equal(distance, 16);
  assert.equal(disp.magnitude, 0);

  const trajType = classifyTrajectory(points, distance, disp.magnitude);
  assert.equal(trajType, 'Cerrada / Circular');
});

test('straight line motion classifies as Rectilínea', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 5, y: 5 },
    { x: 10, y: 10 },
  ];
  const distance = calculateTotalDistance(points);
  const disp = calculateDisplacement(points[0], points[points.length - 1]);
  const trajType = classifyTrajectory(points, distance, disp.magnitude);
  assert.equal(trajType, 'Rectilínea');
});

test('transformPointToObserver transforms to respective frames', () => {
  const boatPos = { x: 10, y: 5 };
  const otherBoatPos = { x: 15, y: 8 };
  const portPos = { x: 0, y: 0 };

  const targetPoint = { x: 10, y: 5 }; // Player's boat position

  // In port frame, player boat is at (10, 5)
  const portFrame = transformPointToObserver(targetPoint, 'port', boatPos, otherBoatPos, portPos);
  assert.equal(portFrame.x, 10);
  assert.equal(portFrame.y, 5);

  // In boat's own frame, player boat is at (0, 0)!
  const boatFrame = transformPointToObserver(targetPoint, 'boat', boatPos, otherBoatPos, portPos);
  assert.equal(boatFrame.x, 0);
  assert.equal(boatFrame.y, 0);

  // In other boat frame, player boat is at (10-15 = -5, 5-8 = -3)
  const otherFrame = transformPointToObserver(targetPoint, 'other_boat', boatPos, otherBoatPos, portPos);
  assert.equal(otherFrame.x, -5);
  assert.equal(otherFrame.y, -3);
});

test('calculateSegments partitions trajectory correctly', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 5, y: 0 },
    { x: 9, y: 0 },
  ];
  const segments = calculateSegments(points, 3);
  assert.ok(segments.length >= 2);
  const sumSegDistance = segments.reduce((acc, s) => acc + s.distance, 0);
  assert.ok(Math.abs(sumSegDistance - 9) < 0.001);
});

test('formatTime formats seconds to mm:ss correctly', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(155), '02:35');
});
