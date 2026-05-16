export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskStatus = 'active' | 'completed'

export type Task = {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  completedAt?: string
}