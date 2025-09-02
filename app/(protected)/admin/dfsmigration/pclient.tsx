'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface MigrationStatus {
  total_sitesglub_records: number;
  processed_records: number;
  created_sitesdfs_records: number;
  api_calls_made: number;
  api_calls_failed: number;
  total_cost: number;
  status: 'not_started' | 'running' | 'completed' | 'paused' | 'error';
  current_batch: number;
  error_message?: string;
  started_at: string;
  last_updated: string;
}

export default function DFSMigrationClient() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchMigrationStatus();
  }, [user, router]);

  // Fetch current migration status
  const fetchMigrationStatus = async () => {
    try {
      const response = await fetch('/api/migrate-existing-sites-to-dfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setMigrationStatus(data.status);
        setError(null);
        
        // If migration is running, continue polling
        if (data.status.status === 'running') {
          setIsRunning(true);
        } else {
          setIsRunning(false);
        }
      } else {
        throw new Error(data.error || 'Unknown API error');
      }
    } catch (error) {
      console.error('Error fetching migration status:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch migration status');
      
      // Set a default status to prevent UI crashes
      setMigrationStatus({
        total_sitesglub_records: 0,
        processed_records: 0,
        created_sitesdfs_records: 0,
        api_calls_made: 0,
        api_calls_failed: 0,
        total_cost: 0,
        status: 'error',
        current_batch: 1,
        started_at: '',
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Start migration process
  const startMigration = async () => {
    try {
      setIsRunning(true);
      setNotification({ type: 'info', message: 'Starting migration process...' });
      
      // Start the continuous migration process
      startContinuousProcess();
      
    } catch (error) {
      console.error('Error starting migration:', error);
      setNotification({ type: 'error', message: 'Failed to start migration' });
      setIsRunning(false);
    }
  };

  // Process one batch and schedule next
  const processBatch = async () => {
    try {
      const response = await fetch('/api/migrate-existing-sites-to-dfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update status
        await fetchMigrationStatus();
        
        if (data.completed) {
          // Migration is complete
          setIsRunning(false);
          setNotification({ 
            type: 'success', 
            message: 'Migration completed successfully!' 
          });
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          return false; // Stop processing
        } else {
          // Continue processing
          setNotification({ 
            type: 'info', 
            message: `Processed batch ${migrationStatus?.current_batch || 0}. ${data.remainingRecords} sites remaining.` 
          });
          
          return true; // Continue processing
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      setNotification({ type: 'error', message: `Batch processing failed: ${error}` });
      setIsRunning(false);
      return false; // Stop processing
    }
  };

  // Start continuous processing with intervals
  const startContinuousProcess = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Process first batch immediately
    processBatch().then(shouldContinue => {
      if (shouldContinue) {
        // Set up interval for subsequent batches (30 seconds between batches)
        intervalRef.current = setInterval(async () => {
          const shouldContinue = await processBatch();
          if (!shouldContinue && intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }, 30000); // 30 second delay between batches
      }
    });
  };

  // Stop migration
  const stopMigration = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setNotification({ type: 'info', message: 'Migration paused. You can resume it later.' });
  };

  // Reset migration
  const resetMigration = async () => {
    try {
      const response = await fetch('/api/migrate-existing-sites-to-dfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      const data = await response.json();
      if (data.success) {
        await fetchMigrationStatus();
        setNotification({ type: 'success', message: 'Migration status reset successfully' });
      }
    } catch (error) {
      console.error('Error resetting migration:', error);
      setNotification({ type: 'error', message: 'Failed to reset migration' });
    }
  };

  // Auto-refresh status when running
  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      statusInterval = setInterval(fetchMigrationStatus, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading migration status...</div>
      </div>
    );
  }

  const progressPercentage = migrationStatus && migrationStatus.total_sitesglub_records > 0 
    ? Math.round((migrationStatus.processed_records / migrationStatus.total_sitesglub_records) * 100)
    : 0;

  const successRate = migrationStatus && migrationStatus.api_calls_made > 0
    ? Math.round(((migrationStatus.api_calls_made - migrationStatus.api_calls_failed) / migrationStatus.api_calls_made) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">DataForSEO Migration</h1>
          <p className="text-gray-600 mt-1">
            Migrate existing sitesglub records to DataForSEO system and fetch metrics
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 max-w-7xl mx-auto px-4 py-3 rounded-md bg-red-100 border border-red-400 text-red-700">
          <div className="flex items-center justify-between">
            <span>⚠️ API Error: {error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`mx-6 mt-4 max-w-7xl mx-auto px-4 py-3 rounded-md ${
          notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Migration Status Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Migration Status</h2>
          
          {migrationStatus && (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-600">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      migrationStatus.status === 'completed' ? 'bg-green-500' :
                      migrationStatus.status === 'error' ? 'bg-red-500' :
                      isRunning ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {migrationStatus.total_sitesglub_records}
                  </div>
                  <div className="text-sm text-gray-600">Total Sites</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {migrationStatus.processed_records}
                  </div>
                  <div className="text-sm text-gray-600">Processed</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {migrationStatus.created_sitesdfs_records}
                  </div>
                  <div className="text-sm text-gray-600">DFS Records Created</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${migrationStatus.total_cost.toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-600">Total API Cost</div>
                </div>
              </div>

              {/* API Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-lg font-bold text-gray-700">
                    {migrationStatus.api_calls_made}
                  </div>
                  <div className="text-sm text-gray-600">API Calls Made</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {migrationStatus.api_calls_failed}
                  </div>
                  <div className="text-sm text-gray-600">API Failures</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {successRate}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Current Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      migrationStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                      migrationStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                      migrationStatus.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {migrationStatus.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Current Batch:</span>
                    <span className="ml-2 text-gray-600">{migrationStatus.current_batch}</span>
                  </div>
                  {migrationStatus.started_at && (
                    <div>
                      <span className="font-medium">Started:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(migrationStatus.started_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(migrationStatus.last_updated).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Migration Controls</h3>
          
          <div className="flex space-x-4">
            {!isRunning && migrationStatus?.status !== 'completed' && (
              <button
                onClick={startMigration}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                {migrationStatus?.status === 'not_started' ? 'Start Migration' : 'Resume Migration'}
              </button>
            )}
            
            {isRunning && (
              <button
                onClick={stopMigration}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Pause Migration
              </button>
            )}
            
            <button
              onClick={fetchMigrationStatus}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium"
            >
              Refresh Status
            </button>
            
            <button
              onClick={resetMigration}
              disabled={isRunning}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-yellow-400 font-medium"
            >
              Reset Migration
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {isRunning && (
              <div className="flex items-center">
                <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Migration is running in background. Processing 5 sites per batch with 30-second intervals.
              </div>
            )}
            {!isRunning && migrationStatus?.status === 'completed' && (
              <div className="text-green-600 font-medium">
                ✅ Migration completed successfully!
              </div>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">How This Migration Works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Finds all sitesglub records that don't have corresponding sitesdfs records</li>
            <li>• Creates sitesdfs records and links them to sitesglub records</li>
            <li>• Triggers DataForSEO API calls to fetch metrics for each site</li>
            <li>• Processes sites in small batches (5 sites) to respect API rate limits</li>
            <li>• 30-second delays between batches to avoid overwhelming the API</li>
            <li>• Automatically retries failed API calls with exponential backoff</li>
            <li>• You can pause/resume the migration at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}