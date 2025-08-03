// API endpoint for syncing progress between Yoshidex and Specstory

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { yoshidexDatabaseService } from '@/app/services/yoshidex/YoshidexDatabaseService';
import { specstoryService } from '@/app/services/yoshidex/SpecstoryService';
import { YoshidexSpecstoryProgress, SpecstoryBlocker, SpecstoryDecision } from '@/app/services/yoshidex/types/specstory.types';

interface UpdateProgressRequest {
  sessionId: string;
  completionPercentage?: number;
  timeLoggedHours?: number;
  requirementsAddressed?: string[];
  blockers?: SpecstoryBlocker[];
  decisions?: SpecstoryDecision[];
  notes?: string;
  syncToSpecstory?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body: UpdateProgressRequest = await request.json();
    const { 
      sessionId, 
      completionPercentage, 
      timeLoggedHours, 
      requirementsAddressed,
      blockers,
      decisions,
      notes,
      syncToSpecstory = true 
    } = body;
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'sessionId is required' 
      }, { status: 400 });
    }
    
    // Verify the session exists and belongs to the user
    const existingSession = await yoshidexDatabaseService.getSession(sessionId);
    if (!existingSession) {
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }
    
    if (existingSession.user_id !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized access to session' 
      }, { status: 403 });
    }
    
    // Get existing integration
    const integration = await yoshidexDatabaseService.getSpecstoryIntegration(sessionId);
    if (!integration) {
      return NextResponse.json({ 
        error: 'Session is not linked to a Specstory story' 
      }, { status: 400 });
    }
    
    // Build progress update object
    const progressUpdate: YoshidexSpecstoryProgress = {
      sessionId,
      storyId: integration.specstory_story_id,
      requirementsAddressed: requirementsAddressed || integration.requirements_addressed || [],
      completionPercentage: completionPercentage ?? integration.completion_percentage,
      timeLoggedHours: timeLoggedHours ?? integration.actual_effort_hours ?? 0,
      blockers: blockers || integration.blockers_encountered || [],
      decisions: decisions || integration.decisions_made || [],
      updatedAt: new Date().toISOString()
    };
    
    // Update local progress
    const updateResult = await yoshidexDatabaseService.updateProgress(sessionId, progressUpdate);
    if (!updateResult) {
      return NextResponse.json({ 
        error: 'Failed to update local progress' 
      }, { status: 500 });
    }
    
    // Update session record with new progress
    const sessionUpdates: any = {
      actual_hours: progressUpdate.timeLoggedHours,
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      sessionUpdates.session_description = notes;
    }
    
    await yoshidexDatabaseService.updateSession(sessionId, sessionUpdates);
    
    // Sync to Specstory if requested
    let specstorySyncResult = null;
    if (syncToSpecstory && integration.specstory_story_id) {
      try {
        specstorySyncResult = await specstoryService.updateStoryProgress(
          integration.specstory_story_id, 
          progressUpdate
        );
        
        if (specstorySyncResult) {
          console.log(`Progress synced to Specstory for story ${integration.specstory_story_id}`);
        } else {
          console.warn(`Failed to sync progress to Specstory for story ${integration.specstory_story_id}`);
        }
      } catch (syncError) {
        console.error('Specstory sync error:', syncError);
        // Don't fail the request if sync fails, just log it
      }
    }
    
    // Get updated integration data
    const updatedIntegration = await yoshidexDatabaseService.getSpecstoryIntegration(sessionId);
    
    return NextResponse.json({
      success: true,
      progress: progressUpdate,
      integration: updatedIntegration,
      specstorySynced: specstorySyncResult,
      message: 'Progress updated successfully'
    });
    
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' }, 
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current progress for a session
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'sessionId parameter is required' 
      }, { status: 400 });
    }
    
    // Get the session
    const yoshidexSession = await yoshidexDatabaseService.getSession(sessionId);
    if (!yoshidexSession) {
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }
    
    if (yoshidexSession.user_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized access to session' 
      }, { status: 403 });
    }
    
    // Get integration and progress data
    const integration = await yoshidexDatabaseService.getSpecstoryIntegration(sessionId);
    
    if (!integration) {
      return NextResponse.json({
        sessionId,
        hasIntegration: false,
        progress: null
      });
    }
    
    // Format progress data
    const progressData: YoshidexSpecstoryProgress = {
      sessionId,
      storyId: integration.specstory_story_id,
      requirementsAddressed: integration.requirements_addressed || [],
      completionPercentage: integration.completion_percentage,
      timeLoggedHours: integration.actual_effort_hours || 0,
      blockers: integration.blockers_encountered || [],
      decisions: integration.decisions_made || [],
      updatedAt: integration.updated_at
    };
    
    // Optionally fetch latest data from Specstory
    let specstoryStory = null;
    if (integration.specstory_story_id) {
      try {
        specstoryStory = await specstoryService.getStory(integration.specstory_story_id);
      } catch (error) {
        console.error('Failed to fetch story from Specstory:', error);
      }
    }
    
    return NextResponse.json({
      sessionId,
      hasIntegration: true,
      integration,
      progress: progressData,
      specstoryStory
    });
    
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Failed to get progress information' }, 
      { status: 500 }
    );
  }
}

// PUT endpoint for adding blockers or decisions
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { sessionId, action, data } = body;
    
    if (!sessionId || !action || !data) {
      return NextResponse.json({ 
        error: 'sessionId, action, and data are required' 
      }, { status: 400 });
    }
    
    // Verify session ownership
    const existingSession = await yoshidexDatabaseService.getSession(sessionId);
    if (!existingSession || existingSession.user_id !== userId) {
      return NextResponse.json({ 
        error: 'Session not found or unauthorized' 
      }, { status: 404 });
    }
    
    let result = false;
    let message = '';
    
    switch (action) {
      case 'add_blocker':
        result = await yoshidexDatabaseService.addBlocker(sessionId, data as SpecstoryBlocker);
        message = 'Blocker added successfully';
        break;
        
      case 'add_decision':
        result = await yoshidexDatabaseService.addDecision(sessionId, data as SpecstoryDecision);
        message = 'Decision added successfully';
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: add_blocker, add_decision' 
        }, { status: 400 });
    }
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to perform action' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      action,
      message
    });
    
  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' }, 
      { status: 500 }
    );
  }
}