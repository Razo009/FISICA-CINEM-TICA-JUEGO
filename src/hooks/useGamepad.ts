import { useState, useEffect, useRef } from 'react';
import { GamepadState } from '../types/game';

interface GamepadCallbacks {
  onButtonX?: () => void;
  onButtonY?: () => void;
  onButtonA?: () => void;
  onButtonB?: () => void;
  onButtonLB?: () => void;
  onButtonRB?: () => void;
  onButtonStart?: () => void;
  onButtonBack?: () => void;
}

export function useGamepad(callbacks?: GamepadCallbacks) {
  const [gamepadConnected, setGamepadConnected] = useState<boolean>(false);
  const [gamepadId, setGamepadId] = useState<string>('');

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const prevButtonsRef = useRef<Record<string, boolean>>({});
  const latestStateRef = useRef<GamepadState>({
    connected: false,
    id: '',
    leftStickX: 0,
    leftStickY: 0,
    rightStickX: 0,
    rightStickY: 0,
    rt: 0,
    lt: 0,
    buttonA: false,
    buttonB: false,
    buttonX: false,
    buttonY: false,
    buttonLB: false,
    buttonRB: false,
    buttonStart: false,
    buttonBack: false,
  });

  useEffect(() => {
    const handleConnected = (e: GamepadEvent) => {
      setGamepadConnected(true);
      setGamepadId(e.gamepad.id);
    };

    const handleDisconnected = () => {
      // Check if any other gamepad is still connected
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let anyConnected = false;
      for (const gp of gamepads) {
        if (gp) {
          anyConnected = true;
          setGamepadId(gp.id);
          break;
        }
      }
      setGamepadConnected(anyConnected);
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    let animationFrameId: number;

    const pollGamepad = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        let activeGamepad: Gamepad | null = null;
        for (const gp of gamepads) {
          if (gp && gp.connected) {
            activeGamepad = gp;
            break;
          }
        }

        if (activeGamepad) {
          if (!gamepadConnected) {
            setGamepadConnected(true);
            setGamepadId(activeGamepad.id);
          }

          // Standard Xbox mapping:
          // Buttons:
          // 0: A
          // 1: B
          // 2: X
          // 3: Y
          // 4: LB
          // 5: RB
          // 6: LT (button or axis)
          // 7: RT (button or axis)
          // 8: Back / View
          // 9: Start / Menu
          // Axes:
          // 0: Left Stick X
          // 1: Left Stick Y
          // 2: Right Stick X
          // 3: Right Stick Y

          const deadzone = 0.15;
          const filterDeadzone = (v: number) => (Math.abs(v) > deadzone ? v : 0);

          const btnA = activeGamepad.buttons[0]?.pressed || false;
          const btnB = activeGamepad.buttons[1]?.pressed || false;
          const btnX = activeGamepad.buttons[2]?.pressed || false;
          const btnY = activeGamepad.buttons[3]?.pressed || false;
          const btnLB = activeGamepad.buttons[4]?.pressed || false;
          const btnRB = activeGamepad.buttons[5]?.pressed || false;
          const btnLTVal = activeGamepad.buttons[6]?.value ?? (activeGamepad.buttons[6]?.pressed ? 1 : 0);
          const btnRTVal = activeGamepad.buttons[7]?.value ?? (activeGamepad.buttons[7]?.pressed ? 1 : 0);
          const btnBack = activeGamepad.buttons[8]?.pressed || false;
          const btnStart = activeGamepad.buttons[9]?.pressed || false;

          const prev = prevButtonsRef.current;

          // Edge detection (fire callback on press only)
          if (btnX && !prev.btnX) callbacksRef.current?.onButtonX?.();
          if (btnY && !prev.btnY) callbacksRef.current?.onButtonY?.();
          if (btnA && !prev.btnA) callbacksRef.current?.onButtonA?.();
          if (btnB && !prev.btnB) callbacksRef.current?.onButtonB?.();
          if (btnLB && !prev.btnLB) callbacksRef.current?.onButtonLB?.();
          if (btnRB && !prev.btnRB) callbacksRef.current?.onButtonRB?.();
          if (btnStart && !prev.btnStart) callbacksRef.current?.onButtonStart?.();
          if (btnBack && !prev.btnBack) callbacksRef.current?.onButtonBack?.();

          prevButtonsRef.current = {
            btnA,
            btnB,
            btnX,
            btnY,
            btnLB,
            btnRB,
            btnBack,
            btnStart,
          };

          latestStateRef.current = {
            connected: true,
            id: activeGamepad.id,
            leftStickX: filterDeadzone(activeGamepad.axes[0] || 0),
            leftStickY: filterDeadzone(activeGamepad.axes[1] || 0),
            rightStickX: filterDeadzone(activeGamepad.axes[2] || 0),
            rightStickY: filterDeadzone(activeGamepad.axes[3] || 0),
            lt: btnLTVal,
            rt: btnRTVal,
            buttonA: btnA,
            buttonB: btnB,
            buttonX: btnX,
            buttonY: btnY,
            buttonLB: btnLB,
            buttonRB: btnRB,
            buttonStart: btnStart,
            buttonBack: btnBack,
          };
        } else if (gamepadConnected) {
          setGamepadConnected(false);
          latestStateRef.current.connected = false;
        }
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    animationFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gamepadConnected]);

  return {
    gamepadConnected,
    gamepadId,
    latestStateRef,
  };
}
