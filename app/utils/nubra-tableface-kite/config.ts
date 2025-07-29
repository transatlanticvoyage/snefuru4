// Configuration for NubraTablefaceKite component
// Edit this file to change the default appearance globally

import { NubraConfig } from './types';

export const NUBRA_CONFIG: NubraConfig = {
  defaultText: 'nubra tableface',
  styles: {
    backgroundColor: '#83e09d',
    border: '1px solid black',
    borderRadius: '9px',
    padding: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'black'
  }
};

// You can add additional style presets here
export const NUBRA_PRESETS = {
  default: NUBRA_CONFIG.styles,
  
  warning: {
    ...NUBRA_CONFIG.styles,
    backgroundColor: '#ffc107',
    color: 'black'
  },
  
  error: {
    ...NUBRA_CONFIG.styles,
    backgroundColor: '#dc3545',
    color: 'white'
  },
  
  info: {
    ...NUBRA_CONFIG.styles,
    backgroundColor: '#17a2b8',
    color: 'white'
  },
  
  success: {
    ...NUBRA_CONFIG.styles,
    backgroundColor: '#28a745',
    color: 'white'
  }
};