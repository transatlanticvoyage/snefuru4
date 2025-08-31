// Layout system types and interfaces

export interface LayoutSystemConfig {
  id: string;
  name: string;
  header: string;
  sidebar: string;
  permissions: string[];
  environment?: 'development' | 'production' | 'all';
  description: string;
}

export interface UserPermissions {
  is_admin?: boolean;
  [key: string]: boolean | undefined;
}

export interface LayoutSystemContextType {
  currentSystem: string;
  availableSystems: LayoutSystemConfig[];
  switchSystem: (systemId: string) => void;
  canAccessSystem: (systemId: string) => boolean;
}

export type HeaderComponent = React.ComponentType;
export type SidebarComponent = React.ComponentType<{
  isOpen: boolean;
  onToggle: () => void;
  showToggleButton?: boolean;
}>;