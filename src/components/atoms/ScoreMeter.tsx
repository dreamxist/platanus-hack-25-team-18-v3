import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface ScoreMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ScoreMeter = ({ score, size = "md", className }: ScoreMeterProps) => {
  const sizeClasses = {
    sm: "w-20 h-20 text-xl",
    md: "w-32 h-32 text-3xl",
    lg: "w-40 h-40 text-4xl",
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Animated counter
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 1.5,
      ease: "easeOut",
    });

    return controls.stop;
  }, [score, count]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        className={cn("transform -rotate-90", sizeClasses[size])}
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 65%, 55%)" />
            <stop offset="100%" stopColor="hsl(180, 60%, 50%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span className={cn("font-bold text-primary leading-none", sizeClasses[size])}>
          <motion.span>{rounded}</motion.span>%
        </motion.span>
      </div>
    </div>
  );
};
