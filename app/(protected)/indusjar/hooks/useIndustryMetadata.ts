'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface IndustryMetadata {
  meta_id?: number;
  fk_industry_id: number;
  user_id: string;
  is_starred: boolean;
  is_flagged: boolean;
  is_squared: boolean;
  is_circled: boolean;
  is_triangled: boolean;
  personal_notes?: string;
  custom_tags?: string[];
  priority_level?: number;
  last_viewed_at?: string;
  view_count?: number;
}

export function useIndustryMetadata() {
  const [metadata, setMetadata] = useState<{ [industryId: number]: IndustryMetadata }>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  // Fetch all industry metadata for current user
  const fetchMetadata = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('industries_user_meta')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching industry metadata:', error);
        return;
      }

      // Convert array to object keyed by industry_id for quick lookup
      const metadataMap: { [industryId: number]: IndustryMetadata } = {};
      data?.forEach(meta => {
        metadataMap[meta.fk_industry_id] = meta;
      });
      
      setMetadata(metadataMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle a specific symbol for an industry
  const toggleSymbol = async (
    industryId: number, 
    symbolType: 'is_starred' | 'is_flagged' | 'is_squared' | 'is_circled' | 'is_triangled'
  ) => {
    if (!user?.id) return;

    const currentMeta = metadata[industryId];
    const currentValue = currentMeta?.[symbolType] || false;
    const newValue = !currentValue;

    try {
      // Create the metadata object with current values or defaults
      const metaData: Partial<IndustryMetadata> = {
        fk_industry_id: industryId,
        user_id: user.id,
        is_starred: currentMeta?.is_starred || false,
        is_flagged: currentMeta?.is_flagged || false,
        is_squared: currentMeta?.is_squared || false,
        is_circled: currentMeta?.is_circled || false,
        is_triangled: currentMeta?.is_triangled || false,
        [symbolType]: newValue // Override the specific symbol being toggled
      };

      const { data, error } = await supabase
        .from('industries_user_meta')
        .upsert(metaData)
        .select()
        .single();

      if (error) {
        console.error('Error updating industry metadata:', error);
        return;
      }

      // Update local state
      setMetadata(prev => ({
        ...prev,
        [industryId]: data
      }));

    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Update metadata fields (notes, priority, etc.)
  const updateMetadata = async (industryId: number, updates: Partial<IndustryMetadata>) => {
    if (!user?.internalUserId) return;

    try {
      const currentMeta = metadata[industryId];
      
      const metaData = {
        fk_industry_id: industryId,
        user_id: user.id,
        // Preserve existing values
        is_starred: currentMeta?.is_starred || false,
        is_flagged: currentMeta?.is_flagged || false,
        is_squared: currentMeta?.is_squared || false,
        is_circled: currentMeta?.is_circled || false,
        is_triangled: currentMeta?.is_triangled || false,
        // Apply updates
        ...updates
      };

      const { data, error } = await supabase
        .from('industries_user_meta')
        .upsert(metaData)
        .select()
        .single();

      if (error) {
        console.error('Error updating metadata:', error);
        return;
      }

      // Update local state
      setMetadata(prev => ({
        ...prev,
        [industryId]: data
      }));

    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Check if an industry has a specific symbol active
  const hasSymbol = (industryId: number, symbolType: 'is_starred' | 'is_flagged' | 'is_squared' | 'is_circled' | 'is_triangled'): boolean => {
    return metadata[industryId]?.[symbolType] || false;
  };

  // Get metadata for a specific industry
  const getMetadata = (industryId: number): IndustryMetadata | null => {
    return metadata[industryId] || null;
  };

  useEffect(() => {
    fetchMetadata();
  }, [user]);

  return {
    metadata,
    loading,
    toggleSymbol,
    updateMetadata,
    hasSymbol,
    getMetadata,
    refetch: fetchMetadata
  };
}