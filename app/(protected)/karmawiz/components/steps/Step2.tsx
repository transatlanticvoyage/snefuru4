'use client';

import { useState } from 'react';

interface Step2Props {
  session: any;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onStepComplete: (stepNumber: number) => void;
  onNavigateToStep: (stepNumber: number) => void;
}

export default function Step2({ 
  session, 
  isProcessing, 
  setIsProcessing, 
  onStepComplete 
}: Step2Props) {
  const [imageRequests, setImageRequests] = useState([
    { id: 1, prompt: '', status: 'pending', url: null },
    { id: 2, prompt: '', status: 'pending', url: null },
    { id: 3, prompt: '', status: 'pending', url: null }
  ]);

  const handleGenerateImages = async () => {
    setIsProcessing(true);
    
    // TODO: Implement actual image generation via API
    // This is a placeholder for the actual implementation
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful generation
    const mockUrls = [
      'https://via.placeholder.com/400x300/0066CC/FFFFFF?text=Generated+Image+1',
      'https://via.placeholder.com/400x300/00AA44/FFFFFF?text=Generated+Image+2', 
      'https://via.placeholder.com/400x300/DD6600/FFFFFF?text=Generated+Image+3'
    ];

    setImageRequests(prev => prev.map((req, index) => ({
      ...req,
      status: 'completed',
      url: mockUrls[index] || null,
      prompt: `Generated prompt ${index + 1} based on content analysis`
    })));

    setIsProcessing(false);
  };

  const handleCompleteStep = () => {
    const allCompleted = imageRequests.every(req => req.status === 'completed');
    if (allCompleted) {
      onStepComplete(2);
    }
  };

  const allImagesGenerated = imageRequests.every(req => req.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Step 2: Generate Images
        </h2>
        <p className="text-gray-600">
          Generate AI images using your configured API keys based on the analyzed content.
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
                <strong>Using content context:</strong> {session.cached_gcon_data.meta_title || session.cached_gcon_data.h1title || 'Untitled Content'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Generation Interface */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Image Generation Queue</h3>
        
        <div className="space-y-4">
          {imageRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium">Image {request.id}</span>
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${request.status === 'pending' ? 'bg-gray-100 text-gray-800' : 
                        request.status === 'generating' ? 'bg-yellow-100 text-yellow-800' : 
                        request.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}
                    `}>
                      {request.status}
                    </span>
                  </div>
                  
                  {request.prompt && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Prompt:</strong> {request.prompt}
                    </p>
                  )}
                  
                  {request.status === 'generating' && (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">Generating image...</span>
                    </div>
                  )}
                </div>
                
                {request.url && (
                  <div className="ml-4">
                    <img 
                      src={request.url} 
                      alt={`Generated image ${request.id}`}
                      className="w-24 h-18 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!allImagesGenerated && (
          <div className="text-center mt-6">
            <button
              onClick={handleGenerateImages}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Images...
                </span>
              ) : (
                'Generate AI Images'
              )}
            </button>
          </div>
        )}

        {allImagesGenerated && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  All images generated successfully! Ready to upload to WordPress.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Settings Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">AI Image Generation Settings</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Provider:</strong> Using configured API keys</p>
          <p><strong>Quality:</strong> High resolution (1024x1024)</p>
          <p><strong>Style:</strong> Based on content analysis</p>
          <p><strong>Count:</strong> {imageRequests.length} images per session</p>
        </div>
      </div>

      {allImagesGenerated && (
        <div className="text-center pt-6 border-t">
          <button
            onClick={handleCompleteStep}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Complete Step 2 - Proceed to WordPress Upload →
          </button>
        </div>
      )}
    </div>
  );
}