import * as THREE from "three";
import type {
  ContextLossHandlers,
  EngineCapabilities,
  IVisualizerRenderer,
  LoadedMaterialAtlas,
  SurfaceRenderState,
} from "../../../../src/features/visualizer/bridge/rendererTypes";
import {
  BACKGROUND_FRAGMENT_SHADER,
  FULLSCREEN_VERTEX_SHADER,
  SURFACE_FRAGMENT_SHADER,
} from "../shaders/shaders";
import { SceneCompositor, type SurfacePassData } from "./SceneCompositor";
import { TextureManager, textureSlotId } from "./TextureManager";

/**
 * Layer A compositor (visualizer spec §3, §11, §22): one fullscreen clip-space
 * quad rendered twice per surface — an opaque room pass, then z-sorted surface
 * passes with SrcAlpha/OneMinusSrcAlpha blending. Deterministic: uniforms only,
 * no time or random inputs, so the same state always renders the same pixels.
 */
export class VisualizerRenderer implements IVisualizerRenderer {
  readonly capabilities: EngineCapabilities;

  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.BufferGeometry;
  private readonly textures: TextureManager;
  private readonly compositor = new SceneCompositor();

  private backgroundMesh: THREE.Mesh | null = null;
  private readonly meshPool = new Map<string, THREE.Mesh>();
  private passes: SurfacePassData[] = [];
  private compareSplit: number | null = null;
  private hasSize = false;
  private dirty = false;
  private rafId: number | null = null;
  private disposed = false;
  private contextLost = false;
  private readonly handlers: ContextLossHandlers | undefined;

  private readonly onContextLost = (event: Event): void => {
    // Mark recoverable so the browser may restore the context later.
    event.preventDefault();
    this.contextLost = true;
    this.handlers?.onContextLost?.();
  };

  private readonly onContextRestored = (): void => {
    this.contextLost = false;
    // three.js re-inits the GL context itself; textures only need a re-upload
    // nudge, then the last known scene renders as-is.
    this.textures.markAllForReupload();
    this.handlers?.onContextRestored?.();
    this.requestRender();
  };

  constructor(canvas: HTMLCanvasElement, handlers?: ContextLossHandlers) {
    this.canvas = canvas;
    this.handlers = handlers;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
    });
    if (!this.renderer.capabilities.isWebGL2) {
      this.renderer.dispose();
      throw new Error("Visualizer renderer requires WebGL2");
    }
    // Spec §16.3: all sRGB <-> linear conversion happens in our shaders.
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x000000, 1);

    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const unmaskedRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;
    this.capabilities = {
      webgl2: true,
      maxTextureSize,
      maxAnisotropy: this.renderer.capabilities.getMaxAnisotropy(),
      renderer: String(unmaskedRenderer ?? gl.getParameter(gl.RENDERER)),
    };

    this.textures = new TextureManager(this.capabilities.maxAnisotropy, maxTextureSize);

    this.quad = new THREE.BufferGeometry();
    this.quad.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)
    );
    this.quad.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    this.quad.setIndex([0, 1, 2, 0, 2, 3]);

    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
  }

  setRoom(source: TexImageSource, widthPx: number, heightPx: number): void {
    const texture = this.textures.setRoom(source);
    if (!this.backgroundMesh) {
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERTEX_SHADER,
        fragmentShader: BACKGROUND_FRAGMENT_SHADER,
        uniforms: { uRoom: { value: texture } },
        depthTest: false,
        depthWrite: false,
      });
      this.backgroundMesh = new THREE.Mesh(this.quad, material);
      this.backgroundMesh.frustumCulled = false;
      this.backgroundMesh.renderOrder = 0;
      this.scene.add(this.backgroundMesh);
    } else {
      (this.backgroundMesh.material as THREE.ShaderMaterial).uniforms.uRoom.value = texture;
    }
    // widthPx/heightPx describe the source for the bridge/export sizing; the
    // live fullscreen pass is resolution-independent.
    this.requestRender();
  }

  async setMaterialAtlas(
    materialId: string,
    faceSources: TexImageSource[],
    cols?: number,
    rows?: number
  ): Promise<LoadedMaterialAtlas> {
    const resolvedCols = cols ?? Math.ceil(Math.sqrt(faceSources.length));
    const resolvedRows = rows ?? Math.ceil(faceSources.length / resolvedCols);
    const entry = this.textures.acquireAtlas(materialId, faceSources, resolvedCols, resolvedRows);
    this.requestRender();
    return { release: () => this.textures.releaseEntry(entry) };
  }

  setSurfaces(states: SurfaceRenderState[]): void {
    this.passes = this.compositor.compose(states, this.textures).surfacePasses;
    // Slots of surfaces that dropped out of the composition (disabled,
    // degenerate, missing atlas) are pruned with their GPU textures.
    const keep = new Set<string>();
    for (const pass of this.passes) {
      keep.add(textureSlotId(pass.surfaceId, "mask"));
      keep.add(textureSlotId(pass.surfaceId, "illum"));
    }
    this.textures.pruneSlots(keep);
    this.syncMeshes();
    this.requestRender();
  }

  setCompareSplit(split: number | null): void {
    this.compareSplit = split;
    this.requestRender();
  }

  requestRender(): void {
    if (this.disposed) return;
    this.dirty = true;
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        if (this.dirty && !this.disposed) {
          this.dirty = false;
          this.renderFrame();
        }
      });
    }
  }

  /** Immediate draw of the current state — export path, bypasses rAF coalescing. */
  renderNow(): void {
    if (this.disposed) return;
    this.dirty = false;
    this.renderFrame();
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(cssWidth, cssHeight, false);
    this.hasSize = cssWidth > 0 && cssHeight > 0;
    this.requestRender();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.quad.dispose();
    for (const mesh of this.meshPool.values()) {
      (mesh.material as THREE.ShaderMaterial).dispose();
    }
    this.meshPool.clear();
    if (this.backgroundMesh) {
      (this.backgroundMesh.material as THREE.ShaderMaterial).dispose();
      this.backgroundMesh = null;
    }
    this.scene.clear();
    this.textures.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private syncMeshes(): void {
    const active = new Set<string>();
    this.passes.forEach((pass, index) => {
      active.add(pass.surfaceId);
      let mesh = this.meshPool.get(pass.surfaceId);
      if (!mesh) {
        const material = new THREE.ShaderMaterial({
          glslVersion: THREE.GLSL3,
          vertexShader: FULLSCREEN_VERTEX_SHADER,
          fragmentShader: SURFACE_FRAGMENT_SHADER,
          uniforms: this.createSurfaceUniforms(),
          transparent: true,
          // NormalBlending with premultipliedAlpha = false is
          // SrcAlpha / OneMinusSrcAlpha, matching the spec's blend equation.
          blending: THREE.NormalBlending,
          depthTest: false,
          depthWrite: false,
        });
        mesh = new THREE.Mesh(this.quad, material);
        mesh.frustumCulled = false;
        this.meshPool.set(pass.surfaceId, mesh);
        this.scene.add(mesh);
      }
      // Merge in place: three caches uniform-entry references per program, so
      // the material's uniforms object must never be swapped wholesale.
      const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms;
      for (const key of Object.keys(pass.uniforms)) {
        const target = uniforms[key];
        if (target) target.value = pass.uniforms[key].value;
        else uniforms[key] = { value: pass.uniforms[key].value };
      }
      mesh.renderOrder = index + 1; // z-sorted painter order above the background
      mesh.visible = true; // renderFrame hides passes whose atlas is missing
    });
    for (const [surfaceId, mesh] of this.meshPool) {
      if (!active.has(surfaceId)) mesh.visible = false;
    }
  }

  private renderFrame(): void {
    if (this.disposed || this.contextLost || !this.hasSize) return;
    const split = this.compareSplit ?? -1;
    for (const pass of this.passes) {
      const mesh = this.meshPool.get(pass.surfaceId);
      if (!mesh) continue;
      const atlas = this.textures.getAtlas(pass.materialId);
      if (!atlas) {
        // Atlas not uploaded yet — the surface appears as soon as it arrives.
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms;
      uniforms.uAtlas.value = atlas.texture;
      uniforms.uAtlasCols.value = atlas.cols;
      uniforms.uAtlasRows.value = atlas.rows;
      (uniforms.uAtlasInset.value as THREE.Vector2).copy(atlas.inset);
      uniforms.uCompareSplit.value = split;
    }
    this.renderer.render(this.scene, this.camera);
  }

  private createSurfaceUniforms(): Record<string, THREE.IUniform> {
    return {
      uMask: { value: null },
      uIllum: { value: null },
      uAtlas: { value: null },
      uHinv: { value: new THREE.Matrix3() },
      uMmPerUnit: { value: new THREE.Vector2(1, 1) },
      uOriginMM: { value: new THREE.Vector2(0, 0) },
      uRotationRad: { value: 0 },
      uRowOffset: { value: 0 },
      uOffsetModulus: { value: 1 },
      uTileSize: { value: new THREE.Vector2(1, 1) },
      uGroutEnabled: { value: 0 },
      uGroutHalf: { value: 0 },
      uGroutColor: { value: new THREE.Vector3(0.72, 0.7, 0.65) },
      uSeed: { value: 0 },
      uFaceCount: { value: 1 },
      uVariationMode: { value: 0 },
      uRotationPolicy: { value: 0 },
      uAllowMirror: { value: 0 },
      uCompareSplit: { value: -1 },
      uShadingStrength: { value: 0.85 },
      uHighlightStrength: { value: 0.6 },
      uExposure: { value: 0 },
      uAtlasInset: { value: new THREE.Vector2(0, 0) },
      uAtlasCols: { value: 1 },
      uAtlasRows: { value: 1 },
    };
  }
}
