type CacheEntry<T> = { data: T; updatedAt: number };

const memory = new Map<string, CacheEntry<unknown>>();
const PERSIST_PREFIX = 'academy.cache.';
const SNAPSHOT_KEY = 'academy.bootstrap.v2';
const API_PREFIX = 'academy.api.';

function persistRead<T>(key: string): T | undefined {
  if (memory.has(key)) return memory.get(key)?.data as T;
  try {
    const raw = localStorage.getItem(PERSIST_PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed && parsed.data !== undefined) {
      memory.set(key, parsed);
      return parsed.data;
    }
  } catch {
    /* ignore quota / parse */
  }
  return undefined;
}

function persistWrite<T>(key: string, data: T) {
  const entry: CacheEntry<T> = { data, updatedAt: Date.now() };
  memory.set(key, entry);
  try {
    localStorage.setItem(PERSIST_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota — keep memory only */
  }
}

export function cacheGet<T>(key: string): T | undefined {
  return persistRead<T>(key);
}

export function cacheSet<T>(key: string, data: T): T {
  persistWrite(key, data);
  return data;
}

export function cacheClear(key?: string) {
  if (key) {
    memory.delete(key);
    try { localStorage.removeItem(PERSIST_PREFIX + key); } catch { /* ignore */ }
    return;
  }
  memory.clear();
  try {
    const remove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(PERSIST_PREFIX) || k === SNAPSHOT_KEY || k.startsWith(API_PREFIX))) remove.push(k);
    }
    remove.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

export function readBootstrapSnapshot<T>(): T | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

let snapshotTimer: ReturnType<typeof setTimeout> | null = null;
export function writeBootstrapSnapshot(data: unknown) {
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data));
    } catch { /* quota */ }
  }, 250);
}

export function peekApiCache<T>(endpoint: string): T | undefined {
  return persistRead<T>(API_PREFIX + endpoint);
}

const resourceEpoch = new Map<string, number>();
const tombstones = new Map<string, number>();
const TOMBSTONE_MS = 180000;

function looksLikeId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    || /^(stu|tch|batch|ann|subj|hw|sm|test|lead|slot)-/i.test(value);
}

export function resourceFamily(endpoint: string): string {
  const path = String(endpoint || '').split('?')[0].replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && looksLikeId(parts[parts.length - 1])) {
    return '/' + parts.slice(0, -1).join('/');
  }
  return '/' + parts.join('/');
}

export function currentEpoch(endpoint: string): number {
  return resourceEpoch.get(resourceFamily(endpoint)) || 0;
}

export function bumpEpoch(endpoint: string): number {
  const family = resourceFamily(endpoint);
  const next = (resourceEpoch.get(family) || 0) + 1;
  resourceEpoch.set(family, next);
  return next;
}

export function markDeleted(id?: string | null) {
  if (!id) return;
  tombstones.set(id, Date.now() + TOMBSTONE_MS);
}

export function unmarkDeleted(id?: string | null) {
  if (!id) return;
  tombstones.delete(id);
}

export function isTombstoned(id?: string | null): boolean {
  if (!id) return false;
  const exp = tombstones.get(id);
  if (!exp) return false;
  if (exp < Date.now()) {
    tombstones.delete(id);
    return false;
  }
  return true;
}

function rowIds(row: any): string[] {
  if (!row || typeof row !== 'object') return [];
  return [
    row.id,
    row.studentId,
    row.student_id,
    row.test_id,
    row.staff_member_id,
    row.staffMemberId,
    row.teacher_id,
    row.teacherId,
    row.user_id,
    row.userId
  ].filter(Boolean).map(String);
}

function rowId(row: any): string | undefined {
  return rowIds(row)[0];
}

function rowIsRemoved(row: any): boolean {
  return rowIds(row).some(id => isTombstoned(id));
}

export function filterDeleted<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.filter((row: any) => !rowIsRemoved(row)) as T;
  }
  if (data && typeof data === 'object') {
    const obj = data as any;
    const next = { ...obj };
    let changed = false;
    for (const key of ['logs', 'rows', 'roster', 'alerts', 'data', 'items']) {
      if (Array.isArray(obj[key])) {
        next[key] = obj[key].filter((row: any) => !rowIsRemoved(row));
        changed = true;
      }
    }
    if (changed) return next as T;
  }
  return data;
}

function stripIdFromValue(data: any, id: string): any {
  if (Array.isArray(data)) return data.filter((row: any) => !rowIds(row).includes(id));
  if (data && typeof data === 'object') {
    const next = { ...data };
    for (const key of ['logs', 'rows', 'roster', 'alerts', 'data', 'items']) {
      if (Array.isArray(data[key])) next[key] = data[key].filter((row: any) => !rowIds(row).includes(id));
    }
    return next;
  }
  return data;
}

export function removeIdFromCaches(id: string) {
  markDeleted(id);
  for (const [key, entry] of memory.entries()) {
    memory.set(key, { data: stripIdFromValue(entry.data, id), updatedAt: Date.now() });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('academy-entity-removed', { detail: { ids: [id] } }));
  }
}

export function removeIdsFromCaches(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  unique.forEach(id => {
    markDeleted(id);
    for (const [key, entry] of memory.entries()) {
      memory.set(key, { data: stripIdFromValue(entry.data, id), updatedAt: Date.now() });
    }
  });
  if (typeof window !== 'undefined' && unique.length) {
    window.dispatchEvent(new CustomEvent('academy-entity-removed', { detail: { ids: unique } }));
  }
}

export function writeApiCache<T>(endpoint: string, data: T) {
  const cleaned = filterDeleted(data);
  persistWrite(API_PREFIX + endpoint, cleaned);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('academy-api-cache', { detail: { endpoint, data: cleaned } }));
  }
}

export async function cacheMutate<T>(options: {
  key: string;
  optimistic: T;
  request: () => Promise<T>;
  onRollback?: (previous: T | undefined) => void;
}): Promise<T> {
  const previous = cacheGet<T>(options.key);
  cacheSet(options.key, options.optimistic);
  try {
    const saved = await options.request();
    cacheSet(options.key, saved);
    return saved;
  } catch (err) {
    if (previous !== undefined) cacheSet(options.key, previous);
    else memory.delete(options.key);
    options.onRollback?.(previous);
    throw err;
  }
}
