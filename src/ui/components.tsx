import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { itemVariants, listVariants, pressable, screenVariants, spring } from './motion';
import './components.css';

export function Screen({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <motion.main
      className="screen"
      data-testid={testId}
      variants={screenVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.main>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  testId,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'quiet' | 'plain';
  testId?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      className={`btn btn--${variant}`}
      onClick={onClick}
      data-testid={testId}
      disabled={disabled}
      {...pressable}
    >
      {children}
    </motion.button>
  );
}

/**
 * The hero number: the group total.
 *
 * This is the largest element in the application, everywhere it appears. That is
 * a product invariant, not a style choice — a decorative group goal next to a
 * prominent leaderboard gives you all of the social-comparison harm and none of
 * the cooperative benefit.
 */
export function GroupNumber({ total, target }: { total: number; target: number }) {
  return (
    <div className="hero" data-testid="group-number">
      <motion.div
        className="hero__value"
        key={total}
        initial={{ scale: 0.94, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
      >
        {total}
      </motion.div>
      <div className="hero__of">of {target}</div>
      <Meter value={total} max={target} />
    </div>
  );
}

/** A bar that only ever fills. It has no empty-and-falling state to render. */
export function Meter({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="meter" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <motion.div
        className="meter__fill"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ ...spring, mass: 1.2 }}
      />
    </div>
  );
}

/** Seven cells. A day with nothing in it is simply empty — no cross, no colour. */
export function DayStrip({
  today,
  covered,
  onPick,
}: {
  today: number;
  covered: Set<number>;
  onPick?: (day: number) => void;
}) {
  return (
    <motion.ol className="strip" variants={listVariants} initial="initial" animate="enter">
      {[1, 2, 3, 4, 5, 6, 7].map((d) => {
        const state = covered.has(d) ? 'done' : d === today ? 'today' : d < today ? 'open' : 'future';
        return (
          <motion.li key={d} variants={itemVariants}>
            <button
              className={`cell cell--${state}`}
              data-testid={`day-${d}`}
              data-state={state}
              onClick={onPick ? () => onPick(d) : undefined}
              aria-label={`Day ${d}`}
            >
              {d}
            </button>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

export function Card({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <motion.section className="card" variants={itemVariants} data-testid={testId}>
      {children}
    </motion.section>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <button
      className="toggle"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__label">{label}</span>
      <span className={`toggle__track ${checked ? 'is-on' : ''}`}>
        <motion.span className="toggle__knob" layout transition={spring} />
      </span>
    </button>
  );
}
