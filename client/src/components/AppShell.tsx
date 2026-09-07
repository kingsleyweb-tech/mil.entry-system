import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  FileText,
  BarChart3,
  Sliders,
  Settings,
  Menu,
  X,
  Lock,
  Unlock,
  Sun,
  Moon,
  Maximize,
  Minimize,
  PanelLeftClose,
  PanelLeftOpen,
  FolderArchive,
  GitCompare,
} from 'lucide-react'
import type React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import gafLogo from '../assets/gaf.png'
import { subscribeToEntryControl, updateEntryControl, subscribeToAdminProfile, type AdminProfileSettings, DEFAULT_ADMIN_PROFILE } from '../services/firebase'
import type { EntryControlSettings } from '../types/personnel'
import { useTheme } from '../context/ThemeContext'

type Props = {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true'
  })

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Mobile menu states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [entryControl, setEntryControl] = useState<EntryControlSettings | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfileSettings>(DEFAULT_ADMIN_PROFILE)
  const [updatingControl, setUpdatingControl] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubEntry = subscribeToEntryControl((settings) => {
      setEntryControl(settings)
    })
    const unsubProfile = subscribeToAdminProfile((profile) => {
      setAdminProfile(profile)
    })
    return () => {
      unsubEntry()
      unsubProfile()
    }
  }, [])

  // Listen for fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // When route changes, close mobile menu
  useEffect(() => {
    closeMenu()
  }, [location.pathname])

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('adminSidebarCollapsed', String(next))
      return next
    })
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Error attempting to exit fullscreen:', err)
        })
      }
    }
  }

  const openMenu = () => {
    setMobileMenuOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMenuVisible(true))
    })
  }

  const closeMenu = () => {
    setMenuVisible(false)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setMobileMenuOpen(false), 400)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/login')
  }

  const adminName = adminProfile.displayName || 'Admin'
  const adminRole = adminProfile.role || 'System Administrator'

  const handleToggleEntry = async () => {
    if (updatingControl) return
    setUpdatingControl(true)
    try {
      const nextState = !entryControl?.entryEnabled
      await updateEntryControl(nextState, adminName)
    } catch (err) {
      console.error('Failed to toggle entry control:', err)
    } finally {
      setUpdatingControl(false)
    }
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: '#10b981' },
    { to: '/registrations', label: 'Registrations', icon: FileText, iconColor: '#3b82f6' },
    { to: '/verify', label: 'Verify Entry', icon: ShieldCheck, iconColor: '#f59e0b' },
    { to: '/reports', label: 'Reports', icon: BarChart3, iconColor: '#a855f7' },
    { to: '/archives', label: 'Yearly Archives', icon: FolderArchive, iconColor: '#16a34a' },
    { to: '/yearly-crosscheck', label: 'Year Cross-Check', icon: GitCompare, iconColor: '#9333ea' },
    { to: '/form-builder', label: 'Form Builder', icon: Sliders, iconColor: '#ec4899' },
    { to: '/settings', label: 'Settings', icon: Settings, iconColor: '#06b6d4' },
  ]

  const isDark = theme === 'dark'

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 ${
        isDark ? 'bg-[#000000] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Mobile Header Bar ── */}
      <header
        className={`md:hidden border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50 ${
          isDark
            ? 'bg-[#000000] text-white border-zinc-800'
            : 'bg-[#0A1128] text-white border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <img src={gafLogo} alt="GAF Logo" className="w-8 h-8 object-contain" />
          <div>
            <div className="text-xs font-black tracking-wider uppercase text-white">
              EXERCISE RESOLUTE SYNERGY
            </div>
            <div className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">
              PERSONNEL REGISTRATION SYSTEM
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
            title="Toggle Theme"
          >
            {isDark ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-indigo-400" />
            )}
          </button>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={openMenu}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer text-slate-300 hover:text-white"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ── Mobile Full-Screen Animated Drawer ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] md:hidden"
          style={{
            background: isDark ? '#000000' : '#ffffff',
            opacity: menuVisible ? 1 : 0,
            transition: 'opacity 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div
            className="flex flex-col h-full"
            style={{
              transform: menuVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Drawer Header */}
            <div
              className={`flex items-center justify-between px-6 py-5 border-b ${
                isDark ? 'border-zinc-800' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={gafLogo} alt="GAF Logo" className="w-9 h-9 object-contain" />
                <span
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: '1rem',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  Resolute Entry
                </span>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                style={{
                  background: isDark ? '#18181b' : '#f1f5f9',
                  border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                  borderRadius: '50%',
                  padding: '8px',
                  cursor: 'pointer',
                  color: isDark ? '#ffffff' : '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 flex flex-col justify-center px-6 gap-1">
              {navItems.map((item, i) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={closeMenu}
                    style={{
                      fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                      fontSize: '2.4rem',
                      letterSpacing: '0.04em',
                      lineHeight: 1.15,
                      color: isActive
                        ? item.iconColor
                        : isDark
                        ? '#e4e4e7'
                        : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '10px 16px',
                      borderRadius: '16px',
                      textDecoration: 'none',
                      background: isActive
                        ? isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.05)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      opacity: menuVisible ? 1 : 0,
                      transform: menuVisible ? 'translateX(0)' : 'translateX(-24px)',
                      transitionDelay: menuVisible ? `${0.12 + i * 0.07}s` : '0s',
                      transitionProperty: 'opacity, transform, background, color',
                      transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                      transitionDuration: '0.4s',
                    }}
                  >
                    <Icon size={26} style={{ color: item.iconColor, flexShrink: 0 }} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: item.iconColor,
                          flexShrink: 0,
                          boxShadow: `0 0 8px ${item.iconColor}`,
                        }}
                      />
                    )}
                  </NavLink>
                )
              })}
            </nav>

            {/* Drawer Footer */}
            <div
              className={`px-6 py-5 border-t ${
                isDark ? 'border-zinc-800' : 'border-slate-200'
              }`}
              style={{
                opacity: menuVisible ? 1 : 0,
                transform: menuVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.4s 0.42s ease, transform 0.4s 0.42s ease',
              }}
            >
              {/* Entry Control */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{
                  background: isDark ? '#18181b' : '#f1f5f9',
                  border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background:
                        entryControl?.entryEnabled !== false ? '#10b981' : '#ef4444',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color:
                        entryControl?.entryEnabled !== false ? '#10b981' : '#ef4444',
                    }}
                  >
                    Entry Verification —{' '}
                    {entryControl?.entryEnabled !== false ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEntry}
                  disabled={updatingControl}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition cursor-pointer disabled:opacity-50"
                  style={{
                    background: isDark ? '#27272a' : '#ffffff',
                    border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontFamily: "'Oswald', sans-serif",
                    letterSpacing: '0.06em',
                  }}
                >
                  {entryControl?.entryEnabled !== false ? (
                    <><Lock size={14} style={{ color: '#ef4444' }} /><span>Disable Entry</span></>
                  ) : (
                    <><Unlock size={14} style={{ color: '#10b981' }} /><span>Enable Entry</span></>
                  )}
                </button>
              </div>

              {/* Profile + Logout */}
              <div className="flex items-center justify-between">
                <div
                  onClick={() => { closeMenu(); navigate('/settings') }}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: isDark ? '#27272a' : '#e2e8f0',
                      border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Oswald', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: isDark ? '#ffffff' : '#0f172a',
                      flexShrink: 0,
                    }}
                  >
                    {adminName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: isDark ? '#ffffff' : '#0f172a' }}>
                      {adminName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isDark ? '#71717a' : '#94a3b8' }}>
                      {adminRole}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg transition cursor-pointer"
                  style={{ background: 'transparent', border: 'none' }}
                >
                  <LogOut size={20} style={{ color: '#ef4444' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      {!sidebarCollapsed && (
        <aside
          className={`hidden md:flex sticky top-0 z-40 w-64 border-r flex-col justify-between shrink-0 h-screen transition-all duration-300 ${
            isDark
              ? 'bg-[#000000] text-slate-100 border-zinc-800'
              : 'bg-[#0A1128] text-slate-200 border-slate-800/80'
          }`}
        >
          <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6">
            
            {/* Header & Sidebar Collapse Trigger */}
            <div className="flex items-start justify-between gap-2 px-2 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/60 p-1.5 shadow-md">
                  <img src={gafLogo} alt="GAF Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xs font-black text-white tracking-wider uppercase leading-snug">
                    EXERCISE<br />RESOLUTE SYNERGY
                  </h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    PERSONNEL SYSTEM
                  </p>
                </div>
              </div>

              {/* Hide Sidebar Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer shrink-0 mt-0.5"
                title="Hide Sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            {/* Theme Toggle */}
            <div className="px-2 mb-4">
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition duration-150 cursor-pointer ${
                  isDark
                    ? 'bg-[#121215] border-zinc-800 text-white hover:bg-zinc-800'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isDark
                    ? <Sun size={16} className="text-amber-400" />
                    : <Moon size={16} className="text-indigo-400" />}
                  <span className="text-white">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {theme}
                </span>
              </button>
            </div>

            {/* Nav Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? isDark
                          ? 'bg-[#121215] text-white border border-emerald-500/60 shadow-lg'
                          : 'bg-[#142C23] text-emerald-400 border border-emerald-500/30 shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <Icon size={18} style={{ color: item.iconColor }} />
                    <span className="text-white">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </NavLink>
                )
              })}
            </nav>

            {/* Entry Control Widget */}
            <div className="mt-auto pt-6">
              <div
                className={`rounded-2xl border p-4 text-left shadow-lg ${
                  isDark ? 'bg-[#0E0E11] border-zinc-800' : 'bg-[#0F1935] border-slate-800'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  ENTRY VERIFICATION
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      entryControl?.entryEnabled !== false
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-extrabold tracking-wider ${
                      entryControl?.entryEnabled !== false ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {entryControl?.entryEnabled !== false ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-3">
                  {entryControl?.entryEnabled !== false
                    ? 'Officials can verify entry.'
                    : 'Entry verification disabled.'}
                </p>
                <button
                  type="button"
                  onClick={handleToggleEntry}
                  disabled={updatingControl}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold border transition duration-150 cursor-pointer disabled:opacity-50 ${
                    isDark
                      ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white'
                      : 'border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  {entryControl?.entryEnabled !== false ? (
                    <><Lock size={13} className="text-red-400" /><span className="text-white">Disable Entry</span></>
                  ) : (
                    <><Unlock size={13} className="text-emerald-400" /><span className="text-white">Enable Entry</span></>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Footer */}
          <div
            className={`border-t p-4 flex items-center justify-between ${
              isDark ? 'bg-[#000000] border-zinc-800' : 'bg-[#040712] border-slate-800/80'
            }`}
          >
            <div
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 overflow-hidden cursor-pointer group p-1.5 -m-1.5 rounded-xl hover:bg-zinc-900/80 transition duration-150"
              title="Open Settings"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-black text-white group-hover:border-emerald-500 transition">
                {adminName.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">{adminName}</div>
                <div className="text-[10px] font-semibold text-slate-400 truncate">{adminRole}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              <LogOut size={16} className="text-red-400" />
            </button>
          </div>
        </aside>
      )}

      {/* ── Main Content Area with Desktop Top Bar ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-colors duration-200 ${
          isDark ? 'bg-[#000000] text-white' : 'bg-[#F8FAFC] text-slate-900'
        }`}
      >
        {/* Desktop Top Control Bar */}
        <header
          className={`hidden md:flex items-center justify-between px-6 py-3 border-b sticky top-0 z-30 transition-colors duration-200 ${
            isDark
              ? 'bg-[#09090b]/90 border-zinc-800/80 backdrop-blur-md'
              : 'bg-white/90 border-slate-200/80 backdrop-blur-md'
          }`}
        >
          {/* Left: Sidebar Toggle + Brand snippet */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-2 text-xs font-extrabold ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-slate-200 hover:bg-zinc-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
            >
              {sidebarCollapsed ? (
                <>
                  <PanelLeftOpen size={17} className="text-emerald-500" />
                  <span>Show Sidebar</span>
                </>
              ) : (
                <>
                  <PanelLeftClose size={17} className="text-slate-400" />
                  <span>Hide Sidebar</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Fullscreen + Theme + Quick actions */}
          <div className="flex items-center gap-2.5">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-slate-200 hover:bg-zinc-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <>
                  <Minimize size={16} className="text-amber-400" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize size={16} className="text-emerald-500" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>

            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
                  : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'
              }`}
              title="Toggle Light / Dark Mode"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
