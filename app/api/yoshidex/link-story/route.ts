// API endpoint for linking Yoshidex sessions to Specstory stories

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { yoshidexDatabaseService } from '@/app/services/yoshidex/YoshidexDatabaseService';
import { specstoryService } from '@/app/services/yoshidex/SpecstoryService';

interface LinkStoryRequest {
  sessionId: string;
  storyId: string;
  userId?: string;
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
    
    const body: LinkStoryRequest = await request.json();
    const { sessionId, storyId } = body;
    
    if (!sessionId || !storyId) {
      return NextResponse.json({ 
        error: 'sessionId and storyId are required' 
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
    
    // Fetch story details from Specstory
    const story = await specstoryService.getStory(storyId);
    if (!story) {
      return NextResponse.json({ 
        error: 'Story not found in Specstory' 
      }, { status: 404 });
    }
    
    // Check if session is already linked to a different story
    const existingIntegration = await yoshidexDatabaseService.getSpecstoryIntegration(sessionId);
    if (existingIntegration && existingIntegration.specstory_story_id !== storyId) {
      return NextResponse.json({ 
        error: `Session is already linked to story ${existingIntegration.specstory_story_id}` 
      }, { status: 409 });
    }
    
    // Create or update the integration
    let integration;
    if (existingIntegration) {
      // Update existing integration
      integration = await yoshidexDatabaseService.updateSpecstoryIntegration(sessionId, {
        story_title: story.title,
        story_description: story.description,
        story_status: story.status,
        story_priority: story.priority,
        estimated_effort_hours: story.estimatedHours,
        actual_effort_hours: story.actualHours,
        updated_at: new Date().toISOString()
      });
    } else {
      // Create new integration
      integration = await yoshidexDatabaseService.linkSessionToStory(sessionId, story);
    }
    
    if (!integration) {
      return NextResponse.json({ 
        error: 'Failed to create integration' 
      }, { status: 500 });
    }
    
    // Update the session with story information
    const updatedSession = await yoshidexDatabaseService.updateSession(sessionId, {
      specstory_story_id: storyId,
      specstory_project_id: story.projectId,
      story_status: story.status,
      story_priority: story.priority,
      estimated_hours: story.estimatedHours,
      actual_hours: story.actualHours,
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      session: updatedSession,
      integration,
      story: {
        id: story.id,
        title: story.title,
        status: story.status,
        priority: story.priority
      },
      message: `Successfully linked session to story: ${story.title}`
    });
    
  } catch (error) {
    console.error('Link story error:', error);
    return NextResponse.json(
      { error: 'Failed to link session to story' }, 
      { status: 500 }
    );
  }
}

// GET endpoint to check existing links for a session
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
    
    // Get integration details
    const integration = await yoshidexDatabaseService.getSpecstoryIntegration(sessionId);
    
    let linkedStory = null;
    if (integration && integration.specstory_story_id) {
      // Fetch current story details from Specstory
      linkedStory = await specstoryService.getStory(integration.specstory_story_id);
    }
    
    return NextResponse.json({
      sessionId,
      hasLinkedStory: !!integration,
      integration: integration || null,
      story: linkedStory || null
    });
    
  } catch (error) {
    console.error('Get link info error:', error);
    return NextResponse.json(
      { error: 'Failed to get link information' }, 
      { status: 500 }
    );
  }
}

// DELETE endpoint to unlink a session from a story
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { sessionId } = await request.json();
    
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
    
    // Remove story link from session
    const updatedSession = await yoshidexDatabaseService.updateSession(sessionId, {
      specstory_story_id: null,
      specstory_project_id: null,
      story_status: null,
      story_priority: null,
      estimated_hours: null,
      actual_hours: null,
      updated_at: new Date().toISOString()
    });
    
    // Remove or mark integration as inactive
    await supabase
      .from('yoshidex_specstory_integration')
      .delete()
      .eq('yoshidex_session_id', sessionId);
    
    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Successfully unlinked session from story'
    });
    
  } catch (error) {
    console.error('Unlink story error:', error);
    return NextResponse.json(
      { error: 'Failed to unlink session from story' }, 
      { status: 500 }
    );
  }
}