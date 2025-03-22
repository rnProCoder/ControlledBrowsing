const { app, BrowserWindow, ipcMain, dialog, Menu, session } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const url = require('url');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let adminWindow;

// Store for user settings and rules
let userSettings = {
  filteringEnabled: true,
  loggingEnabled: true,
  alertsEnabled: true
};

let websiteRules = [
  { domain: '*.google.com', isAllowed: true, appliedTo: 'All Users', createdBy: 1 },
  { domain: 'facebook.com', isAllowed: false, appliedTo: 'All Users', createdBy: 1 },
  { domain: 'youtube.com', isAllowed: true, appliedTo: 'All Users', createdBy: 1 }
];

// User authentication info
let users = [
  { id: 1, username: 'admin', password: 'admin123', isAdmin: true, fullName: 'Administrator' },
  { id: 2, username: 'user', password: 'user123', isAdmin: false, fullName: 'Regular User' }
];

let currentUser = null;

// Browsing activity log
let browsingActivities = [];

function createMainWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'BrowseControl'
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:5000' // Development URL
    : url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true
      });
  
  mainWindow.loadURL(startUrl);

  // Open the DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => mainWindow = null);

  // Custom native menu
  const template = [
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
      label: 'Admin',
      submenu: [
        { 
          label: 'Dashboard',
          click: () => {
            if (currentUser && currentUser.isAdmin) {
              mainWindow.loadURL(isDev ? 'http://localhost:5000/' : 'app://./index.html/');
            } else {
              dialog.showMessageBoxSync(mainWindow, {
                type: 'error',
                title: 'Access Denied',
                message: 'You need administrator privileges to access this feature.'
              });
            }
          }
        },
        { 
          label: 'Website Rules',
          click: () => {
            if (currentUser && currentUser.isAdmin) {
              mainWindow.loadURL(isDev ? 'http://localhost:5000/website-rules' : 'app://./index.html/website-rules');
            } else {
              dialog.showMessageBoxSync(mainWindow, {
                type: 'error',
                title: 'Access Denied',
                message: 'You need administrator privileges to access this feature.'
              });
            }
          }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About BrowseControl',
          click: () => {
            dialog.showMessageBoxSync(mainWindow, {
              type: 'info',
              title: 'About BrowseControl',
              message: 'BrowseControl Browser v1.0.0\nA controlled browser environment for safer web browsing.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Initialize app when Electron is ready
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    // On macOS, re-create the window when clicking the dock icon if no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  // Set up IPC handlers for communication with renderer process
  setupIpcHandlers();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Setup IPC handlers for communication between main and renderer processes
function setupIpcHandlers() {
  // Authentication
  ipcMain.handle('login', (event, credentials) => {
    const { username, password } = credentials;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      currentUser = { ...user };
      delete currentUser.password; // Don't send password back to renderer
      return { success: true, user: currentUser };
    }
    return { success: false, message: 'Invalid username or password' };
  });

  ipcMain.handle('logout', () => {
    currentUser = null;
    return { success: true };
  });

  ipcMain.handle('get-current-user', () => {
    return currentUser;
  });

  // Website access control
  ipcMain.handle('check-website-access', (event, domain) => {
    if (!userSettings.filteringEnabled) {
      return { isAllowed: true };
    }

    // Log the access attempt
    if (userSettings.loggingEnabled && currentUser) {
      browsingActivities.push({
        id: browsingActivities.length + 1,
        userId: currentUser.id,
        domain,
        timestamp: new Date().toISOString(),
        status: 'Pending'
      });
    }

    // Check if the domain is allowed
    const rule = findMatchingRule(domain);
    const isAllowed = rule ? rule.isAllowed : true; // Default to allowed if no rule

    // Update activity status
    if (userSettings.loggingEnabled && currentUser) {
      const activity = browsingActivities[browsingActivities.length - 1];
      activity.status = isAllowed ? 'Allowed' : 'Blocked';
    }

    return { isAllowed, rule };
  });

  // Get website rules
  ipcMain.handle('get-website-rules', () => {
    return websiteRules;
  });

  // Add or update website rule
  ipcMain.handle('add-website-rule', (event, rule) => {
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: 'Admin privileges required' };
    }

    const existingRuleIndex = websiteRules.findIndex(r => r.domain === rule.domain);
    if (existingRuleIndex >= 0) {
      websiteRules[existingRuleIndex] = { ...rule, createdBy: currentUser.id };
    } else {
      websiteRules.push({ ...rule, id: websiteRules.length + 1, createdBy: currentUser.id });
    }

    return { success: true };
  });

  // Delete website rule
  ipcMain.handle('delete-website-rule', (event, ruleId) => {
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: 'Admin privileges required' };
    }

    const initialLength = websiteRules.length;
    websiteRules = websiteRules.filter(r => r.id !== ruleId);

    return { success: websiteRules.length < initialLength };
  });

  // Get settings
  ipcMain.handle('get-settings', () => {
    return userSettings;
  });

  // Update settings
  ipcMain.handle('update-settings', (event, settings) => {
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: 'Admin privileges required' };
    }

    userSettings = { ...userSettings, ...settings };
    return { success: true };
  });

  // Get browsing activities
  ipcMain.handle('get-browsing-activities', () => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.isAdmin) {
      return browsingActivities;
    } else {
      return browsingActivities.filter(a => a.userId === currentUser.id);
    }
  });

  // Get users list (admin only)
  ipcMain.handle('get-users', () => {
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: 'Admin privileges required' };
    }

    // Return users without passwords
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  });

  // Add or update user (admin only)
  ipcMain.handle('add-user', (event, user) => {
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: 'Admin privileges required' };
    }

    const existingUser = users.find(u => u.username === user.username);
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }

    users.push({ ...user, id: users.length + 1 });
    return { success: true };
  });

  // Update user (admin only)
  ipcMain.handle('update-user', (event, { id, data }) => {
    if (!currentUser || !currentUser.isAdmin) {
      return { success: false, message: 'Admin privileges required' };
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex < 0) {
      return { success: false, message: 'User not found' };
    }

    users[userIndex] = { ...users[userIndex], ...data };
    return { success: true };
  });
}

// Helper function to find matching rule for a domain
function findMatchingRule(domain) {
  // Exact match
  let rule = websiteRules.find(r => r.domain === domain);
  if (rule) return rule;

  // Match with wildcard (e.g., *.example.com)
  const domainParts = domain.split('.');
  if (domainParts.length > 1) {
    const baseDomain = domainParts.slice(domainParts.length - 2).join('.');
    rule = websiteRules.find(r => {
      return r.domain === `*.${baseDomain}`;
    });
    if (rule) return rule;
  }

  return null;
}