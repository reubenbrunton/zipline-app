export type TaskStatus = 'backlog' | 'this_week' | 'today' | 'done'
export type Priority = 'low' | 'medium' | 'high'
export type ListStage =
  | 'pre_production'
  | 'production'
  | 'post_production'
  | 'revisions'
  | 'media_buying'
  | 'completed'
  | 'parked'

export interface List {
  id: string
  name: string
  color?: string
  assignee_id?: string
  assignee?: Profile
  client_contact_id?: number
  client_name?: string
  icon_url?: string
  is_archived: boolean
  created_at: string
  stage: ListStage
  total_task_count?: number
  pending_task_count?: number
  total_estimate_minutes?: number
  has_high_priority?: boolean
  member_count?: number
  members?: Profile[]
}

export interface Task {
  id: string
  list_id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assignee_id?: string
  assignee?: Profile
  assignee_ids?: string[]
  assignees?: Profile[]
  time_estimate_minutes?: number
  position: number
  due_date?: string
  completed_at?: string
  created_at: string
  subtasks?: Subtask[]
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_complete: boolean
  position: number
}

export interface Profile {
  id: string
  full_name?: string
  email: string
  avatar_url?: string
}
