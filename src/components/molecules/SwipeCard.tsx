import { Idea } from "@/data/mockData";
import { TopicTag } from "@/components/atoms/TopicTag";
import { cn } from "@/lib/utils";
import { Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { spring, scaleIn } from "@/config/animations";

interface SwipeCardProps {
  idea: Idea;
  className?: string;
  swipeDirection?: "left" | "right" | null;
}

export const SwipeCard = ({ idea, className, swipeDirection }: SwipeCardProps) => {
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
      <motion.div
        className="absolute -left-24 top-1/2 -translate-y-1/2"
        animate={{
          opacity: swipeDirection === "left" ? 1 : 0,
          scale: swipeDirection === "left" ? 1.1 : 0.75,
          x: swipeDirection === "left" ? 10 : 0,
        }}
        transition={spring.bouncy}
      >
        <div className="w-20 h-20 rounded-full bg-destructive/20 backdrop-blur-xl border-2 border-destructive flex items-center justify-center">
          <motion.div
            animate={{
              rotate: swipeDirection === "left" ? [0, -15, 0] : 0,
            }}
            transition={{ duration: 0.5 }}
          >
            <X className="w-10 h-10 text-destructive" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -right-24 top-1/2 -translate-y-1/2"
        animate={{
          opacity: swipeDirection === "right" ? 1 : 0,
          scale: swipeDirection === "right" ? 1.1 : 0.75,
          x: swipeDirection === "right" ? -10 : 0,
        }}
        transition={spring.bouncy}
      >
        <div className="w-20 h-20 rounded-full bg-success/20 backdrop-blur-xl border-2 border-success flex items-center justify-center">
          <motion.div
            animate={{
              scale: swipeDirection === "right" ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <Heart className="w-10 h-10 text-success" strokeWidth={3} fill="currentColor" />
          </motion.div>
        </div>
      </motion.div>

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
};
