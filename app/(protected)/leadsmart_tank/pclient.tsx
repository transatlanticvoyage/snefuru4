'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import LeadsmartTankTable from './components/LeadsmartTankTable';
import CreateNewPopup from './components/CreateNewPopup';
import InsertDataPopup from './components/InsertDataPopup';
import FrostySelectorPopup from './components/FrostySelectorPopup';
import LeadSmartJettisonTable from '@/app/components/leadsmart/LeadSmartJettisonTable';
import LeadSmartSkylabTileTables from '@/app/components/leadsmart/LeadSmartSkylabTileTables';
import dynamic from 'next/dynamic';

const ZhedoriButtonBar = dynamic(
  () => import('@/app/components/ZhedoriButtonBar'),
  { ssr: false }
);

export default function LeadsmartTankClient() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Chamber visibility states
  const [mandibleChamberVisible, setMandibleChamberVisible] = useState(true);
  const [sinusChamberVisible, setSinusChamberVisible] = useState(true);
  const [cardioChamberVisible, setCardioChamberVisible] = useState(true);
  const [pecChamberVisible, setPecChamberVisible] = useState(true);

  // Popup state
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [isInsertDataPopupOpen, setIsInsertDataPopupOpen] = useState(false);
  const [isSelectorPopupOpen, setIsSelectorPopupOpen] = useState(false);
  
  // Filter state for jettison table
  const [jettisonFilter, setJettisonFilter] = useState<{
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  }>({ type: null, id: null });
  
  // Filter state for skylab tile tables
  const [skylabFilter, setSkylabFilter] = useState<{
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  }>({ type: null, id: null });
  
  // Pico cache rebuild state
  const [rebuildCacheFn, setRebuildCacheFn] = useState<(() => void) | null>(null);
  const [cacheRebuilding, setCacheRebuilding] = useState(false);
  const [cacheRebuildProgress, setCacheRebuildProgress] = useState(0);
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Initialize chamber visibility from localStorage
  useEffect(() => {
    const savedMandible = localStorage.getItem('leadsmart_tank_mandibleChamberVisible');
    if (savedMandible !== null) {
      setMandibleChamberVisible(JSON.parse(savedMandible));
    }
    
    const savedSinus = localStorage.getItem('leadsmart_tank_sinusChamberVisible');
    if (savedSinus !== null) {
      setSinusChamberVisible(JSON.parse(savedSinus));
    }
    
    const savedCardio = localStorage.getItem('leadsmart_tank_cardioChamberVisible');
    if (savedCardio !== null) {
      setCardioChamberVisible(JSON.parse(savedCardio));
    }
    
    const savedPec = localStorage.getItem('leadsmart_tank_pecChamberVisible');
    if (savedPec !== null) {
      setPecChamberVisible(JSON.parse(savedPec));
    }
  }, []);

  // Listen for bezel system visibility changes
  useEffect(() => {
    const handleMandibleChange = (event: CustomEvent) => {
      setMandibleChamberVisible(event.detail.visible);
    };
    
    const handleSinusChange = (event: CustomEvent) => {
      setSinusChamberVisible(event.detail.visible);
    };
    
    const handleCardioChange = (event: CustomEvent) => {
      setCardioChamberVisible(event.detail.visible);
    };
    
    const handlePecChange = (event: CustomEvent) => {
      setPecChamberVisible(event.detail.visible);
    };

    window.addEventListener('leadsmartTankMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
    window.addEventListener('leadsmartTankSinusChamberVisibilityChange', handleSinusChange as EventListener);
    window.addEventListener('leadsmartTankCardioChamberVisibilityChange', handleCardioChange as EventListener);
    window.addEventListener('leadsmartTankPecChamberVisibilityChange', handlePecChange as EventListener);
    
    return () => {
      window.removeEventListener('leadsmartTankMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
      window.removeEventListener('leadsmartTankSinusChamberVisibilityChange', handleSinusChange as EventListener);
      window.removeEventListener('leadsmartTankCardioChamberVisibilityChange', handleCardioChange as EventListener);
      window.removeEventListener('leadsmartTankPecChamberVisibilityChange', handlePecChange as EventListener);
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleCreateInline = () => {
    // Trigger inline creation in table component
    window.dispatchEvent(new CustomEvent('leadsmart-create-inline'));
  };
  
  const handleJettisonFilterChange = (filterType: 'release' | 'subsheet' | 'subpart' | null, filterId: number | null) => {
    setJettisonFilter({ type: filterType, id: filterId });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mandible Chamber */}
      {mandibleChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mandible_chamber
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <ZhedoriButtonBar />
          </div>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">Leadsmart Tank</h1>
            <button
              onClick={() => setIsInsertDataPopupOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              insert new data
            </button>
            <button
              onClick={() => setIsSelectorPopupOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              selector popup
            </button>
          </div>
        </div>
      )}

      {/* Sinus Chamber */}
      {sinusChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            sinus_chamber
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateInline}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              create new (inline)
            </button>
            
            <button
              onClick={() => setIsCreatePopupOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              create new (popup)
            </button>
          </div>
        </div>
      )}

      {/* Cardio Chamber */}
      {cardioChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            cardio_chamber
          </div>
          
          <LeadSmartJettisonTable 
            config={{
              targetTable: 'leadsmart_zip_based_data',
              relColumnPrefix: 'rel_'
            }}
            onFilterChange={handleJettisonFilterChange}
          />
        </div>
      )}

      {/* Pec Chamber */}
      {pecChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="flex items-center gap-3 font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            <span>pec_chamber skylab_system</span>
            <button
              onClick={() => rebuildCacheFn?.()}
              disabled={!rebuildCacheFn || cacheRebuilding}
              className={`px-3 py-1 text-sm rounded transition-colors font-medium ${
                !rebuildCacheFn || cacheRebuilding
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              title="Rebuild count cache for Skylab tiles"
            >
              {cacheRebuilding ? '🔄 Rebuilding...' : '🔄 Re-create Pico Count Cache Now'}
            </button>
            {cacheRebuilding && (
              <div className="flex-1 max-w-md">
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden border border-gray-300">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${cacheRebuildProgress}%` }}
                  >
                    {cacheRebuildProgress}%
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Skylab Tile Tables */}
          <LeadSmartSkylabTileTables
            pageType="tank"
            onFilterApply={(type, id) => setSkylabFilter({ type, id })}
            currentFilter={skylabFilter}
            onRegisterRebuild={(fn) => setRebuildCacheFn(() => fn)}
            onRebuildStatusChange={(rebuilding, progress) => {
              setCacheRebuilding(rebuilding);
              setCacheRebuildProgress(progress);
            }}
          />
        </div>
      )}

      {/* Table Component */}
      <LeadsmartTankTable 
        refreshTrigger={refreshTrigger}
        jettisonFilter={jettisonFilter}
        skylabFilter={skylabFilter}
      />
      
      {/* Create New Popup */}
      {isCreatePopupOpen && (
        <CreateNewPopup
          isOpen={isCreatePopupOpen}
          onClose={() => setIsCreatePopupOpen(false)}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
            setIsCreatePopupOpen(false);
          }}
        />
      )}
      
      {/* Insert Data Popup */}
      {isInsertDataPopupOpen && (
        <InsertDataPopup
          isOpen={isInsertDataPopupOpen}
          onClose={() => setIsInsertDataPopupOpen(false)}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
            setIsInsertDataPopupOpen(false);
          }}
        />
      )}
      
      {/* Selector Popup */}
      {isSelectorPopupOpen && (
        <FrostySelectorPopup
          isOpen={isSelectorPopupOpen}
          onClose={() => setIsSelectorPopupOpen(false)}
          pageType="tank"
        />
      )}
    </div>
  );
}
