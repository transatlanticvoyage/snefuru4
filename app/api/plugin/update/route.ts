import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { PassThrough } from 'stream';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to create plugin zip from local snefuruplin folder
async function createPluginZip(): Promise<Buffer> {
  const stream = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(stream);

  const pluginPath = path.join(process.cwd(), 'snefuruplin');

  // Add all files from the plugin directory
  const addDirectoryToArchive = async (dirPath: string, archivePath: string = '') => {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);
      const archiveItemPath = archivePath ? path.join(archivePath, item) : item;
      
      if (stat.isDirectory()) {
        await addDirectoryToArchive(fullPath, archiveItemPath);
      } else {
        const fileBuffer = await fs.readFile(fullPath);
        archive.append(fileBuffer, { name: `snefuru-plugin/${archiveItemPath}` });
      }
    }
  };

  await addDirectoryToArchive(pluginPath);
  await archive.finalize();

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

// Function to upload and install plugin via WordPress API
async function updateRemotePlugin(siteUrl: string, pluginZipBuffer: Buffer, credentials: any): Promise<{ success: boolean; message: string; newVersion?: string }> {
  try {
    // First try to use plugin API for update
    if (credentials.ruplin_api_key_1) {
      const formData = new FormData();
      const blob = new Blob([pluginZipBuffer], { type: 'application/zip' });
      formData.append('plugin_zip', blob, 'snefuru-plugin.zip');

      const response = await fetch(`${siteUrl}/wp-json/snefuru/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.ruplin_api_key_1}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: 'Plugin updated successfully via Snefuru API',
          newVersion: data.version
        };
      }
    }

    // Fallback to WordPress REST API if available
    if (credentials.wp_rest_app_pass && credentials.wpuser1) {
      const auth = Buffer.from(`${credentials.wpuser1}:${credentials.wp_rest_app_pass}`).toString('base64');
      
      // First deactivate the current plugin
      const deactivateResponse = await fetch(`${siteUrl}/wp-json/wp/v2/plugins/snefuru-plugin/snefuru-plugin`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'inactive' })
      });

      // Upload new plugin via REST API (this is complex and may require additional setup)
      // For now, return a message indicating manual update is needed
      return { 
        success: false, 
        message: 'Automatic update via REST API not yet implemented. Please update manually.' 
      };
    }

    return { success: false, message: 'No valid credentials available for plugin update' };

  } catch (error) {
    return { 
      success: false, 
      message: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { success: false, message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Get site information from database
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base, wp_rest_app_pass, wpuser1, fk_users_id')
      .eq('id', siteId)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, message: 'Site not found in database' },
        { status: 404 }
      );
    }

    // Get user's ruplin API key
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('ruplin_api_key_1')
      .eq('id', siteData.fk_users_id)
      .single();

    if (userError || !userData || !userData.ruplin_api_key_1) {
      return NextResponse.json(
        { success: false, message: 'User API key not found' },
        { status: 404 }
      );
    }

    const siteUrl = `https://${siteData.sitespren_base}`;
    
    // Create plugin zip from local files
    const pluginZipBuffer = await createPluginZip();
    
    // Attempt to update the remote plugin
    const updateResult = await updateRemotePlugin(siteUrl, pluginZipBuffer, {
      ruplin_api_key_1: userData.ruplin_api_key_1,
      wp_rest_app_pass: siteData.wp_rest_app_pass,
      wpuser1: siteData.wpuser1
    });

    if (updateResult.success) {
      return NextResponse.json({
        success: true,
        message: updateResult.message,
        newVersion: updateResult.newVersion
      });
    } else {
      // If automatic update failed, provide manual update instructions
      return NextResponse.json({
        success: false,
        message: `${updateResult.message}. You can download the latest plugin from the admin panel and install manually.`
      });
    }

  } catch (error) {
    console.error('Plugin update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}