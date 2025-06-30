'use client';

import { useState } from 'react';

interface NwpiPusherButtonProps {
  data: any[];
  userId: string;
}

interface PushResult {
  success: boolean;
  message: string;
  results?: {
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  };
}

export default function NwpiPusherButton({ data }: NwpiPusherButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);

  const handlePushClick = () => {
    if (data.length === 0) {
      alert('No content available to push');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmPush = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pushAll: true,
          recordIds: []
        })
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Get response text first to check if it's empty
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        const debugInfo = {
          jsonError: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
          responseStatus: response.status,
          responseText: responseText.substring(0, 500)
        };
        console.error('JSON parsing error:', debugInfo);
        throw new Error(`Invalid JSON response from server.\n\nDebug Info:\n- Status: ${response.status}\n- JSON Error: ${debugInfo.jsonError}\n- Response: "${responseText.substring(0, 200)}..."`);
      }

      // Add debug info to the result for display in UI
      const resultWithDebug = {
        ...result,
        _debugInfo: {
          responseStatus: response.status,
          responseSize: responseText.length,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('🔍 F22 API Response:', resultWithDebug);
      setPushResult(resultWithDebug);
      setShowResultModal(true);

    } catch (error) {
      console.error('F22 Push Error:', error);
      setPushResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setShowResultModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPush = () => {
    setShowConfirmModal(false);
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    setPushResult(null);
  };

  return (
    <>
      {/* Main Button */}
      <button
        onClick={handlePushClick}
        disabled={isLoading || data.length === 0}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium rounded-md transition-colors whitespace-nowrap text-sm"
      >
        {isLoading ? 'Processing...' : 'f22_nwpi_to_gcon_pusher'}
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Push Operation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to push all {data.length} records from nwpi_content to gcon_pieces? 
              This operation will create new content pieces for each WordPress post/page.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleConfirmPush}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
              >
                Yes, Push All Records
              </button>
              <button
                onClick={handleCancelPush}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && pushResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                f22 Push Operation Results
              </h3>
              <button
                onClick={() => {
                  const reportData = {
                    timestamp: new Date().toISOString(),
                    success: pushResult.success,
                    message: pushResult.message,
                    results: pushResult.results,
                    debugInfo: (pushResult as any)._debugInfo,
                    fullResponse: pushResult
                  };
                  navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
                  alert('Full error report copied to clipboard!');
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                📋 Copy Full Report
              </button>
            </div>
            
            <div className={`p-4 rounded-md mb-4 ${
              pushResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-medium">{pushResult.message}</p>
            </div>

            {pushResult.results && (
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{pushResult.results.processed}</div>
                    <div className="text-sm text-blue-600">Processed</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{pushResult.results.succeeded}</div>
                    <div className="text-sm text-green-600">Succeeded</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{pushResult.results.failed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>

                {/* Errors */}
                {pushResult.results.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Errors and Warnings:</h4>
                    <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                      <ul className="text-sm text-gray-700 space-y-1">
                        {pushResult.results.errors.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Success message */}
                {pushResult.results.succeeded > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-700">
                      ✅ Successfully pushed {pushResult.results.succeeded} records to gcon_pieces. 
                      You can view them on the <a href="/gconjar1" className="underline font-medium">gconjar1 page</a>.
                    </p>
                  </div>
                )}

                {/* Debug Info */}
                {(pushResult as any)._debugInfo && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Debug Information:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Response Status: {(pushResult as any)._debugInfo.responseStatus}</div>
                      <div>Response Size: {(pushResult as any)._debugInfo.responseSize} bytes</div>
                      <div>Timestamp: {(pushResult as any)._debugInfo.timestamp}</div>
                    </div>
                  </div>
                )}

                {/* Detailed Error Information */}
                {!pushResult.success && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h4 className="font-medium text-red-900 mb-3">🔍 Detailed Error Analysis:</h4>
                    <div className="space-y-3 text-sm text-red-800">
                      <div>
                        <strong>Error Type:</strong> f22_nwpi_to_gcon_pusher API failure
                      </div>
                      <div>
                        <strong>Primary Message:</strong> {pushResult.message}
                      </div>
                      {pushResult.results?.errors && (
                        <div>
                          <strong>API Errors ({pushResult.results.errors.length}):</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {pushResult.results.errors.map((error, index) => (
                              <li key={index} className="text-xs">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <strong>Console Logs:</strong> Check browser console (F12) for detailed debug messages starting with 🔍 DEBUG
                      </div>
                      <div>
                        <strong>Next Steps:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                          <li>Copy this report using the button above</li>
                          <li>Check browser console for 🔍 DEBUG messages</li>
                          <li>Look for specific mud_title and mud_content debug logs</li>
                          <li>Share this report for further analysis</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Response Data */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Raw API Response:</h4>
                  <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {JSON.stringify(pushResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseResult}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}