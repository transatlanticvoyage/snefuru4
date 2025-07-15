import React from 'react';
import { FavaTaniConfig } from '../../fava/components/favaTaniPopup/types';
import Torna3Ptab1Content from './ptab1Content';
import Torna3Ptab2Content from './ptab2Content';
import Torna3Ptab3Content from './ptab3Content';
import Torna3Ptab4Content from './ptab4Content';
import Torna3Ptab5Content from './ptab5Content';
import Torna3Ptab6Content from './ptab6Content';
import Torna3Ptab7Content from './ptab7Content';

export const createTorna3TaniConfig = (
  nemtorData: any[],
  visibleColumns: any[],
  totalColumns: number
): Partial<FavaTaniConfig> => ({
  id: 'torna3-nemtor-functions',
  title: 'Nemtor Functions',
  button: {
    text: 'tani popup',
    position: 'bottom-right',
    hotkey: 'f'
  },
  headers: [
    {
      type: 'url-display',
      label: 'BROWSER URL',
      colorScheme: 'uelbar37'
    },
    {
      type: 'pathname-actions', 
      label: 'uelbar38',
      colorScheme: 'uelbar38',
      actions: [
        {
          id: 'kz101',
          label: 'SOPTION1 - Use Your Current Selection From Table | 0 rows',
          checked: false,
          onChange: () => {}
        },
        {
          id: 'kz103', 
          label: `SOPTION2 - Select All Items In Current Pagination | ${nemtorData.length} rows`,
          checked: false,
          onChange: () => {}
        }
      ]
    }
  ],
  tabs: [
    { id: 'tani1', label: 'ptab1', visible: true },
    { id: 'tani2', label: 'ptab2', visible: true },
    { id: 'tani3', label: 'ptab3', visible: true },
    { id: 'tani4', label: 'ptab4', visible: true },
    { id: 'tani5', label: 'ptab5', visible: true },
    { id: 'tani6', label: 'ptab6', visible: true },
    { id: 'tani7', label: 'ptab7', visible: true }
  ],
  contentSlots: {
    tani1: React.createElement(Torna3Ptab1Content, { 
      nemtorData, 
      visibleColumns, 
      totalColumns 
    }),
    tani2: React.createElement(Torna3Ptab2Content, { 
      visibleColumns, 
      totalColumns 
    }),
    tani3: React.createElement(Torna3Ptab3Content, { 
      nemtorData, 
      visibleColumns 
    }),
    tani4: React.createElement(Torna3Ptab4Content, { 
      nemtorData 
    }),
    tani5: React.createElement(Torna3Ptab5Content),
    tani6: React.createElement(Torna3Ptab6Content),
    tani7: React.createElement(Torna3Ptab7Content, { 
      nemtorData 
    })
  }
});