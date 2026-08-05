import React from 'react'
import { cn } from '../../lib/utils'

/** Shimmer placeholder. Match the eventual content's shape via className. */
export default function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn('lw-skeleton rounded-lg', className)}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}
