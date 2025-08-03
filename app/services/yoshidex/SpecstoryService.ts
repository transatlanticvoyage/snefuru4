// Specstory API Service for Yoshidex integration

import { SpecstoryConfig, validateSpecstoryConfig } from './config/specstory.config';
import {
  SpecstoryStory,
  SpecstoryProject,
  SpecstoryWorkspace,
  SpecstoryAPIResponse,
  SpecstoryRequirement,
  YoshidexSpecstoryProgress,
  SpecstoryStoryStatus,
  SpecstoryPriority
} from './types/specstory.types';

export class SpecstoryService {
  private baseUrl: string;
  private apiKey: string;
  private headers: Record<string, string>;

  constructor() {
    if (!validateSpecstoryConfig()) {
      throw new Error('Specstory configuration is invalid. Check environment variables.');
    }

    this.baseUrl = SpecstoryConfig.api.baseUrl;
    this.apiKey = SpecstoryConfig.api.apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Version': '1.0'
    };
  }

  // Generic API request method
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<SpecstoryAPIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: this.headers,
        signal: AbortSignal.timeout(SpecstoryConfig.api.timeout)
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Specstory API error: ${response.status} - ${data.message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Specstory API request failed:', error);
      throw error;
    }
  }

  // Story Operations
  async getStory(storyId: string): Promise<SpecstoryStory | null> {
    try {
      const response = await this.makeRequest<SpecstoryStory>(`/stories/${storyId}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to get story ${storyId}:`, error);
      return null;
    }
  }

  async getStoriesByProject(projectId: string, page = 1, perPage = 50): Promise<SpecstoryStory[]> {
    try {
      const response = await this.makeRequest<SpecstoryStory[]>(
        `/projects/${projectId}/stories?page=${page}&per_page=${perPage}`
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error(`Failed to get stories for project ${projectId}:`, error);
      return [];
    }
  }

  async createStory(storyData: Partial<SpecstoryStory>): Promise<SpecstoryStory | null> {
    try {
      const response = await this.makeRequest<SpecstoryStory>('/stories', 'POST', storyData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to create story:', error);
      return null;
    }
  }

  async updateStory(storyId: string, updates: Partial<SpecstoryStory>): Promise<SpecstoryStory | null> {
    try {
      const response = await this.makeRequest<SpecstoryStory>(`/stories/${storyId}`, 'PUT', updates);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to update story ${storyId}:`, error);
      return null;
    }
  }

  async updateStoryStatus(storyId: string, status: SpecstoryStoryStatus): Promise<boolean> {
    try {
      const response = await this.updateStory(storyId, { status });
      return !!response;
    } catch (error) {
      console.error(`Failed to update story status ${storyId}:`, error);
      return false;
    }
  }

  async updateStoryProgress(storyId: string, progress: YoshidexSpecstoryProgress): Promise<boolean> {
    try {
      const updates = {
        actualHours: progress.timeLoggedHours,
        // Map progress data to story fields
        // This would depend on how Specstory handles progress tracking
      };
      
      const response = await this.updateStory(storyId, updates);
      return !!response;
    } catch (error) {
      console.error(`Failed to update story progress ${storyId}:`, error);
      return false;
    }
  }

  // Requirement Operations
  async getStoryRequirements(storyId: string): Promise<SpecstoryRequirement[]> {
    try {
      const response = await this.makeRequest<SpecstoryRequirement[]>(`/stories/${storyId}/requirements`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error(`Failed to get requirements for story ${storyId}:`, error);
      return [];
    }
  }

  async addRequirement(storyId: string, requirement: Partial<SpecstoryRequirement>): Promise<SpecstoryRequirement | null> {
    try {
      const response = await this.makeRequest<SpecstoryRequirement>(
        `/stories/${storyId}/requirements`, 
        'POST', 
        requirement
      );
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to add requirement to story ${storyId}:`, error);
      return null;
    }
  }

  async updateRequirement(requirementId: string, updates: Partial<SpecstoryRequirement>): Promise<SpecstoryRequirement | null> {
    try {
      const response = await this.makeRequest<SpecstoryRequirement>(
        `/requirements/${requirementId}`, 
        'PUT', 
        updates
      );
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to update requirement ${requirementId}:`, error);
      return null;
    }
  }

  // Project Operations
  async getProject(projectId: string): Promise<SpecstoryProject | null> {
    try {
      const response = await this.makeRequest<SpecstoryProject>(`/projects/${projectId}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to get project ${projectId}:`, error);
      return null;
    }
  }

  async getWorkspaceProjects(workspaceId: string): Promise<SpecstoryProject[]> {
    try {
      const response = await this.makeRequest<SpecstoryProject[]>(`/workspaces/${workspaceId}/projects`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error(`Failed to get projects for workspace ${workspaceId}:`, error);
      return [];
    }
  }

  // Workspace Operations
  async getWorkspace(workspaceId: string): Promise<SpecstoryWorkspace | null> {
    try {
      const response = await this.makeRequest<SpecstoryWorkspace>(`/workspaces/${workspaceId}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to get workspace ${workspaceId}:`, error);
      return null;
    }
  }

  // Search Operations
  async searchStories(query: string, projectId?: string): Promise<SpecstoryStory[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (projectId) params.append('project_id', projectId);
      
      const response = await this.makeRequest<SpecstoryStory[]>(`/search/stories?${params}`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to search stories:', error);
      return [];
    }
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ status: string }>('/health');
      return response.success && response.data.status === 'ok';
    } catch (error) {
      console.error('Specstory connection test failed:', error);
      return false;
    }
  }

  async syncStoryWithSession(storyId: string, sessionId: string): Promise<boolean> {
    try {
      // This would implement the logic to sync a Specstory story with a Yoshidex session
      // Including updating progress, linking requirements, etc.
      const story = await this.getStory(storyId);
      if (!story) return false;

      // Update the database with story information
      // This would call your Supabase service to update yoshidex_specstory_integration table
      
      return true;
    } catch (error) {
      console.error(`Failed to sync story ${storyId} with session ${sessionId}:`, error);
      return false;
    }
  }

  // Batch Operations
  async syncMultipleStories(storyIds: string[]): Promise<{ success: string[], failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };
    
    for (const storyId of storyIds) {
      try {
        const story = await this.getStory(storyId);
        if (story) {
          results.success.push(storyId);
        } else {
          results.failed.push(storyId);
        }
      } catch (error) {
        results.failed.push(storyId);
      }
    }
    
    return results;
  }

  // Status mapping utilities
  mapSpecstoryStatusToInternal(specstoryStatus: SpecstoryStoryStatus): string {
    return SpecstoryConfig.mappings.storyStatus[specstoryStatus] || specstoryStatus;
  }

  mapInternalStatusToSpecstory(internalStatus: string): SpecstoryStoryStatus {
    const reverseMap = Object.fromEntries(
      Object.entries(SpecstoryConfig.mappings.storyStatus).map(([k, v]) => [v, k])
    );
    return reverseMap[internalStatus] as SpecstoryStoryStatus || 'todo';
  }

  mapSpecstoryPriorityToInternal(specstoryPriority: SpecstoryPriority): string {
    return SpecstoryConfig.mappings.priority[specstoryPriority] || specstoryPriority;
  }
}

// Singleton instance
export const specstoryService = new SpecstoryService();