"use client";

// react
import { useState, useEffect } from "react";

// third-party
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";

// icons
import { HelpCircle } from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OpenAIAPIKeyTutorialDialog } from "./openai-api-key-tutorial-dialog";

// actions
import { storeAPIKey } from "../_actions/api-key-actions";
import type { Provider } from "@/lib/chat/models";
import { providerDisplayNames, providerLogos } from "./provider-constants";

const apiKeySchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface ApiKeyDialogProps {
  provider: Provider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  hasKey: boolean;
}

export function ApiKeyDialog({
  provider,
  open,
  onOpenChange,
  onSuccess,
  hasKey,
}: ApiKeyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ apiKey: "" });
    }
  }, [open, form]);

  const onSubmit = async (values: ApiKeyFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await storeAPIKey(provider, values.apiKey);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `${providerDisplayNames[provider]} API key ${hasKey ? "updated" : "stored"} successfully`,
        );
        form.reset();
        onSuccess?.();
      }
    } catch {
      toast.error("Failed to store API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {providerLogos[provider]}
            <div>
              <DialogTitle>{providerDisplayNames[provider]}</DialogTitle>
              <DialogDescription
                className={hasKey ? "text-green-500" : "text-muted-foreground"}
              >
                {hasKey ? "1 active key" : "No active key"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        provider === "openai"
                          ? "sk-..."
                          : provider === "anthropic"
                            ? "sk-ant-..."
                            : "Enter your API key"
                      }
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Your API key will be encrypted and stored securely. We
                    cannot access your key.
                    {provider === "openai" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsTutorialOpen(true);
                        }}
                        className="text-primary ml-1 inline-flex items-center gap-1 hover:underline"
                      >
                        <HelpCircle className="h-3 w-3" />
                        How to get your API key
                      </button>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant={hasKey ? "destructive" : "default"}
              >
                {isSubmitting ? "Saving..." : hasKey ? "Override" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      {provider === "openai" && (
        <OpenAIAPIKeyTutorialDialog
          open={isTutorialOpen}
          onOpenChange={setIsTutorialOpen}
        />
      )}
    </Dialog>
  );
}
