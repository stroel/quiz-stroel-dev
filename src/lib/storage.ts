/**
 * localStorage access that never throws: private browsing, a full quota or a
 * blocked origin must not break the quiz, only stop it from remembering.
 */

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch (error) {
    console.warn(`[storage] could not read ${key}`, error);
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] could not write ${key}`, error);
  }
}

/**
 * Moves a value to a new key once, for a quiz that was renamed: the old value
 * is copied only while the new key is empty, so nothing played since is lost.
 */
export function moveKey(from: string, to: string): void {
  try {
    const old = localStorage.getItem(from);
    if (old === null) return;
    if (localStorage.getItem(to) === null) localStorage.setItem(to, old);
    localStorage.removeItem(from);
  } catch (error) {
    console.warn(`[storage] could not move ${from} to ${to}`, error);
  }
}
