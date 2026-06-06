export type WorkItemStatus = 'new' | 'in_progress' | 'blocked' | 'done';

export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';

export type WorkItem = {
  id: string;
  title: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee: string | null;
  tags: string[];
  revision: number;
  updatedAt: string;
};

export const workItemStatusLabels: Record<WorkItemStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const workItemPriorityLabels: Record<WorkItemPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
