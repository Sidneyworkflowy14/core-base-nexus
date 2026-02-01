import * as React from "react";
import { cn } from "@/lib/utils";

interface NexusPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

const NexusPill = React.forwardRef<HTMLButtonElement, NexusPillProps>(
  ({ className, active = false, icon, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        active
          ? "bg-primary text-primary-foreground shadow-nexus-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
);
NexusPill.displayName = "NexusPill";

export { NexusPill };
