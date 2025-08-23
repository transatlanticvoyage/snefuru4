import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RedditComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
}

interface RedditSubmission {
  id: string;
  title: string;
  selftext: string;
  url: string;
  is_self: boolean;
  created_utc: number;
  author: string;
}

interface ExtractedLink {
  anchor_text: string;
  raw_url: string;
  resolved_url: string;
  domain: string;
  http_status: number | null;
}

// Extract links from markdown text (both [text](url) and bare URLs)
function extractLinksFromText(text: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  
  // Regex for markdown-style links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const anchor = match[1].trim();
    const url = match[2].trim();
    links.push({
      anchor_text: anchor,
      raw_url: url,
      resolved_url: url, // Will be resolved later
      domain: extractDomain(url),
      http_status: null
    });
  }
  
  // Regex for bare URLs
  const bareUrlRegex = /(https?:\/\/[^\s)>\]]+)/g;
  const processedUrls = new Set(links.map(l => l.raw_url));
  
  while ((match = bareUrlRegex.exec(text)) !== null) {
    const url = match[1].trim().replace(/[.,;)\]]+$/, ''); // Remove trailing punctuation
    if (!processedUrls.has(url)) {
      links.push({
        anchor_text: '',
        raw_url: url,
        resolved_url: url, // Will be resolved later
        domain: extractDomain(url),
        http_status: null
      });
      processedUrls.add(url);
    }
  }
  
  return links;
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

// Strip tracking parameters
function stripTrackingParams(url: string): string {
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref'];
  try {
    const parsed = new URL(url);
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

// Resolve redirects and get final URL
async function resolveUrl(url: string): Promise<{ resolved_url: string; http_status: number | null }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10 second timeout
      headers: {
        'User-Agent': 'RedditLinkScraper/1.0'
      }
    });
    
    return {
      resolved_url: response.url,
      http_status: response.status
    };
  } catch (error) {
    // If HEAD fails, try GET
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'RedditLinkScraper/1.0'
        }
      });
      
      return {
        resolved_url: response.url,
        http_status: response.status
      };
    } catch {
      return {
        resolved_url: url,
        http_status: null
      };
    }
  }
}

// Fetch Reddit thread data using Reddit's JSON API
async function fetchRedditThread(redditUrl: string): Promise<{ submission: RedditSubmission; comments: RedditComment[] } | null> {
  try {
    // Convert Reddit URL to JSON API format
    let jsonUrl = redditUrl;
    if (!jsonUrl.endsWith('.json')) {
      jsonUrl = jsonUrl.replace(/\/$/, '') + '.json';
    }
    
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'RedditLinkScraper/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Reddit JSON API returns an array with [submission_listing, comments_listing]
    const submissionData = data[0]?.data?.children?.[0]?.data;
    const commentsData = data[1]?.data?.children || [];
    
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
      author: submissionData.author || ''
    };
    
    // Recursively extract comments
    function extractComments(commentData: any[]): RedditComment[] {
      const comments: RedditComment[] = [];
      
      for (const item of commentData) {
        if (item.kind === 't1' && item.data && item.data.body) {
          comments.push({
            id: item.data.id,
            body: item.data.body,
            author: item.data.author || '',
            created_utc: item.data.created_utc || 0
          });
        }
        
        // Recursively process replies
        if (item.data?.replies?.data?.children) {
          comments.push(...extractComments(item.data.replies.data.children));
        }
      }
      
      return comments;
    }
    
    const comments = extractComments(commentsData);
    
    return { submission, comments };
    
  } catch (error) {
    console.error('Error fetching Reddit thread:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { selectedUrlIds } = await request.json();
    
    if (!Array.isArray(selectedUrlIds) || selectedUrlIds.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }
    
    const supabase = createServerComponentClient({ cookies });
    
    // Fetch the selected Reddit URLs from the database
    const { data: redditUrls, error: fetchError } = await supabase
      .from('redditurlsvat')
      .select('url_id, url_datum')
      .in('url_id', selectedUrlIds);
    
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch Reddit URLs' }, { status: 500 });
    }
    
    const results = [];
    
    for (const redditUrl of redditUrls) {
      try {
        console.log(`Scraping Reddit URL: ${redditUrl.url_datum}`);
        
        // Fetch Reddit thread data
        const threadData = await fetchRedditThread(redditUrl.url_datum);
        if (!threadData) {
          results.push({
            url_id: redditUrl.url_id,
            url: redditUrl.url_datum,
            success: false,
            error: 'Failed to fetch Reddit thread data',
            links_found: 0
          });
          continue;
        }
        
        const { submission, comments } = threadData;
        const allLinks: ExtractedLink[] = [];
        
        // Extract links from submission
        if (!submission.is_self && submission.url) {
          // Link post - add the main URL
          allLinks.push({
            anchor_text: submission.title,
            raw_url: submission.url,
            resolved_url: submission.url,
            domain: extractDomain(submission.url),
            http_status: null
          });
        }
        
        if (submission.selftext) {
          // Self post with text - extract links from text
          allLinks.push(...extractLinksFromText(submission.selftext));
        }
        
        // Extract links from comments
        for (const comment of comments) {
          if (comment.body) {
            allLinks.push(...extractLinksFromText(comment.body));
          }
        }
        
        // Filter out Reddit links and duplicates
        const filteredLinks = allLinks
          .filter(link => !link.domain.includes('reddit.com'))
          .filter(link => link.raw_url.length > 0);
        
        // Remove duplicates based on raw_url
        const uniqueLinks = filteredLinks.reduce((acc, link) => {
          const key = link.raw_url;
          if (!acc.has(key)) {
            acc.set(key, link);
          }
          return acc;
        }, new Map<string, ExtractedLink>());
        
        const linksToProcess = Array.from(uniqueLinks.values());
        
        // Process each link (strip tracking, resolve redirects)
        for (const link of linksToProcess) {
          // Strip tracking parameters
          link.raw_url = stripTrackingParams(link.raw_url);
          
          // Resolve redirects
          const resolved = await resolveUrl(link.raw_url);
          link.resolved_url = resolved.resolved_url;
          link.http_status = resolved.http_status;
          link.domain = extractDomain(link.resolved_url);
          
          // Small delay to be polite
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Store links in database
        if (linksToProcess.length > 0) {
          const linksToInsert = linksToProcess.map(link => ({
            source_url_id: redditUrl.url_id,
            comment_id: null, // We're not tracking individual comments for now
            source_type: 'submission',
            raw_url: link.raw_url,
            resolved_url: link.resolved_url,
            domain: link.domain,
            anchor_text: link.anchor_text,
            http_status: link.http_status
          }));
          
          const { error: insertError } = await supabase
            .from('redditoblinks')
            .insert(linksToInsert);
          
          if (insertError) {
            console.error('Error inserting links:', insertError);
            results.push({
              url_id: redditUrl.url_id,
              url: redditUrl.url_datum,
              success: false,
              error: 'Failed to save links to database',
              links_found: linksToProcess.length
            });
          } else {
            results.push({
              url_id: redditUrl.url_id,
              url: redditUrl.url_datum,
              success: true,
              links_found: linksToProcess.length
            });
          }
        } else {
          results.push({
            url_id: redditUrl.url_id,
            url: redditUrl.url_datum,
            success: true,
            links_found: 0
          });
        }
        
      } catch (error) {
        console.error(`Error processing ${redditUrl.url_datum}:`, error);
        results.push({
          url_id: redditUrl.url_id,
          url: redditUrl.url_datum,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          links_found: 0
        });
      }
    }
    
    return NextResponse.json({
      message: 'Scraping completed',
      results
    });
    
  } catch (error) {
    console.error('Reddit scraper error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}