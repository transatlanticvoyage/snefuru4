'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CallPlatAccount {
  cplatacct_id: string;
  cplatacct_username: string;
  cplatacct_api_key: string;
  cplatacct_api_secret: string;
  api_management_url: string;
  phone_numbers_glacier: string;
  created_at: string;
  updated_at: string;
}

interface CallPlatCompany {
  cplatcompany_id: string;
  cplatcompany_name: string;
  portal_url1: string;
  user_id: string;
  note1: string;
  note2: string;
  note3: string;
  created_at: string;
  updated_at: string;
  callplat_accounts: CallPlatAccount[];
}

interface CallPlatUITableProps {
  data: CallPlatCompany[];
  userId: string;
  onDataChange: () => void;
}

export default function CallPlatUITable({ data, userId, onDataChange }: CallPlatUITableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{
    companyId?: string;
    accountId?: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showCreateCompanyForm, setShowCreateCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyPortalUrl, setNewCompanyPortalUrl] = useState('');
  const supabase = createClientComponentClient();

  // Filter data based on search term
  const filteredData = data.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.cplatcompany_name?.toLowerCase().includes(searchLower) ||
      company.portal_url1?.toLowerCase().includes(searchLower) ||
      company.callplat_accounts?.some(account => 
        account.cplatacct_username?.toLowerCase().includes(searchLower) ||
        account.api_management_url?.toLowerCase().includes(searchLower)
      )
    );
  });

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    const newSelected = new Set(selectedCompanies);
    if (checked) {
      newSelected.add(companyId);
    } else {
      newSelected.delete(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleCreateNewCallPlatCompany = async () => {
    if (!newCompanyName.trim()) {
      setFetchError('Company name is required');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      // Get the user's internal ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (userError || !userData) {
        setFetchError('User not found');
        return;
      }

      // Create new call platform company via API
      const response = await fetch('/api/create_callplat_company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_internal_id: userData.id,
          cplatcompany_name: newCompanyName.trim(),
          portal_url1: newCompanyPortalUrl.trim(),
          note1: '',
          note2: '',
          note3: ''
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setFetchError(result.error || 'Failed to create call platform company');
        return;
      }

      console.log('Successfully created new call platform company:', result.data);
      
      // Reset form and hide it
      setNewCompanyName('');
      setNewCompanyPortalUrl('');
      setShowCreateCompanyForm(false);
      
      // Refresh the data to show the new company
      if (onDataChange) {
        onDataChange();
      }
      
    } catch (error) {
      console.error('Error creating call platform company:', error);
      setFetchError('Network error occurred while creating call platform company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewCallPlatAccount = async () => {
    if (selectedCompanies.size !== 1) return;

    const selectedCompanyId = Array.from(selectedCompanies)[0];
    setIsLoading(true);
    setFetchError(null);

    try {
      // Get the user's internal ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (userError || !userData) {
        setFetchError('User not found');
        return;
      }

      // Create new call platform account
      const { data: newAccount, error: insertError } = await supabase
        .from('callplat_accounts')
        .insert([
          {
            fk_callplat_company_id: selectedCompanyId,
            user_id: userData.id,
            cplatacct_username: '',
            cplatacct_api_key: '',
            cplatacct_api_secret: '',
            api_management_url: '',
            phone_numbers_glacier: ''
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating call platform account:', insertError);
        setFetchError('Failed to create call platform account');
        return;
      }

      console.log('Successfully created new call platform account:', newAccount);
      
      // Refresh the data to show the new account
      if (onDataChange) {
        onDataChange();
      }

      // Clear company selection after successful creation
      setSelectedCompanies(new Set());
      
    } catch (error) {
      console.error('Error creating call platform account:', error);
      setFetchError('Network error occurred while creating call platform account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (companyId: string | undefined, accountId: string | undefined, field: string, currentValue: string) => {
    setEditingCell({ companyId, accountId, field });
    setEditValue(currentValue || '');
  };

  const handleSave = async () => {
    if (!editingCell) return;

    const { companyId, accountId, field } = editingCell;
    
    try {
      if (companyId && !accountId) {
        // Editing company field
        const { error } = await supabase
          .from('callplat_companies')
          .update({ [field]: editValue })
          .eq('cplatcompany_id', companyId);

        if (error) {
          console.error('Error updating company:', error);
          setFetchError('Failed to update company');
          return;
        }
      } else if (accountId) {
        // Editing account field
        const { error } = await supabase
          .from('callplat_accounts')
          .update({ [field]: editValue })
          .eq('cplatacct_id', accountId);

        if (error) {
          console.error('Error updating account:', error);
          setFetchError('Failed to update account');
          return;
        }
      }

      setEditingCell(null);
      setEditValue('');
      onDataChange();
    } catch (error) {
      console.error('Error saving:', error);
      setFetchError('Network error occurred while saving');
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleFetchPhoneNumbers = async (accountId: string, companyName: string) => {
    setIsLoading(true);
    setFetchError(null);

    try {
      // For now, we'll add a placeholder. Later you can implement specific API calls
      // for Nimbata, Ringba, Twilio, etc.
      console.log(`Fetching phone numbers for ${companyName} account:`, accountId);
      
      // Placeholder implementation - you'll need to create specific API routes
      // const response = await fetch(`/api/fetch-phone-numbers/${companyName.toLowerCase()}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ account_id: accountId })
      // });

      setFetchError('Phone number fetching not yet implemented. Please add API integration for ' + companyName);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      setFetchError('Network error occurred while fetching phone numbers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search call platform accounts..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setFetchError(null);
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
          {/* Create New Company Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateCompanyForm(!showCreateCompanyForm)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:bg-gray-400"
            >
              {showCreateCompanyForm ? 'Cancel' : 'Create New Call Platform Company'}
            </button>
            
            <div className="text-sm text-gray-600">
              Add a new call platform provider (Nimbata, Ringba, Twilio, etc.)
            </div>
          </div>

          {/* Create Company Form */}
          {showCreateCompanyForm && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g., Nimbata, Ringba, Twilio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portal URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newCompanyPortalUrl}
                    onChange={(e) => setNewCompanyPortalUrl(e.target.value)}
                    placeholder="https://app.nimbata.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowCreateCompanyForm(false)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewCallPlatCompany}
                  disabled={isLoading || !newCompanyName.trim()}
                  className={`px-4 py-2 rounded-md font-medium ${
                    !isLoading && newCompanyName.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </div>
          )}

          {/* Create New Account Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCreateNewCallPlatAccount}
              disabled={selectedCompanies.size !== 1 || isLoading}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedCompanies.size === 1 && !isLoading
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Creating...' : 'Create New Call Platform Account'}
            </button>
            
            <div className="text-sm text-gray-600">
              {selectedCompanies.size === 0 && 'Select exactly 1 company to create account'}
              {selectedCompanies.size === 1 && 'Ready to create new account'}
              {selectedCompanies.size > 1 && `${selectedCompanies.size} companies selected (select only 1)`}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{fetchError}</p>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portal URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Secret
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Management URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No call platform accounts found
                  </td>
                </tr>
              ) : (
                filteredData.map((company) => {
                  const isCompanySelected = selectedCompanies.has(company.cplatcompany_id);
                  const accounts = company.callplat_accounts || [];
                  const rowSpan = Math.max(1, accounts.length);

                  if (accounts.length === 0) {
                    return (
                      <tr key={company.cplatcompany_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isCompanySelected}
                            onChange={(e) => handleSelectCompany(company.cplatcompany_id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                          {company.cplatcompany_id}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                          {editingCell?.companyId === company.cplatcompany_id && editingCell?.field === 'cplatcompany_name' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSave}
                              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              autoFocus
                            />
                          ) : (
                            <span
                              onClick={() => handleEdit(company.cplatcompany_id, undefined, 'cplatcompany_name', company.cplatcompany_name)}
                              className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            >
                              {company.cplatcompany_name || 'Click to edit'}
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                          {editingCell?.companyId === company.cplatcompany_id && editingCell?.field === 'portal_url1' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSave}
                              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              autoFocus
                            />
                          ) : (
                            <span
                              onClick={() => handleEdit(company.cplatcompany_id, undefined, 'portal_url1', company.portal_url1)}
                              className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            >
                              {company.portal_url1 || 'Click to edit'}
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                          {company.note1 || company.note2 || company.note3 || '-'}
                        </td>
                        <td colSpan={6} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No accounts configured
                        </td>
                      </tr>
                    );
                  }

                  return accounts.map((account, index) => (
                    <tr key={`${company.cplatcompany_id}-${account.cplatacct_id}`} className="hover:bg-gray-50">
                      {index === 0 && (
                        <>
                          <td rowSpan={rowSpan} className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isCompanySelected}
                              onChange={(e) => handleSelectCompany(company.cplatcompany_id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td rowSpan={rowSpan} className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                            {company.cplatcompany_id}
                          </td>
                          <td rowSpan={rowSpan} className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                            {editingCell?.companyId === company.cplatcompany_id && editingCell?.field === 'cplatcompany_name' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSave}
                                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => handleEdit(company.cplatcompany_id, undefined, 'cplatcompany_name', company.cplatcompany_name)}
                                className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                {company.cplatcompany_name || 'Click to edit'}
                              </span>
                            )}
                          </td>
                          <td rowSpan={rowSpan} className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                            {editingCell?.companyId === company.cplatcompany_id && editingCell?.field === 'portal_url1' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSave}
                                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => handleEdit(company.cplatcompany_id, undefined, 'portal_url1', company.portal_url1)}
                                className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                {company.portal_url1 || 'Click to edit'}
                              </span>
                            )}
                          </td>
                          <td rowSpan={rowSpan} className={`px-4 py-4 whitespace-nowrap text-sm ${isCompanySelected ? 'bg-yellow-100' : ''}`}>
                            {company.note1 || company.note2 || company.note3 || '-'}
                          </td>
                        </>
                      )}
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {account.cplatacct_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {editingCell?.accountId === account.cplatacct_id && editingCell?.field === 'cplatacct_username' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => handleEdit(undefined, account.cplatacct_id, 'cplatacct_username', account.cplatacct_username)}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                          >
                            {account.cplatacct_username || 'Click to edit'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {editingCell?.accountId === account.cplatacct_id && editingCell?.field === 'cplatacct_api_key' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => handleEdit(undefined, account.cplatacct_id, 'cplatacct_api_key', account.cplatacct_api_key)}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                          >
                            {account.cplatacct_api_key ? '••••••••' : 'Click to edit'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {editingCell?.accountId === account.cplatacct_id && editingCell?.field === 'cplatacct_api_secret' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => handleEdit(undefined, account.cplatacct_id, 'cplatacct_api_secret', account.cplatacct_api_secret)}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                          >
                            {account.cplatacct_api_secret ? '••••••••' : 'Click to edit'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {editingCell?.accountId === account.cplatacct_id && editingCell?.field === 'api_management_url' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => handleEdit(undefined, account.cplatacct_id, 'api_management_url', account.api_management_url)}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                          >
                            {account.api_management_url || 'Click to edit'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleFetchPhoneNumbers(account.cplatacct_id, company.cplatcompany_name)}
                          disabled={isLoading || !account.cplatacct_api_key}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            account.cplatacct_api_key && !isLoading
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isLoading ? 'Fetching...' : 'Fetch Numbers'}
                        </button>
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phone Numbers Glacier Display */}
      {filteredData.some(company => 
        company.callplat_accounts?.some(account => account.phone_numbers_glacier)
      ) && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Phone Numbers Glacier</h3>
          <div className="space-y-4">
            {filteredData.map(company => 
              company.callplat_accounts
                ?.filter(account => account.phone_numbers_glacier)
                .map(account => (
                  <div key={account.cplatacct_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">
                        {company.cplatcompany_name} - {account.cplatacct_username}
                      </h4>
                      <button
                        onClick={() => handleFetchPhoneNumbers(account.cplatacct_id, company.cplatcompany_name)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        Refresh Numbers
                      </button>
                    </div>
                    <textarea
                      value={account.phone_numbers_glacier || ''}
                      readOnly
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                      placeholder="Phone numbers will appear here after fetching from the call platform..."
                    />
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}