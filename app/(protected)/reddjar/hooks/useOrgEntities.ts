'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface OrgEntity {
  entity_id?: number;
  fk_url_id: number;
  user_id: string;
  is_starred: boolean;
  is_flagged: boolean;
  is_squared: boolean;
  is_circled: boolean;
  is_triangled: boolean;
}

export function useOrgEntities() {
  const [orgEntities, setOrgEntities] = useState<{ [urlId: number]: OrgEntity }>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  // Fetch all org entities for current user
  const fetchOrgEntities = async () => {
    if (!user?.internalUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('redditurlsvat_org_entities')
        .select('*')
        .eq('user_id', user.internalUserId);

      if (error) {
        console.error('Error fetching org entities:', error);
        return;
      }

      // Convert array to object keyed by url_id for quick lookup
      const entitiesMap: { [urlId: number]: OrgEntity } = {};
      data?.forEach(entity => {
        entitiesMap[entity.fk_url_id] = entity;
      });
      
      setOrgEntities(entitiesMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle a specific entity type for a URL
  const toggleEntity = async (
    urlId: number, 
    entityType: 'is_starred' | 'is_flagged' | 'is_squared' | 'is_circled' | 'is_triangled'
  ) => {
    if (!user?.internalUserId) return;

    const currentEntity = orgEntities[urlId];
    const currentValue = currentEntity?.[entityType] || false;
    const newValue = !currentValue;

    try {
      // Create the entity object with current values or defaults
      const entityData: Partial<OrgEntity> = {
        fk_url_id: urlId,
        user_id: user.internalUserId,
        is_starred: currentEntity?.is_starred || false,
        is_flagged: currentEntity?.is_flagged || false,
        is_squared: currentEntity?.is_squared || false,
        is_circled: currentEntity?.is_circled || false,
        is_triangled: currentEntity?.is_triangled || false,
        [entityType]: newValue // Override the specific entity being toggled
      };

      const { data, error } = await supabase
        .from('redditurlsvat_org_entities')
        .upsert(entityData, {
          onConflict: 'fk_url_id,user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating org entity:', error);
        return;
      }

      // Update local state
      setOrgEntities(prev => ({
        ...prev,
        [urlId]: data
      }));

    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Check if a URL has a specific entity active
  const hasEntity = (urlId: number, entityType: 'is_starred' | 'is_flagged' | 'is_squared' | 'is_circled' | 'is_triangled'): boolean => {
    return orgEntities[urlId]?.[entityType] || false;
  };

  useEffect(() => {
    fetchOrgEntities();
  }, [user]);

  return {
    orgEntities,
    loading,
    toggleEntity,
    hasEntity,
    refetch: fetchOrgEntities
  };
}