import { useNavigate, useLocation } from "react-router-dom";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { spring } from "@/config/animations";

// Animación simple de flecha izquierda
const leftArrowAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Left Arrow",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Arrow",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ind: 0,
              ty: "sh",
              ks: {
                a: 1,
                k: [
                  {
                    i: { x: 0.4, y: 1 },
                    o: { x: 0.6, y: 0 },
                    t: 0,
                    s: [
                      {
                        i: [[0, 0], [0, 0], [0, 0]],
                        o: [[0, 0], [0, 0], [0, 0]],
                        v: [[-5, 0], [-20, -15], [-20, 15]],
                        c: true
                      }
                    ]
                  },
                  {
                    t: 30,
                    s: [
                      {
                        i: [[0, 0], [0, 0], [0, 0]],
                        o: [[0, 0], [0, 0], [0, 0]],
                        v: [[0, 0], [-15, -15], [-15, 15]],
                        c: true
                      }
                    ]
                  }
                ]
              }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.5, 0.4, 0.7, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2
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

// Animación simple de flecha derecha
const rightArrowAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Right Arrow",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Arrow",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ind: 0,
              ty: "sh",
              ks: {
                a: 1,
                k: [
                  {
                    i: { x: 0.4, y: 1 },
                    o: { x: 0.6, y: 0 },
                    t: 0,
                    s: [
                      {
                        i: [[0, 0], [0, 0], [0, 0]],
                        o: [[0, 0], [0, 0], [0, 0]],
                        v: [[5, 0], [20, -15], [20, 15]],
                        c: true
                      }
                    ]
                  },
                  {
                    t: 30,
                    s: [
                      {
                        i: [[0, 0], [0, 0], [0, 0]],
                        o: [[0, 0], [0, 0], [0, 0]],
                        v: [[0, 0], [15, -15], [15, 15]],
                        c: true
                      }
                    ]
                  }
                ]
              }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.5, 0.4, 0.7, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2
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

const NavigationHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define el orden de las rutas
  const routes = ["/", "/topics", "/swipe", "/match", "/chat", "/reveal"];
  const currentIndex = routes.indexOf(location.pathname);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < routes.length - 1;

  const handleBack = () => {
    if (canGoBack) {
      navigate(routes[currentIndex - 1]);
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      navigate(routes[currentIndex + 1]);
    }
  };

  // No mostrar navegación en la landing page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 glass-effect-nav"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.smooth}
    >
      <motion.button
        onClick={handleBack}
        disabled={!canGoBack}
        className={`w-12 h-12 flex items-center justify-center ${
          canGoBack ? "opacity-100" : "opacity-30 cursor-not-allowed"
        }`}
        whileHover={canGoBack ? { scale: 1.1, x: -3 } : {}}
        whileTap={canGoBack ? { scale: 0.95 } : {}}
        transition={spring.snappy}
        aria-label="Ir atrás"
      >
        <Lottie
          animationData={leftArrowAnimation}
          loop={true}
          autoplay={true}
          style={{ width: 40, height: 40 }}
        />
      </motion.button>

      <motion.button
        onClick={handleForward}
        disabled={!canGoForward}
        className={`w-12 h-12 flex items-center justify-center ${
          canGoForward ? "opacity-100" : "opacity-30 cursor-not-allowed"
        }`}
        whileHover={canGoForward ? { scale: 1.1, x: 3 } : {}}
        whileTap={canGoForward ? { scale: 0.95 } : {}}
        transition={spring.snappy}
        aria-label="Ir adelante"
      >
        <Lottie
          animationData={rightArrowAnimation}
          loop={true}
          autoplay={true}
          style={{ width: 40, height: 40 }}
        />
      </motion.button>
    </motion.div>
  );
};

export default NavigationHeader;
