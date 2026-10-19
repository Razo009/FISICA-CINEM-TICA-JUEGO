import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface VirtualTouchControlsProps {
  touchInputRef: React.MutableRefObject<{ steer: number; throttle: number }>;
}

export const VirtualTouchControls: React.FC<VirtualTouchControlsProps> = ({ touchInputRef }) => {
  const [activeSteer, setActiveSteer] = useState<number>(0);
  const [activeThrottle, setActiveThrottle] = useState<number>(0);

  const setSteer = (val: number) => {
    setActiveSteer(val);
    touchInputRef.current.steer = val;
  };

  const setThrottle = (val: number) => {
    setActiveThrottle(val);
    touchInputRef.current.throttle = val;
  };

  return (
    <div className="fixed bottom-4 left-3 right-3 pointer-events-none flex items-end justify-between z-30 md:hidden">
      {/* Steering Controls (Left Hand) */}
      <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-none">
        <button
          onPointerDown={() => setSteer(-1)}
          onPointerUp={() => setSteer(0)}
          onPointerLeave={() => setSteer(0)}
          className={`w-13 h-13 rounded-xl flex items-center justify-center border shadow-xl transition-all active:scale-95 touch-none cursor-pointer ${
            activeSteer === -1
              ? 'bg-sky-500 border-sky-400 text-white'
              : 'bg-slate-900 border-slate-700 text-sky-400'
          }`}
          aria-label="Girar a la izquierda"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onPointerDown={() => setSteer(1)}
          onPointerUp={() => setSteer(0)}
          onPointerLeave={() => setSteer(0)}
          className={`w-13 h-13 rounded-xl flex items-center justify-center border shadow-xl transition-all active:scale-95 touch-none cursor-pointer ${
            activeSteer === 1
              ? 'bg-sky-500 border-sky-400 text-white'
              : 'bg-slate-900 border-slate-700 text-sky-400'
          }`}
          aria-label="Girar a la derecha"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Throttle Controls (Right Hand) */}
      <div className="pointer-events-auto flex flex-col items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-none">
        <button
          onPointerDown={() => setThrottle(1)}
          onPointerUp={() => setThrottle(0)}
          onPointerLeave={() => setThrottle(0)}
          className={`w-13 h-13 rounded-xl flex items-center justify-center border shadow-xl transition-all active:scale-95 touch-none cursor-pointer ${
            activeThrottle === 1
              ? 'bg-emerald-500 border-emerald-400 text-white'
              : 'bg-slate-900 border-slate-700 text-emerald-400'
          }`}
          aria-label="Avanzar acelerador"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        <button
          onPointerDown={() => setThrottle(-0.6)}
          onPointerUp={() => setThrottle(0)}
          onPointerLeave={() => setThrottle(0)}
          className={`w-13 h-13 rounded-xl flex items-center justify-center border shadow-xl transition-all active:scale-95 touch-none cursor-pointer ${
            activeThrottle === -0.6
              ? 'bg-rose-500 border-rose-400 text-white'
              : 'bg-slate-900 border-slate-700 text-rose-400'
          }`}
          aria-label="Retroceder o frenar"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
