// Configuration for PlutoTablefaceKite component
// Edit this file to change the default appearance globally

import { PlutoConfig } from './types';

export const PLUTO_CONFIG: PlutoConfig = {
  defaultText: 'pluto tableface',
  styles: {
    backgroundColor: '#9c27b0',  // Purple
    border: '1px solid black',
    borderRadius: '9px',
    padding: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white'
  }
};

// You can add additional style presets here
export const PLUTO_PRESETS = {
  default: PLUTO_CONFIG.styles,
  
  warning: {
    ...PLUTO_CONFIG.styles,
    backgroundColor: '#ff6f00',
    color: 'white'
  },
  
  error: {
    ...PLUTO_CONFIG.styles,
    backgroundColor: '#d32f2f',
    color: 'white'
  },
  
  info: {
    ...PLUTO_CONFIG.styles,
    backgroundColor: '#0288d1',
    color: 'white'
  },
  
  success: {
    ...PLUTO_CONFIG.styles,
    backgroundColor: '#388e3c',
    color: 'white'
  }
};