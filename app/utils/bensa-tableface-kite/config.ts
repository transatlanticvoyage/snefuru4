// Configuration for BensaTablefaceKite component
// Edit this file to change the default appearance globally

import { BensaConfig } from './types';

export const BENSA_CONFIG: BensaConfig = {
  defaultText: 'bensa tableface',
  styles: {
    backgroundColor: '#ffeb3b',  // Yellow
    border: '1px solid black',
    borderRadius: '9px',
    padding: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'black'
  }
};

// You can add additional style presets here
export const BENSA_PRESETS = {
  default: BENSA_CONFIG.styles,
  
  warning: {
    ...BENSA_CONFIG.styles,
    backgroundColor: '#ff9800',
    color: 'white'
  },
  
  error: {
    ...BENSA_CONFIG.styles,
    backgroundColor: '#f44336',
    color: 'white'
  },
  
  info: {
    ...BENSA_CONFIG.styles,
    backgroundColor: '#2196f3',
    color: 'white'
  },
  
  success: {
    ...BENSA_CONFIG.styles,
    backgroundColor: '#4caf50',
    color: 'white'
  }
};