// Note: This service is designed for Electron backend
// In browser environment, it will use localStorage for data persistence

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
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.add({ accountId, quickReply });
        if (result.success) {
          this.updateLocalQuickReplies(accountId);
        }
        return result;
      } else {
        // Browser environment - save to localStorage
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        const newQuickReply = { ...quickReply, id: Date.now().toString(), accountId };
        quickReplies.push(newQuickReply);
        localStorage.setItem('quickReplies', JSON.stringify(quickReplies));
        return { success: true, data: newQuickReply };
      }
    } catch (error) {
      console.error('Error adding quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  async updateQuickReply(accountId, quickReplyId, updatedData) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.update({ 
          accountId, 
          quickReplyId, 
          updatedData 
        });
        if (result.success) {
          this.updateLocalQuickReplies(accountId);
        }
        return result;
      } else {
        // Browser environment - update in localStorage
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        const updatedReplies = quickReplies.map(reply => 
          reply.id === quickReplyId ? { ...reply, ...updatedData } : reply
        );
        localStorage.setItem('quickReplies', JSON.stringify(updatedReplies));
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteQuickReply(accountId, quickReplyId) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.delete({ accountId, quickReplyId });
        if (result.success) {
          this.updateLocalQuickReplies(accountId);
        }
        return result;
      } else {
        // Browser environment - delete from localStorage
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        const updatedReplies = quickReplies.filter(reply => reply.id !== quickReplyId);
        localStorage.setItem('quickReplies', JSON.stringify(updatedReplies));
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  async getQuickReplies(accountId) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.getAll({ accountId });
        if (result.success) {
          this.quickReplies.set(accountId, result.data);
          return result.data;
        }
        return [];
      } else {
        // Browser environment - get from localStorage
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        return quickReplies.filter(reply => reply.accountId === accountId);
      }
    } catch (error) {
      console.error('Error getting quick replies:', error);
      return [];
    }
  }

  async toggleQuickReply(accountId, quickReplyId, isActive) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.toggle({ 
          accountId, 
          quickReplyId, 
          isActive 
        });
        if (result.success) {
          this.updateLocalQuickReplies(accountId);
        }
        return result;
      } else {
        // Browser environment - toggle in localStorage
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        const updatedReplies = quickReplies.map(reply => 
          reply.id === quickReplyId ? { ...reply, isActive } : reply
        );
        localStorage.setItem('quickReplies', JSON.stringify(updatedReplies));
        return { success: true };
      }
    } catch (error) {
      console.error('Error toggling quick reply:', error);
      return { success: false, error: error.message };
    }
  }

  // Template Management
  async getTemplates(accountId) {
    try {
      if (window.electronAPI && window.electronAPI.template) {
        const result = await window.electronAPI.template.getAll({ accountId });
        if (result.success) {
          this.templates.set(accountId, result.data);
          return result.data;
        }
        return [];
      } else {
        // Browser environment - return mock templates
        return [
          { id: '1', name: 'Welcome Message', content: 'Hello! Thank you for contacting us. How can I help you today?' },
          { id: '2', name: 'Business Hours', content: 'Our business hours are Monday-Friday 9 AM to 6 PM. We\'ll get back to you soon!' },
          { id: '3', name: 'Out of Office', content: 'I\'m currently out of office. I\'ll respond to your message when I return.' },
          { id: '4', name: 'Thank You', content: 'Thank you for your message! We appreciate your business.' }
        ];
      }
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async addTemplate(accountId, template) {
    try {
      if (window.electronAPI && window.electronAPI.template) {
        const result = await window.electronAPI.template.add({ accountId, template });
        if (result.success) {
          this.updateLocalTemplates(accountId);
        }
        return result;
      } else {
        // Browser environment - save to localStorage
        const templates = JSON.parse(localStorage.getItem('templates') || '[]');
        const newTemplate = { ...template, id: Date.now().toString(), accountId };
        templates.push(newTemplate);
        localStorage.setItem('templates', JSON.stringify(templates));
        return { success: true, data: newTemplate };
      }
    } catch (error) {
      console.error('Error adding template:', error);
      return { success: false, error: error.message };
    }
  }

  // Statistics and Monitoring
  async getStats(accountId) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.getStats({ accountId });
        if (result.success) {
          this.stats = result.data;
          return result.data;
        }
        return this.stats;
      } else {
        // Browser environment - calculate from localStorage
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        const accountReplies = quickReplies.filter(reply => reply.accountId === accountId);
        return {
          total: accountReplies.length,
          active: accountReplies.filter(reply => reply.isActive).length,
          inactive: accountReplies.filter(reply => !reply.isActive).length,
          repliesSent: accountReplies.reduce((sum, reply) => sum + (reply.replyCount || 0), 0)
        };
      }
    } catch (error) {
      console.error('Error getting quick reply stats:', error);
      return this.stats;
    }
  }

  async getReplyHistory(accountId, limit = 50) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.getHistory({ accountId, limit });
        return result.success ? result.data : [];
      } else {
        // Browser environment - return empty array for now
        return [];
      }
    } catch (error) {
      console.error('Error getting reply history:', error);
      return [];
    }
  }

  // Bulk Operations
  async importQuickReplies(accountId, quickReplies) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.import({ accountId, quickReplies });
        if (result.success) {
          this.updateLocalQuickReplies(accountId);
        }
        return result;
      } else {
        // Browser environment - save to localStorage
        const existingReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        const newReplies = quickReplies.map(reply => ({ ...reply, accountId }));
        const updatedReplies = [...existingReplies, ...newReplies];
        localStorage.setItem('quickReplies', JSON.stringify(updatedReplies));
        return { success: true };
      }
    } catch (error) {
      console.error('Error importing quick replies:', error);
      return { success: false, error: error.message };
    }
  }

  async exportQuickReplies(accountId) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.export({ accountId });
        return result.success ? result.data : [];
      } else {
        // Browser environment - export from localStorage
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies') || '[]');
        return quickReplies.filter(reply => reply.accountId === accountId);
      }
    } catch (error) {
      console.error('Error exporting quick replies:', error);
      return [];
    }
  }

  // Testing and Validation
  async testQuickReply(accountId, quickReplyId, testMessage) {
    try {
      if (window.electronAPI && window.electronAPI.quickReply) {
        const result = await window.electronAPI.quickReply.test({ 
          accountId, 
          quickReplyId, 
          testMessage 
        });
        return result;
      } else {
        // Browser environment - simulate test
        console.log('Testing quick reply in browser environment:', { accountId, quickReplyId, testMessage });
        return { success: true, message: 'Test completed (browser environment)' };
      }
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
    if (window.electronAPI && window.electronAPI.quickReply) {
      window.electronAPI.quickReply.onSent((data) => {
        callback(data);
      });
    }
  }

  onQuickReplyError(callback) {
    if (window.electronAPI && window.electronAPI.quickReply) {
      window.electronAPI.quickReply.onError((data) => {
        callback(data);
      });
    }
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
    if (window.electronAPI && window.electronAPI.quickReply) {
      window.electronAPI.quickReply.removeAllListeners();
    }
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

export default QuickReplyService; 