import React, { useState, useEffect } from 'react'
import { 
  Upload,
  Table,
  Trash,
  PaperPlane,
  ArrowsClockwise,
  WarningCircle,
  Check,
  X,
  WhatsappLogo
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

const Customers = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [csvData, setCSVData] = useState(null)
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    mobile: ''
  })
  const [availableColumns, setAvailableColumns] = useState([])
  const [showMapping, setShowMapping] = useState(false)
  const [sendingProgress, setSendingProgress] = useState({
    total: 0,
    current: 0,
    status: 'idle' // idle, sending, completed, error
  })
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')

  // Load templates and check WhatsApp connection on component mount
  useEffect(() => {
    loadTemplates()
    checkWhatsAppConnection()
  }, [])

  const checkWhatsAppConnection = async () => {
    try {
      if (window.electronAPI?.whatsapp) {
        const accounts = await window.electronAPI.whatsapp.getAllAccounts()
        const connectedAccts = accounts.filter(acc => acc.isConnected)
        setConnectedAccounts(connectedAccts)
        
        if (connectedAccts.length > 0) {
          setSelectedAccount(connectedAccts[0].id)
        }
      }
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error)
    }
  }

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(header => header.trim())
          
          // Store available columns for mapping
          setAvailableColumns(headers)
          
          // Parse CSV data
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim())
            return headers.reduce((obj, header, index) => {
              obj[header] = values[index]
              return obj
            }, {})
          }).filter(row => Object.values(row).some(value => value)) // Remove empty rows
          
          setCSVData(data)
          setShowMapping(true)
        } catch (error) {
          setError('Invalid CSV format')
          console.error('Error parsing CSV:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleColumnMap = (field, column) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: column
    }))
  }

  const formatPhoneNumber = (number) => {
    // Remove any non-digit characters
    const cleaned = number.replace(/\D/g, '')
    
    // Check if number already has country code
    if (cleaned.startsWith('91')) {
      return '+' + cleaned
    }
    
    // Add +91 if not present
    return '+91' + cleaned
  }

  const applyMapping = () => {
    if (!columnMapping.name || !columnMapping.mobile) {
      setError('Please map both name and mobile number columns')
      return
    }

    try {
      const mappedCustomers = csvData.map(row => {
        const mobile = formatPhoneNumber(row[columnMapping.mobile])
        
        // Validate phone number format
        if (!/^\+91\d{10}$/.test(mobile)) {
          throw new Error(`Invalid phone number format: ${row[columnMapping.mobile]}. Number should be 10 digits.`)
        }

        return {
          name: row[columnMapping.name],
          mobile: mobile
        }
      })

      setCustomers(mappedCustomers)
      setShowMapping(false)
    } catch (error) {
      setError(error.message)
    }
  }

  const sendMessages = async () => {
    if (!selectedTemplate || customers.length === 0) {
      setError('Please select a template and ensure customer list is not empty')
      return
    }

    if (!selectedAccount) {
      setError('No WhatsApp account connected. Please connect WhatsApp first.')
      return
    }

    setSendingProgress({
      total: customers.length,
      current: 0,
      status: 'sending'
    })

    try {
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i]
        const messageContent = templates
          .find(t => t.id === selectedTemplate)
          ?.content
          .replace('{name}', customer.name)

        if (window.electronAPI?.whatsapp) {
          const result = await window.electronAPI.whatsapp.sendMessage(
            selectedAccount,
            customer.mobile,
            messageContent
          )

          if (!result.success) {
            throw new Error(result.error || 'Failed to send message')
          }
        } else {
          // Browser environment - mock sending
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        setSendingProgress(prev => ({
          ...prev,
          current: i + 1
        }))

        // Add 1 second delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      setSendingProgress(prev => ({
        ...prev,
        status: 'completed'
      }))
    } catch (error) {
      setSendingProgress(prev => ({
        ...prev,
        status: 'error'
      }))
      setError(`Error sending messages: ${error.message}`)
      console.error('Error sending messages:', error)
    }
  }

  const PhoneNumberPreview = ({ number }) => {
    try {
      const formatted = formatPhoneNumber(number)
      const isValid = /^\+91\d{10}$/.test(formatted)
      
      return (
        <div className="flex items-center">
          <span className={`${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {formatted}
          </span>
          {!isValid && (
            <WarningCircle size={16} className="text-red-600 ml-2" />
          )}
        </div>
      )
    } catch (error) {
      return (
        <div className="flex items-center text-red-600">
          <span>{number}</span>
          <WarningCircle size={16} className="ml-2" />
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Upload customer data and send messages</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
            <Upload size={20} className="mr-2" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* WhatsApp Connection Warning */}
      {connectedAccounts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <WarningCircle size={20} className="text-yellow-600 mr-3" />
            <div className="flex-1">
              <p className="text-yellow-800">No WhatsApp account connected</p>
              <p className="text-yellow-700 text-sm mt-1">
                Please connect a WhatsApp account before sending messages.
              </p>
            </div>
            <button
              onClick={() => navigate('/connect-whatsapp')}
              className="ml-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors flex items-center"
            >
              <WhatsappLogo size={20} className="mr-2" />
              Connect WhatsApp
            </button>
          </div>
        </div>
      )}

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

      {/* Column Mapping Dialog */}
      {showMapping && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Map CSV Columns</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name Column
              </label>
              <select
                value={columnMapping.name}
                onChange={(e) => handleColumnMap('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select column</option>
                {availableColumns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number Column
              </label>
              <select
                value={columnMapping.mobile}
                onChange={(e) => handleColumnMap('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select column</option>
                {availableColumns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>

            {/* Preview Section */}
            {columnMapping.mobile && csvData && csvData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Phone Number Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Numbers will be formatted with +91 country code:
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {csvData.slice(0, 5).map((row, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-600">
                          {row[columnMapping.mobile]}
                        </span>
                        <span className="text-gray-400 mx-2">→</span>
                        <PhoneNumberPreview number={row[columnMapping.mobile]} />
                      </div>
                    ))}
                    {csvData.length > 5 && (
                      <div className="text-gray-500 text-sm italic">
                        {csvData.length - 5} more numbers...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMapping(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyMapping}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Apply Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer List and Message Sending */}
      {customers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer List ({customers.length})
              </h2>
              <div className="flex items-center space-x-3">
                {connectedAccounts.length > 1 && (
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {connectedAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="relative">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                  >
                    <option value="">Select template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <div className="mt-2 text-sm text-gray-600 absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                      Preview: {templates.find(t => t.id === selectedTemplate)?.content}
                    </div>
                  )}
                </div>
                <button
                  onClick={sendMessages}
                  disabled={sendingProgress.status === 'sending' || !selectedAccount || !selectedTemplate}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperPlane size={20} className="mr-2" />
                  Send Messages
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {sendingProgress.status !== 'idle' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Sending Progress
                  </span>
                  <span className="text-sm text-gray-600">
                    {sendingProgress.current} / {sendingProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      sendingProgress.status === 'completed'
                        ? 'bg-green-600'
                        : sendingProgress.status === 'error'
                        ? 'bg-red-600'
                        : 'bg-primary-600'
                    }`}
                    style={{
                      width: `${(sendingProgress.current / sendingProgress.total) * 100}%`
                    }}
                  ></div>
                </div>
                {sendingProgress.status === 'completed' && (
                  <div className="flex items-center text-green-600 mt-2">
                    <Check size={16} className="mr-1" />
                    <span className="text-sm">Messages sent successfully</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile Number
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {customer.mobile}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers