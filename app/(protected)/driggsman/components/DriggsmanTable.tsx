'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface SitesprenSite {
  id: string;
  created_at: string;
  sitespren_base: string | null;
  true_root_domain: string | null;
  full_subdomain: string | null;
  webproperty_type: string | null;
  fk_users_id: string;
  updated_at: string;
  wpuser1: string | null;
  wppass1: string | null;
  wp_plugin_installed1: boolean | null;
  wp_plugin_connected2: boolean | null;
  fk_domreg_hostaccount: string | null;
  is_wp_site: boolean | null;
  wp_rest_app_pass: string | null;
  driggs_industry: string | null;
  driggs_city: string | null;
  driggs_brand_name: string | null;
  driggs_site_type_purpose: string | null;
  driggs_email_1: string | null;
  driggs_address_full: string | null;
  driggs_phone_1: string | null;
  driggs_special_note_for_ai_tool: string | null;
  ns_full: string | null;
  ip_address: string | null;
  is_starred1: string | null;
  icon_name: string | null;
  icon_color: string | null;
  is_bulldozer: boolean | null;
}

type SitesprenField = keyof SitesprenSite;

export default function DriggsmanTable() {
  const [sites, setSites] = useState<SitesprenSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  
  // Column pagination for sites
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  const [columnsPerPage, setColumnsPerPage] = useState(10);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ field: string; siteId: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SitesprenSite>>({});
  
  // Manual site entry states
  const [manualSiteInput, setManualSiteInput] = useState('');
  const [manualSites, setManualSites] = useState<string[]>([]);
  const [allSites, setAllSites] = useState<SitesprenSite[]>([]); // Store all fetched sites
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Phone number formatting functions
  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  };

  const formatPhoneNumber = (phone: string): string => {
    const normalized = normalizePhoneNumber(phone);
    if (normalized.length === 10) {
      return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
    }
    return phone; // Return original if not 10 digits
  };
  
  // Define all sitespren fields with their types
  const fieldDefinitions: Array<{ 
    key: SitesprenField; 
    type: string; 
    label: string;
    group?: string;
  }> = [
    { key: 'driggs_phone_1', type: 'text', label: 'driggs_phone_1', group: 'contact' },
    { key: 'id', type: 'text', label: 'id', group: 'system' },
    { key: 'created_at', type: 'timestamp', label: 'created_at', group: 'system' },
    { key: 'updated_at', type: 'timestamp', label: 'updated_at', group: 'system' },
    { key: 'fk_users_id', type: 'text', label: 'fk_users_id', group: 'system' },
    { key: 'sitespren_base', type: 'text', label: 'sitespren_base', group: 'domain' },
    { key: 'true_root_domain', type: 'text', label: 'true_root_domain', group: 'domain' },
    { key: 'full_subdomain', type: 'text', label: 'full_subdomain', group: 'domain' },
    { key: 'webproperty_type', type: 'text', label: 'webproperty_type', group: 'domain' },
    { key: 'ns_full', type: 'text', label: 'ns_full', group: 'technical' },
    { key: 'ip_address', type: 'text', label: 'ip_address', group: 'technical' },
    { key: 'is_wp_site', type: 'boolean', label: 'is_wp_site', group: 'wordpress' },
    { key: 'wpuser1', type: 'text', label: 'wpuser1', group: 'wordpress' },
    { key: 'wppass1', type: 'text', label: 'wppass1', group: 'wordpress' },
    { key: 'wp_plugin_installed1', type: 'boolean', label: 'wp_plugin_installed1', group: 'wordpress' },
    { key: 'wp_plugin_connected2', type: 'boolean', label: 'wp_plugin_connected2', group: 'wordpress' },
    { key: 'wp_rest_app_pass', type: 'text', label: 'wp_rest_app_pass', group: 'wordpress' },
    { key: 'fk_domreg_hostaccount', type: 'text', label: 'fk_domreg_hostaccount', group: 'hosting' },
    { key: 'driggs_industry', type: 'text', label: 'driggs_industry', group: 'business' },
    { key: 'driggs_city', type: 'text', label: 'driggs_city', group: 'business' },
    { key: 'driggs_brand_name', type: 'text', label: 'driggs_brand_name', group: 'business' },
    { key: 'driggs_site_type_purpose', type: 'text', label: 'driggs_site_type_purpose', group: 'business' },
    { key: 'driggs_email_1', type: 'text', label: 'driggs_email_1', group: 'contact' },
    { key: 'driggs_address_full', type: 'text', label: 'driggs_address_full', group: 'contact' },
    { key: 'driggs_special_note_for_ai_tool', type: 'text', label: 'driggs_special_note_for_ai_tool', group: 'meta' },
    { key: 'is_starred1', type: 'text', label: 'is_starred1', group: 'meta' },
    { key: 'icon_name', type: 'text', label: 'icon_name', group: 'display' },
    { key: 'icon_color', type: 'text', label: 'icon_color', group: 'display' },
    { key: 'is_bulldozer', type: 'boolean', label: 'is_bulldozer', group: 'meta' }
  ];
  
  // Initialize manual sites from URL parameter
  useEffect(() => {
    const sitesEnteredParam = searchParams?.get('sitesentered');
    if (sitesEnteredParam) {
      const sitesFromUrl = sitesEnteredParam.split(',').map(s => s.trim()).filter(s => s);
      setManualSites(sitesFromUrl);
      setManualSiteInput(sitesFromUrl.join(', '));
    }
  }, [searchParams]);

  // Fetch sites data and re-filter when manual sites change
  useEffect(() => {
    fetchSites();
  }, []);

  // Re-filter sites when manual sites change
  useEffect(() => {
    if (allSites.length > 0) {
      if (manualSites.length > 0) {
        const filteredSites = allSites.filter(site => 
          manualSites.some(manualSite => 
            site.sitespren_base?.toLowerCase().includes(manualSite.toLowerCase()) ||
            site.true_root_domain?.toLowerCase().includes(manualSite.toLowerCase())
          )
        );
        setSites(filteredSites);
      } else {
        setSites(allSites);
      }
    }
  }, [manualSites, allSites]);
  
  const fetchSites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      console.log('Supabase auth user ID:', user.id);
      
      // First get the internal user ID from users table (same as /sitejar4)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User lookup error:', userError);
        setError('User not found in users table');
        setLoading(false);
        return;
      }

      const userInternalId = userData.id;
      console.log('Internal user ID:', userInternalId);
      
      // Now get user's sites using the internal user ID
      const { data: sitesData, error: fetchError } = await supabase
        .from('sitespren')
        .select('*')
        .eq('fk_users_id', userInternalId)
        .order('created_at', { ascending: false });
        
      console.log('Sites found for internal user ID:', sitesData?.length || 0);
      
      if (sitesData && sitesData.length > 0) {
        console.log('First site data:', sitesData[0]);
        console.log('Site has these driggs fields populated:', 
          Object.keys(sitesData[0]).filter(key => key.startsWith('driggs_') && sitesData[0][key])
        );
      }
        
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
      
      setAllSites(sitesData || []); // Store all sites
      
      // Filter sites based on manual entries or show all
      if (manualSites.length > 0) {
        const filteredSites = sitesData?.filter(site => 
          manualSites.some(manualSite => 
            site.sitespren_base?.toLowerCase().includes(manualSite.toLowerCase()) ||
            site.true_root_domain?.toLowerCase().includes(manualSite.toLowerCase())
          )
        ) || [];
        setSites(filteredSites);
      } else {
        setSites(sitesData || []);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
      setError('Failed to fetch sites: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter fields based on search
  const filteredFields = useMemo(() => {
    return fieldDefinitions.filter(field => {
      if (!searchTerm) return true;
      return field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             field.group?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm]);

  // Paginate fields (rows)
  const totalFieldPages = Math.ceil(filteredFields.length / (itemsPerPage === -1 ? filteredFields.length : itemsPerPage));
  const paginatedFields = itemsPerPage === -1 
    ? filteredFields 
    : filteredFields.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Paginate sites (columns)
  const totalColumnPages = Math.ceil(sites.length / columnsPerPage);
  const paginatedSites = sites.slice((currentColumnPage - 1) * columnsPerPage, currentColumnPage * columnsPerPage);

  // Handle field selection
  const handleSelectAllFields = () => {
    if (selectedFields.size === paginatedFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(paginatedFields.map(field => field.key)));
    }
  };

  const handleFieldSelect = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  // Handle inline editing
  const handleCellClick = (field: string, siteId: string, value: any) => {
    const fieldDef = fieldDefinitions.find(f => f.key === field);
    if (fieldDef?.type === 'boolean') return; // Don't edit booleans via click
    
    setEditingCell({ field, siteId });
    
    // For phone numbers, show formatted version for editing
    if (field === 'driggs_phone_1' && value) {
      setEditingValue(formatPhoneNumber(value.toString()));
    } else {
      setEditingValue(value?.toString() || '');
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const { field, siteId } = editingCell;
      const fieldDef = fieldDefinitions.find(f => f.key === field);
      
      let processedValue: any = editingValue;
      
      // Process value based on type
      if (fieldDef?.type === 'boolean') {
        processedValue = editingValue === 'true';
      } else if (field === 'driggs_phone_1') {
        // Normalize phone number for storage
        processedValue = normalizePhoneNumber(editingValue);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const { error } = await supabase
        .from('sitespren')
        .update({ [field]: processedValue })
        .eq('id', siteId)
        .eq('fk_users_id', userData.id);

      if (error) throw error;

      // Update local data
      setSites(sites.map(site => 
        site.id === siteId ? { ...site, [field]: processedValue } : site
      ));

      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating cell:', err);
      alert('Failed to update cell');
    }
  };

  const handleBooleanToggle = async (field: SitesprenField, siteId: string, currentValue: boolean | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const newValue = !currentValue;
      
      const { error } = await supabase
        .from('sitespren')
        .update({ [field]: newValue })
        .eq('id', siteId)
        .eq('fk_users_id', userData.id);

      if (error) throw error;

      // Update local data
      setSites(sites.map(site => 
        site.id === siteId ? { ...site, [field]: newValue } : site
      ));
    } catch (err) {
      console.error('Error toggling boolean:', err);
      alert('Failed to update');
    }
  };

  // Create new site
  const handleCreateInline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const newSite = {
        fk_users_id: userData.id,
        sitespren_base: 'newsite.com',
        true_root_domain: 'newsite.com',
        webproperty_type: 'website',
        is_wp_site: false
      };

      const { data: createdData, error } = await supabase
        .from('sitespren')
        .insert([newSite])
        .select()
        .single();

      if (error) throw error;

      setSites([createdData, ...sites]);
      
      // Start editing the sitespren_base of the new site
      setTimeout(() => {
        handleCellClick('sitespren_base', createdData.id, createdData.sitespren_base);
      }, 100);
    } catch (err) {
      console.error('Error creating site:', err);
      alert('Failed to create new site');
    }
  };

  const handleCreatePopup = () => {
    setFormData({
      sitespren_base: '',
      true_root_domain: '',
      webproperty_type: 'website',
      is_wp_site: false
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const { data: createdData, error } = await supabase
        .from('sitespren')
        .insert([{ ...formData, fk_users_id: userData.id }])
        .select()
        .single();

      if (error) throw error;

      setSites([createdData, ...sites]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating site:', err);
      alert('Failed to create site');
    }
  };

  // Manual site entry functions
  const parseManualSites = (input: string): string[] => {
    return input
      .split(/[\s,\n]+/) // Split by spaces, commas, or newlines
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const handleManualSiteSubmit = () => {
    const sites = parseManualSites(manualSiteInput);
    setManualSites(sites);
    
    // Update URL parameter
    const url = new URL(window.location.href);
    if (sites.length > 0) {
      url.searchParams.set('sitesentered', sites.join(','));
    } else {
      url.searchParams.delete('sitesentered');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  const handleManualSiteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSiteSubmit();
    }
  };

  const removeManualSite = (siteToRemove: string) => {
    const updatedSites = manualSites.filter(site => site !== siteToRemove);
    setManualSites(updatedSites);
    setManualSiteInput(updatedSites.join(', '));
    
    // Update URL parameter
    const url = new URL(window.location.href);
    if (updatedSites.length > 0) {
      url.searchParams.set('sitesentered', updatedSites.join(','));
    } else {
      url.searchParams.delete('sitesentered');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  const clearAllManualSites = () => {
    setManualSites([]);
    setManualSiteInput('');
    
    // Remove URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('sitesentered');
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Rows:</span>
        <div className="inline-flex" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${itemsPerPage === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                ${index === 0 ? 'rounded-l-md' : ''}
                ${index === 6 ? 'rounded-r-md' : ''}
                ${index > 0 ? 'border-l-0' : ''}
                transition-colors duration-150
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value === -1 ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {/* Page selector */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Page:</span>
        <div className="inline-flex" role="group">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalFieldPages) }, (_, i) => {
            let pageNum;
            if (totalFieldPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalFieldPages - 2) {
              pageNum = totalFieldPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-gray-300 border-l-0
                  ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalFieldPages, currentPage + 1))}
            disabled={currentPage === totalFieldPages}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 border-l-0 rounded-r-md
              ${currentPage === totalFieldPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Search box */}
      <div className="flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search fields..."
          className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ height: '38px' }}
        />
        <button
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold border border-yellow-400 rounded-r-md text-sm transition-colors duration-150"
          style={{ height: '38px' }}
        >
          CL
        </button>
      </div>
    </div>
  );

  // Column pagination controls
  const ColumnPaginationControls = () => (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Sites per view:</span>
        <div className="inline-flex" role="group">
          {[5, 10, 15, 20].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setColumnsPerPage(value);
                setCurrentColumnPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${columnsPerPage === value ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                ${index === 0 ? 'rounded-l-md' : ''}
                ${index === 3 ? 'rounded-r-md' : ''}
                ${index > 0 ? 'border-l-0' : ''}
                transition-colors duration-150
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Column Page:</span>
        <div className="inline-flex" role="group">
          <button
            onClick={() => setCurrentColumnPage(Math.max(1, currentColumnPage - 1))}
            disabled={currentColumnPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${currentColumnPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalColumnPages) }, (_, i) => {
            let pageNum;
            if (totalColumnPages <= 5) {
              pageNum = i + 1;
            } else if (currentColumnPage <= 3) {
              pageNum = i + 1;
            } else if (currentColumnPage >= totalColumnPages - 2) {
              pageNum = totalColumnPages - 4 + i;
            } else {
              pageNum = currentColumnPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentColumnPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-gray-300 border-l-0
                  ${currentColumnPage === pageNum ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentColumnPage(Math.min(totalColumnPages, currentColumnPage + 1))}
            disabled={currentColumnPage === totalColumnPages}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 border-l-0 rounded-r-md
              ${currentColumnPage === totalColumnPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading site matrix...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {/* Nubra Tableface Kite */}
      <div className="mb-2">
        <NubraTablefaceKite tableType="driggsman-site-matrix" />
      </div>

      {/* Debug Info */}
      {sites.length === 0 && !loading && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">No Sites Found</h3>
          <p className="text-sm text-yellow-700">
            No sites were found for your account. This could mean:
          </p>
          <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
            <li>You haven't created any sites yet</li>
            <li>Sites exist but under a different user ID</li>
            <li>Database connection issue</li>
          </ul>
          <p className="text-xs text-yellow-600 mt-2">
            Check the browser console for debugging information.
          </p>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={handleCreateInline}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Create New (Inline)
          </button>
          <button
            onClick={handleCreatePopup}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create New (Popup)
          </button>
          {selectedFields.size > 0 && (
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded">
              {selectedFields.size} fields selected
            </span>
          )}
          <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded text-sm">
            {sites.length} sites loaded
          </span>
        </div>
        <div className="flex flex-col space-y-2">
          <PaginationControls />
          <ColumnPaginationControls />
        </div>
      </div>

      {/* Manual Site Entry Section */}
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        {/* Manual Site Input */}
        <div className="mb-3">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            enter sites manually
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={manualSiteInput}
              onChange={(e) => setManualSiteInput(e.target.value)}
              onKeyPress={handleManualSiteKeyPress}
              placeholder="dogs.com, cats.com facebook.com/group example.net"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleManualSiteSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Submit
            </button>
            {manualSites.length > 0 && (
              <button
                onClick={clearAllManualSites}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Separate sites with spaces, commas, or line breaks. Sites will be matched against your database.
          </p>
        </div>

        {/* Currently Entered Sites Display */}
        {manualSites.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Currently viewing sites ({manualSites.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {manualSites.map((site, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  <span className="mr-2">{site}</span>
                  <button
                    onClick={() => removeManualSite(site)}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Remove this site"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Showing {sites.length} matching sites from your database out of {allSites.length} total sites.
            </div>
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {/* Field selection checkbox */}
                <th 
                  className="w-12 px-2 py-3 text-left cursor-pointer hover:bg-gray-100 border-r border-gray-300"
                  onClick={handleSelectAllFields}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedFields.size === paginatedFields.length && paginatedFields.length > 0}
                      onChange={() => {}}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                </th>
                
                {/* Field name column */}
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider w-64 border-r border-gray-300">
                  field name
                </th>

                {/* Site columns */}
                {paginatedSites.map((site, index) => (
                  <th
                    key={site.id}
                    className={`px-3 py-3 text-left text-xs font-bold text-gray-900 w-48 ${
                      index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                    }`}
                    title={site.sitespren_base || site.id}
                  >
                    <div className="truncate">
                      {(site.sitespren_base || `site ${site.id.slice(0, 8)}`).toLowerCase()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedFields.map((field) => (
                <tr key={field.key} className="hover:bg-gray-50">
                  {/* Field selection checkbox */}
                  <td 
                    className="w-12 px-2 py-2 cursor-pointer border-r border-gray-300"
                    onClick={() => handleFieldSelect(field.key)}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedFields.has(field.key)}
                        onChange={() => {}}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  </td>

                  {/* Field name */}
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 w-64 border-r border-gray-300">
                    <span>{field.label}</span>
                  </td>

                  {/* Site value cells */}
                  {paginatedSites.map((site, index) => {
                    const value = site[field.key];
                    const isEditing = editingCell?.field === field.key && editingCell?.siteId === site.id;

                    if (field.type === 'boolean') {
                      return (
                        <td 
                          key={`${field.key}-${site.id}`} 
                          className={`px-3 py-2 text-sm text-gray-900 w-48 ${
                            index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                          }`}
                        >
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!value}
                              onChange={() => handleBooleanToggle(field.key, site.id, !!value)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${field.key}-${site.id}`}
                        className={`px-3 py-2 text-sm text-gray-900 cursor-pointer w-48 ${
                          index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                        }`}
                        onClick={() => !isEditing && handleCellClick(field.key, site.id, value)}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave();
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                                setEditingValue('');
                              }
                            }}
                            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div className="truncate">
                            {field.type === 'timestamp' && value
                              ? new Date(value).toLocaleString()
                              : field.key === 'driggs_phone_1' && value
                              ? formatPhoneNumber(value.toString())
                              : value?.toString() || '-'}
                          </div>
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

      {/* Bottom pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {paginatedFields.length} fields × {paginatedSites.length} sites
          <br />
          <span className="text-xs text-gray-500">
            Total sites: {sites.length} | Column page: {currentColumnPage}/{totalColumnPages}
          </span>
        </div>
        <div className="flex flex-col space-y-2">
          <PaginationControls />
          <ColumnPaginationControls />
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Site</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Base</label>
                <input
                  type="text"
                  value={formData.sitespren_base || ''}
                  onChange={(e) => setFormData({ ...formData, sitespren_base: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Root Domain</label>
                <input
                  type="text"
                  value={formData.true_root_domain || ''}
                  onChange={(e) => setFormData({ ...formData, true_root_domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <input
                  type="text"
                  value={formData.webproperty_type || ''}
                  onChange={(e) => setFormData({ ...formData, webproperty_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="website"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_wp_site"
                  checked={formData.is_wp_site || false}
                  onChange={(e) => setFormData({ ...formData, is_wp_site: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_wp_site" className="text-sm font-medium text-gray-700">
                  WordPress Site
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}