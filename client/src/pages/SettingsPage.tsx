import { useState, useEffect } from 'react'
import type React from 'react'
import {
  Settings,
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import {
  subscribeToAdminProfile,
  saveAdminProfile,
} from '../services/firebase'

export function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToAdminProfile((data) => {
      setDisplayName(data.displayName || 'Admin')
      setRole(data.role || 'System Administrator')
      setUsername(data.username || 'SokoAerial')
      setPassword(data.password || 'soko123')
      setConfirmPassword(data.password || 'soko123')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!displayName.trim()) {
      setErrorMsg('Display Name cannot be empty.')
      return
    }

    if (!role.trim()) {
      setErrorMsg('Role / Designation cannot be empty.')
      return
    }

    if (!username.trim()) {
      setErrorMsg('Username cannot be empty.')
      return
    }

    if (!password) {
      setErrorMsg('Password cannot be empty.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.')
      return
    }

    setSaving(true)
    try {
      await saveAdminProfile({
        displayName: displayName.trim(),
        role: role.trim(),
        username: username.trim(),
        password,
      })
      setSuccessMsg('Admin Settings updated successfully! All changes are synced in real-time.')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      console.error('Failed to save admin profile:', err)
      setErrorMsg('Failed to update settings. Please check your network connection.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <Loader2 size={36} className="text-cyan-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading Admin Settings…</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Settings size={22} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Admin & System Settings</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            Manage your display name, role designation, and authentication credentials stored in Firestore.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Check size={18} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Profile Details */}
          <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <User size={18} className="text-cyan-500" />
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  Admin Profile Information
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This name and designation are displayed in the sidebar footer.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Admin Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Commander Kingsley or Admin"
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Appears next to your avatar in the sidebar and navigation menus.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Role / Title Designation
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. System Administrator"
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  e.g. System Administrator, Operations Director, Control Room Officer.
                </p>
              </div>

              {/* Live Preview Badge */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Sidebar Live Preview
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-black text-white flex items-center justify-center">
                    {(displayName || 'AD').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{displayName || 'Admin'}</div>
                    <div className="text-[10px] text-slate-400">{role || 'System Administrator'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Authentication Credentials */}
          <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <KeyRound size={18} className="text-cyan-500" />
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  Sign-In Credentials
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update the username and password used to access the control dashboard.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Login Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter login username"
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-start gap-2.5 text-[11px] font-semibold">
                <Shield size={16} className="shrink-0 mt-0.5" />
                <span>
                  Updating these credentials will apply to all future admin sign-in attempts instantly across all devices.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold transition shadow-md cursor-pointer disabled:opacity-50 uppercase tracking-wider active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
