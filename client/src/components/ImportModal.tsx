import { useState, useRef } from 'react'
import {
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileJson,
  AlertCircle,
} from 'lucide-react'
import { importPersonnel } from '../services/firebase'
import type { PersonnelExportFile, PersonnelExportRecord, ImportMode, ImportResult } from '../services/firebase'

type Phase =
  | { type: 'pick' }
  | { type: 'preview'; file: PersonnelExportFile }
  | { type: 'confirm'; file: PersonnelExportFile; mode: ImportMode }
  | { type: 'importing'; total: number; done: number }
  | { type: 'done'; result: ImportResult; total: number }
  | { type: 'error'; message: string }

export type ImportModalProps = {
  onClose: () => void
  onImported: () => void
}

export function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [phase, setPhase] = useState<Phase>({ type: 'pick' })
  const [mode, setMode] = useState<ImportMode>('skip')
  const [fileError, setFileError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ── File parsing ────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setFileError('Please select a .json file exported from this application.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string)

        // Basic structure validation
        if (
          typeof raw !== 'object' ||
          raw === null ||
          raw._exportVersion !== 1 ||
          raw._collection !== 'personnel' ||
          !Array.isArray(raw.records)
        ) {
          setFileError(
            'This file does not appear to be a valid personnel export from this application. ' +
            'Make sure you selected a file exported by the "Export Personnel Data" feature.',
          )
          return
        }

        const parsed = raw as PersonnelExportFile

        if (parsed.records.length === 0) {
          setFileError('The selected file contains no personnel records.')
          return
        }

        setPhase({ type: 'preview', file: parsed })
      } catch {
        setFileError('Failed to parse the file. Make sure it is a valid JSON file.')
      }
    }
    reader.readAsText(file)
  }

  // ── Import execution ────────────────────────────────────────────────────────

  const startImport = async (file: PersonnelExportFile, importMode: ImportMode) => {
    const records: PersonnelExportRecord[] = file.records
    setPhase({ type: 'importing', total: records.length, done: 0 })

    try {
      const result = await importPersonnel(records, importMode, (done, total) => {
        setPhase({ type: 'importing', total, done })
      })
      setPhase({ type: 'done', result, total: records.length })
      onImported()
    } catch (err) {
      setPhase({
        type: 'error',
        message: err instanceof Error ? err.message : 'Import failed. Please try again.',
      })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => {
          if (phase.type !== 'importing') onClose()
        }}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-[fadeInScale_0.2s_ease]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 border border-blue-200">
              <Upload size={16} className="text-blue-600" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900 tracking-tight">Import Personnel Data</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Restore from a previous export file
              </p>
            </div>
          </div>
          {phase.type !== 'importing' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {/* ── PHASE: pick ── */}
          {phase.type === 'pick' && (
            <div className="flex flex-col gap-5">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Select a <span className="font-black text-slate-900">.json</span> file previously
                exported from this application. All personnel records will be read from the file
                and imported into the currently connected Firestore project.
              </p>

              {/* File drop zone */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 transition duration-150 rounded-xl py-10 flex flex-col items-center gap-3 cursor-pointer group"
              >
                <FileJson size={32} className="text-slate-300 group-hover:text-blue-400 transition" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition">
                  Click to select export file
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  personnel-firestore-backup-*.json
                </span>
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />

              {fileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-semibold leading-normal">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
                  {fileError}
                </div>
              )}
            </div>
          )}

          {/* ── PHASE: preview ── */}
          {phase.type === 'preview' && (
            <div className="flex flex-col gap-5">
              {/* File summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Records found</span>
                  <span className="font-black text-slate-900">{phase.file.records.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Exported at</span>
                  <span className="font-bold text-slate-700">
                    {new Date(phase.file._exportedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Collection</span>
                  <span className="font-mono font-bold text-slate-700">{phase.file._collection}</span>
                </div>
              </div>

              {/* Duplicate mode */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  If a record already exists in Firestore…
                </p>
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${mode === 'skip' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="skip"
                    checked={mode === 'skip'}
                    onChange={() => setMode('skip')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">Skip existing records</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Only import records whose document ID does not already exist. Existing records are left untouched. <span className="font-bold text-emerald-700">(Recommended — safe default)</span>
                    </p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${mode === 'overwrite' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={mode === 'overwrite'}
                    onChange={() => setMode('overwrite')}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">Overwrite existing records</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Replace existing documents entirely. Use with caution — this cannot be undone.
                    </p>
                  </div>
                </label>
              </div>

              {mode === 'overwrite' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 flex items-start gap-2 text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                  Overwrite mode will permanently replace matching Firestore documents. Make sure you have a backup before proceeding.
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => { setPhase({ type: 'pick' }); setFileError(''); if (inputRef.current) inputRef.current.value = '' }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPhase({ type: 'confirm', file: phase.file, mode })}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Upload size={13} /> Continue
                </button>
              </div>
            </div>
          )}

          {/* ── PHASE: confirm ── */}
          {phase.type === 'confirm' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 shrink-0">
                  <AlertCircle size={18} className="text-amber-600" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-900">Ready to import</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    You are about to import{' '}
                    <span className="font-black text-slate-900">{phase.file.records.length.toLocaleString()} personnel records</span>{' '}
                    with mode{' '}
                    <span className={`font-black ${mode === 'skip' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {mode === 'skip' ? 'Skip existing' : 'Overwrite existing'}
                    </span>
                    . This will write data to your Firestore project. Are you sure?
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPhase({ type: 'preview', file: phase.file })}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => startImport(phase.file, phase.mode)}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Upload size={13} /> Begin Import
                </button>
              </div>
            </div>
          )}

          {/* ── PHASE: importing ── */}
          {phase.type === 'importing' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <Loader2 size={36} className="animate-spin text-blue-500" />
              <div className="text-center">
                <p className="text-sm font-black text-slate-900">Importing…</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {phase.done.toLocaleString()} of {phase.total.toLocaleString()} personnel processed
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                Do not close this window while import is in progress.
              </p>
            </div>
          )}

          {/* ── PHASE: done ── */}
          {phase.type === 'done' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.5} />
                <p className="text-base font-black text-slate-900">Import Complete</p>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <div className="flex justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Total processed</span>
                  <span className="font-black text-slate-900">{phase.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between px-4 py-3 border-b border-slate-100 bg-emerald-50">
                  <span className="text-emerald-700 font-semibold">Successfully imported</span>
                  <span className="font-black text-emerald-700">{phase.result.imported.toLocaleString()}</span>
                </div>
                <div className="flex justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Skipped (already exist)</span>
                  <span className="font-black text-slate-700">{phase.result.skipped.toLocaleString()}</span>
                </div>
                {phase.result.failed > 0 && (
                  <div className="flex justify-between px-4 py-3 bg-red-50">
                    <span className="text-red-700 font-semibold">Failed</span>
                    <span className="font-black text-red-700">{phase.result.failed.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {phase.result.errors.length > 0 && (
                <details className="text-[10px] text-red-600 font-semibold">
                  <summary className="cursor-pointer font-bold">View error details ({phase.result.errors.length})</summary>
                  <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {phase.result.errors.map((e, i) => (
                      <li key={i} className="bg-red-50 rounded px-2 py-1">{e}</li>
                    ))}
                  </ul>
                </details>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-700 transition cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>
          )}

          {/* ── PHASE: error ── */}
          {phase.type === 'error' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <XCircle size={40} className="text-red-500" strokeWidth={1.5} />
              <div>
                <p className="text-base font-black text-slate-900">Import Failed</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-xs mx-auto">
                  {phase.message}
                </p>
              </div>
              <div className="flex gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => setPhase({ type: 'pick' })}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-700 transition cursor-pointer active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
