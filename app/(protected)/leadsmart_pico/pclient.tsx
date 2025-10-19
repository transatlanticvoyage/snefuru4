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

interface PicoReport {
  report_id: number;
  user_id: string;
  operation_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'stalled' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  last_activity_at: string;
  total_operations: number;
  completed_operations: number;
  current_phase?: string;
  phase_progress: number;
  overall_progress: number;
  rows_processed: number;
  zip_based_rows_counted: number;
  transformed_rows_counted: number;
  cache_entries_created: number;
  operations_per_second: number;
  estimated_completion_time?: string;
  releases_count: number;
  subsheets_count: number;
  subparts_count: number;
  error_message?: string;
  error_details?: any;
  resume_data?: any;
  operation_logs: any[];
  batch_size: number;
  timeout_minutes: number;
  auto_resume: boolean;
  cache_data_summary?: any;
  stall_threshold_minutes: number;
  is_stalled: boolean;
  stall_detected_at?: string;
}

export default function LeadsmartPicoClient() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [reports, setReports] = useState<PicoReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PicoReport | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load reports from database
  const loadReports = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('leadsmart_pico_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Detect stalled reports (no activity in stall_threshold_minutes)
      const now = Date.now();
      const stalledIds: number[] = [];
      
      const updated = (data || []).map((report) => {
        if (report.status === 'in_progress') {
          const lastActivity = new Date(report.last_activity_at).getTime();
          const timeSinceActivity = now - lastActivity;
          const stallThreshold = (report.stall_threshold_minutes || 5) * 60 * 1000;
          
          if (timeSinceActivity > stallThreshold) {
            stalledIds.push(report.report_id);
            return { ...report, status: 'stalled' as const, is_stalled: true, stall_detected_at: new Date().toISOString() };
          }
        }
        return report;
      });
      
      setReports(updated);
      
      // Update stalled reports in database
      if (stalledIds.length > 0) {
        await supabase
          .from('leadsmart_pico_reports')
          .update({ 
            status: 'stalled', 
            is_stalled: true, 
            stall_detected_at: new Date().toISOString() 
          })
          .in('report_id', stalledIds);
      }
    } catch (error) {
      console.error('Error loading pico reports:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Auto-refresh effect
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadReports();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadReports, 2000); // Refresh every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, router, loadReports, autoRefresh]);

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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'in_progress': return 'text-blue-700 bg-blue-100';
      case 'failed': return 'text-red-700 bg-red-100';
      case 'stalled': return 'text-orange-700 bg-orange-100';
      case 'pending': return 'text-gray-700 bg-gray-100';
      case 'cancelled': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Copy report details
  const copyReportDetails = (report: PicoReport) => {
    const details = {
      report_id: report.report_id,
      status: report.status,
      operation_type: report.operation_type,
      progress: `${report.overall_progress}%`,
      phase: report.current_phase,
      duration: report.started_at ? formatDuration(report.started_at, report.completed_at) : 'N/A',
      performance: `${report.operations_per_second.toFixed(1)} ops/sec`,
      cache_entries: report.cache_entries_created,
      releases: report.releases_count,
      subsheets: report.subsheets_count,
      subparts: report.subparts_count,
      error: report.error_message,
      logs: report.operation_logs?.length || 0
    };
    
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    alert('Report details copied to clipboard!');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <ZhedoriButtonBar />
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leadsmart Pico Cache Monitoring</h1>
            <p className="text-gray-600">
              Monitor cache rebuild operations and performance metrics
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
              onClick={loadReports}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Now
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading cache rebuild reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">
              No cache rebuild operations found
            </p>
            <p className="text-sm text-gray-400">
              Start a cache rebuild from /leadsmart_tank or /leadsmart_morph to see monitoring data here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reports List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Cache Rebuild Operations ({reports.length})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <div
                    key={report.report_id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedReport?.report_id === report.report_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-900">Report #{report.report_id}</span>
                        {report.current_phase && (
                          <span className="text-sm text-gray-500">• {report.current_phase}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Progress:</span> {report.overall_progress.toFixed(1)}%
                      </div>
                      {report.started_at && (
                        <div>
                          <span className="font-medium">Duration:</span> {formatDuration(report.started_at, report.completed_at)}
                        </div>
                      )}
                      {report.operations_per_second > 0 && (
                        <div>
                          <span className="font-medium">Speed:</span> {report.operations_per_second.toFixed(1)} ops/sec
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Entries:</span> {report.cache_entries_created.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {report.status === 'in_progress' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{report.current_phase}</span>
                          <span>{report.overall_progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(report.overall_progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {report.error_message && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                        <span className="font-medium">Error:</span> {report.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed View */}
            {selectedReport && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-900">
                    Detailed View - Report #{selectedReport.report_id}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyReportDetails(selectedReport)}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      📋 Copy Details
                    </button>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Status & Progress */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Status & Progress</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReport.status)}`}>
                            {selectedReport.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progress:</span>
                          <span className="font-mono">{selectedReport.overall_progress.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phase:</span>
                          <span>{selectedReport.current_phase || 'N/A'}</span>
                        </div>
                        {selectedReport.status === 'in_progress' && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(selectedReport.overall_progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Performance</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span className="font-mono">{selectedReport.operations_per_second.toFixed(1)} ops/sec</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cache Entries:</span>
                          <span className="font-mono">{selectedReport.cache_entries_created.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Zip Rows:</span>
                          <span className="font-mono">{selectedReport.zip_based_rows_counted.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transform Rows:</span>
                          <span className="font-mono">{selectedReport.transformed_rows_counted.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Data Scope</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Releases:</span>
                          <span className="font-mono">{selectedReport.releases_count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subsheets:</span>
                          <span className="font-mono">{selectedReport.subsheets_count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subparts:</span>
                          <span className="font-mono">{selectedReport.subparts_count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Batch Size:</span>
                          <span className="font-mono">{selectedReport.batch_size.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timing */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Timing Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                      </div>
                      {selectedReport.started_at && (
                        <div className="flex justify-between">
                          <span>Started:</span>
                          <span>{new Date(selectedReport.started_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedReport.completed_at && (
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span>{new Date(selectedReport.completed_at).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Last Activity:</span>
                        <span>{new Date(selectedReport.last_activity_at).toLocaleString()}</span>
                      </div>
                      {selectedReport.started_at && (
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{formatDuration(selectedReport.started_at, selectedReport.completed_at)}</span>
                        </div>
                      )}
                      {selectedReport.estimated_completion_time && (
                        <div className="flex justify-between">
                          <span>Est. Completion:</span>
                          <span>{new Date(selectedReport.estimated_completion_time).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Error Details */}
                  {selectedReport.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 mb-3">Error Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-red-700">Message:</span>
                          <div className="mt-1 text-sm text-red-800 bg-red-100 p-3 rounded font-mono">
                            {selectedReport.error_message}
                          </div>
                        </div>
                        {selectedReport.error_details && (
                          <div>
                            <span className="text-sm font-medium text-red-700">Details:</span>
                            <div className="mt-1 text-xs text-red-700 bg-red-100 p-3 rounded font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {JSON.stringify(selectedReport.error_details, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Cache Summary */}
                  {selectedReport.cache_data_summary && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-3">Cache Summary</h3>
                      <div className="text-sm text-green-800 font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedReport.cache_data_summary, null, 2)}
                      </div>
                    </div>
                  )}
                  
                  {/* Operation Logs */}
                  {selectedReport.operation_logs && selectedReport.operation_logs.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Operation Logs ({selectedReport.operation_logs.length})</h3>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {selectedReport.operation_logs.slice().reverse().map((log, index) => (
                          <div key={index} className="text-xs bg-white p-3 rounded border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-mono text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {log.phase}
                              </span>
                            </div>
                            <div className="text-gray-800">{log.message}</div>
                            {log.data && Object.keys(log.data).length > 0 && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-gray-500">View Data</summary>
                                <div className="mt-1 font-mono text-gray-600 whitespace-pre-wrap text-xs">
                                  {JSON.stringify(log.data, null, 2)}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}