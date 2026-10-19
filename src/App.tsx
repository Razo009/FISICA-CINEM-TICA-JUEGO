import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BoatState,
  OtherBoatState,
  ObserverType,
  Point2D,
  NavigationReportData,
} from './types/game';
import { MISSIONS, LANDMARKS } from './data/landmarks';
import {
  calculateTotalDistance,
  calculateDisplacement,
  calculateEuclideanDistance,
  classifyTrajectory,
  transformPointToObserver,
} from './physics/math';
import { soundManager, triggerGamepadRumble } from './audio/soundManager';
import { useGamepad } from './hooks/useGamepad';
import { OceanCanvas } from './components/OceanCanvas';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { AnalysisModal } from './components/AnalysisModal';
import { ComparisonViewModal } from './components/ComparisonViewModal';
import { TutorialModal } from './components/TutorialModal';
import { MissionsPanel } from './components/MissionsPanel';
import { NavigationReportModal } from './components/NavigationReportModal';
import { VirtualTouchControls } from './components/VirtualTouchControls';

export default function App() {
  // Query parameters: check autostart
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  // Game state
  const [gameState, setGameState] = useState<'title' | 'playing'>(
    isAutostart ? 'playing' : 'title'
  );

  // Boat states
  const [boatState, setBoatState] = useState<BoatState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    heading: Math.PI / 4, // 45 deg Northeast
    rudderAngle: 0,
    throttle: 0,
  });

  const [otherBoatState, setOtherBoatState] = useState<OtherBoatState>({
    x: 4,
    y: 2,
    heading: 0,
    speed: 14,
    pathIndex: 0,
  });

  const [initialPosition, setInitialPosition] = useState<Point2D>({ x: 0, y: 0 });
  const [trajectory, setTrajectory] = useState<Point2D[]>([{ x: 0, y: 0 }]);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);

  // Reference Observer system: 'port' | 'boat' | 'other_boat'
  const [observer, setObserver] = useState<ObserverType>('port');

  // Visualization toggles
  const [showAllGuides, setShowAllGuides] = useState<boolean>(true);

  // Modals state
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [reportData, setReportData] = useState<NavigationReportData | null>(null);

  // Missions progress
  const [currentMissionId, setCurrentMissionId] = useState<number | null>(1); // starts on Mission 1 by default
  const [completedMissions, setCompletedMissions] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('nav_fisica_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Keyboard state
  const keysRef = useRef<Record<string, boolean>>({});
  const touchInputRef = useRef<{ steer: number; throttle: number }>({ steer: 0, throttle: 0 });

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Audio & Haptic engine update
  useEffect(() => {
    soundManager.updateEngineSound(boatState.speed);
  }, [boatState.speed]);

  // Handle observer toggling
  const cycleObserver = useCallback(
    (direction: 'next' | 'prev' = 'next') => {
      soundManager.playObserverSwitch();
      triggerGamepadRumble(150, 0.4, 0.4);
      setObserver((prev) => {
        const order: ObserverType[] = ['port', 'boat', 'other_boat'];
        const idx = order.indexOf(prev);
        if (direction === 'next') {
          return order[(idx + 1) % order.length];
        } else {
          return order[(idx - 1 + order.length) % order.length];
        }
      });
    },
    []
  );

  // Reset boat position to port (0,0)
  const resetPosition = useCallback(() => {
    soundManager.playClick();
    triggerGamepadRumble(180, 0.3, 0.6);
    setBoatState((prev) => ({
      ...prev,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      heading: Math.PI / 4,
    }));
    setInitialPosition({ x: 0, y: 0 });
    setTrajectory([{ x: 0, y: 0 }]);
    setTotalDistance(0);
    setTimeSeconds(0);
  }, []);

  // Open Analysis modal
  const handleOpenAnalysis = useCallback(() => {
    soundManager.playClick();
    triggerGamepadRumble(150, 0.5, 0.5);
    setIsAnalysisOpen(true);
  }, []);

  // Gamepad integration with edge triggers
  const { gamepadConnected, latestStateRef } = useGamepad({
    onButtonX: () => {
      setIsAnalysisOpen((prev) => !prev);
    },
    onButtonY: () => {
      cycleObserver('next');
    },
    onButtonLB: () => {
      cycleObserver('prev');
    },
    onButtonRB: () => {
      cycleObserver('next');
    },
    onButtonA: () => {
      if (gameState === 'title') {
        soundManager.unlock();
        setGameState('playing');
      } else if (reportData) {
        setReportData(null);
      }
    },
    onButtonB: () => {
      setIsAnalysisOpen(false);
      setIsComparisonOpen(false);
      setIsTutorialOpen(false);
      setIsMissionsOpen(false);
      setReportData(null);
    },
    onButtonStart: () => {
      setGameState((prev) => (prev === 'title' ? 'playing' : 'title'));
    },
    onButtonBack: () => {
      resetPosition();
    },
  });

  // Keyboard listeners for WASD & Arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Start game on Enter or Space while in title
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        soundManager.unlock();
        setGameState('playing');
      }

      // X key: Open physical analysis
      if (e.code === 'KeyX' && gameState === 'playing') {
        setIsAnalysisOpen((prev) => !prev);
      }

      // Y key: Toggle observer
      if (e.code === 'KeyY' && gameState === 'playing') {
        cycleObserver('next');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, cycleObserver]);

  // Mission check logic
  const handleMissionCompleted = useCallback(
    (missionId: number) => {
      soundManager.playSuccessFanfare();
      triggerGamepadRumble(500, 0.8, 0.8);

      const mission = MISSIONS.find((m) => m.id === missionId);
      if (!mission) return;

      if (!completedMissions.includes(missionId)) {
        const nextCompleted = [...completedMissions, missionId];
        setCompletedMissions(nextCompleted);
        try {
          localStorage.setItem('nav_fisica_completed', JSON.stringify(nextCompleted));
        } catch {}
      }

      const disp = calculateDisplacement(initialPosition, boatState);
      const trajT = classifyTrajectory(trajectory, totalDistance, disp.magnitude);

      // Generate visual report
      const rep: NavigationReportData = {
        initialPosition,
        finalPosition: { x: boatState.x, y: boatState.y },
        trajectoryType: trajT,
        totalDistance,
        displacementMagnitude: disp.magnitude,
        displacementVector: disp,
        observer,
        timeElapsedSeconds: timeSeconds,
        missionTitle: mission.title,
        learnedConcepts: [
          'Movimiento',
          'Posición Cartesiana',
          'Trayectoria',
          'Distancia Recorrida (Escalar)',
          'Desplazamiento (Vector)',
          'Sistema de Referencia',
        ],
      };

      setReportData(rep);
    },
    [completedMissions, initialPosition, boatState, trajectory, totalDistance, observer, timeSeconds]
  );

  // Time ticker in playing mode
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Check mission conditions continuously
  useEffect(() => {
    if (gameState !== 'playing' || currentMissionId === null || reportData !== null) return;

    const mission = MISSIONS.find((m) => m.id === currentMissionId);
    if (!mission) return;

    if (mission.goalType === 'reach_island' && mission.targetLandmarkId) {
      const landmark = LANDMARKS.find((l) => l.id === mission.targetLandmarkId);
      if (landmark) {
        const dist = calculateEuclideanDistance(boatState, landmark);
        if (dist <= landmark.radius) {
          handleMissionCompleted(mission.id);
        }
      }
    } else if (mission.goalType === 'travel_distance' && mission.targetValue) {
      if (totalDistance >= mission.targetValue) {
        handleMissionCompleted(mission.id);
      }
    } else if (mission.goalType === 'target_displacement' && mission.targetValue) {
      const disp = calculateDisplacement(initialPosition, boatState);
      if (disp.magnitude >= mission.targetValue) {
        handleMissionCompleted(mission.id);
      }
    } else if (mission.goalType === 'closed_loop' && mission.targetValue) {
      // Must sail at least 6 km, then return to start within 1.2 km
      if (totalDistance >= mission.targetValue) {
        const distToStart = calculateEuclideanDistance(boatState, initialPosition);
        if (distToStart <= (mission.targetTolerance || 1.2)) {
          handleMissionCompleted(mission.id);
        }
      }
    }
  }, [gameState, currentMissionId, boatState, totalDistance, initialPosition, reportData, handleMissionCompleted]);

  // Trajectory update & distance calculation
  const handleAddTrajectoryPoint = useCallback((pt: Point2D) => {
    setTrajectory((prev) => {
      const last = prev[prev.length - 1];
      if (last) {
        const stepDist = calculateEuclideanDistance(last, pt);
        setTotalDistance((d) => d + stepDist);
      }
      return [...prev, pt];
    });
  }, []);

  // Display coordinates transformed by active observer
  const transformedPos = transformPointToObserver(
    boatState,
    observer,
    boatState,
    otherBoatState,
    { x: 0, y: 0 }
  );

  const currentMission = MISSIONS.find((m) => m.id === currentMissionId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Main Ocean Canvas Top-Down World */}
      <OceanCanvas
        boatState={boatState}
        otherBoatState={otherBoatState}
        trajectory={trajectory}
        initialPosition={initialPosition}
        observer={observer}
        showGrid={showAllGuides}
        showTrajectory={showAllGuides}
        showDisplacement={showAllGuides}
        showCoordinates={showAllGuides}
        onUpdateBoat={setBoatState}
        onUpdateOtherBoat={setOtherBoatState}
        onAddTrajectoryPoint={handleAddTrajectoryPoint}
        gamepadRef={latestStateRef}
        keysRef={keysRef}
        touchInputRef={touchInputRef}
      />

      {/* 2. Real-Time HUD */}
      {gameState === 'playing' && (
        <HUD
          position={transformedPos}
          speed={boatState.speed}
          totalDistance={totalDistance}
          timeSeconds={timeSeconds}
          observer={observer}
          showAllGuides={showAllGuides}
          gamepadConnected={gamepadConnected}
          isMuted={isMuted}
          currentMissionTitle={currentMission ? currentMission.title : 'Modo Libre'}
          onOpenAnalysis={handleOpenAnalysis}
          onToggleObserver={() => cycleObserver('next')}
          onOpenComparison={() => setIsComparisonOpen(true)}
          onToggleGuides={() => setShowAllGuides((prev) => !prev)}
          onResetPosition={resetPosition}
          onOpenMissions={() => setIsMissionsOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onToggleMute={() => {
            const muted = soundManager.toggleMute();
            setIsMuted(muted);
          }}
        />
      )}

      {/* 3. Virtual Touch Controls for Mobile/Tablet */}
      {gameState === 'playing' && (
        <VirtualTouchControls touchInputRef={touchInputRef} />
      )}

      {/* 4. Title Screen / Main Menu */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={() => {
            soundManager.unlock();
            setGameState('playing');
          }}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenMissions={() => setIsMissionsOpen(true)}
          gamepadConnected={gamepadConnected}
        />
      )}

      {/* 5. Physical Analysis Modal (4 tabs) */}
      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        trajectory={trajectory}
        initialPosition={initialPosition}
        currentPosition={boatState}
        observer={observer}
      />

      {/* 6. Simultaneous 3-Panel Comparison View */}
      <ComparisonViewModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        boatState={boatState}
        otherBoatState={otherBoatState}
        trajectory={trajectory}
      />

      {/* 7. Interactive Physics Tutorial */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onStartFreeMode={() => {
          setIsTutorialOpen(false);
          setCurrentMissionId(null);
          setGameState('playing');
        }}
      />

      {/* 8. Missions Panel */}
      <MissionsPanel
        isOpen={isMissionsOpen}
        currentMissionId={currentMissionId}
        completedMissionIds={completedMissions}
        onSelectMission={(mId) => {
          setCurrentMissionId(mId);
          resetPosition();
        }}
        onClose={() => setIsMissionsOpen(false)}
        onAnswerQuiz={(isCorrect) => {
          if (isCorrect) {
            handleMissionCompleted(5);
          }
        }}
      />

      {/* 9. Navigation Report Modal (Auto evaluation on mission complete) */}
      <NavigationReportModal
        report={reportData}
        onClose={() => setReportData(null)}
        onNextMission={() => {
          setReportData(null);
          if (currentMissionId && currentMissionId < MISSIONS.length) {
            setCurrentMissionId(currentMissionId + 1);
            resetPosition();
          } else {
            setCurrentMissionId(null); // free mode
          }
        }}
        onRestartMission={() => {
          setReportData(null);
          resetPosition();
        }}
      />
    </div>
  );
}
