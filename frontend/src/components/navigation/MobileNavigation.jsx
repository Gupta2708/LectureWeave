import React from 'react'
import { NavLink } from 'react-router-dom'
import Drawer from '../ui/Drawer'
import { UserBlock } from './UserMenu'
import { APP_NAV } from './navConfig'
import { cn } from '../../lib/utils'

/** Slide-out primary navigation for small screens. */
export default function MobileNavigation({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left" width="w-[17rem]">
      <nav className="space-y-1">
        {APP_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-soft text-brand-700'
                  : 'text-ink-soft hover:bg-surface-subtle hover:text-ink',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 border-t border-line pt-4">
        <UserBlock />
      </div>
    </Drawer>
  )
}
