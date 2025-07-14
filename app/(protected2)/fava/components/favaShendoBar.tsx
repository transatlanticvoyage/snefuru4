import { useState, useEffect } from 'react';

interface ColtempData {
  coltemp_id: number;
  coltemp_name: string | null;
  coltemp_category: string | null;
  coltemp_color: string | null;
  coltemp_icon: string | null;
  count_of_columns: number | null;
}

export default function FavaShendoBar() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<ColtempData[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);

  useEffect(() => {
    // Listen for shendo events
    const handleShendoShowCategory = (event: any) => {
      const { category, categoryData } = event.detail;
      setSelectedCategory(category);
      setCategoryData(categoryData);
    };

    window.addEventListener('fava-shendo-show-category', handleShendoShowCategory);

    return () => {
      window.removeEventListener('fava-shendo-show-category', handleShendoShowCategory);
    };
  }, []);

  // Import button styles from column template controls
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

  // Button styles (same as column template controls)
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

  const handleTemplateClick = (coltemp_id: number, coltemp_name: string | null) => {
    setActiveTemplateId(coltemp_id);
    
    // Emit the same events as column template controls
    const event = new CustomEvent('fava-template-selected', {
      detail: { coltemp_id, coltemp_name }
    });
    window.dispatchEvent(event);
    
    // Update URL with selected template
    const url = new URL(window.location.href);
    url.searchParams.set('coltemp_id', coltemp_id.toString());
    window.history.pushState({}, '', url);
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
                  backgroundColor: template.coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (template.coltemp_id !== activeTemplateId) {
                    e.currentTarget.style.backgroundColor = '#f1e9b6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = template.coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb';
                }}
                onClick={() => handleTemplateClick(template.coltemp_id, template.coltemp_name)}
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
                {`${template.count_of_columns || ''} | ${template.coltemp_icon || ''} | ${template.coltemp_name}`}
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