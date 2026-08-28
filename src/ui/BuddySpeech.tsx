import type { ReactNode } from 'react';
import { Buddy, type BuddyState } from './Buddy';

/**
 * Buddy talking: a speech bubble anchored directly above his head, tail
 * pointing down into him. The shared layout behind every place Buddy has
 * something to say — onboarding, and the Home rules recap.
 */
export function BuddySpeech({
  children,
  state = 'happy',
  size = 96,
  hue,
  tappable = false,
  onTap,
  testId,
}: {
  children: ReactNode;
  state?: BuddyState;
  size?: number;
  hue?: string;
  tappable?: boolean;
  onTap?: () => void;
  testId?: string;
}) {
  return (
    <div className="buddy-speech">
      {tappable ? (
        <button
          className="speech-bubble speech-bubble--tappable"
          onClick={onTap}
          data-testid={testId}
        >
          {children}
        </button>
      ) : (
        <div className="speech-bubble" data-testid={testId}>
          {children}
        </div>
      )}
      <Buddy state={state} hue={hue} size={size} />
    </div>
  );
}
