// Quick test script to show production tray menu
const { app, BrowserWindow } = require('electron');

// Set production mode
process.env.NODE_ENV = 'production';

console.log('🎯 Testing Production Mode Tray Menu');
console.log('NODE_ENV:', process.env.NODE_ENV);

app.whenReady().then(() => {
  const window = new BrowserWindow({ show: false });
  
  // Import and setup tray
  const { setupSystemTray } = require('./dist-electron/main/tray/systemTray');
  setupSystemTray(window);
  
  console.log('✅ Production tray menu created');
  console.log('📱 Right-click the ● icon in menu bar to see PRODUCTION menu');
  console.log('🔧 Should NOT show dev tools, screenshot controls, or quit option');
  
  setTimeout(() => {
    console.log('🛑 Test complete - closing app');
    app.quit();
  }, 10000);
});

app.on('window-all-closed', () => {
  // Keep app running to test tray
});
