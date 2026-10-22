import React from 'react';

type Props = Readonly<{ size?: number; strokeWidth?: number; color?: string }>;

/** Clipboard with an "M" and a down arrow: the app mark from the design. */
export default function LogoMark({ size = 20, strokeWidth = 2, color = 'currentColor' }: Props) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M8 17v-6l2 3 2-3v6" />
      <path d="M15 11v6m-2-2 2 2 2-2" />
    </svg>
  );
}
