import { useEffect, useMemo, useState } from 'react'
import { Copy, CheckCheck, ExternalLink, Database, Loader2, Search, ShieldCheck, Users, RefreshCw, ArrowUp } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { getStats, listPersonnel, subscribeToEntryControl, updateEntryControl } from '../services/firebase'
import type { Personnel, PersonnelStatus, Stats, EntryControlSettings } from '../types/personnel'
import { formatDate } from '../utils/format'
import { getBaseUrl } from '../utils/url'

const filters: Array<PersonnelStatus | 'ALL'> = ['ALL', 'REGISTERED', 'APPROVED', 'ENTERED', 'REJECTED']

export function DashboardPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [stats, setStats] = useState<Stats>()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PersonnelStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Entry Control settings state
  const [entryControl, setEntryControl] = useState<EntryControlSettings | null>(null)
  const [entryControlLoading, setEntryControlLoading] = useState(true)
  const [updatingControl, setUpdatingControl] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; enable: boolean } | null>(null)

  // Decodes admin username from local storage token
  const getAdminUsername = () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return 'Admin'
    if (token.startsWith('soko-auth-')) {
      try {
        const parts = token.split('-')
        if (parts[2]) {
          return atob(parts[2])
        }
      } catch {
        return 'Admin'
      }
    }
    return 'Admin'
  }

  // Subscribe to entryControl status in real-time
  useEffect(() => {
    const unsubscribe = subscribeToEntryControl((settings) => {
      setEntryControl(settings)
      setEntryControlLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Track scroll position to show/hide "Scroll to Top" button
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

  // Generate the registration link dynamically depending on local/hosted env
  const baseUrl = getBaseUrl()
  const registrationLink = `${baseUrl}/register`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = registrationLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const load = useMemo(
    () => async () => {
      setLoading(true)
      setError('')
      try {
        const [peopleResponse, statsResponse] = await Promise.all([
          listPersonnel(search, status),
          getStats(),
        ])
        setPersonnel(peopleResponse.personnel)
        setStats(statsResponse.stats)
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Entry Control Dashboard</h1>
          <p className="mt-1 text-slate-500 text-sm font-medium">
            Monitor real-time registrations, entry clearances, and system statistics for{' '}
            <strong className="text-slate-800">EXERCISE RESOLUTE SYNERGY 2026</strong>.
          </p>
          <p className="text-emerald-600 text-[11px] italic font-semibold mt-1">
            "Enhancing Preparedness Through Joint Training"
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50/80 transition duration-150 cursor-pointer disabled:opacity-50 shadow-sm"
            type="button"
            onClick={load}
            disabled={loading}
            title="Refresh data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            Refresh
          </button>
          <a 
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition duration-150 cursor-pointer shadow-sm shadow-slate-950/10" 
            href="/verify"
          >
            <ShieldCheck size={15} aria-hidden="true" />
            Open Scanner
          </a>
        </div>
      </div>

      {/* ── Registration Link Generator (Enhanced Slate Theme) ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ExternalLink size={14} />
            Personnel Registration Link
          </div>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
            Copy and distribute this link to personnel for the GAF event entry registration. Registered records sync instantly below.
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs font-mono text-slate-300 select-all select-text flex items-center justify-center overflow-x-auto min-h-[38px]">
            {registrationLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 shrink-0 ${
                copied 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'bg-white hover:bg-slate-100 text-slate-950 shadow-sm'
              }`}
            >
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition duration-150 flex items-center justify-center gap-1.5 text-white shadow-sm shrink-0"
            >
              Open
            </a>
          </div>
        </div>
      </div>

      {/* ── Entry Verification Control Card ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-black text-slate-400 uppercase block mb-1">
              Security Operations
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Entry Verification Control
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-medium max-w-xl">
              Manage the global entry state. Disabling this blocks all gate verification check-ins instantly.
            </p>
          </div>
          {/* Status Indicator & Button */}
          {entryControlLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold py-2">
              <Loader2 className="animate-spin" size={16} /> Loading settings...
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                  entryControl?.entryEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    entryControl?.entryEnabled ? 'bg-white' : 'bg-white/70'
                  }`} />
                </div>
                <div>
                  <span className={`text-xs font-black uppercase tracking-wider ${
                    entryControl?.entryEnabled ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {entryControl?.entryEnabled ? '🟢 ENTRY VERIFICATION ACTIVE' : '🔴 ENTRY VERIFICATION DISABLED'}
                  </span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                    {entryControl?.entryEnabled 
                      ? 'Officials can now verify and check in registered personnel.'
                      : 'Personnel cannot be checked in at this time.'
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={updatingControl}
                onClick={() => setConfirmModal({ isOpen: true, enable: !entryControl?.entryEnabled })}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer transition shadow-sm ${
                  entryControl?.entryEnabled
                    ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100/60'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                }`}
              >
                {updatingControl ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={13} className="animate-spin" /> Processing...
                  </span>
                ) : entryControl?.entryEnabled ? (
                  'DISABLE ENTRY VERIFICATION'
                ) : (
                  'ENABLE ENTRY VERIFICATION'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Metadata info */}
        {entryControl && (entryControl.updatedAt || entryControl.updatedBy) && (
          <div className="border-t border-slate-100 mt-5 pt-3.5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {entryControl.updatedAt && (
              <span>Last updated: {formatDate(entryControl.updatedAt)}</span>
            )}
            {entryControl.updatedBy && (
              <span>Updated by: {entryControl.updatedBy}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Custom Confirmation Modal ── */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                confirmModal.enable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {confirmModal.enable ? 'Enable Entry Verification?' : 'Disable Entry Verification?'}
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">
                  {confirmModal.enable 
                    ? 'This will allow authorized officials to confirm personnel entry.'
                    : 'This will prevent all new personnel from being checked in.'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const toState = confirmModal.enable
                  setConfirmModal(null)
                  setUpdatingControl(true)
                  try {
                    const username = getAdminUsername()
                    await updateEntryControl(toState, username)
                  } catch (err) {
                    console.error('Failed to toggle settings:', err)
                    alert('Failed to update entry control: ' + (err instanceof Error ? err.message : String(err)))
                  } finally {
                    setUpdatingControl(false)
                  }
                }}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer text-white transition ${
                  confirmModal.enable 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmModal.enable ? 'Enable' : 'Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats (Simple Clean Grid) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <StatCard label="Total Registered" value={stats?.totalRegistered ?? 0} color="blue" />
        <StatCard label="Approved" value={stats?.approved ?? 0} color="green" />
        <StatCard label="Entered" value={stats?.entered ?? 0} color="emerald" />
        <StatCard label="Yet to Confirm Entry" value={stats?.notYetEntered ?? 0} color="amber" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} color="red" />
      </div>

      {/* ── Personnel Table Card ── */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* Table Filters & Search Bar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          <label className="relative block sm:w-80 w-full">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
              aria-hidden="true"
            />
            <input
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, service number, unit..."
            />
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`transition duration-150 border px-3.5 py-1.5 text-xs font-bold rounded-full cursor-pointer shrink-0 ${
                  status === filter 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-950'
                }`}
                type="button"
                onClick={() => setStatus(filter)}
              >
                {filter === 'ALL' ? 'All' : filter === 'REGISTERED' ? 'Yet to Confirm Entry' : filter}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-6 text-sm font-semibold text-red-700 bg-red-50">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-slate-500 font-medium text-sm">
            <Loader2 className="animate-spin text-slate-400" size={20} aria-hidden="true" />
            Synchronizing with control database…
          </div>
        ) : personnel.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Database size={36} className="mb-3 text-slate-300" aria-hidden="true" />
            <p className="font-bold text-slate-800 text-sm">
              {search.trim() ? `No matching records found for "${search}"` : 'No personnel records found.'}
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm leading-normal">
              {search.trim()
                ? 'Check spelling, check code format, or search for another term.'
                : 'Share the registration link above so personnel can register.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Name</th>
                  <th className="px-6 py-3.5 font-bold">Service No.</th>
                  <th className="px-6 py-3.5 font-bold">Arm</th>
                  <th className="px-6 py-3.5 font-bold">Rank</th>
                  <th className="px-6 py-3.5 font-bold">Unit</th>
                  <th className="px-6 py-3.5 font-bold">Phone</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">Registered</th>
                  <th className="px-6 py-3.5 font-bold">Entered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {personnel.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/40 transition duration-75">
                    <td className="px-6 py-4 font-bold text-slate-900">{person.fullName}</td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">{person.serviceNumber}</td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {person.armOfService ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          person.armOfService === 'Army' ? 'bg-green-50 text-green-700 border-green-200' :
                          person.armOfService === 'Navy' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          person.armOfService === 'Air Force' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>{person.armOfService}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{person.rank || '—'}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{person.unit}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{person.phone}</td>
                    <td className="px-6 py-4"><StatusBadge status={person.status} /></td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400">{formatDate(person.registeredAt)}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400">{formatDate(person.enteredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200 px-6 py-3.5 text-right text-xs font-bold text-slate-500 bg-slate-50/50">
          {personnel.length} record{personnel.length !== 1 ? 's' : ''} listed
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Users size={14} className="text-slate-300" />
        Encrypted real-time link with military intelligence control.
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition-all hover:bg-slate-800 focus:outline-none cursor-pointer duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
          title="Scroll to Top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </section>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'green' | 'emerald' | 'amber' | 'red'
}) {
  const bgClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md duration-200">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${bgClasses[color]}`}>
          {color === 'emerald' ? 'active' : color}
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
        {value}
      </p>
    </div>
  )
}
