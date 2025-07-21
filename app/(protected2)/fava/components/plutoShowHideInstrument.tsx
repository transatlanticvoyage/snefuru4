'use client';

import React from 'react';
import PlutoControlTable from './PlutoControlTable';
import { usePlutoInstrumentControls } from '../hooks/usePlutoSettings';

interface PlutoShowHideInstrumentProps {
  utg_id?: string | number;
}

export default function PlutoShowHideInstrument({ utg_id }: PlutoShowHideInstrumentProps) {
  console.log('🔍 [PlutoShowHideInstrument] Component mounted with utg_id:', utg_id, 'type:', typeof utg_id);

  // Use the enhanced hook that provides both settings and control methods
  const controls = usePlutoInstrumentControls(utg_id);

  return (
    <PlutoControlTable
      settings={controls.settings}
      onToggleChange={controls.handleToggleChange}
      onMasterToggle={controls.handleMasterToggle}
      areAllVisible={controls.areAllVisible}
      areAllHidden={controls.areAllHidden}
    />
  );
}

// Re-export types from the hook for backwards compatibility
export type { PlutoSettings } from '../hooks/usePlutoSettings';
export { DEFAULT_PLUTO_SETTINGS as DEFAULT_SETTINGS } from '../hooks/usePlutoSettings';