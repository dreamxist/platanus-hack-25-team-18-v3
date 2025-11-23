import { memo } from "react";
import { Idea } from "@/data/mockData";
import { TopicTag } from "@/components/atoms/TopicTag";
import { cn } from "@/lib/utils";
import { Heart, X, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { spring, scaleIn } from "@/config/animations";

interface SwipeCardProps {
  idea: Idea;
  className?: string;
  swipeDirection?: "left" | "right" | "down" | null;
  onLike?: () => void;
  onDislike?: () => void;
  showInteractionIcons?: boolean;
}

export const SwipeCard = memo(({ idea, className, swipeDirection, onLike, onDislike, showInteractionIcons = true }: SwipeCardProps) => {
  return (
    <div
      className="relative w-full max-w-lg mx-auto select-none"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Swipe indicators with spring animations */}
      {showInteractionIcons && (
        <>
          <motion.div
            className="pointer-events-auto absolute left-4 md:-left-24 top-1/2 -translate-y-1/2 cursor-pointer"
            animate={{
              opacity: swipeDirection === "left" ? 1 : 0.4,
              scale: swipeDirection === "left" ? 1.1 : 0.75,
              x: swipeDirection === "left" ? 10 : 0,
            }}
            transition={spring.bouncy}
            onClick={onDislike}
            whileHover={{ scale: 1.15, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-destructive/20 backdrop-blur-xl border-2 border-destructive flex items-center justify-center">
              <motion.div
                animate={{
                  rotate: swipeDirection === "left" ? [0, -15, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                <X className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-destructive" strokeWidth={3} />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="pointer-events-auto absolute right-4 md:-right-24 top-1/2 -translate-y-1/2 cursor-pointer"
            animate={{
              opacity: swipeDirection === "right" ? 1 : 0.4,
              scale: swipeDirection === "right" ? 1.1 : 0.75,
              x: swipeDirection === "right" ? -10 : 0,
            }}
            transition={spring.bouncy}
            onClick={onLike}
            whileHover={{ scale: 1.15, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-success/20 backdrop-blur-xl border-2 border-success flex items-center justify-center">
              <motion.div
                animate={{
                  scale: swipeDirection === "right" ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Heart className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-success" strokeWidth={3} fill="currentColor" />
              </motion.div>
            </div>
          </motion.div>
        </>
      )}

      {/* Skip indicator - bottom center */}
      {showInteractionIcons && (
        <motion.div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-20 md:-bottom-24"
          animate={{
            opacity: swipeDirection === "down" ? 1 : 0,
            scale: swipeDirection === "down" ? 1.1 : 0.75,
            y: swipeDirection === "down" ? -10 : 0,
          }}
          transition={spring.bouncy}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-400/20 backdrop-blur-xl border-2 border-gray-400 flex items-center justify-center">
            <motion.div
              animate={{
                y: swipeDirection === "down" ? [0, 5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <SkipForward className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-600" strokeWidth={3} />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Main card with liquid glass effect and spring animations */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative w-full",
          "glass-effect",
          "swipe-card",
          "rounded-[3rem] p-8 md:p-12",
          "h-[600px] flex flex-col items-center justify-center",
          className
        )}
      >
        {/* Topic tag */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.smooth, delay: 0.2 }}
        >
          <TopicTag topic={idea.topicName} />
        </motion.div>

        {/* Emoji/Icon with bounce */}
        {idea.emoji && (
          <motion.div
            className="text-7xl mb-8 text-center drop-shadow-2xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.bouncy, delay: 0.3 }}
          >
            {idea.emoji}
          </motion.div>
        )}

        {/* Idea text */}
        <motion.p
          className="text-xl font-semibold text-foreground leading-relaxed text-center mb-12 px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.smooth, delay: 0.4 }}
        >
          {idea.text}
        </motion.p>
      </motion.div>
    </div>
  );
});

SwipeCard.displayName = "SwipeCard";

