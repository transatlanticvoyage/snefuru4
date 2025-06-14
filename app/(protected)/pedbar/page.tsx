'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import GconPieceEditor from './components/GconPieceEditor';
import Link from 'next/link';

interface GconPiece {
  id: string;
  fk_users_id: string;
  meta_title: string | null;
  h1title: string | null;
  pgb_h1title: string | null;
  corpus1: string | null;
  corpus2: string | null;
  asn_sitespren: string | null;
  asn_page_intended: string | null;
  image_pack1: any;
  created_at: string;
  updated_at: string;
}

export default function PedbarPage() {
  const [gconPiece, setGconPiece] = useState<GconPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams?.get('id') || null;

  useEffect(() => {
    document.title = 'Edit Content Piece - Snefuru';
  }, []);

  useEffect(() => {
    const fetchGconPiece = async () => {
      if (!user?.id || !id) {
        setLoading(false);
        if (!id) {
          setError('No content piece ID provided');
        }
        return;
      }

      try {
        // First get the internal user ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        setUserInternalId(userData.id);

        // Fetch the specific gcon_piece
        const { data: gconPiece, error } = await supabase
          .from('gcon_pieces')
          .select('*')
          .eq('id', id)
          .eq('fk_users_id', userData.id) // Security: only allow user's own pieces
          .single();

        if (error) {
          console.error('Error fetching gcon_piece:', error);
          if (error.code === 'PGRST116') {
            setError('Content piece not found or access denied');
          } else {
            setError('Error loading content piece');
          }
        } else {
          setGconPiece(gconPiece);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGconPiece();
  }, [user?.id, id, supabase]);

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Please sign in to edit content pieces.</p>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Request</h1>
          <p className="mb-4">No content piece ID provided.</p>
          <Link 
            href="/pedazos1"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Content Pieces
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Loading content piece...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="mb-4 text-red-600">{error}</p>
          <Link 
            href="/pedazos1"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Content Pieces
          </Link>
        </div>
      </div>
    );
  }

  if (!gconPiece) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Not Found</h1>
          <p className="mb-4">Content piece not found.</p>
          <Link 
            href="/pedazos1"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Content Pieces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Edit Content Piece</h1>
          <Link 
            href="/pedazos1"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Back to List
          </Link>
        </div>
        <div className="text-sm text-gray-600">
          <p><strong>ID:</strong> {gconPiece.id}</p>
          <p><strong>Created:</strong> {new Date(gconPiece.created_at).toLocaleString()}</p>
          <p><strong>Updated:</strong> {new Date(gconPiece.updated_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Editor */}
      <GconPieceEditor 
        gconPiece={gconPiece}
        userInternalId={userInternalId!}
        onUpdate={(updatedPiece) => setGconPiece(updatedPiece)}
      />
    </div>
  );
}