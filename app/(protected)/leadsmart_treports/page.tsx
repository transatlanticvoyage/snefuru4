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

interface TransformAttempt {
  attempt_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  last_update_time: string;
  status: 'in_progress' | 'completed' | 'failed' | 'stalled';
  selection_type: 'rel_release_id' | 'rel_subsheet_id' | 'rel_subpart_id';
  selection_id: number;
  entity_type: 'release' | 'subsheet' | 'subpart';
  entity_id: number;
  total_rows: number;
  processed_rows: number;
  current_batch: number;
  total_batches: number;
  groups_created: number;
  transformed_records_new: number;
  transformed_records_updated: number;
  relations_created: number;
  skipped_rows: number;
  already_transformed_rows: number;
  error_message?: string;
  error_details?: any;
  logs: string[];
  last_processed_batch_start_row?: number;
  last_processed_batch_end_row?: number;
  resume_from_batch?: number;
  rows_per_second?: number;
  avg_batch_time_seconds?: number;
  estimated_completion_time?: string;
}

export default function LeadsmartTreportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [attempts, setAttempts] = useState<TransformAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<TransformAttempt | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Load attempts from database
  const loadAttempts = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch all attempts for current user
      const { data, error } = await supabase
        .from('leadsmart_transform_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      // Detect stalled attempts (no update in 5 minutes)
      const now = Date.now();
      const stalledIds: string[] = [];
      
      const updated = (data || []).map((attempt) => {
        if (attempt.status === 'in_progress') {
          const lastUpdate = new Date(attempt.last_update_time).getTime();
          const timeSinceUpdate = now - lastUpdate;
          
          if (timeSinceUpdate > 5 * 60 * 1000) { // 5 minutes
            stalledIds.push(attempt.attempt_id);
            return { ...attempt, status: 'stalled' as const };
          }
        }
        return attempt;
      });
      
      setAttempts(updated);
      
      // Update stalled attempts in database
      if (stalledIds.length > 0) {
        await supabase
          .from('leadsmart_transform_attempts')
          .update({ status: 'stalled' })
          .in('attempt_id', stalledIds);
      }
    } catch (error) {
      console.error('Error loading attempts from database:', error);
      alert('Failed to load transform attempts. Check console for details.');
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadAttempts();
  }, [user, router, loadAttempts]);

  // Auto-refresh every 2 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadAttempts();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, loadAttempts]);

  const handleClearAll = async () => {
    if (!user) return;
    
    if (confirm('Are you sure you want to clear all transform attempt records? This will delete them from the database.')) {
      try {
        const { error } = await supabase
          .from('leadsmart_transform_attempts')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setAttempts([]);
        setSelectedAttempt(null);
        alert('All transform attempts cleared successfully');
      } catch (error) {
        console.error('Error clearing attempts:', error);
        alert('Failed to clear attempts. Check console for details.');
      }
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (confirm('Delete this transform attempt record from the database?')) {
      try {
        const { error } = await supabase
          .from('leadsmart_transform_attempts')
          .delete()
          .eq('attempt_id', attemptId);
        
        if (error) throw error;
        
        const updated = attempts.filter(a => a.attempt_id !== attemptId);
        setAttempts(updated);
        
        if (selectedAttempt?.attempt_id === attemptId) {
          setSelectedAttempt(null);
        }
        
        alert('Transform attempt deleted successfully');
      } catch (error) {
        console.error('Error deleting attempt:', error);
        alert('Failed to delete attempt. Check console for details.');
      }
    }
  };

  const generateReport = (attempt: TransformAttempt) => {
    const duration = attempt.end_time 
      ? Math.round((new Date(attempt.end_time).getTime() - new Date(attempt.start_time).getTime()) / 1000)
      : Math.round((Date.now() - new Date(attempt.start_time).getTime()) / 1000);
    
    const progress = attempt.total_batches > 0 
      ? Math.round((attempt.current_batch / attempt.total_batches) * 100) 
      : 0;
    
    return `
═══════════════════════════════════════════════════════════════
LEADSMART TRANSFORM REPORT
═══════════════════════════════════════════════════════════════

ATTEMPT ID: ${attempt.attempt_id}
STATUS: ${attempt.status.toUpperCase()}

═══════════════════════════════════════════════════════════════
TIMING
═══════════════════════════════════════════════════════════════
Started:        ${new Date(attempt.start_time).toLocaleString()}
${attempt.end_time ? `Ended:          ${new Date(attempt.end_time).toLocaleString()}` : `Last Update:    ${new Date(attempt.last_update_time).toLocaleString()}`}
Duration:       ${Math.floor(duration / 60)}m ${duration % 60}s
${!attempt.end_time ? `Time Since Update: ${Math.round((Date.now() - new Date(attempt.last_update_time).getTime()) / 1000)}s` : ''}

═══════════════════════════════════════════════════════════════
SOURCE SELECTION
═══════════════════════════════════════════════════════════════
Selection Method: ${attempt.selection_type}
Selection ID:     ${attempt.selection_id}
Entity Type:      ${attempt.entity_type}
Entity ID:        ${attempt.entity_id}

═══════════════════════════════════════════════════════════════
PROGRESS
═══════════════════════════════════════════════════════════════
Total Rows:     ${attempt.total_rows.toLocaleString()}
Processed:      ${attempt.processed_rows.toLocaleString()} / ${attempt.total_rows.toLocaleString()} (${progress}%)
Current Batch:  ${attempt.current_batch} / ${attempt.total_batches}
Batches Left:   ${attempt.total_batches - attempt.current_batch}
${attempt.resume_from_batch ? `Resume From:    Batch ${attempt.resume_from_batch}` : ''}

═══════════════════════════════════════════════════════════════
RESULTS
═══════════════════════════════════════════════════════════════
Groups Created:         ${attempt.groups_created.toLocaleString()}
NEW Transformed:        ${attempt.transformed_records_new.toLocaleString()}
UPDATED Transformed:    ${attempt.transformed_records_updated.toLocaleString()}
Relations Created:      ${attempt.relations_created.toLocaleString()}
Already Transformed:    ${attempt.already_transformed_rows.toLocaleString()}
Skipped (Invalid):      ${attempt.skipped_rows.toLocaleString()}

═══════════════════════════════════════════════════════════════
PERFORMANCE METRICS
═══════════════════════════════════════════════════════════════
Rows/Second:    ${attempt.rows_per_second ? Math.round(attempt.rows_per_second) : (duration > 0 ? Math.round(attempt.processed_rows / duration) : 0)}
Avg Batch Time: ${attempt.avg_batch_time_seconds ? Math.round(attempt.avg_batch_time_seconds) : (attempt.current_batch > 0 ? Math.round(duration / attempt.current_batch) : 0)}s
${attempt.total_batches > attempt.current_batch ? `Est. Remaining: ${Math.round(((attempt.total_batches - attempt.current_batch) * (duration / Math.max(attempt.current_batch, 1))) / 60)}m` : ''}

═══════════════════════════════════════════════════════════════
STATUS DETAILS
═══════════════════════════════════════════════════════════════
${attempt.status === 'stalled' ? `⚠️ STALLED - No updates for ${Math.round((Date.now() - new Date(attempt.last_update_time).getTime()) / 60000)} minutes

POSSIBLE CAUSES:
- Browser tab was backgrounded (throttled)
- Network connection lost
- Database timeout
- Out of memory error
- Browser crashed

RECOMMENDED ACTIONS:
1. Check browser console for errors
2. Check network connection
3. Try filtering to smaller dataset
4. Implement optimizations (bulk inserts, memory management)
5. Run transform on smaller batches using sx filters
` : ''}
${attempt.status === 'failed' ? `❌ FAILED - ${attempt.error_message || 'Unknown error'}

RECOMMENDED ACTIONS:
1. Check error message above
2. Verify database constraints
3. Check data validity
4. Try with smaller batch size
5. Use sx filters to isolate problematic data
` : ''}
${attempt.status === 'completed' ? `✅ COMPLETED SUCCESSFULLY

Transform finished without errors.
All processed rows were transformed and relations created.
` : ''}
${attempt.status === 'in_progress' ? `🔄 IN PROGRESS

Transform is currently running.
Monitor this page for real-time updates.
` : ''}

═══════════════════════════════════════════════════════════════
RESUME COMMAND (If Stalled/Failed)
═══════════════════════════════════════════════════════════════

To continue from where it left off:
1. Open FrostySelectorPopup on tank page
2. Select ${attempt.entity_type} #${attempt.entity_id} with sx
3. Click Transform button
4. System will skip ${attempt.already_transformed_rows.toLocaleString()} already-transformed rows
5. Will process remaining ${(attempt.total_rows - attempt.processed_rows).toLocaleString()} rows

Selection to use: ${attempt.selection_type} = ${attempt.selection_id}

OR use smaller batches:
- Use sx to select smaller entities (individual subsheets/subparts)
- Transform incrementally instead of all at once

═══════════════════════════════════════════════════════════════
DETAILED LOGS
═══════════════════════════════════════════════════════════════
${Array.isArray(attempt.logs) ? attempt.logs.join('\n') : 'No logs available'}

═══════════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════════

Generated: ${new Date().toLocaleString()}
Report ID: ${attempt.attempt_id}
`.trim();
  };

  const copyReport = (attempt: TransformAttempt) => {
    const report = generateReport(attempt);
    navigator.clipboard.writeText(report).then(() => {
      alert('Report copied to clipboard! You can now paste it anywhere.');
    }).catch(() => {
      alert('Failed to copy. Please select and copy the report manually from the detail view.');
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      case 'stalled': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'stalled': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ZhedoriButtonBar />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transform Reports</h1>
          <p className="text-gray-600">
            Monitor and manage transform operations. Track progress, view detailed reports, and resume stalled transforms.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                Auto-refresh (every 2s)
              </label>
            </div>
            
            <button
              onClick={loadAttempts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Refresh Now
            </button>
          </div>
          
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Clear All Records
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Attempts</div>
            <div className="text-2xl font-bold text-gray-900">{attempts.length}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
            <div className="text-sm text-green-700 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-800">
              {attempts.filter(a => a.status === 'completed').length}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
            <div className="text-sm text-blue-700 mb-1">In Progress</div>
            <div className="text-2xl font-bold text-blue-800">
              {attempts.filter(a => a.status === 'in_progress').length}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
            <div className="text-sm text-yellow-700 mb-1">Stalled/Failed</div>
            <div className="text-2xl font-bold text-yellow-800">
              {attempts.filter(a => a.status === 'stalled' || a.status === 'failed').length}
            </div>
          </div>
        </div>

        {/* Attempts List */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Transform Attempts</h2>
            <p className="text-sm text-gray-600 mt-1">
              {attempts.length === 0 ? 'No transform attempts recorded yet.' : `Showing ${attempts.length} attempt(s)`}
            </p>
          </div>
          
          <div className="overflow-auto" style={{ maxHeight: '400px' }}>
            {attempts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No transform attempts yet</p>
                <p className="text-sm">Start a transform from the FrostySelectorPopup to see tracking here</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Results</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Started</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attempts.map((attempt) => {
                    const progress = attempt.total_batches > 0 
                      ? Math.round((attempt.current_batch / attempt.total_batches) * 100) 
                      : 0;
                    
                    return (
                      <tr 
                        key={attempt.attempt_id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedAttempt(attempt)}
                      >
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(attempt.status)}`}>
                            {getStatusIcon(attempt.status)} {attempt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {attempt.attempt_id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {attempt.entity_type} #{attempt.entity_id}
                          <div className="text-xs text-gray-500 mt-1">
                            via {attempt.selection_type}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden" style={{ width: '100px' }}>
                              <div 
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium">{progress}%</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Batch {attempt.current_batch}/{attempt.total_batches}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="text-xs">
                            <div>Groups: {attempt.groups_created.toLocaleString()}</div>
                            <div>New: {attempt.transformed_records_new.toLocaleString()}, Updated: {attempt.transformed_records_updated.toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(attempt.start_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyReport(attempt);
                              }}
                              className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                              title="Copy Report"
                            >
                              📋 Copy
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAttempt(attempt.attempt_id);
                              }}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detailed View */}
        {selectedAttempt && (
          <div className="mt-6 bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Attempt Details: {selectedAttempt.attempt_id.substring(0, 16)}...
              </h2>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={() => copyReport(selectedAttempt)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors"
                >
                  📋 Copy Full Report to Clipboard
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Copy this report to share with support or for debugging
                </p>
              </div>
              
              {/* Report Display */}
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto" style={{ maxHeight: '600px' }}>
                <pre className="whitespace-pre-wrap">{generateReport(selectedAttempt)}</pre>
              </div>
              
              {/* Action Buttons */}
              {(selectedAttempt.status === 'stalled' || selectedAttempt.status === 'failed') && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-bold text-yellow-900 mb-2">⚠️ Transform Incomplete</h3>
                  <p className="text-sm text-yellow-800 mb-4">
                    This transform {selectedAttempt.status === 'stalled' ? 'stalled' : 'failed'} at batch {selectedAttempt.current_batch} of {selectedAttempt.total_batches}.
                    You can resume by running the transform again - it will skip already-transformed rows.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.push('/leadsmart_tank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Go to Tank Page
                    </button>
                    <button
                      onClick={() => {
                        const instructions = `
To resume this transform:
1. Go to /leadsmart_tank page
2. Open FrostySelectorPopup (click "open selector" button)
3. Click sx on ${selectedAttempt.entity_type} #${selectedAttempt.entity_id}
4. Click the "Transform" button
5. System will automatically skip ${selectedAttempt.already_transformed_rows.toLocaleString()} already-transformed rows
6. Will process remaining ${(selectedAttempt.total_rows - selectedAttempt.processed_rows).toLocaleString()} rows

Selection to use: ${selectedAttempt.selection_type} = ${selectedAttempt.selection_id}

Progress so far: ${selectedAttempt.processed_rows.toLocaleString()} / ${selectedAttempt.total_rows.toLocaleString()} (${Math.round((selectedAttempt.processed_rows / selectedAttempt.total_rows) * 100)}%)
                        `.trim();
                        
                        navigator.clipboard.writeText(instructions);
                        alert('Resume instructions copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                    >
                      Copy Resume Instructions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

