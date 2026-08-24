import { useEffect, useMemo, useState } from 'react'
import { Copy, CheckCheck, ExternalLink, Database, Loader2, Search, ShieldCheck, Users, RefreshCw, ArrowUp } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { getStats, listPersonnel } from '../services/firebase'
import type { Personnel, PersonnelStatus, Stats } from '../types/personnel'
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
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Entry Control Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Monitor registrations, entry status, and verification readiness for{' '}
            <strong>EXERCISE RESOLUTE SYNERGY 2026</strong>.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="secondary-button"
            type="button"
            onClick={load}
            disabled={loading}
            title="Refresh data"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            Refresh
          </button>
          <a className="primary-button" href="/verify">
            <ShieldCheck size={18} aria-hidden="true" />
            Open Scanner
          </a>
        </div>
      </div>

      {/* ── Registration Link Generator ── */}
      <div className="link-generator-card">
        <div className="link-gen-left">
          <div className="link-gen-icon">
            <ExternalLink size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="link-gen-title">Personnel Registration Link</p>
            <p className="link-gen-sub">
              Copy and share this link with personnel to register for EXERCISE RESOLUTE SYNERGY 2026.
              They will only see the registration form.
            </p>
          </div>
        </div>
        <div className="link-gen-row">
          <div className="link-gen-url">
            <span className="link-gen-url-text">{registrationLink}</span>
          </div>
          <div className="link-gen-actions">
            <button
              className={`link-copy-btn ${copied ? 'copied' : ''}`}
              type="button"
              onClick={copyLink}
            >
              {copied
                ? <><CheckCheck size={16} /> Copied!</>
                : <><Copy size={16} /> Copy Link</>}
            </button>
            <a
              className="secondary-button compact"
              href={registrationLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={15} /> Open
            </a>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid mt-6">
        <StatCard label="Total Registered" value={stats?.totalRegistered ?? 0} color="blue" />
        <StatCard label="Approved" value={stats?.approved ?? 0} color="green" />
        <StatCard label="Entered" value={stats?.entered ?? 0} color="emerald" />
        <StatCard label="Not Yet Entered" value={stats?.notYetEntered ?? 0} color="amber" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} color="red" />
      </div>

      {/* ── Personnel Table ── */}
      <div className="mt-6 rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-96">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden="true"
            />
            <input
              className="control-input pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, service number, reg ID, unit…"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`filter-button ${status === filter ? 'active' : ''}`}
                type="button"
                onClick={() => setStatus(filter)}
              >
                {filter === 'ALL' ? 'All' : filter}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-6 text-sm font-semibold text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-slate-600">
            <Loader2 className="animate-spin" size={22} aria-hidden="true" />
            Loading dashboard data from Firebase…
          </div>
        ) : personnel.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-600">
            <Database size={40} className="mb-3 text-slate-400" aria-hidden="true" />
            <p className="font-semibold text-slate-800">
              {search.trim() ? `No matching records found for "${search}"` : 'No personnel records found.'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search.trim()
                ? 'Check spelling, check code format, or search for another term.'
                : 'Share the registration link above so personnel can register.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="personnel-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Service Number</th>
                  <th>Rank</th>
                  <th>Unit</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Registered At</th>
                  <th>Entered At</th>
                </tr>
              </thead>
              <tbody>
                {personnel.map((person) => (
                  <tr key={person.id}>
                    <td>{person.fullName}</td>
                    <td>{person.serviceNumber}</td>
                    <td>{person.rank}</td>
                    <td>{person.unit}</td>
                    <td>{person.phone}</td>
                    <td><StatusBadge status={person.status} /></td>
                    <td>{formatDate(person.registeredAt)}</td>
                    <td>{formatDate(person.enteredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200 px-4 py-3 text-right text-sm text-slate-500">
          {personnel.length} record{personnel.length !== 1 ? 's' : ''} shown
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Users size={13} />
        Data is stored in Firebase Firestore — real-time and persistent.
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
  const colorMap: Record<string, string> = {
    blue: '#1d4ed8',
    green: '#15803d',
    emerald: '#059669',
    amber: '#d97706',
    red: '#b91c1c',
  }
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p
        className="mt-2 text-3xl font-bold"
        style={{ color: colorMap[color] }}
      >
        {value}
      </p>
    </div>
  )
}
