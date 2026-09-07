import { useState, useEffect, useMemo } from 'react'
import {
  RefreshCw,
  Search,
  Download,
  GitCompare,
  UserPlus,
  UserMinus,
  Users,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { listPersonnel } from '../services/firebase'
import type { Personnel } from '../types/personnel'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils/format'
import { useTheme } from '../context/ThemeContext'
import {
  groupPersonnelByYear,
  compareYears,
  exportPersonnelCSV,
  type YearComparisonResult,
} from '../utils/yearlyUtils'

type ResultTab = 'new' | 'missing' | 'both'

const RESULT_TABS: { id: ResultTab; label: string; icon: any; desc: string; colorDark: string; colorLight: string }[] = [
  {
    id: 'new',
    label: 'New Registrants',
    icon: UserPlus,
    desc: 'Registered in comparison year but NOT in base year',
    colorDark: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
    colorLight: 'text-emerald-700 border-emerald-400 bg-emerald-50',
  },
  {
    id: 'missing',
    label: 'Missing Registrants',
    icon: UserMinus,
    desc: 'Registered in base year but did NOT re-register in comparison year',
    colorDark: 'text-rose-400 border-rose-500 bg-rose-500/10',
    colorLight: 'text-rose-700 border-rose-400 bg-rose-50',
  },
  {
    id: 'both',
    label: 'Returning Personnel',
    icon: CheckCircle,
    desc: 'Registered in BOTH base year and comparison year',
    colorDark: 'text-blue-400 border-blue-500 bg-blue-500/10',
    colorLight: 'text-blue-700 border-blue-400 bg-blue-50',
  },
]

export function YearlyComparisonPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<ResultTab>('missing')
  const [hasRun, setHasRun] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await listPersonnel('', 'ALL')
      setPersonnel(res.personnel)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentYear = new Date().getFullYear()

  // All available years
  const byYear = useMemo(() => groupPersonnelByYear(personnel), [personnel])
  const availableYears = useMemo(
    () =>
      Object.keys(byYear)
        .map(Number)
        .sort((a, b) => a - b),
    [byYear]
  )

  // Selected years for comparison
  const [baseYear, setBaseYear] = useState<number>(currentYear - 1)
  const [targetYear, setTargetYear] = useState<number>(currentYear)

  // When data loads, set sane defaults
  useEffect(() => {
    if (availableYears.length >= 2) {
      setBaseYear(availableYears[availableYears.length - 2])
      setTargetYear(availableYears[availableYears.length - 1])
      setHasRun(true)
    } else if (availableYears.length === 1) {
      setBaseYear(availableYears[0])
      setTargetYear(availableYears[0])
      setHasRun(true)
    }
  }, [availableYears.join(',')])

  const result: YearComparisonResult | null = useMemo(() => {
    if (!hasRun || personnel.length === 0) return null
    return compareYears(personnel, baseYear, targetYear)
  }, [personnel, baseYear, targetYear, hasRun])

  const activeList = useMemo(() => {
    if (!result) return []
    const raw =
      activeTab === 'new'
        ? result.registeredInTargetOnly
        : activeTab === 'missing'
        ? result.registeredInBaseOnly
        : result.registeredInBoth
    if (!search.trim()) return raw
    const q = search.toLowerCase()
    return raw.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(q) ||
        p.serviceNumber?.toLowerCase().includes(q) ||
        p.rank?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    )
  }, [result, activeTab, search])

  const handleRunComparison = () => {
    setHasRun(true)
    setSearch('')
  }

  const getTabFilename = () => {
    if (activeTab === 'new') return `new_in_${targetYear}_not_in_${baseYear}`
    if (activeTab === 'missing') return `in_${baseYear}_not_in_${targetYear}`
    return `in_both_${baseYear}_and_${targetYear}`
  }

  // Arm breakdown within active list
  const armBreakdown = useMemo(() => {
    const c = { Army: 0, Navy: 0, 'Air Force': 0, DCS: 0, Civilians: 0 }
    activeList.forEach((p) => {
      const arm =
        p.exerciseStatus === 'Civilians' || p.armOfService === 'Civilians'
          ? 'Civilians'
          : (p.armOfService as keyof typeof c) || 'Army'
      if (arm in c) c[arm as keyof typeof c] += 1
      else c.Army += 1
    })
    return c
  }, [activeList])

  return (
    <div
      className={`p-4 sm:p-6 lg:p-8 font-sans max-w-[1600px] mx-auto space-y-6 ${
        isDark ? 'bg-[#000000] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
          isDark ? 'border-zinc-800' : 'border-slate-200/80'
        }`}
      >
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <GitCompare size={28} className="text-purple-500" />
            Yearly Cross-Check
          </h1>
          <p className={`text-xs sm:text-sm font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Automatically detect who registered in one year but not another
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
          <RefreshCw size={14} className={loading ? 'animate-spin text-purple-500' : 'text-purple-500'} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Year Selector Controls */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Base Year
            </label>
            <div className="relative">
              <select
                value={baseYear}
                onChange={(e) => setBaseYear(Number(e.target.value))}
                className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl border text-sm font-bold cursor-pointer transition ${
                  isDark
                    ? 'bg-[#121215] border-zinc-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {byYear[baseYear]?.length ?? 0} personnel registered
            </p>
          </div>

          <div className={`flex items-center justify-center pb-6 text-xs font-black tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            VS
          </div>

          <div className="flex-1">
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Comparison Year
            </label>
            <div className="relative">
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl border text-sm font-bold cursor-pointer transition ${
                  isDark
                    ? 'bg-[#121215] border-zinc-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {byYear[targetYear]?.length ?? 0} personnel registered
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunComparison}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <GitCompare size={16} />
            Run Cross-Check
          </button>
        </div>

        {baseYear === targetYear && (
          <div className={`mt-3 flex items-center gap-2 text-xs font-semibold p-3 rounded-xl ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <AlertTriangle size={14} />
            Base year and comparison year are the same. Select two different years for a meaningful cross-check.
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={28} className="animate-spin text-purple-500" />
        </div>
      )}

      {!loading && result && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                id: 'new' as ResultTab,
                count: result.registeredInTargetOnly.length,
                icon: UserPlus,
                title: `New in ${targetYear}`,
                sub: `Not in ${baseYear}`,
                bg: isDark ? 'from-emerald-950/60 to-emerald-900/40' : 'from-emerald-50 to-white',
                border: isDark ? 'border-emerald-800' : 'border-emerald-200',
                icon_color: 'text-emerald-500',
                badge: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
              },
              {
                id: 'missing' as ResultTab,
                count: result.registeredInBaseOnly.length,
                icon: UserMinus,
                title: `Missing in ${targetYear}`,
                sub: `Were in ${baseYear}, not in ${targetYear}`,
                bg: isDark ? 'from-rose-950/60 to-rose-900/40' : 'from-rose-50 to-white',
                border: isDark ? 'border-rose-800' : 'border-rose-200',
                icon_color: 'text-rose-500',
                badge: isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-700',
              },
              {
                id: 'both' as ResultTab,
                count: result.registeredInBoth.length,
                icon: Users,
                title: 'Returning Personnel',
                sub: `Registered in both ${baseYear} & ${targetYear}`,
                bg: isDark ? 'from-blue-950/60 to-blue-900/40' : 'from-blue-50 to-white',
                border: isDark ? 'border-blue-800' : 'border-blue-200',
                icon_color: 'text-blue-500',
                badge: isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-700',
              },
            ].map((card) => {
              const Icon = card.icon
              const isActive = activeTab === card.id
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => { setActiveTab(card.id); setSearch('') }}
                  className={`relative text-left p-5 rounded-2xl border-2 bg-gradient-to-br transition-all duration-150 cursor-pointer ${card.bg} ${card.border} ${
                    isActive ? 'ring-2 ring-offset-0 ' + card.border : 'hover:scale-[1.01]'
                  } ${isActive && isDark ? 'ring-offset-black' : isActive ? 'ring-offset-slate-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {card.count.toLocaleString()}
                      </div>
                      <div className={`text-sm font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {card.title}
                      </div>
                      <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {card.sub}
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${card.badge}`}>
                      <Icon size={20} className={card.icon_color} />
                    </div>
                  </div>
                  {isActive && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${card.icon_color.replace('text-', 'bg-')}`} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Tab Info Banner */}
          {(() => {
            const tab = RESULT_TABS.find((t) => t.id === activeTab)!
            const Icon = tab.icon
            return (
              <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${isDark ? tab.colorDark : tab.colorLight}`}>
                <Icon size={16} className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">{tab.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{tab.desc.replace('base year', `${baseYear}`).replace('comparison year', `${targetYear}`)}</div>
                </div>
              </div>
            )
          })()}

          {/* Arm breakdown row */}
          <div className={`grid grid-cols-5 gap-2`}>
            {[
              { label: 'Army', count: armBreakdown.Army, color: 'text-emerald-500', dot: 'bg-emerald-500' },
              { label: 'Navy', count: armBreakdown.Navy, color: 'text-blue-500', dot: 'bg-blue-500' },
              { label: 'Air Force', count: armBreakdown['Air Force'], color: 'text-sky-500', dot: 'bg-sky-500' },
              { label: 'DCS', count: armBreakdown.DCS, color: 'text-purple-500', dot: 'bg-purple-500' },
              { label: 'Civilians', count: armBreakdown.Civilians, color: 'text-amber-500', dot: 'bg-amber-500' },
            ].map((a) => (
              <div key={a.label} className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                <div className={`w-2 h-2 rounded-full ${a.dot} mx-auto mb-1`} />
                <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{a.count}</div>
                <div className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{a.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Export */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${
              isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <Search size={15} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, service no., rank, unit..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={() => exportPersonnelCSV(activeList, getTabFilename())}
              disabled={activeList.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-40 shadow-sm"
            >
              <Download size={14} />
              Export CSV ({activeList.length})
            </button>
          </div>

          {/* Results Table */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-zinc-800' : 'border-slate-200 shadow-xs'}`}>
            <div className={`overflow-x-auto ${isDark ? 'bg-[#0A0A0C]' : 'bg-white'}`}>
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'bg-[#121215] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Service / ID No.</th>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Arm / Category</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Registered</th>
                    <th className="px-4 py-3 text-left">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className={`px-4 py-12 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        {search
                          ? 'No matching personnel found.'
                          : `No personnel in this category for the selected year comparison.`}
                      </td>
                    </tr>
                  ) : (
                    activeList.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-t transition-colors ${
                          isDark ? 'border-zinc-800/60 hover:bg-zinc-900/50' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <td className={`px-4 py-3 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {idx + 1}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {p.fullName}
                        </td>
                        <td className={`px-4 py-3 font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {p.serviceNumber || p.idCardNumber || '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {p.rank || '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {p.exerciseStatus === 'Civilians' || p.armOfService === 'Civilians'
                            ? 'Civilians'
                            : p.armOfService || 'Army'}
                        </td>
                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {p.unit || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(p.registeredAt)}
                        </td>
                        <td>
                          <span className={`mx-4 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {new Date(p.registeredAt || Date.now()).getFullYear()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {activeList.length > 0 && (
              <div className={`px-4 py-2.5 border-t text-xs font-medium ${isDark ? 'border-zinc-800 text-slate-500 bg-[#0A0A0C]' : 'border-slate-100 text-slate-400 bg-slate-50'}`}>
                Showing {activeList.length} personnel
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !result && (
        <div className={`flex flex-col items-center justify-center py-20 gap-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          <GitCompare size={48} className="opacity-30" />
          <p className="text-sm font-semibold">Select two years and click "Run Cross-Check" to begin</p>
        </div>
      )}
    </div>
  )
}
