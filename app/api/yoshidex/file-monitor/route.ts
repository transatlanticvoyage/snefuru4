// API endpoint for controlling the Claude Code file monitor

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { defaultFileMonitor, FileMonitor } from '@/app/services/yoshidex/FileMonitor';
import { join } from 'path';

// GET endpoint to check monitor status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const status = defaultFileMonitor.getMonitoringStatus();
    
    return NextResponse.json({
      service: 'Yoshidex File Monitor',
      ...status,
      config: {
        autoImportEnabled: false,
        supportedFormats: ['json', 'md'],
        watchPatterns: [
          'claude-conversation-*.json',
          'claude-session-*.md',
          '*.json',
          '*.md'
        ]
      }
    });
    
  } catch (error) {
    console.error('File monitor status error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitor status' }, 
      { status: 500 }
    );
  }
}

// POST endpoint to control monitoring (start/stop/process)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { action, filename } = body;
    
    if (!action) {
      return NextResponse.json({ 
        error: 'action is required' 
      }, { status: 400 });
    }
    
    switch (action) {
      case 'start':
        if (defaultFileMonitor.getMonitoringStatus().isMonitoring) {
          return NextResponse.json({
            success: false,
            message: 'Monitor is already running'
          });
        }
        
        defaultFileMonitor.startMonitoring();
        
        return NextResponse.json({
          success: true,
          message: 'File monitoring started',
          status: defaultFileMonitor.getMonitoringStatus()
        });
        
      case 'stop':
        defaultFileMonitor.stopMonitoring();
        
        return NextResponse.json({
          success: true,
          message: 'File monitoring stopped',
          status: defaultFileMonitor.getMonitoringStatus()
        });
        
      case 'process_file':
        if (!filename) {
          return NextResponse.json({ 
            error: 'filename is required for process_file action' 
          }, { status: 400 });
        }
        
        const result = await defaultFileMonitor.processFileManually(filename, userId);
        
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: `File processed successfully: ${filename}`,
            result
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `Failed to process file: ${filename}`,
            error: result.error
          }, { status: 400 });
        }
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: start, stop, process_file' 
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('File monitor control error:', error);
    return NextResponse.json(
      { error: 'Failed to control file monitor' }, 
      { status: 500 }
    );
  }
}

// PUT endpoint to update monitor configuration
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json();
    const { watchDirectory, autoImport, filePatterns } = body;
    
    // This would require creating a new monitor instance with updated config
    // For now, return the current configuration
    const currentStatus = defaultFileMonitor.getMonitoringStatus();
    
    return NextResponse.json({
      message: 'Configuration update not yet implemented',
      currentStatus,
      requestedChanges: {
        watchDirectory,
        autoImport,
        filePatterns
      }
    });
    
  } catch (error) {
    console.error('File monitor config error:', error);
    return NextResponse.json(
      { error: 'Failed to update monitor configuration' }, 
      { status: 500 }
    );
  }
}