'use client';

import { useState } from 'react';

export default function MigrateSitesglubPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/migrate_sitesglub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          migration_key: 'migrate_sitesglub_2024' // Simple auth key
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Sitesglub Migration Tool</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important</h2>
        <p className="text-yellow-700">
          This tool will process all existing sitespren records and create corresponding sitesglub records where needed. 
          It will also link existing sitespren records to sitesglub records via the new foreign key.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Migration Process:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Find all unique domains from existing sitespren records</li>
          <li>Check which domains already have sitesglub records</li>
          <li>Create new sitesglub records for domains that don't exist</li>
          <li>Update all sitespren records to link to their corresponding sitesglub records</li>
          <li>Verify the migration results</li>
        </ol>
      </div>

      <div className="mb-6">
        <button
          onClick={runMigration}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {isRunning ? 'Running Migration...' : 'Start Migration'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Migration Completed Successfully</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-gray-800">Domains Processed</h4>
              <p className="text-2xl font-bold text-blue-600">{result.data.uniqueDomainsProcessed}</p>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-gray-800">New Sitesglub Records</h4>
              <p className="text-2xl font-bold text-green-600">{result.data.createdSitesglubRecords}</p>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-gray-800">Existing Sitesglub Records</h4>
              <p className="text-2xl font-bold text-gray-600">{result.data.existingSitesglubRecords}</p>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-gray-800">Linked Sitespren Records</h4>
              <p className="text-2xl font-bold text-purple-600">{result.data.updatedSitesprenRecords}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">Final Verification</h4>
            <div className="space-y-1">
              <p><span className="font-medium">Total sitespren records:</span> {result.data.verification.totalSitesprenRecords}</p>
              <p><span className="font-medium">Successfully linked:</span> {result.data.verification.linkedRecords}</p>
              <p><span className="font-medium">Still unlinked:</span> {result.data.verification.unlinkedRecords}</p>
            </div>
          </div>

          <p className="text-green-700 mt-4 font-medium">{result.message}</p>
        </div>
      )}
    </div>
  );
}