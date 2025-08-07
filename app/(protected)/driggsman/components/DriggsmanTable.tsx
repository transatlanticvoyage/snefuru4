'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InputsExpandEditor from '@/app/components/shared/InputsExpandEditor';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
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
  driggs_address_species_id: number | null;
  driggs_phone_1: string | null;
  driggs_phone1_platform_id: number | null;
  driggs_cgig_id: number | null;
  driggs_citations_done: boolean | null;
  driggs_special_note_for_ai_tool: string | null;
  driggs_revenue_goal: number | null;
  ns_full: string | null;
  ip_address: string | null;
  is_starred1: string | null;
  icon_name: string | null;
  icon_color: string | null;
  is_bulldozer: boolean | null;
  is_competitor: boolean | null;
  is_external: boolean | null;
  is_internal: boolean | null;
  is_ppx: boolean | null;
  is_ms: boolean | null;
  is_wayback_rebuild: boolean | null;
  is_naked_wp_build: boolean | null;
  is_rnr: boolean | null;
  is_aff: boolean | null;
  is_other1: boolean | null;
  is_other2: boolean | null;
}

interface CallPlatform {
  platform_id: number;
  platform_name: string;
  platform_url: string | null;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface AddressSpecies {
  aspecies_id: number;
  aspecies_name: string | null;
  aspecies_code: string | null;
  address_format: string | null;
  country_code: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
}

interface CitationGig {
  cgig_id: number;
  cgig_title: string;
  seller_name: string;
  marketplace: string;
  base_price: number;
  currency: string;
  cgig_url: string;
  citations_included: number;
  is_active: boolean;
  user_id: string;
  inputs_v1: string | null;
  inputs_v2: string | null;
  inputs_v3: string | null;
}

interface SitesprenTag {
  tag_id: number;
  tag_name: string;
  tag_order: number;
  fk_user_id: string;
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
  
  // Call platform dropdown states
  const [callPlatforms, setCallPlatforms] = useState<CallPlatform[]>([]);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState<{ field: string; siteId: string } | null>(null);
  
  // Citation gig dropdown states
  const [citationGigs, setCitationGigs] = useState<CitationGig[]>([]);
  const [cgigDropdownOpen, setCgigDropdownOpen] = useState<{ field: string; siteId: string } | null>(null);
  
  // Address species dropdown states
  const [addressSpecies, setAddressSpecies] = useState<AddressSpecies[]>([]);
  const [addressSpeciesDropdownOpen, setAddressSpeciesDropdownOpen] = useState<{ field: string; siteId: string } | null>(null);
  
  // Selected sites for table filtering
  // TODO: Implement URL state persistence using one of these approaches:
  // 1. Simple: ?selected=site1,site2,site3 (readable but can get long)
  // 2. Encoded: ?penja=9284jsiweu294824 (short but requires mapping)
  // 3. Base64: ?state=eyJ0YWciOiJ0YWduYW1lIn0= (middle ground)
  // 4. Hybrid: Use simple for <5 sites, encoded for larger selections
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set());
  
  // Inputs expand editor states
  const [inputsExpandPopup, setInputsExpandPopup] = useState<{ 
    cgigId: number; 
    initialTab: 'inputs_v1' | 'inputs_v2' | 'inputs_v3';
  } | null>(null);
  
  // Verification column toggle
  const [showVerificationColumn, setShowVerificationColumn] = useState(false);
  
  // Competitor sites toggle
  const [showCompetitorSites, setShowCompetitorSites] = useState(false);
  
  // Rain chamber states
  const [activeRainChamber, setActiveRainChamber] = useState(false);
  const [sitesprenTags, setSitesprenTags] = useState<SitesprenTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [taggedSites, setTaggedSites] = useState<SitesprenSite[]>([]);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [tagCounts, setTagCounts] = useState<Map<number, number>>(new Map());
  
  // Filtering mechanism states
  const [useDaylightFilter, setUseDaylightFilter] = useState(false);
  const [useRainFilter, setUseRainFilter] = useState(false);
  const [storedManualSites, setStoredManualSites] = useState<string[]>([]); // Store manual sites permanently
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Site selection functions
  const toggleSiteSelection = (siteId: string) => {
    console.log('Toggle site selection:', siteId);
    setSelectedSiteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
        console.log('Removed site from selection:', siteId);
      } else {
        newSet.add(siteId);
        console.log('Added site to selection:', siteId);
      }
      console.log('New selection set size:', newSet.size);
      return newSet;
    });
  };

  const selectAllTaggedSites = () => {
    console.log('Select all tagged sites - count:', taggedSites.length);
    const allSiteIds = taggedSites.map(site => site.id);
    console.log('Site IDs to select:', allSiteIds);
    setSelectedSiteIds(new Set(allSiteIds));
  };

  const deselectAllTaggedSites = () => {
    console.log('Deselect all tagged sites');
    setSelectedSiteIds(new Set());
  };

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
    { key: 'driggs_revenue_goal', type: 'number', label: 'driggs_revenue_goal', group: 'business' },
    { key: 'driggs_phone1_platform_id', type: 'platform_dropdown', label: 'driggs_phone1_platform_id', group: 'contact' },
    { key: 'driggs_phone_1', type: 'text', label: 'driggs_phone_1', group: 'contact' },
    { key: 'driggs_address_full', type: 'text', label: 'driggs_address_full', group: 'contact' },
    { key: 'driggs_address_species_id', type: 'address_species_dropdown', label: 'driggs_address_species_id', group: 'contact' },
    { key: 'driggs_cgig_id', type: 'cgig_dropdown', label: 'driggs_cgig_id', group: 'contact' },
    { key: 'driggs_citations_done', type: 'boolean', label: 'driggs_citations_done', group: 'contact' },
    { key: 'driggs_industry', type: 'text', label: 'driggs_industry', group: 'business' },
    { key: 'driggs_city', type: 'text', label: 'driggs_city', group: 'business' },
    { key: 'driggs_brand_name', type: 'text', label: 'driggs_brand_name', group: 'business' },
    { key: 'driggs_site_type_purpose', type: 'text', label: 'driggs_site_type_purpose', group: 'business' },
    { key: 'driggs_email_1', type: 'text', label: 'driggs_email_1', group: 'contact' },
    { key: 'driggs_special_note_for_ai_tool', type: 'text', label: 'driggs_special_note_for_ai_tool', group: 'meta' },
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
    { key: 'is_starred1', type: 'text', label: 'is_starred1', group: 'meta' },
    { key: 'icon_name', type: 'text', label: 'icon_name', group: 'display' },
    { key: 'icon_color', type: 'text', label: 'icon_color', group: 'display' },
    { key: 'is_bulldozer', type: 'boolean', label: 'is_bulldozer', group: 'meta' },
    { key: 'is_competitor', type: 'boolean', label: 'is_competitor', group: 'meta' },
    { key: 'is_external', type: 'boolean', label: 'is_external', group: 'meta' },
    { key: 'is_internal', type: 'boolean', label: 'is_internal', group: 'meta' },
    { key: 'is_ppx', type: 'boolean', label: 'is_ppx', group: 'meta' },
    { key: 'is_ms', type: 'boolean', label: 'is_ms', group: 'meta' },
    { key: 'is_wayback_rebuild', type: 'boolean', label: 'is_wayback_rebuild', group: 'meta' },
    { key: 'is_naked_wp_build', type: 'boolean', label: 'is_naked_wp_build', group: 'meta' },
    { key: 'is_rnr', type: 'boolean', label: 'is_rnr', group: 'meta' },
    { key: 'is_aff', type: 'boolean', label: 'is_aff', group: 'meta' },
    { key: 'is_other1', type: 'boolean', label: 'is_other1', group: 'meta' },
    { key: 'is_other2', type: 'boolean', label: 'is_other2', group: 'meta' }
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
    fetchCallPlatforms();
    fetchCitationGigs();
    fetchAddressSpecies();
    fetchSitesprenTags();
  }, []);

  // Re-filter sites when manual sites change or filtering states change
  useEffect(() => {
    console.log('Filtering effect triggered:', {
      allSitesLength: allSites.length,
      useDaylightFilter,
      useRainFilter, 
      taggedSitesLength: taggedSites.length,
      selectedSiteIdsSize: selectedSiteIds.size,
      selectedSiteIds: Array.from(selectedSiteIds)
    });
    
    if (allSites.length > 0) {
      if (useDaylightFilter && manualSites.length > 0) {
        // Use daylight chamber filtering (manual sites)
        const filteredSites = allSites.filter(site => 
          manualSites.some(manualSite => 
            site.sitespren_base?.toLowerCase().includes(manualSite.toLowerCase()) ||
            site.true_root_domain?.toLowerCase().includes(manualSite.toLowerCase())
          )
        );
        console.log('Daylight filtering - setting sites:', filteredSites.length);
        setSites(filteredSites);
      } else if (useRainFilter && taggedSites.length > 0) {
        // Use rain chamber filtering (tagged sites) - only show selected sites
        const filteredTaggedSites = taggedSites.filter(site => selectedSiteIds.has(site.id));
        console.log('Rain filtering - setting sites:', filteredTaggedSites.length, 'from tagged sites:', taggedSites.length, 'selected:', selectedSiteIds.size);
        setSites(filteredTaggedSites);
      } else {
        // No filtering - show all sites
        console.log('No filtering - setting all sites:', allSites.length);
        setSites(allSites);
      }
    }
  }, [manualSites, allSites, useDaylightFilter, useRainFilter, taggedSites, selectedSiteIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformDropdownOpen || cgigDropdownOpen || addressSpeciesDropdownOpen || tagsDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setPlatformDropdownOpen(null);
          setCgigDropdownOpen(null);
          setAddressSpeciesDropdownOpen(null);
          setTagsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [platformDropdownOpen, cgigDropdownOpen, addressSpeciesDropdownOpen, tagsDropdownOpen]);
  
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

  // Fetch call platforms
  const fetchCallPlatforms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) return;

      const { data: platformsData, error: fetchError } = await supabase
        .from('call_platforms')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .order('platform_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching call platforms:', fetchError);
        return;
      }

      setCallPlatforms(platformsData || []);
    } catch (err) {
      console.error('Error in fetchCallPlatforms:', err);
    }
  };

  // Fetch citation gigs
  const fetchCitationGigs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        return;
      }

      const { data: gigsData, error: gigsError } = await supabase
        .from('citation_gigs')
        .select('cgig_id, cgig_title, seller_name, marketplace, base_price, currency, cgig_url, is_active, user_id, citations_included, inputs_v1, inputs_v2, inputs_v3')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .order('cgig_title');

      if (gigsError) {
        console.error('Error fetching citation gigs:', gigsError);
        return;
      }

      setCitationGigs(gigsData || []);
    } catch (err) {
      console.error('Error in fetchCitationGigs:', err);
    }
  };

  // Fetch address species
  const fetchAddressSpecies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        return;
      }

      const { data: speciesData, error } = await supabase
        .from('address_species')
        .select('*')
        .eq('is_active', true)
        .order('aspecies_name', { ascending: true });

      if (error) {
        console.error('Error fetching address species:', error);
        return;
      }

      setAddressSpecies(speciesData || []);
    } catch (err) {
      console.error('Error in fetchAddressSpecies:', err);
    }
  };

  // Fetch sitespren tags
  const fetchTagCounts = async (userInternalId: string, tags: SitesprenTag[]) => {
    const counts = new Map<number, number>();
    
    try {
      // Fetch counts for all tags at once
      const { data: tagRelations, error } = await supabase
        .from('sitespren_tags_relations')
        .select('fk_tag_id')
        .eq('fk_user_id', userInternalId);
      
      if (error) {
        console.error('Error fetching tag counts:', error);
        return counts;
      }
      
      // Count sites per tag
      tagRelations?.forEach(relation => {
        const tagId = relation.fk_tag_id;
        counts.set(tagId, (counts.get(tagId) || 0) + 1);
      });
      
      // Ensure all tags have a count (even if 0)
      tags.forEach(tag => {
        if (!counts.has(tag.tag_id)) {
          counts.set(tag.tag_id, 0);
        }
      });
      
    } catch (err) {
      console.error('Error in fetchTagCounts:', err);
    }
    
    return counts;
  };

  const fetchSitesprenTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        return;
      }

      setUserInternalId(userData.id);

      // Fetch tags using the API route
      const response = await fetch(`/api/sitespren_tags?user_internal_id=${userData.id}`);
      const result = await response.json();
      
      if (result.success) {
        const tags = result.data || [];
        setSitesprenTags(tags);
        
        // Fetch counts for the tags
        const counts = await fetchTagCounts(userData.id, tags);
        setTagCounts(counts);
      } else {
        console.error('Error fetching tags:', result.error);
      }
    } catch (err) {
      console.error('Error in fetchSitesprenTags:', err);
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

  // Checkbox filter handlers
  const handleDaylightFilterChange = (checked: boolean) => {
    setUseDaylightFilter(checked);
    if (checked) {
      setUseRainFilter(false);
      setActiveRainChamber(false);
      // Restore stored manual sites
      if (storedManualSites.length > 0) {
        setManualSites(storedManualSites);
      }
    } else {
      // No filtering - show all sites
      setManualSites([]);
    }
  };

  const handleRainFilterChange = (checked: boolean) => {
    setUseRainFilter(checked);
    if (checked) {
      setUseDaylightFilter(false);
      // Don't clear storedManualSites, just hide them from current view
      setManualSites([]);
      // If a tag is selected, activate rain chamber
      if (selectedTagId) {
        setActiveRainChamber(true);
      }
    } else {
      // No filtering - show all sites
      setActiveRainChamber(false);
      setManualSites([]);
    }
  };

  const handleManualSiteSubmit = () => {
    const sites = parseManualSites(manualSiteInput);
    setManualSites(sites);
    setStoredManualSites(sites); // Store permanently for toggle between chambers
    
    // Update URL parameter only in browser environment
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (sites.length > 0) {
        url.searchParams.set('sitesentered', sites.join(','));
      } else {
        url.searchParams.delete('sitesentered');
      }
      router.replace(url.pathname + url.search, { scroll: false });
    }
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
    
    // Update URL parameter only in browser environment
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (updatedSites.length > 0) {
        url.searchParams.set('sitesentered', updatedSites.join(','));
      } else {
        url.searchParams.delete('sitesentered');
      }
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

  const clearAllManualSites = () => {
    setManualSites([]);
    setStoredManualSites([]);
    setManualSiteInput('');
    
    // Remove URL parameter only in browser environment
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('sitesentered');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

  // Platform dropdown functions
  const handlePlatformDropdownClick = (field: string, siteId: string) => {
    if (platformDropdownOpen?.field === field && platformDropdownOpen?.siteId === siteId) {
      setPlatformDropdownOpen(null);
    } else {
      setPlatformDropdownOpen({ field, siteId });
    }
  };

  const handlePlatformSelect = async (siteId: string, platformId: number | null) => {
    try {
      console.log('Attempting to update platform:', { siteId, platformId });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User lookup error:', userError);
        throw new Error('User not found');
      }

      console.log('Updating site:', siteId, 'with platform:', platformId, 'for user:', userData.id);

      const { data, error } = await supabase
        .from('sitespren')
        .update({ driggs_phone1_platform_id: platformId })
        .eq('id', siteId)
        .eq('fk_users_id', userData.id)
        .select('id, driggs_phone1_platform_id');

      if (error) {
        console.error('Supabase update error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Update successful:', data);

      // Update local data
      setSites(sites.map(site => 
        site.id === siteId ? { ...site, driggs_phone1_platform_id: platformId } : site
      ));

      setPlatformDropdownOpen(null);
    } catch (err) {
      console.error('Error updating platform:', err);
      alert(`Failed to update platform: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getPlatformName = (platformId: number | null): string => {
    if (!platformId) return 'None';
    const platform = callPlatforms.find(p => p.platform_id === platformId);
    return platform ? platform.platform_name : `Platform ${platformId}`;
  };

  const getCitationGigName = (cgigId: number | null): string => {
    if (!cgigId) return 'None';
    const gig = citationGigs.find(g => g.cgig_id === cgigId);
    return gig ? gig.cgig_title : `Gig ${cgigId}`;
  };

  const getCitationGigDetails = (cgigId: number | null): string => {
    if (!cgigId) return 'None';
    const gig = citationGigs.find(g => g.cgig_id === cgigId);
    if (!gig) return `Gig ${cgigId}`;
    
    const truncatedTitle = gig.cgig_title.length > 15 
      ? gig.cgig_title.substring(0, 15) + '..'
      : gig.cgig_title;
    
    return `${truncatedTitle} -- ${gig.seller_name} -- $${gig.base_price} -- ${gig.citations_included || 0} citations`;
  };

  const getAddressSpeciesName = (speciesId: number | null): string => {
    if (!speciesId) return 'None';
    const species = addressSpecies.find(s => s.aspecies_id === speciesId);
    return species ? species.aspecies_name || `Species ${speciesId}` : `Species ${speciesId}`;
  };

  const getAddressSpeciesDetails = (speciesId: number | null): string => {
    if (!speciesId) return 'None';
    const species = addressSpecies.find(s => s.aspecies_id === speciesId);
    if (!species) return `Species ${speciesId}`;
    
    const name = species.aspecies_name || 'Unnamed';
    const code = species.aspecies_code || 'No code';
    const country = species.country_code || 'Unknown';
    
    return `${name} (${code}) - ${country}`;
  };

  const handleAddressSpeciesDropdownClick = (field: string, siteId: string) => {
    if (addressSpeciesDropdownOpen?.field === field && addressSpeciesDropdownOpen?.siteId === siteId) {
      setAddressSpeciesDropdownOpen(null);
    } else {
      setAddressSpeciesDropdownOpen({ field, siteId });
      // Close other dropdowns if open
      setPlatformDropdownOpen(null);
      setCgigDropdownOpen(null);
    }
  };

  const handleAddressSpeciesSelect = async (speciesId: number | null, field: string, siteId: string) => {
    try {
      console.log('Updating address species:', { speciesId, field, siteId });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');

      const { data, error } = await supabase
        .from('sitespren')
        .update({ driggs_address_species_id: speciesId })
        .eq('id', siteId)
        .eq('fk_users_id', userData.id)
        .select('id, driggs_address_species_id');

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      // Update local data
      setSites(sites.map(site => 
        site.id === siteId ? { ...site, driggs_address_species_id: speciesId } : site
      ));

      setAddressSpeciesDropdownOpen(null);
    } catch (err: any) {
      console.error('Error updating address species:', err);
      alert(`Failed to update address species: ${err.message}`);
    }
  };

  const handleCgigDropdownClick = (field: string, siteId: string) => {
    if (cgigDropdownOpen?.field === field && cgigDropdownOpen?.siteId === siteId) {
      setCgigDropdownOpen(null);
    } else {
      setCgigDropdownOpen({ field, siteId });
      // Close platform dropdown if open
      setPlatformDropdownOpen(null);
    }
  };

  // Handle inputs expand editor
  const handleInputsExpandClick = (cgigId: number, field: 'inputs_v1' | 'inputs_v2' | 'inputs_v3') => {
    console.log(`Opening inputs editor for cgig ${cgigId}, initial tab: ${field}`);
    setInputsExpandPopup({ cgigId, initialTab: field });
  };

  const handleInputsExpandSave = async (field: 'inputs_v1' | 'inputs_v2' | 'inputs_v3', newValue: string) => {
    if (!inputsExpandPopup) return;

    const { cgigId } = inputsExpandPopup;
    
    console.log(`Saving ${field} for cgig ${cgigId}:`, newValue);
    
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
      
      // Verify the citation gig exists and belongs to the user before updating
      const { data: gigCheck, error: checkError } = await supabase
        .from('citation_gigs')
        .select('cgig_id, cgig_title')
        .eq('cgig_id', cgigId)
        .eq('user_id', userData.id)
        .single();
      
      if (checkError || !gigCheck) {
        throw new Error(`Citation gig ${cgigId} not found or access denied`);
      }
      
      const { error } = await supabase
        .from('citation_gigs')
        .update({ [field]: newValue })
        .eq('cgig_id', cgigId)
        .eq('user_id', userData.id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      console.log(`Successfully saved ${field} for ${gigCheck.cgig_title} (${cgigId})`);
    } catch (error) {
      console.error('Error saving inputs field:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return;
    }

    // Update local citation gigs data
    setCitationGigs(citationGigs.map(gig => 
      gig.cgig_id === cgigId ? { ...gig, [field]: newValue } : gig
    ));
  };

  const handleInputsExpandClose = () => {
    setInputsExpandPopup(null);
  };

  const handleCgigSelect = async (cgigId: number, field: string, siteId: string) => {
    try {
      console.log('Updating citation gig:', { cgigId, field, siteId });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');

      const { data: updateData, error: updateError } = await supabase
        .from('sitespren')
        .update({ [field]: cgigId })
        .eq('id', siteId)
        .eq('fk_users_id', userData.id)
        .select();

      console.log('Update response:', { updateData, updateError });

      if (updateError) throw updateError;

      // Update local state
      setSites(sites.map(site => 
        site.id === siteId 
          ? { ...site, [field]: cgigId }
          : site
      ));

      setCgigDropdownOpen(null);
    } catch (err) {
      console.error('Error updating citation gig:', err);
      alert(`Failed to update citation gig: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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

  // Rain chamber handler functions
  const fetchSitesByTag = async (tagId: number) => {
    if (!userInternalId) return;
    
    try {
      // Use the existing working API from sitejar4
      const response = await fetch(`/api/get_sites_by_tag?user_internal_id=${userInternalId}&tag_id=${tagId}`);
      const result = await response.json();
      
      if (!result.success) {
        console.error('Error fetching tagged sites:', result.error);
        setTaggedSites([]);
        return;
      }
      
      const siteIds = result.data?.site_ids || [];
      
      if (siteIds.length === 0) {
        console.log('No sites found for this tag');
        setTaggedSites([]);
        return;
      }
      
      // Filter allSites to only include tagged sites
      const filteredTaggedSites = allSites.filter(site => siteIds.includes(site.id));
      setTaggedSites(filteredTaggedSites);
      
      console.log(`Found ${filteredTaggedSites.length} sites with tag ${tagId}`);
      
    } catch (err) {
      console.error('Error in fetchSitesByTag:', err);
      setTaggedSites([]);
    }
  };

  const handleTagSelection = async (tagId: number) => {
    if (!userInternalId) return;
    
    setSelectedTagId(tagId);
    setTagsDropdownOpen(false);
    
    // Update URL parameter only in browser environment
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('sitespren_tag', tagId.toString());
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
    
    // Fetch sites for this tag immediately when selected
    await fetchSitesByTag(tagId);
    console.log('Selected tag:', tagId);
    
    // Note: We'll need to implement the sitespren_site_tags relationship table
    // and fetch tagged sites here
  };

  const handleRainChamberSubmit = async () => {
    if (!selectedTagId) return;
    
    // Switch to rain chamber mode and enable rain filter
    setActiveRainChamber(true);
    setUseRainFilter(true);
    setUseDaylightFilter(false);
    
    // Fetch sites that have the selected tag
    await fetchSitesByTag(selectedTagId);
  };

  // Initialize URL parameters and tag selection on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tagParam = urlParams.get('sitespren_tag');
      if (tagParam && parseInt(tagParam)) {
        const tagId = parseInt(tagParam);
        setSelectedTagId(tagId);
        setActiveRainChamber(true);
        setUseRainFilter(true);
        setUseDaylightFilter(false);
        // Fetch sites for this tag when component loads with URL parameter
        if (userInternalId && allSites.length > 0) {
          fetchSitesByTag(tagId);
        }
      }
    }
  }, [userInternalId, allSites]); // Dependencies to ensure data is loaded

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
      {/* Drenjari Navigation Links */}
      <DrenjariButtonBarDriggsmanLinks />
      
      {/* Nubra Tableface Kite with Control Buttons */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <NubraTablefaceKite tableType="driggsman-site-matrix" />
          <div className="flex items-center bg-gray-100 border border-gray-300 rounded px-3 py-2">
            <span className="text-sm font-medium text-gray-800">
              jenmava: 100 sites = $7,500 USD/m -- 133 = $10,000 USD/m
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('jenmava: 100 sites = $7,500 USD/m -- 133 = $10,000 USD/m');
              }}
              className="ml-3 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVerificationColumn(!showVerificationColumn)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              showVerificationColumn ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            show verification column
          </button>
          <button
            onClick={() => setShowCompetitorSites(!showCompetitorSites)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              showCompetitorSites ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            show competitor sites
          </button>
        </div>
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

      {/* Daylight Chamber */}
      <div className={`daylight-chamber mb-4 border border-gray-700 rounded-lg ${useRainFilter ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="p-4 bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="font-bold text-sm text-gray-800">daylight_chamber</div>
            <input
              type="checkbox"
              checked={useDaylightFilter}
              onChange={(e) => handleDaylightFilterChange(e.target.checked)}
              className="ml-3 w-4 h-4"
              style={{ width: '16px', height: '16px' }}
            />
            <span className="ml-2 text-sm text-gray-600">Use to filter</span>
          </div>
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
      </div>

      {/* Rain Chamber */}
      <div className={`rain-chamber mb-4 border border-gray-700 rounded-lg ${activeRainChamber ? 'border-blue-500 bg-blue-50' : ''}`}>
        <div className="p-4 bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="font-bold text-sm text-gray-800">rain_chamber</div>
            <input
              type="checkbox"
              checked={useRainFilter}
              onChange={(e) => handleRainFilterChange(e.target.checked)}
              className="ml-3 w-4 h-4"
              style={{ width: '16px', height: '16px' }}
            />
            <span className="ml-2 text-sm text-gray-600">Use to filter</span>
          </div>
          
          {/* Sitespren Tags Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              select from sitespren_tags
            </label>
            <div className="relative">
              <button
                onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {selectedTagId ? 
                  sitesprenTags.find(tag => tag.tag_id === selectedTagId)?.tag_name || 'Select a tag'
                  : 'Select a tag'
                }
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              
              {/* Dropdown Menu */}
              {tagsDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">Select Sitespren Tag:</div>
                    
                    {sitesprenTags.length > 0 ? (
                      <div className="border border-gray-200 rounded">
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-2 py-1 text-left font-medium text-gray-700">tag_id</th>
                                <th className="px-2 py-1 text-left font-medium text-gray-700">tag_name</th>
                                <th className="px-2 py-1 text-left font-medium text-gray-700">tag_order</th>
                                <th className="px-2 py-1 text-left font-medium text-gray-700">
                                  dynamic count<br/>sites per tag
                                </th>
                                <th className="px-2 py-1 text-left font-medium text-gray-700">fk_user_id</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sitesprenTags.map((tag) => (
                                <tr
                                  key={tag.tag_id}
                                  className="hover:bg-blue-50 cursor-pointer border-t border-gray-100"
                                  onClick={() => handleTagSelection(tag.tag_id)}
                                >
                                  <td className="px-2 py-1 text-gray-600">{tag.tag_id}</td>
                                  <td className="px-2 py-1 font-medium text-gray-900">{tag.tag_name}</td>
                                  <td className="px-2 py-1 text-gray-600">{tag.tag_order}</td>
                                  <td className="px-2 py-1 text-center font-bold text-blue-600">
                                    {tagCounts.get(tag.tag_id) || 0}
                                  </td>
                                  <td className="px-2 py-1 text-gray-600">{tag.fk_user_id}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 py-2">No tags found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mb-4">
            <button
              onClick={handleRainChamberSubmit}
              disabled={!selectedTagId}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                selectedTagId 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </div>
          
          {/* Tagged Sites Horizontal Button Bar */}
          {activeRainChamber && taggedSites.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="font-bold text-sm text-gray-800">
                  gutter_box
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Tagged Sites ({taggedSites.length}):
                </div>
                
                {/* Select All / Deselect All buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllTaggedSites}
                    className="px-3 py-1 text-sm rounded transition-colors bg-green-200 hover:bg-green-300"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllTaggedSites}
                    className="px-3 py-1 text-sm rounded transition-colors bg-red-200 hover:bg-red-300"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {taggedSites.map((site) => {
                  const isSelected = selectedSiteIds.has(site.id);
                  return (
                    <button
                      key={site.id}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleSiteSelection(site.id)}
                    >
                      {site.sitespren_base || site.true_root_domain || 'Unknown Site'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              {/* Additional header row - empty for now */}
              <tr className="border-b border-gray-300">
                <td className="w-12 h-8 border-r border-gray-300"></td>
                <td className="w-64 h-8 border-r border-gray-300"></td>
                {paginatedSites.map((site, index) => (
                  <td
                    key={`empty-${site.id}`}
                    className={`h-8 ${
                      index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                    }`}
                  ></td>
                ))}
              </tr>
              
              {/* Main header row with column identifiers */}
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
                <tr 
                  key={field.key} 
                  className={`hover:bg-gray-50 ${
                    field.key === 'driggs_phone_1' ? 'border-b-4 border-b-black' : ''
                  } ${
                    field.key === 'driggs_address_species_id' ? 'border-b-4 border-b-black' : ''
                  } ${
                    field.key === 'driggs_cgig_id' ? 'border-b-4 border-b-black' : ''
                  } ${
                    field.key === 'driggs_industry' ? 'border-t-4 border-t-black' : ''
                  } ${
                    field.key === 'driggs_special_note_for_ai_tool' ? 'border-b-4 border-b-black' : ''
                  }`}
                >
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
                    const isDropdownOpen = platformDropdownOpen?.field === field.key && platformDropdownOpen?.siteId === site.id;

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
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                      );
                    }

                    if (field.type === 'platform_dropdown') {
                      return (
                        <td
                          key={`${field.key}-${site.id}`}
                          className={`px-3 py-2 text-sm text-gray-900 relative w-80 ${
                            index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handlePlatformDropdownClick(field.key, site.id)}
                              className={`px-2 py-1 text-left border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                !value || getPlatformName(value as number) === 'None' 
                                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-900' 
                                  : ''
                              }`}
                              style={{
                                width: '180px',
                                ...(value && getPlatformName(value as number) !== 'None'
                                  ? { 
                                      backgroundColor: '#2c7633',
                                      color: '#fff',
                                      fontWeight: 'bold'
                                    }
                                  : {})
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{getPlatformName(value as number)}</span>
                                <span className="ml-1">▼</span>
                              </div>
                            </button>
                            
                            {/* Square buttons 1-5 */}
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => {
                                    // TODO: Add functionality later
                                    console.log(`Button ${num} clicked for site ${site.id}`);
                                  }}
                                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded text-xs font-medium text-gray-700 flex items-center justify-center transition-colors"
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Dropdown Menu */}
                          {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                              <div className="p-3">
                                <div className="text-xs font-medium text-gray-700 mb-2">Select Call Platform:</div>
                                
                                {/* None Option */}
                                <button
                                  onClick={() => handlePlatformSelect(site.id, null)}
                                  className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded mb-1"
                                >
                                  <div className="font-medium text-gray-600">None</div>
                                  <div className="text-xs text-gray-500">No platform assigned</div>
                                </button>

                                {/* Platform Table */}
                                {callPlatforms.length > 0 ? (
                                  <div className="border border-gray-200 rounded">
                                    <div className="max-h-64 overflow-y-auto">
                                      <table className="w-full text-xs">
                                        <thead className="bg-gray-50 sticky top-0">
                                          <tr>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Name</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">URL</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">API</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {callPlatforms.map((platform) => (
                                            <tr
                                              key={platform.platform_id}
                                              className="hover:bg-blue-50 cursor-pointer border-t border-gray-100"
                                              onClick={() => handlePlatformSelect(site.id, platform.platform_id)}
                                            >
                                              <td className="px-2 py-2">
                                                <div className="font-medium text-gray-900">{platform.platform_name}</div>
                                                <div className="text-gray-500">ID: {platform.platform_id}</div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-24" title={platform.platform_url || ''}>
                                                  {platform.platform_url || '-'}
                                                </div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-24" title={platform.api_endpoint || ''}>
                                                  {platform.api_endpoint || '-'}
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    <div>No call platforms found</div>
                                    <div className="text-xs mt-1">Add platforms in /callplatjar</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    }

                    if (field.type === 'address_species_dropdown') {
                      const isAddressSpeciesDropdownOpen = addressSpeciesDropdownOpen?.field === field.key && addressSpeciesDropdownOpen?.siteId === site.id;
                      return (
                        <td
                          key={`${field.key}-${site.id}`}
                          className={`px-3 py-2 text-sm text-gray-900 relative w-96 ${
                            index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleAddressSpeciesDropdownClick(field.key, site.id)}
                              className={`px-2 py-1 text-left border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                !value || getAddressSpeciesName(value as number) === 'None' 
                                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-900' 
                                  : ''
                              }`}
                              style={{
                                width: '400px',
                                ...(value && getAddressSpeciesName(value as number) !== 'None'
                                  ? { 
                                      backgroundColor: '#dbeafe',
                                      color: '#1d1d1d',
                                      fontWeight: 'bold'
                                    }
                                  : {})
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">
                                  {value && getAddressSpeciesName(value as number) !== 'None' 
                                    ? getAddressSpeciesDetails(value as number)
                                    : getAddressSpeciesName(value as number)
                                  }
                                </span>
                                <span className="ml-1">▼</span>
                              </div>
                            </button>
                          </div>

                          {/* Address Species Dropdown Menu */}
                          {isAddressSpeciesDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                              <div className="p-3">
                                <div className="text-sm font-medium text-gray-700 mb-2">Select Address Species</div>
                                
                                {/* None Option */}
                                <button
                                  onClick={() => handleAddressSpeciesSelect(null, field.key, site.id)}
                                  className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded mb-1"
                                >
                                  <div className="font-medium text-gray-600">None</div>
                                  <div className="text-xs text-gray-500">No address species assigned</div>
                                </button>

                                {/* Address Species Table */}
                                {addressSpecies.length > 0 ? (
                                  <div className="border border-gray-200 rounded">
                                    <div className="max-h-64 overflow-y-auto">
                                      <table className="w-full text-xs">
                                        <thead className="bg-gray-50 sticky top-0">
                                          <tr>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Name</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Code</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Country</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Format</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {addressSpecies.map((species) => (
                                            <tr
                                              key={species.aspecies_id}
                                              onClick={() => handleAddressSpeciesSelect(species.aspecies_id, field.key, site.id)}
                                              className="hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-32" title={species.aspecies_name || ''}>
                                                  {species.aspecies_name || 'Unnamed'}
                                                </div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-16" title={species.aspecies_code || ''}>
                                                  {species.aspecies_code || '-'}
                                                </div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-16" title={species.country_code || ''}>
                                                  {species.country_code || '-'}
                                                </div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-24" title={species.address_format || ''}>
                                                  {species.address_format || '-'}
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    <div>No address species found</div>
                                    <div className="text-xs mt-1">Add species in /aspejar</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    }

                    if (field.type === 'cgig_dropdown') {
                      const isCgigDropdownOpen = cgigDropdownOpen?.field === field.key && cgigDropdownOpen?.siteId === site.id;
                      return (
                        <td
                          key={`${field.key}-${site.id}`}
                          className={`px-3 py-2 text-sm text-gray-900 relative w-96 ${
                            index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleCgigDropdownClick(field.key, site.id)}
                              className={`px-2 py-1 text-left border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                !value || getCitationGigName(value as number) === 'None' 
                                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-900' 
                                  : ''
                              }`}
                              style={{
                                width: '450px',
                                ...(value && getCitationGigName(value as number) !== 'None'
                                  ? { 
                                      backgroundColor: '#f8d1f5',
                                      color: '#1d1d1d',
                                      fontWeight: 'bold'
                                    }
                                  : {})
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">
                                  {value && getCitationGigName(value as number) !== 'None' 
                                    ? getCitationGigDetails(value as number)
                                    : getCitationGigName(value as number)
                                  }
                                </span>
                                <span className="ml-1">▼</span>
                              </div>
                            </button>
                            
                            {/* Square buttons 1-5 for citation gigs */}
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((num) => {
                                if (num === 1) {
                                  return (
                                    <Link
                                      key={num}
                                      href="/cgigjar"
                                      className="w-8 h-8 bg-gray-200 border border-gray-400 rounded text-xs font-medium text-gray-700 flex items-center justify-center transition-colors cursor-pointer hover:bg-yellow-300"
                                      style={{ hover: { backgroundColor: '#f1dcab' } }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1dcab'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                    >
                                      {num}
                                    </Link>
                                  );
                                }

                                if (num === 2) {
                                  // Get the citation gig ID from the site's driggs_cgig_id field
                                  const cgigId = site[field.key as keyof typeof site] as number;
                                  const assignedGig = cgigId ? citationGigs.find(g => g.cgig_id === cgigId) : null;
                                  const cgigUrl = assignedGig?.cgig_url || '#';
                                  
                                  console.log('Button 2 debug:', { cgigId, assignedGig, cgigUrl, siteName: site.sitespren_base });
                                  
                                  return (
                                    <Link
                                      key={num}
                                      href={cgigUrl !== '#' ? cgigUrl : '#'}
                                      target={cgigUrl !== '#' ? "_blank" : "_self"}
                                      rel={cgigUrl !== '#' ? "noopener noreferrer" : undefined}
                                      className="bg-gray-200 border border-gray-400 rounded text-xs font-medium text-gray-700 flex items-center justify-center transition-colors cursor-pointer hover:bg-yellow-300 px-1 py-1"
                                      style={{ 
                                        minWidth: 'fit-content',
                                        height: '32px',
                                        hover: { backgroundColor: '#f1dcab' } 
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1dcab'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                      onClick={(e) => {
                                        if (cgigUrl === '#') {
                                          e.preventDefault();
                                          alert('No citation gig assigned to this site yet.');
                                        }
                                      }}
                                    >
                                      2-open cgig_url
                                    </Link>
                                  );
                                }
                                
                                // Handle buttons 3, 4, 5 for inputs_v1, v2, v3
                                if (num >= 3 && num <= 5) {
                                  const cgigId = site[field.key as keyof typeof site] as number;
                                  const fieldMap: { [key: number]: 'inputs_v1' | 'inputs_v2' | 'inputs_v3' } = {
                                    3: 'inputs_v1',
                                    4: 'inputs_v2',
                                    5: 'inputs_v3'
                                  };
                                  const inputField = fieldMap[num];
                                  const buttonText = `iv${num - 2}`;
                                  
                                  return (
                                    <button
                                      key={num}
                                      onClick={() => {
                                        console.log(`Button ${buttonText} clicked for site ${site.sitespren_base}:`, { 
                                          cgigId, 
                                          inputField, 
                                          fieldKey: field.key,
                                          siteData: site[field.key as keyof typeof site]
                                        });
                                        
                                        if (cgigId) {
                                          handleInputsExpandClick(cgigId, inputField);
                                        } else {
                                          alert('No citation gig assigned to this site yet.');
                                        }
                                      }}
                                      className="bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded text-xs font-medium text-gray-700 flex items-center justify-center transition-colors px-1 py-1"
                                      style={{ 
                                        minWidth: 'fit-content',
                                        height: '32px'
                                      }}
                                    >
                                      {buttonText}
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      // TODO: Add functionality later
                                      console.log(`Citation gig button ${num} clicked for site ${site.id}`);
                                    }}
                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded text-xs font-medium text-gray-700 flex items-center justify-center transition-colors"
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Citation Gig Dropdown Menu */}
                          {isCgigDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                              <div className="p-3">
                                <div className="text-sm font-medium text-gray-700 mb-2">Select Citation Gig</div>
                                
                                {/* None Option */}
                                <button
                                  onClick={() => handleCgigSelect(null, field.key, site.id)}
                                  className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded mb-1"
                                >
                                  <div className="font-medium text-gray-600">None</div>
                                  <div className="text-xs text-gray-500">No citation gig assigned</div>
                                </button>

                                {/* Citation Gigs Table */}
                                {citationGigs.length > 0 ? (
                                  <div className="border border-gray-200 rounded">
                                    <div className="max-h-64 overflow-y-auto">
                                      <table className="w-full text-xs">
                                        <thead className="bg-gray-50 sticky top-0">
                                          <tr>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Title</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Seller</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Price</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-700">Citations</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {citationGigs.map((gig) => (
                                            <tr
                                              key={gig.cgig_id}
                                              onClick={() => handleCgigSelect(gig.cgig_id, field.key, site.id)}
                                              className="hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-32" title={gig.cgig_title}>
                                                  {gig.cgig_title}
                                                </div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-24" title={gig.seller_name}>
                                                  {gig.seller_name}
                                                </div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-16" title={`${gig.base_price} ${gig.currency}`}>
                                                  ${gig.base_price}
                                                </div>
                                              </td>
                                              <td className="px-2 py-2">
                                                <div className="truncate max-w-16" title={`${gig.citations_included || 0} citations`}>
                                                  {gig.citations_included || 0}
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    <div>No citation gigs found</div>
                                    <div className="text-xs mt-1">Add gigs in /cgigjar</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${field.key}-${site.id}`}
                        className={`px-3 py-2 text-sm text-gray-900 ${
                          field.key === 'driggs_phone_1' ? 'w-80' : 'cursor-pointer w-48'
                        } ${
                          index < paginatedSites.length - 1 ? 'border-r border-gray-300' : ''
                        }`}
                        onClick={() => field.key !== 'driggs_phone_1' && !isEditing && handleCellClick(field.key, site.id, value)}
                      >
                        {field.key === 'driggs_phone_1' ? (
                          <div className="flex items-center space-x-1">
                            <div 
                              className="cursor-pointer"
                              onClick={() => !isEditing && handleCellClick(field.key, site.id, value)}
                              style={{ width: '180px' }}
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
                                  className={`w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    editingValue ? 'bg-[#cfebf9]' : ''
                                  }`}
                                  autoFocus
                                />
                              ) : (
                                <div className={`truncate ${
                                  value ? 'bg-[#cfebf9] px-2 py-1 rounded' : ''
                                }`}>
                                  {value ? formatPhoneNumber(value.toString()) : '-'}
                                </div>
                              )}
                            </div>
                            
                            {/* Square buttons 1-5 for phone */}
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => {
                                    // TODO: Add functionality later
                                    console.log(`Phone button ${num} clicked for site ${site.id}`);
                                  }}
                                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded text-xs font-medium text-gray-700 flex items-center justify-center transition-colors"
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            {isEditing ? (
                              field.key === 'driggs_revenue_goal' ? (
                                <div className="relative">
                                  <span className="absolute left-2 top-1 text-gray-600 font-bold mr-1" style={{marginRight: '3px', fontFamily: 'Arial, sans-serif', fontSize: '18px'}}>$</span>
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
                                    className="w-full pl-6 pr-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                                    style={{fontFamily: 'Arial, sans-serif', fontSize: '18px'}}
                                    autoFocus
                                  />
                                </div>
                              ) : (
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
                              )
                            ) : (
                              <div className="truncate">
                                {field.key === 'driggs_revenue_goal' && value
                                  ? <span className="font-bold" style={{fontFamily: 'Arial, sans-serif', fontSize: '18px'}}><span style={{marginRight: '3px'}}>$</span>{value.toString()}</span>
                                  : field.type === 'timestamp' && value
                                  ? new Date(value).toLocaleString()
                                  : value?.toString() || '-'}
                              </div>
                            )}
                          </>
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

      {/* Inputs Expand Editor */}
      <InputsExpandEditor
        isOpen={!!inputsExpandPopup}
        cgigId={inputsExpandPopup?.cgigId || 0}
        initialTab={inputsExpandPopup?.initialTab || 'inputs_v1'}
        onSave={handleInputsExpandSave}
        onClose={handleInputsExpandClose}
      />
    </div>
  );
}