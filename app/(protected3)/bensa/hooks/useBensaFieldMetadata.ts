'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BensaFieldMetadata } from '../components/BensaFieldTableTypes';

export function useBensaFieldMetadata(tableName: string) {
  const [fieldMetadata, setFieldMetadata] = useState<{[key: string]: BensaFieldMetadata}>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const fetchFieldMetadata = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('frenzi_field_metadata')
        .select('field_name, starred, flagged, chain_of_custody_desc')
        .eq('table_name', tableName);

      if (error) {
        console.error('Error fetching field metadata:', error);
        return;
      }

      const metadataMap: {[key: string]: BensaFieldMetadata} = {};
      data?.forEach(item => {
        metadataMap[item.field_name] = {
          starred: item.starred || false,
          flagged: item.flagged || false,
          chain_of_custody_desc: item.chain_of_custody_desc || null
        };
      });
      setFieldMetadata(metadataMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFieldStar = async (fieldName: string) => {
    const currentStarred = fieldMetadata[fieldName]?.starred || false;
    const newStarred = !currentStarred;

    try {
      const { error } = await supabase
        .from('frenzi_field_metadata')
        .upsert({
          table_name: tableName,
          field_name: fieldName,
          starred: newStarred,
          flagged: fieldMetadata[fieldName]?.flagged || false
        }, {
          onConflict: 'table_name,field_name'
        });

      if (error) {
        console.error('Error updating field star:', error);
        return;
      }

      // Update local state
      setFieldMetadata(prev => ({
        ...prev,
        [fieldName]: {
          starred: newStarred,
          flagged: prev[fieldName]?.flagged || false,
          chain_of_custody_desc: prev[fieldName]?.chain_of_custody_desc || null
        }
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleFieldFlag = async (fieldName: string) => {
    const currentFlagged = fieldMetadata[fieldName]?.flagged || false;
    const newFlagged = !currentFlagged;

    try {
      const { error } = await supabase
        .from('frenzi_field_metadata')
        .upsert({
          table_name: tableName,
          field_name: fieldName,
          starred: fieldMetadata[fieldName]?.starred || false,
          flagged: newFlagged
        }, {
          onConflict: 'table_name,field_name'
        });

      if (error) {
        console.error('Error updating field flag:', error);
        return;
      }

      // Update local state
      setFieldMetadata(prev => ({
        ...prev,
        [fieldName]: {
          starred: prev[fieldName]?.starred || false,
          flagged: newFlagged,
          chain_of_custody_desc: prev[fieldName]?.chain_of_custody_desc || null
        }
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (tableName) {
      fetchFieldMetadata();
    }
  }, [tableName]);

  const updateChainOfCustody = async (fieldName: string, description: string) => {
    try {
      const { error } = await supabase
        .from('frenzi_field_metadata')
        .upsert({
          table_name: tableName,
          field_name: fieldName,
          starred: fieldMetadata[fieldName]?.starred || false,
          flagged: fieldMetadata[fieldName]?.flagged || false,
          chain_of_custody_desc: description
        }, {
          onConflict: 'table_name,field_name'
        });

      if (error) {
        console.error('Error updating chain of custody:', error);
        return;
      }

      // Update local state
      setFieldMetadata(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          chain_of_custody_desc: description
        }
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return {
    fieldMetadata,
    loading,
    toggleFieldStar,
    toggleFieldFlag,
    updateChainOfCustody,
    refetch: fetchFieldMetadata
  };
}