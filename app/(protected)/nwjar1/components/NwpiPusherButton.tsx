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

      const result = await response.json();
      setPushResult(result);
      setShowResultModal(true);

    } catch (error) {
      setPushResult({
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Push Operation Results
            </h3>
            
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
                      You can view them on the <a href="/pedazos1" className="underline font-medium">pedazos1 page</a>.
                    </p>
                  </div>
                )}
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