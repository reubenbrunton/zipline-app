import { createClient } from '@/lib/supabase/client'
import type { List, Task, Subtask, Profile, ListStage } from '@/types/tasks'

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    full_name: row.full_name ?? undefined,
    email: row.email ?? '',
    avatar_url: row.avatar_url ?? undefined,
  }
}

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean))) as string[]
}

async function getProfilesByIds(supabase: ReturnType<typeof createClient>, ids: string[]): Promise<Record<string, Profile>> {
  if (ids.length === 0) return {}

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids)

  return Object.fromEntries((profiles ?? []).map((profile) => [profile.id, mapProfile(profile as ProfileRow)]))
}

async function syncListAssignees(
  supabase: ReturnType<typeof createClient>,
  listId: string,
  assigneeIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('list_assignees')
    .delete()
    .eq('list_id', listId)

  if (deleteError) throw deleteError

  if (assigneeIds.length === 0) return

  const { error: insertError } = await supabase
    .from('list_assignees')
    .insert(assigneeIds.map((userId) => ({ list_id: listId, user_id: userId })))

  if (insertError) throw insertError
}

async function syncTaskAssignees(
  supabase: ReturnType<typeof createClient>,
  taskId: string,
  assigneeIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)

  if (deleteError) throw deleteError

  if (assigneeIds.length === 0) return

  const { error: insertError } = await supabase
    .from('task_assignees')
    .insert(assigneeIds.map((userId) => ({ task_id: taskId, user_id: userId })))

  if (insertError) throw insertError
}

async function fetchTaskById(supabase: ReturnType<typeof createClient>, taskId: string): Promise<Task> {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*), task_assignees(user_id)')
    .eq('id', taskId)
    .single()

  if (error) throw error

  const assigneeIds = uniqueIds((task.task_assignees ?? []).map((assignment: { user_id: string | null }) => assignment.user_id))
  const profileMap = await getProfilesByIds(supabase, assigneeIds)
  const assignees = assigneeIds
    .map((assigneeId) => profileMap[assigneeId])
    .filter((profile): profile is Profile => Boolean(profile))

  return {
    id: task.id,
    list_id: task.list_id,
    title: task.title,
    description: task.description ?? undefined,
    status: task.status as Task['status'],
    priority: task.priority as Task['priority'],
    assignee_id: assigneeIds[0],
    assignee: assignees[0],
    assignee_ids: assigneeIds,
    assignees,
    time_estimate_minutes: task.time_estimate_minutes ?? undefined,
    position: task.position,
    due_date: task.due_date ?? undefined,
    completed_at: task.completed_at ?? undefined,
    created_at: task.created_at,
    subtasks: (task.subtasks ?? []).map((subtask: { id: string; task_id: string; title: string; is_complete: boolean; position: number }) => ({
      id: subtask.id,
      task_id: subtask.task_id,
      title: subtask.title,
      is_complete: subtask.is_complete,
      position: subtask.position,
    })),
  }
}

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
  return (data ?? []).map((profile) => mapProfile(profile as ProfileRow))
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export async function getLists(): Promise<List[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*, list_assignees(user_id), tasks(id, status, priority, time_estimate_minutes, task_assignees(user_id))')
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  if (error) throw error

  const listRows = data ?? []
  const profileIds = uniqueIds(
    listRows.flatMap((list) => [
      list.assignee_id,
      ...((list.list_assignees ?? []).map((a: { user_id: string | null }) => a.user_id)),
      ...((list.tasks ?? []).flatMap((task: { task_assignees?: Array<{ user_id: string | null }> }) =>
        (task.task_assignees ?? []).map((assignment) => assignment.user_id)
      )),
    ])
  )

  const profileMap = await getProfilesByIds(supabase, profileIds)

  return listRows.map((l) => {
    const tasks: {
      status: string
      priority: string
      time_estimate_minutes: number | null
      task_assignees?: Array<{ user_id: string | null }>
    }[] = l.tasks ?? []
    const pending = tasks.filter((t) => t.status !== 'done').length
    const estimate = tasks
      .filter((t) => t.status !== 'done')
      .reduce((sum, t) => sum + (t.time_estimate_minutes ?? 0), 0)
    const hasHighPriority = tasks.some((t) => t.priority === 'high' && t.status !== 'done')
    const seen = new Set<string>()
    const members = tasks
      .flatMap((task) => (task.task_assignees ?? []).map((assignment) => assignment.user_id))
      .filter((assigneeId): assigneeId is string => {
        if (!assigneeId || seen.has(assigneeId)) return false
        seen.add(assigneeId)
        return true
      })
      .map((assigneeId) => profileMap[assigneeId])
      .filter((profile): profile is Profile => Boolean(profile))

    const listAssigneeIds = uniqueIds((l.list_assignees ?? []).map((a: { user_id: string | null }) => a.user_id))
    const listAssignees = listAssigneeIds
      .map((id) => profileMap[id])
      .filter((profile): profile is Profile => Boolean(profile))

    return {
      id: l.id,
      name: l.name,
      color: l.color ?? undefined,
      assignee_id: listAssigneeIds[0] ?? l.assignee_id ?? undefined,
      assignee: listAssignees[0] ?? (l.assignee_id ? profileMap[l.assignee_id] : undefined),
      assignee_ids: listAssigneeIds,
      assignees: listAssignees,
      icon_url: l.icon_url ?? undefined,
      stage: (l.stage ?? 'pre_production') as ListStage,
      client_name: l.client_name ?? undefined,
      shoot_date: l.shoot_date ?? undefined,
      shoot_time: l.shoot_time ?? undefined,
      shoot_deliverables: l.shoot_deliverables ?? undefined,
      shoot_invitee_ids: (l.shoot_invitee_ids as string[] | null) ?? undefined,
      revision_version: (l.revision_version as string | null) as import("@/types/tasks").RevisionVersion | undefined ?? undefined,
      management_started_at: (l.management_started_at as string | null) ?? undefined,
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
  assignee_ids?: string[]
  client_contact_id?: number
  client_name?: string
  icon_url?: string
  stage?: ListStage
}): Promise<List> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const assigneeIds = uniqueIds(data.assignee_ids ?? (data.assignee_id ? [data.assignee_id] : []))
  const { data: list, error } = await supabase
    .from('lists')
    .insert({
      name: data.name,
      color: data.color,
      assignee_id: assigneeIds[0] ?? null,
      client_contact_id: data.client_contact_id,
      client_name: data.client_name,
      icon_url: data.icon_url,
      stage: data.stage ?? 'pre_production',
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error

  await syncListAssignees(supabase, list.id, assigneeIds)

  return {
    ...list,
    stage: list.stage as ListStage,
    assignee_id: assigneeIds[0] ?? undefined,
    assignee_ids: assigneeIds,
    assignees: [],
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
  patch: Partial<Pick<List, 'name' | 'color' | 'stage' | 'assignee_id' | 'assignee_ids' | 'client_contact_id' | 'client_name'>>
): Promise<List> {
  const supabase = createClient()

  const assigneeIds = Object.prototype.hasOwnProperty.call(patch, 'assignee_ids')
    ? uniqueIds(patch.assignee_ids ?? [])
    : null

  const dbPatch: Record<string, unknown> = { ...patch }
  delete dbPatch.assignee_ids
  delete dbPatch.assignees
  if (assigneeIds) {
    dbPatch.assignee_id = assigneeIds[0] ?? null
  }

  const { data: list, error } = await supabase
    .from('lists')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (assigneeIds) {
    await syncListAssignees(supabase, id, assigneeIds)
  }

  const resolvedAssigneeIds = assigneeIds ?? (list.assignee_id ? [list.assignee_id] : [])

  return {
    ...list,
    stage: list.stage as ListStage,
    assignee_id: resolvedAssigneeIds[0] ?? undefined,
    assignee_ids: resolvedAssigneeIds,
    assignees: [],
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
    .select('time_estimate_minutes, task_assignees!inner(user_id)')
    .eq('task_assignees.user_id', userId)
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
    .select('*, subtasks(*), task_assignees(user_id)')
    .order('position', { ascending: true })

  if (listId && listId !== 'all') {
    query = query.eq('list_id', listId)
  }

  const { data, error } = await query
  if (error) throw error

  const tasks = data ?? []

  // Fetch profiles for assignees in one query
  const assigneeIds = uniqueIds(
    tasks.flatMap((task) => (task.task_assignees ?? []).map((assignment: { user_id: string | null }) => assignment.user_id))
  )
  const profileMap = await getProfilesByIds(supabase, assigneeIds)

  return tasks.map((t) => {
    const taskAssigneeIds = uniqueIds((t.task_assignees ?? []).map((assignment: { user_id: string | null }) => assignment.user_id))
    const taskAssignees = taskAssigneeIds
      .map((assigneeId) => profileMap[assigneeId])
      .filter((profile): profile is Profile => Boolean(profile))

    return {
      id: t.id,
      list_id: t.list_id,
      title: t.title,
      description: t.description ?? undefined,
      status: t.status as Task['status'],
      priority: t.priority as Task['priority'],
      assignee_id: taskAssigneeIds[0] ?? undefined,
      assignee: taskAssignees[0],
      assignee_ids: taskAssigneeIds,
      assignees: taskAssignees,
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
    }
  })
}

export async function createTask(data: {
  list_id: string
  title: string
  status: Task['status']
  assignee_ids?: string[]
  time_estimate_minutes?: number
}): Promise<Task> {
  const supabase = createClient()
  const assigneeIds = uniqueIds(data.assignee_ids ?? [])
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      list_id: data.list_id,
      title: data.title,
      status: data.status,
      assignee_id: assigneeIds[0] ?? null,
      time_estimate_minutes: data.time_estimate_minutes,
    })
    .select()
    .single()

  if (error) throw error

  await syncTaskAssignees(supabase, task.id, assigneeIds)
  return fetchTaskById(supabase, task.id)
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
  delete dbPatch.assignees
  delete dbPatch.assignee_ids

  const assigneeIds = Object.prototype.hasOwnProperty.call(patch, 'assignee_ids')
    ? uniqueIds(patch.assignee_ids ?? [])
    : null

  if (assigneeIds) {
    dbPatch.assignee_id = assigneeIds[0] ?? null
  }

  if (patch.status === 'done') {
    (dbPatch as Record<string, unknown>).completed_at = new Date().toISOString()
  } else if (patch.status) {
    (dbPatch as Record<string, unknown>).completed_at = null
  }

  const { error } = await supabase
    .from('tasks')
    .update(dbPatch)
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw error

  if (assigneeIds) {
    await syncTaskAssignees(supabase, id, assigneeIds)
  }

  return fetchTaskById(supabase, id)
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
