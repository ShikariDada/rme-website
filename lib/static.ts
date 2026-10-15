/**
 * Static-export mode flag (GitHub Pages hosting). Set as a build env var:
 * STATIC_EXPORT=1 also switches next.config to `output: "export"`.
 */
export const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
export const STATIC_BASE_PATH = isStaticExport ? "/rme-website" : "";

/** Prefix a site-relative public asset URL with the static base path. */
export function assetUrl(url: string): string {
  if (!url || url.startsWith("http") || url.startsWith("data:") || url.startsWith("//")) {
    return url;
  }
  return `${STATIC_BASE_PATH}${url}`;
}
