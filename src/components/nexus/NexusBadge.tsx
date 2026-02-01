import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const nexusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
        muted: "bg-muted text-muted-foreground",
        beta: "bg-success/10 text-success font-bold uppercase tracking-wide",
      },
      size: {
        sm: "text-[10px] px-2 py-0",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface NexusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof nexusBadgeVariants> {}

function NexusBadge({ className, variant, size, ...props }: NexusBadgeProps) {
  return (
    <span className={cn(nexusBadgeVariants({ variant, size }), className)} {...props} />
  );
}

export { NexusBadge, nexusBadgeVariants };
