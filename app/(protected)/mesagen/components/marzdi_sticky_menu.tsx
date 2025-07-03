'use client';

export default function MarzdiStickyMenu() {
  return (
    <>
      <style jsx>{`
        /* Original CSS styles */
        div.marzdi_sticky_menu {
          width: 700px;
          height: 80px;
          font-family: Arial, sans-serif;
          border: 1px solid #000 !important;
          background-color: #fdfdfd;
          margin-bottom: 0px;
          padding-bottom: 0px;
          
          /* Additional sticky positioning styles */
          position: fixed;
          top: 10px;
          left: 10px;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        div.mar_title1 {
          overflow-y: auto; /* enables vertical scrolling */
          overflow-x: hidden; /* prevents horizontal scroll */
          width: 600px;
          height: 60px;
          font-size: 18px;
          font-weight: bold;
          border: 1px solid #000;
          padding: 4px 4px 4px 4px;
          
          /* Additional styles for better text handling */
          line-height: 1.2;
          word-wrap: break-word;
        }
        
        /* Additional styles for better layout */
        .marzdi_sticky_menu button {
          cursor: pointer;
          border: 1px solid #ccc;
          background-color: #f5f5f5;
          font-size: 11px;
          padding: 0;
          transition: background-color 0.2s;
        }
        
        .marzdi_sticky_menu button:hover {
          background-color: #e0e0e0;
        }
        
        /* Responsive adjustment for smaller screens */
        @media (max-width: 768px) {
          div.marzdi_sticky_menu {
            width: 90%;
            max-width: 700px;
            left: 5%;
          }
          
          div.mar_title1 {
            width: calc(100% - 110px);
          }
        }
      `}</style>
      
      <div className="marzdi_sticky_menu">
        <div className="mar_title1" style={{float:'left',borderRadius:'7px',marginTop:'2px',marginLeft:'2px'}}>
          The Top Pest Species In Tuscaloosa, AL - Raccoons, Bats, Termites, Ants, Rodents, Iguanas, Turtles, Snakes, Cougars, Black Bears, Ursus Americanus, Wombats, Kangaroos, Dogs, Coyotes, Frogs, Bobcats
        </div>

        <button style={{marginLeft:'4px',marginTop:'4px',width:'55px',height:'55px'}}>S</button>
        <button style={{marginLeft:'0px',marginTop:'4px',width:'30px',height:'55px'}}>T</button>

        <strong style={{fontSize:'12px',clear:'both',float:'left',marginTop:'1px',marginRight:'5px'}}>••div.marzdi_sticky_menu</strong>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
        <button style={{height:'13px',width:'60px',float:'left',marginTop:'1px'}}></button>
      </div>
    </>
  );
}