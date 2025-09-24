# TransitGun

Grove Plugin Development Sync Tool

## Installation

1. Install Node.js if not already installed
2. Navigate to the TransitGun directory
3. Run: `npm install`
4. Run: `npm start` to launch the app

## Usage

Click "Run Blumenthal Grove Sync" to sync Grove plugin files from development folder to local WordPress site.

## Building for Distribution

Run: `npm run dist` to create a macOS .app bundle in the `dist` folder.

## Directories

- **Source**: `/shenzi-wordpress-plugins/grove`
- **Target**: `/wordpress-sites/moldremovalstars.com/app/public/wp-content/plugins/grove`

The app uses rsync to efficiently copy only changed files while preserving permissions.