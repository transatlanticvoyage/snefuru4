'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface GconPiece {
  id: string;
  fk_users_id: string;
  meta_title: string | null;
  h1title: string | null;
  pgb_h1title: string | null;
  corpus1: string | null;
  corpus2: string | null;
  asn_sitespren_base: string | null;
  asn_nwpi_posts_id: string | null;
  asn_imgplanbatch_id: string | null;
  image_pack1: any;
  pelementor_cached: any;
  pelementor_edits: any;
  pub_status: string | null;
  date_time_pub_carry: string | null;
  pageslug: string | null;
  pageurl: string | null;
  g_post_id: string | null;
  g_post_status: string | null;
  g_post_type: string | null;
  response1_model_used: string | null;
  response1_raw: string | null;
  response1_meat_extracted: string | null;
  created_at: string;
  updated_at: string;
}

export default function TorlidPage() {
  const [gconPiece, setGconPiece] = useState<GconPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('talk1');

  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pieceId = searchParams?.get('id');
  const mtab = searchParams?.get('mtab');

  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = '/torlid - Snefuru';
  }, []);

  useEffect(() => {
    // Set active tab from URL parameter
    if (mtab) {
      setActiveTab(mtab);
    }
  }, [mtab]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user's internal ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          setError('User not found');
          return;
        }

        setUserInternalId(userData.id);

        // If no piece ID provided, redirect to gconjar1
        if (!pieceId) {
          router.push('/gconjar1');
          return;
        }

        // Fetch the specific gcon_piece
        const { data: pieceData, error: pieceError } = await supabase
          .from('gcon_pieces')
          .select('*')
          .eq('id', pieceId)
          .eq('fk_users_id', userData.id)
          .single();

        if (pieceError || !pieceData) {
          setError('Content piece not found or access denied');
          return;
        }

        setGconPiece(pieceData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while loading the page');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, pieceId, router, supabase]);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    // Update URL parameter
    const params = new URLSearchParams(window.location.search);
    params.set('mtab', tabName);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading Elementor simulator...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Link 
          href="/gconjar1" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          ← Back to Content List
        </Link>
      </div>
    );
  }

  if (!gconPiece || !userInternalId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">No content piece found.</p>
          <Link 
            href="/gconjar1" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ← Back to Content List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link 
              href="/gconjar1" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Content List
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href={`/pedbar?id=${gconPiece.id}`}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Full Editor (pedbar)
            </Link>
            <div className="text-sm text-gray-500">
              db table: gcon_pieces
            </div>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Elementor Data Editor</h1>
          <p className="mt-2 text-gray-600">
            Edit Elementor content for: <span className="font-medium">{gconPiece.meta_title || 'Untitled'}</span>
          </p>
          {gconPiece.asn_sitespren_base && (
            <p className="mt-1 text-sm text-gray-500">
              Site: {gconPiece.asn_sitespren_base}
            </p>
          )}
          <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
            <span>pageurl:</span>
            {gconPiece.pageurl && (
              <>
                <button
                  onClick={() => gconPiece.pageurl && window.open(gconPiece.pageurl, '_blank')}
                  className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                  title="Open URL in new tab"
                >
                  Open
                </button>
                <button
                  onClick={() => gconPiece.pageurl && navigator.clipboard.writeText(gconPiece.pageurl)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  title="Copy URL to clipboard"
                >
                  Copy
                </button>
                <span className="text-blue-600 font-mono text-xs">
                  {gconPiece.pageurl}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['talk1', 'talk2', 'talk3', 'talk4'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Elementor Simulator Editor */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Elementor Page Simulator</h2>
          <p className="text-sm text-gray-600 mt-1">
            Edit content focusing on pelementor_cached and pelementor_edits fields
          </p>
        </div>
        
        <div className="p-6">
          {/* Editor Area */}
          <div className="space-y-6">
            {/* Cached Data Section */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">
                pelementor_cached (Original Elementor Data)
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {gconPiece.pelementor_cached 
                    ? JSON.stringify(gconPiece.pelementor_cached, null, 2)
                    : 'No cached Elementor data available'
                  }
                </pre>
              </div>
            </div>

            {/* Edits Section */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">
                pelementor_edits (Your Modifications)
              </h3>
              <div className="space-y-4">
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Edit your Elementor content modifications here..."
                  defaultValue={gconPiece.pelementor_edits 
                    ? JSON.stringify(gconPiece.pelementor_edits, null, 2)
                    : ''
                  }
                />
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
                      Save Changes
                    </button>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
                      Preview Changes
                    </button>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors">
                      Submit to Site
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date(gconPiece.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Editor Preview (Placeholder) */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Visual Page Preview
              </h3>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Elementor Visual Editor</h4>
                <p className="text-gray-600 mb-4">
                  Interactive visual editor for text and image modifications will be implemented here.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Text editing with live preview</p>
                  <p>• Image replacement and editing</p>
                  <p>• Element positioning and styling</p>
                  <p>• Real-time content updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}