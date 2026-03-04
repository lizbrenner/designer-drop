import { Header } from './Header'

interface PageLayoutProps {
  children: React.ReactNode
  /** Kept for API compatibility; sidebar is no longer used. */
  withSidebar?: boolean
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="p-4 md:p-6">{children}</main>
    </div>
  )
}
