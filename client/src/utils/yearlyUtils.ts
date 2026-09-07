import type { Personnel } from '../types/personnel'

export function getPersonnelYear(p: Personnel): number {
  if (p.registrationYear && typeof p.registrationYear === 'number') {
    return p.registrationYear
  }
  if (p.registeredAt) {
    const parsedYear = new Date(p.registeredAt).getFullYear()
    if (!isNaN(parsedYear) && parsedYear >= 2000) {
      return parsedYear
    }
  }
  return 2026 // Default fallback year
}

export function groupPersonnelByYear(personnel: Personnel[]): Record<number, Personnel[]> {
  const grouped: Record<number, Personnel[]> = {}

  personnel.forEach((p) => {
    const yr = getPersonnelYear(p)
    if (!grouped[yr]) {
      grouped[yr] = []
    }
    grouped[yr].push(p)
  })

  // Ensure default current years exist if empty
  const currentYr = new Date().getFullYear()
  if (!grouped[2026]) grouped[2026] = []
  if (!grouped[currentYr]) grouped[currentYr] = []

  return grouped
}

/**
 * Returns a unique key for cross-matching individuals across years.
 * Uses serviceNumber for Military/DCS, and idCardNumber or phone/fullName for Civilians.
 */
export function getUniqueKey(p: Personnel): string {
  if (p.serviceNumber && p.serviceNumber.trim()) {
    return `SVC_${p.serviceNumber.trim().toUpperCase()}`
  }
  if (p.idCardNumber && p.idCardNumber.trim()) {
    return `ID_${p.idCardNumber.trim().toUpperCase()}`
  }
  if (p.phone && p.phone.trim()) {
    return `TEL_${p.phone.trim().replace(/\s+/g, '')}`
  }
  return `NAME_${p.fullName.trim().toUpperCase()}`
}

export interface YearComparisonResult {
  baseYear: number
  targetYear: number
  baseYearPersonnel: Personnel[]
  targetYearPersonnel: Personnel[]
  registeredInTargetOnly: Personnel[] // Registered in targetYear (e.g. 2027) but NOT in baseYear (2026)
  registeredInBaseOnly: Personnel[]   // Registered in baseYear (e.g. 2026) but NOT in targetYear (2027)
  registeredInBoth: Personnel[]       // Registered in BOTH baseYear and targetYear
}

export function compareYears(
  personnel: Personnel[],
  baseYear: number,
  targetYear: number
): YearComparisonResult {
  const grouped = groupPersonnelByYear(personnel)
  const baseList = grouped[baseYear] || []
  const targetList = grouped[targetYear] || []

  const baseMap = new Map<string, Personnel>()
  baseList.forEach((p) => {
    baseMap.set(getUniqueKey(p), p)
  })

  const targetMap = new Map<string, Personnel>()
  targetList.forEach((p) => {
    targetMap.set(getUniqueKey(p), p)
  })

  const registeredInTargetOnly: Personnel[] = []
  const registeredInBoth: Personnel[] = []

  targetList.forEach((p) => {
    const key = getUniqueKey(p)
    if (baseMap.has(key)) {
      registeredInBoth.push(p)
    } else {
      registeredInTargetOnly.push(p)
    }
  })

  const registeredInBaseOnly: Personnel[] = []
  baseList.forEach((p) => {
    const key = getUniqueKey(p)
    if (!targetMap.has(key)) {
      registeredInBaseOnly.push(p)
    }
  })

  return {
    baseYear,
    targetYear,
    baseYearPersonnel: baseList,
    targetYearPersonnel: targetList,
    registeredInTargetOnly,
    registeredInBaseOnly,
    registeredInBoth,
  }
}

export function exportPersonnelCSV(personnelList: Personnel[], filename: string) {
  if (!personnelList.length) return

  const headers = [
    'Service / ID Number',
    'Full Name',
    'Rank / Title',
    'Arm of Service / Category',
    'Unit',
    'Phone',
    'Status',
    'Registration Date',
    'Registration Year',
  ]

  const rows = personnelList.map((p) => [
    `"${(p.serviceNumber || p.idCardNumber || 'N/A').replace(/"/g, '""')}"`,
    `"${(p.fullName || '').replace(/"/g, '""')}"`,
    `"${(p.rank || '').replace(/"/g, '""')}"`,
    `"${(p.exerciseStatus === 'Civilians' ? 'Civilians' : p.armOfService || 'N/A').replace(/"/g, '""')}"`,
    `"${(p.unit || '').replace(/"/g, '""')}"`,
    `"${(p.phone || '').replace(/"/g, '""')}"`,
    `"${(p.status || '').replace(/"/g, '""')}"`,
    `"${(p.registeredAt ? new Date(p.registeredAt).toLocaleString() : 'N/A').replace(/"/g, '""')}"`,
    `"${getPersonnelYear(p)}"`,
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
