"use client";

import { memo, startTransition, useEffect, useMemo } from "react";
import { saveChatModelAsCookie } from "@/app/(dashboard)/(app)/_actions/chat-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { chatModels } from "@/lib/chat/models";
import { cn } from "@/lib/utils";
import { CpuIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
  models,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  models?: { id: string; name: string }[];
}) {
  // Use provided models if available, otherwise fall back to the default list
  const availableModels = useMemo(() => models ?? chatModels, [models]);

  // Determine the model to show - if selected model is not available, use first available
  const displayModel = useMemo(() => {
    if (availableModels.length === 0) {
      return null;
    }

    // Check if selected model is available
    const isSelectedModelAvailable = availableModels.some(
      (model) => model.id === selectedModelId,
    );

    if (isSelectedModelAvailable) {
      return availableModels.find((model) => model.id === selectedModelId);
    } else {
      // Fall back to first available model
      return availableModels[0];
    }
  }, [availableModels, selectedModelId]);

  // Handle side effect: update model when selected model is not available
  useEffect(() => {
    if (
      displayModel &&
      displayModel.id !== selectedModelId &&
      availableModels.length > 0
    ) {
      // Notify parent about the change
      onModelChange?.(displayModel.id);
      startTransition(() => {
        saveChatModelAsCookie(displayModel.id);
      });
    }
  }, [displayModel, selectedModelId, availableModels.length, onModelChange]);

  return (
    <Select
      onValueChange={(modelId) => {
        const model = availableModels.find((m) => m.id === modelId);
        if (model) {
          onModelChange?.(model.id);
          startTransition(() => {
            saveChatModelAsCookie(model.id);
          });
        }
      }}
      value={displayModel?.id}
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
            {displayModel?.name}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <div className="flex flex-col gap-px">
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="truncate text-xs font-medium">{model.name}</div>
            </SelectItem>
          ))}
        </div>
        <SelectSeparator />
        <Link
          href="/settings/models"
          className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-xs font-medium transition-colors"
        >
          <PlusIcon size={14} />
          <span>Add models</span>
        </Link>
      </SelectContent>
    </Select>
  );
}

export const ModelSelectorCompact = memo(PureModelSelectorCompact);
