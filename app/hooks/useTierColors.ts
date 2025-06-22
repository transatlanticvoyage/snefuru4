import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface TierColors {
  dltier1_bgcolor: string;
  dltier2_bgcolor: string;
  dltier3_bgcolor: string;
  dltier4_bgcolor: string;
}

export const useTierColors = () => {
  const [tierColors, setTierColors] = useState<TierColors>({
    dltier1_bgcolor: '#f3f4f6', // default light gray
    dltier2_bgcolor: '#e5e7eb', // default gray
    dltier3_bgcolor: '#dbeafe', // default blue-100
    dltier4_bgcolor: '#f3f4f6', // default light gray
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTierColors = async () => {
      try {
        const supabase = createClientComponentClient();
        
        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_ref_code, hex_value')
          .in('color_ref_code', [
            'dltier1_bgcolor',
            'dltier2_bgcolor', 
            'dltier3_bgcolor',
            'dltier4_bgcolor'
          ]);

        if (!error && data && data.length > 0) {
          const colors: Partial<TierColors> = {};
          
          data.forEach(item => {
            if (item.color_ref_code in tierColors) {
              colors[item.color_ref_code as keyof TierColors] = item.hex_value;
            }
          });
          
          setTierColors(prev => ({ ...prev, ...colors }));
        }
      } catch (err) {
        console.error('Error fetching tier colors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTierColors();
  }, []);

  return { tierColors, loading };
};