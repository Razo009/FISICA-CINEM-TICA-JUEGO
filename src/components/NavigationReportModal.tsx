import React from 'react';
import { NavigationReportData } from '../types/game';
import { Award, CheckCircle2, RotateCcw, ArrowRight, X } from 'lucide-react';
import { formatTime } from '../physics/math';

interface NavigationReportModalProps {
  report: NavigationReportData | null;
  onClose: () => void;
  onNextMission?: () => void;
  onRestartMission?: () => void;
}

export const NavigationReportModal: React.FC<NavigationReportModalProps> = ({
  report,
  onClose,
  onNextMission,
  onRestartMission,
}) => {
  if (!report) return null;

  const observerText =
    report.observer === 'port'
      ? 'Puerto Principal'
      : report.observer === 'boat'
      ? 'Dentro del Barco'
      : 'Patrullero Oceánico';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-sky-950 p-6 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                ¡Misión Completada con Éxito!
              </span>
              <h2 className="text-xl font-display font-extrabold text-white">
                REPORTE DE NAVEGACIÓN
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
            aria-label="Cerrar reporte"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Mission title badge */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-sky-300">
            {report.missionTitle}
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Posición Inicial:</span>
              <span className="font-mono-numbers font-bold text-emerald-400 text-base">
                ({report.initialPosition.x.toFixed(1)}, {report.initialPosition.y.toFixed(1)}) km
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Posición Final:</span>
              <span className="font-mono-numbers font-bold text-rose-400 text-base">
                ({report.finalPosition.x.toFixed(1)}, {report.finalPosition.y.toFixed(1)}) km
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Trayectoria:</span>
              <span className="font-bold text-sky-300 text-base">
                {report.trajectoryType}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Distancia Recorrida:</span>
              <span className="font-mono-numbers font-bold text-amber-300 text-base">
                {report.totalDistance.toFixed(2)} km
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Desplazamiento:</span>
              <span className="font-mono-numbers font-bold text-rose-300 text-base">
                {report.displacementMagnitude.toFixed(2)} km
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Sistema de Referencia:</span>
              <span className="font-bold text-purple-300 text-base">
                {observerText}
              </span>
            </div>
          </div>

          {/* Time Elapsed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span>Tiempo de Misión:</span>
            <span className="font-mono-numbers font-bold text-white text-sm">
              {formatTime(report.timeElapsedSeconds)} min
            </span>
          </div>

          {/* Conceptos Aprendidos */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2.5">
              Conceptos Físicos Dominados:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {report.learnedConcepts.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {onRestartMission && (
            <button
              onClick={onRestartMission}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repetir Misión</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cerrar
            </button>

            {onNextMission && (
              <button
                onClick={onNextMission}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-emerald-500/30"
              >
                <span>Siguiente Misión</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
