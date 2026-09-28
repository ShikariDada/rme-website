"use client";

/**
 * Native share with honest fallback (visualizer spec §33).
 * wa.me cannot attach files — only the OS share sheet can carry the actual
 * preview image. Everything else degrades to download + prefilled text.
 */

export type ShareResult = "shared" | "unsupported" | "cancelled" | "failed";

export function canShareFile(file: File): boolean {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

export async function sharePreview(
  blob: Blob,
  filename: string,
  text: string
): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
  if (!canShareFile(file)) return "unsupported";
  try {
    await navigator.share({ files: [file], text, title: "Room preview" });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "failed";
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so Safari's download has started.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
