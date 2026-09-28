"use client";

import type { VisualizerProject } from "../state/types";

/**
 * IndexedDB project store (visualizer spec §25). Minimal promise wrapper —
 * no dependency. Blobs that can't live in OPFS are backed up here too.
 */

const DB_NAME = "visualizer-projects";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const STORE_BLOBS = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IDB request failed"));
        transaction.oncomplete = () => db.close();
      })
  );
}

export async function listProjects(): Promise<VisualizerProject[]> {
  try {
    const all = await tx<VisualizerProject[]>(STORE_PROJECTS, "readonly", (s) => s.getAll());
    return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function saveProject(project: VisualizerProject): Promise<void> {
  await tx(STORE_PROJECTS, "readwrite", (s) => s.put(project));
}

export async function loadProject(id: string): Promise<VisualizerProject | null> {
  try {
    return (await tx<VisualizerProject | undefined>(STORE_PROJECTS, "readonly", (s) => s.get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function deleteProject(id: string): Promise<void> {
  await tx(STORE_PROJECTS, "readwrite", (s) => s.delete(id));
}

export async function putBlob(blob: Blob): Promise<string> {
  const id = `blob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await tx(STORE_BLOBS, "readwrite", (s) => s.put(blob, id));
  return id;
}

export async function getBlob(id: string): Promise<Blob | null> {
  try {
    return (await tx<Blob | undefined>(STORE_BLOBS, "readonly", (s) => s.get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function deleteBlob(id: string): Promise<void> {
  await tx(STORE_BLOBS, "readwrite", (s) => s.delete(id));
}

export function storageAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}
