import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const nexusIconButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-[var(--radius)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        sm: "h-8 w-8 [&_svg]:size-4",
        md: "h-10 w-10",
        lg: "h-12 w-12 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface NexusIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof nexusIconButtonVariants> {
  showDot?: boolean;
  dotColor?: "primary" | "destructive" | "success";
}

const NexusIconButton = React.forwardRef<HTMLButtonElement, NexusIconButtonProps>(
  ({ className, variant, size, showDot = false, dotColor = "destructive", children, ...props }, ref) => {
    const dotColorClasses = {
      primary: "bg-primary",
      destructive: "bg-destructive",
      success: "bg-success",
    };

    return (
      <button
        className={cn(nexusIconButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
        {showDot && (
          <span
            className={cn(
              "absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ring-background",
              dotColorClasses[dotColor]
            )}
          />
        )}
      </button>
    );
  }
);
NexusIconButton.displayName = "NexusIconButton";

export { NexusIconButton, nexusIconButtonVariants };
