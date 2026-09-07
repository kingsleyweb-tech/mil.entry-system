import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Building,
  Loader2,
  RefreshCw,
  Landmark,
  Anchor,
  Wind,
  Briefcase,
  Database,
} from 'lucide-react'
import { listPersonnel } from '../services/firebase'
import type { Personnel } from '../types/personnel'
import { StatusBadge } from '../components/StatusBadge'
import { RegistrationLinkBanner } from '../components/RegistrationLinkBanner'
import { formatDate } from '../utils/format'
import { useTheme } from '../context/ThemeContext'
import { getPersonnelYear } from '../utils/yearlyUtils'

type CategoryTab = 'Army' | 'Navy' | 'Air Force' | 'DCS' | 'Civilians'

const CATEGORY_TABS: Array<{
  id: CategoryTab
  label: string
  icon: any
  iconBgLight: string
  iconBgDark: string
  iconColor: string
  badgeBgActive: string
}> = [
  {
    id: 'Army',
    label: 'Army',
    icon: Building,
    iconBgLight: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
    iconBgDark: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBgActive: 'bg-emerald-600 text-white',
  },
  {
    id: 'Navy',
    label: 'Navy',
    icon: Anchor,
    iconBgLight: 'bg-blue-100/80 text-blue-700 border-blue-200',
    iconBgDark: 'bg-blue-950/80 text-blue-400 border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBgActive: 'bg-blue-600 text-white',
  },
  {
    id: 'Air Force',
    label: 'Air Force',
    icon: Wind,
    iconBgLight: 'bg-sky-100/80 text-sky-700 border-sky-200',
    iconBgDark: 'bg-sky-950/80 text-sky-400 border-sky-800',
    iconColor: 'text-sky-500 dark:text-sky-400',
    badgeBgActive: 'bg-sky-600 text-white',
  },
  {
    id: 'DCS',
    label: 'DCS',
    icon: Landmark,
    iconBgLight: 'bg-purple-100/80 text-purple-700 border-purple-200',
    iconBgDark: 'bg-purple-950/80 text-purple-400 border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeBgActive: 'bg-purple-600 text-white',
  },
  {
    id: 'Civilians',
    label: 'Civilians',
    icon: Briefcase,
    iconBgLight: 'bg-amber-100/80 text-amber-700 border-amber-200',
    iconBgDark: 'bg-amber-950/80 text-amber-400 border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBgActive: 'bg-amber-600 text-white',
  },
]

export function AdminRegistrationsPage() {
  const { theme } = useTheme()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [activeTab, setActiveTab] = useState<CategoryTab>('Army')
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)

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

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, new Date().getFullYear()])
    personnel.forEach((p) => yearsSet.add(getPersonnelYear(p)))
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [personnel])

  const yearFilteredPersonnel = useMemo(() => {
    if (selectedYear === 'ALL') return personnel
    return personnel.filter((p) => getPersonnelYear(p) === Number(selectedYear))
  }, [personnel, selectedYear])

  // Calculate counts per arm/civilian
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      Army: 0,
      Navy: 0,
      'Air Force': 0,
      DCS: 0,
      Civilians: 0,
    }

    yearFilteredPersonnel.forEach((p) => {
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
        counts.Army += 1
      }
    })

    return counts
  }, [yearFilteredPersonnel])

  // Filter personnel for active category & search string
  const filteredPersonnel = useMemo(() => {
    return yearFilteredPersonnel.filter((p) => {
      let categoryMatch = false
      if (activeTab === 'Civilians') {
        categoryMatch = p.exerciseStatus === 'Civilians' || p.armOfService === 'Civilians'
      } else if (activeTab === 'Army') {
        categoryMatch = p.armOfService === 'Army' || (!p.armOfService && p.exerciseStatus !== 'Civilians')
      } else {
        categoryMatch = p.armOfService === activeTab
      }

      if (!categoryMatch) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.serviceNumber.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q) ||
        p.rank.toLowerCase().includes(q) ||
        p.phone.includes(q)
      )
    })
  }, [yearFilteredPersonnel, activeTab, search])

  const isDark = theme === 'dark'

  return (
    <div className={`p-4 sm:p-6 lg:p-8 font-sans max-w-[1600px] mx-auto space-y-6 ${
      isDark ? 'bg-[#000000] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* ── Page Header ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
        isDark ? 'border-zinc-800' : 'border-slate-200/80'
      }`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>Personnel Registrations</h1>
          <p className={`text-xs sm:text-sm font-medium mt-0.5 ${
            isDark ? 'text-slate-300' : 'text-slate-500'
          }`}>
            Categorized view of registered personnel split by Arm of Service & Civilians
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
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Public Registration Link Banner ── */}
      <RegistrationLinkBanner />

      {/* ── Category Navigation Tabs (Split by Arm of Service & Civilians) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon
          const count = categoryCounts[tab.id]
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-[#121215] border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl'
                    : 'bg-white border-slate-900 ring-2 ring-slate-900/20 shadow-md'
                  : isDark
                  ? 'bg-[#0A0A0C] border-zinc-800 hover:bg-[#121215] text-slate-300'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-600 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                {/* Icon Container with Bright Vibrant Color */}
                <div className={`p-2.5 rounded-xl border ${
                  isDark ? tab.iconBgDark : tab.iconBgLight
                }`}>
                  <Icon size={20} className={tab.iconColor} />
                </div>

                {/* Count Badge */}
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  isActive
                    ? tab.badgeBgActive
                    : isDark
                    ? 'bg-zinc-800 text-slate-200 border-zinc-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {count}
                </span>
              </div>
              <div className="text-left">
                <div className={`text-sm font-extrabold ${
                  isActive ? (isDark ? 'text-emerald-400' : 'text-slate-900') : (isDark ? 'text-white' : 'text-slate-800')
                }`}>
                  {tab.label}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {tab.id === 'Civilians' ? 'Non-military Attendees' : 'Service Personnel'}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Personnel Table Card for Active Category ── */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#0A0A0C] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200/90 shadow-2xs'
      }`}>
        {/* Search Header */}
        <div className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'border-zinc-800 bg-[#000000]' : 'border-slate-200/80 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-black uppercase tracking-wider ${
              isDark ? 'text-emerald-400' : 'text-slate-900'
            }`}>
              {activeTab} RECORDS ({filteredPersonnel.length})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* Year Selector Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className={`w-full sm:w-auto border text-xs font-bold rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none transition ${
                isDark
                  ? 'bg-[#121215] border-zinc-700 text-emerald-400 focus:border-emerald-500'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-slate-400'
              }`}
            >
              <option value="ALL">📅 All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>

            <label className="relative block w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeTab} records...`}
                className={`w-full border text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none transition ${
                  isDark
                    ? 'bg-[#121215] border-zinc-700 text-white placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                }`}
              />
            </label>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-slate-300 text-xs font-medium">
            <Loader2 className="animate-spin text-emerald-500" size={20} />
            Loading {activeTab} personnel...
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Database size={40} className="mb-2 text-slate-500" />
            <p className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              No personnel found under {activeTab}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              {search.trim() ? 'No matches for your search term.' : `No registered records found under ${activeTab}.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`text-[10px] uppercase font-extrabold tracking-wider border-b ${
                isDark ? 'bg-[#121215] text-slate-300 border-zinc-800' : 'bg-slate-50/80 text-slate-500 border-slate-200/80'
              }`}>
                <tr>
                  <th className="py-3.5 px-6 font-bold">Name</th>
                  <th className="py-3.5 px-6 font-bold">Service No.</th>
                  <th className="py-3.5 px-6 font-bold">Year</th>
                  <th className="py-3.5 px-6 font-bold">Exercise Status</th>
                  <th className="py-3.5 px-6 font-bold">Rank / Designation</th>
                  <th className="py-3.5 px-6 font-bold">Unit / Dept</th>
                  <th className="py-3.5 px-6 font-bold">Phone</th>
                  <th className="py-3.5 px-6 font-bold">Entry Clearance</th>
                  <th className="py-3.5 px-6 font-bold">Registered</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-zinc-800/90 bg-[#0A0A0C]' : 'divide-slate-100 bg-white'
              }`}>
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className={isDark ? 'hover:bg-[#121215]' : 'hover:bg-slate-50/50'}>
                    <td className={`py-3.5 px-6 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {person.fullName}
                    </td>
                    <td className={`py-3.5 px-6 font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {person.serviceNumber}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-extrabold text-emerald-500">
                      {getPersonnelYear(person)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        person.exerciseStatus === 'Civilians'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                      }`}>
                        {person.exerciseStatus}
                      </span>
                    </td>
                    <td className={`py-3.5 px-6 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {person.rank || '—'}
                    </td>
                    <td className={`py-3.5 px-6 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {person.unit}
                    </td>
                    <td className={`py-3.5 px-6 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {person.phone}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={person.status} />
                    </td>
                    <td className={`py-3.5 px-6 font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                      {formatDate(person.registeredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`p-3.5 text-right text-xs font-bold border-t ${
          isDark ? 'border-zinc-800 bg-[#000000] text-slate-400' : 'border-slate-200/80 bg-slate-50/50 text-slate-500'
        }`}>
          {filteredPersonnel.length} {activeTab} record{filteredPersonnel.length !== 1 ? 's' : ''} shown
        </div>
      </div>
    </div>
  )
}
