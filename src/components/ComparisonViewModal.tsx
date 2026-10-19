import React, { useRef, useEffect } from 'react';
import { BoatState, OtherBoatState, Point2D } from '../types/game';
import { LANDMARKS } from '../data/landmarks';
import { X, Sliders } from 'lucide-react';

interface ComparisonViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatState: BoatState;
  otherBoatState: OtherBoatState;
  trajectory: Point2D[];
}

export const ComparisonViewModal: React.FC<ComparisonViewModalProps> = ({
  isOpen,
  onClose,
  boatState,
  otherBoatState,
  trajectory,
}) => {
  const canvasPortRef = useRef<HTMLCanvasElement | null>(null);
  const canvasBoatRef = useRef<HTMLCanvasElement | null>(null);
  const canvasOtherRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let animId: number;

    const renderPanels = () => {
      const panels = [
        { canvas: canvasPortRef.current, observer: 'port', label: 'Observador A (Puerto)' },
        { canvas: canvasBoatRef.current, observer: 'boat', label: 'Observador B (Barco Propio)' },
        { canvas: canvasOtherRef.current, observer: 'other_boat', label: 'Observador C (Patrullero)' },
      ];

      panels.forEach(({ canvas, observer }) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = (canvas.width = canvas.parentElement?.clientWidth || 300);
        const h = (canvas.height = canvas.parentElement?.clientHeight || 240);

        ctx.clearRect(0, 0, w, h);

        // Ocean background
        ctx.fillStyle = '#07243b';
        ctx.fillRect(0, 0, w, h);

        const pixelsPerKm = Math.min(w, h) / 16;

        const toScreen = (wx: number, wy: number) => {
          let rx = wx;
          let ry = wy;

          if (observer === 'boat') {
            rx = wx - boatState.x;
            ry = wy - boatState.y;
          } else if (observer === 'other_boat') {
            rx = wx - otherBoatState.x;
            ry = wy - otherBoatState.y;
          }

          return {
            x: w / 2 + rx * pixelsPerKm,
            y: h / 2 - ry * pixelsPerKm,
          };
        };

        // Grid lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        for (let gx = -16; gx <= 16; gx += 4) {
          const p1 = toScreen(gx, -16);
          const p2 = toScreen(gx, 16);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        for (let gy = -16; gy <= 16; gy += 4) {
          const p1 = toScreen(-16, gy);
          const p2 = toScreen(16, gy);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Origin axes
        const org = toScreen(0, 0);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, org.y);
        ctx.lineTo(w, org.y);
        ctx.moveTo(org.x, 0);
        ctx.lineTo(org.x, h);
        ctx.stroke();

        // Origin marker
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(org.x, org.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw Landmarks
        LANDMARKS.forEach((lm) => {
          const scr = toScreen(lm.x, lm.y);
          if (lm.type === 'port') {
            ctx.fillStyle = '#0f766e';
            ctx.beginPath();
            ctx.arc(scr.x, scr.y, 8, 0, Math.PI * 2);
            ctx.fill();
          } else if (lm.type === 'island') {
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(scr.x, scr.y, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Draw Trajectory
        if (trajectory.length > 1) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const first = toScreen(trajectory[0].x, trajectory[0].y);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < trajectory.length; i++) {
            const pt = toScreen(trajectory[i].x, trajectory[i].y);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Draw Patrol Boat
        const pScr = toScreen(otherBoatState.x, otherBoatState.y);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(pScr.x, pScr.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw Player Boat
        const bScr = toScreen(boatState.x, boatState.y);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(bScr.x, bScr.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bScr.x, bScr.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(renderPanels);
    };

    animId = requestAnimationFrame(renderPanels);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, boatState, otherBoatState, trajectory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-wide">
                Modo de Comparación Simultánea (3 Paneles)
              </h2>
              <p className="text-xs text-purple-300">
                Observa cómo el mismo movimiento exacto se percibe diferente según el sistema de referencia.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar vista comparativa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Split Panels Grid */}
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          {/* Panel 1: Observador A (Puerto) */}
          <div className="flex flex-col bg-slate-950 rounded-2xl border border-sky-500/30 overflow-hidden shadow">
            <div className="p-3 border-b border-slate-800 bg-sky-950/30">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Observador A: Puerto
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                El puerto permanece fijo en (0,0). El barco navega por el plano.
              </p>
            </div>
            <div className="h-52 md:h-64 relative">
              <canvas ref={canvasPortRef} className="w-full h-full block" />
            </div>
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-xs text-slate-300 font-mono-numbers">
              Posición: X = {boatState.x.toFixed(1)} km · Y = {boatState.y.toFixed(1)} km
            </div>
          </div>

          {/* Panel 2: Observador B (Barco Propio) */}
          <div className="flex flex-col bg-slate-950 rounded-2xl border border-emerald-500/30 overflow-hidden shadow">
            <div className="p-3 border-b border-slate-800 bg-emerald-950/30">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Observador B: Barco Propio
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                El barco permanece siempre en (0,0). El océano e islas parecen moverse alrededor.
              </p>
            </div>
            <div className="h-52 md:h-64 relative">
              <canvas ref={canvasBoatRef} className="w-full h-full block" />
            </div>
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-xs text-emerald-300 font-mono-numbers">
              Posición Propia: X = 0.0 km · Y = 0.0 km
            </div>
          </div>

          {/* Panel 3: Observador C (Otro Barco) */}
          <div className="flex flex-col bg-slate-950 rounded-2xl border border-amber-500/30 overflow-hidden shadow">
            <div className="p-3 border-b border-slate-800 bg-amber-950/30">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Observador C: Patrullero Oceánico
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Coordenadas relativas respecto al segundo barco que navega autónomamente.
              </p>
            </div>
            <div className="h-52 md:h-64 relative">
              <canvas ref={canvasOtherRef} className="w-full h-full block" />
            </div>
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-xs text-amber-300 font-mono-numbers">
              Posición Relativa: X = {(boatState.x - otherBoatState.x).toFixed(1)} km · Y = {(boatState.y - otherBoatState.y).toFixed(1)} km
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <p className="text-xs text-slate-400 italic">
            "El movimiento y la posición no son absolutos: dependen del sistema de referencia elegido."
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Volver a Navegar
          </button>
        </div>
      </div>
    </div>
  );
};
