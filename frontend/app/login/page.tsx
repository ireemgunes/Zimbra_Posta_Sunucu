'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useTheme } from '@/context/ThemeContext'
import { copyText } from '@/lib/clipboard'

export default function LoginPage() {
  const { login } = useAuth()
  const { addToast } = useToast()
  const { isDark, toggleTheme } = useTheme()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('ZimbraAdmin2024!')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isFilled, setIsFilled] = useState(false)

  // Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [copiedCli, setCopiedCli] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(async () => {
      await login(username, password)
      setIsLoading(false)
    }, 500)
  }

  const fillDemo = () => {
    setUsername('admin')
    setPassword('ZimbraAdmin2024!')
    setIsFilled(true)
    addToast('Credentials Auto-Filled', 'User: admin • Password: ZimbraAdmin2024!', 'info')
    setTimeout(() => setIsFilled(false), 2000)
  }

  const handleQuickLogin = async () => {
    setUsername('admin')
    setPassword('ZimbraAdmin2024!')
    setIsLoading(true)
    setTimeout(async () => {
      await login('admin', 'ZimbraAdmin2024!')
      setIsLoading(false)
    }, 400)
  }

  const handleCopyRecoveryCmd = async () => {
    const cmd = 'docker exec -it mailos-zimbra zmprov sp admin@mailos.local ZimbraAdmin2024!'
    const success = await copyText(cmd)
    if (success) {
      setCopiedCli(true)
      addToast('Command Copied', 'Zimbra zmprov command copied to clipboard.', 'success')
      setTimeout(() => setCopiedCli(false), 2000)
    } else {
      addToast('Copy Failed', 'Please copy manually.', 'error')
    }
  }

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-md relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0a0f13]' : 'bg-slate-100'
    }`}>
      {/* Background Decorative Glows */}
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-primary/10' : 'bg-primary/20'
      }`}></div>
      <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-secondary/10' : 'bg-secondary/20'
      }`}></div>

      {/* Top Right Theme Switcher on Login Page */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border flex items-center gap-xs text-body-sm font-semibold transition-all shadow-md ${
            isDark
              ? 'bg-surface-container-high/80 border-outline-variant/30 text-on-surface hover:bg-surface-container-highest'
              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            {isDark ? 'dark_mode' : 'light_mode'}
          </span>
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      {/* Login Container */}
      <div className={`w-full max-w-md backdrop-blur-2xl rounded-2xl p-xl border shadow-2xl flex flex-col gap-lg z-10 transition-all ${
        isDark
          ? 'bg-surface-container-low/95 border-outline-variant/30 text-on-surface'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}>
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-lg mb-xs">
            <span className="material-symbols-outlined text-[32px]">mail</span>
          </div>
          <h1 className="text-display-lg font-bold tracking-tight">MailOS Admin</h1>
          <p className="text-body-sm text-on-surface-variant">Zimbra 10.0 FOSS Management Console</p>

          {/* System Badge */}
          <div className="mt-xs inline-flex items-center gap-xs px-sm py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[11px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            CLUSTER NODE: mail.mailos.local (ONLINE)
          </div>
        </div>

        {/* Quick Demo Helper Bar */}
        <div className="bg-surface-container rounded-xl p-sm border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-xs text-[12px] text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px]">key</span>
            <span>Default: <strong className="text-on-surface font-mono">admin</strong></span>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className={`px-sm py-1 rounded-lg text-[11px] font-bold transition-all ${
              isFilled
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'bg-primary/15 text-primary hover:bg-primary/25'
            }`}
          >
            {isFilled ? '✓ Filled!' : 'Auto-Fill'}
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div>
            <label className="text-body-sm font-semibold block mb-xs">Administrator Account</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                person
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-surface-container rounded-xl pl-11 pr-md py-sm outline-none focus:ring-2 focus:ring-primary border text-body-sm transition-all font-mono ${
                  isFilled ? 'border-secondary ring-1 ring-secondary' : 'border-outline-variant/30'
                }`}
                placeholder="admin or admin@mailos.local"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-xs">
              <label className="text-body-sm font-semibold">Password</label>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[13px]">help</span>
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-surface-container rounded-xl pl-11 pr-11 py-sm outline-none focus:ring-2 focus:ring-primary border text-body-sm transition-all font-mono ${
                  isFilled ? 'border-secondary ring-1 ring-secondary' : 'border-outline-variant/30'
                }`}
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-body-sm text-on-surface-variant pt-xs">
            <label className="flex items-center gap-xs cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-primary" />
              <span>Remember Session</span>
            </label>
            <span className="text-code-sm font-mono text-secondary font-semibold">2FA Active</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-xs py-sm bg-primary text-on-primary rounded-xl font-bold text-headline-sm hover:brightness-110 transition-all flex items-center justify-center gap-xs shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In to MailOS</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>

          {/* Quick One-Click Button */}
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={isLoading}
            className="w-full py-xs bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-xl font-semibold text-body-sm transition-colors border border-outline-variant/20 flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Quick One-Click Sign In
          </button>
        </form>

        {/* Footer Info */}
        <div className="text-center text-[12px] text-on-surface-variant border-t border-outline-variant/20 pt-md flex flex-col gap-1">
          <span>Protected by Zimbra Admin SOAP SSL & Fail2Ban Jails</span>
          <span className="font-mono text-[11px] opacity-60">MailOS v2.4.1-stable • TLS 1.3 Strict</span>
        </div>
      </div>

      {/* Root Password Recovery Guide Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-low rounded-2xl p-xl max-w-lg w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
              <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-tertiary">lock_reset</span>
                Root Administrator Password Recovery
              </h2>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="bg-[#2a1d0d] border border-tertiary/30 rounded-xl p-md flex items-start gap-sm">
              <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
                security
              </span>
              <div className="text-code-sm text-on-surface leading-relaxed">
                <strong className="text-tertiary block mb-0.5">Self-Hosted Security Standard:</strong>
                As this is a root mail server core, web-based email resets are disabled by design to prevent unauthorized server takeover. Root password resets must be executed directly on the host console.
              </div>
            </div>

            {/* Recovery Step Instructions */}
            <div className="flex flex-col gap-sm">
              <span className="text-label-caps text-on-surface-variant uppercase font-bold">
                Option 1: Reset via Docker Shell
              </span>
              <p className="text-body-sm text-on-surface-variant">
                Open your host PowerShell / Terminal and run the Zimbra admin provisioning command:
              </p>
              <div className="bg-[#070b0e] border border-outline-variant/30 rounded-xl p-sm flex items-center justify-between font-mono text-code-sm">
                <span className="text-secondary truncate mr-xs">
                  docker exec -it mailos-zimbra zmprov sp admin@mailos.local ZimbraAdmin2024!
                </span>
                <button
                  onClick={handleCopyRecoveryCmd}
                  className="px-2 py-1 rounded bg-surface-container-high hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center gap-1 flex-shrink-0 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedCli ? 'check' : 'content_copy'}
                  </span>
                  {copiedCli ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-xs pt-xs border-t border-outline-variant/20">
              <span className="text-label-caps text-on-surface-variant uppercase font-bold">
                Option 2: Default Credentials (.env)
              </span>
              <div className="bg-surface-container p-sm rounded-lg flex items-center justify-between text-body-sm font-mono">
                <div>
                  <span className="text-on-surface-variant">User: </span>
                  <strong className="text-on-surface">admin</strong>
                  <span className="text-on-surface-variant ml-md">Pass: </span>
                  <strong className="text-primary">ZimbraAdmin2024!</strong>
                </div>
                <button
                  onClick={() => {
                    fillDemo()
                    setShowRecoveryModal(false)
                  }}
                  className="text-primary text-code-sm font-bold hover:underline"
                >
                  Auto-Fill Now
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-sm border-t border-outline-variant/20">
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:brightness-110"
              >
                Understood, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
