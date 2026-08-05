import React, { useMemo } from 'react'
import rawLogo from '../../assets/logo.svg?raw'

/**
 * The LectureWeave mark (woven strands). Rendered inline from the source SVG
 * so the navy body can follow `currentColor` (adapts to light/dark surfaces)
 * while the teal accent is preserved. Set the colour via a `text-*` class or
 * the `color` prop on the wrapper.
 */
function prepare(raw) {
  return (
    raw
      // Navy body → currentColor so it adapts to the surrounding surface.
      .replace(/#231E4F/gi, 'currentColor')
      // Drop the intrinsic width/height; the wrapper controls the size.
      .replace(/\s(width|height)="\d+"/g, '')
      // Make the svg fill the wrapper box.
      .replace(/<svg /, '<svg width="100%" height="100%" style="display:block" ')
  )
}

export default function Logo({ size = 28, color, className, title = 'LectureWeave' }) {
  const html = useMemo(() => prepare(rawLogo), [])
  return (
    <span
      role="img"
      aria-label={title}
      className={className}
      style={{ width: size, height: size, color, display: 'inline-block', lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
