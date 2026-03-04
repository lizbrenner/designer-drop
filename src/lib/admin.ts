/**
 * Admin check for digest publish/settings. Set VITE_ADMIN_USER_IDS (comma-separated) in .env.
 * If unset, current-user-1 is treated as admin for local dev.
 */
export function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false
  const ids = import.meta.env.VITE_ADMIN_USER_IDS as string | undefined
  const list = ids ? ids.split(',').map((s) => s.trim()).filter(Boolean) : []
  if (list.length === 0) {
    return userId === 'current-user-1'
  }
  return list.includes(userId)
}
