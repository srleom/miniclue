// react
import { Suspense } from "react";

// actions
import {
  getUserModels,
  getUser,
} from "@/app/(dashboard)/_actions/user-actions";
import type { components } from "@/lib/api/generated/types.gen";

// components
import { ModelsList } from "./_components/models-list";
import { ModelsHeader } from "./_components/models-header";
import { providers as allProviders } from "@/app/(dashboard)/(settings)/settings/api-key/_components/provider-constants";

async function ModelsContent() {
  const [{ data, error }, { data: user }] = await Promise.all([
    getUserModels(),
    getUser(),
  ]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Failed to load models</p>
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  type ProviderKey =
    components["schemas"]["dto.ModelPreferenceRequestDTO"]["provider"];

  const apiKeysStatus = {
    gemini: user?.api_keys_provided?.gemini ?? false,
    openai: user?.api_keys_provided?.openai ?? false,
    anthropic: user?.api_keys_provided?.anthropic ?? false,
    xai: user?.api_keys_provided?.xai ?? false,
    deepseek: user?.api_keys_provided?.deepseek ?? false,
  };

  const providersWithModels =
    data?.providers?.map((p) => {
      const provider = p.provider as ProviderKey;
      const models =
        p.models
          ?.map((m) => ({
            id: m.id ?? "",
            name: m.name ?? m.id ?? "",
            enabled: Boolean(m.enabled),
          }))
          .filter((m) => m.id !== "") ?? [];
      return { provider, models };
    }) ?? [];

  const providers = allProviders.map((p) => {
    const providerWithModels = providersWithModels.find(
      (pm) => pm.provider === p.id,
    );
    return {
      provider: p.id as ProviderKey,
      models: providerWithModels?.models ?? [],
      hasKey: apiKeysStatus[p.id as keyof typeof apiKeysStatus] ?? false,
    };
  });

  return (
    <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
      <div className="flex w-full flex-col gap-12">
        <ModelsHeader />

        <div>
          <h2 className="text-muted-foreground mb-4 text-sm font-medium tracking-tighter uppercase">
            Available Models
          </h2>
          <ModelsList providers={providers} />
        </div>
      </div>
    </div>
  );
}

export default function ModelsSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
          <div className="flex w-full flex-col gap-6">
            <ModelsHeader />
            <div className="flex items-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ModelsContent />
    </Suspense>
  );
}
