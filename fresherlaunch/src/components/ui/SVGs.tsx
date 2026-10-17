import React from 'react';

export function SquiggleUnderline({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full overflow-visible ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M3 14C35 4 60 16 95 9C130 2 165 15 200 8C235 1 260 14 277 8"
        stroke="#141414"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScribbleCircle({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M60 10C25 10 8 38 12 70C16 100 48 112 80 108C108 104 116 75 110 45C104 15 75 5 45 12"
        stroke="#141414"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AsteriskIcon({ className = 'w-6 h-6 text-ink' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="3.34" y1="7" x2="20.66" y2="17" />
      <line x1="3.34" y1="17" x2="20.66" y2="7" />
    </svg>
  );
}

export function StampBadge({ text = 'VERIFIED', rotation = '0deg', variant = 'ink' }: { text?: string; rotation?: string; variant?: 'tomato' | 'ink' | 'green' }) {
  const bgStyles =
    variant === 'tomato'
      ? 'bg-berry text-white'
      : variant === 'green'
      ? 'bg-mint text-ink'
      : 'bg-primary text-ink';

  return (
    <span
      style={{ transform: `rotate(${rotation})` }}
      className={`inline-block border-3 border-ink rounded-neo uppercase font-mono font-bold text-xs px-2.5 py-0.5 select-none shadow-ink ${bgStyles}`}
    >
      {text}
    </span>
  );
}
