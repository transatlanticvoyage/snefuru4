import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to get the current version from our local plugin
async function getLocalPluginVersion(): Promise<string> {
  try {
    const pluginPath = path.join(process.cwd(), 'snefuruplin', 'snefuru-plugin.php');
    const pluginContent = await fs.readFile(pluginPath, 'utf-8');
    
    // Extract version from plugin header comment
    const versionMatch = pluginContent.match(/Version:\s*([\d.]+)/i);
    return versionMatch ? versionMatch[1] : '1.0.0';
  } catch (error) {
    console.error('Error reading local plugin version:', error);
    return '1.0.0';
  }
}

// Function to check remote plugin version
async function checkRemotePluginVersion(siteUrl: string, apiKey: string | null, credentials: any): Promise<{ success: boolean; currentVersion?: string; error?: string }> {
  try {
    // First try plugin API if credentials are available
    if (apiKey) {
      const response = await fetch(`${siteUrl}/wp-json/snefuru/v1/version`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, currentVersion: data.version || 'Unknown' };
      }
    }

    // Fallback to REST API if available
    if (credentials.wp_rest_app_pass && credentials.wpuser1) {
      const auth = Buffer.from(`${credentials.wpuser1}:${credentials.wp_rest_app_pass}`).toString('base64');
      
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/plugins`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const plugins = await response.json();
        const snefuruPlugin = plugins.find((plugin: any) => 
          plugin.plugin && plugin.plugin.includes('snefuru')
        );
        
        if (snefuruPlugin) {
          return { success: true, currentVersion: snefuruPlugin.version || 'Unknown' };
        }
      }
    }

    return { success: false, error: 'Could not connect to plugin or REST API' };
  } catch (error) {
    return { success: false, error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { siteId, userId } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { success: false, message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Get site information from database
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('sitespren_base, wp_rest_app_pass, wpuser1, fk_users_id')
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

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const siteUrl = `https://${siteData.sitespren_base}`;
    
    // Get local plugin version
    const localVersion = await getLocalPluginVersion();
    
    // Check remote plugin version
    const remoteCheck = await checkRemotePluginVersion(siteUrl, userData.ruplin_api_key_1, {
      wp_rest_app_pass: siteData.wp_rest_app_pass,
      wpuser1: siteData.wpuser1
    });

    if (!remoteCheck.success) {
      return NextResponse.json({
        success: false,
        message: `Version check failed: ${remoteCheck.error}`
      });
    }

    const currentVersion = remoteCheck.currentVersion || 'Unknown';
    const isUpToDate = currentVersion === localVersion;

    return NextResponse.json({
      success: true,
      message: isUpToDate 
        ? 'Plugin is up to date' 
        : 'Plugin update available',
      currentVersion,
      latestVersion: localVersion,
      isUpToDate
    });

  } catch (error) {
    console.error('Plugin version check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}