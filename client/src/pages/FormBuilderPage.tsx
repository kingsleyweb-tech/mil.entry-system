import { useState, useEffect } from 'react'
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Sliders,
  Type,
  ListOrdered,
  Layers,
  ShieldCheck,
  Check,
  AlertTriangle,
  Loader2,
  Send,
  Lock,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { subscribeToFormConfig, saveFormConfig, resetFormConfigToDefaults } from '../services/firebase'
import type { FormConfig, OptionItem } from '../types/formConfig'
import type { PersonnelForm } from '../types/personnel'
import gafLogo from '../assets/gaf.png'

type TabType = 'content' | 'fields' | 'arms_ranks' | 'status' | 'preview'

export function FormBuilderPage() {
  const [config, setConfig] = useState<FormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedArmTab, setSelectedArmTab] = useState('Army')
  
  // New option input states
  const [newStatusName, setNewStatusName] = useState('')
  const [newArmName, setNewArmName] = useState('')
  const [newRankName, setNewRankName] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToFormConfig((fetched) => {
      setConfig(fetched)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading || !config) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <Loader2 size={36} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading Form Builder configuration…</p>
      </div>
    )
  }

  // ── Save action ──
  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setErrorMsg('')
    setSaveSuccess(false)
    try {
      await saveFormConfig(config)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      console.error('Failed to save form config:', err)
      setErrorMsg('Failed to save configuration. Please check your network and Firebase permissions.')
    } finally {
      setSaving(false)
    }
  }

  // ── Reset action ──
  const handleConfirmReset = async () => {
    if (resetting) return
    setResetting(true)
    setErrorMsg('')
    setShowResetModal(false)
    try {
      await resetFormConfigToDefaults()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      console.error('Failed to reset form config:', err)
      setErrorMsg('Failed to reset configuration.')
    } finally {
      setResetting(false)
    }
  }

  // ── Helper state updaters ──
  const updateContent = (key: keyof FormConfig['formContent'], val: string) => {
    setConfig((prev) => prev ? {
      ...prev,
      formContent: {
        ...prev.formContent,
        [key]: val,
      },
    } : prev)
  }

  const updateFieldSetting = (
    fieldKey: keyof PersonnelForm,
    property: 'label' | 'placeholder' | 'enabled' | 'required',
    val: string | boolean
  ) => {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [fieldKey]: {
            ...prev.fields[fieldKey],
            [property]: val,
          },
        },
      }
    })
  }

  const moveFieldOrder = (fieldKey: keyof PersonnelForm, direction: 'up' | 'down') => {
    setConfig((prev) => {
      if (!prev) return prev
      const fieldsList = Object.values(prev.fields).sort((a, b) => a.order - b.order)
      const index = fieldsList.findIndex((f) => f.id === fieldKey)
      if (index === -1) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= fieldsList.length) return prev

      // Swap orders
      const currentOrder = fieldsList[index].order
      const targetOrder = fieldsList[targetIndex].order

      const updatedFields = { ...prev.fields }
      updatedFields[fieldsList[index].id].order = targetOrder
      updatedFields[fieldsList[targetIndex].id].order = currentOrder

      return {
        ...prev,
        fields: updatedFields,
      }
    })
  }

  // ── Status Options actions ──
  const addStatusOption = () => {
    if (!newStatusName.trim()) return
    const newItem: OptionItem = {
      id: `status-${Date.now()}`,
      name: newStatusName.trim(),
      enabled: true,
    }
    setConfig((prev) => prev ? {
      ...prev,
      statusOptions: [...prev.statusOptions, newItem],
    } : prev)
    setNewStatusName('')
  }

  const updateStatusOption = (id: string, property: 'name' | 'enabled', val: string | boolean) => {
    setConfig((prev) => prev ? {
      ...prev,
      statusOptions: prev.statusOptions.map((opt) =>
        opt.id === id ? { ...opt, [property]: val } : opt
      ),
    } : prev)
  }

  const removeStatusOption = (id: string) => {
    setConfig((prev) => prev ? {
      ...prev,
      statusOptions: prev.statusOptions.filter((opt) => opt.id !== id),
    } : prev)
  }

  const moveStatusOption = (index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      if (!prev) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.statusOptions.length) return prev
      const list = [...prev.statusOptions]
      const [moved] = list.splice(index, 1)
      list.splice(targetIndex, 0, moved)
      return { ...prev, statusOptions: list }
    })
  }

  // ── Arm of Service actions ──
  const addArmOption = () => {
    if (!newArmName.trim()) return
    const name = newArmName.trim()
    const newItem: OptionItem = {
      id: `arm-${Date.now()}`,
      name,
      enabled: true,
    }
    setConfig((prev) => {
      if (!prev) return prev
      const existingRanks = prev.ranksByArm[name] || []
      return {
        ...prev,
        armOfServiceOptions: [...prev.armOfServiceOptions, newItem],
        ranksByArm: {
          ...prev.ranksByArm,
          [name]: existingRanks,
        },
      }
    })
    setNewArmName('')
  }

  const updateArmOption = (id: string, property: 'name' | 'enabled', val: string | boolean) => {
    setConfig((prev) => {
      if (!prev) return prev
      const oldArm = prev.armOfServiceOptions.find((a) => a.id === id)
      const updatedArms = prev.armOfServiceOptions.map((opt) =>
        opt.id === id ? { ...opt, [property]: val } : opt
      )
      if (property === 'name' && oldArm && typeof val === 'string' && val.trim()) {
        const ranks = prev.ranksByArm[oldArm.name] || []
        const newRanksByArm = { ...prev.ranksByArm }
        delete newRanksByArm[oldArm.name]
        newRanksByArm[val.trim()] = ranks
        if (selectedArmTab === oldArm.name) setSelectedArmTab(val.trim())
        return {
          ...prev,
          armOfServiceOptions: updatedArms,
          ranksByArm: newRanksByArm,
        }
      }
      return {
        ...prev,
        armOfServiceOptions: updatedArms,
      }
    })
  }

  const removeArmOption = (id: string) => {
    setConfig((prev) => {
      if (!prev) return prev
      const oldArm = prev.armOfServiceOptions.find((a) => a.id === id)
      const filtered = prev.armOfServiceOptions.filter((opt) => opt.id !== id)
      const newRanksByArm = { ...prev.ranksByArm }
      if (oldArm) delete newRanksByArm[oldArm.name]
      return {
        ...prev,
        armOfServiceOptions: filtered,
        ranksByArm: newRanksByArm,
      }
    })
  }

  const moveArmOption = (index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      if (!prev) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.armOfServiceOptions.length) return prev
      const list = [...prev.armOfServiceOptions]
      const [moved] = list.splice(index, 1)
      list.splice(targetIndex, 0, moved)
      return { ...prev, armOfServiceOptions: list }
    })
  }

  // ── Rank Options actions ──
  const addRankOption = (armName: string) => {
    if (!newRankName.trim()) return
    const newItem: OptionItem = {
      id: `rank-${Date.now()}`,
      name: newRankName.trim(),
      enabled: true,
    }
    setConfig((prev) => {
      if (!prev) return prev
      const currentRanks = prev.ranksByArm[armName] || []
      return {
        ...prev,
        ranksByArm: {
          ...prev.ranksByArm,
          [armName]: [...currentRanks, newItem],
        },
      }
    })
    setNewRankName('')
  }

  const updateRankOption = (armName: string, id: string, property: 'name' | 'enabled', val: string | boolean) => {
    setConfig((prev) => {
      if (!prev) return prev
      const currentRanks = prev.ranksByArm[armName] || []
      const updated = currentRanks.map((opt) =>
        opt.id === id ? { ...opt, [property]: val } : opt
      )
      return {
        ...prev,
        ranksByArm: {
          ...prev.ranksByArm,
          [armName]: updated,
        },
      }
    })
  }

  const removeRankOption = (armName: string, id: string) => {
    setConfig((prev) => {
      if (!prev) return prev
      const currentRanks = prev.ranksByArm[armName] || []
      return {
        ...prev,
        ranksByArm: {
          ...prev.ranksByArm,
          [armName]: currentRanks.filter((opt) => opt.id !== id),
        },
      }
    })
  }

  const moveRankOption = (armName: string, index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      if (!prev) return prev
      const currentRanks = prev.ranksByArm[armName] || []
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= currentRanks.length) return prev
      const list = [...currentRanks]
      const [moved] = list.splice(index, 1)
      list.splice(targetIndex, 0, moved)
      return {
        ...prev,
        ranksByArm: {
          ...prev.ranksByArm,
          [armName]: list,
        },
      }
    })
  }

  const sortedFieldsList = Object.values(config.fields).sort((a, b) => a.order - b.order)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ── Page Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sliders size={22} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Form Builder</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            Control the content, fields, options, and live appearance of the public registration form.
          </p>
        </div>

        {/* Global Control Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={saving || resetting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={14} className="text-slate-400" />
            <span>RESET TO DEFAULTS</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || resetting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143224] text-white text-xs font-extrabold transition shadow-md cursor-pointer disabled:opacity-50 uppercase tracking-wider"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>SAVE CHANGES</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl p-4 flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-emerald-500" />
            <span>Changes saved successfully! Public registration form has been updated.</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-xl p-4 flex items-center gap-2.5 text-xs font-bold">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Main Layout: Tabs + Content + Live Preview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Editor Controls (8 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
            <TabBtn
              active={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
              icon={<Type size={15} />}
              label="Form Content"
            />
            <TabBtn
              active={activeTab === 'fields'}
              onClick={() => setActiveTab('fields')}
              icon={<ListOrdered size={15} />}
              label="Fields"
            />
            <TabBtn
              active={activeTab === 'arms_ranks'}
              onClick={() => setActiveTab('arms_ranks')}
              icon={<Layers size={15} />}
              label="Arm & Ranks"
            />
            <TabBtn
              active={activeTab === 'status'}
              onClick={() => setActiveTab('status')}
              icon={<ShieldCheck size={15} />}
              label="Status Options"
            />
            <TabBtn
              active={activeTab === 'preview'}
              onClick={() => setActiveTab('preview')}
              icon={<Eye size={15} />}
              label="Mobile Preview"
              extraClass="lg:hidden"
            />
          </div>

          {/* ── TAB 1: FORM CONTENT ── */}
          {activeTab === 'content' && (
            <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Type size={16} className="text-emerald-500" />
                  1. Form Titles & Content Messages
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the headers, instructions, notice text, and footer displayed on the registration form.
                </p>
              </div>

              <div className="space-y-4">
                {/* Logo Management */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-emerald-500" />
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Header Logo Image
                      </label>
                    </div>
                    {config.formContent.logoUrl && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Custom Logo Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                    {/* Logo Preview Box */}
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex items-center justify-center p-2 shrink-0 shadow-inner">
                      <img
                        src={config.formContent.logoUrl || gafLogo}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Upload your custom organization or exercise logo. Supported formats: PNG, SVG, JPG, WebP (Max 2MB).
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95">
                          <Upload size={14} />
                          <span>Upload New Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              if (file.size > 2 * 1024 * 1024) {
                                setErrorMsg('Image file size is too large. Please select an image under 2MB.')
                                return
                              }
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  updateContent('logoUrl', ev.target.result as string)
                                }
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>

                        {config.formContent.logoUrl && (
                          <button
                            type="button"
                            onClick={() => updateContent('logoUrl', '')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-bold transition cursor-pointer active:scale-95"
                          >
                            <Trash2 size={14} />
                            <span>Remove Custom Logo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <InputGroup
                  label="Form Main Title"
                  value={config.formContent.title}
                  onChange={(v) => updateContent('title', v)}
                  placeholder="e.g. Exercise Resolute Synergy 2026"
                />

                <InputGroup
                  label="Form Subtitle"
                  value={config.formContent.subtitle}
                  onChange={(v) => updateContent('subtitle', v)}
                  placeholder="e.g. Personnel Registration"
                />

                <InputGroup
                  label="Tagline / Motto"
                  value={config.formContent.tagline}
                  onChange={(v) => updateContent('tagline', v)}
                  placeholder='e.g. "Enhancing Preparedness Through Joint Training"'
                />

                <TextareaGroup
                  label="Description / Instructions"
                  value={config.formContent.description}
                  onChange={(v) => updateContent('description', v)}
                  placeholder="e.g. Please fill in the form below to complete your registration."
                />

                <InputGroup
                  label="Submit Button Text"
                  value={config.formContent.buttonText}
                  onChange={(v) => updateContent('buttonText', v)}
                  placeholder="e.g. Submit Registration"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <InputGroup
                    label="Notice Box Heading"
                    value={config.formContent.warningNoticeHeading}
                    onChange={(v) => updateContent('warningNoticeHeading', v)}
                    placeholder="e.g. Important"
                  />
                  <TextareaGroup
                    label="Notice Box Message"
                    value={config.formContent.warningNoticeText}
                    onChange={(v) => updateContent('warningNoticeText', v)}
                    placeholder="Notice explanation..."
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <InputGroup
                    label="Footer Text"
                    value={config.formContent.footerText}
                    onChange={(v) => updateContent('footerText', v)}
                    placeholder="e.g. Exercise Resolute Synergy 2026 — Ghana Armed Forces"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: PERSONAL & REGISTRATION FIELDS ── */}
          {activeTab === 'fields' && (
            <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ListOrdered size={16} className="text-emerald-500" />
                  2. Registration Form Fields
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure labels, placeholders, required state, enabled state, and field ordering.
                </p>
              </div>

              <div className="space-y-3">
                {sortedFieldsList.map((field, idx) => (
                  <div
                    key={field.id}
                    className={`p-4 rounded-xl border transition-all ${
                      field.enabled
                        ? 'bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800'
                        : 'bg-slate-100/40 dark:bg-zinc-900/20 border-slate-200/60 dark:border-zinc-800/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          {field.id}
                        </span>
                        {field.required && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 uppercase">
                            Required
                          </span>
                        )}
                      </div>

                      {/* Controls: Enabled toggle & Order up/down */}
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={(e) => updateFieldSetting(field.id, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Enabled</span>
                        </label>

                        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-zinc-800 pl-2 ml-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveFieldOrder(field.id, 'up')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedFieldsList.length - 1}
                            onClick={() => moveFieldOrder(field.id, 'down')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Editable inputs */}
                    {field.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                            Field Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateFieldSetting(field.id, 'label', e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                            Placeholder Text
                          </label>
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(e) => updateFieldSetting(field.id, 'placeholder', e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateFieldSetting(field.id, 'required', e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>Require user to fill this field</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 3: ARM OF SERVICE & RANKS ── */}
          {activeTab === 'arms_ranks' && (
            <div className="space-y-6">
              
              {/* Arm of Service Options */}
              <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Layers size={16} className="text-emerald-500" />
                    3. Arm of Service Options
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage service arms (Army, Navy, Air Force, DCS, etc.).
                    <span className="font-semibold text-amber-500 ml-1">
                      (Note: General Headquarters and Civilians are kept separate in the Status section).
                    </span>
                  </p>
                </div>

                {/* Add new Arm of Service */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter new Arm of Service (e.g. Marines)"
                    value={newArmName}
                    onChange={(e) => setNewArmName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addArmOption()}
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={addArmOption}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>

                {/* List of Arms */}
                <div className="space-y-2 pt-2">
                  {config.armOfServiceOptions.map((arm, idx) => (
                    <div
                      key={arm.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50"
                    >
                      <input
                        type="text"
                        value={arm.name}
                        onChange={(e) => updateArmOption(arm.id, 'name', e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                      />

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={arm.enabled}
                          onChange={(e) => updateArmOption(arm.id, 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Enabled</span>
                      </label>

                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-zinc-800 pl-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveArmOption(idx, 'up')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === config.armOfServiceOptions.length - 1}
                          onClick={() => moveArmOption(idx, 'down')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeArmOption(arm.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ranks Management per Arm */}
              <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ListOrdered size={16} className="text-emerald-500" />
                    4. Rank Options Per Arm
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize rank options for each service arm. E.g. edit "King" to "Kingsley".
                  </p>
                </div>

                {/* Service Arm Selector Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-zinc-800">
                  {config.armOfServiceOptions.map((arm) => (
                    <button
                      key={arm.id}
                      type="button"
                      onClick={() => setSelectedArmTab(arm.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        selectedArmTab === arm.name
                          ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {arm.name} ({(config.ranksByArm[arm.name] || []).length})
                    </button>
                  ))}
                </div>

                {/* Add new rank to active arm */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder={`Add new rank under ${selectedArmTab}`}
                    value={newRankName}
                    onChange={(e) => setNewRankName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRankOption(selectedArmTab)}
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => addRankOption(selectedArmTab)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Rank</span>
                  </button>
                </div>

                {/* Rank list for active arm */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 pt-2">
                  {(config.ranksByArm[selectedArmTab] || []).map((rankItem, idx, array) => (
                    <div
                      key={rankItem.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50"
                    >
                      <span className="text-[10px] font-bold text-slate-400 w-6 text-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={rankItem.name}
                        onChange={(e) =>
                          updateRankOption(selectedArmTab, rankItem.id, 'name', e.target.value)
                        }
                        className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1 text-xs text-slate-800 dark:text-slate-100 font-semibold"
                      />

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={rankItem.enabled}
                          onChange={(e) =>
                            updateRankOption(selectedArmTab, rankItem.id, 'enabled', e.target.checked)
                          }
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Enabled</span>
                      </label>

                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-zinc-800 pl-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveRankOption(selectedArmTab, idx, 'up')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === array.length - 1}
                          onClick={() => moveRankOption(selectedArmTab, idx, 'down')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRankOption(selectedArmTab, rankItem.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer ml-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!config.ranksByArm[selectedArmTab] || config.ranksByArm[selectedArmTab].length === 0) && (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      No ranks configured for {selectedArmTab}. Click "Add Rank" above to create one.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── TAB 4: STATUS OPTIONS ── */}
          {activeTab === 'status' && (
            <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  5. Status Options
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage Status options displayed on registration (e.g. Participant, Evaluator, General Headquarters, Civilians).
                </p>
              </div>

              {/* Add new Status option */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter new Status (e.g. Special Guest)"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addStatusOption()}
                  className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={addStatusOption}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Status</span>
                </button>
              </div>

              {/* List of Status options */}
              <div className="space-y-2 pt-2">
                {config.statusOptions.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50"
                  >
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => updateStatusOption(opt.id, 'name', e.target.value)}
                      className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={(e) => updateStatusOption(opt.id, 'enabled', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Enabled</span>
                    </label>

                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-zinc-800 pl-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveStatusOption(idx, 'up')}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === config.statusOptions.length - 1}
                        onClick={() => moveStatusOption(idx, 'down')}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStatusOption(opt.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 5: MOBILE PREVIEW (Only visible on mobile when activeTab === 'preview') ── */}
          {activeTab === 'preview' && (
            <div className="lg:hidden">
              <RegistrationFormPreview config={config} />
            </div>
          )}

        </div>

        {/* Right Column: Live Interactive Preview Panel (5 cols on desktop, sticky) */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Live Registration Form Preview
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Real-time Sync
              </span>
            </div>

            {/* Frame container */}
            <div className="bg-slate-900 rounded-3xl p-3 shadow-2xl border border-slate-800 max-h-[85vh] overflow-y-auto">
              <RegistrationFormPreview config={config} />
            </div>
          </div>
        </div>

      </div>

      {/* ── RESET CONFIRMATION MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Reset registration form?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  This will restore the original form titles, fields, status options, and military ranks back to default system settings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                {resetting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset to Defaults</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Helper UI components ──

function TabBtn({
  active, onClick, icon, label, extraClass = ''
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  extraClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${extraClass} ${
        active
          ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function InputGroup({
  label, value, onChange, placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}

function TextareaGroup({
  label, value, onChange, placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
        {label}
      </label>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}

// ── Live Registration Form Preview Component ──

function RegistrationFormPreview({ config }: { config: FormConfig }) {
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedArm, setSelectedArm] = useState<string>('')
  const [selectedRank, setSelectedRank] = useState<string>('')

  const enabledFields = Object.values(config.fields)
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order)

  const enabledStatusOptions = config.statusOptions.filter((o) => o.enabled)
  const enabledArmOptions = config.armOfServiceOptions.filter((o) => o.enabled)
  const availableRanks = selectedArm && config.ranksByArm[selectedArm]
    ? config.ranksByArm[selectedArm].filter((r) => r.enabled)
    : []

  return (
    <div className="bg-slate-50 text-slate-900 font-sans p-4 rounded-2xl shadow-inner text-left max-w-md mx-auto">
      
      {/* Header */}
      <div className="text-center mb-6">
        <img src={config.formContent.logoUrl || gafLogo} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2" />
        <span className="text-[8px] tracking-[0.2em] font-black text-slate-400 uppercase block leading-none">
          EXERCISE
        </span>
        <h2 className="text-slate-800 font-black text-base uppercase tracking-wide leading-tight mt-0.5">
          {config.formContent.title || 'Exercise Title'}
        </h2>
        <span className="text-[8px] tracking-[0.15em] font-bold text-slate-400 uppercase block mt-0.5">
          {config.formContent.subtitle || 'Personnel Registration'}
        </span>
        {config.formContent.tagline && (
          <span className="text-[9px] italic text-emerald-600 font-semibold mt-1 block">
            {config.formContent.tagline}
          </span>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
        
        <div className="text-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">Registration Form</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {config.formContent.description || 'Please fill in the form below to complete your registration.'}
          </p>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-3.5">
          {enabledFields.map((field) => {
            if (field.id === 'exerciseStatus') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {enabledStatusOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(opt.name)
                          if (opt.name === 'Civilians') {
                            setSelectedArm('')
                            setSelectedRank('')
                          }
                        }}
                        className={`p-2 rounded-lg border text-[11px] font-bold text-center transition ${
                          selectedStatus === opt.name
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }

            if (field.id === 'armOfService') {
              if (selectedStatus === 'Civilians') return null
              return (
                <div key={field.id} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {enabledArmOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedArm(opt.name)
                          setSelectedRank('')
                        }}
                        className={`p-2 rounded-lg border text-[11px] font-bold text-center transition ${
                          selectedArm === opt.name
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }

            if (field.id === 'rank') {
              if (selectedStatus === 'Civilians' || !selectedArm) return null
              return (
                <div key={field.id} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {selectedArm === 'DCS' && config.otherSettings?.allowCustomRankForDCS ? (
                    <input
                      type="text"
                      placeholder={field.placeholder || 'Enter your rank'}
                      value={selectedRank}
                      onChange={(e) => setSelectedRank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={selectedRank}
                      onChange={(e) => setSelectedRank(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                    >
                      <option value="">Select your rank ({selectedArm})</option>
                      {availableRanks.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            }

            // Standard input field preview
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                  {!field.required && <span className="text-slate-400 text-[9px]">(Optional)</span>}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 cursor-not-allowed opacity-80"
                />
              </div>
            )
          })}
        </div>

        {/* Notice Box */}
        {config.formContent.warningNoticeText && (
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start gap-2.5 mt-2">
            <div className="bg-[#0f2d1d] text-emerald-400 p-1.5 rounded-lg shrink-0">
              <ShieldCheck size={14} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[10px]">
                {config.formContent.warningNoticeHeading || 'Important'}
              </h4>
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                {config.formContent.warningNoticeText}
              </p>
            </div>
          </div>
        )}

        {/* Submit Button Preview */}
        <div className="pt-2">
          <button
            type="button"
            className="w-full bg-[#1b4332] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm cursor-pointer"
          >
            <Send size={13} className="-rotate-12" />
            <span>{config.formContent.buttonText || 'Submit Registration'}</span>
          </button>
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[9px] mt-2.5 font-bold">
            <Lock size={10} className="text-slate-300" />
            Your information is secure and protected.
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-4">
        {config.formContent.footerText || 'Exercise Resolute Synergy 2026 — Ghana Armed Forces'}
      </footer>

    </div>
  )
}
