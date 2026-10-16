"use client";

import type { ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import { VisualizerLazy } from "@/src/features/visualizer/ui/VisualizerLazy";

type Props = Omit<ComponentProps<typeof VisualizerLazy>, "initialMaterialId">;

/**
 * Reads the `?material=` query client-side (required in static export, where
 * the server page cannot read searchParams) and hands it to the shell.
 * Must be wrapped in a Suspense boundary (prerender bailout).
 */
export function VisualizerClient(props: Props) {
 const searchParams = useSearchParams();
 const initialMaterialId = searchParams.get("material") ?? undefined;
 return <VisualizerLazy {...props} initialMaterialId={initialMaterialId} />;
}
