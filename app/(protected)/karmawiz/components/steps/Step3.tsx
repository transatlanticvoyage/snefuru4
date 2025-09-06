'use client';

import { useState } from 'react';

interface Step3Props {
  session: any;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onStepComplete: (stepNumber: number) => void;
  onNavigateToStep: (stepNumber: number) => void;
}

export default function Step3({ 
  session, 
  isProcessing, 
  setIsProcessing, 
  onStepComplete 
}: Step3Props) {
  const [uploadStatus, setUploadStatus] = useState([
    { id: 1, filename: 'generated-image-1.jpg', status: 'pending', wpId: null },
    { id: 2, filename: 'generated-image-2.jpg', status: 'pending', wpId: null },
    { id: 3, filename: 'generated-image-3.jpg', status: 'pending', wpId: null }
  ]);

  const [wpConnection, setWpConnection] = useState({
    status: 'checking',
    siteUrl: session.cached_gcon_data?.asn_sitespren_base || 'N/A',
    connected: false,
    error: null
  });

  const handleUploadImages = async () => {
    setIsProcessing(true);
    
    // Simulate connection check
    setWpConnection(prev => ({ ...prev, status: 'connecting' }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setWpConnection(prev => ({ ...prev, status: 'connected', connected: true }));

    // Simulate uploading each image
    for (let i = 0; i < uploadStatus.length; i++) {
      setUploadStatus(prev => prev.map(item => 
        item.id === i + 1 
          ? { ...item, status: 'uploading' }
          : item
      ));

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setUploadStatus(prev => prev.map(item => 
        item.id === i + 1 
          ? { ...item, status: 'completed', wpId: Math.floor(Math.random() * 10000) + 1000 }
          : item
      ));
    }

    setIsProcessing(false);
  };

  const handleCompleteStep = () => {
    const allUploaded = uploadStatus.every(item => item.status === 'completed');
    if (allUploaded) {
      onStepComplete(3);
    }
  };

  const allImagesUploaded = uploadStatus.every(item => item.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Step 3: Upload to WordPress
        </h2>
        <p className="text-gray-600">
          Upload the generated images to your WordPress media library.
        </p>
      </div>

      {/* WordPress Connection Status */}
      <div className={`
        border-l-4 p-4
        ${wpConnection.connected 
          ? 'bg-green-50 border-green-400' 
          : wpConnection.error 
          ? 'bg-red-50 border-red-400' 
          : 'bg-blue-50 border-blue-400'
        }
      `}>
        <div className="flex">
          <div className="flex-shrink-0">
            {wpConnection.connected ? (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : wpConnection.error ? (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm ${
              wpConnection.connected 
                ? 'text-green-700' 
                : wpConnection.error 
                ? 'text-red-700' 
                : 'text-blue-700'
            }`}>
              <strong>WordPress Site:</strong> {wpConnection.siteUrl}
              <br />
              <strong>Status:</strong> {wpConnection.status}
              {wpConnection.connected && ' ✓'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Image Upload Progress</h3>
        
        <div className="space-y-4">
          {uploadStatus.map((upload) => (
            <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${upload.status === 'pending' ? 'bg-gray-100' : 
                      upload.status === 'uploading' ? 'bg-blue-100' : 
                      upload.status === 'completed' ? 'bg-green-100' : 
                      'bg-red-100'}
                  `}>
                    {upload.status === 'uploading' ? (
                      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : upload.status === 'completed' ? (
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">{upload.filename}</p>
                    <p className="text-xs text-gray-500">
                      {upload.status === 'pending' && 'Waiting to upload'}
                      {upload.status === 'uploading' && 'Uploading to WordPress...'}
                      {upload.status === 'completed' && `Uploaded (WP ID: ${upload.wpId})`}
                    </p>
                  </div>
                </div>
                
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${upload.status === 'pending' ? 'bg-gray-100 text-gray-800' : 
                    upload.status === 'uploading' ? 'bg-blue-100 text-blue-800' : 
                    upload.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'}
                `}>
                  {upload.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!allImagesUploaded && (
          <div className="text-center mt-6">
            <button
              onClick={handleUploadImages}
              disabled={isProcessing || !wpConnection.connected}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Uploading Images...' : 'Upload Images to WordPress'}
            </button>
          </div>
        )}

        {allImagesUploaded && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  All images uploaded successfully to WordPress media library!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Upload Settings</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Target Site:</strong> {wpConnection.siteUrl}</p>
          <p><strong>Upload Location:</strong> WordPress Media Library</p>
          <p><strong>File Format:</strong> JPEG (optimized)</p>
          <p><strong>Alt Text:</strong> Auto-generated from content context</p>
        </div>
      </div>

      {allImagesUploaded && (
        <div className="text-center pt-6 border-t">
          <button
            onClick={handleCompleteStep}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Complete Step 3 - Proceed to Content Update →
          </button>
        </div>
      )}
    </div>
  );
}