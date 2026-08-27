import { Haptics, ImpactStyle } from '@capacitor/haptics';

/** A light tap on the daily-log celebration. Native devices feel it; the web
 * plugin no-ops gracefully where the platform has nothing to vibrate. */
export function celebrateTap(): void {
  void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}
