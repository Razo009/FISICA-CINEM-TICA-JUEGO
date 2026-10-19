import React, { useRef, useEffect } from 'react';
import { BoatState, OtherBoatState, ObserverType, Point2D, GamepadState } from '../types/game';
import { LANDMARKS, PATROL_BOAT_WAYPOINTS } from '../data/landmarks';
import { calculateEuclideanDistance } from '../physics/math';

interface OceanCanvasProps {
  boatState: BoatState;
  otherBoatState: OtherBoatState;
  trajectory: Point2D[];
  initialPosition: Point2D;
  observer: ObserverType;
  showGrid: boolean;
  showTrajectory: boolean;
  showDisplacement: boolean;
  showCoordinates: boolean;
  onUpdateBoat: (boat: BoatState) => void;
  onUpdateOtherBoat: (boat: OtherBoatState) => void;
  onAddTrajectoryPoint: (pt: Point2D) => void;
  gamepadRef: React.MutableRefObject<GamepadState>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  touchInputRef?: React.MutableRefObject<{ steer: number; throttle: number }>;
}

export const OceanCanvas: React.FC<OceanCanvasProps> = ({
  boatState,
  otherBoatState,
  trajectory,
  initialPosition,
  observer,
  showGrid,
  showTrajectory,
  showDisplacement,
  showCoordinates,
  onUpdateBoat,
  onUpdateOtherBoat,
  onAddTrajectoryPoint,
  gamepadRef,
  keysRef,
  touchInputRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References to keep loop pure without React state delays
  const boatRef = useRef<BoatState>(boatState);
  boatRef.current = boatState;

  const otherBoatRef = useRef<OtherBoatState>(otherBoatState);
  otherBoatRef.current = otherBoatState;

  const trajectoryRef = useRef<Point2D[]>(trajectory);
  trajectoryRef.current = trajectory;

  const initialPosRef = useRef<Point2D>(initialPosition);
  initialPosRef.current = initialPosition;

  const observerRef = useRef<ObserverType>(observer);
  observerRef.current = observer;

  const showGridRef = useRef(showGrid);
  showGridRef.current = showGrid;

  const showTrajectoryRef = useRef(showTrajectory);
  showTrajectoryRef.current = showTrajectory;

  const showDisplacementRef = useRef(showDisplacement);
  showDisplacementRef.current = showDisplacement;

  const showCoordinatesRef = useRef(showCoordinates);
  showCoordinatesRef.current = showCoordinates;

  // Particle pool for boat wakes
  const particlesRef = useRef<Array<{ x: number; y: number; life: number; maxLife: number; size: number }>>([]);
  const cameraOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lighthouseAngleRef = useRef<number>(0);
  const waveTimeRef = useRef<number>(0);

  // Drag pan support
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    let sampleCounter = 0;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const render = (time: number) => {
      const rawDt = (time - lastTime) / 1000;
      lastTime = time;
      const dt = Math.min(rawDt, 0.05);

      waveTimeRef.current += dt;
      lighthouseAngleRef.current = (lighthouseAngleRef.current + dt * 0.8) % (Math.PI * 2);

      // 1. Process Controls & Physics
      const currentBoat = { ...boatRef.current };
      const currentOther = { ...otherBoatRef.current };
      const keys = keysRef.current;
      const gamepad = gamepadRef.current;
      const touch = touchInputRef?.current;

      // Desired steering
      let steerInput = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) steerInput -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) steerInput += 1;
      if (gamepad.connected && Math.abs(gamepad.leftStickX) > 0.15) {
        steerInput = gamepad.leftStickX;
      }
      if (touch && Math.abs(touch.steer) > 0.05) {
        steerInput = touch.steer;
      }

      // Desired throttle
      let throttleInput = 0;
      if (keys['KeyW'] || keys['ArrowUp']) throttleInput += 1;
      if (keys['KeyS'] || keys['ArrowDown']) throttleInput -= 0.6;
      if (gamepad.connected) {
        if (gamepad.rt > 0.1) throttleInput += gamepad.rt;
        if (gamepad.lt > 0.1) throttleInput -= gamepad.lt * 0.6;
        if (Math.abs(gamepad.leftStickY) > 0.15 && throttleInput === 0) {
          throttleInput = -gamepad.leftStickY;
        }
      }
      if (touch && Math.abs(touch.throttle) > 0.05) {
        throttleInput = touch.throttle;
      }

      // Camera right stick pan
      if (gamepad.connected) {
        if (Math.abs(gamepad.rightStickX) > 0.15) {
          cameraOffsetRef.current.x += gamepad.rightStickX * 15;
        }
        if (Math.abs(gamepad.rightStickY) > 0.15) {
          cameraOffsetRef.current.y += gamepad.rightStickY * 15;
        }
      }

      // Boat dynamics: Turn rate, drag, acceleration
      const maxSpeedKmh = 45.0; // km/h (fast exploration boat)
      const acceleration = 24.0; // km/h per second
      const dragFactor = 0.985;
      const turnSpeed = 2.2; // responsive rudder turning
      const simScale = 12.0; // 1 real second = 12 simulation seconds for engaging gameplay

      if (throttleInput > 0) {
        currentBoat.speed = Math.min(maxSpeedKmh, currentBoat.speed + acceleration * throttleInput * dt);
      } else if (throttleInput < 0) {
        currentBoat.speed = Math.max(-12.0, currentBoat.speed + acceleration * throttleInput * dt);
      } else {
        currentBoat.speed *= Math.pow(dragFactor, dt * 60);
        if (Math.abs(currentBoat.speed) < 0.05) currentBoat.speed = 0;
      }

      // Turn response depends on speed (rudder requires water flow)
      const turnEff = Math.max(0.4, Math.min(1.0, Math.abs(currentBoat.speed) / 6.0));
      currentBoat.heading += steerInput * turnSpeed * turnEff * dt * (currentBoat.speed >= 0 ? 1 : -0.7);

      // Velocity in km/h: standard orientation (heading 0 = East +X, heading PI/2 = North +Y)
      currentBoat.vx = currentBoat.speed * Math.cos(currentBoat.heading);
      currentBoat.vy = currentBoat.speed * Math.sin(currentBoat.heading);

      // Distance = speed * time: km = (km/h) * (dt * simScale / 3600)
      const moveDistanceKm = (currentBoat.speed * dt * simScale) / 3600;
      currentBoat.x += moveDistanceKm * Math.cos(currentBoat.heading);
      currentBoat.y += moveDistanceKm * Math.sin(currentBoat.heading);
      currentBoat.throttle = throttleInput;
      currentBoat.rudderAngle = steerInput;

      // 2. Patrol Boat Waypoint Navigation
      const targetWaypoint = PATROL_BOAT_WAYPOINTS[currentOther.pathIndex % PATROL_BOAT_WAYPOINTS.length];
      const distToWp = calculateEuclideanDistance(currentOther, targetWaypoint);
      if (distToWp < 0.6) {
        currentOther.pathIndex = (currentOther.pathIndex + 1) % PATROL_BOAT_WAYPOINTS.length;
      }
      const targetHeading = Math.atan2(targetWaypoint.y - currentOther.y, targetWaypoint.x - currentOther.x);
      // Smooth heading interpolation
      let angleDiff = targetHeading - currentOther.heading;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      currentOther.heading += angleDiff * Math.min(1.0, 1.8 * dt);

      currentOther.speed = 22.0; // steady patrol speed km/h
      const patrolMoveDist = (currentOther.speed * dt * simScale) / 3600;
      currentOther.x += patrolMoveDist * Math.cos(currentOther.heading);
      currentOther.y += patrolMoveDist * Math.sin(currentOther.heading);


      // 3. Emit Boat Wake Particles
      if (Math.abs(currentBoat.speed) > 1.0 && !isHeadless) {
        const sternX = currentBoat.x - 0.22 * Math.cos(currentBoat.heading);
        const sternY = currentBoat.y - 0.22 * Math.sin(currentBoat.heading);
        particlesRef.current.push({
          x: sternX + (Math.random() - 0.5) * 0.08,
          y: sternY + (Math.random() - 0.5) * 0.08,
          life: 1.0,
          maxLife: 1.0 + Math.random() * 0.6,
          size: 0.12 + Math.random() * 0.08,
        });
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map((p) => ({ ...p, life: p.life - dt * 0.6 }))
        .filter((p) => p.life > 0);

      // Periodically sample trajectory
      sampleCounter += dt;
      if (sampleCounter >= 0.2) {
        sampleCounter = 0;
        const lastPt = trajectoryRef.current[trajectoryRef.current.length - 1];
        if (!lastPt || calculateEuclideanDistance(lastPt, currentBoat) > 0.04) {
          onAddTrajectoryPoint({ x: currentBoat.x, y: currentBoat.y });
        }
      }

      // Send state up periodically
      onUpdateBoat(currentBoat);
      onUpdateOtherBoat(currentOther);

      // 4. DRAWING THE OCEAN AND WORLD
      const width = canvas.width;
      const height = canvas.height;
      const pixelsPerKm = Math.min(width, height) / 18; // approx 18 km view height

      ctx.clearRect(0, 0, width, height);

      // Determine Observer Reference Center
      // In 'port' frame: World center (0,0) is at screen center + camera offset
      // In 'boat' frame: Boat is AT (0,0) / Screen Center. World moves around it!
      // In 'other_boat' frame: Patrol boat is AT (0,0) / Screen Center.
      const currentObs = observerRef.current;
      let centerFocusX = 0;
      let centerFocusY = 0;

      if (currentObs === 'port') {
        // Camera can softly track player boat with an offset or stay grounded
        centerFocusX = currentBoat.x * 0.6;
        centerFocusY = currentBoat.y * 0.6;
      } else if (currentObs === 'boat') {
        centerFocusX = currentBoat.x;
        centerFocusY = currentBoat.y;
      } else if (currentObs === 'other_boat') {
        centerFocusX = currentOther.x;
        centerFocusY = currentOther.y;
      }

      const worldToScreen = (wx: number, wy: number) => {
        let relX = wx;
        let relY = wy;

        if (currentObs === 'boat') {
          // Boat is at (0, 0)
          relX = wx - currentBoat.x;
          relY = wy - currentBoat.y;
        } else if (currentObs === 'other_boat') {
          // Other boat is at (0, 0)
          relX = wx - currentOther.x;
          relY = wy - currentOther.y;
        } else {
          // Port is origin (0, 0)
          relX = wx;
          relY = wy;
        }

        // Apply camera center
        const screenOriginX = width / 2 + cameraOffsetRef.current.x - (currentObs === 'port' ? centerFocusX * pixelsPerKm : 0);
        // Flip Y because in Cartesian +Y is UP, but screen +Y is DOWN
        const screenOriginY = height / 2 + cameraOffsetRef.current.y + (currentObs === 'port' ? centerFocusY * pixelsPerKm : 0);

        return {
          x: screenOriginX + relX * pixelsPerKm,
          y: screenOriginY - relY * pixelsPerKm,
        };
      };

      // Draw Ocean Deep Gradient
      const oceanGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      oceanGrad.addColorStop(0, '#0c4a6e'); // deep cyan-slate
      oceanGrad.addColorStop(0.5, '#073250');
      oceanGrad.addColorStop(1, '#02182b');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle animated waves
      if (!isHeadless) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1.5;
        const waveOffset = waveTimeRef.current * 18;
        for (let row = -10; row < height + 60; row += 48) {
          ctx.beginPath();
          for (let col = 0; col < width + 40; col += 40) {
            const waveY = row + Math.sin((col + waveOffset) * 0.02) * 5 + Math.cos((row + waveOffset) * 0.02) * 4;
            if (col === 0) ctx.moveTo(col, waveY);
            else ctx.lineTo(col, waveY);
          }
          ctx.stroke();
        }
      }

      // Draw Cartesian Grid if enabled
      if (showGridRef.current) {
        const gridSpacingKm = 2.0; // Major line every 2 km
        const gridRange = 28;

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1.0;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';

        for (let gx = -gridRange; gx <= gridRange; gx += gridSpacingKm) {
          const topPt = worldToScreen(gx, gridRange);
          const botPt = worldToScreen(gx, -gridRange);

          ctx.beginPath();
          ctx.moveTo(topPt.x, topPt.y);
          ctx.lineTo(botPt.x, botPt.y);
          ctx.stroke();

          // Coordinate label
          if (showCoordinatesRef.current && gx % 4 === 0) {
            const midPt = worldToScreen(gx, 0);
            ctx.fillText(`${gx} km`, midPt.x + 3, midPt.y - 3);
          }
        }

        for (let gy = -gridRange; gy <= gridRange; gy += gridSpacingKm) {
          const leftPt = worldToScreen(-gridRange, gy);
          const rightPt = worldToScreen(gridRange, gy);

          ctx.beginPath();
          ctx.moveTo(leftPt.x, leftPt.y);
          ctx.lineTo(rightPt.x, rightPt.y);
          ctx.stroke();

          if (showCoordinatesRef.current && gy % 4 === 0 && gy !== 0) {
            const midPt = worldToScreen(0, gy);
            ctx.fillText(`${gy} km`, midPt.x + 4, midPt.y - 4);
          }
        }

        // Draw Axes X and Y in bold
        const originScreen = worldToScreen(0, 0);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2.0;

        // X Axis
        const xStart = worldToScreen(-gridRange, 0);
        const xEnd = worldToScreen(gridRange, 0);
        ctx.beginPath();
        ctx.moveTo(xStart.x, xStart.y);
        ctx.lineTo(xEnd.x, xEnd.y);
        ctx.stroke();

        // Y Axis
        const yStart = worldToScreen(0, -gridRange);
        const yEnd = worldToScreen(0, gridRange);
        ctx.beginPath();
        ctx.moveTo(yStart.x, yStart.y);
        ctx.lineTo(yEnd.x, yEnd.y);
        ctx.stroke();

        // Origin label
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.fillText(
          currentObs === 'boat'
            ? 'Origen (0,0) [Barco]'
            : currentObs === 'other_boat'
            ? 'Origen (0,0) [Otro Barco]'
            : 'Origen (0,0) [Puerto]',
          originScreen.x + 8,
          originScreen.y + 16
        );
      }

      // Draw Landmarks (Port, Islands, Lighthouse, Buoys)
      LANDMARKS.forEach((lm) => {
        const scr = worldToScreen(lm.x, lm.y);
        const radiusPx = lm.radius * pixelsPerKm;

        // Clip/Skip if outside viewport with safe margin
        if (scr.x < -100 || scr.x > width + 100 || scr.y < -100 || scr.y > height + 100) return;

        if (lm.type === 'port') {
          // Port docks & pier
          ctx.fillStyle = '#0f766e';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, radiusPx, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(scr.x - radiusPx * 0.8, scr.y - radiusPx * 0.2, radiusPx * 1.6, radiusPx * 0.4);

          // Crane / harbor structure
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(scr.x - 4, scr.y - radiusPx * 0.6, 8, radiusPx * 0.6);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(scr.x - 14, scr.y - radiusPx * 0.7, 28, 4);

          // Harbor buoy / light
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y - radiusPx * 0.7, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (lm.type === 'island') {
          // Sandy beach
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, radiusPx, 0, Math.PI * 2);
          ctx.fill();

          // Lush green vegetation
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(scr.x - radiusPx * 0.1, scr.y - radiusPx * 0.1, radiusPx * 0.75, 0, Math.PI * 2);
          ctx.fill();

          // Palm tree accents
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(scr.x + radiusPx * 0.2, scr.y + radiusPx * 0.2, radiusPx * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (lm.type === 'lighthouse') {
          // Lighthouse rock base
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, radiusPx, 0, Math.PI * 2);
          ctx.fill();

          // Lighthouse tower
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, radiusPx * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, radiusPx * 0.3, 0, Math.PI * 2);
          ctx.fill();

          // Rotating light beam
          if (!isHeadless) {
            const angle = lighthouseAngleRef.current;
            const beamLength = 220;
            const beamSpread = 0.35;

            ctx.save();
            ctx.translate(scr.x, scr.y);
            ctx.rotate(angle);

            const beamGrad = ctx.createRadialGradient(0, 0, 5, beamLength * 0.7, 0, beamLength);
            beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
            beamGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.35)');
            beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, beamLength, -beamSpread, beamSpread);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        } else if (lm.type === 'buoy') {
          // Navigational Buoy
          const buoyColor = lm.color || '#22c55e';
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = buoyColor;
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, 5, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing light
          const pulse = (Math.sin(waveTimeRef.current * 4) + 1) / 2;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.6})`;
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Landmark name tag
        ctx.font = '600 12px "Outfit", sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(lm.name, scr.x, scr.y + radiusPx + 14);

        if (showCoordinatesRef.current) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
          ctx.fillText(`(${lm.x.toFixed(1)}, ${lm.y.toFixed(1)}) km`, scr.x, scr.y + radiusPx + 26);
        }
        ctx.textAlign = 'left';
      });

      // Draw Trajectory Trail if enabled
      if (showTrajectoryRef.current && trajectoryRef.current.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        const startPt = worldToScreen(trajectoryRef.current[0].x, trajectoryRef.current[0].y);
        ctx.moveTo(startPt.x, startPt.y);

        for (let i = 1; i < trajectoryRef.current.length; i++) {
          const pt = worldToScreen(trajectoryRef.current[i].x, trajectoryRef.current[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Initial Point Marker (Green circle)
      const p0Scr = worldToScreen(initialPosRef.current.x, initialPosRef.current.y);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(p0Scr.x, p0Scr.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Displacement Vector Arrow if enabled
      if (showDisplacementRef.current) {
        const boatScr = worldToScreen(currentBoat.x, currentBoat.y);
        const dx = boatScr.x - p0Scr.x;
        const dy = boatScr.y - p0Scr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 8) {
          ctx.save();
          ctx.strokeStyle = '#ec4899'; // Vibrant magenta for displacement
          ctx.lineWidth = 3.5;
          ctx.setLineDash([8, 4]);

          ctx.beginPath();
          ctx.moveTo(p0Scr.x, p0Scr.y);
          ctx.lineTo(boatScr.x, boatScr.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Arrowhead
          const headAngle = Math.atan2(dy, dx);
          const headLen = 14;
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.moveTo(boatScr.x, boatScr.y);
          ctx.lineTo(
            boatScr.x - headLen * Math.cos(headAngle - Math.PI / 6),
            boatScr.y - headLen * Math.sin(headAngle - Math.PI / 6)
          );
          ctx.lineTo(
            boatScr.x - headLen * Math.cos(headAngle + Math.PI / 6),
            boatScr.y - headLen * Math.sin(headAngle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          // Displacement label
          const midX = (p0Scr.x + boatScr.x) / 2;
          const midY = (p0Scr.y + boatScr.y) / 2;
          const dispKm = calculateEuclideanDistance(initialPosRef.current, currentBoat);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.fillText(`Δr = ${dispKm.toFixed(2)} km`, midX + 8, midY - 8);
          ctx.restore();
        }
      }

      // Draw Wake Particles
      particlesRef.current.forEach((p) => {
        const pScr = worldToScreen(p.x, p.y);
        const alpha = Math.max(0, (p.life / p.maxLife) * 0.45);
        ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pScr.x, pScr.y, p.size * pixelsPerKm, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Autonomous Patrol Boat ("Patrullero Oceánico")
      const patrolScr = worldToScreen(currentOther.x, currentOther.y);
      ctx.save();
      ctx.translate(patrolScr.x, patrolScr.y);
      // Invert heading angle because canvas Y is down
      ctx.rotate(-currentOther.heading);

      // Patrol boat hull (Grey navy patrol vessel)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(18, 0); // bow
      ctx.lineTo(-14, -8); // stern port
      ctx.lineTo(-14, 8); // stern stbd
      ctx.closePath();
      ctx.fill();

      // Cabin
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-6, -4, 10, 8);
      // Blue patrol stripe
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, -6, 4, 12);
      ctx.restore();

      // Patrol boat label
      ctx.font = '600 11px "Outfit", sans-serif';
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('Patrullero Oceánico (Barco B)', patrolScr.x - 65, patrolScr.y - 18);

      // Draw Player Boat ("Explorador")
      const playerScr = worldToScreen(currentBoat.x, currentBoat.y);
      ctx.save();
      ctx.translate(playerScr.x, playerScr.y);
      ctx.rotate(-currentBoat.heading);

      // Boat Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(3, 4, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hull (Bright white/navy expedition vessel)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(22, 0); // Bow tip
      ctx.bezierCurveTo(15, -11, -12, -10, -18, -8); // Port side
      ctx.lineTo(-18, 8); // Transom stern
      ctx.bezierCurveTo(-12, 10, 15, 11, 22, 0); // Starboard side
      ctx.closePath();
      ctx.fill();

      // Inner teak wooden deck
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.bezierCurveTo(10, -7, -10, -6, -14, -5);
      ctx.lineTo(-14, 5);
      ctx.bezierCurveTo(-10, 6, 10, 7, 16, 0);
      ctx.closePath();
      ctx.fill();

      // White Pilot Cabin
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-8, -5, 12, 10);
      // Windshield (cyan tinted glass)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, -4, 3, 8);

      // Compass Bow Direction Arrow
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(18, -4);
      ctx.lineTo(18, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Player boat label
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Mi Barco Explorador (A)', playerScr.x - 55, playerScr.y - 22);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [onUpdateBoat, onUpdateOtherBoat, onAddTrajectoryPoint, gamepadRef, keysRef, touchInputRef]);

  // Pointer drag events for free panning
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    cameraOffsetRef.current.x += dx;
    cameraOffsetRef.current.y += dy;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="fixed inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none block"
      data-testid="ocean-canvas"
    />
  );
};
