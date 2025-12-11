'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DfsFetchReport {
  report_id: number;
  submission_id: number;
  tag_id: number | null;
  tag_name: string | null;
  submitted_at: string;
  submitted_by: string | null;
  total_keywords: number;
  keywords_submitted: string[] | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  keywords_processed: number;
  keywords_succeeded: number;
  keywords_failed: number;
  error_details: any;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_duration_ms: number | null;
  dfs_task_ids: string[] | null;
  dfs_credits_used: number | null;
  updated_at: string;
  source_type?: string | null;
  rel_fabrication_launch_id?: number | null;
}

interface Props {
  reports: DfsFetchReport[];
  onRetryFailed: (reportId: number) => void;
  onRefresh: () => void;
}

export default function DfsFetchReportsTable({ reports, onRetryFailed, onRefresh }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (reportId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">🟡 Pending</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">🔵 Processing</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">🟢 Completed</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 Failed</span>;
      case 'partial':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">🟠 Partial</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getProgressBar = (report: DfsFetchReport) => {
    const percentage = report.total_keywords > 0 
      ? (report.keywords_processed / report.total_keywords) * 100 
      : 0;
    
    let bgColor = 'bg-gray-400';
    if (percentage === 100 && report.keywords_failed === 0) {
      bgColor = 'bg-green-500';
    } else if (percentage === 100 && report.keywords_failed > 0) {
      bgColor = 'bg-orange-500';
    } else if (percentage > 0) {
      bgColor = 'bg-blue-500';
    }

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${bgColor}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
        <div className="text-xs text-gray-600 mt-1">
          {report.keywords_processed}/{report.total_keywords}
        </div>
      </div>
    );
  };

  const getSuccessRate = (report: DfsFetchReport) => {
    if (report.keywords_processed === 0) return 'N/A';
    const rate = (report.keywords_succeeded / report.keywords_processed) * 100;
    const color = rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-orange-600' : 'text-red-600';
    return <span className={`font-medium ${color}`}>{Math.round(rate * 10) / 10}%</span>;
  };

  const getProcessingTime = (report: DfsFetchReport) => {
    if (report.status === 'pending') return 'Not started';
    if (report.status === 'processing') return 'In progress...';
    if (!report.processing_duration_ms) return 'N/A';
    
    const seconds = report.processing_duration_ms / 1000;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getProcessingStatus = (report: DfsFetchReport) => {
    if (report.status === 'pending' || report.status === 'processing') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">processing</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">finished</span>;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const exportReportCSV = (report: DfsFetchReport) => {
    const csvData = [
      ['Submission ID', 'Source', 'F370 Launch ID', 'Tag Name', 'Status', 'Total Keywords', 'Processed', 'Succeeded', 'Failed', 'Success Rate', 'Processing Time', 'Credits Used', 'Submitted At'],
      [
        report.submission_id.toString(),
        report.source_type || 'manual',
        report.rel_fabrication_launch_id?.toString() || 'N/A',
        report.tag_name || 'N/A',
        report.status,
        report.total_keywords.toString(),
        report.keywords_processed.toString(),
        report.keywords_succeeded.toString(),
        report.keywords_failed.toString(),
        report.keywords_processed > 0 ? `${Math.round((report.keywords_succeeded / report.keywords_processed) * 1000) / 10}%` : 'N/A',
        getProcessingTime(report),
        report.dfs_credits_used?.toString() || 'N/A',
        new Date(report.submitted_at).toLocaleString()
      ]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dfs_report_${report.submission_id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (reports.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500 mb-4">No reports found</div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report) => (
            <>
              <tr key={report.report_id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{report.submission_id}</div>
                  <div className="text-xs text-gray-500">{report.total_keywords} keywords</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {report.source_type === 'f370_auto' ? (
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        F370 Auto
                      </span>
                      {report.rel_fabrication_launch_id && (
                        <div className="text-xs text-gray-500 mt-1">
                          Launch #{report.rel_fabrication_launch_id}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {report.source_type === 'retry' ? 'Retry' : 'Manual'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {report.tag_name && report.tag_id ? (
                    <Link 
                      href={`/kwjar?kwtag=${report.tag_id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {report.tag_name}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">No tag</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(report.status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getProcessingStatus(report)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="w-20">
                    {getProgressBar(report)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {getSuccessRate(report)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getProcessingTime(report)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.dfs_credits_used ? Math.round(report.dfs_credits_used * 100) / 100 : 'N/A'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatRelativeTime(report.submitted_at)}</div>
                  <div className="text-xs text-gray-500">{new Date(report.submitted_at).toLocaleDateString()}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleRowExpansion(report.report_id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {expandedRows.has(report.report_id) ? 'Hide' : 'Details'}
                    </button>
                    {report.keywords_failed > 0 && (
                      <button
                        onClick={() => onRetryFailed(report.report_id)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        retry failed kws
                      </button>
                    )}
                    <button
                      onClick={() => exportReportCSV(report)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Export
                    </button>
                  </div>
                </td>
              </tr>
              
              {/* Expandable details row */}
              {expandedRows.has(report.report_id) && (
                <tr>
                  <td colSpan={9} className="px-4 py-4 bg-gray-50">
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500">Started</div>
                          <div className="text-sm text-gray-900">
                            {report.processing_started_at 
                              ? new Date(report.processing_started_at).toLocaleString()
                              : 'Not started'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">Completed</div>
                          <div className="text-sm text-gray-900">
                            {report.processing_completed_at 
                              ? new Date(report.processing_completed_at).toLocaleString()
                              : 'Not completed'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">DFS Task IDs</div>
                          <div className="text-sm text-gray-900">
                            {report.dfs_task_ids?.length 
                              ? `${report.dfs_task_ids.length} tasks`
                              : 'N/A'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">Last Updated</div>
                          <div className="text-sm text-gray-900">
                            {formatRelativeTime(report.updated_at)}
                          </div>
                        </div>
                      </div>

                      {/* Error details */}
                      {report.error_details && Object.keys(report.error_details).length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">Error Details</div>
                          <div className="bg-white border rounded-lg p-3 max-h-60 overflow-y-auto">
                            <div className="text-xs text-gray-700">
                              <pre>{JSON.stringify(report.error_details, null, 2)}</pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DFS Task IDs */}
                      {report.dfs_task_ids && report.dfs_task_ids.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">DataForSEO Task IDs</div>
                          <div className="bg-white border rounded-lg p-3">
                            <div className="flex flex-wrap gap-2">
                              {report.dfs_task_ids.map((taskId, index) => (
                                <span 
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {taskId}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}