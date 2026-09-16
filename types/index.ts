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

export interface CardCover {
  type: 'color' | 'gradient' | 'image';
  value: string;
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
  cover?: CardCover;
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

// ============================================================
// GAMIFICACIÓN · STATS
// ============================================================

export interface UserStats {
  reputation: number;
  cardsCreated: number;
  cardsCompleted: number;
  commentsAdded: number;
  attachmentsAdded: number;
  templatesApplied: number;
  templatesCreated: number;
  labelsCreated: number;
  boardsCreated: number;
  subtasksCompleted: number;
  actionsByDay: Record<string, number>;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
  achievements: string[];
  firstUseAt: number;
  lastActiveAt: number;
}

export type UserLevel =
  | 'novato'
  | 'aprendiz'
  | 'constructor'
  | 'arquitecto'
  | 'maestro';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
}

export type TrackAction =
  | 'card_created'
  | 'card_created_full'
  | 'card_completed'
  | 'card_moved'
  | 'comment_added'
  | 'attachment_added'
  | 'template_applied'
  | 'template_created'
  | 'label_created'
  | 'board_created'
  | 'subtask_completed';

// ============================================================
// PERFIL · XP · COSMÉTICOS
// ============================================================

export type CosmeticRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export type CosmeticCategory =
  | 'avatar'
  | 'frame'
  | 'background'
  | 'title'
  | 'theme';

export interface Cosmetic {
  id: string;
  name: string;
  description?: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  price?: number;
  unlockedByLevel?: number;
  unlockedByAchievement?: string;
  value: string;
  preview?: string;
  free?: boolean;
}

export interface EquippedCosmetics {
  avatar?: string;
  frame?: string;
  background?: string;
  title?: string;
  theme?: string;
}

export interface ProfileStats {
  xp: number;
  ap: number;
  level: number;
  owned: Record<string, number>;
  equipped: EquippedCosmetics;
}

export type ProfileTab = 'profile' | 'shop' | 'collection';