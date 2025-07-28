# Jetstream Documentation

## Excel to CSV Conversion

This folder contains the Jetstream system documentation and conversion tools.

### Quick Update

After updating the Excel file (`412 mockup for zug yeg 8.xlsx`), run one of these commands:

#### Option 1: Direct script execution
```bash
cd app/(protected2)/fava/components/jetstream/docs
node updateCSV.js
```

#### Option 2: From project root
```bash
npm run update-jetstream-csv
```

### What it does:
- Converts the Excel file to CSV format
- Backs up the existing CSV file (creates `.backup`)
- Shows file statistics and modification dates
- Color-coded console output for easy reading

### Files:
- `412 mockup for zug yeg 8.xlsx` - Source Excel file (your working document)
- `412_mockup_for_zug_yeg_8.csv` - Generated CSV file (for programmatic access)
- `updateCSV.js` - Conversion script
- `convertExcelToCSV.js` - Original conversion script (can be removed)

### Note:
The script automatically detects changes and provides feedback about file modification times to help you track updates.