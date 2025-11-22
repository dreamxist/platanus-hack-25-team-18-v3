import { cn } from "@/lib/utils";

interface TopicTagProps {
  topic: string;
  className?: string;
}

export const TopicTag = ({ topic, className }: TopicTagProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
        "bg-primary/10 text-primary border border-primary/20",
        "transition-smooth",
        className
      )}
    >
      {topic}
    </span>
  );
};
