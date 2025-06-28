import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface GconPiece {
  id: string;
  aval_content: string | null;
  meta_title: string | null;
  asn_sitespren_base: string | null;
}

interface AvalUnit {
  id: string;
  fk_gcon_piece_id: string;
  line_key1: string;
  unit_type: string;
  payload: any;
  created_at: string;
  updated_at: string;
}

interface UseAvalancheContentResult {
  gconPiece: GconPiece | null;
  avalUnits: AvalUnit[];
  loading: boolean;
  error: string | null;
}

export function useAvalancheContent(pieceId: string | null): UseAvalancheContentResult {
  const [gconPiece, setGconPiece] = useState<GconPiece | null>(null);
  const [avalUnits, setAvalUnits] = useState<AvalUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!pieceId) {
      setLoading(false);
      setError('No piece ID provided');
      return;
    }

    const fetchAvalancheContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch gcon_piece
        const { data: pieceData, error: pieceError } = await supabase
          .from('gcon_pieces')
          .select('id, aval_content, meta_title, asn_sitespren_base')
          .eq('id', pieceId)
          .single();

        if (pieceError) {
          throw new Error(`Failed to fetch gcon_piece: ${pieceError.message}`);
        }

        if (!pieceData) {
          throw new Error('No gcon_piece found with this ID');
        }

        setGconPiece(pieceData);

        // Fetch aval_units
        const { data: unitsData, error: unitsError } = await supabase
          .from('aval_units')
          .select('*')
          .eq('fk_gcon_piece_id', pieceId)
          .order('line_key1', { ascending: true });

        if (unitsError) {
          throw new Error(`Failed to fetch aval_units: ${unitsError.message}`);
        }

        setAvalUnits(unitsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAvalancheContent();
  }, [pieceId, supabase]);

  return { gconPiece, avalUnits, loading, error };
}