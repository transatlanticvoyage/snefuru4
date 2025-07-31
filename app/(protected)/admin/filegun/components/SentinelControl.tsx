'use client';

import { useState, useEffect } from 'react';
import { useSentinel } from '../hooks/useSentinel';

interface SentinelControlProps {
  currentPath: string;
}

export default function SentinelControl({ currentPath }: SentinelControlProps) {
  const {
    status,
    operations,
    isLoading,
    error,
    startSentinel,
    stopSentinel,
    restartSentinel,
    syncDirectory,
    clearOperations,
    cleanupDeleted
  } = useSentinel();

  const [syncPath, setSyncPath] = useState('/app');
  const [showOperations, setShowOperations] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState('xls');
  const [selectedAction, setSelectedAction] = useState('create new folder');
  const [selectedIncrement, setSelectedIncrement] = useState('2');
  const [customIncrement, setCustomIncrement] = useState('');
  const [meadCraterNumber, setMeadCraterNumber] = useState('0');
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedHousing, setSelectedHousing] = useState('create in end-selected folder');
  const [selectedRawFileSource, setSelectedRawFileSource] = useState('use blank file from scratch');

  // Calculate MeadCraterNumber based on current folder's numbered subfolders + increment
  const calculateMeadCraterNumber = async (currentPath: string) => {
    try {
      console.log('Calculating MeadCraterNumber for path:', currentPath);
      const response = await fetch(`/api/filegun/list?path=${encodeURIComponent(currentPath)}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.items) {
        // Filter for folders only and those that begin with numbers
        const numberedFolders = data.data.items
          .filter((item: any) => item.type === 'folder')
          .map((folder: any) => {
            const match = folder.name.match(/^(\d+)/); // Extract leading number
            return match ? parseInt(match[1], 10) : null;
          })
          .filter((num: number | null) => num !== null) as number[];

        console.log('Found numbered folders:', numberedFolders);
        
        // Find the highest number, default to 0 if no numbered folders
        const highestNumber = numberedFolders.length > 0 ? Math.max(...numberedFolders) : 0;
        
        // Get increment value
        const incrementValue = selectedIncrement === 'Custom' 
          ? parseInt(customIncrement || '0', 10) 
          : parseInt(selectedIncrement, 10);

        // Calculate final MeadCraterNumber
        const meadNumber = highestNumber + incrementValue;
        console.log('MeadCraterNumber calculated:', meadNumber, '(highest:', highestNumber, '+ increment:', incrementValue, ')');
        setMeadCraterNumber(meadNumber.toString());
      } else {
        console.log('No data or unsuccessful response');
        // If no data, at least show the increment value
        const incrementValue = selectedIncrement === 'Custom' 
          ? parseInt(customIncrement || '0', 10) 
          : parseInt(selectedIncrement, 10);
        setMeadCraterNumber(incrementValue.toString());
      }
    } catch (error) {
      console.error('Error calculating MeadCraterNumber:', error);
      // On error, at least show the increment value
      const incrementValue = selectedIncrement === 'Custom' 
        ? parseInt(customIncrement || '0', 10) 
        : parseInt(selectedIncrement, 10);
      setMeadCraterNumber(incrementValue.toString());
    }
  };

  // Recalculate MeadCraterNumber when currentPath or increment settings change
  useEffect(() => {
    if (currentPath) {
      calculateMeadCraterNumber(currentPath);
    }
  }, [currentPath, selectedIncrement, customIncrement]);

  const handleStart = async () => {
    await startSentinel(syncPath);
  };

  const handleStop = async () => {
    await stopSentinel();
  };

  const handleRestart = async () => {
    await restartSentinel(syncPath);
  };

  const handleSync = async () => {
    await syncDirectory(syncPath);
  };

  const handleClearOperations = async () => {
    await clearOperations();
  };

  const handleCleanup = async () => {
    await cleanupDeleted();
  };

  const getStatusColor = () => {
    if (!status) return 'gray';
    if (status.isActive && !status.isScanning) return 'green';
    if (status.isScanning) return 'blue';
    return 'red';
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    if (status.isScanning) return 'Scanning...';
    if (status.isActive) return 'Active';
    return 'Inactive';
  };

  if (isCollapsed) {
    return (
      <div className="mb-4 flex items-center space-x-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Expand Sentinel
        </button>
        <div className="border border-black p-1" style={{ fontSize: '15px', padding: '5px' }}>
          r22 - mead function - create new folder (and sometimes a file) in numbered convention
          <br />
          <div className="flex items-center mt-2 space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">filetype</span>
              <div className="flex items-center">
                {['none', 'xls', 'csv', 'ts', 'tsx', 'txt', 'html', 'php', 'docx'].map((fileType, index) => (
                <button
                  key={fileType}
                  onClick={() => setSelectedFileType(fileType)}
                  className={`px-2 py-1 text-sm border border-gray-300 hover:bg-gray-100 transition-colors ${
                    index === 0 ? 'rounded-l' : ''
                  } ${
                    index === 8 ? 'rounded-r' : ''
                  } ${
                    index > 0 ? '-ml-px' : ''
                  } ${
                    selectedFileType === fileType ? 'bg-blue-100 border-blue-300' : 'bg-white'
                  }`}
                >
                  {fileType}
                </button>
              ))}
            </div>
            
            <div className="flex items-center">
              {['create new folder', '+ new file', '+open'].map((action, index) => (
                <button
                  key={action}
                  onClick={() => {/* Future functionality will go here */}}
                  className={`px-2 py-1 text-sm border border-gray-400 transition-colors ${
                    index === 0 ? 'rounded-l' : ''
                  } ${
                    index === 2 ? 'rounded-r' : ''
                  } ${
                    index > 0 ? '-ml-px' : ''
                  }`}
                  style={{ 
                    backgroundColor: '#ecc9f6',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#b4efe3';
                    e.currentTarget.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ecc9f6';
                    e.currentTarget.style.cursor = 'pointer';
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">housing</span>
              <select
                value={selectedHousing}
                onChange={(e) => setSelectedHousing(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-sm rounded bg-white hover:bg-gray-50"
              >
                <option value="create in end-selected folder">create in end-selected folder</option>
                <option value="create in cauldron vat paradigm" disabled className="text-gray-400">create in cauldron vat paradigm</option>
                <option value="create in selected column">create in selected column</option>
                <option value="create in selected column's active folder">create in selected column's active folder</option>
              </select>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="flex items-center">
                  <div
                    className="border border-gray-300 px-2 py-1 text-sm rounded-l bg-gray-100 cursor-pointer flex items-center justify-center"
                    style={{ width: '80px' }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => navigator.clipboard.writeText(meadCraterNumber)}
                    title="MeadCraterNumber - Click to copy"
                  >
                    <span className="text-center">{meadCraterNumber}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter filename here... 'top lettuce brands'"
                    className="border border-gray-300 px-3 py-1 text-sm rounded-r -ml-px"
                    style={{ width: '420px' }}
                  />
                </div>
                {showTooltip && (
                  <div className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-black text-white rounded whitespace-nowrap z-10">
                    MeadCraterNumber
                  </div>
                )}
                <div className="flex mt-1">
                  <div style={{ width: '80px' }} className="text-center">
                    <span className="font-bold text-sm">crater</span>
                  </div>
                  <div style={{ width: '420px' }} className="pl-3">
                    <span className="font-bold text-sm">fobject_name_core</span>
                  </div>
                </div>
              </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">increment</span>
              <div className="flex items-center">
                {['1', '2', '5', '10', 'Custom'].map((increment, index) => (
                  <button
                    key={increment}
                    onClick={() => setSelectedIncrement(increment)}
                    className={`px-2 py-1 text-sm border border-gray-300 hover:bg-gray-100 transition-colors ${
                      index === 0 ? 'rounded-l' : ''
                    } ${
                      index === 4 && selectedIncrement !== 'Custom' ? 'rounded-r' : ''
                    } ${
                      index > 0 ? '-ml-px' : ''
                    } ${
                      selectedIncrement === increment ? 'bg-blue-100 border-blue-300' : 'bg-white'
                    }`}
                  >
                    {increment}
                  </button>
                ))}
                {selectedIncrement === 'Custom' && (
                  <input
                    type="number"
                    min="0"
                    value={customIncrement}
                    onChange={(e) => setCustomIncrement(e.target.value)}
                    placeholder="0"
                    className="border border-gray-300 hover:bg-gray-100 px-2 py-1 text-sm rounded-r w-16 -ml-px"
                  />
                )}
              </div>
            </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">raw file source</span>
              <select
                value={selectedRawFileSource}
                onChange={(e) => setSelectedRawFileSource(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-sm rounded bg-white hover:bg-gray-50"
              >
                <option value="use blank file from scratch">use blank file from scratch</option>
                <option value="use template files from(need more build here)" disabled className="text-gray-400">use template files from(need more build here)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Collapse
          </button>
          <h3 className="text-lg font-semibold text-gray-800">🛡️ Filegun Sentinel</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              getStatusColor() === 'green' ? 'bg-green-500' : 
              getStatusColor() === 'blue' ? 'bg-blue-500' : 
              getStatusColor() === 'red' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>
        
        <button
          onClick={() => setShowOperations(!showOperations)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showOperations ? 'Hide' : 'Show'} Operations ({operations.length})
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Status Info */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Files</div>
            <div className="font-semibold">{status.totalFiles.toLocaleString()}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Folders</div>
            <div className="font-semibold">{status.totalFolders.toLocaleString()}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Pending</div>
            <div className="font-semibold">{status.pendingChanges}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="text-gray-500">Errors</div>
            <div className="font-semibold text-red-600">{status.errorCount}</div>
          </div>
        </div>
      )}

      {/* Path Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Watch Path:
        </label>
        <input
          type="text"
          value={syncPath}
          onChange={(e) => setSyncPath(e.target.value)}
          className="w-full px-3 py-1 border border-gray-300 rounded text-sm font-mono"
          placeholder="/app"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleStart}
          disabled={isLoading || (status?.isActive && !status?.isScanning)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '▶️ Start'}
        </button>

        <button
          onClick={handleStop}
          disabled={isLoading || !status?.isActive}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '⏹️ Stop'}
        </button>

        <button
          onClick={handleRestart}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '🔄 Restart'}
        </button>

        <button
          onClick={handleSync}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '🔄 Force Sync'}
        </button>

        <button
          onClick={handleCleanup}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '🧹 Cleanup'}
        </button>
      </div>

      {/* Last Sync Time */}
      {status?.lastSyncTime && (
        <div className="text-xs text-gray-500 mb-2">
          Last sync: {new Date(status.lastSyncTime).toLocaleString()}
        </div>
      )}

      {/* Operations History */}
      {showOperations && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Operations</h4>
            <button
              onClick={handleClearOperations}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear History
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {operations.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No operations yet
              </div>
            ) : (
              operations.slice(0, 10).map((op) => (
                <div
                  key={op.id}
                  className={`text-xs p-2 mb-1 rounded border-l-3 ${
                    op.status === 'completed' ? 'bg-green-50 border-green-400' :
                    op.status === 'error' ? 'bg-red-50 border-red-400' :
                    'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{op.action}</span>
                    <span className="text-gray-500">
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600 truncate" title={op.path}>
                    {op.path}
                  </div>
                  {op.error && (
                    <div className="text-red-600 mt-1">{op.error}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}