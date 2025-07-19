/**
 * FavaTani Popup System Types
 * 
 * IMPORTANT: FavaTani ONLY supports the /nwjar1-style modal implementation.
 * 
 * This system does NOT support:
 * - Simple centered modals
 * - Custom backdrop styles  
 * - Alternative modal layouts
 * - Any popup style other than the dual-header, full-screen /nwjar1 design
 * 
 * Do not attempt to create alternative modal implementations.
 */

import { ReactNode } from 'react';
import { FavaTaniFeatureFlags } from '../../config/favaTaniFeatureFlags';

export type FavaTaniTabId = 'tani1' | 'tani2' | 'tani3' | 'tani4' | 'tani5' | 'tani6' | 'tani7';

export interface FavaTaniTab {
  id: FavaTaniTabId;                    // tani1-tani7
  label: string;                        // Display label
  icon?: string;                        // Optional icon
  content?: ReactNode;                  // Tab content
  lazy?: boolean;                       // Lazy load content
  visible?: boolean;                    // Show/hide tab
  disabled?: boolean;                   // Disable tab interaction
}

export interface FavaTaniHeader {
  type: 'url-display' | 'pathname-actions';
  label: string;
  colorScheme?: string;                 // Database color scheme key
  actions?: FavaTaniAction[];           // For pathname-actions type
}

export interface FavaTaniAction {
  id: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface FavaTaniButtonConfig {
  text?: string;                        // Button text (default: "Functions")
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: ReactNode;                     // Custom icon
  hotkey?: string;                      // Keyboard shortcut
  className?: string;                   // Additional CSS classes
  style?: React.CSSProperties;         // Inline styles
}

export interface FavaTaniUrlConfig {
  popupParam?: string;                  // URL param name (default: 'tanipop')
  tabParam?: string;                    // URL param name (default: 'tanitab')
  storageKey?: string;                  // localStorage key prefix
}

export interface FavaTaniModalConfig {
  maxWidth?: string;                    // CSS max-width (default: '95vw')
  maxHeight?: string;                   // CSS max-height (default: '95vh')
  // Note: FavaTani only supports the /nwjar1-style full-screen modal
  // with dual header bars. No other modal styles are supported.
}

export interface FavaTaniContentSlots {
  tani1?: ReactNode;                    // Custom content for ptab1 (will be added to default content)
  tani2?: ReactNode;                    // Custom content for ptab2 (replaces default)
  tani3?: ReactNode;                    // Custom content for ptab3 (replaces default)
  tani4?: ReactNode;                    // Custom content for ptab4 (replaces default)
  tani5?: ReactNode;                    // Custom content for ptab5 (replaces default)
  tani6?: ReactNode;                    // Custom content for ptab6 (replaces default)
  tani7?: ReactNode;                    // Custom content for ptab7 (replaces default)
}

export interface FavaTaniConfig {
  id: string;                           // Unique identifier
  title?: string;                       // Popup title
  tabs: FavaTaniTab[];                  // Tab configuration
  headers?: FavaTaniHeader[];           // Header configuration
  button?: FavaTaniButtonConfig;        // Button customization
  urlConfig?: FavaTaniUrlConfig;        // URL parameter config
  modalConfig?: FavaTaniModalConfig;    // Modal appearance
  colorScheme?: string;                 // Default color scheme key
  flags?: Partial<FavaTaniFeatureFlags>; // Feature overrides
  contentSlots?: FavaTaniContentSlots;  // Per-page custom content
  utg_id?: string | number;             // User/template group ID for pluto settings
}

export interface FavaTaniContentMap {
  [key: string]: ReactNode;            // Map of tab IDs to content
}

export interface FavaTaniState {
  isOpen: boolean;
  activeTab: FavaTaniTabId;
  config: FavaTaniConfig;
  flags: FavaTaniFeatureFlags;
}

export interface FavaTaniContextType {
  state: FavaTaniState;
  actions: {
    openPopup: () => void;
    closePopup: () => void;
    setActiveTab: (tabId: FavaTaniTabId) => void;
    togglePopup: () => void;
    updateConfig: (config: Partial<FavaTaniConfig>) => void;
    updateFlags: (flags: Partial<FavaTaniFeatureFlags>) => void;
    emergencyDisable: () => void;
  };
}

// Default configurations
export const FAVA_TANI_DEFAULT_TABS: FavaTaniTab[] = [
  {
    id: 'tani1',
    label: 'Table Config',
    icon: '⚙️',
    visible: true
  },
  {
    id: 'tani2',
    label: 'Columns',
    icon: '📊',
    visible: true
  },
  {
    id: 'tani3',
    label: 'Query',
    icon: '🔍',
    visible: true
  },
  {
    id: 'tani4',
    label: 'Export/Import',
    icon: '📤',
    visible: true
  },
  {
    id: 'tani5',
    label: 'Advanced',
    icon: '🔧',
    visible: true
  },
  {
    id: 'tani6',
    label: 'Help',
    icon: '❓',
    visible: true
  },
  {
    id: 'tani7',
    label: 'Custom',
    icon: '✨',
    visible: false // Hidden by default
  }
];

export const FAVA_TANI_DEFAULT_CONFIG: Omit<FavaTaniConfig, 'id'> = {
  title: 'Functions',
  tabs: FAVA_TANI_DEFAULT_TABS,
  headers: [
    {
      type: 'url-display',
      label: 'BROWSER URL',
      colorScheme: 'fava_tani_header'
    }
  ],
  button: {
    text: 'tani popup',
    position: 'bottom-right',
    hotkey: 'f'
  },
  urlConfig: {
    popupParam: 'tanipop',
    tabParam: 'tanitab',
    storageKey: 'favaTani'
  },
  modalConfig: {
    maxWidth: '95vw',
    maxHeight: '95vh'
  },
  colorScheme: 'fava_tani_default'
};