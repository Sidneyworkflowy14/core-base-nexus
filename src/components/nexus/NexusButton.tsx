import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nexusButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-nexus-sm hover:shadow-nexus",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-nexus-sm hover:shadow-nexus",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-nexus-sm",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-nexus-sm",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        text: "text-primary hover:text-primary/80 underline-offset-4 hover:underline",
        muted: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface NexusButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof nexusButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const NexusButton = React.forwardRef<HTMLButtonElement, NexusButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(nexusButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    );
  }
);
NexusButton.displayName = "NexusButton";

export { NexusButton, nexusButtonVariants };
