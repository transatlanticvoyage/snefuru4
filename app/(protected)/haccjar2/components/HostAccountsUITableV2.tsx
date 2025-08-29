'use client';

import { useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface HostCompany {
  id: string;
  name: string | null;
  portal_url1: string | null;
  fk_user_id: string;
  notes1: string | null;
  notes2: string | null;
  notes3: string | null;
}

interface HostPlan {
  id: string;
  paymentdate_first: string | null;
  payment_method: string | null;
  price: number | null;
  currency: string | null;
  price_term: string | null;
  subscribed: boolean | null;
  cc_added: boolean | null;
  paymentdate_next: string | null;
  fk_user_id: string;
  ue_identifier_1: string | null;
  fk_host_account_id: string;
}

interface HostPanel {
  id: string;
  panel_url1: string | null;
  panel_user: string | null;
  panel_pass: string | null;
  panel_type: string | null;
  panel_ns: string | null;
  fk_user_id: string;
  panel_note1: string | null;
  flag_nsduplicate: boolean | null;
  fk_host_plan_id: string;
}

interface HostAccountRecord {
  id: string | null; // UUID - can be null for companies without accounts
  username: string | null;
  pass: string | null;
  hostacct_apikey1: string | null;
  hostacct_api_secret: string | null;
  api_management_url: string | null;
  fk_user_id: string | null; // Can be null for companies without accounts
  fk_host_company_id: string | null;
  host_company: HostCompany | null;
  domains_glacier: string | null;
  host_plan: HostPlan | null; // Can be null for accounts without plans
  host_panel: HostPanel | null; // Can be null for plans without panels
  _is_company_only?: boolean; // Flag to indicate this is a company without account
  _is_account_only?: boolean; // Flag to indicate this is an account without plan
  _is_plan_only?: boolean; // Flag to indicate this is a plan without panel
}

interface HostAccountsUITableV2Props {
  data: HostAccountRecord[];
  userId: string;
  onDataChange?: () => void;
}

type SortField = keyof HostAccountRecord;
type SortOrder = 'asc' | 'desc';

export default function HostAccountsUITableV2({ data, onDataChange }: HostAccountsUITableV2Props) {
  const supabase = createClientComponentClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedHostAccounts, setSelectedHostAccounts] = useState<Set<string>>(new Set());
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedHostPlans, setSelectedHostPlans] = useState<Set<string>>(new Set());
  const [selectedHostPanels, setSelectedHostPanels] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [createPlanError, setCreatePlanError] = useState<string | null>(null);
  const [isCreatingPanel, setIsCreatingPanel] = useState(false);
  const [createPanelError, setCreatePanelError] = useState<string | null>(null);

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.username?.toLowerCase().includes(searchLower) ||
        item.id?.toLowerCase().includes(searchLower) ||
        item.fk_host_company_id?.toLowerCase().includes(searchLower) ||
        item.host_company?.name?.toLowerCase().includes(searchLower) ||
        item.host_company?.portal_url1?.toLowerCase().includes(searchLower) ||
        item.host_company?.notes1?.toLowerCase().includes(searchLower) ||
        item.host_company?.notes2?.toLowerCase().includes(searchLower) ||
        item.host_company?.notes3?.toLowerCase().includes(searchLower) ||
        item.host_plan?.payment_method?.toLowerCase().includes(searchLower) ||
        item.host_plan?.currency?.toLowerCase().includes(searchLower) ||
        item.host_plan?.price_term?.toLowerCase().includes(searchLower) ||
        item.host_plan?.ue_identifier_1?.toLowerCase().includes(searchLower) ||
        item.host_panel?.panel_url1?.toLowerCase().includes(searchLower) ||
        item.host_panel?.panel_user?.toLowerCase().includes(searchLower) ||
        item.host_panel?.panel_type?.toLowerCase().includes(searchLower) ||
        item.host_panel?.panel_ns?.toLowerCase().includes(searchLower) ||
        item.host_panel?.panel_note1?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [data, searchTerm]);

  // Sort logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Handle object values (like host_company) by converting to string
      if (typeof aVal === 'object') aVal = '';
      if (typeof bVal === 'object') bVal = '';

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredData, sortField, sortOrder]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Only select items that have account IDs (not companies without accounts)
      const allIds = new Set(paginatedData.filter(item => item.id).map(item => item.id!));
      setSelectedHostAccounts(allIds);
    } else {
      setSelectedHostAccounts(new Set());
    }
  };

  // Handle individual checkbox
  const handleSelectHostAccount = (hostAccountId: string | null, checked: boolean) => {
    if (!hostAccountId) return; // Skip if no account ID (company without account)
    
    const newSelected = new Set(selectedHostAccounts);
    if (checked) {
      newSelected.add(hostAccountId);
    } else {
      newSelected.delete(hostAccountId);
      setSelectAll(false);
    }
    setSelectedHostAccounts(newSelected);
    
    // Check if all visible items are selected (only count items with account IDs)
    const itemsWithAccounts = paginatedData.filter(item => item.id);
    if (newSelected.size === itemsWithAccounts.length && itemsWithAccounts.every(item => newSelected.has(item.id!))) {
      setSelectAll(true);
    }
  };

  // Handle company checkbox selection
  const handleSelectCompany = (companyId: string, checked: boolean) => {
    const newSelected = new Set(selectedCompanies);
    if (checked) {
      newSelected.add(companyId);
    } else {
      newSelected.delete(companyId);
    }
    setSelectedCompanies(newSelected);
    setCreateAccountError(null); // Clear any previous error when selection changes
  };

  // Handle host plan checkbox selection
  const handleSelectHostPlan = (planId: string | null, checked: boolean) => {
    if (!planId) return; // Skip if no plan ID
    
    const newSelected = new Set(selectedHostPlans);
    if (checked) {
      newSelected.add(planId);
    } else {
      newSelected.delete(planId);
    }
    setSelectedHostPlans(newSelected);
  };

  // Handle host panel checkbox selection
  const handleSelectHostPanel = (panelId: string | null, checked: boolean) => {
    if (!panelId) return; // Skip if no panel ID
    
    const newSelected = new Set(selectedHostPanels);
    if (checked) {
      newSelected.add(panelId);
    } else {
      newSelected.delete(panelId);
    }
    setSelectedHostPanels(newSelected);
  };

  // Inline editing functions (based on xpagesmanager1 pattern)
  const updateHostAccountField = async (accountId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('host_account')
        .update({ [field]: value })
        .eq('id', accountId);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Refresh data after successful update
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleCellClick = (accountId: string, field: string, currentValue: any) => {
    // Skip editing for companies without accounts or readonly fields
    if (!accountId || field === 'id' || field === 'fk_user_id' || field === 'fk_host_company_id') {
      return;
    }
    
    setEditingCell({ id: accountId, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let processedValue: any = editValue;

    // Process value - if empty string, set to null
    if (editValue === '') {
      processedValue = null;
    }

    await updateHostAccountField(id, field, processedValue);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const maskPassword = (password: string | null) => {
    if (!password) return '-';
    return '••••••••';
  };

  const maskApiKey = (apiKey: string | null) => {
    if (!apiKey) return '-';
    if (apiKey.length <= 8) return '••••••••';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  const handleFetchDomains = async () => {
    const selectedId = Array.from(selectedHostAccounts)[0];
    const selectedAccount = data.find(account => account.id === selectedId);
    
    if (!selectedAccount) {
      setFetchError('Selected account not found');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      console.log('Fetching domains for account:', selectedAccount);
      
      const response = await fetch('/api/fetch-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host_account_id: selectedAccount.id
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Successfully fetched domains:', result);
        // Refresh the data to show updated domains_glacier
        if (onDataChange) {
          onDataChange();
        }
      } else {
        console.error('Error fetching domains:', result.error);
        setFetchError(result.error);
      }
    } catch (error) {
      console.error('Error calling fetch domains API:', error);
      setFetchError('Network error occurred while fetching domains');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating new host account
  const handleCreateHostAccount = async () => {
    if (selectedCompanies.size !== 1) {
      setCreateAccountError('Please select exactly one company to create a host account for');
      return;
    }

    const selectedCompanyId = Array.from(selectedCompanies)[0];
    const selectedCompany = data.find(item => item.host_company?.id === selectedCompanyId);

    if (!selectedCompany?.host_company) {
      setCreateAccountError('Selected company not found');
      return;
    }

    setIsCreatingAccount(true);
    setCreateAccountError(null);

    try {
      const response = await fetch('/api/create-host-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host_company_id: selectedCompanyId,
          user_id: selectedCompany.host_company.fk_user_id
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Successfully created host account:', result);
        // Clear company selection
        setSelectedCompanies(new Set());
        // Refresh the data to show the new host account
        if (onDataChange) {
          onDataChange();
        }
      } else {
        console.error('Error creating host account:', result.error);
        setCreateAccountError(result.error);
      }
    } catch (error) {
      console.error('Error calling create host account API:', error);
      setCreateAccountError('Network error occurred while creating host account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleCreateHostPlan = async () => {
    if (selectedHostAccounts.size !== 1) {
      setCreatePlanError('Please select exactly one host account to create a host plan for');
      return;
    }
    const selectedAccountId = Array.from(selectedHostAccounts)[0];
    const selectedAccount = data.find(item => item.id === selectedAccountId);
    if (!selectedAccount || selectedAccount._is_company_only) {
      setCreatePlanError('Selected host account not found');
      return;
    }
    setIsCreatingPlan(true);
    setCreatePlanError(null);
    try {
      const response = await fetch('/api/create-host-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host_account_id: selectedAccountId,
          user_id: selectedAccount.fk_user_id
        })
      });
      const result = await response.json();
      if (result.success) {
        console.log('Successfully created host plan:', result);
        // Clear account selection
        setSelectedHostAccounts(new Set());
        // Refresh the data to show the new host plan
        if (onDataChange) {
          onDataChange();
        }
      } else {
        console.error('Error creating host plan:', result.error);
        setCreatePlanError(result.error);
      }
    } catch (error) {
      console.error('Error calling create host plan API:', error);
      setCreatePlanError('Network error occurred while creating host plan');
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleCreateHostPanel = async () => {
    if (selectedHostPlans.size !== 1) {
      setCreatePanelError('Please select exactly one host plan to create a host panel for');
      return;
    }
    const selectedPlanId = Array.from(selectedHostPlans)[0];
    const selectedPlan = data.find(item => item.host_plan?.id === selectedPlanId);
    if (!selectedPlan?.host_plan || selectedPlan._is_company_only || selectedPlan._is_account_only) {
      setCreatePanelError('Selected host plan not found');
      return;
    }
    setIsCreatingPanel(true);
    setCreatePanelError(null);
    try {
      const response = await fetch('/api/create-host-panel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host_plan_id: selectedPlanId,
          user_id: selectedPlan.host_plan.fk_user_id
        })
      });
      const result = await response.json();
      if (result.success) {
        console.log('Successfully created host panel:', result);
        // Clear plan selection
        setSelectedHostPlans(new Set());
        // Refresh the data to show the new host panel
        if (onDataChange) {
          onDataChange();
        }
      } else {
        console.error('Error creating host panel:', result.error);
        setCreatePanelError(result.error);
      }
    } catch (error) {
      console.error('Error calling create host panel API:', error);
      setCreatePanelError('Network error occurred while creating host panel');
    } finally {
      setIsCreatingPanel(false);
    }
  };

  // Helper function to render editable cells (based on xpagesmanager1 pattern)
  const renderEditableCell = (item: HostAccountRecord, field: string, value: any, className: string = '', maskFunction?: (val: any) => any) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    const isReadOnly = !item.id || field === 'id' || field === 'fk_user_id' || field === 'fk_host_company_id';
    const isCompanyOnly = item._is_company_only;

    if (isCompanyOnly) {
      return (
        <span className="text-gray-400 italic">No Account</span>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleCellSave}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={handleCellCancel}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    const displayValue = maskFunction ? maskFunction(value) : (value || '-');
    
    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.id!, field, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${className}`}
        title={!isReadOnly ? `${value?.toString() || ''} (Click to edit)` : value?.toString() || ''}
      >
        {displayValue}
      </div>
    );
  };

  // Helper function to render editable URL cells
  const renderEditableURLCell = (item: HostAccountRecord, field: string, value: any) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    const isReadOnly = !item.id;
    const isCompanyOnly = item._is_company_only;

    if (isCompanyOnly) {
      return (
        <span className="text-gray-400 italic">No Account</span>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            placeholder="https://..."
          />
          <button
            onClick={handleCellSave}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={handleCellCancel}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    if (!value) {
      return (
        <div
          onClick={() => !isReadOnly && handleCellClick(item.id!, field, value)}
          className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
            !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
          }`}
          title={!isReadOnly ? 'Click to edit URL' : ''}
        >
          -
        </div>
      );
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.id!, field, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        }`}
        title={!isReadOnly ? `${value} (Click to edit)` : value}
      >
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline"
          onClick={(e) => e.stopPropagation()}
        >
          {truncateText(value, 30)}
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search host accounts..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {paginatedData.length} of {sortedData.length} results
      </div>

      {/* Create New Host Account Button */}
      <div className="flex items-center justify-between">
        <button
          className={`px-6 py-3 rounded-md font-medium ${
            selectedCompanies.size === 1
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleCreateHostAccount}
          disabled={selectedCompanies.size !== 1 || isCreatingAccount}
        >
          {isCreatingAccount ? 'Creating Account...' : 'Create New Host Account'}
        </button>
        
        <div className="text-sm text-gray-600">
          {selectedCompanies.size === 0 && 'Select 1 company to create host account'}
          {selectedCompanies.size === 1 && 'Ready to create host account'}
          {selectedCompanies.size > 1 && `${selectedCompanies.size} companies selected - select exactly 1`}
        </div>
      </div>

      {/* Create Account Error Display */}
      {createAccountError && (
        <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
          Error: {createAccountError}
        </div>
      )}

      {/* Create New Host Plan Button */}
      <div className="flex items-center justify-between mt-6">
        <button
          className={`px-6 py-3 rounded-md font-medium ${
            selectedHostAccounts.size === 1
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleCreateHostPlan}
          disabled={selectedHostAccounts.size !== 1 || isCreatingPlan}
        >
          {isCreatingPlan ? 'Creating Plan...' : 'Create New Host Plan'}
        </button>
        
        <div className="text-sm text-gray-600">
          {selectedHostAccounts.size === 0 && 'Select 1 host account to create host plan'}
          {selectedHostAccounts.size === 1 && 'Ready to create host plan'}
          {selectedHostAccounts.size > 1 && `${selectedHostAccounts.size} host accounts selected - select exactly 1`}
        </div>
      </div>

      {/* Create Plan Error Display */}
      {createPlanError && (
        <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
          Error: {createPlanError}
        </div>
      )}

      {/* Create New Host Panel Button */}
      <div className="flex items-center justify-between mt-6">
        <button
          className={`px-6 py-3 rounded-md font-medium ${
            selectedHostPlans.size === 1
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleCreateHostPanel}
          disabled={selectedHostPlans.size !== 1 || isCreatingPanel}
        >
          {isCreatingPanel ? 'Creating Panel...' : 'Create New Host Panel'}
        </button>
        
        <div className="text-sm text-gray-600">
          {selectedHostPlans.size === 0 && 'Select 1 host plan to create host panel'}
          {selectedHostPlans.size === 1 && 'Ready to create host panel'}
          {selectedHostPlans.size > 1 && `${selectedHostPlans.size} host plans selected - select exactly 1`}
        </div>
      </div>

      {/* Create Panel Error Display */}
      {createPanelError && (
        <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
          Error: {createPanelError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead className="bg-gray-50">
              {/* DB Table Names Row */}
              <tr>
                <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 bg-blue-100" style={{ border: '1px solid #d1d5db' }} colSpan={8}>
                  host_company
                </th>
                <th className="px-2 bg-gray-300" style={{ border: '1px solid #d1d5db' }}></th>
                <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 bg-green-100" style={{ border: '1px solid #d1d5db' }} colSpan={9}>
                  host_account
                </th>
                <th className="px-2 bg-gray-300" style={{ border: '1px solid #d1d5db' }}></th>
                <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 bg-purple-100" style={{ border: '1px solid #d1d5db' }} colSpan={10}>
                  host_plan
                </th>
                <th className="px-2 bg-gray-300" style={{ border: '1px solid #d1d5db' }}></th>
                <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 bg-orange-100" style={{ border: '1px solid #d1d5db' }} colSpan={8}>
                  host_panel
                </th>
              </tr>
              {/* Column Names Row */}
              <tr>
                {/* Company Entity Checkbox column (far left) */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  <div className="flex items-center">
                    <span className="text-xs">Company</span>
                  </div>
                </th>
                {/* Host Company columns on the left */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  portal_url1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  fk_user_id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  notes1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  notes2
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  notes3
                </th>
                {/* Separator column */}
                <th className="px-2 bg-gray-200" style={{ border: '1px solid #d1d5db' }}></th>
                {/* Checkbox column */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">(checkbox)</span>
                  </div>
                </th>
                {/* Host Account columns on the right */}
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                  style={{ border: '1px solid #d1d5db' }}
                >
                  id {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('username')}
                  style={{ border: '1px solid #d1d5db' }}
                >
                  username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  pass
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  hostacct_apikey1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  hostacct_api_secret
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  api_management_url
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  fk_user_id
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fk_host_company_id')}
                  style={{ border: '1px solid #d1d5db' }}
                >
                  fk_host_company_id {sortField === 'fk_host_company_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                {/* Separator column */}
                <th className="px-2 bg-gray-200" style={{ border: '1px solid #d1d5db' }}></th>
                {/* Plan Entity Checkbox column */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  <div className="flex items-center">
                    <span className="text-xs">Plan</span>
                  </div>
                </th>
                {/* Host Plan columns */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  plan_id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  paymentdate_first
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  payment_method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  currency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  price_term
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  subscribed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  paymentdate_next
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  fk_host_account_id
                </th>
                {/* Separator column */}
                <th className="px-2 bg-gray-200" style={{ border: '1px solid #d1d5db' }}></th>
                {/* Panel Entity Checkbox column */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  <div className="flex items-center">
                    <span className="text-xs">Panel</span>
                  </div>
                </th>
                {/* Host Panel columns */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  panel_id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  panel_url1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  panel_user
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  panel_pass
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  panel_type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  panel_ns
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                  fk_host_plan_id
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item, index) => (
                <tr 
                  key={item.id || `company-${item.host_company?.id || index}`} 
                  className={`hover:bg-gray-50 ${item._is_company_only ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                  title={item._is_company_only ? 'Company without host account - click to create account' : ''}
                >
                  {/* Company Entity Checkbox column (far left) */}
                  <td className="px-4 py-2 whitespace-nowrap" style={{ border: '1px solid #d1d5db' }}>
                    {item.host_company?.id ? (
                      <input
                        type="checkbox"
                        checked={selectedCompanies.has(item.host_company.id)}
                        onChange={(e) => handleSelectCompany(item.host_company.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  {/* Host Company columns with yellow highlighting when company is selected */}
                  <td className={`px-4 py-2 whitespace-nowrap text-gray-900 text-xs ${
                    item.host_company?.id && selectedCompanies.has(item.host_company.id) ? 'bg-yellow-200' : ''
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item.host_company ? truncateText(item.host_company.id, 8) + '...' : '-'}
                  </td>
                  <td className={`px-4 py-2 text-gray-900 font-medium ${
                    item.host_company?.id && selectedCompanies.has(item.host_company.id) ? 'bg-yellow-200' : ''
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item.host_company?.name || '-'}
                  </td>
                  <td className={`px-4 py-2 text-blue-600 hover:text-blue-800 ${
                    item.host_company?.id && selectedCompanies.has(item.host_company.id) ? 'bg-yellow-200' : ''
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item.host_company?.portal_url1 ? (
                      <a 
                        href={item.host_company.portal_url1} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {truncateText(item.host_company.portal_url1, 30)}
                      </a>
                    ) : '-'}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-gray-500 text-xs ${
                    item.host_company?.id && selectedCompanies.has(item.host_company.id) ? 'bg-yellow-200' : ''
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item.host_company ? truncateText(item.host_company.fk_user_id, 8) + '...' : '-'}
                  </td>
                  <td className={`px-4 py-2 text-gray-600 ${
                    item.host_company?.id && selectedCompanies.has(item.host_company.id) ? 'bg-yellow-200' : ''
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {truncateText(item.host_company?.notes1 || null, 20)}
                  </td>
                  <td className={`px-4 py-2 text-gray-600 ${
                    item.host_company?.id && selectedCompanies.has(item.host_company.id) ? 'bg-yellow-200' : ''
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {truncateText(item.host_company?.notes2 || null, 20)}
                  </td>
                  <td className={`px-4 py-2 text-gray-600 ${
                    item.host_company?.id && selectedCompanies.has(item.host_company.id) ? 'bg-yellow-200' : ''
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {truncateText(item.host_company?.notes3 || null, 20)}
                  </td>
                  {/* Separator column */}
                  <td className="px-2 bg-gray-200" style={{ border: '1px solid #d1d5db' }}></td>
                  {/* Checkbox column */}
                  <td className="px-4 py-2 whitespace-nowrap" style={{ border: '1px solid #d1d5db' }}>
                    {item.id ? (
                      <input
                        type="checkbox"
                        checked={selectedHostAccounts.has(item.id)}
                        onChange={(e) => handleSelectHostAccount(item.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  {/* Host Account columns */}
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-gray-900'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only ? 'No Account' : (item.id ? truncateText(item.id, 8) + '...' : '-')}
                  </td>
                  <td className={`px-4 py-2 ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-gray-900'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {renderEditableCell(item, 'username', item.username, 'font-medium')}
                  </td>
                  <td className={`px-4 py-2 ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {renderEditableCell(item, 'pass', item.pass, '', maskPassword)}
                  </td>
                  <td className={`px-4 py-2 ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {renderEditableCell(item, 'hostacct_apikey1', item.hostacct_apikey1, 'font-mono text-xs', maskApiKey)}
                  </td>
                  <td className={`px-4 py-2 ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {renderEditableCell(item, 'hostacct_api_secret', item.hostacct_api_secret, 'font-mono text-xs', maskApiKey)}
                  </td>
                  <td className={`px-4 py-2 ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-blue-600 hover:text-blue-800'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {renderEditableURLCell(item, 'api_management_url', item.api_management_url)}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only ? 'No Account' : (item.fk_user_id ? truncateText(item.fk_user_id, 8) + '...' : '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only ? 'No Account' : (item.fk_host_company_id ? truncateText(item.fk_host_company_id, 8) + '...' : '-')}
                  </td>

                  {/* Separator column */}
                  <td className="px-2 bg-gray-300" style={{ border: '1px solid #d1d5db' }}></td>

                  {/* Host Plan checkbox */}
                  <td className="px-4 py-2 whitespace-nowrap" style={{ border: '1px solid #d1d5db' }}>
                    {item.host_plan?.id && !(item._is_company_only || item._is_account_only) ? (
                      <input
                        type="checkbox"
                        checked={selectedHostPlans.has(item.host_plan.id)}
                        onChange={(e) => handleSelectHostPlan(item.host_plan.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>

                  {/* Host Plan columns */}
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.id ? truncateText(item.host_plan.id, 8) + '...' : '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.paymentdate_first || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.payment_method || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.price || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.currency || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.price_term || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.subscribed !== undefined ? (item.host_plan.subscribed ? 'Yes' : 'No') : '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.paymentdate_next || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only ? 'No Plan' : (item.host_plan?.fk_host_account_id ? truncateText(item.host_plan.fk_host_account_id, 8) + '...' : '-')}
                  </td>

                  {/* Separator column */}
                  <td className="px-2 bg-gray-300" style={{ border: '1px solid #d1d5db' }}></td>

                  {/* Host Panel checkbox */}
                  <td className="px-4 py-2 whitespace-nowrap" style={{ border: '1px solid #d1d5db' }}>
                    {item.host_panel?.id && !(item._is_company_only || item._is_account_only || item._is_plan_only) ? (
                      <input
                        type="checkbox"
                        checked={selectedHostPanels.has(item.host_panel.id)}
                        onChange={(e) => handleSelectHostPanel(item.host_panel.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>

                  {/* Host Panel columns */}
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only || item._is_plan_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only || item._is_plan_only ? 'No Panel' : (item.host_panel?.id ? truncateText(item.host_panel.id, 8) + '...' : '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only || item._is_plan_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only || item._is_plan_only ? 'No Panel' : (item.host_panel?.panel_url1 ? truncateText(item.host_panel.panel_url1, 20) + '...' : '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only || item._is_plan_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only || item._is_plan_only ? 'No Panel' : (item.host_panel?.panel_user || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only || item._is_plan_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only || item._is_plan_only ? 'No Panel' : (item.host_panel?.panel_pass ? '••••••••' : '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only || item._is_plan_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only || item._is_plan_only ? 'No Panel' : (item.host_panel?.panel_type || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only || item._is_plan_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only || item._is_plan_only ? 'No Panel' : (item.host_panel?.panel_ns || '-')}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-xs ${
                    item._is_company_only || item._is_account_only || item._is_plan_only ? 'text-gray-400 italic' : 'text-gray-500'
                  }`} style={{ border: '1px solid #d1d5db' }}>
                    {item._is_company_only || item._is_account_only || item._is_plan_only ? 'No Panel' : (item.host_panel?.fk_host_plan_id ? truncateText(item.host_panel.fk_host_plan_id, 8) + '...' : '-')}
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={36} className="px-4 py-8 text-center text-gray-500">
                    No host accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <select
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </button>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Last
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 flex flex-col items-center space-y-2">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          onClick={handleFetchDomains}
          disabled={selectedHostAccounts.size !== 1 || isLoading}
        >
          {isLoading ? 'Fetching domains...' : 'fetch domains_glacier'}
        </button>
        
        {fetchError && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
            Error: {fetchError}
          </div>
        )}
      </div>

      {/* Domains Glacier Text Box */}
      <div className="mt-6">
        <div className="mb-2">
          <span className="text-sm font-bold text-gray-700">
            host_account.domains_glacier {selectedHostAccounts.size === 1 && (() => {
              const selectedId = Array.from(selectedHostAccounts)[0];
              const selectedAccount = data.find(account => account.id === selectedId);
              const companyName = selectedAccount?.host_company?.name || 'unknown';
              const username = selectedAccount?.username || 'unknown';
              return `(${companyName} - ${username})`;
            })()}
          </span>
        </div>
        <textarea
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-md text-sm font-mono resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={selectedHostAccounts.size === 1 ? "Domain data will appear here after fetching..." : "Select exactly one host account to view domains_glacier data"}
          value={(() => {
            if (selectedHostAccounts.size === 1) {
              const selectedId = Array.from(selectedHostAccounts)[0];
              const selectedAccount = data.find(account => account.id === selectedId);
              return selectedAccount?.domains_glacier || '';
            }
            return '';
          })()}
          readOnly
        />
      </div>
    </div>
  );
}