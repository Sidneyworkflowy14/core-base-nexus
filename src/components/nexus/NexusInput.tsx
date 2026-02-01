import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NexusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const NexusInput = React.forwardRef<HTMLInputElement, NexusInputProps>(
  ({ className, type, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-4 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
NexusInput.displayName = "NexusInput";

// Search input with built-in search icon
const NexusSearchInput = React.forwardRef<HTMLInputElement, Omit<NexusInputProps, 'icon'>>(
  ({ className, ...props }, ref) => (
    <NexusInput
      ref={ref}
      icon={<Search className="h-4 w-4" />}
      className={cn("rounded-xl", className)}
      {...props}
    />
  )
);
NexusSearchInput.displayName = "NexusSearchInput";

export { NexusInput, NexusSearchInput };
