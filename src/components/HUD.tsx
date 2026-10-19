import React from 'react';
import { ObserverType, Point2D } from '../types/game';
import { formatTime } from '../physics/math';
import {
  Compass,
  Gauge,
  Navigation2,
  Clock,
  Eye,
  Sliders,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  Target,
  Grid,
} from 'lucide-react';

interface HUDProps {
  position: Point2D;
  speed: number;
  totalDistance: number;
  timeSeconds: number;
  observer: ObserverType;
  showAllGuides: boolean;
  gamepadConnected: boolean;
  isMuted: boolean;
  currentMissionTitle?: string;
  onOpenAnalysis: () => void;
  onToggleObserver: () => void;
  onOpenComparison: () => void;
  onToggleGuides: () => void;
  onResetPosition: () => void;
  onOpenMissions: () => void;
  onOpenTutorial: () => void;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  position,
  speed,
  totalDistance,
  timeSeconds,
  observer,
  showAllGuides,
  gamepadConnected,
  isMuted,
  currentMissionTitle,
  onOpenAnalysis,
  onToggleObserver,
  onOpenComparison,
  onToggleGuides,
  onResetPosition,
  onOpenMissions,
  onOpenTutorial,
  onToggleMute,
}) => {
  const getObserverLabel = () => {
    switch (observer) {
      case 'port':
        return { name: 'Observador A: Puerto', tag: 'Origen en Puerto (0, 0)' };
      case 'boat':
        return { name: 'Observador B: Barco Propio', tag: 'Barco Fijo en (0, 0)' };
      case 'other_boat':
        return { name: 'Observador C: Patrullero Oceánico', tag: 'Posición Relativa' };
    }
  };

  const observerInfo = getObserverLabel();

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-6 z-10">
      {/* Top Bar: Title & Primary Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Project Branding & Current Observer */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-sky-500/30 rounded-xl px-4 py-2 shadow-lg backdrop-blur-none">
            <Compass className="w-5 h-5 text-sky-400 animate-spin-slow" />
            <div>
              <span className="text-xs uppercase tracking-wider text-sky-400 font-bold block leading-tight">
                Navegando la Física
              </span>
              <span className="text-sm font-semibold text-white">
                {observerInfo.name}
              </span>
            </div>
          </div>
          {currentMissionTitle && (
            <div className="flex items-center gap-2 bg-sky-950/80 border border-sky-400/40 rounded-lg px-3 py-1 shadow text-xs text-sky-200">
              <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate max-w-[280px] md:max-w-md font-medium">
                {currentMissionTitle}
              </span>
            </div>
          )}
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {gamepadConnected && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Xbox Conectado
            </div>
          )}

          <button
            onClick={onOpenMissions}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border border-slate-700 shadow transition-colors cursor-pointer"
            aria-label="Abrir panel de misiones"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Misiones</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border border-slate-700 shadow transition-colors cursor-pointer"
            aria-label="Ver tutorial interactivo"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Tutorial</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 shadow transition-colors cursor-pointer"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* Center Left: Real-Time HUD Metrics Board */}
      <div className="self-start mt-2 pointer-events-auto">
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col gap-2.5 min-w-[200px] md:min-w-[240px]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span>Telemetría de Navegación</span>
            <span className="text-sky-400 font-mono-numbers">60 FPS</span>
          </div>

          {/* Posición */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Navigation2 className="w-4 h-4 text-emerald-400" />
              <span>POSICIÓN</span>
            </div>
            <div className="font-mono-numbers text-sm font-bold text-white tracking-wide">
              {showAllGuides ? (
                <>
                  <span className="text-slate-400">X=</span>
                  <span className="text-emerald-400">{position.x.toFixed(1)}</span>{' '}
                  <span className="text-slate-400">Y=</span>
                  <span className="text-emerald-400">{position.y.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 ml-1">km</span>
                </>
              ) : (
                <span className="text-slate-500 italic text-xs">Oculto</span>
              )}
            </div>
          </div>

          {/* Velocidad */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span>VELOCIDAD</span>
            </div>
            <div className="font-mono-numbers text-sm font-bold text-white">
              {showAllGuides ? (
                <>
                  <span className="text-sky-300">{Math.round(speed)}</span>
                  <span className="text-[10px] text-slate-400 ml-1">km/h</span>
                </>
              ) : (
                <span className="text-slate-500 italic text-xs">Oculto</span>
              )}
            </div>
          </div>

          {/* Distancia Recorrida */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>DISTANCIA</span>
            </div>
            <div className="font-mono-numbers text-sm font-bold text-white">
              {showAllGuides ? (
                <>
                  <span className="text-amber-300">{totalDistance.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 ml-1">km</span>
                </>
              ) : (
                <span className="text-slate-500 italic text-xs">Oculto</span>
              )}
            </div>
          </div>

          {/* Tiempo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>TIEMPO</span>
            </div>
            <div className="font-mono-numbers text-sm font-bold text-purple-300">
              {formatTime(timeSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pointer-events-auto mb-22 md:mb-0">
        {/* Left Side: Secondary Tool Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          <button
            onClick={onToggleObserver}
            className="flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-sky-500/40 shadow-lg text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer"
            aria-label="Cambiar observador y sistema de referencia"
          >
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-400" />
            <span className="hidden sm:inline">CAMBIAR OBSERVADOR</span>
            <span className="sm:hidden">OBSERVADOR</span>
            {gamepadConnected ? (
              <span className="px-1.5 py-0.5 rounded bg-yellow-500 text-slate-950 font-bold text-[10px]">Y</span>
            ) : (
              <span className="text-[10px] text-slate-400">(A, B, C)</span>
            )}
          </button>

          <button
            onClick={onOpenComparison}
            className="flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-purple-500/40 shadow-lg text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer"
            aria-label="Abrir vista de comparación simultánea en 3 paneles"
          >
            <Sliders className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
            <span className="hidden sm:inline">VISTA COMPARATIVA (3 PANELES)</span>
            <span className="sm:hidden">3 PANELES</span>
          </button>

          <button
            onClick={onToggleGuides}
            className={`flex items-center gap-1.5 px-2.5 py-2 md:px-3 md:py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer shadow-lg ${
              showAllGuides
                ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            }`}
            aria-label="Mostrar u ocultar valores de movimiento y cuadrícula"
          >
            <Grid className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">{showAllGuides ? 'OCULTAR VALORES' : 'MOSTRAR VALORES'}</span>
          </button>

          <button
            onClick={onResetPosition}
            className="flex items-center gap-1.5 px-2.5 py-2 md:px-3 md:py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-lg"
            aria-label="Reiniciar posición al puerto de origen"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">REINICIAR POSICIÓN</span>
            {gamepadConnected && (
              <span className="px-1 py-0.5 rounded bg-slate-800 border border-slate-600 text-[10px]">Back</span>
            )}
          </button>
        </div>

        {/* Right Side: Big Primary Action "ANALIZAR MOVIMIENTO" */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAnalysis}
            className="flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-display font-bold text-xs md:text-sm tracking-wide rounded-2xl shadow-xl shadow-sky-600/30 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer border border-sky-400/40"
            aria-label="Abrir sistema de análisis físico"
          >
            <Compass className="w-4 h-4 md:w-5 md:h-5 text-sky-100" />
            <span>ANALIZAR MOVIMIENTO</span>
            {gamepadConnected && (
              <span className="px-2 py-0.5 rounded bg-blue-700 text-white font-extrabold text-xs border border-blue-400/60">
                X
              </span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
