import { useState } from 'react'
import { Link2, Copy, Check, ExternalLink } from 'lucide-react'
import { getBaseUrl } from '../utils/url'
import { useTheme } from '../context/ThemeContext'

interface RegistrationLinkBannerProps {
  className?: string
}

export function RegistrationLinkBanner({ className = '' }: RegistrationLinkBannerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [copied, setCopied] = useState(false)

  const registrationUrl = `${getBaseUrl()}/register`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch (err) {
      console.error('Failed to copy registration link:', err)
    }
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-sm ${
        isDark
          ? 'bg-gradient-to-r from-[#0D1527]/90 via-[#11192E] to-[#0A0A0C] border-blue-900/40 text-slate-100'
          : 'bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white border-blue-100 text-slate-900'
      } ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isDark
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-blue-600 text-white shadow-sm'
            }`}
          >
            <Link2 size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Public Registration Link</h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full tracking-wider ${
                  isDark
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                Active
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Share this URL or open it on public registration kiosks/tablets for incoming personnel.
            </p>
          </div>
        </div>

        {/* Right Input & Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono select-all overflow-x-auto max-w-full sm:max-w-xs border ${
              isDark
                ? 'bg-[#060A12] border-zinc-800 text-blue-300'
                : 'bg-white border-slate-200 text-blue-700 shadow-2xs'
            }`}
          >
            <span className="truncate">{registrationUrl}</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <a
            href={registrationUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              isDark
                ? 'bg-[#121215] border-zinc-800 text-slate-200 hover:bg-zinc-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <ExternalLink size={14} />
            <span>Open Link</span>
          </a>
        </div>
      </div>
    </div>
  )
}
