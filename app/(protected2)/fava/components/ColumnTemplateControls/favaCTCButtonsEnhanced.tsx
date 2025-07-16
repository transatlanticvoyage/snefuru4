import React, { useState } from 'react';
import IconPreview from '../icons/iconPreview';
import FavaColVisMatTooltip from '../favaColVisMatTooltip';
import Link from 'next/link';
import { CTCEnhancedButtonsProps, ColtempData, CATEGORIES } from './favaCTCTypes';

interface FavaMultiDeckButtonProps {
  coltemp_id: number;
  coltemp_icon: string | null;
  icon_name: string | null;
  icon_color: string | null;
  coltemp_color: string | null;
  coltemp_name: string | null;
  count_of_columns: number | null;
  activeTemplateId: number | null;
  onTemplateSelect: (templateId: number, template: ColtempData) => void;
  onTemplatePreview: (templateId: number | null) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function FavaMultiDeckButton({ 
  coltemp_id, 
  coltemp_icon, 
  icon_name,
  icon_color,
  coltemp_color, 
  coltemp_name, 
  count_of_columns, 
  activeTemplateId, 
  onTemplateSelect,
  onTemplatePreview,
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
    window.open('/denbujar', '_blank');
  };

  const handleAction2Click = () => {
    console.log('Action 2 clicked for coltemp_id:', coltemp_id);
  };

  const handleAction3Click = () => {
    console.log('Action 3 clicked for coltemp_id:', coltemp_id);
    // This is where we'll trigger the preview functionality
    onTemplatePreview(coltemp_id);
  };

  const handleAction3MouseEnter = () => {
    onTemplatePreview(coltemp_id);
  };

  const handleAction3MouseLeave = () => {
    onTemplatePreview(null);
  };

  const handleMainTemplateClick = () => {
    console.log(`Template clicked: ${coltemp_id}`);
    
    const template: ColtempData = {
      coltemp_id,
      coltemp_name,
      coltemp_category: null, // Will be set by parent
      coltemp_color,
      coltemp_icon,
      icon_name,
      icon_color,
      count_of_columns
    };
    
    onTemplateSelect(coltemp_id, template);
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
          onMouseEnter={handleAction3MouseEnter}
          onMouseLeave={handleAction3MouseLeave}
          title="Preview Template"
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

export default function FavaCTCButtonsEnhanced({
  templates,
  activeTemplateId,
  dropdownOpen,
  onTemplateSelect,
  onTemplatePreview,
  onShendoClick,
  onOpenCJ,
  onToggleDropdown,
  utg_id,
  createSlots,
  getOverflowItems
}: CTCEnhancedButtonsProps & { createSlots: any, getOverflowItems: any }) {

  const separatorStyle = {
    borderLeft: '3px solid #ccc',
    height: '100%',
    margin: '0 8px'
  };

  const openCjLinkStyle = {
    color: '#2563eb',
    fontSize: '12px',
    textDecoration: 'underline',
    marginLeft: '8px',
    marginRight: '8px'
  };

  const shendoLinkStyle = {
    color: '#dc2626',
    fontSize: '12px',
    textDecoration: 'underline',
    marginLeft: '8px',
    marginRight: '8px',
    cursor: 'pointer'
  };

  return (
    <div style={{
      marginTop: '20px',
      padding: '16px',
      backgroundColor: '#fff3cd',
      border: '2px solid #ffeaa7',
      borderRadius: '8px'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#856404'
      }}>
        Enhanced Buttons
      </h3>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {CATEGORIES.map((category) => {
          const categoryData = templates[category] || [];
          const slots = createSlots(categoryData, category);
          
          return (
            <div key={`area2-${category}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={separatorStyle}></span>
              
              {category}
              
              <Link 
                href={`/admin/coltempcommand?rel_utg_id=${utg_id}&page=1&coltemp_category=${category}`}
                style={openCjLinkStyle}
                target="_blank"
              >
                open cj
              </Link>
              
              <span
                style={shendoLinkStyle}
                onClick={() => onShendoClick(category)}
              >
                shendo
              </span>

              <div style={{ display: 'flex', gap: '2px' }}>
                {slots.map((slot: ColtempData, index: number) => (
                  <div key={slot.coltemp_id !== -1 ? slot.coltemp_id : `empty-${category}-${index}`}>
                    {slot.coltemp_id !== -1 ? (
                      <FavaMultiDeckButton 
                        coltemp_id={slot.coltemp_id}
                        coltemp_icon={slot.coltemp_icon}
                        icon_name={slot.icon_name}
                        icon_color={slot.icon_color}
                        coltemp_color={slot.coltemp_color}
                        coltemp_name={slot.coltemp_name}
                        count_of_columns={slot.count_of_columns}
                        activeTemplateId={activeTemplateId}
                        onTemplateSelect={onTemplateSelect}
                        onTemplatePreview={onTemplatePreview}
                        isFirst={index === 0}
                        isLast={index === slots.length - 1}
                      />
                    ) : (
                      <div style={{
                        width: '130px',
                        height: '50px',
                        border: '1px solid #ccc',
                        backgroundColor: '#f5f5f5',
                        borderRadius: index === 0 ? '4px 0 0 4px' : 
                                     index === slots.length - 1 ? '0 4px 4px 0' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '10px'
                      }}>
                        empty
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}