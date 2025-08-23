'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import Header from '@/app/components/Header';
import { SyncResult, SyncMethod } from '@/app/lib/sync/types';

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

// Sync state for each site
interface SiteSync {
  [siteId: string]: {
    plugin_api?: {
      loading: boolean;
      result?: SyncResult;
    };
    rest_api?: {
      loading: boolean;
      result?: SyncResult;
    };
    test?: {
      loading: boolean;
    };
  };
}

export default function Weplich1Client() {
  const [sites, setSites] = useState<YwpSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSites, setNewSites] = useState('');
  const [addingSites, setAddingSites] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [syncStates, setSyncStates] = useState<SiteSync>({});
  const { user } = useAuth();
  const supabase = createClientComponentClient();

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
        throw new Error('User not authenticated');
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

      // Now fetch ywp_sites data for this specific user only
      const { data, error } = await supabase
        .from('ywp_sites')
        .select('*')
        .eq('fk_user_id', userData.id)
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

  // Handle sites submission
  const handleSitesSubmit = async () => {
    if (!newSites.trim()) {
      setAddError('Please enter some sites to add.');
      return;
    }

    setAddingSites(true);
    setAddSuccess(null);
    setAddError(null);
    
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Split sites by lines and clean them up
      const siteLines = newSites
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (siteLines.length === 0) {
        throw new Error('No valid sites found');
      }

      // Import and call the client function
      const { func_71_add_sites } = await import('./utils/cfunc_71_add_sites');
      const result = await func_71_add_sites(siteLines);
      
      if (result.success) {
        setAddSuccess(`✅ Successfully added ${result.count || 0} sites!`);
        setNewSites(''); // Clear the text box
        await fetchSites(); // Refresh the table
      } else {
        setAddError(`❌ ${result.message || 'Failed to add sites'}`);
      }
    } catch (err) {
      setAddError(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAddingSites(false);
    }
  };

  // Handle sync with specific method
  const handleSync = async (site: YwpSite, method: SyncMethod) => {
    setSyncStates(prev => ({
      ...prev,
      [site.id]: {
        ...prev[site.id], // Preserve existing method states
        [method]: { loading: true }
      }
    }));

    try {
      const { cfunc_sync_site } = await import('./utils/cfunc_sync_site');
      const result = await cfunc_sync_site({
        siteId: site.id,
        siteUrl: site.site_url,
        method: method,
        fallbackEnabled: true
      });

      setSyncStates(prev => ({
        ...prev,
        [site.id]: {
          ...prev[site.id], // Preserve existing method states
          [method]: { loading: false, result }
        }
      }));

      // Clear result after 5 seconds
      setTimeout(() => {
        setSyncStates(prev => ({
          ...prev,
          [site.id]: {
            ...prev[site.id], // Preserve existing method states
            [method]: { loading: false }
          }
        }));
      }, 5000);

      // Refresh sites to update last_sync_at
      if (result.success) {
        await fetchSites();
      }
    } catch (error) {
      setSyncStates(prev => ({
        ...prev,
        [site.id]: {
          ...prev[site.id], // Preserve existing method states
          [method]: { 
            loading: false, 
            result: {
              success: false,
              message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              method
            }
          }
        }
      }));
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setSyncStates(prev => ({
          ...prev,
          [site.id]: {
            ...prev[site.id], // Preserve existing method states
            [method]: { loading: false }
          }
        }));
      }, 5000);
    }
  };

  // Handle test plugin
  const handleTestPlugin = async (site: YwpSite) => {
    setSyncStates(prev => ({
      ...prev,
      [site.id]: {
        ...prev[site.id],
        test: { loading: true }
      }
    }));

    try {
      const { cfunc_test_plugin } = await import('./utils/cfunc_test_plugin');
      const result = await cfunc_test_plugin({
        siteId: site.id,
        siteUrl: site.site_url
      });

      setSyncStates(prev => ({
        ...prev,
        [site.id]: {
          ...prev[site.id],
          test: { loading: false }
        }
      }));

      // Refresh sites to update last_sync_at
      if (result.success) {
        await fetchSites();
      }
    } catch (error) {
      setSyncStates(prev => ({
        ...prev,
        [site.id]: {
          ...prev[site.id],
          test: { loading: false }
        }
      }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchSites();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center min-h-screen">Loading...</div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-red-600 p-4">{error}</div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-red-600 p-4">Please log in to view WordPress sites</div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">WordPress Sites</h1>

            {/* Add Sites Section */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add WP Sites Text Box 1</h2>
              
              <div className="space-y-4">
                <textarea
                  value={newSites}
                  onChange={(e) => setNewSites(e.target.value)}
                  placeholder="Enter WordPress sites, one per line..."
                  className="block border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  style={{ width: '400px', height: '150px' }}
                  disabled={addingSites}
                />
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSitesSubmit}
                    disabled={addingSites}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingSites ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'submit func_71_add_sites'
                    )}
                  </button>
                  
                  {addSuccess && (
                    <div className={`text-sm ${addSuccess.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                      {addSuccess}
                    </div>
                  )}
                  
                  {addError && (
                    <div className="text-sm text-red-600">
                      {addError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">
                Total sites: <span className="font-semibold">{sites.length}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                        No WordPress sites found
                      </td>
                    </tr>
                  ) : (
                    sites.map((site) => {
                      const syncState = syncStates[site.id];
                      return (
                        <tr key={site.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                              <a
                                href={`/bin47/wepfol?site=${encodeURIComponent(site.site_url)}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <svg className="-ml-0.5 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Individual View
                              </a>
                              
                              {/* Sync Buttons */}
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleSync(site, 'plugin_api')}
                                  disabled={syncState?.plugin_api?.loading}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {syncState?.plugin_api?.loading ? (
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Plugin API
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleSync(site, 'rest_api')}
                                  disabled={syncState?.rest_api?.loading}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {syncState?.rest_api?.loading ? (
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      REST API
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleTestPlugin(site)}
                                  disabled={syncState?.test?.loading}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {syncState?.test?.loading ? (
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Test Plugin
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              {/* Sync Results */}
                              {syncState?.plugin_api?.result && (
                                <div className={`text-xs px-2 py-1 rounded ${
                                  syncState.plugin_api.result.success 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {syncState.plugin_api.result.success ? '✅' : '❌'} {syncState.plugin_api.result.message}
                                  {syncState.plugin_api.result.count && ` (${syncState.plugin_api.result.count} items)`}
                                </div>
                              )}
                              {syncState?.rest_api?.result && (
                                <div className={`text-xs px-2 py-1 rounded ${
                                  syncState.rest_api.result.success 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {syncState.rest_api.result.success ? '✅' : '❌'} {syncState.rest_api.result.message}
                                  {syncState.rest_api.result.count && ` (${syncState.rest_api.result.count} items)`}
                                </div>
                              )}
                            </div>
                          </td>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {sites.length > 0 && (
              <div className="mt-4 text-sm text-gray-500">
                <p>💡 Click on truncated API keys to reveal the full key</p>
                <p>🔄 Plugin API (purple) is the default method with full access. REST API (green) is the fallback with limited access.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}