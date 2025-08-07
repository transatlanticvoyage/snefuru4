// Simple icon generator using canvas
// This creates basic colored square icons with "PO" text

const fs = require('fs');
const path = require('path');

// Function to create a simple SVG icon
function createSVGIcon(size) {
  const fontSize = size * 0.5;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#0066ff"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        fill="white" font-family="Arial, sans-serif" font-size="${fontSize}px" font-weight="bold">PO</text>
</svg>`;
  return svg;
}

// Create SVG files (these can be converted to PNG)
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = path.join(__dirname, 'icons', `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('\nSVG icons created successfully!');
console.log('To use these in Chrome extension:');
console.log('1. Convert SVG to PNG using an online converter or image editor');
console.log('2. Or use the SVG files directly by updating manifest.json to reference .svg files');