import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export const ChatBubble = ({ message, isUser, timestamp }: ChatBubbleProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[80%] animate-fade-in",
        isUser ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-3",
          "transition-smooth",
          isUser
            ? "bg-primary text-white rounded-br-sm shadow-lg border border-primary/40"
            : "bg-card border border-border text-foreground rounded-bl-sm shadow-card"
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      {timestamp && (
        <span className="text-xs text-muted-foreground px-2">{timestamp}</span>
      )}
    </div>
  );
};
