import type { MemberDoc } from '../domain/types';

export interface SyncConfig {
  url: string;
  anonKey: string;
}

export interface SyncBackend {
  readonly kind: 'supabase' | 'offline';
  /** Publish this person's own document. Never writes anyone else's. */
  push(groupCode: string, doc: MemberDoc): Promise<void>;
  /** Fetch every member document for the group. */
  pull(groupCode: string): Promise<MemberDoc[]>;
}

export type SyncStatus =
  | { state: 'offline' }
  | { state: 'syncing' }
  | { state: 'ok'; at: string; members: number }
  | { state: 'error'; message: string };
