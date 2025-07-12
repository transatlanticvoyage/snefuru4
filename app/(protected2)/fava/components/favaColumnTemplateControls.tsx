import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ColtempData {
  coltemp_id: number;
  coltemp_name: string | null;
  coltemp_category: string | null;
  coltemp_color: string | null;
  coltemp_icon: string | null;
  count_of_columns: number | null;
}

export default function FavaColumnTemplateControls() {
  const [coltempData, setColtempData] = useState<{[key: string]: ColtempData[]}>({});
  const [dropdownOpen, setDropdownOpen] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Define the 3 categories
  const categories = ['range', 'adminpublic', 'personal'];

  useEffect(() => {
    fetchColtempData();
  }, []);

  const fetchColtempData = async () => {
    try {
      const { data, error } = await supabase
        .from('coltemps')
        .select('coltemp_id, coltemp_name, coltemp_category, coltemp_color, coltemp_icon, count_of_columns')
        .order('coltemp_id', { ascending: true });

      if (error) throw error;

      // Group data by category
      const groupedData: {[key: string]: ColtempData[]} = {
        range: [],
        adminpublic: [],
        personal: []
      };

      data?.forEach(item => {
        const category = item.coltemp_category?.toLowerCase() || 'range';
        if (groupedData[category]) {
          groupedData[category].push(item);
        }
      });

      setColtempData(groupedData);
    } catch (error) {
      console.error('Error fetching coltemp data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create 3 slots per category with empty slot handling
  const createSlots = (categoryData: ColtempData[]) => {
    const slots = [];
    for (let i = 0; i < 3; i++) {
      if (categoryData[i]) {
        slots.push(categoryData[i]);
      } else {
        // Empty slot
        slots.push({
          coltemp_id: -1,
          coltemp_name: null,
          coltemp_category: null,
          coltemp_color: null,
          coltemp_icon: null,
          count_of_columns: null
        });
      }
    }
    return slots;
  };

  // Get overflow items (4th item onwards)
  const getOverflowItems = (categoryData: ColtempData[]) => {
    return categoryData.slice(3);
  };

  // Toggle dropdown for more button
  const toggleDropdown = (category: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Reusable button component
  const ColtempButton = ({ 
    coltemp_id, 
    coltemp_icon, 
    coltemp_color, 
    coltemp_name, 
    count_of_columns, 
    isFirst = false, 
    isLast = false, 
    isMore = false,
    category = '',
    overflowItems = [] as ColtempData[]
  }) => {
    const getButtonStyle = () => {
      if (isMore) return moreButtonStyle;
      if (isFirst) return coltempButtonFirstStyle;
      if (isLast) return coltempButtonLastStyle;
      return coltempButtonStyle;
    };

    const displayText = isMore ? 'more' : 
      coltemp_name ? 
        `${count_of_columns || ''} | ${coltemp_icon || ''} | ${coltemp_color || ''} | ${coltemp_name}` :
        `| | | (empty)`;

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button 
          style={{
            ...getButtonStyle(), 
            backgroundColor: isMore ? '#8baaec' : (coltemp_color || '#ebebeb')
          }}
          onClick={() => {
            if (isMore) {
              toggleDropdown(category);
            } else if (coltemp_id !== -1) {
              console.log(`Clicked coltemp_id: ${coltemp_id}`);
            }
          }}
        >
          {displayText}
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
                  backgroundColor: item.coltemp_color || '#ebebeb',
                  display: 'block'
                }}
                onClick={() => {
                  console.log(`Clicked dropdown coltemp_id: ${item.coltemp_id}`);
                  setDropdownOpen(prev => ({ ...prev, [category]: false }));
                }}
              >
                {`${item.count_of_columns || ''} | ${item.coltemp_icon || ''} | ${item.coltemp_color || ''} | ${item.coltemp_name}`}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // All existing styles
  const boardStyle = {
    width: '100%',
    height: '200px',
    border: '1px solid #000',
    backgroundColor: '#5a0e15'
  };

  const topLabelStyle = {
    color: '#fff',
    float: 'left' as const,
    width: '100px'
  };

  const innerWrapperStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    padding: '16px',
    gap: '8px',
    backgroundColor: '#fff',
    float: 'left' as const
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
    borderRight: 'none',
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
    backgroundColor: '#8baaec'
  };

  const separatorStyle = {
    borderLeft: '3px solid #ccc',
    height: '100%',
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

  return (
    <div style={boardStyle}>
      <div style={topLabelStyle}>div.coltemp_board</div>
      <div style={innerWrapperStyle}>
        <strong>db tables:</strong> coltemps AND denbu_columns

        {loading ? (
          <div>Loading coltemp data...</div>
        ) : (
          categories.map((category) => {
            const categoryData = coltempData[category] || [];
            const slots = createSlots(categoryData);
            const overflowItems = getOverflowItems(categoryData);
            
            return (
              <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={separatorStyle}></span>
                
                {category}

                <div style={buttonGroupColtempStyle}>
                  {slots.map((slot, index) => (
                    <ColtempButton 
                      key={slot.coltemp_id !== -1 ? slot.coltemp_id : `empty-${category}-${index}`}
                      {...slot}
                      isFirst={index === 0}
                      isLast={index === slots.length - 1}
                    />
                  ))}
                  <ColtempButton 
                    isMore={true} 
                    category={category}
                    overflowItems={overflowItems}
                  />
                </div>
              </div>
            );
          })
        )}

        <span style={separatorStyle}></span>

        <button style={openJarButtonStyle}>Open /coltempcommand</button>
        <button style={openJarButtonStyle}>Open /coltempjar</button>
      </div>
    </div>
  );
}