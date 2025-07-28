const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting WhatsApp Automation Build Process...\n');

// Step 1: Clean previous builds
console.log('📁 Cleaning previous builds...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
if (fs.existsSync('dist-electron')) {
  fs.rmSync('dist-electron', { recursive: true, force: true });
}

// Step 2: Install dependencies if needed
console.log('📦 Checking dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 3: Build React app
console.log('⚛️ Building React app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to build React app:', error.message);
  process.exit(1);
}

// Step 4: Create placeholder icons if they don't exist
console.log('🎨 Creating icons...');
const iconDir = 'assets';
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Create placeholder icons (you should replace these with real icons)
const iconFiles = [
  'icon.ico',
  'icon.icns', 
  'icon.png'
];

iconFiles.forEach(iconFile => {
  const iconPath = path.join(iconDir, iconFile);
  if (!fs.existsSync(iconPath)) {
    console.log(`⚠️  Warning: ${iconFile} not found. Please add a proper icon file.`);
  }
});

// Step 5: Build Electron app
console.log('🔧 Building Electron app...');
try {
  execSync('npm run build:electron', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to build Electron app:', error.message);
  process.exit(1);
}

console.log('\n✅ Build completed successfully!');
console.log('📦 Installer files are in the dist-electron folder');
console.log('🎯 You can now distribute the installer to users');

// Show build results
if (fs.existsSync('dist-electron')) {
  const files = fs.readdirSync('dist-electron');
  console.log('\n📋 Generated files:');
  files.forEach(file => {
    const filePath = path.join('dist-electron', file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   📄 ${file} (${size} MB)`);
  });
} 