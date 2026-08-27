import { Preferences } from '@capacitor/preferences';

/**
 * Persistence.
 *
 * Capacitor Preferences on device, localStorage in the browser (tests and the
 * dev server). Both are wrapped so a failure to read storage renders an empty
 * app rather than a white screen.
 */
const KEY = 'sevens.run.v1';

export async function loadRaw(): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ?? null;
  } catch {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  }
}

export async function saveRaw(value: string): Promise<void> {
  try {
    await Preferences.set({ key: KEY, value });
  } catch {
    try {
      globalThis.localStorage?.setItem(KEY, value);
    } catch {
      /* Storage unavailable — the session stays in memory. */
    }
  }
}

export async function clearAll(): Promise<void> {
  try {
    await Preferences.remove({ key: KEY });
  } catch {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {
      /* no-op */
    }
  }
}
