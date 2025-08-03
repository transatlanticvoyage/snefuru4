// Database service for Yoshidex-Specstory integration

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SpecstoryStory, YoshidexSpecstoryProgress, SpecstoryBlocker, SpecstoryDecision } from './types/specstory.types';

export interface YoshidexSession {
  yoshidex_session_id: string;
  user_id: string;
  claude_session_id: string;
  specstory_project_id?: string;
  session_title: string;
  session_description?: string;
  project_context?: string;
  model_used: string;
  session_status: string;
  total_messages: number;
  total_tokens_used: number;
  session_started_at?: string;
  session_ended_at?: string;
  created_at: string;
  updated_at: string;
  claude_version?: string;
  operating_system?: string;
  workspace_path?: string;
  git_repository_url?: string;
  git_branch?: string;
  git_commit_hash?: string;
  specstory_story_id?: string;
  story_status?: string;
  story_priority?: string;
  estimated_hours?: number;
  actual_hours?: number;
  session_metadata?: any;
  file_attachments?: any;
  tags?: string[];
  is_archived: boolean;
}

export interface YoshidexMessage {
  yoshidex_message_id: string;
  yoshidex_session_id: string;
  claude_message_id?: string;
  message_sequence: number;
  role: string;
  content: string;
  content_type: string;
  message_timestamp?: string;
  response_time_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  model_used?: string;
  temperature?: number;
  max_tokens?: number;
  tools_used?: any;
  tool_results?: any;
  files_read?: any;
  files_written?: any;
  files_analyzed?: any;
  working_directory?: string;
  command_executed?: string;
  command_output?: string;
  addresses_story_requirement: boolean;
  story_progress_notes?: string;
  created_at: string;
  content_search_vector?: any;
  message_hash?: string;
  message_metadata?: any;
  is_error: boolean;
  error_details?: string;
}

export interface YoshidexSpecstoryIntegration {
  integration_id: string;
  yoshidex_session_id: string;
  specstory_story_id: string;
  story_title?: string;
  story_description?: string;
  story_acceptance_criteria?: any;
  story_status?: string;
  story_priority?: string;
  requirements_addressed?: any;
  completion_percentage: number;
  blockers_encountered?: any;
  decisions_made?: any;
  estimated_effort_hours?: number;
  actual_effort_hours?: number;
  time_logged_at?: string;
  related_pull_requests?: any;
  related_issues?: any;
  related_documentation?: any;
  created_at: string;
  updated_at: string;
}

export class YoshidexDatabaseService {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient();
  }

  // Session Management
  async createSession(sessionData: Partial<YoshidexSession>): Promise<YoshidexSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create Yoshidex session:', error);
      return null;
    }
  }

  async getSession(sessionId: string): Promise<YoshidexSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_sessions')
        .select('*')
        .eq('yoshidex_session_id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<YoshidexSession>): Promise<YoshidexSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_sessions')
        .update(updates)
        .eq('yoshidex_session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Failed to update session ${sessionId}:`, error);
      return null;
    }
  }

  async getSessionsByUser(userId: string): Promise<YoshidexSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Failed to get sessions for user ${userId}:`, error);
      return [];
    }
  }

  async getSessionsBySpecstoryProject(projectId: string): Promise<YoshidexSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_sessions')
        .select('*')
        .eq('specstory_project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Failed to get sessions for project ${projectId}:`, error);
      return [];
    }
  }

  // Message Management
  async addMessage(messageData: Partial<YoshidexMessage>): Promise<YoshidexMessage | null> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add message:', error);
      return null;
    }
  }

  async getSessionMessages(sessionId: string): Promise<YoshidexMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_messages')
        .select('*')
        .eq('yoshidex_session_id', sessionId)
        .order('message_sequence', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Failed to get messages for session ${sessionId}:`, error);
      return [];
    }
  }

  async updateMessage(messageId: string, updates: Partial<YoshidexMessage>): Promise<YoshidexMessage | null> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_messages')
        .update(updates)
        .eq('yoshidex_message_id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Failed to update message ${messageId}:`, error);
      return null;
    }
  }

  async searchMessages(query: string, sessionId?: string): Promise<YoshidexMessage[]> {
    try {
      let queryBuilder = this.supabase
        .from('yoshidex_messages')
        .select('*')
        .textSearch('content_search_vector', query);

      if (sessionId) {
        queryBuilder = queryBuilder.eq('yoshidex_session_id', sessionId);
      }

      const { data, error } = await queryBuilder
        .order('message_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }

  // Specstory Integration Management
  async linkSessionToStory(sessionId: string, storyData: SpecstoryStory): Promise<YoshidexSpecstoryIntegration | null> {
    try {
      const integrationData: Partial<YoshidexSpecstoryIntegration> = {
        yoshidex_session_id: sessionId,
        specstory_story_id: storyData.id,
        story_title: storyData.title,
        story_description: storyData.description,
        story_acceptance_criteria: storyData.acceptanceCriteria,
        story_status: storyData.status,
        story_priority: storyData.priority,
        estimated_effort_hours: storyData.estimatedHours,
        actual_effort_hours: storyData.actualHours,
        completion_percentage: 0,
        requirements_addressed: [],
        blockers_encountered: [],
        decisions_made: []
      };

      const { data, error } = await this.supabase
        .from('yoshidex_specstory_integration')
        .insert(integrationData)
        .select()
        .single();

      if (error) throw error;

      // Also update the session with story information
      await this.updateSession(sessionId, {
        specstory_story_id: storyData.id,
        story_status: storyData.status,
        story_priority: storyData.priority,
        estimated_hours: storyData.estimatedHours,
        actual_hours: storyData.actualHours
      });

      return data;
    } catch (error) {
      console.error('Failed to link session to story:', error);
      return null;
    }
  }

  async getSpecstoryIntegration(sessionId: string): Promise<YoshidexSpecstoryIntegration | null> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_specstory_integration')
        .select('*')
        .eq('yoshidex_session_id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Failed to get Specstory integration for session ${sessionId}:`, error);
      return null;
    }
  }

  async updateSpecstoryIntegration(sessionId: string, updates: Partial<YoshidexSpecstoryIntegration>): Promise<YoshidexSpecstoryIntegration | null> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_specstory_integration')
        .update(updates)
        .eq('yoshidex_session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Failed to update Specstory integration for session ${sessionId}:`, error);
      return null;
    }
  }

  async updateProgress(sessionId: string, progress: YoshidexSpecstoryProgress): Promise<boolean> {
    try {
      const updates: Partial<YoshidexSpecstoryIntegration> = {
        requirements_addressed: progress.requirementsAddressed,
        completion_percentage: progress.completionPercentage,
        actual_effort_hours: progress.timeLoggedHours,
        blockers_encountered: progress.blockers,
        decisions_made: progress.decisions,
        time_logged_at: new Date().toISOString()
      };

      const result = await this.updateSpecstoryIntegration(sessionId, updates);
      return !!result;
    } catch (error) {
      console.error(`Failed to update progress for session ${sessionId}:`, error);
      return false;
    }
  }

  async addBlocker(sessionId: string, blocker: SpecstoryBlocker): Promise<boolean> {
    try {
      const integration = await this.getSpecstoryIntegration(sessionId);
      if (!integration) return false;

      const existingBlockers = integration.blockers_encountered || [];
      const updatedBlockers = [...existingBlockers, blocker];

      const result = await this.updateSpecstoryIntegration(sessionId, {
        blockers_encountered: updatedBlockers
      });

      return !!result;
    } catch (error) {
      console.error(`Failed to add blocker for session ${sessionId}:`, error);
      return false;
    }
  }

  async addDecision(sessionId: string, decision: SpecstoryDecision): Promise<boolean> {
    try {
      const integration = await this.getSpecstoryIntegration(sessionId);
      if (!integration) return false;

      const existingDecisions = integration.decisions_made || [];
      const updatedDecisions = [...existingDecisions, decision];

      const result = await this.updateSpecstoryIntegration(sessionId, {
        decisions_made: updatedDecisions
      });

      return !!result;
    } catch (error) {
      console.error(`Failed to add decision for session ${sessionId}:`, error);
      return false;
    }
  }

  // File Operations
  async addFileOperation(operationData: any): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_file_operations')
        .insert(operationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add file operation:', error);
      return null;
    }
  }

  async getFileOperations(sessionId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('yoshidex_file_operations')
        .select('*')
        .eq('yoshidex_session_id', sessionId)
        .order('operation_timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Failed to get file operations for session ${sessionId}:`, error);
      return [];
    }
  }

  // Analytics and Reporting
  async getSessionStats(userId?: string): Promise<any> {
    try {
      let query = this.supabase
        .from('yoshidex_sessions')
        .select('session_status, total_messages, total_tokens_used, estimated_hours, actual_hours');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate statistics
      const stats = {
        totalSessions: data?.length || 0,
        activeSessions: data?.filter(s => s.session_status === 'active').length || 0,
        completedSessions: data?.filter(s => s.session_status === 'completed').length || 0,
        totalMessages: data?.reduce((sum, s) => sum + (s.total_messages || 0), 0) || 0,
        totalTokens: data?.reduce((sum, s) => sum + (s.total_tokens_used || 0), 0) || 0,
        totalEstimatedHours: data?.reduce((sum, s) => sum + (s.estimated_hours || 0), 0) || 0,
        totalActualHours: data?.reduce((sum, s) => sum + (s.actual_hours || 0), 0) || 0,
      };

      return stats;
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return null;
    }
  }
}

// Singleton instance
export const yoshidexDatabaseService = new YoshidexDatabaseService();