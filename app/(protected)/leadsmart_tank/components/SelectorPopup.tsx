'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SelectorFileReleasesGrid from './SelectorFileReleasesGrid';
import SelectorSubsheetsGrid from './SelectorSubsheetsGrid';
import SelectorSubpartsGrid from './SelectorSubpartsGrid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectorPopup({ isOpen, onClose }: Props) {
  const supabase = createClientComponentClient();
  
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
  const [showTransformConfirm, setShowTransformConfirm] = useState(false);
  const [transformStats, setTransformStats] = useState({
    totalRows: 0,
    alreadyTransformed: 0,
    notYetTransformed: 0,
    invalidRows: 0
  });
  
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
      // If checkbox is checked and there's associated data, delete it first
      if (deleteAssociatedData && transformedDataCount > 0) {
        // Get all global_row_ids from leadsmart_zip_based_data
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
        
        if (zipData && zipData.length > 0) {
          const globalRowIds = zipData.map(row => row.global_row_id);
          
          // Batch queries to avoid URL length limits
          const uniqueTransformedIds = new Set<number>();
          const allRelationIds: number[] = [];
          const batchSize = 500;
          
          for (let i = 0; i < globalRowIds.length; i += batchSize) {
            const batch = globalRowIds.slice(i, i + batchSize);
            
            const { data: relationsData, error: relationsError } = await supabase
              .from('leadsmart_transformed_relations')
              .select('transformed_mundial_id, relation_id')
              .in('original_global_id', batch);
            
            if (relationsError) throw relationsError;
            
            relationsData?.forEach(r => {
              if (r.transformed_mundial_id !== null) {
                uniqueTransformedIds.add(r.transformed_mundial_id);
              }
              allRelationIds.push(r.relation_id);
            });
          }
          
          // Delete from leadsmart_transformed in batches
          if (uniqueTransformedIds.size > 0) {
            const transformedIds = Array.from(uniqueTransformedIds);
            for (let i = 0; i < transformedIds.length; i += batchSize) {
              const batch = transformedIds.slice(i, i + batchSize);
              
              const { error: transformedDeleteError } = await supabase
                .from('leadsmart_transformed')
                .delete()
                .in('mundial_id', batch);
              
              if (transformedDeleteError) throw transformedDeleteError;
            }
          }
          
          // Delete from leadsmart_transformed_relations in batches
          if (allRelationIds.length > 0) {
            for (let i = 0; i < allRelationIds.length; i += batchSize) {
              const batch = allRelationIds.slice(i, i + batchSize);
              
              const { error: relationsDeleteError } = await supabase
                .from('leadsmart_transformed_relations')
                .delete()
                .in('relation_id', batch);
              
              if (relationsDeleteError) throw relationsDeleteError;
            }
          }
        }
      }
      
      // Now delete the main item
      let tableName = '';
      let idColumn = '';
      
      if (selectXType === 'release') {
        tableName = 'leadsmart_file_releases';
        idColumn = 'release_id';
      } else if (selectXType === 'subsheet') {
        tableName = 'leadsmart_subsheets';
        idColumn = 'subsheet_id';
      } else if (selectXType === 'subpart') {
        tableName = 'leadsmart_subparts';
        idColumn = 'subpart_id';
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idColumn, selectXId);
      
      if (error) throw error;
      
      const deletedTransformedMsg = deleteAssociatedData && transformedDataCount > 0 
        ? `\n\nAlso deleted ${transformedDataCount} associated leadsmart_transformed records and their relations.`
        : '';
      
      alert(`Successfully deleted ${selectXType} #${selectXId}${deletedTransformedMsg}`);
      
      // Clear selection
      setSelectXType(null);
      setSelectXId(null);
      setShowSecondDeleteConfirm(false);
      
      // Refresh the grids
      window.location.reload();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete item');
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
    
    try {
      // Fetch all source data
      let zipQuery = supabase.from('leadsmart_zip_based_data').select('*');
      
      if (selectXType === 'release') {
        zipQuery = zipQuery.eq('rel_release_id', selectXId);
      } else if (selectXType === 'subsheet') {
        zipQuery = zipQuery.eq('rel_subsheet_id', selectXId);
      } else if (selectXType === 'subpart') {
        zipQuery = zipQuery.eq('rel_subpart_id', selectXId);
      }
      
      const { data: sourceData, error: sourceError } = await zipQuery;
      if (sourceError) throw sourceError;
      
      if (!sourceData || sourceData.length === 0) {
        alert('No data found for transformation');
        return;
      }
      
      // Filter out invalid rows
      const validRows = sourceData.filter(row => {
        if (!row.city_name || !row.state_code || row.payout === null || row.payout === undefined) {
          return false;
        }
        const cityLower = row.city_name.toLowerCase().trim();
        const stateLower = row.state_code.toLowerCase().trim();
        if (cityLower === 'city' || cityLower === 'city_name' || stateLower === 'state' || stateLower === 'state_code') {
          return false;
        }
        return true;
      });
      
      const invalidRowsCount = sourceData.length - validRows.length;
      
      // Get global_row_ids of valid rows
      const validGlobalRowIds = validRows.map(row => row.global_row_id);
      
      // Check which rows are already transformed (in batches)
      const alreadyTransformedIds = new Set<number>();
      const batchSize = 500;
      
      for (let i = 0; i < validGlobalRowIds.length; i += batchSize) {
        const batch = validGlobalRowIds.slice(i, i + batchSize);
        
        const { data: relationsData, error: relationsError } = await supabase
          .from('leadsmart_transformed_relations')
          .select('original_global_id')
          .in('original_global_id', batch);
        
        if (relationsError) throw relationsError;
        
        relationsData?.forEach(r => {
          alreadyTransformedIds.add(r.original_global_id);
        });
      }
      
      const alreadyTransformedCount = alreadyTransformedIds.size;
      const notYetTransformedCount = validRows.length - alreadyTransformedCount;
      
      // Update stats
      setTransformStats({
        totalRows: sourceData.length,
        alreadyTransformed: alreadyTransformedCount,
        notYetTransformed: notYetTransformedCount,
        invalidRows: invalidRowsCount
      });
      
      // Show confirmation popup
      setShowTransformConfirm(true);
      
    } catch (error) {
      console.error('Error checking transform status:', error);
      alert('Failed to check transform status');
    }
  };
  
  const handleTransform = async () => {
    if (!selectXType || !selectXId) {
      alert('Please select an item first');
      return;
    }
    
    setTransforming(true);
    try {
      // Step 1: Fetch all source data from leadsmart_zip_based_data
      let zipQuery = supabase.from('leadsmart_zip_based_data').select('*');
      
      if (selectXType === 'release') {
        zipQuery = zipQuery.eq('rel_release_id', selectXId);
      } else if (selectXType === 'subsheet') {
        zipQuery = zipQuery.eq('rel_subsheet_id', selectXId);
      } else if (selectXType === 'subpart') {
        zipQuery = zipQuery.eq('rel_subpart_id', selectXId);
      }
      
      const { data: sourceData, error: sourceError } = await zipQuery;
      if (sourceError) throw sourceError;
      
      if (!sourceData || sourceData.length === 0) {
        alert('No data found for transformation');
        setTransforming(false);
        return;
      }
      
      // Step 1.5: Check which rows are already transformed
      const allGlobalRowIds = sourceData.map(row => row.global_row_id);
      const alreadyTransformedIds = new Set<number>();
      const batchSize = 500;
      
      for (let i = 0; i < allGlobalRowIds.length; i += batchSize) {
        const batch = allGlobalRowIds.slice(i, i + batchSize);
        
        const { data: relationsData, error: relationsError } = await supabase
          .from('leadsmart_transformed_relations')
          .select('original_global_id')
          .in('original_global_id', batch);
        
        if (relationsError) throw relationsError;
        
        relationsData?.forEach(r => {
          alreadyTransformedIds.add(r.original_global_id);
        });
      }
      
      // Filter out already transformed rows
      const untransformedData = sourceData.filter(row => !alreadyTransformedIds.has(row.global_row_id));
      
      if (untransformedData.length === 0) {
        alert('All rows have already been transformed. No new data to process.');
        setTransforming(false);
        return;
      }
      
      // Step 2: Group data by city_name, state_code, payout, and the 3 rel_* IDs
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
      
      const groups = new Map<string, GroupData>();
      let skippedRowsCount = 0;
      
      untransformedData.forEach(row => {
        // Skip rows with invalid or missing critical data
        if (!row.city_name || !row.state_code || row.payout === null || row.payout === undefined) {
          console.warn('Skipping row with missing data:', row);
          skippedRowsCount++;
          return;
        }
        
        // Skip rows that look like header rows
        const cityLower = row.city_name.toLowerCase().trim();
        const stateLower = row.state_code.toLowerCase().trim();
        if (cityLower === 'city' || cityLower === 'city_name' || stateLower === 'state' || stateLower === 'state_code') {
          console.warn('Skipping header row:', row);
          skippedRowsCount++;
          return;
        }
        
        const key = JSON.stringify({
          city_name: cityLower,
          state_code: stateLower,
          payout: row.payout,
          rel_release_id: row.rel_release_id,
          rel_subsheet_id: row.rel_subsheet_id,
          rel_subpart_id: row.rel_subpart_id
        });
        
        if (!groups.has(key)) {
          groups.set(key, {
            zip_codes: [],
            global_row_ids: []
          });
        }
        
        const group = groups.get(key)!;
        if (row.zip_code) {
          group.zip_codes.push(row.zip_code);
        }
        group.global_row_ids.push(row.global_row_id);
      });
      
      // Check if we have any valid groups
      if (groups.size === 0) {
        alert('No valid data to transform. All rows were skipped due to missing or invalid data.');
        setTransforming(false);
        return;
      }
      
      // Step 3: Insert into leadsmart_transformed and create relations
      let transformedCount = 0;
      let relationsCount = 0;
      let updatedCount = 0;
      
      for (const [keyStr, groupData] of groups) {
        const groupKey: GroupKey = JSON.parse(keyStr);
        
        // Sort zip codes and prepare as JSONB array
        const aggregatedZipCodes = groupData.zip_codes.sort();
        
        // Prepare data for leadsmart_transformed
        const transformedData = {
          city_name: groupKey.city_name,
          state_code: groupKey.state_code,
          payout: groupKey.payout,
          aggregated_zip_codes_jsonb: aggregatedZipCodes,
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
              aggregated_zip_codes_jsonb: aggregatedZipCodes,
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
      
      const resultMessage = `✅ TRANSFORM COMPLETE!\n\n` +
        `Source Data Analysis:\n` +
        `- ${sourceData.length.toLocaleString()} total rows from leadsmart_zip_based_data\n` +
        `- ${alreadyTransformedIds.size.toLocaleString()} rows already transformed (skipped)\n` +
        `- ${untransformedData.length.toLocaleString()} rows not yet transformed\n` +
        `- ${skippedRowsCount.toLocaleString()} rows skipped (invalid/missing data)\n` +
        `- ${(untransformedData.length - skippedRowsCount).toLocaleString()} valid rows processed\n\n` +
        `Transformed Results:\n` +
        `- ${transformedCount.toLocaleString()} NEW records created in leadsmart_transformed\n` +
        `- ${updatedCount.toLocaleString()} existing records updated in leadsmart_transformed\n` +
        `- ${relationsCount.toLocaleString()} relation records created\n` +
        `- ${groups.size.toLocaleString()} unique city/state/payout combinations\n\n` +
        `Grouping Criteria:\n` +
        `- city_name, state_code, payout, jrel_subpart_id\n\n` +
        `Selection:\n` +
        `- ${selectXType}: #${selectXId}`;
      
      setTransformResults(resultMessage);
      setShowTransformResults(true);
      setShowTransformConfirm(false);
      
      // Refresh transformed data count
      await fetchTransformedDataCount();
      
    } catch (error) {
      console.error('Error transforming data:', error);
      const errorMessage = `❌ TRANSFORM FAILED\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setTransformResults(errorMessage);
      setShowTransformResults(true);
    } finally {
      setTransforming(false);
    }
  };
  
  // Helper function to re-fetch transformed data count
  const fetchTransformedDataCount = async () => {
    if (!selectXType || !selectXId) {
      setTransformedDataCount(0);
      return;
    }
    
    try {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ width: '100vw', height: '100vh' }}>
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Selector Popup</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Two Column Layout - Full Height */}
        <div className="flex h-full" style={{ height: 'calc(100vh - 100px)' }}>
          {/* Left Pane - Grids with counts */}
          <div className="flex-1 bg-white flex flex-col overflow-auto border-r border-gray-300">
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
          </div>

          {/* Right Pane - Selection Info and Actions */}
          <div className="flex-1 bg-gray-50">
            <div className="p-6">
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
                
                {/* Checkbox for deleting associated data */}
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="deleteAssociatedData"
                    checked={deleteAssociatedData}
                    onChange={(e) => setDeleteAssociatedData(e.target.checked)}
                    disabled={transformedDataCount === 0}
                    className={`w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 ${
                      transformedDataCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                  <label 
                    htmlFor="deleteAssociatedData" 
                    className={`text-sm ${
                      transformedDataCount === 0 ? 'text-gray-400' : 'text-gray-700 cursor-pointer'
                    }`}
                  >
                    delete associated rows from leadsmart_transformed and leadsmart_relations
                    {transformedDataCount > 0 && (
                      <span className="ml-2 text-red-600 font-semibold">
                        ({transformedDataCount.toLocaleString()} records)
                      </span>
                    )}
                  </label>
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
                  delete
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
                  You are about to delete:
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 font-medium">
                    {selectXType === 'release' && `Release ID: ${selectXId}`}
                    {selectXType === 'subsheet' && `Subsheet ID: ${selectXId}`}
                    {selectXType === 'subpart' && `Subpart ID: ${selectXId}`}
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    This item has <strong>{selectXResultCount.toLocaleString()} related results</strong> in leadsmart_zip_based_data
                  </p>
                  {deleteAssociatedData && transformedDataCount > 0 && (
                    <p className="text-red-700 text-sm mt-2 font-semibold">
                      ⚠️ Will also delete <strong>{transformedDataCount.toLocaleString()} associated records</strong> from leadsmart_transformed and leadsmart_relations
                    </p>
                  )}
                </div>
                <p className="text-gray-700">
                  This action may affect related records. Are you sure you want to continue?
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
                    <li>Permanently delete {selectXType} #{selectXId}</li>
                    <li>Potentially affect {selectXResultCount.toLocaleString()} related records</li>
                    {deleteAssociatedData && transformedDataCount > 0 && (
                      <li className="font-semibold">Delete {transformedDataCount.toLocaleString()} associated records from leadsmart_transformed and leadsmart_relations</li>
                    )}
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
                      <div className="flex justify-between">
                        <span className="text-gray-700">Invalid/header rows:</span>
                        <span className="font-bold text-red-600">{transformStats.invalidRows.toLocaleString()}</span>
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

