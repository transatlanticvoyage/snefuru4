// Example API endpoint for your Next.js app
// Place this file at: /pages/api/extension/site-metrics.js (or /app/api/extension/site-metrics/route.js for App Router)

import { createClient } from '@supabase/supabase-js';
import { getSession } from 'your-auth-library'; // Replace with your auth method

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers for extension - More permissive for debugging
  const origin = req.headers.origin;
  const extensionId = req.headers['x-extension-id'];
  
  // Allow specific extension or localhost for development
  if (origin && origin.startsWith('chrome-extension://')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For development/debugging - be more permissive
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-ID, Cookie, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Add some logging for debugging
  console.log('API called:', {
    method: req.method,
    origin: req.headers.origin,
    extensionId: req.headers['x-extension-id'],
    userAgent: req.headers['user-agent'],
    cookies: Object.keys(req.cookies || {}),
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Validate user session from cookie
    const session = await getSession(req); // Your auth method
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // 2. Get domain from query params
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter required' });
    }

    // 3. Remove www. if present (already done in extension, but double-check)
    const cleanDomain = domain.replace(/^www\./, '');

    // 4. Query sitespren table for exact match (to verify ownership)
    const { data: sitesprenData, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('sitespren_base, fk_users_id') // Only select what we need for verification
      .eq('sitespren_base', cleanDomain)
      .eq('fk_users_id', userId) // Correct column name for user foreign key
      .single(); // Since it's unique per user

    if (sitesprenError || !sitesprenData) {
      return res.status(404).json({ error: 'Site not found for this user' });
    }

    // 5. Query sitesglub for IP address (ONLY source for IP as requested)
    const { data: sitesglubData, error: sitesglubError } = await supabase
      .from('sitesglub')
      .select('glub_ip_address, mj_tf, mj_cf, mj_rd') // Example additional metrics
      .eq('glub_sitesglub_base', cleanDomain) // Match on domain
      .single();

    // 6. Return data with pseudo names for security
    const responseData = {
      sitesprivate_base: sitesprenData.sitespren_base || '', // Pseudo name for frontend
      sitesglobal_ip_address: sitesglubData?.glub_ip_address || '', // ONLY use sitesglub IP
      // Add other metrics with pseudo names
      sitesglobal_mj_tf: sitesglubData?.mj_tf || '',
      sitesglobal_mj_cf: sitesglubData?.mj_cf || '',
      sitesglobal_mj_rd: sitesglubData?.mj_rd || '',
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// For App Router (app/api/extension/site-metrics/route.js):
/*
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request) {
  // Similar implementation but with NextResponse
  // ...
  return NextResponse.json(data);
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'chrome-extension://*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Extension-ID',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
*/