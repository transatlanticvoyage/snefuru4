'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InputsExpandEditor from '@/app/components/shared/InputsExpandEditor';
import DriggsPackMedallion from './driggspackmedallion/DriggsPackMedallion';
import VacuumMedallion from './vacuummedallion/VacuumMedallion';
import ZarpoMedallion from './zarpomedallion/ZarpoMedallion';
import Chatdori from '@/app/components/Chatdori';
import DriggsActionsFeedback from '@/app/components/DriggsActionsFeedback';
import { SitesglubFetcher } from './SitesglubFetchingFunctions';
import ScreenshotPreview from './ScreenshotPreview';
import Dromdori from '@/app/components/Dromdori';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

const DriggsPacksTable = dynamic(
  () => import('@/app/(protected)/dpackjar/components/DriggsPacksTable'),
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
  driggs_social_profiles_done: boolean | null;
  driggs_special_note_for_ai_tool: string | null;
  driggs_hours: string | null;
  driggs_owner_name: string | null;
  driggs_short_descr: string | null;
  driggs_long_descr: string | null;
  driggs_year_opened: number | null;
  driggs_employees_qty: number | null;
  driggs_keywords: string | null;
  driggs_category: string | null;
  driggs_address_species_note: string | null;
  driggs_payment_methods: string | null;
  driggs_social_media_links: string | null;
  driggs_street_1: string | null;
  driggs_street_2: string | null;
  driggs_state_code: string | null;
  driggs_zip: string | null;
  driggs_state_full: string | null;
  driggs_country: string | null;
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
  snailimage: string | null;
  snail_image_url: string | null;
  snail_image_status: string | null;
  snail_image_error: string | null;
  screenshot_url: string | null;
  screenshot_taken_at: string | null;
  screenshot_status: string | null;
  rel_cncglub_id: number | null;
  rel_city_id: number | null;
  rel_industry_id: number | null;
  phone_section_separator?: string; // Visual separator only
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

interface Sitesglub {
  sitesglub_id: number;
  sitesglub_base: string;
  ns_full: string | null;
  ip_address: string | null;
  mj_tf: number | null;
  mj_cf: number | null;
  mj_rd: number | null;
  mj_refips: number | null;
  mj_refsubnets: number | null;
  mj_bl: number | null;
  created_at: string;
  updated_at: string | null;
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

interface VacuumData {
  vacuum_id: string;
  fk_sitespren_id: string;
  fk_users_id: string;
  [key: string]: any; // For all the mirrored sitespren columns
}

interface ZarpscrapeData {
  scraper_id: string;
  fk_sitespren_id: string;
  fk_users_id: string;
  [key: string]: any; // For all the mirrored sitespren columns
}

interface ExcludeFromWpData {
  id: string; // UUID matching sitespren.id
  [key: string]: boolean | string; // All fields are boolean for checkbox functionality, except id
}

interface ExcludeFromFeData {
  id: string; // UUID matching sitespren.id
  [key: string]: boolean | string; // All fields are boolean for checkbox functionality, except id
}

interface RecentEntry {
  id: string;
  timeLastUsed: string;
  sitesEntered: string[];
  count: number;
  settings: string;
}

type SitesprenField = keyof SitesprenSite;

interface DriggsmanTableProps {
  onControlsRender?: (controls: {
    PaginationControls: () => JSX.Element;
    ColumnPaginationControls: () => JSX.Element;
  }) => void;
  showVerificationColumn?: boolean;
  showCompetitorSites?: boolean;
  onSitesCountChange?: (count: number) => void;
  onShowVerificationColumnChange?: (show: boolean) => void;
  onShowCompetitorSitesChange?: (show: boolean) => void;
  showTundraChamber?: boolean;
  onShowTundraChamberChange?: (show: boolean) => void;
  sitesPerView?: number;
  onSitesPerViewChange?: (count: number) => void;
  specColumnPage?: number;
  onSpecColumnPageChange?: (page: number) => void;
}

// Helper component for vacuum/zarpscrape cell display
const VacuumZarpscrapeCell = ({ 
  value, 
  fieldKey, 
  siteId, 
  onDelete,
  isBoolean = false 
}: { 
  value: any; 
  fieldKey: string; 
  siteId: string; 
  onDelete: (siteId: string, fieldKey: string) => void;
  isBoolean?: boolean;
}) => {
  if (value !== undefined && value !== null) {
    let displayValue = '';
    
    if (isBoolean) {
      displayValue = value ? '✓' : '✗';
    } else if (typeof value === 'string') {
      // Truncate long strings
      displayValue = value.length > 6 ? value.substring(0, 6) + '...' : value;
    } else {
      displayValue = String(value);
    }
    
    return (
      <div className="flex items-center justify-center space-x-1">
        <span 
          className="text-xs text-gray-700 truncate max-w-[30px]" 
          title={String(value)}
        >
          {displayValue}
        </span>
        <button
          onClick={() => onDelete(siteId, fieldKey)}
          className="text-red-500 hover:text-red-700 text-xs"
          title="Delete value"
        >
          ×
        </button>
      </div>
    );
  }
  return <span className="text-xs text-gray-400">-</span>;
};

// Tooltip component for exclusion column headers
const TooltipHeader = ({ 
  children, 
  tooltipText, 
  copyText 
}: { 
  children: React.ReactNode; 
  tooltipText: string; 
  copyText: string; 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 1000);
    } catch (err) {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 1000);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute z-50 p-2 bg-black text-white text-xs rounded shadow-lg -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div>{tooltipText}</div>
          <div className="mt-2 flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Copy
            </button>
            {copyFeedback && (
              <span className="text-green-400 text-xs">{copyFeedback}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for checkbox cells (excl wp/fe columns)
const CheckboxCell = ({ 
  checked, 
  fieldKey, 
  siteId, 
  onChange
}: { 
  checked: boolean; 
  fieldKey: string; 
  siteId: string; 
  onChange: (siteId: string, fieldKey: string, checked: boolean) => void; 
}) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(siteId, fieldKey, e.target.checked);
  };

  return (
    <td 
      className="text-center border-r border-gray-300"
      style={{ 
        width: '12px', 
        minWidth: '12px', 
        maxWidth: '12px', 
        padding: '1px' 
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleCheckboxChange}
        className="w-3 h-3"
        style={{ transform: 'scale(0.8)' }}
      />
    </td>
  );
};

export default function DriggsmanTable({ 
  onControlsRender,
  showVerificationColumn = false,
  showCompetitorSites = false,
  onSitesCountChange,
  onShowVerificationColumnChange,
  onShowCompetitorSitesChange,
  showTundraChamber = false,
  onShowTundraChamberChange,
  sitesPerView = 1,
  onSitesPerViewChange,
  specColumnPage = 1,
  onSpecColumnPageChange
}: DriggsmanTableProps) {
  const searchParams = useSearchParams();
  const [sites, setSites] = useState<SitesprenSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  
  // Column pagination for sites (connected to URL params via props)
  const currentColumnPage = specColumnPage;
  const setCurrentColumnPage = onSpecColumnPageChange || (() => {});
  const columnsPerPage = sitesPerView;
  const setColumnsPerPage = onSitesPerViewChange || (() => {});
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ field: string; siteId: string } | null>(null);
  const [driggspackPopup, setDriggspackPopup] = useState<{
    type: 'zz1' | 'zz2' | 'zz3';
    position: { top: number; left: number };
    siteId: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Modal states
  
  // Manual site entry states
  const [manualSiteInput, setManualSiteInput] = useState('');
  const [manualSites, setManualSites] = useState<string[]>([]);
  const [allSites, setAllSites] = useState<SitesprenSite[]>([]); // Store all fetched sites
  const [showPillbox, setShowPillbox] = useState(true); // Control pillbox visibility
  const [showRecents, setShowRecents] = useState(true); // Control recents visibility
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]); // Recent daylight chamber settings
  
  // Call platform dropdown states
  const [callPlatforms, setCallPlatforms] = useState<CallPlatform[]>([]);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState<{ field: string; siteId: string } | null>(null);
  const [platformsLoaded, setPlatformsLoaded] = useState(false);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  
  // Citation gig dropdown states
  const [citationGigs, setCitationGigs] = useState<CitationGig[]>([]);
  const [cgigDropdownOpen, setCgigDropdownOpen] = useState<{ field: string; siteId: string } | null>(null);
  const [citationGigsLoaded, setCitationGigsLoaded] = useState(false);
  const [citationGigsLoading, setCitationGigsLoading] = useState(false);
  // Copy feedback states
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [copyFeedbackMessage, setCopyFeedbackMessage] = useState('');

  // Handle copy feedback completion
  const handleCopyFeedbackComplete = () => {
    setShowCopyFeedback(false);
    setCopyFeedbackMessage('');
  };

  // Handle dp5 shark C cell click - copy sharkintax output to clipboard
  const handleDp5SharkCClick = async () => {
    try {
      // Get the current site from URL parameters
      const site = searchParams?.get('sitesentered');
      if (!site) {
        console.error('No site found in URL parameters');
        return;
      }

      // Get the user's internal ID
      if (!userInternalId) {
        console.error('User internal ID not available');
        return;
      }

      // Fetch the dpack_datum for dpack_id 5
      const { data: dpackData, error: dpackError } = await supabase
        .from('driggs_packs')
        .select('dpack_datum')
        .eq('dpack_id', 5)
        .single();

      if (dpackError || !dpackData?.dpack_datum) {
        console.error('Error fetching dpack data:', dpackError);
        return;
      }

      // Get sitespren data for the specified site
      const { data: siteData, error: siteError } = await supabase
        .from('sitespren')
        .select('*')
        .eq('fk_users_id', userInternalId)
        .eq('sitespren_base', site)
        .single();

      if (siteError || !siteData) {
        console.error('Error fetching site data:', siteError);
        return;
      }

      // Parse dpack_datum to get field list
      const fields = dpackData.dpack_datum.split('\n').map(field => field.trim()).filter(field => field);
      
      // Generate sharkintax format output
      let output = '';
      
      for (const field of fields) {
        // Check if this is a section header (doesn't start with 'driggs_' or 'sitespren_')
        const isSection = !field.startsWith('driggs_') && !field.startsWith('sitespren_') && field.includes('section');
        
        output += '===================================\n';
        output += field + '\n';
        output += '-----------------------------------\n';
        
        if (!isSection) {
          // Get the actual value from siteData
          const value = siteData[field as keyof typeof siteData] || '';
          output += value + '\n';
        } else {
          output += '\n'; // Empty line for sections
        }
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(output);
      
      // Show feedback
      setCopyFeedbackMessage('Sharkintax output copied to clipboard!');
      setShowCopyFeedback(true);
      
      // Hide feedback after 3 seconds
      setTimeout(() => {
        setShowCopyFeedback(false);
        setCopyFeedbackMessage('');
      }, 3000);

    } catch (err) {
      console.error('Error in handleDp5WalrusCClick:', err);
      setCopyFeedbackMessage('Error copying to clipboard');
      setShowCopyFeedback(true);
      setTimeout(() => {
        setShowCopyFeedback(false);
        setCopyFeedbackMessage('');
      }, 3000);
    }
  };

  // Handle dp5 walrus C cell click - copy walrustax output to clipboard
  const handleDp5WalrusCClick = async () => {
    try {
      // Get the current site from URL parameters
      const site = searchParams?.get('sitesentered');
      if (!site) {
        console.error('No site found in URL parameters');
        return;
      }

      // Get the user's internal ID
      if (!userInternalId) {
        console.error('User internal ID not available');
        return;
      }

      // Fetch the dpack_datum for dpack_id 5
      const { data: dpackData, error: dpackError } = await supabase
        .from('driggs_packs')
        .select('dpack_datum')
        .eq('dpack_id', 5)
        .single();

      if (dpackError || !dpackData?.dpack_datum) {
        console.error('Error fetching dpack data:', dpackError);
        return;
      }

      // Get sitespren data for the specified site
      const { data: siteData, error: siteError } = await supabase
        .from('sitespren')
        .select('*')
        .eq('fk_users_id', userInternalId)
        .eq('sitespren_base', site)
        .single();

      if (siteError || !siteData) {
        console.error('Error fetching site data:', siteError);
        return;
      }

      // Parse dpack_datum to get field list
      const fields = dpackData.dpack_datum.split('\n').map(field => field.trim()).filter(field => field);
      
      // Generate walrustax format output (tab-separated)
      let output = '';
      
      for (const field of fields) {
        // Check if this is a section header (doesn't start with 'driggs_' or 'sitespren_')
        const isSection = !field.startsWith('driggs_') && !field.startsWith('sitespren_') && field.includes('section');
        
        if (!isSection) {
          // Get the actual value from siteData
          const value = siteData[field as keyof typeof siteData] || '';
          output += field + '\t' + value + '\n';
        }
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(output);
      
      // Show feedback
      setCopyFeedbackMessage('Walrustax output copied to clipboard!');
      setShowCopyFeedback(true);
      
      // Hide feedback after 3 seconds
      setTimeout(() => {
        setShowCopyFeedback(false);
        setCopyFeedbackMessage('');
      }, 3000);

    } catch (err) {
      console.error('Error in handleDp5WalrusCClick:', err);
      setCopyFeedbackMessage('Error copying to clipboard');
      setShowCopyFeedback(true);
      setTimeout(() => {
        setShowCopyFeedback(false);
        setCopyFeedbackMessage('');
      }, 3000);
    }
  };
  
  // Address species dropdown states
  const [addressSpecies, setAddressSpecies] = useState<AddressSpecies[]>([]);
  const [addressSpeciesDropdownOpen, setAddressSpeciesDropdownOpen] = useState<{ field: string; siteId: string } | null>(null);
  const [addressSpeciesLoaded, setAddressSpeciesLoaded] = useState(false);
  const [addressSpeciesLoading, setAddressSpeciesLoading] = useState(false);
  
  // Selected sites for table filtering
  // TODO: Implement URL state persistence using one of these approaches:
  // 1. Simple: ?selected=site1,site2,site3 (readable but can get long)
  // 2. Encoded: ?penja=9284jsiweu294824 (short but requires mapping)
  // 3. Base64: ?state=eyJ0YWciOiJ0YWduYW1lIn0= (middle ground)
  // 4. Hybrid: Use simple for <5 sites, encoded for larger selections
  
  // Inputs expand editor states
  const [inputsExpandPopup, setInputsExpandPopup] = useState<{ 
    cgigId: number; 
    initialTab: 'inputs_v1' | 'inputs_v2' | 'inputs_v3';
  } | null>(null);
  
  
  // Rain chamber states
  const [activeRainChamber, setActiveRainChamber] = useState(false);
  const [sitesprenTags, setSitesprenTags] = useState<SitesprenTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [taggedSites, setTaggedSites] = useState<SitesprenSite[]>([]);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [tagCounts, setTagCounts] = useState<Map<number, number>>(new Map());
  
  // Search popup states
  const [searchPopupOpen, setSearchPopupOpen] = useState(false);
  const [searchSites, setSearchSites] = useState<SitesprenSite[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set());
  const [isExternalFilter, setIsExternalFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search popup pagination states
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchItemsPerPage, setSearchItemsPerPage] = useState(10);
  
  // Filtering mechanism states
  const [useFogFilter, setUseFogFilter] = useState(true); // Default to true (unfiltered view)
  const [useDaylightFilter, setUseDaylightFilter] = useState(false);
  const [useRainFilter, setUseRainFilter] = useState(false);
  
  // Horizontal tabs state
  const [activeTab, setActiveTab] = useState(1);
  const [showChamberBoxes, setShowChamberBoxes] = useState(true); // Visibility toggle for chamber boxes
  const [storedManualSites, setStoredManualSites] = useState<string[]>([]); // Store manual sites permanently
  
  // Vacuum and Zarpscrapes states
  const [vacuumData, setVacuumData] = useState<Map<string, VacuumData>>(new Map());
  const [zarpscrapesData, setZarpscrapesData] = useState<Map<string, ZarpscrapeData>>(new Map());
  
  // Exclude from WP and Frontend states
  const [excludeFromWpData, setExcludeFromWpData] = useState<Map<string, ExcludeFromWpData>>(new Map());
  const [excludeFromFeData, setExcludeFromFeData] = useState<Map<string, ExcludeFromFeData>>(new Map());
  const [sitesglubData, setSitesglubData] = useState<Map<string, Sitesglub>>(new Map());
  const [sitesglubLoading, setSitesglubLoading] = useState<Map<string, Set<string>>>(new Map()); // Map<domain, Set<fieldNames>>
  
  // City population data state
  const [cityPopulationData, setCityPopulationData] = useState<Map<string, number | null>>(new Map());
  
  // Domain registrar popup state
  const [registrarPopupOpen, setRegistrarPopupOpen] = useState<string | null>(null);
  const [allHostAccounts, setAllHostAccounts] = useState<any[]>([]);
  
  const supabase = createClientComponentClient();
  const router = useRouter();

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
    placeholder?: string;
  }> = [
    { key: 'sitespren_base', type: 'readonly', label: 'sitespren_base', group: 'domain' },
    { key: 'driggs_brand_name', type: 'text', label: 'driggs_brand_name', group: 'business' },
    { key: 'driggs_revenue_goal', type: 'number', label: 'driggs_revenue_goal', group: 'business' },
    { key: 'phone_section_separator', type: 'section_header', label: 'phone section', group: 'separator' },
    { key: 'driggs_phone1_platform_id', type: 'platform_dropdown', label: 'driggs_phone1_platform_id', group: 'contact' },
    { key: 'driggs_phone_1', type: 'text', label: 'driggs_phone_1', group: 'contact' },
    { key: 'address_section_separator', type: 'section_header', label: 'address section', group: 'separator' },
    { key: 'driggs_address_species_id', type: 'address_species_dropdown', label: 'driggs_address_species_id', group: 'contact' },
    { key: 'driggs_address_species_note', type: 'text', label: 'driggs_address_species_note', group: 'contact', placeholder: '' },
    { key: 'driggs_address_full', type: 'text', label: 'driggs_address_full', group: 'contact' },
    { key: 'driggs_street_1', type: 'text', label: 'driggs_street_1', group: 'contact', placeholder: '' },
    { key: 'driggs_street_2', type: 'text', label: 'driggs_street_2', group: 'contact', placeholder: '' },
    { key: 'driggs_city', type: 'text', label: 'driggs_city', group: 'business' },
    { key: 'driggs_state_code', type: 'text', label: 'driggs_state_code', group: 'contact', placeholder: '' },
    { key: 'driggs_zip', type: 'text', label: 'driggs_zip', group: 'contact', placeholder: '' },
    { key: 'driggs_state_full', type: 'text', label: 'driggs_state_full', group: 'contact', placeholder: '' },
    { key: 'driggs_country', type: 'text', label: 'driggs_country', group: 'contact', placeholder: 'United States' },
    { key: 'backlinks_section_separator', type: 'section_header', label: 'backlinks section', group: 'separator' },
    { key: 'driggs_cgig_id', type: 'cgig_dropdown', label: 'driggs_cgig_id', group: 'contact' },
    { key: 'driggs_citations_done', type: 'boolean', label: 'driggs_citations_done', group: 'contact' },
    { key: 'driggs_social_profiles_done', type: 'boolean', label: 'driggs_social_profiles_done', group: 'contact' },
    { key: 'basics_section_separator', type: 'section_header', label: 'basics section', group: 'separator' },
    { key: 'driggs_industry', type: 'text', label: 'driggs_industry', group: 'business' },
    { key: 'driggs_keywords', type: 'text', label: 'driggs_keywords', group: 'business', placeholder: 'tree service, tree removal ann arbor, stump grinding' },
    { key: 'driggs_category', type: 'text', label: 'driggs_category', group: 'business', placeholder: 'tree service' },
    { key: 'driggs_site_type_purpose', type: 'text', label: 'driggs_site_type_purpose', group: 'business' },
    { key: 'driggs_email_1', type: 'text', label: 'driggs_email_1', group: 'contact' },
    { key: 'driggs_hours', type: 'text', label: 'driggs_hours', group: 'business', placeholder: 'Open 24 hours' },
    { key: 'driggs_owner_name', type: 'text', label: 'driggs_owner_name', group: 'business', placeholder: 'Brian Ansley' },
    { key: 'driggs_short_descr', type: 'text', label: 'driggs_short_descr', group: 'business', placeholder: '' },
    { key: 'driggs_long_descr', type: 'text', label: 'driggs_long_descr', group: 'business', placeholder: '' },
    { key: 'driggs_year_opened', type: 'number', label: 'driggs_year_opened', group: 'business', placeholder: '2024' },
    { key: 'driggs_employees_qty', type: 'number', label: 'driggs_employees_qty', group: 'business', placeholder: '6' },
    { key: 'driggs_payment_methods', type: 'text', label: 'driggs_payment_methods', group: 'business', placeholder: 'credit cards, cash, checks' },
    { key: 'driggs_special_note_for_ai_tool', type: 'text', label: 'driggs_special_note_for_ai_tool', group: 'meta' },
    { key: 'driggs_social_media_links', type: 'text', label: 'driggs_social_media_links', group: 'contact', placeholder: '' },
    { key: 'misc_section_separator', type: 'section_header', label: 'misc section', group: 'separator' },
    { key: 'id', type: 'text', label: 'id', group: 'system' },
    { key: 'created_at', type: 'timestamp', label: 'created_at', group: 'system' },
    { key: 'updated_at', type: 'timestamp', label: 'updated_at', group: 'system' },
    { key: 'fk_users_id', type: 'text', label: 'fk_users_id', group: 'system' },
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
    { key: 'is_other2', type: 'boolean', label: 'is_other2', group: 'meta' },
    { key: 'is_flylocal', type: 'boolean', label: 'is_flylocal', group: 'meta' }
  ];
  
  // Initialize manual sites and active filter chamber from URL parameters
  useEffect(() => {
    const sitesEnteredParam = searchParams?.get('sitesentered');
    const activeFilterChamber = searchParams?.get('activefilterchamber');
    const showMainChamberBoxes = searchParams?.get('showmainchamberboxes');
    
    // Handle sites parameter (existing code)
    if (sitesEnteredParam) {
      const sitesFromUrl = sitesEnteredParam.split(',').map(s => s.trim()).filter(s => s);
      setManualSites(sitesFromUrl);
      setManualSiteInput(sitesFromUrl.join(', '));
    }
    
    // Handle showmainchamberboxes parameter
    if (showMainChamberBoxes === 'yes') {
      setShowChamberBoxes(true);
    } else if (showMainChamberBoxes === 'no') {
      setShowChamberBoxes(false);
    }
    
    // Handle new activefilterchamber parameter
    if (activeFilterChamber === 'daylight') {
      setUseFogFilter(false);
      setUseDaylightFilter(true);
      setUseRainFilter(false);
      setActiveRainChamber(false);
    } else if (activeFilterChamber === 'rain') {
      setUseFogFilter(false);
      setUseRainFilter(true);
      setUseDaylightFilter(false);
      setActiveRainChamber(true);
    } else if (activeFilterChamber === 'fog') {
      setUseFogFilter(true);
      setUseDaylightFilter(false);
      setUseRainFilter(false);
      setActiveRainChamber(false);
    } else {
      // If absent or invalid, default to daylight chamber (don't update URL here to avoid loop)
      setUseFogFilter(false);
      setUseDaylightFilter(true);
      setUseRainFilter(false);
      setActiveRainChamber(false);
    }
  }, [searchParams]);

  // Set default URL parameter on initial load if not present
  useEffect(() => {
    // Only check searchParams on mount, don't re-run when it changes
    if (typeof window !== 'undefined' && !window.location.search.includes('activefilterchamber')) {
      const url = new URL(window.location.href);
      url.searchParams.set('activefilterchamber', 'daylight');
      window.history.replaceState({}, '', url.toString());
    }
  }, []); // Empty dependency array - only run once on mount

  // Fetch only essential data on initial load - dropdowns loaded lazily on demand
  useEffect(() => {
    fetchSites();
    fetchSitesprenTags(); // Tags are needed for filtering
    fetchVacuumData();
    fetchZarpscrapesData();
    fetchExcludeFromWpData();
    fetchExcludeFromFeData();
    fetchSitesglubData();
    // Removed: fetchCallPlatforms(), fetchCitationGigs(), fetchAddressSpecies()
    // These will be loaded lazily when dropdown is first opened
  }, []);

  // Fetch city population data when sites change
  useEffect(() => {
    if (sites.length > 0) {
      fetchCityPopulationData();
    }
  }, [sites]);

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

  // Pass controls to parent for external rendering
  useEffect(() => {
    if (onControlsRender) {
      onControlsRender({
        PaginationControls,
        ColumnPaginationControls
      });
    }
  }, [onControlsRender, searchTerm, currentPage, itemsPerPage, columnsPerPage, currentColumnPage]);

  // Local storage functions for recents
  const loadRecentEntries = (): RecentEntry[] => {
    try {
      const stored = localStorage.getItem('driggsman_recent_entries');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading recent entries from localStorage:', error);
      return [];
    }
  };

  const saveRecentEntries = (entries: RecentEntry[]) => {
    try {
      localStorage.setItem('driggsman_recent_entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving recent entries to localStorage:', error);
    }
  };

  const addRecentEntry = (sitesEntered: string[]) => {
    if (sitesEntered.length === 0) return;

    const newEntry: RecentEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timeLastUsed: new Date().toISOString(),
      sitesEntered: [...sitesEntered],
      count: sitesEntered.length,
      settings: `Daylight Chamber - ${sitesEntered.length} sites`
    };

    const updatedEntries = [newEntry, ...recentEntries.filter(entry => 
      JSON.stringify(entry.sitesEntered.sort()) !== JSON.stringify(sitesEntered.sort())
    )].slice(0, 20); // Keep only 20 most recent

    setRecentEntries(updatedEntries);
    saveRecentEntries(updatedEntries);
  };

  // Load recent entries on component mount
  useEffect(() => {
    const entries = loadRecentEntries();
    setRecentEntries(entries);
  }, []);

  // Add to recents when manual sites change
  useEffect(() => {
    if (manualSites.length > 0) {
      addRecentEntry(manualSites);
    }
  }, [manualSites]);
  
  // Update parent with sites count
  useEffect(() => {
    if (onSitesCountChange) {
      onSitesCountChange(sites.length);
    }
  }, [sites.length, onSitesCountChange]);

  // Fetch search sites when popup opens
  useEffect(() => {
    console.log('🔍 Search popup useEffect triggered. searchPopupOpen:', searchPopupOpen);
    if (searchPopupOpen) {
      console.log('✅ Search popup is open, calling fetchSearchSites...');
      fetchSearchSites();
    } else {
      console.log('❌ Search popup is closed, not calling fetchSearchSites');
    }
  }, [searchPopupOpen]);
  
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

  // Fetch vacuum data for all sites
  const fetchVacuumData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      
      // Get the internal user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (!userData) return;
      
      const { data: vacuums, error } = await supabase
        .from('sitespren_vacuums')
        .select('*')
        .eq('fk_users_id', userData.id);
      
      if (error) {
        console.error('Error fetching vacuum data:', error);
        return;
      }
      
      // Store vacuum data in a Map for quick lookup by site ID
      const vacuumMap = new Map<string, VacuumData>();
      vacuums?.forEach(vacuum => {
        vacuumMap.set(vacuum.fk_sitespren_id, vacuum);
      });
      setVacuumData(vacuumMap);
    } catch (err) {
      console.error('Error in fetchVacuumData:', err);
    }
  };

  // Fetch zarpscrapes data for all sites
  const fetchZarpscrapesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      
      // Get the internal user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (!userData) return;
      
      const { data: zarpscrapes, error } = await supabase
        .from('sitespren_zarpscrapes')
        .select('*')
        .eq('fk_users_id', userData.id);
      
      if (error) {
        console.error('Error fetching zarpscrapes data:', error);
        return;
      }
      
      // Store zarpscrapes data in a Map for quick lookup by site ID
      const zarpscrapesMap = new Map<string, ZarpscrapeData>();
      zarpscrapes?.forEach(zarpscrape => {
        zarpscrapesMap.set(zarpscrape.fk_sitespren_id, zarpscrape);
      });
      setZarpscrapesData(zarpscrapesMap);
    } catch (err) {
      console.error('Error in fetchZarpscrapesData:', err);
    }
  };

  const fetchExcludeFromWpData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      
      // Get the internal user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (!userData) return;
      
      // Get all exclusion data for this user's sites
      const { data: userSites } = await supabase
        .from('sitespren')
        .select('id')
        .eq('fk_users_id', userData.id);
        
      if (!userSites || userSites.length === 0) return;
      
      const siteIds = userSites.map(site => site.id);
      
      const { data: exclusions, error } = await supabase
        .from('sitespren_exclude_from_wp')
        .select('*')
        .in('id', siteIds);
      
      if (error) {
        console.error('Error fetching exclude from wp data:', error);
        return;
      }
      
      // Store exclusion data in a Map for quick lookup by site ID
      const exclusionsMap = new Map<string, ExcludeFromWpData>();
      exclusions?.forEach(exclusion => {
        exclusionsMap.set(exclusion.id, exclusion);
      });
      setExcludeFromWpData(exclusionsMap);
    } catch (err) {
      console.error('Error in fetchExcludeFromWpData:', err);
    }
  };

  const fetchExcludeFromFeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      
      // Get the internal user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (!userData) return;
      
      // Get all exclusion data for this user's sites
      const { data: userSites } = await supabase
        .from('sitespren')
        .select('id')
        .eq('fk_users_id', userData.id);
        
      if (!userSites || userSites.length === 0) return;
      
      const siteIds = userSites.map(site => site.id);
      
      const { data: exclusions, error } = await supabase
        .from('sitespren_exclude_from_frontend')
        .select('*')
        .in('id', siteIds);
      
      if (error) {
        console.error('Error fetching exclude from frontend data:', error);
        return;
      }
      
      // Store exclusion data in a Map for quick lookup by site ID
      const exclusionsMap = new Map<string, ExcludeFromFeData>();
      exclusions?.forEach(exclusion => {
        exclusionsMap.set(exclusion.id, exclusion);
      });
      setExcludeFromFeData(exclusionsMap);
    } catch (err) {
      console.error('Error in fetchExcludeFromFeData:', err);
    }
  };

  // Function to fetch sitesglub data for all sites
  const fetchSitesglubData = async () => {
    try {
      // Get all sitesglub data - this is a global table
      const { data: sitesglubRecords, error } = await supabase
        .from('sitesglub')
        .select('*');
      
      if (error) {
        console.error('Error fetching sitesglub data:', error);
        return;
      }
      
      // Store sitesglub data in a Map for quick lookup by domain
      const sitesglubMap = new Map<string, Sitesglub>();
      sitesglubRecords?.forEach(record => {
        sitesglubMap.set(record.sitesglub_base, record);
      });
      setSitesglubData(sitesglubMap);
    } catch (err) {
      console.error('Error in fetchSitesglubData:', err);
    }
  };

  // Function to fetch city population data
  const fetchCityPopulationData = async () => {
    try {
      // Get all unique city IDs from current sites
      const cityIds = [...new Set(sites.map(site => site.rel_city_id).filter(id => id !== null))];
      
      if (cityIds.length === 0) return;

      const { data: citiesData, error } = await supabase
        .from('cities')
        .select('city_id, city_population')
        .in('city_id', cityIds);
      
      if (error) {
        console.error('Error fetching city population data:', error);
        return;
      }
      
      // Store city population data in a Map for quick lookup by city ID
      const populationMap = new Map<string, number | null>();
      citiesData?.forEach(city => {
        populationMap.set(city.city_id.toString(), city.city_population);
      });
      setCityPopulationData(populationMap);
    } catch (err) {
      console.error('Error in fetchCityPopulationData:', err);
    }
  };

  // Function to fetch a specific sitesglub metric for a domain
  const fetchSitesglubMetric = async (domain: string, metric: string) => {
    if (!domain) return;

    // Set loading state for this specific domain and metric
    setSitesglubLoading(prev => {
      const newLoading = new Map(prev);
      const domainLoadings = newLoading.get(domain) || new Set();
      domainLoadings.add(metric);
      newLoading.set(domain, domainLoadings);
      return newLoading;
    });

    try {
      // Use the SitesglubFetcher to get the metric data
      const result = await SitesglubFetcher.fetchMetric(domain, metric);

      if (result.success) {
        // Update the sitesglubData with the new value
        setSitesglubData(prev => {
          const newData = new Map(prev);
          const existingRecord = newData.get(domain);
          const updatedRecord = {
            ...existingRecord,
            sitesglub_base: domain,
            [metric]: result.data,
            updated_at: new Date().toISOString(),
            // Fill in default values for fields that might not exist
            sitesglub_id: existingRecord?.sitesglub_id || 0,
            mj_tf: existingRecord?.mj_tf || null,
            mj_cf: existingRecord?.mj_cf || null,
            mj_rd: existingRecord?.mj_rd || null,
            mj_refips: existingRecord?.mj_refips || null,
            mj_refsubnets: existingRecord?.mj_refsubnets || null,
            mj_bl: existingRecord?.mj_bl || null,
            ns_full: metric === 'ns_full' ? result.data : existingRecord?.ns_full || null,
            ip_address: metric === 'ip_address' ? result.data : existingRecord?.ip_address || null,
            created_at: existingRecord?.created_at || new Date().toISOString()
          } as Sitesglub;
          
          newData.set(domain, updatedRecord);
          return newData;
        });

        console.log(`Successfully fetched ${metric} for ${domain}:`, result.data);
      } else {
        console.error(`Failed to fetch ${metric} for ${domain}:`, result.error);
      }
    } catch (error) {
      console.error(`Error fetching ${metric} for ${domain}:`, error);
    } finally {
      // Clear loading state for this domain and metric
      setSitesglubLoading(prev => {
        const newLoading = new Map(prev);
        const domainLoadings = newLoading.get(domain) || new Set();
        domainLoadings.delete(metric);
        
        if (domainLoadings.size === 0) {
          newLoading.delete(domain);
        } else {
          newLoading.set(domain, domainLoadings);
        }
        
        return newLoading;
      });
    }
  };

  // Fetch host accounts for the registrar popup
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

  // Update domain registrar
  const updateDomainRegistrar = async (siteId: string, newHostAccountId: string | null) => {
    if (!userInternalId) return;

    try {
      const response = await fetch('/api/update_domain_registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitespren_id: siteId,
          fk_domreg_hostaccount: newHostAccountId,
          user_internal_id: userInternalId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Find the new registrar info from allHostAccounts
        const newRegistrarInfo = newHostAccountId 
          ? allHostAccounts.find(acc => acc.host_account_id === newHostAccountId)
          : null;

        // Update the sites data with the new fk_domreg_hostaccount
        setSites(prevSites => 
          prevSites.map(site => 
            site.id === siteId 
              ? { 
                  ...site, 
                  fk_domreg_hostaccount: newHostAccountId,
                }
              : site
          )
        );

        setRegistrarPopupOpen(null);
      } else {
        console.error('Failed to update domain registrar:', result.error);
      }
    } catch (error) {
      console.error('Error updating domain registrar:', error);
    }
  };

  // Function to delete (set to null) a vacuum field
  const deleteVacuumField = async (siteId: string, fieldKey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (!userData) return;
      
      // Check if vacuum record exists
      const existingVacuum = vacuumData.get(siteId);
      
      if (existingVacuum) {
        // Update existing record - set field to null
        const { error } = await supabase
          .from('sitespren_vacuums')
          .update({ [fieldKey]: null })
          .eq('vacuum_id', existingVacuum.vacuum_id);
        
        if (error) {
          console.error('Error deleting vacuum field:', error);
          return;
        }
        
        // Update local state
        const updatedVacuum = { ...existingVacuum, [fieldKey]: null };
        setVacuumData(prev => new Map(prev).set(siteId, updatedVacuum));
      }
    } catch (err) {
      console.error('Error in deleteVacuumField:', err);
    }
  };

  // Function to delete (set to null) a zarpscrape field
  const deleteZarpscrapeField = async (siteId: string, fieldKey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (!userData) return;
      
      // Check if zarpscrape record exists
      const existingZarpscrape = zarpscrapesData.get(siteId);
      
      if (existingZarpscrape) {
        // Update existing record - set field to null
        const { error } = await supabase
          .from('sitespren_zarpscrapes')
          .update({ [fieldKey]: null })
          .eq('scraper_id', existingZarpscrape.scraper_id);
        
        if (error) {
          console.error('Error deleting zarpscrape field:', error);
          return;
        }
        
        // Update local state
        const updatedZarpscrape = { ...existingZarpscrape, [fieldKey]: null };
        setZarpscrapesData(prev => new Map(prev).set(siteId, updatedZarpscrape));
      }
    } catch (err) {
      console.error('Error in deleteZarpscrapeField:', err);
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

  // Handle driggspack popup
  const handleDriggspackClick = (event: React.MouseEvent, type: 'zz1' | 'zz2' | 'zz3', siteId: string) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDriggspackPopup({
      type,
      position: {
        top: rect.top,
        left: rect.right
      },
      siteId
    });
  };

  const closeDriggspackPopup = () => {
    setDriggspackPopup(null);
  };

  // Handle vacuum medallion interactions (simplified handlers)
  const handleVacuumMedallionClick = (medallionType: string, siteId: string) => {
    console.log('Vacuum medallion clicked:', medallionType, siteId);
  };

  const handleVacuumFiller1aClick = (actionType: string, siteId: string) => {
    console.log('Vacuum filler1a clicked:', actionType, siteId);
  };

  const handleVacuumFiller1bClick = (actionType: string, siteId: string) => {
    console.log('Vacuum filler1b clicked:', actionType, siteId);
  };

  // Handle zarpo medallion interactions (simplified handlers)  
  const handleZarpoMedallionClick = (medallionType: string, siteId: string) => {
    console.log('Zarpo medallion clicked:', medallionType, siteId);
  };

  const handleZarpoFiller1aClick = (actionType: string, siteId: string) => {
    console.log('Zarpo filler1a clicked:', actionType, siteId);
  };

  const handleZarpoFiller1bClick = (actionType: string, siteId: string) => {
    console.log('Zarpo filler1b clicked:', actionType, siteId);
  };

  // Handle exclude from WP checkbox changes
  const handleExcludeFromWpChange = (siteId: string, fieldKey: string, checked: boolean) => {
    console.log('Exclude from WP checkbox changed:', siteId, fieldKey, checked);
    // TODO: Update database when schema is implemented
  };

  // Handle exclude from FE checkbox changes  
  const handleExcludeFromFeChange = (siteId: string, fieldKey: string, checked: boolean) => {
    console.log('Exclude from FE checkbox changed:', siteId, fieldKey, checked);
    // TODO: Update database when schema is implemented
  };

  // Handle getting sitespren DB fields and copying to clipboard
  const handleGetSitesprenFields = async () => {
    try {
      // Fetch a single record from sitespren to get all column names
      const { data, error } = await supabase
        .from('sitespren')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Error fetching sitespren fields:', error);
        setCopyFeedbackMessage('Failed to fetch sitespren fields: ' + error.message);
        setShowCopyFeedback(true);
        return;
      }

      if (data && data.length > 0) {
        // Get all column names from the first record
        const columnNames = Object.keys(data[0]);
        const columnList = columnNames.join('\n');

        // Copy to clipboard
        await navigator.clipboard.writeText(columnList);
        
        // Show success message
        setCopyFeedbackMessage(`${columnNames.length} sitespren database field names successfully copied`);
        setShowCopyFeedback(true);
        console.log('Sitespren fields copied to clipboard:', columnNames);
      } else {
        alert('No data found in sitespren table to extract field names');
      }
    } catch (err) {
      console.error('Error copying sitespren fields:', err);
      setCopyFeedbackMessage('Failed to copy sitespren fields to clipboard: ' + (err as Error).message);
      setShowCopyFeedback(true);
    }
  };

  // Handle getting driggsman display field names in order
  const handleGetDriggsmanDisplayFields = async () => {
    try {
      // Get all field labels from fieldDefinitions in order
      const fieldLabels = fieldDefinitions.map(field => field.label);
      const fieldList = fieldLabels.join('\n');

      // Copy to clipboard
      await navigator.clipboard.writeText(fieldList);
      
      // Show success message
      setCopyFeedbackMessage(`${fieldLabels.length} driggsman display field names successfully copied`);
      setShowCopyFeedback(true);
      console.log('Driggsman display fields copied to clipboard:', fieldLabels);
    } catch (err) {
      console.error('Error copying driggsman display fields:', err);
      setCopyFeedbackMessage('Failed to copy driggsman display fields to clipboard: ' + (err as Error).message);
      setShowCopyFeedback(true);
    }
  };

  // Handle click outside popup to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (driggspackPopup) {
        const target = event.target as HTMLElement;
        const popupElement = document.querySelector('[data-driggspack-popup]');
        
        // Close if clicking outside the popup
        if (popupElement && !popupElement.contains(target)) {
          closeDriggspackPopup();
        }
      }
    };

    if (driggspackPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [driggspackPopup]);

  // Handle inline editing
  const handleCellClick = (field: string, siteId: string, value: any) => {
    const fieldDef = fieldDefinitions.find(f => f.key === field);
    if (fieldDef?.type === 'boolean') return; // Don't edit booleans via click
    if (fieldDef?.type === 'readonly') return; // Don't edit readonly fields
    if (fieldDef?.type === 'section_header') return; // Don't edit section headers
    
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
      } else if (fieldDef?.type === 'number') {
        // Convert to number, or null if empty/invalid
        processedValue = editingValue === '' ? null : (isNaN(Number(editingValue)) ? null : Number(editingValue));
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


  // Manual site entry functions
  const parseManualSites = (input: string): string[] => {
    return input
      .split(/[\s,\n]+/) // Split by spaces, commas, or newlines
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // Helper function to update URL parameters with proper ordering
  const updateURL = (chamber: 'fog' | 'daylight' | 'rain' | null = null, sites: string[] = []) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      // Clear existing parameters
      url.searchParams.delete('activefilterchamber');
      url.searchParams.delete('sitesentered');
      
      // Add parameters in the desired order: activefilterchamber first, then sitesentered
      if (chamber) {
        url.searchParams.set('activefilterchamber', chamber);
      }
      
      if (sites.length > 0) {
        url.searchParams.set('sitesentered', sites.join(','));
      }
      
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

  // Helper function to update only activefilterchamber while preserving sitesentered order
  const updateActiveChamberURL = (chamber: 'fog' | 'daylight' | 'rain' | null) => {
    // Preserve existing sitesentered parameter from URL, not just from manualSites state
    const existingSitesParam = searchParams?.get('sitesentered');
    const existingSites = existingSitesParam ? existingSitesParam.split(',').filter(site => site.trim()) : [];
    
    // Use existing sites from URL if they exist, otherwise use current manualSites
    const sitesToPreserve = existingSites.length > 0 ? existingSites : (manualSites.length > 0 ? manualSites : []);
    
    updateURL(chamber, sitesToPreserve);
  };

  // Checkbox filter handlers
  const handleFogFilterChange = () => {
    // Always activate fog filter when clicked
    setUseFogFilter(true);
    setUseDaylightFilter(false);
    setUseRainFilter(false);
    setActiveRainChamber(false);
    setManualSites([]);
    updateActiveChamberURL('fog');
  };

  const handleDaylightFilterChange = () => {
    // Always activate daylight filter when clicked
    setUseFogFilter(false);
    setUseDaylightFilter(true);
    setUseRainFilter(false);
    setActiveRainChamber(false);
    // Restore stored manual sites
    if (storedManualSites.length > 0) {
      setManualSites(storedManualSites);
    }
    // Update URL
    updateActiveChamberURL('daylight');
  };

  const handleRainFilterChange = () => {
    // Always activate rain filter when clicked
    setUseFogFilter(false);
    setUseDaylightFilter(false);
    setUseRainFilter(true);
    // Don't clear storedManualSites, just hide them from current view
    setManualSites([]);
    // If a tag is selected, activate rain chamber
    if (selectedTagId) {
      setActiveRainChamber(true);
    }
    // Update URL
    updateActiveChamberURL('rain');
  };

  // Search popup functions
  const fetchSearchSites = async () => {
    try {
      console.log('🔄 Starting fetchSearchSites...');
      
      // Use the mock user ID directly since we're in development mode
      const mockUserId = 'a8febfdb-1fba-4f2a-b8ac-da4b4a2ddc64';
      console.log('✅ Using hardcoded user ID for development:', mockUserId);

      // Skip user lookup and use the direct internal user ID for development
      const internalUserId = mockUserId; // This is already the internal user ID from database
      console.log('✅ Using internal user ID directly:', internalUserId);

      // Fetch sites for this user
      const { data: sitesData, error: sitesError } = await supabase
        .from('sitespren')
        .select('sitespren_base, is_external, is_internal, created_at, driggs_address_species_id, id')
        .eq('fk_users_id', internalUserId)
        .order('created_at', { ascending: false });

      if (sitesError) {
        console.error('❌ Error fetching search sites:', sitesError);
        return;
      }

      console.log('✅ Fetched', sitesData?.length || 0, 'sites from sitespren table');
      if (sitesData && sitesData.length > 0) {
        console.log('📋 Sample sites:', sitesData.slice(0, 3).map(s => s.sitespren_base));
      }

      setSearchSites(sitesData || []);
    } catch (err) {
      console.error('💥 Error in fetchSearchSites:', err);
    }
  };

  const handleSearchSiteSelect = (siteId: string) => {
    const newSelected = new Set(selectedSiteIds);
    if (newSelected.has(siteId)) {
      newSelected.delete(siteId);
    } else {
      newSelected.add(siteId);
    }
    setSelectedSiteIds(newSelected);
  };

  const handleEnterSelectedSites = () => {
    const selectedSites = searchSites
      .filter(site => selectedSiteIds.has(site.id.toString()))
      .map(site => site.sitespren_base)
      .join(' ');
    
    setManualSiteInput(selectedSites);
    setSearchPopupOpen(false);
    setSelectedSiteIds(new Set());
    setSearchQuery('');
  };

  const getFilteredSearchSites = () => {
    let filtered = searchSites;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(site => 
        site.sitespren_base?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by external flag
    if (isExternalFilter) {
      filtered = filtered.filter(site => site.is_external === true);
    }
    
    return filtered;
  };

  // Pagination for search results
  const totalSearchPages = Math.ceil(getFilteredSearchSites().length / (searchItemsPerPage === -1 ? getFilteredSearchSites().length : searchItemsPerPage));
  const paginatedSearchSites = searchItemsPerPage === -1 
    ? getFilteredSearchSites() 
    : getFilteredSearchSites().slice((searchCurrentPage - 1) * searchItemsPerPage, searchCurrentPage * searchItemsPerPage);

  const handleManualSiteSubmit = () => {
    const sites = parseManualSites(manualSiteInput);
    setManualSites(sites);
    setStoredManualSites(sites); // Store permanently for toggle between chambers
    
    // Update URL with proper parameter ordering
    const currentChamber = useDaylightFilter ? 'daylight' : useRainFilter ? 'rain' : null;
    updateURL(currentChamber, sites);
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
    
    // Update URL with proper parameter ordering
    const currentChamber = useDaylightFilter ? 'daylight' : useRainFilter ? 'rain' : null;
    updateURL(currentChamber, updatedSites);
  };

  const clearAllManualSites = () => {
    setManualSites([]);
    setStoredManualSites([]);
    setManualSiteInput('');
    
    // Update URL with proper parameter ordering (remove sitesentered, keep chamber if active)
    const currentChamber = useDaylightFilter ? 'daylight' : useRainFilter ? 'rain' : null;
    updateURL(currentChamber, []);
  };

  // Platform dropdown functions
  const handlePlatformDropdownClick = async (field: string, siteId: string) => {
    if (platformDropdownOpen?.field === field && platformDropdownOpen?.siteId === siteId) {
      setPlatformDropdownOpen(null);
    } else {
      setPlatformDropdownOpen({ field, siteId });
      
      // Load platforms lazily on first dropdown open
      if (!platformsLoaded && !platformsLoading) {
        setPlatformsLoading(true);
        await fetchCallPlatforms();
        setPlatformsLoaded(true);
        setPlatformsLoading(false);
      }
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

  const handleAddressSpeciesDropdownClick = async (field: string, siteId: string) => {
    if (addressSpeciesDropdownOpen?.field === field && addressSpeciesDropdownOpen?.siteId === siteId) {
      setAddressSpeciesDropdownOpen(null);
    } else {
      setAddressSpeciesDropdownOpen({ field, siteId });
      // Close other dropdowns if open
      setPlatformDropdownOpen(null);
      setCgigDropdownOpen(null);
      
      // Load address species lazily on first dropdown open
      if (!addressSpeciesLoaded && !addressSpeciesLoading) {
        setAddressSpeciesLoading(true);
        await fetchAddressSpecies();
        setAddressSpeciesLoaded(true);
        setAddressSpeciesLoading(false);
      }
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

  const handleCgigDropdownClick = async (field: string, siteId: string) => {
    if (cgigDropdownOpen?.field === field && cgigDropdownOpen?.siteId === siteId) {
      setCgigDropdownOpen(null);
    } else {
      setCgigDropdownOpen({ field, siteId });
      // Close platform dropdown if open
      setPlatformDropdownOpen(null);
      
      // Load citation gigs lazily on first dropdown open
      if (!citationGigsLoaded && !citationGigsLoading) {
        setCitationGigsLoading(true);
        await fetchCitationGigs();
        setCitationGigsLoaded(true);
        setCitationGigsLoading(false);
      }
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

  // Search popup pagination controls
  const SearchPaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Rows:</span>
        <div className="inline-flex" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setSearchItemsPerPage(value);
                setSearchCurrentPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${searchItemsPerPage === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
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
            onClick={() => setSearchCurrentPage(Math.max(1, searchCurrentPage - 1))}
            disabled={searchCurrentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${searchCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalSearchPages) }, (_, i) => {
            let pageNum;
            if (totalSearchPages <= 5) {
              pageNum = i + 1;
            } else if (searchCurrentPage <= 3) {
              pageNum = i + 1;
            } else if (searchCurrentPage >= totalSearchPages - 2) {
              pageNum = totalSearchPages - 4 + i;
            } else {
              pageNum = searchCurrentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setSearchCurrentPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-gray-300 border-l-0
                  ${searchCurrentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setSearchCurrentPage(Math.min(totalSearchPages, searchCurrentPage + 1))}
            disabled={searchCurrentPage === totalSearchPages}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 border-l-0 rounded-r-md
              ${searchCurrentPage === totalSearchPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Search box for search popup */}
      <div className="flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sites..."
          className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ height: '38px' }}
        />
        <button
          onClick={() => setSearchQuery('')}
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
          {[1, 2, 5, 10, 15, 20].map((value, index) => (
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
                ${index === 5 ? 'rounded-r-md' : ''}
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
          {Array.from({ length: Math.max(1, Math.min(5, totalColumnPages)) }, (_, i) => {
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
      {/* Search Popup */}
      {searchPopupOpen && (
        <div className="fixed inset-0 flex items-start justify-center z-50 pt-20 pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl w-[600px] h-[600px] flex flex-col pointer-events-auto">
            {/* Popup Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4 flex-1">
                <h2 className="text-lg font-semibold">Search Sites</h2>
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search sites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setSearchPopupOpen(false);
                  setSelectedSiteIds(new Set());
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Controls */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <button
                onClick={handleEnterSelectedSites}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                disabled={selectedSiteIds.size === 0}
              >
                enter selected sites
              </button>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold">is_external</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isExternalFilter}
                    onChange={(e) => setIsExternalFilter(e.target.checked)}
                    className="sr-only"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Top Search Pagination Controls */}
            <div className="p-4 border-b bg-gray-50">
              <SearchPaginationControls />
            </div>

            {/* Sites Table */}
            <div className="flex-1 overflow-auto p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-400">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 uppercase border border-gray-400">select</th>
                      <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 uppercase border border-gray-400">sitespren_base</th>
                      <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 uppercase border border-gray-400">is_external</th>
                      <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 uppercase border border-gray-400">is_internal</th>
                      <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 uppercase border border-gray-400">created_at</th>
                      <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 uppercase border border-gray-400">driggs_address_species_id</th>
                      <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 uppercase border border-gray-400">id</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedSearchSites.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 border border-gray-400">
                          <input
                            type="checkbox"
                            checked={selectedSiteIds.has(site.id.toString())}
                            onChange={() => handleSearchSiteSelect(site.id.toString())}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-900 truncate max-w-[150px] border border-gray-400">{site.sitespren_base || '-'}</td>
                        <td className="px-2 py-2 text-sm text-gray-900 border border-gray-400">{site.is_external ? 'true' : 'false'}</td>
                        <td className="px-2 py-2 text-sm text-gray-900 border border-gray-400">{site.is_internal ? 'true' : 'false'}</td>
                        <td className="px-2 py-2 text-sm text-gray-900 border border-gray-400">{site.created_at ? new Date(site.created_at).toLocaleDateString() : '-'}</td>
                        <td className="px-2 py-2 text-sm text-gray-900 border border-gray-400">{site.driggs_address_species_id || '-'}</td>
                        <td className="px-2 py-2 text-sm text-gray-900 border border-gray-400">{site.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {getFilteredSearchSites().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {isExternalFilter ? 'No external sites found' : 'No sites found'}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Search Pagination Controls */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {paginatedSearchSites.length} of {getFilteredSearchSites().length} sites
                </div>
                <SearchPaginationControls />
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Top Status */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {selectedFields.size > 0 && (
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded">
              {selectedFields.size} fields selected
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <div className="flex space-x-0">
            {/* fog_chamber tab */}
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-3 text-sm font-medium border-b-2 border-l border-t border-r transition-colors ${
                activeTab === 1
                  ? 'border-b-blue-600 border-l-gray-400 border-t-gray-400 border-r-gray-400 text-blue-600 bg-blue-50'
                  : 'border-b-transparent border-l-gray-400 border-t-gray-400 border-r-gray-400 text-gray-500 hover:text-gray-700 hover:border-b-gray-300'
              }`}
              style={{ borderLeftColor: '#d5d5d5', borderTopColor: '#d5d5d5', borderRightColor: '#d5d5d5' }}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useFogFilter}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.checked) {
                      handleFogFilterChange();
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>fog_chamber</span>
              </div>
            </button>
            
            {/* daylight_chamber tab */}
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-3 text-sm font-medium border-b-2 border-t border-l border-r transition-colors -ml-px ${
                activeTab === 2
                  ? 'border-b-blue-600 border-t-gray-400 border-l-gray-400 border-r-gray-400 text-blue-600 bg-blue-50'
                  : 'border-b-transparent border-t-gray-400 border-l-gray-400 border-r-gray-400 text-gray-500 hover:text-gray-700 hover:border-b-gray-300'
              }`}
              style={{ borderTopColor: '#d5d5d5', borderLeftColor: '#d5d5d5', borderRightColor: '#d5d5d5' }}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useDaylightFilter}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.checked) {
                      handleDaylightFilterChange();
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>daylight_chamber</span>
              </div>
            </button>
            
            {/* rain_chamber tab */}
            <button
              onClick={() => setActiveTab(3)}
              className={`px-6 py-3 text-sm font-medium border-b-2 border-t border-l border-r transition-colors -ml-px ${
                activeTab === 3
                  ? 'border-b-blue-600 border-t-gray-400 border-l-gray-400 border-r-gray-400 text-blue-600 bg-blue-50'
                  : 'border-b-transparent border-t-gray-400 border-l-gray-400 border-r-gray-400 text-gray-500 hover:text-gray-700 hover:border-b-gray-300'
              }`}
              style={{ borderTopColor: '#d5d5d5', borderLeftColor: '#d5d5d5', borderRightColor: '#d5d5d5' }}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useRainFilter}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.checked) {
                      handleRainFilterChange();
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>rain_chamber</span>
              </div>
            </button>
            
            {/* Show Main Chamber Boxes toggle (tab 4) */}
            <button
              onClick={() => setActiveTab(4)}
              className={`px-6 py-3 text-sm font-medium border-b-2 border-t border-l border-r transition-colors ${
                activeTab === 4
                  ? 'border-b-blue-600 border-t-gray-400 border-l-gray-400 border-r-gray-400 text-blue-600 bg-blue-50'
                  : 'border-b-transparent border-t-gray-400 border-l-gray-400 border-r-gray-400 text-gray-500 hover:text-gray-700 hover:border-b-gray-300'
              }`}
              style={{ borderTopColor: '#d5d5d5', borderLeftColor: '#d5d5d5', borderRightColor: '#d5d5d5' }}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showChamberBoxes}
                  onChange={(e) => {
                    e.stopPropagation();
                    setShowChamberBoxes(e.target.checked);
                  }}
                  className="w-4 h-4"
                />
                <span>Show Main Chamber Boxes</span>
              </div>
            </button>
            
            {/* Keep original tabs 5, 6, 7, and 8 */}
            {[5, 6, 7, 8].map((tabNumber, index) => (
              <button
                key={tabNumber}
                onClick={() => setActiveTab(tabNumber)}
                className={`px-6 py-3 text-sm font-medium border-b-2 border-t border-l border-r transition-colors -ml-px ${
                  activeTab === tabNumber
                    ? 'border-b-blue-600 border-t-gray-400 border-l-gray-400 border-r-gray-400 text-blue-600 bg-blue-50'
                    : 'border-b-transparent border-t-gray-400 border-l-gray-400 border-r-gray-400 text-gray-500 hover:text-gray-700 hover:border-b-gray-300'
                }`}
                style={{ 
                  borderTopColor: '#d5d5d5',
                  borderLeftColor: '#d5d5d5',
                  borderRightColor: '#d5d5d5'
                }}
              >
                {tabNumber === 5 ? 'nav stuff' : 
                 tabNumber === 6 ? (
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       checked={showTundraChamber}
                       onChange={(e) => onShowTundraChamberChange?.(e.target.checked)}
                       onClick={(e) => e.stopPropagation()}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span>Show Tundra Chamber</span>
                   </div>
                 ) : `tab ${tabNumber}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fog Chamber */}
      {activeTab === 1 && showChamberBoxes && (
        <div className="fog-chamber border border-gray-700 rounded-lg">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="font-bold text-sm text-gray-800">fog_chamber</div>
            <input
              type="checkbox"
              checked={useFogFilter}
              onChange={handleFogFilterChange}
              className="ml-3 w-4 h-4"
              style={{ width: '16px', height: '16px' }}
            />
            <span className="ml-2 text-sm text-gray-600">Use to filter</span>
          </div>
        </div>
        </div>
      )}

      {/* Daylight Chamber */}
      {activeTab === 2 && showChamberBoxes && (
        <div className="daylight-chamber border border-gray-700 rounded-lg">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="font-bold text-sm text-gray-800">daylight_chamber</div>
            <input
              type="checkbox"
              checked={useDaylightFilter}
              onChange={handleDaylightFilterChange}
              className="ml-3 w-4 h-4"
              style={{ width: '16px', height: '16px' }}
            />
            <span className="ml-2 text-sm text-gray-600">Use to filter</span>
            
            {/* Manual Site Input - inline */}
            <div className="ml-8 flex items-center">
              <div className="relative group">
                <svg 
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Separate sites with spaces, commas, or line breaks. Sites will be matched against your database.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
              <span className="ml-2 text-sm font-bold text-gray-700">enter sites manually</span>
              
              {/* Search Button */}
              <button
                onClick={() => {
                  console.log('🔍 Search button clicked, opening popup...');
                  setSearchPopupOpen(true);
                }}
                className="ml-3 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                search
              </button>
            </div>
            <input
              type="text"
              value={manualSiteInput}
              onChange={(e) => setManualSiteInput(e.target.value)}
              onKeyPress={handleManualSiteKeyPress}
              placeholder="dogs.com, cats.com facebook.com/group example.net"
              className="ml-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              style={{ width: '700px' }}
            />
            <button
              onClick={handleManualSiteSubmit}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Submit
            </button>
            {manualSites.length > 0 && (
              <button
                onClick={clearAllManualSites}
                className="ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            )}
            {manualSites.length > 0 && (
              <button
                onClick={() => setShowPillbox(!showPillbox)}
                className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                {showPillbox ? 'hide pillbox' : 'show pillbox'}
              </button>
            )}
            <button
              onClick={() => setShowRecents(!showRecents)}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {showRecents ? 'hide recents' : 'show recents'}
            </button>
          </div>
        </div>

        {/* Currently Entered Sites Display - Pillbox Area */}
        {manualSites.length > 0 && showPillbox && (
          <div className="relative border border-black p-4 mb-4">
            <div className="absolute top-1 left-2 text-sm font-medium text-gray-900 bg-white px-1">
              pillbox area
            </div>
            <div className="text-sm font-medium text-gray-700 mb-2 mt-2">
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
            
            {/* Verification and Competitor Buttons - restored to original location */}
            <div className="mt-2 mb-2">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onShowVerificationColumnChange?.(!showVerificationColumn)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    showVerificationColumn ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  show verification column
                </button>
                <button
                  onClick={() => onShowCompetitorSitesChange?.(!showCompetitorSites)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    showCompetitorSites ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  show competitor sites
                </button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Showing {sites.length} matching sites from your database out of {allSites.length} total sites.
            </div>
          </div>
        )}

        {/* Recents Area */}
        {showRecents && (
          <div className="relative border border-black p-4 mb-4">
            <div className="mt-4">
              <div className="text-base font-bold mb-2" style={{fontSize: '16px'}}>
                recents_box
              </div>
              <div className="text-sm text-gray-600 mb-3">
                local storage
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">Time Last Used</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">Link To Open</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">Open w/ Yes Show Main Chamber Boxes</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">Open w/ No Show Main Chamber Boxes</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">Sites Entered</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">Count</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-300">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {recentEntries.length === 0 ? (
                      <tr>
                        <td className="px-3 py-2 text-sm text-gray-500 border-b border-gray-200 text-center" colSpan={7}>
                          no recents currently stored
                        </td>
                      </tr>
                    ) : (
                      recentEntries.map((entry, index) => (
                        <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                            {new Date(entry.timeLastUsed).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                            <a
                              href={`/drom?sitesentered=${encodeURIComponent(entry.sitesEntered.join(','))}&activefilterchamber=daylight`}
                              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
                            >
                              Open Configuration Link
                            </a>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                            <a
                              href={`/drom?sitesentered=${encodeURIComponent(entry.sitesEntered.join(','))}&activefilterchamber=daylight&showmainchamberboxes=yes`}
                              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 hover:text-green-700 transition-colors duration-200"
                            >
                              Open w/ Yes
                            </a>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                            <a
                              href={`/drom?sitesentered=${encodeURIComponent(entry.sitesEntered.join(','))}&activefilterchamber=daylight&showmainchamberboxes=no`}
                              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                            >
                              Open w/ No
                            </a>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                            <div className="flex flex-wrap gap-1">
                              {entry.sitesEntered.slice(0, 3).map((site, siteIndex) => (
                                <span key={siteIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  {site}
                                </span>
                              ))}
                              {entry.sitesEntered.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{entry.sitesEntered.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                            {entry.count}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                            {entry.settings}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Rain Chamber */}
      {activeTab === 3 && showChamberBoxes && (
        <div className={`rain-chamber border border-gray-700 rounded-lg ${activeRainChamber ? 'border-blue-500 bg-blue-50' : ''}`}>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="font-bold text-sm text-gray-800">rain_chamber</div>
            <input
              type="checkbox"
              checked={useRainFilter}
              onChange={handleRainFilterChange}
              className="ml-3 w-4 h-4"
              style={{ width: '16px', height: '16px' }}
            />
            <span className="ml-2 text-sm text-gray-600">Use to filter</span>
            
            {/* Inline Tags Dropdown */}
            <span className="ml-8 text-sm font-bold text-gray-700">select from sitespren_tags</span>
            <div className="ml-3 relative inline-block">
              <button
                onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                className="px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                style={{ width: '300px' }}
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
            
            {/* Inline Submit Button */}
            <button
              onClick={handleRainChamberSubmit}
              disabled={!selectedTagId}
              className={`ml-3 px-4 py-2 rounded font-medium transition-colors text-sm ${
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
      )}

      {/* Nav Stuff Chamber - Tab 5 */}
      {activeTab === 5 && showChamberBoxes && (
        <div className="nav-stuff-chamber border border-gray-700 rounded-lg">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="font-bold text-sm text-gray-800">nav_stuff_chamber</div>
            </div>
            
            {/* Drenjari Navigation Links */}
            <div className="mt-4">
              <DrenjariButtonBarDriggsmanLinks />
            </div>
            
            {/* Standalone Planchjar Button */}
            <div className="mt-4">
              <Link
                href="/planchjar"
                className="inline-block px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/planchjar</span>
              </Link>
            </div>
            
          </div>
        </div>
      )}

      {/* Tundra Chamber - Independent chamber controlled by checkbox */}
      {showTundraChamber && (
        <div className="tundra-chamber border border-gray-700 rounded-lg mb-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="font-bold text-sm text-gray-800">tundra_chamber</div>
              <div className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                Independent Chamber
              </div>
              {paginatedSites[0] && (
                <div className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md font-medium">
                  {paginatedSites[0].sitespren_base || `site ${paginatedSites[0].id.slice(0, 8)}`}
                </div>
              )}
              <div className="ml-4 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                Shows Data For The 1 sitespren_base Whose Column Set Is Farthest Left In The Viewing Screen
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                This chamber operates independently from the tab system above. 
                It can be visible simultaneously with any of the other chambers.
              </div>
              
              {/* Horizontal Tab System inside Tundra Chamber */}
              <div className="mt-6 border-t border-gray-300 pt-4">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200">
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50">
                    ntab1
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    ntab2
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    ntab3
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    ntab4
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    ntab5
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    ntab6
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    ntab7
                  </button>
                </div>
                
                {/* Tab Content */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-base font-bold" style={{ fontSize: '16px' }}>
                      ntab1 chamber - Website Screenshot
                    </div>
                    <a 
                      href={`/planchjar?tab=dpackjartab&site=${paginatedSites[0]?.sitespren_base || ''}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                    >
                      /planchjar
                    </a>
                  </div>
                  
                  {/* Screenshot Preview Area */}
                  {paginatedSites[0] && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Snail Image System for: <span className="font-medium text-gray-800">{paginatedSites[0].sitespren_base}</span>
                      </div>
                      
                      {/* Dual Image Display Area - Interactive and Static side by side */}
                      <div className="flex gap-6 justify-start">
                        {/* Interactive Screenshot Capture Box */}
                        <div className="flex-1 max-w-32">
                          <div className="text-xs text-gray-600 mb-2 text-center font-medium">
                            Interactive Screenshot Capture
                          </div>
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                            <ScreenshotPreview
                              sitesprenId={paginatedSites[0].id}
                              sitesprenBase={paginatedSites[0].sitespren_base || ''}
                              currentScreenshotUrl={paginatedSites[0].screenshot_url}
                              screenshotStatus={paginatedSites[0].screenshot_status}
                              screenshotError={null}
                              onScreenshotUpdate={(data) => {
                                // Update the site data when screenshot is captured
                                console.log('Screenshot updated:', data);
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 text-center mt-2">
                            Click on the image area to capture or refresh screenshot
                          </div>
                        </div>

                        {/* Static Image Display Box */}
                        <div className="flex-1 max-w-32">
                          <div className="text-xs text-gray-600 mb-2 text-center font-medium">
                            Static Database Image (screenshot_url field)
                          </div>
                          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border-2 border-blue-200">
                            {paginatedSites[0].screenshot_url ? (
                              <img
                                src={paginatedSites[0].screenshot_url}
                                alt={`Static image from database for ${paginatedSites[0].sitespren_base}`}
                                className="w-full h-full object-cover"
                                onLoad={() => {
                                  console.log('✅ Static image loaded successfully:', paginatedSites[0].screenshot_url);
                                }}
                                onError={(e) => {
                                  console.error('❌ Static image failed to load:', {
                                    imageUrl: paginatedSites[0].screenshot_url,
                                    sitesprenBase: paginatedSites[0].sitespren_base,
                                    error: e,
                                    timestamp: new Date().toISOString()
                                  });
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-50">
                                <div className="text-center p-4">
                                  <div className="text-2xl mb-2 text-gray-400">📷</div>
                                  <div className="text-xs text-gray-500">No static image</div>
                                  <div className="text-xs text-gray-400">in screenshot_url field</div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 text-center mt-2">
                            Read-only display from database field
                          </div>
                        </div>
                      </div>
                      
                      {/* City-Niche Combination Fields */}
                      <div className="mt-6 mb-4" style={{ border: '1px solid black', padding: '16px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                          city-niche-combination:
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <span style={{ fontSize: '14px' }}>sitespren.rel_cncglub_id</span>
                            <input 
                              type="text" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                              value={paginatedSites[0]?.rel_cncglub_id?.toString() || ''}
                              placeholder="ID"
                              readOnly
                            />
                            <a 
                              href={`/assignwiz?tractor_name=all&site=${searchParams?.get('sitesentered') || ''}`}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                              target="_blank"
                            >
                              /assignwiz
                            </a>
                            <div style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid black',
                              padding: '6px',
                              fontSize: '14px'
                            }}>
                              cnc wok
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span style={{ fontSize: '14px' }}>sitespren.rel_city_id</span>
                            <input 
                              type="text" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                              value={paginatedSites[0]?.rel_city_id?.toString() || ''}
                              placeholder="ID"
                              readOnly
                            />
                            <a 
                              href={`/assignwiz?tractor_name=all&site=${searchParams?.get('sitesentered') || ''}`}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                              target="_blank"
                            >
                              /assignwiz
                            </a>
                            <div style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid black',
                              padding: '6px',
                              fontSize: '14px'
                            }}>
                              city wok
                            </div>
                            <div style={{
                              fontSize: '14px',
                              marginLeft: '8px'
                            }}>
                              cities.city_population: {cityPopulationData.get(paginatedSites[0]?.rel_city_id?.toString() || '') || 'Loading...'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span style={{ fontSize: '14px' }}>sitespren.rel_industry_id</span>
                            <input 
                              type="text" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                              value={paginatedSites[0]?.rel_industry_id?.toString() || ''}
                              placeholder="ID"
                              readOnly
                            />
                            <a 
                              href={`/assignwiz?tractor_name=all&site=${searchParams?.get('sitesentered') || ''}`}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                              target="_blank"
                            >
                              /assignwiz
                            </a>
                            <div style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid black',
                              padding: '6px',
                              fontSize: '14px'
                            }}>
                              industry wok
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* dp1-dp5 Table, Medallions, and Tundra Container */}
                      <div className="mt-6 flex gap-6">
                        {/* Transit Table Section */}
                        <div>
                          {/* transit_table label */}
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            marginBottom: '8px',
                            textAlign: 'left'
                          }}>
                            transit_table:
                          </div>
                          
                          <table style={{
                            borderCollapse: 'collapse',
                            border: '1px solid #9ca3af',
                            margin: '0'
                          }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp1</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp1</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp2</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp2</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp3</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp3</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp4</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp4</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp5</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>dp5</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>shark</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>walrus</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>shark</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>walrus</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>shark</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>walrus</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>shark</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>walrus</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>shark</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>walrus</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>c</td>
                              <td 
                                style={{ 
                                  padding: '3px', 
                                  border: '1px solid #9ca3af', 
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  backgroundColor: '#f3f4f6'
                                }}
                                onClick={handleDp5SharkCClick}
                                title="Click to copy sharkintax output to clipboard"
                              >c</td>
                              <td 
                                style={{ 
                                  padding: '3px', 
                                  border: '1px solid #9ca3af', 
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  backgroundColor: '#f3f4f6'
                                }}
                                onClick={handleDp5WalrusCClick}
                                title="Click to copy walrustax output to clipboard"
                              >c</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>xls</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>csv</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                              <td style={{ padding: '3px', border: '1px solid #9ca3af', textAlign: 'center' }}>sql</td>
                            </tr>
                          </tbody>
                        </table>
                        </div>
                        
                        {/* Migrated Medallions Section */}
                        <div style={{ border: '1px solid black', padding: '16px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                            migrated medallions box
                          </div>
                          
                          {/* Migrated DriggsPackMedallions (zz1, zz2, zz3) */}
                          <div className="flex items-center space-x-2 mb-4">
                            <span className="text-sm font-medium">zz1, zz2, zz3:</span>
                            <DriggsPackMedallion 
                              driggspackNumber={1}
                              siteId={paginatedSites[0]?.id || ''}
                              onZzClick={handleDriggspackClick}
                            />
                            <DriggsPackMedallion 
                              driggspackNumber={2}
                              siteId={paginatedSites[0]?.id || ''}
                              onZzClick={handleDriggspackClick}
                            />
                            <DriggsPackMedallion 
                              driggspackNumber={3}
                              siteId={paginatedSites[0]?.id || ''}
                              onZzClick={handleDriggspackClick}
                            />
                          </div>
                          
                          {/* Migrated VacuumMedallion */}
                          <div className="flex items-center space-x-2 mb-4">
                            <span className="text-sm font-medium">Vacuum:</span>
                            <VacuumMedallion 
                              siteId={paginatedSites[0]?.id || ''}
                              onMedallionClick={handleVacuumMedallionClick}
                              onFiller1aClick={handleVacuumFiller1aClick}
                              onFiller1bClick={handleVacuumFiller1bClick}
                            />
                          </div>
                          
                          {/* Migrated ZarpoMedallion */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Zarpo:</span>
                            <ZarpoMedallion 
                              siteId={paginatedSites[0]?.id || ''}
                              onMedallionClick={handleZarpoMedallionClick}
                              onFiller1aClick={handleZarpoFiller1aClick}
                              onFiller1bClick={handleZarpoFiller1bClick}
                            />
                          </div>
                        </div>
                        
                        {/* Migrated Tundra Box Section */}
                        <div style={{ border: '1px solid black', padding: '16px', minWidth: '450px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                            migrated tundra box div
                          </div>
                          
                          {/* Migrated Tundra box content */}
                          {paginatedSites[0] && (
                            <div 
                              className="tundra_box"
                              style={{
                                position: 'relative',
                                width: '100%',
                                border: '1px solid black',
                                backgroundColor: 'white',
                                padding: '8px',
                                minHeight: '200px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                {/* Tundra landscape SVG icon */}
                                <svg 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{ color: 'black' }}
                                >
                                  {/* Tundra ground/horizon */}
                                  <path 
                                    d="M2 18h20v4H2z" 
                                    fill="currentColor"
                                  />
                                  {/* Rolling hills/tundra landscape */}
                                  <path 
                                    d="M2 18c3-2 7-3 10 0s7-2 10 0v-2c-3 2-7 3-10 0s-7 2-10 0z" 
                                    fill="currentColor"
                                    opacity="0.7"
                                  />
                                  {/* Northern lights/aurora effect */}
                                  <path 
                                    d="M4 8c2 1 4-1 6 0s4-1 6 0s4-1 6 0M5 5c2 1 4-1 6 0s4-1 6 0s3-1 5 0" 
                                    stroke="currentColor" 
                                    strokeWidth="1.5" 
                                    strokeLinecap="round"
                                    opacity="0.8"
                                  />
                                  {/* Sparse vegetation dots */}
                                  <circle cx="6" cy="16" r="1" fill="currentColor" opacity="0.6"/>
                                  <circle cx="12" cy="17" r="0.8" fill="currentColor" opacity="0.6"/>
                                  <circle cx="18" cy="16" r="1.2" fill="currentColor" opacity="0.6"/>
                                </svg>
                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'black' }}>
                                  tundra_box_div
                                </span>
                              </div>
                              
                              {/* 3x3 Table */}
                              <div style={{ overflow: 'auto' }}>
                                <table style={{
                                  border: '1px solid #d1d5db',
                                  borderCollapse: 'collapse',
                                  width: '100%',
                                  fontSize: '12px',
                                  tableLayout: 'auto'
                                }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>1a</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>1b</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>1c</td>
                                    </tr>
                                    <tr>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>2a</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>sitesglub.ns_full</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>
                                        {(() => {
                                          if (!paginatedSites[0].sitespren_base) return 'NULL';
                                          
                                          const isLoading = sitesglubLoading.get(paginatedSites[0].sitespren_base)?.has('ns_full');
                                          const value = sitesglubData.get(paginatedSites[0].sitespren_base)?.ns_full;
                                          
                                          if (isLoading) {
                                            return (
                                              <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                              </div>
                                            );
                                          }
                                          
                                          return (
                                            <button
                                              className="hover:bg-gray-100 cursor-pointer min-w-0 text-center bg-transparent border-0 p-0 m-0"
                                              onClick={() => fetchSitesglubMetric(paginatedSites[0].sitespren_base!, 'ns_full')}
                                              title="Click to refresh ns_full data"
                                            >
                                              {value || 'NULL'}
                                            </button>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>3a</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>sitesglub.ip_address</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>
                                        {(() => {
                                          if (!paginatedSites[0].sitespren_base) return 'NULL';
                                          
                                          const isLoading = sitesglubLoading.get(paginatedSites[0].sitespren_base)?.has('ip_address');
                                          const value = sitesglubData.get(paginatedSites[0].sitespren_base)?.ip_address;
                                          
                                          if (isLoading) {
                                            return (
                                              <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                              </div>
                                            );
                                          }
                                          
                                          return (
                                            <button
                                              className="hover:bg-gray-100 cursor-pointer min-w-0 text-center bg-transparent border-0 p-0 m-0"
                                              onClick={() => fetchSitesglubMetric(paginatedSites[0].sitespren_base!, 'ip_address')}
                                              title="Click to refresh ip_address data"
                                            >
                                              {value || 'NULL'}
                                            </button>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>4a</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>dom reg acct</td>
                                      <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'left', fontSize: '10px', maxWidth: '150px', wordWrap: 'break-word' }}>
                                        {(() => {
                                          if (!paginatedSites[0].fk_domreg_hostaccount) {
                                            return (
                                              <div className="flex items-center justify-between w-full">
                                                <span className="text-gray-400">No registrar set</span>
                                                <button
                                                  onClick={() => {
                                                    setRegistrarPopupOpen(paginatedSites[0].id);
                                                    fetchHostAccountsForPopup();
                                                  }}
                                                  className="text-xs px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                  title="Set host account"
                                                >
                                                  ⚙️
                                                </button>
                                              </div>
                                            );
                                          }

                                          // Find the registrar info from allHostAccounts
                                          const registrarInfo = allHostAccounts.find(acc => acc.host_account_id === paginatedSites[0].fk_domreg_hostaccount);
                                          
                                          if (registrarInfo) {
                                            return (
                                              <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-1">
                                                  <span className="text-xs font-medium text-gray-900">
                                                    {registrarInfo.company_name}
                                                  </span>
                                                  <span className="text-xs text-gray-500">
                                                    {registrarInfo.username}
                                                  </span>
                                                </div>
                                                <div className="flex gap-1">
                                                  {registrarInfo.portal_url && (
                                                    <a
                                                      href={registrarInfo.portal_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-xs px-1 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                      title="Open portal"
                                                    >
                                                      🔗
                                                    </a>
                                                  )}
                                                  <button
                                                    onClick={() => {
                                                      setRegistrarPopupOpen(paginatedSites[0].id);
                                                      fetchHostAccountsForPopup();
                                                    }}
                                                    className="text-xs px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                    title="Change host account"
                                                  >
                                                    ⚙️
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          }

                                          // Fallback if registrar ID exists but not found in allHostAccounts
                                          return (
                                            <div className="flex items-center justify-between w-full">
                                              <span className="text-xs text-gray-400">Unknown registrar</span>
                                              <button
                                                onClick={() => {
                                                  setRegistrarPopupOpen(paginatedSites[0].id);
                                                  fetchHostAccountsForPopup();
                                                }}
                                                className="text-xs px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                title="Change host account"
                                              >
                                                ⚙️
                                              </button>
                                            </div>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!paginatedSites[0] && (
                    <div className="text-center text-gray-500 py-8">
                      No sites available for screenshot capture
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="divide-y divide-gray-300" style={{ width: 'auto', tableLayout: 'auto' }}>
            <thead className="bg-gray-50">
              {/* Additional header row with driggspack buttons */}
              <tr className="border-b border-gray-300">
                <td className="w-12 h-8 border-r border-gray-300"></td>
                <td className="h-8 border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>-</td>
                <td className="h-8 border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>-</td>
                <td className="h-8 border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>-</td>
                <td className="h-8 border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>-</td>
                <td className="h-8 border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>-</td>
                <td className="h-8" style={{ borderRight: '2px solid black' }}></td>
                {paginatedSites.map((site, index) => (
                  <>
                    <td
                      key={`empty-${site.id}`}
                      className="h-8 px-2 border-r border-gray-300 relative"
                      style={{ minWidth: '600px', width: '600px' }}
                    >
                      {/* Empty div - tundra box moved to migrated section */}
                      
                      {/* Filler text replacing medallions */}
                      <div className="flex items-center justify-center h-full">
                        (filler)
                      </div>
                    </td>
                    {/* Empty status column for medallion row */}
                    <td 
                      key={`empty-status-${site.id}`}
                      className="h-8 border-r border-gray-300"
                      style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                    >
                    </td>
                    {/* Empty excl wp column for medallion row */}
                    <td 
                      key={`empty-excl-wp-${site.id}`}
                      className="h-8 border-r border-gray-300"
                      style={{ width: '12px', minWidth: '12px', maxWidth: '12px' }}
                    >
                    </td>
                    {/* Empty excl fe column for medallion row */}
                    <td 
                      key={`empty-excl-fe-${site.id}`}
                      className="h-8 border-r border-gray-300"
                      style={{ width: '12px', minWidth: '12px', maxWidth: '12px' }}
                    >
                    </td>
                    {/* Vacuum medallion column */}
                    <td 
                      key={`vacuum-medallion-${site.id}`}
                      className="h-8 border-r border-gray-300 p-1"
                    >
                      <div className="flex items-center justify-center h-full">
                        (filler)
                      </div>
                    </td>
                    {/* Zarpo scraper medallion column */}
                    <td 
                      key={`zarpo-medallion-${site.id}`}
                      className="h-8 p-1"
                      style={{ borderRight: '3px solid black' }}
                    >
                      <div className="flex items-center justify-center h-full">
                        (filler)
                      </div>
                    </td>
                  </>
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
                
                {/* New dp columns */}
                <th className="border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>
                  <span style={{ lineHeight: '0.8', fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: 'd<br>p<br>1' }} />
                </th>
                <th className="border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>
                  <span style={{ lineHeight: '0.8', fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: 'd<br>p<br>2' }} />
                </th>
                <th className="border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>
                  <span style={{ lineHeight: '0.8', fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: 'd<br>p<br>3' }} />
                </th>
                <th className="border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>
                  <span style={{ lineHeight: '0.8', fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: 'd<br>p<br>4' }} />
                </th>
                <th className="border-r border-gray-300" style={{ padding: '0', margin: '0', width: '10px', minWidth: '10px', maxWidth: '10px' }}>
                  <span style={{ lineHeight: '0.8', fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: 'm<br>r<br>k' }} />
                </th>
                
                {/* Field name column */}
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider" style={{ borderRight: '2px solid black' }}>
                  field name
                </th>

                {/* Site columns with paired status columns */}
                {paginatedSites.map((site, index) => (
                  <>
                    {/* Domain column */}
                    <th
                      key={site.id}
                      className="text-left border-r border-gray-300 relative"
                      title={site.sitespren_base || site.id}
                      style={{ padding: '0', minWidth: '600px', width: '600px' }}
                    >
                      {/* Reindeer box - positioned on right */}
                      <div 
                        className="reindeer_box"
                        style={{
                          position: 'absolute',
                          right: '0',
                          top: '0',
                          bottom: '0',
                          width: '410px',
                          border: '1px solid black',
                          backgroundColor: 'white',
                          zIndex: 10,
                          padding: '0',
                          pointerEvents: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Logo at top left */}
                        <div style={{ position: 'absolute', top: '4px', left: '4px' }}>
                          <svg 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ color: 'black' }}
                          >
                            {/* Antlers */}
                            <path 
                              d="M8 7L6 5M8 7L7 9M8 7L10 6M16 7L18 5M16 7L17 9M16 7L14 6" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round"
                            />
                            {/* Head */}
                            <ellipse 
                              cx="12" 
                              cy="14" 
                              rx="5" 
                              ry="6" 
                              fill="currentColor"
                            />
                            {/* Eyes */}
                            <circle cx="10" cy="12" r="1" fill="white"/>
                            <circle cx="14" cy="12" r="1" fill="white"/>
                            {/* Nose */}
                            <circle cx="12" cy="16" r="1.5" fill="white"/>
                          </svg>
                        </div>
                        
                        {/* Tool buttons container */}
                        <div style={{ 
                          position: 'absolute', 
                          top: '4px', 
                          left: '32px', 
                          right: '4px', 
                          bottom: '4px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignContent: 'flex-start',
                          gap: '2px',
                          pointerEvents: 'auto',
                          zIndex: 11
                        }}>
                          {/* Individual View button - wider than others */}
                          <a 
                            href={`/sitnivid?site=${encodeURIComponent(site.sitespren_base || '')}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              border: 'none',
                              borderRadius: '3px',
                              backgroundColor: '#2563eb',
                              cursor: 'pointer',
                              minWidth: '80px',
                              height: '24px',
                              textDecoration: 'none',
                              color: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              zIndex: 12
                            }}
                          >
                            Individual View
                          </a>
                          
                          {/* Tool buttons - matching sitejar4 functionality */}
                          {(() => {
                            const domain = site.sitespren_base || site.id;
                            const baseButtonStyle = {
                              padding: '2px 4px',
                              fontSize: '11px',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              minWidth: '24px',
                              height: '24px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              color: 'white',
                              position: 'relative',
                              zIndex: 12
                            };
                            
                            return (
                              <>
                                {/* WP - WordPress Admin */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://${domain}/wp-admin/`, '_blank');
                                  }}
                                  style={{...baseButtonStyle, backgroundColor: '#059669'}}
                                  title="Open WP Admin"
                                >
                                  WP
                                </button>
                                
                                {/* Site - Open website */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://${domain}`, '_blank');
                                  }}
                                  style={{...baseButtonStyle, backgroundColor: '#7c3aed'}}
                                  title="Open Site"
                                >
                                  Site
                                </button>
                                
                                {/* 📋 - Copy domain to clipboard */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(domain);
                                  }}
                                  style={{...baseButtonStyle, backgroundColor: '#4b5563'}}
                                  title="Copy domain to clipboard"
                                >
                                  📋
                                </button>
                                
                                {/* G - Google site search */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://www.google.com/search?q=site%3A${encodeURIComponent(domain)}`, '_blank');
                                  }}
                                  style={{...baseButtonStyle, backgroundColor: '#dc2626'}}
                                  title="Google site: search"
                                >
                                  G
                                </button>
                                
                                {/* 👁 - View backlinks (toggle expanded row) */}
                                <button
                                  onClick={() => console.log(`View backlinks for ${domain}`)}
                                  style={{...baseButtonStyle, backgroundColor: '#059669'}}
                                  title="View backlinks"
                                >
                                  👁
                                </button>
                                
                                {/* ✏️ - Edit row */}
                                <button
                                  onClick={() => console.log(`Edit ${domain}`)}
                                  style={{...baseButtonStyle, backgroundColor: '#ea580c'}}
                                  title="Edit row"
                                >
                                  ✏️
                                </button>
                                
                                {/* L - Scrape links */}
                                <button
                                  onClick={() => console.log(`Scrape links from ${domain}`)}
                                  style={{...baseButtonStyle, backgroundColor: '#4f46e5'}}
                                  title="Scrape outbound links from homepage"
                                >
                                  L
                                </button>
                                
                                {/* NW - NW Jar link */}
                                <a
                                  href={`/nwjar1?coltemp=option1&sitebase=${encodeURIComponent(domain)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{...baseButtonStyle, backgroundColor: '#3b82f6'}}
                                  title="Open NW Jar"
                                >
                                  NW
                                </a>
                                
                                {/* GC - GC Jar link */}
                                <a
                                  href={`/gconjar1?coltemp=option1&sitebase=${encodeURIComponent(domain)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{...baseButtonStyle, backgroundColor: '#14b8a6'}}
                                  title="Open GC Jar"
                                >
                                  GC
                                </a>
                                
                                {/* DG - Driggsman link */}
                                <a
                                  href={`/drom?sitesentered=${encodeURIComponent(domain)}&activefilterchamber=daylight&showmainchamberboxes=no&showtundrachamber=yes`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{...baseButtonStyle, backgroundColor: '#8b5cf6'}}
                                  title="Open Driggsman"
                                >
                                  DG
                                </a>
                                
                                {/* /sitejar4 - Sitejar4 individual view */}
                                <a
                                  href={`/sitejar4?sitesentered=${encodeURIComponent(domain)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{...baseButtonStyle, backgroundColor: '#3b82f6'}}
                                  title="View only this site"
                                >
                                  /sitejar4
                                </a>
                                
                                {/* Dromdori component - compact mode for reindeer box */}
                                <div style={{ display: 'inline-flex', marginLeft: '2px' }}>
                                  <Dromdori sitesprenBase={domain} compact={true} />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Original content - positioned to preserve appearance */}
                      <div 
                        className="truncate" 
                        style={{ 
                          fontSize: '18px', 
                          lineHeight: '1.2',
                          padding: '12px',
                          position: 'relative',
                          zIndex: 2,
                          marginRight: '430px'
                        }}
                      >
                        <div style={{ fontWeight: 'normal' }}>domain_column_for:</div>
                        <div style={{ fontWeight: 'bold' }}>
                          {(site.sitespren_base || `site ${site.id.slice(0, 8)}`).toLowerCase()}
                        </div>
                      </div>
                    </th>
                    {/* Status column - FIRST ROW with stat1 */}
                    <th
                      key={`${site.id}-status`}
                      className="px-1 py-3 text-center text-xs font-bold text-gray-900 border-r border-gray-300"
                      style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                    >
                      <div style={{ lineHeight: '1', fontSize: '15px' }}>
                        null<br/>stat<br/>us
                      </div>
                    </th>
                    {/* Exclude from WP column */}
                    <th
                      key={`${site.id}-excl-wp`}
                      className="text-center text-xs font-bold text-gray-900 border-r border-gray-300"
                      style={{ width: '12px', minWidth: '12px', maxWidth: '12px', padding: '1px' }}
                    >
                      <TooltipHeader 
                        tooltipText="exwp - exclude from wordpress" 
                        copyText="exwp - exclude from wordpress"
                      >
                        <div style={{ lineHeight: '1', fontSize: '15px' }}>
                          e<br/>x<br/>w<br/>p
                        </div>
                      </TooltipHeader>
                    </th>
                    {/* Exclude from Frontend column */}
                    <th
                      key={`${site.id}-excl-fe`}
                      className="text-center text-xs font-bold text-gray-900 border-r border-gray-300"
                      style={{ width: '12px', minWidth: '12px', maxWidth: '12px', padding: '1px' }}
                    >
                      <TooltipHeader 
                        tooltipText="exfe - exclude from frontend" 
                        copyText="exfe - exclude from frontend"
                      >
                        <div style={{ lineHeight: '1', fontSize: '15px' }}>
                          e<br/>x<br/>f<br/>e
                        </div>
                      </TooltipHeader>
                    </th>
                    {/* Vacuum column */}
                    <th
                      key={`${site.id}-vacuum`}
                      className="px-1 py-3 text-center text-xs font-bold text-gray-900 border-r border-gray-300"
                      style={{ borderLeft: '2px solid black' }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        {/* Vacuum Icon */}
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="#4B5563"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mb-1"
                        >
                          <path d="M23 15v4c0 1.1-.9 2-2 2h-1v-6h3zm-4 0v6h-4v-6h4zm-5 0v6h-4v-6h4zm-5 0v6H8c-1.1 0-2-.9-2-2v-4h3zm-6-2c-.55 0-1-.45-1-1s.45-1 1-1h2.03c.25-1.67 1.67-2.96 3.4-2.96.56 0 1.08.14 1.54.38l5.12-5.12c.37-.38.88-.59 1.41-.59.78 0 1.5.63 1.5 1.41 0 .53-.21 1.04-.59 1.41L11.29 10.63c.24.46.38.98.38 1.54 0 1.73-1.29 3.15-2.96 3.4V13H3zm8.43-7.41c.2-.2.51-.2.71 0s.2.51 0 .71l-3.54 3.54c-.2.2-.51.2-.71 0s-.2-.51 0-.71l3.54-3.54z"/>
                        </svg>
                        <div>
                          wordpress<br/>
                          vacuum
                        </div>
                      </div>
                    </th>
                    {/* Scraper column */}
                    <th
                      key={`${site.id}-scraper`}
                      className="px-1 py-3 text-center text-xs font-bold text-gray-900"
                      style={{ borderLeft: '2px solid black', borderRight: '3px solid black' }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        {/* Scraper Icon */}
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="#4B5563"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mb-1"
                        >
                          <path d="M1 12l3-3v2h13.5c.5 0 1-.2 1.3-.6l5.5-6.4c.1-.1.2-.3.2-.5 0-.4-.3-.7-.7-.7-.2 0-.3.1-.4.2L18.2 9H4v2H1v1zm6.5 1L2 19.4c-.1.1-.2.3-.2.5 0 .4.3.7.7.7.2 0 .3-.1.4-.2L8.2 14H22v-2H7.5c-.2 0-.5.1-.7.3-.3.2-.4.5-.3.7z"/>
                        </svg>
                        <div>**scraper**</div>
                      </div>
                    </th>
                  </>
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
                    field.key === 'driggs_address_species_note' ? 'border-b-4 border-b-black' : ''
                  } ${
                    field.key === 'driggs_country' ? 'border-b-4 border-b-black' : ''
                  } ${
                    field.key === 'driggs_cgig_id' ? 'border-b-4 border-b-black' : ''
                  } ${
                    field.key === 'driggs_industry' ? 'border-t-4 border-t-black' : ''
                  } ${
                    field.key === 'driggs_social_media_links' ? 'border-b-4 border-b-black' : ''
                  } ${
                    field.key === 'phone_section_separator' ? 'border-t-4 border-t-black' : ''
                  } ${
                    field.key === 'address_section_separator' ? 'border-t-4 border-t-black' : ''
                  } ${
                    field.key === 'backlinks_section_separator' ? 'border-t-4 border-t-black' : ''
                  } ${
                    field.key === 'basics_section_separator' ? 'border-t-4 border-t-black' : ''
                  } ${
                    field.key === 'misc_section_separator' ? 'border-t-4 border-t-black' : ''
                  }`}
                  style={{
                    // Prevent any checkbox interactions from affecting row background
                    backgroundColor: 'inherit'
                  }}
                >
                  {/* Field selection checkbox */}
                  <td 
                    className={`w-12 px-2 py-2 border-r border-gray-300 ${
                      field.type === 'section_header' ? (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? '' : 'bg-gray-100') : 'cursor-pointer'
                    }`}
                    style={field.type === 'section_header' && (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator') ? { backgroundColor: '#dddddd' } : {}}
                    onClick={() => field.type !== 'section_header' && handleFieldSelect(field.key)}
                  >
                    <div className="flex items-center justify-center">
                      {field.type !== 'section_header' && (
                        <input
                          type="checkbox"
                          checked={selectedFields.has(field.key)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </td>

                  {/* New dp columns */}
                  <td className="border-r border-gray-300" style={{ 
                    padding: '0', 
                    margin: '0', 
                    width: '10px', 
                    minWidth: '10px', 
                    maxWidth: '10px',
                    backgroundColor: (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator') ? '#dddddd' : 'transparent'
                  }}>
                  </td>
                  <td className="border-r border-gray-300" style={{ 
                    padding: '0', 
                    margin: '0', 
                    width: '10px', 
                    minWidth: '10px', 
                    maxWidth: '10px',
                    backgroundColor: (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator') ? '#dddddd' : 'transparent'
                  }}>
                  </td>
                  <td className="border-r border-gray-300" style={{ 
                    padding: '0', 
                    margin: '0', 
                    width: '10px', 
                    minWidth: '10px', 
                    maxWidth: '10px',
                    backgroundColor: (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator') ? '#dddddd' : 'transparent'
                  }}>
                  </td>
                  <td className="border-r border-gray-300" style={{ 
                    padding: '0', 
                    margin: '0', 
                    width: '10px', 
                    minWidth: '10px', 
                    maxWidth: '10px',
                    backgroundColor: (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator') ? '#dddddd' : 'transparent'
                  }}>
                  </td>
                  <td className="border-r border-gray-300" style={{ 
                    padding: '0', 
                    margin: '0', 
                    width: '10px', 
                    minWidth: '10px', 
                    maxWidth: '10px',
                    backgroundColor: (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator') ? '#dddddd' : (field.key === 'driggs_social_media_links' || field.key === 'driggs_special_note_for_ai_tool' ? '#dddddd' : (field.key === 'driggs_short_descr' || field.key === 'driggs_long_descr' ? '#fff7a1' : (['id', 'created_at', 'updated_at', 'fk_users_id', 'true_root_domain', 'full_subdomain', 'webproperty_type', 'ns_full', 'ip_address', 'is_wp_site', 'wpuser1', 'wppass1', 'wp_plugin_installed1', 'wp_plugin_connected2', 'wp_rest_app_pass', 'fk_domreg_hostaccount', 'is_starred1', 'icon_name', 'icon_color', 'is_bulldozer', 'is_competitor', 'is_external', 'is_internal', 'is_ppx', 'is_ms', 'is_wayback_rebuild', 'is_naked_wp_build', 'is_rnr', 'is_aff', 'is_other1', 'is_other2', 'is_flylocal'].includes(field.key) ? '#dfdfdf' : 'transparent')))
                  }}>
                  </td>

                  {/* Field name */}
                  <td className={`px-3 py-2 text-sm font-medium ${
                    field.type === 'section_header' ? (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? 'font-bold' : 'bg-gray-100 font-bold') : 'text-gray-900'
                  }`}
                  style={{ 
                    borderRight: '2px solid black',
                    ...(field.type === 'section_header' && (field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator') ? { backgroundColor: '#dddddd', color: '#111827' } : {})
                  }}>
                    <span>{field.label}</span>
                  </td>

                  {/* Site value cells */}
                  {paginatedSites.map((site, index) => {
                    const value = site[field.key];
                    const isEditing = editingCell?.field === field.key && editingCell?.siteId === site.id;
                    const isDropdownOpen = platformDropdownOpen?.field === field.key && platformDropdownOpen?.siteId === site.id;
                    const hasValue = value !== null && value !== undefined && value !== '';

                    if (field.type === 'section_header') {
                      return (
                        <>
                          <td 
                            key={`${field.key}-${site.id}`} 
                            className={`px-3 py-2 text-sm font-bold text-gray-900 w-48 border-r border-gray-300 ${
                              field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? '' : 'bg-gray-100'
                            }`}
                            style={field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? { backgroundColor: '#dddddd' } : {}}
                          >
                            {field.label}
                          </td>
                          {/* Status column for section headers */}
                          <td 
                            key={`${field.key}-${site.id}-status`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ width: '50px', minWidth: '50px', maxWidth: '50px', backgroundColor: field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? '#dddddd' : '' }}
                          >
                          </td>
                          {/* Exclude from WP column for section headers */}
                          <td 
                            key={`${field.key}-${site.id}-excl-wp`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ width: '12px', minWidth: '12px', maxWidth: '12px', backgroundColor: field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? '#dddddd' : '' }}
                          >
                          </td>
                          {/* Exclude from FE column for section headers */}
                          <td 
                            key={`${field.key}-${site.id}-excl-fe`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ width: '12px', minWidth: '12px', maxWidth: '12px', backgroundColor: field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? '#dddddd' : '' }}
                          >
                          </td>
                          {/* Vacuum column for section headers */}
                          <td 
                            key={`${field.key}-${site.id}-vacuum`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ backgroundColor: field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? '#dddddd' : '' }}
                          >
                          </td>
                          {/* Scraper column for section headers */}
                          <td 
                            key={`${field.key}-${site.id}-scraper`}
                            className="px-1 py-2 text-center"
                            style={{ borderRight: '3px solid black', backgroundColor: field.key === 'phone_section_separator' || field.key === 'address_section_separator' || field.key === 'backlinks_section_separator' || field.key === 'basics_section_separator' || field.key === 'misc_section_separator' ? '#dddddd' : '' }}
                          >
                          </td>
                        </>
                      );
                    }

                    if (field.type === 'boolean') {
                      return (
                        <>
                          <td 
                            key={`${field.key}-${site.id}`} 
                            className="px-3 py-2 text-sm text-gray-900 w-48 border-r border-gray-300"
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
                          {/* Status column for boolean fields */}
                          <td 
                            key={`${field.key}-${site.id}-status`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                          >
                            <div className="flex items-center justify-center">
                              {hasValue ? (
                                <span className="text-green-600 font-bold text-lg">✓</span>
                              ) : (
                                <span className="text-red-600 font-bold text-lg">✗</span>
                              )}
                            </div>
                          </td>
                          {/* Exclude from WP column for boolean fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-wp`}
                            checked={excludeFromWpData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from WP data
                              console.log('WP checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromWpData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-wp', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from WP:', error);
                                // Revert local state on error
                                setExcludeFromWpData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Exclude from FE column for boolean fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-fe`}
                            checked={excludeFromFeData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from FE data
                              console.log('FE checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromFeData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-frontend', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from FE:', error);
                                // Revert local state on error
                                setExcludeFromFeData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Vacuum column for boolean fields */}
                          <td 
                            key={`${field.key}-${site.id}-vacuum`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                          >
                            <VacuumZarpscrapeCell
                              value={vacuumData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteVacuumField}
                              isBoolean={true}
                            />
                          </td>
                          {/* Scraper column for boolean fields */}
                          <td 
                            key={`${field.key}-${site.id}-scraper`}
                            className="px-1 py-2 text-center"
                            style={{ borderRight: '3px solid black' }}
                          >
                            <VacuumZarpscrapeCell
                              value={zarpscrapesData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteZarpscrapeField}
                              isBoolean={true}
                            />
                          </td>
                        </>
                      );
                    }

                    if (field.type === 'platform_dropdown') {
                      return (
                        <>
                          <td
                            key={`${field.key}-${site.id}`}
                            className="px-3 py-2 text-sm text-gray-900 relative w-80 border-r border-gray-300"
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
                                {platformsLoading ? (
                                  <div className="text-center py-4 text-gray-500">
                                    <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2"></div>
                                    <div>Loading platforms...</div>
                                  </div>
                                ) : callPlatforms.length > 0 ? (
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
                          {/* Status column for platform_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-status`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                          >
                            <div className="flex items-center justify-center">
                              {hasValue ? (
                                <span className="text-green-600 font-bold text-lg">✓</span>
                              ) : (
                                <span className="text-red-600 font-bold text-lg">✗</span>
                              )}
                            </div>
                          </td>
                          {/* Exclude from WP column for platform_dropdown fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-wp`}
                            checked={excludeFromWpData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from WP data
                              console.log('WP checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromWpData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-wp', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from WP:', error);
                                // Revert local state on error
                                setExcludeFromWpData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Exclude from FE column for platform_dropdown fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-fe`}
                            checked={excludeFromFeData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from FE data
                              console.log('FE checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromFeData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-frontend', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from FE:', error);
                                // Revert local state on error
                                setExcludeFromFeData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Vacuum column for platform_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-vacuum`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                          >
                            <VacuumZarpscrapeCell
                              value={vacuumData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteVacuumField}
                            />
                          </td>
                          {/* Scraper column for platform_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-scraper`}
                            className="px-1 py-2 text-center"
                            style={{ borderRight: '3px solid black' }}
                          >
                            <VacuumZarpscrapeCell
                              value={zarpscrapesData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteZarpscrapeField}
                            />
                          </td>
                        </>
                      );
                    }

                    if (field.type === 'address_species_dropdown') {
                      const isAddressSpeciesDropdownOpen = addressSpeciesDropdownOpen?.field === field.key && addressSpeciesDropdownOpen?.siteId === site.id;
                      return (
                        <>
                          <td
                            key={`${field.key}-${site.id}`}
                            className="px-3 py-2 text-sm text-gray-900 relative w-96 border-r border-gray-300"
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
                                {addressSpeciesLoading ? (
                                  <div className="text-center py-4 text-gray-500">
                                    <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2"></div>
                                    <div>Loading address species...</div>
                                  </div>
                                ) : addressSpecies.length > 0 ? (
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
                          {/* Status column for address_species_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-status`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                          >
                            <div className="flex items-center justify-center">
                              {hasValue ? (
                                <span className="text-green-600 font-bold text-lg">✓</span>
                              ) : (
                                <span className="text-red-600 font-bold text-lg">✗</span>
                              )}
                            </div>
                          </td>
                          {/* Exclude from WP column for address_species_dropdown fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-wp`}
                            checked={excludeFromWpData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from WP data
                              console.log('WP checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromWpData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-wp', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from WP:', error);
                                // Revert local state on error
                                setExcludeFromWpData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Exclude from FE column for address_species_dropdown fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-fe`}
                            checked={excludeFromFeData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from FE data
                              console.log('FE checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromFeData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-frontend', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from FE:', error);
                                // Revert local state on error
                                setExcludeFromFeData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Vacuum column for address_species_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-vacuum`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                          >
                            <VacuumZarpscrapeCell
                              value={vacuumData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteVacuumField}
                            />
                          </td>
                          {/* Scraper column for address_species_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-scraper`}
                            className="px-1 py-2 text-center"
                            style={{ borderRight: '3px solid black' }}
                          >
                            <VacuumZarpscrapeCell
                              value={zarpscrapesData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteZarpscrapeField}
                            />
                          </td>
                        </>
                      );
                    }

                    if (field.type === 'cgig_dropdown') {
                      const isCgigDropdownOpen = cgigDropdownOpen?.field === field.key && cgigDropdownOpen?.siteId === site.id;
                      return (
                        <>
                          <td
                            key={`${field.key}-${site.id}`}
                            className="px-3 py-2 text-sm text-gray-900 relative w-96 border-r border-gray-300"
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
                                {citationGigsLoading ? (
                                  <div className="text-center py-4 text-gray-500">
                                    <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2"></div>
                                    <div>Loading citation gigs...</div>
                                  </div>
                                ) : citationGigs.length > 0 ? (
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
                          {/* Status column for cgig_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-status`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                            style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                          >
                            <div className="flex items-center justify-center">
                              {hasValue ? (
                                <span className="text-green-600 font-bold text-lg">✓</span>
                              ) : (
                                <span className="text-red-600 font-bold text-lg">✗</span>
                              )}
                            </div>
                          </td>
                          {/* Exclude from WP column for cgig_dropdown fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-wp`}
                            checked={excludeFromWpData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from WP data
                              console.log('WP checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromWpData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-wp', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from WP:', error);
                                // Revert local state on error
                                setExcludeFromWpData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Exclude from FE column for cgig_dropdown fields */}
                          <CheckboxCell
                            key={`${field.key}-${site.id}-excl-fe`}
                            checked={excludeFromFeData.get(site.id)?.[field.key] || false}
                            fieldKey={field.key}
                            siteId={site.id}
                            onChange={async (siteId, fieldKey, checked) => {
                              // Update exclude from FE data
                              console.log('FE checkbox changed:', fieldKey, siteId, checked);
                              
                              // Update local state immediately for responsive UI
                              setExcludeFromFeData(prev => {
                                const newMap = new Map(prev);
                                const siteData = newMap.get(siteId) || { id: siteId };
                                siteData[fieldKey] = checked;
                                newMap.set(siteId, siteData);
                                return newMap;
                              });

                              // Update database
                              try {
                                const response = await fetch('/api/exclude-from-frontend', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    siteId,
                                    fieldKey,
                                    checked
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to update database');
                                }
                              } catch (error) {
                                console.error('Error updating exclude from FE:', error);
                                // Revert local state on error
                                setExcludeFromFeData(prev => {
                                  const newMap = new Map(prev);
                                  const siteData = newMap.get(siteId) || { id: siteId };
                                  siteData[fieldKey] = !checked;
                                  newMap.set(siteId, siteData);
                                  return newMap;
                                });
                              }
                            }}
                          />
                          {/* Vacuum column for cgig_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-vacuum`}
                            className="px-1 py-2 text-center border-r border-gray-300"
                          >
                            <VacuumZarpscrapeCell
                              value={vacuumData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteVacuumField}
                            />
                          </td>
                          {/* Scraper column for cgig_dropdown fields */}
                          <td 
                            key={`${field.key}-${site.id}-scraper`}
                            className="px-1 py-2 text-center"
                            style={{ borderRight: '3px solid black' }}
                          >
                            <VacuumZarpscrapeCell
                              value={zarpscrapesData.get(site.id)?.[field.key]}
                              fieldKey={field.key}
                              siteId={site.id}
                              onDelete={deleteZarpscrapeField}
                            />
                          </td>
                        </>
                      );
                    }

                    return (
                      <>
                        <td
                          key={`${field.key}-${site.id}`}
                          className={`px-3 py-2 text-sm text-gray-900 border-r border-gray-300 ${
                            field.key === 'driggs_phone_1' ? 'w-80' : (fieldDefinitions.find(f => f.key === field.key)?.type === 'readonly' || fieldDefinitions.find(f => f.key === field.key)?.type === 'section_header' ? 'w-48' : 'cursor-pointer w-48')
                          } ${
                            field.key === 'driggs_brand_name' && isEditing ? 'border-2 border-blue-500' : ''
                          }`}
                          onClick={() => field.key !== 'driggs_phone_1' && fieldDefinitions.find(f => f.key === field.key)?.type !== 'readonly' && fieldDefinitions.find(f => f.key === field.key)?.type !== 'section_header' && !isEditing && handleCellClick(field.key, site.id, value)}
                        >
                        {field.key === 'driggs_phone_1' ? (
                          <div className="flex items-center space-x-1">
                            <div 
                              className={fieldDefinitions.find(f => f.key === field.key)?.type === 'readonly' || fieldDefinitions.find(f => f.key === field.key)?.type === 'section_header' ? '' : 'cursor-pointer'}
                              onClick={() => fieldDefinitions.find(f => f.key === field.key)?.type !== 'readonly' && fieldDefinitions.find(f => f.key === field.key)?.type !== 'section_header' && !isEditing && handleCellClick(field.key, site.id, value)}
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
                                  placeholder={fieldDefinitions.find(f => f.key === field.key)?.placeholder || ''}
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
                                    placeholder={fieldDefinitions.find(f => f.key === field.key)?.placeholder || ''}
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
                                  placeholder={fieldDefinitions.find(f => f.key === field.key)?.placeholder || ''}
                                  className={`w-full px-2 py-1 rounded focus:outline-none focus:ring-1 ${
                                    field.key === 'driggs_brand_name' ? 'border-none focus:ring-0' : 'border border-blue-500 focus:ring-blue-500'
                                  }`}
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
                        {/* Status column for default fields */}
                        <td 
                          key={`${field.key}-${site.id}-status`}
                          className="px-1 py-2 text-center border-r border-gray-300"
                          style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                        >
                          <div className="flex items-center justify-center">
                            {hasValue ? (
                              <span className="text-green-600 font-bold text-lg">✓</span>
                            ) : (
                              <span className="text-red-600 font-bold text-lg">✗</span>
                            )}
                          </div>
                        </td>
                        {/* Exclude from WP column for default fields */}
                        <CheckboxCell
                          key={`${field.key}-${site.id}-excl-wp`}
                          checked={excludeFromWpData.get(site.id)?.[field.key] || false}
                          fieldKey={field.key}
                          siteId={site.id}
                          onChange={async (siteId, fieldKey, checked) => {
                            // Update exclude from WP data
                            console.log('WP checkbox changed:', fieldKey, siteId, checked);
                            
                            // Update local state immediately for responsive UI
                            setExcludeFromWpData(prev => {
                              const newMap = new Map(prev);
                              const existingData = newMap.get(siteId) || { id: siteId };
                              newMap.set(siteId, { ...existingData, [fieldKey]: checked });
                              return newMap;
                            });
                            
                            try {
                              const response = await fetch('/api/exclude-from-wp', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  siteId,
                                  fieldKey,
                                  checked
                                })
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to update WP exclusion');
                              }
                            } catch (error) {
                              console.error('Error updating WP exclusion:', error);
                              // Rollback local state on error
                              setExcludeFromWpData(prev => {
                                const newMap = new Map(prev);
                                const existingData = newMap.get(siteId) || { id: siteId };
                                newMap.set(siteId, { ...existingData, [fieldKey]: !checked });
                                return newMap;
                              });
                            }
                          }}
                        />
                        {/* Exclude from FE column for default fields */}
                        <CheckboxCell
                          key={`${field.key}-${site.id}-excl-fe`}
                          checked={excludeFromFeData.get(site.id)?.[field.key] || false}
                          fieldKey={field.key}
                          siteId={site.id}
                          onChange={async (siteId, fieldKey, checked) => {
                            // Update exclude from FE data
                            console.log('FE checkbox changed:', fieldKey, siteId, checked);
                            
                            // Update local state immediately for responsive UI
                            setExcludeFromFeData(prev => {
                              const newMap = new Map(prev);
                              const existingData = newMap.get(siteId) || { id: siteId };
                              newMap.set(siteId, { ...existingData, [fieldKey]: checked });
                              return newMap;
                            });
                            
                            try {
                              const response = await fetch('/api/exclude-from-frontend', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  siteId,
                                  fieldKey,
                                  checked
                                })
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to update FE exclusion');
                              }
                            } catch (error) {
                              console.error('Error updating FE exclusion:', error);
                              // Rollback local state on error
                              setExcludeFromFeData(prev => {
                                const newMap = new Map(prev);
                                const existingData = newMap.get(siteId) || { id: siteId };
                                newMap.set(siteId, { ...existingData, [fieldKey]: !checked });
                                return newMap;
                              });
                            }
                          }}
                        />
                        {/* Vacuum column for default fields */}
                        <td 
                          key={`${field.key}-${site.id}-vacuum`}
                          className="px-1 py-2 text-center border-r border-gray-300"
                        >
                          <input
                            type="text"
                            className="w-full h-6 px-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder=""
                          />
                        </td>
                        {/* Scraper column for default fields */}
                        <td 
                          key={`${field.key}-${site.id}-scraper`}
                          className="px-1 py-2 text-center"
                          style={{ borderRight: '3px solid black' }}
                        >
                          <VacuumZarpscrapeCell
                            value={zarpscrapesData.get(site.id)?.[field.key]}
                            fieldKey={field.key}
                            siteId={site.id}
                            onDelete={deleteZarpscrapeField}
                          />
                        </td>
                      </>
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


      {/* Driggspack Popup */}
      {driggspackPopup && (
        <div
            data-driggspack-popup
            className="fixed z-50 bg-white shadow-2xl border border-gray-300"
            style={{
              top: '10px',
              left: '10px',
              width: 'calc(100vw - 20px)',
              height: 'calc(100vh - 20px)'
            }}
          >
            {/* Close Button */}
            <div
              className="absolute cursor-pointer flex items-center justify-center bg-gray-400 hover:bg-gray-500 transition-colors"
              style={{
                top: '20px',
                right: '20px',
                width: '100px',
                height: '100px'
              }}
              onClick={() => setDriggspackPopup(null)}
            >
              <div className="text-white text-4xl font-bold select-none">×</div>
            </div>
            
            {/* Popup Content */}
            <div className="p-4 h-full overflow-auto">
              {/* Top section with title, medallion, and chatdori (for zz3 only) */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <h2 className="text-base font-bold text-gray-900">
                    {driggspackPopup.type}
                  </h2>
                  
                  {/* DriggsPackMedallion for this popup instance */}
                  <div>
                    <DriggsPackMedallion 
                      driggspackNumber={driggspackPopup.type === 'zz1' ? 1 : driggspackPopup.type === 'zz2' ? 2 : 3}
                      siteId={driggspackPopup.siteId}
                      onZzClick={handleDriggspackClick}
                    />
                  </div>
                </div>
                
                {/* Chatdori component - only for zz3 popup */}
                {driggspackPopup.type === 'zz3' && (
                  <div>
                    <Chatdori />
                  </div>
                )}
              </div>
              
              {/* Get sitespren DB fields button - only for zz3 popup */}
              {driggspackPopup.type === 'zz3' && (
                <div className="mb-6">
                  <button
                    onClick={handleGetSitesprenFields}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
                  >
                    get all sitespren db fields
                  </button>
                </div>
              )}

              {/* Get driggsman display fields button - only for zz3 popup */}
              {driggspackPopup.type === 'zz3' && (
                <div className="mb-6">
                  <button
                    onClick={handleGetDriggsmanDisplayFields}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium"
                  >
                    get all fields in order from /driggsman display
                  </button>
                </div>
              )}
              
              {/* /dpackjar Navigation Button */}
              <div className="mb-6">
                <Link 
                  href="/dpackjar" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 transition-colors rounded cursor-pointer"
                  style={{ fontSize: '16px' }}
                  onMouseDown={(e) => {
                    // Force open in new tab regardless of click type
                    if (e.button === 1) { // Middle click
                      e.preventDefault();
                      window.open('/dpackjar', '_blank', 'noopener,noreferrer');
                    }
                  }}
                  onClick={(e) => {
                    // For regular left click, let the Link component handle it with target="_blank"
                    // But we can also force it if needed
                    e.preventDefault();
                    window.open('/dpackjar', '_blank', 'noopener,noreferrer');
                  }}
                >
                  /dpackjar
                </Link>
              </div>
              
              {/* driggs-pack-main-tub */}
              <div className="driggs-pack-main-tub mt-6" style={{ border: '1px solid black' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', padding: '8px' }}>
                  driggs-pack-main-tub
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', paddingLeft: '8px', paddingRight: '8px' }}>
                  driggs_packs_ui_table
                </div>
                
                {/* DriggsPacksTable Component */}
                <div style={{ padding: '8px' }}>
                  <DriggsPacksTable />
                </div>
              </div>
              
              {/* krexport-main-box */}
              <div className="krexport-main-box" style={{ border: '1px solid black' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', padding: '8px' }}>
                  krexport-main-box
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', paddingLeft: '8px', paddingRight: '8px' }}>
                  krexport_ui_table
                </div>
                
                <table style={{ 
                  borderCollapse: 'collapse',
                  border: '1px solid gray',
                  width: '100%',
                  margin: '8px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'gray' }}>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">1</div>
                      </th>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">2</div>
                      </th>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">3</div>
                      </th>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">4</div>
                      </th>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">5</div>
                      </th>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">6</div>
                      </th>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">7</div>
                      </th>
                      <th style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="th-inner-wrapper-div">8</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">A</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">B</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">C</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                      <td style={{ border: '1px solid gray', padding: '3px' }}>
                        <div className="td-inner-wrapper-div">-</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Additional content will be added here later */}
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

      {/* Copy Actions Feedback */}
      <DriggsActionsFeedback
        isVisible={showCopyFeedback}
        message={copyFeedbackMessage}
        onComplete={handleCopyFeedbackComplete}
      />

      {/* Domain Registrar Popup */}
      {registrarPopupOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Domain Registrar Host Account
              </h3>
              <button
                onClick={() => setRegistrarPopupOpen(null)}
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
                    onClick={() => updateDomainRegistrar(registrarPopupOpen, null)}
                  >
                    <div className="flex items-center flex-1">
                      <div className="w-3 bg-gray-300"></div>
                      <div className="flex-1 px-3">
                        <span className="text-sm font-medium text-gray-500">No Registrar</span>
                        <div className="text-xs text-gray-400">Clear current assignment</div>
                      </div>
                    </div>
                  </div>

                  {/* Host account options */}
                  {allHostAccounts.map((account) => (
                    <div
                      key={account.host_account_id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => updateDomainRegistrar(registrarPopupOpen, account.host_account_id)}
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
                onClick={() => setRegistrarPopupOpen(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}