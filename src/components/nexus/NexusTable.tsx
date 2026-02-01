import * as React from "react";
import { cn } from "@/lib/utils";

const NexusTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-lg border border-border">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
);
NexusTable.displayName = "NexusTable";

const NexusTableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("bg-muted/50", className)} {...props} />
  )
);
NexusTableHeader.displayName = "NexusTableHeader";

const NexusTableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
NexusTableBody.displayName = "NexusTableBody";

const NexusTableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("border-t bg-muted/50 font-medium", className)}
      {...props}
    />
  )
);
NexusTableFooter.displayName = "NexusTableFooter";

const NexusTableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
);
NexusTableRow.displayName = "NexusTableRow";

const NexusTableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
NexusTableHead.displayName = "NexusTableHead";

const NexusTableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
);
NexusTableCell.displayName = "NexusTableCell";

const NexusTableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  )
);
NexusTableCaption.displayName = "NexusTableCaption";

export {
  NexusTable,
  NexusTableHeader,
  NexusTableBody,
  NexusTableFooter,
  NexusTableRow,
  NexusTableHead,
  NexusTableCell,
  NexusTableCaption,
};
