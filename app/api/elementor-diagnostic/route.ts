import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface DiagnosticRequest {
  post_id: string;
  site_url: string;
  action: 'snapshot_before' | 'snapshot_after' | 'compare';
  test_type: 'manual' | 'automated';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, site_url, action, test_type }: DiagnosticRequest = body;

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get user for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData || !userData.ruplin_api_key_1) {
      throw new Error('User not found or API key missing');
    }

    console.log(`🔍 DIAGNOSTIC: ${action} for ${test_type} test on post ${post_id}`);

    switch (action) {
      case 'snapshot_before':
        return await takeBeforeSnapshot(supabase, post_id, site_url, test_type, userData.ruplin_api_key_1);
      
      case 'snapshot_after':
        return await takeAfterSnapshot(supabase, post_id, site_url, test_type, userData.ruplin_api_key_1);
      
      case 'compare':
        return await compareSnapshots(supabase, post_id, test_type);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('🔍 DIAGNOSTIC ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Diagnostic failed'
    }, { status: 500 });
  }
}

async function takeBeforeSnapshot(supabase: any, post_id: string, site_url: string, test_type: string, api_key: string) {
  console.log(`📸 Taking BEFORE snapshot for ${test_type} test`);

  // 1. Get WordPress post data
  const wpPost = await fetchWordPressPost(site_url, post_id, api_key);
  
  // 2. Get all post meta related to Elementor
  const elementorMeta = await fetchElementorMeta(site_url, post_id, api_key);
  
  // 3. Check file system for CSS files
  const cssFiles = await checkElementorCSSFiles(site_url, post_id);
  
  // 4. Get current page HTML
  const pageHtml = await fetchPageHTML(site_url, post_id);

  const snapshot = {
    timestamp: new Date().toISOString(),
    test_type,
    post_id,
    site_url,
    wordpress_post: wpPost,
    elementor_meta: elementorMeta,
    css_files: cssFiles,
    page_html_length: pageHtml?.length || 0,
    page_html_sample: pageHtml?.substring(0, 1000) || 'Failed to fetch'
  };

  // Save snapshot to database
  const { data, error } = await supabase
    .from('elementor_diagnostics')
    .insert({
      post_id,
      test_type,
      snapshot_type: 'before',
      snapshot_data: snapshot,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save before snapshot: ${error.message}`);
  }

  console.log(`✅ BEFORE snapshot saved with ID: ${data.id}`);

  return NextResponse.json({
    success: true,
    snapshot_id: data.id,
    message: `Before snapshot captured for ${test_type} test`,
    summary: {
      elementor_data_size: elementorMeta._elementor_data?.length || 0,
      elementor_version: elementorMeta._elementor_version,
      css_files_found: cssFiles.length,
      page_html_length: pageHtml?.length || 0
    }
  });
}

async function takeAfterSnapshot(supabase: any, post_id: string, site_url: string, test_type: string, api_key: string) {
  console.log(`📸 Taking AFTER snapshot for ${test_type} test`);

  // Same data collection as before
  const wpPost = await fetchWordPressPost(site_url, post_id, api_key);
  const elementorMeta = await fetchElementorMeta(site_url, post_id, api_key);
  const cssFiles = await checkElementorCSSFiles(site_url, post_id);
  const pageHtml = await fetchPageHTML(site_url, post_id);

  const snapshot = {
    timestamp: new Date().toISOString(),
    test_type,
    post_id,
    site_url,
    wordpress_post: wpPost,
    elementor_meta: elementorMeta,
    css_files: cssFiles,
    page_html_length: pageHtml?.length || 0,
    page_html_sample: pageHtml?.substring(0, 1000) || 'Failed to fetch'
  };

  // Save after snapshot
  const { data, error } = await supabase
    .from('elementor_diagnostics')
    .insert({
      post_id,
      test_type,
      snapshot_type: 'after',
      snapshot_data: snapshot,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save after snapshot: ${error.message}`);
  }

  console.log(`✅ AFTER snapshot saved with ID: ${data.id}`);

  return NextResponse.json({
    success: true,
    snapshot_id: data.id,
    message: `After snapshot captured for ${test_type} test`,
    summary: {
      elementor_data_size: elementorMeta._elementor_data?.length || 0,
      elementor_version: elementorMeta._elementor_version,
      css_files_found: cssFiles.length,
      page_html_length: pageHtml?.length || 0
    }
  });
}

async function compareSnapshots(supabase: any, post_id: string, test_type: string) {
  console.log(`🔍 Comparing snapshots for ${test_type} test`);

  // Get before and after snapshots
  const { data: snapshots, error } = await supabase
    .from('elementor_diagnostics')
    .select('*')
    .eq('post_id', post_id)
    .eq('test_type', test_type)
    .order('created_at', { ascending: true })
    .limit(2);

  if (error || !snapshots || snapshots.length < 2) {
    throw new Error(`Could not find before/after snapshots for ${test_type} test`);
  }

  const beforeSnapshot = snapshots[0];
  const afterSnapshot = snapshots[1];

  const comparison = {
    test_type,
    post_id,
    before_timestamp: beforeSnapshot.created_at,
    after_timestamp: afterSnapshot.created_at,
    differences: {
      elementor_data: compareElementorData(
        beforeSnapshot.snapshot_data.elementor_meta._elementor_data,
        afterSnapshot.snapshot_data.elementor_meta._elementor_data
      ),
      meta_fields: compareMetaFields(
        beforeSnapshot.snapshot_data.elementor_meta,
        afterSnapshot.snapshot_data.elementor_meta
      ),
      post_data: comparePostData(
        beforeSnapshot.snapshot_data.wordpress_post,
        afterSnapshot.snapshot_data.wordpress_post
      ),
      css_files: compareCSSFiles(
        beforeSnapshot.snapshot_data.css_files,
        afterSnapshot.snapshot_data.css_files
      ),
      html_changes: {
        size_change: afterSnapshot.snapshot_data.page_html_length - beforeSnapshot.snapshot_data.page_html_length,
        before_sample: beforeSnapshot.snapshot_data.page_html_sample,
        after_sample: afterSnapshot.snapshot_data.page_html_sample
      }
    }
  };

  return NextResponse.json({
    success: true,
    comparison,
    message: `Comparison completed for ${test_type} test`
  });
}

// Helper functions for data fetching and comparison
async function fetchWordPressPost(site_url: string, post_id: string, api_key: string) {
  try {
    const response = await fetch(`https://${site_url}/wp-json/snefuru/v1/posts`, {
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'User-Agent': 'ElementorDiagnostic/1.0'
      }
    });

    if (response.ok) {
      const allPosts = await response.json();
      return allPosts.data?.find((p: any) => p.ID === parseInt(post_id)) || null;
    }
  } catch (error) {
    console.error('Failed to fetch WordPress post:', error);
  }
  return null;
}

async function fetchElementorMeta(site_url: string, post_id: string, api_key: string) {
  try {
    // Try to get meta via WordPress API
    const response = await fetch(`https://${site_url}/wp-json/wp/v2/pages/${post_id}?context=edit`, {
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'User-Agent': 'ElementorDiagnostic/1.0'
      }
    });

    if (response.ok) {
      const post = await response.json();
      return post.meta || {};
    }
  } catch (error) {
    console.error('Failed to fetch Elementor meta:', error);
  }
  return {};
}

async function checkElementorCSSFiles(site_url: string, post_id: string) {
  const cssUrls = [
    `https://${site_url}/wp-content/uploads/elementor/css/post-${post_id}.css`,
    `https://${site_url}/wp-content/uploads/elementor/css/global.css`
  ];

  const results = [];
  for (const url of cssUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      results.push({
        url,
        exists: response.ok,
        size: response.headers.get('content-length'),
        last_modified: response.headers.get('last-modified')
      });
    } catch {
      results.push({ url, exists: false, error: true });
    }
  }
  return results;
}

async function fetchPageHTML(site_url: string, post_id: string) {
  try {
    const response = await fetch(`https://${site_url}/?p=${post_id}`);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.error('Failed to fetch page HTML:', error);
  }
  return null;
}

function compareElementorData(before: string, after: string) {
  if (!before && !after) return { changed: false };
  if (!before || !after) return { changed: true, reason: 'One is missing' };
  
  try {
    const beforeObj = JSON.parse(before);
    const afterObj = JSON.parse(after);
    
    return {
      changed: JSON.stringify(beforeObj) !== JSON.stringify(afterObj),
      size_change: after.length - before.length,
      before_length: before.length,
      after_length: after.length
    };
  } catch {
    return { changed: true, reason: 'Parse error' };
  }
}

function compareMetaFields(before: any, after: any) {
  const elementorFields = [
    '_elementor_data', '_elementor_version', '_elementor_edit_mode',
    '_elementor_template_type', '_elementor_controls_usage', '_elementor_css'
  ];
  
  const changes: any = {};
  
  elementorFields.forEach(field => {
    const beforeVal = before[field];
    const afterVal = after[field];
    
    if (beforeVal !== afterVal) {
      changes[field] = {
        changed: true,
        before: beforeVal,
        after: afterVal
      };
    }
  });
  
  return changes;
}

function comparePostData(before: any, after: any) {
  if (!before || !after) return { error: 'Missing post data' };
  
  const fields = ['post_modified', 'post_modified_gmt', 'post_content'];
  const changes: any = {};
  
  fields.forEach(field => {
    if (before[field] !== after[field]) {
      changes[field] = {
        before: before[field],
        after: after[field]
      };
    }
  });
  
  return changes;
}

function compareCSSFiles(before: any[], after: any[]) {
  const changes: any = {};
  
  before.forEach((beforeFile, index) => {
    const afterFile = after[index];
    if (afterFile && (
      beforeFile.last_modified !== afterFile.last_modified ||
      beforeFile.size !== afterFile.size
    )) {
      changes[beforeFile.url] = {
        before: beforeFile,
        after: afterFile
      };
    }
  });
  
  return changes;
}