'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const ZhedoriButtonBar = dynamic(
  () => import('@/app/components/ZhedoriButtonBar'),
  { ssr: false }
);

interface BaobobTransformAttempt {
  baobab_attempt_id: number;
  user_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'stalled';
  operation_type: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  last_activity_at: string;
  current_phase?: string;
  overall_progress: number;
  phase_progress: number;
  rows_processed: number;
  rows_validated: number;
  rows_transformed: number;
  rows_inserted: number;
  rows_updated: number;
  rows_failed: number;
  operations_per_second: number;
  estimated_completion_time?: string;
  actual_duration_ms?: number;
  error_message?: string;
  error_details?: any;
  error_count: number;
  batch_size: number;
  timeout_minutes: number;
  auto_resume: boolean;
  stall_threshold_minutes: number;
  is_stalled: boolean;
  stall_detected_at?: string;
  resume_data?: any;
  checkpoint_data?: any;
  operation_logs: any[];
  source_table?: string;
  target_table?: string;
  transform_type?: string;
  filter_criteria?: any;
  transform_summary?: any;
  updated_at: string;
}

export default function BaobobReportsClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [attempts, setAttempts] = useState<BaobobTransformAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Invalid rows popup state
  const [showInvalidRowsPopup, setShowInvalidRowsPopup] = useState(false);
  const [selectedAttemptForInvalidRows, setSelectedAttemptForInvalidRows] = useState<BaobobTransformAttempt | null>(null);
  const [invalidRowsData, setInvalidRowsData] = useState<any[]>([]);
  const [invalidRowsBreakdown, setInvalidRowsBreakdown] = useState<any>({});
  const [invalidRowsStats, setInvalidRowsStats] = useState<any>({});
  const [loadingInvalidRows, setLoadingInvalidRows] = useState(false);

  // Fetch invalid rows for a specific attempt
  const fetchInvalidRowsForAttempt = async (attempt: BaobobTransformAttempt) => {
    if (!user || attempt.status !== 'completed') return;
    
    try {
      setLoadingInvalidRows(true);
      setSelectedAttemptForInvalidRows(attempt);
      
      // Query leadsmart_zip_based_data for records that match the attempt's filter criteria
      // but are NOT in leadsmart_transformed_relations with this baobab_attempt_id
      let baseQuery = supabase
        .from('leadsmart_zip_based_data')
        .select(`
          *,
          leadsmart_file_releases!inner(release_date),
          leadsmart_subsheets!inner(subsheet_name),
          leadsmart_subparts!inner(payout_note)
        `);
      
      // Apply filter criteria from the attempt
      if (attempt.filter_criteria) {
        if (attempt.filter_criteria.release_id) {
          baseQuery = baseQuery.eq('rel_release_id', attempt.filter_criteria.release_id);
        }
        if (attempt.filter_criteria.subsheet_id) {
          baseQuery = baseQuery.eq('rel_subsheet_id', attempt.filter_criteria.subsheet_id);
        }
        if (attempt.filter_criteria.subpart_id) {
          baseQuery = baseQuery.eq('rel_subpart_id', attempt.filter_criteria.subpart_id);
        }
      }
      
      // Get all rows that match the criteria
      const { data: allMatchingRows, error: allRowsError } = await baseQuery;
      if (allRowsError) throw allRowsError;
      
      if (!allMatchingRows || allMatchingRows.length === 0) {
        setInvalidRowsData([]);
        setInvalidRowsBreakdown({});
        setInvalidRowsStats({ totalRows: 0, validRows: 0, invalidRows: 0 });
        setShowInvalidRowsPopup(true);
        return;
      }
      
      // Get global_row_ids that WERE transformed (have relations with this baobab_attempt_id)
      const globalRowIds = allMatchingRows.map(row => row.global_row_id);
      const batchSize = 500; // Avoid URL length limits
      const transformedIds = new Set<number>();
      
      for (let i = 0; i < globalRowIds.length; i += batchSize) {
        const batch = globalRowIds.slice(i, i + batchSize);
        const { data: relations, error: relError } = await supabase
          .from('leadsmart_transformed_relations')
          .select('original_global_id')
          .in('original_global_id', batch)
          .eq('baobab_attempt_id', attempt.baobab_attempt_id);
        
        if (relError) throw relError;
        relations?.forEach(rel => transformedIds.add(rel.original_global_id));
      }
      
      // Find invalid rows (not transformed)
      const invalidRows: any[] = [];
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
      
      allMatchingRows.forEach(row => {
        // Skip if this row was successfully transformed
        if (transformedIds.has(row.global_row_id)) return;
        
        const hasCity = row.city_name && row.city_name.trim() !== '';
        const hasState = row.state_code && row.state_code.trim() !== '';
        const hasPayout = row.payout !== null && row.payout !== undefined;
        
        let invalidReason = '';
        
        // Check for header rows first
        if (hasCity && hasState) {
          const cityLower = row.city_name.toLowerCase().trim();
          const stateLower = row.state_code.toLowerCase().trim();
          if (cityLower === 'city' || cityLower === 'city_name' || cityLower === 'city name' ||
              stateLower === 'state' || stateLower === 'state_code' || stateLower === 'state_id' || stateLower === 'state abbr') {
            invalidReason = 'Header row detected';
            breakdown.headerRows++;
          }
        }
        
        // Check for missing required fields
        if (!invalidReason && (!hasCity || !hasState || !hasPayout)) {
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
        
        if (invalidReason) {
          invalidRows.push({
            ...row,
            invalid_reason: invalidReason,
            'join.leadsmart_file_releases.release_date': row.leadsmart_file_releases?.release_date || '',
            'join.leadsmart_subsheets.subsheet_name': row.leadsmart_subsheets?.subsheet_name || '',
            'join.leadsmart_subparts.payout_note': row.leadsmart_subparts?.payout_note || ''
          });
        }
      });
      
      setInvalidRowsData(invalidRows);
      setInvalidRowsBreakdown(breakdown);
      setInvalidRowsStats({
        totalRows: allMatchingRows.length,
        validRows: transformedIds.size,
        invalidRows: invalidRows.length
      });
      setShowInvalidRowsPopup(true);
      
    } catch (error) {
      console.error('Error fetching invalid rows:', error);
      alert('Failed to fetch invalid rows. Check console for details.');
    } finally {
      setLoadingInvalidRows(false);
    }
  };
  
  // Download invalid rows as CSV
  const downloadInvalidRowsCSV = () => {
    if (invalidRowsData.length === 0 || !selectedAttemptForInvalidRows) {
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
    
    const attemptInfo = selectedAttemptForInvalidRows.transform_type + '_' + 
      (selectedAttemptForInvalidRows.filter_criteria?.release_id || 
       selectedAttemptForInvalidRows.filter_criteria?.subsheet_id || 
       selectedAttemptForInvalidRows.filter_criteria?.subpart_id || 'unknown');
    
    link.setAttribute('download', `invalid_rows_baobab_${selectedAttemptForInvalidRows.baobab_attempt_id}_${attemptInfo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ Downloaded CSV with ${invalidRowsData.length} invalid rows for baobab attempt ${selectedAttemptForInvalidRows.baobab_attempt_id}`);
  };

  // Load transform attempts from database
  const loadAttempts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('baobab_transform_attempts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Detect stalled attempts (no activity in stall_threshold_minutes)
      const now = Date.now();
      const stalledIds: number[] = [];
      
      const updated = (data || []).map((attempt) => {
        if (attempt.status === 'in_progress') {
          const lastActivity = new Date(attempt.last_activity_at).getTime();
          const stallThreshold = attempt.stall_threshold_minutes * 60 * 1000;
          
          if (now - lastActivity > stallThreshold) {
            stalledIds.push(attempt.baobab_attempt_id);
            return { ...attempt, status: 'stalled' as const, is_stalled: true, stall_detected_at: new Date().toISOString() };
          }
        }
        return attempt;
      });
      
      setAttempts(updated);
      
      // Update stalled attempts in database
      if (stalledIds.length > 0) {
        await supabase
          .from('baobab_transform_attempts')
          .update({ 
            status: 'stalled', 
            is_stalled: true, 
            stall_detected_at: new Date().toISOString() 
          })
          .in('baobab_attempt_id', stalledIds);
      }
    } catch (err) {
      console.error('Error loading baobab transform attempts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      router.push('/auth');
      return;
    }

    loadAttempts();
  }, [user, isLoading, router, loadAttempts]);

  // Auto-refresh every 2 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || !user) return;
    
    const interval = setInterval(() => {
      loadAttempts();
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, router, loadAttempts, autoRefresh]);

  // Format duration
  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'stalled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Cancel a running transform
  const handleCancelTransform = async (attemptId: number) => {
    if (!confirm('Cancel this transform? This will stop the background processing.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('baobab_transform_attempts')
        .update({
          status: 'cancelled',
          last_activity_at: new Date().toISOString(),
          current_phase: 'cancelled by user'
        })
        .eq('baobab_attempt_id', attemptId);

      if (error) throw error;
      
      alert('Transform cancelled successfully');
      loadAttempts(); // Refresh the list
    } catch (err) {
      console.error('Error cancelling transform:', err);
      alert('Failed to cancel transform');
    }
  };

  // Delete transformed data for a specific attempt
  const handleDeleteTransformedData = async (attempt: BaobobTransformAttempt) => {
    const confirmMessage = `Delete ALL transformed data for Attempt #${attempt.baobab_attempt_id}?

This will permanently delete:
- Records from leadsmart_transformed_relations
- Records from leadsmart_transformed (if any)

This action CANNOT be undone. Continue?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Get the filter criteria from the attempt
      const filterCriteria = attempt.filter_criteria as any;
      const transformType = attempt.transform_type;
      
      if (!filterCriteria || !transformType) {
        alert('Cannot determine what data to delete - missing filter criteria');
        return;
      }

      // The much simpler approach: delete by baobab_attempt_id!
      // This will delete all relations created by this specific transform attempt
      console.log('Deleting from leadsmart_transformed_relations where baobab_attempt_id =', attempt.baobab_attempt_id);
      
      const { count: relationsCount, error: relationsError } = await supabase
        .from('leadsmart_transformed_relations')
        .delete({ count: 'exact' })
        .eq('baobab_attempt_id', attempt.baobab_attempt_id);
      
      if (relationsError) {
        console.error('Delete error from leadsmart_transformed_relations:', relationsError);
        throw relationsError;
      }
      
      console.log('Deleted', relationsCount, 'relation records');
      let deleteCount = relationsCount || 0;

      // Also delete from leadsmart_transformed based on the transform criteria
      // Get the correct ID from filter criteria
      const releaseId = filterCriteria?.['release_id'] || filterCriteria?.release_id;
      const subsheetId = filterCriteria?.['subsheet_id'] || filterCriteria?.subsheet_id;  
      const subpartId = filterCriteria?.['subpart_id'] || filterCriteria?.subpart_id;

      if (transformType === 'release' && releaseId) {
        console.log('Deleting from leadsmart_transformed where jrel_release_id =', releaseId);
        const { count: transformedCount, error: transformedError } = await supabase
          .from('leadsmart_transformed')
          .delete({ count: 'exact' })
          .eq('jrel_release_id', releaseId);
        
        if (transformedError) {
          console.error('Delete error from leadsmart_transformed:', transformedError);
          throw transformedError;
        }
        console.log('Deleted', transformedCount, 'transformed records');
        deleteCount += transformedCount || 0;

      } else if (transformType === 'subsheet' && subsheetId) {
        console.log('Deleting from leadsmart_transformed where jrel_subsheet_id =', subsheetId);
        const { count: transformedCount, error: transformedError } = await supabase
          .from('leadsmart_transformed')
          .delete({ count: 'exact' })
          .eq('jrel_subsheet_id', subsheetId);
        
        if (transformedError) {
          console.error('Delete error from leadsmart_transformed:', transformedError);
          throw transformedError;
        }
        console.log('Deleted', transformedCount, 'transformed records');
        deleteCount += transformedCount || 0;

      } else if (transformType === 'subpart' && subpartId) {
        console.log('Deleting from leadsmart_transformed where jrel_subpart_id =', subpartId);
        const { count: transformedCount, error: transformedError } = await supabase
          .from('leadsmart_transformed')
          .delete({ count: 'exact' })
          .eq('jrel_subpart_id', subpartId);
        
        if (transformedError) {
          console.error('Delete error from leadsmart_transformed:', transformedError);
          throw transformedError;
        }
        console.log('Deleted', transformedCount, 'transformed records');
        deleteCount += transformedCount || 0;

      } else {
        console.log('No specific transform criteria found, only deleted relations');
      }

      alert(`Successfully deleted ${deleteCount.toLocaleString()} transformed records`);
      
    } catch (err) {
      console.error('Error deleting transformed data:', err);
      console.error('Filter criteria:', attempt.filter_criteria);
      console.error('Transform type:', attempt.transform_type);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to delete transformed data: ${errorMsg}`);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="p-6">
        <ZhedoriButtonBar />
        <div className="mt-8">
          <h1 className="text-3xl font-bold mb-6">Baobab Transform Reports</h1>
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ZhedoriButtonBar />
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Baobab Transform Reports</h1>
            <p className="text-gray-600">
              Monitor background transform operations and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Auto-refresh (2s)</span>
            </label>
            <button
              onClick={loadAttempts}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {attempts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No transform attempts found</p>
            <p className="text-sm text-gray-500">
              Start a baobab transform from /leadsmart_tank or /leadsmart_morph to see monitoring data here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt.baobab_attempt_id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      Transform #{attempt.baobab_attempt_id}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(attempt.status)}`}>
                      {attempt.status.toUpperCase()}
                    </span>
                    {attempt.is_stalled && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border-orange-200">
                        STALLED
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Started: {new Date(attempt.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Progress Bar */}
                {attempt.status === 'in_progress' && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {attempt.current_phase || 'Processing'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {attempt.overall_progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, attempt.overall_progress))}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{attempt.rows_processed.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{attempt.rows_transformed.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Transformed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{attempt.rows_inserted.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Inserted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{attempt.rows_updated.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{attempt.rows_failed.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{attempt.operations_per_second.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Ops/sec</div>
                  </div>
                </div>

                {/* Duration and Status */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                  <div>
                    Duration: {attempt.started_at ? formatDuration(attempt.started_at, attempt.completed_at) : 'Not started'}
                  </div>
                  {attempt.error_message && (
                    <div className="text-red-600 font-medium">
                      Error: {attempt.error_message}
                    </div>
                  )}
                  {attempt.estimated_completion_time && attempt.status === 'in_progress' && (
                    <div>
                      ETA: {new Date(attempt.estimated_completion_time).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {/* Cancel Transform Button - Only show for in_progress or stalled */}
                  {(attempt.status === 'in_progress' || attempt.status === 'stalled') && (
                    <button
                      onClick={() => handleCancelTransform(attempt.baobab_attempt_id)}
                      className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                    >
                      Cancel Transform
                    </button>
                  )}
                  
                  {/* Invalid Rows Report Button - Show for completed attempts */}
                  {attempt.status === 'completed' && (
                    <button
                      onClick={() => fetchInvalidRowsForAttempt(attempt)}
                      disabled={loadingInvalidRows}
                      className={`px-3 py-1.5 text-white text-sm rounded-md transition-colors ${
                        loadingInvalidRows 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {loadingInvalidRows && selectedAttemptForInvalidRows?.baobab_attempt_id === attempt.baobab_attempt_id 
                        ? 'Loading...' 
                        : 'Open Report Popup with Invalid Rows CSV'
                      }
                    </button>
                  )}
                  
                  {/* Delete Transformed Data Button - Show for completed, failed, or cancelled */}
                  {(attempt.status === 'completed' || attempt.status === 'failed' || attempt.status === 'cancelled') && (
                    <button
                      onClick={() => handleDeleteTransformedData(attempt)}
                      className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
                    >
                      Delete Transformed Data
                    </button>
                  )}
                  
                  {/* Info about what will be deleted */}
                  {(attempt.status === 'completed' || attempt.status === 'failed' || attempt.status === 'cancelled') && (
                    <span className="text-xs text-gray-500 self-center ml-2">
                      ({attempt.transform_type} #{attempt.filter_criteria?.['release_id'] || attempt.filter_criteria?.['subsheet_id'] || attempt.filter_criteria?.['subpart_id'] || 'unknown'})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Invalid Rows Analysis Popup */}
      {showInvalidRowsPopup && selectedAttemptForInvalidRows && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Fixed Header */}
            <div className="p-6 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-orange-100 rounded-full p-2 mr-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">📋 Invalid Rows Analysis</h3>
                    <p className="text-sm text-gray-600">
                      Baobab Attempt #{selectedAttemptForInvalidRows.baobab_attempt_id} - {selectedAttemptForInvalidRows.transform_type} #{selectedAttemptForInvalidRows.filter_criteria?.release_id || selectedAttemptForInvalidRows.filter_criteria?.subsheet_id || selectedAttemptForInvalidRows.filter_criteria?.subpart_id || 'unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvalidRowsPopup(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-700 mb-4 font-medium">
                Analysis of rows that were NOT transformed in this baobab attempt:
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total rows in selection:</span>
                    <span className="font-bold text-gray-900">{invalidRowsStats.totalRows?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Successfully transformed:</span>
                    <span className="font-bold text-green-600">{invalidRowsStats.validRows?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-gray-700 font-semibold">Invalid/untransformed rows:</span>
                    <span className="font-bold text-red-600">{invalidRowsStats.invalidRows?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
              
              {invalidRowsStats.invalidRows > 0 && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="font-semibold text-red-800 mb-3">⚠️ Invalid Row Breakdown (remained untransformed):</div>
                    <div className="space-y-2 text-sm">
                      {invalidRowsBreakdown.missingCityOnly > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Missing city_name only:</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.missingCityOnly.toLocaleString()}</span>
                        </div>
                      )}
                      {invalidRowsBreakdown.missingStateOnly > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Missing state_code only:</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.missingStateOnly.toLocaleString()}</span>
                        </div>
                      )}
                      {invalidRowsBreakdown.missingPayoutOnly > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Missing payout only:</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.missingPayoutOnly.toLocaleString()}</span>
                        </div>
                      )}
                      {invalidRowsBreakdown.missingCityAndState > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Missing city_name + state_code:</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.missingCityAndState.toLocaleString()}</span>
                        </div>
                      )}
                      {invalidRowsBreakdown.missingCityAndPayout > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Missing city_name + payout:</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.missingCityAndPayout.toLocaleString()}</span>
                        </div>
                      )}
                      {invalidRowsBreakdown.missingStateAndPayout > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Missing state_code + payout:</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.missingStateAndPayout.toLocaleString()}</span>
                        </div>
                      )}
                      {invalidRowsBreakdown.missingAll > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Missing all three fields:</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.missingAll.toLocaleString()}</span>
                        </div>
                      )}
                      {invalidRowsBreakdown.headerRows > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">• Header rows (e.g. \"City\", \"State\"):</span>
                          <span className="font-semibold text-gray-900">{invalidRowsBreakdown.headerRows.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-yellow-800 text-sm font-semibold">📥 CSV Download</p>
                      <button
                        onClick={downloadInvalidRowsCSV}
                        className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded border border-yellow-300 transition-colors"
                        title="Download invalid rows as CSV"
                      >
                        📥 Download CSV
                      </button>
                    </div>
                    <p className="text-yellow-700 text-xs mb-2">
                      Download CSV with all {invalidRowsStats.invalidRows?.toLocaleString() || 0} invalid rows. The file includes:
                    </p>
                    <ul className="list-disc list-inside text-yellow-700 text-xs ml-2 space-y-1">
                      <li>All source data columns from leadsmart_zip_based_data</li>
                      <li>Join columns (release_date, subsheet_name, payout_note)</li>
                      <li>Invalid reason for each row</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-blue-800 text-sm font-semibold mb-1">💡 Next Steps</p>
                    <p className="text-blue-700 text-xs">
                      • Review the CSV to identify missing data<br/>
                      • Fix data in source (update city_name, state_code, or payout)<br/>
                      • Re-run baobab transform after corrections to process these rows<br/>
                      • OR use SQL to delete invalid rows if they're not needed
                    </p>
                  </div>
                </>
              )}
              
              {invalidRowsStats.invalidRows === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 text-sm font-semibold mb-1">✅ No Invalid Rows Found!</p>
                  <p className="text-green-700 text-xs">
                    All {invalidRowsStats.totalRows?.toLocaleString() || 0} rows in your selection were successfully transformed.
                  </p>
                </div>
              )}
            </div>
            
            {/* Fixed Button Footer */}
            <div className="p-6 border-t bg-gray-50 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInvalidRowsPopup(false)}
                  className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-md font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}