/**
 * The icon set — inline stroke SVGs, matching Buddy's convention of hand-drawn
 * inline SVG everywhere (see Buddy.tsx): no icon font, no icon library, no
 * image assets. Every icon takes the same two props and inherits color from
 * its surrounding text via `currentColor`, so a single CSS color rule (e.g.
 * `.tabbar__item.is-active`) still recolors it same as the emoji it replaces.
 */

interface IconProps {
  size?: number;
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function HomeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function CameraIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  );
}

export function TrophyIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a4 4 0 0 0 4 4M17 5h3v2a4 4 0 0 1-4 4" />
      <path d="M12 14v3" />
      <path d="M8.5 20.5h7" />
      <path d="M9.5 17.5h5l.6 3h-6.2z" />
    </svg>
  );
}

export function GearIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 4.2v2.1M12 17.7v2.1M4.2 12h2.1M17.7 12h2.1M6.6 6.6l1.5 1.5M15.9 15.9l1.5 1.5M17.4 6.6l-1.5 1.5M8.1 15.9l-1.5 1.5" />
    </svg>
  );
}

export function HeartIcon({ size = 20, className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      className={className}
      fill={filled ? 'currentColor' : 'none'}
    >
      <path d="M12 20s-7.5-4.6-9.7-9.3C.7 7.3 2.4 4 5.8 4c2 0 3.4 1.2 4.2 2.3C10.8 5.2 12.2 4 14.2 4c3.4 0 5.1 3.3 3.5 6.7C19.5 15.4 12 20 12 20z" />
    </svg>
  );
}

export function PlusIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M12 4.5v15M4.5 12h15" />
    </svg>
  );
}

export function TargetIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function MedalIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M8.5 3h7l-2.6 6.4h-1.8z" />
      <circle cx="12" cy="14.5" r="6" />
      <path d="M12 11.5v3.6l2.6 1.6" />
    </svg>
  );
}

export function ScaleIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M12 3.5v17M7 20.5h10" />
      <path d="M5 8.5h5M14 8.5h5" />
      <path d="M5 8.5 2.5 13a2.5 2.5 0 0 0 5 0z" />
      <path d="M19 8.5 16.5 13a2.5 2.5 0 0 0 5 0z" />
    </svg>
  );
}

export function RefreshIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5M19.5 12a7.5 7.5 0 0 1-12.6 5.5" />
      <path d="M17 3.5v3.5h-3.5M7 20.5V17h3.5" />
    </svg>
  );
}

export function HandshakeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M2.5 11.5 6 8l3.2 2.6a1.4 1.4 0 0 0 1.9-.1l.2-.2a1.4 1.4 0 0 1 1.9 0l3.1 3" />
      <path d="M8.5 13.6l2.1 2a1.3 1.3 0 0 0 1.8 0 1.3 1.3 0 0 0 1.8 0l.3-.3a1.3 1.3 0 0 0 1.8 0l1.9-1.9" />
      <path d="M2.5 11.5 5 9.3M21.5 12.9 18.5 10" />
    </svg>
  );
}

export function TicketIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M3.5 9a2 2 0 0 0 0-4V4h17v1a2 2 0 0 0 0 4v6a2 2 0 0 0 0 4v1h-17v-1a2 2 0 0 0 0-4z" />
      <path d="M14 5v14" strokeDasharray="2.4 2.4" />
    </svg>
  );
}

export function BellIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.3 5.3 1.3 5.3H4.7S6 14.5 6 10.5z" />
      <path d="M10.2 18.5a1.9 1.9 0 0 0 3.6 0" />
    </svg>
  );
}

export function HandsIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4 12.5c0-3 1.6-6 4.2-7.6M20 12.5c0-3-1.6-6-4.2-7.6" />
      <path d="M8.2 4.9v6.4M15.8 4.9v6.4" />
      <path d="M4 12.5c1 3.6 3.7 6.1 8 7.1 4.3-1 7-3.5 8-7.1" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M9 5.5 15.5 12 9 18.5" />
    </svg>
  );
}

export function XIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />
    </svg>
  );
}
