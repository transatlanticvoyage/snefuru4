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
      setWpCredentialsResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setWpCredentialsLoading(false);
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