import { motion } from 'framer-motion';
import type { CSSProperties, ComponentType } from 'react';
import { copy } from '../domain/copy';
import { CameraIcon, HomeIcon, TrophyIcon, UserIcon } from './icons';
import { springSnap } from './motion';

export type Tab = 'home' | 'feed' | 'group' | 'settings';

const TABS: { id: Tab; Icon: ComponentType<{ size?: number }>; label: () => string; accent: string }[] = [
  { id: 'home', Icon: HomeIcon, label: () => copy.nav.tabHome, accent: 'var(--p1)' },
  { id: 'feed', Icon: CameraIcon, label: () => copy.nav.tabPosts, accent: 'var(--p4)' },
  { id: 'group', Icon: TrophyIcon, label: () => copy.nav.tabBoard, accent: 'var(--p3)' },
  { id: 'settings', Icon: UserIcon, label: () => copy.nav.tabSettings, accent: 'var(--p2)' },
];

/**
 * The persistent bottom tab bar. Design Revision — round 4: navigation used
 * to be a hub-and-spoke of "back to Home" buttons on every screen; Posts is
 * now a proper place you go, not a sub-screen you visit and leave.
 */
export function TabBar({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <motion.button
            key={tab.id}
            className={`tabbar__item ${isActive ? 'is-active' : ''}`}
            data-testid={`tab-${tab.id}`}
            onClick={() => onSelect(tab.id)}
            whileTap={{ scale: 0.92 }}
            transition={springSnap}
            style={isActive ? ({ '--tab-accent': tab.accent } as CSSProperties) : undefined}
          >
            <span className="tabbar__icon"><tab.Icon size={20} /></span>
            <span className="tabbar__label">{tab.label()}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
