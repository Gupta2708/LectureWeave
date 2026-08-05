import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Dropdown, { DropdownItem } from '../ui/Dropdown'
import { cn } from '../../lib/utils'
import { initialsOf } from '../../lib/user'

export default function UserMenu({ compact = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const label = user?.username || user?.email || 'Account'

  return (
    <Dropdown
      align="end"
      trigger={({ toggle, props }) => (
        <button
          type="button"
          onClick={toggle}
          {...props}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 text-sm text-ink transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            {initialsOf(user)}
          </span>
          {!compact && (
            <span className="max-w-[10rem] truncate font-medium">{label}</span>
          )}
          <ChevronDown className="h-4 w-4 text-ink-faint" />
        </button>
      )}
    >
      <div className="border-b border-line px-3 py-2">
        <p className="truncate text-sm font-semibold text-ink">{label}</p>
        {user?.email && (
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
        )}
      </div>
      <div className="pt-1">
        <DropdownItem icon={<LogOut className="h-4 w-4" />} danger onClick={handleLogout}>
          Log out
        </DropdownItem>
      </div>
    </Dropdown>
  )
}

export function UserBlock({ className }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const label = user?.username || user?.email || 'Account'
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
        {initialsOf(user)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{label}</p>
        {user?.email && user?.username && (
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/login')
        }}
        aria-label="Log out"
        className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-subtle hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
