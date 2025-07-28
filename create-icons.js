const fs = require('fs');
const path = require('path');

console.log('🎨 Creating placeholder icons...');

// Create assets directory if it doesn't exist
const assetsDir = 'assets';
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple 1x1 pixel PNG as placeholder
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xCF, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

// Create placeholder files
const iconFiles = [
  { name: 'icon.png', data: pngData },
  { name: 'icon.ico', data: pngData },
  { name: 'icon.icns', data: pngData }
];

iconFiles.forEach(icon => {
  const iconPath = path.join(assetsDir, icon.name);
  fs.writeFileSync(iconPath, icon.data);
  console.log(`✅ Created ${icon.name}`);
});

console.log('\n🎯 Placeholder icons created successfully!');
console.log('💡 Replace these with proper icons for production builds.');
console.log('📁 Icons should be:');
console.log('   - icon.ico: 256x256 Windows icon');
console.log('   - icon.icns: macOS icon bundle');
console.log('   - icon.png: 512x512 Linux icon'); 