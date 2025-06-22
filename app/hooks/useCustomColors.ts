'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useCustomColors(colorCodes: string[]) {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchColors = async () => {
      if (colorCodes.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_ref_code, hex_value')
          .in('color_ref_code', colorCodes);

        if (error) {
          console.error('Error fetching custom colors:', error);
          setColors({});
        } else {
          const colorMap: Record<string, string> = {};
          data?.forEach(color => {
            colorMap[color.color_ref_code] = color.hex_value;
          });
          setColors(colorMap);
        }
      } catch (err) {
        console.error('Error fetching custom colors:', err);
        setColors({});
      } finally {
        setLoading(false);
      }
    };

    fetchColors();
  }, [colorCodes.join(','), supabase]);

  return { colors, loading };
}