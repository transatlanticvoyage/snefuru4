"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  category: string;
  message: string;
  details?: any;
  stack_trace?: string;
  user_id?: string;
  batch_id?: string;
  plan_id?: string;
  job_id?: string;
}

export default function StatusBox1Client() {
  const { user } = useAuth();
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [copying, setCopying] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClientComponentClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch error logs
  const fetchErrorLogs = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Fetching error logs for user:', user.id);
      const response = await fetch('/api/error-logs/get-logs');
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response data:', result);
      
      if (result.success) {
        console.log('Setting logs:', result.logs?.length || 0, 'logs found');
        setErrorLogs(result.logs || []);
      } else {
        throw new Error(result.message || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch error logs');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh setup
  useEffect(() => {
    fetchErrorLogs();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchErrorLogs, 3000); // Refresh every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, autoRefresh]);

  // Clear all error logs
  const clearErrorLogs = async () => {
    try {
      setClearing(true);
      setError(null);
      
      const response = await fetch('/api/error-logs/clear-logs', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        setErrorLogs([]);
        setError('Error logs cleared successfully');
      } else {
        throw new Error(result.message || 'Failed to clear logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear error logs');
    } finally {
      setClearing(false);
    }
  };

  // Copy logs to clipboard
  const copyLogsToClipboard = async () => {
    try {
      setCopying(true);
      const logsText = formatLogsForCopy();
      await navigator.clipboard.writeText(logsText);
      setError('Error logs copied to clipboard successfully!');
    } catch (err) {
      setError('Failed to copy logs to clipboard');
    } finally {
      setCopying(false);
    }
  };

  // Format logs for copying
  const formatLogsForCopy = () => {
    const filteredLogs = getFilteredLogs();
    if (filteredLogs.length === 0) {
      return 'No error logs to copy.';
    }
    
    return filteredLogs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const header = `[${timestamp}] [${log.level.toUpperCase()}] [${log.category}]`;
      const message = log.message;
      const details = log.details ? `\nDetails: ${JSON.stringify(log.details, null, 2)}` : '';
      const stack = log.stack_trace ? `\nStack Trace:\n${log.stack_trace}` : '';
      const metadata = [];
      if (log.batch_id) metadata.push(`Batch: ${log.batch_id}`);
      if (log.plan_id) metadata.push(`Plan: ${log.plan_id}`);
      if (log.job_id) metadata.push(`Job: ${log.job_id}`);
      const metaStr = metadata.length > 0 ? `\nMetadata: ${metadata.join(', ')}` : '';
      
      return `${header}\n${message}${details}${stack}${metaStr}\n${'='.repeat(80)}`;
    }).join('\n\n');
  };

  // Get filtered logs based on current filters
  const getFilteredLogs = () => {
    return errorLogs.filter(log => {
      const levelMatch = filterLevel === 'all' || log.level === filterLevel;
      const categoryMatch = filterCategory === 'all' || log.category === filterCategory;
      return levelMatch && categoryMatch;
    });
  };

  // Get unique categories for filter dropdown
  const getUniqueCategories = () => {
    const categories = new Set(errorLogs.map(log => log.category));
    return Array.from(categories).sort();
  };

  // Format single log for display
  const formatLogForDisplay = (log: ErrorLog) => {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const levelBadge = log.level.toUpperCase().padEnd(7);
    const categoryBadge = log.category.padEnd(20);
    const message = log.message;
    
    let result = `[${timestamp}] [${levelBadge}] [${categoryBadge}] ${message}`;
    
    if (log.details) {
      result += `\n    Details: ${JSON.stringify(log.details, null, 4)}`;
    }
    
    if (log.stack_trace) {
      result += `\n    Stack Trace:\n${log.stack_trace.split('\n').map(line => `    ${line}`).join('\n')}`;
    }
    
    const metadata = [];
    if (log.batch_id) metadata.push(`Batch: ${log.batch_id}`);
    if (log.plan_id) metadata.push(`Plan: ${log.plan_id}`);
    if (log.job_id) metadata.push(`Job: ${log.job_id}`);
    if (metadata.length > 0) {
      result += `\n    Metadata: ${metadata.join(', ')}`;
    }
    
    return result;
  };

  if (loading) {
    return (
      <div className="w-full max-w-[95vw] mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading error logs...</div>
        </div>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();
  const uniqueCategories = getUniqueCategories();

  return (
    <div className="w-full max-w-[95vw] mx-auto p-4">
      {/* Fixed Error/Success Message Area */}
      {error && (
        <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm font-medium shadow-lg ${
          error.includes('successfully') || error.includes('copied') 
            ? 'bg-green-100 text-green-700 border-b border-green-200' 
            : 'bg-red-100 text-red-700 border-b border-red-200'
        }`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Add top margin when error is showing */}
      <div className={error ? 'mt-12' : ''}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Detailed Error Logging System</h1>
          <div className="text-sm text-gray-500">
            Total Logs: {errorLogs.length} | Filtered: {filteredLogs.length}
            {autoRefresh && <span className="ml-2 text-green-600">● Auto-refreshing</span>}
          </div>
        </div>

        {/* Debugging Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">🔍 Debug Information</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>User ID: {user?.id || 'Not available'}</div>
            <div>Logs fetched: {errorLogs.length}</div>
            <div>Auto-refresh: {autoRefresh ? 'Enabled (3s)' : 'Disabled'}</div>
            <div>Last fetch: {new Date().toLocaleTimeString()}</div>
            <div className="text-xs mt-2">
              💡 Check browser console (F12) for detailed API responses
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Large Copy Button */}
            <button
              onClick={copyLogsToClipboard}
              disabled={copying || filteredLogs.length === 0}
              className={`px-6 py-3 text-lg font-medium rounded-lg transition-colors ${
                copying || filteredLogs.length === 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copying ? 'Copying...' : `📋 Copy All Logs (${filteredLogs.length})`}
            </button>

            {/* Clear Errors Button */}
            <button
              onClick={clearErrorLogs}
              disabled={clearing || errorLogs.length === 0}
              className={`px-4 py-2 font-medium rounded transition-colors ${
                clearing || errorLogs.length === 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {clearing ? 'Clearing...' : '🗑️ Clear All Errors'}
            </button>

            {/* Auto Refresh Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm font-medium">Auto Refresh (3s)</span>
            </label>

            {/* Manual Refresh Button */}
            <button
              onClick={fetchErrorLogs}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              🔄 Refresh
            </button>

            {/* Database Setup Button */}
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/error-logs/setup-table', {
                    method: 'POST'
                  });
                  const result = await response.json();
                  if (result.success) {
                    setError('Database table setup completed successfully!');
                  } else {
                    setError(result.message || 'Failed to setup database table');
                  }
                } catch (err) {
                  setError('Failed to setup database table');
                }
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              🔧 Setup DB Table
            </button>
            
            {/* Debug Test Button */}
            <button
              onClick={async () => {
                try {
                  console.log('Creating test log entry...');
                  const response = await fetch('/api/error-logs/add-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      level: 'info',
                      category: 'debug_test',
                      message: 'Manual test log entry created from statusbox1',
                      details: { timestamp: new Date().toISOString(), testData: 'Hello World!' }
                    })
                  });
                  
                  const result = await response.json();
                  console.log('Add log response:', result);
                  
                  if (result.success) {
                    setError('✅ Test log created! Check logs below.');
                    // Force refresh logs
                    await fetchErrorLogs();
                  } else {
                    setError('❌ Failed to create test log: ' + (result.message || 'Unknown error'));
                  }
                } catch (err) {
                  console.error('Test log error:', err);
                  setError('❌ Error creating test log: ' + (err instanceof Error ? err.message : 'Unknown error'));
                }
              }}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              🧪 Create Test Log
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Level:</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="form-select text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="form-select text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Logs Display */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium">Error Logs</h3>
            <p className="text-sm text-gray-500">
              Detailed logging for background processing and image generation systems
            </p>
          </div>
          
          <div className="p-4">
            {filteredLogs.length > 0 ? (
              <textarea
                ref={textAreaRef}
                value={filteredLogs.map(formatLogForDisplay).join('\n\n' + '='.repeat(100) + '\n\n')}
                readOnly
                className="w-full h-[70vh] font-mono text-xs bg-gray-900 text-green-400 p-4 rounded border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  lineHeight: '1.4'
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-xl mb-2">No Error Logs Found</div>
                <div className="text-sm">
                  {errorLogs.length === 0 
                    ? 'No logs have been recorded yet. Try generating some sample logs above!' 
                    : 'No logs match the current filters.'
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        {errorLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <h3 className="text-lg font-medium mb-4">Log Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {errorLogs.filter(log => log.level === 'error').length}
                </div>
                <div className="text-sm text-gray-500">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {errorLogs.filter(log => log.level === 'warning').length}
                </div>
                <div className="text-sm text-gray-500">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {errorLogs.filter(log => log.level === 'info').length}
                </div>
                <div className="text-sm text-gray-500">Info</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {errorLogs.filter(log => log.level === 'debug').length}
                </div>
                <div className="text-sm text-gray-500">Debug</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}