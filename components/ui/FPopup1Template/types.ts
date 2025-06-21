import { ReactNode } from 'react';

export type FPopup1TabId = 'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7';

export interface FPopup1ColorConfig {
  bg: string;
  text: string;
}

export interface FPopup1HeaderBarConfig {
  type: 'url-display' | 'pathname-actions';
  label: string;
  colorScheme: string;
  actions?: FPopup1ActionConfig[];
}

export interface FPopup1ActionConfig {
  type: 'checkbox';
  id: string;
  label: string;
  checked: boolean;
  onClick: () => void;
}

export interface FPopup1UrlConfig {
  popupParam: string;
  tabPrefix: string;
  storageKey: string;
}

export interface FPopup1TabConfig {
  id: FPopup1TabId;
  label: string;
  content?: ReactNode;
}

export interface FPopup1Config {
  id: string;
  headers: FPopup1HeaderBarConfig[];
  tabs: FPopup1TabConfig[];
  urlConfig: FPopup1UrlConfig;
  closeButtonConfig?: {
    width?: string;
    height?: string;
    text?: string;
  };
  modalConfig?: {
    maxWidth?: string;
    maxHeight?: string;
  };
}

export interface FPopup1State {
  isOpen: boolean;
  activeTab: FPopup1TabId;
  headerColors: Record<string, FPopup1ColorConfig>;
  currentUrl: string;
}

export interface FPopup1Props {
  config: FPopup1Config;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export interface FPopup1HeaderProps {
  config: FPopup1HeaderBarConfig[];
  colors: Record<string, FPopup1ColorConfig>;
  currentUrl: string;
  onClose: () => void;
  closeButtonConfig?: FPopup1Config['closeButtonConfig'];
}

export interface FPopup1TabsProps {
  tabs: FPopup1TabConfig[];
  activeTab: FPopup1TabId;
  onTabChange: (tab: FPopup1TabId) => void;
}

export interface FPopup1ContentProps {
  tabs: FPopup1TabConfig[];
  activeTab: FPopup1TabId;
  children?: ReactNode;
}

export interface UseFPopup1StateProps {
  config: FPopup1Config;
  supabase?: any;
}

export interface UseFPopup1UrlProps {
  config: FPopup1UrlConfig;
  isOpen: boolean;
  activeTab: FPopup1TabId;
}