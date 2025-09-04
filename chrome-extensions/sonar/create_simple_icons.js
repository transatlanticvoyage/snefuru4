// Simple SVG-based icons that we can use as placeholders
const fs = require('fs');
const path = require('path');

function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea"/>
        <stop offset="100%" style="stop-color:#764ba2"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>
    <text x="${size/2}" y="${size/2}" text-anchor="middle" dy="0.3em" 
          font-family="Arial, sans-serif" font-size="${size * 0.6}" fill="white">🦅</text>
    <circle cx="${size * 0.25}" cy="${size * 0.8}" r="${size * 0.08}" 
            fill="none" stroke="white" stroke-width="${size * 0.02}"/>
    <circle cx="${size * 0.75}" cy="${size * 0.8}" r="${size * 0.08}" 
            fill="none" stroke="white" stroke-width="${size * 0.02}"/>
    <line x1="${size * 0.33}" y1="${size * 0.8}" x2="${size * 0.67}" y2="${size * 0.8}" 
          stroke="white" stroke-width="${size * 0.02}"/>
  </svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Create SVG icons
const sizes = [
  { size: 16, name: 'icon16.svg' },
  { size: 48, name: 'icon48.svg' },
  { size: 128, name: 'icon128.svg' }
];

sizes.forEach(({ size, name }) => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, name), svgContent);
  console.log(`Created ${name}`);
});

console.log('SVG icons created! You can use these or convert to PNG using an online converter.');