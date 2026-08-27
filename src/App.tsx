import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Feed } from './screens/Feed';
import { Finale } from './screens/Finale';
import { Group } from './screens/Group';
import { Home } from './screens/Home';
import { Log } from './screens/Log';
import { Onboard } from './screens/Onboard';
import { Settings } from './screens/Settings';
import { useNotifications } from './platform/notifications';
import { useRun } from './store/run';
import './ui/tokens.css';

type View = 'home' | 'log' | 'group' | 'feed' | 'settings' | 'finale';

/** Pull other members' documents periodically and when the app regains focus. */
const SYNC_INTERVAL_MS = 60_000;

export function App() {
  const hydrate = useRun((s) => s.hydrate);
  const hydrated = useRun((s) => s.hydrated);
  const group = useRun((s) => s.group);
  const sync = useRun((s) => s.sync);
  const syncNow = useRun((s) => s.syncNow);

  const [view, setView] = useState<View>('home');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!group || !sync) return;
    const tick = () => void syncNow();
    const id = setInterval(tick, SYNC_INTERVAL_MS);
    // Coming back to the app is the moment a stale group number is most visible.
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [group, sync, syncNow]);

  useNotifications();

  if (!hydrated) return null;
  if (!group) return <Onboard onDone={() => setView('home')} />;

  const home = () => setView('home');

  return (
    <AnimatePresence mode="wait">
      {view === 'home' && (
        <Home
          key="home"
          onLog={() => setView('log')}
          onGroup={() => setView('group')}
          onFeed={() => setView('feed')}
          onSettings={() => setView('settings')}
        />
      )}
      {view === 'log' && <Log key="log" onDone={home} onCancel={home} />}
      {view === 'group' && <Group key="group" onBack={home} />}
      {view === 'feed' && <Feed key="feed" onBack={home} />}
      {view === 'settings' && <Settings key="settings" onBack={home} />}
      {view === 'finale' && <Finale key="finale" onBack={home} />}
    </AnimatePresence>
  );
}
