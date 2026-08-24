'use client'
import { useState, useEffect } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/context/ToastContext'

interface AccountItem {
  id: string
  email: string
  displayName: string
  status: string
  quotaUsed: number
  quotaMax: number
  aliases: string[]
  forwards: string[]
  lastLogin: string
  imap: boolean
  pop3: boolean
}

interface DistributionList {
  id: string
  email: string
  name: string
  membersCount: number
  members: string[]
}

const INITIAL_ACCOUNTS: AccountItem[] = [
  {
    id: 'acc1',
    email: 'admin@example.com',
    displayName: 'System Administrator',
    status: 'active',
    quotaUsed: 4.2,
    quotaMax: 10,
    aliases: ['hostmaster@example.com', 'postmaster@example.com', 'security@example.com'],
    forwards: ['backup-inbox@internal.net'],
    lastLogin: '2 mins ago',
    imap: true,
    pop3: false,
  },
  {
    id: 'acc2',
    email: 'sales@example.com',
    displayName: 'Shared Mailbox',
    status: 'active',
    quotaUsed: 48.5,
    quotaMax: 50,
    aliases: ['info@example.com', 'leads@example.com'],
    forwards: ['crm-inbox@internal.net'],
    lastLogin: '1 hr ago',
    imap: true,
    pop3: true,
  },
  {
    id: 'acc3',
    email: 'j.doe@example.com',
    displayName: 'Former Employee',
    status: 'suspended',
    quotaUsed: 2.1,
    quotaMax: 5,
    aliases: [],
    forwards: [],
    lastLogin: '3 mos ago',
    imap: false,
    pop3: false,
  },
]

const INITIAL_GROUPS: DistributionList[] = [
  {
    id: 'grp1',
    email: 'all@example.com',
    name: 'All Employees',
    membersCount: 42,
    members: ['admin@example.com', 'sales@example.com', 'j.doe@example.com'],
  },
  {
    id: 'grp2',
    email: 'devs@example.com',
    name: 'Engineering Team',
    membersCount: 14,
    members: ['admin@example.com', 'tech@example.com'],
  },
]

export default function MailboxesPage() {
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState<'accounts' | 'groups'>('accounts')
  const [accounts, setAccounts] = useState<AccountItem[]>(INITIAL_ACCOUNTS)
  const [groups, setGroups] = useState<DistributionList[]>(INITIAL_GROUPS)
  const [selected, setSelected] = useState<AccountItem | null>(INITIAL_ACCOUNTS[1])
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('All')
  const [isSavingDetails, setIsSavingDetails] = useState(false)

  // Load persisted accounts & groups on mount
  useEffect(() => {
    const storedAccs = localStorage.getItem('mailos_accounts')
    if (storedAccs) {
      try {
        const parsed = JSON.parse(storedAccs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed)
          setSelected(parsed[0])
        }
      } catch (e) {
        console.error(e)
      }
    }
    const storedGrps = localStorage.getItem('mailos_groups')
    if (storedGrps) {
      try {
        const parsed = JSON.parse(storedGrps)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const persistAccounts = (updated: AccountItem[]) => {
    setAccounts(updated)
    localStorage.setItem('mailos_accounts', JSON.stringify(updated))
  }

  const persistGroups = (updated: DistributionList[]) => {
    setGroups(updated)
    localStorage.setItem('mailos_groups', JSON.stringify(updated))
  }

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newQuota, setNewQuota] = useState(10)

  const [showCsvModal, setShowCsvModal] = useState(false)
  const [showResetPassModal, setShowResetPassModal] = useState(false)
  const [resetPassValue, setResetPassValue] = useState('')

  const [showAliasModal, setShowAliasModal] = useState(false)
  const [newAliasValue, setNewAliasValue] = useState('')
  const [aliasType, setAliasType] = useState<'alias' | 'forward'>('alias')

  const [showGroupModal, setShowGroupModal] = useState(false)
  const [newGroupEmail, setNewGroupEmail] = useState('')
  const [newGroupName, setNewGroupName] = useState('')

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.displayName.toLowerCase().includes(search.toLowerCase())
    const matchesDomain = domainFilter === 'All' || a.email.endsWith(`@${domainFilter}`)
    return matchesSearch && matchesDomain
  })

  const handleCreate = () => {
    if (!newEmail.trim()) {
      addToast('Email Required', 'Please enter a valid email address.', 'error')
      return
    }
    const newAcc: AccountItem = {
      id: `acc_${Math.random().toString(36).substring(2, 7)}`,
      email: newEmail.trim(),
      displayName: newDisplayName.trim() || newEmail.split('@')[0],
      status: 'active',
      quotaUsed: 0.1,
      quotaMax: newQuota,
      aliases: [],
      forwards: [],
      lastLogin: 'Never',
      imap: true,
      pop3: false,
    }
    const updated = [...accounts, newAcc]
    persistAccounts(updated)
    setSelected(newAcc)
    addToast('Account Created', `Mailbox ${newAcc.email} has been provisioned on Zimbra.`, 'success')
    setNewEmail('')
    setNewPassword('')
    setNewDisplayName('')
    setShowCreateModal(false)
  }

  const handleDelete = (id: string, email: string) => {
    if (confirm(`Are you sure you want to delete mailbox ${email}? All emails will be permanently removed.`)) {
      const updated = accounts.filter((a) => a.id !== id)
      persistAccounts(updated)
      if (selected?.id === id) setSelected(updated[0] || null)
      addToast('Mailbox Deleted', `${email} removed.`, 'info')
    }
  }

  const handleImpersonate = (email: string) => {
    addToast(
      'Webmail Session Initialized',
      `Opening Zimbra Webmail client for ${email} in a new tab...`,
      'info'
    )
    window.open(`/webmail?account=${encodeURIComponent(email)}`, '_blank')
  }

  const handleSaveDetails = () => {
    if (!selected) return
    const updated = accounts.map((a) => (a.id === selected.id ? selected : a))
    persistAccounts(updated)
    setIsSavingDetails(true)
    addToast(
      'Changes Saved',
      `Quota (${selected.quotaMax} GB) and settings for ${selected.email} saved successfully.`,
      'success'
    )
    setTimeout(() => setIsSavingDetails(false), 2000)
  }

  const handleResetPassword = () => {
    if (!resetPassValue.trim()) {
      addToast('Password Required', 'Please enter a new password.', 'error')
      return
    }
    setShowResetPassModal(false)
    setResetPassValue('')
    addToast('Password Changed', `Password for ${selected?.email} updated.`, 'success')
  }

  const handleAddAlias = () => {
    if (!newAliasValue.trim() || !selected) return
    let updatedAcc: AccountItem
    if (aliasType === 'alias') {
      updatedAcc = { ...selected, aliases: [...selected.aliases, newAliasValue.trim()] }
      addToast('Alias Added', `${newAliasValue} linked to ${selected.email}.`, 'success')
    } else {
      updatedAcc = { ...selected, forwards: [...selected.forwards, newAliasValue.trim()] }
      addToast('Forwarding Rule Added', `Messages forwarded to ${newAliasValue}.`, 'success')
    }
    setSelected(updatedAcc)
    const updatedList = accounts.map((a) => (a.id === updatedAcc.id ? updatedAcc : a))
    persistAccounts(updatedList)
    setNewAliasValue('')
    setShowAliasModal(false)
  }

  const handleCreateGroup = () => {
    if (!newGroupEmail.trim()) return
    const newGrp: DistributionList = {
      id: `grp_${Math.random().toString(36).substring(2, 7)}`,
      email: newGroupEmail.trim(),
      name: newGroupName.trim() || newGroupEmail.split('@')[0],
      membersCount: 1,
      members: ['admin@example.com'],
    }
    const updated = [...groups, newGrp]
    persistGroups(updated)
    setNewGroupEmail('')
    setNewGroupName('')
    setShowGroupModal(false)
    addToast('Distribution List Created', `${newGrp.email} is ready.`, 'success')
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg">
      {/* Header */}
      <div className="flex flex-row justify-between items-end gap-md">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-md">
            <h1 className="text-headline-md font-headline-md text-on-surface font-semibold">Mailbox Management</h1>
            {/* Tab Switcher */}
            <div className="flex bg-surface-container rounded-lg p-base border border-outline-variant/20">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-md py-xs rounded text-body-sm font-semibold transition-all ${
                  activeTab === 'accounts' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Accounts ({accounts.length})
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`px-md py-xs rounded text-body-sm font-semibold transition-all ${
                  activeTab === 'groups' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Distribution Lists ({groups.length})
              </button>
            </div>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Manage user accounts, aliases, storage quotas, and distribution groups across all active domains.
          </p>
        </div>
        <div className="flex flex-row gap-sm">
          {activeTab === 'accounts' ? (
            <>
              <button
                onClick={() => setShowCsvModal(true)}
                className="flex items-center justify-center gap-xs px-md py-sm bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors rounded-lg text-label-caps"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Import CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-xs px-md py-sm bg-primary text-on-primary hover:brightness-110 transition-colors rounded-lg text-label-caps font-bold shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Create Account
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center justify-center gap-xs px-md py-sm bg-primary text-on-primary hover:brightness-110 transition-colors rounded-lg text-label-caps font-bold shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              Create Group
            </button>
          )}
        </div>
      </div>

      {activeTab === 'accounts' ? (
        <div className="flex flex-row gap-lg flex-1 min-h-0">
          {/* Main Table Area */}
          <div className="flex-1 bg-surface-container-low rounded-xl overflow-hidden shadow-md flex flex-col border border-outline-variant/20">
            <div className="px-md py-sm bg-surface-container flex flex-row items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-sm">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    search
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-surface-container-highest text-on-surface text-body-sm rounded-lg pl-9 pr-sm py-xs outline-none focus:ring-1 focus:ring-primary w-64 transition-all placeholder:text-on-surface-variant"
                    placeholder="Filter addresses..."
                    type="text"
                  />
                </div>
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="bg-surface-container-highest text-on-surface text-body-sm rounded-lg px-sm py-xs outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="All">All Domains</option>
                  <option value="example.com">example.com</option>
                  <option value="mailos.local">mailos.local</option>
                </select>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-body-sm text-on-surface-variant">Showing 1-{filtered.length} of {accounts.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container shadow-sm z-10">
                  <tr>
                    <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium">Account</th>
                    <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium">Status</th>
                    <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium w-48">Storage Quota</th>
                    <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium text-right">Aliases</th>
                    <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium text-right">Last Login</th>
                    <th className="px-md py-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest">
                  {filtered.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => setSelected(acc)}
                      className={`hover:bg-surface-container-highest/50 transition-colors group cursor-pointer ${
                        selected?.id === acc.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-md py-sm">
                        <div className="flex items-center gap-sm">
                          <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary font-bold">
                            {acc.displayName[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-body-sm text-on-surface font-medium">{acc.email}</span>
                            <span className="text-code-sm text-on-surface-variant">{acc.displayName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-sm">
                        <StatusBadge status={acc.status} />
                      </td>
                      <td className="px-md py-sm">
                        <div className="flex flex-col gap-xs">
                          <div className="flex justify-between text-code-sm font-mono text-on-surface-variant">
                            <span>{acc.quotaUsed} GB</span>
                            <span>{acc.quotaMax} GB</span>
                          </div>
                          <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                acc.quotaUsed / acc.quotaMax > 0.9 ? 'bg-error' : 'bg-primary'
                              }`}
                              style={{ width: `${(acc.quotaUsed / acc.quotaMax) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-sm text-right font-mono text-data-mono text-on-surface">
                        {acc.aliases.length}
                      </td>
                      <td className="px-md py-sm text-right text-code-sm text-on-surface-variant">{acc.lastLogin}</td>
                      <td className="px-md py-sm text-right">
                        <div className="flex items-center justify-end gap-xs" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleImpersonate(acc.email)}
                            className="p-xs text-primary hover:bg-primary/20 rounded transition-colors"
                            title="Open in Webmail (Impersonate)"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id, acc.email)}
                            className="p-xs text-on-surface-variant hover:text-error transition-colors rounded"
                            title="Delete mailbox"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Detail Panel */}
          {selected && (
            <div className="w-96 bg-surface-container-low rounded-xl p-md flex flex-col gap-md border border-outline-variant/20 shadow-md">
              <div className="flex items-center justify-between pb-sm border-b border-outline-variant/20">
                <h2 className="text-headline-sm text-on-surface font-semibold">Account Details</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-tertiary/20 flex items-center justify-center text-tertiary text-headline-md font-bold">
                  {selected.displayName[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-body-md text-on-surface font-semibold">{selected.email}</span>
                  <span className="text-code-sm text-on-surface-variant">
                    {selected.displayName} • <StatusBadge status={selected.status} />
                  </span>
                </div>
              </div>

              <div className="flex gap-sm">
                <button
                  onClick={() => setShowResetPassModal(true)}
                  className="flex-1 flex items-center justify-center gap-xs py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm hover:bg-surface-container-highest transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    const newStatus = selected.status === 'active' ? 'suspended' : 'active'
                    setSelected({ ...selected, status: newStatus })
                    setAccounts(accounts.map((a) => (a.id === selected.id ? { ...a, status: newStatus } : a)))
                    addToast('Account Status Changed', `${selected.email} is now ${newStatus}.`, 'info')
                  }}
                  className="flex-1 flex items-center justify-center gap-xs py-sm bg-surface-container-high text-on-surface-variant rounded-lg text-body-sm hover:bg-surface-container-highest transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  {selected.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>

              {/* Storage & Limits */}
              <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-label-caps text-on-surface-variant uppercase font-bold">Storage & Quota</span>
                  <span className="text-code-sm font-mono text-primary font-bold">
                    {selected.quotaUsed} GB Used ({Math.round((selected.quotaUsed / (selected.quotaMax || 1)) * 100)}%)
                  </span>
                </div>

                {/* Direct Number Input & Preset Buttons */}
                <div className="flex items-center gap-sm">
                  <div className="flex-1 flex items-center bg-surface-container rounded-lg border border-outline-variant/30 px-sm py-xs">
                    <input
                      type="number"
                      min={Math.ceil(selected.quotaUsed) || 1}
                      max="500"
                      value={selected.quotaMax}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || Math.ceil(selected.quotaUsed) || 1
                        setSelected({ ...selected, quotaMax: val })
                      }}
                      className="w-full bg-transparent text-on-surface font-mono font-bold text-body-md outline-none"
                    />
                    <span className="text-body-sm text-on-surface-variant font-medium ml-1">GB</span>
                  </div>

                  {/* Preset Chips */}
                  <div className="flex gap-1">
                    {[10, 25, 50, 100].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelected({ ...selected, quotaMax: size })}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                          selected.quotaMax === size
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                        }`}
                      >
                        {size}G
                      </button>
                    ))}
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="5"
                  max="250"
                  value={selected.quotaMax}
                  onChange={(e) => setSelected({ ...selected, quotaMax: parseInt(e.target.value) })}
                  className="w-full accent-primary cursor-pointer mt-1"
                />

                <div className="flex justify-between items-center py-xs">
                  <span className="text-body-sm text-on-surface font-medium">IMAP Protocol Access</span>
                  <button
                    onClick={() => setSelected({ ...selected, imap: !selected.imap })}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      selected.imap ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
                        selected.imap ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-on-surface-variant'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex justify-between items-center py-xs">
                  <span className="text-body-sm text-on-surface font-medium">POP3 Protocol Access</span>
                  <button
                    onClick={() => setSelected({ ...selected, pop3: !selected.pop3 })}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      selected.pop3 ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
                        selected.pop3 ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-on-surface-variant'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Forwarding & Aliases */}
              <div className="flex flex-col gap-xs pt-sm border-t border-outline-variant/20">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-label-caps text-on-surface-variant uppercase font-bold">Forwarding & Aliases</span>
                  <button
                    onClick={() => setShowAliasModal(true)}
                    className="text-primary text-code-sm hover:brightness-110 font-bold"
                  >
                    + Add New
                  </button>
                </div>
                {selected.aliases.map((al) => (
                  <div key={al} className="text-body-sm text-on-surface flex items-center justify-between">
                    <span>{al}</span>
                    <span className="text-code-sm text-on-surface-variant font-mono">(Alias)</span>
                  </div>
                ))}
                {selected.forwards.map((fw) => (
                  <div key={fw} className="flex items-center justify-between text-body-sm">
                    <span className="flex items-center gap-xs text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[16px]">arrow_forward</span>
                      {fw}
                    </span>
                    <span className="text-code-sm text-on-surface-variant font-mono">(Forward)</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-sm mt-auto pt-sm">
                <button
                  onClick={() => handleImpersonate(selected.email)}
                  className="flex-1 py-sm bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-lg text-body-sm font-semibold transition-colors flex items-center justify-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Webmail
                </button>
                <button
                  onClick={handleSaveDetails}
                  className={`flex-1 py-sm rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-xs ${
                    isSavingDetails
                      ? 'bg-secondary text-on-secondary shadow-secondary/20'
                      : 'bg-primary text-on-primary hover:brightness-110 shadow-primary/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSavingDetails ? 'check' : 'save'}
                  </span>
                  {isSavingDetails ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Distribution Lists Tab View */
        <div className="bg-surface-container rounded-xl shadow-md overflow-hidden border border-outline-variant/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20">
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Group Address</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Group Name</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Member Accounts</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="p-md font-mono text-body-sm text-primary font-bold">{g.email}</td>
                  <td className="p-md text-body-sm text-on-surface">{g.name}</td>
                  <td className="p-md text-body-sm text-on-surface-variant font-mono">{g.membersCount} recipients</td>
                  <td className="p-md text-right">
                    <button
                      onClick={() => {
                        setGroups(groups.filter((item) => item.id !== g.id))
                        addToast('Group Deleted', `${g.email} removed.`, 'info')
                      }}
                      className="p-xs text-on-surface-variant hover:text-error rounded"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">Create New Account</h2>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Email Address</label>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 font-mono text-body-sm"
                placeholder="user@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Display Name</label>
              <input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Storage Quota (GB)</label>
              <input
                type="number"
                value={newQuota}
                onChange={(e) => setNewQuota(parseInt(e.target.value) || 10)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm font-mono"
              />
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Initial Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm"
                placeholder="••••••••••••"
              />
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm hover:bg-surface-container-highest"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:brightness-110"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">upload_file</span>
              Bulk CSV Import
            </h2>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Upload a CSV file containing <code>email,display_name,quota,password</code> columns to provision multiple accounts simultaneously.
            </p>
            <div className="border-2 border-dashed border-outline-variant/40 rounded-xl p-lg text-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-primary text-[36px] mb-xs">cloud_upload</span>
              <div className="text-body-sm font-bold text-on-surface">Click to select .csv file</div>
              <div className="text-code-sm text-on-surface-variant">or drag and drop here</div>
            </div>
            <div className="flex justify-between items-center pt-sm border-t border-outline-variant/20">
              <button
                onClick={() => addToast('Template Downloaded', 'mailos_template.csv saved.', 'info')}
                className="text-primary text-code-sm hover:underline"
              >
                Download Sample CSV
              </button>
              <button
                onClick={() => {
                  setShowCsvModal(false)
                  addToast('CSV Processed', '5 accounts imported successfully.', 'success')
                }}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Import Accounts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">Reset Password</h2>
            <p className="text-body-sm text-on-surface-variant">
              Enter new password for <strong>{selected?.email}</strong>
            </p>
            <input
              type="password"
              value={resetPassValue}
              onChange={(e) => setResetPassValue(e.target.value)}
              className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm"
              placeholder="Enter new password"
              autoFocus
            />
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowResetPassModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alias / Forward Modal */}
      {showAliasModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">Add Alias or Forwarding Rule</h2>
            <div className="flex gap-sm bg-surface-container p-xs rounded-lg">
              <button
                onClick={() => setAliasType('alias')}
                className={`flex-1 py-xs rounded text-body-sm font-semibold transition-all ${
                  aliasType === 'alias' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                Email Alias
              </button>
              <button
                onClick={() => setAliasType('forward')}
                className={`flex-1 py-xs rounded text-body-sm font-semibold transition-all ${
                  aliasType === 'forward' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                External Forward
              </button>
            </div>
            <input
              value={newAliasValue}
              onChange={(e) => setNewAliasValue(e.target.value)}
              className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm font-mono"
              placeholder={aliasType === 'alias' ? 'e.g. contact@example.com' : 'e.g. external@gmail.com'}
              autoFocus
            />
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowAliasModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAlias}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">Create Distribution List</h2>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Group Email Address</label>
              <input
                value={newGroupEmail}
                onChange={(e) => setNewGroupEmail(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm font-mono"
                placeholder="e.g. team@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Group Display Name</label>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm"
                placeholder="Marketing Team"
              />
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
