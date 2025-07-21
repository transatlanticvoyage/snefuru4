import React from 'react';
import IconPreview from '../icons/iconPreview';
import { ColtempData } from './favaCTCTypes';

interface FavaCTCShendoEnhancedProps {
  category: string | null;
  categoryData: ColtempData[];
  activeTemplateId: number | null;
  onTemplateSelect: (templateId: number, template: ColtempData) => void;
}

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
  isFirst = false, 
  isLast = false
}: FavaMultiDeckButtonProps) {
  
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

  const handleMainTemplateClick = () => {
    const template: ColtempData = {
      coltemp_id,
      coltemp_name,
      coltemp_category: null,
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
          style={{...actionAreaStyle, backgroundColor: '#c4c4c4'}}
          title="Action 2"
        >
          A2
        </div>
        <div 
          style={{...actionAreaStyle, backgroundColor: '#b4b4b4', borderRight: 'none'}}
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

export default function FavaCTCShendoEnhanced({
  category,
  categoryData,
  activeTemplateId,
  onTemplateSelect
}: FavaCTCShendoEnhancedProps) {
  
  const shendoBarDivStyle = {
    border: '1px solid #000',
    padding: '16px',
    marginBottom: '16px',
    minHeight: '100px',
    backgroundColor: '#fff3cd'
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '12px',
    color: '#856404'
  };

  return (
    <div className="shendo_bar_div_enhanced" style={shendoBarDivStyle}>
      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="chamber-label-box chamber-4" style={{ marginRight: '8px' }}>
          Shendo Enhanced
        </div>
        <div style={{ marginRight: '8px', fontSize: '14px' }}>
          category: {category || '(none)'}
        </div>
        {category && categoryData.length > 0 && categoryData.map((template, index) => (
              <FavaMultiDeckButton
                key={template.coltemp_id}
                coltemp_id={template.coltemp_id}
                coltemp_icon={template.coltemp_icon}
                icon_name={template.icon_name}
                icon_color={template.icon_color}
                coltemp_color={template.coltemp_color}
                coltemp_name={template.coltemp_name}
                count_of_columns={template.count_of_columns}
                activeTemplateId={activeTemplateId}
                onTemplateSelect={onTemplateSelect}
                isFirst={index === 0}
                isLast={index === categoryData.length - 1}
              />
        ))}
      </div>
    </div>
  );
}