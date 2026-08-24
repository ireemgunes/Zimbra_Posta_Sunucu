'use client'
import { useState } from 'react'
import { useToast } from '@/context/ToastContext'

interface FirewallRule {
  id: string
  priority: number
  action: 'ALLOW' | 'DROP'
  source: string
  protocol: 'TCP' | 'UDP' | 'ALL'
  ports: string
  description: string
}

interface QuarantineItem {
  id: string
  sender: string
  recipient: string
  subject: string
  score: number
  reason: string
  date: string
}

const INITIAL_INBOUND_RULES: FirewallRule[] = [
  { id: 'in_1', priority: 100, action: 'ALLOW', source: 'Any (0.0.0.0/0)', protocol: 'TCP', ports: '80, 443', description: 'HTTP/HTTPS Web & Panel Traffic' },
  { id: 'in_2', priority: 200, action: 'ALLOW', source: 'Any (0.0.0.0/0)', protocol: 'TCP', ports: '25, 587, 465', description: 'SMTP Mail Transfer & Submission' },
  { id: 'in_3', priority: 300, action: 'ALLOW', source: 'Any (0.0.0.0/0)', protocol: 'TCP', ports: '143, 993', description: 'IMAP & IMAPS Mail Retrieval' },
  { id: 'in_4', priority: 400, action: 'ALLOW', source: '192.168.1.0/24', protocol: 'TCP', ports: '22', description: 'Admin SSH Management (Internal)' },
  { id: 'in_5', priority: 500, action: 'ALLOW', source: 'Any (0.0.0.0/0)', protocol: 'TCP', ports: '7071', description: 'Zimbra Admin SOAP Console' },
  { id: 'in_6', priority: 9999, action: 'DROP', source: 'Any (0.0.0.0/0)', protocol: 'ALL', ports: 'ALL', description: 'Default Inbound Drop Policy' },
]

const INITIAL_OUTBOUND_RULES: FirewallRule[] = [
  { id: 'out_1', priority: 100, action: 'ALLOW', source: 'Localhost (127.0.0.1)', protocol: 'TCP', ports: '25, 587, 465', description: 'Remote MX SMTP Delivery' },
  { id: 'out_2', priority: 200, action: 'ALLOW', source: 'Localhost (127.0.0.1)', protocol: 'UDP', ports: '53', description: 'DNS Resolution (8.8.8.8 / 1.1.1.1)' },
  { id: 'out_3', priority: 300, action: 'ALLOW', source: 'Localhost (127.0.0.1)', protocol: 'TCP', ports: '80, 443', description: 'OS Packages & ClamAV Updates' },
  { id: 'out_4', priority: 400, action: 'ALLOW', source: 'Localhost (127.0.0.1)', protocol: 'UDP', ports: '123', description: 'NTP Network Time Sync' },
  { id: 'out_5', priority: 9999, action: 'ALLOW', source: 'Any (0.0.0.0/0)', protocol: 'ALL', ports: 'ALL', description: 'Default Outbound Established State' },
]

const INITIAL_CERTS = [
  { domain: 'mail.domain.com', issuer: "Let's Encrypt Authority X3", expiresIn: 42, autoRenew: true },
  { domain: 'webmail.domain.com', issuer: "Let's Encrypt Authority X3", expiresIn: 42, autoRenew: true },
]

const INITIAL_QUARANTINE: QuarantineItem[] = [
  { id: 'Q101', sender: 'lottery@win-prize.xyz', recipient: 'admin@example.com', subject: 'Claim your $1,000,000 Prize', score: 14.8, reason: 'Bayes 99.9%, URIBL_BLACK', date: '10 mins ago' },
  { id: 'Q102', sender: 'billing-update@suspicious-bank.net', recipient: 'sales@example.com', subject: 'Urgent: Verify your account', score: 18.2, reason: 'Phishing signature, SPF Fail', date: '1 hr ago' },
  { id: 'Q103', sender: 'promo@unsolicited-marketing.co', recipient: 'j.doe@example.com', subject: 'Special discount for developers', score: 7.4, reason: 'High link density', date: '3 hrs ago' },
]

export default function SecurityPage() {
  const { addToast } = useToast()

  const [topTab, setTopTab] = useState<'firewall' | 'quarantine'>('firewall')
  const [directionTab, setDirectionTab] = useState<'inbound' | 'outbound'>('inbound')
  const [inboundRules, setInboundRules] = useState<FirewallRule[]>(INITIAL_INBOUND_RULES)
  const [outboundRules, setOutboundRules] = useState<FirewallRule[]>(INITIAL_OUTBOUND_RULES)
  const [certs, setCerts] = useState(INITIAL_CERTS)
  const [quarantine, setQuarantine] = useState<QuarantineItem[]>(INITIAL_QUARANTINE)

  const [sshActive, setSshActive] = useState(true)
  const [bannedIps, setBannedIps] = useState(['198.51.100.42', '203.0.113.88', '185.220.101.5'])
  const [isRenewingSsl, setIsRenewingSsl] = useState(false)

  // Modals
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleDirection, setRuleDirection] = useState<'inbound' | 'outbound'>('inbound')
  const [newPriority, setNewPriority] = useState(550)
  const [newAction, setNewAction] = useState<'ALLOW' | 'DROP'>('ALLOW')
  const [newSource, setNewSource] = useState('0.0.0.0/0')
  const [newProtocol, setNewProtocol] = useState<'TCP' | 'UDP'>('TCP')
  const [newPorts, setNewPorts] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showJailModal, setShowJailModal] = useState(false)
  const [showSshKeyModal, setShowSshKeyModal] = useState(false)
  const [showBanListModal, setShowBanListModal] = useState(false)

  const currentRules = directionTab === 'inbound' ? inboundRules : outboundRules

  const handleAddRule = () => {
    if (!newPorts.trim()) {
      addToast('Port Required', 'Please specify port or port range.', 'error')
      return
    }
    const rule: FirewallRule = {
      id: `rule_${Math.random().toString(36).substring(2, 7)}`,
      priority: newPriority,
      action: newAction,
      source: newSource,
      protocol: newProtocol,
      ports: newPorts,
      description: newDesc || 'Custom Firewall Rule',
    }

    if (ruleDirection === 'inbound') {
      setInboundRules([...inboundRules.filter((r) => r.priority !== 9999), rule, inboundRules.find((r) => r.priority === 9999)!])
    } else {
      setOutboundRules([...outboundRules.filter((r) => r.priority !== 9999), rule, outboundRules.find((r) => r.priority === 9999)!])
    }

    setShowRuleModal(false)
    addToast('Firewall Rule Created', `${ruleDirection.toUpperCase()} Rule ${rule.priority} (${rule.action} :${rule.ports}) active in iptables.`, 'success')
  }

  const handleDeleteRule = (ruleId: string, priority: number) => {
    if (directionTab === 'inbound') {
      setInboundRules(inboundRules.filter((r) => r.id !== ruleId))
    } else {
      setOutboundRules(outboundRules.filter((r) => r.id !== ruleId))
    }
    addToast('Rule Removed', `Rule ${priority} deleted from ${directionTab.toUpperCase()} table.`, 'info')
  }

  const handleRenewSsl = () => {
    setIsRenewingSsl(true)
    setTimeout(() => {
      setIsRenewingSsl(false)
      setCerts(certs.map((c) => ({ ...c, expiresIn: 90 })))
      addToast('SSL Certificates Renewed', "Let's Encrypt certificates renewed for 90 days.", 'success')
    }, 1500)
  }

  const handleReleaseQuarantine = (id: string, sender: string) => {
    setQuarantine(quarantine.filter((q) => q.id !== id))
    addToast('Message Released', `Email from ${sender} released to recipient inbox.`, 'success')
  }

  const handleDeleteQuarantine = (id: string) => {
    setQuarantine(quarantine.filter((q) => q.id !== id))
    addToast('Spam Purged', `Message ${id} permanently deleted.`, 'info')
  }

  const handleUnbanIp = (ip: string) => {
    setBannedIps(bannedIps.filter((i) => i !== ip))
    addToast('IP Unbanned', `${ip} removed from Fail2Ban block list.`, 'success')
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-md">
            <h1 className="text-headline-md font-headline-md text-on-surface font-semibold">Security & Firewall</h1>
            <div className="flex bg-surface-container rounded-lg p-base border border-outline-variant/20">
              <button
                onClick={() => setTopTab('firewall')}
                className={`px-md py-xs rounded text-body-sm font-semibold transition-all ${
                  topTab === 'firewall' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Firewall & Protection
              </button>
              <button
                onClick={() => setTopTab('quarantine')}
                className={`px-md py-xs rounded text-body-sm font-semibold transition-all ${
                  topTab === 'quarantine' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Spam Quarantine ({quarantine.length})
              </button>
            </div>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant mt-xs">
            Manage network access rules, SSL certificates, threat detection, and email quarantine.
          </p>
        </div>
        <div className="flex gap-md">
          <button
            onClick={() => setShowAuditModal(true)}
            className="bg-surface-container-high text-on-surface hover:bg-surface-container-highest px-md py-xs rounded-lg text-label-caps flex items-center gap-xs shadow-sm transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Audit Logs
          </button>
          {topTab === 'firewall' && (
            <button
              onClick={() => {
                setRuleDirection(directionTab)
                setShowRuleModal(true)
              }}
              className="bg-primary text-on-primary hover:brightness-110 px-md py-xs rounded-lg text-label-caps font-bold flex items-center gap-xs shadow-md transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Rule
            </button>
          )}
        </div>
      </div>

      {topTab === 'firewall' ? (
        <div className="grid grid-cols-12 gap-lg">
          {/* Left: Firewall Rules */}
          <div className="col-span-8 flex flex-col gap-lg">
            <div className="bg-surface-container-low rounded-xl shadow-md p-lg border border-outline-variant/20">
              <div className="flex items-center justify-between mb-lg">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">security</span>
                  <h2 className="text-headline-sm text-on-surface font-semibold">
                    {directionTab === 'inbound' ? 'Inbound Traffic Rules' : 'Outbound Traffic Rules'}
                  </h2>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                    {currentRules.length} Active Rules
                  </span>
                </div>

                {/* Inbound / Outbound Direction Switcher */}
                <div className="flex bg-surface-container rounded-lg p-base border border-outline-variant/20">
                  <button
                    onClick={() => {
                      setDirectionTab('inbound')
                      addToast('Filter Changed', 'Viewing Inbound firewall rules.', 'info')
                    }}
                    className={`px-md py-xs rounded text-label-caps font-bold transition-all ${
                      directionTab === 'inbound'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Inbound Rules
                  </button>
                  <button
                    onClick={() => {
                      setDirectionTab('outbound')
                      addToast('Filter Changed', 'Viewing Outbound firewall rules.', 'info')
                    }}
                    className={`px-md py-xs rounded text-label-caps font-bold transition-all ${
                      directionTab === 'outbound'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Outbound Rules
                  </button>
                </div>
              </div>

              {/* Rules Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-on-surface-variant text-label-caps border-b border-outline-variant/20">
                      <th className="py-sm px-md">Priority</th>
                      <th className="py-sm px-md">Action</th>
                      <th className="py-sm px-md">{directionTab === 'inbound' ? 'Source' : 'Destination'}</th>
                      <th className="py-sm px-md">Protocol</th>
                      <th className="py-sm px-md">Port</th>
                      <th className="py-sm px-md">Description</th>
                      <th className="py-sm px-md text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="text-body-sm text-on-surface divide-y divide-surface-container-highest">
                    {currentRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-surface-container transition-colors group">
                        <td className="py-md px-md font-mono text-data-mono text-on-surface-variant font-bold">{rule.priority}</td>
                        <td className="py-md px-md">
                          <span
                            className={`inline-flex items-center gap-xs px-sm py-base rounded-full text-label-caps font-bold ${
                              rule.action === 'ALLOW' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${rule.action === 'ALLOW' ? 'bg-secondary' : 'bg-error'}`}></div>
                            {rule.action}
                          </span>
                        </td>
                        <td className="py-md px-md font-mono text-data-mono text-primary font-medium">{rule.source}</td>
                        <td className="py-md px-md font-bold">{rule.protocol}</td>
                        <td className="py-md px-md font-mono text-data-mono text-on-surface-variant">{rule.ports}</td>
                        <td className="py-md px-md text-on-surface-variant">{rule.description}</td>
                        <td className="py-md px-md text-right">
                          <button
                            onClick={() => handleDeleteRule(rule.id, rule.priority)}
                            className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error/20 transition-all inline-flex items-center justify-center"
                            title={`Delete rule ${rule.priority}`}
                          >
                            <span className="material-symbols-outlined text-[20px] text-error">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-4 flex flex-col gap-lg">
            {/* SSL Certificates */}
            <div className="bg-surface-container-low rounded-xl shadow-md p-lg border border-outline-variant/20 flex flex-col gap-md">
              <h2 className="text-headline-sm text-on-surface flex items-center gap-sm font-semibold">
                <span className="material-symbols-outlined text-primary">verified</span>
                SSL/TLS Certificates
              </h2>
              <div className="flex flex-col gap-md">
                {certs.map((cert) => (
                  <div key={cert.domain} className="bg-surface-container rounded-lg p-md border-l-4 border-secondary">
                    <div className="flex items-center gap-xs mb-xs">
                      <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                      <span className="text-body-sm font-bold text-on-surface">{cert.domain}</span>
                    </div>
                    <div className="text-code-sm text-on-surface-variant mb-xs font-mono">{cert.issuer}</div>
                    <div className="flex items-center gap-xs text-code-sm font-mono text-secondary">
                      <span className="material-symbols-outlined text-[14px]">event</span>
                      Expires in {cert.expiresIn} days (Auto-renew ON)
                    </div>
                  </div>
                ))}
              </div>
              <button
                disabled={isRenewingSsl}
                onClick={handleRenewSsl}
                className="w-full py-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-body-sm transition-colors font-medium flex items-center justify-center gap-xs"
              >
                {isRenewingSsl ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Renewing via Let&apos;s Encrypt...
                  </>
                ) : (
                  'Force Renewal'
                )}
              </button>
            </div>

            {/* Fail2Ban */}
            <div className="bg-surface-container-low rounded-xl shadow-md p-lg border border-outline-variant/20 flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm text-on-surface flex items-center gap-sm font-semibold">
                  <span className="material-symbols-outlined text-tertiary">shield</span>
                  Fail2Ban Protection
                </h2>
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              </div>
              <p className="text-body-sm text-on-surface-variant">Monitoring log files for brute-force patterns.</p>
              <div className="flex flex-col gap-sm">
                <div className="flex flex-col gap-xs">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-on-surface font-medium">SSH (sshd)</span>
                    <span className="text-code-sm font-mono text-tertiary font-bold">3 bans today</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                    <div className="bg-tertiary h-full rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-on-surface font-medium">Postfix (sasl)</span>
                    <span className="text-code-sm font-mono text-tertiary font-bold">12 bans today</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                    <div className="bg-tertiary h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowJailModal(true)}
                className="text-primary text-body-sm hover:brightness-110 font-medium text-left"
              >
                View Fail2Ban Jail Config
              </button>
            </div>

            {/* SSH & IP Blocking Grid */}
            <div className="grid grid-cols-2 gap-md">
              <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/20 flex flex-col gap-sm justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-bold text-on-surface flex items-center gap-xs">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">key</span>
                    SSH Access
                  </span>
                  <button
                    onClick={() => {
                      setSshActive(!sshActive)
                      addToast('SSH Access Updated', `Port 22 SSH daemon is ${!sshActive ? 'enabled' : 'disabled'}.`, 'info')
                    }}
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      sshActive ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full absolute top-0.5 transition-all ${
                        sshActive ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-on-surface-variant'
                      }`}
                    ></div>
                  </button>
                </div>
                <div className="flex flex-col gap-xs text-code-sm font-mono">
                  <span className="text-on-surface-variant">Port: <strong className="text-on-surface">22</strong></span>
                  <span className="text-on-surface-variant">Password: <strong className="text-error">Disabled</strong></span>
                </div>
                <button
                  onClick={() => setShowSshKeyModal(true)}
                  className="w-full py-xs bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded text-code-sm font-medium transition-colors"
                >
                  Manage Keys
                </button>
              </div>

              <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/20 flex flex-col gap-xs justify-between">
                <div className="flex items-center gap-xs text-error font-bold text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  IP Blocking
                </div>
                <span className="font-mono text-display-lg text-on-surface leading-tight">{bannedIps.length + 139}</span>
                <span className="text-code-sm text-on-surface-variant">Active Blacklisted IPs</span>
                <button
                  onClick={() => setShowBanListModal(true)}
                  className="w-full py-xs bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded text-code-sm font-medium transition-colors"
                >
                  View Ban List
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Spam Quarantine Tab View */
        <div className="bg-surface-container rounded-xl shadow-md overflow-hidden border border-outline-variant/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20">
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Sender</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Recipient</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Subject</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Spam Score</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase">Intercept Reason</th>
                <th className="p-md text-label-caps text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {quarantine.map((q) => (
                <tr key={q.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="p-md font-mono text-code-sm text-error font-semibold">{q.sender}</td>
                  <td className="p-md text-body-sm text-on-surface">{q.recipient}</td>
                  <td className="p-md text-body-sm text-on-surface font-medium">{q.subject}</td>
                  <td className="p-md">
                    <span className="px-2 py-0.5 rounded font-mono text-code-sm bg-error/20 text-error font-bold">
                      {q.score} / 15
                    </span>
                  </td>
                  <td className="p-md text-code-sm text-on-surface-variant font-mono">{q.reason}</td>
                  <td className="p-md text-right">
                    <div className="flex items-center justify-end gap-xs">
                      <button
                        onClick={() => handleReleaseQuarantine(q.id, q.sender)}
                        className="px-sm py-xs bg-secondary/20 text-secondary rounded text-code-sm font-semibold hover:bg-secondary/30"
                      >
                        Release
                      </button>
                      <button
                        onClick={() => handleDeleteQuarantine(q.id)}
                        className="p-xs text-on-surface-variant hover:text-error rounded"
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
      )}

      {/* New Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">New Firewall Rule</h2>
            
            <div className="flex gap-sm bg-surface-container p-xs rounded-lg">
              <button
                type="button"
                onClick={() => setRuleDirection('inbound')}
                className={`flex-1 py-xs rounded text-body-sm font-semibold transition-all ${
                  ruleDirection === 'inbound' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                Inbound Rule
              </button>
              <button
                type="button"
                onClick={() => setRuleDirection('outbound')}
                className={`flex-1 py-xs rounded text-body-sm font-semibold transition-all ${
                  ruleDirection === 'outbound' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                Outbound Rule
              </button>
            </div>

            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Priority Number</label>
              <input
                type="number"
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value) || 500)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className="text-body-sm text-on-surface-variant block mb-xs">Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value as any)}
                  className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm"
                >
                  <option value="ALLOW">ALLOW</option>
                  <option value="DROP">DROP</option>
                </select>
              </div>
              <div>
                <label className="text-body-sm text-on-surface-variant block mb-xs">Protocol</label>
                <select
                  value={newProtocol}
                  onChange={(e) => setNewProtocol(e.target.value as any)}
                  className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Target Ports</label>
              <input
                value={newPorts}
                onChange={(e) => setNewPorts(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm font-mono"
                placeholder="e.g. 587, 465 or 1000-2000"
              />
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Description</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm"
                placeholder="e.g. Custom Mail Submission Rule"
              />
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button onClick={() => setShowRuleModal(false)} className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm">
                Cancel
              </button>
              <button onClick={handleAddRule} className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold">
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-lg w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">history</span>
              Security Audit Log
            </h2>
            <div className="bg-surface-container rounded-lg p-md font-mono text-code-sm text-on-surface-variant flex flex-col gap-sm max-h-64 overflow-y-auto">
              <div>[2026-08-18 13:40] Inbound/Outbound firewall state refreshed</div>
              <div>[2026-08-18 13:00] Admin logged in from 192.168.1.10</div>
              <div>[2026-08-18 12:45] TLS 1.3 handshake enforced on port 465</div>
              <div>[2026-08-18 11:20] Fail2Ban banned IP 185.220.101.5 (SSH brute force)</div>
              <div>[2026-08-18 09:15] Let&apos;s Encrypt certificate auto-renewal verified</div>
            </div>
            <div className="flex justify-end pt-sm border-t border-outline-variant/20">
              <button onClick={() => setShowAuditModal(false)} className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail2Ban Config Modal */}
      {showJailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">Fail2Ban Jail Configuration</h2>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Max Retry Count</label>
              <input defaultValue={5} className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm font-mono" />
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Ban Time (seconds)</label>
              <input defaultValue={86400} className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm font-mono" />
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button onClick={() => setShowJailModal(false)} className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowJailModal(false)
                  addToast('Jail Configuration Saved', 'Fail2Ban jail.local updated.', 'success')
                }}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Save Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SSH Key Modal */}
      {showSshKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">SSH Authorized Keys</h2>
            <textarea
              rows={4}
              placeholder="Paste ssh-ed25519 or ssh-rsa public key here..."
              className="w-full bg-surface-container text-on-surface rounded-lg p-md outline-none border border-outline-variant/30 text-code-sm font-mono"
            ></textarea>
            <div className="flex justify-end gap-sm mt-sm">
              <button onClick={() => setShowSshKeyModal(false)} className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSshKeyModal(false)
                  addToast('SSH Key Added', 'Public key appended to ~/.ssh/authorized_keys.', 'success')
                }}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Install Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban List Modal */}
      {showBanListModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold">Active Blacklisted IPs</h2>
            <div className="flex flex-col gap-xs max-h-64 overflow-y-auto">
              {bannedIps.map((ip) => (
                <div key={ip} className="flex justify-between items-center bg-surface-container p-sm rounded-lg font-mono text-body-sm">
                  <span className="text-error">{ip}</span>
                  <button onClick={() => handleUnbanIp(ip)} className="text-primary text-code-sm hover:underline font-semibold">
                    Unban
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-sm border-t border-outline-variant/20">
              <button onClick={() => setShowBanListModal(false)} className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
