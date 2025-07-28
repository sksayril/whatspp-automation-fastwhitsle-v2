import React, { useState, useEffect } from 'react'
import { 
  WhatsappLogo, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Plus,
  Trash,
  Copy,
  
  Phone,
  X
} from '@phosphor-icons/react'

const ConnectWhatsApp = () => {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [newAccountName, setNewAccountName] = useState('')
  const [qrCodes, setQrCodes] = useState({})
  const [showQRModal, setShowQRModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Set up event listeners
    if (window.electronAPI?.whatsapp) {
      window.electronAPI.whatsapp.onStatusChanged((event, accountId, status) => {
        updateAccountStatus(accountId, status)
        setIsConnecting(false)
        if (status === 'connected') {
          setQrCodes(prev => ({ ...prev, [accountId]: null }))
          setShowQRModal(false)
        }
      })

      window.electronAPI.whatsapp.onQRChanged((event, accountId, qrCodeData) => {
        console.log('QR Code received for account:', accountId, qrCodeData ? 'QR data present' : 'No QR data')
        setQrCodes(prev => ({ ...prev, [accountId]: qrCodeData }))
        setShowQRModal(true)
      })

      // Get initial accounts
      loadAccounts()
    } else {
      // Fallback for browser environment
      console.log('Running in browser environment, using mock data')
      setAccounts([
        { id: 'account_1', name: 'Demo Account 1', phone: '+1234567890', status: 'disconnected', isConnected: false },
        { id: 'account_2', name: 'Demo Account 2', phone: '+0987654321', status: 'disconnected', isConnected: false }
      ])
    }

    return () => {
      // Cleanup listeners
      if (window.electronAPI?.whatsapp) {
        window.electronAPI.whatsapp.removeAllListeners('whatsapp-status-changed')
        window.electronAPI.whatsapp.removeAllListeners('whatsapp-qr-changed')
      }
    }
  }, [])

  const loadAccounts = async () => {
    try {
      if (window.electronAPI?.whatsapp) {
        const accountsList = await window.electronAPI.whatsapp.getAllAccounts()
        setAccounts(accountsList)
      } else {
        // Fallback for browser environment
        console.log('Running in browser environment, using mock data')
        setAccounts([
          { id: 'account_1', name: 'Demo Account 1', phone: '+1234567890', status: 'disconnected', isConnected: false },
          { id: 'account_2', name: 'Demo Account 2', phone: '+0987654321', status: 'disconnected', isConnected: false }
        ])
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
      // Set fallback data on error
      setAccounts([
        { id: 'account_1', name: 'Demo Account 1', phone: '+1234567890', status: 'disconnected', isConnected: false },
        { id: 'account_2', name: 'Demo Account 2', phone: '+0987654321', status: 'disconnected', isConnected: false }
      ])
    }
  }

  const updateAccountStatus = (accountId, status) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, status, isConnected: status === 'connected' }
        : account
    ))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'connecting': return 'text-blue-600 bg-blue-100'
      case 'disconnected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle size={16} />
      case 'connecting': return <Phone size={16} />
      case 'disconnected': return <X size={16} />
      default: return <XCircle size={16} />
    }
  }

  const testQRCode = () => {
    // Test QR code generation
    const testQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    setQrCodes({ test: testQR })
    setShowQRModal(true)
  }

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      setError('Please enter account name or phone number')
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      
      // Use phone number as account ID if provided, otherwise generate one
      let accountId = newAccountName.toLowerCase().replace(/\s+/g, '_')
      
      // Check if it looks like a phone number
      if (newAccountName.match(/^\+?[\d\s-]+$/)) {
        // It's a phone number, use it as account ID
        accountId = newAccountName.replace(/\D/g, '') // Remove non-digits
        console.log('Phone number detected, using as account ID:', accountId)
      } else {
        // It's a name, generate account ID
        accountId = `account_${Date.now()}`
        console.log('Name detected, generating account ID:', accountId)
      }
      
      console.log('Adding account:', accountId, newAccountName)
      
      // Check if account already exists
      if (window.electronAPI?.whatsapp) {
        const accountStatus = await window.electronAPI.whatsapp.checkAccount(accountId)
        console.log('Account status:', accountStatus)
        
        if (accountStatus.exists && accountStatus.isConnected) {
          setError('Account is already connected')
          setIsConnecting(false)
          return
        }
        
        const result = await window.electronAPI.whatsapp.connect(accountId, newAccountName)
        console.log('Connect result:', result)
        if (result.success) {
          setNewAccountName('')
          await loadAccounts() // Reload accounts list
        } else {
          setError(result.error || 'Failed to connect')
        }
      } else {
        setError('WhatsApp API not available')
      }
    } catch (error) {
      console.error('Error adding account:', error)
      setError(error.message)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnect = async (accountId) => {
    try {
      setIsConnecting(true)
      setError(null)
      
      const account = accounts.find(acc => acc.id === accountId)
      if (!account) {
        setError('Account not found')
        return
      }
      
      if (window.electronAPI?.whatsapp) {
        const result = await window.electronAPI.whatsapp.connect(accountId, account.name)
        if (!result.success) {
          setError(result.error || 'Failed to connect')
        }
      } else {
        // Fallback for browser environment - simulate connection
        console.log('Running in browser environment, simulating connection')
        updateAccountStatus(accountId, 'connected')
        setError(null)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (accountId) => {
    try {
      if (window.electronAPI?.whatsapp) {
        await window.electronAPI.whatsapp.disconnect(accountId)
        await loadAccounts() // Reload accounts list
      } else {
        // Fallback for browser environment - simulate disconnection
        console.log('Running in browser environment, simulating disconnection')
        updateAccountStatus(accountId, 'disconnected')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const copyPhoneNumber = (phone) => {
    navigator.clipboard.writeText(phone)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connect WhatsApp</h1>
          <p className="text-gray-600">Manage your WhatsApp connections for automation</p>
        </div>
        <button 
          onClick={() => setShowQRModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Connection
        </button>
      </div>

      {/* Add New Account */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New WhatsApp Account</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Enter phone number (e.g., +918337804854) or account name"
              className="input-field"
              disabled={isConnecting}
            />
          </div>
          <button
            onClick={handleAddAccount}
            disabled={isConnecting || !newAccountName.trim()}
            className="btn-primary"
          >
            {isConnecting ? 'Adding...' : 'Add Account'}
          </button>
          <button
            onClick={testQRCode}
            className="btn-secondary"
          >
            Test QR
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Accounts</h2>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <WhatsappLogo size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts</h3>
            <p className="text-gray-600">Add your first WhatsApp account to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <WhatsappLogo size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-600">Account ID: {account.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(account.status)}`}>
                      {getStatusIcon(account.status)}
                      <span className="ml-1 capitalize">{account.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {account.status === 'disconnected' && (
                      <button
                        onClick={() => handleConnect(account.id)}
                        disabled={isConnecting}
                        className="btn-primary"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                    {account.status === 'connected' && (
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="btn-secondary"
                      >
                        Disconnect
                      </button>
                    )}
                    {account.status === 'connecting' && (
                      <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Connecting...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



            {/* QR Code Modal */}
      {showQRModal && Object.keys(qrCodes).length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan QR Code</h3>
              {Object.entries(qrCodes).map(([accountId, qrCode]) => {
                const account = accounts.find(acc => acc.id === accountId)
                return (
                  <div key={accountId} className="mb-6">
                    {account && (
                      <h4 className="text-md font-medium text-gray-700 mb-2">
                        {account.name}
                      </h4>
                    )}
                    <div className="bg-gray-100 rounded-lg p-8 mb-4">
                      <img src={qrCode} alt="QR Code" className="mx-auto" />
                    </div>
                  </div>
                )
              })}
              <p className="text-sm text-gray-600 mb-4">
                1. Open WhatsApp on your phone<br />
                2. Go to Settings &gt; Linked Devices<br />
                3. Tap "Link a Device"<br />
                4. Scan the QR code above
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Tips */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">For Best Results:</h4>
            <ul className="space-y-1 text-gray-600">
              <li key="tip-1">• Keep your phone connected to the internet</li>
              <li key="tip-2">• Don't log out of WhatsApp on your phone</li>
              <li key="tip-3">• Use a stable internet connection</li>
              <li key="tip-4">• Keep the app running in the background</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Troubleshooting:</h4>
            <ul className="space-y-1 text-gray-600">
              <li key="trouble-1">• If connection fails, try reconnecting</li>
              <li key="trouble-2">• Make sure WhatsApp is up to date</li>
              <li key="trouble-3">• Check your internet connection</li>
              <li key="trouble-4">• Restart the app if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectWhatsApp 