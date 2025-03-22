const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const storage = require('./storage');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

// Create the browser window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true // Enable webview tag for browser functionality
    },
    icon: path.join(__dirname, 'icons/icon.png')
  });

  // Load the app
  if (isDev) {
    // Load from development server
    mainWindow.loadURL('http://localhost:5000');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    // Load from production build
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Clean up when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create the application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]);
  
  Menu.setApplicationMenu(menu);
}

// Initialize the app when ready
app.whenReady().then(() => {
  createMainWindow();

  // Set up all IPC handlers for communication with renderer process
  setupIpcHandlers();

  // For macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setup IPC handlers for communication between main and renderer processes
function setupIpcHandlers() {
  // Authentication
  ipcMain.handle('login', async (event, credentials) => {
    try {
      return await storage.login(credentials);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  });

  ipcMain.handle('logout', async () => {
    try {
      return await storage.logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  });

  ipcMain.handle('get-current-user', async () => {
    try {
      return await storage.getCurrentUser();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  });

  // Website Rules
  ipcMain.handle('get-website-rules', async () => {
    try {
      return await storage.getAllWebsiteRules();
    } catch (error) {
      console.error('Get website rules error:', error);
      throw new Error('Failed to fetch website rules');
    }
  });

  ipcMain.handle('add-website-rule', async (event, rule) => {
    try {
      return await storage.createWebsiteRule(rule);
    } catch (error) {
      console.error('Add website rule error:', error);
      throw new Error('Failed to add website rule');
    }
  });

  ipcMain.handle('delete-website-rule', async (event, ruleId) => {
    try {
      return await storage.deleteWebsiteRule(ruleId);
    } catch (error) {
      console.error('Delete website rule error:', error);
      throw new Error('Failed to delete website rule');
    }
  });

  // User Management
  ipcMain.handle('get-users', async () => {
    try {
      return await storage.getAllUsers();
    } catch (error) {
      console.error('Get users error:', error);
      throw new Error('Failed to fetch users');
    }
  });

  ipcMain.handle('add-user', async (event, user) => {
    try {
      return await storage.createUser(user);
    } catch (error) {
      console.error('Add user error:', error);
      throw new Error('Failed to add user');
    }
  });

  ipcMain.handle('update-user', async (event, { id, data }) => {
    try {
      return await storage.updateUser(id, data);
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Failed to update user');
    }
  });

  // Browsing Activity
  ipcMain.handle('get-browsing-activities', async () => {
    try {
      return await storage.getAllBrowsingActivities();
    } catch (error) {
      console.error('Get browsing activities error:', error);
      throw new Error('Failed to fetch browsing activities');
    }
  });

  // Website Access Control
  ipcMain.handle('check-website-access', async (event, domain) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      return await storage.checkWebsiteAccess(currentUser.id, domain);
    } catch (error) {
      console.error('Check website access error:', error);
      throw new Error('Failed to check website access');
    }
  });

  // Settings
  ipcMain.handle('get-settings', async () => {
    try {
      return await storage.getAppSettings();
    } catch (error) {
      console.error('Get settings error:', error);
      throw new Error('Failed to fetch settings');
    }
  });

  ipcMain.handle('update-settings', async (event, settings) => {
    try {
      return await storage.updateAppSettings(settings);
    } catch (error) {
      console.error('Update settings error:', error);
      throw new Error('Failed to update settings');
    }
  });
}

// Function to check if a domain matches any rule
function findMatchingRule(domain) {
  const rules = storage.getAllWebsiteRules();
  
  // Check for exact domain match
  const exactMatch = rules.find(rule => rule.domain === domain);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Check for wildcard domains (*.example.com)
  const wildcardMatches = rules.filter(rule => rule.domain.startsWith('*.'));
  for (const rule of wildcardMatches) {
    const baseDomain = rule.domain.substring(2); // Remove '*.'
    if (domain.endsWith(baseDomain)) {
      return rule;
    }
  }
  
  return null;
}