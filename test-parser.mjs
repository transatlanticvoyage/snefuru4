// Simple test script for Claude Code Parser
import * as fs from 'fs';
import * as path from 'path';

// Simplified parser for testing
class TestClaudeCodeParser {
  static async parseConversationFile(filePath) {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const fileExt = path.extname(filePath).toLowerCase();
      
      if (fileExt === '.md') {
        return this.parseMarkdownConversation(fileContent);
      } else {
        console.log('Only markdown files supported in this test');
        return null;
      }
    } catch (error) {
      console.error(`Failed to parse conversation file ${filePath}:`, error);
      return null;
    }
  }

  static parseMarkdownConversation(markdownContent) {
    const lines = markdownContent.split('\n');
    const conversation = {
      id: this.generateId(),
      title: 'Parsed SpecStory Conversation',
      model: 'claude-opus-4-20250514', // Default model
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    };

    let currentMessage = null;
    let messageSequence = 0;
    let inSession = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Extract session ID from comment
      if (line.includes('Claude Code Session')) {
        const sessionMatch = line.match(/Session\s+([a-f0-9\-]+)/);
        if (sessionMatch) {
          conversation.id = sessionMatch[1];
        }
        inSession = true;
        continue;
      }
      
      // Parse timestamp header
      if (line.startsWith('## ') && line.includes('Z')) {
        const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}Z)/);
        if (timestampMatch) {
          conversation.created_at = timestampMatch[1].replace(' ', 'T');
          conversation.title = `Session from ${timestampMatch[1]}`;
        }
        continue;
      }
      
      // Detect message boundaries - SpecStory uses _**User**_ and _**Agent**_ format
      if (line.match(/^_\*\*(User|Agent)/)) {
        // Save previous message if exists
        if (currentMessage && currentMessage.content) {
          conversation.messages.push({
            ...currentMessage,
            content: currentMessage.content.trim()
          });
        }
        
        // Determine role
        const role = line.includes('User') ? 'user' : 'assistant'; 
        
        // Start new message
        currentMessage = {
          id: this.generateId(),
          role,
          content: '',
          timestamp: conversation.created_at,
          sequence: messageSequence++
        };
        continue;
      }
      
      // Skip separator lines
      if (line.trim() === '---') {
        continue;
      }
      
      // Add content to current message
      if (currentMessage && inSession) {
        currentMessage.content += line + '\n';
      }
    }
    
    // Add final message
    if (currentMessage && currentMessage.content) {
      conversation.messages.push({
        ...currentMessage,
        content: currentMessage.content.trim()
      });
    }
    
    return {
      yoshidex_session_id: conversation.id,
      claude_session_id: conversation.id,
      session_title: conversation.title,
      model_used: conversation.model,
      session_status: 'completed',
      total_messages: conversation.messages.length,
      total_tokens_used: this.estimateTokens(conversation.messages),
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      is_archived: false
    };
  }

  static estimateTokens(messages) {
    return messages.reduce((total, message) => {
      return total + Math.ceil(message.content.length / 4); // Rough estimate
    }, 0);
  }

  static generateId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Test the parser
async function testParser() {
  try {
    console.log('🧪 Testing Claude Code Parser with real SpecStory export...\n');
    
    const testFile = '/Users/kylecampbell/Documents/repos/localrepo-snefuru4/uploads/claude-exports/test-session.md';
    const result = await TestClaudeCodeParser.parseConversationFile(testFile);
    
    if (result) {
      console.log('✅ Parser Success!\n');
      console.log('📊 Parsed Session Details:');
      console.log('  Session ID:', result.yoshidex_session_id);
      console.log('  Claude Session ID:', result.claude_session_id);
      console.log('  Title:', result.session_title);
      console.log('  Total Messages:', result.total_messages);
      console.log('  Model:', result.model_used);
      console.log('  Status:', result.session_status);
      console.log('  Estimated Tokens:', result.total_tokens_used);
      console.log('  Created:', result.created_at);
      console.log('  Archived:', result.is_archived);
      
      console.log('\n🎯 Test Result: PASSED');
      console.log('The parser successfully extracted', result.total_messages, 'messages from the SpecStory markdown file!');
    } else {
      console.log('❌ Parser failed to return results');
      console.log('🎯 Test Result: FAILED');
    }
  } catch (error) {
    console.error('❌ Parser Error:', error.message);
    console.log('🎯 Test Result: FAILED');
  }
}

testParser();