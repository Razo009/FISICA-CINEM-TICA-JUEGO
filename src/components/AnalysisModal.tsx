import React, { useState, useEffect, useRef } from 'react';
import { Point2D, ObserverType } from '../types/game';
import {
  calculateEuclideanDistance,
  calculateTotalDistance,
  calculateDisplacement,
  calculateSegments,
  classifyTrajectory,
} from '../physics/math';
import { X, Play, Pause, RotateCcw, MapPin, Compass, MoveRight, HelpCircle, Activity } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  trajectory: Point2D[];
  initialPosition: Point2D;
  currentPosition: Point2D;
  observer: ObserverType;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  trajectory,
  initialPosition,
  currentPosition,
  observer,
}) => {
  const [activeTab, setActiveTab] = useState<'position' | 'trajectory' | 'distance' | 'displacement'>('position');

  // Progressive trajectory playback state
  const [playbackProgress, setPlaybackProgress] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalDist = calculateTotalDistance(trajectory);
  const displacement = calculateDisplacement(initialPosition, currentPosition);
  const segments = calculateSegments(trajectory, 4);
  const trajType = classifyTrajectory(trajectory, totalDist, displacement.magnitude);

  // Playback timer for Tab 2
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackProgress((prev) => {
        if (prev >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return Math.min(1.0, prev + 0.02);
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Redraw mini preview canvas inside the modal according to active tab
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 480);
    const height = (canvas.height = 300);

    ctx.clearRect(0, 0, width, height);

    // Calculate bounds of points for auto-scaling
    const allPts = trajectory.length > 0 ? trajectory : [initialPosition, currentPosition];
    let minX = Math.min(...allPts.map((p) => p.x), -2);
    let maxX = Math.max(...allPts.map((p) => p.x), 2);
    let minY = Math.min(...allPts.map((p) => p.y), -2);
    let maxY = Math.max(...allPts.map((p) => p.y), 2);

    const spanX = Math.max(6, maxX - minX + 4);
    const spanY = Math.max(6, maxY - minY + 4);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const scale = Math.min(width / spanX, height / spanY) * 0.85;

    const toScreen = (x: number, y: number) => ({
      x: width / 2 + (x - centerX) * scale,
      y: height / 2 - (y - centerY) * scale,
    });

    // Dark water background
    ctx.fillStyle = '#07243b';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let gx = Math.floor(minX - 5); gx <= Math.ceil(maxX + 5); gx += 2) {
      const p1 = toScreen(gx, minY - 5);
      const p2 = toScreen(gx, maxY + 5);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let gy = Math.floor(minY - 5); gy <= Math.ceil(maxY + 5); gy += 2) {
      const p1 = toScreen(minX - 5, gy);
      const p2 = toScreen(maxX + 5, gy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Origin (0,0) axes
    const originScr = toScreen(0, 0);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originScr.y);
    ctx.lineTo(width, originScr.y);
    ctx.moveTo(originScr.x, 0);
    ctx.lineTo(originScr.x, height);
    ctx.stroke();

    // TAB 1: POSICIÓN
    if (activeTab === 'position') {
      // Draw position vector from origin to current position
      const currScr = toScreen(currentPosition.x, currentPosition.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(originScr.x, originScr.y);
      ctx.lineTo(currScr.x, currScr.y);
      ctx.stroke();

      // Green point = Start
      const p0 = toScreen(initialPosition.x, initialPosition.y);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.fillText(`Inicio (${initialPosition.x.toFixed(1)}, ${initialPosition.y.toFixed(1)})`, p0.x + 10, p0.y - 6);

      // Red point = Final / Current
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(currScr.x, currScr.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillText(`Posición Actual (${currentPosition.x.toFixed(1)}, ${currentPosition.y.toFixed(1)})`, currScr.x + 10, currScr.y + 14);
    }

    // TAB 2: TRAYECTORIA
    else if (activeTab === 'trajectory') {
      if (trajectory.length > 1) {
        const pointsCount = Math.max(2, Math.floor(trajectory.length * playbackProgress));
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const first = toScreen(trajectory[0].x, trajectory[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < pointsCount; i++) {
          const pt = toScreen(trajectory[i].x, trajectory[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Animated head marker
        const headPt = toScreen(trajectory[pointsCount - 1].x, trajectory[pointsCount - 1].y);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // TAB 3: DISTANCIA RECORRIDA
    else if (activeTab === 'distance') {
      // Highlight each segment in distinct bright contrasting colors
      const segColors = ['#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#f43f5e'];
      if (segments.length > 0) {
        segments.forEach((seg, sIdx) => {
          const c = segColors[sIdx % segColors.length];
          ctx.strokeStyle = c;
          ctx.lineWidth = 4;
          const pStart = toScreen(seg.startPoint.x, seg.startPoint.y);
          const pEnd = toScreen(seg.endPoint.x, seg.endPoint.y);
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();

          // Segment tag
          const midX = (pStart.x + pEnd.x) / 2;
          const midY = (pStart.y + pEnd.y) / 2;
          ctx.fillStyle = c;
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillText(`T${seg.index}: ${seg.distance.toFixed(1)}k`, midX + 4, midY - 4);
        });
      } else if (trajectory.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const first = toScreen(trajectory[0].x, trajectory[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < trajectory.length; i++) {
          const pt = toScreen(trajectory[i].x, trajectory[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
    }

    // TAB 4: DESPLAZAMIENTO
    else if (activeTab === 'displacement') {
      // Trajectory is hidden / faded as requested in prompt!
      if (trajectory.length > 1) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const first = toScreen(trajectory[0].x, trajectory[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < trajectory.length; i++) {
          const pt = toScreen(trajectory[i].x, trajectory[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Straight vector arrow from initial to current position
      const p0 = toScreen(initialPosition.x, initialPosition.y);
      const pf = toScreen(currentPosition.x, currentPosition.y);

      ctx.strokeStyle = '#ec4899'; // Vibrant pink displacement
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(pf.x, pf.y);
      ctx.stroke();

      // Arrowhead
      const dx = pf.x - p0.x;
      const dy = pf.y - p0.y;
      const arrowAngle = Math.atan2(dy, dx);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(pf.x, pf.y);
      ctx.lineTo(pf.x - 14 * Math.cos(arrowAngle - Math.PI / 6), pf.y - 14 * Math.sin(arrowAngle - Math.PI / 6));
      ctx.lineTo(pf.x - 14 * Math.cos(arrowAngle + Math.PI / 6), pf.y - 14 * Math.sin(arrowAngle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Start & End dots
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pf.x, pf.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Displacement text
      const midX = (p0.x + pf.x) / 2;
      const midY = (p0.y + pf.y) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`Δr = ${displacement.magnitude.toFixed(2)} km`, midX + 8, midY - 8);
    }
  }, [isOpen, activeTab, trajectory, initialPosition, currentPosition, playbackProgress, segments, displacement]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-none">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-wide">
                Análisis de Cinemática Naval
              </h2>
              <span className="text-xs text-sky-400 font-medium">
                Sistema de referencia: {observer === 'port' ? 'Puerto (0,0)' : observer === 'boat' ? 'Barco Propio' : 'Patrullero Oceánico'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar modal de análisis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Animated Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 p-2 bg-slate-950/40 border-b border-slate-800 gap-1.5">
          <button
            onClick={() => setActiveTab('position')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'position'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>1. Posición</span>
          </button>

          <button
            onClick={() => setActiveTab('trajectory')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'trajectory'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Trayectoria</span>
          </button>

          <button
            onClick={() => setActiveTab('distance')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'distance'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Distancia</span>
          </button>

          <button
            onClick={() => setActiveTab('displacement')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'displacement'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MoveRight className="w-3.5 h-3.5" />
            <span>4. Desplazamiento</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Visual Canvas Diagram */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 flex items-center justify-center min-h-[220px]">
            <canvas ref={canvasRef} className="w-full h-[220px] block" />
            {activeTab === 'trajectory' && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-xl">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition-colors cursor-pointer"
                  aria-label={isPlaying ? 'Pausar animación' : 'Reproducir animación'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={playbackProgress}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setPlaybackProgress(parseFloat(e.target.value));
                  }}
                  className="flex-1 accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  aria-label="Progreso de la trayectoria"
                />
                <button
                  onClick={() => {
                    setPlaybackProgress(0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Reiniciar reproducción"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Educational Detail Cards per Tab */}
          {activeTab === 'position' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/20 text-sky-100 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  "La posición indica dónde se encuentra un objeto respecto a un sistema de referencia."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Posición Inicial (P0)
                  </div>
                  <div className="font-mono-numbers text-lg font-bold text-white">
                    ({initialPosition.x.toFixed(1)}, {initialPosition.y.toFixed(1)}) km
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    Posición Final (Pf)
                  </div>
                  <div className="font-mono-numbers text-lg font-bold text-white">
                    ({currentPosition.x.toFixed(1)}, {currentPosition.y.toFixed(1)}) km
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-semibold text-sky-400 mb-1">Vector Posición (r)</div>
                  <div className="font-mono-numbers text-lg font-bold text-sky-300">
                    r = ({currentPosition.x.toFixed(1)}î + {currentPosition.y.toFixed(1)}ĵ) km
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trajectory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/20 text-sky-100 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  "La trayectoria es el camino geométrico seguido por un objeto durante su movimiento.
                  Puede ser rectilínea, curvilínea o circular."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Tipo de Trayectoria</span>
                  <span className="text-base font-bold text-sky-300">{trajType}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Puntos Muestreados</span>
                  <span className="font-mono-numbers text-base font-bold text-white">
                    {trajectory.length} coordenadas registradas
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'distance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-amber-100 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  "La distancia recorrida es una magnitud escalar (siempre positiva o cero) que mide la longitud total de la trayectoria recorrida por el móvil."
                </p>
              </div>

              {/* Tramos breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Desglose por Tramos
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {segments.map((seg) => (
                    <div key={seg.index} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">{seg.name}</span>
                      <span className="font-mono-numbers text-sm font-bold text-amber-300">
                        {seg.distance.toFixed(2)} km
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">DISTANCIA TOTAL</span>
                  <span className="font-mono-numbers text-xl font-black text-amber-400">
                    {totalDist.toFixed(2)} km
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'displacement' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/20 text-rose-100 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  "El desplazamiento es una magnitud vectorial que une en línea recta la posición inicial y final. A diferencia de la distancia, solo depende de los extremos y no del camino recorrido."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Magnitud del Desplazamiento (|Δr|)</span>
                  <span className="font-mono-numbers text-2xl font-black text-rose-400">
                    {displacement.magnitude.toFixed(2)} km
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Componentes Cartesianas</span>
                  <span className="font-mono-numbers text-sm font-bold text-white">
                    Δx = {displacement.dx.toFixed(2)} km · Δy = {displacement.dy.toFixed(2)} km
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    Dirección: {displacement.angleDeg.toFixed(1)}°
                  </span>
                </div>
              </div>

              {/* Crucial Educational Comparison: Distancia vs Desplazamiento */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Comparativa Clave:</span>
                  <span className="text-sm text-slate-200">
                    Distancia recorrida: <strong className="text-amber-400 font-mono-numbers">{totalDist.toFixed(2)} km</strong> vs. Desplazamiento: <strong className="text-rose-400 font-mono-numbers">{displacement.magnitude.toFixed(2)} km</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Continuar Navegando
          </button>
        </div>
      </div>
    </div>
  );
};
