'use client';

import React, { useState } from 'react';
import IconPreview from './icons/iconPreview';
import FavaColVisMatTooltip from './favaColVisMatTooltip';

export interface FavaMultiDeckButtonProps {
  coltemp_id: number;
  coltemp_icon: string | null; // deprecated
  icon_name: string | null;
  icon_color: string | null;
  coltemp_color: string | null;
  coltemp_name: string | null;
  count_of_columns: number | null;
  activeTemplateId: number | null;
  setActiveTemplateId: (id: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function FavaMultiDeckButton({ 
  coltemp_id, 
  coltemp_icon, 
  icon_name,
  icon_color,
  coltemp_color, 
  coltemp_name, 
  count_of_columns, 
  activeTemplateId, 
  setActiveTemplateId, 
  isFirst = false, 
  isLast = false 
}: FavaMultiDeckButtonProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const containerStyle = {
    width: '160px',
    height: '50px',
    border: '1px solid #595959',
    borderRight: '3px solid #595959',
    borderRadius: isFirst ? '4px 0 0 4px' : isLast ? '0 4px 4px 0' : '0',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden'
  };

  const deckLevel1Style = {
    height: '25px',
    display: 'flex',
    backgroundColor: '#e8e8e8',
    borderBottom: '1px solid #aaa'
  };

  const deckLevel2Style = {
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 4px',
    backgroundColor: coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb',
    cursor: 'pointer',
    gap: '4px'
  };

  const actionAreaStyle = {
    width: '26px',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRight: '1px solid #aaa'
  };

  const handleDenbujarClick = () => {
    // Open denbujar page in new tab
    window.open('/denbujar', '_blank');
  };

  const handleAction2Click = () => {
    console.log('Action 2 clicked for coltemp_id:', coltemp_id);
    // Add your action 2 logic here
  };

  const handleAction3Click = () => {
    console.log('Action 3 clicked for coltemp_id:', coltemp_id);
    // Add your action 3 logic here
  };

  const handleMainTemplateClick = () => {
    console.log(`Template clicked: ${coltemp_id}`);
    
    if (coltemp_id === -999) {
      setActiveTemplateId(-999);
      const event = new CustomEvent('fava-template-show-all', {
        detail: { action: 'show_all' }
      });
      window.dispatchEvent(event);
      
      const url = new URL(window.location.href);
      url.searchParams.delete('coltemp_id');
      window.history.pushState({}, '', url);
    } else {
      setActiveTemplateId(coltemp_id);
      const event = new CustomEvent('fava-template-selected', {
        detail: { coltemp_id, coltemp_name }
      });
      window.dispatchEvent(event);
      
      const url = new URL(window.location.href);
      url.searchParams.set('coltemp_id', coltemp_id.toString());
      window.history.pushState({}, '', url);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Deck Level 1 - Action Areas */}
      <div style={deckLevel1Style}>
        <div 
          style={{...actionAreaStyle, backgroundColor: '#d4d4d4'}}
          onClick={handleDenbujarClick}
          title="Open Denbujar"
        >
          DB
        </div>
        <div 
          style={{...actionAreaStyle, backgroundColor: '#c4c4c4', position: 'relative'}}
          onClick={handleAction2Click}
          onMouseEnter={() => setIsTooltipVisible(true)}
          onMouseLeave={() => setIsTooltipVisible(false)}
          title="View column visibility matrix"
        >
          A2
          <FavaColVisMatTooltip
            coltempId={coltemp_id}
            isVisible={isTooltipVisible}
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
          />
        </div>
        <div 
          style={{...actionAreaStyle, backgroundColor: '#b4b4b4', borderRight: 'none'}}
          onClick={handleAction3Click}
          title="Action 3"
        >
          A3
        </div>
      </div>

      {/* Deck Level 2 - Main Template Selection */}
      <div 
        style={deckLevel2Style}
        onClick={handleMainTemplateClick}
        onMouseEnter={(e) => {
          if (coltemp_id !== activeTemplateId) {
            e.currentTarget.style.backgroundColor = '#f1e9b6';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb';
        }}
        title={`Template: ${coltemp_name}`}
      >
        {coltemp_color && (
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: coltemp_color,
            borderRadius: '1px',
            flexShrink: 0
          }} />
        )}
        <span style={{
          fontSize: '16px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          <span>{count_of_columns}</span>
          <span>|</span>
          {icon_name ? (
            <IconPreview 
              iconName={icon_name} 
              iconColor={icon_color || '#666666'} 
              size={10} 
            />
          ) : (
            <span>{coltemp_icon || ''}</span>
          )}
          <span>|</span>
          <span>{coltemp_name}</span>
        </span>
      </div>
    </div>
  );
}