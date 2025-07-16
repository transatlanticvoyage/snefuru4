export interface ColtempData {
  coltemp_id: number;
  coltemp_name: string | null;
  coltemp_category: string | null;
  coltemp_color: string | null;
  coltemp_icon: string | null; // deprecated
  icon_name: string | null;
  icon_color: string | null;
  count_of_columns: number | null;
}

export interface Template {
  id: number;
  name: string;
  category: 'personal' | 'range' | 'adminpublic';
  color: string;
  icon_name: string;
  icon_color: string;
  column_count: number;
}

export interface CTCMasterState {
  templates: { [key: string]: ColtempData[] };
  activeTemplateId: number | null;
  previewTemplateId: number | null;
  shendoCategory: string | null;
  dropdownOpen: { [key: string]: boolean };
  loading: boolean;
}

export interface CTCMasterHandlers {
  selectTemplate: (templateId: number, template: ColtempData) => void;
  previewTemplate: (templateId: number | null) => void;
  showShendoCategory: (category: string) => void;
  openCJ: (category: string) => void;
  toggleDropdown: (category: string) => void;
  handleShendoClick: (category: string) => void;
}

export interface CTCMasterProps {
  utg_id?: string;
  children: (props: {
    state: CTCMasterState;
    handlers: CTCMasterHandlers;
  }) => React.ReactNode;
}

export interface CTCButtonsProps {
  templates: { [key: string]: ColtempData[] };
  activeTemplateId: number | null;
  dropdownOpen: { [key: string]: boolean };
  onTemplateSelect: (templateId: number, template: ColtempData) => void;
  onShendoClick: (category: string) => void;
  onOpenCJ: (category: string) => void;
  onToggleDropdown: (category: string) => void;
  utg_id: string;
}

export interface CTCEnhancedButtonsProps extends CTCButtonsProps {
  onTemplatePreview: (templateId: number | null) => void;
}

export interface CTCShendoProps {
  category: string | null;
  templates: { [key: string]: ColtempData[] };
  activeTemplateId: number | null;
  onTemplateSelect: (templateId: number, template: ColtempData) => void;
  utg_id: string;
}

export interface CTCShendoPreviewProps {
  templateId: number | null;
  template: ColtempData | null;
  utg_id: string;
}

export type CategoryType = 'personal' | 'range' | 'adminpublic';

export const CATEGORIES: CategoryType[] = ['range', 'adminpublic', 'personal'];

export const ALL_COLUMNS_TEMPLATE: ColtempData = {
  coltemp_id: -999,
  coltemp_name: 'all',
  coltemp_category: 'range',
  coltemp_color: '#4CAF50',
  coltemp_icon: null,
  icon_name: 'search',
  icon_color: '#4CAF50',
  count_of_columns: 32
};