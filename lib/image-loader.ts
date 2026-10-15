/**
 * Custom next/image loader: with GitHub Pages hosting every public asset
 * lives under /rme-website/, so all image srcs must carry the base path.
 * Unoptimized mode does not apply basePath, so this loader is the fix.
 */
export default function imageLoader({ src }: { src: string }): string {
  if (src.startsWith("http") || src.startsWith("//")) return src;
  return `/rme-website${src}`;
}
