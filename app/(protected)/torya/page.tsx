'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WaterTable from './components/WaterTable';

export default function ToryaPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gconPieceId, setGconPieceId] = useState<string | null>(null);
  const [gconPiece, setGconPiece] = useState<any>(null);

  useEffect(() => {
    // Get gcon_piece_id from URL parameters
    const gconPieceIdParam = searchParams?.get('gcon_piece_id');
    if (gconPieceIdParam) {
      setGconPieceId(gconPieceIdParam);
      console.log('Torya: Loaded with gcon_piece_id:', gconPieceIdParam);
    }
    
    setLoading(false);
  }, [searchParams]);

  // Fetch gcon_piece data when gconPieceId is available
  useEffect(() => {
    const fetchGconPiece = async () => {
      if (!user?.id || !gconPieceId) {
        return;
      }

      try {
        // Get user's internal ID first
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          setError('User not found');
          return;
        }

        // Fetch the gcon_piece
        const { data: gconData, error: gconError } = await supabase
          .from('gcon_pieces')
          .select('id, asn_sitespren_base, mud_title')
          .eq('id', gconPieceId)
          .eq('fk_users_id', userData.id)
          .single();

        if (gconError) {
          setError('Content piece not found');
          return;
        }

        setGconPiece(gconData);
      } catch (err) {
        console.error('Error fetching gcon_piece:', err);
        setError('Failed to load content');
      }
    };

    fetchGconPiece();
  }, [user?.id, gconPieceId, supabase]);

  // Set browser title based on gcon_piece data
  useEffect(() => {
    if (gconPiece?.asn_sitespren_base) {
      document.title = 'torya_' + gconPiece.asn_sitespren_base;
    } else if (gconPieceId) {
      document.title = 'torya';
    } else {
      document.title = 'torya';
    }
  }, [gconPiece?.asn_sitespren_base, gconPieceId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Torya</h1>
        {gconPieceId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>gcon_piece_id:</strong> {gconPieceId}
              {gconPiece?.asn_sitespren_base && (
                <span className="ml-4">
                  <strong>Site:</strong> {gconPiece.asn_sitespren_base}
                </span>
              )}
            </p>
          </div>
        )}
        <WaterTable gconPieceId={gconPieceId} />
      </div>
    </div>
  );
}