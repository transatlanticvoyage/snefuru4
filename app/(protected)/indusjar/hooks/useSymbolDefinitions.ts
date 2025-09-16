'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface SymbolDefinition {
  definition_id?: number;
  user_id: string;
  symbol_type: 'star' | 'flag' | 'square' | 'circle' | 'triangle';
  symbol_meaning: string;
  symbol_color?: string;
  symbol_emoji?: string;
  display_order?: number;
  is_active?: boolean;
}

export function useSymbolDefinitions() {
  const [definitions, setDefinitions] = useState<{ [key: string]: SymbolDefinition }>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  // Fetch user's symbol definitions
  const fetchDefinitions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_symbol_definitions')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order');

      if (error) {
        console.error('Error fetching symbol definitions:', error);
        return;
      }

      // If no definitions exist, create defaults
      if (!data || data.length === 0) {
        await createDefaultDefinitions();
        return;
      }

      // Convert array to object keyed by symbol_type
      const definitionsMap: { [key: string]: SymbolDefinition } = {};
      data.forEach(def => {
        definitionsMap[def.symbol_type] = def;
      });
      
      setDefinitions(definitionsMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create default symbol definitions for new user
  const createDefaultDefinitions = async () => {
    if (!user?.id) return;

    const defaultDefs = [
      { symbol_type: 'star', symbol_meaning: 'Important industries', symbol_emoji: '⭐', display_order: 1 },
      { symbol_type: 'flag', symbol_meaning: 'Needs attention', symbol_emoji: '🚩', display_order: 2 },
      { symbol_type: 'square', symbol_meaning: 'Completed research', symbol_emoji: '⬜', display_order: 3 },
      { symbol_type: 'circle', symbol_meaning: 'Active prospects', symbol_emoji: '⭕', display_order: 4 },
      { symbol_type: 'triangle', symbol_meaning: 'Competitors', symbol_emoji: '🔺', display_order: 5 }
    ];

    try {
      const { data, error } = await supabase
        .from('user_symbol_definitions')
        .insert(
          defaultDefs.map(def => ({
            user_id: user.id,
            ...def
          }))
        )
        .select();

      if (error) {
        console.error('Error creating default definitions:', error);
        return;
      }

      // Convert to map and set state
      const definitionsMap: { [key: string]: SymbolDefinition } = {};
      data.forEach(def => {
        definitionsMap[def.symbol_type] = def;
      });
      setDefinitions(definitionsMap);

    } catch (error) {
      console.error('Error creating defaults:', error);
    }
  };

  // Update symbol definition
  const updateDefinition = async (symbolType: string, updates: Partial<SymbolDefinition>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_symbol_definitions')
        .update(updates)
        .eq('user_id', user.id)
        .eq('symbol_type', symbolType)
        .select()
        .single();

      if (error) {
        console.error('Error updating definition:', error);
        return;
      }

      // Update local state
      setDefinitions(prev => ({
        ...prev,
        [symbolType]: data
      }));

    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Get definition for a symbol type
  const getDefinition = (symbolType: string): SymbolDefinition | null => {
    return definitions[symbolType] || null;
  };

  useEffect(() => {
    fetchDefinitions();
  }, [user]);

  return {
    definitions,
    loading,
    updateDefinition,
    getDefinition,
    refetch: fetchDefinitions
  };
}