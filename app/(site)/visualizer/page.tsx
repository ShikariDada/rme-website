import type { Metadata } from "next";
import { VisualizerLazy } from "@/src/features/visualizer/ui/VisualizerLazy";
import { pageMetadata } from "@/lib/seo/metadata";
import { getVisualizerMaterials } from "@/lib/visualizer/materials";
import { contentSource } from "@/lib/data";

interface Props {
  searchParams: Promise<{ material?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "See tiles in your room — visualizer",
    description:
      "Upload a room photo and preview our exact tiles and marble on your own floor or wall — locally in your browser, nothing uploaded.",
    path: "/visualizer",
  });
}

export default async function VisualizerPage({ searchParams }: Props) {
  const { material } = await searchParams;
  const [materials, settings] = await Promise.all([
    getVisualizerMaterials(),
    contentSource.getSettings(),
  ]);

  return (
    <>
      <noscript>
        <p className="mx-auto max-w-xl px-4 py-10 text-center text-text-muted">
          The visualizer needs JavaScript. To preview a material, WhatsApp us a
          photo of your room and we will send a mockup manually.
        </p>
      </noscript>
      <VisualizerLazy
        materials={materials}
        settings={{
          whatsappNumber: settings.whatsappNumber,
          phone: settings.phoneDisplay ?? settings.phone,
        }}
        initialMaterialId={material}
      />
    </>
  );
}
