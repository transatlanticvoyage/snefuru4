import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RedditSubmission {
  id: string;
  title: string;
  selftext: string;
  url: string;
  is_self: boolean;
  created_utc: number;
  author: string;
  archived: boolean;
  locked: boolean;
  contest_mode?: boolean;
}

// Check if a Reddit thread is commentable
function isThreadCommentable(submission: RedditSubmission): boolean {
  // A thread is NOT commentable if:
  // 1. It's archived (older than 6 months)
  // 2. It's locked by moderators
  
  if (submission.archived) {
    return false;
  }
  
  if (submission.locked) {
    return false;
  }
  
  return true;
}

// Fetch Reddit thread data using Reddit's JSON API (commentability check only)
async function fetchRedditThreadCommentability(redditUrl: string): Promise<RedditSubmission | null> {
  try {
    // Convert Reddit URL to JSON API format
    let jsonUrl = redditUrl;
    if (!jsonUrl.endsWith('.json')) {
      jsonUrl = jsonUrl.replace(/\/$/, '') + '.json';
    }
    
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'RedditCommentabilityScraper/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Reddit JSON API returns an array with [submission_listing, comments_listing]
    const submissionData = data[0]?.data?.children?.[0]?.data;
    
    if (!submissionData) {
      throw new Error('No submission data found');
    }
    
    const submission: RedditSubmission = {
      id: submissionData.id,
      title: submissionData.title || '',
      selftext: submissionData.selftext || '',
      url: submissionData.url || '',
      is_self: submissionData.is_self || false,
      created_utc: submissionData.created_utc || 0,
      author: submissionData.author || '',
      archived: Boolean(submissionData.archived),
      locked: Boolean(submissionData.locked),
      contest_mode: Boolean(submissionData.contest_mode)
    };
    
    return submission;
    
  } catch (error) {
    console.error('Error fetching Reddit thread commentability:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('🔧 TEST: reddit-commentable-scraper GET endpoint called');
  return NextResponse.json({ message: 'reddit-commentable-scraper API is working', timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  console.log('🚀 REDDIT COMMENTABLE SCRAPER API CALLED');
  try {
    const { selectedUrlIds } = await request.json();
    console.log('📋 Received selectedUrlIds:', selectedUrlIds);
    
    if (!Array.isArray(selectedUrlIds) || selectedUrlIds.length === 0) {
      console.log('❌ ERROR: No URLs provided or invalid format');
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }
    
    console.log(`✅ Processing ${selectedUrlIds.length} URL IDs`);
    const supabase = createServerComponentClient({ cookies });
    
    // Fetch the selected Reddit URLs from the database
    console.log('🗄️ Fetching URLs from database...');
    const { data: redditUrls, error: fetchError } = await supabase
      .from('redditurlsvat')
      .select('url_id, url_datum')
      .in('url_id', selectedUrlIds);
    
    if (fetchError) {
      console.log('❌ DATABASE FETCH ERROR:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch Reddit URLs' }, { status: 500 });
    }
    
    console.log(`📊 Found ${redditUrls?.length || 0} URLs in database:`, redditUrls?.map(u => `${u.url_id}: ${u.url_datum}`));
    
    const results = [];
    
    for (const redditUrl of redditUrls) {
      console.log(`\n🔄 PROCESSING URL ${redditUrls.indexOf(redditUrl) + 1}/${redditUrls.length}`);
      try {
        console.log(`🌐 Checking commentability for Reddit URL: ${redditUrl.url_datum}`);
        
        // Fetch Reddit thread data (commentability only)
        const submission = await fetchRedditThreadCommentability(redditUrl.url_datum);
        if (!submission) {
          results.push({
            url_id: redditUrl.url_id,
            url: redditUrl.url_datum,
            success: false,
            error: 'Failed to fetch Reddit thread data',
            is_commentable: null
          });
          continue;
        }
        
        // Check if thread is commentable
        const isCommentable = isThreadCommentable(submission);
        console.log(`🔍 REDDIT SCRAPER DEBUG - Thread ${submission.id}:`);
        console.log(`   📊 Raw data: archived=${submission.archived}, locked=${submission.locked}, contest_mode=${submission.contest_mode}`);
        console.log(`   🎯 Result: is_commentable=${isCommentable} (should be ${isCommentable ? 'OPEN ✓' : 'CLOSED ✗'})`);
        console.log(`   🗄️ Updating database for url_id=${redditUrl.url_id}`);
        
        // Update the is_commentable field in the database
        const { error: updateError } = await supabase
          .from('redditurlsvat')
          .update({ is_commentable: isCommentable })
          .eq('url_id', redditUrl.url_id);
        
        if (updateError) {
          console.error('❌ Database update FAILED:', updateError);
          results.push({
            url_id: redditUrl.url_id,
            url: redditUrl.url_datum,
            success: false,
            error: 'Failed to update database',
            is_commentable: isCommentable
          });
        } else {
          console.log(`✅ Database update SUCCESS: URL ${redditUrl.url_id} set to is_commentable=${isCommentable} (${isCommentable ? 'OPEN ✓' : 'CLOSED ✗'})`);
          results.push({
            url_id: redditUrl.url_id,
            url: redditUrl.url_datum,
            success: true,
            is_commentable: isCommentable
          });
        }
        
        // Small delay to be polite to Reddit's API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`💥 ERROR processing ${redditUrl.url_datum}:`, error);
        console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        results.push({
          url_id: redditUrl.url_id,
          url: redditUrl.url_datum,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          is_commentable: null
        });
      }
    }
    
    console.log(`\n🎯 FINAL RESULTS SUMMARY:`);
    console.log(`   Total processed: ${results.length}`);
    console.log(`   Successful: ${results.filter(r => r.success).length}`);
    console.log(`   Failed: ${results.filter(r => !r.success).length}`);
    
    return NextResponse.json({
      message: 'Commentability check completed',
      results
    });
    
  } catch (error) {
    console.error('💥 REDDIT COMMENTABILITY SCRAPER FATAL ERROR:', error);
    console.error('💥 Fatal error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}