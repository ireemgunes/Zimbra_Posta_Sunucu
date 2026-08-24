'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useToast } from '@/context/ToastContext'

interface ServiceItem {
  name: string
  service: string
  icon: string
  status: 'active' | 'high-load' | 'stopped'
  statusLabel: string
  cpu: number
  memory: number
  uptime: string
  borderColor: string
  spark: { v: number }[]
  sparkColor: string
}

const INITIAL_SERVICES: ServiceItem[] = [
  {
    name: 'Postfix',
    service: 'postfix.service',
    icon: 'mail',
    status: 'active',
    statusLabel: 'ACTIVE',
    cpu: 2.4,
    memory: 128,
    uptime: '14d 06h 42m',
    borderColor: 'border-secondary',
    spark: [
      { v: 2.1 }, { v: 2.8 }, { v: 2.4 }, { v: 3.1 }, { v: 2.9 }, { v: 3.4 },
      { v: 3.2 }, { v: 2.7 }, { v: 3.0 }, { v: 2.4 }, { v: 2.8 }, { v: 2.4 }
    ],
    sparkColor: '#4edea3',
  },
  {
    name: 'Dovecot',
    service: 'dovecot.service',
    icon: 'move_to_inbox',
    status: 'active',
    statusLabel: 'ACTIVE',
    cpu: 1.8,
    memory: 256,
    uptime: '14d 06h 40m',
    borderColor: 'border-secondary',
    spark: [
      { v: 1.5 }, { v: 1.8 }, { v: 1.6 }, { v: 2.0 }, { v: 1.9 }, { v: 2.2 },
      { v: 2.1 }, { v: 1.8 }, { v: 2.0 }, { v: 1.7 }, { v: 1.9 }, { v: 1.8 }
    ],
    sparkColor: '#4edea3',
  },
  {
    name: 'Rspamd',
    service: 'rspamd.service',
    icon: 'security',
    status: 'high-load',
    statusLabel: 'HIGH LOAD',
    cpu: 85.2,
    memory: 512,
    uptime: '7d 12h 15m',
    borderColor: 'border-tertiary',
    spark: [
      { v: 45 }, { v: 62 }, { v: 55 }, { v: 78 }, { v: 88 }, { v: 72 },
      { v: 85 }, { v: 92 }, { v: 80 }, { v: 85 }, { v: 89 }, { v: 85.2 }
    ],
    sparkColor: '#ffb95f',
  },
]

export default function ServicesPage() {
  const { addToast } = useToast()

  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES)
  const [restartingMap, setRestartingMap] = useState<Record<string, boolean>>({})
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [selectedDeployService, setSelectedDeployService] = useState('ClamAV Antivirus')

  const handleRestart = (name: string) => {
    setRestartingMap((prev) => ({ ...prev, [name]: true }))
    setTimeout(() => {
      setRestartingMap((prev) => ({ ...prev, [name]: false }))
      setServices((prev) =>
        prev.map((s) =>
          s.name === name
            ? {
                ...s,
                status: 'active',
                statusLabel: 'ACTIVE',
                borderColor: 'border-secondary',
                sparkColor: '#4edea3',
                cpu: 2.1,
              }
            : s
        )
      )
      addToast('Service Reloaded', `${name} daemon restarted gracefully.`, 'success')
    }, 1200)
  }

  const handleToggleStopStart = (name: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.name !== name) return s
        if (s.status === 'stopped') {
          addToast('Service Started', `${name} is now running.`, 'success')
          return {
            ...s,
            status: 'active',
            statusLabel: 'ACTIVE',
            borderColor: 'border-secondary',
            sparkColor: '#4edea3',
          }
        } else {
          addToast('Service Stopped', `${name} has been paused.`, 'warning')
          return {
            ...s,
            status: 'stopped',
            statusLabel: 'STOPPED',
            borderColor: 'border-outline-variant',
            sparkColor: '#88929b',
            cpu: 0.0,
          }
        }
      })
    )
  }

  const handleDeploy = () => {
    const newService: ServiceItem = {
      name: selectedDeployService,
      service: `${selectedDeployService.toLowerCase().replace(/\s+/g, '-')}.service`,
      icon: 'extension',
      status: 'active',
      statusLabel: 'ACTIVE',
      cpu: 3.5,
      memory: 384,
      uptime: '0d 00h 01m',
      borderColor: 'border-secondary',
      spark: [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 5 }, { v: 3.5 }],
      sparkColor: '#4edea3',
    }
    setServices([...services, newService])
    setShowDeployModal(false)
    addToast('Daemon Deployed', `${selectedDeployService} provisioned and started.`, 'success')
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg">
      {/* Header */}
      <div className="flex flex-row justify-between items-end gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="text-headline-md font-headline-md text-on-surface font-semibold">System Services</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">Manage and monitor core MailOS daemons</p>
        </div>
        <button
          onClick={() => setShowDeployModal(true)}
          className="flex items-center justify-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-label-caps font-bold hover:brightness-110 shadow-md transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Deploy Service
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-3 gap-lg">
        {services.map((svc) => {
          const isRestarting = restartingMap[svc.name]
          return (
            <div
              key={svc.name}
              className={`bg-surface-container rounded-xl overflow-hidden shadow-md border-t-2 ${svc.borderColor} flex flex-col justify-between transition-all`}
            >
              <div className="p-md flex flex-col gap-md">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[22px]">{svc.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-headline-sm text-on-surface font-semibold">{svc.name}</span>
                      <span className="text-code-sm font-mono text-on-surface-variant">{svc.service}</span>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-xs px-sm py-base rounded-full ${
                      svc.status === 'active'
                        ? 'bg-secondary/10 text-secondary'
                        : svc.status === 'high-load'
                        ? 'bg-tertiary/10 text-tertiary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        svc.status === 'active' ? 'bg-secondary animate-pulse' : svc.status === 'high-load' ? 'bg-tertiary' : 'bg-on-surface-variant'
                      }`}
                    ></div>
                    <span className="text-label-caps font-bold">{svc.statusLabel}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-sm">
                  <div className="bg-surface-container-high rounded-lg p-sm">
                    <span className="text-label-caps text-on-surface-variant uppercase font-bold block mb-xs">
                      CPU Usage
                    </span>
                    <span
                      className={`text-headline-sm font-mono font-bold ${
                        svc.cpu > 50 ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {svc.cpu}%
                    </span>
                  </div>
                  <div className="bg-surface-container-high rounded-lg p-sm">
                    <span className="text-label-caps text-on-surface-variant uppercase font-bold block mb-xs">
                      Memory
                    </span>
                    <span className="text-headline-sm font-mono font-bold text-on-surface">{svc.memory} MB</span>
                  </div>
                </div>

                {/* Uptime Box */}
                <div className="bg-surface-container-high rounded-lg p-sm">
                  <span className="text-label-caps text-on-surface-variant uppercase font-bold block mb-xs">Uptime</span>
                  <span className="text-body-sm font-mono text-on-surface font-medium">{svc.uptime}</span>
                </div>

                {/* Sparkline */}
                <div className="h-16 w-full pt-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={svc.spark}>
                      <Line type="monotone" dataKey="v" stroke={svc.sparkColor} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex border-t border-outline-variant/20 bg-surface-container-low">
                <button
                  disabled={isRestarting}
                  onClick={() => handleRestart(svc.name)}
                  className="flex-1 py-sm flex items-center justify-center gap-xs text-body-sm text-on-surface hover:bg-surface-container-high transition-colors font-medium"
                >
                  {isRestarting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Restarting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                      Restart
                    </>
                  )}
                </button>
                <div className="w-px bg-outline-variant/20"></div>
                <button
                  onClick={() => handleToggleStopStart(svc.name)}
                  className={`px-md py-sm transition-colors ${
                    svc.status === 'stopped'
                      ? 'text-secondary hover:bg-secondary/10'
                      : 'text-on-surface-variant hover:bg-error/10 hover:text-error'
                  }`}
                  title={svc.status === 'stopped' ? 'Start service' : 'Stop service'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {svc.status === 'stopped' ? 'play_arrow' : 'stop'}
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Deploy Service Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-md w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-md">
            <h2 className="text-headline-sm text-on-surface font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">add_box</span>
              Deploy Extra Service Daemon
            </h2>
            <div>
              <label className="text-body-sm text-on-surface-variant block mb-xs">Select Service</label>
              <select
                value={selectedDeployService}
                onChange={(e) => setSelectedDeployService(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-lg px-md py-sm outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 text-body-sm"
              >
                <option value="ClamAV Antivirus">ClamAV Antivirus Daemon</option>
                <option value="Amavisd New">Amavisd-new Content Filter</option>
                <option value="OpenDKIM Signer">OpenDKIM Milter Signer</option>
                <option value="Memcached Cache">Memcached Session Cache</option>
              </select>
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-sm font-bold"
              >
                Deploy Daemon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
