export interface ContactTag {
  label: string
  color: string
}

export interface CRMContact {
  id: string
  company: string
  logo_initials: string
  logo_color: string
  contact: string | undefined
  phone: string | undefined
  email: string | undefined
  website: string | undefined
  pipeline_stage: string
  service: string | undefined
  deal_value: number | undefined
  description: string | undefined
  location: string | undefined
  tags: ContactTag[]
  sort_order: number
  created_at: string
  // Onboarding form fields
  business_address: string | undefined
  job_position: string | undefined
  billing_email: string | undefined
  has_branding_assets: string | undefined
  branding_assets_url: string | undefined
  service_agreement_signed: boolean
  service_agreement_signed_at: string | undefined
}

export const PIPELINE_STAGES = [
  { stage: 'New Lead',              color: '#8888AA' },
  { stage: 'Strategy Call Booked', color: '#6366F1' },
  { stage: 'Call No Show',         color: '#F59E0B' },
  { stage: 'Deal Pending',         color: '#FF8C00' },
  { stage: 'Did Not Close',        color: '#FF4533' },
  { stage: 'Onboarding',           color: '#818CF8' },
  { stage: 'Onboarded',            color: '#10B981' },
] as const

export type PipelineStage = typeof PIPELINE_STAGES[number]['stage']
