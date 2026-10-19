import React, { useState } from 'react';
import { MISSIONS } from '../data/landmarks';
import { Mission } from '../types/game';
import { Target, CheckCircle, Compass, X, Play, HelpCircle } from 'lucide-react';

interface MissionsPanelProps {
  isOpen: boolean;
  currentMissionId: number | null; // null = Free Mode
  completedMissionIds: number[];
  onSelectMission: (missionId: number | null) => void;
  onClose: () => void;
  onAnswerQuiz?: (isCorrect: boolean) => void;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({
  isOpen,
  currentMissionId,
  completedMissionIds,
  onSelectMission,
  onClose,
  onAnswerQuiz,
}) => {
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentMission = MISSIONS.find((m) => m.id === currentMissionId);

  const handleQuizSubmit = (m: Mission) => {
    if (selectedQuizOption === null || !m.quizQuestion) return;
    setQuizSubmitted(true);
    const isCorrect = selectedQuizOption === m.quizQuestion.correctIndex;
    if (onAnswerQuiz) {
      onAnswerQuiz(isCorrect);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-wide">
                Misiones Educativas de Física
              </h2>
              <span className="text-xs text-slate-400">
                Aprende cinemática mediante la experimentación marítima directa
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar panel de misiones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Free Mode card */}
          <div
            onClick={() => {
              onSelectMission(null);
              onClose();
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              currentMissionId === null
                ? 'bg-sky-950/60 border-sky-500 shadow-md shadow-sky-500/20'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Modo Libre (Navegación Sin Límites)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Explora el océano a tu propio ritmo mientras se registran todos los datos cinemáticos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentMissionId === null && (
                <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-bold border border-sky-500/40">
                  Activo
                </span>
              )}
            </div>
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
            Misiones Guiadas:
          </div>

          {/* Missions List */}
          {MISSIONS.map((m) => {
            const isCompleted = completedMissionIds.includes(m.id);
            const isSelected = currentMissionId === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500 shadow'
                    : isCompleted
                    ? 'bg-slate-950/90 border-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-400 font-display">
                        {m.title}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completada
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-amber-300 block">
                      Concepto: {m.concept}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {m.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectMission(m.id);
                      setSelectedQuizOption(null);
                      setQuizSubmitted(false);
                      if (m.goalType !== 'observer_quiz') {
                        onClose();
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow shadow-sky-500/30'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Reanudar' : 'Iniciar'}</span>
                  </button>
                </div>

                {/* If Mission 5 is active, render interactive quiz directly */}
                {isSelected && m.quizQuestion && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-start gap-2 text-xs text-purple-200 font-medium">
                      <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{m.quizQuestion.question}</span>
                    </div>

                    <div className="space-y-2">
                      {m.quizQuestion.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => {
                            if (!quizSubmitted) setSelectedQuizOption(optIdx);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                            selectedQuizOption === optIdx
                              ? 'bg-purple-950 border-purple-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                          } ${
                            quizSubmitted && optIdx === m.quizQuestion?.correctIndex
                              ? '!bg-emerald-950 !border-emerald-500 !text-emerald-100 font-bold'
                              : ''
                          }`}
                        >
                          <span className="font-bold mr-2 text-purple-400">
                            {String.fromCharCode(65 + optIdx)})
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>

                    {!quizSubmitted ? (
                      <button
                        onClick={() => handleQuizSubmit(m)}
                        disabled={selectedQuizOption === null}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          selectedQuizOption !== null
                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Enviar Respuesta
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                        {selectedQuizOption === m.quizQuestion.correctIndex ? (
                          <div className="text-emerald-400 font-bold mb-1">
                            ¡Correcto! Has comprendido la relatividad del sistema de referencia.
                          </div>
                        ) : (
                          <div className="text-rose-400 font-bold mb-1">
                            Respuesta incorrecta. Revisa la explicación:
                          </div>
                        )}
                        <p>{m.quizQuestion.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
