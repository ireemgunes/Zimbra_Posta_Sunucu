'use client'
import { useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/context/ToastContext'
import { copyText } from '@/lib/clipboard'

interface QueueMessage {
  id: string
  sender: string
  recipient: string
  size: string
  status: string
  bounceReason?: string
  arrivalTime?: string
  nextRetry?: string
  postfixLog?: string
}

const INITIAL_MESSAGES: QueueMessage[] = [
  {
    id: 'A1B2C3D4E5',
    sender: 'alerts@system.local',
    recipient: 'admin@external.net',
    size: '14.2 KB',
    status: 'active',
  },
  {
    id: 'F6G7H8I9J0',
    sender: 'marketing@domain.com',
    recipient: 'bounce-handler@service.io',
    size: '2.1 MB',
    status: 'deferred',
    bounceReason:
      '450 4.2.1 The user you are trying to contact is receiving mail at a rate that prevents additional messages from being delivered.',
    arrivalTime: '2023-10-27 14:32:01 UTC',
    nextRetry: '2023-10-27 15:02:01 UTC',
    postfixLog:
      'Oct 27 14:32:01 mail-mta postfix/smtpd[1234]: connect from sender.domain.com[192.168.1.50]\nOct 27 14:32:01 mail-mta postfix/smtp[1234]: F6G7H8I9J0: client=sender.domain.com[192.168.1.50]\nOct 27 14:32:02 mail-mta postfix/cleanup[1235]: F6G7H8I9J0: message-id=<123@domain.com>\nOct 27 14:32:02 mail-mta postfix/qmgr[1236]: F6G7H8I9J0: from=marketing@domain.com, size=2145890, nrcpt=1 (queue active)\nOct 27 14:32:05 mail-mta postfix/smtp[1237]: F6G7H8I9J0: to=<bounce-handler@service.io>, relay=mx.service.io[10.0.0.5]:25, delay=4.2, delays=0.1/0/0.1/4, dsn=4.2.1, status=deferred (host mx.service.io[10.0.0.5] said: 450 4.2.1 Rate limit exceeded)',
  },
  {
    id: 'K1L2M3N4O5',
    sender: 'noreply@app.co',
    recipient: 'user789@gmail.com',
    size: '45 KB',
    status: 'hold',
  },
  {
    id: 'P6Q7R8S9T0',
    sender: 'support@service.net',
    recipient: 'client-xyz@corporate.com',
    size: '890 KB',
    status: 'active',
  },
  {
    id: 'U1V2W3X4Y5',
    sender: 'billing@finance.org',
    recipient: 'accounting@partner.ltd',
    size: '1.2 MB',
    status: 'active',
  },
]

export default function QueuesPage() {
  const { addToast } = useToast()

  const [messages, setMessages] = useState<QueueMessage[]>(INITIAL_MESSAGES)
  const [selected, setSelected] = useState<QueueMessage | null>(INITIAL_MESSAGES[1])
  const [filterStatus, setFilterStatus] = useState('all')
  const [isFlushing, setIsFlushing] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [isHoldActive, setIsHoldActive] = useState(false)
  const [copiedLog, setCopiedLog] = useState(false)

  const filtered = messages.filter((m) => filterStatus === 'all' || m.status === filterStatus)

  const activeCount = messages.filter((m) => m.status === 'active').length
  const deferredCount = messages.filter((m) => m.status === 'deferred').length
  const holdCount = messages.filter((m) => m.status === 'hold').length

  const handleFlush = () => {
    setIsFlushing(true)
    setTimeout(() => {
      setIsFlushing(false)
      setMessages((prev) =>
        prev.map((m) => (m.status === 'deferred' ? { ...m, status: 'active' } : m))
      )
      addToast(
        'Queue Flushed Successfully',
        'Postfix queue manager (qmgr) triggered delivery attempt for all deferred messages.',
        'success'
      )
    }, 1200)
  }

  // Toggle Hold All <-> Resume All
  const handleToggleHoldAll = () => {
    if (!isHoldActive) {
      setMessages((prev) => prev.map((m) => ({ ...m, status: 'hold' })))
      setIsHoldActive(true)
      addToast('All Messages On Hold', 'Outgoing message delivery paused across all queues.', 'warning')
    } else {
      setMessages((prev) => prev.map((m) => (m.status === 'hold' ? { ...m, status: 'active' } : m)))
      setIsHoldActive(false)
      addToast('Delivery Resumed', 'All held messages returned to active delivery queue.', 'success')
    }
  }

  const handleDeleteAll = () => {
    setMessages([])
    setSelected(null)
    setShowDeleteAllModal(false)
    addToast('Mail Queue Cleared', 'All messages purged from Postfix queues.', 'info')
  }

  const handleRetryMessage = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'active' } : m))
    )
    addToast('Delivery Retried', `Message ${id} placed back into active queue.`, 'info')
  }

  const handleDeleteSingle = (id: string) => {
    setMessages(messages.filter((m) => m.id !== id))
    if (selected?.id === id) setSelected(null)
    addToast('Message Deleted', `Message ${id} purged.`, 'info')
  }

  const handleCopyPostfixLog = async () => {
    if (selected?.postfixLog) {
      const success = await copyText(selected.postfixLog)
      if (success) {
        setCopiedLog(true)
        addToast('Log Copied', 'Postfix log snippet copied to clipboard.', 'success')
        setTimeout(() => setCopiedLog(false), 2000)
      } else {
        addToast('Copy Failed', 'Please copy manually.', 'error')
      }
    }
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg">
      {/* Header */}
      <div className="flex flex-row justify-between items-end gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="text-headline-md font-headline-md text-on-surface font-semibold">Mail Queues Monitoring</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Real-time status of inbound and outbound message processing.
          </p>
        </div>
        <div className="flex flex-row gap-sm">
          <button
            disabled={isFlushing}
            onClick={handleFlush}
            className="flex items-center justify-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-label-caps font-bold hover:brightness-110 shadow-md transition-all"
          >
            {isFlushing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Flushing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                Flush Queue
              </>
            )}
          </button>

          {/* Toggle Hold All / Resume All */}
          <button
            onClick={handleToggleHoldAll}
            className={`flex items-center justify-center gap-xs px-md py-sm rounded-lg text-label-caps font-bold transition-all shadow-sm ${
              isHoldActive
                ? 'bg-secondary text-on-secondary hover:brightness-110'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isHoldActive ? 'play_circle' : 'pause_circle'}
            </span>
            {isHoldActive ? 'Resume All (Unhold)' : 'Hold All'}
          </button>

          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center justify-center gap-xs px-md py-sm bg-error-container text-on-error-container rounded-lg text-label-caps hover:brightness-110 transition-all font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete All
          </button>
        </div>
      </div>

      {/* 4 Status KPI Cards */}
      <div className="grid grid-cols-4 gap-md w-full">
        {/* Active Queue */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-xs mb-xs">
            <span className="material-symbols-outlined text-secondary text-[20px]">mark_email_unread</span>
            <span className="text-label-caps text-on-surface-variant uppercase font-bold">Active Queue</span>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-mono text-display-lg text-on-surface">{activeCount * 300 + 292}</span>
            <span className="text-code-sm font-mono text-secondary flex items-center">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>12%
            </span>
          </div>
        </div>

        {/* Deferred Queue */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-xs mb-xs">
            <span className="material-symbols-outlined text-tertiary text-[20px]">schedule_send</span>
            <span className="text-label-caps text-on-surface-variant uppercase font-bold">Deferred Queue</span>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-mono text-display-lg text-on-surface">{deferredCount * 170 + 8}</span>
            <span className="text-code-sm font-mono text-error flex items-center">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>5%
            </span>
          </div>
        </div>

        {/* Hold Queue */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-xs mb-xs">
            <span className="material-symbols-outlined text-error text-[20px]">pause_circle</span>
            <span className="text-label-caps text-on-surface-variant uppercase font-bold">Hold Queue</span>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-mono text-display-lg text-on-surface">{holdCount}</span>
            <span className="text-body-sm text-on-surface-variant">messages</span>
          </div>
        </div>

        {/* Flow Rate */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10 justify-between">
          <div className="flex items-center gap-xs mb-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">swap_horiz</span>
            <span className="text-label-caps text-on-surface-variant uppercase font-bold">Flow Rate (MSG/SEC)</span>
          </div>
          <div className="flex flex-col gap-xs">
            <div className="flex justify-between text-code-sm font-mono">
              <span className="text-on-surface-variant">Inbound</span>
              <span className="text-secondary font-bold">42.5</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1">
              <div className="bg-secondary h-full rounded-full" style={{ width: '42.5%' }}></div>
            </div>
            <div className="flex justify-between text-code-sm font-mono">
              <span className="text-on-surface-variant">Outbound</span>
              <span className="text-primary font-bold">{isHoldActive ? '0.0 (Paused)' : '118.2'}</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1">
              <div
                className={`h-full rounded-full ${isHoldActive ? 'bg-error' : 'bg-primary'}`}
                style={{ width: isHoldActive ? '0%' : '70%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-row gap-lg flex-1 min-h-0">
        {/* Message Table */}
        <div className="flex-1 bg-surface-container-low rounded-xl overflow-hidden shadow-md flex flex-col border border-outline-variant/20">
          <div className="px-md py-sm bg-surface-container flex flex-row items-center justify-between border-b border-outline-variant/20">
            <h2 className="text-headline-sm text-on-surface font-semibold">Message Queue</h2>
            <div className="flex gap-xs">
              {['all', 'active', 'deferred', 'hold'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-sm py-xs rounded text-body-sm capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {st === 'all' ? 'All Statuses' : st}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container">
              <tr>
                <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium">Queue ID</th>
                <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium">Sender</th>
                <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium">Recipient</th>
                <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium">Size</th>
                <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium">Status</th>
                <th className="px-md py-sm text-label-caps text-on-surface-variant font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {filtered.map((msg) => (
                <tr
                  key={msg.id}
                  onClick={() => setSelected(msg)}
                  className={`hover:bg-surface-container-highest/50 transition-colors cursor-pointer ${
                    selected?.id === msg.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-md py-sm font-mono text-data-mono text-primary font-medium">{msg.id}</td>
                  <td className="px-md py-sm text-body-sm text-on-surface">{msg.sender}</td>
                  <td className="px-md py-sm text-body-sm text-on-surface-variant">{msg.recipient}</td>
                  <td className="px-md py-sm font-mono text-code-sm text-on-surface">{msg.size}</td>
                  <td className="px-md py-sm">
                    <StatusBadge status={msg.status} />
                  </td>
                  <td className="px-md py-sm text-right">
                    <div className="flex items-center justify-end gap-xs" onClick={(e) => e.stopPropagation()}>
                      {msg.status === 'deferred' && (
                        <button
                          onClick={() => handleRetryMessage(msg.id)}
                          className="p-xs text-tertiary hover:bg-tertiary/20 rounded transition-colors"
                          title="Retry delivery immediately"
                        >
                          <span className="material-symbols-outlined text-[18px]">replay</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSingle(msg.id)}
                        className="p-xs text-on-surface-variant hover:text-error transition-colors rounded"
                        title="Delete message from queue"
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

        {/* Queue Details Panel */}
        {selected && selected.bounceReason && (
          <div className="w-96 bg-surface-container-low rounded-xl p-md flex flex-col gap-md border border-outline-variant/20 shadow-md">
            <div className="flex items-center justify-between pb-sm border-b border-outline-variant/20">
              <h2 className="text-headline-sm text-on-surface font-semibold">Queue Details</h2>
              <span className="text-code-sm font-mono text-primary font-bold">ID: {selected.id}</span>
            </div>

            <div className="bg-error/10 border border-error/30 rounded-lg p-md">
              <span className="text-label-caps text-error uppercase font-bold block mb-xs">Bounce Reason</span>
              <p className="text-code-sm font-mono text-on-surface leading-relaxed font-medium">{selected.bounceReason}</p>
            </div>

            <div className="grid grid-cols-2 gap-md pt-sm border-t border-outline-variant/20">
              <div>
                <span className="text-label-caps text-on-surface-variant uppercase block mb-xs">Arrival Time</span>
                <span className="text-code-sm font-mono text-on-surface">{selected.arrivalTime}</span>
              </div>
              <div>
                <span className="text-label-caps text-on-surface-variant uppercase block mb-xs">Next Retry</span>
                <span className="text-code-sm font-mono text-on-surface">{selected.nextRetry}</span>
              </div>
            </div>

            <div className="flex flex-col gap-xs pt-sm border-t border-outline-variant/20 flex-1">
              <div className="flex items-center justify-between mb-xs">
                <span className="text-label-caps text-on-surface-variant uppercase font-bold">Postfix Log Snippet</span>
                <button
                  onClick={handleCopyPostfixLog}
                  className="px-2 py-1 rounded bg-surface-container-high hover:bg-primary/20 text-primary font-bold text-[12px] flex items-center gap-xs transition-colors"
                  title="Copy log text"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copiedLog ? 'check' : 'content_copy'}
                  </span>
                  {copiedLog ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-[#070b0e] rounded-lg p-sm font-mono text-[11px] text-secondary overflow-auto max-h-48 border border-outline-variant/20">
                <pre className="whitespace-pre-wrap">{selected.postfixLog}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-error font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined">warning</span>
              Purge All Queue Messages
            </h2>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete all messages from active, deferred, and hold queues? This cannot be undone.
            </p>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-md py-sm bg-error-container text-on-error-container rounded-lg text-body-sm font-bold"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
