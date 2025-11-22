import { useState, useRef, useEffect } from "react";
import Lottie from "lottie-react";

interface HoldButtonProps {
  onComplete: () => void;
  holdDuration?: number;
  onProgressChange?: (progress: number) => void;
}

const FILL_ANIMATION_DURATION = 800; // Duración de la animación de llenado

// Animación de círculo pulsante para el botón
const circleAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Circle Pulse",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            {
              i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
              o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
              t: 0,
              s: [100, 100, 100]
            },
            {
              i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
              o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
              t: 30,
              s: [110, 110, 100]
            },
            {
              t: 60,
              s: [100, 100, 100]
            }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [80, 80] },
              p: { a: 0, k: [0, 0] }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.0, 0.53, 0.82, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 4 },
              lc: 2,
              lj: 2
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.0, 0.53, 0.82, 0.3] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

// Animación de círculo expandiéndose para llenar pantalla
const expandingCircleAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 100,
  w: 1000,
  h: 1000,
  nm: "Expanding Circle",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle Fill",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [500, 500, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [1000, 1000] },
              p: { a: 0, k: [0, 0] }
            },
            {
              ty: "gf",
              o: { a: 0, k: 100 },
              r: 1,
              bm: 0,
              g: {
                p: 3,
                k: {
                  a: 0,
                  k: [
                    0, 0.0, 0.53, 0.82,
                    0.5, 0.0, 0.65, 0.88,
                    1, 0.0, 0.73, 0.95
                  ]
                }
              },
              s: { a: 0, k: [-300, 0] },
              e: { a: 0, k: [300, 0] },
              t: 1
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 100,
      st: 0
    }
  ]
};

const HoldButton = ({ onComplete, holdDuration = 1000, onProgressChange }: HoldButtonProps) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);

      // Notify parent of progress change
      if (onProgressChange) {
        onProgressChange(newProgress);
      }

      if (newProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    holdTimerRef.current = setTimeout(() => {
      setIsCompleting(true);
      setTimeout(() => {
        onComplete();
      }, FILL_ANIMATION_DURATION);
    }, holdDuration);
  };

  const resetHold = () => {
    setIsHolding(false);
    setProgress(0);
    if (onProgressChange) {
      onProgressChange(0);
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Calcular el scale basado en el progreso (crece hasta llenar la pantalla)
  const scale = progress > 0 ? progress * 8 : 0; // Multiplicador mayor para llenar toda la pantalla

  // Calcular el strokeDashoffset para el progreso circular
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center gap-6">
      <button
        onMouseDown={startHold}
        onMouseUp={resetHold}
        onMouseLeave={resetHold}
        onTouchStart={startHold}
        onTouchEnd={resetHold}
        className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center cursor-pointer touch-none select-none z-[101]"
        aria-label="Mantén presionado para continuar"
      >
        {/* Animación Lottie de fondo */}
        <div className="absolute inset-0 scale-75">
          <Lottie
            animationData={circleAnimation}
            loop={true}
            autoplay={true}
          />
        </div>
      </button>

      {/* Texto instructivo */}
      <p className="text-white text-sm md:text-base z-[101] font-medium">
        Mantén presionado
      </p>
    </div>
  );
};

export default HoldButton;
