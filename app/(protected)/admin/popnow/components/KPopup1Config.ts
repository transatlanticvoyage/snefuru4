// KPopup1 Configuration Types and Defaults

export interface KPopup1Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
}

export interface KPopup1Colors {
  uelbar37: {
    bg: string;
    text: string;
  };
  uelbar38: {
    bg: string;
    text: string;
  };
}

export interface KPopup1Config {
  // Popup behavior
  urlParam: string; // Default: 'kpop'
  tabPrefix: string; // Default: 'kptab'
  storageKey: string; // Default: 'kpopup1_lastActiveTab'
  
  // Visual customization
  colors?: Partial<KPopup1Colors>;
  tabs: KPopup1Tab[];
  
  // Header options
  showBrowserUrl: boolean;
  showPathname: boolean;
  showCheckboxes: boolean;
  checkbox1Label?: string;
  checkbox2Label?: string;
  
  // Copy buttons
  showCopyButtons: boolean;
  highlightSitebase: boolean;
  
  // Close button
  closeButtonText?: string;
  
  // Size constraints
  maxWidth?: string;
  maxHeight?: string;
}

export const defaultKPopup1Config: Partial<KPopup1Config> = {
  urlParam: 'kpop',
  tabPrefix: 'kptab',
  storageKey: 'kpopup1_lastActiveTab',
  showBrowserUrl: true,
  showPathname: true,
  showCheckboxes: true,
  showCopyButtons: true,
  highlightSitebase: true,
  maxWidth: '95vw',
  maxHeight: '95vh',
  tabs: [
    { id: 'kptab1', label: 'kptab1' },
    { id: 'kptab2', label: 'kptab2' },
    { id: 'kptab3', label: 'kptab3' },
    { id: 'kptab4', label: 'kptab4' },
    { id: 'kptab5', label: 'kptab5' },
    { id: 'kptab6', label: 'kptab6' },
    { id: 'kptab7', label: 'kptab7' },
  ]
};