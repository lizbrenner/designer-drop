import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface PageLayoutProps {
  children: React.ReactNode
  /** If true, sidebar is shown (e.g. home, my-drops). Default true. */
  withSidebar?: boolean
}

export function PageLayout({ children, withSidebar = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="flex">
        {withSidebar && <Sidebar />}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
