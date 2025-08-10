import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeCodeParser } from '@/app/services/yoshidex/parsers/ClaudeCodeParser';
import { yoshidexDatabaseService } from '@/app/services/yoshidex/YoshidexDatabaseService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const specstoryHistoryDir = path.join(process.cwd(), '.specstory', 'history');
    
    // Check if directory exists
    if (!fs.existsSync(specstoryHistoryDir)) {
      return NextResponse.json({ 
        error: 'SpecStory history directory not found',
        path: specstoryHistoryDir 
      }, { status: 404 });
    }

    // Get all markdown files
    const files = fs.readdirSync(specstoryHistoryDir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a)); // Most recent first

    const results = {
      total: files.length,
      processed: 0,
      failed: 0,
      errors: [] as string[],
      imported: [] as string[]
    };

    // Process each file
    for (const filename of files) {
      const filePath = path.join(specstoryHistoryDir, filename);
      
      try {
        console.log(`Processing file: ${filename}`);
        
        // Parse the conversation file
        console.log(`[${filename}] Step 1: Starting parsing...`);
        const session = await ClaudeCodeParser.parseConversationFile(filePath);
        
        if (!session) {
          console.error(`[${filename}] FAILED - Step 1: No session data extracted`);
          results.failed++;
          results.errors.push(`Failed to parse ${filename}: No session data extracted`);
          continue;
        }
        
        console.log(`[${filename}] Step 1: SUCCESS - Parsed session ${session.claude_session_id} with ${session.total_messages} messages`);
        
        // Set the user ID
        session.user_id = user.id;
        console.log(`[${filename}] Step 2: Set user_id = ${user.id}`);
        
        // Check if this session already exists
        console.log(`[${filename}] Step 3: Checking if session already exists...`);
        let existingSession;
        try {
          existingSession = await yoshidexDatabaseService.getSessionByClaudeId(session.claude_session_id);
          console.log(`[${filename}] Step 3: Database check result - ${existingSession ? 'EXISTS' : 'NOT_FOUND'}`);
        } catch (dbError) {
          console.error(`[${filename}] FAILED - Step 3: Database check error:`, dbError);
          results.failed++;
          results.errors.push(`Database check failed for ${filename}: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
          continue;
        }
        
        if (existingSession) {
          console.log(`[${filename}] SKIPPED - Session ${session.claude_session_id} already exists`);
          continue;
        }
        
        // Save session to database
        console.log(`[${filename}] Step 4: Creating session in database...`);
        console.log(`[${filename}] Session data:`, {
          yoshidex_session_id: session.yoshidex_session_id,
          claude_session_id: session.claude_session_id,
          user_id: session.user_id,
          session_title: session.session_title,
          total_messages: session.total_messages
        });
        
        let savedSession;
        try {
          savedSession = await yoshidexDatabaseService.createSession(session);
          console.log(`[${filename}] Step 4: Create session result - ${savedSession ? 'SUCCESS' : 'NULL_RESULT'}`);
          if (savedSession) {
            console.log(`[${filename}] Saved session ID: ${savedSession.yoshidex_session_id}`);
          }
        } catch (dbError) {
          console.error(`[${filename}] FAILED - Step 4: Create session error:`, dbError);
          results.failed++;
          results.errors.push(`Failed to create session for ${filename}: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
          continue;
        }
        
        if (!savedSession) {
          console.error(`[${filename}] FAILED - Step 4: createSession returned null`);
          results.failed++;
          results.errors.push(`Failed to save session for ${filename}: createSession returned null`);
          continue;
        }
        
        // Parse and save messages
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const conversation = await ClaudeCodeParser.parseConversationFile(filePath);
        
        let messageCount = 0;
        if (conversation) {
          const messages = ClaudeCodeParser.convertMessagesToYoshidex(
            { 
              ...conversation, 
              messages: conversation.messages || [] 
            },
            savedSession.yoshidex_session_id
          );
          
          // Save messages
          for (const message of messages) {
            const savedMessage = await yoshidexDatabaseService.addMessage(message);
            if (savedMessage) {
              messageCount++;
            }
          }
          
          // Update session with actual message count
          await yoshidexDatabaseService.updateSession(savedSession.yoshidex_session_id, {
            total_messages: messageCount
          });
        }
        
        results.processed++;
        results.imported.push(`${filename} (${messageCount} messages)`);
        
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
        results.failed++;
        results.errors.push(`Error processing ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. Processed: ${results.processed}, Failed: ${results.failed}`,
      results
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const specstoryHistoryDir = path.join(process.cwd(), '.specstory', 'history');
    
    // Check if directory exists
    if (!fs.existsSync(specstoryHistoryDir)) {
      return NextResponse.json({ 
        error: 'SpecStory history directory not found',
        path: specstoryHistoryDir 
      }, { status: 404 });
    }

    // Get all markdown files
    const files = fs.readdirSync(specstoryHistoryDir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a))
      .map(file => {
        const filePath = path.join(specstoryHistoryDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime,
          path: filePath
        };
      });

    return NextResponse.json({
      success: true,
      directory: specstoryHistoryDir,
      fileCount: files.length,
      files: files.slice(0, 20) // Return first 20 for preview
    });

  } catch (error) {
    console.error('Directory scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan directory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}