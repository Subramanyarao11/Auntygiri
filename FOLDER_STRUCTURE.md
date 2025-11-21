# Complete Folder Structure

This document provides a comprehensive overview of the entire project structure with descriptions for each directory and key file.

```
student-monitoring-app/
│
├── src/
│   │
│   ├── main/                           # Electron Main Process
│   │   ├── handlers/                   # IPC Communication Handlers
│   │   │   ├── index.ts                # Handler registration and initialization
│   │   │   ├── authHandlers.ts         # JWT authentication, login, logout
│   │   │   ├── monitoringHandlers.ts   # Start/stop monitoring, activity logs
│   │   │   ├── screenshotHandlers.ts   # Screenshot capture, upload, deletion
│   │   │   ├── badWebsiteHandlers.ts   # Check URLs, manage blocked sites
│   │   │   ├── productivityHandlers.ts # Fetch stats, calculate scores
│   │   │   ├── focusHandlers.ts        # Focus mode session management
│   │   │   ├── recommendationHandlers.ts # Fetch and manage recommendations
│   │   │   ├── settingsHandlers.ts     # Get/update application settings
│   │   │   ├── systemHandlers.ts       # Window controls, system info
│   │   │   ├── updateHandlers.ts       # Auto-update checks and downloads
│   │   │   ├── syncHandlers.ts         # Offline queue sync management
│   │   │   └── notificationHandlers.ts # System notifications
│   │   │
│   │   ├── services/                   # Business Logic Services
│   │   │   ├── monitoring/
│   │   │   │   ├── windowTracker.ts    # Active window tracking with active-win
│   │   │   │   ├── idleDetector.ts     # System idle time monitoring
│   │   │   │   ├── activityLogger.ts   # Activity storage and retrieval
│   │   │   │   └── screenshotManager.ts # Screenshot capture via desktopCapturer
│   │   │   ├── productivity/
│   │   │   │   └── productivityCalculator.ts # Productivity metrics and scoring
│   │   │   ├── focus/
│   │   │   │   └── focusManager.ts     # Focus session lifecycle management
│   │   │   ├── sync/
│   │   │   │   └── syncManager.ts      # Offline queue and sync logic
│   │   │   ├── autoUpdater.ts          # electron-updater integration
│   │   │   └── index.ts                # Service initialization
│   │   │
│   │   ├── windows/                    # Window Management
│   │   │   └── mainWindow.ts           # Main window creation and configuration
│   │   │
│   │   ├── security/                   # Security Configuration
│   │   │   └── policies.ts             # CSP, navigation protection
│   │   │
│   │   ├── tray/                       # System Tray Integration
│   │   │   └── systemTray.ts           # Tray icon and menu
│   │   │
│   │   ├── utils/                      # Main process utilities
│   │   │
│   │   └── main.ts                     # Main process entry point
│   │
│   ├── renderer/                       # React Renderer Process
│   │   │
│   │   ├── features/                   # Feature Modules (Domain-Driven)
│   │   │   │
│   │   │   ├── auth/                   # Authentication Feature
│   │   │   │   ├── components/
│   │   │   │   │   └── LoginPage.tsx   # Login form and authentication UI
│   │   │   │   ├── hooks/              # Custom hooks (useAuth, etc.)
│   │   │   │   └── types/              # Feature-specific types
│   │   │   │
│   │   │   ├── dashboard/              # Dashboard Feature
│   │   │   │   ├── components/
│   │   │   │   │   └── DashboardPage.tsx # Main dashboard with stats
│   │   │   │   ├── hooks/              # useProductivityStats, useDashboard
│   │   │   │   └── types/
│   │   │   │
│   │   │   ├── monitoring/             # Activity Monitoring Feature
│   │   │   │   ├── components/
│   │   │   │   │   └── MonitoringPage.tsx # Activity logs, screenshots viewer
│   │   │   │   ├── hooks/              # useActivityLog, useScreenshots
│   │   │   │   └── types/
│   │   │   │
│   │   │   ├── recommendations/        # Recommendations Feature
│   │   │   │   ├── components/
│   │   │   │   │   └── RecommendationsPage.tsx # Recommendation list
│   │   │   │   ├── hooks/              # useRecommendations
│   │   │   │   └── types/
│   │   │   │
│   │   │   ├── settings/               # Settings Feature
│   │   │   │   ├── components/
│   │   │   │   │   └── SettingsPage.tsx # App configuration
│   │   │   │   ├── hooks/              # useSettings
│   │   │   │   └── types/
│   │   │   │
│   │   │   └── focus/                  # Focus Mode Feature
│   │   │       ├── components/
│   │   │       │   └── FocusModePage.tsx # Focus timer and controls
│   │   │       ├── hooks/              # useFocusSession
│   │   │       └── types/
│   │   │
│   │   ├── components/                 # Shared/Reusable Components
│   │   │   ├── layout/                 # Layout Components
│   │   │   │   ├── MainLayout.tsx      # Main app layout wrapper
│   │   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   │   └── Header.tsx          # Top header with user menu
│   │   │   ├── common/                 # Common UI Components
│   │   │   │   ├── Button.tsx          # (To be implemented)
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Alert.tsx
│   │   │   │   └── Loader.tsx
│   │   │   ├── charts/                 # Chart Components
│   │   │   │   ├── ProductivityChart.tsx
│   │   │   │   ├── AppUsageChart.tsx
│   │   │   │   └── TimelineChart.tsx
│   │   │   └── forms/                  # Form Components
│   │   │       ├── Input.tsx
│   │   │       ├── Select.tsx
│   │   │       ├── Checkbox.tsx
│   │   │       └── FormField.tsx
│   │   │
│   │   ├── store/                      # Redux Store
│   │   │   ├── slices/                 # Redux Slices
│   │   │   │   ├── authSlice.ts        # Authentication state
│   │   │   │   ├── monitoringSlice.ts  # Real-time monitoring state
│   │   │   │   ├── activitySlice.ts    # Activity history
│   │   │   │   ├── recommendationsSlice.ts # Recommendations
│   │   │   │   ├── settingsSlice.ts    # App settings
│   │   │   │   ├── uiSlice.ts          # UI state (sidebar, theme, etc.)
│   │   │   │   ├── focusSlice.ts       # Focus mode state
│   │   │   │   └── syncSlice.ts        # Sync status
│   │   │   ├── middleware/             # Custom middleware
│   │   │   ├── api.ts                  # RTK Query API definitions
│   │   │   └── index.ts                # Store configuration
│   │   │
│   │   ├── services/                   # Renderer Services
│   │   │   ├── api/                    # API client configuration
│   │   │   │   ├── client.ts           # Axios instance
│   │   │   │   └── interceptors.ts     # Request/response interceptors
│   │   │   ├── monitoring/             # Client-side monitoring
│   │   │   ├── encryption/             # Client-side encryption
│   │   │   └── queue/                  # Client-side queue management
│   │   │
│   │   ├── hooks/                      # Custom React Hooks
│   │   │   ├── useAuth.ts              # Authentication hook
│   │   │   ├── useMonitoring.ts        # Monitoring hook
│   │   │   ├── useInterval.ts          # Interval hook
│   │   │   └── useDebounce.ts          # Debounce hook
│   │   │
│   │   ├── utils/                      # Utility Functions
│   │   │   ├── formatters.ts           # Date, time, number formatters
│   │   │   ├── validators.ts           # Input validators
│   │   │   └── helpers.ts              # General helpers
│   │   │
│   │   ├── types/                      # Renderer Type Definitions
│   │   │   └── index.ts                # Renderer-specific types
│   │   │
│   │   ├── styles/                     # Global Styles
│   │   │   └── index.css               # Tailwind CSS imports and globals
│   │   │
│   │   ├── App.tsx                     # Main App Component
│   │   └── main.tsx                    # Renderer entry point
│   │
│   ├── preload/                        # Preload Scripts
│   │   └── index.ts                    # IPC bridge with contextBridge
│   │
│   ├── shared/                         # Shared Code (Main + Renderer)
│   │   ├── constants/                  # Application Constants
│   │   │   ├── IPC_CHANNELS.ts         # IPC channel definitions
│   │   │   └── APP_CONSTANTS.ts        # App config, intervals, thresholds
│   │   ├── types/                      # Shared TypeScript Types
│   │   │   └── index.ts                # User, Activity, Screenshot, etc.
│   │   ├── validators/                 # Zod Validation Schemas
│   │   │   └── index.ts                # Data validation rules
│   │   ├── utils/                      # Shared Utilities
│   │   │   └── index.ts                # Date/time, string, array utils
│   │   └── index.ts                    # Barrel export
│   │
│   └── types/                          # Global Type Definitions
│       └── electron.d.ts               # Electron API type extensions
│
├── assets/                             # Static Assets
│   ├── icons/
│   │   ├── icon.png                    # App icon (PNG)
│   │   ├── icon.icns                   # macOS icon
│   │   ├── icon.ico                    # Windows icon
│   │   └── tray-icon.png               # System tray icon
│   └── images/
│       └── logo.png                    # App logo
│
├── public/                             # Public Files (Copied to dist/)
│   └── vite.svg                        # Vite logo
│
├── scripts/                            # Build & Automation Scripts
│   ├── build.js                        # Custom build script
│   └── notarize.js                     # macOS notarization
│
├── dist/                               # Built Renderer Files (Generated)
│
├── dist-electron/                      # Built Main/Preload (Generated)
│   ├── main/
│   └── preload/
│
├── release/                            # Distribution Packages (Generated)
│   ├── Student Monitor Setup 1.0.0.exe # Windows installer
│   ├── Student Monitor-1.0.0.dmg       # macOS disk image
│   └── Student Monitor-1.0.0.AppImage  # Linux AppImage
│
├── .env.example                        # Environment variables template
├── .eslintrc.json                      # ESLint configuration
├── .prettierrc.json                    # Prettier configuration
├── .gitignore                          # Git ignore rules
│
├── electron-builder.yml                # Electron Builder config (optional)
│
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Dependency lock file
│
├── tsconfig.json                       # TypeScript config (Renderer)
├── tsconfig.main.json                  # TypeScript config (Main)
├── tsconfig.preload.json               # TypeScript config (Preload)
│
├── vite.config.ts                      # Vite configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── postcss.config.js                   # PostCSS configuration
│
├── index.html                          # HTML entry point
│
├── README.md                           # Project documentation
├── ARCHITECTURE.md                     # Architecture documentation
├── CONTRIBUTING.md                     # Contribution guidelines
├── FOLDER_STRUCTURE.md                 # This file
└── LICENSE                             # License file
```

## Directory Purpose Summary

### `/src/main/`
**Purpose:** Electron main process - handles system-level operations, background services, and IPC communication.

**Key Responsibilities:**
- Application lifecycle
- Window management
- File system operations
- Native OS APIs
- Background monitoring
- Security enforcement

### `/src/renderer/`
**Purpose:** React-based user interface running in a sandboxed browser environment.

**Key Responsibilities:**
- User interface
- State management
- User interactions
- Data visualization
- Form handling

### `/src/preload/`
**Purpose:** Secure bridge between main and renderer processes.

**Key Responsibilities:**
- Expose safe IPC methods
- Type-safe API surface
- Context isolation

### `/src/shared/`
**Purpose:** Code shared between main and renderer processes.

**Key Responsibilities:**
- Type definitions
- Constants
- Validation schemas
- Utility functions

### `/assets/`
**Purpose:** Static assets like icons and images.

### `/public/`
**Purpose:** Files served directly by Vite dev server.

### `/scripts/`
**Purpose:** Build automation and helper scripts.

## File Naming Conventions

- **Components:** `PascalCase.tsx` (e.g., `LoginPage.tsx`)
- **Utilities:** `camelCase.ts` (e.g., `windowTracker.ts`)
- **Constants:** `UPPER_SNAKE_CASE.ts` (e.g., `IPC_CHANNELS.ts`)
- **Hooks:** `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- **Types:** `PascalCase` for interfaces and types
- **CSS:** `kebab-case.css` or `camelCase.css`

## Import Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

```typescript
import { Button } from '@/components/common/Button';
import { IPC_CHANNELS } from '@shared/constants/IPC_CHANNELS';
import { WindowTracker } from '@main/services/monitoring/windowTracker';
import { ElectronAPI } from '@preload/index';
```

## Build Output

### Development
- Vite dev server: `http://localhost:5173`
- Hot reload enabled
- Source maps included

### Production
- **`/dist/`** - Optimized renderer build
- **`/dist-electron/`** - Compiled main and preload
- **`/release/`** - Platform-specific installers

## Next Steps

1. Implement remaining UI components
2. Add comprehensive tests
3. Enhance productivity algorithm
4. Implement server API integration
5. Add data visualization charts
6. Create teacher dashboard
7. Implement advanced features (ML, plugins, etc.)

---

This structure provides a solid foundation for a production-ready Electron + React application with clear separation of concerns, type safety, and scalability.

