// Sync method types
export type SyncMethod = 'plugin_api' | 'rest_api';

// Sync result interface
export interface SyncResult {
  success: boolean;
  message: string;
  method: SyncMethod;
  count?: number;
  errors?: string[];
  data?: {
    posts: number;
    pages: number;
    failed: number;
  };
}

// WordPress content interface
export interface WordPressContent {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  type: string;
  date: string;
  modified: string;
  author: number;
  slug: string;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
  meta?: Record<string, any>;
}

// Sync method capabilities
export interface SyncCapabilities {
  canAccessPrivate: boolean;
  canAccessDrafts: boolean;
  canAccessMeta: boolean;
  hasRateLimit: boolean;
  maxPostsPerRequest: number;
  requiresAuth: boolean;
}

// Site sync configuration
export interface SyncConfig {
  siteId: string;
  siteUrl: string;
  preferredMethod: SyncMethod;
  fallbackEnabled: boolean;
  apiKey?: string;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

// Sync method interface
export interface SyncMethodInterface {
  name: SyncMethod;
  capabilities: SyncCapabilities;
  sync(config: SyncConfig): Promise<SyncResult>;
  validateConfig(config: SyncConfig): boolean;
} 