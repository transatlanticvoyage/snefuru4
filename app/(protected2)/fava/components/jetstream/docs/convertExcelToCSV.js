const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Function to convert Excel to CSV
function convertExcelToCSV(excelFilePath, csvFilePath) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];
    console.log(`Processing sheet: ${sheetName}`);
    
    // Get the worksheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to CSV
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    
    // Write CSV file
    fs.writeFileSync(csvFilePath, csvData, 'utf8');
    
    console.log(`Successfully converted to: ${csvFilePath}`);
    
    // Get some stats
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`Rows: ${range.e.r + 1}`);
    console.log(`Columns: ${range.e.c + 1}`);
    
    return true;
  } catch (error) {
    console.error('Error converting Excel to CSV:', error.message);
    return false;
  }
}

// Convert the specific file
const excelFile = path.join(__dirname, '412 jetstream xls mockup 9.xlsx');
const csvFile = path.join(__dirname, '412_jetstream_xls_mockup_9.csv');

convertExcelToCSV(excelFile, csvFile);