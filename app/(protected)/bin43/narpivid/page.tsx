"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NarpiPushDetails {
  id: string;
  push_name: string;
  push_desc: string;
  created_at: string;
  push_status1: string;
  fk_batch_id: string;
  kareench1: any;
  images_plans_batches?: {
    rel_users_id: string;
    batch_name?: string;
  };
}

interface UploadResult {
  nupload_id: number;
  nupload_status1: string;
  img_url_returned: string;
  wp_img_id_returned: number | null;
  error_message?: string;
}

export default function NarpividPage() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const { user } = useAuth();
  const [pushDetails, setPushDetails] = useState<NarpiPushDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'narpivid - Snefuru';
  }, []);

  useEffect(() => {
    const fetchPushDetails = async () => {
      if (!id || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          throw new Error('Could not find user record');
        }

        // Fetch specific narpi push details
        const { data, error: pushError } = await supabase
          .from('narpi_pushes')
          .select(`
            *,
            images_plans_batches!fk_batch_id(
              rel_users_id
            )
          `)
          .eq('id', id)
          .single();

        if (pushError) {
          throw pushError;
        }

        // Verify user has access to this push
        if (!data || !data.images_plans_batches || data.images_plans_batches.rel_users_id !== userData.id) {
          throw new Error('Push not found or access denied');
        }

        setPushDetails(data);
      } catch (err) {
        console.error('Error fetching push details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch push details');
      } finally {
        setLoading(false);
      }
    };

    fetchPushDetails();
  }, [id, user, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUploadResults = (): UploadResult[] => {
    if (!pushDetails?.kareench1 || !Array.isArray(pushDetails.kareench1)) {
      return [];
    }
    return pushDetails.kareench1;
  };

  const getUploadStats = () => {
    const results = getUploadResults();
    const total = results.length;
    const success = results.filter(r => r.nupload_status1 === 'success').length;
    const failed = results.filter(r => r.nupload_status1 === 'failed').length;
    return { total, success, failed };
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading push details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-red-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Push Details</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pushDetails) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Push Not Found</h3>
            <p className="text-gray-600">The requested push ID could not be found or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Narpi Push Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                Detailed view of push: {pushDetails.push_name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(pushDetails.push_status1)}`}>
                {pushDetails.push_status1}
              </span>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          {(() => {
            const stats = getUploadStats();
            return (
              <>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-indigo-500 rounded-md flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Images</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Successful</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.success}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-red-500 rounded-md flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.failed}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Push Information */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Push Information</h2>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Push ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{pushDetails.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Push Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{pushDetails.push_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Batch ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{pushDetails.fk_batch_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(pushDetails.created_at)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{pushDetails.push_desc || 'No description provided'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Upload Results Details */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Image Upload Results</h2>
            <p className="text-sm text-gray-500 mt-1">
              Detailed status and error information for each image upload attempt
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WordPress ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getUploadResults().map((result, index) => (
                  <tr key={index} className={result.nupload_status1 === 'failed' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.nupload_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.nupload_status1 === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.nupload_status1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.wp_img_id_returned || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      {result.img_url_returned ? (
                        <a 
                          href={result.img_url_returned} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline truncate block"
                        >
                          {result.img_url_returned.length > 50 
                            ? `${result.img_url_returned.substring(0, 50)}...`
                            : result.img_url_returned
                          }
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 max-w-md">
                      {result.error_message ? (
                        <div className="break-words">
                          <strong>Error:</strong> {result.error_message}
                        </div>
                      ) : result.nupload_status1 === 'failed' ? (
                        <span className="text-gray-500 italic">No specific error message available</span>
                      ) : (
                        <span className="text-green-600">✓ Success</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getUploadResults().length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No upload results data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 