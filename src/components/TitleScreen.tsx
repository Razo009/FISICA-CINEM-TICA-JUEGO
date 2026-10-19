import React from 'react';
import { Compass, Ship, BookOpen, Target, Play, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenTutorial: () => void;
  onOpenMissions: () => void;
  gamepadConnected: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenTutorial,
  onOpenMissions,
  gamepadConnected,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 text-white overflow-y-auto">
      {/* Top Bar Branding */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/20 border border-sky-400/40 rounded-xl text-sky-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <span className="font-display font-extrabold text-sm tracking-wider uppercase text-sky-300">
            Laboratorio de Física Interactiva
          </span>
        </div>
        {gamepadConnected && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Control Xbox Detectado
          </div>
        )}
      </div>

      {/* Main Center Monument & Title Lockup */}
      <div className="max-w-2xl text-center space-y-6 my-auto py-8">
        {/* Emblem */}
        <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-400/30 to-blue-600/30 border border-sky-400/40 flex items-center justify-center shadow-2xl shadow-sky-500/20">
          <Ship className="w-12 h-12 text-sky-300" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white leading-tight">
            Navegando la Física
          </h1>
          <p className="text-lg sm:text-xl font-display font-semibold text-sky-400">
            Movimiento en el Mar
          </p>
        </div>

        {/* Subtitle / Description */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
          Aprende y experimenta los conceptos fundamentales de cinemática:{' '}
          <span className="text-white font-semibold">posición</span>,{' '}
          <span className="text-white font-semibold">trayectoria</span>,{' '}
          <span className="text-white font-semibold">distancia recorrida</span>,{' '}
          <span className="text-white font-semibold">desplazamiento</span> y{' '}
          <span className="text-white font-semibold">sistemas de referencia</span> navegando un barco en tiempo real.
        </p>

        {/* Actions Menu */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            data-start="true"
            onClick={onStartGame}
            className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-extrabold text-base rounded-2xl shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Iniciar Exploración</span>
            {gamepadConnected && (
              <span className="px-1.5 py-0.5 rounded bg-slate-950 text-white text-xs font-bold ml-1">A</span>
            )}
          </button>

          <button
            onClick={onOpenMissions}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm rounded-2xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Modo Misiones</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm rounded-2xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Tutorial Interactivo</span>
          </button>
        </div>
      </div>

      {/* Bottom Controls Legend */}
      <div className="w-full max-w-3xl text-center border-t border-slate-800/80 pt-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-mono-numbers">
          <span>W/A/S/D o Flechas: Navegar</span>
          <span>·</span>
          <span>X: Analizar Movimiento</span>
          <span>·</span>
          <span>Y: Cambiar Observador</span>
          <span>·</span>
          <span>Control Xbox Compatible</span>
          <span>·</span>
          <span>Pantallas Táctiles</span>
        </div>
      </div>
    </div>
  );
};
