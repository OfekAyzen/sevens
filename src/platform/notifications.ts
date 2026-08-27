import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { copy } from '../domain/copy';
import { plannedNotifications } from '../domain/notify';
import { useDerived } from '../store/derived';

/**
 * Notification scheduling.
 *
 * The hard rules live in `src/domain/notify.ts` as pure functions so they can be
 * tested without a device: at most two per person per day, the cue reminder is
 * suppressed once today is logged, and the peer digest is suppressed when nobody
 * practised.
 *
 * This hook is only the delivery mechanism. It cancels and reschedules on every
 * relevant change rather than accumulating, because a duplicate reminder is worse
 * than a missing one — it is the app failing to notice what the person did.
 */
export function useNotifications(now: Date = new Date()): void {
  const d = useDerived(now);
  const key = d
    ? JSON.stringify([
        d.day,
        d.myDoc.declaration.reminderTime,
        d.myDoc.declaration.cue,
        d.covered.has(d.day),
        d.members.map((m) => m.logs.filter((l) => l.practised).length),
      ])
    : null;

  useEffect(() => {
    if (!d || !key) return;
    let cancelled = false;

    async function schedule() {
      try {
        const permission = await LocalNotifications.checkPermissions();
        if (permission.display !== 'granted') {
          const asked = await LocalNotifications.requestPermissions();
          if (asked.display !== 'granted') return;
        }

        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }
        if (cancelled || !d) return;

        const planned = plannedNotifications(d.myDoc, d.members, d.day, d.total, now);
        if (planned.length === 0) return;

        await LocalNotifications.schedule({
          notifications: planned.map((n, i) => ({
            id: i + 1,
            title: copy.appName,
            body: n.body,
            schedule: { at: n.at },
          })),
        });
      } catch {
        // No notification support (browser, or permission permanently denied).
        // The app is fully usable without it; this is an enhancement, not a
        // dependency.
      }
    }

    void schedule();
    return () => {
      cancelled = true;
    };
    // `now` is deliberately not a dependency — see the key above, which captures
    // everything that should actually cause a reschedule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
