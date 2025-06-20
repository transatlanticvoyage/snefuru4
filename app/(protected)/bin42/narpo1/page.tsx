"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NarpiPush {
  id: string;
  push_name: string;
  push_desc: string;
  created_at: string;
  push_status1: string;
  fk_batch_id: string;
  kareench1: any;
  images_plans_batches?: {
    rel_users_id: string;
  };
}

export default function Narpo1Page() {
  const { user } = useAuth();
  const [pushes, setPushes] = useState<NarpiPush[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState('option1');
  const [selectedStickyColumns, setSelectedStickyColumns] = useState('option1');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'narpo1 - Snefuru';
    
    // Remove layout constraints for full width
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.className = 'w-full';
    }
    
    // Load state from URL parameters and localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const colTempParam = urlParams.get('coltemp') || localStorage.getItem('narpo1_coltemp') || 'option1';
    const stickyColParam = urlParams.get('stickycol') || localStorage.getItem('narpo1_stickycol') || 'option1';
    
    setSelectedColumnTemplate(colTempParam);
    setSelectedStickyColumns(stickyColParam);
    
    // Cleanup function to restore original layout when leaving page
    return () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.className = 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8';
      }
    };
  }, []);

  useEffect(() => {
    const fetchNarpiPushes = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          throw new Error('Could not find user record');
        }

        // Fetch narpi_pushes data for this user via batch relationship
        const { data, error: pushesError } = await supabase
          .from('narpi_pushes')
          .select(`
            *,
            images_plans_batches!fk_batch_id(
              rel_users_id
            )
          `)
          .order('created_at', { ascending: false });

        if (pushesError) {
          throw pushesError;
        }

        // Filter pushes to only show those for batches owned by the current user
        const userPushes = (data || []).filter(push => 
          push.images_plans_batches && 
          push.images_plans_batches.rel_users_id === userData.id
        );

        setPushes(userPushes);
      } catch (err) {
        console.error('Error fetching narpi pushes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchNarpiPushes();
  }, [user, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyKareenchValue = async (pushId: string, kareenchValue: any) => {
    try {
      const valueToString = typeof kareenchValue === 'string' 
        ? kareenchValue 
        : JSON.stringify(kareenchValue, null, 2);
      
      await navigator.clipboard.writeText(valueToString);
      setCopiedId(pushId);
      
      // Clear the copied indicator after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy kareench1 value:', err);
    }
  };

  // Column template system
  const columns = ['select', 'view', 'push_name', 'push_desc', 'push_status1', 'created_at', 'fk_batch_id', 'kareench1', 'actions'];

  // Row selection handlers
  const handleSelectRow = (pushId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(pushId)) {
      newSelected.delete(pushId);
    } else {
      newSelected.add(pushId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === pushes.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(pushes.map(push => push.id)));
    }
  };

  const getVisibleColumns = () => {
    const stickyColumnCount = getStickyColumnCount();
    const stickyColumns = columns.slice(0, stickyColumnCount);
    
    switch (selectedColumnTemplate) {
      case 'option1': 
        return columns; // All columns
      case 'option2': {
        const templateColumns = columns.slice(0, 7); // Columns 1-7
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option3': {
        const templateColumns = columns.slice(7, 14); // Columns 8-14
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option4': {
        const templateColumns = columns.slice(14, 21); // Columns 15-21
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option5': {
        const templateColumns = columns.slice(21, 28); // Columns 22-28
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      default: 
        return columns;
    }
  };

  const getStickyColumnCount = () => {
    switch (selectedStickyColumns) {
      case 'option1': return 1;
      case 'option2': return 2;
      case 'option3': return 3;
      case 'option4': return 4;
      case 'option5': return 5;
      default: return 1;
    }
  };

  const updateUrlAndStorage = (colTemp: string, stickyCol: string) => {
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('coltemp', colTemp);
    url.searchParams.set('stickycol', stickyCol);
    window.history.replaceState({}, '', url.toString());
    
    // Update localStorage
    localStorage.setItem('narpo1_coltemp', colTemp);
    localStorage.setItem('narpo1_stickycol', stickyCol);
  };

  const handleColumnTemplateChange = (option: string) => {
    setSelectedColumnTemplate(option);
    updateUrlAndStorage(option, selectedStickyColumns);
  };

  const handleStickyColumnsChange = (option: string) => {
    setSelectedStickyColumns(option);
    updateUrlAndStorage(selectedColumnTemplate, option);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading narpi pushes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-red-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Data</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full -m-6 ml-2">
      <div className="pl-2 pr-0 py-6 w-full max-w-none">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Narpi Image Pushes 383</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and track your WordPress content pushes
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {pushes.length} Total Pushes
              </span>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  // TODO: Implement create new push functionality
                  alert('Create new push functionality coming soon!');
                }}
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Push
              </button>
            </div>
          </div>
        </div>

        {/* Column Template Control Bar */}
        <div className="mb-6 flex items-stretch space-x-4">
          {/* SQL View Info */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 flex flex-col justify-between" style={{maxWidth: '130px', maxHeight: '75px'}}>
            <div className="font-semibold text-gray-700 text-xs leading-tight">SQL View Info</div>
            <div className="text-gray-600 text-xs leading-tight">view name: narpi_pushes</div>
            <div className="text-gray-600 text-xs leading-tight"># columns: {columns.length}</div>
          </div>

          {/* Column Template Options */}
          <div className="bg-white border border-gray-300 rounded-lg p-2 flex flex-col justify-between" style={{maxWidth: '600px', maxHeight: '75px'}}>
            <div className="text-xs font-semibold text-gray-700 mb-1">Column Templates (Show/Hide)</div>
            <div className="flex space-x-1">
              {[
                { id: 'option1', label: 'OPTION 1', subtitle: 'col temp all', range: 'columns 1-~' },
                { id: 'option2', label: 'OPTION 2', subtitle: 'col temp a', range: 'columns 1-7' },
                { id: 'option3', label: 'OPTION 3', subtitle: 'col temp b', range: 'columns 8-14' },
                { id: 'option4', label: 'OPTION 4', subtitle: 'col temp c', range: 'columns 15-21' },
                { id: 'option5', label: 'OPTION 5', subtitle: 'col temp d', range: 'columns 22-28' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => handleColumnTemplateChange(option.id)}
                  className={`text-xs leading-none py-1 px-1 rounded border text-center ${
                    selectedColumnTemplate === option.id
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  style={{width: '118px', height: '45px', fontSize: '10px'}}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div>{option.subtitle}</div>
                  <div>{option.range}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sticky Columns Control */}
          <div className="bg-white border border-gray-300 rounded-lg p-2 flex flex-col justify-between" style={{maxHeight: '75px'}}>
            <div className="text-xs font-semibold text-gray-700 mb-1">Sticky Columns At Left Side Of UI Grid Table</div>
            <div className="flex space-x-1">
              {[
                { id: 'option1', label: 'OPTION 1', subtitle: '1 left-most', range: 'column' },
                { id: 'option2', label: 'OPTION 2', subtitle: '2 left-most', range: 'columns' },
                { id: 'option3', label: 'OPTION 3', subtitle: '3 left-most', range: 'columns' },
                { id: 'option4', label: 'OPTION 4', subtitle: '4 left-most', range: 'columns' },
                { id: 'option5', label: 'OPTION 5', subtitle: '5 left-most', range: 'columns' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => handleStickyColumnsChange(option.id)}
                  className={`text-xs leading-none py-1 px-1 rounded border text-center ${
                    selectedStickyColumns === option.id
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  style={{width: '78px', height: '45px', fontSize: '10px'}}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div>{option.subtitle}</div>
                  <div>{option.range}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {pushes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pushes Found</h3>
            <p className="text-gray-500 mb-4">
              You haven't created any narpi pushes yet. Get started by creating your first push.
            </p>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                alert('Create new push functionality coming soon!');
              }}
            >
              Create Your First Push
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Narpi Pushes Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                All your WordPress content pushes and their current status
              </p>
            </div>

            {/* Large UI Table Grid */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {getVisibleColumns().map((col, index) => {
                      const stickyColumnCount = getStickyColumnCount();
                      const isSticky = index < stickyColumnCount;
                      const isLastSticky = index === stickyColumnCount - 1;
                      const stickyClass = isSticky ? 'sticky left-0 z-10' : '';
                      const leftPosition = isSticky ? `${index * 150}px` : 'auto';
                      
                      // Determine background color
                      let bgColor = 'bg-blue-50'; // narpi_pushes table columns
                      if (col === 'select' || col === 'view' || col === 'actions') {
                        bgColor = 'bg-gray-100'; // UI action columns
                      }
                      
                      return (
                        <th 
                          key={col} 
                          className={`${col === 'select' ? 'px-1.5 py-0.5' : 'px-6 py-3'} text-left text-xs font-bold text-gray-700 lowercase tracking-wider ${bgColor} ${stickyClass} relative ${col === 'select' ? 'cursor-pointer' : ''}`}
                          style={{
                            ...(isSticky ? { left: leftPosition } : {}),
                            ...(col === 'select' ? { paddingTop: '2px !important', paddingBottom: '2px !important', paddingLeft: '6px !important', paddingRight: '6px !important' } : {})
                          }}
                          onClick={col === 'select' ? handleSelectAll : undefined}
                        >
                          {col === 'select' ? (
                            <input
                              type="checkbox"
                              checked={selectedRows.size === pushes.length && pushes.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                              style={{width: '18px', height: '18px'}}
                            />
                          ) : (
                            col
                          )}
                          {isLastSticky && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pushes.map((push) => (
                    <tr key={push.id} className="hover:bg-gray-50">
                      {getVisibleColumns().map((col, index) => {
                        const stickyColumnCount = getStickyColumnCount();
                        const isSticky = index < stickyColumnCount;
                        const isLastSticky = index === stickyColumnCount - 1;
                        const stickyClass = isSticky ? 'sticky left-0 z-10' : '';
                        const leftPosition = isSticky ? `${index * 150}px` : 'auto';
                        const bgClass = 'bg-white';
                        
                        return (
                          <td 
                            key={col} 
                            className={`${col === 'select' ? 'px-1.5 py-0.5' : 'px-6 py-4'} text-sm text-gray-900 ${stickyClass} ${bgClass} relative ${col === 'select' ? 'cursor-pointer' : ''}`}
                            style={{
                              ...(isSticky ? { left: leftPosition } : {}),
                              ...(col === 'select' ? { paddingTop: '2px !important', paddingBottom: '2px !important', paddingLeft: '6px !important', paddingRight: '6px !important' } : {})
                            }}
                            onClick={col === 'select' ? () => handleSelectRow(push.id) : undefined}
                          >
                            {col === 'select' && (
                              <input
                                type="checkbox"
                                checked={selectedRows.has(push.id)}
                                onChange={() => handleSelectRow(push.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                style={{width: '18px', height: '18px'}}
                              />
                            )}
                            {col === 'view' && (
                              <button
                                onClick={() => {
                                  window.open(`/bin43/narpivid?id=${push.id}`, '_blank');
                                }}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <svg className="-ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                individual view
                              </button>
                            )}
                            {col === 'push_name' && (
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {push.push_name}
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono">
                                    ID: {push.id.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            )}
                            {col === 'push_desc' && (
                              <div className="text-sm text-gray-900 max-w-xs">
                                {push.push_desc ? (
                                  <div className="truncate" title={push.push_desc}>
                                    {push.push_desc.length > 100
                                      ? `${push.push_desc.substring(0, 100)}...`
                                      : push.push_desc}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">No description</span>
                                )}
                              </div>
                            )}
                            {col === 'push_status1' && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(push.push_status1)}`}>
                                {push.push_status1}
                              </span>
                            )}
                            {col === 'created_at' && (
                              <div className="whitespace-nowrap">
                                {formatDate(push.created_at)}
                              </div>
                            )}
                            {col === 'fk_batch_id' && (
                              <div className="text-xs font-mono text-gray-600 whitespace-nowrap">
                                {push.fk_batch_id.substring(0, 8)}...
                              </div>
                            )}
                            {col === 'kareench1' && (
                              <div className="flex items-center space-x-2">
                                <div className="text-xs font-mono text-gray-600 max-w-xs">
                                  {push.kareench1 ? (
                                    <div className="truncate" title={typeof push.kareench1 === 'string' ? push.kareench1 : JSON.stringify(push.kareench1)}>
                                      {typeof push.kareench1 === 'string' 
                                        ? (push.kareench1.length > 50 ? `${push.kareench1.substring(0, 50)}...` : push.kareench1)
                                        : JSON.stringify(push.kareench1).length > 50 
                                          ? `${JSON.stringify(push.kareench1).substring(0, 50)}...`
                                          : JSON.stringify(push.kareench1)
                                      }
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">No data</span>
                                  )}
                                </div>
                                {push.kareench1 && (
                                  <button
                                    onClick={() => copyKareenchValue(push.id, push.kareench1)}
                                    className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded ${
                                      copiedId === push.id
                                        ? 'text-green-800 bg-green-100'
                                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                                    title="Copy kareench1 data"
                                  >
                                    {copiedId === push.id ? (
                                      <>
                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                            {col === 'actions' && (
                              <div className="flex items-center space-x-2 whitespace-nowrap">
                                <button
                                  className="text-indigo-600 hover:text-indigo-900"
                                  onClick={() => {
                                    alert(`View details for push: ${push.push_name}`);
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  className="text-green-600 hover:text-green-900"
                                  onClick={() => {
                                    alert(`Edit push: ${push.push_name}`);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete push: ${push.push_name}?`)) {
                                      alert('Delete functionality coming soon!');
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                            {isLastSticky && (
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {pushes.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Pushes</dt>
                      <dd className="text-lg font-medium text-gray-900">{pushes.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {pushes.filter(p => p.push_status1?.toLowerCase() === 'completed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {pushes.filter(p => p.push_status1?.toLowerCase() === 'pending').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {pushes.filter(p => p.push_status1?.toLowerCase() === 'failed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 flex justify-start">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </div>
    </div>
  );
} 