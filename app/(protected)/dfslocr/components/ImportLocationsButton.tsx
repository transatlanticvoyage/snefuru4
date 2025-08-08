'use client';

import { useState, useEffect } from 'react';

interface LocationStats {
  total_locations: number;
  has_data: boolean;
  last_updated: string | null;
  sample_locations: Array<{
    location_code: number;
    location_name: string;
    location_type: string;
    country_iso_code: string;
  }>;
}

interface ImportStats {
  total_from_api: number;
  total_inserted: number;
  final_count: number;
  errors: number;
  chunks_processed: number;
}

export default function ImportLocationsButton() {
  const [isImporting, setIsImporting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null);
  const [importResults, setImportResults] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string>('');

  // Check status on component mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setIsCheckingStatus(true);
      setError('');
      
      const response = await fetch('/api/dfs-locations/status');
      const data = await response.json();
      
      if (response.ok) {
        setLocationStats(data.status);
      } else {
        setError(`Status check failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Status check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setConnectionStatus('Testing connection...');
      setError('');
      
      const response = await fetch('/api/dfs-locations/test-connection');
      const data = await response.json();
      
      if (response.ok) {
        setConnectionStatus(`✅ Connection successful! Sample locations: ${data.api_info.sample_location_count}`);
      } else {
        setConnectionStatus(`❌ Connection failed: ${data.error}`);
        setError(data.details || data.error);
      }
    } catch (err) {
      const errorMessage = `Connection test failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setConnectionStatus(`❌ ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const importLocations = async (force = false) => {
    try {
      setIsImporting(true);
      setImportProgress('Starting import...');
      setError('');
      setImportResults(null);
      
      const url = force ? '/api/dfs-locations/import?force=true' : '/api/dfs-locations/import';
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        if (data.success) {
          setImportProgress(`✅ Import completed! ${data.stats.final_count} locations imported.`);
          setImportResults(data.stats);
          // Refresh status after successful import
          await checkStatus();
        } else {
          setImportProgress(`ℹ️ ${data.message}`);
        }
      } else {
        setImportProgress(`❌ Import failed: ${data.error}`);
        setError(data.details || data.error);
      }
    } catch (err) {
      const errorMessage = `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setImportProgress(`❌ ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const clearLocations = async () => {
    if (!confirm('Are you sure you want to clear all location data? This cannot be undone.')) {
      return;
    }

    try {
      setImportProgress('Clearing locations...');
      setError('');
      
      const response = await fetch('/api/dfs-locations/clear', { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        setImportProgress(`✅ Cleared ${data.deleted_count} locations`);
        await checkStatus();
      } else {
        setImportProgress(`❌ Clear failed: ${data.error}`);
        setError(data.details || data.error);
      }
    } catch (err) {
      const errorMessage = `Clear failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setImportProgress(`❌ ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const testInsert = async () => {
    try {
      setImportProgress('Testing database insert...');
      setError('');
      
      const response = await fetch('/api/dfs-locations/test-insert', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setImportProgress(`✅ Test insert successful!`);
        await checkStatus();
      } else {
        setImportProgress(`❌ Test insert failed: ${data.error}`);
        setError(typeof data.details === 'string' ? data.details : JSON.stringify(data.details) || data.error);
      }
    } catch (err) {
      const errorMessage = `Test insert failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setImportProgress(`❌ ${errorMessage}`);
      setError(errorMessage);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">DataForSEO Locations Import</h3>
        <button
          onClick={checkStatus}
          disabled={isCheckingStatus}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md disabled:opacity-50"
        >
          {isCheckingStatus ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {/* Status Display */}
      {locationStats && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="font-medium text-blue-800">
            {locationStats.has_data 
              ? `✅ ${locationStats.total_locations.toLocaleString()} locations in database`
              : '❌ No locations in database'}
          </div>
          {locationStats.has_data && locationStats.last_updated && (
            <div className="text-sm text-blue-600 mt-1">
              Last updated: {new Date(locationStats.last_updated).toLocaleString()}
            </div>
          )}
          {locationStats.sample_locations && locationStats.sample_locations.length > 0 && (
            <div className="text-sm text-blue-600 mt-2">
              <div>Recent locations:</div>
              {locationStats.sample_locations.slice(0, 3).map(loc => (
                <div key={loc.location_code} className="ml-2">
                  • {loc.location_name} ({loc.location_type}) - {loc.country_iso_code}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testConnection}
          disabled={isTesting}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md disabled:opacity-50 text-sm"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>

        <button
          onClick={() => importLocations(false)}
          disabled={isImporting}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50 text-sm"
        >
          {isImporting ? 'Importing...' : 'Import Locations'}
        </button>

        {locationStats?.has_data && (
          <button
            onClick={() => importLocations(true)}
            disabled={isImporting}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md disabled:opacity-50 text-sm"
          >
            Force Re-import
          </button>
        )}

        <button
          onClick={testInsert}
          disabled={isImporting}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md disabled:opacity-50 text-sm"
        >
          Test Insert
        </button>

        {locationStats?.has_data && (
          <button
            onClick={clearLocations}
            disabled={isImporting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md disabled:opacity-50 text-sm"
          >
            Clear All Data
          </button>
        )}
      </div>

      {/* Status Messages */}
      {connectionStatus && (
        <div className="mb-2 p-2 bg-gray-100 border border-gray-200 rounded text-sm">
          <strong>Connection:</strong> {connectionStatus}
        </div>
      )}

      {importProgress && (
        <div className="mb-2 p-2 bg-gray-100 border border-gray-200 rounded text-sm">
          <strong>Import:</strong> {importProgress}
        </div>
      )}

      {importResults && (
        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded text-sm">
          <strong>Import Results:</strong>
          <ul className="mt-1 ml-4 list-disc text-green-700">
            <li>API returned: {importResults.total_from_api.toLocaleString()} locations</li>
            <li>Successfully inserted: {importResults.total_inserted.toLocaleString()} records</li>
            <li>Final count in database: {importResults.final_count.toLocaleString()}</li>
            <li>Chunks processed: {importResults.chunks_processed}</li>
            {importResults.errors > 0 && <li className="text-red-600">Errors: {importResults.errors}</li>}
          </ul>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
          <strong className="text-red-800">Error:</strong>
          <div className="text-red-600 mt-1 font-mono text-xs max-h-32 overflow-y-auto">
            {error}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        <strong>Instructions:</strong>
        <ol className="mt-1 ml-4 list-decimal">
          <li>First, test your DataForSEO API connection</li>
          <li>If connection is successful, click "Import Locations" to load ~50,000 locations</li>
          <li>Import will be skipped if data already exists (use "Force Re-import" to overwrite)</li>
          <li>The import process may take several minutes due to the large dataset</li>
        </ol>
      </div>
    </div>
  );
}