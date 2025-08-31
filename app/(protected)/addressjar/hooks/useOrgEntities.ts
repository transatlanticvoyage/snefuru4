'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface OrgEntity {
  entity_id?: number;
  fk_addresspren_id: number;
  user_id: string;
  is_starred: boolean;
  is_flagged: boolean;
  is_circled: boolean;
  is_squared: boolean;
  is_triangled: boolean;
}

export function useOrgEntities() {
  const [orgEntities, setOrgEntities] = useState<{ [addressprenId: number]: OrgEntity }>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  // Fetch all org entities for current user
  const fetchOrgEntities = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('addresspren_org_entities')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching org entities:', error);
        return;
      }

      // Convert array to object keyed by addresspren_id for quick lookup
      const entitiesMap: { [addressprenId: number]: OrgEntity } = {};
      data?.forEach(entity => {
        entitiesMap[entity.fk_addresspren_id] = entity;
      });
      
      setOrgEntities(entitiesMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle a specific entity type for an address
  const toggleEntity = async (
    addressprenId: number, 
    entityType: 'is_starred' | 'is_flagged' | 'is_circled' | 'is_squared' | 'is_triangled'
  ) => {
    if (!user?.id) return;

    const currentEntity = orgEntities[addressprenId];
    const currentValue = currentEntity?.[entityType] || false;
    const newValue = !currentValue;

    try {
      // Create the entity object with current values or defaults
      const entityData: Partial<OrgEntity> = {
        fk_addresspren_id: addressprenId,
        user_id: user.id,
        is_starred: currentEntity?.is_starred || false,
        is_flagged: currentEntity?.is_flagged || false,
        is_circled: currentEntity?.is_circled || false,
        is_squared: currentEntity?.is_squared || false,
        is_triangled: currentEntity?.is_triangled || false,
        [entityType]: newValue // Override the specific entity being toggled
      };

      const { data, error } = await supabase
        .from('addresspren_org_entities')
        .upsert(entityData, {
          onConflict: 'fk_addresspren_id,user_id'
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
        [addressprenId]: data
      }));

    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Check if an address has a specific entity active
  const hasEntity = (addressprenId: number, entityType: 'is_starred' | 'is_flagged' | 'is_circled' | 'is_squared' | 'is_triangled'): boolean => {
    return orgEntities[addressprenId]?.[entityType] || false;
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