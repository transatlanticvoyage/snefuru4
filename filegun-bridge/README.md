# Filegun Bridge Server

A WebSocket bridge that allows the Filegun web interface to open local files in their appropriate applications.

## How It Works

1. **WebSocket Server** runs on `localhost:8765`
2. **Browser** sends messages like `{action: "open", filePath: "/path/to/file"}`
3. **Server** opens files in the appropriate application (VS Code, Excel, etc.)

## Security Features

- ✅ **Localhost Only** - Only accepts connections from 127.0.0.1
- ✅ **File Validation** - Checks that files exist before opening
- ✅ **No Network Access** - No external connections allowed
- ✅ **Simple Protocol** - Easy to audit and understand

## Installation

```bash
cd filegun-bridge
npm install
```

## Usage

```bash
# Start the server
npm start

# Start with auto-restart (development)
npm run dev
```

## File Type Routing

The server intelligently routes files to appropriate applications:

### Development Files → VS Code
- `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.html`, `.css`, `.json`, `.md`, etc.

### Spreadsheets → Microsoft Excel  
- `.xlsx`, `.xls`, `.csv`

### Images → Preview
- `.png`, `.jpg`, `.gif`, etc.

### Documents → Default Apps
- `.pdf`, `.doc`, `.docx`, `.ppt`

## API

Send JSON messages via WebSocket:

```javascript
// Open file with smart app detection
{
  "action": "open", 
  "filePath": "/path/to/file.xlsx"
}

// Reveal file in Finder
{
  "action": "reveal",
  "filePath": "/path/to/file.txt" 
}

// Force open in VS Code
{
  "action": "vscode",
  "filePath": "/path/to/file.js"
}

// Open folder
{
  "action": "folder",
  "filePath": "/path/to/directory"
}
```

## Stopping the Server

Press `Ctrl+C` or send `SIGINT` to gracefully shut down.