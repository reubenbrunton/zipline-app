export type TaskStatus = 'backlog' | 'this_week' | 'today' | 'done'
export type RevisionVersion = 'v1_sent' | 'v2_sent' | 'v3_sent' | 'final_sent' | 'client_approved'
export type Priority = 'low' | 'medium' | 'high'
export type ListStage =
  | 'new_project'
  | 'strategy'
  | 'scripting'
  | 'production'
  | 'post_production'
  | 'revisions'
  | 'media_buying'
  | 'management'
  | 'completed'
  | 'parked'
  | 'pre_production' // legacy


export interface List {
  id: string
  name: string
  color?: string
  assignee_id?: string
  assignee?: Profile
  assignee_ids?: string[]
  assignees?: Profile[]
  client_contact_id?: number
  client_name?: string
  shoot_date?: string
  shoot_time?: string
  shoot_deliverables?: string
  shoot_invitee_ids?: string[]
  revision_version?: RevisionVersion
  management_started_at?: string
  icon_url?: string
  deal_value?: number
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
