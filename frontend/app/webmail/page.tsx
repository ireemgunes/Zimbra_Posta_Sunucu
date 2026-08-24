'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { useTheme } from '@/context/ThemeContext'

interface Attachment {
  name: string
  size: string
  type: 'pdf' | 'img' | 'doc' | 'zip'
}

interface EmailItem {
  id: string
  category: 'primary' | 'promotions' | 'social' | 'updates'
  folder: 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'junk' | 'trash' | 'important'
  fromName: string
  fromEmail: string
  toEmail: string
  subject: string
  snippet: string
  body: string
  date: string
  fullDate: string
  isUnread: boolean
  isStarred: boolean
  isImportant: boolean
  labels: string[]
  attachments?: Attachment[]
}

const INITIAL_EMAILS: EmailItem[] = [
  {
    id: 'msg-101', category: 'primary', folder: 'inbox',
    fromName: 'Zimbra Cluster Monitor', fromEmail: 'alerts@mail.mailos.local', toEmail: 'sales@example.com',
    subject: 'Daily Infrastructure Report: All Postfix & Dovecot Daemons Running',
    snippet: 'Zimbra 10.0 FOSS status is healthy. MTA queue flow rate: 118.2 msg/sec, 0 corrupt queues...',
    body: 'Hello Team,\n\nDaily summary for the MailOS Zimbra 10.0 cluster:\n\n- System Load: 4.12, 3.85, 3.10\n- Postfix MTA: Active (Queue: 1,492 msgs / Deferred: 348)\n- Dovecot IMAP/POP3: 42 active sessions\n- Rspamd: 1,894 emails inspected, 14.8 avg spam score\n- Fail2Ban: 142 malicious IPs blocked\n\nNo security breaches detected in the last 24 hours.\n\nBest regards,\nMailOS Operations Team',
    date: '10:42 AM', fullDate: 'Tue, Aug 19, 2026, 10:42 AM',
    isUnread: true, isStarred: true, isImportant: true, labels: ['Work', 'Server'],
    attachments: [{ name: 'cluster-telemetry.pdf', size: '1.4 MB', type: 'pdf' }, { name: 'mta-metrics.csv', size: '42 KB', type: 'doc' }],
  },
  {
    id: 'msg-102', category: 'primary', folder: 'inbox',
    fromName: 'Alex Rivera', fromEmail: 'alex.rivera@globex.io', toEmail: 'sales@example.com',
    subject: 'Q3 Enterprise Mail Migration & DKIM 2048-bit Cutover Plan',
    snippet: 'Reviewing the proposed DNS migration to the new Zimbra 10.0 cluster. SPF and DMARC verified...',
    body: 'Hi Sales & Infrastructure Team,\n\nWe have scheduled the MX DNS cutover for tonight at 23:00 UTC.\n\nChecklist:\n1. MX Record: mail.mailos.local (Priority 10)\n2. SPF Record: v=spf1 mx ~all (Verified)\n3. DKIM Key: 2048-bit RSA under selector zimbra._domainkey\n4. DMARC Policy: v=DMARC1; p=quarantine\n\nPlease let me know if you have questions.\n\nCheers,\nAlex Rivera\nSenior Cloud Architect - Globex Corp',
    date: '9:15 AM', fullDate: 'Tue, Aug 19, 2026, 9:15 AM',
    isUnread: true, isStarred: false, isImportant: true, labels: ['Work'],
  },
  {
    id: 'msg-103', category: 'updates', folder: 'inbox',
    fromName: 'Cloud Infrastructure Billing', fromEmail: 'invoices@cloud-infra.net', toEmail: 'sales@example.com',
    subject: 'Your Monthly Invoice is Ready: #INV-2026-8891',
    snippet: 'Invoice for MailOS Dedicated High-Performance NVMe Cluster Storage - billing cycle August...',
    body: 'Dear Customer,\n\nYour monthly invoice is available for download.\n\nInvoice: INV-2026-8891\nPeriod: July 18 - August 18, 2026\nAmount: $0.00 (Community FOSS Edition)\nService: Zimbra 10.0 FOSS Node\n\nThank you for choosing open-source mail infrastructure.',
    date: 'Aug 17', fullDate: 'Mon, Aug 18, 2026, 4:20 PM',
    isUnread: false, isStarred: false, isImportant: false, labels: ['Finance'],
    attachments: [{ name: 'Invoice-INV-2026-8891.pdf', size: '380 KB', type: 'pdf' }],
  },
  {
    id: 'msg-104', category: 'social', folder: 'inbox',
    fromName: 'GitHub Notifications', fromEmail: 'notifications@github.com', toEmail: 'sales@example.com',
    subject: '[Zimbra_Posta] New Release: MailOS v2.4.1-stable published',
    snippet: 'New release v2.4.1-stable includes automated snapshot recovery, real-time telemetry, Webmail client...',
    body: 'A new release has been published for Zimbra_Posta:\n\nMailOS v2.4.1-stable\n- Modern Webmail client (Gmail-inspired)\n- Disaster Recovery snapshots\n- Fail2Ban telemetry\n- Universal clipboard engine',
    date: 'Aug 16', fullDate: 'Sun, Aug 16, 2026, 11:10 AM',
    isUnread: false, isStarred: true, isImportant: false, labels: ['Updates'],
  },
  {
    id: 'msg-105', category: 'promotions', folder: 'inbox',
    fromName: 'DevOps Weekly Newsletter', fromEmail: 'news@devopsweekly.com', toEmail: 'sales@example.com',
    subject: 'Issue #642: Next.js 14 Standalone Containers & Zero-Downtime Mail MTA',
    snippet: 'Best practices for containerized mail transfer agents, Postfix tuning, and DKIM automation...',
    body: 'Welcome to issue #642 of DevOps Weekly!\n\nTop stories:\n1. Containerizing Postfix & OpenLDAP with Docker Compose\n2. Memory profiling for high-throughput Dovecot IMAP servers\n3. Why self-hosted mail privacy matters in 2026',
    date: 'Aug 15', fullDate: 'Sat, Aug 15, 2026, 8:00 AM',
    isUnread: false, isStarred: false, isImportant: false, labels: ['Newsletter'],
  },
  {
    id: 'msg-106', category: 'primary', folder: 'sent',
    fromName: 'Sales Team', fromEmail: 'sales@example.com', toEmail: 'client-inquiries@partner-corp.com',
    subject: 'Welcome to Enterprise MailOS Solutions',
    snippet: 'Thank you for contacting us. Your dedicated Zimbra 10.0 cluster is configured and ready...',
    body: 'Hello,\n\nThank you for reaching out regarding our self-hosted Zimbra 10.0 solution.\n\nYour test domain is provisioned with 50 GB storage quotas and full IMAP/POP3 encryption.\n\nBest regards,\nSales Engineering Team',
    date: 'Aug 14', fullDate: 'Fri, Aug 14, 2026, 2:30 PM',
    isUnread: false, isStarred: false, isImportant: false, labels: ['Work'],
  },
  {
    id: 'msg-107', category: 'primary', folder: 'junk',
    fromName: 'Unsolicited Deals Bot', fromEmail: 'promo@unverified-deals.biz', toEmail: 'sales@example.com',
    subject: 'Claim your $500 gift card today!',
    snippet: 'SPAM DETECTED: Rspamd Bayes Score 15.2 (High spam probability)...',
    body: 'SPAM INTERCEPTED: Rspamd Bayesian engine classified this message as spam due to known blacklisted URI patterns and SPF authentication failure.',
    date: 'Aug 12', fullDate: 'Wed, Aug 12, 2026, 1:15 AM',
    isUnread: false, isStarred: false, isImportant: false, labels: ['Spam'],
  },
  {
    id: 'msg-108', category: 'primary', folder: 'snoozed',
    fromName: 'DevOps Pipeline Bot', fromEmail: 'pipeline@ci.mailos.local', toEmail: 'sales@example.com',
    subject: 'Reminder: TLS Certificate renewal due in 14 days',
    snippet: 'Your Zimbra TLS certificate expires on September 1, 2026. Renew with certbot...',
    body: 'Action Required: TLS Certificate Renewal\n\nYour MailOS TLS certificate will expire on September 1, 2026.\n\nRun: docker exec mailos-nginx certbot renew --quiet\n\nThis message was snoozed and will reappear on Aug 25.',
    date: 'Aug 14', fullDate: 'Fri, Aug 14, 2026, 9:00 AM',
    isUnread: true, isStarred: false, isImportant: true, labels: ['Server'],
  },
  {
    id: 'msg-109', category: 'primary', folder: 'drafts',
    fromName: 'Sales Team', fromEmail: 'sales@example.com', toEmail: '',
    subject: 'Quarterly Mailbox Audit Report [DRAFT]',
    snippet: 'Draft: Summary of provisioned mailboxes, storage quotas, and alias configurations for Q3 2026...',
    body: '[Draft - not sent]\n\nQ3 2026 Mailbox Audit Summary:\n- Total Accounts: 47\n- Active: 43\n- Suspended: 4\n- Total Storage: 124 GB / 500 GB (24.8%)\n\n[Continue writing...]',
    date: 'Aug 11', fullDate: 'Tue, Aug 11, 2026, 3:45 PM',
    isUnread: false, isStarred: false, isImportant: false, labels: ['Work'],
  },
]

const AVATAR_COLORS: Record<string, string> = {
  Z: '#ea4335', A: '#1a73e8', C: '#34a853', G: '#fbbc04',
  D: '#9c27b0', S: '#00bcd4', U: '#ff5722', M: '#607d8b',
}
function avatarColor(name: string): string {
  return AVATAR_COLORS[name[0]?.toUpperCase()] || '#1a73e8'
}

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '😊', '😇', '🙂', '😉',
  '😍', '🥳', '😎', '🤔', '👍', '👎', '👏', '🙌', '🤝', '🙏',
  '❤️', '🔥', '✨', '🎉', '🚀', '⭐', '💡', '📌', '✉️', '📅',
  '📎', '✅', '⚠️', '💼', '📊', '💻', '🔒', '💯', '🌟', '🎯',
]

function EmailRow({
  msg, isSel, isReading, densityPy, isDark, readingPane,
  onSelect, onCheckbox, onStar, onImportant, onArchive, onDelete, onToggleRead, onSnooze,
}: {
  msg: EmailItem; isSel: boolean; isReading: boolean; densityPy: string; isDark: boolean; readingPane: string
  onSelect: () => void; onCheckbox: (e: React.MouseEvent) => void; onStar: (e: React.MouseEvent) => void
  onImportant: (e: React.MouseEvent) => void; onArchive: () => void; onDelete: () => void
  onToggleRead: () => void; onSnooze: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 cursor-pointer border-b border-outline-variant/5 px-3 transition-colors ${densityPy} ${
        isReading && readingPane !== 'none'
          ? isDark ? 'bg-[#28394a] border-l-2 border-l-[#1a73e8]' : 'bg-[#e8f0fe] border-l-2 border-l-[#1a73e8]'
          : isSel
          ? isDark ? 'bg-[#28394a]' : 'bg-[#c2e7ff]'
          : msg.isUnread
          ? isDark ? 'bg-[#1e2830] hover:bg-[#232d37]' : 'bg-white hover:bg-[#f2f6fc]'
          : isDark ? 'hover:bg-[#252c34]' : 'hover:bg-[#f2f6fc]'
      }`}
    >
      {/* Checkbox */}
      <div onClick={onCheckbox} className="flex-shrink-0 p-0.5 text-on-surface-variant hover:text-on-surface cursor-pointer">
        <span className="material-symbols-outlined text-[15px]">
          {isSel ? 'check_box' : 'check_box_outline_blank'}
        </span>
      </div>

      {/* Star (Yellow filled when active - smaller size) */}
      <div onClick={onStar} className="flex-shrink-0 p-0.5 cursor-pointer">
        <span
          className={`material-symbols-outlined text-[13px] transition-transform active:scale-125 ${
            msg.isStarred
              ? 'text-[#fbbc04]'
              : 'text-on-surface-variant/30 group-hover:text-on-surface-variant/70'
          }`}
          style={{ fontVariationSettings: msg.isStarred ? "'FILL' 1" : "'FILL' 0" }}
          title={msg.isStarred ? 'Starred' : 'Not starred'}
        >
          star
        </span>
      </div>

      {/* Important Arrow (Yellow filled when active - smaller size) */}
      <div onClick={onImportant} className="flex-shrink-0 p-0.5 cursor-pointer">
        <span
          className={`material-symbols-outlined text-[13px] transition-transform active:scale-125 ${
            msg.isImportant
              ? 'text-[#fbbc04]'
              : 'text-on-surface-variant/20 group-hover:text-on-surface-variant/50'
          }`}
          style={{ fontVariationSettings: msg.isImportant ? "'FILL' 1" : "'FILL' 0" }}
          title={msg.isImportant ? 'Important' : 'Not important'}
        >
          label_important
        </span>
      </div>

      {/* Sender Name (No profile avatar circle - clean Gmail look) */}
      <div className="w-40 flex-shrink-0 min-w-0 pr-1.5">
        <span className={`truncate block text-[13px] ${msg.isUnread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
          {msg.fromName}
        </span>
      </div>

      {/* Subject + Snippet */}
      <div className="flex-1 flex items-baseline gap-1.5 min-w-0 truncate">
        <span className={`text-[13px] flex-shrink-0 max-w-[45%] truncate ${msg.isUnread ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
          {msg.subject}
        </span>
        {readingPane === 'none' && (
          <span className="text-[13px] text-on-surface-variant/65 truncate">
            – {msg.snippet}
          </span>
        )}
      </div>

      {/* Attachment Icon */}
      {msg.attachments && (
        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/70 flex-shrink-0">
          attach_file
        </span>
      )}

      {/* Hover Quick Actions */}
      <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={onArchive} className="p-1 rounded-full hover:bg-black/10 text-on-surface-variant" title="Archive">
          <span className="material-symbols-outlined text-[15px]">archive</span>
        </button>
        <button onClick={onDelete} className="p-1 rounded-full hover:bg-black/10 text-on-surface-variant" title="Delete">
          <span className="material-symbols-outlined text-[15px]">delete</span>
        </button>
        <button onClick={onToggleRead} className="p-1 rounded-full hover:bg-black/10 text-on-surface-variant" title="Toggle read">
          <span className="material-symbols-outlined text-[15px]">{msg.isUnread ? 'mark_email_read' : 'mark_email_unread'}</span>
        </button>
        <button onClick={onSnooze} className="p-1 rounded-full hover:bg-black/10 text-on-surface-variant" title="Snooze">
          <span className="material-symbols-outlined text-[15px]">schedule</span>
        </button>
      </div>

      {/* Date */}
      <div className={`w-14 text-right text-[11px] font-mono flex-shrink-0 group-hover:hidden ${
        msg.isUnread ? 'font-bold text-on-surface' : 'text-on-surface-variant'
      }`}>
        {msg.date}
      </div>
    </div>
  )
}

function WebmailContent() {
  const searchParams = useSearchParams()
  const currentAccount = searchParams.get('account') || 'sales@example.com'
  const { addToast } = useToast()
  const { isDark, toggleTheme } = useTheme()

  const [emails, setEmails] = useState<EmailItem[]>(INITIAL_EMAILS)
  const [activeFolder, setActiveFolder] = useState<string>('inbox')
  const [activeCategory, setActiveCategory] = useState<'primary' | 'promotions' | 'social' | 'updates'>('primary')
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMoreFoldersOpen, setIsMoreFoldersOpen] = useState(false)
  const [activeRightPanel, setActiveRightPanel] = useState<'calendar' | 'keep' | 'tasks' | 'contacts' | null>(null)

  // Compose
  const [showCompose, setShowCompose] = useState(false)
  const [isComposeMinimized, setIsComposeMinimized] = useState(false)
  const [isComposeMaximized, setIsComposeMaximized] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeCc, setComposeCc] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([])
  const [showFormatting, setShowFormatting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Compose Refs
  const composeFileInputRef = useRef<HTMLInputElement>(null)
  const composeTextareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Inline reply
  const [inlineReply, setInlineReply] = useState('')
  const [showInlineReply, setShowInlineReply] = useState(false)

  // UI panels
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showQuickSettings, setShowQuickSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showAdvSearch, setShowAdvSearch] = useState(false)
  const [density, setDensity] = useState<'default' | 'comfortable' | 'compact'>('default')
  const [readingPane, setReadingPane] = useState<'none' | 'right' | 'below'>('none')

  // Advanced search
  const [advFrom, setAdvFrom] = useState('')
  const [advTo, setAdvTo] = useState('')
  const [advSubject, setAdvSubject] = useState('')
  const [advHasAttachment, setAdvHasAttachment] = useState(false)
  const [advUnreadOnly, setAdvUnreadOnly] = useState(false)

  // Refs for click-outside
  const profileRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)
  const advSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(ev.target as Node)) setShowProfileMenu(false)
      if (settingsRef.current && !settingsRef.current.contains(ev.target as Node)) setShowQuickSettings(false)
      if (helpRef.current && !helpRef.current.contains(ev.target as Node)) setShowHelp(false)
      if (advSearchRef.current && !advSearchRef.current.contains(ev.target as Node)) setShowAdvSearch(false)
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(ev.target as Node)) setShowEmojiPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filter logic
  const folderEmails = emails.filter((e) => {
    if (activeFolder === 'inbox') return e.folder === 'inbox' && e.category === activeCategory
    if (activeFolder === 'starred') return e.isStarred
    if (activeFolder === 'important') return e.isImportant
    return e.folder === activeFolder
  })

  const visibleEmails = folderEmails.filter((e) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!(e.subject.toLowerCase().includes(q) || e.fromName.toLowerCase().includes(q) || e.fromEmail.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q))) return false
    }
    if (advFrom && !e.fromEmail.toLowerCase().includes(advFrom.toLowerCase()) && !e.fromName.toLowerCase().includes(advFrom.toLowerCase())) return false
    if (advTo && !e.toEmail.toLowerCase().includes(advTo.toLowerCase())) return false
    if (advSubject && !e.subject.toLowerCase().includes(advSubject.toLowerCase())) return false
    if (advHasAttachment && !(e.attachments && e.attachments.length > 0)) return false
    if (advUnreadOnly && !e.isUnread) return false
    return true
  })

  const unreadInboxCount = emails.filter((e) => e.folder === 'inbox' && e.isUnread).length
  const unreadDraftsCount = emails.filter((e) => e.folder === 'drafts').length
  const unreadJunkCount = emails.filter((e) => e.folder === 'junk').length
  const snoozedCount = emails.filter((e) => e.folder === 'snoozed').length
  const hasAdvFilter = !!(advFrom || advTo || advSubject || advHasAttachment || advUnreadOnly)

  // Handlers
  const handleSelectEmail = (msg: EmailItem) => {
    setSelectedEmail(msg)
    setShowInlineReply(false)
    setInlineReply('')
    if (msg.isUnread) setEmails((p) => p.map((e) => e.id === msg.id ? { ...e, isUnread: false } : e))
  }
  const handleToggleStar = (ev: React.MouseEvent, id: string) => {
    ev.stopPropagation()
    setEmails((p) => p.map((m) => m.id === id ? { ...m, isStarred: !m.isStarred } : m))
  }
  const handleToggleImportant = (ev: React.MouseEvent, id: string) => {
    ev.stopPropagation()
    setEmails((p) => p.map((m) => m.id === id ? { ...m, isImportant: !m.isImportant } : m))
  }
  const handleSelectAll = () => setSelectedIds(selectedIds.length === visibleEmails.length ? [] : visibleEmails.map((e) => e.id))
  const handleToggleCheckbox = (ev: React.MouseEvent, id: string) => {
    ev.stopPropagation()
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])
  }
  const handleArchiveEmail = (id: string) => {
    setEmails((p) => p.filter((e) => e.id !== id))
    if (selectedEmail?.id === id) setSelectedEmail(null)
    addToast('Archived', 'Conversation archived.', 'info')
  }
  const handleDeleteEmail = (id: string) => {
    setEmails((p) => p.map((e) => e.id === id ? { ...e, folder: 'trash' as const } : e))
    if (selectedEmail?.id === id) setSelectedEmail(null)
    addToast('Deleted', 'Moved to Trash.', 'info')
  }
  const handleSpamEmail = (id: string) => {
    setEmails((p) => p.map((e) => e.id === id ? { ...e, folder: 'junk' as const } : e))
    if (selectedEmail?.id === id) setSelectedEmail(null)
    addToast('Spam', 'Moved to Spam.', 'warning')
  }
  const handleToggleRead = (id: string) => setEmails((p) => p.map((e) => e.id === id ? { ...e, isUnread: !e.isUnread } : e))
  const handleSnooze = (id: string) => {
    setEmails((p) => p.map((e) => e.id === id ? { ...e, folder: 'snoozed' as const } : e))
    addToast('Snoozed', 'Message snoozed.', 'info')
  }
  const handleDeleteSelected = () => {
    setEmails((p) => p.map((e) => selectedIds.includes(e.id) ? { ...e, folder: 'trash' as const } : e))
    if (selectedEmail && selectedIds.includes(selectedEmail.id)) setSelectedEmail(null)
    addToast('Deleted', `${selectedIds.length} conversation(s) moved to Trash.`, 'info')
    setSelectedIds([])
  }
  const handleMarkAsRead = (read: boolean) => {
    setEmails((p) => p.map((e) => selectedIds.includes(e.id) ? { ...e, isUnread: !read } : e))
    setSelectedIds([])
  }
  const clearAdvSearch = () => {
    setAdvFrom(''); setAdvTo(''); setAdvSubject('')
    setAdvHasAttachment(false); setAdvUnreadOnly(false)
  }

  // Compose Handlers
  const handleAttachFiles = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (!ev.target.files || ev.target.files.length === 0) return
    const newAtts: Attachment[] = Array.from(ev.target.files).map((f) => {
      const sizeStr = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`
      const ext = f.name.split('.').pop()?.toLowerCase() || ''
      const type: Attachment['type'] = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) ? 'img'
        : ext === 'pdf' ? 'pdf'
        : ['zip', 'tar', 'gz', 'rar'].includes(ext) ? 'zip'
        : 'doc'
      return { name: f.name, size: sizeStr, type }
    })
    setComposeAttachments((prev) => [...prev, ...newAtts])
    addToast('Files Attached', `${newAtts.length} file(s) attached.`, 'info')
    ev.target.value = ''
  }

  const removeAttachment = (idx: number) => {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const insertEmoji = (emoji: string) => {
    setComposeBody((prev) => prev + emoji)
    setShowEmojiPicker(false)
    if (composeTextareaRef.current) {
      composeTextareaRef.current.focus()
    }
  }

  const applyFormatting = (format: 'bold' | 'italic' | 'underline' | 'h2' | 'bullet' | 'quote' | 'code') => {
    const el = composeTextareaRef.current
    if (!el) return
    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const sel = composeBody.substring(start, end)
    let replacement = ''

    if (format === 'bold') replacement = sel ? `**${sel}**` : '**bold text**'
    else if (format === 'italic') replacement = sel ? `*${sel}*` : '*italic text*'
    else if (format === 'underline') replacement = sel ? `<u>${sel}</u>` : '<u>underlined text</u>'
    else if (format === 'h2') replacement = sel ? `\n## ${sel}\n` : '\n## Heading\n'
    else if (format === 'bullet') replacement = sel ? `\n• ${sel}` : '\n• Bullet point'
    else if (format === 'quote') replacement = sel ? `\n> ${sel}` : '\n> Quote text'
    else if (format === 'code') replacement = sel ? `\`${sel}\`` : '`code`'

    const newBody = composeBody.substring(0, start) + replacement + composeBody.substring(end)
    setComposeBody(newBody)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 50)
  }

  const insertSignature = () => {
    const sig = `\n\n--\nBest regards,\n${currentAccount.split('@')[0]}\nMailOS Operations Team\n${currentAccount}`
    if (composeBody.includes(sig.trim())) {
      setComposeBody((prev) => prev.replace(sig, ''))
      addToast('Signature Removed', 'Signature removed from draft.', 'info')
    } else {
      setComposeBody((prev) => prev + sig)
      addToast('Signature Added', 'Default signature inserted.', 'success')
    }
  }

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUrl.trim()) return
    const text = linkText.trim() || linkUrl.trim()
    const linkMd = `[${text}](${linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl})`
    setComposeBody((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + linkMd + ' ')
    setLinkText('')
    setLinkUrl('')
    setShowLinkModal(false)
    addToast('Link Inserted', 'Link added to message.', 'info')
  }

  const handleSendCompose = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!composeTo.trim()) { addToast('Recipient Required', 'Please provide a recipient.', 'error'); return }
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      setEmails((p) => [{
        id: `sent-${Date.now()}`, category: 'primary', folder: 'sent',
        fromName: currentAccount.split('@')[0], fromEmail: currentAccount, toEmail: composeTo.trim(),
        subject: composeSubject.trim() || '(no subject)', snippet: composeBody.substring(0, 80) + '...', body: composeBody,
        date: 'Just now', fullDate: new Date().toLocaleString(), isUnread: false, isStarred: false, isImportant: false, labels: ['Work'],
        attachments: composeAttachments.length > 0 ? composeAttachments : undefined
      }, ...p])
      setShowCompose(false); setComposeTo(''); setComposeCc(''); setComposeSubject(''); setComposeBody(''); setComposeAttachments([]); setShowCc(false); setShowFormatting(false)
      addToast('Message Sent', `Delivered to ${composeTo.trim()} via Zimbra MTA.`, 'success')
    }, 700)
  }

  const handleSendInlineReply = () => {
    if (!inlineReply.trim() || !selectedEmail) return
    setEmails((p) => [{
      id: `sent-${Date.now()}`, category: 'primary', folder: 'sent',
      fromName: currentAccount.split('@')[0], fromEmail: currentAccount, toEmail: selectedEmail.fromEmail,
      subject: `Re: ${selectedEmail.subject}`, snippet: inlineReply.substring(0, 80) + '...', body: inlineReply,
      date: 'Just now', fullDate: new Date().toLocaleString(), isUnread: false, isStarred: false, isImportant: false, labels: ['Work']
    }, ...p])
    setInlineReply(''); setShowInlineReply(false)
    addToast('Reply Sent', `Dispatched to ${selectedEmail.fromEmail}.`, 'success')
  }

  const openForward = () => {
    if (!selectedEmail) return
    setComposeTo(''); setComposeSubject(`Fwd: ${selectedEmail.subject}`)
    setComposeBody(`\n\n---------- Forwarded message ---------\nFrom: ${selectedEmail.fromName} <${selectedEmail.fromEmail}>\nDate: ${selectedEmail.fullDate}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`)
    setComposeAttachments(selectedEmail.attachments ? [...selectedEmail.attachments] : [])
    setShowCompose(true); setShowInlineReply(false)
  }

  const openReply = () => {
    if (!selectedEmail) return
    setComposeTo(selectedEmail.fromEmail); setComposeSubject(`Re: ${selectedEmail.subject}`); setComposeBody('')
    setComposeAttachments([])
    setShowCompose(true); setShowInlineReply(false)
  }

  const densityPy = density === 'compact' ? 'py-0.5' : density === 'comfortable' ? 'py-2.5' : 'py-1'

  const mainFolders = [
    { id: 'inbox', label: 'Inbox', icon: 'inbox', count: unreadInboxCount },
    { id: 'starred', label: 'Starred', icon: 'star', count: 0 },
    { id: 'snoozed', label: 'Snoozed', icon: 'schedule', count: snoozedCount },
    { id: 'important', label: 'Important', icon: 'label_important', count: 0 },
    { id: 'sent', label: 'Sent', icon: 'send', count: 0 },
    { id: 'drafts', label: 'Drafts', icon: 'draft', count: unreadDraftsCount },
  ]
  const moreFolders = [
    { id: 'junk', label: 'Spam', icon: 'report', count: unreadJunkCount },
    { id: 'trash', label: 'Trash', icon: 'delete', count: 0 },
  ]

  const navItemCls = (id: string) =>
    `flex items-center justify-between rounded-full py-1.5 transition-all w-full text-[13px] ${
      isSidebarOpen ? 'px-3.5' : 'w-9 h-9 justify-center px-0'
    } ${
      activeFolder === id
        ? isDark ? 'bg-[#28394a] text-[#a8c7fa] font-semibold' : 'bg-[#d3e3fd] text-[#041e49] font-semibold'
        : isDark ? 'text-[#c4c7c5] hover:bg-white/5' : 'text-[#444746] hover:bg-black/5'
    }`

  const iconBtn = 'w-8 h-8 rounded-full hover:bg-black/10 text-on-surface-variant transition-colors flex items-center justify-center flex-shrink-0'

  const renderEmailList = (compact = false) => (
    <div className="divide-y divide-outline-variant/5">
      {visibleEmails.length > 0 ? visibleEmails.map((msg) => (
        <EmailRow
          key={msg.id}
          msg={msg}
          isSel={selectedIds.includes(msg.id)}
          isReading={selectedEmail?.id === msg.id}
          densityPy={densityPy}
          isDark={isDark}
          readingPane={readingPane}
          onSelect={() => handleSelectEmail(msg)}
          onCheckbox={(e) => handleToggleCheckbox(e, msg.id)}
          onStar={(e) => handleToggleStar(e, msg.id)}
          onImportant={(e) => handleToggleImportant(e, msg.id)}
          onArchive={() => handleArchiveEmail(msg.id)}
          onDelete={() => handleDeleteEmail(msg.id)}
          onToggleRead={() => handleToggleRead(msg.id)}
          onSnooze={() => handleSnooze(msg.id)}
        />
      )) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant gap-2">
          <span className="material-symbols-outlined text-[44px] opacity-30">inbox</span>
          <span className="text-[14px] font-semibold">{searchQuery || hasAdvFilter ? 'No results found' : `Your ${activeFolder} is empty`}</span>
          <span className="text-[12px]">{searchQuery ? `No emails matched "${searchQuery}"` : 'No messages match your filter.'}</span>
          {(searchQuery || hasAdvFilter) && (
            <button onClick={() => { setSearchQuery(''); clearAdvSearch() }} className="text-[#1a73e8] font-semibold hover:underline text-[12px] mt-1">Clear filters</button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden text-[13px] ${isDark ? 'bg-[#12161a] text-[#e3e3e3]' : 'bg-[#f6f8fc] text-[#1f1f1f]'}`}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className={`h-12 px-3 flex items-center justify-between border-b flex-shrink-0 z-30 ${isDark ? 'bg-[#181d22] border-[#2c333a]' : 'bg-[#f6f8fc] border-[#e1e5eb]'}`}>
        {/* Left */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <button onClick={() => setIsSidebarOpen((s) => !s)} className={iconBtn} title="Main menu">
            <span className="material-symbols-outlined text-[19px]">menu</span>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6.5 h-6.5 rounded-md bg-[#ea4335] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[16px]">mail</span>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-[#ea4335]">MailOS</span>
            <span className="text-[12px] text-on-surface-variant font-medium">Mail</span>
          </div>
        </div>

        {/* Center – search */}
        <div className="flex-1 max-w-xl mx-3 relative" ref={advSearchRef}>
          <div className={`flex items-center rounded-full px-3.5 py-1.5 transition-all shadow-xs border ${isDark ? 'bg-[#1e242b] border-[#2f3842] focus-within:bg-[#252c34]' : 'bg-[#eaf1fb] border-transparent focus-within:bg-white focus-within:border-[#cbd5e1] focus-within:shadow-sm'}`}>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">search</span>
            <input
              value={searchQuery}
              onChange={(ev) => setSearchQuery(ev.target.value)}
              placeholder="Search in mail..."
              className="w-full bg-transparent outline-none text-[13px] placeholder:text-on-surface-variant"
            />
            {(searchQuery || hasAdvFilter) && (
              <button onClick={() => { setSearchQuery(''); clearAdvSearch() }} className="p-0.5 text-on-surface-variant hover:text-on-surface" title="Clear">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <button
              onClick={() => setShowAdvSearch((v) => !v)}
              className={`p-0.5 ml-1 transition-colors ${showAdvSearch || hasAdvFilter ? 'text-[#1a73e8]' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="Advanced search"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
            </button>
          </div>

          {/* Advanced Search Panel */}
          {showAdvSearch && (
            <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-xl border z-50 overflow-hidden ${isDark ? 'bg-[#1e242b] border-[#2f3842]' : 'bg-white border-slate-200'}`}>
              <div className="px-4 pt-3 pb-2 border-b border-outline-variant/20 flex items-center justify-between">
                <h3 className="font-bold text-[13px]">Advanced Search</h3>
                <button onClick={() => setShowAdvSearch(false)}><span className="material-symbols-outlined text-[16px] text-on-surface-variant">close</span></button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {[
                  { label: 'From', value: advFrom, set: setAdvFrom, ph: 'e.g. alex@globex.io' },
                  { label: 'To', value: advTo, set: setAdvTo, ph: 'e.g. sales@example.com' },
                  { label: 'Subject', value: advSubject, set: setAdvSubject, ph: 'e.g. DKIM, invoice...' },
                ].map(({ label, value, set, ph }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-16 text-right text-[12px] text-on-surface-variant font-semibold flex-shrink-0">{label}</span>
                    <input value={value} onChange={(ev) => set(ev.target.value)} placeholder={ph}
                      className={`flex-1 rounded-md px-3 py-1.5 outline-none text-[12px] border ${isDark ? 'bg-[#252c34] border-[#2f3842] focus:border-[#1a73e8]' : 'bg-slate-50 border-slate-200 focus:border-[#1a73e8]'}`}
                    />
                  </div>
                ))}
                <div className="flex items-center gap-5 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={advHasAttachment} onChange={(ev) => setAdvHasAttachment(ev.target.checked)} className="accent-[#1a73e8] w-3.5 h-3.5" />
                    <span className="text-[12px]">Has attachment</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={advUnreadOnly} onChange={(ev) => setAdvUnreadOnly(ev.target.checked)} className="accent-[#1a73e8] w-3.5 h-3.5" />
                    <span className="text-[12px]">Unread only</span>
                  </label>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                  <button onClick={clearAdvSearch} className="text-[12px] text-on-surface-variant hover:text-on-surface font-semibold">Clear all</button>
                  <button onClick={() => setShowAdvSearch(false)} className="px-4 py-1.5 rounded-full bg-[#1a73e8] text-white font-bold text-[12px] hover:brightness-110">Search</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-0.5">
          {/* Help */}
          <div className="relative" ref={helpRef}>
            <button onClick={() => setShowHelp((v) => !v)} className={`${iconBtn} ${showHelp ? (isDark ? 'bg-white/10' : 'bg-black/10') : ''}`} title="Help & shortcuts">
              <span className="material-symbols-outlined text-[19px]">help_outline</span>
            </button>
            {showHelp && (
              <div className={`absolute right-0 top-full mt-1.5 w-72 rounded-xl shadow-xl border z-50 overflow-hidden ${isDark ? 'bg-[#1e242b] border-[#2f3842]' : 'bg-white border-slate-200'}`}>
                <div className="px-3.5 pt-3 pb-2 border-b border-outline-variant/20 flex items-center justify-between">
                  <h3 className="font-bold text-[13px]">Keyboard Shortcuts</h3>
                  <button onClick={() => setShowHelp(false)}><span className="material-symbols-outlined text-[16px] text-on-surface-variant">close</span></button>
                </div>
                <div className="px-3.5 py-2 flex flex-col gap-0.5 text-[12px]">
                  {[
                    ['C', 'Compose new message'], ['R', 'Reply'], ['F', 'Forward'],
                    ['E', 'Archive'], ['#', 'Delete'], ['/', 'Focus search'],
                    ['U', 'Return to inbox'], ['S', 'Toggle star'],
                    ['Shift+U', 'Mark as unread'], ['Shift+I', 'Mark as read'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-outline-variant/10 last:border-0">
                      <span className="text-on-surface-variant">{desc}</span>
                      <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isDark ? 'bg-[#252c34] border-[#3f4852] text-[#c4c7c5]' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>{key}</kbd>
                    </div>
                  ))}
                </div>
                <div className="px-3.5 py-2 border-t border-outline-variant/20">
                  <div className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[10px] font-mono border ${isDark ? 'bg-[#181d22] border-[#2c333a] text-secondary' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <span className="material-symbols-outlined text-[13px]">circle</span>
                    Zimbra 10.0 FOSS — Cluster Online
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme */}
          <button onClick={toggleTheme} className={iconBtn} title={isDark ? 'Light mode' : 'Dark mode'}>
            <span className="material-symbols-outlined text-[19px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button onClick={() => setShowQuickSettings((v) => !v)} className={`${iconBtn} ${showQuickSettings ? (isDark ? 'bg-white/10' : 'bg-black/10') : ''}`} title="Settings">
              <span className="material-symbols-outlined text-[19px]">settings</span>
            </button>
            {showQuickSettings && (
              <div className={`absolute right-0 top-full mt-1.5 w-72 rounded-xl shadow-xl border z-50 overflow-hidden ${isDark ? 'bg-[#1e242b] border-[#2f3842]' : 'bg-white border-slate-200'}`}>
                <div className="px-3.5 pt-3 pb-2 border-b border-outline-variant/20 flex items-center justify-between">
                  <h3 className="font-bold text-[13px]">Quick Settings</h3>
                  <button onClick={() => setShowQuickSettings(false)}><span className="material-symbols-outlined text-[16px] text-on-surface-variant">close</span></button>
                </div>
                {/* Density */}
                <div className="px-3.5 py-3 flex flex-col gap-1.5 border-b border-outline-variant/20">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Display Density</span>
                  <div className="flex gap-1.5">
                    {(['default', 'comfortable', 'compact'] as const).map((d) => (
                      <button key={d} onClick={() => setDensity(d)}
                        className={`flex-1 py-1.5 rounded-md border text-[11px] font-semibold capitalize transition-all ${density === d ? 'border-[#1a73e8] bg-[#1a73e8]/10 text-[#1a73e8]' : isDark ? 'border-[#2f3842] hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                {/* Reading Pane */}
                <div className="px-3.5 py-3 flex flex-col gap-1 border-b border-outline-variant/20">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Reading Pane</span>
                  {([
                    { value: 'none',  label: 'No split',       icon: 'view_stream' },
                    { value: 'right', label: 'Right of inbox', icon: 'view_sidebar' },
                    { value: 'below', label: 'Below inbox',    icon: 'horizontal_split' },
                  ] as const).map((opt) => (
                    <button key={opt.value} onClick={() => { setReadingPane(opt.value); setSelectedEmail(null) }}
                      className={`flex items-center gap-2.5 py-1.5 px-2 rounded-md text-[12px] text-left transition-colors ${readingPane === opt.value ? (isDark ? 'bg-[#1a73e8]/15 text-[#1a73e8]' : 'bg-[#e8f0fe] text-[#1a73e8]') : (isDark ? 'hover:bg-white/5 text-on-surface-variant' : 'hover:bg-slate-50 text-on-surface-variant')}`}
                    >
                      <span className={`material-symbols-outlined text-[16px] ${readingPane === opt.value ? 'text-[#1a73e8]' : 'text-on-surface-variant'}`}>{readingPane === opt.value ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                      <span className="material-symbols-outlined text-[15px] opacity-60">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="px-3.5 py-2">
                  <button onClick={() => setShowQuickSettings(false)} className="text-[#1a73e8] text-[12px] font-semibold hover:underline">See all settings →</button>
                </div>
              </div>
            )}
          </div>

          {/* Admin / Profile (Identical size and style as other header icon buttons) */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className={`${iconBtn} ${showProfileMenu ? (isDark ? 'bg-white/10' : 'bg-black/10') : ''}`}
              title={currentAccount}
            >
              <div
                className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[10px] shadow-xs select-none"
                style={{ backgroundColor: avatarColor(currentAccount) }}
              >
                {currentAccount[0]?.toUpperCase()}
              </div>
            </button>
            {showProfileMenu && (
              <div className={`absolute right-0 top-full mt-1.5 w-72 rounded-xl shadow-xl border z-50 flex flex-col items-center text-center gap-2.5 p-4 ${isDark ? 'bg-[#1e242b] border-[#2f3842]' : 'bg-white border-slate-200'}`}>
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-xl shadow-xs" style={{ backgroundColor: avatarColor(currentAccount) }}>{currentAccount[0]?.toUpperCase()}</div>
                <div className="flex flex-col"><span className="font-bold text-[13px]">{currentAccount.split('@')[0]}</span><span className="text-[11px] font-mono text-on-surface-variant">{currentAccount}</span></div>
                <div className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-mono font-bold w-full">Managed by Zimbra MailOS Node</div>
                <div className="w-full border-t border-outline-variant/20 pt-2.5 flex justify-between gap-2">
                  <button onClick={() => { setShowProfileMenu(false); window.close() }} className="flex-1 py-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-[12px] font-semibold">Close Tab</button>
                  <button onClick={() => { setShowProfileMenu(false); addToast('IMAP Sync', 'Syncing folders via IMAP port 993...', 'success') }} className="flex-1 py-1.5 rounded-lg bg-[#1a73e8] text-white font-bold text-[12px]">Sync Now</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <aside className={`flex flex-col justify-between py-2 border-r flex-shrink-0 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'w-56 px-2' : 'w-12 px-1 items-center'} ${isDark ? 'bg-[#181d22] border-[#2c333a]' : 'bg-[#f6f8fc] border-[#e1e5eb]'}`}>
          <div className="flex flex-col gap-0.5 w-full">
            {/* Compose Button */}
            <button
              onClick={() => { setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeAttachments([]); setShowCompose(true); setIsComposeMinimized(false) }}
              className={`flex items-center gap-2.5 py-2.5 rounded-full bg-[#c2e7ff] text-[#001d35] hover:shadow-md font-semibold text-[13px] transition-all shadow-xs mb-2.5 ${isSidebarOpen ? 'px-4 w-36' : 'w-9 h-9 justify-center px-0'}`}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              {isSidebarOpen && <span>Compose</span>}
            </button>

            {mainFolders.map((f) => (
              <button key={f.id} onClick={() => { setActiveFolder(f.id); setSelectedEmail(null); setSelectedIds([]) }} className={navItemCls(f.id)} title={f.label}>
                <div className="flex items-center gap-2.5"><span className="material-symbols-outlined text-[17px]">{f.icon}</span>{isSidebarOpen && <span>{f.label}</span>}</div>
                {isSidebarOpen && f.count > 0 && <span className="text-[11px] font-bold font-mono">{f.count}</span>}
              </button>
            ))}

            {isSidebarOpen && (
              <>
                <button onClick={() => setIsMoreFoldersOpen((v) => !v)} className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[13px] text-on-surface-variant transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <span className="material-symbols-outlined text-[17px]">{isMoreFoldersOpen ? 'expand_less' : 'expand_more'}</span>
                  <span>{isMoreFoldersOpen ? 'Less' : 'More'}</span>
                </button>
                {isMoreFoldersOpen && (
                  <div className="flex flex-col gap-0.5 pl-1.5">
                    {moreFolders.map((f) => (
                      <button key={f.id} onClick={() => { setActiveFolder(f.id); setSelectedEmail(null); setSelectedIds([]) }} className={navItemCls(f.id)} title={f.label}>
                        <div className="flex items-center gap-2.5"><span className="material-symbols-outlined text-[17px]">{f.icon}</span><span>{f.label}</span></div>
                        {f.count > 0 && <span className="text-[11px] font-bold font-mono">{f.count}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-outline-variant/20 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between px-3.5 py-0.5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Labels</span>
                    <button onClick={() => addToast('New Label', 'Type a name to create a label.', 'info')} className="p-0.5 hover:text-on-surface text-on-surface-variant"><span className="material-symbols-outlined text-[14px]">add</span></button>
                  </div>
                  {[['Work','#1a73e8'],['Finance','#34a853'],['Server','#fbbc04'],['Personal','#ea4335']].map(([name, color]) => (
                    <button key={name} onClick={() => addToast('Label', `Filtering by: ${name}`, 'info')} className={`flex items-center gap-2.5 px-3.5 py-1 rounded-full text-on-surface-variant text-[12px] ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {isSidebarOpen && (
            <div className="px-3.5 py-2 border-t border-outline-variant/20 flex flex-col gap-1 mt-2">
              <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                <span>4.2 GB of 10 GB used</span><span className="font-bold text-[#1a73e8]">42%</span>
              </div>
              <div className="w-full bg-black/10 rounded-full h-1 overflow-hidden">
                <div className="bg-[#1a73e8] h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
              <span className="text-[9px] text-on-surface-variant font-mono">Zimbra 10.0 IMAP</span>
            </div>
          )}
        </aside>

        {/* Center Panel */}
        <div className={`flex-1 flex flex-col overflow-hidden m-1 rounded-xl border shadow-xs ${isDark ? 'bg-[#1e242b] border-[#2f3842]' : 'bg-white border-[#e1e5eb]'}`}>

          {/* Toolbar */}
          <div className={`h-10 px-3 flex items-center justify-between border-b flex-shrink-0 ${isDark ? 'border-[#2f3842]' : 'border-[#e1e5eb]'}`}>
            {selectedEmail && readingPane === 'none' ? (
              <div className="flex items-center gap-0.5">
                <button onClick={() => { setSelectedEmail(null); setShowInlineReply(false) }} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Back"><span className="material-symbols-outlined text-[17px]">arrow_back</span></button>
                <div className="h-4 w-px bg-outline-variant/30 mx-1" />
                <button onClick={() => handleArchiveEmail(selectedEmail.id)} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Archive"><span className="material-symbols-outlined text-[16px]">archive</span></button>
                <button onClick={() => handleSpamEmail(selectedEmail.id)} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Spam"><span className="material-symbols-outlined text-[16px]">report</span></button>
                <button onClick={() => handleDeleteEmail(selectedEmail.id)} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Delete"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                <button onClick={() => { setEmails((p) => p.map((e) => e.id === selectedEmail.id ? { ...e, isUnread: true } : e)); setSelectedEmail(null); addToast('Unread', 'Marked as unread.', 'info') }} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Mark unread"><span className="material-symbols-outlined text-[16px]">mark_email_unread</span></button>
                <button onClick={() => { handleSnooze(selectedEmail.id) }} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Snooze"><span className="material-symbols-outlined text-[16px]">schedule</span></button>
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <button onClick={handleSelectAll} className="p-1 rounded-md hover:bg-black/10 text-on-surface-variant" title="Select all">
                  <span className="material-symbols-outlined text-[17px]">{selectedIds.length === 0 ? 'check_box_outline_blank' : selectedIds.length === visibleEmails.length ? 'check_box' : 'indeterminate_check_box'}</span>
                </button>
                {selectedIds.length > 0 ? (
                  <>
                    <button onClick={() => { setEmails((p) => p.filter((e) => !selectedIds.includes(e.id))); setSelectedIds([]) }} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Archive"><span className="material-symbols-outlined text-[16px]">archive</span></button>
                    <button onClick={handleDeleteSelected} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Delete"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                    <button onClick={() => handleMarkAsRead(true)} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Mark read"><span className="material-symbols-outlined text-[16px]">mark_email_read</span></button>
                    <button onClick={() => handleMarkAsRead(false)} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Mark unread"><span className="material-symbols-outlined text-[16px]">mark_email_unread</span></button>
                    <span className="text-[11px] text-on-surface-variant font-mono ml-1">{selectedIds.length} selected</span>
                  </>
                ) : (
                  <button onClick={() => addToast('Refreshed', 'Checking for new mail via IMAP...', 'info')} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Refresh"><span className="material-symbols-outlined text-[16px]">refresh</span></button>
                )}
              </div>
            )}
            <div className="flex items-center gap-0.5 text-on-surface-variant text-[11px] font-mono">
              <span>1–{visibleEmails.length} of {folderEmails.length}</span>
              <button className="p-1 rounded-full hover:bg-black/10 opacity-40 cursor-not-allowed" title="Newer"><span className="material-symbols-outlined text-[16px]">chevron_left</span></button>
              <button className="p-1 rounded-full hover:bg-black/10 opacity-40 cursor-not-allowed" title="Older"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
            </div>
          </div>

          {/* Category tabs */}
          {activeFolder === 'inbox' && !(selectedEmail && readingPane === 'none') && (
            <div className={`flex border-b flex-shrink-0 ${isDark ? 'border-[#2f3842]' : 'border-[#e1e5eb]'}`}>
              {[
                { id: 'primary', label: 'Primary', icon: 'inbox' },
                { id: 'promotions', label: 'Promotions', icon: 'sell' },
                { id: 'social', label: 'Social', icon: 'group' },
                { id: 'updates', label: 'Updates', icon: 'info' },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 font-medium text-[12.5px] transition-all ${activeCategory === tab.id ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-on-surface-variant hover:bg-black/5'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content area — adapts to readingPane mode */}
          <div className={`flex-1 overflow-hidden ${readingPane === 'right' ? 'flex flex-row' : 'flex flex-col'}`}>

            {/* Email list */}
            {(readingPane !== 'none' || !selectedEmail) && (
              <div className={`overflow-y-auto ${
                readingPane === 'right' ? `w-72 border-r ${isDark ? 'border-[#2f3842]' : 'border-[#e1e5eb]'}` :
                readingPane === 'below' ? `h-48 border-b ${isDark ? 'border-[#2f3842]' : 'border-[#e1e5eb]'}` :
                'flex-1'
              }`}>
                {renderEmailList()}
              </div>
            )}

            {/* Reading pane */}
            {selectedEmail && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 flex flex-col gap-4 max-w-3xl">

                  {/* Subject + labels + star */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <h1 className="text-lg font-bold text-on-surface leading-snug">{selectedEmail.subject}</h1>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedEmail.isImportant && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fbbc04]/15 text-[#ca8a04] dark:text-[#fbbc04] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px] text-[#fbbc04]" style={{ fontVariationSettings: "'FILL' 1" }}>label_important</span>
                            Important
                          </span>
                        )}
                        {selectedEmail.labels.map((lbl) => (
                          <span key={lbl} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a73e8]/10 text-[#1a73e8]">{lbl}</span>
                        ))}
                      </div>
                    </div>
                    {/* Star button in reading pane (Yellow filled when active) */}
                    <button
                      onClick={(ev) => handleToggleStar(ev, selectedEmail.id)}
                      className={`material-symbols-outlined text-[18px] transition-colors p-1 cursor-pointer ${
                        selectedEmail.isStarred ? 'text-[#fbbc04]' : 'text-on-surface-variant hover:text-[#fbbc04]'
                      }`}
                      style={{ fontVariationSettings: selectedEmail.isStarred ? "'FILL' 1" : "'FILL' 0" }}
                      title={selectedEmail.isStarred ? 'Starred' : 'Not starred'}
                    >
                      star
                    </button>
                  </div>

                  {/* From header */}
                  <div className={`flex items-center justify-between rounded-xl p-3 border ${isDark ? 'bg-[#181d22] border-[#2c333a]' : 'bg-[#f8fafc] border-[#e1e5eb]'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-[12px] flex-shrink-0 shadow-xs" style={{ backgroundColor: avatarColor(selectedEmail.fromName) }}>
                        {selectedEmail.fromName[0]?.toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-[13px] text-on-surface">{selectedEmail.fromName}</strong>
                          <span className="text-[11px] font-mono text-on-surface-variant">&lt;{selectedEmail.fromEmail}&gt;</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant"><span>to</span><span className="font-mono">{selectedEmail.toEmail}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-on-surface-variant flex-shrink-0">
                      <span>{selectedEmail.fullDate}</span>
                      <button onClick={() => setShowInlineReply(true)} className="p-1 rounded-full hover:bg-black/10" title="Reply"><span className="material-symbols-outlined text-[16px]">reply</span></button>
                      <button onClick={openForward} className="p-1 rounded-full hover:bg-black/10" title="Forward"><span className="material-symbols-outlined text-[16px]">forward</span></button>
                      <button onClick={() => addToast('Options', 'More email options...', 'info')} className="p-1 rounded-full hover:bg-black/10" title="More"><span className="material-symbols-outlined text-[16px]">more_vert</span></button>
                    </div>
                  </div>

                  {/* Security badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-[11px] font-mono w-fit">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span>Standard encryption (TLS 1.3) · SPF: Pass · DKIM 2048-bit: Valid</span>
                  </div>

                  {/* Attachments */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">{selectedEmail.attachments.length} Attachment(s)</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((att, idx) => (
                          <div key={idx} className={`p-2.5 rounded-lg border flex items-center gap-2.5 shadow-xs min-w-[180px] ${isDark ? 'bg-[#181d22] border-[#2c333a]' : 'bg-[#f8fafc] border-[#cbd5e1]'}`}>
                            <span className="material-symbols-outlined text-[#ea4335] text-[22px]">{att.type === 'pdf' ? 'picture_as_pdf' : att.type === 'img' ? 'image' : 'description'}</span>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-semibold text-on-surface text-[12px] truncate">{att.name}</span>
                              <span className="text-[10px] text-on-surface-variant font-mono">{att.size}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => addToast('Download', `Downloading ${att.name}...`, 'success')} className="p-1 rounded-full hover:bg-primary/20 text-primary" title="Download"><span className="material-symbols-outlined text-[16px]">download</span></button>
                              <button onClick={() => addToast('Preview', `Opening preview for ${att.name}...`, 'info')} className="p-1 rounded-full hover:bg-black/10 text-on-surface-variant" title="Preview"><span className="material-symbols-outlined text-[16px]">open_in_new</span></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-on-surface font-sans py-1">{selectedEmail.body}</div>

                  {/* Reply/Forward buttons */}
                  <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-3">
                    {!showInlineReply ? (
                      <div className="flex gap-2">
                        <button onClick={() => setShowInlineReply(true)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-medium text-[12px] transition-all ${isDark ? 'border-[#3f4852] hover:bg-white/5' : 'border-[#747775] hover:bg-black/5'}`}>
                          <span className="material-symbols-outlined text-[16px]">reply</span>Reply
                        </button>
                        <button onClick={openReply} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-medium text-[12px] transition-all ${isDark ? 'border-[#3f4852] hover:bg-white/5' : 'border-[#747775] hover:bg-black/5'}`}>
                          <span className="material-symbols-outlined text-[16px]">reply_all</span>Reply All
                        </button>
                        <button onClick={openForward} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-medium text-[12px] transition-all ${isDark ? 'border-[#3f4852] hover:bg-white/5' : 'border-[#747775] hover:bg-black/5'}`}>
                          <span className="material-symbols-outlined text-[16px]">forward</span>Forward
                        </button>
                      </div>
                    ) : (
                      <div className={`rounded-xl border shadow-xs ${isDark ? 'bg-[#181d22] border-[#2c333a]' : 'bg-white border-[#cbd5e1]'}`}>
                        <div className="px-3.5 pt-2.5 pb-1.5 border-b border-outline-variant/20 flex items-center justify-between text-[12px] text-on-surface-variant">
                          <span>Reply to <strong className="text-on-surface">{selectedEmail.fromEmail}</strong></span>
                          <button onClick={() => setShowInlineReply(false)}><span className="material-symbols-outlined text-[16px] hover:text-on-surface">close</span></button>
                        </div>
                        <textarea rows={5} value={inlineReply} onChange={(ev) => setInlineReply(ev.target.value)} placeholder="Type your reply..." className="w-full bg-transparent outline-none text-[13px] text-on-surface leading-relaxed resize-y px-3.5 py-2.5" autoFocus />
                        <div className="flex items-center justify-between px-3.5 py-2 border-t border-outline-variant/20">
                          <div className="flex items-center gap-1.5">
                            <button onClick={handleSendInlineReply} className="px-4 py-1.5 rounded-full bg-[#1a73e8] text-white font-semibold text-[12px] hover:brightness-110 flex items-center gap-1.5 shadow-xs">
                              Send <span className="material-symbols-outlined text-[15px]">send</span>
                            </button>
                            <button onClick={() => addToast('Attached', 'File attached to reply.', 'info')} className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant" title="Attach"><span className="material-symbols-outlined text-[16px]">attach_file</span></button>
                          </div>
                          <button onClick={() => { setShowInlineReply(false); setInlineReply('') }} className="p-1.5 text-on-surface-variant hover:text-error" title="Discard"><span className="material-symbols-outlined text-[17px]">delete</span></button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Add-ons Bar */}
        <aside className={`w-11 border-l flex flex-col items-center py-3 gap-3 flex-shrink-0 ${isDark ? 'bg-[#181d22] border-[#2c333a]' : 'bg-[#f6f8fc] border-[#e1e5eb]'}`}>
          {[
            { id: 'calendar', icon: 'calendar_today', title: 'Calendar' },
            { id: 'keep', icon: 'lightbulb', title: 'Keep Notes' },
            { id: 'tasks', icon: 'check_circle', title: 'Tasks' },
            { id: 'contacts', icon: 'account_circle', title: 'Contacts' },
          ].map((app) => (
            <button key={app.id} onClick={() => setActiveRightPanel(activeRightPanel === app.id as any ? null : app.id as any)}
              className={`p-2 rounded-full transition-colors ${activeRightPanel === app.id ? 'bg-primary/15 text-primary' : 'hover:bg-black/10 text-on-surface-variant'}`} title={app.title}
            >
              <span className="material-symbols-outlined text-[18px]">{app.icon}</span>
            </button>
          ))}
        </aside>

        {/* Right Panel Slide-over */}
        {activeRightPanel && (
          <div className={`w-72 border-l p-4 flex flex-col gap-3 flex-shrink-0 overflow-y-auto ${isDark ? 'bg-[#1e242b] border-[#2f3842]' : 'bg-white border-[#e1e5eb]'}`}>
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 flex-shrink-0">
              <h3 className="font-bold text-[14px] capitalize flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[17px]">{activeRightPanel === 'calendar' ? 'calendar_today' : activeRightPanel === 'keep' ? 'lightbulb' : activeRightPanel === 'tasks' ? 'check_circle' : 'account_circle'}</span>
                {activeRightPanel === 'keep' ? 'Keep Notes' : activeRightPanel === 'contacts' ? 'Contacts' : activeRightPanel.charAt(0).toUpperCase() + activeRightPanel.slice(1)}
              </h3>
              <button onClick={() => setActiveRightPanel(null)} className="p-0.5 hover:text-on-surface text-on-surface-variant"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>

            {activeRightPanel === 'calendar' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-[13px]">Today - Aug 19, 2026</span>
                  <button className="text-[#1a73e8] text-[11px] font-semibold">Open</button>
                </div>
                {[
                  { time: '11:00–11:30 AM', title: 'Zimbra FOSS Cutover Meeting', color: '#1a73e8' },
                  { time: '02:00–02:30 PM', title: 'DKIM Key Verification Check', color: '#34a853' },
                  { time: '03:00–04:00 PM', title: 'Enterprise Mail Delivery Review', color: '#9c27b0' },
                ].map((ev, i) => (
                  <div key={i} className="p-2.5 rounded-lg border flex flex-col gap-0.5 cursor-pointer hover:shadow-xs" style={{ borderLeftColor: ev.color, borderLeftWidth: 3 }}>
                    <span className="font-bold text-[11px]" style={{ color: ev.color }}>{ev.time}</span>
                    <span className="text-[12px] text-on-surface">{ev.title}</span>
                  </div>
                ))}
                <button onClick={() => addToast('Event Created', 'New calendar event created.', 'success')} className="flex items-center gap-1.5 text-[#1a73e8] font-semibold text-[12px] mt-0.5 hover:underline">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>New Event
                </button>
              </div>
            )}

            {activeRightPanel === 'keep' && (
              <div className="flex flex-col gap-2.5">
                {[
                  { title: 'DKIM Key Notes', body: 'Selector: zimbra._domainkey (RSA 2048)', color: '#fbbc04' },
                  { title: 'TLS Renewal Date', body: 'Cert expires Sep 1, 2026. Run certbot renew', color: '#ea4335' },
                  { title: 'Postfix Tuning', body: 'smtpd_client_connection_rate_limit = 200', color: '#1a73e8' },
                ].map((note, i) => (
                  <div key={i} className="p-2.5 rounded-lg border cursor-pointer hover:shadow-xs" style={{ borderTopColor: note.color, borderTopWidth: 3 }}>
                    <span className="font-bold text-[12px] text-on-surface">{note.title}</span>
                    <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{note.body}</p>
                  </div>
                ))}
                <button onClick={() => addToast('Note Created', 'New Keep note added.', 'success')} className="flex items-center gap-1.5 text-[#fbbc04] font-semibold text-[12px] mt-0.5 hover:underline">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>New Note
                </button>
              </div>
            )}

            {activeRightPanel === 'tasks' && (
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[13px] mb-1.5">My Tasks</span>
                {[
                  { done: true, text: 'Verify SPF DNS propagation' },
                  { done: false, text: 'Update DMARC policy to p=reject' },
                  { done: false, text: 'Test webmail impersonation flow' },
                  { done: false, text: 'Renew TLS certificate before Sep 1' },
                ].map((task, i) => (
                  <label key={i} className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-black/5 cursor-pointer">
                    <input type="checkbox" defaultChecked={task.done} className="accent-[#1a73e8] w-3.5 h-3.5" />
                    <span className={`text-[12px] ${task.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.text}</span>
                  </label>
                ))}
                <button onClick={() => addToast('Task Added', 'New task created.', 'success')} className="flex items-center gap-1.5 text-[#34a853] font-semibold text-[12px] mt-1.5 hover:underline">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>Add Task
                </button>
              </div>
            )}

            {activeRightPanel === 'contacts' && (
              <div className="flex flex-col gap-2.5">
                <input placeholder="Search contacts..." className={`w-full rounded-full px-3 py-1.5 outline-none text-[12px] border ${isDark ? 'bg-[#252c34] border-[#2f3842]' : 'bg-slate-50 border-slate-200'}`} />
                {[
                  { name: 'Alex Rivera', email: 'alex.rivera@globex.io', color: '#1a73e8' },
                  { name: 'DevOps Weekly', email: 'news@devopsweekly.com', color: '#34a853' },
                  { name: 'Cloud Billing', email: 'invoices@cloud-infra.net', color: '#fbbc04' },
                ].map((c) => (
                  <div key={c.email} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 cursor-pointer">
                    <div className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0" style={{ backgroundColor: c.color }}>{c.name[0]}</div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold text-[12px] text-on-surface">{c.name}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono truncate">{c.email}</span>
                    </div>
                    <button onClick={() => { setComposeTo(c.email); setShowCompose(true) }} className="ml-auto p-1 rounded-full hover:bg-black/10 text-on-surface-variant" title="Send email">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FLOATING COMPOSE ─────────────────────────────────────────── */}
      {showCompose && (
        <div className={`fixed z-50 rounded-t-xl border shadow-2xl flex flex-col ${
          isComposeMaximized ? 'bottom-0 left-1/2 -translate-x-1/2 w-[720px] h-[85vh]' :
          isComposeMinimized ? 'bottom-0 right-16 w-64' :
          'bottom-0 right-16 w-[500px] h-[460px]'
        } ${isDark ? 'bg-[#1e242b] border-[#2f3842]' : 'bg-white border-[#cbd5e1]'}`}>
          {/* Header */}
          <div className={`px-3 py-2 rounded-t-xl flex items-center justify-between flex-shrink-0 cursor-pointer select-none ${isDark ? 'bg-[#181d22]' : 'bg-[#f2f6fc]'}`}
            onClick={() => setIsComposeMinimized((v) => !v)}
          >
            <span className="font-semibold text-[12.5px]">{composeSubject || 'New Message'}</span>
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsComposeMinimized((v) => !v)} className="p-0.5 hover:text-on-surface text-on-surface-variant" title="Minimize">
                <span className="material-symbols-outlined text-[16px]">{isComposeMinimized ? 'expand_less' : 'minimize'}</span>
              </button>
              <button onClick={() => { setIsComposeMaximized((v) => !v); setIsComposeMinimized(false) }} className="p-0.5 hover:text-on-surface text-on-surface-variant" title="Fullscreen">
                <span className="material-symbols-outlined text-[16px]">{isComposeMaximized ? 'close_fullscreen' : 'open_in_full'}</span>
              </button>
              <button onClick={() => { setShowCompose(false); setIsComposeMinimized(false); setIsComposeMaximized(false) }} className="p-0.5 hover:text-on-surface text-on-surface-variant" title="Close">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>

          {!isComposeMinimized && (
            <form onSubmit={handleSendCompose} className="flex-1 flex flex-col overflow-hidden relative">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={composeFileInputRef}
                multiple
                className="hidden"
                onChange={handleAttachFiles}
              />

              {/* Header Fields */}
              <div className="flex flex-col border-b border-outline-variant/20">
                <div className="flex items-center px-3 py-1.5 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant w-7 text-[12px] flex-shrink-0">To</span>
                  <input value={composeTo} onChange={(ev) => setComposeTo(ev.target.value)} placeholder="Recipients" className="flex-1 bg-transparent outline-none text-[12px] font-mono" autoFocus />
                  <button type="button" onClick={() => setShowCc((v) => !v)} className="text-on-surface-variant text-[11px] font-semibold hover:text-on-surface ml-1.5">{showCc ? 'Cc ▴' : 'Cc'}</button>
                </div>
                {showCc && (
                  <div className="flex items-center px-3 py-1.5 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant w-7 text-[12px] flex-shrink-0">Cc</span>
                    <input value={composeCc} onChange={(ev) => setComposeCc(ev.target.value)} placeholder="CC Recipients" className="flex-1 bg-transparent outline-none text-[12px] font-mono" />
                  </div>
                )}
                <div className="flex items-center px-3 py-1.5">
                  <input value={composeSubject} onChange={(ev) => setComposeSubject(ev.target.value)} placeholder="Subject" className="w-full bg-transparent outline-none text-[12.5px] font-semibold" />
                </div>
              </div>

              {/* Formatting Toolbar (when toggled) */}
              {showFormatting && (
                <div className={`px-3 py-1 border-b flex items-center gap-1 flex-wrap ${isDark ? 'bg-[#181d22] border-[#2f3842]' : 'bg-[#f8fafc] border-[#e1e5eb]'}`}>
                  <button type="button" onClick={() => applyFormatting('bold')} className="p-1 rounded hover:bg-black/10 font-bold text-[12px] w-6 h-6 flex items-center justify-center" title="Bold">B</button>
                  <button type="button" onClick={() => applyFormatting('italic')} className="p-1 rounded hover:bg-black/10 italic text-[12px] w-6 h-6 flex items-center justify-center" title="Italic">I</button>
                  <button type="button" onClick={() => applyFormatting('underline')} className="p-1 rounded hover:bg-black/10 underline text-[12px] w-6 h-6 flex items-center justify-center" title="Underline">U</button>
                  <div className="w-px h-3.5 bg-outline-variant/30 mx-0.5" />
                  <button type="button" onClick={() => applyFormatting('h2')} className="p-1 rounded hover:bg-black/10 font-bold text-[11px] px-1" title="Heading">H2</button>
                  <button type="button" onClick={() => applyFormatting('bullet')} className="p-1 rounded hover:bg-black/10 text-[13px] w-6 h-6 flex items-center justify-center" title="Bullet list">•</button>
                  <button type="button" onClick={() => applyFormatting('quote')} className="p-1 rounded hover:bg-black/10 text-[12px] w-6 h-6 flex items-center justify-center" title="Quote">&quot;</button>
                  <button type="button" onClick={() => applyFormatting('code')} className="p-1 rounded hover:bg-black/10 text-[11px] font-mono w-6 h-6 flex items-center justify-center" title="Code">&lt;&gt;</button>
                </div>
              )}

              {/* Attached Files Chips */}
              {composeAttachments.length > 0 && (
                <div className={`px-3 py-1.5 flex flex-wrap gap-1.5 border-b max-h-24 overflow-y-auto ${isDark ? 'bg-[#181d22] border-[#2f3842]' : 'bg-[#f1f5f9] border-[#e1e5eb]'}`}>
                  {composeAttachments.map((att, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] border shadow-xs ${isDark ? 'bg-[#252c34] border-[#3f4852]' : 'bg-white border-slate-300'}`}>
                      <span className="material-symbols-outlined text-[13px] text-[#ea4335]">
                        {att.type === 'pdf' ? 'picture_as_pdf' : att.type === 'img' ? 'image' : 'description'}
                      </span>
                      <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">({att.size})</span>
                      <button type="button" onClick={() => removeAttachment(i)} className="text-on-surface-variant hover:text-error ml-0.5">
                        <span className="material-symbols-outlined text-[13px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Link Modal */}
              {showLinkModal && (
                <div className={`absolute top-24 left-4 right-4 p-3 rounded-xl border shadow-xl z-20 flex flex-col gap-2 ${isDark ? 'bg-[#1e242b] border-[#3f4852]' : 'bg-white border-slate-300'}`}>
                  <div className="flex items-center justify-between text-[12px] font-semibold">
                    <span>Insert Link</span>
                    <button type="button" onClick={() => setShowLinkModal(false)}><span className="material-symbols-outlined text-[15px]">close</span></button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Text to display" className={`px-2.5 py-1 text-[12px] rounded border outline-none ${isDark ? 'bg-[#252c34] border-[#3f4852]' : 'bg-slate-50 border-slate-200'}`} />
                    <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Web URL (e.g. https://example.com)" className={`px-2.5 py-1 text-[12px] rounded border outline-none font-mono ${isDark ? 'bg-[#252c34] border-[#3f4852]' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button type="button" onClick={() => setShowLinkModal(false)} className="px-2.5 py-1 text-[11px] rounded border">Cancel</button>
                    <button type="button" onClick={handleInsertLink} className="px-3 py-1 text-[11px] rounded bg-[#1a73e8] text-white font-semibold">Insert</button>
                  </div>
                </div>
              )}

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className={`absolute bottom-12 left-24 p-2 rounded-xl border shadow-2xl z-30 w-64 max-h-48 overflow-y-auto grid grid-cols-8 gap-1 ${isDark ? 'bg-[#1e242b] border-[#3f4852]' : 'bg-white border-slate-300'}`}>
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-black/10 rounded text-[16px] transition-transform active:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Text Area */}
              <textarea
                ref={composeTextareaRef}
                value={composeBody}
                onChange={(ev) => setComposeBody(ev.target.value)}
                placeholder="Compose email..."
                className="flex-1 w-full bg-transparent outline-none px-3 py-2.5 text-[13px] leading-relaxed resize-none"
              />

              {/* Bottom Toolbar */}
              <div className={`flex items-center justify-between px-3 py-2 border-t border-outline-variant/20 flex-shrink-0 ${isDark ? 'bg-[#181d22]' : 'bg-[#f2f6fc]'}`}>
                <div className="flex items-center gap-1.5">
                  {/* Send button */}
                  <button type="submit" disabled={isSending} className="px-4 py-1.5 rounded-full bg-[#1a73e8] text-white font-bold text-[12px] hover:brightness-110 flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer">
                    {isSending ? <><span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>Sending...</> : <>Send <span className="material-symbols-outlined text-[15px]">send</span></>}
                  </button>

                  {/* Functional Action Icons next to Send */}
                  <div className="flex items-center gap-0.5 text-on-surface-variant">
                    {/* Attach File */}
                    <button
                      type="button"
                      onClick={() => composeFileInputRef.current?.click()}
                      className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${composeAttachments.length > 0 ? 'text-[#1a73e8]' : ''}`}
                      title="Attach files"
                    >
                      <span className="material-symbols-outlined text-[16px]">attach_file</span>
                    </button>

                    {/* Formatting */}
                    <button
                      type="button"
                      onClick={() => setShowFormatting((v) => !v)}
                      className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${showFormatting ? 'text-[#1a73e8] bg-black/10' : ''}`}
                      title="Formatting options"
                    >
                      <span className="material-symbols-outlined text-[16px]">format_color_text</span>
                    </button>

                    {/* Insert Link */}
                    <button
                      type="button"
                      onClick={() => setShowLinkModal((v) => !v)}
                      className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${showLinkModal ? 'text-[#1a73e8]' : ''}`}
                      title="Insert link"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                    </button>

                    {/* Emoji */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${showEmojiPicker ? 'text-[#1a73e8]' : ''}`}
                      title="Insert emoji"
                    >
                      <span className="material-symbols-outlined text-[16px]">mood</span>
                    </button>

                    {/* Signature */}
                    <button
                      type="button"
                      onClick={insertSignature}
                      className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
                      title="Insert signature"
                    >
                      <span className="material-symbols-outlined text-[16px]">draw</span>
                    </button>
                  </div>
                </div>

                {/* Discard button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCompose(false)
                    setComposeTo('')
                    setComposeCc('')
                    setComposeSubject('')
                    setComposeBody('')
                    setComposeAttachments([])
                    setShowFormatting(false)
                    addToast('Draft Discarded', 'Draft was discarded.', 'info')
                  }}
                  className="p-1.5 rounded-full hover:bg-black/10 text-on-surface-variant hover:text-error"
                  title="Discard draft"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function WebmailPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-[#0f1418] text-[#1a73e8] font-mono text-sm gap-2">
        <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
        Loading Zimbra Webmail...
      </div>
    }>
      <WebmailContent />
    </Suspense>
  )
}
