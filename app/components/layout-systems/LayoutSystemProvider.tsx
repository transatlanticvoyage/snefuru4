'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  LAYOUT_SYSTEMS, 
  DEFAULT_LAYOUT_SYSTEM, 
  getAvailableLayoutSystems, 
  canUserAccessSystem 
} from '@/app/config/layout-configs/layoutSystems';
import { LayoutSystemContextType, LayoutSystemConfig } from '@/app/config/layout-configs/types';
import { HEADER_COMPONENTS } from '@/app/components/headers';
import { SIDEBAR_COMPONENTS } from '@/app/components/sidebars';

const LayoutSystemContext = createContext<LayoutSystemContextType | undefined>(undefined);

export function useLayoutSystem() {
  const context = useContext(LayoutSystemContext);
  if (context === undefined) {
    throw new Error('useLayoutSystem must be used within a LayoutSystemProvider');
  }
  return context;
}

interface LayoutSystemProviderProps {
  children: ReactNode;
}

export function LayoutSystemProvider({ children }: LayoutSystemProviderProps) {
  const { user } = useAuth();
  const [currentSystem, setCurrentSystem] = useState<string>(DEFAULT_LAYOUT_SYSTEM);
  const [availableSystems, setAvailableSystems] = useState<LayoutSystemConfig[]>([]);
  const [userPermissions, setUserPermissions] = useState<{ is_admin?: boolean }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const supabase = createClientComponentClient();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleHeaderVisibilityChange = (visible: boolean) => {
    setHeaderVisible(visible);
  };

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user?.id) {
        setUserPermissions({});
        setAvailableSystems(getAvailableLayoutSystems({}));
        setCurrentSystem(DEFAULT_LAYOUT_SYSTEM);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin, preferred_layout_system')
          .eq('auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user permissions:', error);
          setUserPermissions({});
          setAvailableSystems(getAvailableLayoutSystems({}));
          setCurrentSystem(DEFAULT_LAYOUT_SYSTEM);
          return;
        }

        const permissions = {
          is_admin: data?.is_admin || false
        };

        setUserPermissions(permissions);
        const available = getAvailableLayoutSystems(permissions);
        setAvailableSystems(available);

        // Set preferred system if user has access, otherwise default
        const preferredSystem = data?.preferred_layout_system || DEFAULT_LAYOUT_SYSTEM;
        
        if (canUserAccessSystem(preferredSystem, permissions)) {
          setCurrentSystem(preferredSystem);
        } else {
          setCurrentSystem(DEFAULT_LAYOUT_SYSTEM);
        }
      } catch (err) {
        console.error('Error:', err);
        setUserPermissions({});
        setAvailableSystems(getAvailableLayoutSystems({}));
        setCurrentSystem(DEFAULT_LAYOUT_SYSTEM);
      }
    };

    fetchUserPermissions();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchSystem = async (systemId: string) => {
    if (!canUserAccessSystem(systemId, userPermissions)) {
      console.warn(`User does not have access to layout system: ${systemId}`);
      return;
    }

    setCurrentSystem(systemId);

    // Save preference to database
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ preferred_layout_system: systemId })
          .eq('auth_id', user.id);
        
        if (error) {
          console.error('Error saving layout preference:', error);
        }
      } catch (error) {
        console.error('Error saving layout preference:', error);
      }
    }
  };

  const canAccessSystem = (systemId: string) => {
    return canUserAccessSystem(systemId, userPermissions);
  };

  // Get current header and sidebar components
  const currentConfig = LAYOUT_SYSTEMS[currentSystem];
  const HeaderComponent = HEADER_COMPONENTS[currentConfig?.header as keyof typeof HEADER_COMPONENTS] || HEADER_COMPONENTS.Header1;
  const SidebarComponent = SIDEBAR_COMPONENTS[currentConfig?.sidebar as keyof typeof SIDEBAR_COMPONENTS] || SIDEBAR_COMPONENTS.Sidebar1;

  const contextValue: LayoutSystemContextType = {
    currentSystem,
    availableSystems,
    switchSystem,
    canAccessSystem
  };

  return (
    <LayoutSystemContext.Provider value={contextValue}>
      <div className={`min-h-screen bg-gray-50 snefuru-app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="snefuru-sidebar-wrapper">
          <SidebarComponent isOpen={sidebarOpen} onToggle={toggleSidebar} onHeaderVisibilityChange={handleHeaderVisibilityChange} />
        </div>
        
        <div className="snefuru-content-wrapper">
          {headerVisible && <HeaderComponent />}
          <main className={`pb-6 px-4 ${headerVisible ? 'pt-0' : 'pt-4'}`}>
            {children}
          </main>
        </div>
      </div>
    </LayoutSystemContext.Provider>
  );
}