"use client";

import { saveProject } from "./projectsDb";

/**
 * Local-first storage (visualizer spec §4.5, §25).
 * OPFS for blobs (original photos, exports) when available, with an
 * IndexedDB fallback — NEVER localStorage (size limits, sync API).
 */

type Dir = "rooms" | "exports" | "models";

interface BlobRef {
  dir: Dir;
  name: string;
}

/** In-memory fallback when OPFS is unavailable (blobs survive via projectsDb backup). */
const memoryBlobs = new Map<string, Blob>();
const refIndex = new Map<string, BlobRef>();

async function opfsAvailable(): Promise<boolean> {
  try {
    return typeof navigator !== "undefined" && !!navigator.storage?.getDirectory;
  } catch {
    return false;
  }
}

async function getDir(dir: Dir): Promise<FileSystemDirectoryHandle | null> {
  if (!(await opfsAvailable())) return null;
  try {
    const root = await navigator.storage.getDirectory();
    return root.getDirectoryHandle(dir, { create: true });
  } catch {
    return null;
  }
}

export function isLocalFirstSupported(): boolean {
  return opfsAvailable() !== null;
}

export async function saveBlob(dir: Dir, name: string, blob: Blob): Promise<string> {
  const id = `${dir}/${name}`;
  const handle = await getDir(dir);
  if (handle) {
    const fileHandle = await handle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    memoryBlobs.set(id, blob);
  }
  refIndex.set(id, { dir, name });
  return id;
}

export async function loadBlob(ref: string): Promise<Blob | null> {
  const info = refIndex.get(ref);
  const dir = info?.dir ?? (ref.split("/")[0] as Dir | undefined);
  const name = info?.name ?? ref.split("/")[1];
  if (dir && name) {
    const handle = await getDir(dir);
    if (handle) {
      try {
        const fileHandle = await handle.getFileHandle(name);
        const file = await fileHandle.getFile();
        return file;
      } catch {
        return null;
      }
    }
  }
  return memoryBlobs.get(ref) ?? null;
}

export async function deleteBlob(ref: string): Promise<void> {
  const info = refIndex.get(ref);
  memoryBlobs.delete(ref);
  refIndex.delete(ref);
  if (info) {
    const handle = await getDir(info.dir);
    if (handle) {
      try {
        await handle.removeEntry(info.name);
      } catch {
        // already gone
      }
    }
  }
}

/** Persist project metadata alongside blob backups. */
export async function persistProject(project: Parameters<typeof saveProject>[0]): Promise<void> {
  await saveProject(project);
}
