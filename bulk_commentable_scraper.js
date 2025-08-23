// Bulk scraper for all Reddit URLs in redditurlsvat table
// Processes is_commentable status for all 16,900+ URLs with rate limiting

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jerylujyofmmjukwlwvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcnlsdWp5b2ZtbWp1a3dsd3ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNTE1MCwiZXhwIjoyMDcwMDAxMTUwfQ.09zsgogOOCZeaJ9R6K5D4q2_jzKXFh54f-CNBfwrEQc'
);

// Configuration
const BATCH_SIZE = 50;           // Process 50 URLs at a time
const DELAY_BETWEEN_BATCHES = 5000;  // 5 second delay between batches
const DELAY_BETWEEN_REQUESTS = 300;  // 300ms delay between individual Reddit API calls
const MAX_RETRIES = 3;          // Retry failed requests up to 3 times

// Reddit API interfaces
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
  if (submission.archived) {
    return false;
  }
  
  if (submission.locked) {
    return false;
  }
  
  return true;
}

// Fetch Reddit thread data for commentability check
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

// Process a single URL with retry logic
async function processUrl(redditUrl: any, retryCount = 0): Promise<any> {
  try {
    // Fetch Reddit thread data
    const submission = await fetchRedditThreadCommentability(redditUrl.url_datum);
    if (!submission) {
      return {
        url_id: redditUrl.url_id,
        url: redditUrl.url_datum,
        success: false,
        error: 'Failed to fetch Reddit thread data',
        is_commentable: null
      };
    }
    
    // Check if thread is commentable
    const isCommentable = isThreadCommentable(submission);
    
    // Update the is_commentable field in the database
    const { error: updateError } = await supabase
      .from('redditurlsvat')
      .update({ is_commentable: isCommentable })
      .eq('url_id', redditUrl.url_id);
    
    if (updateError) {
      console.error(`❌ Database update failed for URL ${redditUrl.url_id}:`, updateError);
      return {
        url_id: redditUrl.url_id,
        url: redditUrl.url_datum,
        success: false,
        error: 'Database update failed',
        is_commentable: isCommentable
      };
    }
    
    return {
      url_id: redditUrl.url_id,
      url: redditUrl.url_datum,
      success: true,
      is_commentable: isCommentable
    };
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`⚠️  Retrying URL ${redditUrl.url_id} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return processUrl(redditUrl, retryCount + 1);
    }
    
    return {
      url_id: redditUrl.url_id,
      url: redditUrl.url_datum,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      is_commentable: null
    };
  }
}

// Main bulk processing function
async function bulkScrapeCommentability() {
  const startTime = Date.now();
  console.log('🚀 BULK REDDIT COMMENTABILITY SCRAPER STARTED');
  console.log('===============================================');
  console.log(`📊 Configuration:`);
  console.log(`   - Batch size: ${BATCH_SIZE} URLs`);
  console.log(`   - Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log(`   - Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log(`   - Max retries: ${MAX_RETRIES}`);
  console.log('');
  
  try {
    // Get total count first
    console.log('📋 Counting total URLs...');
    const { count: totalCount, error: countError } = await supabase
      .from('redditurlsvat')
      .select('*', { count: 'exact', head: true })
      .not('url_datum', 'is', null);
    
    if (countError) {
      throw new Error(`Failed to count URLs: ${countError.message}`);
    }
    
    console.log(`📊 Total URLs to process: ${totalCount}`);
    console.log(`📦 Total batches: ${Math.ceil(totalCount / BATCH_SIZE)}`);
    console.log(`⏱️  Estimated time: ${Math.round((totalCount * DELAY_BETWEEN_REQUESTS + Math.ceil(totalCount / BATCH_SIZE) * DELAY_BETWEEN_BATCHES) / 1000 / 60)} minutes`);
    console.log('');
    
    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;
    let openCount = 0;
    let closedCount = 0;
    let offset = 0;
    let batchNumber = 1;
    
    while (offset < totalCount) {
      console.log(`\n🔄 BATCH ${batchNumber}/${Math.ceil(totalCount / BATCH_SIZE)} (URLs ${offset + 1}-${Math.min(offset + BATCH_SIZE, totalCount)})`);
      console.log('=' .repeat(60));
      
      // Fetch batch of URLs
      const { data: redditUrls, error: fetchError } = await supabase
        .from('redditurlsvat')
        .select('url_id, url_datum')
        .not('url_datum', 'is', null)
        .order('url_id', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);
      
      if (fetchError) {
        console.error(`❌ Failed to fetch batch ${batchNumber}:`, fetchError);
        break;
      }
      
      if (!redditUrls || redditUrls.length === 0) {
        console.log('✅ No more URLs to process');
        break;
      }
      
      console.log(`📦 Processing ${redditUrls.length} URLs in this batch...`);
      
      // Process each URL in the batch
      for (let i = 0; i < redditUrls.length; i++) {
        const redditUrl = redditUrls[i];
        const urlNumber = offset + i + 1;
        
        console.log(`\n   🔗 [${urlNumber}/${totalCount}] Processing URL ${redditUrl.url_id}`);
        console.log(`      📄 ${redditUrl.url_datum.substring(0, 80)}...`);
        
        const result = await processUrl(redditUrl);
        
        processedCount++;
        
        if (result.success) {
          successCount++;
          if (result.is_commentable) {
            openCount++;
            console.log(`      ✅ SUCCESS: ✓ OPEN (commentable)`);
          } else {
            closedCount++;
            console.log(`      ✅ SUCCESS: ✗ CLOSED (locked/archived)`);
          }
        } else {
          failureCount++;
          console.log(`      ❌ FAILED: ${result.error}`);
        }
        
        // Delay between requests to be polite to Reddit
        if (i < redditUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        }
      }
      
      // Progress summary
      const progressPercent = ((offset + redditUrls.length) / totalCount * 100).toFixed(1);
      console.log(`\n📊 BATCH ${batchNumber} COMPLETE:`);
      console.log(`   - Progress: ${progressPercent}% (${offset + redditUrls.length}/${totalCount})`);
      console.log(`   - Successful: ${successCount}`);
      console.log(`   - Failed: ${failureCount}`);
      console.log(`   - Open: ${openCount}`);
      console.log(`   - Closed: ${closedCount}`);
      
      offset += redditUrls.length;
      batchNumber++;
      
      // Delay between batches (except for the last batch)
      if (offset < totalCount) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Final summary
    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60 * 100) / 100;
    
    console.log('\n🎉 BULK SCRAPING COMPLETED!');
    console.log('===========================');
    console.log(`📊 Final Statistics:`);
    console.log(`   - Total processed: ${processedCount}/${totalCount}`);
    console.log(`   - Successful: ${successCount} (${(successCount/processedCount*100).toFixed(1)}%)`);
    console.log(`   - Failed: ${failureCount} (${(failureCount/processedCount*100).toFixed(1)}%)`);
    console.log(`   - Open for comments: ${openCount} (${(openCount/successCount*100).toFixed(1)}%)`);
    console.log(`   - Closed/locked: ${closedCount} (${(closedCount/successCount*100).toFixed(1)}%)`);
    console.log(`   - Duration: ${durationMinutes} minutes`);
    console.log(`   - Average: ${(processedCount/durationMinutes).toFixed(1)} URLs/minute`);
    
  } catch (error) {
    console.error('💥 BULK SCRAPER FATAL ERROR:', error);
  }
}

// Start the bulk scraping process
bulkScrapeCommentability();