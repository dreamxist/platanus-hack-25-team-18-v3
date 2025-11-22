import { ProgressBar } from "@/components/atoms/ProgressBar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  current?: number;
  total?: number;
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  className?: string;
}

export const Header = ({
  current,
  total,
  title = "micandidatop",
  subtitle,
  showProgress = false,
  className,
}: HeaderProps) => {
  return (
    <header
      className={cn(
        "w-full px-4 py-6 bg-card/80 backdrop-blur-lg border-b border-border/50",
        className
      )}
    >
      <div className="max-w-2xl mx-auto">
        {/* Logo/Title */}
        <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
        )}

        {/* Progress bar */}
        {showProgress && current !== undefined && total !== undefined && (
          <ProgressBar current={current} total={total} />
        )}
      </div>
    </header>
  );
};
