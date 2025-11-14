'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LeadSmartJettisonTable from '@/app/components/leadsmart/LeadSmartJettisonTable';
import LeadSmartSkylabTileTables from '@/app/components/leadsmart/LeadSmartSkylabTileTables';
import FrostySelectorPopup from '../leadsmart_tank/components/FrostySelectorPopup';
import dynamic from 'next/dynamic';

const ZhedoriButtonBar = dynamic(
  () => import('@/app/components/ZhedoriButtonBar'),
  { ssr: false }
);

const BezelButton = dynamic(
  () => import('@/app/components/bezel-visibility-system/BezelButton'),
  { ssr: false }
);

const StateManager = dynamic(
  () => import('./StateManager'),
  { ssr: false }
);

interface LeadsmartTransformed {
  mundial_id: number;
  baobab_attempt_id: number | null;
  jrel_release_id: number | null;
  jrel_subsheet_id: number | null;
  jrel_subpart_id: number | null;
  city_name: string | null;
  state_code: string | null;
  payout: number | null;
  aggregated_zip_codes: string[] | null;
  multiplied_payout_by_population: number | null;
  fk_city_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  city_population?: number | null;
  subsheet_kw_stub_1?: string | null;
  volume_kwtuber1?: number | null;
  cpc_kwtuber1?: number | null;
  yelp_kwtuber1?: number | null;
  volume_kwtuber2?: number | null;
  cpc_kwtuber2?: number | null;
  yelp_kwtuber2?: number | null;
}

export default function LeadsmartMorphClient() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Data state
  const [data, setData] = useState<LeadsmartTransformed[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentRowPage, setCurrentRowPage] = useState(1);
  const [colsPerPage, setColsPerPage] = useState(12);
  const [currentColPage, setCurrentColPage] = useState(1);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Editing state
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState<Partial<LeadsmartTransformed>>({});
  const [isSelectorPopupOpen, setIsSelectorPopupOpen] = useState(false);
  
  // Zip codes popup state
  const [zipCodesPopupOpen, setZipCodesPopupOpen] = useState(false);
  const [zipCodesPopupData, setZipCodesPopupData] = useState<string[]>([]);
  
  // Cities assignment popup state
  const [citiesAssignmentPopupOpen, setCitiesAssignmentPopupOpen] = useState(false);
  const [selectedBaobobAttemptForCities, setSelectedBaobobAttemptForCities] = useState<number | null>(null);
  const [cityMatchingInProgress, setCityMatchingInProgress] = useState(false);
  const [cityMatchingProgress, setCityMatchingProgress] = useState(0);
  const [cityMatchingStatus, setCityMatchingStatus] = useState<string>('');
  
  // Payout multiplier state
  const [multiplierConfirmStep, setMultiplierConfirmStep] = useState(0);
  const [multiplierProcessing, setMultiplierProcessing] = useState(false);
  const [multiplierProgress, setMultiplierProgress] = useState({ current: 0, total: 0 });
  const [multiplierOnlyBlank, setMultiplierOnlyBlank] = useState(true);
  const [multiplierOnlyFiltered, setMultiplierOnlyFiltered] = useState(false);
  const [multiplierResults, setMultiplierResults] = useState<{
    success: number;
    errors: number;
    skipped: number;
    missingCity: number;
    missingPayout: number;
    alreadyProcessed: number;
  } | null>(null);

  // Chamber visibility state (integrated with bezel system)
  const [mandibleChamberVisible, setMandibleChamberVisible] = useState(true);
  const [sinusChamberVisible, setSinusChamberVisible] = useState(true);
  const [cardioChamberVisible, setCardioChamberVisible] = useState(false);
  const [pecChamberVisible, setPecChamberVisible] = useState(true);
  const [rocketChamberVisible, setRocketChamberVisible] = useState(true);
  
  // Filter state for jettison table
  const [jettisonFilter, setJettisonFilter] = useState<{
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  }>({ type: null, id: null });
  
  // Filter state for skylab tile tables
  const [skylabFilter, setSkylabFilter] = useState<{
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  }>({ type: null, id: null });
  
  // Filter state for baobab attempts
  const [baobobFilter, setBaobobFilter] = useState<number | null>(null);
  const [baobobAttempts, setBaobobAttempts] = useState<any[]>([]);
  
  // City population filter state
  const [cityPopulationFilter, setCityPopulationFilter] = useState<string>('all');
  
  // City/State filter state
  const [cityStateFilterInput, setCityStateFilterInput] = useState<string>('');
  const [cityStateFilter, setCityStateFilter] = useState<{ city: string; state: string } | null>(null);
  
  // Column tooltip state
  const [columnTooltip, setColumnTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });
  
  // Pico cache rebuild state
  const [rebuildCacheFn, setRebuildCacheFn] = useState<(() => void) | null>(null);
  const [cacheRebuilding, setCacheRebuilding] = useState(false);
  const [cacheRebuildProgress, setCacheRebuildProgress] = useState(0);

  // Define all columns
  const allColumns = [
    'mundial_id',
    'baobab_attempt_id',
    'jrel_release_id',
    'jrel_subsheet_id',
    'jrel_subpart_id',
    'city_population',
    'city_name',
    'state_code',
    'payout',
    'aggregated_zip_codes',
    'multiplied_payout_by_population',
    'fk_city_id',
    'custom_kw_stub_city_state',
    'volume_kwtuber1',
    'cpc_kwtuber1',
    'yelp_kwtuber1',
    'custom_kw_stub_city',
    'volume_kwtuber2',
    'cpc_kwtuber2',
    'yelp_kwtuber2'
  ];

  // Initialize chamber visibility and filters from localStorage
  useEffect(() => {
    const savedMandible = localStorage.getItem('leadsmartMorph_mandibleChamberVisible');
    if (savedMandible !== null) {
      setMandibleChamberVisible(JSON.parse(savedMandible));
    }
    
    const savedSinus = localStorage.getItem('leadsmartMorph_sinusChamberVisible');
    if (savedSinus !== null) {
      setSinusChamberVisible(JSON.parse(savedSinus));
    }
    
    const savedCardio = localStorage.getItem('leadsmartMorph_cardioChamberVisible');
    if (savedCardio !== null) {
      setCardioChamberVisible(JSON.parse(savedCardio));
    } else {
      // Default to false (hidden) and save it
      setCardioChamberVisible(false);
      localStorage.setItem('leadsmartMorph_cardioChamberVisible', JSON.stringify(false));
    }
    
    const savedPec = localStorage.getItem('leadsmartMorph_pecChamberVisible');
    if (savedPec !== null) {
      setPecChamberVisible(JSON.parse(savedPec));
    }
    
    const savedRocket = localStorage.getItem('leadsmartMorph_rocketChamberVisible');
    if (savedRocket !== null) {
      setRocketChamberVisible(JSON.parse(savedRocket));
    } else {
      // Default to true (visible) and save it
      setRocketChamberVisible(true);
      localStorage.setItem('leadsmartMorph_rocketChamberVisible', JSON.stringify(true));
    }
    
    // Load saved filter states
    const savedCityPopFilter = localStorage.getItem('leadsmartMorph_cityPopulationFilter');
    if (savedCityPopFilter !== null) {
      setCityPopulationFilter(savedCityPopFilter);
    }
    
    const savedBaobobFilter = localStorage.getItem('leadsmartMorph_baobobFilter');
    if (savedBaobobFilter !== null) {
      setBaobobFilter(JSON.parse(savedBaobobFilter));
    }
    
    const savedJettisonFilter = localStorage.getItem('leadsmartMorph_jettisonFilter');
    if (savedJettisonFilter !== null) {
      setJettisonFilter(JSON.parse(savedJettisonFilter));
    }
    
    const savedSkylabFilter = localStorage.getItem('leadsmartMorph_skylabFilter');
    if (savedSkylabFilter !== null) {
      setSkylabFilter(JSON.parse(savedSkylabFilter));
    }
    
    const savedCityStateFilter = localStorage.getItem('leadsmartMorph_cityStateFilter');
    if (savedCityStateFilter !== null) {
      const parsed = JSON.parse(savedCityStateFilter);
      setCityStateFilter(parsed);
      if (parsed && parsed.city && parsed.state) {
        setCityStateFilterInput(`${parsed.city}, ${parsed.state}`);
      }
    }
  }, []);

  // Listen for chamber visibility changes from bezel system
  useEffect(() => {
    const handleChamberToggle = (event: CustomEvent) => {
      const { chamber, visible } = event.detail;
      
      switch (chamber) {
        case 'mandible_chamber':
          setMandibleChamberVisible(visible);
          break;
        case 'sinus_chamber':
          setSinusChamberVisible(visible);
          break;
        case 'cardio_chamber':
          setCardioChamberVisible(visible);
          break;
        case 'pec_chamber':
          setPecChamberVisible(visible);
          break;
        case 'rocket_chamber':
          setRocketChamberVisible(visible);
          break;
      }
    };

    window.addEventListener('leadsmartMorph-chamber-toggle', handleChamberToggle as EventListener);

    return () => {
      window.removeEventListener('leadsmartMorph-chamber-toggle', handleChamberToggle as EventListener);
    };
  }, []);

  // Fetch data from database (only on initial load)
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Only fetch if we haven't initially loaded data yet
    if (!hasInitiallyLoadedRef.current && !isFetchingRef.current) {
      hasInitiallyLoadedRef.current = true;
      fetchData();
    }
  }, [user, router]);
  
  // Load baobab attempts on mount
  useEffect(() => {
    if (user) {
      loadBaobobAttempts();
    }
  }, [user]);

  // Add refs to track fetching state and last fetch time
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const hasInitiallyLoadedRef = useRef(false);
  
  // Refetch when filters change (with debounce)
  useEffect(() => {
    // Only fetch if we have initially loaded data (to prevent fetching on mount)
    if (!hasInitiallyLoadedRef.current) return;
    
    const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
    // Only fetch if not currently fetching and at least 500ms since last fetch
    if (user && !isFetchingRef.current && timeSinceLastFetch > 500) {
      fetchData();
    }
  }, [jettisonFilter, skylabFilter, baobobFilter]);

  const loadBaobobAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('baobab_transform_attempts')
        .select('baobab_attempt_id, rows_processed, rows_inserted, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBaobobAttempts(data || []);
    } catch (err) {
      console.error('Error loading baobab attempts:', err);
    }
  };

  const fetchData = async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }
    
    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = Date.now();
      setLoading(true);
      
      let query = supabase
        .from('leadsmart_transformed')
        .select(`
          *,
          cities!fk_city_id (
            city_population
          ),
          leadsmart_subsheets!jrel_subsheet_id (
            kw_stub_1
          )
        `);
      
      let countQuery = supabase
        .from('leadsmart_transformed')
        .select('*', { count: 'exact', head: true });
      
      // Apply jettison filter if active
      if (jettisonFilter && jettisonFilter.type && jettisonFilter.id) {
        if (jettisonFilter.type === 'release') {
          query = query.eq('jrel_release_id', jettisonFilter.id);
          countQuery = countQuery.eq('jrel_release_id', jettisonFilter.id);
        } else if (jettisonFilter.type === 'subsheet') {
          query = query.eq('jrel_subsheet_id', jettisonFilter.id);
          countQuery = countQuery.eq('jrel_subsheet_id', jettisonFilter.id);
        } else if (jettisonFilter.type === 'subpart') {
          query = query.eq('jrel_subpart_id', jettisonFilter.id);
          countQuery = countQuery.eq('jrel_subpart_id', jettisonFilter.id);
        }
      }
      
      // Apply skylab filter if active
      if (skylabFilter && skylabFilter.type && skylabFilter.id) {
        if (skylabFilter.type === 'release') {
          query = query.eq('jrel_release_id', skylabFilter.id);
          countQuery = countQuery.eq('jrel_release_id', skylabFilter.id);
        } else if (skylabFilter.type === 'subsheet') {
          query = query.eq('jrel_subsheet_id', skylabFilter.id);
          countQuery = countQuery.eq('jrel_subsheet_id', skylabFilter.id);
        } else if (skylabFilter.type === 'subpart') {
          query = query.eq('jrel_subpart_id', skylabFilter.id);
          countQuery = countQuery.eq('jrel_subpart_id', skylabFilter.id);
        }
      }
      
      // Apply baobab attempt filter if active
      if (baobobFilter) {
        query = query.eq('baobab_attempt_id', baobobFilter);
        countQuery = countQuery.eq('baobab_attempt_id', baobobFilter);
      }
      
      query = query.order('mundial_id', { ascending: false });
      
      // Apply reasonable limits to prevent timeout
      const hasNoFilters = !jettisonFilter?.type && !skylabFilter?.type && !baobobFilter;
      if (hasNoFilters) {
        query = query.limit(5000); // Reasonable limit when NO filters applied
        console.log('Applied 5k limit - no filters active');
      } else if (baobobFilter) {
        // When baobab filter is active, no limit applied - load all matching rows
        console.log('No limit applied - baobab filter active:', baobobFilter);
      } else {
        // When jettison/skylab filters active, no limit applied - load all matching rows
        console.log('No limit applied - jettison/skylab filters active:', { jettisonFilter, skylabFilter });
      }
      
      // Execute both queries in parallel
      const [{ data: fetchedData, error: fetchError }, { count, error: countError }] = await Promise.all([
        query,
        countQuery
      ]);
      
      console.log('Fetched data count:', fetchedData?.length);
      console.log('Total database count:', count);
      
      // Debug: Check the first row to see what's being returned
      if (fetchedData && fetchedData.length > 0) {
        console.log('Sample row structure:', {
          jrel_subsheet_id: fetchedData[0].jrel_subsheet_id,
          leadsmart_subsheets: fetchedData[0].leadsmart_subsheets,
          cities: fetchedData[0].cities
        });
        // Additional debug for first 3 rows
        console.log('First 3 rows with subsheet data:', fetchedData.slice(0, 3).map(row => ({
          mundial_id: row.mundial_id,
          jrel_subsheet_id: row.jrel_subsheet_id,
          leadsmart_subsheets: row.leadsmart_subsheets,
          city_name: row.city_name,
          state_code: row.state_code
        })));
      }

      if (fetchError) throw fetchError;
      if (countError) throw countError;

      // Process the data to flatten city population and kw_stub_1 from the joined tables
      const processedData = (fetchedData || []).map(row => ({
        ...row,
        city_population: row.cities?.city_population || null,
        subsheet_kw_stub_1: row.leadsmart_subsheets?.kw_stub_1 || null
      }));


      setData(processedData);
      setTotalCount(count || 0);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };
  
  const handleJettisonFilterChange = (filterType: 'release' | 'subsheet' | 'subpart' | null, filterId: number | null) => {
    const newFilter = { type: filterType, id: filterId };
    setJettisonFilter(newFilter);
    localStorage.setItem('leadsmartMorph_jettisonFilter', JSON.stringify(newFilter));
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const afterSearchFilter = data
    .filter(row => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        row.city_name?.toLowerCase().includes(searchLower) ||
        row.state_code?.toLowerCase().includes(searchLower) ||
        (typeof row.aggregated_zip_codes === 'string' && row.aggregated_zip_codes.toLowerCase().includes(searchLower)) ||
        (Array.isArray(row.aggregated_zip_codes) && row.aggregated_zip_codes.some(zip => zip.toLowerCase().includes(searchLower))) ||
        row.payout?.toString().includes(searchLower)
      );
    });

    const afterCityStateFilter = afterSearchFilter.filter(row => {
      // Apply city/state filter
      if (cityStateFilter && cityStateFilter.city && cityStateFilter.state) {
        const rowCity = row.city_name?.toLowerCase().trim() || '';
        const rowState = row.state_code?.toLowerCase().trim() || '';
        const filterCity = cityStateFilter.city.toLowerCase().trim();
        const filterState = cityStateFilter.state.toLowerCase().trim();
        
        // Check for exact match
        const cityMatch = rowCity === filterCity;
        const stateMatch = rowState === filterState;
        
        return cityMatch && stateMatch;
      }
      return true;
    });

    const afterPopulationFilter = afterCityStateFilter.filter(row => {
      // Apply city population filter
      const population = row.city_population;
      
      switch (cityPopulationFilter) {
        case '49k-67k':
          return population != null && population >= 49000 && population <= 67000;
        case '67k-85k':
          return population != null && population >= 67001 && population <= 85000;
        case '85k-100k':
          return population != null && population >= 85001 && population <= 100000;
        case '100k-125k':
          return population != null && population >= 100001 && population <= 125000;
        case '125k-175k':
          return population != null && population >= 125001 && population <= 175000;
        case '175k-300k':
          return population != null && population >= 175001 && population <= 300000;
        case '300k-600k':
          return population != null && population >= 300001 && population <= 600000;
        case '600k-up':
          return population != null && population >= 600001;
        case '50k-400k':
          return population != null && population >= 50000 && population <= 400000;
        case '75k-325k':
          return population != null && population >= 75000 && population <= 325000;
        case 'no-null-zero':
          return population != null && population >= 1;
        case 'all':
        default:
          return true;
      }
    });

    const sortedData = afterPopulationFilter
    .sort((a, b) => {
      if (!sortColumn) {
        return 0;
      }

      const aValue = a[sortColumn as keyof LeadsmartTransformed];
      const bValue = b[sortColumn as keyof LeadsmartTransformed];
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      
      // Special handling for numeric columns - treat nulls as lowest values
      if (sortColumn === 'city_population' || sortColumn === 'multiplied_payout_by_population') {
        if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
      } else {
        // Default null handling for other columns
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      }
      
      // Handle number sorting (for payout, city_population, and multiplied_payout_by_population)
      if (sortColumn === 'payout' || sortColumn === 'city_population' || sortColumn === 'multiplied_payout_by_population') {
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string sorting
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedData;
  }, [data, searchTerm, cityStateFilter, cityPopulationFilter, sortColumn, sortDirection]);

  // Paginate rows
  const totalRowPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentRowPage - 1) * rowsPerPage,
    currentRowPage * rowsPerPage
  );

  // Paginate columns (exclude checkbox column)
  const totalColPages = Math.ceil(allColumns.length / colsPerPage);
  const paginatedColumns = allColumns.slice(
    (currentColPage - 1) * colsPerPage,
    currentColPage * colsPerPage
  );

  // Handle row page navigation with infinite cycling
  const handleRowPagePrev = () => {
    setCurrentRowPage(prev => prev === 1 ? totalRowPages : prev - 1);
  };

  const handleRowPageNext = () => {
    setCurrentRowPage(prev => prev === totalRowPages ? 1 : prev + 1);
  };

  // Handle column page navigation with infinite cycling
  const handleColPagePrev = () => {
    setCurrentColPage(prev => prev === 1 ? totalColPages : prev - 1);
  };

  const handleColPageNext = () => {
    setCurrentColPage(prev => prev === totalColPages ? 1 : prev + 1);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.mundial_id)));
    }
  };

  // Handle individual row selection
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle column sorting
  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };
  
  // Handle loading state from URL
  const handleLoadState = (state: any) => {
    if (!state) return;
    
    // Apply all state values
    if (state.rowsPerPage !== undefined) setRowsPerPage(state.rowsPerPage);
    if (state.currentRowPage !== undefined) setCurrentRowPage(state.currentRowPage);
    if (state.colsPerPage !== undefined) setColsPerPage(state.colsPerPage);
    if (state.currentColPage !== undefined) setCurrentColPage(state.currentColPage);
    if (state.sortColumn !== undefined) setSortColumn(state.sortColumn);
    if (state.sortDirection !== undefined) setSortDirection(state.sortDirection);
    if (state.searchTerm !== undefined) setSearchTerm(state.searchTerm);
    if (state.jettisonFilter !== undefined) setJettisonFilter(state.jettisonFilter);
    if (state.skylabFilter !== undefined) setSkylabFilter(state.skylabFilter);
    if (state.baobobFilter !== undefined) setBaobobFilter(state.baobobFilter);
    if (state.cityPopulationFilter !== undefined) setCityPopulationFilter(state.cityPopulationFilter);
    if (state.cityStateFilter !== undefined) setCityStateFilter(state.cityStateFilter);
    if (state.cityStateFilterInput !== undefined) setCityStateFilterInput(state.cityStateFilterInput);
    if (state.multiplierOnlyBlank !== undefined) setMultiplierOnlyBlank(state.multiplierOnlyBlank);
    if (state.multiplierOnlyFiltered !== undefined) setMultiplierOnlyFiltered(state.multiplierOnlyFiltered);
    if (state.mandibleChamberVisible !== undefined) setMandibleChamberVisible(state.mandibleChamberVisible);
    if (state.sinusChamberVisible !== undefined) setSinusChamberVisible(state.sinusChamberVisible);
    if (state.cardioChamberVisible !== undefined) setCardioChamberVisible(state.cardioChamberVisible);
    if (state.pecChamberVisible !== undefined) setPecChamberVisible(state.pecChamberVisible);
    if (state.rocketChamberVisible !== undefined) setRocketChamberVisible(state.rocketChamberVisible);
  };
  
  // Get current state for saving
  const getCurrentState = () => ({
    rowsPerPage,
    currentRowPage,
    colsPerPage,
    currentColPage,
    sortColumn,
    sortDirection,
    searchTerm,
    jettisonFilter,
    skylabFilter,
    baobobFilter,
    cityPopulationFilter,
    cityStateFilter,
    cityStateFilterInput,
    multiplierOnlyBlank,
    multiplierOnlyFiltered,
    mandibleChamberVisible,
    sinusChamberVisible,
    cardioChamberVisible,
    pecChamberVisible,
    rocketChamberVisible
  });

  // Handle payout multiplication by population
  const runPayoutMultiplier = async () => {
    try {
      setMultiplierProcessing(true);
      setMultiplierConfirmStep(0); // Close confirmation dialog immediately
      setMultiplierResults(null); // Clear previous results
      
      let data;
      let error;
      
      // Check if we're processing only filtered rows
      if (multiplierOnlyFiltered) {
        // Use the filtered data from the current view
        data = filteredAndSortedData.map(row => ({
          mundial_id: row.mundial_id,
          payout: row.payout,
          fk_city_id: row.fk_city_id,
          multiplied_payout_by_population: row.multiplied_payout_by_population
        }));
        
        // Further filter for blank records if needed
        if (multiplierOnlyBlank) {
          data = data.filter(row => row.multiplied_payout_by_population == null);
        }
      } else {
        // Query the entire database
        let query = supabase
          .from('leadsmart_transformed')
          .select('mundial_id, payout, fk_city_id, multiplied_payout_by_population');
        
        if (multiplierOnlyBlank) {
          query = query.is('multiplied_payout_by_population', null);
        }
        
        const result = await query;
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error fetching data:', error);
        alert('Error fetching data: ' + error.message);
        setMultiplierProcessing(false);
        return;
      }
      
      // Set total count for progress tracking
      setMultiplierProgress({ current: 0, total: data.length });
      
      // Initialize result counters
      let results = {
        success: 0,
        errors: 0,
        skipped: 0,
        missingCity: 0,
        missingPayout: 0,
        alreadyProcessed: 0
      };
      
      // Process in batches to avoid timeout
      const batchSize = 100;
      let processedCount = 0;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        // For each record in batch, fetch city population and calculate
        for (const record of batch) {
          processedCount++;
          setMultiplierProgress({ current: processedCount, total: data.length });
          
          // Check if already processed (shouldn't happen if filtering for blanks only)
          if (!multiplierOnlyBlank && record.multiplied_payout_by_population != null) {
            results.alreadyProcessed++;
            continue;
          }
          
          // Check for missing payout
          if (record.payout == null) {
            results.missingPayout++;
            continue;
          }
          
          // Check for missing city
          if (!record.fk_city_id) {
            results.missingCity++;
            continue;
          }
          
          // Get city population
          const { data: cityData, error: cityError } = await supabase
            .from('cities')
            .select('city_population')
            .eq('city_id', record.fk_city_id)
            .single();
          
          if (cityError) {
            console.error('Error fetching city:', record.fk_city_id, cityError);
            results.errors++;
            continue;
          }
          
          if (!cityData || cityData.city_population == null) {
            results.skipped++;
            continue;
          }
          
          // Calculate multiplied value
          const multipliedValue = record.payout * cityData.city_population;
          
          // Update the record
          const { error: updateError } = await supabase
            .from('leadsmart_transformed')
            .update({ multiplied_payout_by_population: multipliedValue })
            .eq('mundial_id', record.mundial_id);
          
          if (updateError) {
            console.error('Error updating record:', record.mundial_id, updateError);
            results.errors++;
          } else {
            results.success++;
          }
        }
      }
      
      // Set results for display
      setMultiplierResults(results);
      
      // Show completion report
      setMultiplierConfirmStep(3);
      
      // Refresh the data to show the new values
      fetchData();
      
    } catch (err: any) {
      console.error('Error:', err);
      alert('An error occurred: ' + err.message);
    } finally {
      setMultiplierProcessing(false);
      setMultiplierProgress({ current: 0, total: 0 });
    }
  };

  // Row Pagination Components (matching sitejar4 style)
  // Bar 1: Items per page selector
  const RowPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Rows/page:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {[10, 25, 50, 100, 200, 'All'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (value === 'All') {
                    setRowsPerPage(filteredAndSortedData.length || 1000);
                  } else {
                    setRowsPerPage(value as number);
                  }
                  setCurrentRowPage(1);
                }}
                className={`
                  px-2 py-2.5 text-sm font-medium border -mr-px cursor-pointer
                  ${value === 10 ? 'rounded-l' : ''}
                  ${value === 'All' ? 'rounded-r' : ''}
                  ${(value === 'All' && rowsPerPage >= filteredAndSortedData.length) || rowsPerPage === value
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:text-white'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                  focus:z-10 focus:ring-2 focus:ring-blue-500
                `}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px'
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Bar 2: Page navigation
  const RowPaginationBar2 = () => {
    if (filteredAndSortedData.length === 0) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Row page:</span>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* First page button */}
            <button
              onClick={() => setCurrentRowPage(1)}
              disabled={currentRowPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              ≪
            </button>
            {/* Previous button - Circular refresh wheel */}
            <button
              onClick={handleRowPagePrev}
              className="relative inline-flex items-center px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {(() => {
              const pageNumbers = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentRowPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalRowPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(
                  <button
                    key={i}
                    onClick={() => setCurrentRowPage(i)}
                    className={`
                      relative inline-flex items-center px-2 py-2.5 text-sm font-semibold
                      ${currentRowPage === i
                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }
                    `}
                    style={{ 
                      fontSize: '14px', 
                      paddingTop: '10px', 
                      paddingBottom: '10px'
                    }}
                  >
                    {i}
                  </button>
                );
              }
              
              return pageNumbers;
            })()}
            
            {/* Next button - Circular refresh wheel */}
            <button
              onClick={handleRowPageNext}
              className="relative inline-flex items-center px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
              </svg>
            </button>
            {/* Last page button */}
            <button
              onClick={() => setCurrentRowPage(totalRowPages)}
              disabled={currentRowPage === totalRowPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                fontSize: '14px', 
                paddingTop: '10px', 
                paddingBottom: '10px'
              }}
            >
              ≫
            </button>
          </nav>
        </div>
      </div>
    );
  };

  // Column Pagination Components (matching sitejar4 style)
  // Bar 1: Columns per page quantity selector
  const ColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              setColsPerPage(6);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
              colsPerPage === 6 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 6 ? '#f8f782' : undefined
            }}
          >
            6
          </button>
          <button
            onClick={() => {
              setColsPerPage(8);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 8 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 8 ? '#f8f782' : undefined
            }}
          >
            8
          </button>
          <button
            onClick={() => {
              setColsPerPage(10);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 10 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 10 ? '#f8f782' : undefined
            }}
          >
            10
          </button>
          <button
            onClick={() => {
              setColsPerPage(12);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 12 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 12 ? '#f8f782' : undefined
            }}
          >
            12
          </button>
          <button
            onClick={() => {
              setColsPerPage(15);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              colsPerPage === 15 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === 15 ? '#f8f782' : undefined
            }}
          >
            15
          </button>
          <button
            onClick={() => {
              setColsPerPage(allColumns.length);
              setCurrentColPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              colsPerPage === allColumns.length ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: colsPerPage === allColumns.length ? '#f8f782' : undefined
            }}
          >
            ALL
          </button>
        </div>
      </div>
    );
  };

  // Bar 2: Current column page selector
  const ColumnPaginationBar2 = () => {
    if (totalColPages <= 1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Col page:</span>
          <button
            onClick={() => setCurrentColPage(1)}
            disabled={currentColPage === 1}
            className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≪
          </button>
          <button
            onClick={handleColPagePrev}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          
          {Array.from({ length: Math.min(5, totalColPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalColPages - 4, currentColPage - 2)) + i;
            if (pageNum > totalColPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentColPage(pageNum)}
                className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                  currentColPage === pageNum 
                    ? 'text-black border-black' 
                    : 'bg-white hover:bg-gray-200'
                }`}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px',
                  backgroundColor: currentColPage === pageNum ? '#f8f782' : undefined
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={handleColPageNext}
            className="px-2 py-2.5 text-sm border -mr-px cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentColPage(totalColPages)}
            disabled={currentColPage === totalColPages}
            className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ≫
          </button>
        </div>
      </div>
    );
  };

  // Handle inline editing
  const startEditing = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    // For aggregated_zip_codes, handle both array and string formats
    if (field === 'aggregated_zip_codes') {
      if (Array.isArray(currentValue)) {
        setEditValue(currentValue.join('\n'));
      } else if (typeof currentValue === 'string' && currentValue.trim()) {
        // Convert comma-separated string to newline-separated for editing
        setEditValue(currentValue.split(',').map(zip => zip.trim()).join('\n'));
      } else {
        setEditValue('');
      }
    } else {
      setEditValue(currentValue?.toString() || '');
    }
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      // Convert editValue to appropriate format based on field
      let valueToSave: any = editValue;
      if (editingCell.field === 'aggregated_zip_codes') {
        // Convert newline-separated text to comma-separated string (current DB format)
        const zipCodes = editValue.split('\n').filter(z => z.trim());
        valueToSave = zipCodes.length > 0 ? zipCodes.join(',') : null;
      }

      const { error: updateError } = await supabase
        .from('leadsmart_transformed')
        .update({ [editingCell.field]: valueToSave })
        .eq('mundial_id', editingCell.id);

      if (updateError) throw updateError;

      // Update local state
      setData(prevData =>
        prevData.map(row =>
          row.mundial_id === editingCell.id
            ? { ...row, [editingCell.field]: valueToSave }
            : row
        )
      );

      setEditingCell(null);
      setEditValue('');
    } catch (err: any) {
      console.error('Error updating:', err);
      alert('Error updating: ' + err.message);
    }
  };

  // Handle create new inline
  const handleCreateNewInline = async () => {
    try {
      const { data: newRow, error: insertError } = await supabase
        .from('leadsmart_transformed')
        .insert([{ city_name: '', state_code: '', payout: null, aggregated_zip_codes: null }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to top of data array
      setData([newRow, ...data]);
      
      // Navigate to first page to see new row
      setCurrentRowPage(1);
    } catch (err: any) {
      console.error('Error creating new row:', err);
      alert('Error creating new row: ' + err.message);
    }
  };

  // Handle create new popup
  const handleCreateNewPopup = () => {
    setPopupData({});
    setIsPopupOpen(true);
  };

  // Handle popup save
  const handlePopupSave = async () => {
    try {
      const { data: newRow, error: insertError } = await supabase
        .from('leadsmart_transformed')
        .insert([popupData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to top of data array
      setData([newRow, ...data]);
      
      // Close popup and navigate to first page
      setIsPopupOpen(false);
      setPopupData({});
      setCurrentRowPage(1);
    } catch (err: any) {
      console.error('Error creating new row:', err);
      alert('Error creating new row: ' + err.message);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // City matching function - highly optimized version
  const runCityMatchingProcess = async () => {
    if (!selectedBaobobAttemptForCities) {
      alert('Please select a baobab_attempt_id first');
      return;
    }

    setCityMatchingInProgress(true);
    setCityMatchingProgress(0);
    setCityMatchingStatus('Starting optimized city matching process...');

    try {
      // Check how many records need processing
      setCityMatchingStatus('Checking records to process...');
      const { count: recordsToProcess, error: countError } = await supabase
        .from('leadsmart_transformed')
        .select('*', { count: 'exact', head: true })
        .eq('baobab_attempt_id', selectedBaobobAttemptForCities)
        .is('fk_city_id', null);

      if (countError) throw countError;

      if (!recordsToProcess || recordsToProcess === 0) {
        setCityMatchingStatus('No records found to process');
        setCityMatchingInProgress(false);
        return;
      }

      setCityMatchingStatus(`Found ${recordsToProcess} records to process`);
      setCityMatchingProgress(10);

      // Process in manageable batches
      const BATCH_SIZE = 500; // Smaller batches for better performance
      let processedCount = 0;
      let totalUpdated = 0;

      while (processedCount < recordsToProcess) {
        const batchNum = Math.floor(processedCount / BATCH_SIZE) + 1;
        setCityMatchingStatus(`Processing batch ${batchNum} (${processedCount}/${recordsToProcess})...`);
        
        // Get a batch of records that need city assignment
        const { data: batch, error: batchError } = await supabase
          .from('leadsmart_transformed')
          .select('mundial_id, city_name, state_code')
          .eq('baobab_attempt_id', selectedBaobobAttemptForCities)
          .is('fk_city_id', null)
          .not('city_name', 'is', null)
          .not('state_code', 'is', null)
          .limit(BATCH_SIZE);

        if (batchError) throw batchError;
        if (!batch || batch.length === 0) break;

        // For each record in the batch, find the matching city and update immediately
        const updatePromises = batch.map(async (record) => {
          try {
            // Find the matching city using proper case-insensitive matching
            const { data: matchingCities, error: cityError } = await supabase
              .from('cities')
              .select('city_id')
              .filter('city_name', 'ilike', record.city_name.trim())
              .filter('state_code', 'ilike', record.state_code.trim())
              .limit(1);

            if (cityError || !matchingCities || matchingCities.length === 0) {
              return null;
            }

            // Update the record with the found city_id
            const { error: updateError } = await supabase
              .from('leadsmart_transformed')
              .update({ fk_city_id: matchingCities[0].city_id })
              .eq('mundial_id', record.mundial_id);

            if (updateError) {
              console.error(`Error updating record ${record.mundial_id}:`, updateError);
              return null;
            }

            return record.mundial_id;
          } catch (error) {
            console.error(`Error processing record ${record.mundial_id}:`, error);
            return null;
          }
        });

        // Wait for all updates in this batch to complete
        const results = await Promise.all(updatePromises);
        const successfulUpdates = results.filter(result => result !== null).length;
        totalUpdated += successfulUpdates;

        processedCount += batch.length;
        const progress = 10 + (processedCount / recordsToProcess) * 80;
        setCityMatchingProgress(Math.floor(progress));
        setCityMatchingStatus(`Batch ${batchNum} complete: ${successfulUpdates}/${batch.length} updated. Total: ${totalUpdated}`);

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setCityMatchingProgress(100);
      setCityMatchingStatus(`✅ Complete! Updated ${totalUpdated} out of ${recordsToProcess} records.`);

      // Refresh the data to show updated fk_city_id values
      setTimeout(() => {
        fetchData();
      }, 1000);

    } catch (error: any) {
      console.error('City matching error:', error);
      setCityMatchingStatus(`❌ Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        setCityMatchingInProgress(false);
        setCityMatchingProgress(0);
        setCityMatchingStatus('');
      }, 3000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Remove the full-screen loading overlay - let the page remain visible

  return (
    <>
      <link rel="stylesheet" href="/app/styles/shenfur_th_cells_db_table_row.css" />
      
      <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Mandible Chamber */}
        {mandibleChamberVisible && (
          <div 
            className="mandible_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '12px' }}>
              mandible_chamber
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <ZhedoriButtonBar />
            </div>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">Leadsmart Morph</h1>
              <button
                onClick={() => setIsSelectorPopupOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                frosty selector popup
              </button>
              <button
                onClick={() => setCitiesAssignmentPopupOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                assign cities
              </button>
              
              {/* State Management Controls */}
              <StateManager 
                currentState={getCurrentState()}
                onLoadState={handleLoadState}
              />
            </div>
          </div>
        )}

        {/* Sinus Chamber */}
        {sinusChamberVisible && (
          <div 
            className="sinus_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '12px' }}>
              sinus_chamber
            </div>
            
            {/* Create new buttons and city population filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <button
                onClick={handleCreateNewInline}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm"
              >
                create new (inline)
              </button>
              <button
                onClick={handleCreateNewPopup}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm"
              >
                create new (popup)
              </button>
              
              {/* City Population Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  city_population
                </span>
                <select
                  value={cityPopulationFilter}
                  onChange={(e) => {
                    setCityPopulationFilter(e.target.value);
                    localStorage.setItem('leadsmartMorph_cityPopulationFilter', e.target.value);
                  }}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">all (no filter)</option>
                  <option value="49k-67k">49k-67k only</option>
                  <option value="67k-85k">67,001-85,000</option>
                  <option value="85k-100k">85,001-100,000</option>
                  <option value="100k-125k">100,001-125,000</option>
                  <option value="125k-175k">125,001-175,000</option>
                  <option value="175k-300k">175,001-300,000</option>
                  <option value="300k-600k">300,001-600,000</option>
                  <option value="600k-up">600,001-(and up)</option>
                  <option disabled>────────────────</option>
                  <option value="50k-400k">50k-400k only</option>
                  <option value="75k-325k">75k-325k only</option>
                  <option value="no-null-zero">do not show null or 0 population cities ("1" population or more only)</option>
                </select>
                <button
                  onClick={() => setMultiplierConfirmStep(1)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                  disabled={multiplierProcessing}
                >
                  {multiplierProcessing ? 'Processing...' : 'Run Payout/Population Multiplier Function'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cardio Chamber */}
        {cardioChamberVisible && (
          <div 
            className="cardio_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black' }}>
              cardio_chamber
            </div>
            
            <div style={{ marginTop: '12px' }}>
              <LeadSmartJettisonTable 
                config={{
                  targetTable: 'leadsmart_transformed',
                  relColumnPrefix: 'jrel_'
                }}
                onFilterChange={handleJettisonFilterChange}
              />
            </div>
          </div>
        )}

        {/* Pec Chamber */}
        {pecChamberVisible && (
          <div 
            className="pec_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: '10px',
              marginBottom: '0px'
            }}
          >
            <div className="flex items-center gap-3" style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '12px' }}>
              <span>pec_chamber skylab_system</span>
              <button
                onClick={() => rebuildCacheFn?.()}
                disabled={!rebuildCacheFn || cacheRebuilding}
                className={`px-3 py-1 text-sm rounded transition-colors font-medium ${
                  !rebuildCacheFn || cacheRebuilding
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                title="Rebuild count cache for Skylab tiles"
              >
                {cacheRebuilding ? '🔄 Rebuilding...' : '🔄 Re-create Pico Count Cache Now'}
              </button>
              {cacheRebuilding && (
                <div className="flex-1 max-w-md">
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden border border-gray-300">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold"
                      style={{ width: `${cacheRebuildProgress}%` }}
                    >
                      {cacheRebuildProgress}%
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Baobab Attempt Filter and City/State Filter */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginTop: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '12px' }}>
                  baobab_attempt_id
                </div>
                <select
                  value={baobobFilter || ''}
                  onChange={(e) => {
                    const newValue = e.target.value ? parseInt(e.target.value) : null;
                    setBaobobFilter(newValue);
                    localStorage.setItem('leadsmartMorph_baobobFilter', JSON.stringify(newValue));
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                  style={{ minWidth: '400px' }}
                >
                  <option value="" disabled>
                    (id) - (number of records processed) - (number of records inserted) - (created_at)
                  </option>
                  <option value="">All Attempts</option>
                  {baobobAttempts.map((attempt) => (
                    <option key={attempt.baobab_attempt_id} value={attempt.baobab_attempt_id}>
                      ({attempt.baobab_attempt_id}) - ({attempt.rows_processed?.toLocaleString() || '0'}) - ({attempt.rows_inserted?.toLocaleString() || '0'}) - ({new Date(attempt.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '12px' }}>
                  city_name + state_code
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={cityStateFilterInput}
                    onChange={(e) => setCityStateFilterInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const parts = cityStateFilterInput.split(',').map(p => p.trim());
                        if (parts.length === 2 && parts[0] && parts[1]) {
                          const filter = { city: parts[0], state: parts[1] };
                          setCityStateFilter(filter);
                          localStorage.setItem('leadsmartMorph_cityStateFilter', JSON.stringify(filter));
                        } else if (cityStateFilterInput === '') {
                          setCityStateFilter(null);
                          localStorage.removeItem('leadsmartMorph_cityStateFilter');
                        }
                      }
                    }}
                    placeholder="e.g., yorba linda, ca"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    style={{ width: '200px' }}
                  />
                  <button
                    onClick={() => {
                      const parts = cityStateFilterInput.split(',').map(p => p.trim());
                      if (parts.length === 2 && parts[0] && parts[1]) {
                        const filter = { city: parts[0], state: parts[1] };
                        setCityStateFilter(filter);
                        localStorage.setItem('leadsmartMorph_cityStateFilter', JSON.stringify(filter));
                      } else if (cityStateFilterInput === '') {
                        setCityStateFilter(null);
                        localStorage.removeItem('leadsmartMorph_cityStateFilter');
                      } else {
                        alert('Please enter in format: city name, state code');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Filter
                  </button>
                  {cityStateFilter && (
                    <button
                      onClick={() => {
                        setCityStateFilter(null);
                        setCityStateFilterInput('');
                        localStorage.removeItem('leadsmartMorph_cityStateFilter');
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                      title="Clear city/state filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Skylab Tile Tables */}
            <LeadSmartSkylabTileTables
              pageType="morph"
              onFilterApply={(type, id) => {
                const newFilter = { type, id };
                setSkylabFilter(newFilter);
                localStorage.setItem('leadsmartMorph_skylabFilter', JSON.stringify(newFilter));
              }}
              currentFilter={skylabFilter}
              onRegisterRebuild={(fn) => setRebuildCacheFn(() => fn)}
              onRebuildStatusChange={(rebuilding, progress) => {
                setCacheRebuilding(rebuilding);
                setCacheRebuildProgress(progress);
              }}
            />
          </div>
        )}

        {/* Rocket Chamber */}
        {rocketChamberVisible && (
          <div 
            className="rocket_chamber chamber_div" 
            style={{ 
              border: '1px solid black', 
              padding: 0,
              margin: 0,
              position: 'relative',
              marginBottom: '0px'
            }}
          >
          <div style={{ 
            position: 'absolute', 
            top: '4px', 
            left: '4px', 
            fontSize: '16px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg 
              width="22" 
              height="22" 
              viewBox="0 0 24 24" 
              fill="black"
              style={{ transform: 'rotate(15deg)' }}
            >
              {/* Rocket body */}
              <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
              {/* Rocket nose cone */}
              <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
              {/* Left fin */}
              <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
              {/* Right fin */}
              <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
              {/* Exhaust flames */}
              <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
              {/* Window */}
              <circle cx="12" cy="6" r="1" fill="white"/>
            </svg>
            rocket_chamber
          </div>
          
          <div style={{ marginTop: '24px', paddingTop: '4px', paddingBottom: 0, paddingLeft: '8px', paddingRight: '8px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '30%' }}>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>row pagination</span>
                      {loading ? (
                        <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#3b82f6' }}>
                          🔄 Loading data...
                        </span>
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                          Showing <span style={{ fontWeight: 'bold' }}>{paginatedData.length.toLocaleString()}</span> of <span style={{ fontWeight: 'bold' }}>{totalCount.toLocaleString()}</span> results
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '20%' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      search box 2
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '15%' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      wolf sticky columns exclusion band
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '15%' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      pillarshift column templates
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '30%' }}>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>column pagination</span>
                      <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                        Showing <span style={{ fontWeight: 'bold' }}>{paginatedColumns.length}</span> non-sticky(non wolf band) columns of <span style={{ fontWeight: 'bold' }}>{allColumns.length}</span> sourcedef columns
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end space-x-4">
                      <RowPaginationBar1 />
                      <RowPaginationBar2 />
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentRowPage(1);
                        }}
                        placeholder="Search..."
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ width: '200px', marginBottom: '3px' }}
                      />
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      wolf options
                    </button>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      use the pillarshift coltemp system
                    </button>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>
                    <div className="flex items-end space-x-4">
                      <ColumnPaginationBar1 />
                      <ColumnPaginationBar2 />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Main UI Table Grid */}
        <div style={{ marginTop: '0px', position: 'relative' }}>
          {loading && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(255, 255, 255, 0.8)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#3b82f6' }}>
                🔄 Refreshing data...
              </div>
            </div>
          )}
          <table 
            className="leadsmart-morph-main-table"
            style={{ 
              borderCollapse: 'collapse', 
              width: 'auto',
              tableLayout: 'auto',
              border: '1px solid gray',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s ease-in-out'
            }}
          >
            <thead>
              {/* Database table name row */}
              <tr className="shenfur_db_table_name_tr">
                <th 
                  className="for_db_table_leadsmart_transformed for_db_column__abstract_checkbox"
                  style={{ 
                    padding: '0px',
                    border: '1px solid gray',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={handleSelectAll}
                >
                  <div className="cell_inner_wrapper_div" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'lowercase' }}>leadsmart_transformed</span>
                  </div>
                </th>
                {paginatedColumns.map(col => {
                  const targetColumns = ['mundial_id', 'baobab_attempt_id', 'jrel_release_id', 'jrel_subsheet_id', 'jrel_subpart_id', 'city_name', 'state_code', 'payout', 'fk_city_id', 'city_population', 'custom_kw_stub_city_state', 'custom_kw_stub_city'];
                  const isTargetColumn = targetColumns.includes(col);
                  const tableName = col === 'city_population' ? 'cities' : (col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city') ? 'custom' : 'leadsmart_transformed';
                  
                  return (
                    <th 
                      key={`table-${col}`}
                      className={col === 'city_population' ? `for_db_table_cities for_db_column_${col}` : (col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city') ? 'for_db_table_abstract for_db_column_abstract' : `for_db_table_leadsmart_transformed for_db_column_${col}`}
                      style={{ 
                        padding: '0px',
                        border: '1px solid gray'
                      }}
                      onClick={(e) => {
                        if (isTargetColumn) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setColumnTooltip({
                            visible: true,
                            x: rect.left + rect.width / 2,
                            y: rect.bottom + 5,
                            content: col === 'custom_kw_stub_city_state' ? 'formulated from leadsmart_subsheets.kw_stub_1 plus city and state' : col === 'custom_kw_stub_city' ? 'formulated from leadsmart_subsheets.kw_stub_1 plus city only' : `${tableName}\n${col}`
                          });
                          // Hide tooltip after 2 seconds
                          setTimeout(() => setColumnTooltip(prev => ({ ...prev, visible: false })), 2000);
                        }
                      }}
                    >
                      <div className="cell_inner_wrapper_div">
                        <span style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'lowercase' }}>
                          {col === 'custom_kw_stub_city_state' ? 'custom' : tableName}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
              
              {/* Database column name row */}
              <tr className="shenfur_db_column_name_tr">
                <th 
                  className="for_db_table_leadsmart_transformed for_db_column__abstract_checkbox"
                  style={{ 
                    padding: '0px',
                    border: '1px solid gray',
                    textAlign: 'center',
                    cursor: 'pointer',
                    width: '60px'
                  }}
                  onClick={handleSelectAll}
                >
                  <div className="cell_inner_wrapper_div" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
                {paginatedColumns.map(col => {
                  // Determine if this column is the active filter (from jettison or skylab)
                  const isActiveFilterColumn = (
                    (jettisonFilter && jettisonFilter.type && (
                      (jettisonFilter.type === 'release' && col === 'jrel_release_id') ||
                      (jettisonFilter.type === 'subsheet' && col === 'jrel_subsheet_id') ||
                      (jettisonFilter.type === 'subpart' && col === 'jrel_subpart_id')
                    )) ||
                    (skylabFilter && skylabFilter.type && (
                      (skylabFilter.type === 'release' && col === 'jrel_release_id') ||
                      (skylabFilter.type === 'subsheet' && col === 'jrel_subsheet_id') ||
                      (skylabFilter.type === 'subpart' && col === 'jrel_subpart_id')
                    ))
                  );
                  
                  const isSortable = col === 'payout' || col === 'city_population' || col === 'multiplied_payout_by_population';
                  const isCurrentlySorted = sortColumn === col;
                  
                  return (
                    <th 
                      key={`col-${col}`}
                      className={col === 'city_population' ? `for_db_table_cities for_db_column_${col}` : (col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city') ? 'for_db_table_abstract for_db_column_abstract' : `for_db_table_leadsmart_transformed for_db_column_${col}`}
                      style={{ 
                        padding: '0px',
                        border: '1px solid gray',
                        backgroundColor: isActiveFilterColumn ? '#ffff99' : undefined,
                        cursor: isSortable ? 'pointer' : 'default',
                        ...(col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city' ? { whiteSpace: 'nowrap' } : {})
                      }}
                      onClick={isSortable ? () => handleSort(col) : undefined}
                      title={isSortable ? `Click to sort by ${col}` : undefined}
                    >
                      <div className="cell_inner_wrapper_div" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {isCurrentlySorted && (
                          <span style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#ff6b35',
                            borderRadius: '50%',
                            display: 'inline-block',
                            flexShrink: 0,
                            marginRight: '4px'
                          }} />
                        )}
                        <span style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'lowercase' }}>
                          {col === 'city_population' ? 'city_population' : 
                           col === 'custom_kw_stub_city_state' ? 'kw-tuber-1' : 
                           col === 'custom_kw_stub_city' ? 'kw-tuber-2' : 
                           col}
                        </span>
                        {isSortable && (
                          <span style={{ fontSize: '10px', opacity: isCurrentlySorted ? 1 : 0.3 }}>
                            {isCurrentlySorted && sortDirection === 'asc' ? '↑' : 
                             isCurrentlySorted && sortDirection === 'desc' ? '↓' : '↕'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={paginatedColumns.length + 1} 
                    style={{ 
                      padding: '40px',
                      textAlign: 'center',
                      border: '1px solid gray',
                      color: '#666'
                    }}
                  >
                    <div style={{ fontSize: '16px' }}>
                      {cityStateFilter ? (
                        <>
                          <strong>No results found for:</strong><br/>
                          City: "{cityStateFilter.city}", State: "{cityStateFilter.state}"<br/>
                          <span style={{ fontSize: '14px', marginTop: '10px', display: 'inline-block' }}>
                            Please check the spelling and ensure you're using the 2-letter state code (e.g., CA, NY, TX)
                          </span>
                        </>
                      ) : searchTerm ? (
                        <>No results found for search term: "{searchTerm}"</>
                      ) : (
                        <>No data available</>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map(row => (
                <tr key={row.mundial_id}>
                  <td 
                    className="for_db_table_leadsmart_transformed for_db_column__abstract_checkbox"
                    style={{ 
                      padding: '0px',
                      border: '1px solid gray',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRowSelect(row.mundial_id)}
                  >
                    <div className="cell_inner_wrapper_div" style={{ minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.mundial_id)}
                        onChange={() => handleRowSelect(row.mundial_id)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </td>
                  {paginatedColumns.map(col => {
                    const isEditing = editingCell?.id === row.mundial_id && editingCell?.field === col;
                    const value = row[col as keyof LeadsmartTransformed];
                    const isReadOnly = col === 'mundial_id' || col === 'baobab_attempt_id' || col === 'fk_city_id' || col === 'city_population' || col === 'multiplied_payout_by_population' || col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city';
                    
                    return (
                      <td 
                        key={`${row.mundial_id}-${col}`}
                        className={col === 'city_population' ? `for_db_table_cities for_db_column_${col}` : (col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city') ? 'for_db_table_abstract for_db_column_abstract' : `for_db_table_leadsmart_transformed for_db_column_${col}`}
                        style={{ 
                          padding: '0px',
                          border: '1px solid gray',
                          ...((col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city' || col === 'aggregated_zip_codes') ? { whiteSpace: 'nowrap' } : {})
                        }}
                        onClick={() => !isReadOnly && !isEditing && startEditing(row.mundial_id, col, value)}
                      >
                        <div className="cell_inner_wrapper_div" style={{ 
                          minHeight: '40px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '4px', 
                          position: (col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city') ? 'relative' : undefined, 
                          ...(col === 'custom_kw_stub_city_state' || col === 'custom_kw_stub_city' ? { whiteSpace: 'nowrap' } : {}) 
                        }}>
                          {isEditing ? (
                            // Use compact input for kwtuber columns, textarea for others
                            (col === 'volume_kwtuber1' || col === 'cpc_kwtuber1' || col === 'yelp_kwtuber1' || 
                             col === 'volume_kwtuber2' || col === 'cpc_kwtuber2' || col === 'yelp_kwtuber2') ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    setEditValue('');
                                  }
                                }}
                                autoFocus
                                className="w-full px-1 py-0 border border-blue-500 focus:outline-none"
                                style={{ 
                                  height: '24px',
                                  fontSize: '12px',
                                  lineHeight: '1.2'
                                }}
                              />
                            ) : (
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                                  if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    setEditValue('');
                                  }
                                }}
                                autoFocus
                                className="w-full px-2 py-1 border border-blue-500 focus:outline-none"
                                rows={3}
                              />
                            )
                          ) : col === 'aggregated_zip_codes' && (Array.isArray(value) || (typeof value === 'string' && value.trim())) ? (
                            (() => {
                              // Parse zip codes from either array or string format
                              const zipCodes = Array.isArray(value) 
                                ? value 
                                : value.split(',').map(zip => zip.trim()).filter(zip => zip);
                              
                              return (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setZipCodesPopupData(zipCodes);
                                      setZipCodesPopupOpen(true);
                                    }}
                                    style={{
                                      border: '1px solid #666',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      background: '#f0f0f0',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      fontSize: '12px',
                                      minWidth: '30px',
                                      textAlign: 'center'
                                    }}
                                    title="Click to view all zip codes"
                                  >
                                    {zipCodes.length}
                                  </button>
                                  <span 
                                    style={{ 
                                      cursor: 'default',
                                      color: 'inherit',
                                      flex: 1,
                                      marginLeft: '8px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {zipCodes.slice(0, 2).join(' / ')}
                                    {zipCodes.length > 2 ? ' ...' : ''}
                                  </span>
                                </>
                              );
                            })()
                          ) : col === 'aggregated_zip_codes' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZipCodesPopupData([]);
                                  setZipCodesPopupOpen(true);
                                }}
                                style={{
                                  border: '1px solid #666',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: '#f0f0f0',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                  minWidth: '30px',
                                  textAlign: 'center'
                                }}
                                title="Click to view all zip codes"
                              >
                                0
                              </button>
                              <span 
                                style={{ 
                                  cursor: 'default',
                                  color: '#888',
                                  flex: 1,
                                  marginLeft: '8px'
                                }}
                              >
                                No zip codes
                              </span>
                            </>
                          ) : col === 'city_population' ? (
                            <span 
                              style={{ 
                                cursor: 'default',
                                color: '#000000',
                                fontWeight: value ? 'normal' : 'normal'
                              }}
                            >
                              {value ? Number(value).toLocaleString() : ''}
                            </span>
                          ) : col === 'payout' ? (
                            <span 
                              style={{ 
                                cursor: isReadOnly ? 'default' : 'pointer',
                                color: isReadOnly ? '#888' : 'inherit'
                              }}
                            >
                              {value ? `$${Number(value).toFixed(2)}` : ''}
                            </span>
                          ) : col === 'multiplied_payout_by_population' ? (
                            <span 
                              style={{ 
                                cursor: 'default',
                                color: '#888',
                                fontWeight: value ? 'normal' : 'normal'
                              }}
                            >
                              {value ? Math.floor(Number(value)).toLocaleString('en-US') : ''}
                            </span>
                          ) : col === 'custom_kw_stub_city_state' ? (
                            <>
                              <span 
                                style={{ 
                                  cursor: 'default',
                                  color: '#333',
                                  paddingRight: '72px', // Add padding to prevent text overlap with buttons (26px + 26px + 16px + 4px buffer)
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block'
                                }}
                              >
                                {`${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''} ${row.state_code || ''}`.trim()}
                              </span>
                              <a
                                href={`https://www.google.com/search?q=${`${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''} ${row.state_code || ''}`.trim().replace(/\s+/g, '+')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // For left click, prevent default and use window.open for consistency
                                  if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                                    e.preventDefault();
                                    const searchQuery = `${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''} ${row.state_code || ''}`.trim().replace(/\s+/g, '+');
                                    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                                  }
                                  // Middle click and right click will use default browser behavior
                                }}
                                onAuxClick={(e) => {
                                  e.stopPropagation();
                                  // Middle click (button 1) - browser handles opening in background tab
                                }}
                                style={{
                                  width: '26px',
                                  height: '100%',
                                  border: '1px solid black',
                                  backgroundColor: '#ffffff',
                                  fontSize: '14px',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  position: 'absolute',
                                  right: '42px',
                                  top: 0,
                                  bottom: 0,
                                  color: 'black',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                }}
                                title="Search in Google"
                              >
                                ↗
                              </a>
                              <a
                                href={`https://www.semrush.com/analytics/keywordoverview/?q=${`${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''} ${row.state_code || ''}`.trim().replace(/\s+/g, '+')}&db=us`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // For left click, prevent default and use window.open for consistency
                                  if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                                    e.preventDefault();
                                    const searchQuery = `${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''} ${row.state_code || ''}`.trim().replace(/\s+/g, '+');
                                    window.open(`https://www.semrush.com/analytics/keywordoverview/?q=${searchQuery}&db=us`, '_blank');
                                  }
                                  // Middle click and right click will use default browser behavior
                                }}
                                onAuxClick={(e) => {
                                  e.stopPropagation();
                                  // Middle click (button 1) - browser handles opening in background tab
                                }}
                                style={{
                                  width: '26px',
                                  height: '100%',
                                  border: '1px solid black',
                                  backgroundColor: '#ffffff',
                                  fontSize: '14px',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  position: 'absolute',
                                  right: '16px',
                                  top: 0,
                                  bottom: 0,
                                  color: 'black',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                }}
                                title="Search in Semrush"
                              >
                                ↗
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const textToCopy = `${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''} ${row.state_code || ''}`.trim();
                                  navigator.clipboard.writeText(textToCopy);
                                }}
                                style={{
                                  width: '16px',
                                  height: '100%',
                                  border: '1px solid gray',
                                  backgroundColor: '#d3d3d3',
                                  fontSize: '8px',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'yellow';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#d3d3d3';
                                }}
                                title="Copy to clipboard"
                              >
                                c
                              </button>
                            </>
                          ) : col === 'custom_kw_stub_city' ? (
                            <>
                              <span 
                                style={{ 
                                  cursor: 'default',
                                  color: '#333',
                                  paddingRight: '72px', // Add padding to prevent text overlap with buttons
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block'
                                }}
                              >
                                {`${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''}`.trim()}
                              </span>
                              <a
                                href={`https://www.google.com/search?q=${`${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''}`.trim().replace(/\s+/g, '+')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // For left click, prevent default and use window.open for consistency
                                  if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                                    e.preventDefault();
                                    const searchQuery = `${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''}`.trim().replace(/\s+/g, '+');
                                    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                                  }
                                  // Middle click and right click will use default browser behavior
                                }}
                                onAuxClick={(e) => {
                                  e.stopPropagation();
                                  // Middle click (button 1) - browser handles opening in background tab
                                }}
                                style={{
                                  width: '26px',
                                  height: '100%',
                                  border: '1px solid black',
                                  backgroundColor: '#ffffff',
                                  fontSize: '14px',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  position: 'absolute',
                                  right: '42px',
                                  top: 0,
                                  bottom: 0,
                                  color: 'black',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                }}
                                title="Search in Google"
                              >
                                ↗
                              </a>
                              <a
                                href={`https://www.semrush.com/analytics/keywordoverview/?q=${`${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''}`.trim().replace(/\s+/g, '+')}&db=us`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // For left click, prevent default and use window.open for consistency
                                  if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                                    e.preventDefault();
                                    const searchQuery = `${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''}`.trim().replace(/\s+/g, '+');
                                    window.open(`https://www.semrush.com/analytics/keywordoverview/?q=${searchQuery}&db=us`, '_blank');
                                  }
                                  // Middle click and right click will use default browser behavior
                                }}
                                onAuxClick={(e) => {
                                  e.stopPropagation();
                                  // Middle click (button 1) - browser handles opening in background tab
                                }}
                                style={{
                                  width: '26px',
                                  height: '100%',
                                  border: '1px solid black',
                                  backgroundColor: '#ffffff',
                                  fontSize: '14px',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  position: 'absolute',
                                  right: '16px',
                                  top: 0,
                                  bottom: 0,
                                  color: 'black',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                }}
                                title="Search in Semrush"
                              >
                                ↗
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const textToCopy = `${row.subsheet_kw_stub_1 || ''} ${row.city_name || ''}`.trim();
                                  navigator.clipboard.writeText(textToCopy);
                                }}
                                style={{
                                  width: '16px',
                                  height: '100%',
                                  border: '1px solid gray',
                                  backgroundColor: '#d3d3d3',
                                  fontSize: '8px',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'yellow';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#d3d3d3';
                                }}
                                title="Copy to clipboard"
                              >
                                c
                              </button>
                            </>
                          ) : (col === 'cpc_kwtuber1' || col === 'cpc_kwtuber2') ? (
                            <span 
                              style={{ 
                                cursor: 'pointer',
                                color: 'inherit'
                              }}
                            >
                              {value != null ? Number(value).toFixed(2) : ''}
                            </span>
                          ) : (col === 'volume_kwtuber1' || col === 'volume_kwtuber2' || col === 'yelp_kwtuber1' || col === 'yelp_kwtuber2') ? (
                            <span 
                              style={{ 
                                cursor: 'pointer',
                                color: 'inherit'
                              }}
                            >
                              {value != null ? Number(value).toString() : ''}
                            </span>
                          ) : (
                            <span 
                              style={{ 
                                cursor: isReadOnly ? 'default' : 'pointer',
                                color: isReadOnly ? '#888' : 'inherit'
                              }}
                            >
                              {value?.toString() || ''}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Popup */}
      {isPopupOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setIsPopupOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              Create New Record
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  city_name
                </label>
                <input
                  type="text"
                  value={popupData.city_name || ''}
                  onChange={(e) => setPopupData({ ...popupData, city_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  state_code
                </label>
                <input
                  type="text"
                  value={popupData.state_code || ''}
                  onChange={(e) => setPopupData({ ...popupData, state_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  payout
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={popupData.payout || ''}
                  onChange={(e) => setPopupData({ ...popupData, payout: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  aggregated_zip_codes (one per line)
                </label>
                <textarea
                  value={(() => {
                    const zipCodes = popupData.aggregated_zip_codes;
                    if (Array.isArray(zipCodes)) {
                      return zipCodes.join('\n');
                    } else if (typeof zipCodes === 'string' && zipCodes.trim()) {
                      return zipCodes.split(',').map(zip => zip.trim()).join('\n');
                    }
                    return '';
                  })()}
                  onChange={(e) => {
                    // Save as comma-separated string to match DB format
                    const zipCodes = e.target.value.split('\n').filter(z => z.trim());
                    setPopupData({ 
                      ...popupData, 
                      aggregated_zip_codes: zipCodes.length > 0 ? zipCodes.join(',') : null
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="Enter zip codes, one per line"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupSave}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Selector Popup */}
      {isSelectorPopupOpen && (
        <FrostySelectorPopup
          isOpen={isSelectorPopupOpen}
          onClose={() => setIsSelectorPopupOpen(false)}
          pageType="morph"
        />
      )}
      
      {/* Zip Codes Popup */}
      {zipCodesPopupOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setZipCodesPopupOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                All Zip Codes ({zipCodesPopupData.length})
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(zipCodesPopupData.join('\n'));
                  // Show temporary success feedback
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn.textContent;
                  btn.textContent = '✓ Copied!';
                  btn.style.backgroundColor = '#10b981';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '#3b82f6';
                  }, 1500);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors text-sm"
              >
                📋 Copy All
              </button>
            </div>
            
            <textarea
              value={zipCodesPopupData.join('\n')}
              readOnly
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'vertical'
              }}
              onClick={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.select();
              }}
            />
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setZipCodesPopupOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cities Assignment Popup */}
      {citiesAssignmentPopupOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => !cityMatchingInProgress && setCitiesAssignmentPopupOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Assign Cities
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                baobab_attempt_id
              </label>
              <select
                value={selectedBaobobAttemptForCities || ''}
                onChange={(e) => setSelectedBaobobAttemptForCities(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                disabled={cityMatchingInProgress}
              >
                <option value="" disabled>
                  (id) - (number of records processed) - (number of records inserted) - (created_at)
                </option>
                {baobobAttempts.map((attempt) => (
                  <option key={attempt.baobab_attempt_id} value={attempt.baobab_attempt_id}>
                    ({attempt.baobab_attempt_id}) - ({attempt.rows_processed?.toLocaleString() || '0'}) - ({attempt.rows_inserted?.toLocaleString() || '0'}) - ({new Date(attempt.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {cityMatchingInProgress && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  Progress: {cityMatchingProgress}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden border border-gray-300">
                  <div
                    className="h-full bg-green-600 transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${cityMatchingProgress}%` }}
                  >
                    {cityMatchingProgress}%
                  </div>
                </div>
                {cityMatchingStatus && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {cityMatchingStatus}
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCitiesAssignmentPopupOpen(false)}
                disabled={cityMatchingInProgress}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={runCityMatchingProcess}
                disabled={cityMatchingInProgress || !selectedBaobobAttemptForCities}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cityMatchingInProgress ? 'Processing...' : 'run city matching process for leadsmart_transformed.fk_city_id'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payout Multiplier Confirmation Popup */}
      {(multiplierConfirmStep > 0 || multiplierProcessing) && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: multiplierProcessing ? '3px solid #10b981' : '3px solid #dc2626'
            }}
          >
            {multiplierProcessing ? (
              <>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#10b981',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  ⚙️ PROCESSING MULTIPLICATION ⚙️
                </h2>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      margin: '0 auto 20px',
                      border: '5px solid #e5e7eb',
                      borderTop: '5px solid #10b981',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <style jsx>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                  <p style={{ fontSize: '18px', marginBottom: '12px', fontWeight: '600' }}>
                    Multiplication in progress...
                  </p>
                  <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                    Processing all records with payout values
                  </p>
                  {multiplierProgress.total > 0 && (
                    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                      <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        Progress: {multiplierProgress.current} / {multiplierProgress.total}
                      </p>
                      <div style={{
                        width: '100%',
                        height: '24px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(multiplierProgress.current / multiplierProgress.total) * 100}%`,
                          height: '100%',
                          backgroundColor: '#10b981',
                          transition: 'width 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>
                            {Math.round((multiplierProgress.current / multiplierProgress.total) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <p style={{ fontSize: '14px', color: '#888' }}>
                    This may take a few moments. Please do not close this window.
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#d1fae5',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '20px',
                  border: '1px solid #10b981'
                }}>
                  <p style={{ fontSize: '14px', color: '#065f46', textAlign: 'center', margin: 0 }}>
                    ✓ Process started successfully
                  </p>
                </div>
              </>
            ) : multiplierConfirmStep === 1 ? (
              <>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#dc2626',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  ⚠️ FIRST CONFIRMATION ⚠️
                </h2>
                <p style={{ fontSize: '16px', marginBottom: '20px', lineHeight: '1.6' }}>
                  This operation will:
                </p>
                <ul style={{ marginBottom: '20px', paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li>Process the <strong>ENTIRE leadsmart_transformed table</strong></li>
                  <li>Multiply each row's <strong>payout</strong> value by its <strong>city_population</strong></li>
                  <li>Store results in the <strong>multiplied_payout_by_population</strong> column</li>
                  <li>This operation <strong>CANNOT be undone automatically</strong></li>
                </ul>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#dbeafe',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
                    <strong>Note:</strong> You can choose to process only filtered rows or blank records in the next step.
                  </p>
                </div>
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#dc2626',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  Are you sure you want to proceed?
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setMultiplierConfirmStep(0)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setMultiplierConfirmStep(2)}
                    className="px-6 py-3 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors"
                  >
                    Yes, Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#dc2626',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  🚨 FINAL CONFIRMATION 🚨
                </h2>
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '2px solid #dc2626',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: '#991b1b',
                    textAlign: 'center',
                    marginBottom: '12px'
                  }}>
                    THIS IS YOUR LAST CHANCE TO CANCEL
                  </p>
                  <p style={{ fontSize: '16px', color: '#991b1b', textAlign: 'center' }}>
                    The multiplication operation will begin immediately after you confirm.
                  </p>
                </div>
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '15px',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}>
                    <input
                      type="checkbox"
                      checked={multiplierOnlyBlank}
                      onChange={(e) => setMultiplierOnlyBlank(e.target.checked)}
                      style={{ 
                        width: '18px', 
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>
                      <strong>Only process blank records</strong>
                      <br />
                      <span style={{ fontSize: '13px', color: '#92400e' }}>
                        {multiplierOnlyBlank ? 'Will skip records that already have multiplied values' : 'Will process ALL records (overwrites existing values)'}
                      </span>
                    </span>
                  </label>
                  
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '15px',
                    cursor: 'pointer',
                    paddingTop: '12px',
                    borderTop: '1px solid #fbbf24'
                  }}>
                    <input
                      type="checkbox"
                      checked={multiplierOnlyFiltered}
                      onChange={(e) => setMultiplierOnlyFiltered(e.target.checked)}
                      style={{ 
                        width: '18px', 
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>
                      <strong>Only process currently filtered rows</strong>
                      <br />
                      <span style={{ fontSize: '13px', color: '#92400e' }}>
                        {multiplierOnlyFiltered 
                          ? `Will process only the ${filteredAndSortedData.length.toLocaleString()} rows shown in the table` 
                          : 'Will process all rows in the database'}
                      </span>
                    </span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
                  <button
                    onClick={() => setMultiplierConfirmStep(0)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => runPayoutMultiplier()}
                    className="px-6 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                  >
                    Execute Multiplication
                  </button>
                </div>
              </>
            )}
            
            {/* Completion Report */}
            {multiplierConfirmStep === 3 && multiplierResults && (
              <>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                  textAlign: 'center',
                  color: '#059669'
                }}>
                  ✅ Processing Complete
                </div>
                
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    marginBottom: '16px',
                    color: '#1f2937'
                  }}>
                    Results Summary:
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#d1fae5', borderRadius: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#065f46' }}>✓ Successfully processed:</span>
                      <span style={{ fontWeight: 'bold', color: '#065f46' }}>{multiplierResults.success.toLocaleString()}</span>
                    </div>
                    
                    {multiplierResults.alreadyProcessed > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#e0e7ff', borderRadius: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#3730a3' }}>↻ Already processed (skipped):</span>
                        <span style={{ fontWeight: 'bold', color: '#3730a3' }}>{multiplierResults.alreadyProcessed.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {multiplierResults.missingPayout > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fed7aa', borderRadius: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#92400e' }}>⊘ Missing payout value:</span>
                        <span style={{ fontWeight: 'bold', color: '#92400e' }}>{multiplierResults.missingPayout.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {multiplierResults.missingCity > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fed7aa', borderRadius: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#92400e' }}>⊘ Missing city ID:</span>
                        <span style={{ fontWeight: 'bold', color: '#92400e' }}>{multiplierResults.missingCity.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {multiplierResults.skipped > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#78350f' }}>○ City missing population data:</span>
                        <span style={{ fontWeight: 'bold', color: '#78350f' }}>{multiplierResults.skipped.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {multiplierResults.errors > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#991b1b' }}>✕ Errors during processing:</span>
                        <span style={{ fontWeight: 'bold', color: '#991b1b' }}>{multiplierResults.errors.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    marginTop: '20px', 
                    paddingTop: '16px', 
                    borderTop: '2px solid #d1d5db' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                      <span>Total Records Processed:</span>
                      <span style={{ color: '#059669' }}>
                        {(multiplierResults.success + multiplierResults.errors + multiplierResults.skipped + 
                          multiplierResults.missingCity + multiplierResults.missingPayout + 
                          (multiplierResults.alreadyProcessed || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setMultiplierConfirmStep(0);
                      setMultiplierResults(null);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    Close Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bezel Button */}
      <BezelButton />
      
      {/* Column Tooltip */}
      {columnTooltip.visible && (
        <div 
          className="morph-column-tooltip visible"
          style={{
            position: 'fixed',
            left: `${columnTooltip.x}px`,
            top: `${columnTooltip.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          {columnTooltip.content}
        </div>
      )}
    </>
  );
}
