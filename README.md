# Student Monitoring Desktop Application

A comprehensive desktop application for tracking student activity, monitoring productivity, capturing screenshots, and providing real-time recommendations. Built with Electron, React, and TypeScript.

## 🚀 Features

### Core Functionality
- **Authentication System** - Secure JWT-based authentication with auto-login
- **Activity Monitoring** - Window tracking, browser URL capture, and idle detection
- **Screenshot Capture** - Configurable intervals with compression and upload queue
- **Productivity Tracking** - App categorization, time tracking, and scoring
- **Bad Website Detection** - Domain matching with instant alerts
- **Focus Mode** - Timer sessions with pause/resume functionality
- **Recommendations Panel** - Push notifications and sidebar display
- **Student Dashboard** - Interactive charts and activity summaries
- **Settings Management** - User preferences and teacher-controlled options
- **Offline Support** - Queue system with automatic sync and retry logic
- **Auto-Updates** - Seamless application updates via electron-updater

### Security Features
- Content Security Policy (CSP) headers
- Context isolation with secure IPC bridge
- Input validation on both main and renderer processes
- Encrypted local storage using electron-store
- Sanitized screenshot storage paths

### Performance Optimizations
- Lazy loading for routes
- Memoized Redux selectors
- Debounced/throttled monitoring functions
- Virtual scrolling for large lists
- Code splitting with Vite

## 📁 Project Structure

```
student-monitoring-app/
├── src/
│   ├── main/                      # Electron Main Process
│   │   ├── handlers/              # IPC Handlers
│   │   │   ├── index.ts           # Handler registration
│   │   │   ├── authHandlers.ts    # Authentication handlers
│   │   │   ├── monitoringHandlers.ts
│   │   │   ├── screenshotHandlers.ts
│   │   │   ├── badWebsiteHandlers.ts
│   │   │   ├── productivityHandlers.ts
│   │   │   ├── focusHandlers.ts
│   │   │   ├── recommendationHandlers.ts
│   │   │   ├── settingsHandlers.ts
│   │   │   ├── systemHandlers.ts
│   │   │   ├── updateHandlers.ts
│   │   │   ├── syncHandlers.ts
│   │   │   └── notificationHandlers.ts
│   │   ├── services/              # Main process services
│   │   │   ├── monitoring/
│   │   │   │   ├── windowTracker.ts
│   │   │   │   ├── idleDetector.ts
│   │   │   │   ├── activityLogger.ts
│   │   │   │   └── screenshotManager.ts
│   │   │   ├── productivity/
│   │   │   │   └── productivityCalculator.ts
│   │   │   ├── focus/
│   │   │   │   └── focusManager.ts
│   │   │   ├── sync/
│   │   │   │   └── syncManager.ts
│   │   │   ├── autoUpdater.ts
│   │   │   └── index.ts
│   │   ├── windows/               # Window management
│   │   │   └── mainWindow.ts
│   │   ├── security/              # Security policies
│   │   │   └── policies.ts
│   │   ├── tray/                  # System tray
│   │   │   └── systemTray.ts
│   │   └── main.ts                # Main entry point
│   │
│   ├── renderer/                  # React Application
│   │   ├── features/              # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   └── LoginPage.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   ├── dashboard/
│   │   │   │   ├── components/
│   │   │   │   │   └── DashboardPage.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   ├── monitoring/
│   │   │   │   ├── components/
│   │   │   │   │   └── MonitoringPage.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   ├── recommendations/
│   │   │   │   ├── components/
│   │   │   │   │   └── RecommendationsPage.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   ├── settings/
│   │   │   │   ├── components/
│   │   │   │   │   └── SettingsPage.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   └── focus/
│   │   │       ├── components/
│   │   │       │   └── FocusModePage.tsx
│   │   │       ├── hooks/
│   │   │       └── types/
│   │   ├── components/            # Shared components
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── common/
│   │   │   ├── charts/
│   │   │   └── forms/
│   │   ├── store/                 # Redux Store
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── monitoringSlice.ts
│   │   │   │   ├── activitySlice.ts
│   │   │   │   ├── recommendationsSlice.ts
│   │   │   │   ├── settingsSlice.ts
│   │   │   │   ├── uiSlice.ts
│   │   │   │   ├── focusSlice.ts
│   │   │   │   └── syncSlice.ts
│   │   │   ├── api.ts             # RTK Query API
│   │   │   └── index.ts           # Store configuration
│   │   ├── services/              # Renderer services
│   │   │   ├── api/
│   │   │   ├── monitoring/
│   │   │   ├── encryption/
│   │   │   └── queue/
│   │   ├── hooks/                 # Custom hooks
│   │   ├── utils/                 # Utility functions
│   │   ├── types/                 # Type definitions
│   │   ├── styles/                # Global styles
│   │   │   └── index.css
│   │   ├── App.tsx                # Main App component
│   │   └── main.tsx               # Renderer entry point
│   │
│   ├── preload/                   # Preload Scripts
│   │   └── index.ts               # Preload bridge API
│   │
│   └── shared/                    # Shared Code
│       ├── constants/
│       │   ├── IPC_CHANNELS.ts    # IPC channel definitions
│       │   └── APP_CONSTANTS.ts   # Application constants
│       ├── types/
│       │   └── index.ts           # Shared type definitions
│       ├── validators/
│       │   └── index.ts           # Zod validation schemas
│       ├── utils/
│       │   └── index.ts           # Shared utilities
│       └── index.ts               # Barrel export
│
├── assets/                        # Static assets
│   ├── icons/
│   └── images/
│
├── public/                        # Public files
│
├── scripts/                       # Build scripts
│
├── dist/                          # Built renderer files
├── dist-electron/                 # Built main/preload files
├── release/                       # Distribution packages
│
├── .env.example                   # Environment variables template
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc.json               # Prettier configuration
├── .gitignore                     # Git ignore rules
├── electron-builder.yml           # Electron builder config (optional)
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript config (renderer)
├── tsconfig.main.json             # TypeScript config (main)
├── tsconfig.preload.json          # TypeScript config (preload)
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
└── README.md                      # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 18+** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Recharts** - Data visualization
- **React Router** - Routing
- **Framer Motion** - Animations

### State Management
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching

### Desktop Framework
- **Electron** - Cross-platform desktop app framework
- **electron-store** - Persistent data storage
- **electron-updater** - Auto-updates
- **electron-log** - Logging
- **active-win** - Window tracking

### Build Tools
- **Vite** - Fast development and build
- **electron-builder** - Packaging and distribution

### Data Validation
- **Zod** - Schema validation

### API Communication
- **Axios** - HTTP client (for API calls)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Git

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd student-monitoring-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development**
```bash
npm run dev
```

This will start both the Vite dev server (port 5173) and Electron in development mode.

## 🚀 Available Scripts

### Development
```bash
npm run dev              # Start development mode
npm run dev:vite         # Start Vite dev server only
npm run dev:electron     # Start Electron only
```

### Building
```bash
npm run build            # Build for production
npm run build:renderer   # Build renderer process
npm run build:main       # Build main process
npm run build:preload    # Build preload script
```

### Packaging & Distribution
```bash
npm run pack            # Create unpacked build
npm run dist            # Create distributable packages
npm run dist:win        # Build for Windows
npm run dist:mac        # Build for macOS
npm run dist:linux      # Build for Linux
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run type-check      # Run TypeScript type checking
```

## 🏗️ Architecture

### Main Process (`src/main/`)

The main process manages the application lifecycle, creates windows, and handles system-level operations.

**Key Components:**
- **main.ts** - Application entry point, window creation, lifecycle management
- **handlers/** - IPC communication handlers organized by domain
- **services/** - Business logic for monitoring, screenshots, productivity, etc.
- **windows/** - Window management and configuration
- **security/** - Security policies and CSP setup
- **tray/** - System tray integration

### Renderer Process (`src/renderer/`)

The renderer process is a React application that provides the user interface.

**Key Components:**
- **App.tsx** - Main application component with routing
- **features/** - Feature-based organization (auth, dashboard, monitoring, etc.)
- **store/** - Redux store with slices and RTK Query API
- **components/** - Reusable UI components (layout, common, charts, forms)
- **hooks/** - Custom React hooks
- **utils/** - Utility functions

### Preload Script (`src/preload/`)

The preload script creates a secure bridge between main and renderer processes using contextBridge.

**Key Features:**
- Exposes IPC methods to renderer via `window.electron`
- Type-safe API with full TypeScript support
- Contextual isolation for security

### Shared Code (`src/shared/`)

Shared code used by both main and renderer processes.

**Includes:**
- **constants/** - IPC channels, app constants
- **types/** - TypeScript type definitions
- **validators/** - Zod schemas for data validation
- **utils/** - Shared utility functions

## 🔐 Security

### IPC Communication
- All IPC channels are defined as constants in `IPC_CHANNELS.ts`
- Input validation using Zod schemas on both sides
- Context isolation enabled with secure preload bridge

### Data Storage
- Sensitive data encrypted using electron-store
- JWT tokens stored securely
- Screenshot paths sanitized

### Content Security Policy
- Strict CSP headers configured
- External navigation prevented
- New window creation blocked

## 🎨 UI/UX Features

### Design System
- Modern, clean interface with Tailwind CSS
- Dark mode support
- Responsive layout
- Smooth animations with Framer Motion

### Navigation
- Sidebar navigation with active state
- Header with notifications and user menu
- Breadcrumbs for deep navigation

### Components
- Reusable UI components from shadcn/ui
- Custom charts with Recharts
- Form components with validation
- Modal dialogs and notifications

## 📊 State Management

### Redux Slices
- **authSlice** - Authentication state and user data
- **monitoringSlice** - Real-time monitoring state
- **activitySlice** - Activity history and logs
- **recommendationsSlice** - Recommendations and notifications
- **settingsSlice** - Application settings
- **uiSlice** - UI state (sidebar, modals, theme)
- **focusSlice** - Focus mode sessions
- **syncSlice** - Sync status and queue

### RTK Query API
- **Productivity** - Fetch productivity stats
- **Screenshots** - Manage screenshots
- **Bad Websites** - Manage bad website lists

## 🔄 Offline Support

### Queue System
- Activities queued when offline
- Screenshots queued for upload
- Automatic sync when connection restored
- Retry logic for failed uploads

### Sync Manager
- Tracks sync status
- Manages pending items
- Handles errors gracefully
- Provides sync statistics

## 📈 Monitoring Features

### Window Tracking
- Captures active window title and application name
- Tracks window changes in real-time
- Browser URL capture for supported browsers

### Idle Detection
- Monitors system idle time
- Configurable idle threshold
- Logs idle/active transitions

### Activity Logging
- Stores all activities locally
- Categorizes activities (productive/neutral/unproductive)
- Date-based organization

### Screenshots
- Configurable capture interval
- JPEG compression
- Upload queue management
- Local storage with metadata

## 🧪 Testing (To Be Implemented)

```bash
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier rules
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Component Structure
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types

### File Naming
- **Components:** PascalCase (e.g., `ActivityMonitor.tsx`)
- **Utilities/Services:** camelCase (e.g., `windowTracker.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `IPC_CHANNELS.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useActivityMonitor.ts`)

### Git Workflow
- Create feature branches
- Write meaningful commit messages
- Keep commits atomic
- Submit pull requests for review

## 🐛 Debugging

### Development Tools
- React DevTools (automatically enabled in dev mode)
- Redux DevTools (configured in store)
- Electron DevTools (F12 or Cmd+Option+I)

### Logging
- Main process logs: `electron-log` (check app data folder)
- Renderer logs: Browser console
- Log levels: error, warn, info, debug

## 📦 Building & Distribution

### Windows
```bash
npm run dist:win
```
Produces: `release/Student Monitor Setup 1.0.0.exe`

### macOS
```bash
npm run dist:mac
```
Produces: `release/Student Monitor-1.0.0.dmg`

### Linux
```bash
npm run dist:linux
```
Produces: `release/Student Monitor-1.0.0.AppImage` and `.deb`

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Settings
Users can configure:
- Monitoring settings (intervals, what to track)
- Screenshot settings (interval, quality, auto-upload)
- Notification preferences
- Privacy settings (exclude apps/domains)
- UI preferences (theme, language)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

Your Team

## 🙏 Acknowledgments

- Electron team for the amazing framework
- React team for the UI library
- All open-source contributors

## 📞 Support

For support, email support@yourapp.com or open an issue on GitHub.

---

**Note:** This application is designed for educational purposes to help students track and improve their productivity. Please ensure compliance with privacy laws and regulations in your region when deploying this application.

