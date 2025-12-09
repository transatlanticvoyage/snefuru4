'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DfsFetchReportsTable from './components/DfsFetchReportsTable';

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
}

interface Statistics {
  totalSubmissionsToday: number;
  successRateToday: number;
  averageProcessingTime: number;
  totalCreditsToday: number;
  failedKeywordsCount: number;
  activeJobs: number;
}

export default function DfsFetchReportsPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const [reports, setReports] = useState<DfsFetchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    totalSubmissionsToday: 0,
    successRateToday: 0,
    averageProcessingTime: 0,
    totalCreditsToday: 0,
    failedKeywordsCount: 0,
    activeJobs: 0
  });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch reports
  const fetchReports = async () => {
    try {
      let query = supabase
        .from('dfs_fetch_reports')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(100);

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`tag_name.ilike.%${searchTerm}%,submission_id.eq.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      setReports(data || []);
      calculateStatistics(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStatistics = (data: DfsFetchReport[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysReports = data.filter(r => 
      new Date(r.submitted_at) >= today
    );

    const completedToday = todaysReports.filter(r => 
      r.status === 'completed' || r.status === 'partial'
    );

    const totalSucceeded = completedToday.reduce((sum, r) => 
      sum + (r.keywords_succeeded || 0), 0
    );
    
    const totalProcessed = completedToday.reduce((sum, r) => 
      sum + (r.keywords_processed || 0), 0
    );

    const successRate = totalProcessed > 0 
      ? (totalSucceeded / totalProcessed) * 100 
      : 0;

    const avgProcessingTime = completedToday.length > 0
      ? completedToday.reduce((sum, r) => 
          sum + (r.processing_duration_ms || 0), 0
        ) / completedToday.length / 1000 // Convert to seconds
      : 0;

    const totalCredits = todaysReports.reduce((sum, r) => 
      sum + (r.dfs_credits_used || 0), 0
    );

    const failedKeywords = todaysReports.reduce((sum, r) => 
      sum + (r.keywords_failed || 0), 0
    );

    const activeJobs = data.filter(r => 
      r.status === 'pending' || r.status === 'processing'
    ).length;

    setStatistics({
      totalSubmissionsToday: todaysReports.length,
      successRateToday: Math.round(successRate * 10) / 10,
      averageProcessingTime: Math.round(avgProcessingTime * 10) / 10,
      totalCreditsToday: Math.round(totalCredits * 100) / 100,
      failedKeywordsCount: failedKeywords,
      activeJobs
    });
  };

  // Auto-refresh for active jobs
  useEffect(() => {
    fetchReports();

    // Set up auto-refresh every 10 seconds if there are active jobs
    const interval = setInterval(() => {
      fetchReports();
    }, 10000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filterStatus, searchTerm]);

  // Handle retry failed keywords
  const retryFailed = async (reportId: number) => {
    const report = reports.find(r => r.report_id === reportId);
    if (!report || !report.error_details) return;

    try {
      // Extract failed keyword IDs from error_details
      const failedKeywordIds = Object.keys(report.error_details)
        .filter(key => report.error_details[key].status === 'failed')
        .map(Number);

      if (failedKeywordIds.length === 0) {
        alert('No failed keywords to retry');
        return;
      }

      // Call the bulk refresh API with failed keywords
      const response = await fetch('/api/dataforseo-refresh-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword_ids: failedKeywordIds,
          field: 'cpc',
          retry_report_id: reportId
        }),
      });

      if (response.ok) {
        alert(`Retrying ${failedKeywordIds.length} failed keywords`);
        fetchReports();
      } else {
        alert('Failed to retry keywords');
      }
    } catch (err) {
      console.error('Error retrying failed keywords:', err);
      alert('Error retrying failed keywords');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Please log in to access this page</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">DFS Fetch Reports</h1>
            <p className="mt-2 text-sm text-gray-600">Monitor DataForSEO refresh operations and track success rates</p>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{statistics.totalSubmissionsToday}</div>
            <div className="text-sm text-gray-500">Submissions Today</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{statistics.successRateToday}%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{statistics.averageProcessingTime}s</div>
            <div className="text-sm text-gray-500">Avg Processing Time</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{statistics.totalCreditsToday}</div>
            <div className="text-sm text-gray-500">Credits Used Today</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{statistics.failedKeywordsCount}</div>
            <div className="text-sm text-gray-500">Failed Keywords</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className={`text-2xl font-bold ${statistics.activeJobs > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
              {statistics.activeJobs}
            </div>
            <div className="text-sm text-gray-500">Active Jobs</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search by tag name or submission ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'all' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('processing')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'processing' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterStatus('failed')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'failed' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Failed
              </button>
              <button
                onClick={() => setFilterStatus('partial')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'partial' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                Partial
              </button>
            </div>
            <button
              onClick={() => fetchReports()}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading reports...</div>
          ) : (
            <DfsFetchReportsTable 
              reports={reports} 
              onRetryFailed={retryFailed}
              onRefresh={fetchReports}
            />
          )}
        </div>
      </div>
    </div>
  );
}