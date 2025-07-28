import React, { useState, useEffect } from 'react'
import { 
  WhatsappLogo, 
  ChatCircle, 
  CheckCircle, 
  Clock,
  ChartLine,
  Users,
  ChatCircle as ChatIcon,
  Calendar,
  Warning,
  CheckCircle as CheckIcon,
  Lightning
} from '@phosphor-icons/react'

const Dashboard = () => {
  const [whatsappStats, setWhatsappStats] = useState({
    connectedAccounts: 0,
    totalAccounts: 0,
    accountsList: [],
    messageStats: {
      sentToday: 0,
      sentThisWeek: 0,
      sentThisMonth: 0,
      totalSent: 0
    }
  })

  const [quickReplyStats, setQuickReplyStats] = useState({
    totalRules: 0,
    activeRules: 0,
    repliesSent: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get WhatsApp account statistics
    const getWhatsAppStats = async () => {
      try {
        // Check if we're running in Electron
        if (window.electronAPI && window.electronAPI.whatsapp) {
          // Get connected accounts
          const accounts = await window.electronAPI.whatsapp.getWhatsAppAccounts()
          const connectedAccounts = accounts.filter(acc => acc.isConnected).length
          
          // Get message statistics (this would be stored in localStorage or database)
          const messageStats = JSON.parse(localStorage.getItem('messageStats')) || {
            sentToday: 0,
            sentThisWeek: 0,
            sentThisMonth: 0,
            totalSent: 0
          }

          // Update today's count if it's a new day
          const today = new Date().toDateString()
          const lastUpdate = localStorage.getItem('lastMessageUpdate')
          if (lastUpdate !== today) {
            messageStats.sentToday = 0
            localStorage.setItem('lastMessageUpdate', today)
          }

          setWhatsappStats({
            connectedAccounts,
            totalAccounts: accounts.length,
            accountsList: accounts,
            messageStats
          })
        } else {
          // Fallback for browser environment
          console.log('Running in browser environment, using mock data')
          setWhatsappStats({
            connectedAccounts: 0,
            totalAccounts: 0,
            accountsList: [],
            messageStats: {
              sentToday: 0,
              sentThisWeek: 0,
              sentThisMonth: 0,
              totalSent: 0
            }
          })
        }

        // Get quick reply statistics
        const quickReplies = JSON.parse(localStorage.getItem('quickReplies')) || []
        setQuickReplyStats({
          totalRules: quickReplies.length,
          activeRules: quickReplies.filter(reply => reply.isActive).length,
          repliesSent: Math.floor(Math.random() * 50) // Sample data
        })
      } catch (error) {
        console.error('Error fetching WhatsApp stats:', error)
        // Set fallback data on error
        setWhatsappStats({
          connectedAccounts: 0,
          totalAccounts: 0,
          accountsList: [],
          messageStats: {
            sentToday: 0,
            sentThisWeek: 0,
            sentThisMonth: 0,
            totalSent: 0
          }
        })
      } finally {
        setLoading(false)
      }
    }

    getWhatsAppStats()
  }, [])
  const stats = [
    {
      name: 'Connected WhatsApp Accounts',
      value: loading ? '...' : whatsappStats.connectedAccounts.toString(),
      change: loading ? '' : `${whatsappStats.connectedAccounts}/${whatsappStats.totalAccounts}`,
      changeType: whatsappStats.connectedAccounts > 0 ? 'positive' : 'negative',
      icon: WhatsappLogo,
      color: whatsappStats.connectedAccounts > 0 ? 'bg-green-500' : 'bg-red-500'
    },
    {
      name: 'Messages Sent Today',
      value: loading ? '...' : whatsappStats.messageStats.sentToday.toString(),
      change: loading ? '' : `+${whatsappStats.messageStats.sentToday}`,
      changeType: 'positive',
      icon: ChatIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Messages Sent',
      value: loading ? '...' : whatsappStats.messageStats.totalSent.toString(),
      change: loading ? '' : `+${whatsappStats.messageStats.sentThisWeek}`,
      changeType: 'positive',
      icon: ChatCircle,
      color: 'bg-purple-500'
    },
    {
      name: 'Available Accounts',
      value: loading ? '...' : whatsappStats.totalAccounts.toString(),
      change: loading ? '' : `${whatsappStats.totalAccounts - whatsappStats.connectedAccounts} disconnected`,
      changeType: whatsappStats.totalAccounts > whatsappStats.connectedAccounts ? 'negative' : 'positive',
      icon: Users,
      color: 'bg-orange-500'
    },
    {
      name: 'Quick Reply Rules',
      value: loading ? '...' : quickReplyStats.totalRules.toString(),
      change: loading ? '' : `${quickReplyStats.activeRules} active`,
      changeType: quickReplyStats.activeRules > 0 ? 'positive' : 'negative',
      icon: Lightning,
      color: 'bg-indigo-500'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'message_sent',
      title: 'Message sent to John Doe',
      description: 'Welcome message template sent successfully',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'connection',
      title: 'WhatsApp connected',
      description: 'New WhatsApp account connected',
      time: '1 hour ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'task_completed',
      title: 'Bulk message task completed',
      description: 'Sent 50 messages to customer list',
      time: '3 hours ago',
      status: 'success'
    },
    {
      id: 4,
      type: 'template_created',
      title: 'New template created',
      description: 'Welcome message template added',
      time: '1 day ago',
      status: 'info'
    }
  ]

  const quickActions = [
    {
      name: 'Send Message',
      description: 'Send a quick message to contacts',
      icon: ChatCircle,
      href: '/send-messages',
      color: 'bg-primary-500'
    },
    {
      name: 'Connect WhatsApp',
      description: 'Add a new WhatsApp account',
      icon: WhatsappLogo,
      href: '/connect-whatsapp',
      color: 'bg-green-500'
    },
    {
      name: 'Create Template',
      description: 'Create a new message template',
      icon: ChatIcon,
      href: '/templates',
      color: 'bg-purple-500'
    },
    {
      name: 'Quick Reply',
      description: 'Set up automatic replies',
      icon: Lightning,
      href: '/quick-reply',
      color: 'bg-indigo-500'
    },
    {
      name: 'View Tasks',
      description: 'Check your pending tasks',
      icon: Clock,
      href: '/my-tasks',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your WhatsApp automation.</p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            setTimeout(() => {
              const getWhatsAppStats = async () => {
                try {
                  const accounts = await window.electronAPI.whatsapp.getWhatsAppAccounts()
                  const connectedAccounts = accounts.filter(acc => acc.isConnected).length
                  
                  const messageStats = JSON.parse(localStorage.getItem('messageStats')) || {
                    sentToday: 0,
                    sentThisWeek: 0,
                    sentThisMonth: 0,
                    totalSent: 0
                  }

                  const today = new Date().toDateString()
                  const lastUpdate = localStorage.getItem('lastMessageUpdate')
                  if (lastUpdate !== today) {
                    messageStats.sentToday = 0
                    localStorage.setItem('lastMessageUpdate', today)
                  }

                  setWhatsappStats({
                    connectedAccounts,
                    totalAccounts: accounts.length,
                    accountsList: accounts,
                    messageStats
                  })
                } catch (error) {
                  console.error('Error fetching WhatsApp stats:', error)
                } finally {
                  setLoading(false)
                }
              }
              getWhatsAppStats()
            }, 500)
          }}
          className="btn-secondary flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Stats
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* WhatsApp Accounts Status */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Accounts Status</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading account information...</p>
          </div>
        ) : whatsappStats.accountsList.length === 0 ? (
          <div className="text-center py-8">
            <WhatsappLogo size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No WhatsApp accounts</h3>
            <p className="text-gray-600 mb-4">Connect your first WhatsApp account to get started</p>
            <a href="/connect-whatsapp" className="btn-primary">
              Connect WhatsApp
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {whatsappStats.accountsList.map((account, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${account.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{account.name || account.phone}</h3>
                    <p className="text-sm text-gray-600">{account.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    account.isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {account.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  {account.isConnected && (
                    <CheckIcon size={16} className="text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <a
                key={action.name}
                href={action.href}
                className="group p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className={`inline-flex p-2 rounded-lg ${action.color} mb-3`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-primary-600">
                  {action.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
              </a>
            )
          })}
        </div>
      </div>

      {/* Message Capabilities */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChatCircle size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Text Messages</h3>
                <p className="text-sm text-gray-600">Send text messages</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Single messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Bulk messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Template messages</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChatIcon size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Media Messages</h3>
                <p className="text-sm text-gray-600">Send with attachments</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Images</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">PDF documents</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Other files</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Multi-Account</h3>
                <p className="text-sm text-gray-600">Send from multiple accounts</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Multiple WhatsApp accounts</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Load balancing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon size={14} className="text-green-500" />
                <span className="text-sm text-gray-600">Account selection</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-500' : 
                activity.status === 'info' ? 'bg-blue-500' : 'bg-gray-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Analytics</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ChartLine size={48} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Chart will be displayed here</p>
            <p className="text-sm text-gray-400">Message statistics over time</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 