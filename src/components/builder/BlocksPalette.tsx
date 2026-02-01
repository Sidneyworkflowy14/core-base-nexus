import { BlockType, BLOCK_DEFINITIONS } from '@/types/builder';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BlocksPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

export function BlocksPalette({ onAddBlock }: BlocksPaletteProps) {
  return (
    <div className="p-4 space-y-3">
      {BLOCK_DEFINITIONS.map((def) => (
        <button
          key={def.type}
          className={cn(
            "w-full p-3 rounded-lg border border-border bg-card",
            "hover:border-primary hover:bg-primary/5 transition-all",
            "flex items-start gap-3 text-left group"
          )}
          onClick={() => onAddBlock(def.type)}
        >
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <DynamicIcon name={def.icon} className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">{def.label}</p>
            {def.description && (
              <p className="text-xs text-muted-foreground truncate">{def.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
