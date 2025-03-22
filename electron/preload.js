import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Authentication
    login: (credentials) => ipcRenderer.invoke('login', credentials),
    logout: () => ipcRenderer.invoke('logout'),
    getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
    
    // Website Access Control
    checkWebsiteAccess: (domain) => ipcRenderer.invoke('check-website-access', domain),
    
    // Website Rules Management
    getWebsiteRules: () => ipcRenderer.invoke('get-website-rules'),
    addWebsiteRule: (rule) => ipcRenderer.invoke('add-website-rule', rule),
    deleteWebsiteRule: (ruleId) => ipcRenderer.invoke('delete-website-rule', ruleId),
    
    // Settings Management
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
    
    // User Management
    getUsers: () => ipcRenderer.invoke('get-users'),
    addUser: (user) => ipcRenderer.invoke('add-user', user),
    updateUser: (id, data) => ipcRenderer.invoke('update-user', { id, data }),
    
    // Browsing Activity
    getBrowsingActivities: () => ipcRenderer.invoke('get-browsing-activities'),
    createBrowsingActivity: (activity) => ipcRenderer.invoke('create-browsing-activity', activity),
    
    // Browser Controls
    hideWindow: () => ipcRenderer.invoke('hide-window'),
    showWindow: () => ipcRenderer.invoke('show-window'),
    quitApp: () => ipcRenderer.invoke('quit-app'),
    
    // Window title management
    setWindowTitle: (data) => ipcRenderer.invoke('set-window-title', data),
    getPageTitle: (url) => ipcRenderer.invoke('get-page-title', url),
    
    // Window/page navigation
    onNavigateTo: (callback) => {
      // Remove existing listeners to avoid duplicates
      ipcRenderer.removeAllListeners('navigate-to');
      ipcRenderer.on('navigate-to', (_, url) => callback(url));
      return () => {
        ipcRenderer.removeAllListeners('navigate-to');
      };
    }
  }
);