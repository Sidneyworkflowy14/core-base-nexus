import * as React from "react";
import { cn } from "@/lib/utils";

interface NexusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const NexusCard = React.forwardRef<HTMLDivElement, NexusCardProps>(
  ({ className, noPadding = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-nexus",
        !noPadding && "p-6",
        className
      )}
      {...props}
    />
  )
);
NexusCard.displayName = "NexusCard";

const NexusCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  )
);
NexusCardHeader.displayName = "NexusCardHeader";

const NexusCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
NexusCardTitle.displayName = "NexusCardTitle";

const NexusCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
NexusCardDescription.displayName = "NexusCardDescription";

const NexusCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
NexusCardContent.displayName = "NexusCardContent";

const NexusCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4 border-t border-border mt-4", className)}
      {...props}
    />
  )
);
NexusCardFooter.displayName = "NexusCardFooter";

export { NexusCard, NexusCardHeader, NexusCardTitle, NexusCardDescription, NexusCardContent, NexusCardFooter };
