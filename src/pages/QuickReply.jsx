import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash, 
  PencilSimple, 
  Check, 
  X, 
  User, 
  ChatText, 
  Clock,
  ToggleLeft,
  ToggleRight,
  Warning,
  Play,
  Pause,
  Export,
  Upload,
  ChartLine
} from '@phosphor-icons/react'

const QuickReply = () => {
  try {
    const [quickReplies, setQuickReplies] = useState([])
    const [templates, setTemplates] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [selectedAccount, setSelectedAccount] = useState('default')
    const [stats, setStats] = useState({
      total: 0,
      active: 0,
      inactive: 0,
      repliesSent: 0
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
      name: '',
      trigger: 'all', // all, specific_user, keywords
      userPhone: '',
      keywords: '',
      templateId: '',
      delay: 0,
      isActive: true,
      conditions: {
        timeFrom: '',
        timeTo: '',
        daysOfWeek: []
      },
      numberedOptions: [] // Add this new field
    })

    const daysOfWeek = [
      { id: 0, name: 'Sunday', short: 'Sun' },
      { id: 1, name: 'Monday', short: 'Mon' },
      { id: 2, name: 'Tuesday', short: 'Tue' },
      { id: 3, name: 'Wednesday', short: 'Wed' },
      { id: 4, name: 'Thursday', short: 'Thu' },
      { id: 5, name: 'Friday', short: 'Fri' },
      { id: 6, name: 'Saturday', short: 'Sat' }
    ]

    // Load data on component mount
    useEffect(() => {
      loadData()
    }, [selectedAccount])

    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check if we're running in Electron
        if (window.electronAPI && window.electronAPI.whatsapp) {
          // In a real app, these would be API calls to the main process
          // For now, we'll use sample data
          setTemplates([
            { id: '1', name: 'Welcome Message', content: 'Hello! Thank you for contacting us. How can I help you today?' },
            { id: '2', name: 'Business Hours', content: 'Our business hours are Monday-Friday 9 AM to 6 PM. We\'ll get back to you soon!' },
            { id: '3', name: 'Out of Office', content: 'I\'m currently out of office. I\'ll respond to your message when I return.' },
            { id: '4', name: 'Thank You', content: 'Thank you for your message! We appreciate your business.' }
          ])
        } else {
          // Fallback for browser environment
          console.log('Running in browser environment, using mock data')
          setTemplates([
            { id: '1', name: 'Welcome Message', content: 'Hello! Thank you for contacting us. How can I help you today?' },
            { id: '2', name: 'Business Hours', content: 'Our business hours are Monday-Friday 9 AM to 6 PM. We\'ll get back to you soon!' },
            { id: '3', name: 'Out of Office', content: 'I\'m currently out of office. I\'ll respond to your message when I return.' },
            { id: '4', name: 'Thank You', content: 'Thank you for your message! We appreciate your business.' }
          ])
        }
        
        // Update stats
        setStats({
          total: quickReplies.length,
          active: quickReplies.filter(reply => reply.isActive).length,
          inactive: quickReplies.filter(reply => !reply.isActive).length,
          repliesSent: Math.floor(Math.random() * 100) // Sample data
        })
      } catch (err) {
        setError('Failed to load data')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    const handleSubmit = (e) => {
      e.preventDefault()
      
      if (editingId) {
        // Update existing quick reply
        setQuickReplies(prev => prev.map(item => 
          item.id === editingId ? { ...formData, id: editingId } : item
        ))
        setEditingId(null)
      } else {
        // Add new quick reply
        const newQuickReply = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
        setQuickReplies(prev => [...prev, newQuickReply])
      }
      
      resetForm()
    }

    const handleEdit = (quickReply) => {
      setFormData(quickReply)
      setEditingId(quickReply.id)
      setShowAddForm(true)
    }

    const handleDelete = (id) => {
      setQuickReplies(prev => prev.filter(item => item.id !== id))
    }

    const handleToggleActive = (id) => {
      setQuickReplies(prev => prev.map(item => 
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ))
    }

    const resetForm = () => {
      setFormData({
        name: '',
        trigger: 'all',
        userPhone: '',
        keywords: '',
        templateId: '',
        delay: 0,
        isActive: true,
        conditions: {
          timeFrom: '',
          timeTo: '',
          daysOfWeek: []
        },
        numberedOptions: [] // Reset numbered options
      })
      setShowAddForm(false)
      setEditingId(null)
    }

    const toggleDayOfWeek = (dayId) => {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          daysOfWeek: prev.conditions.daysOfWeek.includes(dayId)
            ? prev.conditions.daysOfWeek.filter(id => id !== dayId)
            : [...prev.conditions.daysOfWeek, dayId]
        }
      }))
    }

    const addNumberedOption = () => {
      setFormData(prev => ({
        ...prev,
        numberedOptions: [
          ...prev.numberedOptions,
          { number: prev.numberedOptions.length + 1, response: '' }
        ]
      }))
    }

    const updateNumberedOption = (index, response) => {
      setFormData(prev => ({
        ...prev,
        numberedOptions: prev.numberedOptions.map((option, i) => 
          i === index ? { ...option, response } : option
        )
      }))
    }

    const removeNumberedOption = (index) => {
      setFormData(prev => ({
        ...prev,
        numberedOptions: prev.numberedOptions
          .filter((_, i) => i !== index)
          .map((option, i) => ({ ...option, number: i + 1 }))
      }))
    }

    const getTemplateName = (templateId) => {
      const template = templates.find(t => t.id === templateId)
      return template ? template.name : 'Unknown Template'
    }

    const getTriggerText = (trigger, userPhone, keywords) => {
      switch (trigger) {
        case 'all':
          return 'All messages'
        case 'specific_user':
          return `Specific user: ${userPhone}`
        case 'keywords':
          return `Keywords: ${keywords}`
        default:
          return 'Unknown trigger'
      }
    }

    const handleExport = () => {
      const dataStr = JSON.stringify(quickReplies, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quick-replies-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }

    const handleImport = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedReplies = JSON.parse(e.target.result)
            setQuickReplies(importedReplies)
          } catch (error) {
            setError('Invalid file format')
          }
        }
        reader.readAsText(file)
      }
    }

    const handleTestReply = (quickReply) => {
      // In a real app, this would send a test message
      alert(`Testing quick reply: ${quickReply.name}`)
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Reply</h1>
            <p className="text-gray-600 mt-1">Set up automatic replies for incoming messages</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Export Quick Replies"
            >
              <Export size={18} className="mr-2" />
              Export
            </button>
            <label className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              <Upload size={18} className="mr-2" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add Quick Reply
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartLine size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Pause size={24} className="text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChatText size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Replies Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.repliesSent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <Warning size={20} className="text-red-600 mr-3" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Quick Reply Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Quick Reply' : 'Add New Quick Reply'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Reply Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Welcome Auto Reply"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reply Template
                  </label>
                  <select
                    value={formData.templateId}
                    onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trigger Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={formData.trigger === 'all'}
                      onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                      className="mr-3"
                    />
                    <span>Reply to all messages</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="specific_user"
                      checked={formData.trigger === 'specific_user'}
                      onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                      className="mr-3"
                    />
                    <span>Reply to specific user</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="keywords"
                      checked={formData.trigger === 'keywords'}
                      onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                      className="mr-3"
                    />
                    <span>Reply when keywords are found</span>
                  </label>
                </div>
              </div>

              {/* Conditional Fields */}
              {formData.trigger === 'specific_user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.userPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, userPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., +1234567890"
                    required
                  />
                </div>
              )}

              {formData.trigger === 'keywords' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., help, support, question"
                    required
                  />
                </div>
              )}

              {/* Timing Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reply Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={formData.delay}
                    onChange={(e) => setFormData(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time From
                  </label>
                  <input
                    type="time"
                    value={formData.conditions.timeFrom}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      conditions: { ...prev.conditions, timeFrom: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time To
                  </label>
                  <input
                    type="time"
                    value={formData.conditions.timeTo}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      conditions: { ...prev.conditions, timeTo: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        formData.conditions.daysOfWeek.includes(day.id)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numbered Response Options */}
              {formData.templateId && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Numbered Response Options
                    </label>
                    <button
                      type="button"
                      onClick={addNumberedOption}
                      className="flex items-center px-3 py-1 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Option
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.numberedOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-lg">
                          {option.number}
                        </span>
                        <input
                          type="text"
                          value={option.response}
                          onChange={(e) => updateNumberedOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={`Response for option ${option.number}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeNumberedOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {formData.numberedOptions.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                        <div className="text-sm text-gray-600">
                          {templates.find(t => t.id === formData.templateId)?.content}
                          {formData.numberedOptions.length > 0 && (
                            <>
                              <br /><br />
                              Please select an option:<br />
                              {formData.numberedOptions.map(option => (
                                <div key={option.number}>
                                  {option.number}. {option.response}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Active Status */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className="flex items-center"
                >
                  {formData.isActive ? (
                    <ToggleRight size={24} className="text-primary-600" />
                  ) : (
                    <ToggleLeft size={24} className="text-gray-400" />
                  )}
                </button>
                <span className="ml-2 text-sm text-gray-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Create'} Quick Reply
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Replies List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Reply Rules</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your automatic reply rules and their status
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading quick replies...</p>
            </div>
          ) : quickReplies.length === 0 ? (
            <div className="p-8 text-center">
              <ChatText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quick Replies Set</h3>
              <p className="text-gray-600 mb-4">
                Create your first quick reply rule to automatically respond to incoming messages
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Quick Reply
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {quickReplies.map((quickReply) => (
                <div key={quickReply.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {quickReply.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          quickReply.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {quickReply.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <ChatText size={16} className="mr-2" />
                          <span>
                            Template: {getTemplateName(quickReply.templateId)}
                            {quickReply.numberedOptions?.length > 0 && (
                              <span className="ml-2 text-gray-500">
                                ({quickReply.numberedOptions.length} response options)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <User size={16} className="mr-2" />
                          <span>Trigger: {getTriggerText(quickReply.trigger, quickReply.userPhone, quickReply.keywords)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2" />
                          <span>Delay: {quickReply.delay}s</span>
                        </div>
                        <div className="flex items-center">
                          <span>Created: {new Date(quickReply.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Conditions Display */}
                      {(quickReply.conditions.timeFrom || quickReply.conditions.timeTo || quickReply.conditions.daysOfWeek.length > 0) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions:</h4>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {quickReply.conditions.timeFrom && quickReply.conditions.timeTo && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                Time: {quickReply.conditions.timeFrom} - {quickReply.conditions.timeTo}
                              </span>
                            )}
                            {quickReply.conditions.daysOfWeek.length > 0 && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                Days: {quickReply.conditions.daysOfWeek.map(id => 
                                  daysOfWeek.find(d => d.id === id)?.short
                                ).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTestReply(quickReply)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Test Quick Reply"
                      >
                        <Play size={20} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(quickReply.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          quickReply.isActive 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={quickReply.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {quickReply.isActive ? <Check size={20} /> : <X size={20} />}
                      </button>
                      <button
                                        onClick={() => handleEdit(quickReply)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <PencilSimple size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(quickReply.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Warning size={20} className="text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">How Quick Replies Work</h3>
              <p className="text-sm text-blue-700">
                Quick replies automatically respond to incoming messages based on your configured rules. 
                You can set triggers for all messages, specific users, or keyword-based responses. 
                Timing conditions allow you to control when auto-replies are active.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('Error rendering QuickReply component:', err)
    return (
      <div className="p-8 text-center">
        <Warning size={48} className="mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Quick Replies</h3>
        <p className="text-red-700">
          An unexpected error occurred while loading or displaying quick replies.
          Please try refreshing the page or contact support.
        </p>
      </div>
    )
  }
}

export default QuickReply 