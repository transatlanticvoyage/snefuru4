'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

// Interface for ywp_sites table structure
interface YwpSite {
  id: string;
  site_url: string;
  site_name: string;
  admin_email?: string;
  wp_version?: string;
  api_key: string;
  sync_enabled: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export default function Weplich1Page() {
  const [sites, setSites] = useState<YwpSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'WordPress Sites - Snefuru';
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Page auth state:', { 
        userFromContext: !!user, 
        userFromSession: !!session,
        userId: user?.id,
        sessionUserId: session?.user?.id
      });
    };
    checkAuth();
  }, [user, supabase]);

  const fetchSites = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID in context');
        throw new Error('User not authenticated');
      }

      console.log('Fetching user data for auth_id:', user.id);

      // First get the user record to get their internal ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        throw new Error('Failed to fetch user record');
      }

      if (!userData) {
        console.log('No user data found for auth_id:', user.id);
        throw new Error('User record not found');
      }

      console.log('Found user data:', userData);

      // Now fetch ywp_sites data for this user
      // Note: You may need to adjust this query based on how sites are linked to users
      // For now, I'll assume there's a user_id column or similar relationship
      const { data, error } = await supabase
        .from('ywp_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (err) {
      console.error('Error in fetchSites:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSites();
    } else {
      console.log('No user in context, skipping fetch');
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!user) {
    return <div className="text-red-600 p-4">Please log in to view WordPress sites</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">WordPress Sites</h1>
      
      <div className="mb-4">
        <p className="text-gray-600">
          Total sites: <span className="font-semibold">{sites.length}</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WP Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Enabled</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sync</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sites.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  No WordPress sites found
                </td>
              </tr>
            ) : (
              sites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {site.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={site.site_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      {site.site_url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {site.site_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {site.admin_email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {site.wp_version || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                    <span 
                      className="cursor-pointer hover:text-gray-900" 
                      title="Click to reveal full API key"
                      onClick={(e) => {
                        const span = e.target as HTMLSpanElement;
                        if (span.textContent?.includes('...')) {
                          span.textContent = site.api_key;
                        } else {
                          span.textContent = site.api_key.substring(0, 12) + '...';
                        }
                      }}
                    >
                      {site.api_key.substring(0, 12)}...
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      site.sync_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {site.sync_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {site.last_sync_at 
                      ? new Date(site.last_sync_at).toLocaleString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(site.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(site.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sites.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          <p>💡 Click on truncated API keys to reveal the full key</p>
        </div>
      )}
    </div>
  );
} 