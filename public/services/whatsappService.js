const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.clients = new Map(); // Store multiple clients
    this.accounts = new Map(); // Store account info
    this.qrCodes = new Map(); // Store QR codes for each account
    this.connectionStatuses = new Map(); // Store status for each account
    this.messages = [];
    this.quickReplies = new Map(); // Store quick reply rules for each account
    this.templates = new Map(); // Store message templates
    this.onStatusChange = null;
    this.onQRCodeChange = null;
    this.onMessageReceived = null;
    this.onQuickReplySent = null;
  }

  initialize(accountId, accountName = '') {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: accountId }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // Store account info
    this.accounts.set(accountId, {
      id: accountId,
      name: accountName || `Account ${accountId}`,
      client: client
    });

    // QR Code event
    client.on('qr', async (qr) => {
      try {
        console.log(`QR code received for account ${accountId}:`, qr ? 'QR data present' : 'No QR data');
        const qrCodeData = await qrcode.toDataURL(qr);
        console.log(`QR code generated for account ${accountId}:`, qrCodeData ? 'Success' : 'Failed');
        this.qrCodes.set(accountId, qrCodeData);
        this.connectionStatuses.set(accountId, 'qr_ready');
        
        if (this.onQRCodeChange) {
          console.log(`Calling QR callback for account ${accountId}`);
          this.onQRCodeChange(accountId, qrCodeData);
        }
        if (this.onStatusChange) {
          this.onStatusChange(accountId, 'qr_ready');
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    });

    // Ready event
    client.on('ready', () => {
      this.connectionStatuses.set(accountId, 'connected');
      this.qrCodes.delete(accountId);
      
      if (this.onStatusChange) {
        this.onStatusChange(accountId, 'connected');
      }
      console.log(`WhatsApp client ${accountId} is ready!`);
    });

    // Message event
    client.on('message', async (message) => {
      this.messages.push({
        id: message.id._serialized,
        accountId: accountId,
        from: message.from,
        body: message.body,
        timestamp: message.timestamp,
        type: message.type,
        isFromMe: message.fromMe
      });
      
      if (this.onMessageReceived) {
        this.onMessageReceived(accountId, message);
      }

      // Check for quick replies
      if (!message.fromMe) {
        await this.processQuickReplies(accountId, message);
      }
    });

    // Disconnected event
    client.on('disconnected', () => {
      this.connectionStatuses.set(accountId, 'disconnected');
      this.clients.delete(accountId);
      
      if (this.onStatusChange) {
        this.onStatusChange(accountId, 'disconnected');
      }
      console.log(`WhatsApp client ${accountId} disconnected`);
    });

    // Store the client
    this.clients.set(accountId, client);
  }

  async connect(accountId, accountName = '') {
    try {
      if (!this.clients.has(accountId)) {
        this.initialize(accountId, accountName);
      }
      
      const client = this.clients.get(accountId);
      await client.initialize();
      
      return true;
    } catch (error) {
      console.error(`Error connecting WhatsApp client ${accountId}:`, error);
      return false;
    }
  }

  async disconnect(accountId = null) {
    try {
      if (accountId) {
        const client = this.clients.get(accountId);
        if (client) {
          await client.destroy();
          this.clients.delete(accountId);
          this.connectionStatuses.set(accountId, 'disconnected');
        }
      } else {
        // Disconnect all clients
        for (const [id, client] of this.clients) {
          await client.destroy();
        }
        this.clients.clear();
        this.connectionStatuses.clear();
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp clients:', error);
    }
  }

  async sendMessage(accountId, to, message, attachment = null) {
    try {
      const client = this.clients.get(accountId);
      if (!client) {
        throw new Error(`WhatsApp client ${accountId} not found`);
      }

      let media = null;
      if (attachment) {
        media = await this.createMediaFromFile(attachment);
      }

      const result = await client.sendMessage(to, message, { media });
      
      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error(`Error sending message from account ${accountId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkMessages(accountId, contacts, message, attachment = null) {
    const results = [];
    
    for (const contact of contacts) {
      try {
        const result = await this.sendMessage(accountId, contact, message, attachment);
        results.push({
          contact,
          success: result.success,
          error: result.error
        });
      } catch (error) {
        results.push({
          contact,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async sendMessageFromMultipleAccounts(accountIds, to, message, attachment = null) {
    const results = [];
    
    for (const accountId of accountIds) {
      try {
        const result = await this.sendMessage(accountId, to, message, attachment);
        results.push({
          accountId,
          success: result.success,
          error: result.error
        });
      } catch (error) {
        results.push({
          accountId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async createMediaFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const mimeType = this.getMimeType(fileName);

      return new MessageMedia(mimeType, fileBuffer.toString('base64'), fileName);
    } catch (error) {
      console.error('Error creating media from file:', error);
      throw error;
    }
  }

  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async getChats() {
    try {
      const allChats = [];
      for (const [accountId, client] of this.clients) {
        if (this.connectionStatuses.get(accountId) === 'connected') {
          const chats = await client.getChats();
          allChats.push(...chats.map(chat => ({
            ...chat,
            accountId
          })));
        }
      }
      return allChats;
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  async getMessages(chatId, limit = 50) {
    try {
      for (const [accountId, client] of this.clients) {
        if (this.connectionStatuses.get(accountId) === 'connected') {
          const chat = await client.getChatById(chatId);
          if (chat) {
            const messages = await chat.fetchMessages({ limit });
            return messages;
          }
        }
      }
      return [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  getConnectionStatus(accountId = null) {
    if (accountId) {
      return this.connectionStatuses.get(accountId) || 'disconnected';
    }
    
    const statuses = {};
    for (const [id, status] of this.connectionStatuses) {
      statuses[id] = status;
    }
    return statuses;
  }

  getAllAccounts() {
    return Array.from(this.accounts.keys());
  }

  accountExists(accountId) {
    return this.accounts.has(accountId);
  }

  getAccountStatus(accountId) {
    return {
      exists: this.accountExists(accountId),
      status: this.getConnectionStatus(accountId),
      hasQR: this.qrCodes.has(accountId)
    };
  }

  getMessages() {
    return this.messages;
  }

  setStatusChangeCallback(callback) {
    this.onStatusChange = callback;
  }

  setQRCodeChangeCallback(callback) {
    this.onQRCodeChange = callback;
  }

  setMessageReceivedCallback(callback) {
    this.onMessageReceived = callback;
  }

  setQuickReplySentCallback(callback) {
    this.onQuickReplySent = callback;
  }

  // Quick Reply Management
  addQuickReply(accountId, quickReply) {
    if (!this.quickReplies.has(accountId)) {
      this.quickReplies.set(accountId, []);
    }
    
    const accountReplies = this.quickReplies.get(accountId);
    accountReplies.push(quickReply);
    this.quickReplies.set(accountId, accountReplies);
  }

  removeQuickReply(accountId, quickReplyId) {
    if (this.quickReplies.has(accountId)) {
      const accountReplies = this.quickReplies.get(accountId);
      const filteredReplies = accountReplies.filter(reply => reply.id !== quickReplyId);
      this.quickReplies.set(accountId, filteredReplies);
    }
  }

  updateQuickReply(accountId, quickReplyId, updatedQuickReply) {
    if (this.quickReplies.has(accountId)) {
      const accountReplies = this.quickReplies.get(accountId);
      const updatedReplies = accountReplies.map(reply => 
        reply.id === quickReplyId ? { ...reply, ...updatedQuickReply } : reply
      );
      this.quickReplies.set(accountId, updatedReplies);
    }
  }

  getQuickReplies(accountId) {
    return this.quickReplies.get(accountId) || [];
  }

  addTemplate(accountId, template) {
    if (!this.templates.has(accountId)) {
      this.templates.set(accountId, []);
    }
    
    const accountTemplates = this.templates.get(accountId);
    accountTemplates.push(template);
    this.templates.set(accountId, accountTemplates);
  }

  getTemplates(accountId) {
    return this.templates.get(accountId) || [];
  }

  getTemplate(accountId, templateId) {
    const templates = this.getTemplates(accountId);
    return templates.find(template => template.id === templateId);
  }

  async processQuickReplies(accountId, message) {
    try {
      const quickReplies = this.getQuickReplies(accountId);
      const activeReplies = quickReplies.filter(reply => reply.isActive);
      
      for (const reply of activeReplies) {
        if (await this.shouldTriggerQuickReply(reply, message)) {
          await this.sendQuickReply(accountId, message, reply);
        }
      }
    } catch (error) {
      console.error('Error processing quick replies:', error);
    }
  }

  async shouldTriggerQuickReply(reply, message) {
    // Check trigger type
    switch (reply.trigger) {
      case 'all':
        return true;
      
      case 'specific_user':
        return this.matchesUser(message, reply.userPhone);
      
      case 'keywords':
        return this.matchesKeywords(message, reply.keywords);
      
      default:
        return false;
    }
  }

  isWithinTimeRange(conditions) {
    if (!conditions.timeFrom || !conditions.timeTo) {
      return true;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [fromHour, fromMinute] = conditions.timeFrom.split(':').map(Number);
    const [toHour, toMinute] = conditions.timeTo.split(':').map(Number);
    
    const fromTime = fromHour * 60 + fromMinute;
    const toTime = toHour * 60 + toMinute;
    
    if (fromTime <= toTime) {
      return currentTime >= fromTime && currentTime <= toTime;
    } else {
      // Handle overnight ranges
      return currentTime >= fromTime || currentTime <= toTime;
    }
  }

  isWithinDayRange(conditions) {
    if (!conditions.daysOfWeek || conditions.daysOfWeek.length === 0) {
      return true;
    }
    
    const currentDay = new Date().getDay();
    return conditions.daysOfWeek.includes(currentDay);
  }

  matchesUser(message, userPhone) {
    const messageFrom = message.from.replace('@c.us', '');
    const cleanUserPhone = userPhone.replace(/\D/g, '');
    return messageFrom.includes(cleanUserPhone);
  }

  matchesKeywords(message, keywords) {
    if (!keywords) return false;
    
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
    const messageText = message.body.toLowerCase();
    
    return keywordList.some(keyword => messageText.includes(keyword));
  }

  async sendQuickReply(accountId, originalMessage, reply) {
    try {
      const template = this.getTemplate(accountId, reply.templateId);
      if (!template) {
        console.error(`Template ${reply.templateId} not found for account ${accountId}`);
        return;
      }

      // Apply delay if specified
      if (reply.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, reply.delay * 1000));
      }

      // Send the quick reply
      const result = await this.sendMessage(accountId, originalMessage.from, template.content);

      if (result.success && this.onQuickReplySent) {
        this.onQuickReplySent(accountId, {
          originalMessage: originalMessage,
          quickReply: reply,
          sentMessage: result,
          template: template
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending quick reply:', error);
    }
  }

  // Bulk operations for quick replies
  importQuickReplies(accountId, quickReplies) {
    this.quickReplies.set(accountId, quickReplies);
  }

  exportQuickReplies(accountId) {
    return this.getQuickReplies(accountId);
  }

  // Statistics and monitoring
  getQuickReplyStats(accountId) {
    const quickReplies = this.getQuickReplies(accountId);
    return {
      total: quickReplies.length,
      active: quickReplies.filter(reply => reply.isActive).length,
      inactive: quickReplies.filter(reply => !reply.isActive).length
    };
  }
}

module.exports = WhatsAppService; 