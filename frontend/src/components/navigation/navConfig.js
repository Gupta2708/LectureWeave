import { LayoutDashboard, BookOpen, FileText } from 'lucide-react'

/** Primary app destinations. Only implemented, global routes belong here. */
export const APP_NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/my-notes', label: 'My Notes', icon: FileText },
]

/** Human labels for breadcrumb segments. */
export const SEGMENT_LABELS = {
  app: 'Dashboard',
  subjects: 'Subjects',
  'my-notes': 'My Notes',
  lecture: 'Notes',
  notes: 'Notes',
  setup: 'Set up lecture',
  chat: 'Chat',
  flashcards: 'Flashcards',
  quizzes: 'Quizzes',
  new: 'New',
}
