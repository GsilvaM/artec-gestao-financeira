import { ArtecLogoMark } from "@/components/brand/ArtecLogoMark";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  compact?: boolean;
  className?: string;
  markClassName?: string;
}

export function AppLogo({ compact = false, className, markClassName }: AppLogoProps) {
  return (
    <span className={cn("app-logo", className)}>
      <ArtecLogoMark className={cn("app-logo-mark", markClassName)} />
      {!compact && (
        <span className="app-logo-copy">
          <strong>Artec</strong>
          <span>Finance Command</span>
        </span>
      )}
    </span>
  );
}
