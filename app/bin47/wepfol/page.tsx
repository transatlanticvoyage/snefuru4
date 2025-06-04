'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import Header from '@/app/components/Header';

// Interface for WordPress content from ywp_content table
interface WpContent {
  id: string;
  fk_site_id: string;  // UUID foreign key to ywp_sites
  post_id: number;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_status: string;
  post_type: string;
  post_date: string;
  post_modified: string;
  post_author: number;
  post_slug: string;
  post_parent?: number;
  menu_order?: number;
  comment_status?: string;
  ping_status?: string;
  guid?: string;
  post_name?: string;
  sync_method: string;
  raw_metadata: any;
  sync_version?: number;
  created_at: string;
  updated_at: string;
}

// Separate component that uses useSearchParams
function WepfolContent() {
  const [posts, setPosts] = useState<WpContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const siteParam = searchParams?.get('site');

  useEffect(() => {
    // Set document title
    document.title = `WP Content - ${siteParam || 'Unknown Site'} - Snefuru`;
  }, [siteParam]);

  const fetchSiteAndContent = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (!siteParam) {
        throw new Error('Site parameter is required');
      }

      // First get the user record to get their internal ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to fetch user record');
      }

      // Find the site record for this user
      const { data: siteData, error: siteError } = await supabase
        .from('ywp_sites')
        .select('*')
        .eq('fk_user_id', userData.id)
        .eq('site_url', siteParam.startsWith('http') ? siteParam : `https://${siteParam}`)
        .single();

      let foundSite = null;
      
      if (siteError) {
        // Try without https prefix or with partial match
        const { data: siteData2, error: siteError2 } = await supabase
          .from('ywp_sites')
          .select('*')
          .eq('fk_user_id', userData.id)
          .ilike('site_url', `%${siteParam}%`)
          .single();

        if (siteError2) {
          throw new Error('Site not found or you do not have access to it');
        }
        foundSite = siteData2;
      } else {
        foundSite = siteData;
      }

      setSiteInfo(foundSite);

      // Fetch content using the site ID foreign key relationship
      const { data: contentData, error: contentError } = await supabase
        .from('ywp_content')
        .select('*')
        .eq('fk_site_id', foundSite.id)
        .order('post_modified', { ascending: false });

      if (contentError) {
        console.error('Error fetching content:', contentError);
        setPosts([]);
      } else {
        setPosts(contentData || []);
      }

    } catch (err) {
      console.error('Error in fetchSiteAndContent:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch site content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && siteParam) {
      fetchSiteAndContent();
    } else {
      setIsLoading(false);
    }
  }, [user, siteParam]);

  // Format field names for display
  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format field values for display
  const formatFieldValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (key.includes('date') || key.includes('created_at') || key.includes('updated_at')) {
      return new Date(value).toLocaleString();
    }
    
    if (key === 'post_content' || key === 'post_excerpt') {
      if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...';
      }
    }
    
    return String(value);
  };

  if (!siteParam) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Site Selected</h3>
        <p className="text-gray-500 mb-4">
          Add a site parameter to the URL to view WordPress content.
        </p>
        <p className="text-sm text-gray-400 font-mono">
          Example: /bin47/wepfol?site=bluedogtoys.com
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading WordPress content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Content</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WordPress Content</h1>
            <p className="text-sm text-gray-500 mt-1">
              Site: <span className="font-medium text-gray-700">{siteParam}</span>
            </p>
            {siteInfo && (
              <p className="text-sm text-gray-500">
                {siteInfo.site_name} • Last sync: {siteInfo.last_sync_at ? new Date(siteInfo.last_sync_at).toLocaleString() : 'Never'}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {posts.length} {posts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Table */}
      {posts.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Posts & Pages</h2>
            <p className="text-sm text-gray-500 mt-1">
              Synced content from WordPress site
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sync Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Excerpt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.post_title || 'Untitled'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {post.post_id} • {post.post_slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.post_type === 'post' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {post.post_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.post_status === 'publish' 
                          ? 'bg-green-100 text-green-800'
                          : post.post_status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.post_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.sync_method === 'plugin_api' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {post.sync_method === 'plugin_api' ? 'Plugin API' : 'REST API'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFieldValue('post_date', post.post_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFieldValue('post_modified', post.post_modified)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="truncate">
                        {post.post_excerpt || 'No excerpt'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Stats */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600">
              <div>
                <span className="font-medium">{posts.length}</span> total items
              </div>
              <div className="space-x-4">
                <span>Posts: <span className="font-medium">{posts.filter(p => p.post_type === 'post').length}</span></span>
                <span>Pages: <span className="font-medium">{posts.filter(p => p.post_type === 'page').length}</span></span>
                <span>Plugin API: <span className="font-medium">{posts.filter(p => p.sync_method === 'plugin_api').length}</span></span>
                <span>REST API: <span className="font-medium">{posts.filter(p => p.sync_method === 'rest_api').length}</span></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Posts & Pages</h2>
          </div>
          
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Found</h3>
            <p className="text-gray-500 mb-4">
              No posts or pages have been synced for this WordPress site yet.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Content will appear here after synchronization with the WordPress site.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">To sync content:</p>
              <ol className="text-sm text-gray-500 space-y-1">
                <li>1. Go back to the Sites page</li>
                <li>2. Click the "Plugin API" or "REST API" sync button for this site</li>
                <li>3. Return here to view the synced content</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sites
        </button>
      </div>
    </div>
  );
}

// Loading fallback component
function WepfolLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main page component
export default function WepfolPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<WepfolLoading />}>
            <WepfolContent />
          </Suspense>
        </main>
      </div>
    </ProtectedRoute>
  );
} 