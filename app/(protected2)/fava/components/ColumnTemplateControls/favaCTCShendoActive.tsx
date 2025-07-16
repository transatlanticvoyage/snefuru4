import { useState, useEffect } from 'react';
import IconPreview from '../icons/iconPreview';
import { CTCShendoProps, ColtempData } from './favaCTCTypes';
import { CTCEventListener } from './favaCTCEvents';

export default function FavaCTCShendoActive({
  category,
  templates,
  activeTemplateId,
  onTemplateSelect,
  utg_id
}: CTCShendoProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<ColtempData[]>([]);
  const [localActiveTemplateId, setLocalActiveTemplateId] = useState<number | null>(activeTemplateId);

  useEffect(() => {
    // Listen for shendo events
    const unsubscribe = CTCEventListener.onShendoShowCategory(({ category, utg_id: eventUtgId }) => {
      if (eventUtgId === utg_id) {
        setSelectedCategory(category);
        setCategoryData(templates[category] || []);
      }
    });

    return unsubscribe;
  }, [templates, utg_id]);

  useEffect(() => {
    setLocalActiveTemplateId(activeTemplateId);
  }, [activeTemplateId]);

  // Button styles (same as column template controls)
  const shendoBarDivStyle = {
    border: '1px solid #000',
    padding: '16px',
    marginBottom: '16px',
    minHeight: '100px'
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '12px'
  };

  const buttonGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0'
  };

  const coltempButtonStyle = {
    backgroundColor: '#ebebeb',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '0',
    padding: '0px 10px',
    border: '1px solid #595959',
    borderRight: '3px solid #595959',
    cursor: 'pointer',
    fontSize: '14px',
    margin: '0'
  };

  const coltempButtonFirstStyle = {
    ...coltempButtonStyle,
    borderRadius: '4px 0 0 4px'
  };

  const coltempButtonLastStyle = {
    ...coltempButtonStyle,
    borderRight: '1px solid #595959',
    borderRadius: '0 4px 4px 0'
  };

  const handleTemplateClick = (template: ColtempData) => {
    setLocalActiveTemplateId(template.coltemp_id);
    onTemplateSelect(template.coltemp_id, template);
  };

  const getButtonStyle = (index: number, totalLength: number) => {
    if (totalLength === 1) return coltempButtonStyle;
    if (index === 0) return coltempButtonFirstStyle;
    if (index === totalLength - 1) return coltempButtonLastStyle;
    return coltempButtonStyle;
  };

  return (
    <div className="shendo_bar_div" style={shendoBarDivStyle}>
      <div style={titleStyle}>shendo_bar_div</div>
      
      {selectedCategory && categoryData.length > 0 ? (
        <div>
          <p style={{ marginBottom: '12px', fontSize: '14px' }}>
            Showing all templates for category: <strong>{selectedCategory}</strong> ({categoryData.length} templates)
          </p>
          
          <div style={buttonGroupStyle}>
            {categoryData.map((template, index) => (
              <button
                key={template.coltemp_id}
                style={{
                  ...getButtonStyle(index, categoryData.length),
                  backgroundColor: template.coltemp_id === localActiveTemplateId ? '#86a5e9' : '#ebebeb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (template.coltemp_id !== localActiveTemplateId) {
                    e.currentTarget.style.backgroundColor = '#f1e9b6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = template.coltemp_id === localActiveTemplateId ? '#86a5e9' : '#ebebeb';
                }}
                onClick={() => handleTemplateClick(template)}
              >
                {template.coltemp_color && (
                  <div 
                    className="coltemp_button_colorbox1"
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: template.coltemp_color,
                      display: 'inline-block'
                    }}
                  />
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {template.count_of_columns || ''} | 
                  {template.icon_name ? (
                    <IconPreview 
                      iconName={template.icon_name} 
                      iconColor={template.icon_color || '#666666'} 
                      size={10} 
                    />
                  ) : template.coltemp_icon} | 
                  {template.coltemp_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ color: '#666', fontSize: '14px' }}>
          Click a "shendo" link above to view all templates for that category
        </p>
      )}
    </div>
  );
}