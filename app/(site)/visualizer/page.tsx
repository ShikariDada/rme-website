import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo/metadata";
import { getVisualizerMaterials } from "@/lib/visualizer/materials";
import { contentSource } from "@/lib/data";
import { VisualizerClient } from "./visualizer-client";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "See tiles in your room — visualizer",
    description:
      "Upload a room photo and preview our exact tiles and marble on your own floor or wall — locally in your browser, nothing uploaded.",
    path: "/visualizer",
  });
}

export default async function VisualizerPage() {
  const [materials, settings] = await Promise.all([
    getVisualizerMaterials(),
    contentSource.getSettings(),
  ]);

  // `?material=` is read client-side inside VisualizerClient (useSearchParams);
  // the Suspense boundary is required for the prerender bailout in static export.
  return (
    <>
      <h1 className="sr-only">See tiles in your room</h1>
      <noscript>
        <p className="mx-auto max-w-xl px-4 py-10 text-center text-text-muted">
          The visualizer needs JavaScript. To preview a material, WhatsApp us a
          photo of your room and we will send a mockup manually.
        </p>
      </noscript>
      <Suspense
        fallback={
          <div className="flex h-[calc(100dvh-4rem)] flex-col">
            <Skeleton className="h-14 w-full rounded-none" />
            <div className="flex-1 bg-surface-muted/40" />
            <Skeleton className="h-16 w-full rounded-none" />
          </div>
        }
      >
        <VisualizerClient
          materials={materials}
          settings={{
            whatsappNumber: settings.whatsappNumber,
            phone: settings.phoneDisplay ?? settings.phone,
          }}
        />
      </Suspense>
    </>
  );
}
