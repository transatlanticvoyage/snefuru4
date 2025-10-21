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

  // Copy function for notes
  const handleCopyNotes = async () => {
    const notesText = `NOTE TO SELF NEXT THINGS MUST DO

Add baobab_group_id To ui table plus entire system and use manual sql insert to update from 48 id system
========================================
Update pico cache system to calculate based on baobab group id (must create new db column baobab_group_id for grouping attempts -> integreate column as ui column in morph ui table grid, etc.)

Update Skylab tiles to display from cached info from the new system 
========================================
Add notes to frosty Popup that in future we need invalid header row stuff etc and link to example csv with data format that we want and example data 

/app/(protected)/leadsmart_tank/example_invalid_rows_csv_file/invalid_rows_release_3_2025-10-19 (3).csv


========================================
make note to update the gingko function:
to store all of the rel_ id stuff and baobab stuff just like the current baobab function does (might want to rename baobab function itself since we have db columns named after this that could become part of a broader/shared dynamic between baobab and gingko)

NOTE: gingko means the transform function that runs from plain "transform" function button and was built before baobab - gingko function might not be denoted in the code by this name - it might just be called "transform", etc.`;

    try {
      await navigator.clipboard.writeText(notesText);
      // Could add a toast notification here if desired
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  const [transformStats, setTransformStats] = useState({
    totalRows: 0,
    alreadyTransformed: 0,
    notYetTransformed: 0,
    invalidRows: 0
  });
  const [invalidRowsData, setInvalidRowsData] = useState<any[]>([]);
  const [invalidRowsBreakdown, setInvalidRowsBreakdown] = useState({
    missingCityOnly: 0,
    missingStateOnly: 0,
    missingPayoutOnly: 0,
    missingCityAndState: 0,
    missingCityAndPayout: 0,
    missingStateAndPayout: 0,
    missingAll: 0,
    headerRows: 0
  });
  
  // Left pane view state
  const [leftPaneView, setLeftPaneView] = useState<'grid' | 'tile'>('grid');
  
  // Right pane tab state (tank page only)
  const [rightPaneTab, setRightPaneTab] = useState<'main' | 'delete'>('main');
  
  // Invalid rows standalone check state
  const [showInvalidRowsPopup, setShowInvalidRowsPopup] = useState(false);
  const [checkingInvalidRows, setCheckingInvalidRows] = useState(false);
  
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
      
      // Detailed breakdown of invalid rows
      const breakdown = {
        missingCityOnly: 0,
        missingStateOnly: 0,
        missingPayoutOnly: 0,
        missingCityAndState: 0,
        missingCityAndPayout: 0,
        missingStateAndPayout: 0,
        missingAll: 0,
        headerRows: 0
      };
      
      // Fetch entity data for join columns in CSV
      console.log('📋 Fetching entity data for CSV joins...');
      const { data: allReleases } = await supabase.from('leadsmart_file_releases').select('release_id, release_date');
      const { data: allSubsheets } = await supabase.from('leadsmart_subsheets').select('subsheet_id, subsheet_name');
      const { data: allSubparts } = await supabase.from('leadsmart_subparts').select('subpart_id, payout_note');
      
      // Create lookup maps for fast access
      const releaseMap = new Map((allReleases || []).map(r => [r.release_id, r.release_date]));
      const subsheetMap = new Map((allSubsheets || []).map(s => [s.subsheet_id, s.subsheet_name]));
      const subpartMap = new Map((allSubparts || []).map(p => [p.subpart_id, p.payout_note]));
      
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
        
        // Filter out invalid rows in this batch and collect them with detailed categorization
        const validRows = batchData.filter(row => {
          let isValid = true;
          let invalidReason = '';
          
          const hasCity = row.city_name && row.city_name.trim() !== '';
          const hasState = row.state_code && row.state_code.trim() !== '';
          const hasPayout = row.payout !== null && row.payout !== undefined;
          
          // Check for header rows first (they have values but are headers)
          if (hasCity && hasState) {
            const cityLower = row.city_name.toLowerCase().trim();
            const stateLower = row.state_code.toLowerCase().trim();
            if (cityLower === 'city' || cityLower === 'city_name' || cityLower === 'city name' ||
                stateLower === 'state' || stateLower === 'state_code' || stateLower === 'state_id' || stateLower === 'state abbr') {
              isValid = false;
              invalidReason = 'Header row detected';
              breakdown.headerRows++;
            }
          }
          
          // Check for missing required fields
          if (isValid && (!hasCity || !hasState || !hasPayout)) {
            isValid = false;
            
            // Categorize by specific missing combination
            if (!hasCity && !hasState && !hasPayout) {
              invalidReason = 'Missing all three: city_name, state_code, payout';
              breakdown.missingAll++;
            } else if (!hasCity && !hasState) {
              invalidReason = 'Missing city_name and state_code';
              breakdown.missingCityAndState++;
            } else if (!hasCity && !hasPayout) {
              invalidReason = 'Missing city_name and payout';
              breakdown.missingCityAndPayout++;
            } else if (!hasState && !hasPayout) {
              invalidReason = 'Missing state_code and payout';
              breakdown.missingStateAndPayout++;
            } else if (!hasCity) {
              invalidReason = 'Missing city_name';
              breakdown.missingCityOnly++;
            } else if (!hasState) {
              invalidReason = 'Missing state_code';
              breakdown.missingStateOnly++;
            } else if (!hasPayout) {
              invalidReason = 'Missing payout';
              breakdown.missingPayoutOnly++;
            }
          }
          
          if (!isValid) {
            // Add join data for CSV export
            allInvalidRows.push({ 
              ...row, 
              invalid_reason: invalidReason,
              'join.leadsmart_file_releases.release_date': releaseMap.get(row.rel_release_id) || '',
              'join.leadsmart_subsheets.subsheet_name': subsheetMap.get(row.rel_subsheet_id) || '',
              'join.leadsmart_subparts.payout_note': subpartMap.get(row.rel_subpart_id) || ''
            });
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
      
      // Store detailed breakdown of invalid rows
      setInvalidRowsBreakdown(breakdown);
      
      const checkTime = Date.now() - startTime;
      console.log(`✅ Transform status check complete in ${checkTime}ms`);
      console.log(`   Total: ${count}, Already: ${alreadyTransformedCount}, New: ${notYetTransformedCount}, Invalid: ${totalInvalid}`);
      console.log(`   Invalid rows collected: ${allInvalidRows.length}`);
      console.log(`   Invalid breakdown:`, breakdown);
      
      // Show confirmation popup
      setShowTransformConfirm(true);
      
    } catch (error) {
      console.error('❌ Error checking transform status:', error);
      alert('Failed to check transform status. Check console for details.');
    }
  };
  
  // Check for invalid rows only (without transform status check)
  const handleCheckInvalidRows = async () => {
    if (!selectXType || !selectXId) {
      alert('Please select an item first');
      return;
    }
    
    setCheckingInvalidRows(true);
    
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
      
      console.log(`📊 Checking ${count?.toLocaleString()} rows for invalid data...`);
      
      const batchSize = 1000;
      const totalBatches = Math.ceil((count || 0) / batchSize);
      
      let totalValid = 0;
      let totalInvalid = 0;
      const allInvalidRows: any[] = [];
      
      // Detailed breakdown
      const breakdown = {
        missingCityOnly: 0,
        missingStateOnly: 0,
        missingPayoutOnly: 0,
        missingCityAndState: 0,
        missingCityAndPayout: 0,
        missingStateAndPayout: 0,
        missingAll: 0,
        headerRows: 0
      };
      
      // Fetch entity data for join columns in CSV
      console.log('📋 Fetching entity data for CSV joins...');
      const { data: allReleases } = await supabase.from('leadsmart_file_releases').select('release_id, release_date');
      const { data: allSubsheets } = await supabase.from('leadsmart_subsheets').select('subsheet_id, subsheet_name');
      const { data: allSubparts } = await supabase.from('leadsmart_subparts').select('subpart_id, payout_note');
      
      const releaseMap = new Map((allReleases || []).map(r => [r.release_id, r.release_date]));
      const subsheetMap = new Map((allSubsheets || []).map(s => [s.subsheet_id, s.subsheet_name]));
      const subpartMap = new Map((allSubparts || []).map(p => [p.subpart_id, p.payout_note]));
      
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const startRow = batchNum * batchSize;
        const endRow = startRow + batchSize - 1;
        
        console.log(`📦 Checking batch ${batchNum + 1}/${totalBatches} (rows ${startRow}-${endRow})...`);
        
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
        
        // Check each row for validity
        batchData.forEach(row => {
          const hasCity = row.city_name && row.city_name.trim() !== '';
          const hasState = row.state_code && row.state_code.trim() !== '';
          const hasPayout = row.payout !== null && row.payout !== undefined;
          
          let isValid = true;
          let invalidReason = '';
          
          // Check for header rows first
          if (hasCity && hasState) {
            const cityLower = row.city_name.toLowerCase().trim();
            const stateLower = row.state_code.toLowerCase().trim();
            if (cityLower === 'city' || cityLower === 'city_name' || cityLower === 'city name' ||
                stateLower === 'state' || stateLower === 'state_code' || stateLower === 'state_id' || stateLower === 'state abbr') {
              isValid = false;
              invalidReason = 'Header row detected';
              breakdown.headerRows++;
            }
          }
          
          // Check for missing required fields
          if (isValid && (!hasCity || !hasState || !hasPayout)) {
            isValid = false;
            
            if (!hasCity && !hasState && !hasPayout) {
              invalidReason = 'Missing all three: city_name, state_code, payout';
              breakdown.missingAll++;
            } else if (!hasCity && !hasState) {
              invalidReason = 'Missing city_name and state_code';
              breakdown.missingCityAndState++;
            } else if (!hasCity && !hasPayout) {
              invalidReason = 'Missing city_name and payout';
              breakdown.missingCityAndPayout++;
            } else if (!hasState && !hasPayout) {
              invalidReason = 'Missing state_code and payout';
              breakdown.missingStateAndPayout++;
            } else if (!hasCity) {
              invalidReason = 'Missing city_name';
              breakdown.missingCityOnly++;
            } else if (!hasState) {
              invalidReason = 'Missing state_code';
              breakdown.missingStateOnly++;
            } else if (!hasPayout) {
              invalidReason = 'Missing payout';
              breakdown.missingPayoutOnly++;
            }
          }
          
          if (isValid) {
            totalValid++;
          } else {
            totalInvalid++;
            allInvalidRows.push({ 
              ...row, 
              invalid_reason: invalidReason,
              'join.leadsmart_file_releases.release_date': releaseMap.get(row.rel_release_id) || '',
              'join.leadsmart_subsheets.subsheet_name': subsheetMap.get(row.rel_subsheet_id) || '',
              'join.leadsmart_subparts.payout_note': subpartMap.get(row.rel_subpart_id) || ''
            });
          }
        });
      }
      
      console.log(`✅ Invalid row check complete. Total: ${count}, Valid: ${totalValid}, Invalid: ${totalInvalid}`);
      console.log(`   Invalid breakdown:`, breakdown);
      
      // Store results
      setInvalidRowsData(allInvalidRows);
      setInvalidRowsBreakdown(breakdown);
      setTransformStats({
        totalRows: count || 0,
        alreadyTransformed: 0,
        notYetTransformed: totalValid,
        invalidRows: totalInvalid
      });
      
      // Show popup with results
      setShowInvalidRowsPopup(true);
      
      // Auto-download CSV if invalid rows exist
      if (allInvalidRows.length > 0) {
        setTimeout(() => {
          downloadInvalidRowsCSV();
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Error checking invalid rows:', error);
      alert('Failed to check invalid rows. Check console for details.');
    } finally {
      setCheckingInvalidRows(false);
    }
  };
  
  // Download invalid rows as CSV
  const downloadInvalidRowsCSV = () => {
    if (invalidRowsData.length === 0) {
      alert('No invalid rows to download');
      return;
    }
    
    // Define column order for CSV (with join columns interspersed)
    const columns = [
      'global_row_id',
      'sheet_row_id',
      'zip_code',
      'payout',
      'city_name',
      'state_code',
      'user_id',
      'created_at',
      'updated_at',
      'rel_release_id',
      'join.leadsmart_file_releases.release_date',
      'rel_subsheet_id',
      'join.leadsmart_subsheets.subsheet_name',
      'rel_subpart_id',
      'join.leadsmart_subparts.payout_note',
      'invalid_reason'
    ];
    
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
    
    console.log(`✅ Downloaded CSV with ${invalidRowsData.length} invalid rows (includes join columns)`);
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
          
          // DEFENSIVE CHECK: Validate relationship IDs before grouping
          if (row.rel_release_id === undefined || row.rel_subsheet_id === undefined || row.rel_subpart_id === undefined) {
            console.error('❌ UNDEFINED REL ID DETECTED IN BATCH DATA:', {
              global_row_id: row.global_row_id,
              batch_num: batchNum + 1,
              rel_release_id: row.rel_release_id,
              rel_subsheet_id: row.rel_subsheet_id,
              rel_subpart_id: row.rel_subpart_id,
              city_name: row.city_name,
              state_code: row.state_code,
              payout: row.payout
            });
            totalSkipped++;
            return;
          }

          // Additional check for null values (should not happen per user's investigation)
          if (row.rel_release_id === null || row.rel_subsheet_id === null || row.rel_subpart_id === null) {
            console.error('❌ NULL REL ID DETECTED IN BATCH DATA:', {
              global_row_id: row.global_row_id,
              batch_num: batchNum + 1,
              rel_release_id: row.rel_release_id,
              rel_subsheet_id: row.rel_subsheet_id,
              rel_subpart_id: row.rel_subpart_id
            });
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
    } catch (error) {
      console.error('Error in transform process:', error);
      setTransforming(false);
    }
  };

  // Helper function to re-fetch transformed data count (optimized for large datasets)
  const fetchTransformedDataCount = async () => {
    if (!selectXType || !selectXId) {
      setTransformedDataCount(0);
      return;
    }
    
    try {
      // Count total zip-based data for this selection
      let countQuery = supabase
        .from('leadsmart_zip_based_data')
        .select('*', { count: 'exact', head: true });

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
      const batchSize = 10000;
      const totalBatches = Math.ceil(totalZipRows / batchSize);
      const uniqueTransformedIds = new Set<number>();
      
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const startRow = batchNum * batchSize;
        const endRow = startRow + batchSize - 1;
        
        // Get zip-based data for this batch
        let zipQuery = supabase
          .from('leadsmart_zip_based_data')
          .select('global_row_id');

        if (selectXType === 'release') {
          zipQuery = zipQuery.eq('rel_release_id', selectXId);
        } else if (selectXType === 'subsheet') {
          zipQuery = zipQuery.eq('rel_subsheet_id', selectXId);
        } else if (selectXType === 'subpart') {
          zipQuery = zipQuery.eq('rel_subpart_id', selectXId);
        }
        
        zipQuery = zipQuery.range(startRow, endRow);
        
        const { data: zipData, error: zipError } = await zipQuery;
        if (zipError) throw zipError;
        
        if (zipData && zipData.length > 0) {
          const globalRowIds = zipData.map(row => row.global_row_id);
          
          // Get relations for these global_row_ids
          const { data: relationsData, error: relationsError } = await supabase
            .from('leadsmart_transformed_relations')
            .select('transformed_mundial_id')
            .in('original_global_id', globalRowIds);
          
          if (relationsError) throw relationsError;
          
          relationsData?.forEach((r) => {
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

  // Baobab Transform Handler - Optimized for Performance  
  const handleBaobobTransform = async () => {
    if (!selectXType || !selectXId) {
      alert('Please select an item first');
      return;
    }
    
    if (!user?.id) {
      alert('Please log in to perform transforms');
      return;
    }

    // Check if there are rows to transform
    if (selectXResultCount === 0) {
      alert('No rows selected to transform');
      return;
    }

    // Show confirmation
    if (!confirm(`Start Baobab Transform?\n\nThis will transform ${selectXResultCount.toLocaleString()} rows using the optimized bulk processing approach.\n\nYou can monitor progress at /baobab_reports`)) {
      return;
    }

    try {
      // Create transform attempt record immediately
      const { data: attemptData, error: attemptError } = await supabase
        .from('baobab_transform_attempts')
        .insert([{
          user_id: user.id,
          operation_type: 'transform',
          status: 'pending',
          current_phase: 'initializing',
          overall_progress: 0,
          phase_progress: 0,
          rows_processed: 0,
          rows_validated: 0,
          rows_transformed: 0,
          rows_inserted: 0,
          rows_updated: 0,
          rows_failed: 0,
          operations_per_second: 0,
          error_count: 0,
          batch_size: 5000,
          timeout_minutes: 30,
          auto_resume: false,
          stall_threshold_minutes: 5,
          is_stalled: false,
          operation_logs: [],
          source_table: 'leadsmart_zip_based_data',
          target_table: 'leadsmart_transformed',
          transform_type: selectXType,
          filter_criteria: {
            [`${selectXType}_id`]: selectXId,
            result_count: selectXResultCount
          },
          last_activity_at: new Date().toISOString()
        }])
        .select('baobab_attempt_id')
        .single();

      if (attemptError) {
        console.error('Error creating transform attempt:', attemptError);
        alert('Failed to start transform. Please try again.');
        return;
      }

      const attemptId = attemptData.baobab_attempt_id;
      
      alert(`🌳 Baobab transform started! Monitor progress at /baobab_reports (Attempt #${attemptId})`);
      
      // Close popup
      onClose();
      
      // Start background processing (no await - let it run in background)
      processBaobobTransform(attemptId, selectXType, selectXId, selectXResultCount);
      
    } catch (error) {
      console.error('Error starting baobab transform:', error);
      alert('Failed to start baobab transform. Please try again.');
    }
  };

  // Optimized Background Processing (Restored Original Bulk Approach)
  const processBaobobTransform = async (
    attemptId: number, 
    entityType: 'release' | 'subsheet' | 'subpart', 
    entityId: number, 
    totalRows: number
  ) => {
    try {
      // Update status to in_progress
      await supabase
        .from('baobab_transform_attempts')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          current_phase: 'processing_data',
          overall_progress: 5
        })
        .eq('baobab_attempt_id', attemptId);

      const startTime = Date.now();
      let processedRows = 0;
      let transformedRows = 0;
      const BATCH_SIZE = 5000; // Optimized for performance
      
      console.log(`🌳 Starting Baobab transform with optimized bulk processing (${BATCH_SIZE} batch size)`);
      
      // Step 1: Group data by transformation key using bulk operations
      const globalGroups = new Map<string, { zip_codes: string[], global_row_ids: number[] }>();
      const totalBatches = Math.ceil(totalRows / BATCH_SIZE);
      
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const startRow = batchNum * BATCH_SIZE;
        const endRow = Math.min(startRow + BATCH_SIZE - 1, totalRows - 1);
        
        // Fetch batch data
        let zipQuery = supabase.from('leadsmart_zip_based_data').select('*');
        if (entityType === 'release') {
          zipQuery = zipQuery.eq('rel_release_id', entityId);
        } else if (entityType === 'subsheet') {
          zipQuery = zipQuery.eq('rel_subsheet_id', entityId);  
        } else if (entityType === 'subpart') {
          zipQuery = zipQuery.eq('rel_subpart_id', entityId);
        }
        
        const { data: batchData, error: batchError } = await zipQuery
          .range(startRow, endRow)
          .order('global_row_id');
        
        if (batchError) throw batchError;
        if (!batchData?.length) continue;
        
        // Process batch data
        batchData.forEach((row: any) => {
          processedRows++;
          
          // Validate required fields
          const cityLower = row.city_name?.toLowerCase().trim();
          const stateLower = row.state_code?.toLowerCase().trim();
          
          if (!cityLower || !stateLower || !row.zip_code || !row.payout) {
            return;
          }
          
          // Create grouping key  
          const key = JSON.stringify({
            city_name: cityLower,
            state_code: stateLower,
            payout: row.payout,
            rel_release_id: row.rel_release_id,
            rel_subsheet_id: row.rel_subsheet_id,
            rel_subpart_id: row.rel_subpart_id
          });
          
          if (!globalGroups.has(key)) {
            globalGroups.set(key, { zip_codes: [], global_row_ids: [] });
          }
          
          const group = globalGroups.get(key)!;
          group.zip_codes.push(row.zip_code);
          group.global_row_ids.push(row.global_row_id);
        });
        
        const progress = ((batchNum + 1) / totalBatches) * 50;
        const opsPerSecond = Math.round(processedRows / ((Date.now() - startTime) / 1000));
        
        console.log(`🌳 Processed batch ${batchNum + 1}/${totalBatches} - ${opsPerSecond} ops/sec`);
        
        await supabase
          .from('baobab_transform_attempts')
          .update({
            last_activity_at: new Date().toISOString(),
            overall_progress: Math.min(50, progress),
            rows_processed: processedRows,
            operations_per_second: opsPerSecond,
            current_phase: `Processing batch ${batchNum + 1}/${totalBatches} - ${opsPerSecond} ops/sec`
          })
          .eq('baobab_attempt_id', attemptId);
      }
      
      console.log(`🌳 Grouped ${processedRows} rows into ${globalGroups.size} transformation groups`);
      
      await supabase
        .from('baobab_transform_attempts')
        .update({
          current_phase: 'inserting_transformed_records',
          overall_progress: 55
        })
        .eq('baobab_attempt_id', attemptId);
      
      // Step 2: Process transformations in batches to avoid memory/database limits
      const allRecordsToInsert: any[] = [];
      const globalRowIdToGroupMap = new Map<number, string>();
      
      // Prepare all transformation records
      for (const [keyStr, groupData] of globalGroups) {
        const groupKey = JSON.parse(keyStr);
        
        // Create aggregated zip codes
        const uniqueZipCodes = [...new Set(groupData.zip_codes)].sort();
        const aggregatedZipCodes = uniqueZipCodes.join(',');
        
        // Prepare transformed record with validation
        const transformedRecord = {
          jrel_release_id: groupKey.rel_release_id || null,
          jrel_subsheet_id: groupKey.rel_subsheet_id || null, 
          jrel_subpart_id: groupKey.rel_subpart_id || null,
          city_name: groupKey.city_name,
          state_code: groupKey.state_code,
          aggregated_zip_codes: aggregatedZipCodes,
          payout: parseFloat(groupKey.payout) || 0,
          baobab_attempt_id: attemptId
        };
        
        // Validate required fields
        if (!transformedRecord.city_name || !transformedRecord.state_code) {
          console.warn('🌳 Skipping invalid record - missing city/state:', transformedRecord);
          continue;
        }
        
        allRecordsToInsert.push(transformedRecord);
        
        // Map global_row_ids to this group for relations
        groupData.global_row_ids.forEach(globalRowId => {
          globalRowIdToGroupMap.set(globalRowId, keyStr);
        });
      }
      
      console.log(`🌳 Starting transformation insert: ${allRecordsToInsert.length} records in batches`);
      
      // Insert transformed records in smaller batches
      const INSERT_BATCH_SIZE = 1000;
      const transformBatches = Math.ceil(allRecordsToInsert.length / INSERT_BATCH_SIZE);
      const insertedRecords: any[] = [];
      
      for (let batchNum = 0; batchNum < transformBatches; batchNum++) {
        const batchStart = batchNum * INSERT_BATCH_SIZE;
        const batchEnd = Math.min(batchStart + INSERT_BATCH_SIZE, allRecordsToInsert.length);
        const batchRecords = allRecordsToInsert.slice(batchStart, batchEnd);
        
        console.log(`🌳 Inserting transform batch ${batchNum + 1}/${transformBatches} (${batchRecords.length} records)`);
        
        // Log the first record for debugging
        if (batchNum === 0) {
          console.log('🌳 Sample record being inserted:', JSON.stringify(batchRecords[0], null, 2));
        }
        
        const { data: batchInserted, error: insertError } = await supabase
          .from('leadsmart_transformed')
          .insert(batchRecords)
          .select('mundial_id');
        
        if (insertError) {
          console.error('🌳 Insert error details:', {
            error: insertError,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            batchSize: batchRecords.length,
            batchNumber: batchNum + 1,
            sampleRecord: batchRecords[0]
          });
          
          // Update attempt with specific error info
          await supabase
            .from('baobab_transform_attempts')
            .update({
              status: 'failed',
              error_message: `Insert failed at batch ${batchNum + 1}: ${insertError.message}`,
              error_details: insertError
            })
            .eq('baobab_attempt_id', attemptId);
          
          throw new Error(`Insert failed at batch ${batchNum + 1}: ${insertError.message}`);
        }
        
        if (batchInserted) {
          insertedRecords.push(...batchInserted);
        }
        
        const insertProgress = 60 + ((batchNum + 1) / transformBatches) * 20; // 60-80%
        
        await supabase
          .from('baobab_transform_attempts')
          .update({
            current_phase: `Inserted ${insertedRecords.length}/${allRecordsToInsert.length} transformed records`,
            overall_progress: Math.round(insertProgress),
            rows_inserted: insertedRecords.length
          })
          .eq('baobab_attempt_id', attemptId);
      }
      
      console.log(`🌳 Inserted ${insertedRecords.length} transformed records. Creating relations...`);
      
      await supabase
        .from('baobab_transform_attempts')
        .update({
          current_phase: 'creating_relations',
          overall_progress: 85
        })
        .eq('baobab_attempt_id', attemptId);
      
      // Step 3: Create relations in batches
      const relationsToInsert: any[] = [];
      
      // Map inserted records back to their original groups
      insertedRecords.forEach((record, recordIndex) => {
        const originalRecord = allRecordsToInsert[recordIndex];
        const groupKey = JSON.stringify({
          city_name: originalRecord.city_name,
          state_code: originalRecord.state_code,
          payout: originalRecord.payout,
          rel_release_id: originalRecord.jrel_release_id,
          rel_subsheet_id: originalRecord.jrel_subsheet_id,
          rel_subpart_id: originalRecord.jrel_subpart_id
        });
        
        const groupData = globalGroups.get(groupKey);
        if (groupData) {
          groupData.global_row_ids.forEach(globalRowId => {
            relationsToInsert.push({
              original_global_id: globalRowId,
              transformed_mundial_id: record.mundial_id,
              baobab_attempt_id: attemptId
            });
          });
        }
      });
      
      console.log(`🌳 Creating ${relationsToInsert.length} relations in batches`);
      
      // Insert relations in batches
      const RELATIONS_BATCH_SIZE = 5000;
      const relationsBatches = Math.ceil(relationsToInsert.length / RELATIONS_BATCH_SIZE);
      
      for (let batchNum = 0; batchNum < relationsBatches; batchNum++) {
        const batchStart = batchNum * RELATIONS_BATCH_SIZE;
        const batchEnd = Math.min(batchStart + RELATIONS_BATCH_SIZE, relationsToInsert.length);
        const batchRelations = relationsToInsert.slice(batchStart, batchEnd);
        
        console.log(`🌳 Inserting relations batch ${batchNum + 1}/${relationsBatches} (${batchRelations.length} relations)`);
        
        const { error: relationsError } = await supabase
          .from('leadsmart_transformed_relations')
          .insert(batchRelations);
        
        if (relationsError) {
          console.error('Relations insert error:', relationsError);
          throw relationsError;
        }
        
        const relationsProgress = 85 + ((batchNum + 1) / relationsBatches) * 10; // 85-95%
        
        await supabase
          .from('baobab_transform_attempts')
          .update({
            current_phase: `Created ${Math.min(batchEnd, relationsToInsert.length)}/${relationsToInsert.length} relations`,
            overall_progress: Math.round(relationsProgress)
          })
          .eq('baobab_attempt_id', attemptId);
      }
      
      transformedRows = insertedRecords.length;
      const totalTime = (Date.now() - startTime) / 1000;
      const finalOpsPerSecond = Math.round(processedRows / totalTime);
      
      console.log(`🌳 Baobab transform complete! ${transformedRows} records transformed, ${relationsToInsert.length} relations created in ${totalTime.toFixed(1)}s (${finalOpsPerSecond} ops/sec)`);
      
      // Mark as completed
      await supabase
        .from('baobab_transform_attempts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          overall_progress: 100,
          rows_transformed: transformedRows,
          rows_inserted: transformedRows,
          operations_per_second: finalOpsPerSecond,
          current_phase: `Completed - ${transformedRows} transformed, ${relationsToInsert.length} relations created`
        })
        .eq('baobab_attempt_id', attemptId);
        
    } catch (error) {
      console.error('🌳 Baobab transform error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        error: error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        attemptId: attemptId
      };
      
      console.error('🌳 Full error details:', errorDetails);
      
      await supabase
        .from('baobab_transform_attempts')
        .update({
          status: 'failed',
          last_activity_at: new Date().toISOString(),
          error_message: errorMessage,
          error_details: errorDetails
        })
        .eq('baobab_attempt_id', attemptId);
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
            {/* Header */}
            <div className="p-6 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">🧊 Frosty Select {pageType === 'tank' ? '- tank' : '- morph'}</h2>
                  <p className="text-sm text-gray-600 mt-1">Central component for the "{pageType}" page</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto">
              {leftPaneView === 'grid' ? (
                // Grid View - full selector components
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
                // Tile View - compact tile layout
                <>
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
                </>
              )}
            </div>

            {/* View Toggle at bottom */}
            <div className="p-6 border-t bg-gray-50 flex justify-center space-x-4 flex-shrink-0">
              <button
                onClick={() => setLeftPaneView('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  leftPaneView === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                📊 Grid View
              </button>
              <button
                onClick={() => setLeftPaneView('tile')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  leftPaneView === 'tile'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                🧱 Tile View
              </button>
            </div>
          </div>
          
          {/* Right Pane - Actions */}
          <div className="w-2/5 bg-white flex flex-col">
            {pageType === 'tank' ? (
              // Tank page configuration
              <div className="flex-1 flex flex-col">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-300 bg-gray-50">
                  <button
                    onClick={() => setRightPaneTab('main')}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      rightPaneTab === 'main'
                        ? 'bg-white text-gray-900 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    🏠 Main Actions
                  </button>
                  <button
                    onClick={() => setRightPaneTab('delete')}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      rightPaneTab === 'delete'
                        ? 'bg-white text-gray-900 border-b-2 border-red-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    🗑️ Delete
                  </button>
                </div>
                
                {rightPaneTab === 'main' ? (
                  // Main Actions Tab
                  <div className="p-6 flex-1 overflow-auto">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Actions</h3>
                    
                    {/* Selection Display */}
                    {selectXType && selectXId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-blue-900 mb-2">📋 Currently Selected</h4>
                        <p className="text-blue-800 capitalize">
                          <strong>{selectXType}</strong>: ID #{selectXId}
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          Result Count: <strong>{selectXResultCount.toLocaleString()}</strong> items
                        </p>
                        <p className="text-blue-700 text-sm">
                          Associated Transformed: <strong>{transformedDataCount.toLocaleString()}</strong> records
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <button
                        onClick={handleCheckInvalidRows}
                        disabled={!selectXType || !selectXId || checkingInvalidRows}
                        className="w-full p-3 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors flex items-center justify-center"
                      >
                        {checkingInvalidRows ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Checking Invalid Rows...
                          </>
                        ) : (
                          <>🔍 Check Invalid Rows</>
                        )}
                      </button>

                      <button
                        onClick={handleTransform}
                        disabled={!selectXType || !selectXId || transforming}
                        className="w-full p-3 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors flex items-center justify-center"
                      >
                        {transforming ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Transforming...
                          </>
                        ) : (
                          <>🔄 Transform Data</>
                        )}
                      </button>

                      <button
                        onClick={handleBaobobTransform}
                        disabled={!selectXType || !selectXId || transforming}
                        className="w-full p-3 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors flex items-center justify-center"
                      >
                        {transforming ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Baobab Transforming...
                          </>
                        ) : (
                          <>🌳 Baobab Transform</>
                        )}
                      </button>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-800">Development Notes</h4>
                        <button
                          onClick={handleCopyNotes}
                          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors flex items-center"
                        >
                          📋 Copy Notes
                        </button>
                      </div>
                      
                      <textarea
                        readOnly
                        value={`NOTE TO SELF NEXT THINGS MUST DO

Add baobab_group_id To ui table plus entire system and use manual sql insert to update from 48 id system
========================================
Update pico cache system to calculate based on baobab group id (must create new db column baobab_group_id for grouping attempts -> integreate column as ui column in morph ui table grid, etc.)

Update Skylab tiles to display from cached info from the new system 
========================================
Add notes to frosty Popup that in future we need invalid header row stuff etc and link to example csv with data format that we want and example data 

/app/(protected)/leadsmart_tank/example_invalid_rows_csv_file/invalid_rows_release_3_2025-10-19 (3).csv


========================================
make note to update the gingko function:
to store all of the rel_ id stuff and baobab stuff just like the current baobab function does (might want to rename baobab function itself since we have db columns named after this that could become part of a broader/shared dynamic between baobab and gingko)

NOTE: gingko means the transform function that runs from plain "transform" function button and was built before baobab - gingko function might not be denoted in the code by this name - it might just be called "transform", etc.`}
                        className="w-full h-64 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ 
                          fontSize: '12px',
                          lineHeight: '1.4'
                        }}
                      />
                    </div>
                    
                    {/* Transform Results */}
                    {showTransformResults && (
                      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Transform Results</h4>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {transformResults}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  // Delete Tab
                  <div className="p-6 flex-1 overflow-auto">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">🗑️ Delete Operations</h3>
                    
                    {/* Selection Display for Delete */}
                    {selectXType && selectXId ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-red-900 mb-2">📋 Selected for Deletion</h4>
                        <p className="text-red-800 capitalize">
                          <strong>{selectXType}</strong>: ID #{selectXId}
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          Will delete: <strong>{selectXResultCount.toLocaleString()}</strong> rows from zip-based data
                        </p>
                        {deleteAssociatedData && transformedDataCount > 0 && (
                          <p className="text-red-700 text-sm">
                            + <strong>{transformedDataCount.toLocaleString()}</strong> associated transformed records
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <p className="text-gray-600">Please select a release, subsheet, or subpart to delete.</p>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => setShowFirstDeleteConfirm(true)}
                      disabled={!selectXType || !selectXId || deleting}
                      className="w-full p-3 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors flex items-center justify-center"
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>🗑️ Delete Selected Data</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Morph page configuration
              <div className="p-6 flex-1 overflow-auto">
                <div className="text-gray-500 italic text-sm">
                  Morph page configuration - coming soon
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
