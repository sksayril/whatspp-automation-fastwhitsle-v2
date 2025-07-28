import React, { useState } from 'react'
import { 
  FileText, 
  Plus, 
  PencilSimple, 
  Trash, 
  Copy,
  MagnifyingGlass,
  Funnel,
  Calendar,
  User,
  Eye,
  Files
} from '@phosphor-icons/react'

const Templates = () => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Welcome Message',
      content: 'Hi {{name}}, welcome to our service! We\'re excited to have you on board. Your account has been successfully created.',
      category: 'welcome',
      variables: ['name'],
      usageCount: 45,
      createdAt: '2024-01-10',
      isActive: true
    },
    {
      id: 2,
      name: 'Order Confirmation',
      content: 'Hi {{name}}, your order #{{orderId}} has been confirmed! We\'ll notify you when it ships. Total: ₹{{amount}}',
      category: 'order',
      variables: ['name', 'orderId', 'amount'],
      usageCount: 23,
      createdAt: '2024-01-12',
      isActive: true
    },
    {
      id: 3,
      name: 'Follow-up Reminder',
      content: 'Hi {{name}}, just checking in to see how everything is going with your recent order. Let us know if you need anything!',
      category: 'follow-up',
      variables: ['name'],
      usageCount: 18,
      createdAt: '2024-01-14',
      isActive: true
    },
    {
      id: 4,
      name: 'Promotional Offer',
      content: 'Hi {{name}}, we have a special offer just for you! Get {{discount}}% off on your next purchase. Use code: {{code}}',
      category: 'promotional',
      variables: ['name', 'discount', 'code'],
      usageCount: 32,
      createdAt: '2024-01-08',
      isActive: false
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'welcome',
    variables: []
  })

  const categories = [
    { value: 'welcome', label: 'Welcome', color: 'bg-green-100 text-green-800' },
    { value: 'order', label: 'Order', color: 'bg-blue-100 text-blue-800' },
    { value: 'follow-up', label: 'Follow-up', color: 'bg-orange-100 text-orange-800' },
    { value: 'promotional', label: 'Promotional', color: 'bg-purple-100 text-purple-800' },
    { value: 'support', label: 'Support', color: 'bg-red-100 text-red-800' }
  ]

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const extractVariables = (content) => {
    const matches = content.match(/\{\{(\w+)\}\}/g)
    return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '')) : []
  }

  const handleContentChange = (content) => {
    setNewTemplate({
      ...newTemplate,
      content,
      variables: extractVariables(content)
    })
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      alert('Please enter a template name')
      return
    }
    
    if (!newTemplate.content.trim()) {
      alert('Please enter template content')
      return
    }

    const existingTemplate = templates.find(t => t.name.toLowerCase() === newTemplate.name.toLowerCase())
    if (existingTemplate) {
      alert('A template with this name already exists')
      return
    }

    const template = {
      id: Date.now(),
      ...newTemplate,
      name: newTemplate.name.trim(),
      content: newTemplate.content.trim(),
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true
    }
    
    setTemplates([...templates, template])
    setNewTemplate({ name: '', content: '', category: 'welcome', variables: [] })
    setShowCreateModal(false)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setNewTemplate({
      name: template.name,
      content: template.content,
      category: template.category,
      variables: template.variables
    })
    setShowCreateModal(true)
  }

  const handleUpdateTemplate = () => {
    if (!newTemplate.name.trim()) {
      alert('Please enter a template name')
      return
    }
    
    if (!newTemplate.content.trim()) {
      alert('Please enter template content')
      return
    }

    const existingTemplate = templates.find(t => 
      t.id !== editingTemplate.id && 
      t.name.toLowerCase() === newTemplate.name.toLowerCase()
    )
    if (existingTemplate) {
      alert('A template with this name already exists')
      return
    }

    setTemplates(templates.map(template =>
      template.id === editingTemplate.id
        ? { 
            ...template, 
            name: newTemplate.name.trim(),
            content: newTemplate.content.trim(),
            category: newTemplate.category,
            variables: newTemplate.variables
          }
        : template
    ))
    setNewTemplate({ name: '', content: '', category: 'welcome', variables: [] })
    setEditingTemplate(null)
    setShowCreateModal(false)
  }

  const handleDeleteTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (template && window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      setTemplates(templates.filter(template => template.id !== templateId))
    }
  }

  const handleToggleActive = (templateId) => {
    setTemplates(templates.map(template =>
      template.id === templateId
        ? { ...template, isActive: !template.isActive }
        : template
    ))
  }

  const duplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setTemplates([...templates, newTemplate])
  }

  const copyTemplate = (template, event) => {
    navigator.clipboard.writeText(template.content)
      .then(() => {
        if (event && event.target) {
          const button = event.target.closest('button')
          if (button) {
            const originalTitle = button.getAttribute('title')
            button.setAttribute('title', 'Copied!')
            button.style.color = '#10B981'
            
            setTimeout(() => {
              button.setAttribute('title', originalTitle)
              button.style.color = ''
            }, 2000)
          }
        }
      })
      .catch(() => {
        alert('Failed to copy template to clipboard')
      })
  }

  const previewTemplate = (template) => {
    let previewContent = template.content
    
    template.variables.forEach(variable => {
      const sampleData = {
        name: 'John Doe',
        orderId: 'ORD-12345',
        amount: '₹1,299',
        discount: '20',
        code: 'SAVE20',
        email: 'john@example.com',
        phone: '+91 98765 43210',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      }
      
      previewContent = previewContent.replace(
        new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), 
        sampleData[variable] || `[${variable}]`
      )
    })
    
    alert(`Template Preview:\n\n${previewContent}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-600">Create and manage your WhatsApp message templates</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            New Template
          </button>
          <button
            onClick={() => {
              const quickTemplates = [
                {
                  name: 'Quick Welcome',
                  content: 'Hi {{name}}, welcome! Thank you for choosing our service.',
                  category: 'welcome'
                },
                {
                  name: 'Quick Follow-up',
                  content: 'Hi {{name}}, how is everything going? Let us know if you need anything!',
                  category: 'follow-up'
                },
                {
                  name: 'Quick Support',
                  content: 'Hi {{name}}, we\'re here to help! Please let us know your issue.',
                  category: 'support'
                }
              ]
              
              const randomTemplate = quickTemplates[Math.floor(Math.random() * quickTemplates.length)]
              setNewTemplate({
                name: randomTemplate.name,
                content: randomTemplate.content,
                category: randomTemplate.category,
                variables: extractVariables(randomTemplate.content)
              })
              setShowCreateModal(true)
            }}
            className="btn-secondary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Quick Template
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Funnel size={20} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const category = categories.find(c => c.value === template.category)
          return (
            <div key={template.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${category?.color}`}>
                    {category?.label}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => previewTemplate(template)}
                    className="p-1 text-green-400 hover:text-green-600"
                    title="Preview template"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={(e) => copyTemplate(template, e)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy template"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => duplicateTemplate(template)}
                    className="p-1 text-purple-400 hover:text-purple-600"
                    title="Duplicate template"
                  >
                    <Files size={16} />
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1 text-blue-400 hover:text-blue-600"
                    title="Edit template"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete template"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.content}</p>

              <div className="space-y-2">
                {/* Variables */}
                {template.variables.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Variables:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map((variable, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <User size={12} className="mr-1" />
                      {template.usageCount} uses
                    </span>
                    <span className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {template.createdAt}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleActive(template.id)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      template.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="card text-center py-12">
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Create your first template to get started</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Enter template name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                  className="input-field"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content
                </label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter your message content. Use {{variable}} for dynamic content."
                  rows={6}
                  className="input-field resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{{variable}}'} syntax for dynamic content (e.g., {'{{name}}'}, {'{{orderId}}'})
                </p>
              </div>

              {newTemplate.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detected Variables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {newTemplate.variables.map((variable, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingTemplate(null)
                  setNewTemplate({ name: '', content: '', category: 'welcome', variables: [] })
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                className="btn-primary"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Templates 