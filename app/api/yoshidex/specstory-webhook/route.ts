// Webhook endpoint for receiving Specstory updates

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SpecstoryConfig } from '@/app/services/yoshidex/config/specstory.config';
import { SpecstoryWebhookEvent } from '@/app/services/yoshidex/types/specstory.types';
import { yoshidexDatabaseService } from '@/app/services/yoshidex/YoshidexDatabaseService';
import crypto from 'crypto';

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('x-specstory-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    
    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, SpecstoryConfig.webhook.secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse the webhook event
    const event: SpecstoryWebhookEvent = JSON.parse(payload);
    
    console.log(`Received Specstory webhook: ${event.type} for story ${event.data.story?.id}`);
    
    // Process the webhook event
    switch (event.type) {
      case 'story.created':
        await handleStoryCreated(event);
        break;
        
      case 'story.updated':
        await handleStoryUpdated(event);
        break;
        
      case 'story.completed':
        await handleStoryCompleted(event);
        break;
        
      case 'requirement.created':
        await handleRequirementCreated(event);
        break;
        
      case 'requirement.updated':
        await handleRequirementUpdated(event);
        break;
        
      case 'progress.updated':
        await handleProgressUpdated(event);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
    
    return NextResponse.json({ success: true, processed: event.type });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

// Event handlers
async function handleStoryCreated(event: SpecstoryWebhookEvent) {
  if (!event.data.story) return;
  
  const story = event.data.story;
  
  // Check if we have any sessions linked to this project
  const projectSessions = await yoshidexDatabaseService.getSessionsBySpecstoryProject(
    story.projectId
  );
  
  console.log(`Story created: ${story.title} (${story.id}) - ${projectSessions.length} related sessions`);
  
  // Log the story creation for potential future linking
  // This could be extended to automatically suggest sessions to link based on content similarity
}

async function handleStoryUpdated(event: SpecstoryWebhookEvent) {
  if (!event.data.story) return;
  
  const story = event.data.story;
  const changes = event.data.changes || [];
  
  // Find sessions linked to this story
  const linkedSessions = await findSessionsByStoryId(story.id);
  
  for (const session of linkedSessions) {
    // Update session with new story data
    await yoshidexDatabaseService.updateSession(session.yoshidex_session_id, {
      story_status: story.status,
      story_priority: story.priority,
      estimated_hours: story.estimatedHours,
      actual_hours: story.actualHours,
      updated_at: new Date().toISOString()
    });
    
    // Update integration record
    await yoshidexDatabaseService.updateSpecstoryIntegration(session.yoshidex_session_id, {
      story_status: story.status,
      story_priority: story.priority,
      story_title: story.title,
      story_description: story.description,
      estimated_effort_hours: story.estimatedHours,
      actual_effort_hours: story.actualHours,
      updated_at: new Date().toISOString()
    });
  }
  
  console.log(`Story updated: ${story.title} - Updated ${linkedSessions.length} linked sessions`);
}

async function handleStoryCompleted(event: SpecstoryWebhookEvent) {
  if (!event.data.story) return;
  
  const story = event.data.story;
  const linkedSessions = await findSessionsByStoryId(story.id);
  
  for (const session of linkedSessions) {
    // Mark sessions as completed and archive if desired
    await yoshidexDatabaseService.updateSession(session.yoshidex_session_id, {
      session_status: 'completed',
      story_status: 'done',
      session_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Update integration with 100% completion
    await yoshidexDatabaseService.updateSpecstoryIntegration(session.yoshidex_session_id, {
      completion_percentage: 100,
      story_status: 'done',
      updated_at: new Date().toISOString()
    });
  }
  
  console.log(`Story completed: ${story.title} - Marked ${linkedSessions.length} sessions as completed`);
}

async function handleRequirementCreated(event: SpecstoryWebhookEvent) {
  if (!event.data.requirement) return;
  
  const requirement = event.data.requirement;
  console.log(`New requirement created: ${requirement.title}`);
  
  // This could trigger notifications to relevant session owners
  // or automatically analyze session content for potential matches
}

async function handleRequirementUpdated(event: SpecstoryWebhookEvent) {
  if (!event.data.requirement) return;
  
  const requirement = event.data.requirement;
  console.log(`Requirement updated: ${requirement.title} - Status: ${requirement.status}`);
}

async function handleProgressUpdated(event: SpecstoryWebhookEvent) {
  console.log('Progress update received from Specstory');
  
  // Handle progress updates from Specstory side
  // This could sync with our internal progress tracking
}

// Helper function to find sessions linked to a story
async function findSessionsByStoryId(storyId: string) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('yoshidex_sessions')
    .select('*')
    .eq('specstory_story_id', storyId);
  
  if (error) {
    console.error('Error finding sessions by story ID:', error);
    return [];
  }
  
  return data || [];
}

// GET endpoint for webhook verification/testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Yoshidex Specstory Webhook',
    status: 'active',
    endpoint: SpecstoryConfig.webhook.endpoint,
    events: SpecstoryConfig.webhook.events
  });
}