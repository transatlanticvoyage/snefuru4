import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { success: false, message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Create client with user authentication
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get internal user ID and API key
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, ruplin_api_key_1')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get site information and verify ownership
    const { data: site, error: siteError } = await supabase
      .from('sitespren')
      .select('*')
      .eq('id', siteId)
      .eq('fk_users_id', userData.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { success: false, message: 'Site not found' },
        { status: 404 }
      );
    }

    // Removed: No longer checking wp_plugin_installed1 - will test connectivity directly

    // Get current plugin version from the database
    const { data: currentVersion, error: versionError } = await supabase
      .from('barkro_plugin_versions')
      .select('*')
      .eq('is_current', true)
      .single();

    if (versionError || !currentVersion) {
      return NextResponse.json(
        { success: false, message: 'No current plugin version found' },
        { status: 400 }
      );
    }

    // Create the plugin zip file from the snefuruplin directory
    const pluginDir = path.join(process.cwd(), 'snefuruplin');
    const zip = new AdmZip();
    
    // Add all files from the plugin directory
    zip.addLocalFolder(pluginDir, 'snefuruplin');
    
    // Get the zip buffer
    const zipBuffer = zip.toBuffer();

    // Log the push attempt
    const { data: pushRecord, error: pushError } = await supabase
      .from('barkro_update_pushes')
      .insert({
        fk_sitespren_id: siteId,
        version_id: currentVersion.version_id,
        push_status: 'pending',
        site_current_version: null // We'll get this from the site
      })
      .select()
      .single();

    if (pushError) {
      return NextResponse.json(
        { success: false, message: 'Failed to create push record' },
        { status: 500 }
      );
    }

    // Prepare the update data
    const updateData = {
      version: currentVersion.version_number,
      download_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/barkro/download-plugin`,
      changelog: currentVersion.changelog,
      min_wp_version: currentVersion.min_wp_version,
      min_php_version: currentVersion.min_php_version
    };

    // Send update notification to the WordPress site
    const siteBaseUrl = site.sitespren_base.startsWith('http') ? site.sitespren_base : `https://${site.sitespren_base}`;
    const wpApiUrl = `${siteBaseUrl}/wp-json/snefuru/v1/check-update`;
    
    try {
      const response = await fetch(wpApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': userData.ruplin_api_key_1 || ''
        },
        body: JSON.stringify({
          action: 'update_available',
          update_data: updateData,
          plugin_data: {
            name: 'Snefuru Image Upload Plugin',
            slug: 'snefuruplin',
            version: currentVersion.version_number,
            download_url: updateData.download_url
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update push record with success
        await supabase
          .from('barkro_update_pushes')
          .update({
            push_status: 'success',
            response_message: result.message || 'Update pushed successfully',
            site_current_version: result.current_version,
            completed_at: new Date().toISOString()
          })
          .eq('push_id', pushRecord.push_id);

        // Update site status
        await supabase
          .from('barkro_site_status')
          .upsert({
            fk_sitespren_id: siteId,
            current_plugin_version: result.current_version,
            last_check_date: new Date().toISOString()
          });

        return NextResponse.json({
          success: true,
          message: `Update pushed successfully to ${site.sitespren_base}. Version: ${currentVersion.version_number}`
        });
      } else {
        throw new Error(result.message || 'Failed to push update to site');
      }
    } catch (wpError) {
      // Update push record with failure
      await supabase
        .from('barkro_update_pushes')
        .update({
          push_status: 'failed',
          response_message: 'Failed to communicate with WordPress site',
          error_details: wpError instanceof Error ? wpError.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('push_id', pushRecord.push_id);

      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to push update: ${wpError instanceof Error ? wpError.message : 'Unknown error'}`
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Barkro push update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}