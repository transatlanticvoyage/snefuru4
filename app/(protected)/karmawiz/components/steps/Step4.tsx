'use client';

import { useState } from 'react';

interface Step4Props {
  session: any;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onStepComplete: (stepNumber: number) => void;
  onNavigateToStep: (stepNumber: number) => void;
}

export default function Step4({ 
  session, 
  isProcessing, 
  setIsProcessing, 
  onStepComplete 
}: Step4Props) {
  const [updateStatus, setUpdateStatus] = useState([
    { 
      id: 1, 
      type: 'Featured Image', 
      status: 'pending', 
      description: 'Set main generated image as featured image',
      completed: false
    },
    { 
      id: 2, 
      type: 'Content Images', 
      status: 'pending', 
      description: 'Insert images into content body at optimal positions',
      completed: false
    },
    { 
      id: 3, 
      type: 'Alt Text', 
      status: 'pending', 
      description: 'Add SEO-optimized alt text to all images',
      completed: false
    },
    { 
      id: 4, 
      type: 'Cache Update', 
      status: 'pending', 
      description: 'Clear WordPress cache and update page',
      completed: false
    }
  ]);

  const [finalResults, setFinalResults] = useState({
    pageUrl: null,
    imagesAdded: 0,
    contentUpdated: false,
    cacheCleared: false
  });

  const handleUpdateContent = async () => {
    setIsProcessing(true);
    
    // Simulate updating each component
    for (let i = 0; i < updateStatus.length; i++) {
      setUpdateStatus(prev => prev.map(item => 
        item.id === i + 1 
          ? { ...item, status: 'updating' }
          : item
      ));

      // Simulate update delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUpdateStatus(prev => prev.map(item => 
        item.id === i + 1 
          ? { ...item, status: 'completed', completed: true }
          : item
      ));
    }

    // Set final results
    setFinalResults({
      pageUrl: `https://${session.cached_gcon_data?.asn_sitespren_base || 'example.com'}/sample-page/`,
      imagesAdded: 3,
      contentUpdated: true,
      cacheCleared: true
    });

    setIsProcessing(false);
  };

  const handleCompleteStep = () => {
    const allCompleted = updateStatus.every(item => item.completed);
    if (allCompleted) {
      onStepComplete(4);
    }
  };

  const allUpdatesComplete = updateStatus.every(item => item.completed);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Step 4: Update Content
        </h2>
        <p className="text-gray-600">
          Integrate the uploaded images into your content and finalize the page updates.
        </p>
      </div>

      {/* Content Context */}
      {session.cached_gcon_data && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Updating content:</strong> {session.cached_gcon_data.meta_title || session.cached_gcon_data.h1title || 'Untitled Content'}
                <br />
                <strong>Target site:</strong> {session.cached_gcon_data.asn_sitespren_base || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Update Progress</h3>
        
        <div className="space-y-4">
          {updateStatus.map((update, index) => (
            <div key={update.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${update.status === 'pending' ? 'bg-gray-100' : 
                      update.status === 'updating' ? 'bg-blue-100' : 
                      update.status === 'completed' ? 'bg-green-100' : 
                      'bg-red-100'}
                  `}>
                    {update.status === 'updating' ? (
                      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : update.status === 'completed' ? (
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">{update.type}</p>
                    <p className="text-sm text-gray-600">{update.description}</p>
                    {update.status === 'updating' && (
                      <p className="text-xs text-blue-600 mt-1">Processing...</p>
                    )}
                    {update.status === 'completed' && (
                      <p className="text-xs text-green-600 mt-1">✓ Complete</p>
                    )}
                  </div>
                </div>
                
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0
                  ${update.status === 'pending' ? 'bg-gray-100 text-gray-800' : 
                    update.status === 'updating' ? 'bg-blue-100 text-blue-800' : 
                    update.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'}
                `}>
                  {update.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!allUpdatesComplete && (
          <div className="text-center mt-6">
            <button
              onClick={handleUpdateContent}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Updating Content...' : 'Update Page Content'}
            </button>
          </div>
        )}
      </div>

      {/* Final Results */}
      {allUpdatesComplete && (
        <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-green-800">
                Content Update Complete! 🎉
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your content has been successfully enhanced with AI-generated images.</p>
              </div>
              <div className="mt-4 bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Images Added:</span>
                    <span className="ml-2 font-medium">{finalResults.imagesAdded}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Content Updated:</span>
                    <span className="ml-2 font-medium">{finalResults.contentUpdated ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cache Cleared:</span>
                    <span className="ml-2 font-medium">{finalResults.cacheCleared ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Page URL:</span>
                    {finalResults.pageUrl && (
                      <a 
                        href={finalResults.pageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        View Updated Page →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Update Configuration</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Image Placement:</strong> Strategic content insertion + featured image</p>
          <p><strong>SEO Optimization:</strong> Alt text, captions, and structured data</p>
          <p><strong>Performance:</strong> Image compression and lazy loading</p>
          <p><strong>Cache Management:</strong> Automatic cache clearing</p>
        </div>
      </div>

      {allUpdatesComplete && (
        <div className="text-center pt-6 border-t">
          <div className="space-y-4">
            <button
              onClick={handleCompleteStep}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 mr-4"
            >
              Complete Karma Wizard Session ✓
            </button>
            <div className="text-sm text-gray-600">
              <a href="/karmajar" className="text-blue-600 hover:text-blue-800">
                ← Return to Karmajar to view all sessions
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}