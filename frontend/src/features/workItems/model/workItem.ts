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
  pendingOperation: string | null;
};

export type CommandStatus = 'pending' | 'completed' | 'failed';

export type CommandType = 'complete';

export type CommandOperation = {
  operationId: string;
  status: CommandStatus;
  workItemId: string;
  resultRevision: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type SubmitWorkItemCommandRequest = {
  type: CommandType;
};

export type UpdateWorkItemRequest = Partial<{
  title: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee: string | null;
  tags: string[];
}>;

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
};

export const workItemStatusLabels: Record<WorkItemStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const workItemStatusValues: WorkItemStatus[] = ['new', 'in_progress', 'blocked', 'done'];

export const workItemPriorityLabels: Record<WorkItemPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const workItemPriorityValues: WorkItemPriority[] = ['low', 'medium', 'high', 'critical'];
