// TypeScript types for Specstory integration

export interface SpecstoryStory {
  id: string;
  title: string;
  description: string;
  status: SpecstoryStoryStatus;
  priority: SpecstoryPriority;
  projectId: string;
  workspaceId: string;
  assignedTo?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  acceptanceCriteria: SpecstoryAcceptanceCriteria[];
  requirements: SpecstoryRequirement[];
  attachments?: SpecstoryAttachment[];
  links?: SpecstoryLink[];
}

export interface SpecstoryAcceptanceCriteria {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface SpecstoryRequirement {
  id: string;
  title: string;
  description: string;
  type: 'functional' | 'non-functional' | 'technical' | 'business';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: SpecstoryPriority;
  createdAt: string;
  updatedAt: string;
}

export interface SpecstoryAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'code' | 'other';
  uploadedAt: string;
  uploadedBy: string;
}

export interface SpecstoryLink {
  id: string;
  type: 'github_pr' | 'github_issue' | 'confluence' | 'jira' | 'figma' | 'other';
  url: string;
  title: string;
  description?: string;
}

export interface SpecstoryProject {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  status: 'active' | 'archived' | 'paused';
  createdAt: string;
  updatedAt: string;
  settings: SpecstoryProjectSettings;
}

export interface SpecstoryProjectSettings {
  defaultPriority: SpecstoryPriority;
  allowedStatuses: SpecstoryStoryStatus[];
  requireAcceptanceCriteria: boolean;
  estimationRequired: boolean;
}

export interface SpecstoryWorkspace {
  id: string;
  name: string;
  description?: string;
  members: SpecstoryMember[];
  settings: SpecstoryWorkspaceSettings;
}

export interface SpecstoryMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface SpecstoryWorkspaceSettings {
  timezone: string;
  defaultProject?: string;
  integrations: SpecstoryIntegration[];
}

export interface SpecstoryIntegration {
  type: 'github' | 'jira' | 'slack' | 'webhooks';
  enabled: boolean;
  config: Record<string, any>;
}

// API Response Types
export interface SpecstoryAPIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pagination?: SpecstoryPagination;
}

export interface SpecstoryPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Webhook Event Types
export interface SpecstoryWebhookEvent {
  id: string;
  type: SpecstoryEventType;
  timestamp: string;
  data: SpecstoryWebhookEventData;
  projectId: string;
  workspaceId: string;
}

export interface SpecstoryWebhookEventData {
  story?: SpecstoryStory;
  requirement?: SpecstoryRequirement;
  previousValues?: Record<string, any>;
  changes?: SpecstoryChange[];
}

export interface SpecstoryChange {
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: string;
}

// Enum Types
export type SpecstoryStoryStatus = 
  | 'todo' 
  | 'in_progress' 
  | 'review' 
  | 'testing' 
  | 'done' 
  | 'blocked' 
  | 'cancelled';

export type SpecstoryPriority = 
  | 'urgent' 
  | 'high' 
  | 'medium' 
  | 'low';

export type SpecstoryEventType = 
  | 'story.created'
  | 'story.updated'
  | 'story.deleted'
  | 'story.completed'
  | 'requirement.created'
  | 'requirement.updated'
  | 'requirement.completed'
  | 'progress.updated'
  | 'comment.added';

// Integration Types for Yoshidex
export interface YoshidexSpecstorySession {
  yoshidexSessionId: string;
  specstoryStoryId: string;
  linkedAt: string;
  linkedBy: string;
  syncStatus: 'active' | 'paused' | 'error';
  lastSyncAt?: string;
  syncErrors?: string[];
}

export interface YoshidexSpecstoryProgress {
  sessionId: string;
  storyId: string;
  requirementsAddressed: string[];
  completionPercentage: number;
  timeLoggedHours: number;
  blockers: SpecstoryBlocker[];
  decisions: SpecstoryDecision[];
  updatedAt: string;
}

export interface SpecstoryBlocker {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SpecstoryDecision {
  id: string;
  title: string;
  description: string;
  options: string[];
  chosenOption: string;
  rationale: string;
  madeBy: string;
  madeAt: string;
}