'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

const ZhedoriButtonBar = dynamic(
  () => import('@/app/components/ZhedoriButtonBar'),
  { ssr: false }
);

export default function PicoDirectClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [cacheData, setCacheData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedSQL, setGeneratedSQL] = useState<string>('');

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      router.push('/auth');
      return;
    }

    loadCacheData();
  }, [user, isLoading, router]);

  const loadCacheData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('leadsmart_pico_count_cache')
        .select('count_data')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      setCacheData(data?.count_data || null);
    } catch (err) {
      console.error('Error loading cache data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateSQL = () => {
    if (!cacheData) {
      setGeneratedSQL('-- No cache data available to generate SQL');
      return;
    }

    let sql = '-- F2020 Unified Verification SQL Query\n';
    sql += '-- This single query returns all counts in the same order as JSON for easy comparison\n\n';

    const queries: string[] = [];

    // Process in the correct order: releases -> subsheets -> subparts
    if (cacheData.releases) {
      Object.entries(cacheData.releases).forEach(([releaseId, data]: [string, any]) => {
        queries.push(`SELECT 'releases' as entity_type, '${releaseId}' as entity_id, 'zip_based_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_zip_based_data WHERE rel_release_id = ${releaseId}), 0) as actual_count, 
       ${data.zip_based_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_zip_based_data WHERE rel_release_id = ${releaseId}), 0) = ${data.zip_based_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
        
        queries.push(`SELECT 'releases' as entity_type, '${releaseId}' as entity_id, 'transformed_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_transformed WHERE jrel_release_id = ${releaseId}), 0) as actual_count, 
       ${data.transformed_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_transformed WHERE jrel_release_id = ${releaseId}), 0) = ${data.transformed_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
        
        queries.push(`SELECT 'releases' as entity_type, '${releaseId}' as entity_id, 'children_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_subsheets WHERE rel_release_id = ${releaseId}), 0) as actual_count, 
       ${data.children_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_subsheets WHERE rel_release_id = ${releaseId}), 0) = ${data.children_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
      });
    }

    if (cacheData.subsheets) {
      Object.entries(cacheData.subsheets).forEach(([subsheetId, data]: [string, any]) => {
        queries.push(`SELECT 'subsheets' as entity_type, '${subsheetId}' as entity_id, 'zip_based_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_zip_based_data WHERE rel_subsheet_id = ${subsheetId}), 0) as actual_count, 
       ${data.zip_based_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_zip_based_data WHERE rel_subsheet_id = ${subsheetId}), 0) = ${data.zip_based_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
        
        queries.push(`SELECT 'subsheets' as entity_type, '${subsheetId}' as entity_id, 'transformed_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_transformed WHERE jrel_subsheet_id = ${subsheetId}), 0) as actual_count, 
       ${data.transformed_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_transformed WHERE jrel_subsheet_id = ${subsheetId}), 0) = ${data.transformed_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
        
        queries.push(`SELECT 'subsheets' as entity_type, '${subsheetId}' as entity_id, 'children_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_subparts WHERE rel_subsheet_id = ${subsheetId}), 0) as actual_count, 
       ${data.children_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_subparts WHERE rel_subsheet_id = ${subsheetId}), 0) = ${data.children_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
      });
    }

    if (cacheData.subparts) {
      Object.entries(cacheData.subparts).forEach(([subpartId, data]: [string, any]) => {
        queries.push(`SELECT 'subparts' as entity_type, '${subpartId}' as entity_id, 'zip_based_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_zip_based_data WHERE rel_subpart_id = ${subpartId}), 0) as actual_count, 
       ${data.zip_based_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_zip_based_data WHERE rel_subpart_id = ${subpartId}), 0) = ${data.zip_based_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
        
        queries.push(`SELECT 'subparts' as entity_type, '${subpartId}' as entity_id, 'transformed_count' as count_type, 
       COALESCE((SELECT count(*) FROM leadsmart_transformed WHERE jrel_subpart_id = ${subpartId}), 0) as actual_count, 
       ${data.transformed_count} as expected_count, 
       CASE WHEN COALESCE((SELECT count(*) FROM leadsmart_transformed WHERE jrel_subpart_id = ${subpartId}), 0) = ${data.transformed_count} THEN '✅ MATCH' ELSE '❌ MISMATCH' END as status`);
      });
    }

    if (queries.length > 0) {
      sql += 'SELECT * FROM (\n' + queries.join('\nUNION ALL\n') + '\n) AS verification_results\nORDER BY entity_type, CAST(entity_id AS INTEGER), count_type;';
    } else {
      sql += '-- No data to verify';
    }

    setGeneratedSQL(sql);
  };

  if (isLoading || loading) {
    return (
      <div className="p-6">
        <ZhedoriButtonBar />
        <div className="mt-8">
          <h1 className="text-3xl font-bold mb-6">View leadsmart_pico_count_cache.count_data</h1>
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ZhedoriButtonBar />
      
      <div className="mt-8">
        <h1 className="text-3xl font-bold mb-6">View leadsmart_pico_count_cache.count_data</h1>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        ) : cacheData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* JSON Data Box */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Cache Data (JSON)</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(cacheData, null, 2))}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
                  {JSON.stringify(cacheData, null, 2)}
                </pre>
              </div>
            </div>
            
            {/* SQL Query Generator Box */}
            <div>
              <div className="mb-3">
                <button
                  onClick={generateSQL}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  run f2020 create mimmicking sql query
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Verification SQL Query</h3>
                {generatedSQL && (
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedSQL)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
                  {generatedSQL || '-- Click the button above to generate SQL verification queries'}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">
              No cache data found for your user. Run a pico cache rebuild from /leadsmart_tank or /leadsmart_morph to generate data.
            </p>
          </div>
        )}
        
        {cacheData && (
          <div className="mt-6">
            <button
              onClick={loadCacheData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Cache Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}