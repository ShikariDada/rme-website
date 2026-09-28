"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Primitives";
import type { ShellProps } from "./VisualizerShell";

/**
 * Client-only lazy shell (visualizer spec §4.1, §24): keeps three.js + the
 * whole editor out of the main bundle and off the server.
 */
const VisualizerShell = dynamic(() => import("./VisualizerShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <Skeleton className="h-14 w-full rounded-none" />
      <div className="flex-1 bg-surface-muted/40" />
      <Skeleton className="h-16 w-full rounded-none" />
    </div>
  ),
});

export function VisualizerLazy(props: ShellProps) {
  return <VisualizerShell {...props} />;
}
