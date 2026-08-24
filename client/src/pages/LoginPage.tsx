import { useState, useEffect } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react'
import gafLogo from '../assets/gaf.png'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      let data
      if (import.meta.env.DEV) {
        // In local development, check Firestore directly to avoid 404 from missing serverless routes
        const { verifyAdminLocal } = await import('../services/firebase')
        const result = await verifyAdminLocal(username, password)
        if (!result.success) {
          throw new Error('Invalid username or password')
        }
        data = { success: true, token: result.token }
      } else {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed')
        }
      }

      if (data.success && data.token) {
        localStorage.setItem('adminToken', data.token)
        navigate('/dashboard')
      } else {
        throw new Error('Authentication failed')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden select-none font-sans">
      {/* Background glow accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-950/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 relative z-10 transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4 flex items-center justify-center bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
            <img 
              src={gafLogo} 
              alt="GAF Logo" 
              className="w-16 h-16 object-contain pointer-events-none" 
            />
          </div>
          <span className="text-[10px] tracking-[0.25em] font-black text-emerald-400 uppercase">
            Ghana Armed Forces
          </span>
          <h1 className="text-white font-extrabold text-lg sm:text-xl mt-1 tracking-wide uppercase leading-tight">
            Exercise Resolute Synergy 2026
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            Entry Control Admin Portal
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg p-3.5 mb-6 flex items-start gap-3 text-xs leading-normal animate-shake">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="font-semibold block mb-0.5">Authentication Failed</span>
              <p className="text-red-300/90">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} noValidate className="space-y-5">
          <div className="space-y-4">
            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-md px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-700 transition duration-200"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={13} className="text-slate-400" />
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-md px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-700 transition duration-200"
              />
            </div>
          </div>

          {/* Submit & Security Info */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  Authenticating…
                </>
              ) : (
                <>
                  <Lock size={17} />
                  Access Dashboard
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] mt-4 font-semibold tracking-wide">
              <ShieldCheck size={13} className="text-slate-600" />
              Secured connection to control server.
            </div>
          </div>
        </form>
      </div>

      {/* Footer copyright */}
      <p className="absolute bottom-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center w-full">
        EXERCISE RESOLUTE SYNERGY 2026 &mdash; Ghana Armed Forces
      </p>
    </div>
  )
}
