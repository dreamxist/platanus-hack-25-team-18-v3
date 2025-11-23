import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { SwipeCard } from "@/components/molecules/SwipeCard";
import { getUserTopicIds } from "@/services/opinionsService";
import { getCurrentUserId } from "@/services/sessionService";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
  animate,
} from "framer-motion";
import { spring, swipeConfig } from "@/config/animations";
import { Loader2, SkipForward } from "lucide-react";

const SwipePage = () => {
  console.log("SwipePage rendering");

  const navigate = useNavigate();
  const userId = getCurrentUserId();

  console.log("SwipePage - userId from localStorage:", userId);

  const {
    getCurrentIdea,
    shouldShowMatch,
    markMatchShown,
    loadOpinions,
    isLoading,
    error,
    ideas,
    answerIdea,
  } = useAppContext();

  const currentIdea = getCurrentIdea();
  const currentIndex = ideas.findIndex((idea) => idea.id === currentIdea?.id);
  const nextIdea =
    currentIndex >= 0 && currentIndex < ideas.length - 1
      ? ideas[currentIndex + 1]
      : null;
  const [hasInitialized, setHasInitialized] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "down" | null
  >(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isInitializingRef = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Hablando con los candidatos"
  );
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Framer Motion values for smooth dragging
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(
    x,
    [-200, 0, 200],
    [-swipeConfig.rotation, 0, swipeConfig.rotation]
  );
  const opacity = useTransform([x, y], ([latestX, latestY]) => {
    const totalOffset = Math.sqrt(
      (latestX as number) ** 2 + (latestY as number) ** 2
    );
    if (totalOffset > 200) return 0.5;
    if (totalOffset > 100) return 0.8;
    return 1;
  });
  const backgroundColor = useTransform([x, y], ([latestX, latestY]) => {
    // Prioritize vertical movement for skip (gray)
    if (
      Math.abs(latestY as number) > Math.abs(latestX as number) &&
      (latestY as number) > 50
    ) {
      if ((latestY as number) > 200) return "rgba(156, 163, 175, 0.2)"; // gray
      if ((latestY as number) > 50) return "rgba(156, 163, 175, 0.05)";
    }
    // Horizontal movement for like/dislike
    if ((latestX as number) < -200) return "rgba(239, 68, 68, 0.2)"; // red on left
    if ((latestX as number) < -50) return "rgba(239, 68, 68, 0.05)";
    if ((latestX as number) > 200) return "rgba(34, 197, 94, 0.2)"; // green on right
    if ((latestX as number) > 50) return "rgba(34, 197, 94, 0.05)";
    return "rgba(255, 255, 255, 0)";
  });

  // Loading message animation (only when not retrying)
  useEffect(() => {
    if (isRetrying) {
      // Don't change message during retry - it's set in initializeOpinions
      return;
    }

    if (!isLoading) {
      // Reset to first message when not loading
      setLoadingMessage("Hablando con los candidatos");
      return;
    }

    // Start with first message
    setLoadingMessage("Hablando con los candidatos");

    // Switch to second message after 1.5 seconds
    const timer = setTimeout(() => {
      setLoadingMessage("Entendiendo sus perspectivas");
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, isRetrying]);

  // Helper function to wait/delay
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Load opinions when component mounts with retry logic
  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current || hasInitialized) {
      console.log("SwipePage - Already initialized or initializing, skipping");
      return;
    }

    console.log("SwipePage - useEffect triggered");
    isInitializingRef.current = true;

    const initializeOpinions = async (attempt: number = 1) => {
      console.log(`SwipePage - Initialization attempt ${attempt}/3`);
      console.log("SwipePage - userId:", userId);

      if (!userId) {
        console.log("SwipePage - No userId found, redirecting to landing");
        navigate("/");
        return;
      }

      try {
        // Get user's selected topics
        const topicIds = await getUserTopicIds(userId);
        console.log("SwipePage - User topics:", topicIds);

        // Clear any previous errors before loading
        setLocalError(null);

        // Load opinions filtered by those topics (pass userId for Edge Function)
        await loadOpinions(topicIds.length > 0 ? topicIds : undefined, userId);

        // Wait for state to update and check if we got any ideas
        await wait(1000);

        // Check if we have ideas now or if there's an error
        const currentIdeaAfterLoad = getCurrentIdea();
        const hasIdeas = ideas.length > 0 || currentIdeaAfterLoad !== null;
        const hasError = error !== null;
        const isNoQuestionsError =
          error?.includes("No hay más preguntas") ||
          error?.includes("no questions");

        // If we have ideas, success!
        if (hasIdeas) {
          console.log("SwipePage - Opinions loaded successfully");
          setIsRetrying(false);
          setRetryCount(0);
          setHasInitialized(true);
          isInitializingRef.current = false;
          return;
        }

        // If no ideas and we have an error (or no questions), retry if we haven't exceeded max attempts
        if ((hasError || isNoQuestionsError) && attempt < 3) {
          console.log(
            `SwipePage - No questions found, retrying (attempt ${
              attempt + 1
            }/3)...`
          );
          setIsRetrying(true);
          setRetryCount(attempt);
          setLoadingMessage(
            `Reintentando obtener preguntas (${attempt + 1}/3)...`
          );

          // Wait 2 seconds before retrying
          await wait(2000);

          // Retry
          await initializeOpinions(attempt + 1);
          return;
        }

        // If we've exhausted retries
        if (attempt >= 3) {
          console.log("SwipePage - No questions found after 3 attempts");
          setLocalError(
            "No se pudieron cargar preguntas después de varios intentos. Por favor, intente más tarde."
          );
          setHasInitialized(true);
          setIsRetrying(false);
          isInitializingRef.current = false;
          return;
        }

        // Default: mark as initialized
        setHasInitialized(true);
        setIsRetrying(false);
        isInitializingRef.current = false;
      } catch (err) {
        console.error("SwipePage - Error initializing opinions:", err);

        // Retry on error if we haven't exceeded max attempts
        if (attempt < 3) {
          console.log(
            `SwipePage - Error occurred, retrying (attempt ${attempt + 1}/3)...`
          );
          setIsRetrying(true);
          setRetryCount(attempt);
          setLoadingMessage(
            `Error al cargar. Reintentando (${attempt + 1}/3)...`
          );

          // Wait 2 seconds before retrying
          await wait(2000);

          // Retry
          await initializeOpinions(attempt + 1);
        } else {
          setLocalError(
            "Error al cargar las preguntas después de varios intentos. Por favor, intente más tarde."
          );
          setHasInitialized(true);
          setIsRetrying(false);
          isInitializingRef.current = false;
        }
      }
    };

    initializeOpinions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (shouldShowMatch()) {
      markMatchShown();
      // Iniciar animación de transición
      setIsTransitioning(true);
      // Navegar después de la animación
      setTimeout(() => {
        navigate("/match");
      }, 500);
    }
  }, [shouldShowMatch, markMatchShown, navigate]);

  // Monitor for new questions after initialization (for retry scenarios)
  useEffect(() => {
    if (
      hasInitialized &&
      !currentIdea &&
      !isLoading &&
      !isRetrying &&
      retryCount === 0
    ) {
      console.log("SwipePage - No questions available after initialization");
      // Don't navigate, just show error state (handled in render)
    }
  }, [hasInitialized, currentIdea, isLoading, isRetrying, retryCount]);

  // Update swipe direction indicator based on drag position
  useEffect(() => {
    const unsubscribeX = x.on("change", (latestX) => {
      const latestY = y.get();
      if (!isExiting) {
        // Prioritize vertical movement for skip
        if (Math.abs(latestY) > Math.abs(latestX) && latestY > 50) {
          setSwipeDirection("down");
        } else if (Math.abs(latestX) > 50) {
          setSwipeDirection(latestX > 0 ? "right" : "left");
        } else {
          setSwipeDirection(null);
        }
      }
    });

    const unsubscribeY = y.on("change", (latestY) => {
      const latestX = x.get();
      if (!isExiting) {
        // Prioritize vertical movement for skip
        if (Math.abs(latestY) > Math.abs(latestX) && latestY > 50) {
          setSwipeDirection("down");
        } else if (Math.abs(latestX) > 50) {
          setSwipeDirection(latestX > 0 ? "right" : "left");
        } else {
          setSwipeDirection(null);
        }
      }
    });

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [x, y, isExiting]);

  // Reset motion values when card changes
  useEffect(() => {
    if (currentIdea) {
      x.set(0);
      y.set(0);
    }
  }, [currentIdea?.id, x, y]);

  console.log(
    "SwipePage render - isLoading:",
    isLoading,
    "currentIdea:",
    currentIdea,
    "hasInitialized:",
    hasInitialized
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full fixed inset-0 bg-gradient-to-br from-white via-blue-50 to-red-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="text-foreground text-xl">{loadingMessage}</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen w-full fixed inset-0 bg-gradient-to-br from-white via-blue-50 to-red-50 flex items-center justify-center px-4">
        <div className="text-foreground text-center">
          <div className="text-xl mb-4">Error</div>
          <div className="text-sm opacity-80">{error}</div>
        </div>
      </div>
    );
  }

  const completeSwipe = async (direction: "left" | "right" | "down") => {
    if (!currentIdea || isExiting) return;

    setIsExiting(true);

    if (direction === "down") {
      // Animate down for skip
      const exitDistance =
        typeof window !== "undefined" ? window.innerHeight : 800;
      await animate(y, exitDistance, { duration: 0.25, ease: "easeOut" });
      await animate(y, exitDistance, { duration: 0.25, ease: "easeOut" });
      answerIdea(userId, "disagree"); // Skip acts as dislike
    } else {
      // Animate horizontally for like/dislike
      const exitDistance =
        direction === "right"
          ? typeof window !== "undefined"
            ? window.innerWidth
            : 600
          : typeof window !== "undefined"
          ? -window.innerWidth
          : -600;
      await animate(x, exitDistance, { duration: 0.25, ease: "easeOut" });
      answerIdea(userId, direction === "right" ? "agree" : "disagree");
    }

    x.set(0);
    y.set(0);
    setSwipeDirection(null);
    setIsExiting(false);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { offset, velocity } = info;

    // Check if velocity is high enough for a flick
    const isFlickX = Math.abs(velocity.x) > swipeConfig.velocityThreshold;
    const isFlickY = Math.abs(velocity.y) > swipeConfig.velocityThreshold;
    // Check if distance is far enough
    const isSwipeX = Math.abs(offset.x) > swipeConfig.threshold;
    const isSwipeY = Math.abs(offset.y) > swipeConfig.threshold;

    if (!isExiting) {
      // Prioritize vertical swipe for skip
      if (
        (isFlickY || isSwipeY) &&
        offset.y > 0 &&
        Math.abs(offset.y) > Math.abs(offset.x)
      ) {
        completeSwipe("down");
      } else if (isFlickX || isSwipeX) {
        const direction = offset.x > 0 ? "right" : "left";
        completeSwipe(direction);
      } else {
        // Snap back with spring physics
        animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
        animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
        setSwipeDirection(null);
      }
    }
  };

  // Handlers for button interactions
  const handleLike = () => {
    if (!isExiting) {
      completeSwipe("right");
    }
  };

  const handleDislike = () => {
    if (!isExiting) {
      completeSwipe("left");
    }
  };

  const handleSkip = () => {
    if (!isExiting) {
      completeSwipe("down"); // Skip animates down
    }
  };

  // Render conditions AFTER all hooks
  if (!currentIdea) {
    console.log("SwipePage - No current idea, showing message");
    // Si aún no ha inicializado o está reintentando, mostrar estado de carga
    if (!hasInitialized || isRetrying) {
      return (
        <div className="h-screen w-full fixed inset-0 bg-gradient-to-br from-white via-blue-50 to-red-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-foreground text-xl">{loadingMessage}</div>
            {isRetrying && retryCount > 0 && (
              <div className="text-foreground text-sm opacity-70 mt-2">
                Intento {retryCount + 1} de 3
              </div>
            )}
          </div>
        </div>
      );
    }
    // Si ya inicializó pero no hay ideas y no está reintentando, mostrar error
    if (error || localError) {
      const errorMessage = localError || error;
      return (
        <div className="h-screen w-full fixed inset-0 bg-gradient-to-br from-white via-blue-50 to-red-50 flex items-center justify-center px-4">
          <div className="text-foreground text-center max-w-md">
            <div className="text-xl mb-4">No se pudieron cargar preguntas</div>
            <div className="text-sm opacity-80 mb-6">{errorMessage}</div>
            <button
              onClick={() => {
                setHasInitialized(false);
                setRetryCount(0);
                setIsRetrying(false);
                setLocalError(null);
                isInitializingRef.current = false;
                // Trigger re-initialization by updating a dependency
                window.location.reload();
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    // Fallback: show loading state
    return (
      <div className="h-screen w-full fixed inset-0 bg-gradient-to-br from-white via-blue-50 to-red-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="text-foreground text-xl">Cargando preguntas...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-screen w-full fixed inset-0 overflow-hidden bg-gradient-to-br from-white via-blue-50 to-red-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.smooth}
    >
      {/* Dynamic color overlay based on swipe direction */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor }}
      />

      <div
        className={`h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 relative z-10 ${
          isTransitioning ? "animate-slide-up-exit" : ""
        }`}
      >
        <div className="w-full max-w-lg relative">
          {/* Next card in the background - only show when not animating */}
          {nextIdea && !isExiting && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: "scale(0.95)",
                opacity: 0.5,
                zIndex: 0,
              }}
            >
              <SwipeCard
                idea={nextIdea}
                swipeDirection={null}
                showInteractionIcons={false}
              />
            </div>
          )}

          {/* Current card on top */}
          <motion.div
            key={currentIdea.id}
            className="relative cursor-grab active:cursor-grabbing"
            style={{
              x,
              y,
              rotate,
              opacity,
              zIndex: 1,
            }}
            drag={isExiting ? false : true}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: "grabbing" }}
          >
            <SwipeCard
              idea={currentIdea}
              swipeDirection={swipeDirection}
              onLike={handleLike}
              onDislike={handleDislike}
            />
          </motion.div>
        </div>

        {/* Skip button - below the card */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.smooth, delay: 0.3 }}
        >
          <motion.button
            onClick={handleSkip}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-400/30 backdrop-blur-md border border-gray-400/50 text-gray-600 hover:bg-gray-400/40 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isExiting}
          >
            <SkipForward className="w-5 h-5" />
            <span className="font-medium">Skip</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SwipePage;
