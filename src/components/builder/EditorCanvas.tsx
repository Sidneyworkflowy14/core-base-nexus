import { Block } from '@/types/builder';
import { BlockRenderer } from './BlockRenderer';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorCanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onDeleteBlock: (id: string) => void;
  data?: unknown;
}

export function EditorCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onDeleteBlock,
  data,
}: EditorCanvasProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  if (sortedBlocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg p-8">
        <p className="text-muted-foreground">
          Adicione blocos usando o painel à esquerda.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-4 overflow-auto">
      {sortedBlocks.map((block, index) => (
        <div
          key={block.id}
          className={cn(
            'relative group border rounded-lg p-4 cursor-pointer transition-colors',
            selectedBlockId === block.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
          onClick={() => onSelectBlock(block.id)}
        >
          {/* Block controls */}
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMoveBlock(block.id, 'up');
              }}
              disabled={index === 0}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMoveBlock(block.id, 'down');
              }}
              disabled={index === sortedBlocks.length - 1}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock(block.id);
              }}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>

          {/* Block content */}
          <BlockRenderer block={block} data={data} />
        </div>
      ))}
    </div>
  );
}
