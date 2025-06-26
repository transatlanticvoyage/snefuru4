import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitespren_id, sitespren_base, user_internal_id } = body;

    if (!sitespren_id || !sitespren_base || !user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the site belongs to the user
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('id, fk_users_id')
      .eq('id', sitespren_id)
      .eq('fk_users_id', user_internal_id)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, error: 'Site not found or access denied' },
        { status: 404 }
      );
    }

    console.log('Starting link scraping for:', sitespren_base);

    // Prepare URL for fetching
    let targetUrl = sitespren_base;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Fetch the homepage with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout (30 seconds)' },
          { status: 408 }
        );
      }
      throw error;
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch homepage: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract the domain from sitespren_base for comparison
    const sourceDomain = sitespren_base.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    // Find all outbound links
    const outboundLinks: any[] = [];
    const seenUrls = new Set();

    $('a[href]').each((index, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const anchorText = $link.text().trim();
      
      if (!href) return;

      // Convert relative URLs to absolute
      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(href, targetUrl).href;
      } catch (error) {
        // Skip invalid URLs
        return;
      }

      // Extract domain from the link
      let linkDomain: string;
      try {
        const urlObj = new URL(absoluteUrl);
        linkDomain = urlObj.hostname.replace(/^www\./, '');
      } catch (error) {
        return;
      }

      // Skip if it's the same domain (not outbound)
      if (linkDomain === sourceDomain) {
        return;
      }

      // Skip if we've already seen this URL
      if (seenUrls.has(absoluteUrl)) {
        return;
      }
      seenUrls.add(absoluteUrl);

      // Get surrounding context
      const linkBefore = $link.prev().text().trim().slice(-50);
      const linkAfter = $link.next().text().trim().slice(0, 50);
      
      // Check if it's nofollow
      const rel = $link.attr('rel');
      const isNofollow = rel && rel.includes('nofollow');

      outboundLinks.push({
        source_url: targetUrl,
        source_domain: sourceDomain,
        target_url: absoluteUrl,
        target_domain: linkDomain,
        backlink_anchor: anchorText || null,
        link_before: linkBefore || null,
        link_after: linkAfter || null,
        is_nofollow: isNofollow || false,
        fetch_method: 'homepage_scrape',
        backlink_location: 'homepage'
      });
    });

    console.log(`Found ${outboundLinks.length} outbound links`);

    // Get existing links for this source domain to avoid duplicates
    const { data: existingLinks, error: existingError } = await supabase
      .from('linksharn')
      .select('target_url, target_domain, backlink_anchor')
      .eq('source_domain', sourceDomain)
      .eq('fk_user_id', user_internal_id);

    if (existingError) {
      console.error('Error fetching existing links:', existingError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing links' },
        { status: 500 }
      );
    }

    // Create a set of existing links for quick lookup
    const existingSet = new Set(
      existingLinks?.map(link => `${link.target_url}|${link.backlink_anchor}`) || []
    );

    // Filter out duplicates
    const newLinks = outboundLinks.filter(link => 
      !existingSet.has(`${link.target_url}|${link.backlink_anchor}`)
    );

    console.log(`${newLinks.length} new links to insert`);

    // Insert new links
    if (newLinks.length > 0) {
      const linksToInsert = newLinks.map(link => ({
        ...link,
        fk_user_id: user_internal_id,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('linksharn')
        .insert(linksToInsert);

      if (insertError) {
        console.error('Error inserting links:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save links to database' },
          { status: 500 }
        );
      }
    }

    // Update last_seen for existing links that were found again
    const currentTime = new Date().toISOString();
    for (const link of outboundLinks) {
      const linkKey = `${link.target_url}|${link.backlink_anchor}`;
      if (existingSet.has(linkKey)) {
        await supabase
          .from('linksharn')
          .update({ last_seen: currentTime })
          .eq('source_domain', sourceDomain)
          .eq('target_url', link.target_url)
          .eq('backlink_anchor', link.backlink_anchor)
          .eq('fk_user_id', user_internal_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${outboundLinks.length} outbound links`,
      data: {
        total_found: outboundLinks.length,
        new_links: newLinks.length,
        existing_updated: outboundLinks.length - newLinks.length,
        source_domain: sourceDomain
      }
    });

  } catch (error) {
    console.error('Error in scrape_links_from_homepage:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}