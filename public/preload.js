const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  platform: process.platform,
  versions: process.versions,
  
  // WhatsApp API
  whatsapp: {
    connect: (accountId, accountName) => ipcRenderer.invoke('whatsapp-connect', { accountId, accountName }),
    disconnect: (accountId) => ipcRenderer.invoke('whatsapp-disconnect', { accountId }),
    getStatus: (accountId) => ipcRenderer.invoke('whatsapp-get-status', { accountId }),
    getAllAccounts: () => ipcRenderer.invoke('whatsapp-get-all-accounts'),
    getWhatsAppAccounts: () => ipcRenderer.invoke('whatsapp-get-accounts'),
    checkAccount: (accountId) => ipcRenderer.invoke('whatsapp-check-account', { accountId }),
    sendMessage: (accountId, to, message, attachmentPath) => ipcRenderer.invoke('whatsapp-send-message', { accountId, to, message, attachmentPath }),
    sendBulk: (accountId, contacts, message, attachmentPath) => ipcRenderer.invoke('whatsapp-send-bulk', { accountId, contacts, message, attachmentPath }),
    sendMultipleAccounts: (accountIds, to, message, attachmentPath) => ipcRenderer.invoke('whatsapp-send-multiple-accounts', { accountIds, to, message, attachmentPath }),
    saveFile: (fileData, fileName) => ipcRenderer.invoke('save-file', { fileData, fileName }),
    getChats: () => ipcRenderer.invoke('whatsapp-get-chats'),
    getMessages: (chatId, limit) => ipcRenderer.invoke('whatsapp-get-messages', { chatId, limit }),
    
    // Event listeners
    onStatusChanged: (callback) => ipcRenderer.on('whatsapp-status-changed', callback),
    onQRChanged: (callback) => ipcRenderer.on('whatsapp-qr-changed', callback),
    onMessageReceived: (callback) => ipcRenderer.on('whatsapp-message-received', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  },
  
  // Example method for getting app info
  getAppInfo: () => ({
    name: 'WhatsApp Automation',
    version: '1.0.0',
    platform: process.platform
  })
}); 