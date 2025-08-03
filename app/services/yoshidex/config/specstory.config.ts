// Specstory integration configuration for Yoshidex

export const SpecstoryConfig = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_SPECSTORY_API_URL || 'https://api.specstory.com/v1',
    apiKey: process.env.SPECSTORY_API_KEY || '',
    apiSecret: process.env.SPECSTORY_API_SECRET || '',
    timeout: 30000, // 30 seconds
  },

  // Project Configuration
  project: {
    defaultProjectId: process.env.SPECSTORY_PROJECT_ID || '',
    defaultWorkspaceId: process.env.SPECSTORY_WORKSPACE_ID || '',
  },

  // Webhook Configuration
  webhook: {
    secret: process.env.SPECSTORY_WEBHOOK_SECRET || '',
    endpoint: '/api/yoshidex/specstory-webhook',
    events: [
      'story.created',
      'story.updated',
      'story.completed',
      'requirement.added',
      'requirement.updated',
      'progress.updated'
    ]
  },

  // Sync Configuration
  sync: {
    enabled: process.env.SPECSTORY_SYNC_ENABLED === 'true',
    intervalMs: 300000, // 5 minutes
    batchSize: 50,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },

  // Field Mappings
  mappings: {
    storyStatus: {
      'todo': 'planning',
      'in_progress': 'in_progress',
      'review': 'review',
      'done': 'completed',
      'blocked': 'blocked'
    },
    priority: {
      'urgent': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    }
  }
};

// Validate configuration
export function validateSpecstoryConfig(): boolean {
  const required = [
    SpecstoryConfig.api.apiKey,
    SpecstoryConfig.project.defaultProjectId
  ];
  
  return required.every(value => value && value.length > 0);
}