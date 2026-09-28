import * as THREE from "three";
import type { SurfaceRenderState } from "../../../../src/features/visualizer/bridge/rendererTypes";
import { hToGLSL, inverseH } from "../geometry/homography";
import type { RotationPolicy, VariationMode } from "../materials/materialModel";
import { patternUniforms } from "../patterns/patterns";
import { TextureManager, textureSlotId } from "./TextureManager";

/** Shader-side indices — must match SURFACE_FRAGMENT_SHADER's uniform docs. */
const VARIATION_MODE_INDEX: Record<VariationMode, number> = {
  single: 0,
  "random-faces": 1,
  "sequential-faces": 2,
  directional: 3,
  "bookmatch-pair": 4,
};

const ROTATION_POLICY_INDEX: Record<RotationPolicy, number> = {
  fixed: 0,
  "180-only": 1,
  "quarter-turns": 2,
  free: 3,
};

/** Everything one surface pass needs, minus the atlas-dependent uniforms. */
export interface SurfacePassData {
  surfaceId: string;
  materialId: string;
  maskTexture: THREE.Texture;
  illumTexture: THREE.Texture;
  /** Values copied into the pass mesh material on scene sync. */
  uniforms: Record<string, THREE.IUniform>;
}

export interface ComposedScene {
  surfacePasses: SurfacePassData[];
}

/**
 * Converts SurfaceRenderState[] into per-pass GPU state: z-sorted passes,
 * CPU-side homography inversion (inverseH + hToGLSL) and lazy mask/illum
 * uploads through the TextureManager. Stateless — recomposed per setSurfaces.
 */
export class SceneCompositor {
  compose(states: SurfaceRenderState[], textures: TextureManager): ComposedScene {
    const passes: SurfacePassData[] = [];
    // Painter's order: lower z drawn first so higher z composites on top.
    const sorted = states.filter((state) => state.enabled).sort((a, b) => a.z - b.z);
    for (const state of sorted) {
      const pass = this.composeSurface(state, textures);
      if (pass) passes.push(pass);
    }
    return { surfacePasses: passes };
  }

  private composeSurface(state: SurfaceRenderState, textures: TextureManager): SurfacePassData | null {
    let inverse: number[];
    try {
      inverse = inverseH(state.H);
    } catch {
      return null; // singular/degenerate homography — skip the surface
    }
    if (!(state.mmPerUnitX > 0) || !(state.mmPerUnitY > 0)) return null;
    if (!(state.material.widthMm > 0) || !(state.material.heightMm > 0)) return null;

    const maskTexture = textures.getSlotTexture(textureSlotId(state.surfaceId, "mask"), state.maskSource, "mask");
    const illumTexture = textures.getSlotTexture(textureSlotId(state.surfaceId, "illum"), state.illumSource, "illum");

    // Row offset / modulus / diagonal rotation come from the tested engine
    // implementation so the shader's cell math mirrors patterns.ts exactly.
    const pattern = patternUniforms({
      layout: state.layout.type,
      rotationDeg: state.layout.rotationDeg,
      originUmm: state.layout.originUmm,
      originVmm: state.layout.originVmm,
    });

    // Grout width is consumed in mm only; the bridge folds approximateWidthPx
    // into widthMm via the surface's mm scale.
    const groutEnabled = state.grout.enabled && state.grout.widthMm > 0;

    const uniforms: Record<string, THREE.IUniform> = {
      uMask: { value: maskTexture },
      uIllum: { value: illumTexture },
      // hToGLSL is column-major, matching Matrix3.elements (h33 = 1).
      uHinv: { value: new THREE.Matrix3().fromArray(hToGLSL(inverse)) },
      uMmPerUnit: { value: new THREE.Vector2(state.mmPerUnitX, state.mmPerUnitY) },
      uOriginMM: { value: new THREE.Vector2(state.layout.originUmm, state.layout.originVmm) },
      uRotationRad: { value: pattern.rotationRad },
      uRowOffset: { value: pattern.rowOffset },
      uOffsetModulus: { value: pattern.offsetModulus },
      uTileSize: { value: new THREE.Vector2(state.material.widthMm, state.material.heightMm) },
      uGroutEnabled: { value: groutEnabled ? 1 : 0 },
      uGroutHalf: { value: groutEnabled ? Math.max(0, state.grout.widthMm) / 2 : 0 },
      uGroutColor: {
        value: new THREE.Vector3(
          state.grout.colorRgb[0],
          state.grout.colorRgb[1],
          state.grout.colorRgb[2]
        ),
      },
      uSeed: { value: 0 },
      uFaceCount: { value: Math.max(0, state.material.faces.length) },
      uVariationMode: { value: VARIATION_MODE_INDEX[state.material.variationMode] },
      uRotationPolicy: { value: ROTATION_POLICY_INDEX[state.material.rotationPolicy] },
      uAllowMirror: { value: state.material.allowMirror ? 1 : 0 },
      uShadingStrength: { value: state.render.shadingStrength },
      uHighlightStrength: { value: state.render.highlightStrength },
      uExposure: { value: state.render.exposureAdjust },
    };

    return {
      surfaceId: state.surfaceId,
      materialId: state.material.id,
      maskTexture,
      illumTexture,
      uniforms,
    };
  }
}
