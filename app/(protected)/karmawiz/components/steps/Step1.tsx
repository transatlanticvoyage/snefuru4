'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Step1Props {
  session: any;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onStepComplete: (stepNumber: number) => void;
  onNavigateToStep: (stepNumber: number) => void;
}

interface GconPiece {
  id: string;
  meta_title: string | null;
  h1title: string | null;
  corpus1: string | null;
  corpus2: string | null;
  asn_sitespren_base: string | null;
  pub_status: string | null;
  created_at: string;
  updated_at: string;
}

export default function Step1({ 
  session, 
  isProcessing, 
  setIsProcessing, 
  onStepComplete 
}: Step1Props) {
  const [gconData, setGconData] = useState<GconPiece | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const supabase = createClientComponentClient();

  // Check if we already have cached data
  useEffect(() => {
    if (session.cached_gcon_data && Object.keys(session.cached_gcon_data).length > 0) {
      setGconData(session.cached_gcon_data);
      setAnalysisComplete(true);
    }
  }, [session]);

  const fetchGconPieceData = async () => {
    setLoading(true);
    setError(null);
    setIsProcessing(true);

    try {
      // Fetch the gcon_piece data
      const { data: gconPieceData, error: gconError } = await supabase
        .from('gcon_pieces')
        .select('*')
        .eq('id', session.rel_gcon_piece_id)
        .single();

      if (gconError) {
        throw new Error(`Failed to fetch gcon_piece: ${gconError.message}`);
      }

      setGconData(gconPieceData);

      // Cache the data in the session
      const { error: updateError } = await supabase
        .from('karma_wizard_sessions')
        .update({
          cached_gcon_data: gconPieceData,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('session_id', session.session_id);

      if (updateError) {
        console.error('Error caching gcon data:', updateError);
        // Don't throw here, as the main operation succeeded
      }

      setAnalysisComplete(true);

    } catch (error) {
      console.error('Error fetching gcon piece:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch content data');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleCompleteStep = () => {
    if (analysisComplete && gconData) {
      onStepComplete(1);
    }
  };

  const renderContentAnalysis = () => {
    if (!gconData) return null;

    const wordCount = (gconData.corpus1?.length || 0) + (gconData.corpus2?.length || 0);
    const hasTitle = !!(gconData.meta_title || gconData.h1title);
    const hasContent = !!(gconData.corpus1 || gconData.corpus2);

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Content analysis completed successfully!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Content Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{gconData.pub_status || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Has Title:</span>
                <span className={hasTitle ? 'text-green-600' : 'text-red-600'}>
                  {hasTitle ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Has Content:</span>
                <span className={hasContent ? 'text-green-600' : 'text-red-600'}>
                  {hasContent ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Word Count:</span>
                <span className="font-medium">{wordCount.toLocaleString()} chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Site Base:</span>
                <span className="font-medium">{gconData.asn_sitespren_base || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Ready for Images?</h3>
            <div className="space-y-2 text-sm">
              {hasTitle && (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Title available for context
                </div>
              )}
              {hasContent && (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Content available for analysis
                </div>
              )}
              {gconData.asn_sitespren_base && (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Site identified for upload
                </div>
              )}
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-blue-700 text-sm">
                  Content is ready for image generation. Click "Complete Step 1" to proceed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Content Preview</h3>
          <div className="space-y-4 text-sm">
            {(gconData.meta_title || gconData.h1title) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">TITLE</label>
                <p className="text-gray-900">{gconData.meta_title || gconData.h1title}</p>
              </div>
            )}
            {gconData.corpus1 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CONTENT 1 (First 200 chars)</label>
                <p className="text-gray-700 line-clamp-3">
                  {gconData.corpus1.substring(0, 200)}
                  {gconData.corpus1.length > 200 && '...'}
                </p>
              </div>
            )}
            {gconData.corpus2 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CONTENT 2 (First 200 chars)</label>
                <p className="text-gray-700 line-clamp-3">
                  {gconData.corpus2.substring(0, 200)}
                  {gconData.corpus2.length > 200 && '...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Step 1: Analyze Content
        </h2>
        <p className="text-gray-600">
          Let's fetch and analyze the content from your selected gcon_piece to understand what we're working with.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!analysisComplete && !loading && (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze Content</h3>
            <p className="text-gray-600 mb-6">
              Click the button below to fetch and analyze the content from gcon_piece: 
              <br />
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{session.rel_gcon_piece_id}</code>
            </p>
            <button
              onClick={fetchGconPieceData}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Content
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Analyzing content...</span>
          </div>
        </div>
      )}

      {analysisComplete && gconData && renderContentAnalysis()}

      {analysisComplete && (
        <div className="text-center pt-6 border-t">
          <button
            onClick={handleCompleteStep}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Complete Step 1 - Proceed to Image Generation →
          </button>
        </div>
      )}
    </div>
  );
}