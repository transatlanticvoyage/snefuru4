'use client';

import { useState } from 'react';

interface LandingPageProps {
  onCreateSession: (gconPieceId: string, sessionName?: string) => void;
  loading: boolean;
}

export default function LandingPage({ onCreateSession, loading }: LandingPageProps) {
  const [gconPieceId, setGconPieceId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gconPieceId.trim()) {
      alert('Please enter a gcon piece ID');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateSession(
        gconPieceId.trim(), 
        sessionName.trim() || 'New Karma Wizard Session'
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || isCreating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">
          {isCreating ? 'Creating session...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Karma Wizard
              </h1>
              <p className="text-gray-600">
                Enhance your content with AI-generated images and automated WordPress integration
              </p>
            </div>

            <div className="mb-8">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>How it works:</strong> Enter the ID of a content piece (gcon_pieces) that you want to enhance with images. 
                      The wizard will guide you through fetching page info, generating images, and updating your WordPress site.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  htmlFor="gconPieceId" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Gcon Piece ID *
                </label>
                <input
                  type="text"
                  id="gconPieceId"
                  value={gconPieceId}
                  onChange={(e) => setGconPieceId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the UUID of the content piece to enhance"
                  disabled={isCreating}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  This should be a UUID from the gcon_pieces table representing the content you want to work on.
                </p>
              </div>

              <div>
                <label 
                  htmlFor="sessionName" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Session Name (Optional)
                </label>
                <input
                  type="text"
                  id="sessionName"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Give your wizard session a descriptive name"
                  disabled={isCreating}
                />
                <p className="mt-1 text-sm text-gray-500">
                  If left blank, will default to "New Karma Wizard Session"
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isCreating || !gconPieceId.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Session...
                    </span>
                  ) : (
                    'Create New Karma Wizard Session'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What happens next?</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 1</span>
                    <span>Fetch and analyze existing content</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 2</span>
                    <span>Generate AI images via API</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 3</span>
                    <span>Upload images to WordPress</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Step 4</span>
                    <span>Update content with image references</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a 
                href="/karmajar" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                → View existing sessions in Karmajar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}