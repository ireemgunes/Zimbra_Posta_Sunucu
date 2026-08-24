'use client'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isStandalonePage = pathname === '/login' || pathname.startsWith('/webmail')

  if (isStandalonePage) {
    return <main className="min-h-screen w-full bg-surface">{children}</main>
  }

  return (
    <>
      <Sidebar />
      <div className="pl-[260px]">
        <Header />
        <main className="relative pt-16 min-h-screen bg-surface">
          {children}
        </main>
      </div>
    </>
  )
}
