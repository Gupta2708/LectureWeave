import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Plus } from 'lucide-react'
import Wordmark from '../brand/Wordmark'
import Breadcrumbs from './Breadcrumbs'
import UserMenu from './UserMenu'
import Button from '../ui/Button'

/**
 * Sticky utility bar for the app shell. On desktop it shows breadcrumbs + a
 * primary "New lecture" action + the user menu. On mobile it collapses to a
 * hamburger + wordmark + user menu. Deliberately slim so it complements (does
 * not duplicate) each page's own title header during the migration.
 */
export default function AppTopbar({ onOpenMobileNav }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="rounded-lg p-2 text-ink-soft hover:bg-surface-subtle lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="lg:hidden">
        <Wordmark size={24} />
      </div>

      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/subjects')}
          className="hidden sm:inline-flex"
        >
          New lecture
        </Button>
        <UserMenu compact />
      </div>
    </header>
  )
}
