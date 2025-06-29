import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface GconPiece {
  id: string;
  aval_content: string | null;
  aval_title: string | null;
  meta_title: string | null;
  asn_sitespren_base: string | null;
  g_post_status: string | null;
}

interface UseEdableContentResult {
  gconPiece: GconPiece | null;
  loading: boolean;
  error: string | null;
}

export function useEdableContent(pieceId: string | null | undefined): UseEdableContentResult {
  const [gconPiece, setGconPiece] = useState<GconPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!pieceId || pieceId === undefined) {
      setLoading(false);
      setError('No piece ID provided');
      return;
    }

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch gcon_piece
        const { data: pieceData, error: pieceError } = await supabase
          .from('gcon_pieces')
          .select('id, aval_content, aval_title, meta_title, asn_sitespren_base, g_post_status')
          .eq('id', pieceId)
          .single();

        if (pieceError) {
          throw new Error(`Failed to fetch gcon_piece: ${pieceError.message}`);
        }

        if (!pieceData) {
          throw new Error('No gcon_piece found with this ID');
        }

        setGconPiece(pieceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [pieceId, supabase]);

  return { gconPiece, loading, error };
}