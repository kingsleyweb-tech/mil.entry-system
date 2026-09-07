import { useState, useEffect, useMemo } from 'react'
import {
  FolderOpen,
  Folder,
  Users,
  ArrowLeft,
  RefreshCw,
  Search,
  Download,
  Building,
  Anchor,
  Wind,
  Landmark,
  Briefcase,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { listPersonnel } from '../services/firebase'
import type { Personnel } from '../types/personnel'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils/format'
import { useTheme } from '../context/ThemeContext'
import { groupPersonnelByYear, exportPersonnelCSV } from '../utils/yearlyUtils'

type ArmFilter = 'All' | 'Army' | 'Navy' | 'Air Force' | 'DCS' | 'Civilians'

const ARM_TABS: { id: ArmFilter; icon: any; color: string; bg: string; darkBg: string }[] = [
  { id: 'All', icon: Users, color: 'text-slate-500', bg: 'bg-slate-100', darkBg: 'bg-slate-800' },
  { id: 'Army', icon: Building, color: 'text-emerald-600', bg: 'bg-emerald-100', darkBg: 'bg-emerald-950/60' },
  { id: 'Navy', icon: Anchor, color: 'text-blue-600', bg: 'bg-blue-100', darkBg: 'bg-blue-950/60' },
  { id: 'Air Force', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-100', darkBg: 'bg-sky-950/60' },
  { id: 'DCS', icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-100', darkBg: 'bg-purple-950/60' },
  { id: 'Civilians', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-100', darkBg: 'bg-amber-950/60' },
]

// Colour palette cycles for any year dynamically
const PALETTE = [
  { from: 'from-emerald-700', to: 'to-emerald-900', border: 'border-emerald-500', text: 'text-emerald-200' },
  { from: 'from-blue-700', to: 'to-blue-900', border: 'border-blue-500', text: 'text-blue-200' },
  { from: 'from-purple-700', to: 'to-purple-900', border: 'border-purple-500', text: 'text-purple-200' },
  { from: 'from-rose-700', to: 'to-rose-900', border: 'border-rose-500', text: 'text-rose-200' },
  { from: 'from-amber-700', to: 'to-amber-900', border: 'border-amber-500', text: 'text-amber-200' },
  { from: 'from-sky-700', to: 'to-sky-900', border: 'border-sky-500', text: 'text-sky-200' },
  { from: 'from-indigo-700', to: 'to-indigo-900', border: 'border-indigo-500', text: 'text-indigo-200' },
  { from: 'from-teal-700', to: 'to-teal-900', border: 'border-teal-500', text: 'text-teal-200' },
  { from: 'from-orange-700', to: 'to-orange-900', border: 'border-orange-500', text: 'text-orange-200' },
  { from: 'from-cyan-700', to: 'to-cyan-900', border: 'border-cyan-500', text: 'text-cyan-200' },
]

function getYearColors(year: number) {
  // Use year modulo palette length so any future year gets a colour automatically
  return PALETTE[year % PALETTE.length]
}

function getArmLabel(p: Personnel): 'Army' | 'Navy' | 'Air Force' | 'DCS' | 'Civilians' {
  if (p.exerciseStatus === 'Civilians' || p.armOfService === 'Civilians') return 'Civilians'
  if (p.armOfService === 'Navy') return 'Navy'
  if (p.armOfService === 'Air Force') return 'Air Force'
  if (p.armOfService === 'DCS') return 'DCS'
  return 'Army'
}

function folderStats(list: Personnel[]) {
  const counts = { Army: 0, Navy: 0, 'Air Force': 0, DCS: 0, Civilians: 0 }
  list.forEach((p) => {
    counts[getArmLabel(p)] += 1
  })
  return counts
}

export function YearlyArchivesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [armFilter, setArmFilter] = useState<ArmFilter>('All')
  const [search, setSearch] = useState('')

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

  // Group all personnel by year — ALWAYS runs (no conditional before hooks)
  const byYear = useMemo(() => groupPersonnelByYear(personnel), [personnel])

  // Sorted list of unique years (desc)
  const years = useMemo(
    () =>
      Object.keys(byYear)
        .map(Number)
        .sort((a, b) => b - a),
    [byYear]
  )

  // Personnel in the selected year
  const yearPersonnel = useMemo(
    () => (selectedYear !== null ? byYear[selectedYear] || [] : []),
    [byYear, selectedYear]
  )

  // Per-arm counts for the detail view
  const armCounts = useMemo(() => folderStats(yearPersonnel), [yearPersonnel])

  // Filtered personnel after arm + search filters
  const filteredPersonnel = useMemo(() => {
    return yearPersonnel.filter((p) => {
      if (armFilter !== 'All' && getArmLabel(p) !== armFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.fullName?.toLowerCase().includes(q) ||
        p.serviceNumber?.toLowerCase().includes(q) ||
        p.rank?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      )
    })
  }, [yearPersonnel, armFilter, search])

  // ─────────────────────────────────────────────────
  // ── FOLDER GRID VIEW (no selected year) ──
  // ─────────────────────────────────────────────────
  if (selectedYear === null) {
    return (
      <div
        className={`p-4 sm:p-6 lg:p-8 font-sans max-w-[1400px] mx-auto space-y-6 ${
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
              <Calendar size={28} className="text-emerald-500" />
              Yearly Archives
            </h1>
            <p className={`text-xs sm:text-sm font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Personnel registrations organised by exercise year — click a folder to view its records
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
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-600'} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Summary Strip */}
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl border ${
                isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                <Users size={18} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-500">{personnel.length.toLocaleString()}</div>
                <div className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total personnel across {years.length} year{years.length !== 1 ? 's' : ''} — new years appear automatically as registrations come in
                </div>
              </div>
            </div>

            {/* Year Folder Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {years.map((year) => {
                const list = byYear[year] || []
                const stats = folderStats(list)
                const colors = getYearColors(year)
                const isCurrentYear = year === new Date().getFullYear()

                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year)
                      setArmFilter('All')
                      setSearch('')
                    }}
                    className={`relative group text-left p-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-2xl focus:outline-none ${colors.border}`}
                  >
                    {/* Folder colour band */}
                    <div className={`bg-gradient-to-br ${colors.from} ${colors.to} p-5`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FolderOpen size={24} className="text-white/80" />
                            {isCurrentYear && (
                              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-3xl font-black tracking-tight text-white">{year}</div>
                          <div className={`text-xs font-semibold mt-0.5 ${colors.text}`}>Exercise Year</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-white">{list.length.toLocaleString()}</div>
                          <div className={`text-[11px] font-semibold ${colors.text}`}>Personnel</div>
                        </div>
                      </div>
                    </div>

                    {/* Folder body */}
                    <div className={`p-4 space-y-1.5 ${isDark ? 'bg-[#0A0A0C]' : 'bg-white'}`}>
                      {[
                        { label: 'Army', count: stats.Army, color: 'bg-emerald-500' },
                        { label: 'Navy', count: stats.Navy, color: 'bg-blue-500' },
                        { label: 'Air Force', count: stats['Air Force'], color: 'bg-sky-500' },
                        { label: 'DCS', count: stats.DCS, color: 'bg-purple-500' },
                        { label: 'Civilians', count: stats.Civilians, color: 'bg-amber-500' },
                      ]
                        .filter((s) => s.count > 0)
                        .map((s) => (
                          <div key={s.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${s.color}`} />
                              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {s.label}
                              </span>
                            </div>
                            <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              {s.count}
                            </span>
                          </div>
                        ))}

                      {list.length === 0 && (
                        <p className={`text-[11px] italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          No personnel registered yet
                        </p>
                      )}

                      <div
                        className={`pt-2 flex items-center gap-1 text-[11px] font-bold transition-colors ${
                          isDark
                            ? 'text-slate-500 group-hover:text-emerald-400'
                            : 'text-slate-400 group-hover:text-emerald-600'
                        }`}
                      >
                        Open Folder <ChevronRight size={12} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────
  // ── YEAR DETAIL VIEW (folder opened) ──
  // ─────────────────────────────────────────────────
  const colors = getYearColors(selectedYear)

  return (
    <div
      className={`p-4 sm:p-6 lg:p-8 font-sans max-w-[1600px] mx-auto space-y-6 ${
        isDark ? 'bg-[#000000] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Back Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
          isDark ? 'border-zinc-800' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedYear(null)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'bg-[#121215] border-zinc-800 text-slate-300 hover:bg-zinc-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen size={22} className="text-emerald-500" />
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {selectedYear} Archive
              </h1>
            </div>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {yearPersonnel.length} personnel registered in {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportPersonnelCSV(filteredPersonnel, `personnel_archive_${selectedYear}`)}
            disabled={filteredPersonnel.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-40 ${
              isDark
                ? 'bg-emerald-700 border-emerald-600 text-white hover:bg-emerald-600'
                : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
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
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-600'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Year banner */}
      <div className={`rounded-2xl overflow-hidden border-2 ${colors.border}`}>
        <div className={`bg-gradient-to-r ${colors.from} ${colors.to} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Folder size={28} className="text-white/80" />
            <div>
              <div className="text-2xl font-black text-white">{selectedYear} Personnel Folder</div>
              <div className={`text-xs font-semibold ${colors.text}`}>Exercise Year Archive</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white">{yearPersonnel.length}</div>
            <div className={`text-xs font-semibold ${colors.text}`}>Total Registered</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ARM_TABS.filter((t) => t.id !== 'All').map((tab) => {
          const Icon = tab.icon
          const count = armCounts[tab.id as keyof typeof armCounts] || 0
          return (
            <div
              key={tab.id}
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className={`p-2 rounded-lg ${isDark ? tab.darkBg : tab.bg}`}>
                <Icon size={14} className={tab.color} />
              </div>
              <div>
                <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</div>
                <div className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {tab.id}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Arm Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {ARM_TABS.map((tab) => {
          const Icon = tab.icon
          const count = tab.id === 'All' ? yearPersonnel.length : (armCounts[tab.id as keyof typeof armCounts] || 0)
          const isActive = armFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setArmFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-900 text-white'
                  : isDark
                  ? 'bg-[#0A0A0C] border-zinc-800 text-slate-400 hover:bg-zinc-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={12} className={isActive ? 'text-white' : tab.color} />
              {tab.id} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${
        isDark ? 'bg-[#0A0A0C] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <Search size={15} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, service no., rank, unit, or phone..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
        />
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-zinc-800' : 'border-slate-200 shadow-xs'}`}>
        <div className={`overflow-x-auto ${isDark ? 'bg-[#0A0A0C]' : 'bg-white'}`}>
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'bg-[#121215] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Service No.</th>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Arm / Category</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-10 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {search || armFilter !== 'All'
                      ? 'No matching personnel found.'
                      : `No personnel registered in ${selectedYear} yet.`}
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((p, idx) => (
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
                      {getArmLabel(p)}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredPersonnel.length > 0 && (
          <div className={`px-4 py-2.5 border-t text-xs font-medium ${isDark ? 'border-zinc-800 text-slate-500 bg-[#0A0A0C]' : 'border-slate-100 text-slate-400 bg-slate-50'}`}>
            Showing {filteredPersonnel.length} of {yearPersonnel.length} personnel in {selectedYear}
          </div>
        )}
      </div>
    </div>
  )
}
