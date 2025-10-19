'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import SelectorFileReleasesGrid from './SelectorFileReleasesGrid';
import SelectorSubsheetsGrid from './SelectorSubsheetsGrid';
import SelectorSubpartsGrid from './SelectorSubpartsGrid';
import TileFileReleasesView from './TileFileReleasesView';
import TileSubsheetsView from './TileSubsheetsView';
import TileSubpartsView from './TileSubpartsView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pageType: 'tank' | 'morph';
}

export default function FrostySelectorPopup({ isOpen, onClose, pageType }: Props) {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);
  const [selectedSubpartId, setSelectedSubpartId] = useState<number | null>(null);
  
  // Global select_x state (only one can be selected across all 3 grids)
  const [selectXType, setSelectXType] = useState<'release' | 'subsheet' | 'subpart' | null>(null);
  const [selectXId, setSelectXId] = useState<number | null>(null);
  const [selectXResultCount, setSelectXResultCount] = useState<number>(0);
  
  // Associated transformed data state
  const [transformedDataCount, setTransformedDataCount] = useState<number>(0);
  const [deleteAssociatedData, setDeleteAssociatedData] = useState<boolean>(true);
  
  // Delete confirmation states
  const [showFirstDeleteConfirm, setShowFirstDeleteConfirm] = useState(false);
  const [showSecondDeleteConfirm, setShowSecondDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Transform states
  const [transforming, setTransforming] = useState(false);
  const [showTransformResults, setShowTransformResults] = useState(false);
  const [transformResults, setTransformResults] = useState('');
  const [currentTransformId, setCurrentTransformId] = useState<number | null>(null);
  const [showTransformConfirm, setShowTransformConfirm] = useState(false);
  const [transformStats, setTransformStats] = useState({
    totalRows: 0,
    alreadyTransformed: 0,
    notYetTransformed: 0,
    invalidRows: 0
  });
  const [invalidRowsData, setInvalidRowsData] = useState<any[]>([]);
  
  // Left pane view state
  const [leftPaneView, setLeftPaneView] = useState<'grid' | 'tile'>('grid');
  
  const handleSelectX = (type: 'release' | 'subsheet' | 'subpart', id: number) => {
    setSelectXType(type);
    setSelectXId(id);
  };
  
  // Fetch result count when select_x changes
  useEffect(() => {
    const fetchResultCount = async () => {
      if (!selectXType || !selectXId) {
        setSelectXResultCount(0);
        return;
      }
      
      try {
        let query = supabase.from('leadsmart_zip_based_data').select('*', { count: 'exact', head: true });
        
        if (selectXType === 'release') {
          query = query.eq('rel_release_id', selectXId);
        } else if (selectXType === 'subsheet') {
          query = query.eq('rel_subsheet_id', selectXId);
        } else if (selectXType === 'subpart') {
          query = query.eq('rel_subpart_id', selectXId);
        }
        
        const { count } = await query;
        setSelectXResultCount(count || 0);
      } catch (error) {
        console.error('Error fetching result count:', error);
        setSelectXResultCount(0);
      }
    };
    
    fetchResultCount();
  }, [selectXType, selectXId, supabase]);
  
  // Fetch count of associated transformed data
  useEffect(() => {
    const fetchCount = async () => {
      if (!selectXType || !selectXId) {
        setTransformedDataCount(0);
        return;
      }
      
      try {
        // First, get all global_row_ids from leadsmart_zip_based_data
        let zipQuery = supabase.from('leadsmart_zip_based_data').select('global_row_id');
        
        if (selectXType === 'release') {
          zipQuery = zipQuery.eq('rel_release_id', selectXId);
        } else if (selectXType === 'subsheet') {
          zipQuery = zipQuery.eq('rel_subsheet_id', selectXId);
        } else if (selectXType === 'subpart') {
          zipQuery = zipQuery.eq('rel_subpart_id', selectXId);
        }
        
        const { data: zipData, error: zipError } = await zipQuery;
        if (zipError) throw zipError;
        
        if (!zipData || zipData.length === 0) {
          setTransformedDataCount(0);
          return;
        }
        
        const globalRowIds = zipData.map(row => row.global_row_id);
        
        // Batch the queries to avoid URL length limits
        const uniqueTransformedIds = new Set<number>();
        const batchSize = 500; // Safe batch size for URL length
        
        for (let i = 0; i < globalRowIds.length; i += batchSize) {
          const batch = globalRowIds.slice(i, i + batchSize);
          
          const { data: relationsData, error: relationsError } = await supabase
            .from('leadsmart_transformed_relations')
            .select('transformed_mundial_id')
            .in('original_global_id', batch);
          
          if (relationsError) throw relationsError;
          
          relationsData?.forEach(r => {
            if (r.transformed_mundial_id !== null) {
              uniqueTransformedIds.add(r.transformed_mundial_id);
            }
          });
        }
        
        setTransformedDataCount(uniqueTransformedIds.size);
      } catch (error) {
        console.error('Error fetching transformed data count:', error);
        setTransformedDataCount(0);
      }
    };
    
    fetchCount();
  }, [selectXType, selectXId, supabase]);
  
  const handleDelete = async () => {
    if (!selectXType || !selectXId) {
      alert('Please select an item first');
      return;
    }
    
    setDeleting(true);
    try {
      // Delete from leadsmart_zip_based_data based on the selected entity
      let relColumn = '';
      
      if (selectXType === 'release') {
        relColumn = 'rel_release_id';
      } else if (selectXType === 'subsheet') {
        relColumn = 'rel_subsheet_id';
      } else if (selectXType === 'subpart') {
        relColumn = 'rel_subpart_id';
      }
      
      // Count rows before deleting
      const { count: beforeCount } = await supabase
        .from('leadsmart_zip_based_data')
        .select('*', { count: 'exact', head: true })
        .eq(relColumn, selectXId);
      
      const rowsToDelete = beforeCount || 0;
      
      if (rowsToDelete === 0) {
        alert(`No rows found in leadsmart_zip_based_data with ${relColumn} = ${selectXId}`);
        setDeleting(false);
        return;
      }
      
      // Delete in batches to avoid timeout
      const batchSize = 1000;
      let totalDeleted = 0;
      
      // Keep deleting until no more rows match
      while (true) {
        const { data: batchData, error: fetchError } = await supabase
          .from('leadsmart_zip_based_data')
          .select('global_row_id')
          .eq(relColumn, selectXId)
          .limit(batchSize);
        
        if (fetchError) throw fetchError;
        
        if (!batchData || batchData.length === 0) break;
        
        const idsToDelete = batchData.map(row => row.global_row_id);
        
        const { error: deleteError } = await supabase
          .from('leadsmart_zip_based_data')
          .delete()
          .in('global_row_id', idsToDelete);
        
        if (deleteError) throw deleteError;
        
        totalDeleted += idsToDelete.length;
        
        console.log(`Deleted batch: ${idsToDelete.length} rows (total so far: ${totalDeleted})`);
      }
      
      alert(`Successfully deleted ${totalDeleted.toLocaleString()} rows from leadsmart_zip_based_data where ${relColumn} = ${selectXId}`);
      
      // Clear selection
      setSelectXType(null);
      setSelectXId(null);
      setShowSecondDeleteConfirm(false);
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete rows from leadsmart_zip_based_data');
    } finally {
      setDeleting(false);
    }
  };
  
  // Check transform status before showing confirmation
  const checkTransformStatus = async () => {
    if (!selectXType || !selectXId) {
      alert('Please select an item first');
      return;
    }
    
    console.log('🔄 FrostySelectorPopup: Checking transform status...');
    const startTime = Date.now();
    
    try {
      // First check row count
      let countQuery = supabase.from('leadsmart_zip_based_data').select('*', { count: 'exact', head: true });
      if (selectXType === 'release') {
        countQuery = countQuery.eq('rel_release_id', selectXId);
      } else if (selectXType === 'subsheet') {
        countQuery = countQuery.eq('rel_subsheet_id', selectXId);
      } else if (selectXType === 'subpart') {
        countQuery = countQuery.eq('rel_subpart_id', selectXId);
      }
      
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      
      console.log(`📊 Found ${count?.toLocaleString()} rows to check`);
      
      // Inform user but don't block (no hard limit)
      if (count && count > 20000) {
        console.warn(`⚠️ Large dataset: ${count.toLocaleString()} rows. Transform will use batch processing.`);
      }
      
      // For large datasets, we'll check status in batches
      console.log('⚡ Checking transform status in batches...');
      const batchSize = 1000;
      const totalBatches = Math.ceil((count || 0) / batchSize);
      
      const alreadyTransformedIds = new Set<number>();
      let totalValid = 0;
      let totalInvalid = 0;
      const allInvalidRows: any[] = [];
      
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const startRow = batchNum * batchSize;
        const endRow = startRow + batchSize - 1;
        
        console.log(`📦 Processing batch ${batchNum + 1}/${totalBatches} (rows ${startRow}-${endRow})...`);
        
        let zipQuery = supabase.from('leadsmart_zip_based_data').select('*');
        if (selectXType === 'release') {
          zipQuery = zipQuery.eq('rel_release_id', selectXId);
        } else if (selectXType === 'subsheet') {
          zipQuery = zipQuery.eq('rel_subsheet_id', selectXId);
        } else if (selectXType === 'subpart') {
          zipQuery = zipQuery.eq('rel_subpart_id', selectXId);
        }
        
        zipQuery = zipQuery.range(startRow, endRow).order('global_row_id', { ascending: false });
        
        const { data: batchData, error: batchError } = await zipQuery;
        if (batchError) throw batchError;
        
        if (!batchData || batchData.length === 0) break;
        
        // Filter out invalid rows in this batch and collect them
        const validRows = batchData.filter(row => {
          let isValid = true;
          let invalidReason = '';
          
          if (!row.city_name || !row.state_code || row.payout === null || row.payout === undefined) {
            isValid = false;
            invalidReason = 'Missing required fields (city_name, state_code, or payout)';
          } else {
            const cityLower = row.city_name.toLowerCase().trim();
            const stateLower = row.state_code.toLowerCase().trim();
            if (cityLower === 'city' || cityLower === 'city_name' || stateLower === 'state' || stateLower === 'state_code') {
              isValid = false;
              invalidReason = 'Header row detected (city/state contains header text)';
            }
          }
          
          if (!isValid) {
            allInvalidRows.push({ ...row, invalid_reason: invalidReason });
          }
          
          return isValid;
        });
        
        totalValid += validRows.length;
        totalInvalid += (batchData.length - validRows.length);
        
        // Check which are already transformed (in batches)
        const validGlobalRowIds = validRows.map(row => row.global_row_id);
        const checkBatchSize = 500;
        
        for (let i = 0; i < validGlobalRowIds.length; i += checkBatchSize) {
          const checkBatch = validGlobalRowIds.slice(i, i + checkBatchSize);
          
          const { data: relationsData, error: relationsError } = await supabase
            .from('leadsmart_transformed_relations')
            .select('original_global_id')
            .in('original_global_id', checkBatch);
          
          if (relationsError) throw relationsError;
          
          relationsData?.forEach(r => {
            alreadyTransformedIds.add(r.original_global_id);
          });
        }
      }
      
      if (count === 0) {
        alert('No data found for transformation');
        return;
      }
      
      const alreadyTransformedCount = alreadyTransformedIds.size;
      const notYetTransformedCount = totalValid - alreadyTransformedCount;
      
      // Update stats
      setTransformStats({
        totalRows: count || 0,
        alreadyTransformed: alreadyTransformedCount,
        notYetTransformed: notYetTransformedCount,
        invalidRows: totalInvalid
      });
      
      // Store invalid rows for CSV download
      setInvalidRowsData(allInvalidRows);
      
      const checkTime = Date.now() - startTime;
      console.log(`✅ Transform status check complete in ${checkTime}ms`);
      console.log(`   Total: ${count}, Already: ${alreadyTransformedCount}, New: ${notYetTransformedCount}, Invalid: ${totalInvalid}`);
      console.log(`   Invalid rows collected: ${allInvalidRows.length}`);
      
      // Show confirmation popup
      setShowTransformConfirm(true);
      
    } catch (error) {
      console.error('❌ Error checking transform status:', error);
      alert('Failed to check transform status. Check console for details.');
    }
  };
  
  // Download invalid rows as CSV
  const downloadInvalidRowsCSV = () => {
    if (invalidRowsData.length === 0) {
      alert('No invalid rows to download');
      return;
    }
    
    // Get all column names from the first row
    const columns = Object.keys(invalidRowsData[0]);
    
    // Create CSV header
    const csvHeader = columns.join(',');
    
    // Create CSV rows
    const csvRows = invalidRowsData.map(row => {
      return columns.map(col => {
        const value = row[col];
        // Escape values that contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    }).join('\n');
    
    // Combine header and rows
    const csv = csvHeader + '\n' + csvRows;
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invalid_rows_${selectXType}_${selectXId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ Downloaded CSV with ${invalidRowsData.length} invalid rows`);
  };
  
  // Helper functions for progress tracking (database version)
  const saveTransformProgress = async (attemptId: number, data: any) => {
    try {
      // Update existing record (record was created at start of handleTransform)
      const { error } = await supabase
        .from('leadsmart_transform_attempts')
        .update({
          ...data,
          last_update_time: new Date().toISOString()
        })
        .eq('attempt_id', attemptId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving transform progress to database:', error);
    }
  };

  const addTransformLog = async (attemptId: number, message: string) => {
    try {
      // Get current logs
      const { data: current } = await supabase
        .from('leadsmart_transform_attempts')
        .select('logs')
        .eq('attempt_id', attemptId)
        .maybeSingle();
      
      const currentLogs = current?.logs || [];
      const newLog = `[${new Date().toLocaleTimeString()}] ${message}`;
      const updatedLogs = [...currentLogs, newLog];
      
      // Update with new log
      const { error } = await supabase
        .from('leadsmart_transform_attempts')
        .update({
          logs: updatedLogs,
          last_update_time: new Date().toISOString()
        })
        .eq('attempt_id', attemptId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding transform log to database:', error);
    }
  };

  const handleTransform = async () => {
    if (!selectXType || !selectXId) {
      alert('Please select an item first');
      return;
    }
    
    if (!user?.id) {
      alert('Please log in to perform transforms');
      return;
    }
    
    console.log('🚀 Starting transformation process with batch processing...');
    const startTime = Date.now();
    
    // Create initial database record and get the auto-generated attempt_id
    let attemptId: number | null = null;
    
    try {
      const selectionType = selectXType === 'release' ? 'rel_release_id' 
        : selectXType === 'subsheet' ? 'rel_subsheet_id' 
        : 'rel_subpart_id';
      
      const { data: newAttempt, error: insertError } = await supabase
        .from('leadsmart_transform_attempts')
        .insert([{
          user_id: user.id,
          selection_type: selectionType,
          selection_id: selectXId,
          entity_type: selectXType,
          entity_id: selectXId,
          status: 'in_progress',
          total_rows: 0,  // Will update shortly
          total_batches: 0,  // Will update shortly
          logs: []
        }])
        .select('attempt_id')
        .single();
      
      if (insertError) throw insertError;
      
      attemptId = newAttempt.attempt_id;
      setCurrentTransformId(attemptId);
      console.log(`📝 Created transform attempt #${attemptId}`);
      
    } catch (error) {
      console.error('❌ Failed to create transform attempt record:', error);
      alert('Failed to initialize transform tracking. Check console for details.');
      setTransforming(false);
      return;
    }
    
    setTransforming(true);
    
    try {
      // Step 1: Get total count
      console.log('📊 Step 1: Getting total row count...');
      let countQuery = supabase.from('leadsmart_zip_based_data').select('*', { count: 'exact', head: true });
      if (selectXType === 'release') {
        countQuery = countQuery.eq('rel_release_id', selectXId);
      } else if (selectXType === 'subsheet') {
        countQuery = countQuery.eq('rel_subsheet_id', selectXId);
      } else if (selectXType === 'subpart') {
        countQuery = countQuery.eq('rel_subpart_id', selectXId);
      }
      
      const { count: totalCount, error: countError } = await countQuery;
      if (countError) throw countError;
      
      console.log(`📈 Total rows to process: ${totalCount?.toLocaleString()}`);
      
      if (!totalCount || totalCount === 0) {
        alert('No data found for transformation');
        setTransforming(false);
        return;
      }
      
      // Update transform tracking with actual counts
      await saveTransformProgress(attemptId, {
        total_rows: totalCount,
        processed_rows: 0,
        current_batch: 0,
        total_batches: Math.ceil(totalCount / 1000)
      });
      
      await addTransformLog(attemptId, `Transform started for ${selectXType} #${selectXId}`);
      await addTransformLog(attemptId, `Total rows to process: ${totalCount.toLocaleString()}`);
      
      // Process in batches (NO HARD LIMIT!)
      const BATCH_SIZE = 1000;
      const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
      console.log(`📦 Will process ${totalBatches} batches of ${BATCH_SIZE} rows each`);
      await addTransformLog(attemptId, `Will process ${totalBatches} batches of ${BATCH_SIZE} rows each`);
      
      // Track global stats
      let totalProcessed = 0;
      let totalAlreadyTransformed = 0;
      let totalSkipped = 0;
      let transformedCount = 0;
      let updatedCount = 0;
      let relationsCount = 0;
      
      // Global groups map (across all batches)
      interface GroupKey {
        city_name: string;
        state_code: string;
        payout: number;
        rel_release_id: number;
        rel_subsheet_id: number;
        rel_subpart_id: number;
      }
      
      interface GroupData {
        zip_codes: string[];
        global_row_ids: number[];
      }
      
      const globalGroups = new Map<string, GroupData>();
      
      // Process each batch
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const startRow = batchNum * BATCH_SIZE;
        const endRow = startRow + BATCH_SIZE - 1;
        const progress = Math.round((batchNum / totalBatches) * 100);
        
        console.log(`📦 Processing batch ${batchNum + 1}/${totalBatches} (${progress}% - rows ${startRow}-${endRow})...`);
        
        // Fetch batch
        let zipQuery = supabase.from('leadsmart_zip_based_data').select('*');
        if (selectXType === 'release') {
          zipQuery = zipQuery.eq('rel_release_id', selectXId);
        } else if (selectXType === 'subsheet') {
          zipQuery = zipQuery.eq('rel_subsheet_id', selectXId);
        } else if (selectXType === 'subpart') {
          zipQuery = zipQuery.eq('rel_subpart_id', selectXId);
        }
        
        zipQuery = zipQuery.range(startRow, endRow).order('global_row_id', { ascending: false });
        
        const { data: batchData, error: batchError } = await zipQuery;
        if (batchError) throw batchError;
        
        if (!batchData || batchData.length === 0) break;
        
        totalProcessed += batchData.length;
        
        // Check which rows in this batch are already transformed
        const batchGlobalRowIds = batchData.map(row => row.global_row_id);
        const alreadyTransformedInBatch = new Set<number>();
        
        const checkBatchSize = 500;
        for (let i = 0; i < batchGlobalRowIds.length; i += checkBatchSize) {
          const checkBatch = batchGlobalRowIds.slice(i, i + checkBatchSize);
          
          const { data: relationsData, error: relationsError } = await supabase
            .from('leadsmart_transformed_relations')
            .select('original_global_id')
            .in('original_global_id', checkBatch);
          
          if (relationsError) throw relationsError;
          
          relationsData?.forEach(r => {
            alreadyTransformedInBatch.add(r.original_global_id);
          });
        }
        
        totalAlreadyTransformed += alreadyTransformedInBatch.size;
        
        // Process untransformed rows in this batch
        batchData.forEach(row => {
          // Skip already transformed
          if (alreadyTransformedInBatch.has(row.global_row_id)) return;
          
          // Skip invalid data
          if (!row.city_name || !row.state_code || row.payout === null || row.payout === undefined) {
            totalSkipped++;
            return;
          }
          
          // Skip header rows
          const cityLower = row.city_name.toLowerCase().trim();
          const stateLower = row.state_code.toLowerCase().trim();
          if (cityLower === 'city' || cityLower === 'city_name' || stateLower === 'state' || stateLower === 'state_code') {
            totalSkipped++;
            return;
          }
          
          // Group by key
          const key = JSON.stringify({
            city_name: cityLower,
            state_code: stateLower,
            payout: row.payout,
            rel_release_id: row.rel_release_id,
            rel_subsheet_id: row.rel_subsheet_id,
            rel_subpart_id: row.rel_subpart_id
          });
          
          if (!globalGroups.has(key)) {
            globalGroups.set(key, {
              zip_codes: [],
              global_row_ids: []
            });
          }
          
          const group = globalGroups.get(key)!;
          if (row.zip_code) {
            group.zip_codes.push(row.zip_code);
          }
          group.global_row_ids.push(row.global_row_id);
        });
        
        console.log(`✅ Batch ${batchNum + 1} complete. Groups so far: ${globalGroups.size}`);
        
        // Update progress after each batch
        await saveTransformProgress(attemptId, {
          processed_rows: totalProcessed,
          current_batch: batchNum + 1,
          groups_created: globalGroups.size,
          already_transformed_rows: totalAlreadyTransformed,
          skipped_rows: totalSkipped,
          last_processed_batch_start_row: startRow,
          last_processed_batch_end_row: endRow,
          resume_from_batch: batchNum + 2
        });
        
        if (batchNum % 10 === 0 || batchNum === totalBatches - 1) {
          await addTransformLog(attemptId, `Batch ${batchNum + 1}/${totalBatches} complete. Processed: ${totalProcessed.toLocaleString()}, Groups: ${globalGroups.size.toLocaleString()}`);
        }
      }
      
      console.log(`📊 All batches processed. Total groups: ${globalGroups.size}`);
      await addTransformLog(attemptId, `All ${totalBatches} batches processed. Total groups: ${globalGroups.size.toLocaleString()}`);
      
      // Check if we have any valid groups
      if (globalGroups.size === 0) {
        alert('No valid data to transform. All rows were already transformed or skipped.');
        setTransforming(false);
        return;
      }
      
      // Step 3: Insert/update transformed records
      console.log(`🔄 Inserting/updating ${globalGroups.size} transformed records...`);
      await addTransformLog(attemptId, `Starting to insert/update ${globalGroups.size.toLocaleString()} groups...`);
      
      let groupNum = 0;
      
      for (const [keyStr, groupData] of globalGroups) {
        groupNum++;
        if (groupNum % 100 === 0) {
          console.log(`   Processing group ${groupNum}/${globalGroups.size}...`);
          
          // Update progress periodically
          await saveTransformProgress(attemptId, {
            transformed_records_new: transformedCount,
            transformed_records_updated: updatedCount,
            relations_created: relationsCount
          });
          
          await addTransformLog(attemptId, `Inserting groups: ${groupNum}/${globalGroups.size} (${Math.round((groupNum / globalGroups.size) * 100)}%)`);
        }
        
        const groupKey: GroupKey = JSON.parse(keyStr);
        
        // Sort zip codes and prepare as JSONB array
        const aggregatedZipCodes = groupData.zip_codes.sort();
        
        // Prepare data for leadsmart_transformed
        const transformedData = {
          city_name: groupKey.city_name,
          state_code: groupKey.state_code,
          payout: groupKey.payout,
          aggregated_zip_codes: aggregatedZipCodes,
          jrel_release_id: groupKey.rel_release_id,
          jrel_subsheet_id: groupKey.rel_subsheet_id,
          jrel_subpart_id: groupKey.rel_subpart_id
        };
        
        // Insert or get existing transformed record
        const { data: existingTransformed, error: checkError } = await supabase
          .from('leadsmart_transformed')
          .select('mundial_id')
          .eq('city_name', groupKey.city_name)
          .eq('state_code', groupKey.state_code)
          .eq('payout', groupKey.payout)
          .eq('jrel_subpart_id', groupKey.rel_subpart_id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        let mundialId: number;
        
        if (existingTransformed) {
          // Update existing record
          const { data: updatedData, error: updateError } = await supabase
            .from('leadsmart_transformed')
            .update({
              aggregated_zip_codes: aggregatedZipCodes,
              jrel_release_id: groupKey.rel_release_id,
              jrel_subsheet_id: groupKey.rel_subsheet_id,
              updated_at: new Date().toISOString()
            })
            .eq('mundial_id', existingTransformed.mundial_id)
            .select('mundial_id')
            .single();
          
          if (updateError) throw updateError;
          mundialId = updatedData.mundial_id;
          updatedCount++;
        } else {
          // Insert new record
          const { data: insertedData, error: insertError } = await supabase
            .from('leadsmart_transformed')
            .insert([transformedData])
            .select('mundial_id')
            .single();
          
          if (insertError) throw insertError;
          mundialId = insertedData.mundial_id;
          transformedCount++;
        }
        
        // Create relation records
        const relationRecords = groupData.global_row_ids.map(globalRowId => ({
          original_global_id: globalRowId,
          transformed_mundial_id: mundialId
        }));
        
        const { error: relationsError } = await supabase
          .from('leadsmart_transformed_relations')
          .insert(relationRecords);
        
        if (relationsError) throw relationsError;
        relationsCount += relationRecords.length;
      }
      
      const totalTime = Date.now() - startTime;
      const resultMessage = `✅ TRANSFORM COMPLETE!\n\n` +
        `Source Data Analysis:\n` +
        `- ${totalCount.toLocaleString()} total rows in leadsmart_zip_based_data\n` +
        `- ${totalProcessed.toLocaleString()} rows processed\n` +
        `- ${totalAlreadyTransformed.toLocaleString()} rows already transformed (skipped)\n` +
        `- ${totalSkipped.toLocaleString()} rows skipped (invalid/missing data)\n` +
        `- ${(totalProcessed - totalAlreadyTransformed - totalSkipped).toLocaleString()} valid rows transformed\n\n` +
        `Transformed Results:\n` +
        `- ${transformedCount.toLocaleString()} NEW records created in leadsmart_transformed\n` +
        `- ${updatedCount.toLocaleString()} existing records updated in leadsmart_transformed\n` +
        `- ${relationsCount.toLocaleString()} relation records created\n` +
        `- ${globalGroups.size.toLocaleString()} unique city/state/payout combinations\n\n` +
        `Performance:\n` +
        `- Processed in ${totalBatches} batches of ${BATCH_SIZE} rows\n` +
        `- Total time: ${(totalTime / 1000).toFixed(2)} seconds\n\n` +
        `Grouping Criteria:\n` +
        `- city_name, state_code, payout, jrel_subpart_id\n\n` +
        `Selection:\n` +
        `- ${selectXType}: #${selectXId}`;
      
      console.log(`✅ Transform complete in ${(totalTime / 1000).toFixed(2)}s`);
      await addTransformLog(attemptId, `Transform complete in ${(totalTime / 1000).toFixed(2)}s`);
      await addTransformLog(attemptId, `NEW records: ${transformedCount.toLocaleString()}, UPDATED: ${updatedCount.toLocaleString()}, Relations: ${relationsCount.toLocaleString()}`);
      
      // Calculate performance metrics
      const durationSeconds = totalTime / 1000;
      const rowsPerSecond = totalProcessed / durationSeconds;
      const avgBatchTime = durationSeconds / totalBatches;
      
      // Mark as completed
      await saveTransformProgress(attemptId, {
        status: 'completed',
        end_time: new Date().toISOString(),
        processed_rows: totalProcessed,
        current_batch: totalBatches,
        groups_created: globalGroups.size,
        transformed_records_new: transformedCount,
        transformed_records_updated: updatedCount,
        relations_created: relationsCount,
        already_transformed_rows: totalAlreadyTransformed,
        skipped_rows: totalSkipped,
        rows_per_second: rowsPerSecond,
        avg_batch_time_seconds: avgBatchTime
      });
      
      setTransformResults(resultMessage);
      setShowTransformResults(true);
      setShowTransformConfirm(false);
      
      // Refresh transformed data count
      await fetchTransformedDataCount();
      
    } catch (error) {
      console.error('Error transforming data:', error);
      const errorMessage = `❌ TRANSFORM FAILED\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Mark as failed
      await saveTransformProgress(attemptId, {
        status: 'failed',
        end_time: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      });
      
      await addTransformLog(attemptId, `❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      setTransformResults(errorMessage);
      setShowTransformResults(true);
    } finally {
      setTransforming(false);
      setCurrentTransformId(null);
    }
  };
  
  // Helper function to re-fetch transformed data count (optimized for large datasets)
  const fetchTransformedDataCount = async () => {
    if (!selectXType || !selectXId) {
      setTransformedDataCount(0);
      return;
    }
    
    try {
      console.log('📊 Fetching transformed data count...');
      
      // Get total count of zip_based_data rows
      let countQuery = supabase.from('leadsmart_zip_based_data').select('*', { count: 'exact', head: true });
      
      if (selectXType === 'release') {
        countQuery = countQuery.eq('rel_release_id', selectXId);
      } else if (selectXType === 'subsheet') {
        countQuery = countQuery.eq('rel_subsheet_id', selectXId);
      } else if (selectXType === 'subpart') {
        countQuery = countQuery.eq('rel_subpart_id', selectXId);
      }
      
      const { count: totalZipRows, error: countError } = await countQuery;
      if (countError) throw countError;
      
      if (!totalZipRows || totalZipRows === 0) {
        setTransformedDataCount(0);
        return;
      }
      
      // Process in batches to find transformed rows
      const BATCH_SIZE = 1000;
      const totalBatches = Math.ceil(totalZipRows / BATCH_SIZE);
      const uniqueTransformedIds = new Set<number>();
      
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const startRow = batchNum * BATCH_SIZE;
        const endRow = startRow + BATCH_SIZE - 1;
        
        let zipQuery = supabase.from('leadsmart_zip_based_data').select('global_row_id');
        if (selectXType === 'release') {
          zipQuery = zipQuery.eq('rel_release_id', selectXId);
        } else if (selectXType === 'subsheet') {
          zipQuery = zipQuery.eq('rel_subsheet_id', selectXId);
        } else if (selectXType === 'subpart') {
          zipQuery = zipQuery.eq('rel_subpart_id', selectXId);
        }
        
        zipQuery = zipQuery.range(startRow, endRow);
        
        const { data: zipBatch, error: zipError } = await zipQuery;
        if (zipError) throw zipError;
        
        if (!zipBatch || zipBatch.length === 0) break;
        
        const globalRowIds = zipBatch.map(row => row.global_row_id);
        
        // Check relations in sub-batches (to avoid URL length limits)
        const subBatchSize = 500;
        for (let i = 0; i < globalRowIds.length; i += subBatchSize) {
          const subBatch = globalRowIds.slice(i, i + subBatchSize);
          
          const { data: relationsData, error: relationsError } = await supabase
            .from('leadsmart_transformed_relations')
            .select('transformed_mundial_id')
            .in('original_global_id', subBatch);
          
          if (relationsError) throw relationsError;
          
          relationsData?.forEach(r => {
            if (r.transformed_mundial_id !== null) {
              uniqueTransformedIds.add(r.transformed_mundial_id);
            }
          });
        }
      }
      
      console.log(`✅ Found ${uniqueTransformedIds.size} transformed records`);
      setTransformedDataCount(uniqueTransformedIds.size);
    } catch (error) {
      console.error('❌ Error fetching transformed data count:', error);
      setTransformedDataCount(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ width: '100vw', height: '100vh' }}>
        {/* Two Column Layout - Full Height */}
        <div className="flex h-full">
          {/* Left Pane - Grids with counts */}
          <div className="flex-1 bg-white flex flex-col overflow-auto border-r border-gray-300">
            {/* Header - now part of left pane */}
            <div className="p-6 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-800">FrostySelectorPopup</span>
                  <span className="text-sm text-gray-600 ml-2">(central component for the "tank" and "morph" pages)</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Tab System */}
            <div className="flex border-b border-gray-300 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setLeftPaneView('grid')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  leftPaneView === 'grid'
                    ? 'bg-white text-gray-900 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setLeftPaneView('tile')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  leftPaneView === 'tile'
                    ? 'bg-white text-gray-900 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Tile View
              </button>
            </div>
            
            {/* Tab Content */}
            {leftPaneView === 'grid' ? (
              <>
                <SelectorFileReleasesGrid 
                  onReleaseSelect={setSelectedReleaseId}
                  selectXType={selectXType}
                  selectXId={selectXId}
                  onSelectX={handleSelectX}
                />
                <SelectorSubsheetsGrid 
                  selectedReleaseId={selectedReleaseId} 
                  onSubsheetSelect={setSelectedSubsheetId}
                  selectXType={selectXType}
                  selectXId={selectXId}
                  onSelectX={handleSelectX}
                />
                <SelectorSubpartsGrid 
                  selectedSubsheetId={selectedSubsheetId}
                  onSubpartSelect={setSelectedSubpartId}
                  selectXType={selectXType}
                  selectXId={selectXId}
                  onSelectX={handleSelectX}
                />
              </>
            ) : (
              // Tile View - compact mini-tables
              <div className="flex-1 overflow-auto">
                <TileFileReleasesView
                  onReleaseSelect={setSelectedReleaseId}
                  selectXType={selectXType}
                  selectXId={selectXId}
                  onSelectX={handleSelectX}
                />
                <TileSubsheetsView
                  selectedReleaseId={selectedReleaseId}
                  onSubsheetSelect={setSelectedSubsheetId}
                  selectXType={selectXType}
                  selectXId={selectXId}
                  onSelectX={handleSelectX}
                />
                <TileSubpartsView
                  selectedSubsheetId={selectedSubsheetId}
                  onSubpartSelect={setSelectedSubpartId}
                  selectXType={selectXType}
                  selectXId={selectXId}
                  onSelectX={handleSelectX}
                />
              </div>
            )}
          </div>

          {/* Right Pane - Selection Info and Actions */}
          <div className="flex-1 bg-gray-50 flex flex-col">
            {/* Config Header Bar */}
            <div className="bg-black text-white px-6 py-3 font-mono text-sm">
              selector popup component configured for: /{pageType === 'tank' ? 'leadsmart_tank' : 'leadsmart_morph'}
            </div>
            
            {pageType === 'tank' ? (
              // Tank page configuration - original transform logic
              <div className="p-6 flex-1 overflow-auto">
                <div className="font-bold text-gray-800 mb-4" style={{ fontSize: '16px' }}>
                  from select_x system:
                </div>
              
              {selectXType && selectXId ? (
                <div className="mb-6">
                  <div className="text-lg text-gray-800 mb-2">
                    {selectXType === 'release' && `release_id - ${selectXId} - ${selectXResultCount.toLocaleString()} results`}
                    {selectXType === 'subsheet' && `subsheet_id - ${selectXId} - ${selectXResultCount.toLocaleString()} results`}
                    {selectXType === 'subpart' && `subpart_id - ${selectXId} - ${selectXResultCount.toLocaleString()} results`}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic mb-6">
                  No selection made yet. Click select_x on any item.
                </div>
              )}
              
              <div className="space-y-3">
                <hr className="border-gray-300" />
                
                {/* Info about what will be deleted */}
                <div className="py-2 px-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Delete (method 1):</strong> Deletes rows from <span className="font-mono text-xs">leadsmart_zip_based_data</span> where the selected entity's rel_* column matches.
                  </p>
                  {selectXResultCount > 0 && (
                    <p className="text-sm text-red-600 font-semibold mt-1">
                      ⚠️ Will delete {selectXResultCount.toLocaleString()} rows
                    </p>
                  )}
                </div>
                
                <hr className="border-gray-300" />
                
                <button
                  onClick={() => {
                    if (!selectXType || !selectXId) {
                      alert('Please select an item first');
                      return;
                    }
                    setShowFirstDeleteConfirm(true);
                  }}
                  disabled={!selectXType || !selectXId}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    selectXType && selectXId
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  delete (method 1)
                </button>
                
                <button
                  onClick={checkTransformStatus}
                  disabled={!selectXType || !selectXId || transforming}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    selectXType && selectXId && !transforming
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {transforming ? 'Transforming...' : 'transform'}
                </button>
                
                <button
                  onClick={() => {
                    if (!selectXType || !selectXId) {
                      alert('Please select an item first');
                      return;
                    }
                    // Dispatch event to jettison table
                    window.dispatchEvent(new CustomEvent('jettison-filter-apply', {
                      detail: { type: selectXType, id: selectXId }
                    }));
                    // Close selector popup
                    onClose();
                  }}
                  disabled={!selectXType || !selectXId}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    selectXType && selectXId
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  filter main ui table
                </button>
              </div>
            </div>
            ) : (
              // Morph page configuration - blank for now
              <div className="p-6 flex-1 overflow-auto">
                <div className="text-gray-500 italic text-sm">
                  Morph page configuration - coming soon
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* First Delete Confirmation Popup */}
      {showFirstDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">⚠️ Warning: Deletion Requested</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  <strong>Delete (method 1)</strong> will delete rows from <span className="font-mono text-xs">leadsmart_zip_based_data</span> based on your selection:
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 font-medium">
                    {selectXType === 'release' && `Selected: Release ID ${selectXId}`}
                    {selectXType === 'subsheet' && `Selected: Subsheet ID ${selectXId}`}
                    {selectXType === 'subpart' && `Selected: Subpart ID ${selectXId}`}
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    Will delete <strong>{selectXResultCount.toLocaleString()} rows</strong> from leadsmart_zip_based_data where 
                    {selectXType === 'release' && ` rel_release_id = ${selectXId}`}
                    {selectXType === 'subsheet' && ` rel_subsheet_id = ${selectXId}`}
                    {selectXType === 'subpart' && ` rel_subpart_id = ${selectXId}`}
                  </p>
                </div>
                <p className="text-gray-700">
                  This will <strong>NOT</strong> delete the entity itself (release/subsheet/subpart). Are you sure you want to continue?
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowFirstDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowFirstDeleteConfirm(false);
                    setShowSecondDeleteConfirm(true);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-md transition-colors font-medium"
                >
                  I Understand, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Second Delete Confirmation Popup */}
      {showSecondDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">🚨 Final Confirmation Required</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  <strong>This is your last chance to cancel!</strong>
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 font-medium mb-2">Clicking "Yes, Delete Now" will:</p>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li className="font-semibold">Delete {selectXResultCount.toLocaleString()} rows from leadsmart_zip_based_data where 
                    {selectXType === 'release' && ` rel_release_id = ${selectXId}`}
                    {selectXType === 'subsheet' && ` rel_subsheet_id = ${selectXId}`}
                    {selectXType === 'subpart' && ` rel_subpart_id = ${selectXId}`}
                    </li>
                    <li>NOT delete the {selectXType} entity itself (#{selectXId})</li>
                    <li>Cannot be undone once completed</li>
                  </ul>
                </div>
                <p className="text-gray-700 font-medium">
                  Are you absolutely sure you want to proceed?
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSecondDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors font-medium disabled:bg-red-400"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Transform Confirmation Popup */}
      {showTransformConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">🔄 Transform Data Confirmation</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4 font-medium">
                  Review the transformation statistics before proceeding:
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total rows in selection:</span>
                      <span className="font-bold text-gray-900">{transformStats.totalRows.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Already transformed:</span>
                      <span className="font-bold text-orange-600">{transformStats.alreadyTransformed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Not yet transformed:</span>
                      <span className="font-bold text-green-600">{transformStats.notYetTransformed.toLocaleString()}</span>
                    </div>
                    {transformStats.invalidRows > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Invalid/header rows:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-600">{transformStats.invalidRows.toLocaleString()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadInvalidRowsCSV();
                            }}
                            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors"
                            title="Download invalid rows as CSV"
                          >
                            📥 CSV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {transformStats.alreadyTransformed > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-yellow-800 font-semibold text-sm mb-1">Warning: Some rows already transformed</p>
                        <p className="text-yellow-700 text-sm">
                          {transformStats.alreadyTransformed.toLocaleString()} row{transformStats.alreadyTransformed !== 1 ? 's have' : ' has'} already been transformed and will be skipped to prevent duplicates.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {transformStats.notYetTransformed === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-red-800 font-semibold">⚠️ No new rows to transform!</p>
                    <p className="text-red-700 text-sm mt-1">
                      All valid rows have already been transformed. There is nothing new to process.
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                  <p className="text-gray-700 text-sm mb-2">
                    <strong>What will happen:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>{transformStats.notYetTransformed.toLocaleString()} rows will be grouped by city/state/payout/subpart</li>
                    <li>Zip codes will be aggregated with "/" separator</li>
                    <li>New records will be created in leadsmart_transformed</li>
                    <li>Relations will be tracked in leadsmart_transformed_relations</li>
                    <li>Source data in leadsmart_zip_based_data will NOT be modified</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTransformConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowTransformConfirm(false);
                    handleTransform();
                  }}
                  disabled={transformStats.notYetTransformed === 0}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    transformStats.notYetTransformed > 0
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {transformStats.notYetTransformed > 0 ? 'Yes, Transform Now' : 'No Rows to Transform'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Transform Results Popup */}
      {showTransformResults && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl" style={{ width: '800px', height: '100vh', maxHeight: '100vh' }}>
            <div className="flex flex-col h-full">
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">Transform Results</h3>
                  <button
                    onClick={() => setShowTransformResults(false)}
                    className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                  {transformResults}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    📊 <strong>View Detailed Reports:</strong> Visit <a href="/leadsmart_treports" className="underline font-semibold hover:text-blue-600">/leadsmart_treports</a> to track all transform attempts, monitor progress in real-time, and access detailed diagnostic reports.
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(transformResults);
                      alert('Results copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium transition-colors"
                  >
                    📋 Copy to Clipboard
                  </button>
                  <button
                    onClick={() => {
                      setShowTransformResults(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

