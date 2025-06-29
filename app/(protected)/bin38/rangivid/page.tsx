"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import { cfunc_63_push_images } from '@/app/bin45/cfunc_63_push_images';

export default function RangividPage() {
  const { user } = useAuth();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [domainUpdateLoading, setDomainUpdateLoading] = useState(false);
  const [domainUpdateResult, setDomainUpdateResult] = useState<string | null>(null);
  const [wpSites, setWpSites] = useState<any[]>([]);
  const [selectedWpSiteId, setSelectedWpSiteId] = useState<string>('');
  const [wpSiteUpdateLoading, setWpSiteUpdateLoading] = useState(false);
  const [wpSiteUpdateResult, setWpSiteUpdateResult] = useState<string | null>(null);
  const [selectedNufuPageType, setSelectedNufuPageType] = useState<string>('');
  const [nufuPageTypeLoading, setNufuPageTypeLoading] = useState(false);
  const [nufuPageTypeResult, setNufuPageTypeResult] = useState<string | null>(null);
  const [kareench1, setKareench1] = useState<string>('');
  const [whichImages, setWhichImages] = useState<string>('image1_only');
  const [pushMethod, setPushMethod] = useState<string>('');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const batchId = searchParams?.get('batch');
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'rangivid - Snefuru';
  }, []);

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

  useEffect(() => {
    const fetchWpSites = async () => {
      if (!user?.id) return;
      
      try {
        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
          
        if (userError || !userData) return;
        
        // Fetch WP sites for this user
        const { data, error } = await supabase
          .from('ywp_sites')
          .select('id, site_name, site_url')
          .eq('fk_user_id', userData.id)
          .order('site_name', { ascending: true });
          
        if (error) {
          console.error('Error fetching WP sites:', error);
          return;
        }
        
        setWpSites(data || []);
      } catch (err) {
        console.error('Error in fetchWpSites:', err);
      }
    };
    
    fetchWpSites();
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

  const handleWpSiteAssociation = async () => {
    if (!selectedWpSiteId || !batchId) {
      setWpSiteUpdateResult('Please select a WP site.');
      return;
    }

    setWpSiteUpdateLoading(true);
    setWpSiteUpdateResult(null);
    
    try {
      // Update the WP site with the batch ID
      const { error } = await supabase
        .from('ywp_sites')
        .update({ fk_images_plans_batches_id: batchId })
        .eq('id', selectedWpSiteId);
        
      if (error) throw error;
      
      setWpSiteUpdateResult('✅ WP Site association updated successfully!');
      
      // Refresh WP sites data to show updated information
      const updatedSites = wpSites.map(site => 
        site.id === selectedWpSiteId 
          ? { ...site, fk_images_plans_batches_id: batchId }
          : site
      );
      setWpSites(updatedSites);
      
    } catch (err) {
      setWpSiteUpdateResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setWpSiteUpdateLoading(false);
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

  const handlePushImages = async () => {
    if (!pushMethod) {
      setPushResult('❌ Please select a push method before proceeding.');
      return;
    }

    if (!batchId) {
      setPushResult('❌ No batch ID found.');
      return;
    }

    setPushLoading(true);
    setPushResult(null);
    
    try {
      const result = await cfunc_63_push_images(batchId, pushMethod);
      
      // Debug: Log the full result to see what we're getting
      console.log('🔍 Client Debug - Full API result:', result);
      console.log('🔍 Client Debug - Upload details:', result.results?.upload_details);
      
      if (result.success) {
        setPushResult(`✅ ${result.message}`);
        // Update kareench1 textarea with upload details if available
        if (result.results?.upload_details) {
          console.log('🔍 Client Debug - Processing upload details...');
          
          const uploadDetails = result.results.upload_details
            .map((detail: any, index: number) => {
              console.log(`🔍 Client Debug - Detail ${index + 1}:`, detail);
              const errorMsg = detail.error_message ? `\t${detail.error_message}` : '';
              return `${detail.nupload_id}\t${detail.nupload_status1}\t${detail.img_url_returned}\t${detail.wp_img_id_returned || ''}${errorMsg}`;
            })
            .join('\n');
          
          const header = 'nupload_id\tnupload_status1\timg_url_returned\twp_img_id_returned\terror_message';
          const finalContent = `${header}\n${uploadDetails}`;
          
          console.log('🔍 Client Debug - Final textarea content:', finalContent);
          setKareench1(finalContent);
        }
      } else {
        setPushResult(`❌ ${result.error}`);
      }
      
    } catch (err) {
      console.error('🔍 Client Debug - Exception:', err);
      setPushResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setPushLoading(false);
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

        {/* narpi push to wordpress options Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">narpi push to wordpress options</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* WHICH IMAGES TO PUSH Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">WHICH IMAGES TO PUSH</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="whichImages"
                      value="image1_only"
                      checked={true}
                      disabled={true}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      only use image 1 for each plan - use fk_image1_id from images_plans
                    </span>
                  </label>
                </div>
              </div>

              {/* HR Separator */}
              <hr className="border-gray-300" />

              {/* PUSH METHOD Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">PUSH METHOD</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pushMethod"
                      value="wp_login"
                      checked={pushMethod === 'wp_login'}
                      onChange={(e) => setPushMethod(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      push images using wp login credentials
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pushMethod"
                      value="wp_plugin"
                      checked={pushMethod === 'wp_plugin'}
                      onChange={(e) => setPushMethod(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      push images using wp plugin connection (snefuruplin)
                    </span>
                  </label>
                </div>
              </div>

              {/* HR Separator */}
              <hr className="border-gray-300" />

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handlePushImages}
                  disabled={pushLoading || !pushMethod}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pushLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Pushing Images...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      func_63_push_images
                    </>
                  )}
                </button>
                
                {/* Push Result Message */}
                {pushResult && (
                  <div className={`mt-3 text-sm ${pushResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {pushResult}
                  </div>
                )}
              </div>

              {/* kareench1 Text Field */}
              <div>
                <label htmlFor="kareench1" className="block text-sm font-medium text-gray-700 mb-2">
                  kareench1
                </label>
                <textarea
                  id="kareench1"
                  value={kareench1}
                  onChange={(e) => setKareench1(e.target.value)}
                  placeholder="Enter kareench1 content..."
                  className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
                  style={{ 
                    width: '600px', 
                    height: '200px',
                    maxWidth: '100%', // Ensure it doesn't overflow on smaller screens
                    border: '1px solid #4B5563' // Dark gray border
                  }}
                />
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

        {/* func_51_save_batch_settings Button */}
        <div className="mt-6 flex justify-center">
          <button
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => {
              // No functionality needed right now
            }}
          >
            func_51_save_batch_settings
          </button>
        </div>
      </div>
    </div>
  );
} 