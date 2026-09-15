export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: number;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  damage: number;
  columnId: string;
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  subtasks?: Subtask[];
  labelIds?: string[];
  comments?: Comment[];
  attachments?: Attachment[];
  assigneeIds?: string[];
  archived?: boolean;
  archivedAt?: number;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
  wipLimit?: number;
  isDone?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  daysBefore: number[];
  browserNotifications: boolean;
}

export interface CardTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  description?: string;
  priority: Priority;
  labelNames: string[];
  subtasks: string[];
}

export type ActivityType =
  | 'card_created'
  | 'card_moved'
  | 'card_completed'
  | 'card_uncompleted'
  | 'card_archived'
  | 'card_restored'
  | 'card_deleted'
  | 'card_renamed'
  | 'comment_added'
  | 'template_applied'
  | 'attachment_added'
  | 'assignee_added'
  | 'assignee_removed';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  cardId?: string;
  cardTitle: string;
  fromColumn?: string;
  toColumn?: string;
  extra?: string;
  timestamp: number;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  cards: Record<string, Card>;
  labels: Label[];
  notificationSettings: NotificationSettings;
  templates: CardTemplate[];
  activity: ActivityEvent[];
}