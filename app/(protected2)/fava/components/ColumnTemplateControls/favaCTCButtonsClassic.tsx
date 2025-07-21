import Link from 'next/link';
import IconPreview from '../icons/iconPreview';
import { CTCButtonsProps, ColtempData, CATEGORIES } from './favaCTCTypes';

interface ColtempButtonProps {
  coltemp_id?: number;
  coltemp_icon?: string | null;
  icon_name?: string | null;
  icon_color?: string | null;
  coltemp_color?: string | null;
  coltemp_name?: string | null;
  count_of_columns?: number | null;
  isFirst?: boolean;
  isLast?: boolean;
  isMore?: boolean;
  category?: string;
  overflowItems?: ColtempData[];
  activeTemplateId: number | null;
  dropdownOpen: { [key: string]: boolean };
  onTemplateSelect: (templateId: number, template: ColtempData) => void;
  onToggleDropdown: (category: string) => void;
}

export default function FavaCTCButtonsClassic({
  templates,
  activeTemplateId,
  dropdownOpen,
  onTemplateSelect,
  onShendoClick,
  onOpenCJ,
  onToggleDropdown,
  utg_id,
  createSlots,
  getOverflowItems,
  title,
  plutoClasses
}: CTCButtonsProps & { createSlots: any, getOverflowItems: any, title?: string, plutoClasses?: string }) {

  // Reusable button component
  const ColtempButton = ({ 
    coltemp_id, 
    coltemp_icon, 
    icon_name,
    icon_color,
    coltemp_color, 
    coltemp_name, 
    count_of_columns, 
    isFirst = false, 
    isLast = false, 
    isMore = false,
    category = '',
    overflowItems = [],
    activeTemplateId,
    dropdownOpen,
    onTemplateSelect,
    onToggleDropdown
  }: ColtempButtonProps) => {
    const getButtonStyle = () => {
      if (isMore) return moreButtonStyle;
      if (isFirst) return coltempButtonFirstStyle;
      if (isLast) return coltempButtonLastStyle;
      return coltempButtonStyle;
    };

    const renderContent = () => {
      if (isMore) {
        return 'more';
      }
      if (!coltemp_name) {
        return '| | (empty)';
      }
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span>{count_of_columns || ''}</span>
          <span>|</span>
          {icon_name ? (
            <IconPreview 
              iconName={icon_name} 
              iconColor={icon_color || '#666666'} 
              size={12} 
            />
          ) : (
            <span>{coltemp_icon || ''}</span>
          )}
          <span>|</span>
          <span>{coltemp_name}</span>
        </span>
      );
    };

    const handleClick = () => {
      if (isMore) {
        onToggleDropdown(category);
      } else if (coltemp_id !== -1 && coltemp_id !== undefined) {
        const template: ColtempData = {
          coltemp_id: coltemp_id,
          coltemp_name: coltemp_name || null,
          coltemp_category: category,
          coltemp_color: coltemp_color || null,
          coltemp_icon: coltemp_icon || null,
          icon_name: icon_name || null,
          icon_color: icon_color || null,
          count_of_columns: count_of_columns || null
        };
        onTemplateSelect(coltemp_id, template);
      }
    };

    const handleHover = () => {
      if (!isMore && coltemp_id !== -1 && coltemp_id !== undefined) {
        // Emit hover event for preview bar
        const template: ColtempData = {
          coltemp_id: coltemp_id,
          coltemp_name: coltemp_name || null,
          coltemp_category: category,
          coltemp_color: coltemp_color || null,
          coltemp_icon: coltemp_icon || null,
          icon_name: icon_name || null,
          icon_color: icon_color || null,
          count_of_columns: count_of_columns || null
        };
        
        const event = new CustomEvent('fava-template-hover', {
          detail: { templateId: coltemp_id, template }
        });
        window.dispatchEvent(event);
      }
    };

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button 
          style={{
            ...getButtonStyle(), 
            backgroundColor: isMore ? '#ebebeb' : 
                           (coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb'),
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            if (!isMore && coltemp_id !== activeTemplateId) {
              e.currentTarget.style.backgroundColor = '#f1e9b6';
            }
            handleHover();
          }}
          onMouseLeave={(e) => {
            if (!isMore) {
              e.currentTarget.style.backgroundColor = coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb';
            }
          }}
          onClick={handleClick}
        >
          {!isMore && coltemp_color && (
            <div 
              className="coltemp_button_colorbox1"
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: coltemp_color,
                display: 'inline-block'
              }}
            />
          )}
          {renderContent()}
        </button>
        
        {/* Dropdown for overflow items */}
        {isMore && dropdownOpen[category] && overflowItems.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: '#fff',
            border: '1px solid #595959',
            borderRadius: '4px',
            zIndex: 1000,
            minWidth: '200px'
          }}>
            {overflowItems.map((item) => (
              <button
                key={item.coltemp_id}
                style={{
                  ...coltempButtonStyle,
                  width: '100%',
                  borderRadius: '0',
                  borderRight: '1px solid #595959',
                  backgroundColor: item.coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (item.coltemp_id !== activeTemplateId) {
                    e.currentTarget.style.backgroundColor = '#f1e9b6';
                  }
                  // Emit hover event for dropdown items
                  const event = new CustomEvent('fava-template-hover', {
                    detail: { templateId: item.coltemp_id, template: item }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = item.coltemp_id === activeTemplateId ? '#86a5e9' : '#ebebeb';
                }}
                onClick={() => {
                  onToggleDropdown(category); // Close dropdown
                  onTemplateSelect(item.coltemp_id, item);
                }}
              >
                {item.coltemp_color && (
                  <div 
                    className="coltemp_button_colorbox1"
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: item.coltemp_color,
                      display: 'inline-block'
                    }}
                  />
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>{item.count_of_columns || ''}</span>
                  <span>|</span>
                  {item.icon_name ? (
                    <IconPreview 
                      iconName={item.icon_name} 
                      iconColor={item.icon_color || '#666666'} 
                      size={12} 
                    />
                  ) : (
                    <span>{item.coltemp_icon || ''}</span>
                  )}
                  <span>|</span>
                  <span>{item.coltemp_name}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // All existing styles
  const innerWrapperStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    padding: '16px',
    gap: '8px',
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'flex-start',
    alignContent: 'flex-start'
  };

  const buttonGroupColtempStyle = {
    display: 'flex'
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

  const moreButtonStyle = {
    ...coltempButtonLastStyle,
    backgroundColor: '#ebebeb'
  };

  const separatorStyle = {
    borderLeft: '3px solid #ccc',
    height: '24px',
    margin: '0 8px'
  };

  const openJarButtonStyle = {
    backgroundColor: '#c7c7c7',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '4px',
    padding: '0px 10px',
    border: 'none',
    cursor: 'pointer'
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

  const categorySymbols = {
    'range': 'C1',
    'adminpublic': 'C2', 
    'personal': 'C3'
  };

  const circleStyle = {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#d3d3d3', // light gray
    color: '#4a4a4a', // dark gray
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    marginRight: '6px'
  };

  return (
    <div 
      className={plutoClasses || ''}
      style={{
        width: '100%',
        border: '1px solid #000',
        backgroundColor: '#5a0e15',
        display: 'flex'
      }}>
      <div style={innerWrapperStyle}>
        <div className="chamber-label-box clb-ocean-classic" style={{ marginBottom: '8px' }}>
          {title || 'Classic Buttons Ocean'}
        </div>
        <strong>db tables:</strong> coltemps AND denbu_columns

        {CATEGORIES.map((category) => {
          const categoryData = templates[category] || [];
          const slots = createSlots(categoryData, category);
          const overflowItems = getOverflowItems(categoryData, category);
          
          return (
            <div key={category} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={separatorStyle}></span>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={circleStyle}>{categorySymbols[category]}</div>
                <span>{category}</span>
              </div>
              
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

              <div style={buttonGroupColtempStyle}>
                {slots.map((slot: ColtempData, index: number) => (
                  <ColtempButton 
                    key={slot.coltemp_id !== -1 ? slot.coltemp_id : `empty-${category}-${index}`}
                    {...slot}
                    isFirst={index === 0}
                    isLast={index === slots.length - 1}
                    activeTemplateId={activeTemplateId}
                    dropdownOpen={dropdownOpen}
                    onTemplateSelect={onTemplateSelect}
                    onToggleDropdown={onToggleDropdown}
                  />
                ))}
                <ColtempButton 
                  isMore={true} 
                  category={category}
                  overflowItems={overflowItems}
                  activeTemplateId={activeTemplateId}
                  dropdownOpen={dropdownOpen}
                  onTemplateSelect={onTemplateSelect}
                  onToggleDropdown={onToggleDropdown}
                />
                
                {/* Actively selected button from overflow */}
                {(() => {
                  const selectedOverflowItem = overflowItems.find((item: ColtempData) => item.coltemp_id === activeTemplateId);
                  
                  if (selectedOverflowItem) {
                    return (
                      <ColtempButton 
                        key={`active-${selectedOverflowItem.coltemp_id}`}
                        {...selectedOverflowItem}
                        activeTemplateId={activeTemplateId}
                        dropdownOpen={dropdownOpen}
                        onTemplateSelect={onTemplateSelect}
                        onToggleDropdown={onToggleDropdown}
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          );
        })}

        <span style={separatorStyle}></span>

        <button style={openJarButtonStyle}>Open /coltempcommand</button>
        <button style={openJarButtonStyle}>Open /coltempjar</button>
      </div>
    </div>
  );
}