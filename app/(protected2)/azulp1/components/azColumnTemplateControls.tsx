export default function AzColumnTemplateControls() {
  // Data for each category of buttons
  const coltempData = {
    range: [
      { coltemp_id: 15, icon: 'i', color: '#ff6b6b', coltemp_name: 'coltemp1', count_of_columns: 15 },
      { coltemp_id: 16, icon: 'u', color: '#4ecdc4', coltemp_name: 'coltemp2', count_of_columns: 8 },
      { coltemp_id: 17, icon: 'x', color: '#45b7d1', coltemp_name: 'coltemp3', count_of_columns: 12 }
    ],
    adminpublic: [
      { coltemp_id: 18, icon: 'a', color: '#f9ca24', coltemp_name: 'admin1', count_of_columns: 5 },
      { coltemp_id: 19, icon: 'p', color: '#f0932b', coltemp_name: 'public1', count_of_columns: 22 },
      { coltemp_id: 20, icon: 's', color: '#eb4d4b', coltemp_name: 'shared1', count_of_columns: 7 }
    ],
    personal: [
      { coltemp_id: 21, icon: 'm', color: '#6c5ce7', coltemp_name: 'personal1', count_of_columns: 3 },
      { coltemp_id: 22, icon: 'n', color: '#a29bfe', coltemp_name: 'personal2', count_of_columns: 18 },
      { coltemp_id: 23, icon: 'o', color: '#fd79a8', coltemp_name: 'personal3', count_of_columns: 9 }
    ]
  };

  // Reusable button component
  const ColtempButton = ({ 
    coltemp_id, 
    icon, 
    color, 
    coltemp_name, 
    count_of_columns, 
    isFirst = false, 
    isLast = false, 
    isMore = false 
  }) => {
    const getButtonStyle = () => {
      if (isMore) return moreButtonStyle;
      if (isFirst) return coltempButtonFirstStyle;
      if (isLast) return coltempButtonLastStyle;
      return coltempButtonStyle;
    };

    const displayText = isMore ? 'more' : 
      `${count_of_columns} | ${icon} | ${color} | ${coltemp_name}`;

    return (
      <button 
        style={{
          ...getButtonStyle(), 
          backgroundColor: isMore ? '#8baaec' : (color || '#ebebeb')
        }}
        onClick={() => {
          if (!isMore) {
            console.log(`Clicked coltemp_id: ${coltemp_id}`);
          }
        }}
      >
        {displayText}
      </button>
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

        {Object.entries(coltempData).map(([category, buttons]) => (
          <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={separatorStyle}></span>
            
            {category}

            <div style={buttonGroupColtempStyle}>
              {buttons.map((btn, index) => (
                <ColtempButton 
                  key={btn.coltemp_id}
                  {...btn}
                  isFirst={index === 0}
                  isLast={index === buttons.length - 1}
                />
              ))}
              <ColtempButton isMore={true} />
            </div>
          </div>
        ))}

        <span style={separatorStyle}></span>

        <button style={openJarButtonStyle}>Open /coltempcommand</button>
        <button style={openJarButtonStyle}>Open /coltempjar</button>
      </div>
    </div>
  );
}