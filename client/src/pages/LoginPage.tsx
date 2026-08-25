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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950 text-white font-sans overflow-x-hidden">
      
      {/* ── Left Side: GAF Info Panel (Hidden on Mobile, block on md+) ── */}
      <div className="hidden md:flex md:w-[55%] lg:w-[60%] flex-col justify-between p-12 lg:p-20 relative bg-slate-900 border-r border-slate-800">
        {/* Subtle decorative grid/glow backdrops */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-950/20 rounded-full blur-[140px] pointer-events-none" />

        {/* Brand/Header */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={gafLogo} alt="GAF Emblem" className="w-10 h-10 object-contain" />
          <div>
            <span className="block text-[10px] tracking-[0.25em] font-black text-emerald-400 uppercase">
              General Headquarters
            </span>
            <span className="block text-sm font-bold text-white tracking-wide uppercase">
              Ghana Armed Forces
            </span>
          </div>
        </div>

        {/* Center Info Text */}
        <div className="relative z-10 max-w-xl my-auto">
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full mb-6">
            Exercise Resolute Synergy 2026
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
            Enhancing Preparedness Through Joint Training
          </h2>
          <p className="mt-6 text-slate-400 text-sm lg:text-base leading-relaxed font-medium">
            A joint tabletop command post exercise sponsored by the General Headquarters of the Ghana Armed Forces. This initiative evaluates operational preparedness and promotes cohesion, strengthening our response capability to evolving multi-domain threats across Land, Maritime, Air, Cyber, and Information spheres.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Ghana Armed Forces &copy; {new Date().getFullYear()} &mdash; All Rights Reserved.
        </div>
      </div>

      {/* ── Right Side: Login Form (Full screen on mobile, 40-45% on laptop) ── */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center items-center p-8 sm:p-12 relative min-h-screen md:min-h-0 bg-slate-950">
        
        {/* Glow backdrop for mobile/right side */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-950/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Login Card Wrapper */}
        <div className="w-full max-w-[360px] relative z-10">
          
          {/* Mobile Header (Shows GAF logo centered above the form) */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4 flex items-center justify-center bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-inner">
              <img 
                src={gafLogo} 
                alt="GAF Logo" 
                className="w-12 h-12 object-contain pointer-events-none" 
              />
            </div>
            {/* Show GAF title text on mobile headers */}
            <span className="block md:hidden text-[9px] tracking-[0.2em] font-black text-emerald-400 uppercase">
              Ghana Armed Forces
            </span>
            <h1 className="text-white font-extrabold text-base uppercase tracking-wider mt-1 block md:hidden">
              Exercise Resolute Synergy 2026
            </h1>
            <p className="text-emerald-400/80 text-[10px] italic font-semibold mt-1 block md:hidden">
              "Enhancing Preparedness Through Joint Training"
            </p>
            <p className="text-slate-400 text-xs mt-1.5 font-bold uppercase tracking-wider">
              Admin Portal Sign-In
            </p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg p-3.5 mb-6 flex items-start gap-3 text-xs leading-normal animate-shake">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-semibold block mb-0.5">Access Denied</span>
                <p className="text-red-300/90">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div className="space-y-4">
              
              {/* Username field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} />
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
                  className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-md px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-700 transition duration-200"
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={12} />
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
                  className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-md px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-700 transition duration-200"
                />
              </div>
            </div>

            {/* Actions */}
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

              <div className="flex items-center justify-center gap-1.5 text-slate-600 text-[10px] mt-4 font-semibold tracking-wide">
                <ShieldCheck size={12} className="text-slate-700" />
                Control room secure connection active.
              </div>
            </div>
          </form>

        </div>
        
        {/* Mobile footer copy */}
        <p className="absolute bottom-6 text-[9px] text-slate-700 font-bold uppercase tracking-widest text-center w-full block md:hidden px-4">
          Exercise Resolute Synergy 2026 &mdash; Ghana Armed Forces
        </p>
      </div>

    </div>
  )
}
