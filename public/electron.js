const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const WhatsAppService = require('./services/whatsappService');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let whatsappService = new WhatsAppService();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https:"]
      }
    });
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// WhatsApp IPC Handlers
ipcMain.handle('whatsapp-connect', async (event, { accountId, accountName }) => {
  try {
    const success = await whatsappService.connect(accountId, accountName);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-disconnect', async (event, { accountId }) => {
  try {
    await whatsappService.disconnect(accountId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-get-status', (event, { accountId }) => {
  return whatsappService.getConnectionStatus(accountId);
});

ipcMain.handle('whatsapp-get-all-accounts', () => {
  return whatsappService.getAllAccounts();
});

ipcMain.handle('whatsapp-get-accounts', () => {
  try {
    const accounts = whatsappService.getAllAccounts();
    const accountsWithStatus = accounts.map(accountId => {
      const status = whatsappService.getConnectionStatus(accountId);
      const accountIdStr = String(accountId); // Ensure accountId is a string
      return {
        id: accountId,
        name: accountIdStr.split('_')[1] || accountIdStr, // Extract name from account ID
        phone: accountIdStr.split('_')[1] || accountIdStr,
        isConnected: status === 'connected'
      };
    });
    return accountsWithStatus;
  } catch (error) {
    console.error('Error getting WhatsApp accounts:', error);
    return [];
  }
});

ipcMain.handle('whatsapp-check-account', (event, { accountId }) => {
  return whatsappService.getAccountStatus(accountId);
});

ipcMain.handle('whatsapp-send-message', async (event, { accountId, to, message, attachmentPath }) => {
  try {
    let attachment = null;
    if (attachmentPath) {
      attachment = await whatsappService.createMediaFromFile(attachmentPath);
    }
    const result = await whatsappService.sendMessage(accountId, to, message, attachment);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-send-bulk', async (event, { accountId, contacts, message, attachmentPath }) => {
  try {
    let attachment = null;
    if (attachmentPath) {
      attachment = await whatsappService.createMediaFromFile(attachmentPath);
    }
    const results = await whatsappService.sendBulkMessages(accountId, contacts, message, attachment);
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-send-multiple-accounts', async (event, { accountIds, to, message, attachmentPath }) => {
  try {
    let attachment = null;
    if (attachmentPath) {
      attachment = await whatsappService.createMediaFromFile(attachmentPath);
    }
    const results = await whatsappService.sendMessageFromMultipleAccounts(accountIds, to, message, attachment);
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-get-chats', async () => {
  try {
    const chats = await whatsappService.getChats();
    return { success: true, chats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-get-messages', async (event, { chatId, limit }) => {
  try {
    const messages = await whatsappService.getMessages(chatId, limit);
    return { success: true, messages };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set up WhatsApp service callbacks
whatsappService.setStatusChangeCallback((accountId, status) => {
  if (mainWindow) {
    mainWindow.webContents.send('whatsapp-status-changed', accountId, status);
  }
});

whatsappService.setQRCodeChangeCallback((accountId, qrCode) => {
  if (mainWindow) {
    mainWindow.webContents.send('whatsapp-qr-changed', accountId, qrCode);
  }
});

whatsappService.setMessageReceivedCallback((accountId, message) => {
  if (mainWindow) {
    mainWindow.webContents.send('whatsapp-message-received', accountId, message);
  }
});

// File handling
ipcMain.handle('save-file', async (event, { fileData, fileName }) => {
  try {
    const tempDir = path.join(app.getPath('temp'), 'whatsapp-automation');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, fileName);
    
    // Convert base64 to buffer and save
    const buffer = Buffer.from(fileData, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
}); 