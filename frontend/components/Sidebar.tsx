'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'monitor_heart', href: '/' },
  { label: 'Domains', icon: 'language', href: '/domains' },
  { label: 'Mailboxes', icon: 'mail', href: '/mailboxes' },
  { label: 'Mail Queues', icon: 'stacked_line_chart', href: '/queues' },
  { label: 'System Services', icon: 'settings_input_component', href: '/services' },
  { label: 'Security', icon: 'security', href: '/security' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
  { label: 'Terminal', icon: 'terminal', href: '/terminal' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Hide sidebar on login page
  if (pathname === '/login') return null

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface-container-lowest flex flex-col z-50 border-r border-outline-variant/30">
      {/* Logo */}
      <div className="p-lg flex items-center gap-md">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[20px]">mail</span>
        </div>
        <span className="text-headline-sm text-primary tracking-tight font-semibold">MailOS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-md px-[4px]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-md px-lg py-sm transition-colors text-body-sm rounded-sm mb-[2px]',
                isActive
                  ? 'bg-primary/10 text-primary border-l-4 border-primary font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container-high border-l-4 border-transparent'
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer System Status & User Profile with Working Logout */}
      <div className="p-lg border-t border-outline-variant/20 bg-surface-container-low">
        <div className="flex items-center gap-sm mb-sm">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse absolute -top-0.5 -right-0.5"></div>
            <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
          </div>
          <span className="text-label-caps text-secondary uppercase tracking-widest font-bold">System Operational</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-on-surface leading-none">{user?.username || 'Admin'}</span>
              <span className="text-[10px] text-on-surface-variant">{user?.role || 'Superuser'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            title="Sign Out of MailOS"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
