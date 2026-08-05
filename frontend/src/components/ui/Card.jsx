import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const VARIANTS = {
  default: 'bg-surface border border-line shadow-sm',
  interactive:
    'bg-surface border border-line shadow-sm transition-all duration-150 hover:shadow-md hover:border-line-strong',
  elevated: 'bg-surface border border-line shadow-lg',
  tinted: 'bg-brand-soft border border-brand-200',
  metric: 'bg-surface border border-line shadow-xs',
}

const Card = forwardRef(function Card(
  { variant = 'default', className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-2xl', VARIANTS[variant] ?? VARIANTS.default, className)}
      {...props}
    >
      {children}
    </div>
  )
})

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-5 pb-0', className)} {...props} />
}

export function CardBody({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

export default Card
