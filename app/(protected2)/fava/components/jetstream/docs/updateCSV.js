#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_FILE = '412 jetstream xls mockup 9.xlsx';
const CSV_FILE = '412_jetstream_xls_mockup_9.csv';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function convertExcelToCSV() {
  console.log(`${colors.cyan}Excel to CSV Converter${colors.reset}`);
  console.log('='.repeat(40));
  
  const excelPath = path.join(__dirname, EXCEL_FILE);
  const csvPath = path.join(__dirname, CSV_FILE);
  
  try {
    // Check if Excel file exists
    if (!fs.existsSync(excelPath)) {
      console.error(`${colors.red}Error: Excel file not found: ${EXCEL_FILE}${colors.reset}`);
      return;
    }
    
    // Get file stats for comparison
    const excelStats = fs.statSync(excelPath);
    const csvExists = fs.existsSync(csvPath);
    const csvStats = csvExists ? fs.statSync(csvPath) : null;
    
    console.log(`${colors.yellow}Excel file:${colors.reset} ${EXCEL_FILE}`);
    console.log(`${colors.yellow}Last modified:${colors.reset} ${excelStats.mtime.toLocaleString()}`);
    
    if (csvExists) {
      console.log(`${colors.yellow}CSV file:${colors.reset} ${CSV_FILE} (exists)`);
      console.log(`${colors.yellow}Last modified:${colors.reset} ${csvStats.mtime.toLocaleString()}`);
    }
    
    // Read the Excel file
    console.log(`\n${colors.cyan}Reading Excel file...${colors.reset}`);
    const workbook = XLSX.readFile(excelPath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to CSV
    console.log(`${colors.cyan}Converting to CSV...${colors.reset}`);
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    
    // Backup existing CSV if it exists
    if (csvExists) {
      const backupPath = csvPath + '.backup';
      fs.copyFileSync(csvPath, backupPath);
      console.log(`${colors.green}✓ Backed up existing CSV to: ${path.basename(backupPath)}${colors.reset}`);
    }
    
    // Write new CSV file
    fs.writeFileSync(csvPath, csvData, 'utf8');
    console.log(`${colors.green}✓ CSV file updated successfully!${colors.reset}`);
    
    // Get statistics
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`\n${colors.cyan}Statistics:${colors.reset}`);
    console.log(`- Sheet name: ${sheetName}`);
    console.log(`- Rows: ${range.e.r + 1}`);
    console.log(`- Columns: ${range.e.c + 1}`);
    console.log(`- CSV file size: ${fs.statSync(csvPath).size.toLocaleString()} bytes`);
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the conversion
convertExcelToCSV();