import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { SwipeCard } from "@/components/molecules/SwipeCard";
import { getUserTopicIds } from "@/services/opinionsService";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
  animate,
} from "framer-motion";
import { spring, swipeConfig } from "@/config/animations";

const SwipePage = () => {
  console.log("SwipePage component mounted");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  console.log("SwipePage - userId from URL:", userId);
  console.log("SwipePage - searchParams:", searchParams.toString());

  const {
    getCurrentIdea,
    answerIdea,
    shouldShowMatch,
    markMatchShown,
    loadOpinions,
    isLoading,
    error,
    userId: contextUserId,
    ideas,
  } = useAppContext();

  const currentIdea = getCurrentIdea();
  const currentIndex = ideas.findIndex((idea) => idea.id === currentIdea?.id);
  const nextIdea =
    currentIndex >= 0 && currentIndex < ideas.length - 1
      ? ideas[currentIndex + 1]
      : null;
  const [hasInitialized, setHasInitialized] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isInitializingRef = useRef(false);

  // Framer Motion values for smooth dragging
  const x = useMotionValue(0);
  const rotate = useTransform(
    x,
    [-200, 0, 200],
    [-swipeConfig.rotation, 0, swipeConfig.rotation]
  );
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5]
  );
  const backgroundColor = useTransform(
    x,
    [-200, -50, 0, 50, 200],
    [
      "rgba(239, 68, 68, 0.2)", // red on left
      "rgba(239, 68, 68, 0.05)",
      "rgba(255, 255, 255, 0)",
      "rgba(34, 197, 94, 0.05)",
      "rgba(34, 197, 94, 0.2)", // green on right
    ]
  );

  console.log("SwipePage - contextUserId:", contextUserId);

  // Load opinions when component mounts
  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current || hasInitialized) {
      console.log("SwipePage - Already initialized or initializing, skipping");
      return;
    }

    console.log("SwipePage - useEffect triggered");
    isInitializingRef.current = true;

    const initializeOpinions = async () => {
      // Use userId from URL if available, otherwise use context userId
      const effectiveUserId = userId || contextUserId;

      console.log("SwipePage - effectiveUserId:", effectiveUserId);

      if (!effectiveUserId) {
        console.log("SwipePage - No userId found, skipping initialization");
        setHasInitialized(true);
        isInitializingRef.current = false;
        return;
      }

      try {
        // Get user's selected topics
        const topicIds = await getUserTopicIds(effectiveUserId);
        console.log("SwipePage - User topics:", topicIds);

        // Load opinions filtered by those topics (pass userId for Edge Function)
        await loadOpinions(
          topicIds.length > 0 ? topicIds : undefined,
          effectiveUserId
        );
        console.log("SwipePage - Opinions loaded successfully");
      } catch (err) {
        console.error("SwipePage - Error initializing opinions:", err);
      } finally {
        setHasInitialized(true);
        isInitializingRef.current = false;
      }
    };

    initializeOpinions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, contextUserId]);

  useEffect(() => {
    if (shouldShowMatch()) {
      markMatchShown();
      // Iniciar animación de transición
      setIsTransitioning(true);
      // Navegar después de la animación
      setTimeout(() => {
        navigate(`/match?userId=${userId}`);
      }, 500);
    }
  }, [shouldShowMatch, markMatchShown, navigate, userId]);

  useEffect(() => {
    // Only redirect if we have initialized and we're not loading and there's no current idea
    // This prevents redirecting before opinions are loaded
    if (hasInitialized && !currentIdea && !isLoading) {
      // All ideas answered, go to reveal
      navigate(`/reveal?userId=${userId}`);
    }
  }, [hasInitialized, currentIdea, isLoading, navigate, userId]);

  // Update swipe direction indicator based on drag position
  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (!isExiting && Math.abs(latest) > 50) {
        setSwipeDirection(latest > 0 ? "right" : "left");
      } else if (!isExiting) {
        setSwipeDirection(null);
      }
    });

    return () => unsubscribe();
  }, [x, isExiting]);

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
        <div className="text-foreground text-xl">Cargando opiniones...</div>
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

  const completeSwipe = async (direction: "left" | "right") => {
    if (!currentIdea || isExiting) return;

    setIsExiting(true);
    const exitDistance =
      direction === "right"
        ? typeof window !== "undefined"
          ? window.innerWidth
          : 600
        : typeof window !== "undefined"
        ? -window.innerWidth
        : -600;

    await animate(x, exitDistance, { duration: 0.25, ease: "easeOut" });
    await answerIdea(direction === "right" ? "agree" : "disagree");
    x.set(0);
    setSwipeDirection(null);
    setIsExiting(false);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { offset, velocity } = info;

    // Check if velocity is high enough for a flick
    const isFlick = Math.abs(velocity.x) > swipeConfig.velocityThreshold;
    // Check if distance is far enough
    const isSwipe = Math.abs(offset.x) > swipeConfig.threshold;

    if ((isFlick || isSwipe) && !isExiting) {
      const direction = offset.x > 0 ? "right" : "left";
      completeSwipe(direction);
    } else {
      // Snap back with spring physics
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      setSwipeDirection(null);
    }
  };

  // Render conditions AFTER all hooks
  if (!currentIdea) {
    console.log("SwipePage - No current idea, returning null");
    return null;
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
        className={`h-full w-full flex items-center justify-center px-4 sm:px-6 relative z-10 ${
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
              <SwipeCard idea={nextIdea} swipeDirection={null} />
            </div>
          )}

          {/* Current card on top */}
          <motion.div
            key={currentIdea.id}
            className="relative cursor-grab active:cursor-grabbing"
            style={{
              x,
              rotate,
              opacity,
              zIndex: 1,
            }}
            drag={isExiting ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: "grabbing" }}
          >
            <SwipeCard idea={currentIdea} swipeDirection={swipeDirection} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipePage;
