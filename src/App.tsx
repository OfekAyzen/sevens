import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Feed } from './screens/Feed';
import { Finale } from './screens/Finale';
import { Group } from './screens/Group';
import { Home } from './screens/Home';
import { Log } from './screens/Log';
import { Onboard } from './screens/Onboard';
import { Settings } from './screens/Settings';
import { WaitingToStart } from './screens/WaitingToStart';
import { useNotifications } from './platform/notifications';
import { useDerived } from './store/derived';
import { useRun } from './store/run';
import { TabBar, type Tab } from './ui/TabBar';
import './ui/tokens.css';

/** Pull other members' documents periodically and when the app regains focus. */
const SYNC_INTERVAL_MS = 60_000;

export function App() {
  const hydrate = useRun((s) => s.hydrate);
  const hydrated = useRun((s) => s.hydrated);
  const group = useRun((s) => s.group);
  const sync = useRun((s) => s.sync);
  const syncNow = useRun((s) => s.syncNow);
  const d = useDerived();

  const [tab, setTab] = useState<Tab>('home');
  const [logging, setLogging] = useState(false);

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
  if (!group) return <Onboard onDone={() => setTab('home')} />;

  // A group creator can set a future Day 1 (see Onboard.tsx's start-date
  // step) — before it arrives, nothing is loggable or postable for anyone
  // in the group, so there is no tab shell to show yet.
  if (d && !d.started) {
    return (
      <AnimatePresence mode="wait">
        <WaitingToStart key="waiting" />
      </AnimatePresence>
    );
  }

  // Day 7 is a showcase and Day 8+ a clean ending — both take over the whole
  // app rather than living behind a tab. See Finale.tsx's own doc comment.
  if (d && (d.day === 7 || d.finished)) {
    return (
      <AnimatePresence mode="wait">
        <Finale key="finale" onBack={() => setTab('home')} />
      </AnimatePresence>
    );
  }

  if (logging) {
    return (
      <AnimatePresence mode="wait">
        <Log key="log" onDone={() => setLogging(false)} onCancel={() => setLogging(false)} />
      </AnimatePresence>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <Home key="home" onLog={() => setLogging(true)} onSettings={() => setTab('settings')} />
          )}
          {tab === 'feed' && <Feed key="feed" />}
          {tab === 'group' && <Group key="group" />}
          {tab === 'settings' && <Settings key="settings" />}
        </AnimatePresence>
      </div>
      <TabBar active={tab} onSelect={setTab} />
    </div>
  );
}
