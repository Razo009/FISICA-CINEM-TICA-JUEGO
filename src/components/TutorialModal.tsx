import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Route,
  Activity,
  MoveRight,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFreeMode: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onStartFreeMode,
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slides = [
    {
      title: '1. ¿Qué es el Movimiento?',
      icon: Activity,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      summary: 'El movimiento es el cambio continuo de posición de un objeto en el transcurso del tiempo respecto a un observador.',
      bulletPoints: [
        'Un barco que avanza por el océano está en movimiento respecto al puerto.',
        'Sin embargo, respecto al capitán que viaja dentro del camarote, ¡el barco no se mueve!',
        'Por eso en física el movimiento SIEMPRE es relativo al sistema de referencia.',
      ],
      diagram: 'boat_motion',
    },
    {
      title: '2. Posición y Coordenadas (X, Y)',
      icon: MapPin,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      summary: 'La posición indica el lugar exacto del barco en el plano mediante coordenadas cartesianas (X, Y) o un vector posición r.',
      bulletPoints: [
        'El Puerto Principal se ubica en el origen (0, 0) km.',
        'Si navegas 12 km al Este (+X) y 8 km al Norte (+Y), tu posición es (12, 8) km.',
        'El vector posición r une el origen de coordenadas con el móvil.',
      ],
      diagram: 'coordinates',
    },
    {
      title: '3. Trayectoria: La Huella del Barco',
      icon: Route,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      summary: 'La trayectoria es la línea continua imaginaria que describe un cuerpo al desplazarse en el espacio.',
      bulletPoints: [
        'En nuestro juego se dibuja como una estela azul detrás del barco.',
        'Puede ser rectilínea (línea recta), curvilínea (curvas y olas) o cerrada (circunvalación).',
        'Representa todo el camino geométrico por donde pasaste.',
      ],
      diagram: 'trajectory',
    },
    {
      title: '4. Distancia Recorrida (Escalar)',
      icon: Compass,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      summary: 'La distancia es la longitud total medida sobre la trayectoria. Es una magnitud escalar y NUNCA disminuye.',
      bulletPoints: [
        'Es lo que marcaría el odómetro de navegación del barco.',
        'Si navegas en zigzag, la distancia suma cada curva y tramo recorrido.',
        'Siempre es mayor o igual a cero (d ≥ 0).',
      ],
      diagram: 'distance',
    },
    {
      title: '5. Desplazamiento (Vector)',
      icon: MoveRight,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      summary: 'El desplazamiento es el vector en línea recta desde la posición inicial (P0) hasta la posición final (Pf).',
      bulletPoints: [
        '¡Diferencia fundamental!: La distancia mide el camino completo; el desplazamiento solo une el inicio con el final.',
        'Si navegas 10 km mar adentro y regresas al puerto: ¡Distancia = 10 km, pero Desplazamiento = 0!',
        'Tiene magnitud, dirección (ángulo) y sentido.',
      ],
      diagram: 'displacement',
    },
    {
      title: '6. Sistemas de Referencia',
      icon: Eye,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      summary: 'El sistema de referencia es el punto de observación elegido para medir las posiciones y velocidades.',
      bulletPoints: [
        'Observador A (Puerto): El puerto es el origen fijo (0,0). Vemos al barco navegar.',
        'Observador B (Dentro del barco): El barco está fijo en (0,0); parece que las islas y el mar se mueven.',
        'Observador C (Patrullero): Coordenadas relativas respecto a otro barco en patrulla.',
      ],
      diagram: 'reference',
    },
  ];

  if (!isOpen) return null;

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${current.bgColor} ${current.borderColor} ${current.color}`}>
              <current.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-wide">
                Tutorial Interactivo de Cinemática
              </h2>
              <span className="text-xs text-slate-400">
                Lección {currentSlide + 1} de {slides.length}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Slide Indicator Bar */}
          <div className="grid grid-cols-6 gap-2">
            {slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide
                    ? 'bg-sky-400 shadow shadow-sky-400/50'
                    : idx < currentSlide
                    ? 'bg-sky-700'
                    : 'bg-slate-800'
                }`}
                aria-label={`Ir a diapositiva ${idx + 1}`}
              />
            ))}
          </div>

          {/* Title & Summary */}
          <div>
            <h3 className="text-xl font-display font-bold text-white mb-2">{current.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-950 border border-slate-800">
              {current.summary}
            </p>
          </div>

          {/* Interactive Illustrated Concept Graphic */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center min-h-[140px]">
            {current.diagram === 'boat_motion' && (
              <div className="flex items-center gap-6 text-sm">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold">
                    P0
                  </div>
                  <span className="text-xs text-slate-400">Puerto (0,0)</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-sky-400 font-mono-numbers mb-1">v = 20 km/h →</span>
                  <div className="w-36 h-1 bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-400 rounded-full relative">
                    <span className="absolute -top-1 right-0 w-3 h-3 rounded-full bg-sky-400"></span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 font-bold">
                    Pf
                  </div>
                  <span className="text-xs text-slate-400">Isla (12, 8)</span>
                </div>
              </div>
            )}

            {current.diagram === 'coordinates' && (
              <div className="font-mono-numbers text-xs text-slate-300 space-y-1 text-center">
                <div className="text-emerald-400 font-bold">r = (Xî + Yĵ)</div>
                <div className="text-slate-400">Eje X: Este (+) / Oeste (-) · Eje Y: Norte (+) / Sur (-)</div>
              </div>
            )}

            {current.diagram === 'trajectory' && (
              <div className="flex flex-col items-center gap-2">
                <svg width="220" height="60" viewBox="0 0 220 60" className="stroke-sky-400 fill-none stroke-2">
                  <path d="M 10 30 Q 60 5 110 30 T 210 30" />
                </svg>
                <span className="text-xs text-sky-300">Trayectoria Curvilínea: Longitud real recorrida</span>
              </div>
            )}

            {current.diagram === 'distance' && (
              <div className="text-center space-y-1">
                <div className="text-amber-400 font-bold font-mono-numbers text-base">
                  d_total = Tramo 1 + Tramo 2 + ... + Tramo N
                </div>
                <div className="text-xs text-slate-400">Magnitud escalar siempre positiva: d ≥ 0</div>
              </div>
            )}

            {current.diagram === 'displacement' && (
              <div className="flex flex-col items-center gap-2">
                <svg width="220" height="60" viewBox="0 0 220 60">
                  {/* Curvy trajectory path */}
                  <path d="M 20 40 Q 60 10 110 35 T 200 20" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" strokeDasharray="3 3" />
                  {/* Direct displacement arrow */}
                  <line x1="20" y1="40" x2="200" y2="20" stroke="#ec4899" strokeWidth="3" />
                  <polygon points="200,20 188,14 191,24" fill="#ec4899" />
                  <circle cx="20" cy="40" r="4" fill="#22c55e" />
                  <circle cx="200" cy="20" r="4" fill="#ef4444" />
                </svg>
                <span className="text-xs text-rose-300 font-mono-numbers">
                  Desplazamiento Δr = Pf - P0 (Vector en línea recta)
                </span>
              </div>
            )}

            {current.diagram === 'reference' && (
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-200">
                  <span className="font-bold block">Puerto</span>
                  Fijo en (0,0)
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
                  <span className="font-bold block">En el Barco</span>
                  Barco en (0,0)
                </div>
                <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200">
                  <span className="font-bold block">Otro Barco</span>
                  Posición relativa
                </div>
              </div>
            )}
          </div>

          {/* Bullet Points */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Conceptos Clave para Navegar:
            </span>
            <ul className="space-y-2 text-sm text-slate-300">
              {current.bulletPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              currentSlide === 0 ? 'text-slate-600 opacity-50 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <button
            onClick={onStartFreeMode}
            className="text-xs text-sky-400 hover:text-sky-300 underline font-semibold cursor-pointer"
          >
            Saltar a Modo Libre
          </button>

          {currentSlide < slides.length - 1 ? (
            <button
              onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition-colors"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>¡Comenzar Juego!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
