import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyTasks from './pages/MyTasks'
import ConnectWhatsApp from './pages/ConnectWhatsApp'
import SendMessages from './pages/SendMessages'
import Templates from './pages/Templates'
import QuickReply from './pages/QuickReply'
import ErrorBoundary from './components/ErrorBoundary'
import WhatsAppService from './services/whatsappService'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)

    // Initialize WhatsApp service and auto-reply functionality
    const whatsappService = new WhatsAppService()
    whatsappService.initializeAutoReply()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {isAuthenticated ? (
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-tasks" element={<MyTasks />} />
              <Route path="/connect-whatsapp" element={<ConnectWhatsApp />} />
              <Route path="/send-messages" element={<SendMessages />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/quick-reply" element={<QuickReply />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        ) : (
          <Login onLogin={() => setIsAuthenticated(true)} />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App 