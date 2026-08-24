import { LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react'
import type React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import gafLogo from '../assets/gaf.png'

type Props = {
  children: React.ReactNode
}

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/verify', label: 'Verify Entry', icon: ShieldCheck },
]

export function AppShell({ children }: Props) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 border border-slate-800 p-1 shadow-inner">
              <img src={gafLogo} alt="GAF Emblem" className="w-8 h-8 object-contain" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-wide">
                EXERCISE RESOLUTE SYNERGY 2026
              </span>
              <span className="block text-xs text-slate-400">
                Entry Control System &mdash; Admin Panel
              </span>
            </span>
          </NavLink>
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                      isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <LogOut size={17} aria-hidden="true" />
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

