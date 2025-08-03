// API endpoint for importing Claude Code conversation sessions

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ClaudeCodeParser } from '@/app/services/yoshidex/parsers/ClaudeCodeParser';
import { yoshidexDatabaseService } from '@/app/services/yoshidex/YoshidexDatabaseService';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionTitle = formData.get('sessionTitle') as string;
    const projectId = formData.get('projectId') as string;
    const storyId = formData.get('storyId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['.json', '.md'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExt)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only .json and .md files are supported' 
      }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'yoshidex');
    await mkdir(uploadsDir, { recursive: true });
    
    // Save the uploaded file temporarily
    const tempFileName = `${nanoid()}_${file.name}`;
    const tempFilePath = join(uploadsDir, tempFileName);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);
    
    try {
      // Parse the conversation file
      const parsedSession = await ClaudeCodeParser.parseConversationFile(tempFilePath);
      
      if (!parsedSession) {
        return NextResponse.json({ 
          error: 'Failed to parse conversation file' 
        }, { status: 400 });
      }
      
      // Set user ID and override title if provided
      parsedSession.user_id = userId;
      if (sessionTitle) {
        parsedSession.session_title = sessionTitle;
      }
      if (projectId) {
        parsedSession.specstory_project_id = projectId;
      }
      if (storyId) {
        parsedSession.specstory_story_id = storyId;
      }
      
      // Save the session to database
      const savedSession = await yoshidexDatabaseService.createSession(parsedSession);
      
      if (!savedSession) {
        return NextResponse.json({ 
          error: 'Failed to save session to database' 
        }, { status: 500 });
      }
      
      // Parse and save messages
      const fileContent = buffer.toString('utf-8');
      let conversation;
      
      if (fileExt === '.json') {
        conversation = JSON.parse(fileContent);
      } else {
        // For markdown files, we need to re-parse to get the full conversation structure
        conversation = await ClaudeCodeParser.parseConversationFile(tempFilePath);
      }
      
      if (conversation) {
        const messages = ClaudeCodeParser.convertMessagesToYoshidex(
          conversation, 
          savedSession.yoshidex_session_id
        );
        
        // Save messages to database
        let savedMessagesCount = 0;
        for (const message of messages) {
          const savedMessage = await yoshidexDatabaseService.addMessage(message);
          if (savedMessage) {
            savedMessagesCount++;
          }
        }
        
        // Update session with actual message count
        await yoshidexDatabaseService.updateSession(savedSession.yoshidex_session_id, {
          total_messages: savedMessagesCount
        });
        
        console.log(`Import completed: ${savedMessagesCount} messages saved for session ${savedSession.yoshidex_session_id}`);
      }
      
      // If story ID provided, link to Specstory
      if (storyId) {
        // This would require the Specstory service to fetch story details
        // For now, we'll just mark it as linked
        await yoshidexDatabaseService.updateSession(savedSession.yoshidex_session_id, {
          specstory_story_id: storyId,
          story_status: 'in_progress'
        });
      }
      
      return NextResponse.json({
        success: true,
        session: savedSession,
        message: `Successfully imported Claude Code session: ${savedSession.session_title}`
      });
      
    } finally {
      // Clean up temp file
      try {
        await import('fs/promises').then(fs => fs.unlink(tempFilePath));
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }
    
  } catch (error) {
    console.error('Import session error:', error);
    return NextResponse.json(
      { error: 'Failed to import session' }, 
      { status: 500 }
    );
  }
}

// GET endpoint to check service status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Yoshidex Session Import',
    status: 'active',
    supportedFormats: ['json', 'md'],
    maxFileSize: '10MB'
  });
}