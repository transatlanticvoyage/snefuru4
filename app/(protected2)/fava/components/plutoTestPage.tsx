'use client';

import React from 'react';
import PureFavaPageMaster from './pureFavaPageMaster';
import PlutoShowHideInstrument from './plutoShowHideInstrument';

export default function PlutoTestPage() {
  const testData = [
    ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
    ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
    ['Row 3 Col 1', 'Row 3 Col 2', 'Row 3 Col 3'],
  ];

  const headerRows = [{
    id: 'header',
    type: 'label',
    cells: [
      { content: 'Column 1', alignment: 'left' },
      { content: 'Column 2', alignment: 'left' },
      { content: 'Column 3', alignment: 'left' },
    ]
  }];

  const tableProps = {
    headerRows,
    data: testData,
    tableClassName: "test-table",
    theadClassName: "test-header",
    tbodyClassName: "test-body",
    thClassName: "test-th",
    tdClassName: "test-td",
    headerTrClassName: "test-header-row",
    bodyTrClassName: "test-body-row",
    onCellClick: (row: number, col: number, value: any) => {
      console.log(`Cell clicked: Row ${row}, Col ${col}, Value: ${value}`);
    }
  };

  return (
    <div>
      <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Pluto Debug Test Interface</h3>
        <p>Use this interface to test the pluto toggle functionality:</p>
        <PlutoShowHideInstrument utg_id="test123" />
      </div>
      
      <PureFavaPageMaster
        pageTitle="Pluto Control System Test"
        pageDescription="Testing the pluto control system for ocean-classic-chamber visibility"
        documentTitle="Pluto Test Page"
        tableProps={tableProps}
        showTable={true}
        showColumnTemplateControls={true}
        showShendoBar={true}
        showFilterControls={true}
        showSearchBox={true}
        showPaginationControls={true}
        showBiriDevInfoBox={true}
        showTrelnoColumnsDefBox={true}
        utg_id="test123"
      />
    </div>
  );
}