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

    const trelnoLinkStyle = {
      color: '#2563eb',
      textDecoration: 'underline',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'color 0.2s'
    };

    return (
      <div className="trelno_columns_def_box" style={boxStyle}>
        <strong>trelno_columns_def_box</strong><br></br>
        <a className="trelno_link" style={trelnoLinkStyle} href="/admin/rstormanager">/admin/rstormanager</a><br></br>
        admin_random_storage.rstor_id<br></br>
        admin_random_storage.rstor_name<br></br>
        admin_random_storage.rstor_substance<br></br>

        <div className="trelno_textarea_wrapper_div" style={trelnoTextareaWrapperStyle}>
         <textarea className="trelno_textarea" style={trelnoTextareaStyle}>
          ff
         </textarea>
        </div>

        

        <button className="trelno_refresh_button" style={trelnoButtonStyle}>Refresh Cache</button>

      </div>
    );
  }