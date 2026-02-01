import * as React from "react";
import { cn } from "@/lib/utils";

interface NexusAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  gradient?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const NexusAvatar = React.forwardRef<HTMLDivElement, NexusAvatarProps>(
  ({ className, src, alt, fallback, size = "md", gradient = false, ...props }, ref) => {
    const initials = fallback || alt?.charAt(0).toUpperCase() || "?";

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full overflow-hidden",
          "bg-muted text-muted-foreground font-medium",
          gradient && "gradient-primary text-white",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || "Avatar"} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);
NexusAvatar.displayName = "NexusAvatar";

export { NexusAvatar };
