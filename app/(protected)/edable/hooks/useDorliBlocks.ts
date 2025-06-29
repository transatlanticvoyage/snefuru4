import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DorliBlock {
  dorli_id: string;
  fk_gcon_piece_id: string;
  tag: string;
  placeholder: string;
  raw: string;
  line_count: number;
  created_at: string;
}

export function useDorliBlocks(gconPieceId: string | null) {
  const [dorliBlocks, setDorliBlocks] = useState<DorliBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!gconPieceId) {
      setDorliBlocks([]);
      return;
    }

    const fetchDorliBlocks = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('aval_dorlis')
          .select('*')
          .eq('fk_gcon_piece_id', gconPieceId)
          .order('created_at', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setDorliBlocks(data || []);
      } catch (err) {
        console.error('Error fetching dorli blocks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dorli blocks');
        setDorliBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDorliBlocks();
  }, [gconPieceId, supabase]);

  const updateDorliBlock = async (dorliId: string, newRaw: string) => {
    try {
      // Calculate line count for the new content
      const lineCount = newRaw.split(/\r?\n/).length;
      
      const { error: updateError } = await supabase
        .from('aval_dorlis')
        .update({ 
          raw: newRaw,
          line_count: lineCount
        })
        .eq('dorli_id', dorliId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setDorliBlocks(prev => 
        prev.map(block => 
          block.dorli_id === dorliId 
            ? { ...block, raw: newRaw, line_count: lineCount }
            : block
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating dorli block:', err);
      setError(err instanceof Error ? err.message : 'Failed to update dorli block');
      return false;
    }
  };

  const getDorliByPlaceholder = (placeholder: string): DorliBlock | null => {
    return dorliBlocks.find(block => block.placeholder === placeholder) || null;
  };

  return {
    dorliBlocks,
    loading,
    error,
    updateDorliBlock,
    getDorliByPlaceholder
  };
}