const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const QuickReplyService = require('./quickReplyService')
const TemplateService = require('./templateService')

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
    this.quickReplyService = new QuickReplyService()
    this.templateService = new TemplateService()
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

      // Process quick replies
      await this.handleIncomingMessage(accountId, message)
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

    // Authentication failure
    client.on('auth_failure', () => {
      this.connectionStatuses.set(accountId, 'auth_failed');
      
      if (this.onStatusChange) {
        this.onStatusChange(accountId, 'auth_failed');
      }
      console.log(`WhatsApp authentication failed for ${accountId}`);
    });

    this.clients.set(accountId, client);
    return client;
  }

  async connect(accountId, accountName = '') {
    try {
      console.log(`Connecting account ${accountId} with name ${accountName}`);
      
      // Check if account already exists and is connected
      const existingStatus = this.connectionStatuses.get(accountId);
      if (existingStatus === 'connected') {
        console.log(`Account ${accountId} is already connected`);
        return true;
      }
      
      let client = this.clients.get(accountId);
      
      if (!client) {
        console.log(`Initializing new client for account ${accountId}`);
        client = this.initialize(accountId, accountName);
      }
      
      console.log(`Initializing client for account ${accountId}`);
      await client.initialize();
      console.log(`Client initialized for account ${accountId}`);
      return true;
    } catch (error) {
      console.error(`Error connecting to WhatsApp for account ${accountId}:`, error);
      this.connectionStatuses.set(accountId, 'error');
      if (this.onStatusChange) {
        this.onStatusChange(accountId, 'error');
      }
      return false;
    }
  }

  async disconnect(accountId = null) {
    try {
      if (accountId) {
        // Disconnect specific account
        const client = this.clients.get(accountId);
        if (client) {
          await client.destroy();
          this.clients.delete(accountId);
          this.connectionStatuses.set(accountId, 'disconnected');
          if (this.onStatusChange) {
            this.onStatusChange(accountId, 'disconnected');
          }
        }
      } else {
        // Disconnect all accounts
        for (const [id, client] of this.clients) {
          await client.destroy();
        }
        this.clients.clear();
        this.connectionStatuses.clear();
        this.qrCodes.clear();
      }
    } catch (error) {
      console.error('Error disconnecting from WhatsApp:', error);
    }
  }

  async sendMessage(accountId, to, message, attachment = null) {
    try {
      const client = this.clients.get(accountId);
      if (!client) {
        throw new Error(`WhatsApp account ${accountId} not found`);
      }

      const status = this.connectionStatuses.get(accountId);
      if (status !== 'connected') {
        throw new Error(`WhatsApp account ${accountId} is not connected (status: ${status})`);
      }

      // Format phone number
      const formattedNumber = to.replace(/\D/g, '');
      const chatId = `${formattedNumber}@c.us`;

      let result;

      if (attachment) {
        // Send message with attachment
        const media = await client.sendMessage(chatId, attachment, {
          caption: message || ''
        });
        result = media;
      } else {
        // Send text message only
        result = await client.sendMessage(chatId, message);
      }

      return {
        success: true,
        accountId: accountId,
        messageId: result.id._serialized,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error(`Error sending message from account ${accountId}:`, error);
      return {
        success: false,
        accountId: accountId,
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
          ...result
        });
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
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
          ...result
        });
        
        // Add delay between accounts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
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
        throw new Error('File not found');
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();

      // Determine MIME type based on file extension
      let mimeType;
      switch (fileExtension) {
        case '.jpg':
        case '.jpeg':
          mimeType = 'image/jpeg';
          break;
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.pdf':
          mimeType = 'application/pdf';
          break;
        case '.doc':
          mimeType = 'application/msword';
          break;
        case '.docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.mp4':
          mimeType = 'video/mp4';
          break;
        case '.mp3':
          mimeType = 'audio/mpeg';
          break;
        default:
          mimeType = 'application/octet-stream';
      }

      const media = new MessageMedia(mimeType, fileBuffer.toString('base64'), fileName);
      return media;
    } catch (error) {
      console.error('Error creating media from file:', error);
      throw error;
    }
  }

  async getChats() {
    try {
      if (!this.isConnected || !this.client) {
        throw new Error('WhatsApp not connected');
      }
      
      const chats = await this.client.getChats();
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body,
          timestamp: chat.lastMessage.timestamp
        } : null
      }));
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  async getMessages(chatId, limit = 50) {
    try {
      if (!this.isConnected || !this.client) {
        throw new Error('WhatsApp not connected');
      }
      
      const chat = await this.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });
      
      return messages.map(message => ({
        id: message.id._serialized,
        from: message.from,
        body: message.body,
        timestamp: message.timestamp,
        type: message.type,
        isFromMe: message.fromMe
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  getConnectionStatus(accountId = null) {
    if (accountId) {
      // Get status for specific account
      return {
        accountId: accountId,
        isConnected: this.connectionStatuses.get(accountId) === 'connected',
        status: this.connectionStatuses.get(accountId) || 'disconnected',
        qrCode: this.qrCodes.get(accountId) || null
      };
    } else {
      // Get status for all accounts
      const allStatuses = {};
      for (const [id, status] of this.connectionStatuses) {
        allStatuses[id] = {
          accountId: id,
          isConnected: status === 'connected',
          status: status,
          qrCode: this.qrCodes.get(id) || null,
          name: this.accounts.get(id)?.name || `Account ${id}`
        };
      }
      return allStatuses;
    }
  }

  getAllAccounts() {
    const accounts = [];
    for (const [id, account] of this.accounts) {
      accounts.push({
        id: id,
        name: account.name,
        status: this.connectionStatuses.get(id) || 'disconnected',
        isConnected: this.connectionStatuses.get(id) === 'connected'
      });
    }
    return accounts;
  }

  accountExists(accountId) {
    return this.accounts.has(accountId) || this.clients.has(accountId);
  }

  getAccountStatus(accountId) {
    return {
      exists: this.accountExists(accountId),
      status: this.connectionStatuses.get(accountId) || 'disconnected',
      isConnected: this.connectionStatuses.get(accountId) === 'connected',
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

  // Quick Reply Management Methods
  addQuickReply(accountId, quickReply) {
    if (!this.quickReplies.has(accountId)) {
      this.quickReplies.set(accountId, []);
    }
    const accountQuickReplies = this.quickReplies.get(accountId);
    accountQuickReplies.push(quickReply);
    this.quickReplies.set(accountId, accountQuickReplies);
  }

  removeQuickReply(accountId, quickReplyId) {
    if (this.quickReplies.has(accountId)) {
      const accountQuickReplies = this.quickReplies.get(accountId);
      const filteredReplies = accountQuickReplies.filter(reply => reply.id !== quickReplyId);
      this.quickReplies.set(accountId, filteredReplies);
    }
  }

  updateQuickReply(accountId, quickReplyId, updatedQuickReply) {
    if (this.quickReplies.has(accountId)) {
      const accountQuickReplies = this.quickReplies.get(accountId);
      const updatedReplies = accountQuickReplies.map(reply => 
        reply.id === quickReplyId ? { ...reply, ...updatedQuickReply } : reply
      );
      this.quickReplies.set(accountId, updatedReplies);
    }
  }

  getQuickReplies(accountId) {
    return this.quickReplies.get(accountId) || [];
  }

  // Template Management Methods
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

  // Quick Reply Processing Logic
  async processQuickReplies(accountId, message) {
    try {
      const quickReplies = this.getQuickReplies(accountId);
      const activeReplies = quickReplies.filter(reply => reply.isActive);

      for (const reply of activeReplies) {
        if (await this.shouldTriggerQuickReply(reply, message)) {
          // Check if this is a response to a numbered template
          if (reply.numberedOptions && reply.numberedOptions.length > 0) {
            const selectedNumber = parseInt(message.body.trim());
            if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= reply.numberedOptions.length) {
              // User selected a valid number, send the corresponding response
              const selectedOption = reply.numberedOptions[selectedNumber - 1];
              await this.sendMessage(accountId, message.from, selectedOption.response);
            } else {
              // Send the template with numbered options
              const template = this.getTemplate(accountId, reply.templateId);
              if (template) {
                let fullMessage = template.content + '\n\nPlease select an option:\n';
                reply.numberedOptions.forEach(option => {
                  fullMessage += `${option.number}. ${option.response}\n`;
                });
                await this.sendMessage(accountId, message.from, fullMessage);
              }
            }
          } else {
            // Regular quick reply without numbered options
            await this.sendQuickReply(accountId, message, reply);
          }
          break; // Only send one quick reply per message
        }
      }
    } catch (error) {
      console.error('Error processing quick replies:', error);
    }
  }

  async handleIncomingMessage(accountId, message) {
    try {
      // Don't process our own messages
      if (message.fromMe) {
        console.log('Skipping own message')
        return
      }

      console.log('Processing incoming message:', {
        from: message.from,
        body: message.body,
        accountId: accountId
      })

      // Get all active quick replies
      const result = await this.quickReplyService.getAll()
      if (!result.success) {
        console.error('Failed to get quick replies:', result.error)
        return
      }

      console.log('Found quick replies:', result.quickReplies.length)
      const activeQuickReplies = result.quickReplies.filter(qr => qr.isActive)
      console.log('Active quick replies:', activeQuickReplies.length)

      // First check if this is a response to a numbered option
      for (const quickReply of activeQuickReplies) {
        if (!quickReply.options || quickReply.options.length === 0) continue

        const selectedNumber = parseInt(message.body.trim())
        if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= quickReply.options.length) {
          console.log('Processing number selection:', selectedNumber)
          const selectedOption = quickReply.options[selectedNumber - 1]
          const optionTemplateResult = await this.templateService.getById(selectedOption.responseTemplateId)
          
          if (optionTemplateResult.success && optionTemplateResult.template) {
            console.log('Sending option response for number:', selectedNumber)
            await this.sendMessage(accountId, message.from, optionTemplateResult.template.content)
            await this.quickReplyService.updateStats(quickReply.id, true)
            return // Exit after handling number response
          }
        }
      }

      // Then check for trigger matches
      for (const quickReply of activeQuickReplies) {
        console.log('Checking quick reply:', quickReply.name)
        const shouldTrigger = await this.shouldTriggerQuickReply(quickReply, message)
        
        if (shouldTrigger) {
          console.log('Quick reply triggered:', quickReply.name)
          // Get the initial template
          const templateResult = await this.templateService.getById(quickReply.templateId)
          if (!templateResult.success || !templateResult.template) {
            console.error('Failed to get template:', quickReply.templateId)
            continue
          }

          // Build the message with options
          let messageContent = templateResult.template.content

          if (quickReply.options && quickReply.options.length > 0) {
            messageContent += '\n\nPlease select an option:\n'
            for (const option of quickReply.options) {
              const optionTemplateResult = await this.templateService.getById(option.responseTemplateId)
              if (optionTemplateResult.success && optionTemplateResult.template) {
                messageContent += `${option.number}. ${optionTemplateResult.template.name}\n`
              }
            }
          }

          // Add delay if specified
          if (quickReply.delay > 0) {
            console.log('Applying delay:', quickReply.delay)
            await new Promise(resolve => setTimeout(resolve, quickReply.delay * 1000))
          }

          console.log('Sending quick reply message:', messageContent)
          const sendResult = await this.sendMessage(accountId, message.from, messageContent)
          
          if (sendResult.success) {
            console.log('Quick reply message sent successfully')
            await this.quickReplyService.updateStats(quickReply.id, true)
          } else {
            console.error('Failed to send quick reply message:', sendResult.error)
          }
          
          break // Only trigger one quick reply per message
        }
      }
    } catch (error) {
      console.error('Error handling incoming message:', error)
    }
  }

  async shouldTriggerQuickReply(quickReply, message) {
    try {
      console.log('Checking trigger conditions for:', quickReply.name)
      
      // Check time restrictions
      if (quickReply.timeFrom && quickReply.timeTo) {
        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()
        
        const [fromHour, fromMinute] = quickReply.timeFrom.split(':').map(Number)
        const [toHour, toMinute] = quickReply.timeTo.split(':').map(Number)
        
        const fromTime = fromHour * 60 + fromMinute
        const toTime = toHour * 60 + toMinute
        
        if (fromTime <= toTime) {
          if (currentTime < fromTime || currentTime > toTime) {
            console.log('Outside time range')
            return false
          }
        } else {
          // Handle overnight ranges (e.g., 22:00 to 06:00)
          if (currentTime < fromTime && currentTime > toTime) {
            console.log('Outside overnight time range')
            return false
          }
        }
      }

      // Check day restrictions
      if (quickReply.daysOfWeek && quickReply.daysOfWeek.length > 0) {
        const currentDay = new Date().getDay()
        if (!quickReply.daysOfWeek.includes(currentDay)) {
          console.log('Outside day range')
          return false
        }
      }

      // Check trigger type
      console.log('Checking trigger type:', quickReply.triggerType)
      switch (quickReply.triggerType) {
        case 'all':
          console.log('Trigger type: all - always true')
          return true

        case 'keywords':
          if (!quickReply.triggerPattern) {
            console.log('No trigger pattern for keywords')
            return false
          }
          const keywords = quickReply.triggerPattern.toLowerCase().split(',').map(k => k.trim())
          const messageText = message.body.toLowerCase()
          const matches = keywords.some(keyword => messageText.includes(keyword))
          console.log('Keyword match result:', matches, 'for keywords:', keywords)
          return matches

        case 'specific_user':
          if (!quickReply.triggerPattern) {
            console.log('No trigger pattern for specific user')
            return false
          }
          const userPhone = message.from.replace('@c.us', '')
          const userMatch = userPhone === quickReply.triggerPattern
          console.log('User match result:', userMatch, 'for user:', userPhone)
          return userMatch

        default:
          console.log('Unknown trigger type:', quickReply.triggerType)
          return false
      }
    } catch (error) {
      console.error('Error checking quick reply trigger:', error)
      return false
    }
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