const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient (simulated)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Simple bird icon using text
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🦅', size / 2, size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icons/${filename}`, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Generate icon files
try {
  generateIcon(16, 'icon16.png');
  generateIcon(48, 'icon48.png');
  generateIcon(128, 'icon128.png');
  console.log('All icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('Using HTML generator instead. Open generate_icons.html in a browser and save the canvases.');
}