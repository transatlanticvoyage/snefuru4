import IconPreview from '../icons/iconPreview';
import { ColtempData } from './favaCTCTypes';

interface FavaCTCShendoClassicProps {
  category: string | null;
  categoryData: ColtempData[];
  activeTemplateId: number | null;
  onTemplateSelect: (templateId: number, template: ColtempData) => void;
}

export default function FavaCTCShendoClassic({
  category,
  categoryData,
  activeTemplateId,
  onTemplateSelect
}: FavaCTCShendoClassicProps) {
  
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
    onTemplateSelect(template.coltemp_id, template);
  };

  const getButtonStyle = (index: number, totalLength: number) => {
    if (totalLength === 1) return coltempButtonStyle;
    if (index === 0) return coltempButtonFirstStyle;
    if (index === totalLength - 1) return coltempButtonLastStyle;
    return coltempButtonStyle;
  };

  return (
    <div className="shendo_bar_div_classic" style={shendoBarDivStyle}>
      <div style={{ ...buttonGroupStyle, alignItems: 'center' }}>
        <div className="chamber-label-box chamber-3" style={{ marginRight: '8px' }}>
          Shendo Classic
        </div>
        <div style={{ marginRight: '8px', fontSize: '14px' }}>
          category: {category || '(none)'}
        </div>
        {category && categoryData.length > 0 && categoryData.map((template, index) => (
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
  );
}