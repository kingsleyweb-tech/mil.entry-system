import { useState, useEffect, useMemo } from 'react'
import {
  Loader2,
  Search,
  RefreshCw,
  ArrowUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Pencil,
  Download,
  Upload,
  Database,
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { EditPersonnelModal } from '../components/EditPersonnelModal'
import { ImportModal } from '../components/ImportModal'
import { listPersonnel, bulkCheckInPersonnel, deletePersonnel, exportAllPersonnel } from '../services/firebase'
import type { Personnel, PersonnelStatus } from '../types/personnel'
import { formatDate } from '../utils/format'
import { useTheme } from '../context/ThemeContext'
import { getPersonnelYear } from '../utils/yearlyUtils'

const filters: Array<PersonnelStatus | 'ALL'> = ['ALL', 'REGISTERED', 'APPROVED', 'ENTERED', 'REJECTED']

export function DashboardPage() {
  const { theme } = useTheme()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PersonnelStatus | 'ALL'>('ALL')
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Bulk modal state
  type BulkModalState =
    | { type: 'confirm-selected'; count: number }
    | { type: 'confirm-all'; count: number }
    | { type: 'result'; success: boolean; message: string }
    | null
  const [bulkModal, setBulkModal] = useState<BulkModalState>(null)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ person: Personnel } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edit modal state
  const [editModal, setEditModal] = useState<{ person: Personnel } | null>(null)

  // Save toast
  const [saveToast, setSaveToast] = useState(false)

  // Export state
  const [exporting, setExporting] = useState(false)

  // Import modal state
  const [showImport, setShowImport] = useState(false)

  const handleBulkConfirmSelected = () => {
    if (selectedIds.length === 0 || bulkProcessing) return
    setBulkModal({ type: 'confirm-selected', count: selectedIds.length })
  }

  const handleConfirmAllListed = () => {
    const eligible = personnel.filter((p) => p.status !== 'REJECTED' && p.status !== 'ENTERED')
    if (eligible.length === 0) {
      setBulkModal({ type: 'result', success: false, message: 'No eligible personnel found to check in.' })
      return
    }
    setBulkModal({ type: 'confirm-all', count: eligible.length })
  }

  const executeBulkSelected = async () => {
    setBulkModal(null)
    setBulkProcessing(true)
    try {
      const selectedPersonnel = personnel.filter((p) => selectedIds.includes(p.id))
      await bulkCheckInPersonnel(selectedPersonnel)
      setSelectedIds([])
      await load()
      setBulkModal({
        type: 'result',
        success: true,
        message: `Entry successfully confirmed for ${selectedPersonnel.length} selected personnel.`,
      })
    } catch (err) {
      console.error(err)
      setBulkModal({
        type: 'result',
        success: false,
        message: 'Error confirming entry: ' + (err instanceof Error ? err.message : String(err)),
      })
    } finally {
      setBulkProcessing(false)
    }
  }

  const executeBulkAll = async () => {
    setBulkModal(null)
    setBulkProcessing(true)
    try {
      const eligible = personnel.filter((p) => p.status !== 'REJECTED' && p.status !== 'ENTERED')
      await bulkCheckInPersonnel(eligible)
      setSelectedIds([])
      await load()
      setBulkModal({
        type: 'result',
        success: true,
        message: `Entry successfully confirmed for all ${eligible.length} personnel.`,
      })
    } catch (err) {
      console.error(err)
      setBulkModal({
        type: 'result',
        success: false,
        message: 'Error confirming entry: ' + (err instanceof Error ? err.message : String(err)),
      })
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleDeletePersonnel = async () => {
    if (!deleteModal || deleting) return
    setDeleting(true)
    try {
      await deletePersonnel(deleteModal.person.id)
      setDeleteModal(null)
      setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.person.id))
      await load()
    } catch (err) {
      console.error(err)
      alert('Failed to delete: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDeleting(false)
    }
  }

  const handlePersonnelSaved = (updated: Personnel) => {
    setPersonnel((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setEditModal(null)
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 3500)
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const exportFile = await exportAllPersonnel()
      const json = JSON.stringify(exportFile, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `personnel-firestore-backup-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setExporting(false)
    }
  }

  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const load = useMemo(
    () => async () => {
      setLoading(true)
      setError('')
      try {
        const peopleResponse = await listPersonnel(search, status)
        setPersonnel(peopleResponse.personnel)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.')
      } finally {
        setLoading(false)
      }
    },
    [search, status],
  )

  useEffect(() => {
    const timer = window.setTimeout(load, 300)
    return () => window.clearTimeout(timer)
  }, [load])

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, new Date().getFullYear()])
    personnel.forEach((p) => yearsSet.add(getPersonnelYear(p)))
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [personnel])

  const filteredPersonnel = useMemo(() => {
    if (selectedYear === 'ALL') return personnel
    return personnel.filter((p) => getPersonnelYear(p) === Number(selectedYear))
  }, [personnel, selectedYear])

  const isDark = theme === 'dark'

  return (
    <div className={`p-4 sm:p-6 lg:p-8 font-sans max-w-[1600px] mx-auto space-y-6 ${
      isDark ? 'bg-[#000000] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>

      {/* ── Save Success Toast ── */}
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          left: '50%',
          transform: saveToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-80px)',
          opacity: saveToast ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#052e16',
          border: '1px solid #16a34a',
          borderRadius: '14px',
          padding: '12px 22px',
          boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
          color: '#4ade80',
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 600,
          fontSize: '0.95rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
        Personnel record saved successfully
      </div>
      {/* ── Page Header ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
        isDark ? 'border-zinc-800' : 'border-slate-200/80'
      }`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>Personnel Details</h1>
          <p className={`text-xs sm:text-sm font-medium mt-0.5 ${
            isDark ? 'text-slate-300' : 'text-slate-500'
          }`}>
            View, search, edit, export, and manage all personnel records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'bg-[#121215] border-zinc-800 text-slate-100 hover:bg-zinc-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
            title="Refresh personnel records"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'bg-[#121215] border-zinc-800 text-slate-100 hover:bg-zinc-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            {exporting ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Download size={14} className="text-orange-500" />}
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImport(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'bg-[#121215] border-zinc-800 text-slate-100 hover:bg-zinc-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Upload size={14} className="text-blue-500" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* ── Main Personnel Details Table ── */}
      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isDark
          ? 'bg-[#0A0A0C] border-zinc-800 shadow-2xl'
          : 'bg-white border-slate-200/90 shadow-2xs'
      }`}>
        {/* Table Filters & Search Bar */}
        <div className={`flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between ${
          isDark ? 'border-zinc-800 bg-[#000000]' : 'border-slate-200/80 bg-slate-50/50'
        }`}>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            <label className="relative block sm:w-80 w-full">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                size={16}
                aria-hidden="true"
              />
              <input
                className={`w-full border text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition ${
                  isDark
                    ? 'bg-[#121215] border-zinc-700 text-white placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                }`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, service number..."
              />
            </label>

            {personnel.length > 0 && personnel.some((p) => p.status !== 'REJECTED' && p.status !== 'ENTERED') && (
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={handleConfirmAllListed}
                className="border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition duration-150 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shrink-0 disabled:opacity-50 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700"
              >
                Confirm Entry for All Listed
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Year Selector Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className={`transition duration-150 border px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer ${
                isDark
                  ? 'bg-[#121215] border-zinc-800 text-emerald-400 focus:border-emerald-500'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-slate-400 shadow-2xs'
              }`}
            >
              <option value="ALL">📅 All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Exercise Year {yr}
                </option>
              ))}
            </select>

            {filters.map((filter) => (
              <button
                key={filter}
                className={`transition duration-150 border px-3.5 py-1.5 text-xs font-bold rounded-full cursor-pointer shrink-0 ${
                  status === filter
                    ? isDark
                      ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-sm'
                      : 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                    : isDark
                    ? 'bg-[#121215] border-zinc-800 text-slate-300 hover:text-white hover:border-zinc-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-950'
                }`}
                type="button"
                onClick={() => setStatus(filter)}
              >
                {filter === 'ALL' ? 'All Statuses' : filter === 'REGISTERED' ? 'Yet to Confirm Entry' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Bulk Banner */}
        {selectedIds.length > 0 && (
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4 animate-fade-in ${
            isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {selectedIds.length} personnel selected
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={handleBulkConfirmSelected}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition shadow-2xs disabled:opacity-50"
              >
                Confirm Entry for Selected ({selectedIds.length})
              </button>
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => setSelectedIds([])}
                className={`text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition border ${
                  isDark
                    ? 'bg-[#121215] border-zinc-700 text-slate-200 hover:bg-zinc-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {error ? <div className="p-6 text-sm font-semibold text-red-500 bg-red-950/40 border-b border-red-900">{error}</div> : null}

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-slate-300 font-medium text-xs">
            <Loader2 className="animate-spin text-emerald-500" size={20} aria-hidden="true" />
            Synchronizing personnel records…
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Database size={40} className="mb-3 text-slate-500" aria-hidden="true" />
            <p className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {search.trim() ? `No matching records found for "${search}"` : 'No personnel records found for selected filters.'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 max-w-sm leading-normal">
              {search.trim()
                ? 'Check spelling, check code format, or search for another term.'
                : 'Share the registration link or switch year filter to view personnel.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`text-[10px] uppercase font-extrabold tracking-wider border-b ${
                isDark
                  ? 'bg-[#121215] text-slate-200 border-zinc-800'
                  : 'bg-slate-50/80 text-slate-500 border-slate-200/80'
              }`}>
                <tr>
                  <th className="px-4 py-3.5 font-bold w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                      disabled={!filteredPersonnel.some((p) => p.status !== 'ENTERED' && p.status !== 'REJECTED')}
                      checked={
                        filteredPersonnel.length > 0 &&
                        filteredPersonnel
                          .filter((p) => p.status !== 'ENTERED' && p.status !== 'REJECTED')
                          .every((p) => selectedIds.includes(p.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const eligibleIds = filteredPersonnel
                            .filter((p) => p.status !== 'ENTERED' && p.status !== 'REJECTED')
                            .map((p) => p.id)
                          setSelectedIds(eligibleIds)
                        } else {
                          setSelectedIds([])
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3.5 font-bold">Name</th>
                  <th className="px-6 py-3.5 font-bold">Service No.</th>
                  <th className="px-6 py-3.5 font-bold">Year</th>
                  <th className="px-6 py-3.5 font-bold">Exercise Status</th>
                  <th className="px-6 py-3.5 font-bold">Arm</th>
                  <th className="px-6 py-3.5 font-bold">Rank</th>
                  <th className="px-6 py-3.5 font-bold">Unit</th>
                  <th className="px-6 py-3.5 font-bold">Phone</th>
                  <th className="px-6 py-3.5 font-bold">Email</th>
                  <th className="px-6 py-3.5 font-bold">Entry Status</th>
                  <th className="px-6 py-3.5 font-bold">Registered</th>
                  <th className="px-6 py-3.5 font-bold">Entered</th>
                  <th className="px-4 py-3.5 font-bold w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-zinc-800/90 bg-[#0A0A0C]' : 'divide-slate-100 bg-white'
              }`}>
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className={`transition duration-75 ${
                    isDark ? 'hover:bg-[#121215]' : 'hover:bg-slate-50/60'
                  }`}>
                    <td className="px-4 py-3.5 text-center w-12">
                      {person.status !== 'ENTERED' && person.status !== 'REJECTED' ? (
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                          checked={selectedIds.includes(person.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, person.id])
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== person.id))
                            }
                          }}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          disabled
                          className="rounded border-slate-200 text-slate-300 cursor-not-allowed opacity-40 h-4 w-4"
                        />
                      )}
                    </td>
                    <td className={`px-6 py-3.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {person.fullName}
                    </td>
                    <td className={`px-6 py-3.5 font-mono text-xs font-semibold ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      {person.serviceNumber}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs font-extrabold text-emerald-500">
                      {getPersonnelYear(person)}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold">
                      {person.exerciseStatus ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            person.exerciseStatus === 'Participants'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                              : person.exerciseStatus === 'Evaluators'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700'
                              : person.exerciseStatus === 'General Headquarters'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                              : person.exerciseStatus === 'Civilians'
                              ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:border-zinc-800'
                          }`}
                        >
                          {person.exerciseStatus}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold">
                      {person.armOfService ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            person.armOfService === 'Army'
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/80 dark:text-green-300 dark:border-green-700'
                              : person.armOfService === 'Navy'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700'
                              : person.armOfService === 'Air Force'
                              ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-700'
                              : person.armOfService === 'DCS'
                              ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/80 dark:text-violet-300 dark:border-violet-700'
                              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:border-zinc-800'
                          }`}
                        >
                          {person.armOfService}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className={`px-6 py-3.5 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      {person.rank || '—'}
                    </td>
                    <td className={`px-6 py-3.5 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      {person.unit}
                    </td>
                    <td className={`px-6 py-3.5 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      {person.phone}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">
                      {person.email ? (
                        <a
                          href={`mailto:${person.email}`}
                          className="hover:underline transition"
                          title={person.email}
                        >
                          {person.email}
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={person.status} />
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-slate-400">
                      {formatDate(person.registeredAt)}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-slate-400">
                      {formatDate(person.enteredAt)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Edit record"
                          onClick={() => setEditModal({ person })}
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition duration-150 cursor-pointer ${
                            isDark
                              ? 'text-slate-300 hover:bg-zinc-800 hover:text-white'
                              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                        >
                          <Pencil size={13} className="text-blue-400" />
                        </button>
                        <button
                          type="button"
                          title="Delete record"
                          onClick={() => setDeleteModal({ person })}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition duration-150 cursor-pointer dark:hover:bg-red-950/80"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`border-t px-6 py-3.5 text-right text-xs font-bold ${
          isDark ? 'border-zinc-800 bg-[#000000] text-slate-400' : 'border-slate-200/80 bg-slate-50/50 text-slate-500'
        }`}>
          {personnel.length} record{personnel.length !== 1 ? 's' : ''} listed
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-700 focus:outline-none cursor-pointer duration-300 hover:-translate-y-1 active:scale-95"
          title="Scroll to Top"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* Edit Personnel Modal */}
      {editModal && (
        <EditPersonnelModal
          person={editModal.person}
          onClose={() => setEditModal(null)}
          onSaved={handlePersonnelSaved}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={load}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setDeleteModal(null)} />
          <div className={`relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-fade-in ${
            isDark ? 'bg-[#121215] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-extrabold text-white">Delete Record?</h3>
            </div>
            <p className={`text-xs leading-relaxed font-medium mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Are you sure you want to delete <strong className="text-white">{deleteModal.person.fullName}</strong> ({deleteModal.person.serviceNumber})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  isDark ? 'bg-zinc-800 text-slate-200 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePersonnel}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkModal && (bulkModal.type === 'confirm-selected' || bulkModal.type === 'confirm-all') && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setBulkModal(null)} />
          <div className={`relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-fade-in ${
            isDark ? 'bg-[#121215] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-amber-500 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-base font-extrabold text-white">Confirm Bulk Entry</h3>
            </div>
            <p className={`text-xs leading-relaxed font-medium mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {bulkModal.type === 'confirm-selected'
                ? `Confirm entry for ${bulkModal.count} selected personnel?`
                : `Confirm entry for all ${bulkModal.count} eligible personnel?`}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBulkModal(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  isDark ? 'bg-zinc-800 text-slate-200 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={bulkModal.type === 'confirm-selected' ? executeBulkSelected : executeBulkAll}
                disabled={bulkProcessing}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {bulkProcessing ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Result Modal */}
      {bulkModal && bulkModal.type === 'result' && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setBulkModal(null)} />
          <div className={`relative z-10 w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl animate-fade-in ${
            isDark ? 'bg-[#121215] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {bulkModal.success ? (
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
            ) : (
              <XCircle size={40} className="text-red-500 mx-auto mb-2" />
            )}
            <h3 className="text-base font-extrabold text-white mb-1">
              {bulkModal.success ? 'Success' : 'Notice'}
            </h3>
            <p className={`text-xs leading-relaxed font-medium mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {bulkModal.message}
            </p>
            <button
              type="button"
              onClick={() => setBulkModal(null)}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
