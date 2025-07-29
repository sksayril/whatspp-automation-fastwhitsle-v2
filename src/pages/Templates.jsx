import React, { useState, useEffect } from 'react'
import { 
  Plus,
  PencilSimple,
  Trash,
  Check,
  X,
  WarningCircle,
  Copy,
  ChatText
} from '@phosphor-icons/react'

const Templates = () => {
  const [templates, setTemplates] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    variables: ['name'], // Default variable
    category: 'general'
  })

  const categories = [
    { id: 'general', name: 'General' },
    { id: 'welcome', name: 'Welcome Messages' },
    { id: 'support', name: 'Customer Support' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'followup', name: 'Follow-up' }
  ]

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      if (window.electronAPI?.templates) {
        const result = await window.electronAPI.templates.getAll()
        if (result.success) {
          setTemplates(result.templates)
        } else {
          throw new Error(result.error)
        }
      } else {
        // Browser environment - mock data
        setTemplates([
          {
            id: '1',
            name: 'Welcome Message',
            content: 'Hello {name}, welcome to our service!',
            category: 'welcome',
            variables: ['name'],
            createdAt: new Date().toISOString()
          }
        ])
      }
    } catch (error) {
      setError('Failed to load templates: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (!formData.name || !formData.content) {
        throw new Error('Please fill in all required fields')
      }

      // Extract variables from content (matches {variable})
      const variableMatches = formData.content.match(/\{([^}]+)\}/g) || []
      const extractedVariables = variableMatches.map(v => v.slice(1, -1))
      
      const templateData = {
        ...formData,
        variables: Array.from(new Set([...formData.variables, ...extractedVariables]))
      }

      if (editingId) {
        // Update existing template
        if (window.electronAPI?.templates) {
          const result = await window.electronAPI.templates.update(editingId, templateData)
          if (!result.success) {
            throw new Error(result.error)
          }
        }
        setTemplates(prev => prev.map(template => 
          template.id === editingId ? { ...template, ...templateData } : template
        ))
      } else {
        // Create new template
        if (window.electronAPI?.templates) {
          const result = await window.electronAPI.templates.create(templateData)
          if (!result.success) {
            throw new Error(result.error)
          }
          templateData.id = result.id
        } else {
          templateData.id = Date.now().toString()
        }
        templateData.createdAt = new Date().toISOString()
        setTemplates(prev => [...prev, templateData])
      }

      resetForm()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      if (window.electronAPI?.templates) {
        const result = await window.electronAPI.templates.delete(id)
        if (!result.success) {
          throw new Error(result.error)
        }
      }
      setTemplates(prev => prev.filter(template => template.id !== id))
    } catch (error) {
      setError('Failed to delete template: ' + error.message)
    }
  }

  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      content: template.content,
      variables: template.variables || ['name'],
      category: template.category || 'general'
    })
    setEditingId(template.id)
    setShowAddForm(true)
  }

  const handleDuplicate = (template) => {
    setFormData({
      name: `${template.name} (Copy)`,
      content: template.content,
      variables: template.variables || ['name'],
      category: template.category || 'general'
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      variables: ['name'],
      category: 'general'
    })
    setShowAddForm(false)
    setEditingId(null)
  }

  const previewTemplate = (template) => {
    const previewData = {
      name: 'John Doe',
      company: 'ACME Corp',
      product: 'Premium Service',
      date: new Date().toLocaleDateString()
    }

    let preview = template.content
    template.variables.forEach(variable => {
      preview = preview.replace(
        new RegExp(`{${variable}}`, 'g'),
        previewData[variable] || `{${variable}}`
      )
    })
    return preview
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage message templates</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Template
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <WarningCircle size={20} className="text-red-600 mr-3" />
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

      {/* Template Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Template' : 'Add New Template'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Welcome Message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content
              </label>
              <div className="mb-2 text-sm text-gray-600">
                Available variables: {formData.variables.map(v => `{${v}}`).join(', ')}
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Hello {name}, welcome to our service!"
              />
            </div>

            {/* Preview */}
            {formData.content && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                <div className="text-gray-600">
                  {previewTemplate({ ...formData, id: 'preview' })}
                </div>
              </div>
            )}

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
                {editingId ? 'Update' : 'Create'} Template
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Templates</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {templates.map(template => (
            <div key={template.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {template.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {categories.find(c => c.id === template.category)?.name || 'General'}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-gray-600">
                    {template.content}
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    Variables: {template.variables.map(v => `{${v}}`).join(', ')}
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    Created: {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={20} />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilSimple size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="p-8 text-center">
              <ChatText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first message template to get started
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Template
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Templates 