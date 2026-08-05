import React from 'react'

/**
 * LectureWeave mark: two woven strands (audio → structure) forming a "W"-like
 * knot, expressing "weaving a lecture into notes". Inherits currentColor by
 * default; pass `gradient` for the brand two-tone treatment.
 */
export default function Logo({ size = 28, gradient = true, className, title = 'LectureWeave' }) {
  const gid = React.useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {gradient && (
        <defs>
          <linearGradient id={gid} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--brand-500)" />
            <stop offset="1" stopColor="var(--accent-violet)" />
          </linearGradient>
        </defs>
      )}
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8"
        fill={gradient ? `url(#${gid})` : 'currentColor'}
        opacity={gradient ? 0.12 : 0.1}
      />
      <path
        d="M7 9c2.6 0 3.4 5.5 5.2 5.5S15 9 16 9s1 5.5 2.8 5.5S22.4 9 25 9"
        stroke={gradient ? `url(#${gid})` : 'currentColor'}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M7 18.5c2.6 0 3.4 4.5 5.2 4.5S15 18.5 16 18.5s1 4.5 2.8 4.5 3.6-4.5 6.2-4.5"
        stroke={gradient ? `url(#${gid})` : 'currentColor'}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}
