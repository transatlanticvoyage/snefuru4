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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  
  // Batch filtering state
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [availableBatches, setAvailableBatches] = useState<Array<{id: string, batch_name: string}>>([]);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'narpo1 - Snefuru';
    
    // Handle URL parameters for popup and tab state
    const urlParams = new URLSearchParams(window.location.search);
    const fpop = urlParams.get('fpop');
    const fkBatchIdParam = urlParams.get('fk_batch_id');
    const ptab1 = urlParams.get('ptab1');
    const ptab2 = urlParams.get('ptab2');
    const ptab3 = urlParams.get('ptab3');
    const ptab4 = urlParams.get('ptab4');
    const ptab5 = urlParams.get('ptab5');
    const ptab6 = urlParams.get('ptab6');
    const ptab7 = urlParams.get('ptab7');
    
    // Set batch filter from URL parameter
    if (fkBatchIdParam) {
      setSelectedBatchId(fkBatchIdParam);
    }
    
    // Auto-open popup if fpop=open is in URL
    if (fpop === 'open') {
      setIsPopupOpen(true);
      
      // Set active tab based on URL parameters
      if (ptab1 === 'active') {
        setActivePopupTab('ptab1');
      } else if (ptab2 === 'active') {
        setActivePopupTab('ptab2');
      } else if (ptab3 === 'active') {
        setActivePopupTab('ptab3');
      } else if (ptab4 === 'active') {
        setActivePopupTab('ptab4');
      } else if (ptab5 === 'active') {
        setActivePopupTab('ptab5');
      } else if (ptab6 === 'active') {
        setActivePopupTab('ptab6');
      } else if (ptab7 === 'active') {
        setActivePopupTab('ptab7');
      }
    }
    
    // Remove layout constraints for full width
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.className = 'w-full';
    }
    
    // Load state from URL parameters and localStorage
    const urlParamsForLayout = new URLSearchParams(window.location.search);
    const colTempParam = urlParamsForLayout.get('coltemp') || localStorage.getItem('narpo1_coltemp') || 'option1';
    const stickyColParam = urlParamsForLayout.get('stickycol') || localStorage.getItem('narpo1_stickycol') || 'option1';
    
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

  // Track URL changes
  useEffect(() => {
    // Initialize URL on mount
    setCurrentUrl(window.location.href);
    
    // Handle URL changes
    const handleUrlChange = () => {
      setCurrentUrl(window.location.href);
    };
    
    // Custom event for URL updates
    const handleCustomUrlUpdate = () => {
      setCurrentUrl(window.location.href);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('urlchange', handleCustomUrlUpdate);
    
    // Use MutationObserver as fallback
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        setCurrentUrl(window.location.href);
      }
    });
    
    observer.observe(document.querySelector('head') || document.documentElement, {
      childList: true,
      subtree: true
    });
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleCustomUrlUpdate);
      observer.disconnect();
    };
  }, [currentUrl]);

  // Fetch available batches for the dropdown
  useEffect(() => {
    const fetchAvailableBatches = async () => {
      if (!user?.id) return;

      try {
        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) return;

        // Fetch batches owned by the current user
        const { data: batchesData, error: batchesError } = await supabase
          .from('images_plans_batches')
          .select('id, batch_name')
          .eq('rel_users_id', userData.id)
          .order('batch_name', { ascending: true });

        if (!batchesError && batchesData) {
          setAvailableBatches(batchesData);
        }
      } catch (err) {
        console.error('Error fetching available batches:', err);
      }
    };

    fetchAvailableBatches();
  }, [user, supabase]);

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

        // Build the query with optional batch filtering
        let query = supabase
          .from('narpi_pushes')
          .select(`
            *,
            images_plans_batches!fk_batch_id(
              rel_users_id
            )
          `);

        // Add batch filter if selectedBatchId is set
        if (selectedBatchId) {
          query = query.eq('fk_batch_id', selectedBatchId);
        }

        const { data, error: pushesError } = await query.order('created_at', { ascending: false });

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
  }, [user, supabase, selectedBatchId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle batch filter change and update URL
  const handleBatchFilterChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    
    // Update URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (batchId) {
      urlParams.set('fk_batch_id', batchId);
    } else {
      urlParams.delete('fk_batch_id');
    }
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    
    // Trigger URL change event for other components
    window.dispatchEvent(new Event('urlchange'));
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

  // Handle checkbox clicks with mutual exclusivity
  const handleKz101Click = () => {
    setKz101Checked(true);
    setKz103Checked(false);
  };

  const handleKz103Click = () => {
    setKz103Checked(true);
    setKz101Checked(false);
  };

  // Update URL parameters for popup state
  const updatePopupURL = (fpopOpen: boolean, tabActive?: string) => {
    const url = new URL(window.location.href);
    
    if (fpopOpen) {
      url.searchParams.set('fpop', 'open');
      
      // Clear all tab parameters first
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
      
      // Set the active tab parameter
      if (tabActive) {
        url.searchParams.set(tabActive, 'active');
      } else {
        // Default to ptab1 if no specific tab provided
        url.searchParams.set('ptab1', 'active');
      }
    } else {
      // Remove popup and all tab parameters when popup is closed
      url.searchParams.delete('fpop');
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
    }
    
    // Update URL without triggering page reload
    window.history.replaceState({}, '', url.toString());
    
    // Trigger custom event to update our URL display
    window.dispatchEvent(new Event('urlchange'));
  };

  // Handle popup open/close with URL updates
  const handlePopupOpen = () => {
    setIsPopupOpen(true);
    
    // Set default selection if neither option is selected
    if (!kz101Checked && !kz103Checked) {
      setKz101Checked(true);
    }
    
    // Check if URL has specific tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasTabInUrl = ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7']
      .some(tab => urlParams.get(tab) === 'active');
    
    if (!hasTabInUrl) {
      // No tab specified in URL, use last remembered tab from localStorage
      const lastTab = localStorage.getItem('narpo1_lastActiveTab') || 'ptab1';
      setActivePopupTab(lastTab as any);
      updatePopupURL(true, lastTab);
    } else {
      // URL has tab specified, use current activePopupTab
      updatePopupURL(true, activePopupTab);
    }
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    updatePopupURL(false);
  };

  // Handle tab changes with URL updates and localStorage
  const handleTabChange = (tab: string) => {
    setActivePopupTab(tab as any);
    localStorage.setItem('narpo1_lastActiveTab', tab); // Remember this tab for next time
    updatePopupURL(true, tab);
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

  // Get actual column width for sticky positioning
  const getColumnWidth = (col: string) => {
    const widthMap: Record<string, number> = {
      'select': 50, // Small width for checkbox column
      'view': 120,
      'push_name': 200,
      'push_desc': 250,
      'push_status1': 120,
      'created_at': 160,
      'fk_batch_id': 120,
      'kareench1': 150,
      'actions': 180
    };
    return widthMap[col] || 150;
  };

  // Calculate sticky left position based on actual column widths
  const calculateStickyLeft = (index: number) => {
    let leftPosition = 0;
    const visibleColumns = getVisibleColumns();
    
    for (let i = 0; i < index; i++) {
      leftPosition += getColumnWidth(visibleColumns[i]);
    }
    return `${leftPosition}px`;
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
        {/* Functions popup button and batch filter */}
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={handlePopupOpen}
            className="font-bold text-white rounded"
            style={{
              backgroundColor: '#800000', // maroon color
              fontSize: '20px',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
          >
            functions popup
          </button>
          
          {/* Batch filter dropdown */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-gray-700">
              fk_batch_id
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => handleBatchFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded bg-white text-sm min-w-[200px]"
            >
              <option value="">All batches</option>
              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_name || `Batch ${batch.id.substring(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                      const stickyClass = isSticky ? 'sticky z-10' : '';
                      const leftPosition = isSticky ? calculateStickyLeft(index) : 'auto';
                      
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
                            ...(col === 'select' ? { paddingTop: '6px !important', paddingBottom: '6px !important', paddingLeft: '6px !important', paddingRight: '6px !important' } : {})
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
                          ) : col === 'view' || col === 'actions' ? (
                            <div className="flex flex-col">
                              <div className="text-gray-500 font-normal text-xs">{col}</div>
                              <div className="font-bold">{col}</div>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <div className="text-gray-500 font-normal text-xs">narpi_pushes</div>
                              <div className="font-bold">{col}</div>
                            </div>
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
                        const stickyClass = isSticky ? 'sticky z-10' : '';
                        const leftPosition = isSticky ? calculateStickyLeft(index) : 'auto';
                        const bgClass = 'bg-white';
                        
                        return (
                          <td 
                            key={col} 
                            className={`${col === 'select' ? 'px-1.5 py-0.5' : 'px-6 py-4'} text-sm text-gray-900 ${stickyClass} ${bgClass} relative ${col === 'select' ? 'cursor-pointer' : ''}`}
                            style={{
                              ...(isSticky ? { left: leftPosition } : {}),
                              ...(col === 'select' ? { paddingTop: '6px !important', paddingBottom: '6px !important', paddingLeft: '6px !important', paddingRight: '6px !important' } : {})
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
                                <div className="text-xs text-gray-600 max-w-xs">
                                  {push.kareench1 && Array.isArray(push.kareench1) ? (
                                    <div className="space-y-1">
                                      {(() => {
                                        const results = push.kareench1;
                                        const total = results.length;
                                        const success = results.filter((r: any) => r.nupload_status1 === 'success').length;
                                        const failed = results.filter((r: any) => r.nupload_status1 === 'failed').length;
                                        const errors = results.filter((r: any) => r.error_message).length;
                                        
                                        return (
                                          <>
                                            <div className="flex space-x-2 text-xs">
                                              <span className="bg-blue-100 text-blue-800 px-1 rounded">Total: {total}</span>
                                              <span className="bg-green-100 text-green-800 px-1 rounded">✓ {success}</span>
                                              <span className="bg-red-100 text-red-800 px-1 rounded">✗ {failed}</span>
                                            </div>
                                            {errors > 0 && (
                                              <div className="text-red-600 text-xs">
                                                {errors} error{errors !== 1 ? 's' : ''} reported
                                              </div>
                                            )}
                                            {failed > 0 && (
                                              <div className="text-xs text-gray-500">
                                                Click "individual view" for error details
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  ) : push.kareench1 ? (
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
                                    title="Copy full kareench1 data"
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

        {/* Popup Modal */}
        {isPopupOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-xl relative overflow-hidden">
              {/* uelbar37 header bar */}
              <div 
                className="absolute top-0 left-0 right-0 flex items-center px-4"
                style={{ 
                  height: '50px',
                  backgroundColor: uelBar37Colors.bg,
                  color: uelBar37Colors.text
                }}
              >
                <span className="font-semibold">BROWSER URL</span>
                
                {/* Vertical separator */}
                <div 
                  className="bg-gray-600"
                  style={{
                    width: '3px',
                    height: '100%',
                    marginLeft: '30px',
                    marginRight: '30px'
                  }}
                />
                
                <span className="font-mono text-sm overflow-hidden whitespace-nowrap text-ellipsis flex-1">
                  {currentUrl}
                </span>

                {/* Copy buttons in uelbar37 - positioned to the left of close button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                  }}
                  className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                  style={{
                    width: '80px',
                    height: '50px',
                    marginRight: '0px',
                    fontSize: '10px',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  title="Copy Full URL"
                >
                  <div>COPY URL</div>
                </button>
              </div>
              
              {/* uelbar38 header bar */}
              <div 
                className="absolute left-0 right-0 flex items-center px-4"
                style={{ 
                  top: '50px',
                  height: '50px',
                  backgroundColor: uelBarColors.bg,
                  color: uelBarColors.text
                }}
              >
                <span className="font-semibold">uelbar38</span>
                
                {/* Vertical separator */}
                <div 
                  className="bg-gray-600"
                  style={{
                    width: '3px',
                    height: '100%',
                    marginLeft: '30px',
                    marginRight: '30px'
                  }}
                />
                
                <span className="font-bold">{window.location.pathname}</span>
                <div 
                  className="ml-4 flex items-center kz101 cursor-pointer"
                  style={{
                    color: uelBarColors.text,
                    padding: '8px',
                    border: '1px solid black',
                    fontSize: '16px'
                  }}
                  onClick={handleKz101Click}
                >
                  <input
                    type="checkbox"
                    className="mr-2 pointer-events-none"
                    checked={kz101Checked}
                    readOnly
                    style={{
                      width: '18px',
                      height: '18px'
                    }}
                  />
                  SOPTION1 - Use Your Current Selection From Table | {selectedRows.size} rows
                </div>
                <div 
                  className="flex items-center kz102 font-bold"
                  style={{
                    color: uelBarColors.text,
                    padding: '8px',
                    border: '1px solid black',
                    fontSize: '16px'
                  }}
                >
                  OR
                </div>
                <div 
                  className="flex items-center kz103 cursor-pointer"
                  style={{
                    color: uelBarColors.text,
                    padding: '8px',
                    border: '1px solid black',
                    fontSize: '16px'
                  }}
                  onClick={handleKz103Click}
                >
                  <input
                    type="checkbox"
                    className="mr-2 pointer-events-none"
                    checked={kz103Checked}
                    readOnly
                    style={{
                      width: '18px',
                      height: '18px'
                    }}
                  />
                  SOPTION2 - Select All Items In Current Pagination | {pushes.length} rows
                </div>
                
                {/* Close button in header - spans both bars */}
                <button
                  onClick={handlePopupClose}
                  className="absolute right-0 top-0 bg-gray-400 text-gray-800 font-bold flex items-center justify-center hover:bg-gray-500 transition-colors"
                  style={{
                    width: '260px',
                    height: '100px', // Spans both 50px bars
                    border: '2px solid #4a4a4a',
                    fontSize: '14px',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ fontSize: '20px' }}>×</div>
                  <div style={{ fontSize: '12px', lineHeight: '12px', textAlign: 'center' }}>
                    CLOSE<br/>POPUP
                  </div>
                </button>
              </div>
              
              {/* Popup content - adjusted to start below both headers */}
              <div className="h-full" style={{ paddingTop: '100px' }}>
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <nav className="flex">
                    {['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${
                          activePopupTab === tab
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="p-8 h-full overflow-auto">
                  {activePopupTab === 'ptab1' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Functions</h3>
                      <div className="space-y-4">
                        <p className="text-gray-600">Functions for narpi_pushes will be added here.</p>
                        {!kz101Checked && !kz103Checked && (
                          <p className="text-sm text-gray-500">
                            Select either SOPTION1 or SOPTION2 to enable functions
                          </p>
                        )}
                        {kz101Checked && selectedRows.size === 0 && (
                          <p className="text-sm text-gray-500">
                            SOPTION1 selected: Select items from the table to enable functions
                          </p>
                        )}
                        {kz101Checked && selectedRows.size > 0 && (
                          <p className="text-sm text-gray-600">
                            SOPTION1 selected: {selectedRows.size} item(s) will be processed
                          </p>
                        )}
                        {kz103Checked && (
                          <p className="text-sm text-gray-600">
                            SOPTION2 selected: All {pushes.length} items will be processed
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {activePopupTab === 'ptab2' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Content for ptab2</h3>
                      <p className="text-gray-600">This is the content area for ptab2.</p>
                    </div>
                  )}
                  {activePopupTab === 'ptab3' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Content for ptab3</h3>
                      <p className="text-gray-600">This is the content area for ptab3.</p>
                    </div>
                  )}
                  {activePopupTab === 'ptab4' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Content for ptab4</h3>
                      <p className="text-gray-600">This is the content area for ptab4.</p>
                    </div>
                  )}
                  {activePopupTab === 'ptab5' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Content for ptab5</h3>
                      <p className="text-gray-600">This is the content area for ptab5.</p>
                    </div>
                  )}
                  {activePopupTab === 'ptab6' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Content for ptab6</h3>
                      <p className="text-gray-600">This is the content area for ptab6.</p>
                    </div>
                  )}
                  {activePopupTab === 'ptab7' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Content for ptab7</h3>
                      <p className="text-gray-600">This is the content area for ptab7.</p>
                    </div>
                  )}
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