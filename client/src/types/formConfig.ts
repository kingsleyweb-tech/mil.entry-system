import type { PersonnelForm } from './personnel'

export type FieldConfig = {
  id: keyof PersonnelForm
  label: string
  placeholder: string
  enabled: boolean
  required: boolean
  order: number
}

export type OptionItem = {
  id: string
  name: string
  enabled: boolean
}

export type FormContentConfig = {
  title: string
  subtitle: string
  tagline: string
  description: string
  buttonText: string
  warningNoticeHeading: string
  warningNoticeText: string
  footerText: string
}

export type FormConfig = {
  formContent: FormContentConfig
  fields: Record<keyof PersonnelForm, FieldConfig>
  statusOptions: OptionItem[]
  armOfServiceOptions: OptionItem[]
  ranksByArm: Record<string, OptionItem[]>
  otherSettings?: {
    allowCustomRankForDCS?: boolean
  }
}

export const DEFAULT_FORM_CONFIG: FormConfig = {
  formContent: {
    title: 'Exercise Resolute Synergy 2026',
    subtitle: 'Personnel Registration',
    tagline: '"Enhancing Preparedness Through Joint Training"',
    description: 'Please fill in the form below to complete your registration.',
    buttonText: 'Submit Registration',
    warningNoticeHeading: 'Important',
    warningNoticeText:
      'Ensure all information provided is accurate. Incorrect information may affect your verification and SMS delivery at the entrance.',
    footerText: 'Exercise Resolute Synergy 2026 — Ghana Armed Forces',
  },
  fields: {
    fullName: {
      id: 'fullName',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      enabled: true,
      required: true,
      order: 1,
    },
    serviceNumber: {
      id: 'serviceNumber',
      label: 'Service Number',
      placeholder: 'Enter your service number',
      enabled: true,
      required: true,
      order: 2,
    },
    exerciseStatus: {
      id: 'exerciseStatus',
      label: 'Status',
      placeholder: 'Select Status',
      enabled: true,
      required: true,
      order: 3,
    },
    armOfService: {
      id: 'armOfService',
      label: 'Arm of Service',
      placeholder: 'Select Arm of Service',
      enabled: true,
      required: true,
      order: 4,
    },
    rank: {
      id: 'rank',
      label: 'Rank',
      placeholder: 'Select your rank',
      enabled: true,
      required: true,
      order: 5,
    },
    unit: {
      id: 'unit',
      label: 'Unit / Department',
      placeholder: 'Enter your unit / department',
      enabled: true,
      required: true,
      order: 6,
    },
    gender: {
      id: 'gender',
      label: 'Gender',
      placeholder: 'Select Gender',
      enabled: true,
      required: true,
      order: 7,
    },
    phone: {
      id: 'phone',
      label: 'Phone Number',
      placeholder: 'e.g. 024 123 4567',
      enabled: true,
      required: true,
      order: 8,
    },
    email: {
      id: 'email',
      label: 'Email Address',
      placeholder: 'e.g. name@domain.mil.gh',
      enabled: true,
      required: true,
      order: 9,
    },
    appointment: {
      id: 'appointment',
      label: 'Appointment / Position',
      placeholder: 'Enter your appointment or position',
      enabled: true,
      required: false,
      order: 10,
    },
    notes: {
      id: 'notes',
      label: 'Notes / Additional Details',
      placeholder: 'Enter any additional details',
      enabled: false,
      required: false,
      order: 11,
    },
  },
  statusOptions: [
    { id: 'status-1', name: 'Participant', enabled: true },
    { id: 'status-2', name: 'Evaluator', enabled: true },
    { id: 'status-3', name: 'General Headquarters', enabled: true },
    { id: 'status-4', name: 'Civilians', enabled: true },
  ],
  armOfServiceOptions: [
    { id: 'arm-1', name: 'Army', enabled: true },
    { id: 'arm-2', name: 'Navy', enabled: true },
    { id: 'arm-3', name: 'Air Force', enabled: true },
    { id: 'arm-4', name: 'DCS', enabled: true },
  ],
  ranksByArm: {
    Army: [
      { id: 'army-1', name: 'General of the Army (5-Star)', enabled: true },
      { id: 'army-2', name: 'General', enabled: true },
      { id: 'army-3', name: 'Lieutenant General', enabled: true },
      { id: 'army-4', name: 'Major General', enabled: true },
      { id: 'army-5', name: 'Brigadier General', enabled: true },
      { id: 'army-6', name: 'Brigadier', enabled: true },
      { id: 'army-7', name: 'Colonel', enabled: true },
      { id: 'army-8', name: 'Lieutenant Colonel', enabled: true },
      { id: 'army-9', name: 'Major', enabled: true },
      { id: 'army-10', name: 'Captain', enabled: true },
      { id: 'army-11', name: 'Lieutenant', enabled: true },
      { id: 'army-12', name: 'Second Lieutenant', enabled: true },
      { id: 'army-13', name: 'Regimental Sergeant Major (RSM)', enabled: true },
      { id: 'army-14', name: 'Warrant Officer Class I (WO1)', enabled: true },
      { id: 'army-15', name: 'Warrant Officer Class II (WO2)', enabled: true },
      { id: 'army-16', name: 'Staff Sergeant', enabled: true },
      { id: 'army-17', name: 'Sergeant', enabled: true },
      { id: 'army-18', name: 'Corporal', enabled: true },
      { id: 'army-19', name: 'Lance Corporal', enabled: true },
      { id: 'army-20', name: 'Private', enabled: true },
      { id: 'army-21', name: 'Recruit', enabled: true },
    ],
    Navy: [
      { id: 'navy-1', name: 'Admiral of the Fleet', enabled: true },
      { id: 'navy-2', name: 'Admiral', enabled: true },
      { id: 'navy-3', name: 'Vice Admiral', enabled: true },
      { id: 'navy-4', name: 'Rear Admiral', enabled: true },
      { id: 'navy-5', name: 'Commodore', enabled: true },
      { id: 'navy-6', name: 'Captain', enabled: true },
      { id: 'navy-7', name: 'Commander', enabled: true },
      { id: 'navy-8', name: 'Lieutenant Commander', enabled: true },
      { id: 'navy-9', name: 'Lieutenant', enabled: true },
      { id: 'navy-10', name: 'Sub Lieutenant', enabled: true },
      { id: 'navy-11', name: 'Acting Sub Lieutenant', enabled: true },
      { id: 'navy-12', name: 'Midshipman', enabled: true },
      { id: 'navy-13', name: 'Fleet Chief Petty Officer', enabled: true },
      { id: 'navy-14', name: 'Chief Petty Officer', enabled: true },
      { id: 'navy-15', name: 'Petty Officer', enabled: true },
      { id: 'navy-16', name: 'Leading Seaman', enabled: true },
      { id: 'navy-17', name: 'Able Seaman', enabled: true },
      { id: 'navy-18', name: 'Ordinary Seaman', enabled: true },
    ],
    'Air Force': [
      { id: 'af-1', name: 'Marshal of the Air Force', enabled: true },
      { id: 'af-2', name: 'Air Chief Marshal', enabled: true },
      { id: 'af-3', name: 'Air Marshal', enabled: true },
      { id: 'af-4', name: 'Air Vice Marshal', enabled: true },
      { id: 'af-5', name: 'Air Commodore', enabled: true },
      { id: 'af-6', name: 'Group Captain', enabled: true },
      { id: 'af-7', name: 'Wing Commander', enabled: true },
      { id: 'af-8', name: 'Squadron Leader', enabled: true },
      { id: 'af-9', name: 'Flight Lieutenant', enabled: true },
      { id: 'af-10', name: 'Flying Officer', enabled: true },
      { id: 'af-11', name: 'Pilot Officer', enabled: true },
      { id: 'af-12', name: 'Acting Pilot Officer', enabled: true },
      { id: 'af-13', name: 'Warrant Officer', enabled: true },
      { id: 'af-14', name: 'Flight Sergeant', enabled: true },
      { id: 'af-15', name: 'Sergeant', enabled: true },
      { id: 'af-16', name: 'Corporal', enabled: true },
      { id: 'af-17', name: 'Lance Corporal', enabled: true },
      { id: 'af-18', name: 'Aircraftman / Aircraftwoman', enabled: true },
    ],
    DCS: [
      { id: 'dcs-1', name: 'Director', enabled: true },
      { id: 'dcs-2', name: 'Deputy Director', enabled: true },
      { id: 'dcs-3', name: 'Assistant Director', enabled: true },
      { id: 'dcs-4', name: 'Principal Officer', enabled: true },
      { id: 'dcs-5', name: 'Senior Officer', enabled: true },
      { id: 'dcs-6', name: 'Officer', enabled: true },
    ],
  },
  otherSettings: {
    allowCustomRankForDCS: true,
  },
}
