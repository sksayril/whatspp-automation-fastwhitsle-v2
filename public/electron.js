const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const WhatsAppService = require('../src/services/whatsappService')
const TemplateService = require('../src/services/templateService')
const QuickReplyService = require('../src/services/quickReplyService')

let mainWindow;
let whatsappService;
let templateService;
let quickReplyService;

// Initialize services
whatsappService = new WhatsAppService()
templateService = new TemplateService()
quickReplyService = new QuickReplyService()

// Register template handlers
ipcMain.handle('templates:getAll', async () => {
  try {
    console.log('Handling templates:getAll request')
    const result = await templateService.getAll()
    console.log('Templates fetched:', result)
    return result
  } catch (error) {
    console.error('Error in templates:getAll handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('templates:create', async (event, template) => {
  try {
    console.log('Handling templates:create request', template)
    const result = await templateService.create(template)
    console.log('Template created:', result)
    return result
  } catch (error) {
    console.error('Error in templates:create handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('templates:update', async (event, id, template) => {
  try {
    console.log('Handling templates:update request', { id, template })
    const result = await templateService.update(id, template)
    console.log('Template updated:', result)
    return result
  } catch (error) {
    console.error('Error in templates:update handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('templates:delete', async (event, id) => {
  try {
    console.log('Handling templates:delete request', id)
    const result = await templateService.delete(id)
    console.log('Template deleted:', result)
    return result
  } catch (error) {
    console.error('Error in templates:delete handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('templates:getById', async (event, id) => {
  try {
    console.log('Handling templates:getById request', id)
    const result = await templateService.getById(id)
    console.log('Template fetched:', result)
    return result
  } catch (error) {
    console.error('Error in templates:getById handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('templates:search', async (event, query) => {
  try {
    console.log('Handling templates:search request', query)
    const result = await templateService.search(query)
    console.log('Templates searched:', result)
    return result
  } catch (error) {
    console.error('Error in templates:search handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('templates:getByCategory', async (event, category) => {
  try {
    console.log('Handling templates:getByCategory request', category)
    const result = await templateService.getByCategory(category)
    console.log('Templates by category fetched:', result)
    return result
  } catch (error) {
    console.error('Error in templates:getByCategory handler:', error)
    return { success: false, error: error.message }
  }
})

// Add these handlers after the existing template handlers
ipcMain.handle('templates:getAttachment', async (event, templateId) => {
  try {
    console.log('Handling templates:getAttachment request', templateId)
    const result = await templateService.getAttachment(templateId)
    console.log('Template attachment fetched:', result.success)
    return result
  } catch (error) {
    console.error('Error in templates:getAttachment handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('templates:saveAttachment', async (event, templateId, attachment) => {
  try {
    console.log('Handling templates:saveAttachment request', { templateId })
    const template = await templateService.getById(templateId)
    if (!template.success || !template.template) {
      throw new Error('Template not found')
    }

    const result = await templateService.update(templateId, {
      ...template.template,
      attachment
    })
    console.log('Template attachment saved:', result.success)
    return result
  } catch (error) {
    console.error('Error in templates:saveAttachment handler:', error)
    return { success: false, error: error.message }
  }
})

// Add these handlers after the existing template handlers
ipcMain.handle('quickReplies:getAll', async () => {
  try {
    console.log('Handling quickReplies:getAll request')
    const result = await quickReplyService.getAll()
    console.log('Quick replies fetched:', result)
    return result
  } catch (error) {
    console.error('Error in quickReplies:getAll handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quickReplies:create', async (event, quickReply) => {
  try {
    console.log('Handling quickReplies:create request', quickReply)
    const result = await quickReplyService.create(quickReply)
    console.log('Quick reply created:', result)
    return result
  } catch (error) {
    console.error('Error in quickReplies:create handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quickReplies:update', async (event, id, quickReply) => {
  try {
    console.log('Handling quickReplies:update request', { id, quickReply })
    const result = await quickReplyService.update(id, quickReply)
    console.log('Quick reply updated:', result)
    return result
  } catch (error) {
    console.error('Error in quickReplies:update handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quickReplies:delete', async (event, id) => {
  try {
    console.log('Handling quickReplies:delete request', id)
    const result = await quickReplyService.delete(id)
    console.log('Quick reply deleted:', result)
    return result
  } catch (error) {
    console.error('Error in quickReplies:delete handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quickReplies:getById', async (event, id) => {
  try {
    console.log('Handling quickReplies:getById request', id)
    const result = await quickReplyService.getById(id)
    console.log('Quick reply fetched:', result)
    return result
  } catch (error) {
    console.error('Error in quickReplies:getById handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quickReplies:toggleActive', async (event, id) => {
  try {
    console.log('Handling quickReplies:toggleActive request', id)
    const result = await quickReplyService.toggleActive(id)
    console.log('Quick reply toggled:', result)
    return result
  } catch (error) {
    console.error('Error in quickReplies:toggleActive handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quickReplies:updateStats', async (event, id, triggered) => {
  try {
    console.log('Handling quickReplies:updateStats request', { id, triggered })
    const result = await quickReplyService.updateStats(id, triggered)
    console.log('Quick reply stats updated:', result)
    return result
  } catch (error) {
    console.error('Error in quickReplies:updateStats handler:', error)
    return { success: false, error: error.message }
  }
})

// Register WhatsApp handlers
ipcMain.handle('whatsapp-connect', async (event, { accountId, accountName }) => {
  try {
    const success = await whatsappService.connect(accountId, accountName)
    return { success }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('whatsapp-disconnect', async (event, { accountId }) => {
  try {
    await whatsappService.disconnect(accountId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('whatsapp-get-status', (event, { accountId }) => {
  return whatsappService.getConnectionStatus(accountId)
})

ipcMain.handle('whatsapp-get-all-accounts', () => {
  return whatsappService.getAllAccounts()
})

ipcMain.handle('whatsapp-get-accounts', () => {
  try {
    const accounts = whatsappService.getAllAccounts()
    const accountsWithStatus = accounts.map(accountId => {
      const status = whatsappService.getConnectionStatus(accountId)
      return {
        id: accountId,
        name: accountId.split('_')[1] || accountId,
        phone: accountId.split('_')[1] || accountId,
        isConnected: status === 'connected'
      }
    })
    return accountsWithStatus
  } catch (error) {
    console.error('Error getting WhatsApp accounts:', error)
    return []
  }
})

ipcMain.handle('whatsapp-check-account', (event, { accountId }) => {
  return whatsappService.getAccountStatus(accountId)
})

ipcMain.handle('whatsapp-send-message', async (event, { accountId, to, message, attachmentPath }) => {
  try {
    let attachment = null
    if (attachmentPath) {
      attachment = await whatsappService.createMediaFromFile(attachmentPath)
    }
    const result = await whatsappService.sendMessage(accountId, to, message, attachment)
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('whatsapp-send-bulk', async (event, { accountId, contacts, message, attachmentPath }) => {
  try {
    let attachment = null
    if (attachmentPath) {
      attachment = await whatsappService.createMediaFromFile(attachmentPath)
    }
    const results = await whatsappService.sendBulkMessages(accountId, contacts, message, attachment)
    return { success: true, results }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Set up WhatsApp service callbacks
  whatsappService.setStatusChangeCallback((accountId, status) => {
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-status-changed', accountId, status)
    }
  })

  whatsappService.setQRCodeChangeCallback((accountId, qrCode) => {
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-qr-changed', accountId, qrCode)
    }
  })

  whatsappService.setMessageReceivedCallback((accountId, message) => {
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-message-received', accountId, message)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', async () => {
  // Close database connections
  if (templateService) {
    try {
      await templateService.closeDatabase()
    } catch (error) {
      console.error('Error closing template database:', error)
    }
  }

  if (quickReplyService) {
    try {
      await quickReplyService.closeDatabase()
    } catch (error) {
      console.error('Error closing quick reply database:', error)
    }
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

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