import type { MemberDoc } from '../domain/types';
import type { SyncBackend, SyncConfig } from './types';

const TABLE = 'sevens_members';

/**
 * Supabase REST backend, over plain fetch.
 *
 * No SDK on purpose: the whole protocol is two requests, and a 40kB dependency
 * inside an APK that four people sideload is not worth it.
 *
 * Each row is (group_code, person_id) -> payload. A client only ever upserts its
 * own person_id, so concurrent writes from four phones cannot conflict.
 */
export function supabaseBackend(config: SyncConfig): SyncBackend {
  const base = config.url.replace(/\/+$/, '');
  const headers = {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    'Content-Type': 'application/json',
  };

  async function request(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(`${base}/rest/v1/${path}`, {
        ...init,
        headers: { ...headers, ...(init.headers ?? {}) },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`${res.status} ${await res.text().catch(() => res.statusText)}`);
      }
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    kind: 'supabase',

    async push(groupCode, doc) {
      await request(TABLE, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          group_code: groupCode,
          person_id: doc.personId,
          payload: doc,
          updated_at: new Date().toISOString(),
        }),
      });
    },

    async pull(groupCode) {
      const res = await request(
        `${TABLE}?group_code=eq.${encodeURIComponent(groupCode)}&select=payload`,
        { method: 'GET' },
      );
      const rows = (await res.json()) as { payload: MemberDoc }[];
      return rows
        .map((r) => r.payload)
        .filter((d): d is MemberDoc => Boolean(d?.personId && d?.declaration));
    },
  };
}

/** Used until sync is configured. The app is fully usable solo in this mode. */
export function offlineBackend(): SyncBackend {
  return {
    kind: 'offline',
    async push() {},
    async pull() {
      return [];
    },
  };
}
