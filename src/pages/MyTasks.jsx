import React, { useState } from 'react'
import { 
  List, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play,
  Pause,
  Trash,
  Plus,
  Funnel,
  MagnifyingGlass
} from '@phosphor-icons/react'

const MyTasks = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Send Welcome Messages',
      description: 'Send welcome messages to new customers',
      status: 'running',
      progress: 75,
      type: 'bulk_message',
      contacts: 150,
      sent: 112,
      scheduledFor: '2024-01-15 10:00 AM',
      createdAt: '2024-01-14 09:30 AM'
    },
    {
      id: 2,
      title: 'Follow-up Campaign',
      description: 'Follow up with customers who haven\'t responded',
      status: 'pending',
      progress: 0,
      type: 'follow_up',
      contacts: 50,
      sent: 0,
      scheduledFor: '2024-01-16 02:00 PM',
      createdAt: '2024-01-14 11:15 AM'
    },
    {
      id: 3,
      title: 'Promotional Campaign',
      description: 'Send promotional offers to VIP customers',
      status: 'completed',
      progress: 100,
      type: 'promotional',
      contacts: 200,
      sent: 200,
      scheduledFor: '2024-01-13 03:00 PM',
      createdAt: '2024-01-12 04:20 PM'
    },
    {
      id: 4,
      title: 'Customer Survey',
      description: 'Send customer satisfaction survey',
      status: 'paused',
      progress: 30,
      type: 'survey',
      contacts: 100,
      sent: 30,
      scheduledFor: '2024-01-17 09:00 AM',
      createdAt: '2024-01-14 02:45 PM'
    }
  ])

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-orange-600 bg-orange-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'paused': return 'text-gray-600 bg-gray-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Play size={16} />
      case 'pending': return <Clock size={16} />
      case 'completed': return <CheckCircle size={16} />
      case 'paused': return <Pause size={16} />
      case 'failed': return <XCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
  }

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">Manage your WhatsApp automation tasks</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus size={20} className="mr-2" />
          New Task
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Funnel size={20} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Tasks</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span className="ml-1 capitalize">{task.status}</span>
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{task.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-1 font-medium capitalize">{task.type.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Contacts:</span>
                    <span className="ml-1 font-medium">{task.contacts}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sent:</span>
                    <span className="ml-1 font-medium">{task.sent}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Scheduled:</span>
                    <span className="ml-1 font-medium">{task.scheduledFor}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {task.status === 'running' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'paused')}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    title="Pause Task"
                  >
                    <Pause size={20} />
                  </button>
                )}
                {task.status === 'paused' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'running')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Resume Task"
                  >
                    <Play size={20} />
                  </button>
                )}
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'running')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Start Task"
                  >
                    <Play size={20} />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete Task"
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="card text-center py-12">
          <List size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">Create a new task to get started</p>
        </div>
      )}
    </div>
  )
}

export default MyTasks 