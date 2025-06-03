"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'rangivid',
};

export default function RangividPage() {
  const { user } = useAuth();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [domainUpdateLoading, setDomainUpdateLoading] = useState(false);
  const [domainUpdateResult, setDomainUpdateResult] = useState<string | null>(null);
  const [selectedNufuPageType, setSelectedNufuPageType] = useState<string>('');
  const [nufuPageTypeLoading, setNufuPageTypeLoading] = useState(false);
  const [nufuPageTypeResult, setNufuPageTypeResult] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const batchId = searchParams?.get('batch');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchBatchDetails = async () => {
      if (!batchId || !user?.id) {
        setBatch(null);
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
          setBatch(null);
          setLoading(false);
          return;
        }
        
        // Fetch specific batch for this user
        const { data, error } = await supabase
          .from('images_plans_batches')
          .select('*')
          .eq('id', batchId)
          .eq('rel_users_id', userData.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            setError('Batch not found or you do not have access to it.');
          } else {
            throw error;
          }
          setBatch(null);
        } else {
          setBatch(data);
          // Set the selected domain if batch has one
          if (data.fk_domains_id) {
            setSelectedDomainId(data.fk_domains_id);
          }
          // Set the selected nufu page type if batch has one
          if (data.nufu_page_type_1) {
            setSelectedNufuPageType(data.nufu_page_type_1);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch batch details');
        setBatch(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBatchDetails();
  }, [batchId, user, supabase]);

  useEffect(() => {
    const fetchDomains = async () => {
      if (!user?.id) return;
      
      try {
        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
          
        if (userError || !userData) return;
        
        // Fetch domains for this user
        const { data, error } = await supabase
          .from('domains1')
          .select('id, domain_base')
          .eq('fk_user_id', userData.id)
          .order('domain_base', { ascending: true });
          
        if (error) {
          console.error('Error fetching domains:', error);
          return;
        }
        
        setDomains(data || []);
      } catch (err) {
        console.error('Error in fetchDomains:', err);
      }
    };
    
    fetchDomains();
  }, [user, supabase]);

  const handleDomainAssociation = async () => {
    if (!selectedDomainId || !batchId) {
      setDomainUpdateResult('Please select a domain.');
      return;
    }

    setDomainUpdateLoading(true);
    setDomainUpdateResult(null);
    
    try {
      // Update the batch with the selected domain
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ fk_domains_id: selectedDomainId })
        .eq('id', batchId);
        
      if (error) throw error;
      
      setDomainUpdateResult('✅ Domain association updated successfully!');
      
      // Refresh batch data to show updated information
      setBatch((prev: any) => ({ ...prev, fk_domains_id: selectedDomainId }));
      
    } catch (err) {
      setDomainUpdateResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDomainUpdateLoading(false);
    }
  };

  const handleNufuPageTypeSave = async () => {
    if (!selectedNufuPageType || !batchId) {
      setNufuPageTypeResult('Please select a nufu page type.');
      return;
    }

    setNufuPageTypeLoading(true);
    setNufuPageTypeResult(null);
    
    try {
      // Update the batch with the selected nufu page type
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ nufu_page_type_1: selectedNufuPageType })
        .eq('id', batchId);
        
      if (error) throw error;
      
      setNufuPageTypeResult('✅ Nufu page type saved successfully!');
      
      // Refresh batch data to show updated information
      setBatch((prev: any) => ({ ...prev, nufu_page_type_1: selectedNufuPageType }));
      
    } catch (err) {
      setNufuPageTypeResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setNufuPageTypeLoading(false);
    }
  };

  // If no batch parameter, show empty state
  if (!batchId) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Batch Selected</h3>
            <p className="text-gray-500 mb-4">
              Add a batch parameter to the URL to view batch details.
            </p>
            <p className="text-sm text-gray-400 font-mono">
              Example: /bin38/rangivid?batch=your-batch-id-here
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
            <p className="text-gray-600">Loading batch details...</p>
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
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Batch</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-7 7-7-7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Batch Not Found</h3>
            <p className="text-gray-500">
              The requested batch could not be found or you don't have access to it.
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
              <h1 className="text-2xl font-bold text-gray-900">Batch Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                Viewing batch: <span className="font-mono text-gray-700">{batchId}</span>
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active Batch
              </span>
            </div>
          </div>
        </div>

        {/* Batch Details Card - Xlslike Original Submission area */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Batch Information</h2>
          </div>
          
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {Object.entries(batch).map(([key, value]) => (
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

        {/* Dark HR Separator */}
        <hr className="my-8 border-0 h-[3px] bg-black" />

        {/* Domain Association Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Domain Associated To This Batch</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* Current Domain Display */}
              {batch.fk_domains_id && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Currently Associated Domain:</strong>{' '}
                    {domains.find(d => d.id === batch.fk_domains_id)?.domain_base || batch.fk_domains_id}
                  </p>
                </div>
              )}

              {/* Domain Selection Dropdown */}
              <div>
                <label htmlFor="domain-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select a domain
                </label>
                <div className="flex items-center space-x-3">
                  <select
                    id="domain-select"
                    value={selectedDomainId}
                    onChange={(e) => setSelectedDomainId(e.target.value)}
                    className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={domainUpdateLoading}
                  >
                    <option value="">-- Select a domain --</option>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.domain_base}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleDomainAssociation}
                    disabled={domainUpdateLoading || !selectedDomainId}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {domainUpdateLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Associate Domain'
                    )}
                  </button>
                </div>
                
                {/* Result Message */}
                {domainUpdateResult && (
                  <div className={`mt-3 text-sm ${domainUpdateResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {domainUpdateResult}
                  </div>
                )}
                
                {/* No Domains Message */}
                {domains.length === 0 && (
                  <div className="mt-3 text-sm text-gray-500">
                    No domains found. <a href="/bin36/domjar1" className="text-indigo-600 hover:text-indigo-500">Add domains</a> to associate with this batch.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nufu Page Goal Settings Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Nufu Page Goal Settings</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* Current Nufu Page Type Display */}
              {batch.nufu_page_type_1 && (
                <div className="mb-4 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-700">
                    <strong>Current Nufu Page Type:</strong> {batch.nufu_page_type_1}
                  </p>
                </div>
              )}

              {/* Nufu Page Type Selection Dropdown */}
              <div>
                <label htmlFor="nufu-page-type-select" className="block text-sm font-medium text-gray-700 mb-2">
                  nufu page type 1
                </label>
                <div className="flex items-center space-x-3">
                  <select
                    id="nufu-page-type-select"
                    value={selectedNufuPageType}
                    onChange={(e) => setSelectedNufuPageType(e.target.value)}
                    className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={nufuPageTypeLoading}
                  >
                    <option value="">-- Select page type --</option>
                    <option value="Home Page">Home Page</option>
                    <option value="Services Hub Page">Services Hub Page</option>
                    <option value="Individual Service Page">Individual Service Page</option>
                  </select>
                  
                  <button
                    onClick={handleNufuPageTypeSave}
                    disabled={nufuPageTypeLoading || !selectedNufuPageType}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {nufuPageTypeLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
                
                {/* Result Message */}
                {nufuPageTypeResult && (
                  <div className={`mt-3 text-sm ${nufuPageTypeResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {nufuPageTypeResult}
                  </div>
                )}
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
          
          <div className="text-xs text-gray-400">
            Last updated: {batch.updated_at ? new Date(batch.updated_at).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
} 