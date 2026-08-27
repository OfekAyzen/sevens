import { create } from 'zustand';
import { assemble, emptyLog, withResolvedSupport } from '../domain/assemble';
import type {
  DayLog,
  Declaration,
  Group,
  MemberDoc,
  PersonId,
  Post,
  Reaction,
  RunDay,
  RunState,
} from '../domain/types';
import { supabaseBackend } from '../sync/supabase';
import type { SyncConfig, SyncStatus } from '../sync/types';
import { clearAll, loadRaw, saveRaw } from './persist';

interface Persisted {
  group: Group | null;
  me: PersonId | null;
  myDoc: MemberDoc | null;
  members: MemberDoc[];
  sync: SyncConfig | null;
}

interface Store extends Persisted {
  hydrated: boolean;
  status: SyncStatus;

  hydrate: () => Promise<void>;
  createGroup: (
    code: string,
    startDate: string,
    displayName: string,
    declaration: Declaration,
  ) => Promise<void>;
  joinGroup: (
    code: string,
    startDate: string,
    displayName: string,
    declaration: Declaration,
  ) => Promise<void>;

  saveLog: (day: RunDay, patch: Partial<DayLog>) => Promise<void>;
  addPost: (day: RunDay, caption: string, image?: string) => Promise<void>;
  react: (post: Post, emoji: string, day: RunDay) => Promise<void>;
  spendToken: (day: RunDay) => Promise<void>;
  lowerMinimum: (minutes: number) => Promise<void>;
  setReminder: (time: string | null) => Promise<void>;
  configureSync: (sync: SyncConfig | null) => Promise<void>;
  exportAll: () => Promise<void>;
  syncNow: () => Promise<void>;
  reset: () => Promise<void>;

  /** The assembled shared state every domain function consumes. */
  runState: () => RunState | null;
  /** Members with cross-document support reactions stitched in. */
  resolvedMembers: () => MemberDoc[];
}

/**
 * Merge a pulled set with the local copy.
 *
 * Our own document is always authoritative locally: the server never overwrites
 * work this device has done but not yet pushed. Every other member is
 * last-write-wins on their own row, which is safe because nobody but that person
 * ever writes it.
 */
function mergeMembers(local: MemberDoc[], remote: MemberDoc[], me: PersonId | null): MemberDoc[] {
  const byId = new Map<PersonId, MemberDoc>();
  for (const doc of local) byId.set(doc.personId, doc);
  for (const doc of remote) {
    if (doc.personId === me) continue;
    const existing = byId.get(doc.personId);
    if (!existing || doc.updatedAt >= existing.updatedAt) byId.set(doc.personId, doc);
  }
  return [...byId.values()].sort((a, b) => a.personId.localeCompare(b.personId));
}

function newDoc(displayName: string, declaration: Declaration): MemberDoc {
  return {
    personId: declaration.personId,
    displayName,
    declaration,
    logs: [],
    token: { personId: declaration.personId, spentOnDay: null },
    posts: [],
    reactions: [],
    updatedAt: new Date().toISOString(),
  };
}

export const useRun = create<Store>((set, get) => {
  async function persist() {
    const { group, me, myDoc, members, sync } = get();
    await saveRaw(JSON.stringify({ group, me, myDoc, members, sync } satisfies Persisted));
  }

  /**
   * Write our own document locally first, then push it. A failed push surfaces as
   * a status but never loses the edit — someone logging on a train keeps their
   * session and it uploads on the next sync.
   */
  async function commit(next: MemberDoc) {
    const stamped: MemberDoc = { ...next, updatedAt: new Date().toISOString() };
    set((s) => ({
      myDoc: stamped,
      members: mergeMembers(
        [stamped, ...s.members.filter((m) => m.personId !== stamped.personId)],
        [],
        s.me,
      ),
    }));
    await persist();

    const { group, sync } = get();
    if (!group || !sync) return;
    try {
      await supabaseBackend(sync).push(group.code, stamped);
      set({ status: { state: 'ok', at: new Date().toISOString(), members: get().members.length } });
    } catch (e) {
      set({ status: { state: 'error', message: (e as Error).message } });
    }
  }

  return {
    group: null,
    me: null,
    myDoc: null,
    members: [],
    sync: null,
    hydrated: false,
    status: { state: 'offline' },

    async hydrate() {
      const raw = await loadRaw();
      if (!raw) return set({ hydrated: true });
      try {
        const p = JSON.parse(raw) as Persisted;
        set({
          group: p.group ?? null,
          me: p.me ?? null,
          myDoc: p.myDoc ?? null,
          members: p.members ?? [],
          sync: p.sync ?? null,
          hydrated: true,
        });
        if (p.sync && p.group) void get().syncNow();
      } catch {
        set({ hydrated: true });
      }
    },

    async createGroup(code, startDate, displayName, declaration) {
      const doc = newDoc(displayName, declaration);
      set({ group: { code, startDate }, me: doc.personId, myDoc: doc, members: [doc] });
      await persist();
      await get().syncNow();
    },

    async joinGroup(code, startDate, displayName, declaration) {
      const doc = newDoc(displayName, declaration);
      set({ group: { code, startDate }, me: doc.personId, myDoc: doc, members: [doc] });
      await persist();
      await get().syncNow();
    },

    async saveLog(day, patch) {
      const { myDoc, me } = get();
      if (!myDoc || !me) return;
      const existing = myDoc.logs.find((l) => l.day === day) ?? emptyLog(me, day);
      const log: DayLog = { ...existing, ...patch, personId: me, day };
      await commit({ ...myDoc, logs: [...myDoc.logs.filter((l) => l.day !== day), log] });
    },

    async addPost(day, caption, image) {
      const { myDoc, me } = get();
      if (!myDoc || !me) return;
      const post: Post = {
        id: `${me}-${day}-${Date.now().toString(36)}`,
        personId: me,
        day,
        caption,
        image,
        createdAt: new Date().toISOString(),
      };
      const log = myDoc.logs.find((l) => l.day === day) ?? emptyLog(me, day);
      await commit({
        ...myDoc,
        posts: [...myDoc.posts, post],
        logs: [
          ...myDoc.logs.filter((l) => l.day !== day),
          { ...log, proofPostIds: [...log.proofPostIds, post.id] },
        ],
      });
    },

    async react(post, emoji, day) {
      const { myDoc, me } = get();
      // Reacting to your own post is not support and never scores.
      if (!myDoc || !me || post.personId === me) return;
      const already = myDoc.reactions.some((r) => r.postId === post.id);
      const reactions: Reaction[] = already
        ? myDoc.reactions.filter((r) => r.postId !== post.id)
        : [...myDoc.reactions, { postId: post.id, targetPersonId: post.personId, day, emoji }];
      await commit({ ...myDoc, reactions });
    },

    async spendToken(day) {
      const { myDoc } = get();
      // One tap, no confirmation dialog. Friction on an off-ramp turns it back
      // into pressure, which is the opposite of what the token exists for.
      if (!myDoc || myDoc.token.spentOnDay !== null) return;
      await commit({ ...myDoc, token: { ...myDoc.token, spentOnDay: day } });
    },

    async lowerMinimum(minutes) {
      const { myDoc } = get();
      if (!myDoc) return;
      // Lowering only, ever. Raising after Day 1 would allow point farming by
      // re-declaration, and would punish the person who set an honest floor.
      const next = Math.min(myDoc.declaration.minimumMinutes, Math.max(1, minutes));
      await commit({ ...myDoc, declaration: { ...myDoc.declaration, minimumMinutes: next } });
    },

    async setReminder(time) {
      const { myDoc } = get();
      if (!myDoc) return;
      await commit({ ...myDoc, declaration: { ...myDoc.declaration, reminderTime: time } });
    },

    async configureSync(sync) {
      set({ sync });
      await persist();
      if (sync) await get().syncNow();
      else set({ status: { state: 'offline' } });
    },

    /**
     * Hand everything back before anything is deleted. Offered on Day 8 and in
     * settings — the artefacts and reflections are the only part of this week
     * worth keeping, and they should never be destroyed without an export first.
     */
    async exportAll() {
      const { group, members } = get();
      const blob = new Blob([JSON.stringify({ group, members }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sevens-${group?.code ?? 'export'}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },

    async syncNow() {
      const { group, sync, me, myDoc, members } = get();
      if (!group || !sync) return set({ status: { state: 'offline' } });
      set({ status: { state: 'syncing' } });
      try {
        const backend = supabaseBackend(sync);
        if (myDoc) await backend.push(group.code, myDoc);
        const remote = await backend.pull(group.code);
        const merged = mergeMembers(members, remote, me);
        set({
          members: merged,
          status: { state: 'ok', at: new Date().toISOString(), members: merged.length },
        });
        await persist();
      } catch (e) {
        set({ status: { state: 'error', message: (e as Error).message } });
      }
    },

    async reset() {
      await clearAll();
      set({
        group: null,
        me: null,
        myDoc: null,
        members: [],
        sync: null,
        status: { state: 'offline' },
      });
    },

    runState() {
      const { group, members } = get();
      if (!group || members.length === 0) return null;
      return assemble(group, withResolvedSupport(members));
    },

    resolvedMembers() {
      return withResolvedSupport(get().members);
    },
  };
});
