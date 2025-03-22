import { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import * as storage from './storage.js';
import * as browserUtils from './browser-utils.js';

// ES Modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global references to prevent garbage collection
let mainWindow;
let tray;

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
        { 
          label: 'Hide to Tray',
          click: () => {
            mainWindow.hide();
          }
        },
        { type: 'separator' },
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
  
  // Set up minimize to tray functionality
  handleWindowClose();
}

// Create system tray
function createTray() {
  // Use a default icon path (should create this file)
  const iconPath = path.join(__dirname, 'icons/tray-icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show BrowseControl', 
      click: () => {
        if (mainWindow === null) {
          createMainWindow();
        } else {
          mainWindow.show();
        }
      } 
    },
    { type: 'separator' },
    { 
      label: 'Settings',
      click: () => {
        if (mainWindow === null) {
          createMainWindow();
        }
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/settings');
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('BrowseControl');
  tray.setContextMenu(contextMenu);
  
  // Double-click on the tray icon to show the app
  tray.on('double-click', () => {
    if (mainWindow === null) {
      createMainWindow();
    } else {
      mainWindow.show();
    }
  });
}

// Initialize the app when ready
app.whenReady().then(() => {
  createMainWindow();
  createTray();

  // Set up all IPC handlers for communication with renderer process
  setupIpcHandlers();

  // For macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// When all windows are closed, don't quit the app since we have a tray icon
app.on('window-all-closed', () => {
  // On macOS it's common to re-create a window when
  // the dock icon is clicked and there are no other windows open.
  if (process.platform !== 'darwin') {
    // Don't quit the app when windows are closed
    // The app continues running in the background with the tray icon
  }
});

// Handle window close event - minimize to tray instead of closing
function handleWindowClose() {
  if (mainWindow) {
    mainWindow.on('close', (event) => {
      // Prevent the window from actually closing
      event.preventDefault();
      // Hide it instead
      mainWindow.hide();
      
      // On macOS, also hide dock icon when all windows are hidden
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    });
  }
}

// Setup IPC handlers for communication between main and renderer processes
function setupIpcHandlers() {
  // Window Controls
  ipcMain.handle('hide-window', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
    return true;
  });

  ipcMain.handle('show-window', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
    return true;
  });

  ipcMain.handle('quit-app', () => {
    app.quit();
    return true;
  });
  
  // Window title and page management
  ipcMain.handle('set-window-title', (event, { url, pageTitle }) => {
    if (mainWindow) {
      const title = browserUtils.getWindowTitle(url, pageTitle);
      mainWindow.setTitle(title);
    }
    return true;
  });

  ipcMain.handle('get-page-title', (event, url) => {
    return browserUtils.getPageTitleFromUrl(url);
  });

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
  
  ipcMain.handle('create-browsing-activity', async (event, activity) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Make sure userId is set to current user
      const activityWithUser = {
        ...activity,
        userId: currentUser.id
      };
      
      return await storage.createBrowsingActivity(activityWithUser);
    } catch (error) {
      console.error('Create browsing activity error:', error);
      throw new Error('Failed to record browsing activity');
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