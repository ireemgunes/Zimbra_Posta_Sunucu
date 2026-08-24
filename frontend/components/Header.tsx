'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { useTheme } from '@/context/ThemeContext'
import { copyText } from '@/lib/clipboard'

const PAGE_NAMES: Record<string, string> = {
  '/': 'System Telemetry',
  '/domains': 'Domain Management',
  '/mailboxes': 'Mailbox Management',
  '/queues': 'Mail Queues Monitoring',
  '/services': 'System Services',
  '/security': 'Security & Firewall',
  '/settings': 'Global Settings',
  '/terminal': 'Administration Terminal',
}

interface SearchItem {
  label: string
  subtitle: string
  path: string
  category: 'Page' | 'Domain' | 'Mailbox' | 'Service' | 'Queue' | 'Security' | 'Setting'
  icon: string
  badgeColor: string
}

const GLOBAL_SEARCH_INDEX: SearchItem[] = [
  // 1. Pages
  { label: 'System Telemetry & Health Dashboard', subtitle: 'Live CPU, RAM, Network I/O, Thermal metrics', path: '/', category: 'Page', icon: 'monitor_heart', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'Domain Management & DNS Health', subtitle: 'Manage active domains, MX, SPF, DKIM, DMARC', path: '/domains', category: 'Page', icon: 'language', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'Mailbox Accounts & Storage Quotas', subtitle: 'User mailboxes, aliases, forwarding, webmail', path: '/mailboxes', category: 'Page', icon: 'mail', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'Mail Queues & Postfix Log Viewer', subtitle: 'Active, deferred, hold queues and retry controls', path: '/queues', category: 'Page', icon: 'stacked_line_chart', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'System Services & Daemons', subtitle: 'Postfix, Dovecot, Rspamd daemon statuses', path: '/services', category: 'Page', icon: 'settings_input_component', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'Security, Firewall & Spam Quarantine', subtitle: 'Firewall rules, SSL certificates, Fail2Ban, IP blocks', path: '/security', category: 'Page', icon: 'security', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'Global Server Settings & Backup', subtitle: 'SMTP relay, IMAP/POP3, Mail delivery test, API keys', path: '/settings', category: 'Page', icon: 'settings', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'Administration CLI Terminal', subtitle: 'Interactive shell with zmcontrol, zmprov, mailq', path: '/terminal', category: 'Page', icon: 'terminal', badgeColor: 'bg-primary/20 text-primary' },

  // 2. Domains
  { label: 'acmecorp.com', subtitle: 'Primary Corporate Domain • 1,245 Mailboxes • All DNS Valid', path: '/domains', category: 'Domain', icon: 'domain', badgeColor: 'bg-secondary/20 text-secondary' },
  { label: 'globex.io', subtitle: 'Domain with DNS Issues • 8 Mailboxes • DKIM/DMARC Warning', path: '/domains', category: 'Domain', icon: 'domain', badgeColor: 'bg-error/20 text-error' },
  { label: 'mail.starkindustries.com', subtitle: 'Enterprise Node • 9,442 Mailboxes • Fully Verified', path: '/domains', category: 'Domain', icon: 'domain', badgeColor: 'bg-secondary/20 text-secondary' },
  { label: 'mailos.local', subtitle: 'Internal Cluster Domain • Zimbra 10.0 Root', path: '/domains', category: 'Domain', icon: 'domain', badgeColor: 'bg-secondary/20 text-secondary' },

  // 3. Mailboxes & Accounts
  { label: 'admin@example.com', subtitle: 'System Administrator • Quota: 4.2 / 10 GB • 3 Aliases', path: '/mailboxes', category: 'Mailbox', icon: 'account_circle', badgeColor: 'bg-tertiary/20 text-tertiary' },
  { label: 'sales@example.com', subtitle: 'Shared Mailbox • Quota: 48.5 / 50 GB • IMAP & POP3 Active', path: '/mailboxes', category: 'Mailbox', icon: 'account_circle', badgeColor: 'bg-tertiary/20 text-tertiary' },
  { label: 'j.doe@example.com', subtitle: 'Former Employee • Suspended Account • 2.1 GB', path: '/mailboxes', category: 'Mailbox', icon: 'account_circle', badgeColor: 'bg-surface-container-highest text-on-surface-variant' },
  { label: 'all@example.com', subtitle: 'Distribution List • 42 Employee Recipients', path: '/mailboxes', category: 'Mailbox', icon: 'group', badgeColor: 'bg-tertiary/20 text-tertiary' },
  { label: 'devs@example.com', subtitle: 'Engineering Group • 14 Member Accounts', path: '/mailboxes', category: 'Mailbox', icon: 'group', badgeColor: 'bg-tertiary/20 text-tertiary' },
  { label: 'postmaster@mailos.local', subtitle: 'Default System Postmaster Alias', path: '/mailboxes', category: 'Mailbox', icon: 'mail', badgeColor: 'bg-tertiary/20 text-tertiary' },

  // 4. Services
  { label: 'Postfix MTA (postfix.service)', subtitle: 'Active • 2.4% CPU • 128 MB RAM • Port 25, 587, 465', path: '/services', category: 'Service', icon: 'mail', badgeColor: 'bg-secondary/20 text-secondary' },
  { label: 'Dovecot IMAP/POP3 (dovecot.service)', subtitle: 'Active • 1.8% CPU • 256 MB RAM • Port 143, 993, 110, 995', path: '/services', category: 'Service', icon: 'move_to_inbox', badgeColor: 'bg-secondary/20 text-secondary' },
  { label: 'Rspamd Spam Filter (rspamd.service)', subtitle: 'High Load Detected • 85.2% CPU • 512 MB RAM', path: '/services', category: 'Service', icon: 'security', badgeColor: 'bg-tertiary/20 text-tertiary' },
  { label: 'ClamAV Antivirus Daemon', subtitle: 'Antivirus content scanner for mail attachments', path: '/services', category: 'Service', icon: 'extension', badgeColor: 'bg-primary/20 text-primary' },

  // 5. Queues
  { label: 'Active Mail Queue', subtitle: '1,492 messages currently being processed and routed', path: '/queues', category: 'Queue', icon: 'mark_email_unread', badgeColor: 'bg-secondary/20 text-secondary' },
  { label: 'Deferred Mail Queue', subtitle: '348 messages queued for retry due to temporary recipient delays', path: '/queues', category: 'Queue', icon: 'schedule_send', badgeColor: 'bg-tertiary/20 text-tertiary' },
  { label: 'Queue ID: F6G7H8I9J0', subtitle: 'Deferred • marketing@domain.com -> bounce-handler@service.io', path: '/queues', category: 'Queue', icon: 'email', badgeColor: 'bg-tertiary/20 text-tertiary' },
  { label: 'Queue ID: A1B2C3D4E5', subtitle: 'Active • alerts@system.local -> admin@external.net', path: '/queues', category: 'Queue', icon: 'email', badgeColor: 'bg-secondary/20 text-secondary' },

  // 6. Security & Quarantine
  { label: 'Active Firewall Rules (iptables)', subtitle: 'Inbound / Outbound access rules for SMTP, IMAP, SSH, Web', path: '/security', category: 'Security', icon: 'shield', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'SSL/TLS Certificate: mail.domain.com', subtitle: "Let's Encrypt Authority X3 • Expires in 42 days", path: '/security', category: 'Security', icon: 'verified', badgeColor: 'bg-secondary/20 text-secondary' },
  { label: 'Spam Quarantine Manager', subtitle: 'Intercepted phishing and high-score spam messages', path: '/security', category: 'Security', icon: 'block', badgeColor: 'bg-error/20 text-error' },
  { label: 'Fail2Ban Jails & SSH Protection', subtitle: 'Monitoring brute force attempts across sshd, postfix, dovecot', path: '/security', category: 'Security', icon: 'lock', badgeColor: 'bg-tertiary/20 text-tertiary' },

  // 7. Settings & Tools
  { label: 'Mail Delivery Tester (SMTP Ping)', subtitle: 'Send test email ping to verify delivery handshake latency', path: '/settings', category: 'Setting', icon: 'send', badgeColor: 'bg-secondary/20 text-secondary' },
  { label: 'Backup & Disaster Recovery', subtitle: 'Create .tar.gz snapshots of mailboxes and LDAP databases', path: '/settings', category: 'Setting', icon: 'cloud_upload', badgeColor: 'bg-primary/20 text-primary' },
  { label: 'REST API Secret Keys & Swagger Docs', subtitle: 'API tokens for programmatic mail server administration', path: '/settings', category: 'Setting', icon: 'key', badgeColor: 'bg-primary/20 text-primary' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { addToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const { isDark, toggleTheme } = useTheme()

  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const activeTitle = PAGE_NAMES[pathname] || 'Dashboard'

  if (pathname === '/login') return null

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Comprehensive multi-field search filter
  const filteredSearch = GLOBAL_SEARCH_INDEX.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      item.label.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  })

  const handleRestart = async () => {
    setIsRestarting(true)
    setTimeout(() => {
      setIsRestarting(false)
      setIsRestartModalOpen(false)
      addToast(
        'Services Restarted Successfully',
        'Zimbra MTA, Postfix, Dovecot, and Nginx daemons reloaded in 1.4s.',
        'success'
      )
    }, 1500)
  }

  const copyCliCommand = async (cmd: string) => {
    const success = await copyText(cmd)
    if (success) {
      setCopiedCmd(cmd)
      addToast('Command Copied', `"${cmd}" copied to clipboard.`, 'success')
      setTimeout(() => setCopiedCmd(null), 2000)
    } else {
      addToast('Copy Failed', 'Please copy manually.', 'error')
    }
  }

  return (
    <>
      <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface/80 backdrop-blur-xl z-40 px-lg flex items-center justify-between border-b border-outline-variant/10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-md">
          <span className="text-body-sm text-on-surface-variant">Root</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">chevron_right</span>
          <span className="text-body-sm text-on-surface font-bold">{activeTitle}</span>
        </div>

        {/* Global Search with Dynamic Multi-Entity Index */}
        <div className="flex items-center gap-lg flex-1 max-w-2xl px-xl relative" ref={searchRef}>
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-surface-container-high border-none rounded-lg pl-11 pr-md py-xs text-body-sm focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface placeholder:text-on-surface-variant font-medium"
              placeholder="Search domains (acme...), mailboxes (sales...), services, queues, or logs..."
              type="text"
            />
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-xl right-xl mt-xs bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 flex flex-col">
              <div className="px-md py-xs bg-surface-container border-b border-outline-variant/20 flex justify-between items-center">
                <span className="text-[11px] font-mono text-on-surface-variant uppercase font-bold">
                  Global Search Results ({filteredSearch.length})
                </span>
                <span className="text-[11px] text-on-surface-variant">Click to navigate</span>
              </div>
              <div className="overflow-y-auto p-xs flex flex-col gap-1">
                {filteredSearch.length > 0 ? (
                  filteredSearch.slice(0, 10).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        router.push(item.path)
                        setIsSearchOpen(false)
                        setSearchQuery('')
                        addToast(`Navigated to ${item.category}`, item.label, 'info')
                      }}
                      className="w-full flex items-center gap-md px-md py-sm rounded-lg hover:bg-surface-container-highest transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest group-hover:bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm">
                          <span className="text-body-sm text-on-surface font-semibold truncate">{item.label}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                            {item.category}
                          </span>
                        </div>
                        <div className="text-code-sm text-on-surface-variant truncate">{item.subtitle}</div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-[16px] group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                        arrow_forward
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-lg text-center text-on-surface-variant text-body-sm">
                    No matching domains, mailboxes, or services found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-md">
          {/* Restart Services Button */}
          <button
            onClick={() => setIsRestartModalOpen(true)}
            className="flex items-center gap-xs px-md py-xs bg-error-container text-on-error-container rounded-lg hover:brightness-110 transition-all text-label-caps font-bold shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            Restart Services
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors relative"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="w-2 h-2 rounded-full bg-primary absolute top-1 right-1"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-xs w-80 bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-2xl p-sm z-50 flex flex-col gap-xs">
                <div className="flex items-center justify-between px-sm py-xs border-b border-outline-variant/20">
                  <span className="text-body-sm font-bold text-on-surface">System Alerts</span>
                  <span className="text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <div className="flex flex-col gap-xs max-h-72 overflow-y-auto">
                  <div
                    onClick={() => {
                      router.push('/security')
                      setIsNotificationsOpen(false)
                    }}
                    className="p-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex gap-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                    <div className="flex flex-col">
                      <span className="text-body-sm text-on-surface font-medium">SSL Renewed</span>
                      <span className="text-[11px] text-on-surface-variant">mail.domain.com certificate auto-renewed</span>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      router.push('/services')
                      setIsNotificationsOpen(false)
                    }}
                    className="p-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex gap-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-tertiary text-[18px]">warning</span>
                    <div className="flex flex-col">
                      <span className="text-body-sm text-on-surface font-medium">High Load on Rspamd</span>
                      <span className="text-[11px] text-on-surface-variant">CPU spike detected: 85.2%</span>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      router.push('/security')
                      setIsNotificationsOpen(false)
                    }}
                    className="p-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex gap-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-error text-[18px]">block</span>
                    <div className="flex flex-col">
                      <span className="text-body-sm text-on-surface font-medium">Fail2Ban Jails</span>
                      <span className="text-[11px] text-on-surface-variant">12 IPs banned on Postfix SASL today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help / Docs Modal Trigger */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            title="Help & Quick Reference"
          >
            <span className="material-symbols-outlined text-[22px]">help</span>
          </button>
        </div>
      </header>

      {/* Restart Confirmation Modal */}
      {isRestartModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <div className="flex items-center gap-sm text-error">
              <span className="material-symbols-outlined text-[28px]">restart_alt</span>
              <h2 className="text-headline-sm text-on-surface font-bold">Restart Mail Services</h2>
            </div>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              This action will safely reload Zimbra MTA, Postfix, Dovecot, and Nginx daemons. Existing connections will be gracefully transferred.
            </p>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                disabled={isRestarting}
                onClick={() => setIsRestartModalOpen(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm hover:bg-surface-container-highest transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                disabled={isRestarting}
                onClick={handleRestart}
                className="flex items-center gap-xs px-md py-sm bg-error-container text-on-error-container rounded-lg text-body-sm font-bold hover:brightness-110 transition-all shadow-md"
              >
                {isRestarting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Restarting...
                  </>
                ) : (
                  'Confirm Restart'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fully Clickable Quick Help & Documentation Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-2xl w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
              <div>
                <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">menu_book</span>
                  MailOS Quick Reference & Navigation Guide
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-xs">
                  Click any module below to jump directly to that page, or click CLI commands to copy.
                </p>
              </div>
              <button onClick={() => setIsHelpOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Clickable Modules Grid */}
            <div>
              <span className="text-label-caps text-on-surface-variant uppercase font-bold block mb-sm">
                1. System Modules (Click to Open)
              </span>
              <div className="grid grid-cols-2 gap-sm">
                {[
                  { name: 'Domain Management', desc: 'Configure domains, MX, SPF, DKIM, DMARC', path: '/domains', icon: 'language', color: 'text-primary' },
                  { name: 'Mailbox Accounts', desc: 'Create user mailboxes, quotas, aliases', path: '/mailboxes', icon: 'mail', color: 'text-secondary' },
                  { name: 'Mail Queues', desc: 'Flush queue, inspect deferred messages, logs', path: '/queues', icon: 'stacked_line_chart', color: 'text-tertiary' },
                  { name: 'System Services', desc: 'Restart & monitor Postfix, Dovecot, Rspamd', path: '/services', icon: 'settings_input_component', color: 'text-secondary' },
                  { name: 'Security & Quarantine', desc: 'Firewall rules, SSL renewal, spam box', path: '/security', icon: 'security', color: 'text-error' },
                  { name: 'Global Settings', desc: 'SMTP tester, backup snapshots, API keys', path: '/settings', icon: 'settings', color: 'text-primary' },
                  { name: 'Admin CLI Terminal', desc: 'Interactive Zimbra command prompt', path: '/terminal', icon: 'terminal', color: 'text-secondary' },
                  { name: 'System Telemetry', desc: 'Real-time CPU, RAM, Network charts', path: '/', icon: 'monitor_heart', color: 'text-primary' },
                ].map((mod) => (
                  <button
                    key={mod.path}
                    onClick={() => {
                      router.push(mod.path)
                      setIsHelpOpen(false)
                      addToast('Navigated', `Switched to ${mod.name}.`, 'info')
                    }}
                    className="flex items-start gap-sm p-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 rounded-xl transition-all text-left group"
                  >
                    <span className={`material-symbols-outlined text-[22px] ${mod.color} group-hover:scale-110 transition-transform`}>
                      {mod.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {mod.name}
                      </span>
                      <span className="text-code-sm text-on-surface-variant leading-tight">{mod.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Click-to-Copy CLI Commands with fallback & checkmark */}
            <div>
              <span className="text-label-caps text-on-surface-variant uppercase font-bold block mb-sm">
                2. Zimbra CLI Quick Commands (Click to Copy)
              </span>
              <div className="grid grid-cols-2 gap-sm font-mono text-code-sm">
                {[
                  { cmd: 'zmcontrol status', desc: 'Check all service statuses' },
                  { cmd: 'zmprov gad', desc: 'Get all configured domains' },
                  { cmd: 'zmprov gaa', desc: 'Get all user accounts' },
                  { cmd: 'mailq', desc: 'Inspect Postfix queue' },
                  { cmd: 'postfix reload', desc: 'Reload MTA configuration' },
                  { cmd: 'df -h', desc: 'Check storage volume usage' },
                ].map((c) => (
                  <button
                    key={c.cmd}
                    onClick={() => copyCliCommand(c.cmd)}
                    className="flex items-center justify-between p-sm bg-[#070b0e] border border-outline-variant/30 rounded-lg hover:border-primary/50 transition-colors text-left group"
                  >
                    <div>
                      <div className="text-primary font-bold">{c.cmd}</div>
                      <div className="text-[11px] text-on-surface-variant font-sans">{c.desc}</div>
                    </div>
                    <span className={`material-symbols-outlined text-[18px] transition-colors ${
                      copiedCmd === c.cmd ? 'text-secondary' : 'text-on-surface-variant group-hover:text-primary'
                    }`}>
                      {copiedCmd === c.cmd ? 'check' : 'content_copy'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Ports Reference */}
            <div>
              <span className="text-label-caps text-on-surface-variant uppercase font-bold block mb-xs">
                3. Default Port Bindings
              </span>
              <div className="grid grid-cols-4 gap-xs font-mono text-code-sm bg-surface-container p-sm rounded-lg border border-outline-variant/20 text-center">
                <div><strong className="text-primary block">SMTP</strong>: 25 / 587</div>
                <div><strong className="text-secondary block">SMTPS</strong>: 465</div>
                <div><strong className="text-primary block">IMAP(S)</strong>: 143 / 993</div>
                <div><strong className="text-tertiary block">Zimbra Admin</strong>: 7071</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-sm border-t border-outline-variant/20">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:brightness-110"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
