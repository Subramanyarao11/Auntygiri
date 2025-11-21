# Architecture Documentation

## Overview

The Student Monitoring Application follows a clean, modular architecture that separates concerns between the Electron main process, React renderer process, and shared code. This document provides a detailed explanation of the architecture and design decisions.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│                  (React + TypeScript)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ IPC Bridge (Preload)
                       │
┌──────────────────────┴──────────────────────────────────┐
│                  Main Process                            │
│              (Electron + Node.js)                        │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   IPC    │  │ Services │  │ Security │              │
│  │ Handlers │  │          │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │
┌──────────────────────┴──────────────────────────────────┐
│              Operating System APIs                       │
│  (File System, Network, Window Management, etc.)        │
└─────────────────────────────────────────────────────────┘
```

## Process Architecture

### Main Process

The main process is responsible for:
- Application lifecycle management
- Window creation and management
- System-level operations (file I/O, native APIs)
- Background services (monitoring, screenshots, sync)
- IPC communication handling
- Security enforcement

**Key Directories:**
- `src/main/handlers/` - IPC request handlers
- `src/main/services/` - Business logic and background tasks
- `src/main/windows/` - Window management
- `src/main/security/` - Security policies
- `src/main/tray/` - System tray integration

### Renderer Process

The renderer process is a sandboxed web application:
- React-based user interface
- Redux for state management
- No direct access to Node.js APIs
- Communicates with main process via IPC

**Key Directories:**
- `src/renderer/features/` - Feature modules
- `src/renderer/components/` - Reusable UI components
- `src/renderer/store/` - Redux store and slices
- `src/renderer/hooks/` - Custom React hooks

### Preload Script

The preload script acts as a secure bridge:
- Runs in isolated context with access to both Node.js and DOM APIs
- Exposes safe IPC methods to renderer via `contextBridge`
- Provides TypeScript type safety for IPC communication

## Data Flow

### Authentication Flow

```
1. User enters credentials in LoginPage
2. Redux action dispatched → window.electron.auth.login()
3. Preload forwards to main process via IPC
4. authHandlers validates and processes login
5. Tokens stored securely in electron-store
6. Response sent back through IPC chain
7. Redux state updated, UI re-renders
```

### Activity Monitoring Flow

```
1. Dashboard loads → startMonitoring() dispatched
2. Main process starts WindowTracker and IdleDetector
3. WindowTracker polls active window every minute
4. Changes logged to ActivityLogger
5. Activity sent to renderer via IPC event
6. Redux activityUpdate action dispatched
7. UI components react to state changes
```

### Screenshot Capture Flow

```
1. Timer triggers or manual capture requested
2. ScreenshotManager uses desktopCapturer API
3. Image compressed and saved to local storage
4. Metadata stored in electron-store
5. If online, added to upload queue
6. SyncManager uploads to server
7. Screenshot marked as uploaded
```

## State Management

### Redux Store Structure

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    // ...
  },
  monitoring: {
    isMonitoring: boolean,
    currentWindow: WindowInfo | null,
    isIdle: boolean,
    recentActivities: ActivityEntry[],
  },
  activity: {
    activities: ActivityEntry[],
    dateRange: { startDate, endDate },
  },
  recommendations: {
    items: Recommendation[],
    unreadCount: number,
  },
  settings: {
    settings: AppSettings | null,
  },
  ui: {
    sidebarOpen: boolean,
    theme: 'light' | 'dark' | 'system',
    notifications: Notification[],
  },
  focus: {
    activeSession: FocusSession | null,
  },
  sync: {
    syncState: SyncState | null,
  },
  api: {
    // RTK Query cache
  },
}
```

### State Update Patterns

**Async Operations:**
```typescript
// Using createAsyncThunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials) => {
    const response = await window.electron.auth.login(credentials);
    return response;
  }
);
```

**IPC Events:**
```typescript
// Listening to main process events
useEffect(() => {
  const unsubscribe = window.electron.monitoring.onActivityUpdate(
    (activity) => dispatch(activityUpdate(activity))
  );
  return unsubscribe;
}, []);
```

## IPC Communication

### Channel Naming Convention

All IPC channels follow a structured naming pattern:
```
<domain>:<action>

Examples:
- auth:login
- monitoring:start
- screenshot:capture
- settings:update
```

### Communication Patterns

**Request-Response (invoke/handle):**
```typescript
// Renderer
const result = await window.electron.auth.login(credentials);

// Main
ipcMain.handle('auth:login', async (_event, credentials) => {
  // Process and return result
  return authResponse;
});
```

**One-way Messages (send/on):**
```typescript
// Renderer
window.electron.notification.show('Title', 'Message');

// Main
ipcMain.on('notification:show', (_event, { title, message }) => {
  // Show notification
});
```

**Event Broadcasting (webContents.send):**
```typescript
// Main
mainWindow.webContents.send('monitoring:update-activity', activity);

// Renderer
window.electron.monitoring.onActivityUpdate((activity) => {
  // Handle activity update
});
```

## Security Architecture

### Layers of Security

1. **Context Isolation**
   - Renderer process isolated from Node.js
   - No direct access to `require` or native modules

2. **Preload Validation**
   - All IPC methods explicitly exposed
   - Type-safe interfaces

3. **Input Validation**
   - Zod schemas validate all data
   - Sanitization of user inputs

4. **Content Security Policy**
   - Strict CSP headers
   - No inline scripts
   - No external resources

5. **Navigation Protection**
   - External URLs blocked
   - New windows prevented

### Data Encryption

```typescript
// Sensitive data encrypted in electron-store
store.set('auth_tokens', {
  accessToken: encrypt(token),
  // ...
});
```

## Service Layer

### Window Tracker

**Responsibility:** Track active window changes

**Implementation:**
- Uses `active-win` npm package
- Polls every 60 seconds (configurable)
- Detects window/app changes
- Logs to ActivityLogger
- Sends updates to renderer

### Idle Detector

**Responsibility:** Monitor user idle time

**Implementation:**
- Uses Electron's `powerMonitor.getSystemIdleTime()`
- Checks every 5 seconds
- Configurable idle threshold (default: 5 minutes)
- Logs idle start/end events

### Screenshot Manager

**Responsibility:** Capture and manage screenshots

**Implementation:**
- Uses Electron's `desktopCapturer` API
- JPEG compression for smaller file sizes
- Organized by date in file system
- Metadata stored in electron-store
- Queue for pending uploads

### Productivity Calculator

**Responsibility:** Calculate productivity metrics

**Implementation:**
- Analyzes activity logs
- Categorizes apps as productive/neutral/unproductive
- Calculates time spent in each category
- Generates hourly breakdowns
- Computes productivity score

### Focus Manager

**Responsibility:** Manage focus mode sessions

**Implementation:**
- Creates time-bound focus sessions
- Supports pause/resume
- Tracks breaks
- Calculates actual vs. planned duration
- Stores session history

### Sync Manager

**Responsibility:** Sync data with server

**Implementation:**
- Queue-based architecture
- Automatic retry with exponential backoff
- Tracks sync status
- Handles offline scenarios
- Batch operations for efficiency

## Component Architecture

### Feature-Based Organization

Each feature is self-contained:
```
features/dashboard/
├── components/       # UI components
├── hooks/           # Custom hooks
├── types/           # TypeScript types
└── utils/           # Utility functions
```

### Component Patterns

**Container Components:**
```typescript
// Connects to Redux, handles logic
function DashboardContainer() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectDashboardData);
  
  useEffect(() => {
    dispatch(fetchData());
  }, []);
  
  return <DashboardPresentation data={data} />;
}
```

**Presentation Components:**
```typescript
// Pure, receives props, renders UI
interface Props {
  data: DashboardData;
}

function DashboardPresentation({ data }: Props) {
  return (
    <div>
      {/* Render UI */}
    </div>
  );
}
```

### Custom Hooks

**State Management:**
```typescript
function useMonitoring() {
  const dispatch = useAppDispatch();
  const { isMonitoring } = useAppSelector(state => state.monitoring);
  
  const start = () => dispatch(startMonitoring());
  const stop = () => dispatch(stopMonitoring());
  
  return { isMonitoring, start, stop };
}
```

**IPC Communication:**
```typescript
function useActivityListener() {
  useEffect(() => {
    const unsubscribe = window.electron.monitoring.onActivityUpdate(
      (activity) => {
        // Handle activity
      }
    );
    
    return unsubscribe;
  }, []);
}
```

## Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error
    // Show fallback UI
  }
}
```

### Async Error Handling

```typescript
// Redux slice
builder.addCase(login.rejected, (state, action) => {
  state.error = action.error.message || 'Login failed';
});
```

### IPC Error Handling

```typescript
// Main process
ipcMain.handle('auth:login', async (_event, credentials) => {
  try {
    // Process login
    return response;
  } catch (error) {
    log.error('Login error:', error);
    throw error; // Propagates to renderer
  }
});
```

## Performance Optimizations

### Code Splitting

```typescript
// Vite config
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      redux: ['@reduxjs/toolkit', 'react-redux'],
      ui: ['recharts', 'framer-motion'],
    },
  },
}
```

### Memoization

```typescript
// Redux selector
const selectProductivityScore = createSelector(
  [selectActivities],
  (activities) => calculateScore(activities)
);
```

### Debouncing/Throttling

```typescript
// Window tracking throttled to once per minute
const trackWindow = throttle(async () => {
  // Track window
}, 60000);
```

### Virtual Scrolling

For large activity lists, implement virtual scrolling:
```typescript
import { FixedSizeList } from 'react-window';
```

## Testing Strategy

### Unit Tests
- Redux slices and actions
- Utility functions
- Custom hooks

### Integration Tests
- IPC communication
- Service interactions
- Component integration

### E2E Tests
- Critical user flows
- Authentication
- Monitoring lifecycle

## Build & Distribution

### Development Build

```bash
npm run dev
```

- Vite dev server on port 5173
- Hot reload enabled
- DevTools available

### Production Build

```bash
npm run build
npm run dist
```

- Code minified and optimized
- Source maps generated
- Electron app packaged with electron-builder

### Platform-Specific Considerations

**Windows:**
- NSIS installer
- Auto-updater integration
- Code signing (optional)

**macOS:**
- DMG disk image
- Notarization (for distribution)
- Code signing required

**Linux:**
- AppImage (portable)
- DEB package (Debian/Ubuntu)
- RPM package (optional)

## Deployment

### Auto-Updates

Configured via `electron-updater`:
```typescript
autoUpdater.checkForUpdatesAndNotify();
```

### Update Server

Can use:
- GitHub Releases
- Custom update server
- AWS S3 + CloudFront

## Monitoring & Analytics

### Logging

**Main Process:**
```typescript
import log from 'electron-log';
log.info('Application started');
```

**Renderer Process:**
```typescript
console.log('Component mounted');
```

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Custom analytics

## Future Enhancements

1. **Machine Learning** - Smart productivity predictions
2. **Multi-Monitor Support** - Track all screens
3. **Plugin System** - Extensible architecture
4. **Cloud Sync** - Real-time data sync
5. **Mobile App** - Companion mobile application
6. **Team Features** - Teacher dashboard, class management

---

This architecture is designed to be scalable, maintainable, and secure. For questions or contributions, please refer to the main README.md.

