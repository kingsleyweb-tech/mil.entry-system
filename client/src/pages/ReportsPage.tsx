import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  ShieldCheck,
  LogIn,
  Clock,
  XCircle,
  TrendingUp,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'
import { getStats, listPersonnel } from '../services/firebase'
import type { Personnel, Stats } from '../types/personnel'
import { formatDate } from '../utils/format'
import { useTheme } from '../context/ThemeContext'
import { RegistrationLinkBanner } from '../components/RegistrationLinkBanner'

export function ReportsPage() {
  const { theme } = useTheme()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [stats, setStats] = useState<Stats>()
  const [loading, setLoading] = useState(true)
  const [trendFilter, setTrendFilter] = useState<'This Month' | 'This Week' | 'All Time'>('This Month')

  const loadData = async () => {
    setLoading(true)
    try {
      const [peopleRes, statsRes] = await Promise.all([
        listPersonnel('', 'ALL'),
        getStats(),
      ])
      setPersonnel(peopleRes.personnel)
      setStats(statsRes.stats)
    } catch (err) {
      console.error('Failed to load reports data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const approvedPct = stats?.totalRegistered
    ? ((stats.approved / stats.totalRegistered) * 100).toFixed(1)
    : '0.0'
  const enteredPct = stats?.totalRegistered
    ? ((stats.entered / stats.totalRegistered) * 100).toFixed(1)
    : '0.0'
  const notEnteredPct = stats?.totalRegistered
    ? ((stats.notYetEntered / stats.totalRegistered) * 100).toFixed(1)
    : '0.0'
  const rejectedPct = stats?.totalRegistered
    ? ((stats.rejected / stats.totalRegistered) * 100).toFixed(1)
    : '0.0'

  // Dynamic Arm of Service & Civilian breakdown
  const armBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      Army: 0,
      Navy: 0,
      'Air Force': 0,
      DCS: 0,
      Civilians: 0,
      'General Headquarters': 0,
    }

    personnel.forEach((p) => {
      if (p.exerciseStatus === 'Civilians' || p.armOfService === 'Civilians') {
        counts.Civilians += 1
      } else if (p.armOfService === 'Army') {
        counts.Army += 1
      } else if (p.armOfService === 'Navy') {
        counts.Navy += 1
      } else if (p.armOfService === 'Air Force') {
        counts['Air Force'] += 1
      } else if (p.armOfService === 'DCS') {
        counts.DCS += 1
      } else {
        counts['General Headquarters'] += 1
      }
    })

    const tot = personnel.length || 1
    const rawList = [
      { name: 'Army', count: counts['Army'], color: '#16A34A' },
      { name: 'Navy', count: counts['Navy'], color: '#2563EB' },
      { name: 'Air Force', count: counts['Air Force'], color: '#0284C7' },
      { name: 'DCS', count: counts['DCS'], color: '#7C3AED' },
      { name: 'Civilians', count: counts['Civilians'], color: '#D97706' },
      { name: 'General Headquarters', count: counts['General Headquarters'], color: '#EA580C' },
    ]

    // Only include categories with count > 0 or top core categories
    return rawList
      .filter((item) => item.count > 0 || ['Army', 'Navy', 'Air Force'].includes(item.name))
      .map((item) => ({
        ...item,
        pct: ((item.count / tot) * 100).toFixed(1),
      }))
  }, [personnel])

  // Compute dynamic SVG donut strokeDasharray & offsets
  const donutSegments = useMemo(() => {
    const tot = personnel.length || 1
    let accumulatedPct = 0

    return armBreakdown.map((item) => {
      const pct = (item.count / tot) * 100
      const strokeDasharray = `${pct} ${100 - pct}`
      const strokeDashoffset = -accumulatedPct
      accumulatedPct += pct
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      }
    })
  }, [armBreakdown, personnel.length])

  // Dynamic Timeline Calculation for Registrations Over Time
  const chartData = useMemo(() => {
    const now = new Date()

    if (trendFilter === 'This Week') {
      const days: { label: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-US', { weekday: 'short' })
        const count = personnel.filter((p) => {
          if (!p.registeredAt) return false
          const pDate = new Date(p.registeredAt).toISOString().split('T')[0]
          return pDate === dateStr
        }).length
        days.push({ label, count })
      }
      const points = days.map((d) => d.count)
      const maxVal = Math.max(...points, 5)
      return { labels: days.map((d) => d.label), points, max: maxVal }
    } else if (trendFilter === 'This Month') {
      const year = now.getFullYear()
      const month = now.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const step = Math.max(1, Math.floor(daysInMonth / 6))

      const intervals: { label: string; count: number }[] = []
      for (let day = 1; day <= daysInMonth; day += step) {
        const dateLabel = `${now.toLocaleDateString('en-US', { month: 'short' })} ${day}`
        const dayEnd = Math.min(day + step - 1, daysInMonth)

        const count = personnel.filter((p) => {
          if (!p.registeredAt) return false
          const pDate = new Date(p.registeredAt)
          return pDate.getFullYear() === year && pDate.getMonth() === month && pDate.getDate() <= dayEnd
        }).length
        intervals.push({ label: dateLabel, count })
      }
      const points = intervals.map((d) => d.count)
      const maxVal = Math.max(...points, 5)
      return { labels: intervals.map((d) => d.label), points, max: maxVal }
    } else {
      // All Time cumulative timeline
      if (personnel.length === 0) {
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          points: [0, 0, 0, 0, 0, 0],
          max: 10,
        }
      }

      const sorted = [...personnel].sort(
        (a, b) => new Date(a.registeredAt || 0).getTime() - new Date(b.registeredAt || 0).getTime()
      )

      const firstTime = new Date(sorted[0]?.registeredAt || Date.now()).getTime()
      const lastTime = now.getTime()
      const span = Math.max(86400000, lastTime - firstTime)
      const interval = span / 5

      const labels: string[] = []
      const points: number[] = []

      for (let i = 0; i <= 5; i++) {
        const targetTime = firstTime + interval * i
        const targetDate = new Date(targetTime)
        labels.push(targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        const count = sorted.filter((p) => new Date(p.registeredAt || 0).getTime() <= targetTime).length
        points.push(count)
      }

      const maxVal = Math.max(...points, 5)
      return { labels, points, max: maxVal }
    }
  }, [personnel, trendFilter])

  // Convert timeline points to smooth SVG bezier path
  const svgPath = useMemo(() => {
    const xCoords = [20, 112, 204, 296, 388, 480]
    const { points, max } = chartData

    const coords = points.map((val, idx) => {
      const x = xCoords[idx]
      const y = 150 - Math.min(130, Math.max(10, (val / max) * 130))
      return { x, y }
    })

    // Smooth spline d string
    let d = `M ${coords[0].x},${coords[0].y}`
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i]
      const next = coords[i + 1]
      const cpX = (curr.x + next.x) / 2
      d += ` C ${cpX},${curr.y} ${cpX},${next.y} ${next.x},${next.y}`
    }

    const areaD = `${d} L ${coords[coords.length - 1].x},160 L ${coords[0].x},160 Z`
    const lastCoord = coords[coords.length - 1]

    return { strokePath: d, areaPath: areaD, coords, lastCoord }
  }, [chartData])

  const recentEntries = useMemo(() => {
    return personnel
      .filter((p) => p.status === 'ENTERED')
      .sort((a, b) => new Date(b.enteredAt || b.registeredAt).getTime() - new Date(a.enteredAt || a.registeredAt).getTime())
      .slice(0, 8)
  }, [personnel])

  const isDark = theme === 'dark'

  return (
    <div className={`p-4 sm:p-6 lg:p-8 font-sans max-w-[1600px] mx-auto space-y-6 ${
      isDark ? 'bg-[#000000] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* ── Page Header ── */}
      <div className={`flex items-center justify-between border-b pb-5 ${
        isDark ? 'border-zinc-800' : 'border-slate-200/80'
      }`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>System Reports & Analytics</h1>
          <p className={`text-xs sm:text-sm font-medium mt-0.5 ${
            isDark ? 'text-slate-300' : 'text-slate-500'
          }`}>
            Registration statistics, timeline trends, and clearance breakdown
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'bg-[#121215] border-zinc-800 text-slate-100 hover:bg-zinc-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* ── Public Registration Link Banner ── */}
      <RegistrationLinkBanner />

      {/* ── Top Metric Cards (5 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Registered */}
        <div className={`border rounded-2xl p-5 shadow-2xs transition ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800 text-white' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5 bg-emerald-50/80 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <TrendingUp size={12} />
              <span>↗</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {(stats?.totalRegistered ?? personnel.length).toLocaleString()}
            </div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              All time registrations
            </div>
          </div>
        </div>

        {/* 2. Approved */}
        <div className={`border rounded-2xl p-5 shadow-2xs transition ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800 text-white' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5 bg-emerald-50/80 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <TrendingUp size={12} />
              <span>↗</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {(stats?.approved ?? 0).toLocaleString()}
            </div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              {approvedPct}% of total
            </div>
          </div>
        </div>

        {/* 3. Entered */}
        <div className={`border rounded-2xl p-5 shadow-2xs transition ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800 text-white' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <LogIn size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5 bg-emerald-50/80 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <TrendingUp size={12} />
              <span>↗</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {(stats?.entered ?? 0).toLocaleString()}
            </div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              {enteredPct}% of total
            </div>
          </div>
        </div>

        {/* 4. Not Yet Entered */}
        <div className={`border rounded-2xl p-5 shadow-2xs transition ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800 text-white' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-amber-500 text-xs font-bold flex items-center gap-0.5 bg-amber-50/80 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              <span>↗</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {(stats?.notYetEntered ?? 0).toLocaleString()}
            </div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              {notEnteredPct}% of total
            </div>
          </div>
        </div>

        {/* 5. Rejected */}
        <div className={`border rounded-2xl p-5 shadow-2xs transition ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800 text-white' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="text-red-500 text-xs font-bold flex items-center gap-0.5 bg-red-50/80 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
              <span>↘</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {(stats?.rejected ?? 0).toLocaleString()}
            </div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              {rejectedPct}% of total
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Row Analytics: 2 Equal Spacious Columns (Recent Registrations container removed as requested) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Registrations Over Time (Functional Dynamic Chart) */}
        <div className={`border rounded-2xl p-6 shadow-2xs flex flex-col justify-between ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Registrations Over Time
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Timeline progression based on personnel registration dates
              </p>
            </div>
            <div className="relative">
              <select
                value={trendFilter}
                onChange={(e) => setTrendFilter(e.target.value as any)}
                className={`appearance-none border rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold cursor-pointer focus:outline-none transition ${
                  isDark ? 'bg-[#121215] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="This Month">This Month</option>
                <option value="This Week">This Week</option>
                <option value="All Time">All Time</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500" />
            </div>
          </div>

          {/* SVG Smooth Curve Area Chart */}
          <div className="w-full h-56 relative pt-4 pb-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="reportsChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="65" x2="500" y2="65" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="500" y2="110" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="160" x2="500" y2="160" stroke={isDark ? '#3F3F46' : '#E2E8F0'} strokeWidth="1" />

              {/* Area Gradient Fill */}
              <path d={svgPath.areaPath} fill="url(#reportsChartGrad)" />

              {/* Curve Line */}
              <path
                d={svgPath.strokePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Points Dots */}
              {svgPath.coords.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fill={isDark ? '#F4F4F5' : '#0F172A'}
                    fontSize="9"
                    fontWeight="800"
                  >
                    {chartData.points[idx]}
                  </text>
                </g>
              ))}
            </svg>

            {/* Dynamic X-Axis Date Labels */}
            <div className="flex justify-between text-[11px] font-extrabold text-slate-400 mt-3 px-1">
              {chartData.labels.map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Registrations by Arm of Service (Spacious Layout with Clean Unclipped Legend) */}
        <div className={`border rounded-2xl p-6 shadow-2xs flex flex-col justify-between ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200/90'
        }`}>
          <div>
            <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Registrations by Arm of Service
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Breakdown across military arms and civilian personnel
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 my-auto pt-4">
            {/* Donut Chart SVG */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="4" />
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.name}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="4.5"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                  />
                ))}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-extrabold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {(stats?.totalRegistered ?? personnel.length).toLocaleString()}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">TOTAL</span>
              </div>
            </div>

            {/* Spacious Legend List with No Clipping */}
            <div className="flex-1 space-y-3 w-full text-xs font-bold">
              {armBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                    <span className={`truncate text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.name}
                    </span>
                  </div>
                  <span className={`shrink-0 font-extrabold text-xs ml-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.count} ({item.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Recent Verified Entries Table (Full Width) ── */}
      <div className={`border rounded-2xl p-6 shadow-2xs flex flex-col justify-between ${
        isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200/90'
      }`}>
        <div className="mb-4">
          <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Recent Verified Entries
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time log of personnel verified and cleared for entry
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`text-[10px] uppercase font-extrabold tracking-wider border-y ${
              isDark ? 'bg-[#121215] text-slate-200 border-zinc-800' : 'bg-slate-50/80 text-slate-500 border-slate-100'
            }`}>
              <tr>
                <th className="py-3 px-4 font-bold">Full Name</th>
                <th className="py-3 px-4 font-bold">Service Number</th>
                <th className="py-3 px-4 font-bold">Arm of Service</th>
                <th className="py-3 px-4 font-bold">Rank</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Entry Time</th>
                <th className="py-3 px-4 font-bold">Verified By</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-zinc-800/80 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                    No personnel entries verified yet.
                  </td>
                </tr>
              ) : (
                recentEntries.map((entry) => (
                  <tr key={entry.id} className={isDark ? 'hover:bg-[#121215]' : 'hover:bg-slate-50/50'}>
                    <td className={`py-3.5 px-4 flex items-center gap-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <div className={`w-7 h-7 rounded-full border text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {entry.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[180px]">{entry.fullName}</span>
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry.serviceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold">{entry.armOfService || 'Army'}</td>
                    <td className={`py-3.5 px-4 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{entry.rank || 'Officer'}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700">
                        ENTERED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      {entry.enteredAt ? formatDate(entry.enteredAt) : 'Just now'}
                    </td>
                    <td className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>WO. Daniel K.</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
