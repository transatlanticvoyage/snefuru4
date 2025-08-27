'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface HostAccount {
  host_account_id: string;
  username: string;
  company_name: string;
  portal_url?: string;
  domains_glacier?: string;
}

export default function GlacrClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [hostAccountPopupOpen, setHostAccountPopupOpen] = useState<boolean>(false);
  const [allHostAccounts, setAllHostAccounts] = useState<HostAccount[]>([]);
  const [selectedHostAccount, setSelectedHostAccount] = useState<HostAccount | null>(null);
  const [domainsGlacierText, setDomainsGlacierText] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Get user internal ID
    const fetchUserInternalId = async () => {
      try {
        const response = await fetch('/api/get_user_internal_id');
        const data = await response.json();
        if (data.success) {
          setUserInternalId(data.user_internal_id);
        }
      } catch (error) {
        console.error('Error fetching user internal ID:', error);
      }
    };
    
    fetchUserInternalId();
  }, [user, router]);

  // Fetch host accounts for the popup
  const fetchHostAccountsForPopup = async () => {
    if (!userInternalId || allHostAccounts.length > 0) return;

    try {
      const params = new URLSearchParams({
        user_internal_id: userInternalId
      });

      const response = await fetch(`/api/get_domain_registrar_info?${params}`);
      const result = await response.json();

      if (result.success && result.data.all_host_accounts) {
        setAllHostAccounts(result.data.all_host_accounts);
      }
    } catch (error) {
      console.error('Error fetching host accounts:', error);
    }
  };

  // Open host account selection popup
  const openHostAccountPopup = () => {
    setHostAccountPopupOpen(true);
    fetchHostAccountsForPopup();
  };

  // Select a host account
  const selectHostAccount = (account: HostAccount | null) => {
    setSelectedHostAccount(account);
    setDomainsGlacierText(account?.domains_glacier || '');
    setHostAccountPopupOpen(false);
  };

  // Save domains_glacier text to the selected host account
  const saveDomainsGlacier = async () => {
    if (!selectedHostAccount || !userInternalId) return;

    try {
      const response = await fetch('/api/update_host_account_domains_glacier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host_account_id: selectedHostAccount.host_account_id,
          domains_glacier: domainsGlacierText,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update the selected host account with new domains_glacier value
        setSelectedHostAccount(prev => prev ? { ...prev, domains_glacier: domainsGlacierText } : null);
        // Also update the allHostAccounts array
        setAllHostAccounts(prev => 
          prev.map(acc => 
            acc.host_account_id === selectedHostAccount.host_account_id 
              ? { ...acc, domains_glacier: domainsGlacierText }
              : acc
          )
        );
      } else {
        console.error('Failed to save domains_glacier:', result.error);
      }
    } catch (error) {
      console.error('Error saving domains_glacier:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Glacr - Domain Glacier Management</h1>
        
        {/* Host Account Selection */}
        <div className="mb-6">
          <button
            onClick={openHostAccountPopup}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Select Dom Reg Host Account
          </button>
          
          {/* Selected Host Account Badge */}
          {selectedHostAccount && (
            <div className="ml-4 inline-flex items-center px-3 py-1 bg-green-100 border border-green-300 rounded-md">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-green-800 bg-green-200 px-2 py-0.5 rounded">
                  {selectedHostAccount.company_name}
                </span>
                <div className="w-px h-4 bg-gray-400"></div>
                <span className="text-sm text-green-700">{selectedHostAccount.username}</span>
                {selectedHostAccount.portal_url && (
                  <>
                    <div className="w-px h-4 bg-gray-400"></div>
                    <span className="text-xs text-green-600">{selectedHostAccount.portal_url}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Domains Glacier Editor */}
        {selectedHostAccount && (
          <div className="space-y-4">
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                domains_glacier
              </label>
              <textarea
                value={domainsGlacierText}
                onChange={(e) => setDomainsGlacierText(e.target.value)}
                className="w-full h-96 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
                style={{ width: '600px', height: '600px' }}
                placeholder="Enter domains glacier data..."
              />
            </div>
            
            <button
              onClick={saveDomainsGlacier}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Save Domains Glacier
            </button>
          </div>
        )}

        {/* Host Account Selection Popup */}
        {hostAccountPopupOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl relative">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Domain Registrar Host Account
                </h3>
                <button
                  onClick={() => setHostAccountPopupOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {allHostAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No host accounts found.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Create host accounts first to assign them to domains.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* None/Clear option */}
                    <div
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => selectHostAccount(null)}
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-3 bg-gray-300"></div>
                        <div className="flex-1 px-3">
                          <span className="text-sm font-medium text-gray-500">No Host Account</span>
                          <div className="text-xs text-gray-400">Clear current selection</div>
                        </div>
                      </div>
                    </div>

                    {/* Host account options */}
                    {allHostAccounts.map((account) => (
                      <div
                        key={account.host_account_id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => selectHostAccount(account)}
                      >
                        <div className="flex items-center flex-1">
                          {/* Company name */}
                          <div className="w-24 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {account.company_name}
                          </div>
                          
                          {/* Black vertical separator */}
                          <div className="w-px h-8 bg-black mx-3"></div>
                          
                          {/* Username */}
                          <div className="flex-1 px-3">
                            <span className="text-sm font-medium text-gray-900">{account.username}</span>
                            {account.portal_url && (
                              <div className="text-xs text-gray-500 mt-1">
                                Portal: {account.portal_url}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-4 border-t border-gray-200 space-x-3">
                <button
                  onClick={() => setHostAccountPopupOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}