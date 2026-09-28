/**
 * Command history over project state (visualizer spec §26).
 * No bitmap snapshots — history stores full serializable project states,
 * with drag/brush coalescing so a 100px handle drag is ONE undo step.
 */

export interface CommandHistory<T> {
  /** Commit a new state (when coalescing, replaces the previous entry under the same key). */
  push(next: T, coalesceKey?: string): void;
  undo(): T | null;
  redo(): T | null;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
}

const MAX_HISTORY = 60;

export function createCommandHistory<T>(
  initial: T,
  options: { max?: number } = {}
): CommandHistory<T> {
  const max = options.max ?? MAX_HISTORY;
  const past: T[] = [];
  const future: T[] = [];
  let present = initial;
  let lastCoalesceKey: string | null = null;

  return {
    push(next: T, coalesceKey?: string) {
      if (coalesceKey !== undefined && lastCoalesceKey === coalesceKey) {
        // Collapse into the previous committed state.
        present = next;
        return;
      }
      past.push(present);
      if (past.length > max) past.shift();
      future.length = 0;
      present = next;
      lastCoalesceKey = coalesceKey ?? null;
    },
    undo() {
      if (past.length === 0) return null;
      future.push(present);
      const prev = past.pop() as T;
      present = prev;
      lastCoalesceKey = null;
      return prev;
    },
    redo() {
      if (future.length === 0) return null;
      past.push(present);
      const next = future.pop() as T;
      present = next;
      lastCoalesceKey = null;
      return next;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clear() {
      past.length = 0;
      future.length = 0;
      lastCoalesceKey = null;
    },
  };
}
