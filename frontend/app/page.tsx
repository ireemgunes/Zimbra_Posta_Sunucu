'use client'
import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useToast } from '@/context/ToastContext'

const INITIAL_LOAD_DATA = [
  { t: '1', load1m: 4.12, load5m: 3.85, load15m: 3.10 },
  { t: '2', load1m: 4.05, load5m: 3.82, load15m: 3.09 },
  { t: '3', load1m: 4.35, load5m: 3.90, load15m: 3.12 },
  { t: '4', load1m: 5.80, load5m: 4.20, load15m: 3.25 },
  { t: '5', load1m: 6.90, load5m: 4.80, load15m: 3.40 },
  { t: '6', load1m: 7.20, load5m: 5.10, load15m: 3.55 },
  { t: '7', load1m: 6.80, load5m: 5.30, load15m: 3.65 },
  { t: '8', load1m: 5.40, load5m: 5.00, load15m: 3.60 },
  { t: '9', load1m: 4.80, load5m: 4.60, load15m: 3.50 },
  { t: '10', load1m: 4.90, load5m: 4.40, load15m: 3.45 },
  { t: '11', load1m: 5.60, load5m: 4.70, load15m: 3.55 },
  { t: '12', load1m: 7.80, load5m: 5.40, load15m: 3.75 },
  { t: '13', load1m: 8.20, load5m: 6.10, load15m: 3.95 },
  { t: '14', load1m: 7.40, load5m: 6.30, load15m: 4.10 },
  { t: '15', load1m: 6.10, load5m: 5.90, load15m: 4.05 },
]

const INITIAL_NETWORK_DATA = [
  { t: '1', in: 1.2, out: 0.4 },
  { t: '2', in: 1.8, out: 0.6 },
  { t: '3', in: 1.4, out: 0.5 },
  { t: '4', in: 2.8, out: 0.9 },
  { t: '5', in: 3.6, out: 1.2 },
  { t: '6', in: 3.1, out: 1.1 },
  { t: '7', in: 4.2, out: 1.8 },
  { t: '8', in: 3.8, out: 1.5 },
  { t: '9', in: 4.5, out: 1.7 },
  { t: '10', in: 3.9, out: 1.4 },
  { t: '11', in: 3.2, out: 1.3 },
  { t: '12', in: 3.6, out: 1.5 },
  { t: '13', in: 2.9, out: 1.2 },
  { t: '14', in: 3.4, out: 1.6 },
  { t: '15', in: 3.1, out: 1.4 },
]

const INITIAL_IOPS_DATA = [
  { t: '1', iops: 4200 }, { t: '2', iops: 5100 }, { t: '3', iops: 3800 },
  { t: '4', iops: 6200 }, { t: '5', iops: 11800 }, { t: '6', iops: 4500 },
  { t: '7', iops: 12400 }, { t: '8', iops: 7800 }, { t: '9', iops: 11200 },
  { t: '10', iops: 8900 }, { t: '11', iops: 9500 }, { t: '12', iops: 12100 },
  { t: '13', iops: 8300 }, { t: '14', iops: 11500 }, { t: '15', iops: 12400 },
  { t: '16', iops: 9200 }, { t: '17', iops: 11900 }, { t: '18', iops: 7400 },
  { t: '19', iops: 12200 }, { t: '20', iops: 8600 }, { t: '21', iops: 12400 }
]

const INITIAL_CORES = [
  { id: 0, percent: 71, tier: 'warm' },
  { id: 1, percent: 26, tier: 'cool' },
  { id: 2, percent: 79, tier: 'warm' },
  { id: 3, percent: 85, tier: 'warm' },
  { id: 4, percent: 92, tier: 'hot' },
  { id: 5, percent: 31, tier: 'cool' },
  { id: 6, percent: 42, tier: 'cool' },
  { id: 7, percent: 59, tier: 'cool' },
  { id: 8, percent: 13, tier: 'dim' },
  { id: 9, percent: 85, tier: 'warm' },
  { id: 10, percent: 67, tier: 'warm' },
  { id: 11, percent: 26, tier: 'dim' },
  { id: 12, percent: 71, tier: 'warm' },
  { id: 13, percent: 45, tier: 'cool' },
  { id: 14, percent: 99, tier: 'hot' },
  { id: 15, percent: 64, tier: 'warm' },
]

const TOP_PROCESSES = [
  { pid: 18932, user: 'mysql', pr: 20, cpu: '142.5', mem: '18.4', command: 'mysqld' },
  { pid: 402, user: 'root', pr: 20, cpu: '45.2', mem: '2.1', command: 'postfix/master' },
  { pid: 19044, user: 'nginx', pr: 20, cpu: '12.0', mem: '1.8', command: 'nginx' },
  { pid: 933, user: 'redis', pr: 20, cpu: '8.5', mem: '14.2', command: 'redis-server' },
  { pid: 1, user: 'root', pr: 20, cpu: '0.1', mem: '0.1', command: 'systemd' },
  { pid: 154, user: 'root', pr: 0, cpu: '0.0', mem: '0.0', command: 'kthreadd' },
]

// Historical datasets
const DATA_24H = Array.from({ length: 24 }, (_, i) => ({
  time: `${i.toString().padStart(2, '0')}:00`,
  cpu: +(20 + Math.sin(i / 3) * 18 + Math.random() * 8).toFixed(1),
  memory: +(95 + Math.cos(i / 4) * 15 + Math.random() * 5).toFixed(1),
  network: +(1.5 + Math.sin(i / 2) * 1.8 + Math.random() * 0.5).toFixed(2),
  iops: Math.floor(4000 + Math.sin(i / 3) * 3500 + Math.random() * 1000),
}))

const DATA_YESTERDAY = Array.from({ length: 24 }, (_, i) => ({
  time: `${i.toString().padStart(2, '0')}:00`,
  cpu: +(25 + Math.cos(i / 3) * 20 + Math.random() * 10).toFixed(1),
  memory: +(100 + Math.sin(i / 4) * 12 + Math.random() * 4).toFixed(1),
  network: +(2.0 + Math.cos(i / 2) * 1.5 + Math.random() * 0.6).toFixed(2),
  iops: Math.floor(4500 + Math.cos(i / 3) * 4000 + Math.random() * 1200),
}))

const DATA_7D = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
  time: day,
  cpu: +(28 + (i % 3) * 8 + Math.random() * 6).toFixed(1),
  memory: +(105 + (i % 2) * 10 + Math.random() * 5).toFixed(1),
  network: +(2.2 + (i % 4) * 0.8 + Math.random() * 0.4).toFixed(2),
  iops: Math.floor(6000 + (i % 3) * 2500 + Math.random() * 1500),
}))

const DATA_30D = Array.from({ length: 30 }, (_, i) => ({
  time: `Day ${i + 1}`,
  cpu: +(22 + Math.sin(i / 4) * 15 + (i > 20 ? 10 : 0) + Math.random() * 7).toFixed(1),
  memory: +(98 + Math.cos(i / 5) * 14 + Math.random() * 6).toFixed(1),
  network: +(1.8 + Math.sin(i / 3) * 1.6 + Math.random() * 0.5).toFixed(2),
  iops: Math.floor(4800 + Math.sin(i / 4) * 3200 + Math.random() * 1500),
}))

function getCoreStyle(tier: string) {
  switch (tier) {
    case 'hot':
      return 'bg-[#3b1a1c] border border-error/40 text-error'
    case 'warm':
      return 'bg-[#362511] border border-tertiary/40 text-tertiary'
    case 'cool':
      return 'bg-[#122b3a] border border-primary/40 text-primary'
    default:
      return 'bg-surface-container-high border border-outline-variant/20 text-on-surface-variant'
  }
}

export default function DashboardPage() {
  const { addToast } = useToast()

  const [cpuLoad, setCpuLoad] = useState(34.2)
  const [memUsed, setMemUsed] = useState(112)
  const [netIn, setNetIn] = useState(4.2)
  const [netOut, setNetOut] = useState(1.8)
  const [load1m, setLoad1m] = useState(4.12)
  const [cores, setCores] = useState(INITIAL_CORES)
  const [isLiveActive, setIsLiveActive] = useState(true)

  // Historical Data Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedRange, setSelectedRange] = useState<'24h' | 'yesterday' | '7d' | '30d' | 'custom'>('24h')
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'network' | 'iops'>('cpu')
  const [customFromDate, setCustomFromDate] = useState('2026-08-01')
  const [customToDate, setCustomToDate] = useState('2026-08-18')

  // Live Auto-Refresh Simulation
  useEffect(() => {
    if (!isLiveActive) return
    const interval = setInterval(() => {
      setCpuLoad((prev) => {
        const delta = (Math.random() - 0.5) * 3
        return Math.max(15, Math.min(85, +(prev + delta).toFixed(1)))
      })
      setMemUsed((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 4)
        return Math.max(90, Math.min(180, prev + delta))
      })
      setNetIn((prev) => +(prev + (Math.random() - 0.5) * 0.4).toFixed(1))
      setNetOut((prev) => +(prev + (Math.random() - 0.5) * 0.2).toFixed(1))
      setLoad1m((prev) => +(prev + (Math.random() - 0.5) * 0.15).toFixed(2))

      setCores((prevCores) =>
        prevCores.map((c) => {
          const newPct = Math.max(5, Math.min(99, c.percent + Math.floor((Math.random() - 0.5) * 8)))
          let tier = 'dim'
          if (newPct >= 90) tier = 'hot'
          else if (newPct >= 65) tier = 'warm'
          else if (newPct >= 30) tier = 'cool'
          return { ...c, percent: newPct, tier }
        })
      )
    }, 3500)

    return () => clearInterval(interval)
  }, [isLiveActive])

  // Get active dataset for historical modal
  const getHistoricalData = () => {
    switch (selectedRange) {
      case '24h':
        return DATA_24H
      case 'yesterday':
        return DATA_YESTERDAY
      case '7d':
        return DATA_7D
      case '30d':
        return DATA_30D
      case 'custom':
        return Array.from({ length: 14 }, (_, i) => ({
          time: `Aug ${i + 1}`,
          cpu: +(24 + Math.sin(i / 2) * 14 + Math.random() * 8).toFixed(1),
          memory: +(102 + Math.cos(i / 3) * 12 + Math.random() * 5).toFixed(1),
          network: +(1.9 + Math.sin(i / 2) * 1.2 + Math.random() * 0.5).toFixed(2),
          iops: Math.floor(5200 + Math.sin(i / 2) * 2800 + Math.random() * 1200),
        }))
    }
  }

  const activeData = getHistoricalData()

  // Calculate statistics for active historical data
  const metricValues = activeData.map((d: any) => d[selectedMetric])
  const peakVal = Math.max(...metricValues)
  const avgVal = +(metricValues.reduce((a: number, b: number) => a + b, 0) / metricValues.length).toFixed(1)
  const minVal = Math.min(...metricValues)

  const handleExportReport = () => {
    const reportData = {
      cluster: 'Primary MailOS Node',
      timestamp: new Date().toISOString(),
      metrics: {
        uptime: '42 days 18 hrs',
        globalCpuLoad: `${cpuLoad}%`,
        memoryAllocation: `${memUsed} / 256 GB`,
        network: { inboundGbps: netIn, outboundGbps: netOut },
        loadAverage1m: load1m,
        coresUtilization: cores,
        topProcesses: TOP_PROCESSES,
      },
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mailos-telemetry-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Telemetry Report Exported', 'JSON metrics snapshot downloaded successfully.', 'success')
  }

  const handleDownloadCsv = () => {
    const headers = 'Time,CPU_Load_Pct,Memory_GB,Network_Gbps,Storage_IOPS\n'
    const rows = activeData
      .map((d: any) => `${d.time},${d.cpu},${d.memory},${d.network},${d.iops}`)
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mailos-history-${selectedRange}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast('CSV Downloaded', `Historical data for ${selectedRange.toUpperCase()} exported.`, 'success')
  }

  const copyTopOutput = () => {
    const header = 'PID     USER    PR  %CPU  %MEM  COMMAND\n'
    const rows = TOP_PROCESSES.map(
      (p) => `${p.pid.toString().padEnd(7)} ${p.user.padEnd(7)} ${p.pr.toString().padEnd(3)} ${p.cpu.padEnd(5)} ${p.mem.padEnd(5)} ${p.command}`
    ).join('\n')
    navigator.clipboard.writeText(header + rows)
    addToast('Process Snapshot Copied', 'TOP -N 1 -B buffer copied to clipboard.', 'info')
  }

  return (
    <div className="flex flex-col w-full p-lg gap-lg">
      {/* Header Section */}
      <div className="flex flex-row justify-between items-end w-full">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm">
            <h1 className="text-headline-md text-primary tracking-tight font-semibold">System Telemetry</h1>
            <button
              onClick={() => {
                setIsLiveActive(!isLiveActive)
                addToast(
                  isLiveActive ? 'Live Telemetry Paused' : 'Live Telemetry Resumed',
                  isLiveActive ? 'Metric polling is paused.' : 'Streaming real-time metrics every 3.5s.',
                  'info'
                )
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold transition-all ${
                isLiveActive ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? 'bg-secondary animate-pulse' : 'bg-on-surface-variant'}`}></span>
              {isLiveActive ? 'LIVE STREAMING' : 'PAUSED'}
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant max-w-2xl">
            Real-time performance metrics, resource utilization, and thermal diagnostics for the primary node cluster.
          </p>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-xs px-md py-xs bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg transition-colors text-label-caps font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Historical Data
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-xs px-md py-xs bg-primary text-on-primary rounded-lg hover:brightness-110 transition-all text-label-caps shadow-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Overview KPIs Grid */}
      <div className="grid grid-cols-4 gap-md w-full">
        {/* System Uptime */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm relative overflow-hidden group border border-outline-variant/10">
          <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-[48px] text-primary">schedule</span>
          </div>
          <span className="text-label-caps text-on-surface-variant uppercase mb-xs relative z-10">System Uptime</span>
          <div className="flex items-baseline gap-sm relative z-10">
            <span className="font-mono text-display-lg text-on-surface">42</span>
            <span className="text-code-sm text-primary font-mono">days</span>
            <span className="font-mono text-headline-md text-on-surface">18</span>
            <span className="text-code-sm text-primary font-mono">hrs</span>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-code-sm text-secondary font-mono">No interruptions</span>
          </div>
        </div>

        {/* Global CPU Load */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm relative overflow-hidden group border border-outline-variant/10">
          <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-[48px] text-tertiary">memory</span>
          </div>
          <span className="text-label-caps text-on-surface-variant uppercase mb-xs relative z-10">Global CPU Load</span>
          <div className="flex items-baseline gap-xs relative z-10">
            <span className="font-mono text-display-lg text-tertiary">{cpuLoad}</span>
            <span className="text-code-sm text-on-surface-variant font-mono">%</span>
          </div>
          <div className="mt-sm w-full bg-surface-container-highest rounded-full h-1 overflow-hidden relative z-10">
            <div
              className="bg-tertiary h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(cpuLoad, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Memory Allocation */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm relative overflow-hidden group border border-outline-variant/10">
          <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-[48px] text-secondary">dns</span>
          </div>
          <span className="text-label-caps text-on-surface-variant uppercase mb-xs relative z-10">Memory Allocation</span>
          <div className="flex items-baseline gap-xs relative z-10">
            <span className="font-mono text-display-lg text-secondary">{memUsed}</span>
            <span className="text-code-sm text-on-surface-variant font-mono">/ 256 GB</span>
          </div>
          <div className="mt-sm w-full bg-surface-container-highest rounded-full h-1 overflow-hidden relative z-10 flex">
            <div
              className="bg-secondary h-full transition-all duration-700"
              style={{ width: `${(memUsed / 256) * 100}%` }}
            ></div>
            <div className="bg-surface-variant h-full flex-1"></div>
          </div>
        </div>

        {/* Thermal Status */}
        <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm relative overflow-hidden group border border-outline-variant/10">
          <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-[48px] text-error">device_thermostat</span>
          </div>
          <span className="text-label-caps text-on-surface-variant uppercase mb-xs relative z-10">Core Temp (Avg)</span>
          <div className="flex items-baseline gap-xs relative z-10">
            <span className="font-mono text-display-lg text-on-surface">62</span>
            <span className="text-code-sm text-on-surface-variant font-mono">°C</span>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10">
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-error text-code-sm font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Elevated
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Telemetry Row */}
      <div className="grid grid-cols-12 gap-md w-full">
        {/* Left Column: Load Averages & Network & IOPS */}
        <div className="col-span-8 flex flex-col gap-md">
          {/* Load Averages Chart */}
          <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
                <span className="text-headline-sm text-on-surface font-medium">Load Averages</span>
              </div>
              <div className="flex items-center gap-md text-code-sm font-mono">
                <div className="flex items-center gap-xs">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-on-surface-variant">1m: <strong className="text-on-surface">{load1m}</strong></span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                  <span className="text-on-surface-variant">5m: <strong className="text-on-surface">3.85</strong></span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
                  <span className="text-on-surface-variant">15m: <strong className="text-on-surface">3.10</strong></span>
                </div>
              </div>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INITIAL_LOAD_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b2f" vertical={false} />
                  <XAxis dataKey="t" hide />
                  <YAxis domain={[0, 9]} tick={{ fill: '#88929b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1b2024', borderColor: '#3e4850', borderRadius: '8px', color: '#dee3e9' }} />
                  <Line type="monotone" dataKey="load1m" stroke="#89ceff" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="load5m" stroke="#ffb95f" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="load15m" stroke="#88929b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Network I/O Chart */}
          <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px]">hub</span>
                <span className="text-headline-sm text-on-surface font-medium">Network I/O</span>
              </div>
              <div className="flex items-center gap-md text-code-sm font-mono">
                <div className="flex items-center gap-xs text-secondary">
                  <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                  <span>In: {netIn} Gbps</span>
                </div>
                <div className="flex items-center gap-xs text-tertiary">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  <span>Out: {netOut} Gbps</span>
                </div>
              </div>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INITIAL_NETWORK_DATA} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b2f" vertical={false} />
                  <XAxis dataKey="t" hide />
                  <YAxis tick={{ fill: '#88929b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1b2024', borderColor: '#3e4850', borderRadius: '8px', color: '#dee3e9' }} />
                  <Line type="monotone" dataKey="in" stroke="#4edea3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="out" stroke="#ffb95f" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Storage IOPS Bar Chart */}
          <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">storage</span>
                <span className="text-headline-sm text-on-surface font-medium">Storage IOPS</span>
              </div>
              <span className="text-code-sm font-mono text-on-surface-variant">Peak: 12.4k iops</span>
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INITIAL_IOPS_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <Tooltip contentStyle={{ backgroundColor: '#1b2024', borderColor: '#3e4850', borderRadius: '8px', color: '#dee3e9' }} />
                  <Bar dataKey="iops" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Core Utilization + Top Processes */}
        <div className="col-span-4 flex flex-col gap-md">
          {/* Core Utilization 4x4 Grid */}
          <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-primary text-[20px]">grid_view</span>
              <span className="text-headline-sm text-on-surface font-medium">Core Utilization</span>
            </div>
            <div className="grid grid-cols-4 gap-xs">
              {cores.map((core) => (
                <div
                  key={core.id}
                  className={`flex flex-col items-center justify-center p-xs rounded-md transition-colors duration-500 ${getCoreStyle(core.tier)}`}
                >
                  <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">CORE {core.id}</span>
                  <span className="text-[14px] font-mono font-bold">{core.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Processes Terminal Window */}
          <div className="flex flex-col bg-[#070b0e] rounded-xl border border-outline-variant/30 overflow-hidden shadow-md flex-1">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-md py-xs bg-surface-container-high border-b border-outline-variant/30">
              <div className="flex gap-xs items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">TOP -N 1 -B</span>
              <button
                onClick={copyTopOutput}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-xs"
                title="Copy process list"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
            </div>

            {/* Terminal Table */}
            <div className="p-sm font-mono text-[12px] flex-1 overflow-auto">
              <div className="grid grid-cols-6 text-on-surface-variant text-[11px] font-bold border-b border-outline-variant/20 pb-xs mb-xs">
                <span>PID</span>
                <span>USER</span>
                <span>PR</span>
                <span>%CPU</span>
                <span>%MEM</span>
                <span className="text-right">COMMAND</span>
              </div>
              {TOP_PROCESSES.map((p) => (
                <div key={p.pid} className="grid grid-cols-6 text-[12px] py-[3px] hover:bg-surface-container-high/40 transition-colors">
                  <span className="text-secondary">{p.pid}</span>
                  <span className="text-on-surface">{p.user}</span>
                  <span className="text-on-surface-variant">{p.pr}</span>
                  <span className={parseFloat(p.cpu) > 50 ? 'text-error font-bold' : 'text-secondary'}>{p.cpu}</span>
                  <span className="text-on-surface-variant">{p.mem}</span>
                  <span className="text-right text-primary truncate">{p.command}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic & Interactive Historical Data Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-low rounded-xl p-xl max-w-3xl w-full border border-outline-variant/40 shadow-2xl flex flex-col gap-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
              <div>
                <h2 className="text-headline-sm text-on-surface font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Historical Telemetry & Resource Diagnostics
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-xs">
                  Inspect cluster load curves, memory footprint, and I/O metrics across time ranges.
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Time Range Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-sm bg-surface-container p-xs rounded-xl border border-outline-variant/20">
              <div className="flex flex-wrap gap-xs">
                {[
                  { id: '24h', label: 'Last 24 Hours' },
                  { id: 'yesterday', label: '1 Day Ago (Yesterday)' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: '30d', label: 'Last 30 Days' },
                  { id: 'custom', label: 'Custom Range' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedRange(tab.id as any)
                      addToast('Time Range Updated', `Switched to ${tab.label}.`, 'info')
                    }}
                    className={`px-md py-xs rounded-lg text-body-sm font-semibold transition-all ${
                      selectedRange === tab.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Metric Switcher */}
              <div className="flex gap-xs bg-surface-container-highest p-0.5 rounded-lg">
                {[
                  { id: 'cpu', label: 'CPU %', color: '#89ceff' },
                  { id: 'memory', label: 'RAM GB', color: '#4edea3' },
                  { id: 'network', label: 'Net Gbps', color: '#ffb95f' },
                  { id: 'iops', label: 'IOPS', color: '#0ea5e9' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMetric(m.id as any)}
                    className={`px-sm py-xs rounded text-[11px] font-mono font-bold transition-all ${
                      selectedMetric === m.id
                        ? 'bg-surface text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range Date Pickers */}
            {selectedRange === 'custom' && (
              <div className="flex items-center gap-md bg-surface-container p-sm rounded-xl border border-outline-variant/20">
                <span className="text-body-sm font-bold text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">date_range</span>
                  Select Date Range:
                </span>
                <div className="flex items-center gap-xs">
                  <span className="text-code-sm text-on-surface-variant">From:</span>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="bg-surface-container-high text-on-surface text-body-sm rounded-lg px-sm py-xs border border-outline-variant/30 outline-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-xs">
                  <span className="text-code-sm text-on-surface-variant">To:</span>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="bg-surface-container-high text-on-surface text-body-sm rounded-lg px-sm py-xs border border-outline-variant/30 outline-none font-mono"
                  />
                </div>
                <button
                  onClick={() => addToast('Custom Range Applied', `${customFromDate} to ${customToDate} calculated.`, 'success')}
                  className="px-md py-xs bg-primary text-on-primary rounded-lg text-body-sm font-bold ml-auto"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Statistics Summary Cards */}
            <div className="grid grid-cols-4 gap-sm">
              <div className="bg-surface-container p-sm rounded-lg border border-outline-variant/15 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Peak Metric</span>
                <span className="text-headline-sm font-mono text-tertiary font-bold">
                  {peakVal} {selectedMetric === 'cpu' ? '%' : selectedMetric === 'memory' ? 'GB' : selectedMetric === 'network' ? 'Gbps' : 'IOPS'}
                </span>
              </div>
              <div className="bg-surface-container p-sm rounded-lg border border-outline-variant/15 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Average</span>
                <span className="text-headline-sm font-mono text-primary font-bold">
                  {avgVal} {selectedMetric === 'cpu' ? '%' : selectedMetric === 'memory' ? 'GB' : selectedMetric === 'network' ? 'Gbps' : 'IOPS'}
                </span>
              </div>
              <div className="bg-surface-container p-sm rounded-lg border border-outline-variant/15 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Minimum</span>
                <span className="text-headline-sm font-mono text-secondary font-bold">
                  {minVal} {selectedMetric === 'cpu' ? '%' : selectedMetric === 'memory' ? 'GB' : selectedMetric === 'network' ? 'Gbps' : 'IOPS'}
                </span>
              </div>
              <div className="bg-surface-container p-sm rounded-lg border border-outline-variant/15 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Data Points</span>
                <span className="text-headline-sm font-mono text-on-surface font-bold">{activeData.length} Samples</span>
              </div>
            </div>

            {/* Historical Interactive Chart */}
            <div className="h-64 w-full bg-surface-container rounded-xl p-md border border-outline-variant/20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b2f" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#88929b', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fill: '#88929b', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1b2024', borderColor: '#3e4850', borderRadius: '8px', color: '#dee3e9', fontFamily: 'JetBrains Mono' }} />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={
                      selectedMetric === 'cpu'
                        ? '#89ceff'
                        : selectedMetric === 'memory'
                        ? '#4edea3'
                        : selectedMetric === 'network'
                        ? '#ffb95f'
                        : '#0ea5e9'
                    }
                    strokeWidth={2.5}
                    dot={{ fill: '#89ceff', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-sm border-t border-outline-variant/20">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-xs px-md py-sm bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold rounded-lg text-body-sm transition-colors border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[18px]">table_view</span>
                Download CSV Dataset
              </button>
              <div className="flex gap-sm">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-body-sm font-medium hover:bg-surface-container-highest"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
