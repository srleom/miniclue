"use client";

import { memo, startTransition, useEffect, useMemo, useState } from "react";
import { saveChatModelAsCookie } from "@/app/(dashboard)/(app)/_actions/chat-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { chatModels } from "@/lib/chat/models";
import { cn } from "@/lib/utils";
import { CpuIcon } from "lucide-react";

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId);

  useEffect(() => {
    setOptimisticModelId(selectedModelId);
  }, [selectedModelId]);

  const selectedModel = useMemo(
    () => chatModels.find((model) => model.id === optimisticModelId),
    [optimisticModelId],
  );

  return (
    <Select
      onValueChange={(modelName) => {
        const model = chatModels.find((m) => m.name === modelName);
        if (model) {
          setOptimisticModelId(model.id);
          onModelChange?.(model.id);
          startTransition(() => {
            saveChatModelAsCookie(model.id);
          });
        }
      }}
      value={selectedModel?.name}
    >
      <SelectTrigger
        className={cn(
          "hover:bg-accent hover:text-accent-foreground h-8 border-0 px-2 shadow-none",
        )}
        size="sm"
      >
        <div className="flex items-center gap-2">
          <CpuIcon size={16} className="text-inherit" />
          <span className="hidden text-xs font-medium sm:block">
            {selectedModel?.name}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="p-0">
        <div className="flex flex-col gap-px">
          {chatModels.map((model) => (
            <SelectItem key={model.id} value={model.name}>
              <div className="truncate text-xs font-medium">{model.name}</div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}

export const ModelSelectorCompact = memo(PureModelSelectorCompact);
