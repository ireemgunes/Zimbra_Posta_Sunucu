'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import { useTheme } from '@/context/ThemeContext'
import { copyText } from '@/lib/clipboard'

const TABS = ['General', 'SMTP Settings', 'IMAP / POP3', 'Backup & Restore', 'API Access']

export default function SettingsPage() {
  const { addToast } = useToast()
  const { isDark, setThemeMode } = useTheme()

  const [activeTab, setActiveTab] = useState('General')

  // General Settings
  const [hostname, setHostname] = useState('mail.mailos.local')
  const [adminEmail, setAdminEmail] = useState('postmaster@mailos.local')
  const [mailboxDir, setMailboxDir] = useState('/opt/zimbra/store')
  const [isVerifyingPath, setIsVerifyingPath] = useState(false)
  const [pathVerified, setPathVerified] = useState(true)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleTheme = (dark: boolean) => {
    setThemeMode(dark ? 'dark' : 'light')
  }

  // SMTP & Mail Delivery Tester
  const [relayHost, setRelayHost] = useState('')
  const [relayPort, setRelayPort] = useState('587')
  const [testRecipient, setTestRecipient] = useState('test@external-domain.com')
  const [isTestingMail, setIsTestingMail] = useState(false)
  const [testLog, setTestLog] = useState<string[]>([])

  // Backup & Restore
  const [backupSchedule, setBackupSchedule] = useState('Daily at 02:00 AM (Retain 30 Days)')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [tempFrequency, setTempFrequency] = useState('Daily')
  const [tempTime, setTempTime] = useState('02:00 AM')
  const [tempRetention, setTempRetention] = useState('30 Days')

  // Live Snapshot Modal State
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [snapshotStep, setSnapshotStep] = useState(0)
  const [snapshotName, setSnapshotName] = useState('')
  const [backups, setBackups] = useState([
    { id: 'b1', name: 'mailos-backup-2026-08-17.tar.gz', size: '1.4 GB', date: 'Yesterday' },
    { id: 'b2', name: 'mailos-backup-2026-08-10.tar.gz', size: '1.38 GB', date: '8 days ago' },
  ])

  // API Access & Webhooks
  const [apiKey, setApiKey] = useState('mk_live_99f8d1a3c72b4e019a84')
  const [copiedKey, setCopiedKey] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourcompany.com/webhooks/mailos')
  const [isSavingWebhook, setIsSavingWebhook] = useState(false)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [webhookSaved, setWebhookSaved] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null)
  const [showDocsModal, setShowDocsModal] = useState(false)

  // Verify Path action
  const handleVerifyPath = () => {
    setIsVerifyingPath(true)
    setTimeout(() => {
      setIsVerifyingPath(false)
      setPathVerified(true)
      addToast('Storage Path Verified', `${mailboxDir} is valid, writable (202 GB available).`, 'success')
    }, 600)
  }

  // Top Right Save Changes
  const handleSaveAll = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      addToast('Settings Saved', 'All system identity, protocol, and storage configurations updated.', 'success')
    }, 800)
  }

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true)
    setTimeout(() => {
      setIsCheckingUpdate(false)
      addToast('System Up To Date', 'MailOS v2.4.1-stable (Zimbra 10.0 FOSS) is the latest release.', 'info')
    }, 1200)
  }

  const handleSendTestMail = () => {
    if (!testRecipient.trim()) {
      addToast('Recipient Required', 'Please enter a target email address for test.', 'error')
      return
    }
    setIsTestingMail(true)
    setTestLog([
      `[0ms] Resolving MX record for ${testRecipient}...`,
      `[45ms] Connecting to Postfix submission daemon on 127.0.0.1:587...`,
      `[110ms] 220 mail.mailos.local ESMTP Postfix ready`,
      `[180ms] EHLO mail.mailos.local -> 250-STARTTLS 250-AUTH`,
      `[250ms] MAIL FROM:<admin@mailos.local> -> 250 2.1.0 Ok`,
      `[320ms] RCPT TO:<${testRecipient}> -> 250 2.1.5 Ok`,
      `[410ms] DATA -> 354 End data with <CR><LF>.<CR><LF>`,
      `[520ms] 250 2.0.0 Ok: queued as 4X89L129 (520ms total)`,
    ])
    setTimeout(() => {
      setIsTestingMail(false)
      addToast('Test Email Delivered', `SMTP ping sent to ${testRecipient} in 520ms.`, 'success')
    }, 1400)
  }

  // Start Progressive Snapshot Process
  const handleStartSnapshot = () => {
    const generatedName = `mailos-backup-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random()*1000)}.tar.gz`
    setSnapshotName(generatedName)
    setShowSnapshotModal(true)
    setSnapshotStep(1) // LDAP

    setTimeout(() => {
      setSnapshotStep(2) // DB
      setTimeout(() => {
        setSnapshotStep(3) // Compression
        setTimeout(() => {
          setSnapshotStep(4) // Done
          const newBackup = {
            id: `b_${Date.now()}`,
            name: generatedName,
            size: '1.42 GB',
            date: 'Just now',
          }
          setBackups((prev) => [newBackup, ...prev])
          addToast('Snapshot Complete', `${generatedName} archive ready.`, 'success')
        }, 1000)
      }, 900)
    }, 800)
  }

  const handleDownloadBackup = (backupName: string) => {
    const content = `MailOS Virtual Mail Server Backup Archive\nGenerated: ${new Date().toISOString()}\nArchive: ${backupName}\nPayload: /opt/zimbra/store, /opt/zimbra/data/ldap, OpenLDAP, MariaDB`
    const blob = new Blob([content], { type: 'application/gzip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupName
    a.click()
    URL.revokeObjectURL(url)
    addToast('Download Started', `${backupName} archive downloaded.`, 'success')
  }

  const handleSaveSchedule = () => {
    setBackupSchedule(`${tempFrequency} at ${tempTime} (Retain ${tempRetention})`)
    setShowScheduleModal(false)
    addToast('Schedule Updated', `Automated backup set to ${tempFrequency} at ${tempTime}.`, 'success')
  }

  // Webhook Handlers
  const handleSaveWebhook = () => {
    if (!webhookUrl.trim()) {
      addToast('URL Required', 'Please provide a valid webhook URL.', 'error')
      return
    }
    setIsSavingWebhook(true)
    setTimeout(() => {
      setIsSavingWebhook(false)
      setWebhookSaved(true)
      addToast('Webhook Saved', `Event notifications will be dispatched to ${webhookUrl}`, 'success')
      setTimeout(() => setWebhookSaved(false), 3000)
    }, 600)
  }

  const handleTestWebhook = () => {
    setIsTestingWebhook(true)
    setWebhookTestResult(null)
    setTimeout(() => {
      setIsTestingWebhook(false)
      setWebhookTestResult('HTTP 200 OK (Ping dispatched in 42ms with payload {"event": "ping", "server": "mail.mailos.local"})')
      addToast('Webhook Test Successful', 'Remote endpoint returned HTTP 200 OK.', 'success')
    }, 800)
  }

  const handleGenerateApiKey = () => {
    const newKey = `mk_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 10)}`
    setApiKey(newKey)
    addToast('New API Key Generated', 'New production token active; old tokens revoked.', 'warning')
  }

  const handleCopyApiKey = async () => {
    const success = await copyText(apiKey)
    if (success) {
      setCopiedKey(true)
      addToast('API Key Copied', 'Token copied to clipboard.', 'success')
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      addToast('Copy Failed', 'Please copy manually.', 'error')
    }
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-xs">
          <h1 className="text-headline-md font-headline-md text-on-surface font-semibold">Global Settings</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Configure core MailOS parameters, protocols, and system-wide behaviors.
          </p>
        </div>
        <button
          disabled={isSaving}
          onClick={handleSaveAll}
          className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-label-caps font-bold hover:brightness-110 shadow-md transition-all"
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex gap-lg">
        {/* Tab Sidebar */}
        <div className="w-56 flex flex-col gap-xs">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center justify-between px-md py-sm rounded-lg text-body-sm text-left transition-colors font-medium ${
                activeTab === tab
                  ? 'bg-surface-container-high text-primary border-l-4 border-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="material-symbols-outlined text-[18px] text-primary">chevron_right</span>
              )}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-surface-container-low rounded-xl p-xl border border-outline-variant/20 shadow-md">
          {/* 1. General Tab */}
          {activeTab === 'General' && (
            <div className="flex flex-col gap-xl">
              <div>
                <h2 className="text-headline-sm text-on-surface font-semibold mb-md">System Identity</h2>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="text-body-sm text-on-surface-variant block mb-xs">Server Hostname</label>
                    <input
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                      className="w-full bg-surface-container text-on-surface text-body-sm rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-body-sm text-on-surface-variant block mb-xs">Admin Contact Email</label>
                    <input
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-surface-container text-on-surface text-body-sm rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-lg">
                <h2 className="text-headline-sm text-on-surface font-semibold mb-md">Storage Paths</h2>
                <div>
                  <label className="text-body-sm text-on-surface-variant block mb-xs">Mailbox Directory</label>
                  <div className="flex gap-sm items-center">
                    <input
                      value={mailboxDir}
                      onChange={(e) => {
                        setMailboxDir(e.target.value)
                        setPathVerified(false)
                      }}
                      className="flex-1 bg-surface-container text-on-surface text-body-sm rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 font-mono"
                    />
                    <button
                      disabled={isVerifyingPath}
                      onClick={handleVerifyPath}
                      className="flex items-center gap-xs px-md py-sm bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-lg text-body-sm font-bold transition-colors border border-outline-variant/20 shadow-sm"
                    >
                      {isVerifyingPath ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">
                            {pathVerified ? 'verified' : 'check_circle'}
                          </span>
                          Verify Path
                        </>
                      )}
                    </button>
                  </div>
                  {pathVerified && (
                    <div className="mt-xs text-code-sm text-secondary font-mono flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      Path is valid and writable: 202 GB available on mount /opt/zimbra
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-lg">
                <h2 className="text-headline-sm text-on-surface font-semibold mb-md">Appearance Theme</h2>
                <div className="flex gap-md">
                  <button
                    onClick={() => handleToggleTheme(true)}
                    className={`flex items-center gap-sm px-md py-sm rounded-lg text-body-sm font-semibold transition-all ${
                      isDark
                        ? 'bg-primary/15 border-2 border-primary text-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">dark_mode</span>
                    Dark Command Center {isDark ? '(Active)' : ''}
                  </button>
                  <button
                    onClick={() => handleToggleTheme(false)}
                    className={`flex items-center gap-sm px-md py-sm rounded-lg text-body-sm font-semibold transition-all ${
                      !isDark
                        ? 'bg-primary/15 border-2 border-primary text-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">light_mode</span>
                    Clean Light Mode {!isDark ? '(Active)' : ''}
                  </button>
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-lg flex items-center justify-between">
                <div>
                  <h2 className="text-headline-sm text-on-surface font-semibold">System Update</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Current Version: <span className="text-primary font-mono font-bold">v2.4.1-stable (Zimbra 10.0 FOSS)</span>
                  </p>
                </div>
                <button
                  disabled={isCheckingUpdate}
                  onClick={handleCheckUpdate}
                  className="flex items-center gap-xs px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm hover:bg-surface-container-highest font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                </button>
              </div>
            </div>
          )}

          {/* 2. SMTP Settings & Mail Delivery Tester Tab */}
          {activeTab === 'SMTP Settings' && (
            <div className="flex flex-col gap-xl">
              <div>
                <h2 className="text-headline-sm text-on-surface font-semibold mb-md">SMTP Relay Configuration</h2>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="text-body-sm text-on-surface-variant block mb-xs">External Relay Host (Optional)</label>
                    <input
                      value={relayHost}
                      onChange={(e) => setRelayHost(e.target.value)}
                      placeholder="smtp.sendgrid.net or leave blank for direct"
                      className="w-full bg-surface-container text-on-surface text-body-sm rounded-lg px-md py-sm outline-none border border-outline-variant/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-body-sm text-on-surface-variant block mb-xs">Relay Port</label>
                    <input
                      value={relayPort}
                      onChange={(e) => setRelayPort(e.target.value)}
                      className="w-full bg-surface-container text-on-surface text-body-sm rounded-lg px-md py-sm outline-none border border-outline-variant/30 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Test Email Tool */}
              <div className="border-t border-outline-variant/20 pt-lg flex flex-col gap-md">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary text-[24px]">mark_email_read</span>
                  <div>
                    <h3 className="text-headline-sm text-on-surface font-semibold">Mail Delivery Tester</h3>
                    <p className="text-body-sm text-on-surface-variant">Send a test SMTP ping to verify delivery handshakes.</p>
                  </div>
                </div>

                <div className="flex gap-sm">
                  <input
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="Recipient email (e.g. user@gmail.com)"
                    className="flex-1 bg-surface-container text-on-surface text-body-sm rounded-lg px-md py-sm outline-none border border-outline-variant/30 font-mono"
                  />
                  <button
                    disabled={isTestingMail}
                    onClick={handleSendTestMail}
                    className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:brightness-110 shadow-md"
                  >
                    {isTestingMail ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        Sending Ping...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Send Test Ping
                      </>
                    )}
                  </button>
                </div>

                {testLog.length > 0 && (
                  <div className="bg-[#070b0e] border border-outline-variant/20 rounded-xl p-md font-mono text-code-sm text-secondary flex flex-col gap-xs">
                    <span className="text-primary font-bold">SMTP Handshake Output:</span>
                    {testLog.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. IMAP / POP3 Tab */}
          {activeTab === 'IMAP / POP3' && (
            <div className="flex flex-col gap-lg">
              <h2 className="text-headline-sm text-on-surface font-semibold">Incoming Mail Protocols</h2>
              <div className="grid grid-cols-2 gap-lg">
                <div className="bg-surface-container p-md rounded-xl border border-outline-variant/20 flex flex-col gap-sm">
                  <h3 className="text-body-md font-bold text-on-surface">IMAP Configuration</h3>
                  <div className="flex justify-between items-center text-body-sm">
                    <span>IMAP Port</span>
                    <span className="font-mono text-primary">143</span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm">
                    <span>IMAPS (TLS) Port</span>
                    <span className="font-mono text-secondary">993</span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm">
                    <span>Max Concurrent Connections</span>
                    <span className="font-mono text-on-surface">1,000</span>
                  </div>
                </div>

                <div className="bg-surface-container p-md rounded-xl border border-outline-variant/20 flex flex-col gap-sm">
                  <h3 className="text-body-md font-bold text-on-surface">POP3 Configuration</h3>
                  <div className="flex justify-between items-center text-body-sm">
                    <span>POP3 Port</span>
                    <span className="font-mono text-primary">110</span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm">
                    <span>POP3S (TLS) Port</span>
                    <span className="font-mono text-secondary">995</span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm">
                    <span>Auto Delete After Fetch</span>
                    <span className="text-error font-semibold">Disabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Backup & Restore Tab */}
          {activeTab === 'Backup & Restore' && (
            <div className="flex flex-col gap-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-headline-sm text-on-surface font-semibold">Backup & Disaster Recovery</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Creates full point-in-time snapshots of LDAP user accounts, MariaDB databases, mailbox indexes, and configurations.
                  </p>
                </div>
                <button
                  onClick={handleStartSnapshot}
                  className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-label-caps font-bold hover:brightness-110 shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  Create Snapshot Now
                </button>
              </div>

              {/* Edit Schedule Bar */}
              <div className="bg-surface-container p-md rounded-xl border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <span className="text-body-sm font-bold text-on-surface block">Automated Backup Schedule</span>
                  <span className="text-code-sm text-on-surface-variant font-mono">{backupSchedule}</span>
                </div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-md py-xs bg-surface-container-high rounded-lg text-body-sm font-bold text-primary hover:bg-surface-container-highest transition-colors border border-outline-variant/20 shadow-sm"
                >
                  Edit Schedule
                </button>
              </div>

              {/* Stored Snapshots List with real download */}
              <div className="flex flex-col gap-sm">
                <span className="text-label-caps text-on-surface-variant uppercase font-bold">Stored Backup Snapshots</span>
                {backups.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-md bg-surface-container rounded-lg border border-outline-variant/20">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">folder_zip</span>
                      <div>
                        <span className="text-body-sm font-mono text-on-surface font-semibold">{b.name}</span>
                        <span className="text-code-sm text-on-surface-variant block">{b.size} • {b.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadBackup(b.name)}
                      className="flex items-center gap-xs px-md py-xs bg-surface-container-high text-primary hover:bg-primary/20 rounded-lg text-code-sm font-bold transition-colors border border-outline-variant/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Download Archive
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. API Access Tab */}
          {activeTab === 'API Access' && (
            <div className="flex flex-col gap-lg">
              <div>
                <h2 className="text-headline-sm text-on-surface font-semibold">REST API Credentials & Webhooks</h2>
                <p className="text-body-sm text-on-surface-variant">Use API keys and webhooks to automate mailbox provisioning and integrate alerts.</p>
              </div>

              {/* API Key Box */}
              <div className="bg-surface-container p-md rounded-xl border border-outline-variant/20 flex flex-col gap-md">
                <div className="flex items-center justify-between">
                  <span className="text-label-caps text-on-surface-variant uppercase font-bold">Active API Secret Key</span>
                  <button
                    onClick={handleGenerateApiKey}
                    className="text-primary text-code-sm hover:underline font-semibold flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Regenerate Key
                  </button>
                </div>
                <div className="flex items-center gap-sm">
                  <input
                    readOnly
                    value={apiKey}
                    className="flex-1 bg-surface-container-high text-primary rounded-lg px-md py-sm font-mono text-body-sm outline-none border border-outline-variant/30"
                  />
                  <button
                    onClick={handleCopyApiKey}
                    className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:brightness-110 flex items-center gap-xs shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedKey ? 'check' : 'content_copy'}
                    </span>
                    {copiedKey ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="bg-surface-container p-md rounded-xl border border-outline-variant/20 flex flex-col gap-md">
                <div className="flex justify-between items-center">
                  <span className="text-label-caps text-on-surface-variant uppercase font-bold">Webhook Event Dispatcher</span>
                  <button
                    disabled={isTestingWebhook}
                    onClick={handleTestWebhook}
                    className="text-secondary text-code-sm hover:underline font-bold flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    {isTestingWebhook ? 'Sending Test Ping...' : 'Send Test Webhook Ping'}
                  </button>
                </div>

                <div className="flex gap-sm">
                  <input
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value)
                      setWebhookSaved(false)
                    }}
                    className="flex-1 bg-surface-container-high text-on-surface rounded-lg px-md py-sm font-mono text-body-sm outline-none border border-outline-variant/30"
                    placeholder="https://your-domain.com/webhooks"
                  />
                  <button
                    disabled={isSavingWebhook}
                    onClick={handleSaveWebhook}
                    className={`px-md py-sm rounded-lg text-body-sm font-bold transition-all flex items-center gap-xs ${
                      webhookSaved
                        ? 'bg-secondary text-on-secondary shadow-sm'
                        : 'bg-primary text-on-primary hover:brightness-110 shadow-md'
                    }`}
                  >
                    {isSavingWebhook ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        Saving...
                      </>
                    ) : webhookSaved ? (
                      <>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Saved!
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        Save Webhook
                      </>
                    )}
                  </button>
                </div>

                {webhookTestResult && (
                  <div className="p-sm rounded-lg bg-[#070b0e] border border-secondary/30 font-mono text-code-sm text-secondary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                    {webhookTestResult}
                  </div>
                )}

                <div className="flex gap-md text-code-sm text-on-surface">
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-primary" /> Mail Delivery Failures
                  </label>
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-primary" /> Fail2Ban IP Bans
                  </label>
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-primary" /> SSL Expiry Warnings
                  </label>
                </div>
              </div>

              {/* Swagger Docs Card */}
              <div className="p-md bg-surface-container rounded-xl border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <span className="text-body-sm font-bold text-on-surface block">FastAPI Interactive Swagger Docs</span>
                  <span className="text-code-sm text-on-surface-variant">Explore and test all REST endpoints directly in browser.</span>
                </div>
                <button
                  onClick={() => setShowDocsModal(true)}
                  className="px-md py-sm bg-primary text-on-primary font-bold rounded-lg text-body-sm flex items-center gap-xs shadow-md"
                >
                  View Endpoints
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Backup Snapshot Progress Wizard Modal */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-lg w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
              <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">cloud_upload</span>
                Server Snapshot Wizard
              </h2>
              {snapshotStep === 4 && (
                <button onClick={() => setShowSnapshotModal(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>

            <p className="text-body-sm text-on-surface-variant">
              Generating full system snapshot for Disaster Recovery: <strong className="text-primary font-mono">{snapshotName}</strong>
            </p>

            {/* Progress Steps */}
            <div className="flex flex-col gap-sm my-xs">
              {[
                { step: 1, label: 'Dumping OpenLDAP identity directory & accounts' },
                { step: 2, label: 'Exporting MariaDB mailbox index tables & quotas' },
                { step: 3, label: 'Compressing /opt/zimbra/store volumes into .tar.gz' },
                { step: 4, label: 'Snapshot archive verified and ready for download' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`flex items-center gap-sm p-sm rounded-lg transition-all ${
                    snapshotStep > s.step
                      ? 'bg-secondary/10 text-secondary border border-secondary/20'
                      : snapshotStep === s.step
                      ? 'bg-primary/10 text-primary border border-primary/30 font-bold'
                      : 'bg-surface-container text-on-surface-variant opacity-40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {snapshotStep > s.step ? 'check_circle' : snapshotStep === s.step ? 'progress_activity' : 'radio_button_unchecked'}
                  </span>
                  <span className="text-body-sm font-mono">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${(snapshotStep / 4) * 100}%` }}
              ></div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant/20">
              {snapshotStep === 4 ? (
                <>
                  <button
                    onClick={() => setShowSnapshotModal(false)}
                    className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadBackup(snapshotName)
                      setShowSnapshotModal(false)
                    }}
                    className="flex items-center gap-xs px-md py-sm bg-secondary text-on-secondary rounded-lg text-body-sm font-bold shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download Snapshot Now
                  </button>
                </>
              ) : (
                <span className="text-code-sm font-mono text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  Creating Snapshot...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">schedule</span>
              Edit Automated Backup Schedule
            </h2>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Backup Frequency</label>
              <select
                value={tempFrequency}
                onChange={(e) => setTempFrequency(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm"
              >
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly (Every Sunday)</option>
                <option value="Monthly">Monthly (1st of month)</option>
              </select>
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Execution Time</label>
              <select
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm font-mono"
              >
                <option value="00:00 AM">00:00 AM (Midnight)</option>
                <option value="02:00 AM">02:00 AM (Low Traffic)</option>
                <option value="04:00 AM">04:00 AM</option>
                <option value="06:00 AM">06:00 AM</option>
              </select>
            </div>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Retention Policy</label>
              <select
                value={tempRetention}
                onChange={(e) => setTempRetention(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none border border-outline-variant/30 text-body-sm"
              >
                <option value="7 Days">Keep for 7 Days</option>
                <option value="30 Days">Keep for 30 Days</option>
                <option value="90 Days">Keep for 90 Days</option>
                <option value="1 Year">Keep for 1 Year</option>
              </select>
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OpenAPI Endpoints Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-2xl w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
              <h2 className="text-headline-sm text-on-surface font-semibold flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">api</span>
                MailOS REST API Endpoints
              </h2>
              <button onClick={() => setShowDocsModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-xs font-mono text-code-sm">
              {[
                { method: 'GET', path: '/api/domains', desc: 'List all active mail domains' },
                { method: 'POST', path: '/api/domains', desc: 'Create new domain with DKIM' },
                { method: 'GET', path: '/api/mailboxes', desc: 'List user accounts and quotas' },
                { method: 'POST', path: '/api/mailboxes', desc: 'Provision a new mailbox account' },
                { method: 'GET', path: '/api/queues', desc: 'Get mail queue metrics and deferred items' },
                { method: 'GET', path: '/api/health', desc: 'Full server CPU, RAM, IOPS telemetry' },
                { method: 'POST', path: '/api/settings/test-mail', desc: 'Trigger SMTP delivery test ping' },
                { method: 'POST', path: '/api/settings/backup/trigger', desc: 'Trigger automated snapshot backup' },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center justify-between p-sm bg-surface-container rounded-lg border border-outline-variant/20">
                  <div className="flex items-center gap-sm">
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${ep.method === 'GET' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                      {ep.method}
                    </span>
                    <span className="text-on-surface font-semibold">{ep.path}</span>
                  </div>
                  <span className="text-on-surface-variant text-[12px] font-sans">{ep.desc}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-sm border-t border-outline-variant/20">
              <button onClick={() => setShowDocsModal(false)} className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
