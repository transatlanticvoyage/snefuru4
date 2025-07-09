export default function AzColumnTemplateControls() {
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

        <span style={separatorStyle}></span>

        range

        <div style={buttonGroupColtempStyle}>
          <button style={coltempButtonFirstStyle}>15 | i | st | color | coltemp1</button>
          <button style={coltempButtonStyle}>coltemp2</button>
          <button style={coltempButtonStyle}>coltemp3</button>
          <button style={moreButtonStyle}>more</button>
        </div>

        <span style={separatorStyle}></span>

        adminpublic

        <div style={buttonGroupColtempStyle}>
          <button style={coltempButtonFirstStyle}>coltemp1</button>
          <button style={coltempButtonStyle}>coltemp2</button>
          <button style={coltempButtonStyle}>coltemp3</button>
          <button style={moreButtonStyle}>more</button>
        </div>

        <span style={separatorStyle}></span>

        personal

        <div style={buttonGroupColtempStyle}>
          <button style={coltempButtonFirstStyle}>coltemp1</button>
          <button style={coltempButtonStyle}>coltemp2</button>
          <button style={coltempButtonStyle}>coltemp3</button>
          <button style={moreButtonStyle}>more</button>
        </div>

        <span style={separatorStyle}></span>

        <button style={openJarButtonStyle}>Open /coltempcommand</button>
        <button style={openJarButtonStyle}>Open /coltempjar</button>
      </div>
    </div>
  );
}