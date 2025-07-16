import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { usePathname } from 'next/navigation';
import { 
  ColtempData, 
  CTCMasterState, 
  CTCMasterHandlers, 
  CTCMasterProps, 
  ALL_COLUMNS_TEMPLATE,
  CATEGORIES 
} from './favaCTCTypes';
import { CTCEventEmitter } from './favaCTCEvents';

export default function FavaCTCMaster({ utg_id, children }: CTCMasterProps) {
  const [templates, setTemplates] = useState<{[key: string]: ColtempData[]}>({});
  const [dropdownOpen, setDropdownOpen] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [shendoCategory, setShendoCategory] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  const pathname = usePathname();
  
  // Mapping from page paths to UTG IDs
  const getUtgIdForPath = (path: string): string => {
    const pathToUtgMap: Record<string, string> = {
      '/torna3': 'utg_torna3',
      '/torna2': 'utg_torna2',
      // Add more mappings as needed
    };
    return pathToUtgMap[path] || 'utg_default';
  };

  const currentUtgId = utg_id || getUtgIdForPath(pathname || '');

  useEffect(() => {
    fetchColtempData();
    
    // Check URL for selected template on mount
    const url = new URL(window.location.href);
    const coltempId = url.searchParams.get('coltemp_id');
    if (coltempId) {
      setActiveTemplateId(parseInt(coltempId));
      // Emit event for initial template load
      CTCEventEmitter.emitTemplateLoaded(parseInt(coltempId), currentUtgId);
    } else {
      setActiveTemplateId(-999); // Set hardcoded "all" as active by default
    }
  }, []);

  const fetchColtempData = async () => {
    try {
      const { data, error } = await supabase
        .from('coltemps')
        .select('coltemp_id, coltemp_name, coltemp_category, coltemp_color, coltemp_icon, icon_name, icon_color, count_of_columns')
        .order('coltemp_id', { ascending: true });

      if (error) throw error;

      // Group data by category
      const groupedData: {[key: string]: ColtempData[]} = {
        range: [],
        adminpublic: [],
        personal: []
      };

      data?.forEach(item => {
        const category = item.coltemp_category?.toLowerCase() || 'range';
        if (groupedData[category]) {
          groupedData[category].push(item);
        }
      });

      setTemplates(groupedData);
    } catch (error) {
      console.error('Error fetching coltemp data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create 3 slots per category with empty slot handling
  const createSlots = (categoryData: ColtempData[], category: string) => {
    const slots = [];
    
    // Special handling for range category - hardcode "all" as first slot
    if (category === 'range') {
      // First slot: hardcoded "all" button
      slots.push(ALL_COLUMNS_TEMPLATE);
      
      // Fill remaining 2 slots with database data
      for (let i = 0; i < 2; i++) {
        if (categoryData[i]) {
          slots.push(categoryData[i]);
        } else {
          // Empty slot
          slots.push({
            coltemp_id: -1,
            coltemp_name: null,
            coltemp_category: null,
            coltemp_color: null,
            coltemp_icon: null,
            icon_name: null,
            icon_color: null,
            count_of_columns: null
          });
        }
      }
    } else {
      // Regular handling for other categories
      for (let i = 0; i < 3; i++) {
        if (categoryData[i]) {
          slots.push(categoryData[i]);
        } else {
          // Empty slot
          slots.push({
            coltemp_id: -1,
            coltemp_name: null,
            coltemp_category: null,
            coltemp_color: null,
            coltemp_icon: null,
            icon_name: null,
            icon_color: null,
            count_of_columns: null
          });
        }
      }
    }
    
    return slots;
  };

  // Get overflow items (4th item onwards)
  const getOverflowItems = (categoryData: ColtempData[], category: string) => {
    // For range category, overflow starts from 3rd item (since first slot is hardcoded)
    if (category === 'range') {
      return categoryData.slice(2);
    }
    return categoryData.slice(3);
  };

  // Handler functions
  const selectTemplate = (templateId: number, template: ColtempData) => {
    setActiveTemplateId(templateId);
    
    // Update URL with the selected template
    const url = new URL(window.location.href);
    if (templateId === -999) {
      url.searchParams.delete('coltemp_id');
    } else {
      url.searchParams.set('coltemp_id', templateId.toString());
    }
    window.history.replaceState({}, '', url.toString());
    
    // Emit event for template selection
    CTCEventEmitter.emitTemplateSelected(templateId, template, currentUtgId);
  };

  const previewTemplate = (templateId: number | null) => {
    setPreviewTemplateId(templateId);
    
    if (templateId === null) {
      CTCEventEmitter.emitTemplatePreviewClear(currentUtgId);
    } else {
      // Find the template data
      let template: ColtempData | null = null;
      if (templateId === -999) {
        template = ALL_COLUMNS_TEMPLATE;
      } else {
        // Search through all categories for the template
        for (const category of CATEGORIES) {
          const found = templates[category]?.find(t => t.coltemp_id === templateId);
          if (found) {
            template = found;
            break;
          }
        }
      }
      
      CTCEventEmitter.emitTemplatePreview(templateId, template, currentUtgId);
    }
  };

  const showShendoCategory = (category: string) => {
    setShendoCategory(category);
    CTCEventEmitter.emitShendoShowCategory(category, currentUtgId);
  };

  const openCJ = (category: string) => {
    const url = `/admin/coltempcommand?rel_utg_id=${currentUtgId}&page=1&coltemp_category=${category}`;
    window.open(url, '_blank');
  };

  const toggleDropdown = (category: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleShendoClick = (category: string) => {
    showShendoCategory(category);
  };

  const state: CTCMasterState = {
    templates,
    activeTemplateId,
    previewTemplateId,
    shendoCategory,
    dropdownOpen,
    loading
  };

  const handlers: CTCMasterHandlers = {
    selectTemplate,
    previewTemplate,
    showShendoCategory,
    openCJ,
    toggleDropdown,
    handleShendoClick,
    createSlots,
    getOverflowItems,
    currentUtgId
  };

  return (
    <>
      {children({ state, handlers })}
    </>
  );
}