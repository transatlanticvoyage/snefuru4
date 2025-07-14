  export default function FavaTrelnoColumnsDefBox() {
    const boxStyle = {
      border: '1px solid #000'
    };

    const trelnoTextareaWrapperStyle = {
      padding: '10px',
      marginTop: '10px'
    };

    const trelnoTextareaStyle = {
      width: '150px',
      height: '100px',
      border: '1px solid #9e9e9e',
      resize: 'vertical'
    };

    const trelnoButtonStyle = {
      backgroundColor: '#4CAF50',
      border: 'none',
      color: 'white',
      padding: '8px 16px',
      textAlign: 'center' as const,
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '14px',
      margin: '4px 2px',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'background-color 0.3s'
    };

    return (
      <div className="trelno_columns_def_box" style={boxStyle}>
        <strong>trelno_columns_def_box</strong><br></br>
        lorem ipsum dolor<br></br>

        <div className="trelno_textarea_wrapper_div" style={trelnoTextareaWrapperStyle}>
         <textarea className="trelno_textarea" style={trelnoTextareaStyle}>
          ff
         </textarea>
        </div>

        <button className="trelno_refresh_button" style={trelnoButtonStyle}>Refresh Cache</button>

      </div>
    );
  }