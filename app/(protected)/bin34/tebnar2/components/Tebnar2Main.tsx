'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Tebnar2ImagePlan, 
  Tebnar2Image, 
  Tebnar2Batch, 
  Tebnar2State,
  Tebnar2ThrottleSettings 
} from '../types/tebnar2-types';
import { 
  TBN2_DEFAULT_PAGE_SIZE, 
  TBN2_PAGE_SIZE_OPTIONS, 
  TBN2_DEFAULT_THROTTLE,
  TBN2_DEBOUNCE_MS,
  TBN2_MAIN_ELEMENT_STYLING
} from '../constants/tebnar2-constants';
import TigerBar from './TigerBar';
import { 
  tbn2_fetchImagePlansData,
  tbn2_fetchImagesData,
  tbn2_fetchBatchesData,
  tbn2_refreshAllData,
  tbn2_filterPlansByBatch,
  tbn2_validateUserAccess
} from '../utils/tbn2-data-functions';
import { tbn2_log } from '../utils/tbn2-utils';
import { tbn2_func_create_plans_from_xls_2 } from '../utils/tbn2_func_create_plans_from_xls_2';
import { tbn2_func_create_plans_make_images_2 } from '../utils/tbn2_func_create_plans_make_images_2';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Tebnar2Table from './Tebnar2Table';
import Tebnar2Filters from './Tebnar2Filters';
import Tebnar2Actions from './Tebnar2Actions';

export default function Tebnar2Main() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Check if user is authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Main state management - cloned from tebnar1
  const [tbn2_plans, setTbn2Plans] = useState<Tebnar2ImagePlan[]>([]);
  const [tbn2_loading, setTbn2Loading] = useState(true);
  const [tbn2_error, setTbn2Error] = useState<string | null>(null);
  const [tbn2_gridData, setTbn2GridData] = useState<string[][]>([]);
  const [tbn2_submitLoading, setTbn2SubmitLoading] = useState(false);
  const [tbn2_submitResult, setTbn2SubmitResult] = useState<string | null>(null);
  const [tbn2_batches, setTbn2Batches] = useState<Tebnar2Batch[]>([]);
  const [tbn2_selectedBatchId, setTbn2SelectedBatchId] = useState<string>('');
  const [tbn2_qtyPerPlan, setTbn2QtyPerPlan] = useState<number>(1);
  const [tbn2_aiModel, setTbn2AiModel] = useState<string>('openai');
  const [tbn2_makeImagesLoading, setTbn2MakeImagesLoading] = useState(false);
  const [tbn2_makeImagesResult, setTbn2MakeImagesResult] = useState<string | null>(null);
  const [tbn2_currentPage, setTbn2CurrentPage] = useState(1);
  const [tbn2_pageSize, setTbn2PageSize] = useState(TBN2_DEFAULT_PAGE_SIZE);
  const [tbn2_imagesById, setTbn2ImagesById] = useState<Record<string, Tebnar2Image>>({});
  const [tbn2_generateZip, setTbn2GenerateZip] = useState(false);
  const [tbn2_wipeMeta, setTbn2WipeMeta] = useState(true);
  const [tbn2_screenshotImages, setTbn2ScreenshotImages] = useState(true);
  const [tbn2_alterpro, setTbn2Alterpro] = useState({
    enabled: true,
    edgePercentages: {
      top: '1-5%',
      bottom: '1-5%',
      left: '1-5%',
      right: '1-5%'
    }
  });
  const [tbn2_throttle1, setTbn2Throttle1] = useState<Tebnar2ThrottleSettings>(TBN2_DEFAULT_THROTTLE);
  const [tbn2_fetchingImages, setTbn2FetchingImages] = useState<Set<string>>(new Set());
  const [tbn2_fetchStatusMessages, setTbn2FetchStatusMessages] = useState<Record<string, string>>({});
  const [tbn2_loadingPreset, setTbn2LoadingPreset] = useState(false);
  const [tbn2_presetData, setTbn2PresetData] = useState<string[][] | null>(null);
  const [tbn2_lastClickTime, setTbn2LastClickTime] = useState<Record<string, number>>({});
  const [tbn2_urlBatchId, setTbn2UrlBatchId] = useState<string | null>(null);
  const [tbn2_selectedColTemplate, setTbn2SelectedColTemplate] = useState('option1');
  const [tbn2_stickyColCount, setTbn2StickyColCount] = useState(1);
  const [tbn2_narpiPushLoading, setTbn2NarpiPushLoading] = useState(false);
  const [tbn2_narpiPushProgress, setTbn2NarpiPushProgress] = useState(0);
  const [tbn2_narpiPushStatus, setTbn2NarpiPushStatus] = useState<string | null>(null);
  const [tbn2_selectedRows, setTbn2SelectedRows] = useState<Set<string>>(new Set());
  
  // Rocket Chamber state
  const [tbn2_rocketSearchValue, setTbn2RocketSearchValue] = useState<string>('');
  const [tbn2_rocketCurrentPage, setTbn2RocketCurrentPage] = useState<number>(1);
  const [tbn2_rocketItemsPerPage, setTbn2RocketItemsPerPage] = useState<number>(25);
  const [tbn2_rocketColumnsPerPage, setTbn2RocketColumnsPerPage] = useState<number>(8);
  const [tbn2_rocketCurrentColumnPage, setTbn2RocketCurrentColumnPage] = useState<number>(1);

  // Wolf Options popup state
  const [tbn2_isWolfOptionsOpen, setTbn2IsWolfOptionsOpen] = useState(false);
  const [tbn2_wolfOptions, setTbn2WolfOptions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tebnar2-wolf-options');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      submission_order: true,
      int_columns: true,
      image_previews: true,
      metadata_fields: true,
      timestamps: false,
      technical_ids: false
    };
  });

  // Pillarshift Coltemp System popup state
  const [tbn2_isPillarShiftModalOpen, setTbn2IsPillarShiftModalOpen] = useState(false);
  const [tbn2_activeTab, setTbn2ActiveTab] = useState('rtab1');
  const [tbn2_sheafData, setTbn2SheafData] = useState<string>('');
  const [tbn2_sheafLoading, setTbn2SheafLoading] = useState(false);
  const [tbn2_pillarShiftActiveTab, setTbn2PillarShiftActiveTab] = useState('Active Sheaves');
  
  // Mock sheaf data for pillarshift modal
  const tbn2_mockSheafData = [
    {
      name: 'Tebnar2 Primary Sheaf',
      status: 'active',
      description: 'Main processing sheaf for image plan data',
      records: 247,
      lastUpdated: '2 hours ago'
    },
    {
      name: 'Template Processing Sheaf',
      status: 'processing', 
      description: 'Column template optimization sheaf',
      records: 89,
      lastUpdated: '15 minutes ago'
    },
    {
      name: 'Archive Sheaf',
      status: 'inactive',
      description: 'Historical data archive sheaf',
      records: 1456,
      lastUpdated: '1 day ago'
    }
  ];
  
  // Sorting state - default to submission_order ascending
  const [tbn2_sortColumn, setTbn2SortColumn] = useState<string | null>('submission_order');
  const [tbn2_sortDirection, setTbn2SortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Rename file state
  const [tbn2_renamingFiles, setTbn2RenamingFiles] = useState<Set<string>>(new Set());
  
  // Sitespren state for asn_sitespren_id widget
  const [tbn2_sitesprenOptions, setTbn2SitesprenOptions] = useState<Array<{id: string, sitespren_base: string}>>([]);
  const [tbn2_selectedSitesprenId, setTbn2SelectedSitesprenId] = useState<string>('');
  const [tbn2_sitesprenSaving, setTbn2SitesprenSaving] = useState(false);
  const [tbn2_sitesprenSearchTerm, setTbn2SitesprenSearchTerm] = useState<string>('');
  const [tbn2_sitesprenDropdownOpen, setTbn2SitesprenDropdownOpen] = useState(false);
  const sitesprenDropdownRef = useRef<HTMLDivElement>(null);
  
  // Gcon piece state for asn_gcon_piece_id widget
  const [tbn2_gconPieceOptions, setTbn2GconPieceOptions] = useState<Array<{id: string, meta_title: string, asn_sitespren_base: string, post_name: string, g_post_id: string, pageurl: string}>>([]);
  const [tbn2_selectedGconPieceId, setTbn2SelectedGconPieceId] = useState<string>('');
  const [tbn2_gconPieceSaving, setTbn2GconPieceSaving] = useState(false);
  const [tbn2_currentSitesprenBase, setTbn2CurrentSitesprenBase] = useState<string>('');
  const [tbn2_gconPieceSearchTerm, setTbn2GconPieceSearchTerm] = useState<string>('');
  const [tbn2_gconPieceDropdownOpen, setTbn2GconPieceDropdownOpen] = useState(false);
  const gconPieceDropdownRef = useRef<HTMLDivElement>(null);
  
  // Reverse relation state - for finding gcon_piece assigned to current batch
  const [tbn2_assignedGconPiece, setTbn2AssignedGconPiece] = useState<{id: string, asn_sitespren_base: string, post_name: string} | null>(null);
  
  // Seed URL state for batch editing
  const [tbn2_seedUrlWpEditor, setTbn2SeedUrlWpEditor] = useState<string>('');
  const [tbn2_seedUrlFrontend, setTbn2SeedUrlFrontend] = useState<string>('');
  const [tbn2_seedUrlSaving, setTbn2SeedUrlSaving] = useState<{wpEditor: boolean, frontend: boolean}>({wpEditor: false, frontend: false});
  
  // Create new batch state
  const [tbn2_createBatchLoading, setTbn2CreateBatchLoading] = useState<boolean>(false);
  
  // Pushador actions state - sync actions from sitejar4
  const [tbn2_syncLoading, setTbn2SyncLoading] = useState<Set<string>>(new Set());
  const [tbn2_syncResults, setTbn2SyncResults] = useState<{[key: string]: {type: 'success' | 'error', message: string}}>({});
  const [tbn2_checkingPluginVersion, setTbn2CheckingPluginVersion] = useState<Set<string>>(new Set());
  const [tbn2_updatingPlugin, setTbn2UpdatingPlugin] = useState<Set<string>>(new Set());
  const [tbn2_barkroPushing, setTbn2BarkroPushing] = useState<Set<string>>(new Set());

  // Functions popup state - cloned from nwjar1
  const [tbn2_isPopupOpen, setTbn2IsPopupOpen] = useState(false);
  const [tbn2_kz101Checked, setTbn2Kz101Checked] = useState(false);
  const [tbn2_kz103Checked, setTbn2Kz103Checked] = useState(false);
  const [tbn2_activePopupTab, setTbn2ActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7' | 'ptab8'>('ptab6');
  const [tbn2_activeImageDiscoveryTab, setTbn2ActiveImageDiscoveryTab] = useState<'utab1' | 'utab2' | 'utab3' | 'utab4'>('utab4');
  
  // Bezel chamber visibility states
  const [tbn2_medievalChamberVisible, setTbn2MedievalChamberVisible] = useState(false);
  const [tbn2_folateChamberVisible, setTbn2FolateChamberVisible] = useState(false);
  const [tbn2_entrenchChamberVisible, setTbn2EntrenchChamberVisible] = useState(true);
  const [tbn2_missileChamberVisible, setTbn2MissileChamberVisible] = useState(true);
  const [tbn2_vesicleChamberVisible, setTbn2VesicleChamberVisible] = useState(true);
  
  // State for pelementor_cached data
  const [tbn2_pelementorCached, setTbn2PelementorCached] = useState<string>('');
  
  // State for rhino_replace process
  const [tbn2_rhinoReplaceLoading, setTbn2RhinoReplaceLoading] = useState<boolean>(false);
  const [tbn2_rhinoProgress, setTbn2RhinoProgress] = useState({
    narpiRecord: 0,
    narpiUpload: 0,
    cliffArrangement: 0,
    masonArrangement: 0,
    boulderArrangement: 0
  });
  
  // State for pre-existing narpi push toggle
  const [tbn2_usePreExistingNarpi, setTbn2UsePreExistingNarpi] = useState<boolean>(true);
  const [tbn2_selectedNarpiPushId, setTbn2SelectedNarpiPushId] = useState<string>('');
  const [tbn2_availableNarpiPushes, setTbn2AvailableNarpiPushes] = useState<Array<{
    id: string;
    push_name: string;
    push_desc: string;
    created_at: string;
    push_status1: string;
    kareench1: any;
  }>>([]);
  const [tbn2_narpiPushesLoading, setTbn2NarpiPushesLoading] = useState<boolean>(false);
  const [tbn2_narpiInputMethod, setTbn2NarpiInputMethod] = useState<'dropdown' | 'manual'>('manual');
  const [tbn2_manualNarpiPushId, setTbn2ManualNarpiPushId] = useState<string>('');
  
  // Local storage functions for UUID
  const saveUuidToLocalStorage = () => {
    if (tbn2_manualNarpiPushId.trim()) {
      localStorage.setItem('tbn2_saved_narpi_uuid', tbn2_manualNarpiPushId.trim());
      setTbn2GadgetFeedback('UUID saved to local storage');
    }
  };
  
  const loadUuidFromLocalStorage = () => {
    const savedUuid = localStorage.getItem('tbn2_saved_narpi_uuid');
    if (savedUuid) {
      setTbn2ManualNarpiPushId(savedUuid);
    }
  };
  const [tbn2_uelBarColors, setTbn2UelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [tbn2_uelBar37Colors, setTbn2UelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [tbn2_currentUrl, setTbn2CurrentUrl] = useState<string>('');
  
  // State for arrangement method selection (Cliff vs Mason)
  const [tbn2_arrangementMethod, setTbn2ArrangementMethod] = useState<'cliff' | 'mason' | 'boulder'>('cliff');
  
  // State for Aranya image removal
  const [tbn2_aranyaLoading, setTbn2AranyaLoading] = useState<boolean>(false);
  const [tbn2_hippoLoading, setTbn2HippoLoading] = useState<boolean>(false);

  // Inject CSS styles for main element styling (cloned from tebnar1)
  useEffect(() => {
    const styleId = 'tbn2-main-styling';
    
    // Remove existing styles
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const generateCSS = () => {
      return `
        main {
          width: ${TBN2_MAIN_ELEMENT_STYLING.layout.width} !important;
          max-width: ${TBN2_MAIN_ELEMENT_STYLING.layout.maxWidth} !important;
          min-width: ${TBN2_MAIN_ELEMENT_STYLING.layout.minWidth} !important;
          height: ${TBN2_MAIN_ELEMENT_STYLING.layout.height} !important;
          min-height: ${TBN2_MAIN_ELEMENT_STYLING.layout.minHeight} !important;
          max-height: ${TBN2_MAIN_ELEMENT_STYLING.layout.maxHeight} !important;
          margin: ${TBN2_MAIN_ELEMENT_STYLING.margins.margin} !important;
          padding: ${TBN2_MAIN_ELEMENT_STYLING.padding.padding} !important;
        }
        
        /* Custom select styling for sitespren and gcon piece dropdowns */
        .tbn2-custom-select {
          background-color: #16267b !important;
          color: #fff !important;
          font-size: 16px !important;
          padding: 4px 8px !important;
          border: 1px solid #16267b !important;
          position: relative;
        }
        
        .tbn2-custom-select:disabled {
          background-color: #e5e7eb !important;
          color: #9ca3af !important;
          border-color: #d1d5db !important;
        }
        
        .tbn2-custom-select option {
          background-color: white !important;
          color: black !important;
          font-size: 16px !important;
        }
        
        .tbn2-custom-select option:disabled {
          color: #9ca3af !important;
        }
        
        /* Specific widths for each dropdown */
        .tbn2-sitespren-select {
          width: 460px !important;
          min-width: 460px !important;
        }
        
        .tbn2-gcon-piece-select {
          width: 400px !important;
          min-width: 400px !important;
        }
        
        /* Allow expansion when dropdown is opened (focused or size changed) */
        .tbn2-sitespren-select:focus,
        .tbn2-sitespren-select[size]:not([size="1"]) {
          width: auto !important;
          min-width: 460px !important;
          max-width: none !important;
        }
        
        .tbn2-gcon-piece-select:focus,
        .tbn2-gcon-piece-select[size]:not([size="1"]) {
          width: auto !important;
          min-width: 400px !important;
          max-width: none !important;
        }
        
        /* Custom display overlay for truncated text */
        .tbn2-select-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 20px;
          bottom: 0;
          background-color: #16267b;
          color: white;
          padding: 4px 8px;
          font-size: 16px;
          pointer-events: none;
          display: flex;
          align-items: center;
          border-radius: 4px;
          z-index: 1;
        }
        
        .tbn2-select-overlay.disabled {
          background-color: #e5e7eb;
          color: #9ca3af;
        }
        
        .tbn2-select-container {
          position: relative;
        }
        
        .tbn2-sitespren-container {
          width: 460px;
          min-width: 460px;
        }
        
        .tbn2-gcon-piece-container {
          width: 400px;
          min-width: 400px;
        }
        
        .tbn2-custom-select:focus + .tbn2-select-overlay,
        .tbn2-custom-select[size]:not([size="1"]) + .tbn2-select-overlay {
          display: none;
        }
        
        /* Tooltip styles for pushador actions - cloned from sitejar4 */
        .group {
          position: relative;
        }
        
        .info-icon {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .tooltip-content {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          background: #1a1a1a;
          color: white;
          padding: 12px;
          border-radius: 6px;
          width: 320px;
          z-index: 50;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          transform: translateY(-5px);
        }
        
        .group:hover .tooltip-content {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 16px;
          border: 6px solid transparent;
          border-top-color: #1a1a1a;
        }
      `;
    };

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = generateCSS();
    document.head.appendChild(styleElement);
    
    // Cleanup function
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);
  
  // Load saved UUID from localStorage on component mount
  useEffect(() => {
    loadUuidFromLocalStorage();
  }, []);

  // Fetch all images for the user using centralized data layer
  const tbn2_fetchImages = async () => {
    if (!user?.id) {
      setTbn2ImagesById({});
      return;
    }
    
    const result = await tbn2_fetchImagesData(user.id);
    if (result.success) {
      setTbn2ImagesById(result.data);
    } else {
      tbn2_log(`Error fetching images: ${result.error}`, 'error');
      setTbn2ImagesById({});
    }
  };

  // Fetch batches using centralized data layer
  const tbn2_fetchBatches = async () => {
    if (!user?.id) {
      setTbn2Batches([]);
      return;
    }
    
    const result = await tbn2_fetchBatchesData(user.id);
    if (result.success) {
      setTbn2Batches(result.data);
    } else {
      tbn2_log(`Error fetching batches: ${result.error}`, 'error');
      setTbn2Batches([]);
    }
  };

  // Fetch plans using centralized data layer
  const tbn2_fetchPlans = async () => {
    if (!user?.id) {
      setTbn2Plans([]);
      setTbn2Loading(false);
      return;
    }

    setTbn2Loading(true);
    setTbn2Error(null);

    const result = await tbn2_fetchImagePlansData(user.id);
    if (result.success) {
      setTbn2Plans(result.data);
      setTbn2Error(null);
    } else {
      setTbn2Error(result.error);
      setTbn2Plans([]);
    }
    setTbn2Loading(false);
  };

  // Function to load dummy data from admin_options - exact clone from tebnar1
  const tbn2_loadDummyData = async () => {
    setTbn2LoadingPreset(true);
    try {
      const response = await fetch('/api/admin-options/kregno_xls_info_1');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      if (result.success && result.data?.json1) {
        const { headers, rows } = result.data.json1;
        
        // Map original column order to new column order
        // Original: e_zpf_img_code, e_width, e_height, e_associated_content1, e_file_name1, e_more_instructions1, e_prompt1, e_ai_tool1
        // New:      e_prompt1, e_zpf_img_code, e_width, e_height, e_associated_content1, e_file_name1, e_more_instructions1, e_ai_tool1, [empty]
        
        const originalHeaderMap = headers.reduce((map: Record<string, number>, header: string, index: number) => {
          map[header] = index;
          return map;
        }, {});
        
        // New header order for the grid
        const newHeaders = ['e_prompt1', 'e_zpf_img_code', 'e_width', 'e_height', 'e_associated_content1', 'e_file_name1', 'e_more_instructions1', 'e_ai_tool1', ''];
        
        // Remap the data rows to match new column order
        const newRows = rows.map((row: string[]) => {
          return newHeaders.map(header => {
            if (header === '') return ''; // Empty column
            const originalIndex = originalHeaderMap[header];
            return originalIndex !== undefined ? row[originalIndex] : '';
          });
        });
        
        // Create grid data with ONLY remapped data rows (no header row)
        const newGridData = newRows;
        setTbn2PresetData(newGridData);
        setTbn2Error('✅ Dummy data loaded successfully!');
      } else {
        throw new Error('No data found or invalid format');
      }
    } catch (err) {
      console.error('Error loading dummy data:', err);
      setTbn2Error(`❌ Failed to load dummy data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTbn2LoadingPreset(false);
    }
  };

  // Function to load 2 random rows from dummy data - new function
  const tbn2_loadDummyData2Rows = async () => {
    setTbn2LoadingPreset(true);
    try {
      const response = await fetch('/api/admin-options/kregno_xls_info_1');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      if (result.success && result.data?.json1) {
        const { headers, rows } = result.data.json1;
        
        // Randomly select 2 rows from the available rows
        const shuffledRows = [...rows].sort(() => Math.random() - 0.5);
        const selectedRows = shuffledRows.slice(0, 2);
        
        // Map original column order to new column order (same as full dummy data)
        const originalHeaderMap = headers.reduce((map: Record<string, number>, header: string, index: number) => {
          map[header] = index;
          return map;
        }, {});
        
        // New header order for the grid
        const newHeaders = ['e_prompt1', 'e_zpf_img_code', 'e_width', 'e_height', 'e_associated_content1', 'e_file_name1', 'e_more_instructions1', 'e_ai_tool1', ''];
        
        // Remap the selected 2 rows to match new column order
        const newRows = selectedRows.map((row: string[]) => {
          return newHeaders.map(header => {
            if (header === '') return ''; // Empty column
            const originalIndex = originalHeaderMap[header];
            return originalIndex !== undefined ? row[originalIndex] : '';
          });
        });
        
        // Create grid data with ONLY 2 remapped data rows (no header row)
        const newGridData = newRows;
        
        setTbn2PresetData(newGridData);
        setTbn2Error('✅ 2 random rows loaded successfully!');
      } else {
        throw new Error('No data found or invalid format');
      }
    } catch (err) {
      console.error('Error loading 2 random rows:', err);
      setTbn2Error(`❌ Failed to load 2 random rows: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTbn2LoadingPreset(false);
    }
  };

  // Function to fetch available narpi pushes for the current sitespren
  const tbn2_fetchAvailableNarpiPushes = async () => {
    if (!tbn2_selectedSitesprenId) {
      console.log('🔍 Narpi Debug: No sitespren selected');
      setTbn2AvailableNarpiPushes([]);
      return;
    }

    console.log(`🔍 Narpi Debug: Fetching for sitespren ${tbn2_selectedSitesprenId}, user ${user.id}`);
    setTbn2NarpiPushesLoading(true);
    try {
      // First, get database user ID
      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (dbUserError || !dbUser) {
        console.error('🔍 Narpi Debug: Database user not found:', dbUserError);
        throw new Error('Database user not found');
      }

      console.log(`🔍 Narpi Debug: Database user ID: ${dbUser.id}`);
      console.log(`🔍 Narpi Debug: Selected sitespren ID: ${tbn2_selectedSitesprenId}`);
      
      // DEBUG: First check ALL batches for this user (without sitespren filter)
      const { data: allUserBatches, error: allBatchError } = await supabase
        .from('images_plans_batches')
        .select('id, batch_name, asn_sitespren_id')
        .eq('rel_users_id', dbUser.id);
      
      console.log(`🔍 Narpi Debug: ALL batches for user ${dbUser.id}:`, allUserBatches?.map(b => ({
        id: b.id,
        name: b.batch_name,
        sitespren: b.asn_sitespren_id || 'NOT SET'
      })));

      // Now get batches for this specific sitespren
      const { data: batchesData, error: batchesError } = await supabase
        .from('images_plans_batches')
        .select('id, batch_name, rel_users_id, asn_sitespren_id')
        .eq('rel_users_id', dbUser.id)
        .eq('asn_sitespren_id', tbn2_selectedSitesprenId);

      if (batchesError) {
        console.error('🔍 Narpi Debug: Error fetching batches:', batchesError);
        throw batchesError;
      }

      console.log(`🔍 Narpi Debug: Found ${batchesData?.length || 0} batches for user ${dbUser.id} and sitespren ${tbn2_selectedSitesprenId}`);
      batchesData?.forEach(batch => {
        console.log(`  -> Batch: ${batch.id} (${batch.batch_name})`);
      });

      if (!batchesData || batchesData.length === 0) {
        console.log('🔍 Narpi Debug: No batches found for this user and sitespren combination');
        
        // DEBUG: Try without sitespren filter to see if that's the issue
        console.log('🔍 Narpi Debug: Testing without sitespren filter...');
        
        if (allUserBatches && allUserBatches.length > 0) {
          console.log(`🔍 Narpi Debug: Found ${allUserBatches.length} batches when ignoring sitespren filter`);
          console.log('🔍 Narpi Debug: This suggests batches exist but have different or missing asn_sitespren_id values');
          
          // Check if the current batch is in the list
          const currentBatch = allUserBatches.find(b => b.id === tbn2_selectedBatchId);
          if (currentBatch) {
            console.log(`🔍 Narpi Debug: Current batch ${tbn2_selectedBatchId} has asn_sitespren_id: ${currentBatch.asn_sitespren_id || 'NOT SET'}`);
          }
        }
        
        setTbn2AvailableNarpiPushes([]);
        return;
      }

      const batchIds = batchesData.map(b => b.id);

      // Now get narpi_pushes for these batches
      const { data: narpiPushes, error: narpiError } = await supabase
        .from('narpi_pushes')
        .select('id, push_name, push_desc, created_at, push_status1, kareench1, fk_batch_id')
        .in('fk_batch_id', batchIds)
        .order('created_at', { ascending: false });

      if (narpiError) {
        console.error('🔍 Narpi Debug: Error fetching narpi pushes:', narpiError);
        throw narpiError;
      }

      console.log(`🔍 Narpi Debug: Found ${narpiPushes?.length || 0} narpi pushes for these batches`);

      const userSitesprenPushes = narpiPushes || [];

      // Log details of found pushes
      userSitesprenPushes.forEach(push => {
        console.log(`🔍 Narpi Debug: Push ${push.id} - Status: ${push.push_status1}, Kareench1 length: ${push.kareench1?.length || 0}`);
        if (push.kareench1?.length > 0) {
          const statuses = push.kareench1.map((item: any) => item.nupload_status1);
          console.log(`  -> Upload statuses:`, statuses);
        }
      });

      // TEMPORARILY DISABLED: No filtering for errors - show ALL pushes
      const errorFreePushes = userSitesprenPushes.filter(push => {
        // Log what we would have filtered before
        const hasKareench1 = push.kareench1 && Array.isArray(push.kareench1);
        const hasErrors = hasKareench1 && push.kareench1.some((item: any) => 
          item.nupload_status1 === 'failed'
        );
        const isCompleted = push.push_status1 === 'completed';
        
        console.log(`🔍 Narpi Debug: Push ${push.id} - Status: ${push.push_status1}, Has kareench1: ${hasKareench1}, Has errors: ${hasErrors}, Is completed: ${isCompleted}`);
        console.log(`  -> ALLOWING ALL PUSHES (no filtering applied)`);
        
        // Return true for ALL pushes to test the rest of the logic
        return true;
      });

      console.log(`🔍 Narpi Debug: After filtering - ${errorFreePushes.length} error-free completed pushes`);
      
      // Log summary
      console.log(`🔍 Narpi Debug Summary:
        - Sitespren ID: ${tbn2_selectedSitesprenId}
        - User DB ID: ${dbUser.id}
        - Batches found: ${batchesData?.length || 0}
        - Total pushes: ${narpiPushes?.length || 0}
        - Eligible pushes: ${errorFreePushes.length}
      `);
      
      setTbn2AvailableNarpiPushes(errorFreePushes);
    } catch (err) {
      console.error('🔍 Narpi Debug: Error fetching narpi pushes:', err);
      setTbn2AvailableNarpiPushes([]);
    } finally {
      setTbn2NarpiPushesLoading(false);
    }
  };

  // Function to submit create plans from XLS - independent tebnar2 version
  const tbn2_handleSubmitCreatePlans = async () => {
    setTbn2SubmitLoading(true);
    setTbn2SubmitResult(null);
    
    try {
      // Check if user has selected a batch
      if (!tbn2_selectedBatchId) {
        throw new Error('Please select or create a batch first.');
      }

      // Convert gridData to records - updated to use default headers if first row is empty
      if (!tbn2_gridData || tbn2_gridData.length === 0) {
        throw new Error('Grid is empty. Please load data first.');
      }
      
      // Default column headers based on the table structure
      const defaultHeaders = [
        'e_prompt1', 'e_zpf_img_code', 'e_width', 'e_height', 
        'e_associated_content1', 'e_file_name1', 'e_more_instructions1', 'e_ai_tool1', ''
      ];
      
      // Check if first row contains valid headers or is empty
      const firstRowHasHeaders = tbn2_gridData[0].some(cell => 
        cell.trim() && defaultHeaders.includes(cell.trim())
      );
      
      let fieldNames: string[];
      let rows: string[][];
      
      if (firstRowHasHeaders) {
        // Use first row as headers
        fieldNames = tbn2_gridData[0].map(f => f.trim()).filter(Boolean);
        rows = tbn2_gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
      } else {
        // Use default headers and include all rows (including first row)
        fieldNames = defaultHeaders.filter(h => h !== ''); // Remove empty header
        rows = tbn2_gridData.filter(row => row.some(cell => cell.trim() !== ''));
      }
      
      if (rows.length === 0) {
        throw new Error('Grid has no data rows');
      }
      
      const records = rows.map(row => {
        const obj: Record<string, string> = {};
        fieldNames.forEach((field, idx) => {
          if (field) obj[field] = row[idx] ?? '';
        });
        return obj;
      });
      
      const result = await tbn2_func_create_plans_from_xls_2(records, tbn2_gridData, tbn2_selectedBatchId);
      
      if (result.success) {
        setTbn2SubmitResult('✅ Plans created successfully!');
        // Refresh the plans data to show new entries
        tbn2_fetchPlans();
      } else {
        setTbn2SubmitResult(`❌ Failed to create plans: ${result.message}`);
      }
    } catch (err) {
      console.error('Error creating plans:', err);
      setTbn2SubmitResult(`❌ Error creating plans: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTbn2SubmitLoading(false);
    }
  };

  // Function to submit create plans and make images - independent tebnar2 version
  const tbn2_handleSubmitMakeImages = async () => {
    setTbn2MakeImagesLoading(true);
    setTbn2MakeImagesResult(null);
    
    try {
      // Check if user has selected a batch
      if (!tbn2_selectedBatchId) {
        throw new Error('Please select or create a batch first.');
      }

      // Convert gridData to records - updated to use default headers if first row is empty
      if (!tbn2_gridData || tbn2_gridData.length === 0) {
        throw new Error('Grid is empty. Please load data first.');
      }
      
      // Default column headers based on the table structure
      const defaultHeaders = [
        'e_prompt1', 'e_zpf_img_code', 'e_width', 'e_height', 
        'e_associated_content1', 'e_file_name1', 'e_more_instructions1', 'e_ai_tool1', ''
      ];
      
      // Check if first row contains valid headers or is empty
      const firstRowHasHeaders = tbn2_gridData[0].some(cell => 
        cell.trim() && defaultHeaders.includes(cell.trim())
      );
      
      let fieldNames: string[];
      let rows: string[][];
      
      if (firstRowHasHeaders) {
        // Use first row as headers
        fieldNames = tbn2_gridData[0].map(f => f.trim()).filter(Boolean);
        rows = tbn2_gridData.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
      } else {
        // Use default headers and include all rows (including first row)
        fieldNames = defaultHeaders.filter(h => h !== ''); // Remove empty header
        rows = tbn2_gridData.filter(row => row.some(cell => cell.trim() !== ''));
      }
      
      if (rows.length === 0) {
        throw new Error('Grid has no data rows');
      }
      
      // Find e_prompt1 column index - REQUIRED FIELD
      const promptColumnIndex = fieldNames.indexOf('e_prompt1');
      if (promptColumnIndex === -1) {
        throw new Error('e_prompt1 column is required but not found in headers. Please ensure the e_prompt1 column exists.');
      }
      
      // Check each row has e_prompt1 content - ONLY REQUIRED FIELD
      const invalidRows: number[] = [];
      rows.forEach((row, index) => {
        const promptValue = row[promptColumnIndex]?.trim();
        if (!promptValue) {
          // Adjust row number based on whether first row was headers
          const rowNum = firstRowHasHeaders ? index + 2 : index + 1;
          invalidRows.push(rowNum);
        }
      });
      
      if (invalidRows.length > 0) {
        throw new Error(`e_prompt1 is required and must have content. Missing or empty e_prompt1 in rows: ${invalidRows.join(', ')}`);
      }
      
      const records = rows.map(row => {
        const obj: Record<string, string> = {};
        fieldNames.forEach((field, idx) => {
          if (field) obj[field] = row[idx] ?? '';
        });
        return obj;
      });
      
      const result = await tbn2_func_create_plans_make_images_2({
        records: records,
        qty: tbn2_qtyPerPlan,
        aiModel: tbn2_aiModel,
        generateZip: tbn2_generateZip,
        wipeMeta: tbn2_wipeMeta,
        screenshotImages: tbn2_screenshotImages,
        alterpro: tbn2_alterpro,
        throttle1: tbn2_throttle1,
        gridData: tbn2_gridData,
        batchId: tbn2_selectedBatchId
      });
      
      if (result.success) {
        setTbn2MakeImagesResult('🚀 Images generation started successfully!');
        // Refresh the plans data to show updated entries
        tbn2_fetchPlans();
        // Also refresh images to show new ones
        tbn2_fetchImages();
      } else {
        setTbn2MakeImagesResult(`❌ Failed to generate images: ${result.message}`);
      }
    } catch (err) {
      console.error('Error generating images:', err);
      setTbn2MakeImagesResult(`❌ Error generating images: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTbn2MakeImagesLoading(false);
    }
  };

  // Function to create narpi push for selected images to sitespren site - tebnar2 specific
  const tbn2_sfunc63_createNarpiPush = async () => {
    // Validation checks
    if (!tbn2_selectedBatchId || tbn2_narpiPushLoading) return;
    
    if (!tbn2_selectedSitesprenId) {
      setTbn2Error('❌ Please select a sitespren site first');
      return;
    }
    
    if (tbn2_selectedRows.size === 0) {
      setTbn2Error('❌ Please select at least one image plan from the table');
      return;
    }
    
    setTbn2NarpiPushLoading(true);
    setTbn2NarpiPushProgress(0);
    setTbn2NarpiPushStatus('Initializing narpi push...');
    setTbn2Error(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTbn2NarpiPushProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      
      setTbn2NarpiPushStatus('Creating narpi push record...');
      
      // Call the sfunc_63_push_images API endpoint with sitespren and selected plans
      const response = await fetch('/api/bin45/sfunc_63_push_images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: tbn2_selectedBatchId,
          sitespren_id: tbn2_selectedSitesprenId,
          selected_plan_ids: Array.from(tbn2_selectedRows),
          push_method: 'tebnar2_sitespren_push'
        })
      });
      
      clearInterval(progressInterval);
      setTbn2NarpiPushProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setTbn2NarpiPushStatus('✅ Narpi push created successfully!');
      setTbn2Error(`🚀 Narpi push completed! Push ID: ${result.push_id} | Pushed ${tbn2_selectedRows.size} images to ${tbn2_currentSitesprenBase}`);
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setTbn2NarpiPushStatus(null);
        setTbn2NarpiPushProgress(0);
      }, 5000);
      
    } catch (err) {
      console.error('TBN2 Narpi push error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTbn2NarpiPushStatus('❌ Narpi push failed');
      setTbn2Error(`❌ Failed to create narpi push: ${errorMessage}`);
      
      // Clear error and status after 10 seconds
      setTimeout(() => {
        setTbn2NarpiPushStatus(null);
        setTbn2NarpiPushProgress(0);
        setTbn2Error(null);
      }, 10000);
      
    } finally {
      setTbn2NarpiPushLoading(false);
    }
  };

  // Function to fetch a single image for a specific plan and slot - independent tebnar2 version
  const tbn2_fetchSingleImage = async (plan: Tebnar2ImagePlan, imageSlot: number) => {
    console.log('🚀 TBN2 FETCH SINGLE IMAGE FUNCTION CALLED!', { plan_id: plan.id, imageSlot });
    
    const fetchKey = `${plan.id}-${imageSlot}`;
    const now = Date.now();
    
    // Debounce: prevent multiple clicks within TBN2_DEBOUNCE_MS (2 seconds)
    if (tbn2_lastClickTime[fetchKey] && (now - tbn2_lastClickTime[fetchKey]) < TBN2_DEBOUNCE_MS) {
      console.log('⏳ Request debounced - too soon since last click');
      setTbn2Error(`⏳ Please wait ${Math.ceil((TBN2_DEBOUNCE_MS - (now - tbn2_lastClickTime[fetchKey])) / 1000)} seconds before trying again`);
      return;
    }
    
    // Check if already fetching this image
    if (tbn2_fetchingImages.has(fetchKey)) {
      console.log('⏳ Request already in progress for this image');
      setTbn2Error('⏳ Image generation already in progress for this slot');
      return;
    }
    
    setTbn2LastClickTime(prev => ({ ...prev, [fetchKey]: now }));
    
    try {
      setTbn2FetchingImages(prev => new Set([...prev, fetchKey]));
      setTbn2FetchStatusMessages(prev => ({ ...prev, [fetchKey]: 'Preparing...' }));
      setTbn2Error(null);
      
      // Validate prompt data
      const prompt = plan.e_prompt1 || plan.e_more_instructions1 || plan.e_file_name1;
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new Error('No valid prompt found for this plan.');
      }
      
      // Update status: sending prompt
      setTbn2FetchStatusMessages(prev => ({ ...prev, [fetchKey]: 'Sending prompt...' }));
      
      // Create request data
      const imageData = {
        plan_id: plan.id,
        image_slot: imageSlot,
        prompt: prompt.trim(),
        aiModel: tbn2_aiModel,
        wipeMeta: tbn2_wipeMeta,
        screenshotImages: tbn2_screenshotImages,
        alterpro: tbn2_alterpro
      };
      
      // Update status: fetching image
      setTbn2FetchStatusMessages(prev => ({ ...prev, [fetchKey]: 'Fetching image...' }));
      
      // Make API call to tebnar2 endpoint
      const response = await fetch('/api/tbn2_sfunc_fetch_single_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      });
      
      // Update status based on screenshot settings
      if (tbn2_screenshotImages) {
        setTbn2FetchStatusMessages(prev => ({ ...prev, [fetchKey]: 'Screenshotting...' }));
        
        if (tbn2_alterpro?.enabled) {
          setTimeout(() => {
            setTbn2FetchStatusMessages(prev => ({ ...prev, [fetchKey]: 'Cropping with alterpro...' }));
          }, 1000);
        }
      }
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Please wait before generating another image (rate limited)');
        } else if (response.status === 400) {
          throw new Error('Invalid request - please check the plan data');
        } else if (response.status === 500) {
          throw new Error('Server error - please try again in a moment');
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }
      
      const result = await response.json();
      
      // Update status: saving
      setTbn2FetchStatusMessages(prev => ({ ...prev, [fetchKey]: 'Saving...' }));
      
      if (result.success) {
        // Refresh images and plans data using centralized functions
        if (user?.id) {
          const imagesResult = await tbn2_fetchImagesData(user.id);
          if (imagesResult.success) {
            setTbn2ImagesById(imagesResult.data);
          }
          
          const plansResult = await tbn2_fetchImagePlansData(user.id);
          if (plansResult.success) {
            setTbn2Plans(plansResult.data);
          }
        }
        
        setTbn2Error(`✅ Image ${imageSlot} generated successfully for plan ${plan.id}`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setTbn2Error(null), 5000);
        
      } else {
        setTbn2Error(`❌ Failed to generate image ${imageSlot}: ${result.message || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('TBN2 Fetch single image error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTbn2Error(`❌ Error fetching image: ${errorMessage}`);
      
      // Clear error message after 10 seconds
      setTimeout(() => setTbn2Error(null), 10000);
      
    } finally {
      setTbn2FetchingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(fetchKey);
        return newSet;
      });
      
      // Clean up status message
      setTbn2FetchStatusMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[fetchKey];
        return newMessages;
      });
    }
  };

  // Helper function to truncate UUID for display
  const tbn2_truncateUUID = (uuid: string) => {
    if (!uuid || uuid.length < 8) return uuid;
    return uuid.substring(0, 4) + '...';
  };

  // Helper function to get display text for selected option
  const tbn2_getSelectedSitesprenDisplay = () => {
    if (!tbn2_selectedSitesprenId) return '';
    const option = tbn2_sitesprenOptions.find(s => s.id === tbn2_selectedSitesprenId);
    if (!option) return '';
    return `${tbn2_truncateUUID(option.id)} - ${option.sitespren_base}`;
  };

  // Filter sitespren options based on search term
  const tbn2_getFilteredSitesprenOptions = () => {
    if (!tbn2_sitesprenSearchTerm) return tbn2_sitesprenOptions;
    return tbn2_sitesprenOptions.filter(option => 
      option.sitespren_base.toLowerCase().includes(tbn2_sitesprenSearchTerm.toLowerCase())
    );
  };

  // Filter gcon piece options based on search term (searches both meta_title and post_name)
  const tbn2_getFilteredGconPieceOptions = () => {
    if (!tbn2_gconPieceSearchTerm) return tbn2_gconPieceOptions;
    return tbn2_gconPieceOptions.filter(option => 
      option.meta_title.toLowerCase().includes(tbn2_gconPieceSearchTerm.toLowerCase()) ||
      (option.post_name && option.post_name.toLowerCase().includes(tbn2_gconPieceSearchTerm.toLowerCase()))
    );
  };

  // Generate URLs for gcon piece quick actions
  const tbn2_getGconPieceUrls = () => {
    if (!tbn2_selectedGconPieceId) return null;
    const selectedPiece = tbn2_gconPieceOptions.find(option => option.id === tbn2_selectedGconPieceId);
    if (!selectedPiece) return null;

    const sitesprenBase = selectedPiece.asn_sitespren_base;
    const postId = selectedPiece.g_post_id;
    const pageUrl = selectedPiece.pageurl;

    return {
      pendulum: sitesprenBase ? `https://${sitesprenBase}/wp-admin/post.php?post=${postId}&action=edit` : null,
      elementor: sitesprenBase ? `https://${sitesprenBase}/wp-admin/post.php?post=${postId}&action=elementor` : null,
      frontend: pageUrl || null
    };
  };

  const tbn2_getSelectedGconPieceDisplay = () => {
    if (!tbn2_selectedGconPieceId) return '';
    const option = tbn2_gconPieceOptions.find(g => g.id === tbn2_selectedGconPieceId);
    if (!option) return '';
    return `${tbn2_truncateUUID(option.id)} - ${option.meta_title}`;
  };

  // Column Template System Constants - tebnar2 specific
  const TBN2_COLUMN_TEMPLATES = {
    option1: { range: [0, -1], label: 'col temp all', description: 'columns 1-~' },
    option2: { range: [0, 6], label: 'col temp a', description: 'columns 1-7' },
    option3: { range: [7, 13], label: 'col temp b', description: 'columns 8-14' },
    option4: { range: [14, 20], label: 'col temp c', description: 'columns 15-21' },
    option5: { range: [21, 27], label: 'col temp d', description: 'columns 22-28' }
  };

  // Get all table columns for template system
  const tbn2_getAllTableColumns = () => {
    return [
      'submission_order',
      'int1', 'fk_image1_id', 'image1-preview', 'supabase-filename', 'rename-field-1',
      'int2', 'fk_image2_id', 'image2-preview',
      'int3', 'fk_image3_id', 'image3-preview',
      'int4', 'fk_image4_id', 'image4-preview',
      'id', 'rel_users_id', 'rel_images_plans_batches_id', 'created_at',
      'e_zpf_img_code', 'e_width', 'e_height', 'e_associated_content1',
      'e_file_name1', 'e_more_instructions1', 'e_prompt1', 'e_ai_tool1'
    ];
  };

  // Function to determine visible columns based on template
  const tbn2_getVisibleColumns = () => {
    const template = TBN2_COLUMN_TEMPLATES[tbn2_selectedColTemplate as keyof typeof TBN2_COLUMN_TEMPLATES];
    const allColumns = tbn2_getAllTableColumns();
    
    if (template.range[1] === -1) {
      return allColumns; // Show all columns
    }
    
    return allColumns.slice(template.range[0], template.range[1] + 1);
  };

  // Function to get sticky columns
  const tbn2_getStickyColumns = () => {
    return tbn2_getAllTableColumns().slice(0, tbn2_stickyColCount);
  };

  // Function to get non-sticky visible columns
  const tbn2_getNonStickyVisibleColumns = () => {
    const visibleColumns = tbn2_getVisibleColumns();
    return visibleColumns.slice(tbn2_stickyColCount);
  };

  // Sorting handler function
  const tbn2_handleSort = (columnKey: string) => {
    if (tbn2_sortColumn === columnKey) {
      // Toggle direction if same column
      setTbn2SortDirection(tbn2_sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setTbn2SortColumn(columnKey);
      setTbn2SortDirection('asc');
    }
  };

  // Rename file handler function
  const tbn2_handleRenameFile = async (imageId: string, newFilename: string) => {
    try {
      setTbn2RenamingFiles(prev => new Set([...prev, imageId]));

      const response = await fetch('/api/tbn2_rename_file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, newFilename })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh images to show updated filename
        tbn2_fetchImages();
        console.log(`✅ Successfully renamed file: ${result.message}`);
      } else {
        console.error(`❌ Failed to rename file: ${result.message}`);
        alert(`Failed to rename file: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error renaming file:', error);
      alert(`Error renaming file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTbn2RenamingFiles(prev => {
        const updated = new Set(prev);
        updated.delete(imageId);
        return updated;
      });
    }
  };

  // Rocket Chamber handler functions
  const tbn2_handleWolfOptionsClick = () => {
    setTbn2IsWolfOptionsOpen(true);
  };

  const tbn2_handlePillarshiftColtempsClick = () => {
    setTbn2IsPillarShiftModalOpen(true);
    tbn2_fetchSheafData();
  };

  // Wolf options save handler
  const tbn2_handleWolfOptionsChange = (newOptions: any) => {
    setTbn2WolfOptions(newOptions);
    localStorage.setItem('tebnar2-wolf-options', JSON.stringify(newOptions));
  };

  // Fetch sheaf data for tebnar2
  const tbn2_fetchSheafData = async () => {
    setTbn2SheafLoading(true);
    try {
      // Mock sheaf data for tebnar2 image plans table
      const tbn2SheafData = {
        columns: [
          { id: 'submission_order', name: 'submission_order', type: 'number', width: '80px', group: 'ordering', visible: true, order: 1 },
          { id: 'int1', name: 'int1', type: 'number', width: '60px', group: 'intent_columns', visible: true, order: 2 },
          { id: 'int2', name: 'int2', type: 'number', width: '60px', group: 'intent_columns', visible: true, order: 3 },
          { id: 'int3', name: 'int3', type: 'number', width: '60px', group: 'intent_columns', visible: true, order: 4 },
          { id: 'int4', name: 'int4', type: 'number', width: '60px', group: 'intent_columns', visible: true, order: 5 },
          { id: 'fk_image1_id', name: 'fk_image1_id', type: 'text', width: '45px', group: 'image_references', visible: true, order: 6 },
          { id: 'fk_image2_id', name: 'fk_image2_id', type: 'text', width: '45px', group: 'image_references', visible: true, order: 7 },
          { id: 'fk_image3_id', name: 'fk_image3_id', type: 'text', width: '45px', group: 'image_references', visible: true, order: 8 },
          { id: 'fk_image4_id', name: 'fk_image4_id', type: 'text', width: '45px', group: 'image_references', visible: true, order: 9 },
          { id: 'image1-preview', name: 'image1-preview', type: 'preview', width: '100px', group: 'image_previews', visible: true, order: 10 },
          { id: 'image2-preview', name: 'image2-preview', type: 'preview', width: '100px', group: 'image_previews', visible: true, order: 11 },
          { id: 'image3-preview', name: 'image3-preview', type: 'preview', width: '100px', group: 'image_previews', visible: true, order: 12 },
          { id: 'image4-preview', name: 'image4-preview', type: 'preview', width: '100px', group: 'image_previews', visible: true, order: 13 },
          { id: 'e_prompt1', name: 'e_prompt1', type: 'text', width: '300px', group: 'plan_content', visible: true, order: 14 },
          { id: 'e_zpf_img_code', name: 'e_zpf_img_code', type: 'text', width: '120px', group: 'plan_content', visible: true, order: 15 },
          { id: 'e_width', name: 'e_width', type: 'number', width: '80px', group: 'plan_content', visible: true, order: 16 },
          { id: 'e_height', name: 'e_height', type: 'number', width: '80px', group: 'plan_content', visible: true, order: 17 },
          { id: 'e_file_name1', name: 'e_file_name1', type: 'text', width: '200px', group: 'plan_content', visible: true, order: 18 },
          { id: 'id', name: 'id', type: 'text', width: '200px', group: 'metadata', visible: true, order: 19 },
          { id: 'created_at', name: 'created_at', type: 'datetime', width: '160px', group: 'metadata', visible: true, order: 20 }
        ],
        metadata: {
          table_name: 'images_plans',
          description: 'Tebnar2 Image Plans System - AI-generated image planning and execution',
          utg_id: 'utg_tebnar2',
          created_date: new Date().toISOString(),
          column_groups: {
            'ordering': 'Submission and display order fields',
            'intent_columns': 'Intent tracking columns (int1-int4)',
            'image_references': 'Foreign key references to generated images',
            'image_previews': 'Preview columns for generated images',
            'plan_content': 'Core image plan content and specifications',
            'metadata': 'System metadata and timestamps'
          }
        }
      };
      
      setTbn2SheafData(JSON.stringify(tbn2SheafData, null, 2));
    } catch (error) {
      console.error('Error generating sheaf data:', error);
    } finally {
      setTbn2SheafLoading(false);
    }
  };

  // Function to sort plans data
  const tbn2_getSortedPlans = (plans: Tebnar2ImagePlan[]) => {
    if (!tbn2_sortColumn) {
      return plans; // No sorting applied
    }

    return [...plans].sort((a, b) => {
      const aValue = a[tbn2_sortColumn as keyof Tebnar2ImagePlan];
      const bValue = b[tbn2_sortColumn as keyof Tebnar2ImagePlan];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return tbn2_sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return tbn2_sortDirection === 'asc' ? -1 : 1;

      // Handle different data types
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        // Convert to string for comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return tbn2_sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Column width reference for sticky positioning
  const tbn2_getColumnWidth = (col: string) => {
    const widthMap: Record<string, string> = {
      submission_order: '80px',
      int1: '60px', int2: '60px', int3: '60px', int4: '60px',
      fk_image1_id: '45px', fk_image2_id: '45px', fk_image3_id: '45px', fk_image4_id: '45px',
      'image1-preview': '100px', 'image2-preview': '100px', 'image3-preview': '100px', 'image4-preview': '100px',
      'supabase-filename': '180px',
      'rename-field-1': '220px',
      id: '200px', rel_users_id: '150px', rel_images_plans_batches_id: '150px', created_at: '160px',
      e_zpf_img_code: '120px', e_width: '80px', e_height: '80px', e_associated_content1: '200px',
      e_file_name1: '200px', e_more_instructions1: '250px', e_prompt1: '300px', e_ai_tool1: '120px'
    };
    return widthMap[col] || '100px';
  };

  // Function to calculate sticky left position
  const tbn2_calculateStickyLeft = (index: number) => {
    let leftPosition = 0;
    const allColumns = tbn2_getAllTableColumns();
    
    for (let i = 0; i < index; i++) {
      const col = allColumns[i];
      const widthStr = tbn2_getColumnWidth(col);
      leftPosition += parseInt(widthStr.replace('px', ''));
    }
    return `${leftPosition}px`;
  };

  // Handlers for column template system
  const tbn2_handleColumnTemplateChange = (templateKey: string) => {
    setTbn2SelectedColTemplate(templateKey);
    tbn2_updateColumnTemplateUrl(templateKey, tbn2_stickyColCount);
    tbn2_saveColumnTemplateState(templateKey, tbn2_stickyColCount);
  };

  const tbn2_handleStickyColChange = (count: number) => {
    setTbn2StickyColCount(count);
    tbn2_updateColumnTemplateUrl(tbn2_selectedColTemplate, count);
    tbn2_saveColumnTemplateState(tbn2_selectedColTemplate, count);
  };

  // Function to update URL with column template parameters
  const tbn2_updateColumnTemplateUrl = (colTemplate: string, stickyCount: number) => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const url = new URL(window.location.href);
    url.searchParams.set('coltemp', colTemplate);
    url.searchParams.set('stickycol', `option${stickyCount}`);
    window.history.replaceState({}, '', url.toString());
  };

  // Function to save column template state to localStorage
  const tbn2_saveColumnTemplateState = (colTemplate: string, stickyCount: number) => {
    if (typeof window === 'undefined') return; // SSR safety
    
    localStorage.setItem('tbn2_columnTemplate', colTemplate);
    localStorage.setItem('tbn2_stickyColumns', stickyCount.toString());
  };

  // Function to load column template state from localStorage
  const tbn2_loadColumnTemplateState = () => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const savedTemplate = localStorage.getItem('tbn2_columnTemplate');
    const savedSticky = localStorage.getItem('tbn2_stickyColumns');
    
    if (savedTemplate && TBN2_COLUMN_TEMPLATES[savedTemplate as keyof typeof TBN2_COLUMN_TEMPLATES]) {
      setTbn2SelectedColTemplate(savedTemplate);
    }
    if (savedSticky) {
      const count = parseInt(savedSticky);
      if (count >= 1 && count <= 5) {
        setTbn2StickyColCount(count);
      }
    }
  };

  // Function to read column template URL parameters
  const tbn2_readColumnTemplateUrlParams = () => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const urlParams = new URLSearchParams(window.location.search);
    const colTemp = urlParams.get('coltemp');
    const stickyCol = urlParams.get('stickycol');
    
    if (colTemp && TBN2_COLUMN_TEMPLATES[colTemp as keyof typeof TBN2_COLUMN_TEMPLATES]) {
      setTbn2SelectedColTemplate(colTemp);
    }
    if (stickyCol) {
      const count = parseInt(stickyCol.replace('option', ''));
      if (count >= 1 && count <= 5) {
        setTbn2StickyColCount(count);
      }
    }
  };

  // Effect to load column template state and URL params on mount
  useEffect(() => {
    tbn2_loadColumnTemplateState();
    tbn2_readColumnTemplateUrlParams();
  }, []);

  // Function to update URL with batch parameter - tebnar2 specific
  const tbn2_updateUrlWithBatch = (batchId: string) => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const url = new URL(window.location.href);
    
    if (batchId && batchId !== '') {
      url.searchParams.set('batchid', batchId);
    } else {
      url.searchParams.delete('batchid');
    }
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  };

  // Function to validate if batch ID exists in current batches
  const tbn2_validateBatchId = (batchId: string): boolean => {
    return tbn2_batches.some(batch => batch.id === batchId);
  };

  // Fetch current batch's sitespren assignment
  const tbn2_fetchBatchSitespren = async (batchId: string) => {
    if (!batchId) {
      setTbn2SelectedSitesprenId('');
      setTbn2CurrentSitesprenBase('');
      setTbn2GconPieceOptions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('asn_sitespren_id')
        .eq('id', batchId)
        .single();

      if (!error && data && data.asn_sitespren_id) {
        setTbn2SelectedSitesprenId(data.asn_sitespren_id);
        // Find the sitespren_base for this ID
        const selectedSitespren = tbn2_sitesprenOptions.find(s => s.id === data.asn_sitespren_id);
        if (selectedSitespren) {
          setTbn2CurrentSitesprenBase(selectedSitespren.sitespren_base);
          tbn2_fetchGconPieces(selectedSitespren.sitespren_base);
        }
      } else {
        setTbn2SelectedSitesprenId('');
        setTbn2CurrentSitesprenBase('');
        setTbn2GconPieceOptions([]);
      }
    } catch (err) {
      console.error('Error fetching batch sitespren:', err);
      setTbn2SelectedSitesprenId('');
      setTbn2CurrentSitesprenBase('');
      setTbn2GconPieceOptions([]);
    }
  };

  // Enhanced batch change handler that updates URL and loads sitespren
  const tbn2_handleBatchChange = (batchId: string) => {
    setTbn2SelectedBatchId(batchId);
    tbn2_updateUrlWithBatch(batchId);
    tbn2_fetchBatchSitespren(batchId);
    tbn2_fetchBatchGconPiece(batchId);
    tbn2_fetchAssignedGconPiece(batchId);
    tbn2_fetchBatchSeedUrls(batchId);
  };

  // Function to read URL parameters on component mount
  const tbn2_readUrlParameters = () => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const urlParams = new URLSearchParams(window.location.search);
    const batchIdParam = urlParams.get('batchid');
    
    if (batchIdParam) {
      setTbn2UrlBatchId(batchIdParam);
    }
  };

  // Effect to read URL parameters on mount
  useEffect(() => {
    tbn2_readUrlParameters();
  }, []);

  // Effect to handle URL parameter validation after batches are loaded
  useEffect(() => {
    if (tbn2_urlBatchId && tbn2_batches.length > 0) {
      if (tbn2_validateBatchId(tbn2_urlBatchId)) {
        // Valid batch ID - apply the filter
        setTbn2SelectedBatchId(tbn2_urlBatchId);
        tbn2_fetchBatchSitespren(tbn2_urlBatchId);
        tbn2_fetchBatchGconPiece(tbn2_urlBatchId);
        tbn2_fetchAssignedGconPiece(tbn2_urlBatchId);
        tbn2_fetchBatchSeedUrls(tbn2_urlBatchId); // Fetch seed URLs on page load
        setTbn2UrlBatchId(null); // Clear the URL batch ID state
      } else {
        // Invalid batch ID - show error and clear URL param
        setTbn2Error(`❌ Batch ID "${tbn2_urlBatchId}" not found or not accessible`);
        tbn2_updateUrlWithBatch('');
        setTbn2UrlBatchId(null);
        
        // Clear error message after 8 seconds
        setTimeout(() => setTbn2Error(null), 8000);
      }
    }
  }, [tbn2_urlBatchId, tbn2_batches]);

  // Effect to handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safety
    
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const batchIdParam = urlParams.get('batchid');
      
      if (batchIdParam) {
        if (tbn2_validateBatchId(batchIdParam)) {
          setTbn2SelectedBatchId(batchIdParam);
          tbn2_fetchBatchSitespren(batchIdParam);
          tbn2_fetchBatchGconPiece(batchIdParam);
          tbn2_fetchAssignedGconPiece(batchIdParam);
        } else {
          setTbn2SelectedBatchId('');
          setTbn2Error(`❌ Batch ID "${batchIdParam}" not found`);
          setTimeout(() => setTbn2Error(null), 8000);
        }
      } else {
        setTbn2SelectedBatchId('');
        setTbn2SelectedSitesprenId('');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tbn2_batches]);

  // Effect to handle popup URL parameters on mount - cloned from nwjar1
  useEffect(() => {
    document.title = '/tebnar2 - Snefuru';
    
    // Handle URL parameters for popup and tab state
    const urlParams = new URLSearchParams(window.location.search);
    const fpop = urlParams.get('fpop');
    const ptab1 = urlParams.get('ptab1');
    const ptab2 = urlParams.get('ptab2');
    const ptab3 = urlParams.get('ptab3');
    const ptab4 = urlParams.get('ptab4');
    const ptab5 = urlParams.get('ptab5');
    const ptab6 = urlParams.get('ptab6');
    const ptab7 = urlParams.get('ptab7');
    const ptab8 = urlParams.get('ptab8');
    
    // Auto-open popup if fpop=open is in URL
    if (fpop === 'open') {
      setTbn2IsPopupOpen(true);
      
      // Set active tab based on URL parameters
      if (ptab1 === 'active') {
        setTbn2ActivePopupTab('ptab1');
      } else if (ptab2 === 'active') {
        setTbn2ActivePopupTab('ptab2');
      } else if (ptab3 === 'active') {
        setTbn2ActivePopupTab('ptab3');
      } else if (ptab4 === 'active') {
        setTbn2ActivePopupTab('ptab4');
      } else if (ptab5 === 'active') {
        setTbn2ActivePopupTab('ptab5');
      } else if (ptab6 === 'active') {
        setTbn2ActivePopupTab('ptab6');
      } else if (ptab7 === 'active') {
        setTbn2ActivePopupTab('ptab7');
      } else if (ptab8 === 'active') {
        setTbn2ActivePopupTab('ptab8');
      }
    }
  }, []);

  // Handle clicks outside sitespren dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sitesprenDropdownRef.current && !sitesprenDropdownRef.current.contains(event.target as Node)) {
        setTbn2SitesprenDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle clicks outside gcon piece dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gconPieceDropdownRef.current && !gconPieceDropdownRef.current.contains(event.target as Node)) {
        setTbn2GconPieceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect hooks for data fetching using centralized functions
  useEffect(() => {
    tbn2_fetchImages();
  }, [user]);

  useEffect(() => {
    tbn2_fetchBatches();
  }, [user]);

  useEffect(() => {
    tbn2_fetchPlans();
    tbn2_fetchSitesprenOptions();
  }, [user]);

  // Fetch narpi pushes when sitespren changes
  useEffect(() => {
    if (tbn2_usePreExistingNarpi && tbn2_selectedSitesprenId) {
      tbn2_fetchAvailableNarpiPushes();
    } else {
      setTbn2AvailableNarpiPushes([]);
      setTbn2SelectedNarpiPushId('');
    }
  }, [tbn2_selectedSitesprenId, tbn2_usePreExistingNarpi]);

  // Re-fetch gcon pieces when sitespren options are loaded and batch has sitespren
  useEffect(() => {
    if (tbn2_sitesprenOptions.length > 0 && tbn2_selectedBatchId && tbn2_selectedSitesprenId) {
      const sitespren = tbn2_sitesprenOptions.find(s => s.id === tbn2_selectedSitesprenId);
      if (sitespren) {
        tbn2_fetchGconPieces(sitespren.sitespren_base);
      }
    }
  }, [tbn2_sitesprenOptions]);

  // Fetch discovered_img_cradles_json when gcon piece selection changes
  useEffect(() => {
    if (tbn2_selectedGconPieceId) {
      tbn2_fetchDiscoveredImgCradles(tbn2_selectedGconPieceId);
      tbn2_fetchPelementorCached(tbn2_selectedGconPieceId);
      tbn2_fetchDiscoveredImagesRegolith(tbn2_selectedGconPieceId);
    } else {
      setTbn2DiscoveredImgCradlesJson('');
      setTbn2PelementorCached('');
      setTbn2DiscoveredImagesRegolith('');
    }
  }, [tbn2_selectedGconPieceId]);

  // Initialize medieval chamber visibility from localStorage and listen for bezel events
  useEffect(() => {
    // Initialize from localStorage
    const savedVisibility = localStorage.getItem('tebnar2_medievalChamberVisible');
    if (savedVisibility !== null) {
      setTbn2MedievalChamberVisible(JSON.parse(savedVisibility));
    } else {
      // Default to false (hidden) and save it
      setTbn2MedievalChamberVisible(false);
      localStorage.setItem('tebnar2_medievalChamberVisible', JSON.stringify(false));
    }

    // Listen for bezel visibility change events
    const handleMedievalChamberVisibilityChange = (event: CustomEvent) => {
      const { visible } = event.detail;
      setTbn2MedievalChamberVisible(visible);
    };

    window.addEventListener('medievalChamberVisibilityChange', handleMedievalChamberVisibilityChange as EventListener);
    
    return () => {
      window.removeEventListener('medievalChamberVisibilityChange', handleMedievalChamberVisibilityChange as EventListener);
    };
  }, []);

  // Initialize folate chamber visibility from localStorage and listen for bezel events
  useEffect(() => {
    const savedVisibility = localStorage.getItem('tebnar2_folateChamberVisible');
    if (savedVisibility !== null) {
      setTbn2FolateChamberVisible(JSON.parse(savedVisibility));
    } else {
      setTbn2FolateChamberVisible(false);
      localStorage.setItem('tebnar2_folateChamberVisible', JSON.stringify(false));
    }

    const handleFolateChamberVisibilityChange = (event: CustomEvent) => {
      const { visible } = event.detail;
      setTbn2FolateChamberVisible(visible);
    };

    window.addEventListener('folateChamberVisibilityChange', handleFolateChamberVisibilityChange as EventListener);
    
    return () => {
      window.removeEventListener('folateChamberVisibilityChange', handleFolateChamberVisibilityChange as EventListener);
    };
  }, []);

  // Initialize entrench chamber visibility from localStorage and listen for bezel events
  useEffect(() => {
    // Initialize from localStorage
    const savedVisibility = localStorage.getItem('tebnar2_entrenchChamberVisible');
    if (savedVisibility !== null) {
      setTbn2EntrenchChamberVisible(JSON.parse(savedVisibility));
    } else {
      // Default to true (visible) and save it
      setTbn2EntrenchChamberVisible(true);
      localStorage.setItem('tebnar2_entrenchChamberVisible', JSON.stringify(true));
    }

    // Listen for bezel visibility change events
    const handleEntrenchChamberVisibilityChange = (event: CustomEvent) => {
      const { visible } = event.detail;
      setTbn2EntrenchChamberVisible(visible);
    };

    window.addEventListener('entrenchChamberVisibilityChange', handleEntrenchChamberVisibilityChange as EventListener);
    
    return () => {
      window.removeEventListener('entrenchChamberVisibilityChange', handleEntrenchChamberVisibilityChange as EventListener);
    };
  }, []);

  // Initialize missile chamber visibility from localStorage and listen for bezel events
  useEffect(() => {
    // Initialize from localStorage
    const savedVisibility = localStorage.getItem('tebnar2_missileChamberVisible');
    if (savedVisibility !== null) {
      setTbn2MissileChamberVisible(JSON.parse(savedVisibility));
    } else {
      // Default to true (visible) and save it
      setTbn2MissileChamberVisible(true);
      localStorage.setItem('tebnar2_missileChamberVisible', JSON.stringify(true));
    }

    // Listen for bezel visibility change events
    const handleMissileChamberVisibilityChange = (event: CustomEvent) => {
      const { visible } = event.detail;
      setTbn2MissileChamberVisible(visible);
    };

    window.addEventListener('missileChamberVisibilityChange', handleMissileChamberVisibilityChange as EventListener);
    
    return () => {
      window.removeEventListener('missileChamberVisibilityChange', handleMissileChamberVisibilityChange as EventListener);
    };
  }, []);

  // Initialize vesicle chamber visibility from localStorage and listen for bezel events
  useEffect(() => {
    // Initialize from localStorage
    const savedVisibility = localStorage.getItem('tebnar2_vesicleChamberVisible');
    if (savedVisibility !== null) {
      setTbn2VesicleChamberVisible(JSON.parse(savedVisibility));
    } else {
      // Default to true (visible) and save it
      setTbn2VesicleChamberVisible(true);
      localStorage.setItem('tebnar2_vesicleChamberVisible', JSON.stringify(true));
    }

    // Listen for bezel visibility change events
    const handleVesicleChamberVisibilityChange = (event: CustomEvent) => {
      const { visible } = event.detail;
      setTbn2VesicleChamberVisible(visible);
    };

    window.addEventListener('vesicleChamberVisibilityChange', handleVesicleChamberVisibilityChange as EventListener);
    
    return () => {
      window.removeEventListener('vesicleChamberVisibilityChange', handleVesicleChamberVisibilityChange as EventListener);
    };
  }, []);

  // Fetch custom colors for uelbar37 and uelbar38 - cloned from nwjar1
  useEffect(() => {
    const fetchTbn2UelBarColors = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_ref_code, hex_value')
          .in('color_ref_code', ['uelbar38_bgcolor1', 'uelbar38_textcolor1', 'uelbar37_bgcolor1', 'uelbar37_textcolor1']);

        if (!error && data && data.length > 0) {
          // uelbar38 colors
          const bgColor38Item = data.find(item => item.color_ref_code === 'uelbar38_bgcolor1');
          const textColor38Item = data.find(item => item.color_ref_code === 'uelbar38_textcolor1');
          
          const bgColor38 = bgColor38Item?.hex_value || '#2563eb';
          const textColor38 = textColor38Item?.hex_value || '#ffffff';
          
          setTbn2UelBarColors({bg: bgColor38, text: textColor38});

          // uelbar37 colors
          const bgColor37Item = data.find(item => item.color_ref_code === 'uelbar37_bgcolor1');
          const textColor37Item = data.find(item => item.color_ref_code === 'uelbar37_textcolor1');
          
          const bgColor37 = bgColor37Item?.hex_value || '#1e40af';
          const textColor37 = textColor37Item?.hex_value || '#ffffff';
          
          setTbn2UelBar37Colors({bg: bgColor37, text: textColor37});
        }
      } catch (err) {
        console.error('Error fetching uel bar colors:', err);
      }
    };

    fetchTbn2UelBarColors();
  }, [supabase]);

  // Track URL changes for uelbar37 display - cloned from nwjar1
  useEffect(() => {
    // Set initial URL
    setTbn2CurrentUrl(window.location.href);
    
    // Listen for URL changes (for pushState/replaceState)
    const handleUrlChange = () => {
      setTbn2CurrentUrl(window.location.href);
    };
    
    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', handleUrlChange);
    
    // Create a MutationObserver to watch for URL changes via pushState/replaceState
    const observer = new MutationObserver(() => {
      if (window.location.href !== tbn2_currentUrl) {
        setTbn2CurrentUrl(window.location.href);
      }
    });
    
    // Watch for changes to the document that might indicate URL changes
    observer.observe(document, { subtree: true, childList: true });
    
    // Custom event listener for our URL updates
    const handleCustomUrlUpdate = () => {
      setTbn2CurrentUrl(window.location.href);
    };
    window.addEventListener('urlchange', handleCustomUrlUpdate);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleCustomUrlUpdate);
      observer.disconnect();
    };
  }, [tbn2_currentUrl]);

  // Handle checkbox clicks with mutual exclusivity - cloned from nwjar1
  const tbn2_handleKz101Click = () => {
    setTbn2Kz101Checked(true);
    setTbn2Kz103Checked(false);
  };

  const tbn2_handleKz103Click = () => {
    setTbn2Kz103Checked(true);
    setTbn2Kz101Checked(false);
  };

  // Update URL parameters for popup state - cloned from nwjar1
  const tbn2_updatePopupURL = (fpopOpen: boolean, tabActive?: string) => {
    const url = new URL(window.location.href);
    
    if (fpopOpen) {
      url.searchParams.set('fpop', 'open');
      
      // Clear all tab parameters first
      ['ptab3', 'ptab2', 'ptab4', 'ptab5', 'ptab6', 'ptab7', 'ptab1', 'ptab8'].forEach(tab => {
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
      ['ptab3', 'ptab2', 'ptab4', 'ptab5', 'ptab6', 'ptab7', 'ptab1', 'ptab8'].forEach(tab => {
        url.searchParams.delete(tab);
      });
    }
    
    // Update URL without triggering page reload
    window.history.replaceState({}, '', url.toString());
    
    // Trigger custom event to update our URL display
    window.dispatchEvent(new Event('urlchange'));
  };

  // Handle popup open/close with URL updates - cloned from nwjar1
  const tbn2_handlePopupOpen = () => {
    setTbn2IsPopupOpen(true);
    
    // Set default selection if neither option is selected
    if (!tbn2_kz101Checked && !tbn2_kz103Checked) {
      setTbn2Kz101Checked(true);
    }
    
    // Check if URL has specific tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasTabInUrl = ['ptab3', 'ptab2', 'ptab4', 'ptab5', 'ptab6', 'ptab7', 'ptab1', 'ptab8']
      .some(tab => urlParams.get(tab) === 'active');
    
    if (!hasTabInUrl) {
      // No tab specified in URL, use last remembered tab from localStorage
      const lastTab = localStorage.getItem('tebnar2_lastActiveTab') || 'ptab1';
      setTbn2ActivePopupTab(lastTab as any);
      tbn2_updatePopupURL(true, lastTab);
    } else {
      // URL has tab specified, use current activePopupTab
      tbn2_updatePopupURL(true, tbn2_activePopupTab);
    }
  };

  const tbn2_handlePopupClose = () => {
    setTbn2IsPopupOpen(false);
    tbn2_updatePopupURL(false);
  };

  // Handle tab changes with URL updates and localStorage - cloned from nwjar1
  const tbn2_handleTabChange = (tab: string) => {
    setTbn2ActivePopupTab(tab as any);
    localStorage.setItem('tebnar2_lastActiveTab', tab); // Remember this tab for next time
    tbn2_updatePopupURL(true, tab);
  };

  // Fetch sitespren options for the logged in user
  const tbn2_fetchSitesprenOptions = async () => {
    if (!user?.id) return;
    
    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;

      const { data, error } = await supabase
        .from('sitespren')
        .select('id, sitespren_base')
        .eq('fk_users_id', userValidation.internalUserId)
        .order('sitespren_base', { ascending: true });

      if (!error && data) {
        setTbn2SitesprenOptions(data);
      }
    } catch (err) {
      console.error('Error fetching sitespren options:', err);
    }
  };

  // Save asn_sitespren_id to current batch
  const tbn2_handleSitesprenSave = async () => {
    if (!tbn2_selectedBatchId) {
      alert('Please select a batch first');
      return;
    }

    setTbn2SitesprenSaving(true);
    try {
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ asn_sitespren_id: tbn2_selectedSitesprenId || null })
        .eq('id', tbn2_selectedBatchId);

      if (error) {
        alert('Error saving sitespren assignment: ' + error.message);
      } else {
        alert('Sitespren assignment saved successfully');
      }
    } catch (err) {
      console.error('Error saving sitespren:', err);
      alert('An error occurred while saving');
    } finally {
      setTbn2SitesprenSaving(false);
    }
  };

  // Fetch gcon_pieces based on selected sitespren
  const tbn2_fetchGconPieces = async (sitesprenBase: string) => {
    if (!user?.id || !sitesprenBase) {
      setTbn2GconPieceOptions([]);
      return;
    }
    
    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;

      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('id, meta_title, asn_sitespren_base, post_name, g_post_id, pageurl')
        .eq('fk_users_id', userValidation.internalUserId)
        .eq('asn_sitespren_base', sitesprenBase)
        .order('meta_title', { ascending: true });

      if (!error && data) {
        setTbn2GconPieceOptions(data);
      } else {
        setTbn2GconPieceOptions([]);
      }
    } catch (err) {
      console.error('Error fetching gcon pieces:', err);
      setTbn2GconPieceOptions([]);
    }
  };

  // Fetch discovered_img_cradles_json for selected gcon piece
  const tbn2_fetchDiscoveredImgCradles = async (gconPieceId: string) => {
    if (!user?.id || !gconPieceId) {
      setTbn2DiscoveredImgCradlesJson('');
      return;
    }
    
    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;
      
      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('discovered_img_cradles_json')
        .eq('fk_users_id', userValidation.internalUserId)
        .eq('id', gconPieceId)
        .single();
        
      if (!error && data) {
        // Handle null or empty data gracefully
        const rawCradlesData = data.discovered_img_cradles_json;
        let cradlesData = '';
        
        if (rawCradlesData) {
          // Check if it's already a string or needs to be converted from object
          if (typeof rawCradlesData === 'string') {
            cradlesData = rawCradlesData;
          } else if (typeof rawCradlesData === 'object') {
            // Convert object to JSON string
            cradlesData = JSON.stringify(rawCradlesData);
          }
        }
        
        setTbn2DiscoveredImgCradlesJson(cradlesData);
      } else {
        setTbn2DiscoveredImgCradlesJson('');
      }
    } catch (err) {
      console.error('Error fetching discovered img cradles:', err);
      setTbn2DiscoveredImgCradlesJson('');
    }
  };

  // Fetch pelementor_cached for selected gcon piece
  const tbn2_fetchPelementorCached = async (gconPieceId: string) => {
    if (!user?.id || !gconPieceId) {
      setTbn2PelementorCached('');
      return;
    }
    
    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;
      
      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('pelementor_cached')
        .eq('fk_users_id', userValidation.internalUserId)
        .eq('id', gconPieceId)
        .single();
        
      if (!error && data) {
        // Handle null or empty data gracefully
        const rawPelementorData = data.pelementor_cached;
        let pelementorData = '';
        
        if (rawPelementorData) {
          // Check if it's already a string or needs to be converted from object
          if (typeof rawPelementorData === 'string') {
            pelementorData = rawPelementorData;
          } else if (typeof rawPelementorData === 'object') {
            // Convert object to JSON string
            pelementorData = JSON.stringify(rawPelementorData);
          }
        }
        
        setTbn2PelementorCached(pelementorData);
      } else {
        setTbn2PelementorCached('');
      }
    } catch (err) {
      console.error('Error fetching pelementor cached:', err);
      setTbn2PelementorCached('');
    }
  };

  // Fetch discovered_images_regolith for selected gcon piece
  const tbn2_fetchDiscoveredImagesRegolith = async (gconPieceId: string) => {
    if (!user?.id || !gconPieceId) {
      setTbn2DiscoveredImagesRegolith('');
      return;
    }
    
    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;
      
      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('discovered_images_regolith')
        .eq('fk_users_id', userValidation.internalUserId)
        .eq('id', gconPieceId)
        .single();
        
      if (!error && data) {
        // Handle null or empty data gracefully
        const rawRegolithData = data.discovered_images_regolith;
        let regolithData = '';
        
        if (rawRegolithData) {
          // Check if it's already a string or needs to be converted from object
          if (typeof rawRegolithData === 'string') {
            regolithData = rawRegolithData;
          } else if (typeof rawRegolithData === 'object') {
            // Convert object to JSON string
            regolithData = JSON.stringify(rawRegolithData);
          }
        }
        
        setTbn2DiscoveredImagesRegolith(regolithData);
      } else {
        setTbn2DiscoveredImagesRegolith('');
      }
    } catch (err) {
      console.error('Error fetching discovered images regolith:', err);
      setTbn2DiscoveredImagesRegolith('');
    }
  };

  // Fetch current batch's gcon_piece assignment
  const tbn2_fetchBatchGconPiece = async (batchId: string) => {
    if (!batchId) {
      setTbn2SelectedGconPieceId('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('asn_gcon_piece_id, asn_sitespren_id')
        .eq('id', batchId)
        .single();

      if (!error && data) {
        if (data.asn_gcon_piece_id) {
          setTbn2SelectedGconPieceId(data.asn_gcon_piece_id);
        } else {
          setTbn2SelectedGconPieceId('');
        }
        
        // Also ensure we have the right gcon pieces loaded if sitespren is set
        if (data.asn_sitespren_id && tbn2_sitesprenOptions.length > 0) {
          const sitespren = tbn2_sitesprenOptions.find(s => s.id === data.asn_sitespren_id);
          if (sitespren) {
            await tbn2_fetchGconPieces(sitespren.sitespren_base);
          }
        }
      } else {
        setTbn2SelectedGconPieceId('');
      }
    } catch (err) {
      console.error('Error fetching batch gcon piece:', err);
      setTbn2SelectedGconPieceId('');
    }
  };

  // Fetch assigned gcon piece - reverse lookup to find which gcon_piece has this batch assigned
  const tbn2_fetchAssignedGconPiece = async (batchId: string) => {
    if (!batchId) {
      setTbn2AssignedGconPiece(null);
      return;
    }

    try {
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) return;

      const { data, error } = await supabase
        .from('gcon_pieces')
        .select('id, asn_sitespren_base, post_name')
        .eq('fk_users_id', userValidation.internalUserId)
        .eq('asn_image_plan_batch_id', batchId)
        .single();

      if (!error && data) {
        setTbn2AssignedGconPiece(data);
      } else {
        setTbn2AssignedGconPiece(null);
      }
    } catch (err) {
      console.error('Error fetching assigned gcon piece:', err);
      setTbn2AssignedGconPiece(null);
    }
  };

  // Save asn_gcon_piece_id to current batch
  const tbn2_handleGconPieceSave = async () => {
    if (!tbn2_selectedBatchId) {
      alert('Please select a batch first');
      return;
    }

    setTbn2GconPieceSaving(true);
    try {
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ asn_gcon_piece_id: tbn2_selectedGconPieceId || null })
        .eq('id', tbn2_selectedBatchId);

      if (error) {
        alert('Error saving gcon piece assignment: ' + error.message);
      } else {
        alert('Gcon piece assignment saved successfully');
      }
    } catch (err) {
      console.error('Error saving gcon piece:', err);
      alert('An error occurred while saving');
    } finally {
      setTbn2GconPieceSaving(false);
    }
  };

  // Fetch seed URLs for current batch
  const tbn2_fetchBatchSeedUrls = async (batchId: string) => {
    if (!batchId) {
      setTbn2SeedUrlWpEditor('');
      setTbn2SeedUrlFrontend('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('images_plans_batches')
        .select('seed_url_wp_editor, seed_url_frontend')
        .eq('id', batchId)
        .single();

      if (!error && data) {
        setTbn2SeedUrlWpEditor(data.seed_url_wp_editor || '');
        setTbn2SeedUrlFrontend(data.seed_url_frontend || '');
      } else {
        setTbn2SeedUrlWpEditor('');
        setTbn2SeedUrlFrontend('');
      }
    } catch (err) {
      console.error('Error fetching batch seed URLs:', err);
      setTbn2SeedUrlWpEditor('');
      setTbn2SeedUrlFrontend('');
    }
  };

  // Save seed URL wp editor to current batch
  const tbn2_handleSeedUrlWpEditorSave = async () => {
    if (!tbn2_selectedBatchId) {
      alert('Please select a batch first');
      return;
    }

    setTbn2SeedUrlSaving(prev => ({ ...prev, wpEditor: true }));
    try {
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ seed_url_wp_editor: tbn2_seedUrlWpEditor })
        .eq('id', tbn2_selectedBatchId);

      if (error) {
        alert('Error saving seed URL wp editor: ' + error.message);
      } else {
        alert('Seed URL wp editor saved successfully');
      }
    } catch (err) {
      console.error('Error saving seed URL wp editor:', err);
      alert('An error occurred while saving');
    } finally {
      setTbn2SeedUrlSaving(prev => ({ ...prev, wpEditor: false }));
    }
  };

  // Save seed URL frontend to current batch
  const tbn2_handleSeedUrlFrontendSave = async () => {
    if (!tbn2_selectedBatchId) {
      alert('Please select a batch first');
      return;
    }

    setTbn2SeedUrlSaving(prev => ({ ...prev, frontend: true }));
    try {
      const { error } = await supabase
        .from('images_plans_batches')
        .update({ seed_url_frontend: tbn2_seedUrlFrontend })
        .eq('id', tbn2_selectedBatchId);

      if (error) {
        alert('Error saving seed URL frontend: ' + error.message);
      } else {
        alert('Seed URL frontend saved successfully');
      }
    } catch (err) {
      console.error('Error saving seed URL frontend:', err);
      alert('An error occurred while saving');
    } finally {
      setTbn2SeedUrlSaving(prev => ({ ...prev, frontend: false }));
    }
  };

  // Create new batch function
  const tbn2_handleCreateNewBatch = async () => {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setTbn2CreateBatchLoading(true);
    
    try {
      // Validate user access and get internal user ID
      const userValidation = await tbn2_validateUserAccess(user.id);
      if (!userValidation.success) {
        alert('User validation failed');
        return;
      }

      const { data, error } = await supabase
        .from('images_plans_batches')
        .insert({
          rel_users_id: userValidation.internalUserId,
          created_at: new Date().toISOString(),
          // Add any other default fields needed for a new batch
        })
        .select('id')
        .single();

      if (error) {
        alert('Error creating new batch: ' + error.message);
        return;
      }

      const newBatchId = data.id;
      
      // Update the current page to view the new batch
      tbn2_handleBatchChange(newBatchId);
      
      // Refresh the batches list to include the new batch
      tbn2_fetchBatches();
      
      alert('✅ New batch created successfully! Now viewing batch: ' + newBatchId);
      
    } catch (err) {
      console.error('Error creating new batch:', err);
      alert('An error occurred while creating the new batch');
    } finally {
      setTbn2CreateBatchLoading(false);
    }
  };

  // Pushador actions handlers - cloned from sitejar4
  const tbn2_handleWpsv2Sync = async (siteId: string, method: 'plugin_api' | 'rest_api') => {
    setTbn2SyncLoading(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[siteId];
      return newResults;
    });

    try {
      const response = await fetch('/api/wpsv2/sync-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          method: method,
          fallbackEnabled: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'success',
            message: `✅ ${data.message} (${data.count} items)`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [siteId]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [siteId]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2SyncLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(siteId);
        return newLoading;
      });
    }
  };

  const tbn2_handleWpsv2TestPlugin = async (siteId: string) => {
    setTbn2SyncLoading(prev => new Set([...prev, `test_${siteId}`]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`test_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/wpsv2/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        const pluginStatus = data.results.plugin_api.success ? '✅' : '❌';
        const restStatus = data.results.rest_api.success ? '✅' : '❌';
        
        setTbn2SyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'success',
            message: `Plugin: ${pluginStatus} | REST: ${restStatus} | ${data.results.recommendations[0] || 'Test completed'}`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`test_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`test_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2SyncLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(`test_${siteId}`);
        return newLoading;
      });
    }
  };

  const tbn2_handleCheckPluginVersion = async (siteId: string) => {
    setTbn2CheckingPluginVersion(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`version_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/plugin/check-version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message} (Current: ${data.currentVersion || 'Unknown'}, Latest: ${data.latestVersion || 'Unknown'})`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`version_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`version_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2CheckingPluginVersion(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  const tbn2_handleUpdatePlugin = async (siteId: string) => {
    setTbn2UpdatingPlugin(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`update_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/plugin/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message} (Updated to version: ${data.newVersion || 'Unknown'})`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`update_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`update_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2UpdatingPlugin(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  const tbn2_handleBarkroPush = async (siteId: string) => {
    setTbn2BarkroPushing(prev => new Set([...prev, siteId]));
    
    setTbn2SyncResults(prev => {
      const newResults = { ...prev };
      delete newResults[`barkro_${siteId}`];
      return newResults;
    });

    try {
      const response = await fetch('/api/barkro/push-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'success',
            message: `✅ ${data.message}`
          }
        }));
      } else {
        setTbn2SyncResults(prev => ({
          ...prev,
          [`barkro_${siteId}`]: {
            type: 'error',
            message: `❌ ${data.message}`
          }
        }));
      }
    } catch (error) {
      setTbn2SyncResults(prev => ({
        ...prev,
        [`barkro_${siteId}`]: {
          type: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTbn2BarkroPushing(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  // SOPTION1 and SOPTION2 handler - adapted for tebnar2
  const [tbn2_functionLoading, setTbn2FunctionLoading] = useState(false);
  
  // Image discovery loading state
  const [tbn2_imageDiscoveryLoading, setTbn2ImageDiscoveryLoading] = useState(false);
  
  // Discovered img cradles JSON state
  const [tbn2_discoveredImgCradlesJson, setTbn2DiscoveredImgCradlesJson] = useState<string>('');
  
  // Discovered images regolith state
  const [tbn2_discoveredImagesRegolith, setTbn2DiscoveredImagesRegolith] = useState<string>('');
  const [tbn2_imagesRegolithLoading, setTbn2ImagesRegolithLoading] = useState(false);
  
  const tbn2_handleSelectedItemsFunction = async (functionName: string) => {
    let itemsToProcess: string[] = [];
    
    if (tbn2_kz101Checked) {
      // SOPTION1: Use selected items
      if (tbn2_selectedRows.size === 0) {
        alert('Please select at least one item from the table');
        return;
      }
      itemsToProcess = Array.from(tbn2_selectedRows);
    } else if (tbn2_kz103Checked) {
      // SOPTION2: Use all items in current pagination
      itemsToProcess = tbn2_paginatedPlans.map(plan => plan.id);
    } else {
      alert('Please select either SOPTION1 or SOPTION2');
      return;
    }

    if (itemsToProcess.length === 0) {
      alert('No items to process');
      return;
    }

    setTbn2FunctionLoading(true);
    try {
      // Example API call structure - can be customized for different functions
      const response = await fetch(`/api/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_ids: itemsToProcess,
          batch_id: tbn2_selectedBatchId || null,
          selection_type: tbn2_kz101Checked ? 'SOPTION1' : 'SOPTION2',
          total_items: itemsToProcess.length
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully processed ${itemsToProcess.length} items with ${functionName}`);
        // Refresh the data
        tbn2_fetchPlans();
      } else {
        alert(`Error: ${result.error || `Failed to execute ${functionName}`}`);
      }
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      alert(`An error occurred while executing ${functionName}`);
    } finally {
      setTbn2FunctionLoading(false);
    }
  };
  
  // Elementor image discovery handler
  const tbn2_handleElementorImageDiscovery = async () => {
    if (!tbn2_selectedGconPieceId) {
      alert('Please select a gcon piece first');
      return;
    }
    
    // Debug logging for troubleshooting
    console.log('🔍 Starting elementor image discovery with gconPieceId:', tbn2_selectedGconPieceId);
    
    setTbn2ImageDiscoveryLoading(true);
    setTbn2Error(null);
    
    try {
      const requestBody = {
        gconPieceId: tbn2_selectedGconPieceId,
        user_id: user?.id,
      };
      
      // Debug logging for request body
      console.log('📤 Sending API request body:', requestBody);
      
      // API call to process pelementor_cached data
      const response = await fetch('/api/tbn2-elementor-image-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 API response status:', response.status, response.statusText);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          console.error('❌ API error response:', errorData);
        } catch {
          // If JSON parsing fails, get text response
          const errorText = await response.text();
          errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
          console.error('❌ API error (non-JSON):', errorText);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('📥 API response data:', result);
      
      if (result.success) {
        setTbn2Error(`✅ Elementor image discovery completed: ${result.message || 'Success'}`);
        // Refresh any relevant data if needed
        if (user?.id) {
          await tbn2_fetchPlans();
        }
      } else {
        setTbn2Error(`❌ Elementor image discovery failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Elementor image discovery error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTbn2Error(`❌ Error during elementor image discovery: ${errorMessage}`);
    } finally {
      setTbn2ImageDiscoveryLoading(false);
    }
  };

  // Elementor images regolith discovery handler
  const tbn2_handleElementorImagesRegolith = async () => {
    if (!tbn2_selectedGconPieceId) {
      alert('Please select a gcon piece first');
      return;
    }
    
    console.log('🔍 Starting elementor images regolith discovery with gconPieceId:', tbn2_selectedGconPieceId);
    
    setTbn2ImagesRegolithLoading(true);
    setTbn2Error(null);
    
    try {
      const requestBody = {
        gconPieceId: tbn2_selectedGconPieceId,
        user_id: user?.id,
      };
      
      console.log('📤 Sending API request body:', requestBody);
      
      // API call to analyze pelementor_cached for actual images
      const response = await fetch('/api/f331-discover-elementor-images-regolith', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          console.error('❌ API error response:', errorData);
        } catch {
          const errorText = await response.text();
          errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
          console.error('❌ API error (non-JSON):', errorText);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('📥 API response data:', result);
      
      if (result.success && result.data && result.data.discovered_images_regolith) {
        setTbn2DiscoveredImagesRegolith(JSON.stringify(result.data.discovered_images_regolith));
        setTbn2Error(`✅ Elementor images regolith discovery completed: ${result.message || 'Success'}`);
      } else {
        setTbn2Error(`❌ Elementor images regolith discovery failed: ${result.error || 'No regolith data returned'}`);
      }
    } catch (err) {
      console.error('Elementor images regolith discovery error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTbn2Error(`❌ Error during elementor images regolith discovery: ${errorMessage}`);
    } finally {
      setTbn2ImagesRegolithLoading(false);
    }
  };

  // State for gadget feedback (chepno functions)
  const [tbn2_gadgetFeedback, setTbn2GadgetFeedback] = useState<{
    action: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: string;
  } | null>(null);

  // State for f22 and f47 functionality (cloned from nwjar1)
  const [tbn2_f47Loading, setTbn2F47Loading] = useState(false);
  const [tbn2_f22Loading, setTbn2F22Loading] = useState(false);
  const [tbn2_f22Error, setTbn2F22Error] = useState<{message: string, details?: any} | null>(null);
  const [tbn2_f22Report, setTbn2F22Report] = useState<string>('');
  const [tbn2_f47Error, setTbn2F47Error] = useState<{message: string, details?: any} | null>(null);

  // Handler for single site actions (chepno functions)
  const tbn2_handleSingleSiteAction = async (action: string, method?: string) => {
    if (!tbn2_selectedSitesprenId) {
      setTbn2GadgetFeedback({
        action: `${action}${method ? ` (${method})` : ''}`,
        message: 'No site selected. Please select a site from the dropdown first.',
        type: 'error',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const timestamp = new Date().toISOString();
    setTbn2GadgetFeedback({
      action: `${action}${method ? ` (${method})` : ''}`,
      message: 'Action started...',
      type: 'info',
      timestamp
    });

    try {
      let endpoint = '';
      let payload: any = {};

      // Map actions to their corresponding API endpoints
      switch (action) {
        case 'wpsv2_sync':
          endpoint = '/api/wpsv2/sync-site';
          payload = { 
            siteId: tbn2_selectedSitesprenId,
            method: method || 'plugin_api',
            fallbackEnabled: true
          };
          break;
          
        case 'test_plugin':
          endpoint = '/api/wpsv2/test-plugin';
          payload = { siteId: tbn2_selectedSitesprenId };
          break;
          
        case 'check_plugin_version':
          endpoint = '/api/wpsv2/check-plugin-version';
          payload = { siteId: tbn2_selectedSitesprenId };
          break;
          
        case 'update_plugin':
          endpoint = '/api/wpsv2/update-plugin';
          payload = { siteId: tbn2_selectedSitesprenId };
          break;
          
        case 'barkro_push':
          endpoint = '/api/wpsv2/barkro-push';
          payload = { siteId: tbn2_selectedSitesprenId };
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setTbn2GadgetFeedback({
          action: `${action}${method ? ` (${method})` : ''}`,
          message: data.message || 'Action completed successfully',
          type: 'success',
          timestamp
        });
      } else {
        setTbn2GadgetFeedback({
          action: `${action}${method ? ` (${method})` : ''}`,
          message: data.error || data.message || 'Action failed',
          type: 'error',
          timestamp
        });
      }
    } catch (error) {
      setTbn2GadgetFeedback({
        action: `${action}${method ? ` (${method})` : ''}`,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        type: 'error',
        timestamp
      });
    }
  };

  // f22_nwpi_to_gcon_pusher handler - modified for tebnar2 to work with NWPI content
  const tbn2_handleF22NwpiToGconPusher = async () => {
    if (!tbn2_selectedSitesprenId) {
      setTbn2GadgetFeedback({
        action: 'F22 NWPI to GCon Pusher',
        message: 'No site selected. Please select a site from the dropdown first.',
        type: 'error',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find the sitespren_base for the selected site
    const selectedSitespren = tbn2_sitesprenOptions.find(s => s.id === tbn2_selectedSitesprenId);
    if (!selectedSitespren) {
      setTbn2GadgetFeedback({
        action: 'F22 NWPI to GCon Pusher',
        message: 'Unable to find sitespren_base for selected site. Please refresh and try again.',
        type: 'error',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // f22 processes ALL NWPI content for the selected site (regardless of SOPTION selection)
    // This is because f22 works with NWPI content (WordPress articles), not image plans
    console.log(`🔄 f22: Processing all NWPI content for site: ${selectedSitespren.sitespren_base}`);

    const timestamp = new Date().toISOString();
    setTbn2GadgetFeedback({
      action: 'F22 NWPI to GCon Pusher',
      message: `Action started for site: ${selectedSitespren.sitespren_base}...`,
      type: 'info',
      timestamp
    });

    setTbn2F22Loading(true);
    setTbn2F22Error(null); // Clear previous errors
    setTbn2F22Report(''); // Clear previous reports
    
    try {
      // First, query the database to get NWPI content for this specific site
      const nwpiResponse = await fetch('/api/f22-get-nwpi-for-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitespren_base: selectedSitespren.sitespren_base
        }),
      });

      if (!nwpiResponse.ok) {
        throw new Error(`Failed to fetch NWPI content: ${nwpiResponse.status} ${nwpiResponse.statusText}`);
      }

      const nwpiData = await nwpiResponse.json();
      
      if (!nwpiData.success) {
        throw new Error(nwpiData.message || 'Failed to fetch NWPI content for site');
      }

      const nwpiRecordIds = nwpiData.record_ids || [];
      
      if (nwpiRecordIds.length === 0) {
        setTbn2GadgetFeedback({
          action: 'F22 NWPI to GCon Pusher',
          message: `No NWPI content found for site: ${selectedSitespren.sitespren_base}. Please sync WordPress content first using the chep11 or chep21 buttons.`,
          type: 'warning',
          timestamp
        });
        setTbn2F22Loading(false);
        return;
      }

      console.log(`🔍 Found ${nwpiRecordIds.length} NWPI records for site ${selectedSitespren.sitespren_base}`);

      // Now call the f22 API with the NWPI record IDs
      const response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordIds: nwpiRecordIds
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Get response text first to check if it's empty
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        const debugInfo = {
          jsonError: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
          responseStatus: response.status,
          responseText: responseText.substring(0, 500)
        };
        console.error('JSON parsing error:', debugInfo);
        throw new Error(`Invalid JSON response from server.\n\nDebug Info:\n- Status: ${response.status}\n- JSON Error: ${debugInfo.jsonError}\n- Response: "${responseText.substring(0, 200)}..."`);
      }

      // Add debug logging
      console.log('🔍 F22 API Response:', result);
      
      if (result.success) {
        const successMessage = `Successfully processed ${result.results?.processed || 0} records (${result.results?.succeeded || 0} succeeded, ${result.results?.failed || 0} failed). ${result.message}`;
        
        setTbn2GadgetFeedback({
          action: 'F22 NWPI to GCon Pusher',
          message: successMessage,
          type: 'success',
          timestamp
        });
        
        setTbn2F22Error(null); // Clear any previous errors on success
      } else {
        const errorMessage = result.message || 'Failed to push to GCon pieces';
        console.error('🚨 F22 API returned error:', result);
        
        const errorDetails = result.results?.errors?.length > 0 
          ? ` Errors: ${result.results.errors.slice(0, 3).join('; ')}${result.results.errors.length > 3 ? '...' : ''}`
          : '';
        
        setTbn2GadgetFeedback({
          action: 'F22 NWPI to GCon Pusher',
          message: `${errorMessage}. Processed: ${result.results?.processed || 0}, Succeeded: ${result.results?.succeeded || 0}, Failed: ${result.results?.failed || 0}.${errorDetails}`,
          type: 'error',
          timestamp
        });
        setTbn2F22Error({
          message: errorMessage,
          details: {
            apiResponse: result,
            debugInfo: result.debugInfo,
            results: result.results,
            timestamp: new Date().toISOString(),
            endpoint: '/api/f22-nwpi-to-gcon-pusher',
            selectedItems: tbn2_kz101Checked ? tbn2_selectedRows.size : (tbn2_kz103Checked ? tbn2_plans.length : 0)
          }
        });
      }
    } catch (error) {
      console.error('🚨 Error calling f22_nwpi_to_gcon_pusher:', error);
      
      setTbn2GadgetFeedback({
        action: 'F22 NWPI to GCon Pusher',
        message: `Network/Client error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Check console for details.`,
        type: 'error',
        timestamp
      });
      setTbn2F22Error({
        message: errorMessage,
        details: {
          clientError: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          timestamp: new Date().toISOString(),
          endpoint: '/api/f22-nwpi-to-gcon-pusher',
          selectedItems: tbn2_kz101Checked ? tbn2_selectedRows.size : (tbn2_kz103Checked ? tbn2_plans.length : 0),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
    } finally {
      setTbn2F22Loading(false);
    }
  };

  // f47_generate_gcon_pieces handler - modified for tebnar2 to work with NWPI content
  const tbn2_handleF47GenerateGconPieces = async () => {
    if (!tbn2_selectedSitesprenId) {
      setTbn2GadgetFeedback({
        action: 'F47 Generate GCon Pieces',
        message: 'No site selected. Please select a site from the dropdown first.',
        type: 'error',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find the sitespren_base for the selected site
    const selectedSitespren = tbn2_sitesprenOptions.find(s => s.id === tbn2_selectedSitesprenId);
    if (!selectedSitespren) {
      setTbn2GadgetFeedback({
        action: 'F47 Generate GCon Pieces',
        message: 'Unable to find sitespren_base for selected site. Please refresh and try again.',
        type: 'error',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // f47 processes ALL NWPI content for the selected site (regardless of SOPTION selection)
    // This is because f47 works with NWPI content (WordPress articles), not image plans
    console.log(`🔄 f47: Processing all NWPI content for site: ${selectedSitespren.sitespren_base}`);

    const timestamp = new Date().toISOString();
    setTbn2GadgetFeedback({
      action: 'F47 Generate GCon Pieces',
      message: `Action started for site: ${selectedSitespren.sitespren_base}...`,
      type: 'info',
      timestamp
    });

    setTbn2F47Loading(true);
    setTbn2F47Error(null); // Clear previous errors
    
    try {
      // First, query the database to get NWPI content for this specific site
      const nwpiResponse = await fetch('/api/f22-get-nwpi-for-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitespren_base: selectedSitespren.sitespren_base
        }),
      });

      if (!nwpiResponse.ok) {
        throw new Error(`Failed to fetch NWPI content: ${nwpiResponse.status} ${nwpiResponse.statusText}`);
      }

      const nwpiData = await nwpiResponse.json();
      
      if (!nwpiData.success) {
        throw new Error(nwpiData.message || 'Failed to fetch NWPI content for site');
      }

      const nwpiRecordIds = nwpiData.record_ids || [];
      
      if (nwpiRecordIds.length === 0) {
        setTbn2GadgetFeedback({
          action: 'F47 Generate GCon Pieces',
          message: `No NWPI content found for site: ${selectedSitespren.sitespren_base}. Please sync WordPress content first using the chep11 or chep21 buttons.`,
          type: 'warning',
          timestamp
        });
        setTbn2F47Loading(false);
        return;
      }

      console.log(`🔍 Found ${nwpiRecordIds.length} NWPI records for site ${selectedSitespren.sitespren_base}`);

      // Now call the f22 API with the NWPI record IDs (restored to working functionality)
      const response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordIds: nwpiRecordIds
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTbn2GadgetFeedback({
          action: 'F47 Generate GCon Pieces',
          message: `Successfully processed ${result.results?.processed || 0} records. Succeeded: ${result.results?.succeeded || 0}, Failed: ${result.results?.failed || 0}.`,
          type: 'success',
          timestamp
        });
        setTbn2F47Error(null); // Clear any previous errors on success
      } else {
        const errorMessage = result.error || 'Failed to process NWPI content';
        const errorDetails = result.results?.errors?.length > 0 ? ` Errors: ${result.results.errors.join(', ')}` : '';
        setTbn2GadgetFeedback({
          action: 'F47 Generate GCon Pieces',
          message: `Error: ${errorMessage}. Processed: ${result.results?.processed || 0}, Succeeded: ${result.results?.succeeded || 0}, Failed: ${result.results?.failed || 0}.${errorDetails}`,
          type: 'error',
          timestamp
        });
        setTbn2F47Error({
          message: errorMessage,
          details: result.data || result
        });
      }
    } catch (error) {
      console.error('Error calling f47_generate_gcon_pieces:', error);
      
      setTbn2GadgetFeedback({
        action: 'F47 Generate GCon Pieces',
        message: `Network/Client error: ${error instanceof Error ? error.message : 'An error occurred while generating GCon pieces'}. Check console for details.`,
        type: 'error',
        timestamp
      });
      setTbn2F47Error({
        message: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
    } finally {
      setTbn2F47Loading(false);
    }
  };

  // Rhino Replace handler
  const tbn2_handleRhinoReplace = async () => {
    if (!tbn2_selectedGconPieceId) {
      setTbn2Error('❌ Please select a gcon piece first');
      return;
    }

    if (!tbn2_selectedBatchId || !tbn2_selectedSitesprenId) {
      setTbn2Error('❌ Missing batch or sitespren selection');
      return;
    }

    // Validation for pre-existing narpi push mode
    if (tbn2_usePreExistingNarpi) {
      const effectiveNarpiPushId = tbn2_narpiInputMethod === 'dropdown' 
        ? tbn2_selectedNarpiPushId 
        : tbn2_manualNarpiPushId;
      
      if (!effectiveNarpiPushId) {
        setTbn2Error(`❌ Please ${tbn2_narpiInputMethod === 'dropdown' ? 'select' : 'enter'} a narpi push ID`);
        return;
      }
    } else {
      // Normal mode - need selected images
      const selectedImages = Array.from(tbn2_selectedRows);
      if (selectedImages.length === 0) {
        setTbn2Error('❌ Please select at least one image to replace');
        return;
      }
    }

    try {
      setTbn2RhinoReplaceLoading(true);
      setTbn2Error(null);

      // Reset progress
      setTbn2RhinoProgress({
        narpiRecord: 0,
        narpiUpload: 0,
        cliffArrangement: 0,
        masonArrangement: 0,
        boulderArrangement: 0
      });

      let response;
      
      // Check arrangement method selection
      if (tbn2_arrangementMethod === 'mason') {
        // Mason arrangement requires pre-existing narpi push
        if (!tbn2_usePreExistingNarpi) {
          setTbn2Error('❌ Mason Arrange requires a pre-existing narpi push. Please enable "use pre-existing narpi push" option.');
          return;
        }
        
        const effectiveNarpiPushId = tbn2_narpiInputMethod === 'dropdown' 
          ? tbn2_selectedNarpiPushId 
          : tbn2_manualNarpiPushId;
        
        if (!effectiveNarpiPushId) {
          setTbn2Error(`❌ Please ${tbn2_narpiInputMethod === 'dropdown' ? 'select' : 'enter'} a narpi push ID for Mason Arrange`);
          return;
        }
        
        // Mason: No narpi progress since using pre-existing
        // Don't set narpiRecord/narpiUpload progress for pre-existing narpi
        
        console.log(`🏗️ Using Mason Arrange method for enhanced image arrangement`);
        
        response = await fetch('/api/mason-arrange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gcon_piece_id: tbn2_selectedGconPieceId,
            narpi_push_id: effectiveNarpiPushId
          })
        });
        
      } else if (tbn2_arrangementMethod === 'boulder') {
        // Boulder arrangement requires pre-existing narpi push
        if (!tbn2_usePreExistingNarpi) {
          setTbn2Error('❌ Boulder Arrange requires a pre-existing narpi push. Please enable "use pre-existing narpi push" option.');
          return;
        }
        
        const effectiveNarpiPushId = tbn2_narpiInputMethod === 'dropdown' 
          ? tbn2_selectedNarpiPushId 
          : tbn2_manualNarpiPushId;
        
        if (!effectiveNarpiPushId) {
          setTbn2Error(`❌ Please ${tbn2_narpiInputMethod === 'dropdown' ? 'select' : 'enter'} a narpi push ID for Boulder Arrange`);
          return;
        }
        
        // Boulder: No narpi progress since using pre-existing, no regolith refresh
        console.log(`🪨 Using Boulder Arrange method for regolith-free image arrangement`);
        
        response = await fetch('/api/boulder-arrange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gcon_piece_id: tbn2_selectedGconPieceId,
            narpi_push_id: effectiveNarpiPushId
          })
        });
        
      } else if (tbn2_usePreExistingNarpi) {
        // Cliff with pre-existing narpi: No narpi progress bars
        // Don't set narpiRecord/narpiUpload progress for pre-existing narpi
        
        const effectiveNarpiPushId = tbn2_narpiInputMethod === 'dropdown' 
          ? tbn2_selectedNarpiPushId 
          : tbn2_manualNarpiPushId;
          
        console.log(`🏔️ Using Cliff Arrange method (cliff-only)`);
        
        response = await fetch('/api/rhino-cliff-only', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gcon_piece_id: tbn2_selectedGconPieceId,
            narpi_push_id: effectiveNarpiPushId
          })
        });
      } else {
        // Phase 1: Start Narpi Push (Cliff with new uploads)
        // This is the only case where we show narpi progress
        setTbn2RhinoProgress(prev => ({ ...prev, narpiRecord: 50 }));
        
        console.log(`🏔️ Using Cliff Arrange method (full rhino-replace)`);
        
        const selectedImages = Array.from(tbn2_selectedRows);
        response = await fetch('/api/rhino-replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gcon_piece_id: tbn2_selectedGconPieceId,
            selected_plan_ids: selectedImages,
            batch_id: tbn2_selectedBatchId,
            sitespren_id: tbn2_selectedSitesprenId
          })
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Rhino replace failed');
      }

      if (result.success) {
        // Mark phases as complete based on what actually ran
        if (result.method === 'mason') {
          // Mason only: mark Mason arrangement complete, no narpi activity
          setTbn2RhinoProgress({
            narpiRecord: 0,
            narpiUpload: 0,
            cliffArrangement: 0,
            masonArrangement: 100,
            boulderArrangement: 0
          });
        } else if (result.method === 'boulder') {
          // Boulder only: mark Boulder arrangement complete, no narpi activity
          setTbn2RhinoProgress({
            narpiRecord: 0,
            narpiUpload: 0,
            cliffArrangement: 0,
            masonArrangement: 0,
            boulderArrangement: 100
          });
        } else if (tbn2_usePreExistingNarpi) {
          // Cliff with pre-existing: only cliff arrangement, no narpi activity  
          setTbn2RhinoProgress({
            narpiRecord: 0,
            narpiUpload: 0,
            cliffArrangement: 100,
            masonArrangement: 0,
            boulderArrangement: 0
          });
        } else {
          // Full rhino-replace: all narpi and cliff phases
          setTbn2RhinoProgress({
            narpiRecord: 100,
            narpiUpload: 100,
            cliffArrangement: 100,
            masonArrangement: 0,
            boulderArrangement: 0
          });
        }

        // Different success messages based on method used
        if (result.method === 'mason') {
          // Mason arrange result structure
          const masonResults = result.results.mason_arrangement;
          const regolithResults = result.results.regolith_refresh;
          
          setTbn2Error(
            `✅ Mason Arrange completed! Enhanced method used (${masonResults.method_used}). ` +
            `${regolithResults.images_discovered} images discovered, ${masonResults.images_replaced} images replaced in page. ` +
            `Cache cleared: ${masonResults.cache_cleared ? 'Yes' : 'No'}`
          );
        } else if (result.method === 'boulder') {
          // Boulder arrange result structure
          const boulderResults = result.results.boulder_arrangement;
          
          setTbn2Error(
            `✅ Boulder Arrange completed! Regolith-free method used (${boulderResults.method_used}). ` +
            `${boulderResults.images_replaced} images replaced in page. ` +
            `Cache cleared: ${boulderResults.cache_cleared ? 'Yes' : 'No'}`
          );
        } else {
          // Cliff arrange result structure (existing)
          const narpiResults = result.results?.narpi_push;
          const cliffResults = result.results?.cliff_arrangement;
          
          setTbn2Error(
            `✅ Cliff Arrange completed! ${narpiResults?.images_uploaded || 0} images uploaded, ` +
            `${cliffResults?.images_replaced || 0} images replaced in page.`
          );
        }

        // Refresh regolith data to show updated results
        if (tbn2_selectedGconPieceId) {
          tbn2_fetchDiscoveredImagesRegolith(tbn2_selectedGconPieceId);
        }
      } else {
        throw new Error(result.message || 'Rhino replace failed');
      }

    } catch (error) {
      // Mark as failed but show partial progress for debugging
      setTbn2RhinoProgress(prev => ({ ...prev, narpiRecord: 0 }));
      
      setTbn2Error(`❌ Rhino Replace error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Rhino Replace error:', error);
    } finally {
      setTbn2RhinoReplaceLoading(false);
    }
  };

  // Aranya: Remove all images from Elementor page
  const tbn2_handleAranyaRemove = async (gcon_piece_id: string) => {
    if (!gcon_piece_id) {
      setTbn2Error('❌ No gcon_piece_id provided for Aranya');
      return;
    }

    setTbn2AranyaLoading(true);
    setTbn2Error(null);

    try {
      console.log(`🗑️ ARANYA: Starting image removal for gcon_piece: ${gcon_piece_id}`);
      
      const response = await fetch('/api/aranya-remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcon_piece_id
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`✅ ARANYA: Image removal completed successfully`);
        console.log(`📊 Images removed: ${result.results?.image_removal?.images_removed || 0}`);
        console.log(`🔄 Page updated: ${result.results?.image_removal?.page_updated ? 'Yes' : 'No'}`);
        console.log(`💾 Backup created: ${result.results?.image_removal?.backup_created || 'None'}`);
        
        setTbn2Error(`✅ Aranya completed! Removed ${result.results?.image_removal?.images_removed || 0} images from page.`);
        
        // Refresh plans to show updated status
        tbn2_fetchPlans();
      } else {
        const errorMsg = result.error || 'Aranya removal failed';
        console.error(`❌ ARANYA ERROR: ${errorMsg}`);
        setTbn2Error(`❌ Aranya failed: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown Aranya error';
      console.error('🗑️ Aranya network error:', error);
      setTbn2Error(`❌ Aranya error: ${errorMsg}`);
    } finally {
      setTbn2AranyaLoading(false);
    }
  };

  // Hippo: Update Gutenberg page with images (like Cliff/Mason but for Gutenberg)
  const tbn2_handleHippoUpdatePageWithImages = async (gcon_piece_id: string) => {
    if (!gcon_piece_id) {
      setTbn2Error('❌ No gcon_piece_id provided for Hippo');
      return;
    }

    setTbn2HippoLoading(true);
    setTbn2Error(null);

    try {
      console.log(`🦛 HIPPO: Starting Gutenberg image update for gcon_piece: ${gcon_piece_id}`);
      
      // TODO: Create the Hippo API endpoint for Gutenberg pages
      // This would be similar to boulder-arrange but specifically for Gutenberg
      const response = await fetch('/api/hippo-replace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcon_piece_id
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`✅ HIPPO: Gutenberg image update completed successfully`);
        console.log(`📊 Images replaced: ${result.results?.image_replacement?.images_replaced || 0}`);
        console.log(`🔄 Page updated: ${result.results?.image_replacement?.page_updated ? 'Yes' : 'No'}`);
        
        setTbn2Error(`✅ Hippo completed! Replaced ${result.results?.image_replacement?.images_replaced || 0} images in Gutenberg page.`);
        
        // Refresh plans to show updated status
        tbn2_fetchPlans();
      } else {
        const errorMsg = result.error || 'Hippo update failed';
        console.error(`❌ HIPPO ERROR: ${errorMsg}`);
        setTbn2Error(`❌ Hippo failed: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown Hippo error';
      console.error('🦛 Hippo network error:', error);
      setTbn2Error(`❌ Hippo error: ${errorMsg}`);
    } finally {
      setTbn2HippoLoading(false);
    }
  };

  // Filter plans by selected batch using centralized function
  const tbn2_filteredPlans = tbn2_filterPlansByBatch(tbn2_plans, tbn2_selectedBatchId || null);

  // Apply sorting to filtered plans
  const tbn2_sortedPlans = tbn2_getSortedPlans(tbn2_filteredPlans);

  // Pagination logic
  const tbn2_totalPages = Math.ceil(tbn2_sortedPlans.length / tbn2_pageSize);
  const tbn2_startIndex = (tbn2_currentPage - 1) * tbn2_pageSize;
  const tbn2_endIndex = tbn2_startIndex + tbn2_pageSize;
  const tbn2_paginatedPlans = tbn2_sortedPlans.slice(tbn2_startIndex, tbn2_endIndex);

  if (tbn2_loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading Tebnar2...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Filters and Controls - enhanced with URL parameter support */}
      <Tebnar2Filters
        batches={tbn2_batches}
        selectedBatchId={tbn2_selectedBatchId}
        onBatchChange={tbn2_handleBatchChange}
        error={tbn2_error}
        onRefresh={tbn2_fetchPlans}
        onErrorDismiss={() => setTbn2Error(null)}
      />

      {/* Tiger Bar - componentized uelbar45 and uelbar50 on main page */}
      <TigerBar
        selectedBatchId={tbn2_selectedBatchId}
        selectedSitesprenId={tbn2_selectedSitesprenId}
        selectedGconPieceId={tbn2_selectedGconPieceId}
        batches={tbn2_batches}
        onBatchChange={tbn2_handleBatchChange}
        sitesprenDropdownOpen={tbn2_sitesprenDropdownOpen}
        sitesprenSearchTerm={tbn2_sitesprenSearchTerm}
        onSitesprenSearchTermChange={setTbn2SitesprenSearchTerm}
        onSitesprenDropdownOpenChange={setTbn2SitesprenDropdownOpen}
        getSelectedSitesprenDisplay={tbn2_getSelectedSitesprenDisplay}
        getFilteredSitesprenOptions={tbn2_getFilteredSitesprenOptions}
        onSitesprenSelect={(id, base) => {
          setTbn2SelectedSitesprenId(id);
          setTbn2CurrentSitesprenBase(base);
          setTbn2SitesprenDropdownOpen(false);
          setTbn2SitesprenSearchTerm('');
        }}
        onSitesprenClear={() => {
          setTbn2SelectedSitesprenId('');
          setTbn2CurrentSitesprenBase('');
          setTbn2SitesprenDropdownOpen(false);
          setTbn2SitesprenSearchTerm('');
          setTbn2GconPieces([]);
          setTbn2SelectedGconPieceId('');
          setTbn2CurrentGconPieceTitle('');
        }}
        onSitesprenSave={tbn2_handleSitesprenSave}
        sitesprenSaving={tbn2_sitesprenSaving}
        sitesprenDropdownRef={sitesprenDropdownRef}
        truncateUUID={tbn2_truncateUUID}
        fetchGconPieces={tbn2_fetchGconPieces}
        gconPieceDropdownOpen={tbn2_gconPieceDropdownOpen}
        gconPieceSearchTerm={tbn2_gconPieceSearchTerm}
        onGconPieceSearchTermChange={setTbn2GconPieceSearchTerm}
        onGconPieceDropdownOpenChange={setTbn2GconPieceDropdownOpen}
        getSelectedGconPieceDisplay={tbn2_getSelectedGconPieceDisplay}
        getFilteredGconPieceOptions={tbn2_getFilteredGconPieceOptions}
        onGconPieceSelect={(id) => {
          setTbn2SelectedGconPieceId(id);
          setTbn2GconPieceDropdownOpen(false);
          setTbn2GconPieceSearchTerm('');
        }}
        onGconPieceClear={() => {
          setTbn2SelectedGconPieceId('');
          setTbn2CurrentGconPieceTitle('');
          setTbn2GconPieceDropdownOpen(false);
          setTbn2GconPieceSearchTerm('');
        }}
        onGconPieceSave={tbn2_handleGconPieceSave}
        gconPieceSaving={tbn2_gconPieceSaving}
        gconPieceDropdownRef={gconPieceDropdownRef}
        getGconPieceUrls={tbn2_getGconPieceUrls}
        seedUrlWpEditor={tbn2_seedUrlWpEditor}
        seedUrlFrontend={tbn2_seedUrlFrontend}
        onSeedUrlWpEditorChange={setTbn2SeedUrlWpEditor}
        onSeedUrlFrontendChange={setTbn2SeedUrlFrontend}
        onSeedUrlWpEditorSave={tbn2_handleSeedUrlWpEditorSave}
        onSeedUrlFrontendSave={tbn2_handleSeedUrlFrontendSave}
        seedUrlSaving={tbn2_seedUrlSaving}
        marginRight="0px"
        className="mb-4"
      />

      {/* Active Filter Indicator - tebnar2 specific */}
      {tbn2_selectedBatchId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-800 font-medium">
                📌 Filtered by batch: 
              </span>
              <code className="ml-2 px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm font-mono">
                {tbn2_selectedBatchId}
              </code>
            </div>
            <button 
              onClick={() => tbn2_handleBatchChange('')}
              className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium transition-colors"
              title="Clear batch filter"
            >
              Clear Filter
            </button>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            Showing {tbn2_filteredPlans.length} plans from this batch
          </div>
        </div>
      )}


      {/* Functions Popup Button and Sitespren Widget */}
      <div className="mb-4 flex items-start space-x-4">
        {/* Functions Popup Button */}
        <button
          onClick={tbn2_handlePopupOpen}
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

        {/* Folate Chamber - Sitespren and Content Management */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4" style={{ display: tbn2_folateChamberVisible ? 'block' : 'none' }}>
          <div className="font-bold text-gray-900 mb-4" style={{ fontSize: '16px' }}>folate_chamber</div>
          
          {/* Sitespren Assignment Widget */}
          <div 
          className="bg-white border border-gray-300 rounded-lg p-2"
        >
          <div className="text-gray-700 mb-1" style={{ fontSize: '14px' }}>site for this img plan batch:</div>
          <div className="text-gray-700 mb-1" style={{ fontSize: '16px' }}>
            <span className="font-normal">images_plans_batches</span>
            <span className="font-bold">.asn_sitespren_id</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative" ref={sitesprenDropdownRef} style={{ width: '300px' }}>
              <input
                type="text"
                value={tbn2_sitesprenDropdownOpen ? tbn2_sitesprenSearchTerm : (tbn2_selectedSitesprenId ? tbn2_getSelectedSitesprenDisplay() : '')}
                onChange={(e) => setTbn2SitesprenSearchTerm(e.target.value)}
                onFocus={() => {
                  setTbn2SitesprenDropdownOpen(true);
                  setTbn2SitesprenSearchTerm('');
                }}
                placeholder={!tbn2_selectedBatchId ? 'Select batch first' : 'Type to search by sitespren_base...'}
                disabled={!tbn2_selectedBatchId}
                className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ fontSize: '14px' }}
              />
              {tbn2_sitesprenDropdownOpen && tbn2_selectedBatchId && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                  {/* Clear/Empty option - always shows first */}
                  <div
                    onClick={() => {
                      setTbn2SelectedSitesprenId('');
                      setTbn2CurrentSitesprenBase('');
                      setTbn2SitesprenDropdownOpen(false);
                      setTbn2SitesprenSearchTerm('');
                      // Clear gcon pieces as well since they depend on sitespren
                      setTbn2GconPieces([]);
                      setTbn2SelectedGconPieceId('');
                      setTbn2CurrentGconPieceTitle('');
                    }}
                    className="px-3 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-200 bg-red-25"
                    style={{ fontSize: '13px' }}
                  >
                    <span className="text-red-600 font-medium">(update to empty)</span>
                  </div>
                  {tbn2_getFilteredSitesprenOptions().length > 0 ? (
                    tbn2_getFilteredSitesprenOptions().map((option) => (
                      <div
                        key={option.id}
                        onClick={() => {
                          setTbn2SelectedSitesprenId(option.id);
                          setTbn2CurrentSitesprenBase(option.sitespren_base);
                          setTbn2SitesprenDropdownOpen(false);
                          setTbn2SitesprenSearchTerm('');
                          tbn2_fetchGconPieces(option.sitespren_base);
                        }}
                        className={`px-3 py-2 hover:bg-blue-50 cursor-pointer ${
                          option.id === tbn2_selectedSitesprenId ? 'bg-blue-100' : ''
                        }`}
                        style={{ fontSize: '13px' }}
                      >
                        <span className="text-gray-500">{tbn2_truncateUUID(option.id)}</span> - <span className="text-gray-900">{option.sitespren_base}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500" style={{ fontSize: '13px' }}>
                      No matches found
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={tbn2_handleSitesprenSave}
              disabled={!tbn2_selectedBatchId || tbn2_sitesprenSaving}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ fontSize: '16px' }}
              title={!tbn2_selectedBatchId ? 'Select a batch first' : 'Save sitespren assignment'}
            >
              {tbn2_sitesprenSaving ? '...' : 'save'}
            </button>
          </div>

          {/* Site Tool Buttons */}
          {tbn2_selectedSitesprenId && (() => {
            const sitesprenBase = tbn2_getSelectedSitesprenDisplay()?.split(' - ')[1] || '';
            return sitesprenBase ? (
              <>
                <hr className="my-3" />
                <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>Site Tools</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(`https://${sitesprenBase}/wp-admin/`, '_blank')}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    title="Open WP Admin"
                  >
                    WP
                  </button>
                  <button
                    onClick={() => window.open(`https://${sitesprenBase}`, '_blank')}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    title="Open Site"
                  >
                    Site
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sitesprenBase);
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    title="Copy domain to clipboard"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => window.open(`https://www.google.com/search?q=site%3A${encodeURIComponent(sitesprenBase)}`, '_blank')}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Google site: search"
                  >
                    G
                  </button>
                  <button
                    onClick={() => window.open(`https://web.archive.org/web/*/${sitesprenBase}`, '_blank')}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title="View in Wayback Machine"
                  >
                    🕰️
                  </button>
                  <a
                    href={`/nwjar1?coltemp=option1&sitebase=${encodeURIComponent(sitesprenBase)}`}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Open NW Jar"
                  >
                    NW
                  </a>
                  <a
                    href={`/gconjar1?coltemp=option1&sitebase=${encodeURIComponent(sitesprenBase)}`}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    title="Open GC Jar"
                  >
                    GC
                  </a>
                  <a
                    href={`/drom?sitesentered=${encodeURIComponent(sitesprenBase)}&activefilterchamber=daylight&showmainchamberboxes=no&showtundrachamber=yes`}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    title="Open Driggsman"
                  >
                    DG
                  </a>
                  <a
                    href={`/sitejar4?sitesentered=${encodeURIComponent(sitesprenBase)}`}
                    className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="View only this site"
                  >
                    IN
                  </a>
                </div>
              </>
            ) : null;
          })()}

          {/* Pushador Actions Section */}
          {tbn2_selectedSitesprenId && (
            <>
              <hr className="my-3" />
              <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>pushador_actions</div>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleWpsv2Sync(tbn2_selectedSitesprenId, 'plugin_api')}
                    disabled={tbn2_syncLoading.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_syncLoading.has(tbn2_selectedSitesprenId) ? 'Syncing...' : 'Plugin API'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Plugin API Sync</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> wpsv2SyncViaPluginApi()</p>
                        <p><strong>Location:</strong> /app/api/wpsv2/sync-site/route.ts:138-187</p>
                        <p><strong>Flow:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Fetches content from WP via custom plugin endpoint</li>
                          <li>Uses ruplin_api_key_1 for authentication</li>
                          <li>Calls wpsv2SaveContentToDatabase()</li>
                          <li>Saves to nwpi_content table</li>
                        </ol>
                        <p><strong>Endpoint:</strong> /wp-json/snefuru/v1/posts</p>
                        <p><strong>Auth:</strong> Bearer token in header</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleWpsv2Sync(tbn2_selectedSitesprenId, 'rest_api')}
                    disabled={tbn2_syncLoading.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_syncLoading.has(tbn2_selectedSitesprenId) ? 'Syncing...' : 'Rest API'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">REST API Sync</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> wpsv2SyncViaRestApi()</p>
                        <p><strong>Location:</strong> /app/api/wpsv2/sync-site/route.ts:190-274</p>
                        <p><strong>Flow:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Uses standard WP REST API</li>
                          <li>Fetches posts & pages separately</li>
                          <li>Can work without auth (public posts only)</li>
                          <li>Saves to nwpi_content table</li>
                        </ol>
                        <p><strong>Endpoints:</strong> /wp-json/wp/v2/posts, /wp-json/wp/v2/pages</p>
                        <p><strong>Auth:</strong> Optional app password</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleWpsv2TestPlugin(tbn2_selectedSitesprenId)}
                    disabled={tbn2_syncLoading.has(`test_${tbn2_selectedSitesprenId}`)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_syncLoading.has(`test_${tbn2_selectedSitesprenId}`) ? 'Testing...' : 'Test Plugin'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Test Plugin Connection</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleWpsv2TestPlugin()</p>
                        <p><strong>API Route:</strong> /api/test-plugin-connection</p>
                        <p><strong>Purpose:</strong> Verifies plugin is installed & API key is valid</p>
                        <p><strong>Tests:</strong></p>
                        <ul className="list-disc list-inside ml-2">
                          <li>Plugin presence check</li>
                          <li>API key authentication</li>
                          <li>Endpoint accessibility</li>
                          <li>Response format validation</li>
                        </ul>
                        <p><strong>Returns:</strong> Success/failure status</p>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-orange-600 rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleCheckPluginVersion(tbn2_selectedSitesprenId)}
                    disabled={tbn2_checkingPluginVersion.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_checkingPluginVersion.has(tbn2_selectedSitesprenId) ? 'Checking...' : 'Check WP Plugin Version'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Check Plugin Version</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleCheckPluginVersion()</p>
                        <p><strong>API Route:</strong> /api/check-plugin-version</p>
                        <p><strong>Purpose:</strong> Gets installed plugin version from WP site</p>
                        <p><strong>Process:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Queries WP plugin endpoint</li>
                          <li>Retrieves version number</li>
                          <li>Compares with latest available</li>
                          <li>Shows update availability</li>
                        </ol>
                        <p><strong>Uses:</strong> Plugin's version check endpoint</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleUpdatePlugin(tbn2_selectedSitesprenId)}
                    disabled={tbn2_updatingPlugin.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_updatingPlugin.has(tbn2_selectedSitesprenId) ? 'Updating...' : 'Update Plugin'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Update Plugin</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleUpdatePlugin()</p>
                        <p><strong>API Route:</strong> /api/update-plugin</p>
                        <p><strong>Purpose:</strong> Updates WP plugin to latest version</p>
                        <p><strong>Process:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Downloads latest plugin ZIP</li>
                          <li>Uploads to WordPress</li>
                          <li>Deactivates old version</li>
                          <li>Installs & activates new version</li>
                        </ol>
                        <p><strong>Note:</strong> Requires WP admin credentials</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 relative group flex items-center gap-1"
                    onClick={() => tbn2_handleBarkroPush(tbn2_selectedSitesprenId)}
                    disabled={tbn2_barkroPushing.has(tbn2_selectedSitesprenId)}
                  >
                    <span className="info-icon">ⓘ</span>
                    {tbn2_barkroPushing.has(tbn2_selectedSitesprenId) ? 'Pushing...' : 'Push updates with Barkro'}
                    <div className="tooltip-content">
                      <div className="font-bold mb-2">Barkro Push Updates</div>
                      <div className="text-xs space-y-1">
                        <p><strong>Function:</strong> handleBarkroPush()</p>
                        <p><strong>API Route:</strong> /api/barkro/push-update/route.ts</p>
                        <p><strong>Purpose:</strong> Push plugin updates via Barkro system</p>
                        <p><strong>Flow:</strong></p>
                        <ol className="list-decimal list-inside ml-2">
                          <li>Gets current plugin version from DB</li>
                          <li>Creates narpi_pushes record</li>
                          <li>Sends update notification to WP</li>
                          <li>WP checks & applies update</li>
                        </ol>
                        <p><strong>Endpoint:</strong> /wp-json/snefuru/v1/check-update</p>
                        <p><strong>Auth:</strong> Uses ruplin_api_key_1</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <hr className="my-3" />
              <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>feedback message</div>
              
              {/* Feedback Messages Area */}
              <div className="min-h-[40px]">
                {(tbn2_syncResults[tbn2_selectedSitesprenId] || 
                  tbn2_syncResults[`test_${tbn2_selectedSitesprenId}`] || 
                  tbn2_syncResults[`version_${tbn2_selectedSitesprenId}`] || 
                  tbn2_syncResults[`update_${tbn2_selectedSitesprenId}`] || 
                  tbn2_syncResults[`barkro_${tbn2_selectedSitesprenId}`]) && (
                  <div className={`text-xs p-2 rounded ${
                    (tbn2_syncResults[tbn2_selectedSitesprenId]?.type === 'success' || 
                     tbn2_syncResults[`test_${tbn2_selectedSitesprenId}`]?.type === 'success' || 
                     tbn2_syncResults[`version_${tbn2_selectedSitesprenId}`]?.type === 'success' || 
                     tbn2_syncResults[`update_${tbn2_selectedSitesprenId}`]?.type === 'success' || 
                     tbn2_syncResults[`barkro_${tbn2_selectedSitesprenId}`]?.type === 'success') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tbn2_syncResults[tbn2_selectedSitesprenId]?.message || 
                     tbn2_syncResults[`test_${tbn2_selectedSitesprenId}`]?.message || 
                     tbn2_syncResults[`version_${tbn2_selectedSitesprenId}`]?.message || 
                     tbn2_syncResults[`update_${tbn2_selectedSitesprenId}`]?.message || 
                     tbn2_syncResults[`barkro_${tbn2_selectedSitesprenId}`]?.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Content Management Section and Image Discovery Section - Side by side layout */}
        <div className="flex space-x-4">
          {/* Content Management Section - Wrapper for related content operations */}
          <div className="space-y-3">
            {/* Gcon Piece Assignment Widget */}
            <div 
              className="bg-white border border-gray-300 rounded-lg p-2"
            >
              <div className="font-bold text-gray-700 mb-1" style={{ fontSize: '16px' }}>asn_gcon_piece_id</div>
              <div className="flex items-center space-x-2">
                <div className="relative" ref={gconPieceDropdownRef} style={{ width: '370px' }}>
                  <input
                    type="text"
                    value={tbn2_gconPieceDropdownOpen ? tbn2_gconPieceSearchTerm : (tbn2_selectedGconPieceId ? tbn2_getSelectedGconPieceDisplay() : '')}
                    onChange={(e) => setTbn2GconPieceSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (!tbn2_selectedBatchId || !tbn2_selectedSitesprenId) return;
                      setTbn2GconPieceDropdownOpen(true);
                      setTbn2GconPieceSearchTerm('');
                    }}
                    placeholder={!tbn2_selectedBatchId ? 'Select batch first' : 
                               !tbn2_selectedSitesprenId ? 'Select sitespren first' : 
                               'Type to search by title or pageslug...'}
                    disabled={!tbn2_selectedBatchId || !tbn2_selectedSitesprenId}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ fontSize: '14px' }}
                  />
                  {tbn2_gconPieceDropdownOpen && tbn2_selectedBatchId && tbn2_selectedSitesprenId && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                      {/* Clear/Empty option - always shows first */}
                      <div
                        onClick={() => {
                          setTbn2SelectedGconPieceId('');
                          setTbn2CurrentGconPieceTitle('');
                          setTbn2GconPieceDropdownOpen(false);
                          setTbn2GconPieceSearchTerm('');
                        }}
                        className="px-3 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-200 bg-red-25"
                        style={{ fontSize: '13px' }}
                      >
                        <span className="text-red-600 font-medium">(update to empty)</span>
                      </div>
                      {tbn2_getFilteredGconPieceOptions().length > 0 ? (
                        tbn2_getFilteredGconPieceOptions().map((option) => (
                          <div
                            key={option.id}
                            onClick={() => {
                              setTbn2SelectedGconPieceId(option.id);
                              setTbn2GconPieceDropdownOpen(false);
                              setTbn2GconPieceSearchTerm('');
                            }}
                            className={`px-3 py-2 hover:bg-blue-50 cursor-pointer ${
                              option.id === tbn2_selectedGconPieceId ? 'bg-blue-100' : ''
                            }`}
                            style={{ fontSize: '13px' }}
                          >
                            <div className="flex flex-col">
                              <div>
                                <span className="text-gray-500">{tbn2_truncateUUID(option.id)}</span> - <span className="text-gray-900 font-medium">{option.meta_title}</span>
                              </div>
                              {option.post_name && (
                                <div className="text-sm text-gray-600 mt-1">
                                  pageslug: {option.post_name}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500" style={{ fontSize: '13px' }}>
                          No matches found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={tbn2_handleGconPieceSave}
                  disabled={!tbn2_selectedBatchId || tbn2_gconPieceSaving}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  style={{ fontSize: '16px' }}
                  title={!tbn2_selectedBatchId ? 'Select a batch first' : 
                         !tbn2_selectedSitesprenId ? 'Select a sitespren first' :
                         'Save gcon piece assignment'}
                >
                  {tbn2_gconPieceSaving ? '...' : 'save'}
                </button>
              </div>

              {/* Quick Action Buttons */}
              {tbn2_selectedGconPieceId && (() => {
                const urls = tbn2_getGconPieceUrls();
                return urls ? (
                  <div className="mt-2 flex space-x-1">
                    <button
                      onClick={() => urls.pendulum && window.open(urls.pendulum, '_blank')}
                      disabled={!urls.pendulum}
                      className="px-2 text-xs font-medium rounded border transition-colors bg-gray-600 text-white border-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      style={{ height: '20px' }}
                      title="Edit in WordPress admin"
                    >
                      pendulum
                    </button>
                    <button
                      onClick={() => urls.elementor && window.open(urls.elementor, '_blank')}
                      disabled={!urls.elementor}
                      className="px-2 text-xs font-medium rounded border transition-colors bg-purple-600 text-white border-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      style={{ height: '20px' }}
                      title="Edit with Elementor"
                    >
                      elementor
                    </button>
                    <button
                      onClick={() => urls.frontend && window.open(urls.frontend, '_blank')}
                      disabled={!urls.frontend}
                      className="px-2 text-xs font-medium rounded border transition-colors bg-green-600 text-white border-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      style={{ height: '20px' }}
                      title="View frontend page"
                    >
                      frontend
                    </button>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Narpi Push Button */}
            <div className="bg-white border border-gray-300 rounded-lg p-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">WordPress Push</div>
              <button
                onClick={tbn2_sfunc63_createNarpiPush}
                disabled={!tbn2_selectedBatchId || !tbn2_selectedSitesprenId || tbn2_selectedRows.size === 0 || tbn2_narpiPushLoading}
                className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
                  !tbn2_selectedBatchId || !tbn2_selectedSitesprenId || tbn2_selectedRows.size === 0 || tbn2_narpiPushLoading
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                }`}
                title={
                  !tbn2_selectedBatchId ? 'Select a batch first' :
                  !tbn2_selectedSitesprenId ? 'Select a sitespren site first' :
                  tbn2_selectedRows.size === 0 ? 'Select at least one image plan from the table' :
                  'Push selected images to sitespren site'
                }
              >
                {tbn2_narpiPushLoading ? '...' : 'tbn2_sfunc63_createNarpiPush()'}
              </button>
              
              {/* Progress Bar */}
              {(tbn2_narpiPushLoading || tbn2_narpiPushStatus) && (
                <div className="mt-2">
                  <div className="w-36 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{width: `${tbn2_narpiPushProgress}%`}}
                    ></div>
                  </div>
                  {tbn2_narpiPushStatus && (
                    <div className="text-xs text-gray-600 mt-1">{tbn2_narpiPushStatus}</div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Push Button */}
            <div className="bg-white border border-gray-300 rounded-lg p-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">custom push</div>
              <button
                onClick={() => {
                  // No functionality yet
                }}
                className="px-3 py-2 text-sm font-medium rounded border transition-colors bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              >
                run
              </button>
            </div>
          </div>
        </div>
        
        </div> {/* End folate_chamber wrapper */}

      </div>

      {/* Chambers Section - Entrench, Missile & Vesicle full width below main content */}
      <div className="space-y-4 mb-6">
        {/* First Row - Entrench & Missile Chambers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Entrench Chamber - Aranya Image Removal */}
          <div className="bg-white border border-gray-300 rounded-lg p-4" style={{ display: tbn2_entrenchChamberVisible ? 'block' : 'none' }}>
            <div className="font-bold text-gray-700 mb-3" style={{ fontSize: '16px' }}>entrench_chamber</div>
            <div className="text-gray-600 text-sm mb-2">Remove all images from Elementor page</div>
            <button
              onClick={() => {
                if (!tbn2_selectedGconPieceId) {
                  setTbn2Error('❌ Please select a gcon piece first');
                  return;
                }
                tbn2_handleAranyaRemove(tbn2_selectedGconPieceId);
              }}
              disabled={!tbn2_selectedGconPieceId || tbn2_aranyaLoading}
              className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
                !tbn2_selectedGconPieceId || tbn2_aranyaLoading
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              }`}
              title={!tbn2_selectedGconPieceId ? 'Please select a gcon piece first' : 'Remove all images from the selected Elementor page'}
            >
              {tbn2_aranyaLoading ? 'Removing...' : 'run aranya'}
            </button>
          </div>

          {/* Missile Chamber - Hippo Gutenberg Updates */}
          <div className="bg-white border border-gray-300 rounded-lg p-4" style={{ display: tbn2_missileChamberVisible ? 'block' : 'none' }}>
            <div className="font-bold text-gray-700 mb-3" style={{ fontSize: '16px' }}>missile_chamber</div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-2">
              <button
                className="px-3 py-1 text-sm font-medium border-b-2 border-blue-500 text-blue-600 bg-blue-50"
              >
                hippo_replace
              </button>
            </div>
            
            {/* Hippo Replace Tab Content */}
            <div>
              <div className="font-bold text-gray-700 mb-1" style={{ fontSize: '14px' }}>gutenberg page image replacement</div>
              <div className="text-gray-600 text-sm mb-3">(for use with gutenberg pages)</div>
              
              {/* Mini Table */}
              <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">Process Status:</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span>narpi push record</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div className="bg-gray-400 h-1 rounded-full" style={{width: '0%'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>narpi push upload</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div className="bg-gray-400 h-1 rounded-full" style={{width: '0%'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>swale arrangement</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div className="bg-gray-400 h-1 rounded-full" style={{width: '0%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Bar */}
              <div className="flex gap-2 mb-3">
                <button
                  disabled
                  className="px-2 py-1 text-xs font-medium text-white bg-gray-400 rounded cursor-not-allowed"
                >
                  swale arrange
                </button>
              </div>

              {/* Run Hippo Button */}
              <button
                onClick={() => {
                  if (!tbn2_selectedGconPieceId) {
                    setTbn2Error('❌ Please select a gcon piece first');
                    return;
                  }
                  tbn2_handleHippoUpdatePageWithImages(tbn2_selectedGconPieceId);
                }}
                disabled={!tbn2_selectedGconPieceId || tbn2_hippoLoading}
                className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
                  !tbn2_selectedGconPieceId || tbn2_hippoLoading
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                }`}
                title={!tbn2_selectedGconPieceId ? 'Please select a gcon piece first' : 'Update Gutenberg page with images via Hippo'}
              >
                {tbn2_hippoLoading ? 'Processing...' : 'run hippo'}
              </button>
            </div>
          </div>
        </div>

        {/* Second Row - Vesicle Chamber full width */}
        <div className="bg-white border border-gray-300 rounded-lg p-4" style={{ display: tbn2_vesicleChamberVisible ? 'block' : 'none' }}>
          {/* Vesicle Chamber Header - Always visible */}
          <div className="font-bold text-gray-700 mb-3" style={{ fontSize: '16px' }}>vesicle_chamber</div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-2">
            {[
              { id: 'utab1', label: 'el. cradles tab' },
              { id: 'utab2', label: 'regolith' },
              { id: 'utab3', label: 'pelementor' },
              { id: 'utab4', label: 'rhino_replace' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTbn2ActiveImageDiscoveryTab(tab.id as 'utab1' | 'utab2' | 'utab3' | 'utab4')}
                className={`px-3 py-1 text-sm font-medium border-b-2 transition-colors ${
                  tbn2_activeImageDiscoveryTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          {tbn2_activeImageDiscoveryTab === 'utab1' && (
            <div>
              <div className="font-bold text-gray-700 mb-1" style={{ fontSize: '16px' }}>image cradle discovery box</div>
              <div className="text-gray-600 text-sm mb-2">(for use with elementor pages)</div>
              <button
                onClick={tbn2_handleElementorImageDiscovery}
                disabled={!tbn2_selectedGconPieceId || tbn2_imageDiscoveryLoading}
                className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
                  !tbn2_selectedGconPieceId || tbn2_imageDiscoveryLoading
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                }`}
                title={!tbn2_selectedGconPieceId ? 'Please select a gcon piece first' : 'Process elementor images for discovery'}
              >
                {tbn2_imageDiscoveryLoading ? 'Processing...' : 'f327_discover_elementor_image_cradles'}
              </button>
              
              {/* Discovered img cradles JSON display */}
                <div className="mt-3">
                  <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>discovered_img_cradles_json</div>
                  <div 
                    className="bg-gray-50 border border-gray-300 rounded p-3 overflow-auto font-mono text-sm"
                    style={{ 
                      maxHeight: '200px', 
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}
                  >
                    {tbn2_discoveredImgCradlesJson ? (
                      <pre className="whitespace-pre-wrap">
                        {(() => {
                          try {
                            // Try to parse and format JSON nicely
                            const parsed = JSON.parse(tbn2_discoveredImgCradlesJson);
                            return JSON.stringify(parsed, null, 2);
                          } catch (e) {
                            // If it's not valid JSON, display as-is
                            return tbn2_discoveredImgCradlesJson;
                          }
                        })()}
                      </pre>
                    ) : (
                      <div className="text-gray-500 italic">
                        {tbn2_selectedGconPieceId ? 'No cradles data available' : 'Select a gcon piece to view cradles data'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {tbn2_activeImageDiscoveryTab === 'utab2' && (
              <div>
                <button
                  onClick={tbn2_handleElementorImagesRegolith}
                  disabled={!tbn2_selectedGconPieceId || tbn2_imagesRegolithLoading}
                  className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
                    !tbn2_selectedGconPieceId || tbn2_imagesRegolithLoading
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                  }`}
                  title={!tbn2_selectedGconPieceId ? 'Please select a gcon piece first' : 'Discover actual images from elementor pages'}
                >
                  {tbn2_imagesRegolithLoading ? 'Processing...' : 'f331_discover_elementor_images_regolith'}
                </button>
                
                {/* Discovered images regolith display */}
                <div className="mt-3">
                  <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>discovered_images_regolith</div>
                  <div 
                    className="bg-gray-50 border border-gray-300 rounded p-3 overflow-auto font-mono text-sm"
                    style={{ 
                      maxHeight: '200px', 
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}
                  >
                    {tbn2_discoveredImagesRegolith ? (
                      <pre className="whitespace-pre-wrap">
                        {(() => {
                          try {
                            // Try to parse and format JSON nicely
                            const parsed = JSON.parse(tbn2_discoveredImagesRegolith);
                            return JSON.stringify(parsed, null, 2);
                          } catch (e) {
                            // If it's not valid JSON, display as-is
                            return tbn2_discoveredImagesRegolith;
                          }
                        })()}
                      </pre>
                    ) : (
                      <div className="text-gray-500 italic">
                        {tbn2_selectedGconPieceId ? 'No regolith data available' : 'Select a gcon piece to view regolith data'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {tbn2_activeImageDiscoveryTab === 'utab3' && (
              <div>
                {/* Pelementor cached display */}
                <div className="mt-3">
                  <div className="font-bold text-gray-700 mb-2" style={{ fontSize: '16px' }}>pelementor_cached</div>
                  <div 
                    className="bg-gray-50 border border-gray-300 rounded p-3 overflow-auto font-mono text-sm"
                    style={{ 
                      maxHeight: '200px', 
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}
                  >
                    {tbn2_pelementorCached ? (
                      <pre className="whitespace-pre-wrap">
                        {(() => {
                          try {
                            // Try to parse and format JSON nicely
                            const parsed = JSON.parse(tbn2_pelementorCached);
                            return JSON.stringify(parsed, null, 2);
                          } catch (e) {
                            // If it's not valid JSON, display as-is
                            return tbn2_pelementorCached;
                          }
                        })()}
                      </pre>
                    ) : (
                      <div className="text-gray-500 italic">
                        {tbn2_selectedGconPieceId ? 'No pelementor cached data available' : 'Select a gcon piece to view pelementor cached data'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {tbn2_activeImageDiscoveryTab === 'utab4' && (
              <div>
                {/* Rhino Replace interface */}
                <div className="mt-3">
                  {/* Pre-existing narpi push toggle */}
                  <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={tbn2_usePreExistingNarpi}
                          onChange={(e) => setTbn2UsePreExistingNarpi(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="text-sm font-medium text-gray-700">
                        use pre-existing narpi push
                      </span>
                    </div>
                    
                    {/* Narpi push selection methods */}
                    {tbn2_usePreExistingNarpi && (
                      <div className="mt-3">
                        {/* Radio buttons for input method selection */}
                        <div className="mb-4">
                          <div className="flex items-center gap-6">
                            {/* Dropdown option */}
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="dropdown-method"
                                name="narpiInputMethod"
                                value="dropdown"
                                checked={tbn2_narpiInputMethod === 'dropdown'}
                                onChange={(e) => {
                                  setTbn2NarpiInputMethod(e.target.value as 'dropdown' | 'manual');
                                  // Clear the other input when switching
                                  if (e.target.value === 'dropdown') {
                                    setTbn2ManualNarpiPushId('');
                                  } else {
                                    setTbn2SelectedNarpiPushId('');
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor="dropdown-method" className="text-sm font-medium text-gray-700">
                                Dropdown Selection
                              </label>
                            </div>

                            {/* Manual input option */}
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="manual-method"
                                name="narpiInputMethod"
                                value="manual"
                                checked={tbn2_narpiInputMethod === 'manual'}
                                onChange={(e) => {
                                  setTbn2NarpiInputMethod(e.target.value as 'dropdown' | 'manual');
                                  // Clear the other input when switching
                                  if (e.target.value === 'dropdown') {
                                    setTbn2ManualNarpiPushId('');
                                  } else {
                                    setTbn2SelectedNarpiPushId('');
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor="manual-method" className="text-sm font-medium text-gray-700">
                                Manual UUID Entry
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown method */}
                        {tbn2_narpiInputMethod === 'dropdown' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Select narpi push:
                            </label>
                            {tbn2_narpiPushesLoading ? (
                              <div className="text-sm text-gray-500">Loading narpi pushes...</div>
                            ) : (
                              <select
                                value={tbn2_selectedNarpiPushId}
                                onChange={(e) => setTbn2SelectedNarpiPushId(e.target.value)}
                                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  tbn2_availableNarpiPushes.length === 0 
                                    ? 'bg-gray-100 text-gray-400' 
                                    : 'bg-white'
                                }`}
                                disabled={tbn2_availableNarpiPushes.length === 0}
                              >
                                <option value="">
                                  {tbn2_availableNarpiPushes.length === 0 
                                    ? 'No error-free narpi pushes available for this site' 
                                    : 'Select a narpi push...'}
                                </option>
                                {tbn2_availableNarpiPushes.map((push) => (
                                  <option key={push.id} value={push.id}>
                                    {push.push_name} - {push.push_desc} - {push.push_status1} - {new Date(push.created_at).toLocaleDateString()}
                                  </option>
                                ))}
                              </select>
                            )}
                            {tbn2_availableNarpiPushes.length === 0 && !tbn2_narpiPushesLoading && tbn2_selectedSitesprenId && (
                              <div className="text-xs text-gray-500 mt-1">
                                No error-free completed narpi pushes found for the selected site
                              </div>
                            )}
                          </div>
                        )}

                        {/* OR text */}
                        <div className="flex items-center justify-center my-4">
                          <span className="text-sm font-medium text-gray-500">OR</span>
                        </div>

                        {/* Manual UUID input method */}
                        {tbn2_narpiInputMethod === 'manual' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Enter Narpi Push UUID:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={tbn2_manualNarpiPushId}
                                onChange={(e) => setTbn2ManualNarpiPushId(e.target.value)}
                                placeholder="Enter UUID of Narpi Push"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                              <button
                                type="button"
                                onClick={saveUuidToLocalStorage}
                                disabled={!tbn2_manualNarpiPushId.trim()}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                  tbn2_manualNarpiPushId.trim()
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-gray-700 mb-3">
                    {tbn2_usePreExistingNarpi 
                      ? (() => {
                          const effectiveId = tbn2_narpiInputMethod === 'dropdown' 
                            ? tbn2_selectedNarpiPushId 
                            : tbn2_manualNarpiPushId;
                          return `Using pre-existing narpi push (${tbn2_narpiInputMethod})${effectiveId ? ' - selected' : ' - not selected'}`;
                        })()
                      : `${tbn2_selectedRows.size} images currently selected`
                    }
                  </div>
                  
                  {/* First HR */}
                  <hr className="my-4 border-gray-300" />
                  
                  {/* Arrangement Method Selection */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center space-x-4 bg-gray-50 p-3 rounded-lg">
                      <button
                        onClick={() => setTbn2ArrangementMethod('cliff')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          tbn2_arrangementMethod === 'cliff'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        } border-2`}
                      >
                        Cliff Arrange
                      </button>
                      <button
                        onClick={() => setTbn2ArrangementMethod('mason')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          tbn2_arrangementMethod === 'mason'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        } border-2`}
                      >
                        Mason Arrange
                      </button>
                      <button
                        onClick={() => setTbn2ArrangementMethod('boulder')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          tbn2_arrangementMethod === 'boulder'
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        } border-2`}
                      >
                        Boulder Arrange
                      </button>
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-2">
                      {tbn2_arrangementMethod === 'cliff' 
                        ? 'Cliff: Traditional image replacement method (works with new uploads or pre-existing narpi push)' 
                        : tbn2_arrangementMethod === 'mason'
                        ? 'Mason: Enhanced arrangement method (requires pre-existing narpi push, refreshes regolith data, uses native WordPress API)'
                        : 'Boulder: Regolith-free arrangement method (requires pre-existing narpi push, replaces ALL images found in current page)'}
                    </div>
                  </div>
                  
                  {/* Second HR */}
                  <hr className="my-4 border-gray-300" />
                  
                  <button
                    onClick={tbn2_handleRhinoReplace}
                    disabled={
                      tbn2_rhinoReplaceLoading || 
                      !tbn2_selectedGconPieceId || 
                      !tbn2_selectedBatchId || 
                      !tbn2_selectedSitesprenId ||
                      (tbn2_usePreExistingNarpi 
                        ? (tbn2_narpiInputMethod === 'dropdown' 
                            ? !tbn2_selectedNarpiPushId 
                            : !tbn2_manualNarpiPushId)
                        : tbn2_selectedRows.size === 0
                      )
                    }
                    className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
                      tbn2_rhinoReplaceLoading || 
                      !tbn2_selectedGconPieceId || 
                      !tbn2_selectedBatchId || 
                      !tbn2_selectedSitesprenId ||
                      (tbn2_usePreExistingNarpi 
                        ? (tbn2_narpiInputMethod === 'dropdown' 
                            ? !tbn2_selectedNarpiPushId 
                            : !tbn2_manualNarpiPushId)
                        : tbn2_selectedRows.size === 0
                      )
                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                        : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {tbn2_rhinoReplaceLoading ? '...' : 'run rhino_replace'}
                  </button>
                  
                  {/* Progress tracking table */}
                  <div className="mt-4">
                    <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid black', padding: '8px' }}>Narpi Push Record</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>
                            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', border: '1px solid #ccc' }}>
                              <div style={{ width: `${tbn2_rhinoProgress.narpiRecord}%`, height: '100%', backgroundColor: tbn2_rhinoProgress.narpiRecord > 0 ? '#4ade80' : '#d0d0d0', transition: 'width 0.3s ease' }}></div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid black', padding: '8px' }}>Narpi Push Upload</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>
                            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', border: '1px solid #ccc' }}>
                              <div style={{ width: `${tbn2_rhinoProgress.narpiUpload}%`, height: '100%', backgroundColor: tbn2_rhinoProgress.narpiUpload > 0 ? '#3b82f6' : '#d0d0d0', transition: 'width 0.3s ease' }}></div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid black', padding: '8px' }}>Cliff Arrangement</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>
                            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', border: '1px solid #ccc' }}>
                              <div style={{ width: `${tbn2_rhinoProgress.cliffArrangement}%`, height: '100%', backgroundColor: tbn2_rhinoProgress.cliffArrangement > 0 ? '#8b5cf6' : '#d0d0d0', transition: 'width 0.3s ease' }}></div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid black', padding: '8px' }}>Mason Arrangement</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>
                            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', border: '1px solid #ccc' }}>
                              <div style={{ width: `${tbn2_rhinoProgress.masonArrangement}%`, height: '100%', backgroundColor: tbn2_rhinoProgress.masonArrangement > 0 ? '#10b981' : '#d0d0d0', transition: 'width 0.3s ease' }}></div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid black', padding: '8px' }}>Boulder Arrangement</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>
                            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', border: '1px solid #ccc' }}>
                              <div style={{ width: `${tbn2_rhinoProgress.boulderArrangement}%`, height: '100%', backgroundColor: tbn2_rhinoProgress.boulderArrangement > 0 ? '#f97316' : '#d0d0d0', transition: 'width 0.3s ease' }}></div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Third Row - Medieval Chamber */}
        {/* medieval_chamber - Container for table configuration controls */}
        <div className={`mb-6 p-4 border border-black bg-white medieval_chamber_div ${tbn2_medievalChamberVisible ? '' : 'hidden'}`} style={{ border: '1px solid black', backgroundColor: '#ffffff' }}>
        <div className="font-bold text-gray-900 mb-4" style={{ fontSize: '16px' }}>medieval_chamber</div>
        
        {/* Column Template Controls - positioned just above the main table */}
        <div className="flex items-stretch space-x-4">
          {/* SQL View Info */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs" style={{maxWidth: '130px', maxHeight: '75px'}}>
            <div className="font-semibold text-gray-700 mb-1">SQL View Info</div>
            <div className="text-gray-600">view name: images_plans</div>
            <div className="text-gray-600"># columns: {tbn2_getAllTableColumns().length}</div>
          </div>

          {/* Column Template Options */}
          <div className="bg-white border border-gray-300 rounded-lg p-2" style={{maxWidth: '600px', maxHeight: '75px'}}>
            <div className="text-xs font-semibold text-gray-700 mb-2">Column Templates (Show/Hide)</div>
            <div className="flex space-x-1">
              {Object.entries(TBN2_COLUMN_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => tbn2_handleColumnTemplateChange(key)}
                  className={`text-xs leading-tight p-2 rounded border text-center ${
                    tbn2_selectedColTemplate === key
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  style={{width: '120px'}}
                >
                  <div className="font-semibold">{template.label}</div>
                  <div>{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sticky Columns Control */}
          <div className="bg-white border border-gray-300 rounded-lg p-2">
            <div className="text-xs font-semibold text-gray-700 mb-2">Sticky Columns At Left Side Of UI Grid Table</div>
            <div className="flex space-x-1">
              {[
                { id: 1, label: 'OPTION 1', subtitle: '1 left-most', range: 'column' },
                { id: 2, label: 'OPTION 2', subtitle: '2 left-most', range: 'columns' },
                { id: 3, label: 'OPTION 3', subtitle: '3 left-most', range: 'columns' },
                { id: 4, label: 'OPTION 4', subtitle: '4 left-most', range: 'columns' },
                { id: 5, label: 'OPTION 5', subtitle: '5 left-most', range: 'columns' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => tbn2_handleStickyColChange(option.id)}
                  className={`text-xs leading-tight p-1 rounded border text-center ${
                    tbn2_stickyColCount === option.id
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  style={{width: '80px'}}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div>{option.subtitle}</div>
                  <div>{option.range}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Main Table - enhanced with column template system */}
      <Tebnar2Table
        plans={tbn2_paginatedPlans}
        imagesById={tbn2_imagesById}
        fetchingImages={tbn2_fetchingImages}
        fetchStatusMessages={tbn2_fetchStatusMessages}
        lastClickTime={tbn2_lastClickTime}
        currentPage={tbn2_currentPage}
        pageSize={tbn2_pageSize}
        totalPages={tbn2_totalPages}
        totalPlans={tbn2_sortedPlans.length}
        onPageChange={setTbn2CurrentPage}
        onPageSizeChange={setTbn2PageSize}
        onRefreshImages={tbn2_fetchImages}
        onFetchSingleImage={tbn2_fetchSingleImage}
        stickyColumns={tbn2_getStickyColumns()}
        visibleColumns={tbn2_getVisibleColumns()}
        calculateStickyLeft={tbn2_calculateStickyLeft}
        getColumnWidth={tbn2_getColumnWidth}
        selectedRows={tbn2_selectedRows}
        onSelectionChange={setTbn2SelectedRows}
        sortColumn={tbn2_sortColumn}
        sortDirection={tbn2_sortDirection}
        onSort={tbn2_handleSort}
        renamingFiles={tbn2_renamingFiles}
        onRenameFile={tbn2_handleRenameFile}
        // Rocket Chamber props
        searchValue={tbn2_rocketSearchValue}
        onSearchChange={setTbn2RocketSearchValue}
        rocketCurrentPage={tbn2_rocketCurrentPage}
        rocketItemsPerPage={tbn2_rocketItemsPerPage}
        onRocketPageChange={setTbn2RocketCurrentPage}
        onRocketItemsPerPageChange={setTbn2RocketItemsPerPage}
        rocketColumnsPerPage={tbn2_rocketColumnsPerPage}
        rocketCurrentColumnPage={tbn2_rocketCurrentColumnPage}
        onRocketColumnPageChange={setTbn2RocketCurrentColumnPage}
        onRocketColumnsPerPageChange={setTbn2RocketColumnsPerPage}
        onWolfOptionsClick={tbn2_handleWolfOptionsClick}
        onPillarshiftColtempsClick={tbn2_handlePillarshiftColtempsClick}
      />

      {/* Functions Popup Modal - cloned from nwjar1 */}
      {tbn2_isPopupOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white w-full h-full max-w-[95vw] max-h-[100vh] rounded-lg shadow-xl relative flex flex-col overflow-hidden">
            {/* uelbar37 header bar */}
            <div 
              className="flex items-center px-4 flex-shrink-0"
              style={{ 
                height: '50px',
                backgroundColor: tbn2_uelBar37Colors.bg,
                color: tbn2_uelBar37Colors.text
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
              
              {/* Navy blue spacer div */}
              <div style={{ 
                width: '20px', 
                height: '100%', 
                backgroundColor: 'navy', 
                marginLeft: '70px' 
              }}></div>
              
              <span className="font-mono text-sm overflow-hidden whitespace-nowrap text-ellipsis flex-1">
                {(() => {
                  // Parse URL to highlight batchid parameter for tebnar2
                  try {
                    const url = new URL(tbn2_currentUrl);
                    const batchidParam = url.searchParams.get('batchid');
                    
                    if (batchidParam) {
                      const fullUrl = tbn2_currentUrl;
                      const batchidText = `batchid=${batchidParam}`;
                      const parts = fullUrl.split(batchidText);
                      
                      if (parts.length === 2) {
                        return (
                          <>
                            {parts[0]}
                            <span style={{ fontWeight: 'bold', color: '#ff9e71' }}>
                              {batchidText}
                            </span>
                            {parts[1]}
                          </>
                        );
                      }
                    }
                    
                    return tbn2_currentUrl;
                  } catch (error) {
                    return tbn2_currentUrl;
                  }
                })()}
              </span>

              {/* Copy buttons in uelbar37 - positioned to the left of close button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tbn2_currentUrl);
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
              <button
                onClick={() => {
                  try {
                    const url = new URL(tbn2_currentUrl);
                    const batchidParam = url.searchParams.get('batchid');
                    if (batchidParam) {
                      navigator.clipboard.writeText(batchidParam);
                    }
                  } catch (error) {
                    console.error('Error copying batch ID:', error);
                  }
                }}
                className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                style={{
                  width: '60px',
                  height: '50px',
                  marginRight: '0px',
                  fontSize: '10px',
                  flexDirection: 'column',
                  gap: '2px'
                }}
                title="Copy Batch ID"
              >
                <div>BATCH</div>
              </button>
            </div>
            
            {/* uelbar38 header bar */}
            <div 
              className="flex items-center px-4 flex-shrink-0"
              style={{ 
                height: '50px',
                backgroundColor: tbn2_uelBarColors.bg,
                color: tbn2_uelBarColors.text
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
                  color: tbn2_uelBarColors.text,
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
                onClick={tbn2_handleKz101Click}
              >
                <input
                  type="checkbox"
                  className="mr-2 pointer-events-none"
                  checked={tbn2_kz101Checked}
                  readOnly
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                SOPTION1 - Use Your Current Selection From Table | {tbn2_selectedRows.size} rows
              </div>
              <div 
                className="flex items-center kz102 font-bold"
                style={{
                  color: tbn2_uelBarColors.text,
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
                  color: tbn2_uelBarColors.text,
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
                onClick={tbn2_handleKz103Click}
              >
                <input
                  type="checkbox"
                  className="mr-2 pointer-events-none"
                  checked={tbn2_kz103Checked}
                  readOnly
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                SOPTION2 - Select All Items In Current Pagination | {tbn2_paginatedPlans.length} rows
              </div>
              
              {/* Close button in header - spans both bars */}
              <button
                onClick={tbn2_handlePopupClose}
                className="absolute right-0 top-0 bg-gray-400 text-gray-800 font-bold flex items-center justify-center hover:bg-gray-500 transition-colors"
                style={{
                  width: '60px',
                  height: '150px', // Spans all three visual rows
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
            
            {/* Tiger Bar - componentized uelbar45 and uelbar50 */}
            <TigerBar
              selectedBatchId={tbn2_selectedBatchId}
              selectedSitesprenId={tbn2_selectedSitesprenId}
              selectedGconPieceId={tbn2_selectedGconPieceId}
              batches={tbn2_batches}
              onBatchChange={tbn2_handleBatchChange}
              sitesprenDropdownOpen={tbn2_sitesprenDropdownOpen}
              sitesprenSearchTerm={tbn2_sitesprenSearchTerm}
              onSitesprenSearchTermChange={setTbn2SitesprenSearchTerm}
              onSitesprenDropdownOpenChange={setTbn2SitesprenDropdownOpen}
              getSelectedSitesprenDisplay={tbn2_getSelectedSitesprenDisplay}
              getFilteredSitesprenOptions={tbn2_getFilteredSitesprenOptions}
              onSitesprenSelect={(id, base) => {
                setTbn2SelectedSitesprenId(id);
                setTbn2CurrentSitesprenBase(base);
                setTbn2SitesprenDropdownOpen(false);
                setTbn2SitesprenSearchTerm('');
              }}
              onSitesprenClear={() => {
                setTbn2SelectedSitesprenId('');
                setTbn2CurrentSitesprenBase('');
                setTbn2SitesprenDropdownOpen(false);
                setTbn2SitesprenSearchTerm('');
                setTbn2GconPieces([]);
                setTbn2SelectedGconPieceId('');
                setTbn2CurrentGconPieceTitle('');
              }}
              onSitesprenSave={tbn2_handleSitesprenSave}
              sitesprenSaving={tbn2_sitesprenSaving}
              sitesprenDropdownRef={sitesprenDropdownRef}
              truncateUUID={tbn2_truncateUUID}
              fetchGconPieces={tbn2_fetchGconPieces}
              gconPieceDropdownOpen={tbn2_gconPieceDropdownOpen}
              gconPieceSearchTerm={tbn2_gconPieceSearchTerm}
              onGconPieceSearchTermChange={setTbn2GconPieceSearchTerm}
              onGconPieceDropdownOpenChange={setTbn2GconPieceDropdownOpen}
              getSelectedGconPieceDisplay={tbn2_getSelectedGconPieceDisplay}
              getFilteredGconPieceOptions={tbn2_getFilteredGconPieceOptions}
              onGconPieceSelect={(id) => {
                setTbn2SelectedGconPieceId(id);
                setTbn2GconPieceDropdownOpen(false);
                setTbn2GconPieceSearchTerm('');
              }}
              onGconPieceClear={() => {
                setTbn2SelectedGconPieceId('');
                setTbn2CurrentGconPieceTitle('');
                setTbn2GconPieceDropdownOpen(false);
                setTbn2GconPieceSearchTerm('');
              }}
              onGconPieceSave={tbn2_handleGconPieceSave}
              gconPieceSaving={tbn2_gconPieceSaving}
              gconPieceDropdownRef={gconPieceDropdownRef}
              getGconPieceUrls={tbn2_getGconPieceUrls}
              seedUrlWpEditor={tbn2_seedUrlWpEditor}
              seedUrlFrontend={tbn2_seedUrlFrontend}
              onSeedUrlWpEditorChange={setTbn2SeedUrlWpEditor}
              onSeedUrlFrontendChange={setTbn2SeedUrlFrontend}
              onSeedUrlWpEditorSave={tbn2_handleSeedUrlWpEditorSave}
              onSeedUrlFrontendSave={tbn2_handleSeedUrlFrontendSave}
              seedUrlSaving={tbn2_seedUrlSaving}
              marginRight="260px"
            />
            
            {/* Popup content - adjusted to start below all three headers */}
            <div className="flex-grow flex flex-col overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <nav className="flex">
                  {['ptab3', 'ptab2', 'ptab8', 'ptab4', 'ptab5', 'ptab6', 'ptab7', 'ptab1'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => tbn2_handleTabChange(tab)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        tbn2_activePopupTab === tab
                          ? 'border-blue-500 text-blue-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab === 'ptab1' ? 'Functions' : 
                       tab === 'ptab2' ? 'Create Plans' : 
                       tab === 'ptab8' ? 'Create Plans Adjunct' :
                       tab === 'ptab3' ? 'karmawiz nexus' : 
                       tab === 'ptab4' ? 'force to site' : 
                       tab === 'ptab7' ? 'random tab' : 
                       tab}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="p-8 flex-grow overflow-auto">
                {tbn2_activePopupTab === 'ptab1' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Functions</h3>
                    <div className="space-y-4">
                      
                      {/* Function Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => tbn2_handleSelectedItemsFunction('tbn2_example_function_1')}
                          disabled={tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {tbn2_functionLoading ? 'Processing...' : 'Example Function 1 - Process Selected Plans'}
                        </button>
                        
                        <button
                          onClick={() => tbn2_handleSelectedItemsFunction('tbn2_example_function_2')}
                          disabled={tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {tbn2_functionLoading ? 'Processing...' : 'Example Function 2 - Batch Operations'}
                        </button>
                        
                        <button
                          onClick={() => tbn2_handleSelectedItemsFunction('tbn2_regenerate_images')}
                          disabled={tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)}
                          className={`px-4 py-2 rounded font-medium ${
                            tbn2_functionLoading || (!tbn2_kz101Checked && !tbn2_kz103Checked) || (tbn2_kz101Checked && tbn2_selectedRows.size === 0)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {tbn2_functionLoading ? 'Processing...' : 'Regenerate Images for Selected Plans'}
                        </button>
                      </div>
                      
                      {/* Status Messages */}
                      {!tbn2_kz101Checked && !tbn2_kz103Checked && (
                        <p className="text-sm text-gray-500">
                          Select either SOPTION1 or SOPTION2 to enable functions
                        </p>
                      )}
                      {tbn2_kz101Checked && tbn2_selectedRows.size === 0 && (
                        <p className="text-sm text-gray-500">
                          SOPTION1 selected: Select items from the table to enable functions
                        </p>
                      )}
                      {tbn2_kz101Checked && tbn2_selectedRows.size > 0 && (
                        <p className="text-sm text-gray-600">
                          SOPTION1 selected: {tbn2_selectedRows.size} item(s) will be processed
                        </p>
                      )}
                      {tbn2_kz103Checked && (
                        <p className="text-sm text-gray-600">
                          SOPTION2 selected: All {tbn2_paginatedPlans.length} items will be processed
                        </p>
                      )}
                      
                      {/* Current Selection Info */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <strong>Current Selection Info:</strong>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          • Selected Rows: {tbn2_selectedRows.size}
                        </div>
                        <div className="text-xs text-gray-600">
                          • Current Page Items: {tbn2_paginatedPlans.length}
                        </div>
                        <div className="text-xs text-gray-600">
                          • Total Filtered Plans: {tbn2_filteredPlans.length}
                        </div>
                        {tbn2_selectedBatchId && (
                          <div className="text-xs text-gray-600">
                            • Active Batch Filter: {tbn2_selectedBatchId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab2' && (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold">Create New Image Plans</h3>
                      <button
                        onClick={tbn2_handleCreateNewBatch}
                        disabled={tbn2_createBatchLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                        title="Create a new empty batch and switch to it"
                      >
                        {tbn2_createBatchLoading ? 'Creating...' : 'create new batch'}
                      </button>
                    </div>
                    <p className="text-gray-600 mb-6">Use the tools below to create and submit new batches of image plans.</p>
                    
                    {/* Bat Chamber Section */}
                    <div className="border border-black border-solid p-4 mb-6">
                      <div className="font-bold text-base mb-4">bat_chamber</div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
                        use dynorex
                      </button>
                    </div>
                    
                    {/* Actions and Settings - moved from main page */}
                    <Tebnar2Actions
                      qtyPerPlan={tbn2_qtyPerPlan}
                      onQtyPerPlanChange={setTbn2QtyPerPlan}
                      aiModel={tbn2_aiModel}
                      onAiModelChange={setTbn2AiModel}
                      generateZip={tbn2_generateZip}
                      onGenerateZipChange={setTbn2GenerateZip}
                      wipeMeta={tbn2_wipeMeta}
                      onWipeMetaChange={setTbn2WipeMeta}
                      screenshotImages={tbn2_screenshotImages}
                      onScreenshotImagesChange={setTbn2ScreenshotImages}
                      alterpro={tbn2_alterpro}
                      onAlterproChange={setTbn2Alterpro}
                      throttle1={tbn2_throttle1}
                      onThrottle1Change={setTbn2Throttle1}
                      submitLoading={tbn2_submitLoading}
                      submitResult={tbn2_submitResult}
                      makeImagesLoading={tbn2_makeImagesLoading}
                      makeImagesResult={tbn2_makeImagesResult}
                      loadingPreset={tbn2_loadingPreset}
                      onPresetLoad={tbn2_loadDummyData}
                      onPresetLoad2Rows={tbn2_loadDummyData2Rows}
                      gridData={tbn2_gridData}
                      onGridDataChange={setTbn2GridData}
                      presetData={tbn2_presetData}
                      onSubmitCreatePlans={tbn2_handleSubmitCreatePlans}
                      onSubmitMakeImages={tbn2_handleSubmitMakeImages}
                    />
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab3' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab3</h3>
                    <p className="text-gray-600">This is the content area for ptab3.</p>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab4' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab4</h3>
                    <p className="text-gray-600">This is the content area for ptab4.</p>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab5' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab5</h3>
                    <p className="text-gray-600">This is the content area for ptab5.</p>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab6' && (
                  <div>
                    {/* Site Selection Widget for Popup - mirrors main page structure */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                      <div className="text-gray-700 mb-2 font-semibold" style={{ fontSize: '16px' }}>
                        images_plans_batches.asn_sitespren_id
                      </div>
                      <div className="text-gray-600 mb-3" style={{ fontSize: '14px' }}>
                        Currently selected site: {tbn2_selectedSitesprenId ? tbn2_getSelectedSitesprenDisplay() : 'No site selected'}
                      </div>
                      
                      {/* Site Selection Dropdown */}
                      <div className="flex items-center space-x-2">
                        <div className="relative" style={{ width: '300px' }}>
                          <input
                            type="text"
                            value={tbn2_sitesprenDropdownOpen ? tbn2_sitesprenSearchTerm : (tbn2_selectedSitesprenId ? tbn2_getSelectedSitesprenDisplay() : '')}
                            onChange={(e) => setTbn2SitesprenSearchTerm(e.target.value)}
                            onFocus={() => {
                              setTbn2SitesprenDropdownOpen(true);
                              setTbn2SitesprenSearchTerm('');
                            }}
                            placeholder={!tbn2_selectedBatchId ? 'Select batch first' : 'Type to search by sitespren_base...'}
                            disabled={!tbn2_selectedBatchId}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            style={{ fontSize: '14px' }}
                          />
                          
                          {tbn2_sitesprenDropdownOpen && tbn2_selectedBatchId && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              {/* Clear/Empty option - always shows first */}
                              <div
                                onClick={() => {
                                  setTbn2SelectedSitesprenId('');
                                  setTbn2CurrentSitesprenBase('');
                                  setTbn2SitesprenDropdownOpen(false);
                                  setTbn2SitesprenSearchTerm('');
                                  // Clear gcon pieces as well since they depend on sitespren
                                  setTbn2GconPieces([]);
                                  setTbn2SelectedGconPieceId('');
                                  setTbn2CurrentGconPieceTitle('');
                                }}
                                className="px-3 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-200 bg-red-25"
                                style={{ fontSize: '14px' }}
                              >
                                <span className="text-red-600 font-medium">(update to empty)</span>
                              </div>
                              {tbn2_getFilteredSitesprenOptions().map((option) => (
                                <div
                                  key={option.id}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setTbn2SelectedSitesprenId(option.id);
                                    setTbn2SitesprenDropdownOpen(false);
                                    setTbn2SitesprenSearchTerm('');
                                    
                                    // Find the sitespren_base for this ID
                                    const selectedSitespren = tbn2_sitesprenOptions.find(s => s.id === option.id);
                                    if (selectedSitespren) {
                                      setTbn2CurrentSitesprenBase(selectedSitespren.sitespren_base);
                                      tbn2_fetchGconPieces(selectedSitespren.sitespren_base);
                                    }
                                  }}
                                  style={{ fontSize: '14px' }}
                                >
                                  <div className="font-medium">{tbn2_truncateUUID(option.id)} - {option.sitespren_base}</div>
                                </div>
                              ))}
                              {tbn2_getFilteredSitesprenOptions().length === 0 && (
                                <div className="px-3 py-2 text-gray-500" style={{ fontSize: '14px' }}>
                                  No matching sites found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={tbn2_handleSitesprenSave}
                          disabled={!tbn2_selectedBatchId || tbn2_sitesprenSaving}
                          className={`px-3 py-1 text-white font-medium rounded ${
                            !tbn2_selectedBatchId || tbn2_sitesprenSaving
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          style={{ fontSize: '14px' }}
                        >
                          {tbn2_sitesprenSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-4">New Chepno Functions</h3>
                    
                    {/* Site Gadgets Section - Chepno Chamber - Extended Version */}
                    <div className="bg-white p-4 rounded-lg shadow border mb-4">
                      <div className="text-sm font-semibold text-gray-600 mb-1">box_area_6_tebnar2</div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">site_gadgets_chepno</h3>
                      
                      {/* Sync Actions Buttons */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            }`}
                            onClick={() => tbn2_handleSingleSiteAction('wpsv2_sync', 'plugin_api')}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Sync site using Plugin API"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep11<br />
                              articles<br />
                              wp → nwpi<br />
                              xplugin<br />
                              Plugin API
                            </div>
                          </button>
                          
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                            }`}
                            onClick={() => tbn2_handleSingleSiteAction('wpsv2_sync', 'rest_api')}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Sync site using REST API"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep21<br />
                              articles<br />
                              wp → nwpi<br />
                              xrest<br />
                              REST API
                            </div>
                          </button>
                          
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                            }`}
                            onClick={() => tbn2_handleSingleSiteAction('test_plugin')}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Test plugin connection"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep31<br />
                              Test Plugin
                            </div>
                          </button>
                          
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                            }`}
                            onClick={() => tbn2_handleSingleSiteAction('check_plugin_version')}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Check plugin version"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep41<br />
                              Check Version
                            </div>
                          </button>
                          
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            }`}
                            onClick={() => tbn2_handleSingleSiteAction('update_plugin')}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Update plugin"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep51<br />
                              xrest<br />
                              Update Plugin
                            </div>
                          </button>
                          
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                            }`}
                            onClick={() => tbn2_handleSingleSiteAction('barkro_push')}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Push Barkro update"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep61<br />
                              xplugin<br />
                              Barkro Push
                            </div>
                          </button>
                          
                          {/* Black vertical separator */}
                          <div className="w-1.5 bg-black self-stretch"></div>
                          
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                            }`}
                            onClick={() => tbn2_handleF22NwpiToGconPusher()}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Chep 385 function"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep 385<br />
                              f22_nwpi_to_gcon_pusher
                            </div>
                          </button>
                          
                          <button
                            className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1 ${
                              !tbn2_selectedSitesprenId 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'
                            }`}
                            onClick={() => tbn2_handleF47GenerateGconPieces()}
                            disabled={!tbn2_selectedSitesprenId}
                            title="Chep 390 function"
                          >
                            <span className="info-icon group">ℹ</span>
                            <div className="text-center leading-tight">
                              chep 390<br />
                              f47_generate_gcon_pieces
                            </div>
                          </button>
                        </div>
                        
                        {!tbn2_selectedSitesprenId && (
                          <p className="text-sm text-gray-500 mt-2">Please select a site from the asn_sitespren_id dropdown to use these actions</p>
                        )}
                      </div>
                      
                      {/* Feedback Display */}
                      {tbn2_gadgetFeedback && (
                        <div className={`mt-4 p-3 rounded-md ${
                          tbn2_gadgetFeedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                          tbn2_gadgetFeedback.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                          tbn2_gadgetFeedback.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                          'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          <div className="flex items-start">
                            <div className="flex-1">
                              <p className="font-semibold">{tbn2_gadgetFeedback.action}</p>
                              <p className="text-sm mt-1">{tbn2_gadgetFeedback.message}</p>
                              <p className="text-xs mt-1 opacity-75">
                                {new Date(tbn2_gadgetFeedback.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={() => setTbn2GadgetFeedback(null)}
                              className="ml-3 text-gray-400 hover:text-gray-600"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab7' && (
                  <div>
                    {/* ReverseRelation Widget - Shows currently assigned gcon_piece */}
                    <div 
                      className="bg-white border border-gray-300 rounded-lg p-2"
                    >
                      <div className="font-bold text-gray-700 mb-1" style={{ fontSize: '16px' }}>ReverseRelation-from-gcon_pieces.asn_image_plan_batch_id (assigned gcon_piece)</div>
                      <div className="flex items-center space-x-2">
                        {/* Text display with copy button */}
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            readOnly
                            value={(() => {
                              if (!tbn2_assignedGconPiece) return '';
                              // Format: "35a.- 5nezl.ksit.me/services-hub-page/"
                              const truncatedId = tbn2_assignedGconPiece.id.substring(0, 3) + '.';
                              const sitesprenBase = tbn2_assignedGconPiece.asn_sitespren_base || '';
                              const postName = tbn2_assignedGconPiece.post_name || '';
                              return `${truncatedId}- ${sitesprenBase}/${postName}/`;
                            })()}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded bg-gray-50"
                            style={{ fontSize: '14px' }}
                          />
                          <button
                            onClick={() => {
                              if (!tbn2_assignedGconPiece) return;
                              const truncatedId = tbn2_assignedGconPiece.id.substring(0, 3) + '.';
                              const sitesprenBase = tbn2_assignedGconPiece.asn_sitespren_base || '';
                              const postName = tbn2_assignedGconPiece.post_name || '';
                              const textToCopy = `${truncatedId}- ${sitesprenBase}/${postName}/`;
                              navigator.clipboard.writeText(textToCopy);
                            }}
                            disabled={!tbn2_assignedGconPiece}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            style={{ fontSize: '14px' }}
                          >
                            Copy
                          </button>
                        </div>
                        {/* Open buttons */}
                        <button
                          onClick={() => {
                            if (tbn2_assignedGconPiece) {
                              window.open(`/torya?gcon_piece_id=${tbn2_assignedGconPiece.id}`, '_blank');
                            }
                          }}
                          disabled={!tbn2_assignedGconPiece}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          style={{ fontSize: '16px' }}
                        >
                          open /torya
                        </button>
                        <button
                          onClick={() => {
                            if (tbn2_assignedGconPiece) {
                              window.open(`/mesagen/${tbn2_assignedGconPiece.id}`, '_blank');
                            }
                          }}
                          disabled={!tbn2_assignedGconPiece}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          style={{ fontSize: '16px' }}
                        >
                          open /mesagen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {tbn2_activePopupTab === 'ptab8' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Create Plans Adjunct</h3>
                    {/* Content for Create Plans Adjunct tab - left blank for now */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wolf Options Popup */}
      {tbn2_isWolfOptionsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] h-[500px] max-w-[90vw] max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Wolf Options - Tebnar2</h2>
              <button
                onClick={() => setTbn2IsWolfOptionsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Image Plan Optimization</h3>
                {[
                  'Enable automatic image plan detection',
                  'Use progressive optimization for large plans',
                  'Apply smart cropping to plan thumbnails',
                  'Enable plan metadata caching'
                ].map((option, index) => (
                  <label key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={tbn2_wolfOptions[`plan_${index}`] || false}
                      onChange={(e) => tbn2_handleWolfOptionsChange({ [`plan_${index}`]: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Data Processing</h3>
                {[
                  'Enable batch processing for tebnar2 entries',
                  'Use enhanced filtering algorithms',
                  'Apply advanced sorting mechanisms',
                  'Enable real-time data validation'
                ].map((option, index) => (
                  <label key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={tbn2_wolfOptions[`processing_${index}`] || false}
                      onChange={(e) => tbn2_handleWolfOptionsChange({ [`processing_${index}`]: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Display Options</h3>
                {[
                  'Show extended tooltips on hover',
                  'Enable compact view mode',
                  'Use enhanced color coding',
                  'Display advanced metrics panel'
                ].map((option, index) => (
                  <label key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={tbn2_wolfOptions[`display_${index}`] || false}
                      onChange={(e) => tbn2_handleWolfOptionsChange({ [`display_${index}`]: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setTbn2IsWolfOptionsOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Apply changes and close
                  setTbn2IsWolfOptionsOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pillarshift Coltemp System Modal */}
      {tbn2_isPillarShiftModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Pillarshift Coltemp System - Tebnar2</h2>
              <button
                onClick={() => setTbn2IsPillarShiftModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex">
              {/* Left sidebar with tabs */}
              <div className="w-64 bg-gray-50 border-r p-4">
                <div className="space-y-2">
                  {[
                    'Active Sheaves',
                    'Column Templates', 
                    'Processing Queue',
                    'System Metrics',
                    'Configuration'
                  ].map((tab, index) => (
                    <button
                      key={index}
                      onClick={() => setTbn2PillarShiftActiveTab(tab)}
                      className={`w-full text-left px-3 py-2 rounded ${
                        tbn2_pillarShiftActiveTab === tab 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {/* Main content area */}
              <div className="flex-1 p-6 overflow-auto">
                {tbn2_pillarShiftActiveTab === 'Active Sheaves' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Active Tebnar2 Sheaves</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {tbn2_mockSheafData.map((sheaf, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{sheaf.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${
                              sheaf.status === 'active' ? 'bg-green-100 text-green-800' :
                              sheaf.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sheaf.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{sheaf.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Records:</span> {sheaf.records}
                            </div>
                            <div>
                              <span className="font-medium">Last Updated:</span> {sheaf.lastUpdated}
                            </div>
                          </div>
                          <div className="mt-2 flex space-x-2">
                            <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                              View Details
                            </button>
                            <button className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
                              Configure
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {tbn2_pillarShiftActiveTab === 'Column Templates' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tebnar2 Column Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Standard Image Plan Template</h4>
                        <p className="text-sm text-gray-600 mb-3">Default column configuration for image plan data</p>
                        <div className="text-xs bg-gray-100 p-2 rounded mb-2">
                          Columns: ID, Name, Plan Path, Status, Created Date
                        </div>
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                          Apply Template
                        </button>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Extended Metadata Template</h4>
                        <p className="text-sm text-gray-600 mb-3">Enhanced template with additional metadata fields</p>
                        <div className="text-xs bg-gray-100 p-2 rounded mb-2">
                          Columns: ID, Name, Plan Path, Status, Tags, Modified, Size
                        </div>
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                          Apply Template
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {tbn2_pillarShiftActiveTab === 'Processing Queue' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tebnar2 Processing Queue</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-center text-gray-500">
                        <p>No items currently in processing queue</p>
                        <p className="text-sm mt-2">Queue items will appear here when batch operations are running</p>
                      </div>
                    </div>
                  </div>
                )}
                {tbn2_pillarShiftActiveTab === 'System Metrics' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">System Performance Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">1,247</div>
                        <div className="text-sm text-gray-600">Total Records</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">98.2%</div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">12ms</div>
                        <div className="text-sm text-gray-600">Avg Response</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">5</div>
                        <div className="text-sm text-gray-600">Active Tasks</div>
                      </div>
                    </div>
                  </div>
                )}
                {tbn2_pillarShiftActiveTab === 'Configuration' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Processing Settings</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" defaultChecked />
                            <span className="text-sm">Enable auto-processing</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Debug mode</span>
                          </label>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Performance Tuning</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="text-sm">Batch Size: </label>
                            <input type="number" defaultValue="50" className="w-20 px-2 py-1 border rounded" />
                          </div>
                          <div>
                            <label className="text-sm">Cache Timeout (minutes): </label>
                            <input type="number" defaultValue="15" className="w-20 px-2 py-1 border rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setTbn2IsPillarShiftModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTbn2IsPillarShiftModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}