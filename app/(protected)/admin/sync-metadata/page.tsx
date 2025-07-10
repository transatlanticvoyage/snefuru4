'use client';

// @xpage-metadata
// URL: /admin/sync-metadata
// Title: Sync XPage Metadata - Snefuru Admin
// Last Sync: 2024-01-10T10:30:00Z
export const XPAGE_ID = 100; // Use 100+ range for admin-created pages

import { useState } from 'react';
import { syncXPageMetadataAPI } from '@/app/utils/syncXPageMetadata';

export default function SyncMetadataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; updatedPages: number } | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setLastResult(null);
    
    try {
      const result = await syncXPageMetadataAPI();
      setLastResult(result);
      
      if (result.success) {
        // Optionally trigger a page refresh or rebuild
        console.log('Sync successful, consider triggering rebuild...');
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        updatedPages: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h1>XPage Metadata Sync</h1>
      <p>Sync page metadata from database to static cache files.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleSync}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#ccc' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? 'Syncing...' : 'Sync Metadata from Database'}
        </button>
      </div>

      {lastResult && (
        <div 
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: lastResult.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${lastResult.success ? '#22c55e' : '#ef4444'}`,
            marginTop: '20px'
          }}
        >
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: lastResult.success ? '#16a34a' : '#dc2626' 
          }}>
            {lastResult.success ? '✅ Sync Successful' : '❌ Sync Failed'}
          </h3>
          <p style={{ margin: '0 0 8px 0' }}>{lastResult.message}</p>
          {lastResult.success && (
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
              Updated {lastResult.updatedPages} pages in cache
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>How it works:</h3>
        <ol>
          <li>Fetches all xpage records from database</li>
          <li>Generates static metadata cache file</li>
          <li>Pages import metadata statically (no runtime DB calls)</li>
          <li>No race conditions or flickering titles</li>
        </ol>
        
        <h3 style={{ marginTop: '20px' }}>Test Pages:</h3>
        <ul>
          <li><a href="/bin31/panjar4">panjar4 (ID: 14)</a> - Test page with static metadata</li>
          <li><a href="/admin/azo">Azo (ID: 12)</a> - Admin page</li>
          <li><a href="/admin/utg_manager">UTG Manager (ID: 13)</a> - Admin page</li>
          <li><a href="/">Home (ID: 11)</a> - Home page</li>
        </ul>
      </div>
    </div>
  );
}