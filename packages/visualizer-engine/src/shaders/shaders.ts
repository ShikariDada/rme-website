/**
 * GLSL sources for the visualizer fullscreen passes (visualizer spec §3 Layer
 * A, §14–§16, §22). Compiled as THREE.ShaderMaterial with
 * glslVersion = THREE.GLSL3 (WebGL2 / GLSL ES 3.00): ES 3.00 is required for
 * textureGrad + integer bit ops, so each pass declares its own `out vec4`.
 *
 * Color pipeline (spec §16.3): renderer.outputColorSpace stays
 * LinearSRGBColorSpace — every pass linearizes its sRGB inputs itself
 * (pow 2.2, matching illuminationMap.ts) and re-encodes with pow(1/2.2) on
 * output. All textures upload with flipY = false and the vertex shader maps
 * vUV.y = 0 to the TOP row of the source images.
 */

export const FULLSCREEN_VERTEX_SHADER = /* glsl */ `
out vec2 vUV;

void main() {
  // flipY = false uploads keep raw image orientation, so v = 0 is the top row;
  // flip here once so every pass can sample in image coordinates.
  vUV = vec2(uv.x, 1.0 - uv.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const BACKGROUND_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uRoom;

vec3 srgbToLinear(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(2.2));
}

vec3 linearToSrgb(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
}

void main() {
  vec3 lin = srgbToLinear(texture(uRoom, vUV).rgb);
  // Each pass encodes its own output; nothing converts it afterwards.
  fragColor = vec4(linearToSrgb(lin), 1.0);
}
`;

export const SURFACE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uMask;
uniform sampler2D uIllum;
uniform sampler2D uAtlas;

uniform mat3 uHinv;           // inverse plane->image homography (column-major, h33 = 1)
uniform vec2 uMmPerUnit;
uniform vec2 uOriginMM;
uniform float uRotationRad;
uniform float uRowOffset;
uniform float uOffsetModulus;
uniform vec2 uTileSize;       // (W, H) in mm
uniform float uGroutEnabled;
uniform float uGroutHalf;     // groutWidthMm / 2
uniform vec3 uGroutColor;     // sRGB 0..1
uniform float uSeed;
uniform int uFaceCount;
uniform int uVariationMode;   // 0 single | 1 random | 2 sequential | 3 directional | 4 bookmatch
uniform int uRotationPolicy;  // 0 fixed | 1 180-only | 2 quarter-turns | 3 free
uniform float uAllowMirror;
uniform float uCompareSplit;  // < 0 disables compare mode
uniform float uShadingStrength;
uniform float uHighlightStrength;
uniform float uExposure;
uniform vec2 uAtlasInset;     // half-texel of one face cell, in face-cell UV
uniform int uAtlasCols;
uniform int uAtlasRows;

vec3 srgbToLinear(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(2.2));
}

// Integer hash identical to materials.ts hashCell: uint arithmetic wraps
// mod 2^32 in GLSL, matching Math.imul, so CPU and GPU agree bit-for-bit.
uint hashCellGLSL(ivec2 cell, uint seed) {
  uint h = seed;
  h = (h ^ uint(cell.x)) * 0x85ebca6bu;
  h ^= h >> 13u;
  h = h * 0xc2b2ae35u;
  h ^= h >> 16u;
  h = (h ^ uint(cell.y)) * 0x27d4eb2fu;
  h ^= h >> 15u;
  return h;
}

void main() {
  float maskA = texture(uMask, vUV).r;
  if (maskA < 0.004) {
    // Room stays visible; under SrcAlpha blending, alpha 0 is a no-op.
    fragColor = vec4(0.0);
    return;
  }
  if (uCompareSplit >= 0.0 && vUV.x > uCompareSplit) {
    // Compare mode: the B side of the split shows the original room.
    fragColor = vec4(0.0);
    return;
  }

  // Image UV -> plane unit square (h33 normalized to 1 CPU-side).
  vec3 hp = uHinv * vec3(vUV, 1.0);
  if (abs(hp.z) < 1e-9) {
    fragColor = vec4(0.0);
    return;
  }
  vec2 planeUV = hp.xy / hp.z;
  vec2 mm = planeUV * uMmPerUnit;

  // Pattern space: origin offset, then whole-pattern rotation — identical to
  // patterns.ts cellAt. GLSL mod() = x - y*floor(x/y) matches the TS glslMod,
  // so negative rows offset the same way.
  float cosR = cos(uRotationRad);
  float sinR = sin(uRotationRad);
  vec2 ru = mm - uOriginMM;
  vec2 mmR = vec2(ru.x * cosR - ru.y * sinR, ru.x * sinR + ru.y * cosR);

  float tileW = uTileSize.x;
  float tileH = uTileSize.y;
  float row = floor(mmR.y / tileH);
  float offset = uOffsetModulus > 1.0 ? uRowOffset * mod(row, uOffsetModulus) * tileW : 0.0;
  float uu = mmR.x + offset;
  float cellXf = floor(uu / tileW);
  vec2 localUV = vec2(uu / tileW - cellXf, mmR.y / tileH - row);

  // Analytic derivatives: mmR is continuous across cell borders, so these stay
  // smooth where fwidth(localUV) would spike and wreck mip selection.
  vec2 ddxLocal = vec2(dFdx(mmR.x) / tileW, dFdx(mmR.y) / tileH);
  vec2 ddyLocal = vec2(dFdy(mmR.x) / tileW, dFdy(mmR.y) / tileH);

  // Grout in material space so joints follow perspective (spec §15). Edge
  // distances use the pre-rotation cell UV so joints stay on the tile grid.
  float edgeU = min(localUV.x, 1.0 - localUV.x) * tileW;
  float edgeV = min(localUV.y, 1.0 - localUV.y) * tileH;
  float aaU = max(fwidth(edgeU) * 0.75, 1e-6);
  float aaV = max(fwidth(edgeV) * 0.75, 1e-6);
  float gU = 1.0 - smoothstep(uGroutHalf - aaU, uGroutHalf + aaU, edgeU);
  float gV = 1.0 - smoothstep(uGroutHalf - aaV, uGroutHalf + aaV, edgeV);
  float groutMask = uGroutEnabled * clamp(max(gU, gV), 0.0, 1.0);

  // Face selection (spec §14) — same constants and bit ops as selectFace().
  ivec2 cell = ivec2(int(cellXf), int(row));
  uint h = hashCellGLSL(cell, uint(uSeed + 0.5));
  int faceCount = uFaceCount;
  int faceIndex = 0;
  if (uVariationMode == 1) {
    faceIndex = faceCount > 0 ? int(h % uint(faceCount)) : 0;
  } else if (uVariationMode == 2) {
    int s = cell.x + cell.y;
    faceIndex = faceCount > 0 ? ((s % faceCount) + faceCount) % faceCount : 0;
  } else if (uVariationMode == 4) {
    faceIndex = faceCount > 1 ? abs(cell.x % 2) : 0;
  }
  int rotSteps = 0; // quarter-turn steps of 90 degrees
  if (uVariationMode != 3) {
    if (uRotationPolicy == 1) {
      rotSteps = int((h & 1u) * 2u); // 0 or 180 degrees
    } else if (uRotationPolicy == 2 || uRotationPolicy == 3) {
      rotSteps = int((h >> 3u) & 3u);
    }
  }
  bool mirror = uAllowMirror > 0.5 && uVariationMode != 3 && ((h >> 7u) & 1u) == 1u;

  if (mirror) {
    localUV.x = 1.0 - localUV.x;
    ddxLocal.x = -ddxLocal.x;
    ddyLocal.x = -ddyLocal.x;
  }
  if (rotSteps == 1) {
    localUV = vec2(localUV.y, 1.0 - localUV.x);
    ddxLocal = vec2(ddxLocal.y, -ddxLocal.x);
    ddyLocal = vec2(ddyLocal.y, -ddyLocal.x);
  } else if (rotSteps == 2) {
    localUV = vec2(1.0 - localUV.x, 1.0 - localUV.y);
    ddxLocal = -ddxLocal;
    ddyLocal = -ddyLocal;
  } else if (rotSteps == 3) {
    localUV = vec2(1.0 - localUV.y, localUV.x);
    ddxLocal = vec2(-ddxLocal.y, ddxLocal.x);
    ddyLocal = vec2(-ddyLocal.y, ddyLocal.x);
  }

  // Atlas sampling (spec §22.4): face cell + half-texel inset, then
  // textureGrad with the analytic derivatives. texture() alone derives mips
  // from quad derivatives of atlasUV, which jump at every cell border and
  // produce garbage mips on oblique floors.
  vec2 cellPos = vec2(float(faceIndex % uAtlasCols), float(faceIndex / uAtlasCols));
  vec2 atlasDiv = vec2(float(uAtlasCols), float(uAtlasRows));
  vec2 span = 1.0 - 2.0 * uAtlasInset;
  vec2 atlasUV = (cellPos + uAtlasInset + localUV * span) / atlasDiv;
  vec2 ddxAtlas = (ddxLocal * span) / atlasDiv;
  vec2 ddyAtlas = (ddyLocal * span) / atlasDiv;
  vec4 texel = textureGrad(uAtlas, atlasUV, ddxAtlas, ddyAtlas);

  // Lighting (spec §16): low-frequency illumination field + shadow/highlight
  // residual (1.0 = neutral), then exposure in EV stops.
  vec4 illum = texture(uIllum, vUV);
  float field = illum.r;            // 0..1
  float residual = illum.g / 128.0; // 1.0 = neutral
  vec3 albedo = srgbToLinear(texel.rgb);
  vec3 groutLinear = srgbToLinear(uGroutColor);
  vec3 base = mix(groutLinear, albedo, 1.0 - groutMask);
  vec3 color = base
    * mix(vec3(1.0), vec3(field), uShadingStrength)
    * mix(vec3(1.0), vec3(residual), uHighlightStrength * 0.9);
  color *= exp2(uExposure);

  fragColor = vec4(pow(max(color, vec3(0.0)), vec3(1.0 / 2.2)), maskA);
}
`;
