'use client';

import React, { useState, useEffect } from 'react';

interface ChamberVisibilityState {
  mandible: boolean;
  sinus: boolean;
  cardio: boolean;
  pec: boolean;
  collar: boolean;
  mosier: boolean;
  rocket: boolean;
}

export default function LeadsmartMorphVallanceSystem() {
  const [chamberVisibility, setChamberVisibility] = useState<ChamberVisibilityState>({
    mandible: true,
    sinus: true,
    cardio: false, // Default to hidden
    pec: true,
    collar: true,
    mosier: true,
    rocket: true
  });

  // Initialize from localStorage
  useEffect(() => {
    const savedMandible = localStorage.getItem('leadsmartMorph_mandibleChamberVisible');
    const savedSinus = localStorage.getItem('leadsmartMorph_sinusChamberVisible');
    const savedCardio = localStorage.getItem('leadsmartMorph_cardioChamberVisible');
    const savedPec = localStorage.getItem('leadsmartMorph_pecChamberVisible');
    const savedCollar = localStorage.getItem('leadsmartMorph_collarChamberVisible');
    const savedMosier = localStorage.getItem('leadsmartMorph_mosierChamberVisible');
    const savedRocket = localStorage.getItem('leadsmartMorph_rocketChamberVisible');

    setChamberVisibility({
      mandible: savedMandible !== null ? JSON.parse(savedMandible) : true,
      sinus: savedSinus !== null ? JSON.parse(savedSinus) : true,
      cardio: savedCardio !== null ? JSON.parse(savedCardio) : false,
      pec: savedPec !== null ? JSON.parse(savedPec) : true,
      collar: savedCollar !== null ? JSON.parse(savedCollar) : true,
      mosier: savedMosier !== null ? JSON.parse(savedMosier) : true,
      rocket: savedRocket !== null ? JSON.parse(savedRocket) : true
    });
  }, []);

  // Listen for chamber visibility changes from bezel system
  useEffect(() => {
    const handleChamberToggle = (event: CustomEvent) => {
      const { chamber, visible } = event.detail;
      
      const chamberMap: { [key: string]: keyof ChamberVisibilityState } = {
        'mandible_chamber': 'mandible',
        'sinus_chamber': 'sinus',
        'cardio_chamber': 'cardio',
        'pec_chamber': 'pec',
        'collar_chamber': 'collar',
        'mosier_chamber': 'mosier',
        'rocket_chamber': 'rocket'
      };

      const chamberKey = chamberMap[chamber];
      if (chamberKey) {
        setChamberVisibility(prev => ({ ...prev, [chamberKey]: visible }));
      }
    };

    window.addEventListener('leadsmartMorph-chamber-toggle', handleChamberToggle as EventListener);

    return () => {
      window.removeEventListener('leadsmartMorph-chamber-toggle', handleChamberToggle as EventListener);
    };
  }, []);

  const handleToggle = (chamber: keyof ChamberVisibilityState) => {
    const newVisibility = !chamberVisibility[chamber];
    
    // Update local state
    setChamberVisibility(prev => ({ ...prev, [chamber]: newVisibility }));
    
    // Save to localStorage
    const storageKey = `leadsmartMorph_${chamber}ChamberVisible`;
    localStorage.setItem(storageKey, JSON.stringify(newVisibility));
    
    // Dispatch event to notify the page
    const chamberNameMap = {
      mandible: 'mandible_chamber',
      sinus: 'sinus_chamber',
      cardio: 'cardio_chamber',
      pec: 'pec_chamber',
      collar: 'collar_chamber',
      mosier: 'mosier_chamber',
      rocket: 'rocket_chamber'
    };
    
    window.dispatchEvent(new CustomEvent('leadsmartMorph-chamber-toggle', { 
      detail: { chamber: chamberNameMap[chamber], visible: newVisibility } 
    }));
  };

  const getButtonStyle = (visible: boolean) => ({
    width: '41px',
    height: '41px',
    padding: '2px',
    fontSize: '12px',
    lineHeight: '1.2',
    wordWrap: 'break-word' as const,
    minHeight: 'auto',
    backgroundColor: visible ? '#c5bf7a' : '#9ca3af' // Gold when visible, gray when hidden
  });

  const buttons = [
    { text: 'vallance', title: 'Vallance', top: 85, chamber: null }, // No functionality
    { text: 'mandible', title: 'Toggle Mandible Chamber', top: 127, chamber: 'mandible' as keyof ChamberVisibilityState },
    { text: 'sinus', title: 'Toggle Sinus Chamber', top: 169, chamber: 'sinus' as keyof ChamberVisibilityState },
    { text: 'cardio', title: 'Toggle Cardio Chamber', top: 211, chamber: 'cardio' as keyof ChamberVisibilityState },
    { text: 'pec', title: 'Toggle Pec Chamber', top: 253, chamber: 'pec' as keyof ChamberVisibilityState },
    { text: 'collar', title: 'Toggle Collar Chamber', top: 295, chamber: 'collar' as keyof ChamberVisibilityState },
    { text: 'mosier', title: 'Toggle Mosier Chamber', top: 337, chamber: 'mosier' as keyof ChamberVisibilityState },
    { text: 'rocket', title: 'Toggle Rocket Chamber', top: 379, chamber: 'rocket' as keyof ChamberVisibilityState }
  ];

  return (
    <>
      {buttons.map((button) => (
        <button
          key={button.text}
          className="fixed z-40 rounded-md shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
          style={{ 
            ...(button.chamber ? getButtonStyle(chamberVisibility[button.chamber]) : getButtonStyle(true)),
            top: `${button.top}px`,
            left: '1px'
          }}
          title={button.title}
          onClick={() => button.chamber && handleToggle(button.chamber)}
        >
          <span className="text-gray-800 font-medium">{button.text}</span>
        </button>
      ))}
    </>
  );
}