import type { List, Task, Subtask, Profile, ListStage } from "@/types/tasks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function formatMinutes(minutes: number | undefined | null): string {
  if (!minutes || minutes <= 0) return "0min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const LIST_1 = "list-apex";
const LIST_2 = "list-ops";
const LIST_3 = "list-nova";
const LIST_4 = "list-personal";
const LIST_5 = "list-ideas";

const profiles: Profile[] = [
  { id: "user-jordan", full_name: "Reuben Brunton", email: "jordan@zipline.co" },
  { id: "user-maya",   full_name: "Maya Chen",   email: "maya@zipline.co" },
  { id: "user-alex",   full_name: "Alex Torres", email: "alex@zipline.co" },
];

let lists: List[] = [
  {
    id: LIST_1,
    name: "Apex Rebrand",
    client_contact_id: 1,
    client_name: "Apex Capital",
    color: "#FF4533",
    stage: "production",
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: LIST_2,
    name: "Internal Ops",
    client_name: "Zipline Internal",
    color: "#6366F1",
    stage: "pre_production",
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: LIST_3,
    name: "NovaTech Social",
    client_contact_id: 2,
    client_name: "NovaTech Inc.",
    color: "#10B981",
    stage: "revisions",
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: LIST_4,
    name: "Personal Tasks",
    client_name: "Personal",
    color: "#8B5CF6",
    stage: "parked",
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: LIST_5,
    name: "Ideas & Planning",
    client_name: "Zipline Internal",
    color: "#38BDF8",
    stage: "parked",
    is_archived: false,
    created_at: new Date().toISOString(),
  },
];

let tasks: Task[] = [
  {
    id: "task-1",
    list_id: LIST_1,
    title: "Design new brand identity guidelines",
    description: "Full brand refresh including logo, typography, and colour palette.",
    status: "today",
    priority: "high",
    assignee_id: "user-jordan",
    time_estimate_minutes: 180,
    position: 1000,
    due_date: "2026-03-20",
    created_at: new Date().toISOString(),
  },
  {
    id: "task-2",
    list_id: LIST_1,
    title: "Update website hero section with new brand assets",
    status: "this_week",
    priority: "medium",
    assignee_id: "user-maya",
    time_estimate_minutes: 90,
    position: 2000,
    created_at: new Date().toISOString(),
  },
  {
    id: "task-3",
    list_id: LIST_1,
    title: "Send brand deck to client for approval",
    status: "backlog",
    priority: "high",
    assignee_id: "user-jordan",
    time_estimate_minutes: 30,
    position: 3000,
    created_at: new Date().toISOString(),
  },
  {
    id: "task-4",
    list_id: LIST_2,
    title: "Set up Notion workspace for Q2 planning",
    status: "done",
    priority: "low",
    assignee_id: "user-alex",
    time_estimate_minutes: 60,
    position: 1000,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "task-5",
    list_id: LIST_2,
    title: "Migrate invoice templates to new format",
    status: "today",
    priority: "medium",
    assignee_id: "user-maya",
    time_estimate_minutes: 45,
    position: 2000,
    created_at: new Date().toISOString(),
  },
  {
    id: "task-6",
    list_id: LIST_2,
    title: "Review and update onboarding checklist",
    status: "this_week",
    priority: "low",
    time_estimate_minutes: 30,
    position: 3000,
    created_at: new Date().toISOString(),
  },
  {
    id: "task-7",
    list_id: LIST_3,
    title: "Write 4 LinkedIn post drafts for April",
    description: "Focus on thought leadership and product launches.",
    status: "backlog",
    priority: "medium",
    assignee_id: "user-alex",
    time_estimate_minutes: 120,
    position: 1000,
    created_at: new Date().toISOString(),
  },
  {
    id: "task-8",
    list_id: LIST_3,
    title: "Schedule Instagram content calendar",
    status: "this_week",
    priority: "high",
    assignee_id: "user-jordan",
    time_estimate_minutes: 60,
    position: 2000,
    due_date: "2026-03-18",
    created_at: new Date().toISOString(),
  },
  {
    id: "task-9",
    list_id: LIST_3,
    title: "Audit competitor social accounts",
    status: "done",
    priority: "low",
    assignee_id: "user-maya",
    time_estimate_minutes: 90,
    position: 3000,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "task-10",
    list_id: LIST_4,
    title: "Book team lunch for April",
    status: "this_week",
    priority: "low",
    assignee_id: "user-jordan",
    time_estimate_minutes: 15,
    position: 1000,
    created_at: new Date().toISOString(),
  },
  {
    id: "task-11",
    list_id: LIST_4,
    title: "Renew Adobe Creative Cloud subscription",
    status: "backlog",
    priority: "medium",
    assignee_id: "user-jordan",
    time_estimate_minutes: 10,
    position: 2000,
    created_at: new Date().toISOString(),
  },
  {
    id: "task-12",
    list_id: LIST_5,
    title: "Explore AI tools for client reporting",
    status: "backlog",
    priority: "low",
    assignee_id: "user-jordan",
    time_estimate_minutes: 60,
    position: 1000,
    created_at: new Date().toISOString(),
  },
];

let subtasks: Subtask[] = [
  { id: "sub-1", task_id: "task-1", title: "Research competitor brand identities", is_complete: true, position: 1000 },
  { id: "sub-2", task_id: "task-1", title: "Create initial mood board", is_complete: true, position: 2000 },
  { id: "sub-3", task_id: "task-1", title: "Draft logo concepts", is_complete: false, position: 3000 },
  { id: "sub-4", task_id: "task-7", title: "Outline post topics", is_complete: false, position: 1000 },
  { id: "sub-5", task_id: "task-7", title: "Write first draft", is_complete: false, position: 2000 },
];

// ---------------------------------------------------------------------------
// Computed helpers
// ---------------------------------------------------------------------------

function computeListStats(list: List): List {
  const listTasks = tasks.filter((t) => t.list_id === list.id);
  const pending = listTasks.filter((t) => t.status !== "done").length;
  const estimate = listTasks
    .filter((t) => t.status !== "done")
    .reduce((sum, t) => sum + (t.time_estimate_minutes ?? 0), 0);
  const hasHighPriority = listTasks.some((t) => t.priority === "high" && t.status !== "done");
  const seen = new Set<string>();
  const assigneeIds = listTasks
    .map((t) => t.assignee_id)
    .filter((id): id is string => {
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  const members = assigneeIds
    .map((id) => profiles.find((p) => p.id === id))
    .filter((p): p is Profile => Boolean(p));
  return {
    ...list,
    total_task_count: listTasks.length,
    pending_task_count: pending,
    total_estimate_minutes: estimate,
    has_high_priority: hasHighPriority,
    members,
    member_count: members.length,
  };
}

// ---------------------------------------------------------------------------
// Profiles API
// ---------------------------------------------------------------------------

export async function getProfiles(): Promise<Profile[]> {
  return delay(profiles);
}

// ---------------------------------------------------------------------------
// Lists API
// ---------------------------------------------------------------------------

export async function getLists(): Promise<List[]> {
  const result = lists
    .filter((l) => !l.is_archived)
    .map(computeListStats);
  return delay(result);
}

export async function createList(data: {
  name: string;
  color?: string;
  client_contact_id?: number;
  client_name?: string;
  icon_url?: string;
  stage?: ListStage;
}): Promise<List> {
  const list: List = {
    id: uid(),
    name: data.name,
    color: data.color,
    client_contact_id: data.client_contact_id,
    client_name: data.client_name,
    icon_url: data.icon_url,
    stage: data.stage ?? "pre_production",
    is_archived: false,
    created_at: new Date().toISOString(),
    total_task_count: 0,
    pending_task_count: 0,
    total_estimate_minutes: 0,
    has_high_priority: false,
    members: [],
    member_count: 0,
  };
  lists = [...lists, list];
  return delay(list);
}

export async function updateList(
  id: string,
  patch: Partial<Pick<List, "name" | "color" | "stage" | "client_contact_id" | "client_name">>
): Promise<List> {
  lists = lists.map((l) => (l.id === id ? { ...l, ...patch } : l));
  const found = lists.find((l) => l.id === id)!;
  return delay(computeListStats(found));
}

export async function archiveList(id: string): Promise<List> {
  lists = lists.map((l) => (l.id === id ? { ...l, is_archived: true } : l));
  const found = lists.find((l) => l.id === id)!;
  return delay(found);
}

export async function getMyStats(userId: string): Promise<{ pending: number; minutes: number }> {
  await delay(80);
  const myTasks = tasks.filter((t) => t.assignee_id === userId && t.status !== "done");
  return {
    pending: myTasks.length,
    minutes: myTasks.reduce((sum, t) => sum + (t.time_estimate_minutes ?? 0), 0),
  };
}

// ---------------------------------------------------------------------------
// Tasks API
// ---------------------------------------------------------------------------

export async function getTasks(listId?: string): Promise<Task[]> {
  const filtered =
    !listId || listId === "all"
      ? tasks
      : tasks.filter((t) => t.list_id === listId);
  const withSubs = filtered.map((t) => ({
    ...t,
    subtasks: subtasks.filter((s) => s.task_id === t.id),
    assignee: t.assignee_id ? profiles.find((p) => p.id === t.assignee_id) : undefined,
  }));
  return delay(withSubs);
}

export async function createTask(data: {
  list_id: string;
  title: string;
  status: Task["status"];
  time_estimate_minutes?: number;
}): Promise<Task> {
  const task: Task = {
    id: uid(),
    list_id: data.list_id,
    title: data.title,
    status: data.status,
    priority: "medium",
    time_estimate_minutes: data.time_estimate_minutes,
    position: (tasks.filter((t) => t.list_id === data.list_id).length + 1) * 1000,
    created_at: new Date().toISOString(),
    subtasks: [],
  };
  tasks = [...tasks, task];
  return delay(task);
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<Task, "id" | "created_at">>
): Promise<Task> {
  tasks = tasks.map((t) => {
    if (t.id !== id) return t;
    const updated = { ...t, ...patch };
    if (patch.status === "done" && !t.completed_at) {
      updated.completed_at = new Date().toISOString();
    }
    if (patch.status && patch.status !== "done") {
      updated.completed_at = undefined;
    }
    return updated;
  });
  const found = tasks.find((t) => t.id === id)!;
  return delay({ ...found, subtasks: subtasks.filter((s) => s.task_id === id) });
}

export async function deleteTask(id: string): Promise<void> {
  tasks = tasks.filter((t) => t.id !== id);
  subtasks = subtasks.filter((s) => s.task_id !== id);
  return delay(undefined);
}

// ---------------------------------------------------------------------------
// Subtasks API
// ---------------------------------------------------------------------------

export async function getSubtasks(taskId: string): Promise<Subtask[]> {
  return delay(subtasks.filter((s) => s.task_id === taskId));
}

export async function createSubtask(data: {
  task_id: string;
  title: string;
}): Promise<Subtask> {
  const sub: Subtask = {
    id: uid(),
    task_id: data.task_id,
    title: data.title,
    is_complete: false,
    position: (subtasks.filter((s) => s.task_id === data.task_id).length + 1) * 1000,
  };
  subtasks = [...subtasks, sub];
  return delay(sub);
}

export async function updateSubtask(
  id: string,
  patch: Partial<Pick<Subtask, "title" | "is_complete">>
): Promise<Subtask> {
  subtasks = subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s));
  return delay(subtasks.find((s) => s.id === id)!);
}

export async function deleteSubtask(id: string): Promise<void> {
  subtasks = subtasks.filter((s) => s.id !== id);
  return delay(undefined);
}
