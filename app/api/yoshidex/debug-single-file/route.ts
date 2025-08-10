import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeCodeParser } from '@/app/services/yoshidex/parsers/ClaudeCodeParser';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { filename } = await request.json();
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const specstoryHistoryDir = path.join(process.cwd(), '.specstory', 'history');
    const filePath = path.join(specstoryHistoryDir, filename);
    
    console.log(`=== DEBUGGING SINGLE FILE: ${filename} ===`);
    console.log(`File path: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        error: 'File not found',
        filePath,
        exists: false
      }, { status: 404 });
    }

    const stats = fs.statSync(filePath);
    console.log(`File stats:`, {
      size: stats.size,
      modified: stats.mtime,
      isFile: stats.isFile()
    });

    // Read file content
    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath, 'utf-8');
      console.log(`File content length: ${fileContent.length}`);
      console.log(`First 500 chars:`, fileContent.substring(0, 500));
    } catch (readError) {
      console.error('Error reading file:', readError);
      return NextResponse.json({ 
        error: 'Failed to read file',
        details: readError instanceof Error ? readError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Parse the conversation file
    let session;
    try {
      console.log('=== PARSING FILE ===');
      session = await ClaudeCodeParser.parseConversationFile(filePath);
      console.log('Parse result:', session ? 'SUCCESS' : 'NULL');
      
      if (session) {
        console.log('Session details:', {
          yoshidex_session_id: session.yoshidex_session_id,
          claude_session_id: session.claude_session_id,
          session_title: session.session_title,
          total_messages: session.total_messages,
          user_id: session.user_id
        });
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse file',
        details: parseError instanceof Error ? parseError.message : 'Unknown error',
        stack: parseError instanceof Error ? parseError.stack : undefined
      }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ 
        error: 'Parsing returned null',
        fileContent: fileContent.substring(0, 1000) // First 1000 chars for debugging
      }, { status: 400 });
    }

    // Set user ID
    session.user_id = user.id;

    return NextResponse.json({
      success: true,
      message: 'File parsed successfully',
      session: {
        yoshidex_session_id: session.yoshidex_session_id,
        claude_session_id: session.claude_session_id,
        session_title: session.session_title,
        session_description: session.session_description,
        total_messages: session.total_messages,
        model_used: session.model_used,
        session_status: session.session_status,
        created_at: session.created_at,
        tags: session.tags
      },
      fileInfo: {
        filename,
        size: stats.size,
        contentPreview: fileContent.substring(0, 500)
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const specstoryHistoryDir = path.join(process.cwd(), '.specstory', 'history');
    
    if (!fs.existsSync(specstoryHistoryDir)) {
      return NextResponse.json({ 
        error: 'SpecStory history directory not found',
        path: specstoryHistoryDir 
      }, { status: 404 });
    }

    const files = fs.readdirSync(specstoryHistoryDir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 10) // First 10 for testing
      .map(file => {
        const filePath = path.join(specstoryHistoryDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime
        };
      });

    return NextResponse.json({
      success: true,
      directory: specstoryHistoryDir,
      files
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to list files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}