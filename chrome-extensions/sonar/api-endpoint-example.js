// Example API endpoint for your Next.js app
// Place this file at: /pages/api/extension/site-metrics.js (or /app/api/extension/site-metrics/route.js for App Router)

import { createClient } from '@supabase/supabase-js';
import { getSession } from 'your-auth-library'; // Replace with your auth method

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers for extension
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // 4. Query sitespren table for exact match
    const { data: sitesprenData, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('*')
      .eq('sitespren_base', cleanDomain)
      .eq('user_id', userId)
      .single(); // Since it's unique per user

    if (sitesprenError || !sitesprenData) {
      return res.status(404).json({ error: 'Site not found for this user' });
    }

    // 5. Query sitesglub for additional data (adjust based on your schema)
    const { data: sitesglubData, error: sitesglubError } = await supabase
      .from('sitesglub')
      .select('ip_address')
      .eq('site_id', sitesprenData.id) // Adjust based on your foreign key
      .single();

    // 6. Return combined data
    const responseData = {
      sitesprivate_base: sitesprenData.sitespren_base || '',
      sitesglobal_ip_address: sitesglubData?.ip_address || '',
      // Add other fields as needed
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