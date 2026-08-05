/** Display helpers for the current user. Kept out of component files so
 *  React Fast Refresh stays happy (component modules should export only
 *  components). */
export function initialsOf(user) {
  const name = user?.username || user?.email || 'U'
  return name.trim().slice(0, 1).toUpperCase()
}
