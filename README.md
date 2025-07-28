# WhatsApp Automation Desktop App

A modern Electron + React desktop application for WhatsApp automation with a beautiful UI built using Tailwind CSS.

## Features

### 🔐 Authentication
- Beautiful login page with dummy authentication
- Secure session management
- User-friendly interface

### 📊 Dashboard
- Real-time statistics and analytics
- Quick action buttons
- Recent activity feed
- Message analytics overview

### 📋 Task Management
- Create and manage automation tasks
- Real-time task status tracking
- Progress monitoring
- Task filtering and search
- Start, pause, and delete tasks

### 📱 WhatsApp Connection
- Multiple WhatsApp account management
- QR code scanning for device linking
- Connection status monitoring
- Easy account switching

### 💬 Message Sending
- Single and bulk message sending
- Template-based messaging
- File attachments support
- Message scheduling
- Real-time delivery status

### 📝 Template Management
- Create and edit message templates
- Variable support (e.g., {{name}}, {{orderId}})
- Template categorization
- Usage statistics
- Copy and reuse templates

### ⚡ Quick Reply Automation
- Set up automatic replies for incoming messages
- Multiple trigger types: all messages, specific users, keywords
- Time-based scheduling and day restrictions
- Template-based responses with customizable delays
- Real-time statistics and monitoring
- Import/export functionality for backup and sharing

## Tech Stack

- **Frontend**: React 18 with Vite
- **Desktop**: Electron
- **Styling**: Tailwind CSS
- **Icons**: Phosphor Icons
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd whatsapp-automation
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build:electron
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:vite` - Start Vite development server only
- `npm run dev:electron` - Start Electron app only
- `npm run build` - Build React app for production
- `npm run build:electron` - Build complete Electron app
- `npm run dist` - Create distributable packages
- `npm run preview` - Preview production build

## Project Structure

```
whatsapp-automation/
├── public/
│   └── electron.js          # Electron main process
├── src/
│   ├── components/
│   │   └── Layout.jsx       # Main layout with sidebar
│   ├── pages/
│   │   ├── Login.jsx        # Authentication page
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── MyTasks.jsx      # Task management
│   │   ├── ConnectWhatsApp.jsx # WhatsApp connection
│   │   ├── SendMessages.jsx # Message composition
│   │   ├── Templates.jsx    # Template management
│   │   └── QuickReply.jsx   # Quick reply automation
│   ├── styles/
│   │   └── index.css        # Global styles with Tailwind
│   ├── App.jsx              # Main app component
│   └── main.jsx             # React entry point
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── README.md                # Project documentation
```

## UI Components

The app uses a consistent design system with:

- **Primary Colors**: Blue theme with proper contrast
- **Secondary Colors**: Gray scale for text and backgrounds
- **Icons**: Phosphor Icons throughout the interface
- **Cards**: Clean, modern card layouts
- **Buttons**: Consistent button styling with hover effects
- **Forms**: Well-designed input fields and form elements

## Features in Detail

### Dashboard
- Statistics cards showing key metrics
- Quick action buttons for common tasks
- Recent activity timeline
- Analytics chart placeholder

### Task Management
- Task status tracking (Running, Pending, Completed, Paused, Failed)
- Progress bars for ongoing tasks
- Task filtering by status
- Search functionality
- Task actions (Start, Pause, Delete)

### WhatsApp Connection
- Multiple account support
- QR code scanning interface
- Connection status indicators
- Account management (Add, Remove, Connect/Disconnect)

### Message Sending
- Single and bulk message modes
- Template selection
- File attachment support
- Message scheduling
- Delivery status tracking

### Template Management
- Template creation and editing
- Variable detection and management
- Category-based organization
- Usage statistics
- Template activation/deactivation

### Quick Reply Automation
- Automatic response system for incoming messages
- Flexible trigger conditions (all messages, specific users, keywords)
- Time and day-based scheduling
- Template integration for consistent responses
- Real-time monitoring and statistics
- Bulk import/export for easy management

## Development

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Update routing in `src/App.jsx`
4. Add navigation items in `src/components/Layout.jsx`

### Styling Guidelines
- Use Tailwind CSS classes
- Follow the established color scheme
- Use Phosphor Icons for consistency
- Maintain responsive design

### State Management
- Use React hooks for local state
- Consider context for global state if needed
- Keep components focused and reusable

## Building for Distribution

### Windows
```bash
npm run dist
```

### macOS
```bash
npm run dist
```

### Linux
```bash
npm run dist
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository. 