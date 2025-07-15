export interface UIIcon {
  icon_id: number;
  icon_name: string;
  display_name: string;
  category?: string;
  usage_contexts: string[];
  created_at: string;
}

export interface IconDisplayProps {
  iconName: string;
  iconColor?: string;
  size?: number;
  className?: string;
}

export interface IconSelectorProps {
  selectedIcon?: string;
  selectedColor?: string;
  onIconChange: (iconName: string) => void;
  onColorChange: (color: string) => void;
  category?: string;
  size?: number;
}

export interface IconPreviewProps {
  iconName?: string;
  iconColor?: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export type IconCategory = 
  | 'shapes'
  | 'arrows'
  | 'symbols'
  | 'navigation'
  | 'actions'
  | 'status';

export interface IconRegistryEntry {
  iconName: string;
  displayName: string;
  category: IconCategory;
  usageContexts: string[];
}