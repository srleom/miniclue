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
import { cn } from "@/lib/utils";
import { CpuIcon, PlusIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
  models,
  disabled,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  models?: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const pathname = usePathname();
  // Use provided models if available, otherwise fall back to empty list
  const availableModels = useMemo(() => models ?? [], [models]);
  const isLoading = models === undefined;

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
      value={displayModel?.id ?? ""}
      disabled={disabled || isLoading || availableModels.length === 0}
    >
      <SelectTrigger
        className={cn(
          "hover:bg-accent hover:text-accent-foreground h-8 border-0 px-2 shadow-none",
        )}
        size="sm"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2Icon size={16} className="animate-spin text-inherit" />
          ) : (
            <CpuIcon size={16} className="text-inherit" />
          )}
          <span className="hidden text-xs font-medium sm:block">
            {isLoading
              ? "Loading models..."
              : (displayModel?.name ?? "No models")}
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
          href={`/settings/models?returnTo=${encodeURIComponent(pathname)}`}
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
