// Claude Code conversation parser for Yoshidex integration

import * as fs from 'fs';
import * as path from 'path';
import { YoshidexSession, YoshidexMessage } from '../YoshidexDatabaseService';

export interface ClaudeCodeConversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages: ClaudeCodeMessage[];
  metadata?: {
    version?: string;
    system_info?: SystemInfo;
    workspace?: WorkspaceInfo;
    git_info?: GitInfo;
  };
}

export interface ClaudeCodeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sequence: number;
  metadata?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    response_time_ms?: number;
    tools_used?: ToolUsage[];
    files_read?: FileOperation[];
    files_written?: FileOperation[];
    commands_executed?: CommandExecution[];
    working_directory?: string;
  };
}

export interface ToolUsage {
  name: string;
  input: any;
  output: any;
  execution_time_ms?: number;
}

export interface FileOperation {
  path: string;
  name: string;
  type: 'read' | 'write' | 'create' | 'delete' | 'analyze';
  content_preview?: string;
  line_count?: number;
  size?: number;
  language?: string;
}

export interface CommandExecution {
  command: string;
  working_directory: string;
  output?: string;
  exit_code?: number;
  execution_time_ms?: number;
}

export interface SystemInfo {
  os: string;
  version: string;
  claude_version: string;
}

export interface WorkspaceInfo {
  path: string;
  name: string;
  type?: string;
}

export interface GitInfo {
  repository_url?: string;
  branch?: string;
  commit_hash?: string;
  is_dirty?: boolean;
  untracked_files?: string[];
}

export class ClaudeCodeParser {
  
  // Parse a single conversation file (JSON or Markdown)
  static async parseConversationFile(filePath: string): Promise<YoshidexSession | null> {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const fileExt = path.extname(filePath).toLowerCase();
      
      let conversation: ClaudeCodeConversation;
      
      if (fileExt === '.json') {
        conversation = this.parseJSONConversation(fileContent);
      } else if (fileExt === '.md') {
        conversation = this.parseMarkdownConversation(fileContent);
      } else {
        throw new Error(`Unsupported file format: ${fileExt}`);
      }
      
      return this.convertToYoshidexSession(conversation);
    } catch (error) {
      console.error(`Failed to parse conversation file ${filePath}:`, error);
      return null;
    }
  }

  // Parse JSON format conversation export
  private static parseJSONConversation(jsonContent: string): ClaudeCodeConversation {
    try {
      const data = JSON.parse(jsonContent);
      
      // Handle different JSON structures that Claude Code might export
      if (data.conversation) {
        return data.conversation;
      } else if (data.messages) {
        return data;
      } else {
        throw new Error('Unrecognized JSON conversation format');
      }
    } catch (error) {
      console.error('Failed to parse JSON conversation:', error);
      throw error;
    }
  }

  // Parse Markdown format conversation export
  private static parseMarkdownConversation(markdownContent: string): ClaudeCodeConversation {
    const lines = markdownContent.split('\n');
    const conversation: ClaudeCodeConversation = {
      id: this.generateId(),
      title: 'Parsed Markdown Conversation',
      model: 'claude-3-5-sonnet',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    };

    let currentMessage: Partial<ClaudeCodeMessage> | null = null;
    let messageSequence = 0;
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Parse metadata from front matter or headers
      if (line.startsWith('# ') && i < 10) {
        conversation.title = line.replace('# ', '').trim();
        continue;
      }
      
      // Detect message boundaries
      if (line.startsWith('## ') || line.startsWith('**Human:**') || line.startsWith('**Assistant:**')) {
        // Save previous message if exists
        if (currentMessage && currentMessage.content) {
          conversation.messages.push({
            ...currentMessage,
            content: currentMessage.content.trim()
          } as ClaudeCodeMessage);
        }
        
        // Start new message
        const role = this.extractRoleFromHeader(line);
        currentMessage = {
          id: this.generateId(),
          role,
          content: '',
          timestamp: new Date().toISOString(),
          sequence: messageSequence++
        };
        continue;
      }
      
      // Track code blocks for better parsing
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      
      // Add content to current message
      if (currentMessage) {
        currentMessage.content += line + '\n';
      }
    }
    
    // Add final message
    if (currentMessage && currentMessage.content) {
      conversation.messages.push({
        ...currentMessage,
        content: currentMessage.content.trim()
      } as ClaudeCodeMessage);
    }
    
    return conversation;
  }

  // Extract file operations from message content
  private static extractFileOperations(content: string): FileOperation[] {
    const operations: FileOperation[] = [];
    
    // Look for file read patterns
    const readMatches = content.match(/(?:reading|read|viewing)\s+(?:file\s+)?[`'"']?([^`'"'\s]+)[`'"']?/gi);
    if (readMatches) {
      readMatches.forEach(match => {
        const pathMatch = match.match(/[`'"']?([^`'"'\s]+)[`'"']?$/);
        if (pathMatch) {
          operations.push({
            path: pathMatch[1],
            name: path.basename(pathMatch[1]),
            type: 'read'
          });
        }
      });
    }
    
    // Look for file write patterns
    const writeMatches = content.match(/(?:writing|wrote|creating|created)\s+(?:file\s+)?[`'"']?([^`'"'\s]+)[`'"']?/gi);
    if (writeMatches) {
      writeMatches.forEach(match => {
        const pathMatch = match.match(/[`'"']?([^`'"'\s]+)[`'"']?$/);
        if (pathMatch) {
          operations.push({
            path: pathMatch[1],
            name: path.basename(pathMatch[1]),
            type: 'write'
          });
        }
      });
    }
    
    return operations;
  }

  // Extract command executions from message content
  private static extractCommandExecutions(content: string): CommandExecution[] {
    const commands: CommandExecution[] = [];
    
    // Look for bash/command blocks
    const bashMatches = content.match(/```(?:bash|shell|cmd)\n([\s\S]*?)\n```/gi);
    if (bashMatches) {
      bashMatches.forEach(match => {
        const commandMatch = match.match(/```(?:bash|shell|cmd)\n([\s\S]*?)\n```/i);
        if (commandMatch) {
          commands.push({
            command: commandMatch[1].trim(),
            working_directory: process.cwd() // Default, should be extracted from context
          });
        }
      });
    }
    
    return commands;
  }

  // Extract tool usage from message content
  private static extractToolUsage(content: string): ToolUsage[] {
    const tools: ToolUsage[] = [];
    
    // Look for function call patterns or tool invocations
    const toolPatterns = [
      /using\s+(\w+)\s+tool/gi,
      /calling\s+(\w+)\s+function/gi,
      /executing\s+(\w+)/gi
    ];
    
    toolPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const toolMatch = match.match(/(\w+)/);
          if (toolMatch) {
            tools.push({
              name: toolMatch[1],
              input: {},
              output: {}
            });
          }
        });
      }
    });
    
    return tools;
  }

  // Convert Claude Code conversation to Yoshidex session format
  private static convertToYoshidexSession(conversation: ClaudeCodeConversation): YoshidexSession {
    const session: YoshidexSession = {
      yoshidex_session_id: conversation.id,
      user_id: '', // Will need to be set by the calling code
      claude_session_id: conversation.id,
      session_title: conversation.title || 'Imported Claude Code Session',
      session_description: `Imported from Claude Code - ${conversation.messages.length} messages`,
      model_used: conversation.model || 'claude-3-5-sonnet',
      session_status: 'completed',
      total_messages: conversation.messages.length,
      total_tokens_used: this.calculateTotalTokens(conversation.messages),
      session_started_at: conversation.created_at,
      session_ended_at: conversation.updated_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      claude_version: conversation.metadata?.system_info?.claude_version,
      operating_system: conversation.metadata?.system_info?.os,
      workspace_path: conversation.metadata?.workspace?.path,
      git_repository_url: conversation.metadata?.git_info?.repository_url,
      git_branch: conversation.metadata?.git_info?.branch,
      git_commit_hash: conversation.metadata?.git_info?.commit_hash,
      tags: ['imported', 'claude-code'],
      is_archived: false
    };

    return session;
  }

  // Convert Claude Code messages to Yoshidex message format
  static convertMessagesToYoshidex(
    conversation: ClaudeCodeConversation, 
    sessionId: string
  ): YoshidexMessage[] {
    return conversation.messages.map(message => ({
      yoshidex_message_id: message.id,
      yoshidex_session_id: sessionId,
      claude_message_id: message.id,
      message_sequence: message.sequence,
      role: message.role,
      content: message.content,
      content_type: 'text',
      message_timestamp: message.timestamp,
      response_time_ms: message.metadata?.response_time_ms,
      input_tokens: message.metadata?.input_tokens,
      output_tokens: message.metadata?.output_tokens,
      total_tokens: message.metadata?.total_tokens,
      model_used: message.metadata?.model,
      temperature: message.metadata?.temperature,
      max_tokens: message.metadata?.max_tokens,
      tools_used: message.metadata?.tools_used,
      files_read: message.metadata?.files_read,
      files_written: message.metadata?.files_written,
      working_directory: message.metadata?.working_directory,
      addresses_story_requirement: false,
      created_at: new Date().toISOString(),
      message_hash: this.generateHash(message.content),
      is_error: false
    }));
  }

  // Utility methods
  private static extractRoleFromHeader(header: string): 'user' | 'assistant' | 'system' {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('human') || lowerHeader.includes('user')) {
      return 'user';
    } else if (lowerHeader.includes('assistant') || lowerHeader.includes('claude')) {
      return 'assistant';
    } else {
      return 'system';
    }
  }

  private static calculateTotalTokens(messages: ClaudeCodeMessage[]): number {
    return messages.reduce((total, message) => {
      return total + (message.metadata?.total_tokens || 0);
    }, 0);
  }

  private static generateId(): string {
    return `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateHash(content: string): string {
    // Simple hash function for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Batch processing methods
  static async parseMultipleFiles(filePaths: string[]): Promise<YoshidexSession[]> {
    const results: YoshidexSession[] = [];
    
    for (const filePath of filePaths) {
      const session = await this.parseConversationFile(filePath);
      if (session) {
        results.push(session);
      }
    }
    
    return results;
  }

  static async parseDirectory(directoryPath: string): Promise<YoshidexSession[]> {
    try {
      const files = await fs.promises.readdir(directoryPath);
      const conversationFiles = files
        .filter(file => file.endsWith('.json') || file.endsWith('.md'))
        .map(file => path.join(directoryPath, file));
      
      return await this.parseMultipleFiles(conversationFiles);
    } catch (error) {
      console.error(`Failed to parse directory ${directoryPath}:`, error);
      return [];
    }
  }
}