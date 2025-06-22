'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SelectedRowStyles() {
  const [selectedRowColor, setSelectedRowColor] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSelectedRowColor = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_colors')
          .select('hex_value')
          .eq('color_ref_code', 'activelyselectedrow1_bgcolor1')
          .single();
        
        if (error) {
          console.error('Error fetching selected row color:', error);
        } else {
          setSelectedRowColor(data?.hex_value || null);
        }
      } catch (error) {
        console.error('Error fetching selected row color:', error);
      }
    };

    fetchSelectedRowColor();
  }, [supabase]);

  if (!selectedRowColor) {
    return null;
  }

  return (
    <style jsx global>{`
      /* Global style for selected rows in tables with checkboxes */
      tr:has(input[type="checkbox"]:checked) {
        background-color: ${selectedRowColor} !important;
      }
      
      /* Ensure the style works with hover states */
      tr:has(input[type="checkbox"]:checked):hover {
        background-color: ${selectedRowColor} !important;
        filter: brightness(0.95);
      }
      
      /* Override any inline background styles for selected rows */
      tr:has(input[type="checkbox"]:checked) td {
        background-color: inherit !important;
      }
    `}</style>
  );
}