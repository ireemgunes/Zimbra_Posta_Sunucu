'use client'
import { useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/context/ToastContext'
import { copyText } from '@/lib/clipboard'

interface DomainItem {
  id: string
  name: string
  status: string
  dns: {
    mx: boolean
    spf: boolean
    dkim: boolean
    dmarc: boolean
  }
  mailboxes: number
}

const INITIAL_DOMAINS: DomainItem[] = [
  {
    id: 'dom_8x92j4kl',
    name: 'acmecorp.com',
    status: 'active',
    dns: { mx: true, spf: true, dkim: true, dmarc: true },
    mailboxes: 1245,
  },
  {
    id: 'dom_77xp19',
    name: 'globex.io',
    status: 'error',
    dns: { mx: true, spf: true, dkim: false, dmarc: false },
    mailboxes: 8,
  },
  {
    id: 'dom_3mqw42',
    name: 'mail.starkindustries.com',
    status: 'active',
    dns: { mx: true, spf: true, dkim: true, dmarc: true },
    mailboxes: 9442,
  },
  {
    id: 'dom_99lok1',
    name: 'mailos.local',
    status: 'active',
    dns: { mx: true, spf: true, dkim: true, dmarc: true },
    mailboxes: 14,
  },
]

export default function DomainsPage() {
  const { addToast } = useToast()

  const [domains, setDomains] = useState<DomainItem[]>(INITIAL_DOMAINS)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'error'>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  const [newDkimBit, setNewDkimBit] = useState('2048')

  const [dnsModalDomain, setDnsModalDomain] = useState<DomainItem | null>(null)
  const [isVerifyingDns, setIsVerifyingDns] = useState(false)
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null)

  const filtered = domains.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filterStatus === 'all' || d.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleAddDomain = () => {
    if (!newDomainName.trim()) {
      addToast('Domain Name Required', 'Please enter a valid domain name.', 'error')
      return
    }
    const newDomain: DomainItem = {
      id: `dom_${Math.random().toString(36).substring(2, 9)}`,
      name: newDomainName.trim(),
      status: 'active',
      dns: { mx: true, spf: true, dkim: true, dmarc: true },
      mailboxes: 0,
    }
    setDomains([...domains, newDomain])
    addToast(
      'Domain Created Successfully',
      `${newDomain.name} added with ${newDkimBit}-bit DKIM keys generated.`,
      'success'
    )
    setNewDomainName('')
    setShowAddModal(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? All associated mailboxes will be affected.`)) {
      setDomains(domains.filter((d) => d.id !== id))
      addToast('Domain Deleted', `${name} has been removed from Zimbra MTA.`, 'info')
    }
  }

  const handleCopyRecord = async (text: string, recordType: string) => {
    const success = await copyText(text)
    if (success) {
      setCopiedRecord(recordType)
      addToast('Copied to Clipboard', `${recordType} record copied.`, 'success')
      setTimeout(() => setCopiedRecord(null), 2000)
    } else {
      addToast('Copy Failed', 'Please copy manually.', 'error')
    }
  }

  const handleVerifyDns = () => {
    setIsVerifyingDns(true)
    setTimeout(() => {
      setIsVerifyingDns(false)
      if (dnsModalDomain) {
        setDomains(
          domains.map((d) =>
            d.id === dnsModalDomain.id
              ? { ...d, status: 'active', dns: { mx: true, spf: true, dkim: true, dmarc: true } }
              : d
          )
        )
        setDnsModalDomain({
          ...dnsModalDomain,
          status: 'active',
          dns: { mx: true, spf: true, dkim: true, dmarc: true },
        })
      }
      addToast('DNS Verified', 'All DNS propagation checks (MX, SPF, DKIM, DMARC) passed.', 'success')
    }, 1200)
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-sm">
        <div className="flex flex-col gap-base">
          <h1 className="text-display-lg text-on-surface tracking-tight font-bold">Domain Management</h1>
          <p className="text-body-md text-on-surface-variant">
            Configure and monitor active mail domains, DNS records, and routing rules.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg hover:brightness-110 transition-all text-headline-sm font-semibold shadow-md"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Add Domain
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-12 gap-lg mb-md">
        <div className="col-span-12 md:col-span-8 flex gap-sm relative">
          <div className="relative w-full max-w-md group shadow-sm rounded-lg">
            <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border-none rounded-lg pl-[44px] pr-md py-sm text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant"
              placeholder="Search domains by name or status..."
              type="text"
            />
          </div>

          {/* Filter Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-xs px-md py-sm rounded-lg text-body-md shadow-sm transition-colors ${
                filterStatus !== 'all'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              {filterStatus === 'all' ? 'Filters' : `Filter: ${filterStatus.toUpperCase()}`}
            </button>

            {showFilterDropdown && (
              <div className="absolute left-0 top-full mt-xs w-44 bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-2xl p-xs z-50 flex flex-col gap-xs">
                <button
                  onClick={() => {
                    setFilterStatus('all')
                    setShowFilterDropdown(false)
                  }}
                  className={`px-sm py-xs text-left rounded-lg text-body-sm ${
                    filterStatus === 'all' ? 'bg-primary/20 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  All Domains
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('active')
                    setShowFilterDropdown(false)
                  }}
                  className={`px-sm py-xs text-left rounded-lg text-body-sm ${
                    filterStatus === 'active' ? 'bg-secondary/20 text-secondary font-bold' : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Active Only
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('error')
                    setShowFilterDropdown(false)
                  }}
                  className={`px-sm py-xs text-left rounded-lg text-body-sm ${
                    filterStatus === 'error' ? 'bg-error/20 text-error font-bold' : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  DNS Issues Only
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="col-span-12 md:col-span-4 flex justify-end items-center gap-sm">
          <span className="text-body-sm text-on-surface-variant">
            Showing {filtered.length} of {domains.length} domains
          </span>
          <div className="flex gap-base bg-surface-container rounded-lg p-base shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-xs rounded transition-colors ${
                viewMode === 'grid' ? 'bg-surface-container-highest text-on-surface font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-xs rounded transition-colors ${
                viewMode === 'list' ? 'bg-surface-container-highest text-on-surface font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {viewMode === 'list' ? (
        <div className="bg-surface-container rounded-xl shadow-md overflow-hidden border border-outline-variant/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20">
                <th className="p-md text-label-caps text-on-surface-variant uppercase tracking-wider">Domain Name</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase tracking-wider">DNS Health & Guide</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase tracking-wider text-right">Mailboxes</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {filtered.map((d) => (
                <tr key={d.id} className="group hover:bg-surface-container-high transition-colors">
                  <td className="p-md">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined">domain</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-headline-sm text-on-surface font-semibold">{d.name}</span>
                        <span className="text-code-sm font-mono text-on-surface-variant">ID: {d.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-md">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="p-md">
                    <div className="flex items-center gap-sm">
                      <div className="flex gap-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-code-sm ${
                            d.dns.mx ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'
                          }`}
                        >
                          MX
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-code-sm ${
                            d.dns.spf ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'
                          }`}
                        >
                          SPF
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-code-sm ${
                            d.dns.dkim ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'
                          }`}
                        >
                          DKIM
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-code-sm ${
                            d.dns.dmarc ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'
                          }`}
                        >
                          DMARC
                        </span>
                      </div>
                      <button
                        onClick={() => setDnsModalDomain(d)}
                        className="flex items-center gap-xs px-2.5 py-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary text-code-sm text-on-surface font-semibold transition-colors border border-outline-variant/20 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">dns</span>
                        DNS Setup Guide
                      </button>
                    </div>
                  </td>
                  <td className="p-md text-right font-mono text-data-mono text-on-surface font-medium">
                    {d.mailboxes.toLocaleString()}
                  </td>
                  <td className="p-md text-right">
                    <div className="flex items-center justify-end gap-xs">
                      <button
                        onClick={() => setDnsModalDomain(d)}
                        className="p-1.5 text-primary hover:bg-primary/20 transition-colors rounded"
                        title="View DNS Records & Setup Guide"
                      >
                        <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                      </button>
                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/20 transition-colors rounded"
                        title="Delete domain"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-3 gap-lg">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-surface-container rounded-xl p-md border border-outline-variant/20 shadow-md flex flex-col gap-md justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">domain</span>
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-on-surface font-bold">{d.name}</h3>
                    <span className="text-code-sm text-on-surface-variant font-mono">{d.id}</span>
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>

              <div className="flex flex-col gap-xs bg-surface-container-low rounded-lg p-sm">
                <span className="text-label-caps text-on-surface-variant uppercase font-bold">DNS Health</span>
                <div className="flex gap-xs">
                  <span className={`px-2 py-0.5 rounded text-code-sm font-mono ${d.dns.mx ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>MX</span>
                  <span className={`px-2 py-0.5 rounded text-code-sm font-mono ${d.dns.spf ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>SPF</span>
                  <span className={`px-2 py-0.5 rounded text-code-sm font-mono ${d.dns.dkim ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>DKIM</span>
                  <span className={`px-2 py-0.5 rounded text-code-sm font-mono ${d.dns.dmarc ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>DMARC</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-xs border-t border-outline-variant/20">
                <span className="text-body-sm text-on-surface-variant font-mono">
                  <strong>{d.mailboxes}</strong> Mailboxes
                </span>
                <div className="flex gap-xs">
                  <button
                    onClick={() => setDnsModalDomain(d)}
                    className="px-sm py-xs bg-surface-container-high text-primary hover:bg-primary/20 rounded text-code-sm font-bold transition-colors flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                    DNS Guide
                  </button>
                  <button
                    onClick={() => handleDelete(d.id, d.name)}
                    className="p-xs text-on-surface-variant hover:text-error rounded"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DNS Setup Wizard & DKIM Generator Modal */}
      {dnsModalDomain && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-2xl w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
              <div>
                <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-secondary">vpn_key</span>
                  DNS Configuration Guide — {dnsModalDomain.name}
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-xs">
                  Add the following records to your domain DNS management panel (Cloudflare, GoDaddy, Route53, etc.)
                </p>
              </div>
              <button onClick={() => setDnsModalDomain(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Records List */}
            <div className="flex flex-col gap-md font-mono text-code-sm">
              {/* MX Record */}
              <div className="bg-surface-container rounded-lg p-md border border-outline-variant/20">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-primary font-bold uppercase">1. MX Record (Mail Routing)</span>
                  <button
                    onClick={() => handleCopyRecord(`mail.${dnsModalDomain.name}`, 'MX')}
                    className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-primary/20 text-primary font-bold flex items-center gap-xs text-code-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedRecord === 'MX' ? 'check' : 'content_copy'}
                    </span>
                    {copiedRecord === 'MX' ? 'Copied!' : 'Copy Value'}
                  </button>
                </div>
                <div className="text-on-surface">Type: <strong>MX</strong> | Host: <strong>@</strong> | Priority: <strong>10</strong> | Value: <strong>mail.{dnsModalDomain.name}</strong></div>
              </div>

              {/* SPF Record */}
              <div className="bg-surface-container rounded-lg p-md border border-outline-variant/20">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-secondary font-bold uppercase">2. TXT Record (SPF - Anti-Spoofing)</span>
                  <button
                    onClick={() => handleCopyRecord('v=spf1 mx ~all', 'SPF')}
                    className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-secondary/20 text-secondary font-bold flex items-center gap-xs text-code-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedRecord === 'SPF' ? 'check' : 'content_copy'}
                    </span>
                    {copiedRecord === 'SPF' ? 'Copied!' : 'Copy Value'}
                  </button>
                </div>
                <div className="text-on-surface">Type: <strong>TXT</strong> | Host: <strong>@</strong> | Value: <strong>v=spf1 mx ~all</strong></div>
              </div>

              {/* DKIM Record */}
              <div className="bg-surface-container rounded-lg p-md border border-outline-variant/20">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-tertiary font-bold uppercase">3. TXT Record (DKIM - Cryptographic Signature)</span>
                  <button
                    onClick={() =>
                      handleCopyRecord(
                        'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx4nF99x2gK4qP56mK99103xLL...',
                        'DKIM'
                      )
                    }
                    className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-tertiary/20 text-tertiary font-bold flex items-center gap-xs text-code-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedRecord === 'DKIM' ? 'check' : 'content_copy'}
                    </span>
                    {copiedRecord === 'DKIM' ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
                <div className="text-on-surface">Host: <strong>zimbra._domainkey.{dnsModalDomain.name}</strong></div>
                <div className="text-on-surface-variant truncate mt-xs">Value: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx4nF99x2gK4qP56mK99103xLL...</div>
              </div>

              {/* DMARC Record */}
              <div className="bg-surface-container rounded-lg p-md border border-outline-variant/20">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-primary font-bold uppercase">4. TXT Record (DMARC Policy)</span>
                  <button
                    onClick={() => handleCopyRecord(`v=DMARC1; p=quarantine; rua=mailto:dmarc@${dnsModalDomain.name}`, 'DMARC')}
                    className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-primary/20 text-primary font-bold flex items-center gap-xs text-code-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedRecord === 'DMARC' ? 'check' : 'content_copy'}
                    </span>
                    {copiedRecord === 'DMARC' ? 'Copied!' : 'Copy Value'}
                  </button>
                </div>
                <div className="text-on-surface">Host: <strong>_dmarc.{dnsModalDomain.name}</strong></div>
                <div className="text-on-surface">Value: <strong>v=DMARC1; p=quarantine; rua=mailto:dmarc@{dnsModalDomain.name}</strong></div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-sm border-t border-outline-variant/20">
              <button
                onClick={handleVerifyDns}
                disabled={isVerifyingDns}
                className="flex items-center gap-xs px-md py-sm bg-secondary/20 text-secondary border border-secondary/40 rounded-lg text-body-sm font-bold hover:bg-secondary/30 transition-colors"
              >
                {isVerifyingDns ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Testing DNS Propagation...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                    Verify DNS Propagation Live
                  </>
                )}
              </button>
              <button
                onClick={() => setDnsModalDomain(null)}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:brightness-110"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">Add New Domain</h2>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Domain Name</label>
              <input
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 font-mono text-body-sm"
                placeholder="e.g. yourcompany.com"
                autoFocus
              />
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">DKIM Key Size</label>
              <select
                value={newDkimBit}
                onChange={(e) => setNewDkimBit(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm"
              >
                <option value="2048">2048-bit RSA (Recommended)</option>
                <option value="1024">1024-bit RSA (Legacy)</option>
              </select>
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm hover:bg-surface-container-highest"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:brightness-110"
              >
                Create Domain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
