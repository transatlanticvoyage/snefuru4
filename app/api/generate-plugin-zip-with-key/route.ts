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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's API key
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('ruplin_api_key_1')
      .eq('auth_id', userId)
      .single();

    if (userError || !user?.ruplin_api_key_1) {
      return NextResponse.json(
        { error: 'User API key not found' },
        { status: 404 }
      );
    }

    const apiKey = user.ruplin_api_key_1;

    // Create zip file
    const zip = new AdmZip();
    const pluginDir = path.join(process.cwd(), 'snefuruplin');

    // Read all files in the plugin directory
    const addDirectoryToZip = async (dirPath: string, zipPath: string = '') => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const zipEntryPath = path.join(zipPath, entry.name).replace(/\\/g, '/');
        
        if (entry.isDirectory()) {
          await addDirectoryToZip(fullPath, zipEntryPath);
        } else {
          const fileContent = await fs.readFile(fullPath);
          
          // If this is the main plugin file, inject the API key
          if (entry.name === 'snefuru-plugin.php') {
            let content = fileContent.toString();
            
            // Add a filter to pre-populate the API key
            const apiKeyInjection = `
// Auto-populate API key for this installation
add_filter('pre_option_snefuru_upload_api_key', function() {
    return '${apiKey}';
});

add_filter('pre_option_snefuru_ruplin_api_key', function() {
    return '${apiKey}';
});

// Set default API key on plugin activation
register_activation_hook(__FILE__, function() {
    if (!get_option('snefuru_upload_api_key')) {
        update_option('snefuru_upload_api_key', '${apiKey}');
    }
    if (!get_option('snefuru_ruplin_api_key')) {
        update_option('snefuru_ruplin_api_key', '${apiKey}');
    }
});

`;
            
            // Insert the API key injection before the final closing PHP tag or at the end
            if (content.includes('?>')) {
              content = content.replace('?>', apiKeyInjection + '?>');
            } else {
              content += apiKeyInjection;
            }
            
            zip.addFile(zipEntryPath, Buffer.from(content));
          } else {
            zip.addFile(zipEntryPath, fileContent);
          }
        }
      }
    };

    await addDirectoryToZip(pluginDir, 'snefuruplin');

    // Get the zip buffer
    const zipBuffer = zip.toBuffer();

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="snefuruplin-configured.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating plugin zip with API key:', error);
    return NextResponse.json(
      { error: 'Failed to generate plugin zip with API key' },
      { status: 500 }
    );
  }
}