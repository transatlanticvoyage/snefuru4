'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import ElementorEditor from './components/ElementorEditor';
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
  created_at: string;
  updated_at: string;
}

export default function Pedtor1Page() {
  const [gconPiece, setGconPiece] = useState<GconPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);

  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pieceId = searchParams?.get('id');

  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = '/pedtor1 - Snefuru';
  }, []);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading Elementor editor...</span>
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
        </div>
      </div>

      {/* Editor */}
      <ElementorEditor 
        gconPiece={gconPiece}
        userInternalId={userInternalId}
        onUpdate={(updatedPiece) => setGconPiece(updatedPiece)}
      />
    </div>
  );
}