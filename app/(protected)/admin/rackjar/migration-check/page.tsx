'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MigrationCheckPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    runMigrationChecks();
  }, []);

  const runMigrationChecks = async () => {
    try {
      setLoading(true);
      const checkResults: any = {};

      // 1. Check data counts
      const oldCount = await supabase.from('rackui_columns').select('*', { count: 'exact', head: true });
      const newCount = await supabase.from('rackuic').select('*', { count: 'exact', head: true });
      
      checkResults.dataCounts = {
        oldTableCount: oldCount.count || 0,
        newTableCount: newCount.count || 0
      };

      // 2. Get sample data from both tables
      const { data: oldData } = await supabase
        .from('rackui_columns')
        .select('column_id, column_name, source_table')
        .limit(10)
        .order('column_id');

      const { data: newData } = await supabase
        .from('rackuic')
        .select('rcolumn_id, rcolumn_dbcolumn, rcolumn_dbtable, rcolumn_name, rcolumn_handle')
        .limit(10)
        .order('rcolumn_id');

      checkResults.sampleData = {
        oldTable: oldData || [],
        newTable: newData || []
      };

      // 3. Check coltemp_rackui_relations status
      const { data: relationsData } = await supabase
        .from('coltemp_rackui_relations')
        .select(`
          relation_id,
          fk_coltemp_id,
          fk_rackui_column_id,
          coltemps (
            coltemp_name
          )
        `)
        .limit(10);

      checkResults.relations = relationsData || [];

      // 4. Check if IDs exist in new table
      if (relationsData && relationsData.length > 0) {
        const idsToCheck = relationsData.map(r => r.fk_rackui_column_id);
        const { data: existingIds } = await supabase
          .from('rackuic')
          .select('rcolumn_id')
          .in('rcolumn_id', idsToCheck);

        const existingIdSet = new Set(existingIds?.map(r => r.rcolumn_id) || []);
        checkResults.relationStatus = relationsData.map(r => ({
          ...r,
          existsInNewTable: existingIdSet.has(r.fk_rackui_column_id)
        }));
      }

      setResults(checkResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Running migration checks...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rackuic Migration Status Check</h1>

      {/* Data Counts */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Table Record Counts</h2>
        <p>Old table (rackui_columns): <span className="font-mono">{results.dataCounts?.oldTableCount}</span></p>
        <p>New table (rackuic): <span className="font-mono">{results.dataCounts?.newTableCount}</span></p>
        <p className={results.dataCounts?.oldTableCount === results.dataCounts?.newTableCount ? 'text-green-600' : 'text-red-600'}>
          Status: {results.dataCounts?.oldTableCount === results.dataCounts?.newTableCount ? '✅ Counts match' : '❌ Counts do not match'}
        </p>
      </div>

      {/* Sample Data Comparison */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Sample Data Comparison</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Old Table (rackui_columns)</h3>
            <div className="bg-gray-50 p-2 rounded text-xs">
              <pre>{JSON.stringify(results.sampleData?.oldTable, null, 2)}</pre>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">New Table (rackuic)</h3>
            <div className="bg-gray-50 p-2 rounded text-xs">
              <pre>{JSON.stringify(results.sampleData?.newTable, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Relations Status */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Column Template Relations Status</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Relation ID</th>
              <th className="border p-2 text-left">Template Name</th>
              <th className="border p-2 text-left">FK Column ID</th>
              <th className="border p-2 text-left">Exists in New Table?</th>
            </tr>
          </thead>
          <tbody>
            {results.relationStatus?.map((rel: any) => (
              <tr key={rel.relation_id}>
                <td className="border p-2">{rel.relation_id}</td>
                <td className="border p-2">{rel.coltemps?.coltemp_name}</td>
                <td className="border p-2">{rel.fk_rackui_column_id}</td>
                <td className="border p-2">
                  {rel.existsInNewTable ? '✅ Yes' : '❌ No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={runMigrationChecks}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Re-run Checks
      </button>
    </div>
  );
}