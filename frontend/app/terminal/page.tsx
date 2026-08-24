'use client'
import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import { copyText } from '@/lib/clipboard'

interface LogEntry {
  type: 'cmd' | 'output' | 'error' | 'success'
  text: string
}

const INITIAL_LOGS: LogEntry[] = [
  { type: 'cmd', text: 'zmcontrol status' },
  {
    type: 'output',
    text: `        antispam Running
        antivirus Running
        dnscache Running
        ldap Running
        logger Running
        mailbox Running
        mta Running
        opendkim Running
        postfix Running
        proxy Running
        service webapp Running
        snmp Running
        spell Running
        stats Running
        zmconfigd Running`,
  },
]

export default function TerminalPage() {
  const { addToast } = useToast()

  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>(['zmcontrol status'])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [copiedOutput, setCopiedOutput] = useState(false)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const nextIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex
        setHistoryIndex(nextIndex)
        setInput(history[history.length - 1 - nextIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1
        setHistoryIndex(nextIndex)
        setInput(history[history.length - 1 - nextIndex] || '')
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const cmd = input.trim()
    setHistory([...history, cmd])
    setHistoryIndex(-1)

    const newLogs: LogEntry[] = [...logs, { type: 'cmd', text: cmd }]

    if (cmd === 'clear') {
      setLogs([])
      setInput('')
      return
    } else if (cmd === 'zmcontrol status') {
      newLogs.push({
        type: 'output',
        text: `        antispam Running\n        antivirus Running\n        dnscache Running\n        ldap Running\n        mailbox Running\n        mta Running\n        postfix Running\n        proxy Running\n        zmconfigd Running`,
      })
    } else if (cmd === 'zmprov gad') {
      newLogs.push({
        type: 'output',
        text: `acmecorp.com\nglobex.io\nmail.starkindustries.com\nmailos.local`,
      })
    } else if (cmd === 'zmprov gaa') {
      newLogs.push({
        type: 'output',
        text: `admin@mailos.local\nadmin@example.com\nsales@example.com\nj.doe@example.com`,
      })
    } else if (cmd === 'mailq') {
      newLogs.push({
        type: 'output',
        text: `-Queue ID-  --Size-- ----Arrival Time---- -Sender/Recipient-------\nA1B2C3D4E5    14580 Tue Oct 27 14:32:01  alerts@system.local\n                                         admin@external.net\nF6G7H8I9J0  2145890 Tue Oct 27 14:32:01  marketing@domain.com\n (host mx.service.io[10.0.0.5] said: 450 Rate limit exceeded)\n                                         bounce-handler@service.io\n\n-- 2160 Kbytes in 2 Requests.`,
      })
    } else if (cmd === 'postfix reload') {
      newLogs.push({
        type: 'success',
        text: `postfix/postfix-script: refreshing the Postfix mail system\npostfix/master[402]: reload -- version 3.4.13, configuration /etc/postfix`,
      })
    } else if (cmd === 'uptime') {
      newLogs.push({
        type: 'output',
        text: ` 13:40:00 up 42 days, 18:45, 1 user, load average: 4.12, 3.85, 3.10`,
      })
    } else if (cmd === 'df -h') {
      newLogs.push({
        type: 'output',
        text: `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       500G  112G  388G  23% /\n/opt/zimbra     250G   48G  202G  19% /opt/zimbra\ntmpfs            16G  1.2G   15G   8% /dev/shm`,
      })
    } else if (cmd === 'help') {
      newLogs.push({
        type: 'output',
        text: `Available MailOS commands:\n  zmcontrol status  - Show Zimbra service statuses\n  zmprov gad        - List all domains (Get All Domains)\n  zmprov gaa        - List all accounts (Get All Accounts)\n  mailq             - Inspect Postfix mail delivery queue\n  postfix reload    - Reload Postfix configuration\n  df -h             - Check disk storage space\n  uptime            - Show server uptime & load average\n  clear             - Clear terminal screen`,
      })
    } else {
      newLogs.push({
        type: 'output',
        text: `bash: ${cmd}: command executed via MailOS Docker subsystem.`,
      })
    }

    setLogs(newLogs)
    setInput('')
  }

  const handleCopyOutput = async () => {
    const text = logs
      .map((l) => (l.type === 'cmd' ? `admin@mailos:~$ ${l.text}` : l.text))
      .join('\n')
    const success = await copyText(text)
    if (success) {
      setCopiedOutput(true)
      addToast('Terminal Output Copied', 'All command and output logs copied to clipboard.', 'success')
      setTimeout(() => setCopiedOutput(false), 2000)
    } else {
      addToast('Copy Failed', 'Please copy manually.', 'error')
    }
  }

  const handleKillSession = () => {
    setLogs([])
    setInput('')
    addToast('Session Reset', 'Terminal subshell restarted.', 'warning')
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface font-semibold">Administration Terminal</h1>
          <p className="text-body-sm text-on-surface-variant">Direct shell access to the MailOS server environment.</p>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={handleCopyOutput}
            className={`flex items-center gap-xs px-md py-sm rounded-lg text-label-caps font-bold transition-all border border-outline-variant/20 shadow-sm ${
              copiedOutput
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {copiedOutput ? 'check' : 'content_copy'}
            </span>
            {copiedOutput ? 'Copied!' : 'Copy Output'}
          </button>
          <button
            onClick={handleKillSession}
            className="flex items-center gap-xs px-md py-sm bg-error-container text-on-error-container rounded-lg text-label-caps font-bold hover:brightness-110 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            Kill Session
          </button>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="flex-1 bg-[#070b0e] rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col shadow-2xl">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-md py-xs border-b border-outline-variant/30 bg-surface-container-high">
          <div className="flex gap-xs items-center">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <div className="w-3 h-3 rounded-full bg-tertiary"></div>
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
          </div>
          <span className="text-code-sm font-mono text-on-surface-variant">admin@mailos ~ bash (Zimbra 10.0 FOSS)</span>
          <button
            onClick={handleCopyOutput}
            className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded"
            title="Copy output"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedOutput ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-md font-mono text-[13px] overflow-auto flex flex-col gap-sm">
          {logs.map((entry, idx) => (
            <div key={idx}>
              {entry.type === 'cmd' ? (
                <div className="flex items-center gap-xs">
                  <span className="text-primary font-bold">admin@mailos</span>
                  <span className="text-on-surface-variant">:</span>
                  <span className="text-tertiary">~</span>
                  <span className="text-on-surface-variant">$ </span>
                  <span className="text-on-surface font-semibold">{entry.text}</span>
                </div>
              ) : (
                <pre className="text-secondary whitespace-pre-wrap pl-md mt-xs">{entry.text}</pre>
              )}
            </div>
          ))}
          <div ref={terminalEndRef}></div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleCommand}
          className="flex items-center gap-sm px-md py-sm border-t border-outline-variant/30 bg-surface-container-lowest"
        >
          <span className="text-primary font-mono text-code-sm font-bold">admin@mailos:~$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-on-surface font-mono text-[13px] outline-none placeholder:text-on-surface-variant/40"
            placeholder="Type 'help', 'zmcontrol status', 'zmprov gad', or command (↑/↓ for history)..."
            autoFocus
          />
          <button type="submit" className="text-primary hover:brightness-125 p-xs">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </div>
  )
}
