/**
 * @visualizer/engine — deterministic WebGL2 material compositor for the
 * in-house tile visualizer. React never touches shader details; it sends
 * normalized scene state (src/features/visualizer/state/types.ts) through the
 * bridge (rendererClient) into these modules.
 */

// Geometry
export {
  solveHomography,
  homographyFromQuad,
  applyH,
  inverseH,
  multiplyH,
  validateQuad,
  hToGLSL,
  DegenerateQuadError,
  type Homography,
  type Point,
  type QuadValidation,
} from "./geometry/homography";

export {
  polygonArea,
  pointInPolygon,
  centroid,
  windingOrder,
  ensureCounterClockwise,
} from "./geometry/polygon";

export {
  scaleFromCalibrationLine,
  scaleFromTwoLines,
  approximateScale,
  calibrationFromImagePoints,
  planeDistanceMm,
  CalibrationError,
  type CalibrationLine,
  type PlaneScale,
} from "./geometry/calibration";

// Patterns
export {
  evaluatePattern,
  cellAt,
  isGrout,
  patternUniforms,
  effectiveRotationDeg,
  V1_LAYOUTS,
  type LayoutType,
  type PatternConfig,
  type PatternUniforms,
  type TileSizeMm,
  type CellEvaluation,
} from "./patterns/patterns";

// Materials
export {
  isVisualizerReady,
  hashCell,
  selectFace,
  siteFinishToFinishType,
  FINISH_PROFILES,
  type FinishType,
  type FinishProfile,
  type MaterialFace,
  type MaterialKind,
  type RotationPolicy,
  type VariationMode,
  type VisualizerMaterial,
} from "./materials/materialModel";

// Masks
export {
  createMask,
  rasterizePolygon,
  brushStamp,
  blurMask,
  thresholdMask,
  type MaskBuffer,
} from "./masks/maskRasterizer";

// Lighting
export {
  computeIlluminationMap,
  luminanceLinear,
  type IlluminationMap,
  type RGBABuffer,
} from "./lighting/illuminationMap";

// Renderer layer (WebGL2 / three.js — browser only, not SSR-safe)
export {
  FULLSCREEN_VERTEX_SHADER,
  BACKGROUND_FRAGMENT_SHADER,
  SURFACE_FRAGMENT_SHADER,
} from "./shaders/shaders";

export {
  TextureManager,
  textureSlotId,
  type AtlasEntry,
  type TextureSlotKind,
} from "./renderer/TextureManager";

export {
  SceneCompositor,
  type ComposedScene,
  type SurfacePassData,
} from "./renderer/SceneCompositor";

export { VisualizerRenderer } from "./renderer/Renderer";
export { ExportRenderer } from "./renderer/ExportRenderer";
