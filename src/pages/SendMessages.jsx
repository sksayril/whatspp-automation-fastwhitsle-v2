import React, { useState, useEffect } from 'react'
import { 
  ChatCircle, 
  PaperPlane, 
  Users, 
  FileText, 
  Image,
  Paperclip,
  Smiley,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Trash
} from '@phosphor-icons/react'

const SendMessages = () => {
  // Initial data
  const initialRecentMessages = [
    {
      id: 1,
      recipient: '+91 98765 43210',
      message: 'Hi John, welcome to our service!',
      status: 'sent',
      sentAt: '2 minutes ago'
    },
    {
      id: 2,
      recipient: '+91 87654 32109',
      message: 'Thank you for your order!',
      status: 'delivered',
      sentAt: '5 minutes ago'
    },
    {
      id: 3,
      recipient: '+91 76543 21098',
      message: 'Your order has been shipped.',
      status: 'read',
      sentAt: '1 hour ago'
    }
  ]

  const templates = [
    {
      id: 1,
      name: 'Welcome Message',
      content: 'Hi {{name}}, welcome to our service! We\'re excited to have you on board.',
      category: 'welcome'
    },
    {
      id: 2,
      name: 'Follow-up',
      content: 'Hi {{name}}, just checking in to see how everything is going with your order.',
      category: 'follow-up'
    },
    {
      id: 3,
      name: 'Promotional Offer',
      content: 'Hi {{name}}, we have a special offer just for you! Get 20% off on your next purchase.',
      category: 'promotional'
    }
  ]

  // State variables
  const [messageType, setMessageType] = useState('single')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)
  const [recentMessages, setRecentMessages] = useState(initialRecentMessages)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <PaperPlane size={16} className="text-blue-500" />
      case 'delivered': return <CheckCircle size={16} className="text-green-500" />
      case 'read': return <CheckCircle size={16} className="text-blue-600" />
      case 'failed': return <XCircle size={16} className="text-red-500" />
      default: return <Clock size={16} className="text-gray-500" />
    }
  }

  const getFileIcon = (fileName) => {
    if (!fileName || typeof fileName !== 'string') {
      return <FileText size={16} className="text-gray-400" />
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image size={16} className="text-green-500" />
      case 'pdf':
        return <FileText size={16} className="text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText size={16} className="text-blue-500" />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Image size={16} className="text-purple-500" />
      case 'mp3':
      case 'wav':
        return <Image size={16} className="text-orange-500" />
      default:
        return <FileText size={16} className="text-gray-400" />
    }
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setMessage(template.content)
      setSelectedTemplate(templateId)
    }
  }

  const updateMessageStats = (count) => {
    try {
      const stats = JSON.parse(localStorage.getItem('messageStats')) || {
        sentToday: 0,
        sentThisWeek: 0,
        sentThisMonth: 0,
        totalSent: 0
      }
      
      stats.sentToday += count
      stats.sentThisWeek += count
      stats.sentThisMonth += count
      stats.totalSent += count
      
      localStorage.setItem('messageStats', JSON.stringify(stats))
    } catch (error) {
      console.error('Error updating message stats:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !recipients.trim()) {
      alert('Please enter both message and recipients')
      return
    }

    if (!selectedAccount) {
      alert('Please select a WhatsApp account to send from')
      return
    }

    setIsSending(true)
    setSendStatus(null)

    try {
      const recipientList = recipients.split(',').map(r => r.trim())
      
      // Get the first attachment path if any
      const attachmentPath = attachments.length > 0 ? attachments[0].path : null
      
      if (messageType === 'single') {
        // Send single message
        const result = await window.electronAPI.whatsapp.sendMessage(selectedAccount, recipientList[0], message, attachmentPath)
        
        if (result.success) {
          setSendStatus({ type: 'success', message: 'Message sent successfully!' })
          
          // Update message statistics
          updateMessageStats(1)
          
          // Add to recent messages
          const newMessage = {
            id: Date.now(),
            recipient: recipientList[0],
            message: message,
            status: 'sent',
            sentAt: 'Just now',
            hasAttachment: !!attachmentPath
          }
          setRecentMessages([newMessage, ...recentMessages.slice(0, 9)]) // Keep only 10 recent messages
        } else {
          setSendStatus({ type: 'error', message: result.error || 'Failed to send message' })
        }
      } else {
        // Send bulk messages
        const result = await window.electronAPI.whatsapp.sendBulk(selectedAccount, recipientList, message, attachmentPath)
        
        if (result.success) {
          const successCount = result.results.filter(r => r.success).length
          setSendStatus({ 
            type: 'success', 
            message: `Bulk message sent! ${successCount}/${recipientList.length} messages delivered.` 
          })
          
          // Update message statistics
          updateMessageStats(successCount)
          
          // Add bulk messages to recent messages
          const newMessages = result.results.map((r, index) => ({
            id: Date.now() + index,
            recipient: r.contact,
            message: message,
            status: r.success ? 'sent' : 'failed',
            sentAt: 'Just now',
            hasAttachment: !!attachmentPath
          }))
          setRecentMessages([...newMessages, ...recentMessages.slice(0, 10 - newMessages.length)])
        } else {
          setSendStatus({ type: 'error', message: result.error || 'Failed to send bulk messages' })
        }
      }

      // Clear form on success
      if (sendStatus?.type === 'success') {
        setMessage('')
        setRecipients('')
        setScheduledTime('')
        setIsScheduled(false)
        setAttachments([])
        setSelectedTemplate('')
      }
    } catch (error) {
      setSendStatus({ type: 'error', message: error.message || 'Failed to send message' })
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    setIsUploading(true)
    
    try {
      for (const file of files) {
        // Convert file to base64
        const base64 = await fileToBase64(file)
        
        // Save file to temp directory
        const result = await window.electronAPI.whatsapp.saveFile(base64, file.name)
        
        if (result.success) {
          const fileWithPath = {
            ...file,
            path: result.filePath,
            name: file.name,
            size: file.size,
            type: file.type
          }
          setAttachments(prev => [...prev, fileWithPath])
        } else {
          console.error('Failed to save file:', result.error)
        }
      }
    } catch (error) {
      console.error('Error processing file:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result.split(',')[1] // Remove data:image/jpeg;base64, prefix
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  // Load accounts on component mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        if (window.electronAPI?.whatsapp) {
          const accountsList = await window.electronAPI.whatsapp.getAllAccounts()
          setAccounts(accountsList)
          // Auto-select first connected account
          const connectedAccount = accountsList.find(acc => acc.isConnected)
          if (connectedAccount) {
            setSelectedAccount(connectedAccount.id)
          }
        } else {
          // Fallback for browser environment
          console.log('Running in browser environment, using mock data')
          const mockAccounts = [
            { id: 'account_1', name: 'Demo Account 1', phone: '+1234567890', isConnected: true },
            { id: 'account_2', name: 'Demo Account 2', phone: '+0987654321', isConnected: false }
          ]
          setAccounts(mockAccounts)
          setSelectedAccount('account_1')
        }
      } catch (error) {
        console.error('Error loading accounts:', error)
        // Set fallback data on error
        const mockAccounts = [
          { id: 'account_1', name: 'Demo Account 1', phone: '+1234567890', isConnected: true },
          { id: 'account_2', name: 'Demo Account 2', phone: '+0987654321', isConnected: false }
        ]
        setAccounts(mockAccounts)
        setSelectedAccount('account_1')
      }
    }

    loadAccounts()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Messages</h1>
        <p className="text-gray-600">Compose and send WhatsApp messages to your contacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Composition */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Selection */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Select WhatsApp Account</h2>
              <button
                onClick={() => {
                  const loadAccounts = async () => {
                    try {
                      if (window.electronAPI?.whatsapp) {
                        const accountsList = await window.electronAPI.whatsapp.getAllAccounts()
                        setAccounts(accountsList)
                        const connectedAccount = accountsList.find(acc => acc.isConnected)
                        if (connectedAccount) {
                          setSelectedAccount(connectedAccount.id)
                        }
                      } else {
                        // Fallback for browser environment
                        console.log('Running in browser environment, using mock data')
                        const mockAccounts = [
                          { id: 'account_1', name: 'Demo Account 1', phone: '+1234567890', isConnected: true },
                          { id: 'account_2', name: 'Demo Account 2', phone: '+0987654321', isConnected: false }
                        ]
                        setAccounts(mockAccounts)
                        setSelectedAccount('account_1')
                      }
                    } catch (error) {
                      console.error('Error loading accounts:', error)
                      // Set fallback data on error
                      const mockAccounts = [
                        { id: 'account_1', name: 'Demo Account 1', phone: '+1234567890', isConnected: true },
                        { id: 'account_2', name: 'Demo Account 2', phone: '+0987654321', isConnected: false }
                      ]
                      setAccounts(mockAccounts)
                      setSelectedAccount('account_1')
                    }
                  }
                  loadAccounts()
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
            {accounts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">No WhatsApp accounts connected</p>
                <p className="text-sm text-gray-500">Go to "Connect WhatsApp" to add accounts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <label key={account.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
                    <input
                      type="radio"
                      value={account.id}
                      checked={selectedAccount === account.id}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="mr-3"
                      disabled={!account.isConnected}
                    />
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${account.isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <span className="font-medium text-gray-900">{account.name}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${account.isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {account.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Message Type Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Type</h2>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="single"
                  checked={messageType === 'single'}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Single Message</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bulk"
                  checked={messageType === 'bulk'}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Bulk Message</span>
              </label>
            </div>
          </div>

          {/* Message Composition */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h2>
            
            {/* Template Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Use Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(parseInt(e.target.value))}
                className="input-field"
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="input-field resize-none"
                />
                <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Smiley size={20} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Paperclip size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(file.name)}
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Attachments
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="input-field"
                  accept="image/*,.pdf,.doc,.docx"
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading...
                  </div>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {messageType === 'single' ? 'Phone Number' : 'Phone Numbers (comma separated)'}
              </label>
              <input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder={messageType === 'single' ? '+91 98765 43210' : '+91 98765 43210, +91 87654 32109'}
                className="input-field"
              />
            </div>

            {/* Scheduling */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Schedule Message</span>
              </label>
              {isScheduled && (
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input-field mt-2"
                />
              )}
            </div>

            {/* Status Display */}
            {sendStatus && (
              <div className={`mb-4 p-3 rounded-lg ${
                sendStatus.type === 'success' 
                  ? 'bg-green-100 border border-green-400 text-green-700' 
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {sendStatus.message}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={isSending}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <PaperPlane size={20} className="mr-2" />
                  {isScheduled ? 'Schedule Message' : 'Send Message'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Templates and Recent Messages */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Templates</h2>
            <div className="space-y-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                    {template.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h2>
            <div className="space-y-3">
              {recentMessages.map(msg => (
                <div key={msg.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{msg.recipient}</span>
                    {getStatusIcon(msg.status)}
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    {msg.hasAttachment && (
                      <Paperclip size={12} className="text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{msg.sentAt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SendMessages 