'use client';

import React from 'react';

interface PlutoToggleSwitchProps {
  isOn: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function PlutoToggleSwitch({ isOn, onChange, disabled = false }: PlutoToggleSwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!isOn);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: '50px',
        height: '24px',
        backgroundColor: isOn ? '#4CAF50' : '#ccc',
        borderRadius: '12px',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.3s ease',
        display: 'inline-block',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: isOn ? '28px' : '2px',
          transition: 'left 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
}