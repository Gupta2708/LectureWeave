import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500',
  secondary:
    'bg-surface-subtle text-ink hover:bg-surface-muted active:bg-surface-muted border border-line',
  ghost:
    'bg-transparent text-ink-soft hover:bg-surface-subtle hover:text-ink',
  outline:
    'bg-transparent text-ink border border-line hover:border-brand-400 hover:text-brand-700',
  destructive:
    'bg-danger text-white hover:brightness-95 active:brightness-90',
  success:
    'bg-success text-white hover:brightness-95 active:brightness-90',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-[10px]',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
}

const ICON_SIZES = {
  sm: 'h-8 w-8 rounded-[10px]',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-xl',
}

const Button = forwardRef(function Button(
  {
    as: Comp = 'button',
    variant = 'primary',
    size = 'md',
    iconOnly = false,
    loading = false,
    leftIcon = null,
    rightIcon = null,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <Comp
      ref={ref}
      disabled={Comp === 'button' ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant] ?? VARIANTS.primary,
        iconOnly ? ICON_SIZES[size] : SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {iconOnly ? (loading ? null : children) : children}
      {!loading && rightIcon}
    </Comp>
  )
})

export default Button
