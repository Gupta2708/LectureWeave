import React from 'react'
import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Wordmark from '../brand/Wordmark'
import Logo from '../brand/Logo'
import { UserBlock } from './UserMenu'
import { APP_NAV } from './navConfig'
import { cn } from '../../lib/utils'
import Tooltip from '../ui/Tooltip'

export default function AppSidebar({ collapsed, onToggleCollapse }) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface lg:flex',
        collapsed ? 'w-[76px]' : 'w-64',
        'transition-[width] duration-200',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-line px-4', collapsed && 'justify-center px-0')}>
        {collapsed ? <Logo size={30} /> : <Wordmark />}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {APP_NAV.map(({ to, label, icon: Icon }) => {
          const link = (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-brand-soft text-brand-700'
                    : 'text-ink-soft hover:bg-surface-subtle hover:text-ink',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          )
          return collapsed ? (
            <Tooltip key={to} label={label} side="right">
              {link}
            </Tooltip>
          ) : (
            link
          )
        })}
      </nav>

      <div className="border-t border-line p-3">
        {!collapsed && <UserBlock className="mb-2" />}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
