import { createClient } from '@/lib/supabase/client'
import type { List, Task, Subtask, Profile, ListStage } from '@/types/tasks'

export function formatMinutes(minutes: number | undefined | null): string {
  if (!minutes || minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}hr`
  return `${h}hr ${m}min`
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getProfiles(): Promise<Profile[]> {
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('*').order('full_name', { ascending: true })
  return (data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? undefined,
    email: p.email ?? '',
    avatar_url: p.avatar_url ?? undefined,
  }))
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export async function getLists(): Promise<List[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*, tasks(id, status, priority, time_estimate_minutes, assignee_id)')
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  if (error) throw error

  const listRows = data ?? []
  const profileIds = Array.from(
    new Set(
      listRows.flatMap((list) => [
        list.assignee_id,
        ...((list.tasks ?? []).map((task: { assignee_id: string | null }) => task.assignee_id)),
      ]).filter(Boolean)
    )
  ) as string[]

  let profileMap: Record<string, Profile> = {}
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', profileIds)

    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [
        p.id,
        {
          id: p.id,
          full_name: p.full_name ?? undefined,
          email: p.email ?? '',
          avatar_url: p.avatar_url ?? undefined,
        },
      ])
    )
  }

  return listRows.map((l) => {
    const tasks: { status: string; priority: string; time_estimate_minutes: number | null; assignee_id: string | null }[] = l.tasks ?? []
    const pending = tasks.filter((t) => t.status !== 'done').length
    const estimate = tasks
      .filter((t) => t.status !== 'done')
      .reduce((sum, t) => sum + (t.time_estimate_minutes ?? 0), 0)
    const hasHighPriority = tasks.some((t) => t.priority === 'high' && t.status !== 'done')
    const seen = new Set<string>()
    const members = tasks
      .map((task) => task.assignee_id)
      .filter((assigneeId): assigneeId is string => {
        if (!assigneeId || seen.has(assigneeId)) return false
        seen.add(assigneeId)
        return true
      })
      .map((assigneeId) => profileMap[assigneeId])
      .filter((profile): profile is Profile => Boolean(profile))

    return {
      id: l.id,
      name: l.name,
      color: l.color ?? undefined,
      assignee_id: l.assignee_id ?? undefined,
      assignee: l.assignee_id ? profileMap[l.assignee_id] : undefined,
      icon_url: l.icon_url ?? undefined,
      stage: (l.stage ?? 'pre_production') as ListStage,
      client_name: l.client_name ?? undefined,
      client_contact_id: l.client_contact_id ?? undefined,
      is_archived: l.is_archived,
      created_at: l.created_at,
      total_task_count: tasks.length,
      pending_task_count: pending,
      total_estimate_minutes: estimate,
      has_high_priority: hasHighPriority,
      members,
      member_count: members.length,
    }
  })
}

export async function createList(data: {
  name: string
  color?: string
  assignee_id?: string
  client_contact_id?: number
  client_name?: string
  icon_url?: string
  stage?: ListStage
}): Promise<List> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: list, error } = await supabase
    .from('lists')
    .insert({
      name: data.name,
      color: data.color,
      assignee_id: data.assignee_id,
      client_contact_id: data.client_contact_id,
      client_name: data.client_name,
      icon_url: data.icon_url,
      stage: data.stage ?? 'pre_production',
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error

  return {
    ...list,
    stage: list.stage as ListStage,
    assignee_id: list.assignee_id ?? undefined,
    total_task_count: 0,
    pending_task_count: 0,
    total_estimate_minutes: 0,
    has_high_priority: false,
    assignee: undefined,
    members: [],
    member_count: 0,
  }
}

export async function updateList(
  id: string,
  patch: Partial<Pick<List, 'name' | 'color' | 'stage' | 'assignee_id' | 'client_contact_id' | 'client_name'>>
): Promise<List> {
  const supabase = createClient()
  const { data: list, error } = await supabase
    .from('lists')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return {
    ...list,
    stage: list.stage as ListStage,
    assignee_id: list.assignee_id ?? undefined,
    total_task_count: 0,
    pending_task_count: 0,
    total_estimate_minutes: 0,
    has_high_priority: false,
    assignee: undefined,
    members: [],
    member_count: 0,
  }
}

export async function archiveList(id: string): Promise<List> {
  const supabase = createClient()
  const { data: list, error } = await supabase
    .from('lists')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return { ...list, stage: list.stage as ListStage, members: [], member_count: 0 }
}

export async function getMyStats(userId: string): Promise<{ pending: number; minutes: number }> {
  const supabase = createClient()
  const { data } = await supabase
    .from('tasks')
    .select('time_estimate_minutes')
    .eq('assignee_id', userId)
    .neq('status', 'done')

  const tasks = data ?? []
  return {
    pending: tasks.length,
    minutes: tasks.reduce((sum, t) => sum + (t.time_estimate_minutes ?? 0), 0),
  }
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function getTasks(listId?: string): Promise<Task[]> {
  const supabase = createClient()

  let query = supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .order('position', { ascending: true })

  if (listId && listId !== 'all') {
    query = query.eq('list_id', listId)
  }

  const { data, error } = await query
  if (error) throw error

  const tasks = data ?? []

  // Fetch profiles for assignees in one query
  const assigneeIds = Array.from(new Set(tasks.map((t) => t.assignee_id).filter(Boolean))) as string[]
  let profileMap: Record<string, Profile> = {}
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', assigneeIds)
    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, { id: p.id, full_name: p.full_name ?? undefined, email: p.email ?? '', avatar_url: p.avatar_url ?? undefined }])
    )
  }

  return tasks.map((t) => ({
    id: t.id,
    list_id: t.list_id,
    title: t.title,
    description: t.description ?? undefined,
    status: t.status as Task['status'],
    priority: t.priority as Task['priority'],
    assignee_id: t.assignee_id ?? undefined,
    assignee: t.assignee_id ? profileMap[t.assignee_id] : undefined,
    time_estimate_minutes: t.time_estimate_minutes ?? undefined,
    position: t.position,
    due_date: t.due_date ?? undefined,
    completed_at: t.completed_at ?? undefined,
    created_at: t.created_at,
    subtasks: (t.subtasks ?? []).map((s: { id: string; task_id: string; title: string; is_complete: boolean; position: number }) => ({
      id: s.id,
      task_id: s.task_id,
      title: s.title,
      is_complete: s.is_complete,
      position: s.position,
    })),
  }))
}

export async function createTask(data: {
  list_id: string
  title: string
  status: Task['status']
  assignee_id?: string
  time_estimate_minutes?: number
}): Promise<Task> {
  const supabase = createClient()
  const { data: task, error } = await supabase
    .from('tasks')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return {
    ...task,
    status: task.status as Task['status'],
    priority: task.priority as Task['priority'],
    assignee_id: task.assignee_id ?? undefined,
    subtasks: [],
  }
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<Task, 'id' | 'created_at'>>
): Promise<Task> {
  const supabase = createClient()

  // Strip computed/relation fields before sending to DB
  const dbPatch = { ...(patch as Record<string, unknown>) }
  delete dbPatch.subtasks
  delete dbPatch.assignee

  if (patch.status === 'done') {
    (dbPatch as Record<string, unknown>).completed_at = new Date().toISOString()
  } else if (patch.status) {
    (dbPatch as Record<string, unknown>).completed_at = null
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(dbPatch)
    .eq('id', id)
    .select('*, subtasks(*)')
    .single()

  if (error) throw error
  return { ...task, status: task.status as Task['status'], priority: task.priority as Task['priority'], subtasks: task.subtasks ?? [] }
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Subtasks
// ---------------------------------------------------------------------------

export async function createSubtask(data: { task_id: string; title: string }): Promise<Subtask> {
  const supabase = createClient()
  const { data: sub, error } = await supabase.from('subtasks').insert(data).select().single()
  if (error) throw error
  return sub
}

export async function updateSubtask(
  id: string,
  patch: Partial<Pick<Subtask, 'title' | 'is_complete'>>
): Promise<Subtask> {
  const supabase = createClient()
  const { data: sub, error } = await supabase
    .from('subtasks')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return sub
}

export async function deleteSubtask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('subtasks').delete().eq('id', id)
  if (error) throw error
}
