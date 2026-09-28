/** Feature flags (visualizer spec §39) — risky/expensive enhancements gated. */
export const VISUALIZER_FLAGS = {
  smartSelect: true,
  sam2Experiment: false,
  depthAssist: false,
  pbrMaps: false,
  herringbone: false,
  bookmatch: false,
  offlinePwa: false,
} as const;

export type VisualizerFlag = keyof typeof VISUALIZER_FLAGS;
