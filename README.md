# Parental Monitoring App

A background monitoring application for macOS that allows parents to monitor their child's device activity.

## Features

### 🔒 Stealth Operation
- **Hidden from Dock**: The app doesn't appear in the macOS dock
- **Auto-start on Boot**: Launches automatically when the computer starts
- **Background Execution**: Runs silently without showing windows after onboarding
- **System Tray Access**: Parents can access the dashboard via the menu bar icon

### 👨‍👩‍👧 Onboarding Process
1. First-time setup shows a configuration window
2. Parents enter their email, password, and child's name
3. After setup, the app hides and runs in the background
4. Configuration is saved securely in the system

## How It Works

### First Run (Onboarding)
1. Launch the app - the setup window will appear
2. Fill in parent credentials and child's name
3. Click "Complete Setup"
4. The app will hide and continue running in the background

### After Onboarding
- App starts automatically on system boot
- Runs completely hidden from the child
- Parents can access via the hidden menu bar icon
- Use parent credentials to access the dashboard

## Technical Implementation

### Key Features Implemented

1. **Dock Hiding**
   ```javascript
   app.dock.hide(); // Removes from macOS dock
   ```

2. **Auto-launch on Startup**
   ```javascript
   app.setLoginItemSettings({
     openAtLogin: true,
     openAsHidden: true
   });
   ```

3. **Hidden Window**
   ```javascript
   show: false,
   skipTaskbar: true
   ```

4. **Background Persistence**
   - App continues running even when all windows are closed
   - Prevents accidental closure

## Configuration Storage

- Config file location: `~/Library/Application Support/monitoring-app/config.json`
- Stores onboarding status and parent information
- Persists across app restarts

## Development

### Install Dependencies
```bash
npm install
```

### Run the App
```bash
npm start
```

### Reset Onboarding (for testing)
Delete the config file:
```bash
rm ~/Library/Application\ Support/monitoring-app/config.json
```

## Security Considerations

⚠️ **Important Security Notes**:

1. **Password Storage**: Currently stores passwords in plain text. For production:
   - Hash passwords using bcrypt or similar
   - Use secure credential storage (Keychain on macOS)

2. **Data Encryption**: Encrypt all monitoring data
3. **Secure Communication**: Use HTTPS for any remote data transmission

## Legal & Ethical Considerations

⚠️ **Important**:
- Only use on devices you own or have explicit permission to monitor
- Comply with local laws regarding monitoring and privacy
- Children should be informed about monitoring (varies by jurisdiction)
- This is intended for parental control, not unauthorized surveillance

## Building for Production

To create a distributable app:

```bash
npm install electron-builder --save-dev
npm run build
```

## Next Steps / TODO

- [ ] Add password hashing for parent credentials
- [ ] Implement actual monitoring features (screen time, apps, etc.)
- [ ] Add remote dashboard for parents
- [ ] Create proper app icon
- [ ] Add authentication for dashboard access
- [ ] Implement data encryption
- [ ] Add activity logging
- [ ] Create reporting features

## License

MIT

