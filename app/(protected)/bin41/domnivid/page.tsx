"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';

export default function DomnividPage() {
  const { user } = useAuth();
  const [domain, setDomain] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wpUser1, setWpUser1] = useState<string>('');
  const [wpPass1, setWpPass1] = useState<string>('');
  const [wpCredentialsLoading, setWpCredentialsLoading] = useState(false);
  const [wpCredentialsResult, setWpCredentialsResult] = useState<string | null>(null);
  const [wpPluginInstalled1, setWpPluginInstalled1] = useState<boolean>(false);
  const [wpPluginConnected2, setWpPluginConnected2] = useState<boolean>(false);
  const [installActivateLoading, setInstallActivateLoading] = useState(false);
  const [installActivateResult, setInstallActivateResult] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const domainBase = searchParams?.get('domain_base');
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'domnivid - Snefuru';
  }, []);

  useEffect(() => {
    const fetchDomainDetails = async () => {
      if (!domainBase || !user?.id) {
        setDomain(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
          
        if (userError || !userData) {
          setError('Could not find user record.');
          setDomain(null);
          setLoading(false);
          return;
        }
        
        // Fetch specific domain for this user
        const { data, error } = await supabase
          .from('domains1')
          .select('*')
          .eq('domain_base', domainBase)
          .eq('fk_user_id', userData.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            setError('Domain not found or you do not have access to it.');
          } else {
            throw error;
          }
          setDomain(null);
        } else {
          setDomain(data);
          // Populate WordPress credentials if they exist
          setWpUser1(data.wpuser1 || '');
          setWpPass1(data.wppass1 || '');
          // Populate WordPress plugin status
          setWpPluginInstalled1(data.wp_plugin_installed1 || false);
          setWpPluginConnected2(data.wp_plugin_connected2 || false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch domain details');
        setDomain(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDomainDetails();
  }, [domainBase, user, supabase]);

  // Handle WordPress credentials update
  const handleWpCredentialsUpdate = async () => {
    if (!domain?.id) {
      setWpCredentialsResult('No domain found to update.');
      return;
    }

    setWpCredentialsLoading(true);
    setWpCredentialsResult(null);
    
    try {
      // Update the domain with WordPress credentials
      const { error } = await supabase
        .from('domains1')
        .update({ 
          wpuser1: wpUser1.trim() || null,
          wppass1: wpPass1.trim() || null
        })
        .eq('id', domain.id);
        
      if (error) throw error;
      
      setWpCredentialsResult('✅ WordPress credentials updated successfully!');
      
      // Refresh domain data to show updated information
      setDomain((prev: any) => ({ 
        ...prev, 
        wpuser1: wpUser1.trim() || null,
        wppass1: wpPass1.trim() || null
      }));
      
    } catch (err) {
      console.error('Error updating WordPress credentials:', err);
      setWpCredentialsResult('❌ Error updating WordPress credentials. Please try again.');
    } finally {
      setWpCredentialsLoading(false);
    }
  };

  // Handle WordPress plugin status update
  const handleWpPluginStatusUpdate = async (field: 'wp_plugin_installed1' | 'wp_plugin_connected2', value: boolean) => {
    if (!domain?.id) return;

    try {
      const { error } = await supabase
        .from('domains1')
        .update({ [field]: value })
        .eq('id', domain.id);
        
      if (error) throw error;
      
      // Update local state
      if (field === 'wp_plugin_installed1') {
        setWpPluginInstalled1(value);
      } else {
        setWpPluginConnected2(value);
      }
      
      // Refresh domain data
      const { data: refreshedData } = await supabase
        .from('domains1')
        .select('*')
        .eq('id', domain.id)
        .single();
        
      if (refreshedData) {
        setDomain(refreshedData);
      }
      
    } catch (error) {
      console.error('Error updating WordPress plugin status:', error);
    }
  };

  // Handle automatic WordPress plugin installation and activation
  const handleInstallActivatePlugin = async () => {
    if (!domain?.id || !domain?.domain_base) {
      setInstallActivateResult('❌ Domain information not available.');
      return;
    }

    if (!domain?.wpuser1 || !domain?.wppass1) {
      setInstallActivateResult('❌ WordPress credentials are required. Please add wpuser1 and wppass1 first.');
      return;
    }

    setInstallActivateLoading(true);
    setInstallActivateResult(null);

    try {
      const response = await fetch('/api/wordpress/install-activate-plugin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain_id: domain.id,
          domain_base: domain.domain_base,
          wp_username: domain.wpuser1,
          wp_password: domain.wppass1,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setInstallActivateResult(`✅ ${result.message}`);
        
        // Update plugin status if installation was successful
        if (result.success) {
          await handleWpPluginStatusUpdate('wp_plugin_installed1', true);
          await handleWpPluginStatusUpdate('wp_plugin_connected2', true);
        }
      } else {
        setInstallActivateResult(`❌ ${result.error || 'Failed to install and activate plugin'}`);
      }
    } catch (error) {
      console.error('Error installing WordPress plugin:', error);
      setInstallActivateResult('❌ Network error. Please try again.');
    } finally {
      setInstallActivateLoading(false);
    }
  };

  // If no domain_base parameter, show empty state
  if (!domainBase) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Domain Selected</h3>
            <p className="text-gray-500 mb-4">
              Add a domain_base parameter to the URL to view domain details.
            </p>
            <p className="text-sm text-gray-400 font-mono">
              Example: /bin41/domnivid?domain_base=example.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading domain details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-red-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Domain</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Domain Not Found</h3>
            <p className="text-gray-500">
              The requested domain could not be found or you don't have access to it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format field names for display
  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format field values for display
  const formatFieldValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (key.includes('created_at') || key.includes('updated_at')) {
      return new Date(value).toLocaleString();
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return String(value);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Domain Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                Viewing domain: <span className="font-mono text-gray-700">{domainBase}</span>
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active Domain
              </span>
            </div>
          </div>
        </div>

        {/* Domain Details Card */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Domain Information</h2>
          </div>
          
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {Object.entries(domain).map(([key, value]) => (
                <div key={key} className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {formatFieldName(key)}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="max-w-full">
                      {key.includes('id') ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {formatFieldValue(key, value)}
                        </span>
                      ) : key === 'domain_base' ? (
                        <span className="font-medium text-indigo-600">
                          {formatFieldValue(key, value)}
                        </span>
                      ) : (
                        <span className="break-words">
                          {formatFieldValue(key, value)}
                        </span>
                      )}
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* WordPress Credentials Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">WordPress Credentials</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage WordPress login credentials for this domain
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* Current Credentials Display */}
              {(domain.wpuser1 || domain.wppass1) && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Current WordPress User:</strong> {domain.wpuser1 || 'Not set'}
                    <br />
                    <strong>Password Status:</strong> {domain.wppass1 ? 'Set' : 'Not set'}
                  </p>
                </div>
              )}

              {/* WordPress Username Field */}
              <div>
                <label htmlFor="wp-username" className="block text-sm font-medium text-gray-700 mb-2">
                  WordPress Username
                </label>
                <input
                  type="text"
                  id="wp-username"
                  value={wpUser1}
                  onChange={(e) => setWpUser1(e.target.value)}
                  placeholder="Enter WordPress username"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={wpCredentialsLoading}
                />
              </div>

              {/* WordPress Password Field */}
              <div>
                <label htmlFor="wp-password" className="block text-sm font-medium text-gray-700 mb-2">
                  WordPress Password
                </label>
                <input
                  type="password"
                  id="wp-password"
                  value={wpPass1}
                  onChange={(e) => setWpPass1(e.target.value)}
                  placeholder="Enter WordPress password"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={wpCredentialsLoading}
                />
              </div>

              {/* Update Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleWpCredentialsUpdate}
                  disabled={wpCredentialsLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wpCredentialsLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update WordPress Credentials'
                  )}
                </button>
                
                {/* Clear Button */}
                <button
                  onClick={() => {
                    setWpUser1('');
                    setWpPass1('');
                  }}
                  disabled={wpCredentialsLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Fields
                </button>
              </div>
              
              {/* Result Message */}
              {wpCredentialsResult && (
                <div className={`mt-3 text-sm ${wpCredentialsResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {wpCredentialsResult}
                </div>
              )}
              
              {/* Security Note */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.632 0L4.182 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      WordPress credentials are stored securely. Consider using application passwords instead of your main account password for better security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WordPress Plugin Status Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">WordPress Plugin Status</h2>
            <p className="text-sm text-gray-500 mt-1">
              Current status of the Snefuruplin Cloud Connector plugin for this domain
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Plugin Installed Status */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    WP Plugin Currently Installed
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Whether the plugin is installed on this WordPress site
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-lg font-semibold ${wpPluginInstalled1 ? 'text-green-600' : 'text-red-600'}`}>
                    {wpPluginInstalled1 ? 'Yes' : 'No'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleWpPluginStatusUpdate('wp_plugin_installed1', true)}
                      className={`px-3 py-1 text-xs rounded ${wpPluginInstalled1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'}`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleWpPluginStatusUpdate('wp_plugin_installed1', false)}
                      className={`px-3 py-1 text-xs rounded ${!wpPluginInstalled1 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'}`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Plugin Connected Status */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    WP Plugin Currently Connected
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Whether the plugin is actively connected and syncing data
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-lg font-semibold ${wpPluginConnected2 ? 'text-green-600' : 'text-red-600'}`}>
                    {wpPluginConnected2 ? 'Yes' : 'No'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleWpPluginStatusUpdate('wp_plugin_connected2', true)}
                      className={`px-3 py-1 text-xs rounded ${wpPluginConnected2 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'}`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleWpPluginStatusUpdate('wp_plugin_connected2', false)}
                      className={`px-3 py-1 text-xs rounded ${!wpPluginConnected2 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'}`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Plugin Download Link */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Plugin Download
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Download the latest version of the Snefuruplin Cloud Connector plugin
                    </p>
                  </div>
                  <a
                    href="/api/snefuruplin/download"
                    target="_blank"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Plugin
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Install And Activate WP Plugin Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Install And Activate WP Plugin Using The wpuser1 and wppass1</h2>
            <p className="text-sm text-gray-500 mt-1">
              Automatically install and activate the Snefuruplin Cloud Connector plugin on this WordPress site
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* Prerequisites Check */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Prerequisites:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center">
                    <span className={`mr-2 ${domain?.domain_base ? 'text-green-600' : 'text-red-600'}`}>
                      {domain?.domain_base ? '✓' : '✗'}
                    </span>
                    Domain URL: {domain?.domain_base || 'Not available'}
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${domain?.wpuser1 ? 'text-green-600' : 'text-red-600'}`}>
                      {domain?.wpuser1 ? '✓' : '✗'}
                    </span>
                    WordPress Username: {domain?.wpuser1 ? 'Set' : 'Not set'}
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${domain?.wppass1 ? 'text-green-600' : 'text-red-600'}`}>
                      {domain?.wppass1 ? '✓' : '✗'}
                    </span>
                    WordPress Password: {domain?.wppass1 ? 'Set' : 'Not set'}
                  </li>
                </ul>
              </div>

              {/* Installation Process Description */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">What this will do:</h3>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Connect to your WordPress site using the provided credentials</li>
                  <li>Download the latest Snefuruplin Cloud Connector plugin</li>
                  <li>Install the plugin on your WordPress site</li>
                  <li>Activate the plugin automatically</li>
                  <li>Update the plugin status in our system</li>
                </ol>
              </div>

              {/* Install/Activate Button */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Ready to install and activate the WordPress plugin automatically?
                  </p>
                </div>
                <button
                  onClick={handleInstallActivatePlugin}
                  disabled={installActivateLoading || !domain?.wpuser1 || !domain?.wppass1}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {installActivateLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Installing...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      func_52_install_activate
                    </>
                  )}
                </button>
              </div>

              {/* Result Message */}
              {installActivateResult && (
                <div className={`mt-4 p-3 rounded-md ${installActivateResult.startsWith('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${installActivateResult.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
                    {installActivateResult}
                  </p>
                </div>
              )}

              {/* Security Warning */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.632 0L4.182 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This process will use your WordPress admin credentials to install the plugin. Ensure your credentials are secure and consider using application passwords for better security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <div className="flex space-x-3">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                // TODO: Implement edit functionality
                alert('Edit functionality coming soon!');
              }}
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Domain
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            Last updated: {domain.updated_at ? new Date(domain.updated_at).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
} 