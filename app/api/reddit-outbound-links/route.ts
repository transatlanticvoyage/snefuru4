import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceUrlId = searchParams.get('source_url_id');
    
    if (!sourceUrlId) {
      return NextResponse.json({ error: 'source_url_id parameter is required' }, { status: 400 });
    }
    
    const supabase = createServerComponentClient({ cookies });
    
    // Fetch outbound links for the specified Reddit URL
    const { data: links, error } = await supabase
      .from('redditoblinks')
      .select(`
        link_id,
        raw_url,
        resolved_url,
        domain,
        anchor_text,
        http_status,
        source_type,
        first_seen,
        last_seen,
        redditurlsvat:source_url_id (
          url_datum,
          post_title
        )
      `)
      .eq('source_url_id', sourceUrlId)
      .order('first_seen', { ascending: false });
    
    if (error) {
      console.error('Error fetching outbound links:', error);
      return NextResponse.json({ error: 'Failed to fetch outbound links' }, { status: 500 });
    }
    
    return NextResponse.json({
      source_url_id: sourceUrlId,
      links: links || [],
      total_count: (links || []).length
    });
    
  } catch (error) {
    console.error('Error in outbound links API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to remove all scraped links for a URL (useful for re-scraping)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceUrlId = searchParams.get('source_url_id');
    
    if (!sourceUrlId) {
      return NextResponse.json({ error: 'source_url_id parameter is required' }, { status: 400 });
    }
    
    const supabase = createServerComponentClient({ cookies });
    
    const { error } = await supabase
      .from('redditoblinks')
      .delete()
      .eq('source_url_id', sourceUrlId);
    
    if (error) {
      console.error('Error deleting outbound links:', error);
      return NextResponse.json({ error: 'Failed to delete outbound links' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Outbound links deleted successfully',
      source_url_id: sourceUrlId
    });
    
  } catch (error) {
    console.error('Error in delete outbound links API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}