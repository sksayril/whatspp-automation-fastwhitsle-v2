import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyTasks from './pages/MyTasks'
import ConnectWhatsApp from './pages/ConnectWhatsApp'
import SendMessages from './pages/SendMessages'
import Templates from './pages/Templates'
import QuickReply from './pages/QuickReply'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Customers from './pages/Customers'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Login onLogin={handleLogin} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/connect-whatsapp" element={<ConnectWhatsApp />} />
          <Route path="/send-messages" element={<SendMessages />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/quick-reply" element={<QuickReply />} />
          <Route path="/customers" element={<Customers />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App 