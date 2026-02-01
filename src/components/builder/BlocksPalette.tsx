import { BlockType, BLOCK_DEFINITIONS } from '@/types/builder';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Button } from '@/components/ui/button';

interface BlocksPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

export function BlocksPalette({ onAddBlock }: BlocksPaletteProps) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold">Blocos</h3>
      <div className="space-y-2">
        {BLOCK_DEFINITIONS.map((def) => (
          <Button
            key={def.type}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onAddBlock(def.type)}
          >
            <DynamicIcon name={def.icon} className="h-4 w-4 mr-2" />
            {def.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
