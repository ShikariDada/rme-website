import type {
  EngineCapabilities,
  IVisualizerRenderer,
  SurfaceRenderState,
  ContextLossHandlers,
} from "./rendererTypes";

/**
 * Renderer client (visualizer spec §22, §4.1): lazily imports the engine so
 * three.js + shaders never enter the initial page bundle. React code talks to
 * this facade only; it never touches the engine module statically.
 */

type EngineModule = {
  VisualizerRenderer: new (
    canvas: HTMLCanvasElement,
    handlers?: ContextLossHandlers
  ) => IVisualizerRenderer & { capabilities: EngineCapabilities };
};

let engineModulePromise: Promise<EngineModule> | null = null;

function loadEngine(): Promise<EngineModule> {
  engineModulePromise ??= import(
    "@visualizer/engine"
  ) as unknown as Promise<EngineModule>;
  return engineModulePromise;
}

export interface LoadedMaterialAtlas {
  release(): void;
}

export class RendererClient implements IVisualizerRenderer {
  private inner: (IVisualizerRenderer & { capabilities: EngineCapabilities }) | null = null;
  private initPromise: Promise<void> | null = null;
  private pendingSurfaces: SurfaceRenderState[] | null = null;
  private pendingCompare: number | null = null;

  capabilities: EngineCapabilities = {
    webgl2: false,
    maxTextureSize: 2048,
    maxAnisotropy: 1,
    renderer: "uninitialized",
  };

  static async create(
    canvas: HTMLCanvasElement,
    handlers?: ContextLossHandlers
  ): Promise<RendererClient> {
    const client = new RendererClient();
    await client.init(canvas, handlers);
    return client;
  }

  async init(canvas: HTMLCanvasElement, handlers?: ContextLossHandlers): Promise<void> {
    this.initPromise ??= (async () => {
      const mod = await loadEngine();
      this.inner = new mod.VisualizerRenderer(canvas, handlers);
      this.capabilities = this.inner.capabilities;
    })();
    await this.initPromise;
  }

  get ready(): boolean {
    return this.inner !== null;
  }

  private requireInner(): IVisualizerRenderer {
    if (!this.inner) throw new Error("RendererClient not initialised — call init() first");
    return this.inner;
  }

  /** Queue-friendly: surfaces set before init resolve after init. */
  async setRoom(source: TexImageSource, widthPx: number, heightPx: number): Promise<void> {
    await this.initPromise;
    this.requireInner().setRoom(source, widthPx, heightPx);
  }

  async setMaterialAtlas(
    materialId: string,
    faceSources: TexImageSource[],
    cols?: number,
    rows?: number
  ): Promise<LoadedMaterialAtlas> {
    await this.initPromise;
    return this.requireInner().setMaterialAtlas(materialId, faceSources, cols, rows);
  }

  async setSurfaces(states: SurfaceRenderState[]): Promise<void> {
    this.pendingSurfaces = states;
    if (!this.inner) {
      await this.initPromise;
    }
    this.requireInner().setSurfaces(this.pendingSurfaces);
  }

  async setCompareSplit(split: number | null): Promise<void> {
    this.pendingCompare = split;
    if (!this.inner) {
      await this.initPromise;
    }
    this.requireInner().setCompareSplit(this.pendingCompare);
  }

  requestRender(): void {
    this.inner?.requestRender();
  }

  async resize(cssWidth: number, cssHeight: number, dpr: number): Promise<void> {
    await this.initPromise;
    this.requireInner().resize(cssWidth, cssHeight, dpr);
  }

  dispose(): void {
    this.inner?.dispose();
    this.inner = null;
  }
}
