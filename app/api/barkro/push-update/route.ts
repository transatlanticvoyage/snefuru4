import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { success: false, message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Get site information
    const { data: site, error: siteError } = await supabase
      .from('sitespren')
      .select('*')
      .eq('id', siteId)
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
        site_id: siteId,
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
    const wpApiUrl = `${site.sitespren_base}/wp-json/snefuru/v1/check-update`;
    
    try {
      const response = await fetch(wpApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': site.ruplin_apikey || ''
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
            site_id: siteId,
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