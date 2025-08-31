import { LayoutSystemConfig } from './types';

export const LAYOUT_SYSTEMS: Record<string, LayoutSystemConfig> = {
  system1: {
    id: 'system1',
    name: 'Default System',
    header: 'Header1',
    sidebar: 'Sidebar1',
    permissions: [], // Available to all users
    description: 'Standard navigation system with two-row header layout'
  },
  system2: {
    id: 'system2', 
    name: 'Admin System',
    header: 'Header2',
    sidebar: 'Sidebar2',
    permissions: ['is_admin'],
    description: 'Advanced admin navigation with extended controls and admin-specific features'
  },
  system3: {
    id: 'system3',
    name: 'Advanced Admin System', 
    header: 'Header3',
    sidebar: 'Sidebar3',
    permissions: ['is_admin'],
    description: 'Advanced admin tools and debugging navigation with extended system controls'
  }
};

export const DEFAULT_LAYOUT_SYSTEM = 'system1';

export function getAvailableLayoutSystems(userPermissions: { is_admin?: boolean } = {}): LayoutSystemConfig[] {
  return Object.values(LAYOUT_SYSTEMS).filter(system => {
    if (system.permissions.length === 0) return true;
    
    return system.permissions.every(permission => {
      switch (permission) {
        case 'is_admin':
          return userPermissions.is_admin === true;
        default:
          return false;
      }
    });
  });
}

export function canUserAccessSystem(systemId: string, userPermissions: { is_admin?: boolean } = {}): boolean {
  const system = LAYOUT_SYSTEMS[systemId];
  if (!system) return false;
  
  if (system.permissions.length === 0) return true;
  
  return system.permissions.every(permission => {
    switch (permission) {
      case 'is_admin':
        return userPermissions.is_admin === true;
      default:
        return false;
    }
  });
}