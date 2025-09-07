'use client';

import { useState } from 'react';

interface Step1Props {
  session: any;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onStepComplete: (stepNumber: number) => void;
  onNavigateToStep: (stepNumber: number) => void;
}

export default function Step1({ 
  session, 
  isProcessing, 
  setIsProcessing, 
  onStepComplete 
}: Step1Props) {
  const [sessionConfirmed, setSessionConfirmed] = useState(false);

  const handleConfirmSession = () => {
    setSessionConfirmed(true);
  };

  const handleCompleteStep = () => {
    if (sessionConfirmed) {
      onStepComplete(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Step 1: Designate Basic Session Info
        </h2>
        <p className="text-gray-600">
          Review and confirm your Karma Wizard session details before proceeding to content analysis.
        </p>
      </div>

      {/* Session Details */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                {session.session_id}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {session.session_name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Status</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {session.session_status}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {session.rel_gcon_piece_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gcon Piece ID</label>
                <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded font-mono">
                  {session.rel_gcon_piece_id}
                </p>
              </div>
            )}

            {session.janky_rel_sitespren_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitespren ID</label>
                <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded font-mono">
                  {session.janky_rel_sitespren_id}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Steps Planned</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {session.total_steps_planned}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {new Date(session.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Source Verification */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Content Source:</strong> This session will work with{' '}
              {session.rel_gcon_piece_id ? 'the selected gcon piece' : 'the specified sitespren'}.
              The wizard will fetch content data, generate images, and update your WordPress site.
            </p>
          </div>
        </div>
      </div>

      {/* Session Steps Overview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Wizard Process Overview</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-medium mr-3">1</div>
            <span><strong>Step 1:</strong> Designate Basic Session Info (Current Step)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">2</div>
            <span><strong>Step 2:</strong> Fetch and analyze existing content</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">3</div>
            <span><strong>Step 3:</strong> Generate AI images via API</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">4</div>
            <span><strong>Step 4:</strong> Upload images to WordPress</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-3">5</div>
            <span><strong>Step 5:</strong> Update content with image references</span>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      {!sessionConfirmed && (
        <div className="text-center py-4">
          <p className="text-gray-600 mb-4">
            Please review the session details above and confirm you're ready to proceed.
          </p>
          <button
            onClick={handleConfirmSession}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Session Details
          </button>
        </div>
      )}

      {sessionConfirmed && (
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Session details confirmed! Ready to proceed to content analysis.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-6 border-t">
            <button
              onClick={handleCompleteStep}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Complete Step 1 - Proceed to Content Analysis →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}