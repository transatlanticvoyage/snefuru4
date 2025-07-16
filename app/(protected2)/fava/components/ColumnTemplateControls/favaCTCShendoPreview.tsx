import { useState, useEffect } from 'react';
import IconPreview from '../icons/iconPreview';
import { CTCShendoPreviewProps, ColtempData } from './favaCTCTypes';
import { CTCEventListener } from './favaCTCEvents';

export default function FavaCTCShendoPreview({
  templateId,
  template,
  utg_id
}: CTCShendoPreviewProps) {
  const [previewTemplate, setPreviewTemplate] = useState<ColtempData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for template preview events
    const unsubscribe = CTCEventListener.onTemplatePreview(({ templateId, template, utg_id: eventUtgId }) => {
      if (eventUtgId === utg_id) {
        setPreviewTemplate(template);
        setIsVisible(template !== null);
      }
    });

    return unsubscribe;
  }, [utg_id]);

  // If not visible or no template, don't render
  if (!isVisible || !previewTemplate) {
    return null;
  }

  // Button styles (same as shendo active but with preview styling)
  const shendoBarDivStyle = {
    border: '2px solid #007bff', // Blue border to distinguish from active
    padding: '16px',
    marginBottom: '8px', // Less margin since it's above active
    minHeight: '80px',
    backgroundColor: '#f8f9fa', // Light blue background
    borderRadius: '4px',
    opacity: 0.95
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '12px',
    color: '#007bff'
  };

  const buttonGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0'
  };

  const coltempButtonStyle = {
    backgroundColor: '#e3f2fd', // Light blue for preview
    fontFamily: 'Arial, sans-serif',
    borderRadius: '4px',
    padding: '0px 10px',
    border: '2px solid #007bff',
    cursor: 'default', // Not clickable in preview
    fontSize: '14px',
    margin: '0'
  };

  return (
    <div className="shendo_preview_bar_div" style={shendoBarDivStyle}>
      <div style={titleStyle}>Template Preview</div>
      
      <div>
        <p style={{ marginBottom: '12px', fontSize: '14px', color: '#007bff' }}>
          Previewing template: <strong>{previewTemplate.coltemp_name}</strong>
        </p>
        
        <div style={buttonGroupStyle}>
          <button
            style={{
              ...coltempButtonStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {previewTemplate.coltemp_color && (
              <div 
                className="coltemp_button_colorbox1"
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: previewTemplate.coltemp_color,
                  display: 'inline-block'
                }}
              />
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {previewTemplate.count_of_columns || ''} | 
              {previewTemplate.icon_name ? (
                <IconPreview 
                  iconName={previewTemplate.icon_name} 
                  iconColor={previewTemplate.icon_color || '#666666'} 
                  size={10} 
                />
              ) : previewTemplate.coltemp_icon} | 
              {previewTemplate.coltemp_name}
            </span>
          </button>
        </div>
        
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          This is a preview. Hover over A3 areas to see different templates.
        </p>
      </div>
    </div>
  );
}