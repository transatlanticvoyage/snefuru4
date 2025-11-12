'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface FileRelease {
  release_id: number;
  release_date: string | null;
  zip_based_count?: number;
  transformed_count?: number;
  children_count?: number;
}

interface Subsheet {
  subsheet_id: number;
  rel_release_id: number | null;
  subsheet_name: string | null;
  zip_based_count?: number;
  transformed_count?: number;
  children_count?: number;
}

interface Subpart {
  subpart_id: number;
  rel_subsheet_id: number | null;
  payout_note: string | null;
  zip_based_count?: number;
  transformed_count?: number;
}

interface Props {
  pageType: 'tank' | 'morph';
  onFilterApply: (type: 'release' | 'subsheet' | 'subpart' | null, id: number | null) => void;
  currentFilter?: {
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  };
  onRegisterRebuild?: (rebuildFn: () => void) => void;
  onRebuildStatusChange?: (rebuilding: boolean, progress: number) => void;
}

interface PicoCacheData {
  releases: {
    [key: string]: {
      zip_based_count: number;
      transformed_count: number;
      children_count: number;
    };
  };
  subsheets: {
    [key: string]: {
      zip_based_count: number;
      transformed_count: number;
      children_count: number;
    };
  };
  subparts: {
    [key: string]: {
      zip_based_count: number;
      transformed_count: number;
    };
  };
}

export default function LeadSmartSkylabTileTables({ 
  pageType, 
  onFilterApply,
  currentFilter,
  onRegisterRebuild,
  onRebuildStatusChange
}: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  // Data states
  const [releases, setReleases] = useState<FileRelease[]>([]);
  const [subsheets, setSubsheets] = useState<Subsheet[]>([]);
  const [subparts, setSubparts] = useState<Subpart[]>([]);
  
  // Cache state
  const [cacheData, setCacheData] = useState<PicoCacheData | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildProgress, setRebuildProgress] = useState(0);
  
  // Selection states for view children
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);
  
  // Navigation states for cycling through sx tiles
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState<number>(0);
  const [currentSubsheetIndex, setCurrentSubsheetIndex] = useState<number>(0);
  const [currentSubpartIndex, setCurrentSubpartIndex] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);

  // Load cache from database
  const loadCache = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_pico_count_cache')
        .select('count_data, last_updated')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setCacheData(data.count_data as PicoCacheData);
        console.log('✅ Pico cache loaded:', data.last_updated);
      } else {
        console.log('⚠️ No cache found for user, will create on first rebuild');
        setCacheData(null);
      }
    } catch (error) {
      console.error('Error loading pico cache:', error);
      setCacheData(null);
    }
  }, [user, supabase]);

  // Rebuild cache
  const rebuildCache = useCallback(async () => {
    if (!user?.id) {
      alert('Please log in to rebuild cache');
      return;
    }
    
    if (rebuilding) {
      alert('Cache rebuild already in progress');
      return;
    }
    
    if (!confirm('Rebuild Pico Count Cache?\n\nThis will count all rows in leadsmart_zip_based_data and leadsmart_transformed for all releases, subsheets, and subparts. This may take a few minutes.\n\nYou can monitor progress at /leadsmart_pico')) {
      return;
    }
    
    setRebuilding(true);
    setRebuildProgress(0);
    const startTime = Date.now();
    let reportId: number | null = null;
    
    try {
      console.log('🔄 Starting Pico cache rebuild...');
      setRebuildProgress(5);
      
      // Clean up any stalled reports first
      await supabase
        .from('leadsmart_pico_reports')
        .update({ status: 'cancelled' })
        .eq('status', 'in_progress');
      
      // Create monitoring record
      const { data: reportData, error: reportError } = await supabase
        .from('leadsmart_pico_reports')
        .insert([{
          operation_type: 'cache_rebuild',
          status: 'in_progress',
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          current_phase: 'initializing',
          overall_progress: 5.00,
          operation_logs: []
        }])
        .select('report_id')
        .single();
      
      if (reportError) {
        console.error('Failed to create monitoring record:', reportError);
        throw reportError;
      }
      reportId = reportData.report_id;
      
      console.log(`📝 Created monitoring record: ${reportId}`);
      
      // Mark rebuild as in progress in old cache table
      await supabase
        .from('leadsmart_pico_count_cache')
        .upsert({
          cache_id: 1, // Will be ignored if row exists
          user_id: user.id,
          rebuild_in_progress: true,
          last_rebuild_started_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      // Helper function to update progress in both places
      const updateProgress = async (phase: string, progress: number, message: string, additionalData?: any) => {
        setRebuildProgress(progress);
        
        if (reportId) {
          try {
            await supabase
              .from('leadsmart_pico_reports')
              .update({
                current_phase: phase,
                overall_progress: progress,
                last_activity_at: new Date().toISOString()
              })
              .eq('report_id', reportId);
          } catch (updateError) {
            console.warn('Failed to update progress:', updateError);
          }
        }
      };
      
      const newCacheData: PicoCacheData = {
        releases: {},
        subsheets: {},
        subparts: {}
      };
      
      // Step 1: Count for all releases
      console.log('📊 Step 1/3: Counting releases...');
      await updateProgress('counting_releases', 10, 'Started counting releases');
      const { data: allReleases } = await supabase
        .from('leadsmart_file_releases')
        .select('release_id');
      
      const totalReleases = allReleases?.length || 0;
      for (let i = 0; i < (allReleases || []).length; i++) {
        const release = allReleases![i];
        const { count: zipCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_release_id', release.release_id);
        
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_release_id', release.release_id);
        
        const { count: childrenCount } = await supabase
          .from('leadsmart_subsheets')
          .select('*', { count: 'exact', head: true })
          .eq('rel_release_id', release.release_id);
        
        newCacheData.releases[release.release_id] = {
          zip_based_count: zipCount || 0,
          transformed_count: transformedCount || 0,
          children_count: childrenCount || 0
        };
        
        // Update progress (releases are 10-40%)
        await updateProgress('counting_releases', 10 + Math.floor((i + 1) / totalReleases * 30), 
          `Counted release ${i + 1}/${totalReleases}`, 
          { release_id: release.release_id, zip_count: zipCount, transformed_count: transformedCount });
      }
      
      console.log(`✅ Counted ${allReleases?.length || 0} releases`);
      await updateProgress('counting_releases', 40, `Completed counting ${allReleases?.length || 0} releases`);
      
      // Step 2: Count for all subsheets
      console.log('📊 Step 2/3: Counting subsheets...');
      await updateProgress('counting_subsheets', 40, 'Started counting subsheets');
      const { data: allSubsheets } = await supabase
        .from('leadsmart_subsheets')
        .select('subsheet_id');
      
      const totalSubsheets = allSubsheets?.length || 0;
      for (let i = 0; i < (allSubsheets || []).length; i++) {
        const subsheet = allSubsheets![i];
        const { count: zipCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subsheet_id', subsheet.subsheet_id);
        
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_subsheet_id', subsheet.subsheet_id);
        
        const { count: childrenCount } = await supabase
          .from('leadsmart_subparts')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subsheet_id', subsheet.subsheet_id);
        
        newCacheData.subsheets[subsheet.subsheet_id] = {
          zip_based_count: zipCount || 0,
          transformed_count: transformedCount || 0,
          children_count: childrenCount || 0
        };
        
        // Update progress (subsheets are 40-70%)
        await updateProgress('counting_subsheets', 40 + Math.floor((i + 1) / totalSubsheets * 30), 
          `Counted subsheet ${i + 1}/${totalSubsheets}`, 
          { subsheet_id: subsheet.subsheet_id, zip_count: zipCount, transformed_count: transformedCount });
      }
      
      console.log(`✅ Counted ${allSubsheets?.length || 0} subsheets`);
      await updateProgress('counting_subsheets', 70, `Completed counting ${allSubsheets?.length || 0} subsheets`);
      
      // Step 3: Count for all subparts
      console.log('📊 Step 3/3: Counting subparts...');
      await updateProgress('counting_subparts', 70, 'Started counting subparts');
      const { data: allSubparts } = await supabase
        .from('leadsmart_subparts')
        .select('subpart_id');
      
      const totalSubparts = allSubparts?.length || 0;
      for (let i = 0; i < (allSubparts || []).length; i++) {
        const subpart = allSubparts![i];
        const { count: zipCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_subpart_id', subpart.subpart_id);
        
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_subpart_id', subpart.subpart_id);
        
        newCacheData.subparts[subpart.subpart_id] = {
          zip_based_count: zipCount || 0,
          transformed_count: transformedCount || 0
        };
        
        // Update progress (subparts are 70-95%)
        await updateProgress('counting_subparts', 70 + Math.floor((i + 1) / totalSubparts * 25), 
          `Counted subpart ${i + 1}/${totalSubparts}`, 
          { subpart_id: subpart.subpart_id, zip_count: zipCount, transformed_count: transformedCount });
      }
      
      console.log(`✅ Counted ${allSubparts?.length || 0} subparts`);
      await updateProgress('counting_subparts', 95, `Completed counting ${allSubparts?.length || 0} subparts`);
      
      const duration = Date.now() - startTime;
      
      // Save cache to database
      console.log('💾 Saving cache to database...');
      await updateProgress('saving_cache', 95, 'Saving cache to database');
      
      // Ensure correct JSON key order: releases -> subsheets -> subparts  
      // Build object manually with precise key insertion order
      const orderedCacheData = {};
      orderedCacheData['releases'] = newCacheData.releases;
      orderedCacheData['subsheets'] = newCacheData.subsheets;
      orderedCacheData['subparts'] = newCacheData.subparts;
      
      const { error: upsertError } = await supabase
        .from('leadsmart_pico_count_cache')
        .upsert({
          user_id: user.id,
          count_data: orderedCacheData,
          last_updated: new Date().toISOString(),
          rebuild_in_progress: false,
          last_rebuild_completed_at: new Date().toISOString(),
          last_rebuild_duration_ms: duration,
          total_releases_cached: allReleases?.length || 0,
          total_subsheets_cached: allSubsheets?.length || 0,
          total_subparts_cached: allSubparts?.length || 0,
          cache_version: 1
        }, {
          onConflict: 'user_id'
        });
      
      if (upsertError) throw upsertError;
      
      // Update local cache
      setCacheData(orderedCacheData);
      
      const durationSeconds = (duration / 1000).toFixed(1);
      const totalCacheEntries = (allReleases?.length || 0) + (allSubsheets?.length || 0) + (allSubparts?.length || 0);
      
      // Complete monitoring record
      if (reportId) {
        await supabase
          .from('leadsmart_pico_reports')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            overall_progress: 100.00,
            current_phase: 'completed',
            releases_count: allReleases?.length || 0,
            subsheets_count: allSubsheets?.length || 0,
            subparts_count: allSubparts?.length || 0,
            cache_entries_created: totalCacheEntries,
            operations_per_second: totalCacheEntries / (duration / 1000),
            cache_data_summary: {
              total_cache_entries: totalCacheEntries,
              releases_cached: allReleases?.length || 0,
              subsheets_cached: allSubsheets?.length || 0,
              subparts_cached: allSubparts?.length || 0,
              duration_ms: duration
            }
          })
          .eq('report_id', reportId);
      }
      
      await updateProgress('completed', 100, `Cache rebuild completed in ${durationSeconds}s`);
      
      alert(`✅ Pico Cache Rebuilt Successfully!\n\n` +
        `Releases: ${allReleases?.length || 0}\n` +
        `Subsheets: ${allSubsheets?.length || 0}\n` +
        `Subparts: ${allSubparts?.length || 0}\n\n` +
        `Duration: ${durationSeconds}s\n\n` +
        `Monitor at: /leadsmart_pico`);
      
      console.log(`✅ Cache rebuilt in ${durationSeconds}s`);
      
      // Refresh data to apply new cache
      await fetchReleases();
      
    } catch (error) {
      console.error('❌ Error rebuilding pico cache:', error);
      
      // Update monitoring record with error
      if (reportId) {
        await supabase
          .from('leadsmart_pico_reports')
          .update({
            status: 'failed',
            last_activity_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
            error_details: {
              error: error instanceof Error ? error.stack : String(error),
              timestamp: new Date().toISOString()
            }
          })
          .eq('report_id', reportId);
      }
      
      alert(`Failed to rebuild cache. Check console for details.\n\nView detailed error info at: /leadsmart_pico`);
      
      // Mark rebuild as failed in old table
      await supabase
        .from('leadsmart_pico_count_cache')
        .update({ rebuild_in_progress: false })
        .eq('user_id', user.id);
    } finally {
      setRebuilding(false);
      setRebuildProgress(0);
    }
  }, [user, supabase]);

  // Fetch releases
  const fetchReleases = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_file_releases')
        .select('*')
        .order('release_id', { ascending: false });
      
      if (error) throw error;
      
      // Apply counts from cache (FAST!)
      const releasesWithCounts = (data || []).map((release) => {
        const cached = cacheData?.releases[release.release_id];
        return {
          ...release,
          zip_based_count: cached?.zip_based_count || 0,
          transformed_count: cached?.transformed_count || 0,
          children_count: cached?.children_count || 0
        };
      });
      
      setReleases(releasesWithCounts);
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  }, [user, supabase, cacheData]);

  // Fetch subsheets
  const fetchSubsheets = useCallback(async () => {
    if (!selectedReleaseId) {
      setSubsheets([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_subsheets')
        .select('*')
        .eq('rel_release_id', selectedReleaseId)
        .order('subsheet_id', { ascending: false });
      
      if (error) throw error;
      
      // Apply counts from cache (FAST!)
      const subsheetsWithCounts = (data || []).map((subsheet) => {
        const cached = cacheData?.subsheets[subsheet.subsheet_id];
        return {
          ...subsheet,
          zip_based_count: cached?.zip_based_count || 0,
          transformed_count: cached?.transformed_count || 0,
          children_count: cached?.children_count || 0
        };
      });
      
      setSubsheets(subsheetsWithCounts);
    } catch (error) {
      console.error('Error fetching subsheets:', error);
    }
  }, [selectedReleaseId, supabase, cacheData]);

  // Fetch subparts
  const fetchSubparts = useCallback(async () => {
    if (!selectedSubsheetId) {
      setSubparts([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_subparts')
        .select('*')
        .eq('rel_subsheet_id', selectedSubsheetId)
        .order('subpart_id', { ascending: false });
      
      if (error) throw error;
      
      // Apply counts from cache (FAST!)
      const subpartsWithCounts = (data || []).map((subpart) => {
        const cached = cacheData?.subparts[subpart.subpart_id];
        return {
          ...subpart,
          zip_based_count: cached?.zip_based_count || 0,
          transformed_count: cached?.transformed_count || 0
        };
      });
      
      setSubparts(subpartsWithCounts);
    } catch (error) {
      console.error('Error fetching subparts:', error);
    }
  }, [selectedSubsheetId, supabase, cacheData]);

  // Load cache on mount
  useEffect(() => {
    loadCache();
  }, [loadCache]);

  // Register rebuild function with parent
  useEffect(() => {
    if (onRegisterRebuild) {
      onRegisterRebuild(rebuildCache);
    }
  }, [onRegisterRebuild, rebuildCache]);

  // Notify parent of rebuild status changes
  useEffect(() => {
    if (onRebuildStatusChange) {
      onRebuildStatusChange(rebuilding, rebuildProgress);
    }
  }, [rebuilding, rebuildProgress, onRebuildStatusChange]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    fetchSubsheets();
  }, [fetchSubsheets]);

  useEffect(() => {
    fetchSubparts();
  }, [fetchSubparts]);

  // Reset navigation indices when data changes
  useEffect(() => {
    if (releases.length > 0 && currentReleaseIndex >= releases.length) {
      setCurrentReleaseIndex(0);
    }
  }, [releases.length, currentReleaseIndex]);

  useEffect(() => {
    if (subsheets.length > 0 && currentSubsheetIndex >= subsheets.length) {
      setCurrentSubsheetIndex(0);
    }
  }, [subsheets.length, currentSubsheetIndex]);

  useEffect(() => {
    if (subparts.length > 0 && currentSubpartIndex >= subparts.length) {
      setCurrentSubpartIndex(0);
    }
  }, [subparts.length, currentSubpartIndex]);

  // Restore and maintain hierarchy based on current filter
  useEffect(() => {
    if (!currentFilter?.type || !currentFilter?.id) return;

    if (currentFilter.type === 'release') {
      const index = releases.findIndex(r => r.release_id === currentFilter.id);
      if (index !== -1) {
        setCurrentReleaseIndex(index);
        // Ensure the release is expanded to show its subsheets
        if (selectedReleaseId !== currentFilter.id) {
          setSelectedReleaseId(currentFilter.id);
        }
      }
    }
  }, [currentFilter, releases]);

  useEffect(() => {
    if (!currentFilter?.type || !currentFilter?.id) return;

    if (currentFilter.type === 'subsheet') {
      // First find the subsheet and ensure its parent release data is loaded
      const findSubsheetAndExpand = async () => {
        if (subsheets.length === 0) {
          // If subsheets aren't loaded, we need to find the parent release first
          const { data: subsheetData } = await supabase
            .from('leadsmart_subsheets')
            .select('subsheet_id, rel_release_id')
            .eq('subsheet_id', currentFilter.id)
            .single();
          
          if (subsheetData?.rel_release_id) {
            setSelectedReleaseId(subsheetData.rel_release_id);
          }
        } else {
          const index = subsheets.findIndex(s => s.subsheet_id === currentFilter.id);
          if (index !== -1) {
            setCurrentSubsheetIndex(index);
            const subsheet = subsheets[index];
            if (subsheet.rel_release_id && selectedReleaseId !== subsheet.rel_release_id) {
              setSelectedReleaseId(subsheet.rel_release_id);
            }
          }
        }
      };
      
      findSubsheetAndExpand();
    }
  }, [currentFilter, subsheets, selectedReleaseId, supabase]);

  useEffect(() => {
    if (!currentFilter?.type || !currentFilter?.id) return;

    if (currentFilter.type === 'subpart') {
      const findSubpartAndExpand = async () => {
        if (subparts.length === 0) {
          // If subparts aren't loaded, we need to find the parent hierarchy first
          const { data: subpartData } = await supabase
            .from('leadsmart_subparts')
            .select('subpart_id, rel_subsheet_id')
            .eq('subpart_id', currentFilter.id)
            .single();
          
          if (subpartData?.rel_subsheet_id) {
            setSelectedSubsheetId(subpartData.rel_subsheet_id);
            
            // Also get the grandparent release
            const { data: subsheetData } = await supabase
              .from('leadsmart_subsheets')
              .select('subsheet_id, rel_release_id')
              .eq('subsheet_id', subpartData.rel_subsheet_id)
              .single();
            
            if (subsheetData?.rel_release_id) {
              setSelectedReleaseId(subsheetData.rel_release_id);
            }
          }
        } else {
          const index = subparts.findIndex(s => s.subpart_id === currentFilter.id);
          if (index !== -1) {
            setCurrentSubpartIndex(index);
            const subpart = subparts[index];
            if (subpart.rel_subsheet_id && selectedSubsheetId !== subpart.rel_subsheet_id) {
              setSelectedSubsheetId(subpart.rel_subsheet_id);
            }
          }
        }
      };
      
      findSubpartAndExpand();
    }
  }, [currentFilter, subparts, selectedSubsheetId, supabase]);

  const handleViewChildren = (
    type: 'release' | 'subsheet' | 'subpart',
    id: number
  ) => {
    if (type === 'release') {
      if (selectedReleaseId === id) {
        setSelectedReleaseId(null);
        setSelectedSubsheetId(null);
      } else {
        setSelectedReleaseId(id);
        setSelectedSubsheetId(null);
      }
    } else if (type === 'subsheet') {
      if (selectedSubsheetId === id) {
        setSelectedSubsheetId(null);
      } else {
        setSelectedSubsheetId(id);
      }
    }
  };

  const handleSelectX = async (
    type: 'release' | 'subsheet' | 'subpart',
    id: number
  ) => {
    // Check if clicking the same filter to deselect
    if (currentFilter?.type === type && currentFilter?.id === id) {
      onFilterApply(null, null);
      return;
    }

    // Before applying filter, ensure the hierarchy will be properly expanded
    try {
      if (type === 'release') {
        // Ensure the release is expanded to show subsheets
        setSelectedReleaseId(id);
      } else if (type === 'subsheet') {
        // Find and expand the parent release
        let parentReleaseId: number | null = null;
        
        const subsheet = subsheets.find(s => s.subsheet_id === id);
        if (subsheet?.rel_release_id) {
          parentReleaseId = subsheet.rel_release_id;
        } else {
          // Query database if not in memory
          const { data: subsheetData } = await supabase
            .from('leadsmart_subsheets')
            .select('rel_release_id')
            .eq('subsheet_id', id)
            .single();
          
          parentReleaseId = subsheetData?.rel_release_id || null;
        }
        
        if (parentReleaseId) {
          setSelectedReleaseId(parentReleaseId);
        }
        
      } else if (type === 'subpart') {
        // Find and expand both parent subsheet and grandparent release
        let parentSubsheetId: number | null = null;
        let grandparentReleaseId: number | null = null;
        
        const subpart = subparts.find(s => s.subpart_id === id);
        if (subpart?.rel_subsheet_id) {
          parentSubsheetId = subpart.rel_subsheet_id;
          
          const parentSubsheet = subsheets.find(s => s.subsheet_id === parentSubsheetId);
          if (parentSubsheet?.rel_release_id) {
            grandparentReleaseId = parentSubsheet.rel_release_id;
          }
        }
        
        // If not found in memory, query database
        if (!parentSubsheetId) {
          const { data: subpartData } = await supabase
            .from('leadsmart_subparts')
            .select('rel_subsheet_id')
            .eq('subpart_id', id)
            .single();
          
          parentSubsheetId = subpartData?.rel_subsheet_id || null;
        }
        
        if (parentSubsheetId && !grandparentReleaseId) {
          const { data: subsheetData } = await supabase
            .from('leadsmart_subsheets')
            .select('rel_release_id')
            .eq('subsheet_id', parentSubsheetId)
            .single();
          
          grandparentReleaseId = subsheetData?.rel_release_id || null;
        }
        
        if (parentSubsheetId) {
          setSelectedSubsheetId(parentSubsheetId);
        }
        if (grandparentReleaseId) {
          setSelectedReleaseId(grandparentReleaseId);
        }
      }
      
      // Apply the filter after ensuring hierarchy is expanded
      onFilterApply(type, id);
      
    } catch (error) {
      console.error('Error maintaining hierarchy:', error);
      // Still apply the filter even if hierarchy setup fails
      onFilterApply(type, id);
    }
  };

  // Navigation functions for cycling through sx tiles
  const handleNavigateRelease = (direction: 'prev' | 'next') => {
    if (releases.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentReleaseIndex === 0 ? releases.length - 1 : currentReleaseIndex - 1;
    } else {
      newIndex = currentReleaseIndex === releases.length - 1 ? 0 : currentReleaseIndex + 1;
    }
    
    setCurrentReleaseIndex(newIndex);
    const release = releases[newIndex];
    onFilterApply('release', release.release_id);
  };

  const handleNavigateSubsheet = (direction: 'prev' | 'next') => {
    if (subsheets.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentSubsheetIndex === 0 ? subsheets.length - 1 : currentSubsheetIndex - 1;
    } else {
      newIndex = currentSubsheetIndex === subsheets.length - 1 ? 0 : currentSubsheetIndex + 1;
    }
    
    setCurrentSubsheetIndex(newIndex);
    const subsheet = subsheets[newIndex];
    onFilterApply('subsheet', subsheet.subsheet_id);
  };

  const handleNavigateSubpart = (direction: 'prev' | 'next') => {
    if (subparts.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentSubpartIndex === 0 ? subparts.length - 1 : currentSubpartIndex - 1;
    } else {
      newIndex = currentSubpartIndex === subparts.length - 1 ? 0 : currentSubpartIndex + 1;
    }
    
    setCurrentSubpartIndex(newIndex);
    const subpart = subparts[newIndex];
    onFilterApply('subpart', subpart.subpart_id);
  };

  // Navigation functions for cycling through vc (view children) tiles
  const handleNavigateReleaseVC = (direction: 'prev' | 'next') => {
    if (releases.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentReleaseIndex === 0 ? releases.length - 1 : currentReleaseIndex - 1;
    } else {
      newIndex = currentReleaseIndex === releases.length - 1 ? 0 : currentReleaseIndex + 1;
    }
    
    setCurrentReleaseIndex(newIndex);
    const release = releases[newIndex];
    handleViewChildren('release', release.release_id);
  };

  const handleNavigateSubsheetVC = (direction: 'prev' | 'next') => {
    if (subsheets.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentSubsheetIndex === 0 ? subsheets.length - 1 : currentSubsheetIndex - 1;
    } else {
      newIndex = currentSubsheetIndex === subsheets.length - 1 ? 0 : currentSubsheetIndex + 1;
    }
    
    setCurrentSubsheetIndex(newIndex);
    const subsheet = subsheets[newIndex];
    handleViewChildren('subsheet', subsheet.subsheet_id);
  };

  return (
    <div className="p-4 bg-white border border-gray-300 rounded">
      {/* Flex container with row-based layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Releases Row */}
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'start',
            paddingBottom: '8px',
            borderBottom: (selectedReleaseId && subsheets.length > 0) || (selectedSubsheetId && subparts.length > 0) ? '1px solid black' : 'none'
          }}
        >
        
        {/* ========== RELEASES SECTION ========== */}
        {/* Release Label */}
        <div 
          className="border-2 border-gray-600 bg-gray-100 font-bold text-gray-800 flex items-center"
          style={{ 
            padding: '0px 12px',
            fontSize: '14px',
            minHeight: '24px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>leadsmart_file_releases</span>
          {releases.length > 0 && (
            <>
              <div className="flex items-center ml-2">
                <button
                  className="px-1 py-1 text-sm border rounded-l -mr-px bg-white font-bold text-gray-700"
                  style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px', cursor: 'default' }}
                  title="Select X navigation"
                >
                  sx
                </button>
                <button
                  onClick={() => handleNavigateRelease('prev')}
                  className="px-1 py-1 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
                  style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                  title="Previous release"
                >
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleNavigateRelease('next')}
                  className="px-1 py-1 text-sm border rounded-r cursor-pointer bg-white hover:bg-gray-200"
                  style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                  title="Next release"
                >
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M23 4v6h-6" />
                    <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center ml-2">
                <button
                  className="px-1 py-1 text-sm border rounded-l -mr-px bg-white font-bold text-gray-700"
                  style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px', cursor: 'default' }}
                  title="View Children navigation"
                >
                  vc
                </button>
                <button
                  onClick={() => handleNavigateReleaseVC('prev')}
                  className="px-1 py-1 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
                  style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                  title="Previous release (view children)"
                >
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleNavigateReleaseVC('next')}
                  className="px-1 py-1 text-sm border rounded-r cursor-pointer bg-white hover:bg-gray-200"
                  style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                  title="Next release (view children)"
                >
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M23 4v6h-6" />
                    <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Release Tiles */}
        {releases.map((release) => {
          const isSelectX = currentFilter?.type === 'release' && currentFilter?.id === release.release_id;
          const isViewChildren = selectedReleaseId === release.release_id;
          
          return (
            <table 
              key={release.release_id}
              className="border border-gray-300"
              style={{ 
                fontSize: '16px',
                borderCollapse: 'collapse'
              }}
            >
              <tbody>
                <tr>
                  <td
                    onClick={() => handleSelectX('release', release.release_id)}
                    className={`cursor-pointer text-center transition-colors ${
                      isSelectX 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                    title="Select X - Filter main table"
                  >
                    sx
                  </td>
                  
                  <td
                    onClick={() => handleViewChildren('release', release.release_id)}
                    className={`cursor-pointer text-center transition-colors ${
                      isViewChildren 
                        ? 'bg-green-600 text-white font-bold' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="View Children"
                  >
                    vc - {release.children_count || 0}
                  </td>
                  
                  <td
                    className="text-gray-800 font-bold"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '100px' }}
                  >
                    {release.release_date || 'No date'}
                  </td>
                  
                  <td
                    className="text-center text-gray-700"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="Related rows in leadsmart_zip_based_data"
                  >
                    {release.zip_based_count?.toLocaleString()}
                  </td>
                  
                  <td
                    className="text-center text-gray-700"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="Related rows in leadsmart_transformed"
                  >
                    {release.transformed_count?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          );
        })}
        </div>
        
        {/* ========== SUBSHEETS SECTION ========== */}
        {selectedReleaseId && (
          <div 
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'start',
              paddingTop: '8px',
              paddingBottom: '8px',
              borderBottom: selectedSubsheetId && subparts.length > 0 ? '1px solid black' : 'none'
            }}
          >
            {/* Subsheet Label */}
            <div 
              className="border-2 border-gray-600 bg-gray-100 font-bold text-gray-800 flex items-center"
              style={{ 
                padding: '0px 12px',
                fontSize: '14px',
                minHeight: '24px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>leadsmart_subsheets</span>
              {subsheets.length > 0 && (
                <>
                  <div className="flex items-center ml-2">
                    <button
                      className="px-1 py-1 text-sm border rounded-l -mr-px bg-white font-bold text-gray-700"
                      style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px', cursor: 'default' }}
                      title="Select X navigation"
                    >
                      sx
                    </button>
                    <button
                      onClick={() => handleNavigateSubsheet('prev')}
                      className="px-1 py-1 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
                      style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                      title="Previous subsheet"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M1 4v6h6" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleNavigateSubsheet('next')}
                      className="px-1 py-1 text-sm border rounded-r cursor-pointer bg-white hover:bg-gray-200"
                      style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                      title="Next subsheet"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center ml-2">
                    <button
                      className="px-1 py-1 text-sm border rounded-l -mr-px bg-white font-bold text-gray-700"
                      style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px', cursor: 'default' }}
                      title="View Children navigation"
                    >
                      vc
                    </button>
                    <button
                      onClick={() => handleNavigateSubsheetVC('prev')}
                      className="px-1 py-1 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
                      style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                      title="Previous subsheet (view children)"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M1 4v6h6" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleNavigateSubsheetVC('next')}
                      className="px-1 py-1 text-sm border rounded-r cursor-pointer bg-white hover:bg-gray-200"
                      style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                      title="Next subsheet (view children)"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Subsheet Tiles */}
            {subsheets.map((subsheet) => {
              const isSelectX = currentFilter?.type === 'subsheet' && currentFilter?.id === subsheet.subsheet_id;
              const isViewChildren = selectedSubsheetId === subsheet.subsheet_id;
              
              return (
                <table 
                  key={subsheet.subsheet_id}
                  className="border border-gray-300"
                  style={{ 
                    fontSize: '16px',
                    borderCollapse: 'collapse'
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        onClick={() => handleSelectX('subsheet', subsheet.subsheet_id)}
                        className={`cursor-pointer text-center transition-colors ${
                          isSelectX 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                        title="Select X - Filter main table"
                      >
                        sx
                      </td>
                      
                      <td
                        onClick={() => handleViewChildren('subsheet', subsheet.subsheet_id)}
                        className={`cursor-pointer text-center transition-colors ${
                          isViewChildren 
                            ? 'bg-green-600 text-white font-bold' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="View Children"
                      >
                        vc - {subsheet.children_count || 0}
                      </td>
                      
                      <td
                        className="text-gray-800 font-bold"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '120px' }}
                      >
                        {subsheet.subsheet_name || 'No name'}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_zip_based_data"
                      >
                        {subsheet.zip_based_count?.toLocaleString()}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_transformed"
                      >
                        {subsheet.transformed_count?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })}
          </div>
        )}
        
        {/* ========== SUBPARTS SECTION ========== */}
        {selectedSubsheetId && (
          <div 
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'start',
              paddingTop: '8px'
            }}
          >
            {/* Subpart Label */}
            <div 
              className="border-2 border-gray-600 bg-gray-100 font-bold text-gray-800 flex items-center"
              style={{ 
                padding: '0px 12px',
                fontSize: '14px',
                minHeight: '24px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>leadsmart_subparts</span>
              {subparts.length > 0 && (
                <div className="flex items-center ml-2">
                  <button
                    className="px-1 py-1 text-sm border rounded-l -mr-px bg-white font-bold text-gray-700"
                    style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px', cursor: 'default' }}
                    title="Select X navigation"
                  >
                    sx
                  </button>
                  <button
                    onClick={() => handleNavigateSubpart('prev')}
                    className="px-1 py-1 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
                    style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                    title="Previous subpart"
                  >
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M1 4v6h6" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleNavigateSubpart('next')}
                    className="px-1 py-1 text-sm border rounded-r cursor-pointer bg-white hover:bg-gray-200"
                    style={{ fontSize: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                    title="Next subpart"
                  >
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M23 4v6h-6" />
                      <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {/* Subpart Tiles (no VC column) */}
            {subparts.map((subpart) => {
              const isSelectX = currentFilter?.type === 'subpart' && currentFilter?.id === subpart.subpart_id;
              
              return (
                <table 
                  key={subpart.subpart_id}
                  className="border border-gray-300"
                  style={{ 
                    fontSize: '16px',
                    borderCollapse: 'collapse'
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        onClick={() => handleSelectX('subpart', subpart.subpart_id)}
                        className={`cursor-pointer text-center transition-colors ${
                          isSelectX 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                        title="Select X - Filter main table"
                      >
                        sx
                      </td>
                      
                      <td
                        className="text-gray-800 font-bold"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '120px' }}
                      >
                        {subpart.payout_note || 'No note'}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_zip_based_data"
                      >
                        {subpart.zip_based_count?.toLocaleString()}
                      </td>
                      
                      <td
                        className="text-center text-gray-700"
                        style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                        title="Related rows in leadsmart_transformed"
                      >
                        {subpart.transformed_count?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })}
          </div>
        )}
        
      </div>
      
      {/* Clear filter button */}
      {currentFilter?.type && currentFilter?.id && (
        <div className="mt-4">
          <button
            onClick={() => onFilterApply(null, null)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
}

