import { createClient } from '@/lib/supabase/client'
import type { CRMContact, ContactTag, PipelineStage } from '@/types/crm'

function deriveInitials(company: string): string {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function mapRow(row: Record<string, unknown>): CRMContact {
  return {
    id: row.id as string,
    company: row.company as string,
    logo_initials: (row.logo_initials as string | null) ?? deriveInitials(row.company as string),
    logo_color: (row.logo_color as string | null) ?? '#6366F1',
    contact: (row.contact as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    email: (row.email as string | null) ?? undefined,
    website: (row.website as string | null) ?? undefined,
    pipeline_stage: (row.pipeline_stage as string | null) ?? "",
    service: (row.service as string | null) ?? undefined,
    deal_value: (row.deal_value as number | null) ?? undefined,
    description: (row.description as string | null) ?? undefined,
    location: (row.location as string | null) ?? undefined,
    tags: (row.tags as ContactTag[] | null) ?? [],
    created_at: row.created_at as string,
  }
}

export async function getCRMContacts(): Promise<CRMContact[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('id, company, logo_initials, logo_color, contact, phone, email, website, pipeline_stage, service, deal_value, description, location, tags, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function createCRMContact(input: {
  company: string
  logo_color?: string
  contact?: string
  phone?: string
  email?: string
  website?: string
  pipeline_stage?: string
  service?: string
  deal_value?: number
  description?: string
  location?: string
  tags?: ContactTag[]
}): Promise<CRMContact> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({
      company: input.company,
      logo_initials: deriveInitials(input.company),
      logo_color: input.logo_color ?? '#6366F1',
      contact: input.contact ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      pipeline_stage: input.pipeline_stage ?? "",
      service: input.service ?? null,
      deal_value: input.deal_value ?? null,
      description: input.description ?? null,
      location: input.location ?? null,
      tags: input.tags ?? [],
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

export async function updateCRMContact(
  id: string,
  patch: Partial<Omit<CRMContact, 'id' | 'created_at'>>
): Promise<CRMContact> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('crm_contacts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

export async function deleteCRMContact(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('crm_contacts').delete().eq('id', id)
  if (error) throw error
}

export async function moveCRMContactStage(id: string, pipeline_stage: PipelineStage): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('crm_contacts')
    .update({ pipeline_stage })
    .eq('id', id)
  if (error) throw error
}
