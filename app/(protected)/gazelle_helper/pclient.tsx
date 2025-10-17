'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';

interface BatchRecord {
  batch_id: number;
  batch_name: string;
  batch_source: string;
  initiated_by_user_id: string | null;
  total_keywords: number;
  completed_keywords: number;
  failed_keywords: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  duration_minutes: number;
  is_stalled: boolean;
  pending_keywords: number;
}

export default function GazelleHelperClient() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'stalled' | 'completed' | 'failed'>('all');
  const [resumingBatchId, setResumingBatchId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('zhe_serp_fetch_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      // Calculate derived fields
      const now = new Date();
      const processedBatches: BatchRecord[] = (data || []).map(batch => {
        const createdAt = new Date(batch.created_at);
        const durationMinutes = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60));
        const pendingKeywords = batch.total_keywords - batch.completed_keywords - batch.failed_keywords;
        
        // A batch is stalled if it's in_progress for more than 30 minutes with incomplete keywords
        const isStalled = 
          batch.status === 'in_progress' && 
          durationMinutes > 30 && 
          pendingKeywords > 0;

        return {
          ...batch,
          duration_minutes: durationMinutes,
          is_stalled: isStalled,
          pending_keywords: pendingKeywords
        };
      });

      setBatches(processedBatches);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleResumeBatch = async (batchId: number) => {
    if (!confirm('Resume this stalled batch? This will process all pending keywords.')) {
      return;
    }

    setResumingBatchId(batchId);

    try {
      // Call API endpoint to resume batch
      const response = await fetch('/api/gazelle-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_id: batchId,
          user_id: user?.id || null
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resume batch');
      }

      alert(
        `🦌 Batch Resume Initiated!\n\n` +
        `Batch ID: #${batchId}\n` +
        `Pending keywords: ${result.pending_keywords}\n\n` +
        `The batch will continue processing in the background.\n` +
        `Refresh this page to monitor progress.`
      );

      // Refresh the table
      fetchBatches();
    } catch (error) {
      console.error('Error resuming batch:', error);
      alert(`Failed to resume batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setResumingBatchId(null);
    }
  };

  const handleCancelBatch = async (batchId: number) => {
    if (!confirm('Cancel this batch? This will mark it as cancelled and stop processing.')) {
      return;
    }

    try {
      await supabase.rpc('update_batch_progress', {
        p_batch_id: batchId,
        p_status: 'cancelled'
      });

      alert(`Batch #${batchId} has been cancelled.`);
      fetchBatches();
    } catch (error) {
      console.error('Error cancelling batch:', error);
      alert(`Failed to cancel batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'stalled') return batch.is_stalled;
    return batch.status === filterStatus;
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (batch: BatchRecord) => {
    if (batch.is_stalled) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
          ⚠️ STALLED
        </span>
      );
    }

    switch (batch.status) {
      case 'in_progress':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
            🔄 In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
            ✅ Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
            ❌ Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
            🚫 Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
            {batch.status}
          </span>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'bulk-kwjar':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
            /kwjar Bulk
          </span>
        );
      case 'manual-serpjar':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800">
            /serpjar Single
          </span>
        );
      case 'batch-fabric':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-teal-100 text-teal-800">
            /fabric Batch
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
            {source}
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access Gazelle Helper.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="px-6 pt-6">
        <ZhedoriButtonBar />
      </div>

      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🦌 Gazelle Helper</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor and resume Gazelle batch operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
            </label>
            <button
              onClick={fetchBatches}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium"
            >
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({batches.length})
          </button>
          <button
            onClick={() => setFilterStatus('stalled')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              filterStatus === 'stalled'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⚠️ Stalled ({batches.filter(b => b.is_stalled).length})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              filterStatus === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            In Progress ({batches.filter(b => b.status === 'in_progress' && !b.is_stalled).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed ({batches.filter(b => b.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              filterStatus === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Failed ({batches.filter(b => b.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-800">Error: {error}</p>
            </div>
          )}

          {loading && batches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Loading batches...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No batches found matching filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Failed
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBatches.map((batch) => {
                    const progressPercent = batch.total_keywords > 0
                      ? Math.round(((batch.completed_keywords + batch.failed_keywords) / batch.total_keywords) * 100)
                      : 0;

                    return (
                      <tr key={batch.batch_id} className={batch.is_stalled ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-900">#{batch.batch_id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{batch.batch_name}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getSourceBadge(batch.batch_source)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(batch)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  batch.is_stalled ? 'bg-red-600' : 'bg-green-600'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{progressPercent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-sm text-gray-900">{batch.total_keywords}</span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-sm text-green-600 font-medium">{batch.completed_keywords}</span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-sm text-red-600 font-medium">{batch.failed_keywords}</span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            batch.pending_keywords > 0 ? 'text-orange-600' : 'text-gray-400'
                          }`}>
                            {batch.pending_keywords}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-gray-500">
                            {new Date(batch.created_at).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-gray-600">
                            {formatDuration(batch.duration_minutes)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            {batch.is_stalled && (
                              <button
                                onClick={() => handleResumeBatch(batch.batch_id)}
                                disabled={resumingBatchId === batch.batch_id}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-300 font-medium"
                              >
                                {resumingBatchId === batch.batch_id ? 'Resuming...' : '▶️ Resume'}
                              </button>
                            )}
                            {batch.status === 'in_progress' && (
                              <button
                                onClick={() => handleCancelBatch(batch.batch_id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Definitions:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-medium">⚠️ STALLED:</span> Batch has been in progress for over 30 minutes with pending keywords
            </div>
            <div>
              <span className="font-medium">🔄 In Progress:</span> Batch is actively processing keywords
            </div>
            <div>
              <span className="font-medium">✅ Completed:</span> All keywords successfully processed
            </div>
            <div>
              <span className="font-medium">❌ Failed:</span> Batch encountered errors and stopped
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <span className="font-medium">Pending:</span> Keywords that haven't been processed yet (Total - Completed - Failed)
          </div>
        </div>
      </div>
    </div>
  );
}

