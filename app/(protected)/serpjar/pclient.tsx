'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import SerpResultsTable from './components/SerpResultsTable';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SerpjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [keywordId, setKeywordId] = useState<number | null>(null);
  const [keywordData, setKeywordData] = useState<{keyword_id: number, keyword_datum: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [f400Loading, setF400Loading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [showFirstWarning, setShowFirstWarning] = useState(false);
  const [showSecondWarning, setShowSecondWarning] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Get keyword_id from URL parameters
  useEffect(() => {
    const keywordIdParam = searchParams.get('keyword_id');
    if (keywordIdParam) {
      const id = parseInt(keywordIdParam);
      if (!isNaN(id)) {
        setKeywordId(id);
      }
    } else {
      setKeywordId(null);
    }
    setLoading(false);
  }, [searchParams]);

  // Fetch keyword data when keywordId changes
  useEffect(() => {
    const fetchKeywordData = async () => {
      if (!keywordId) {
        setKeywordData(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('keywordshub')
          .select('keyword_id, keyword_datum')
          .eq('keyword_id', keywordId)
          .single();

        if (error) {
          console.error('Error fetching keyword data:', error);
          setKeywordData(null);
        } else {
          setKeywordData(data);
        }
      } catch (err) {
        console.error('Failed to fetch keyword data:', err);
        setKeywordData(null);
      }
    };

    fetchKeywordData();
  }, [keywordId, supabase]);

  // F400 SERP Fetch Handler
  const handleF400SerpFetch = () => {
    setShowFirstWarning(true);
  };

  const handleFirstWarningConfirm = () => {
    setShowFirstWarning(false);
    setShowSecondWarning(true);
  };

  const handleSecondWarningConfirm = async () => {
    setShowSecondWarning(false);
    setF400Loading(true);

    try {
      const response = await fetch('/api/f400', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword_id: keywordId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch SERP results');
      }

      // Show success message based on status
      if (result.status === 'pending') {
        alert(`${result.message}\n\n${result.note}\n\nDataForSEO Task ID: ${result.dataforseo_task_id}\nFetch ID: ${result.fetch_id}\n\nThe system will automatically attempt to retrieve results in 2 minutes.`);
        
        // Automatically attempt to complete the pending fetch after 2 minutes
        setTimeout(async () => {
          try {
            console.log(`Attempting to complete pending fetch_id: ${result.fetch_id}`);
            
            const completeResponse = await fetch('/api/f400-complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fetch_id: result.fetch_id,
              }),
            });

            const completeResult = await completeResponse.json();

            if (completeResponse.ok && completeResult.success) {
              alert(`🎉 Great news! Your SERP results are now ready!\n\nKeyword: ${keywordData?.keyword_datum}\nResults stored: ${completeResult.organic_results_stored || 0}\n\nPlease refresh the page to see the results.`);
            } else {
              console.log('Pending fetch completion failed:', completeResult);
              // Don't show an error alert, as this is a background operation
            }
          } catch (error) {
            console.error('Error completing pending fetch:', error);
            // Don't show an error alert, as this is a background operation
          }
        }, 120000); // 2 minutes delay
        
      } else {
        alert(`${result.message}\n\nResults stored: ${result.organic_results_stored || 0}\nPlease refresh the page to see new results.`);
      }
      
    } catch (error) {
      console.error('F400 error:', error);
      alert(`F400 SERP fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setF400Loading(false);
    }
  };

  const handleWarningCancel = () => {
    setShowFirstWarning(false);
    setShowSecondWarning(false);
  };

  // Complete Pending Fetches Handler
  const handleCompletePendingFetches = async () => {
    if (!keywordId) return;
    
    setCompleteLoading(true);
    try {
      // First, get the fetch_id for this keyword
      const { data: fetchData, error: fetchError } = await supabase
        .from('zhe_serp_fetches')
        .select('fetch_id, api_response_json, items_count')
        .eq('rel_keyword_id', keywordId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !fetchData || fetchData.length === 0) {
        alert('No fetch records found for this keyword.');
        return;
      }

      const fetchRecord = fetchData[0];
      
      // Check if it's already completed
      if (parseInt(fetchRecord.items_count) > 0) {
        alert('This fetch is already completed and has results.');
        return;
      }

      // Check if it has a pending task_id
      if (!fetchRecord.api_response_json?.task_id) {
        alert('No pending DataForSEO task found for this fetch.');
        return;
      }

      // Attempt to complete it
      const completeResponse = await fetch('/api/f400-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fetch_id: fetchRecord.fetch_id,
        }),
      });

      const completeResult = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(completeResult.error || 'Failed to complete pending fetch');
      }

      if (completeResult.success) {
        alert(`🎉 Success! Completed pending fetch for "${keywordData?.keyword_datum}"\n\nResults stored: ${completeResult.organic_results_stored || 0}\n\nPlease refresh the page to see the results.`);
      } else {
        alert(`Unable to complete: ${completeResult.message || 'Results may not be ready yet'}`);
      }

    } catch (error) {
      console.error('Complete pending fetch error:', error);
      alert(`Failed to complete pending fetch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCompleteLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">🎯 SERP Results</h1>
            <ZhedoriButtonBar />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Search Engine Results</div>
            <div className="text-xs text-gray-400">Project: DataForSEO Integration</div>
          </div>
        </div>
        
        {/* New section below SERP Results heading */}
        <div className="mt-4 flex items-start space-x-6">
          <div className="font-bold text-gray-800" style={{ fontSize: '20px' }}>
            {keywordId ? (
              <span>
                keywordshub.keyword_id: <span className="text-blue-600">{keywordId}</span>
                {keywordData && (
                  <span className="ml-4 font-normal text-gray-600">
                    "{keywordData.keyword_datum}"
                  </span>
                )}
              </span>
            ) : (
              <span className="text-gray-400">No keyword_id specified</span>
            )}
          </div>
          
          {/* UI Table */}
          <table className="border-collapse" style={{ border: '1px solid #4a5568' }}>
            <thead>
              <tr className="bg-gray-200">
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>1</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>2</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>3</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>4</th>
                <th className="font-bold px-4 py-2" style={{ border: '1px solid #4a5568' }}>5</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
                <td className="px-4 py-2" style={{ border: '1px solid #4a5568' }}></td>
              </tr>
            </tbody>
          </table>
          
          {/* F400 SERP Fetch Button */}
          <button
            onClick={() => keywordId && handleF400SerpFetch()}
            disabled={!keywordId || f400Loading}
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
              !keywordId || f400Loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {f400Loading ? 'Processing...' : 'Run F400 ZHE SERP Fetch'}
          </button>

          {/* Complete Pending Fetches Button */}
          <button
            onClick={() => keywordId && handleCompletePendingFetches()}
            disabled={!keywordId || completeLoading}
            className={`ml-3 px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
              !keywordId || completeLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
          >
            {completeLoading ? 'Checking...' : 'Complete Pending Fetch'}
          </button>
        </div>
      </div>

      {/* Main Content - Full Width SerpResultsTable */}
      <div className="flex-1 overflow-hidden">
        <SerpResultsTable key={keywordId} keywordId={keywordId} keywordData={keywordData} />
      </div>

      {/* First Warning Modal */}
      {showFirstWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">⚠️ Significant Function Warning</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  You are about to run the <strong>F400 ZHE SERP Fetch</strong> function, which is a significant operation that will:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Make API calls to DataForSEO using your credentials</li>
                  <li>Consume API credits from your DataForSEO account</li>
                  <li>Fetch fresh SERP data for this keyword</li>
                  <li>Process and store results in the database</li>
                </ul>
                <p className="text-gray-700 mt-4 font-medium">
                  This operation cannot be undone and will use your API credits.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleWarningCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFirstWarningConfirm}
                  className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-md transition-colors"
                >
                  I Understand, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Second Warning Modal */}
      {showSecondWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">🚨 Final Confirmation</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  <strong>Last chance to cancel!</strong> This action will immediately begin the SERP fetch process.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 font-medium mb-2">This will:</p>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>Charge your DataForSEO account</li>
                    <li>Take 30-60 seconds to complete</li>
                    <li>Cannot be stopped once started</li>
                  </ul>
                </div>
                <p className="text-gray-700 font-medium">
                  Keyword: <span className="text-blue-600">{keywordData?.keyword_datum}</span>
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleWarningCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSecondWarningConfirm}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors font-medium"
                >
                  Yes, Run F400 Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}