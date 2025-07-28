const { ipcRenderer } = require('electron');

class QuickReplyService {
  constructor() {
    this.quickReplies = new Map();
    this.templates = new Map();
    this.stats = {
      totalReplies: 0,
      activeReplies: 0,
      repliesSent: 0
    };
  }

  // Quick Reply Management
  async addQuickReply(accountId, quickReply) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:add', { accountId, quickReply });
      if (result.success) {
        this.updateLocalQuickReplies(accountId);
      }
      return result;
    } catch (error) {
      console.error('Error adding quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  async updateQuickReply(accountId, quickReplyId, updatedData) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:update', { 
        accountId, 
        quickReplyId, 
        updatedData 
      });
      if (result.success) {
        this.updateLocalQuickReplies(accountId);
      }
      return result;
    } catch (error) {
      console.error('Error updating quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteQuickReply(accountId, quickReplyId) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:delete', { accountId, quickReplyId });
      if (result.success) {
        this.updateLocalQuickReplies(accountId);
      }
      return result;
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  async getQuickReplies(accountId) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:get-all', { accountId });
      if (result.success) {
        this.quickReplies.set(accountId, result.data);
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error getting quick replies:', error);
      return [];
    }
  }

  async toggleQuickReply(accountId, quickReplyId, isActive) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:toggle', { 
        accountId, 
        quickReplyId, 
        isActive 
      });
      if (result.success) {
        this.updateLocalQuickReplies(accountId);
      }
      return result;
    } catch (error) {
      console.error('Error toggling quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  // Template Management
  async getTemplates(accountId) {
    try {
      const result = await ipcRenderer.invoke('template:get-all', { accountId });
      if (result.success) {
        this.templates.set(accountId, result.data);
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async addTemplate(accountId, template) {
    try {
      const result = await ipcRenderer.invoke('template:add', { accountId, template });
      if (result.success) {
        this.updateLocalTemplates(accountId);
      }
      return result;
    } catch (error) {
      console.error('Error adding template:', error);
      return { success: false, error: error.message };
    }
  }

  // Statistics and Monitoring
  async getStats(accountId) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:stats', { accountId });
      if (result.success) {
        this.stats = result.data;
        return result.data;
      }
      return this.stats;
    } catch (error) {
      console.error('Error getting quick reply stats:', error);
      return this.stats;
    }
  }

  async getReplyHistory(accountId, limit = 50) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:history', { accountId, limit });
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error getting reply history:', error);
      return [];
    }
  }

  // Bulk Operations
  async importQuickReplies(accountId, quickReplies) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:import', { accountId, quickReplies });
      if (result.success) {
        this.updateLocalQuickReplies(accountId);
      }
      return result;
    } catch (error) {
      console.error('Error importing quick replies:', error);
      return { success: false, error: error.message };
    }
  }

  async exportQuickReplies(accountId) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:export', { accountId });
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error exporting quick replies:', error);
      return [];
    }
  }

  // Testing and Validation
  async testQuickReply(accountId, quickReplyId, testMessage) {
    try {
      const result = await ipcRenderer.invoke('quick-reply:test', { 
        accountId, 
        quickReplyId, 
        testMessage 
      });
      return result;
    } catch (error) {
      console.error('Error testing quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  async validateQuickReply(quickReply) {
    const errors = [];

    if (!quickReply.name || quickReply.name.trim() === '') {
      errors.push('Quick reply name is required');
    }

    if (!quickReply.templateId) {
      errors.push('Template is required');
    }

    if (quickReply.trigger === 'specific_user' && !quickReply.userPhone) {
      errors.push('User phone number is required for specific user trigger');
    }

    if (quickReply.trigger === 'keywords' && !quickReply.keywords) {
      errors.push('Keywords are required for keyword trigger');
    }

    if (quickReply.delay < 0 || quickReply.delay > 300) {
      errors.push('Delay must be between 0 and 300 seconds');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Local State Management
  updateLocalQuickReplies(accountId) {
    // This would typically refresh the local cache
    // For now, we'll just clear it to force a refresh
    this.quickReplies.delete(accountId);
  }

  updateLocalTemplates(accountId) {
    // This would typically refresh the local cache
    // For now, we'll just clear it to force a refresh
    this.templates.delete(accountId);
  }

  // Event Listeners
  onQuickReplySent(callback) {
    ipcRenderer.on('quick-reply:sent', (event, data) => {
      callback(data);
    });
  }

  onQuickReplyError(callback) {
    ipcRenderer.on('quick-reply:error', (event, data) => {
      callback(data);
    });
  }

  // Utility Methods
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`; // Assuming US numbers
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.length > 11) {
      return `+${cleaned}`;
    }
    
    return phone; // Return original if can't format
  }

  parseKeywords(keywords) {
    if (!keywords) return [];
    return keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
  }

  isTimeInRange(time, fromTime, toTime) {
    if (!fromTime || !toTime) return true;
    
    const current = new Date();
    const [fromHour, fromMinute] = fromTime.split(':').map(Number);
    const [toHour, toMinute] = toTime.split(':').map(Number);
    
    const currentTime = current.getHours() * 60 + current.getMinutes();
    const fromTimeMinutes = fromHour * 60 + fromMinute;
    const toTimeMinutes = toHour * 60 + toMinute;
    
    if (fromTimeMinutes <= toTimeMinutes) {
      return currentTime >= fromTimeMinutes && currentTime <= toTimeMinutes;
    } else {
      // Handle overnight ranges
      return currentTime >= fromTimeMinutes || currentTime <= toTimeMinutes;
    }
  }

  isDayInRange(daysOfWeek) {
    if (!daysOfWeek || daysOfWeek.length === 0) return true;
    
    const currentDay = new Date().getDay();
    return daysOfWeek.includes(currentDay);
  }

  // Cleanup
  removeAllListeners() {
    ipcRenderer.removeAllListeners('quick-reply:sent');
    ipcRenderer.removeAllListeners('quick-reply:error');
  }

  // Process incoming message and check for auto-replies
  async processIncomingMessage(accountId, message) {
    try {
      // Check if auto-reply is enabled
      const autoReplyEnabled = JSON.parse(localStorage.getItem('autoReplyEnabled') || 'true')
      if (!autoReplyEnabled) {
        return
      }

      // Get quick replies for this account
      const quickReplies = await this.getQuickReplies(accountId)
      const activeReplies = quickReplies.filter(reply => reply.isActive)
      
      for (const reply of activeReplies) {
        if (await this.shouldTriggerQuickReply(reply, message)) {
          await this.sendQuickReply(accountId, message, reply)
        }
      }
    } catch (error) {
      console.error('Error processing incoming message for auto-reply:', error)
    }
  }

  // Check if a quick reply should be triggered
  async shouldTriggerQuickReply(reply, message) {
    // Check trigger type
    switch (reply.trigger) {
      case 'all':
        return true
      
      case 'specific_user':
        return this.matchesUser(message, reply.userPhone)
      
      case 'keywords':
        return this.matchesKeywords(message, reply.keywords)
      
      default:
        return false
    }
  }

  // Check if message is from specific user
  matchesUser(message, userPhone) {
    const messageFrom = message.from || message.author
    return messageFrom === userPhone || messageFrom.includes(userPhone.replace(/\D/g, ''))
  }

  // Check if message contains keywords
  matchesKeywords(message, keywords) {
    const messageText = (message.body || message.text || '').toLowerCase()
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase())
    return keywordList.some(keyword => messageText.includes(keyword))
  }

  // Send the auto-reply
  async sendQuickReply(accountId, originalMessage, reply) {
    try {
      // Get template content
      const template = await this.getTemplate(accountId, reply.templateId)
      if (!template) {
        console.error('Template not found for quick reply:', reply.templateId)
        return
      }

      // Add delay if specified
      if (reply.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, reply.delay * 1000))
      }

      // Send the message
      const result = await this.sendMessage(accountId, originalMessage.from, template.content)
      
      if (result.success) {
        // Update reply count
        this.updateReplyCount(reply.id)
        console.log('Auto-reply sent successfully:', reply.name)
      } else {
        console.error('Failed to send auto-reply:', result.error)
      }
    } catch (error) {
      console.error('Error sending auto-reply:', error)
    }
  }

  // Update reply count in localStorage
  updateReplyCount(replyId) {
    try {
      const quickReplies = JSON.parse(localStorage.getItem('quickReplies')) || []
      const updatedReplies = quickReplies.map(reply => 
        reply.id === replyId 
          ? { ...reply, replyCount: (reply.replyCount || 0) + 1 }
          : reply
      )
      localStorage.setItem('quickReplies', JSON.stringify(updatedReplies))
    } catch (error) {
      console.error('Error updating reply count:', error)
    }
  }

  // Get template by ID
  async getTemplate(accountId, templateId) {
    const templates = await this.getTemplates(accountId);
    return templates.find(template => template.id === templateId);
  }

  // Send message (placeholder for browser environment)
  async sendMessage(accountId, to, message) {
    // This is a placeholder for the send message functionality
    // In a real implementation, this would send the message via WhatsApp
    console.log('Sending message:', { accountId, to, message });
    return { success: true };
  }
}

module.exports = QuickReplyService; 