/**
 * Electron storage module
 * 
 * This module provides a storage interface for the Electron application.
 * It maintains data in memory for the current session and provides methods
 * for CRUD operations on users, website rules, browsing activities, and app settings.
 */

// In-memory storage for the Electron app
class ElectronStorage {
  constructor() {
    // Initialize storage
    this.users = new Map();
    this.websiteRules = new Map();
    this.browsingActivities = new Map();
    this.appSettings = undefined;
    
    // Current logged in user
    this.currentUser = null;
    
    // ID counters
    this.userIdCounter = 1;
    this.ruleIdCounter = 1;
    this.activityIdCounter = 1;
    
    // Initialize with default admin user
    this.createUser({
      username: 'admin',
      password: 'admin123', // In a real app, this would be hashed
      isAdmin: true,
      fullName: 'Administrator'
    });

    // Create some example website rules
    this.createWebsiteRule({
      domain: 'example.com',
      isAllowed: true,
      isTimeLimited: null,
      appliedTo: null,
      createdBy: 1
    });
    
    this.createWebsiteRule({
      domain: 'facebook.com',
      isAllowed: false,
      isTimeLimited: null,
      appliedTo: null,
      createdBy: 1
    });
    
    this.createWebsiteRule({
      domain: '*.youtube.com',
      isAllowed: true,
      isTimeLimited: true,
      appliedTo: null,
      createdBy: 1
    });
  }

  // Authentication methods
  async login(credentials) {
    const { username, password } = credentials;
    const user = this.getUserByUsername(username);
    
    if (!user || user.password !== password) { // In a real app, would use proper password comparison
      throw new Error('Invalid username or password');
    }
    
    this.currentUser = user;
    return user;
  }
  
  async logout() {
    this.currentUser = null;
    return true;
  }
  
  async getCurrentUser() {
    return this.currentUser;
  }

  // User operations
  getUser(id) {
    return this.users.get(id);
  }
  
  getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }
  
  createUser(userData) {
    const id = this.userIdCounter++;
    
    // Ensure required fields
    const user = {
      id,
      username: userData.username,
      password: userData.password,
      isAdmin: !!userData.isAdmin,
      fullName: userData.fullName || null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  updateUser(id, userData) {
    const user = this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    // Update current user if it's the same
    if (this.currentUser && this.currentUser.id === id) {
      this.currentUser = updatedUser;
    }
    
    return updatedUser;
  }
  
  getAllUsers() {
    return Array.from(this.users.values());
  }
  
  deleteUser(id) {
    return this.users.delete(id);
  }
  
  // Website rule operations
  getWebsiteRule(id) {
    return this.websiteRules.get(id);
  }
  
  createWebsiteRule(ruleData) {
    const id = this.ruleIdCounter++;
    
    // Ensure required fields
    const rule = {
      id,
      domain: ruleData.domain,
      isAllowed: !!ruleData.isAllowed,
      isTimeLimited: ruleData.isTimeLimited || null,
      appliedTo: ruleData.appliedTo || null,
      createdBy: ruleData.createdBy
    };
    
    this.websiteRules.set(id, rule);
    return rule;
  }
  
  updateWebsiteRule(id, ruleData) {
    const rule = this.getWebsiteRule(id);
    if (!rule) {
      return undefined;
    }
    
    const updatedRule = { ...rule, ...ruleData };
    this.websiteRules.set(id, updatedRule);
    return updatedRule;
  }
  
  getAllWebsiteRules() {
    return Array.from(this.websiteRules.values());
  }
  
  deleteWebsiteRule(id) {
    return this.websiteRules.delete(id);
  }
  
  // Browsing activity operations
  getBrowsingActivity(id) {
    return this.browsingActivities.get(id);
  }
  
  createBrowsingActivity(activityData) {
    const id = this.activityIdCounter++;
    
    const activity = {
      id,
      userId: activityData.userId,
      url: activityData.url,
      timestamp: activityData.timestamp || new Date().toISOString(),
      action: activityData.action,
      ruleId: activityData.ruleId || null
    };
    
    this.browsingActivities.set(id, activity);
    return activity;
  }
  
  getAllBrowsingActivities() {
    return Array.from(this.browsingActivities.values());
  }
  
  getUserBrowsingActivities(userId) {
    return this.getAllBrowsingActivities().filter(
      activity => activity.userId === userId
    );
  }
  
  getRecentBrowsingActivities(limit) {
    return this.getAllBrowsingActivities()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
  
  // App settings operations
  getAppSettings() {
    if (!this.appSettings) {
      // Default settings
      this.appSettings = {
        id: 1,
        defaultBrowserHomepage: 'https://www.google.com',
        enableBrowsingHistory: true,
        retentionPeriodDays: 30,
        notifyOnBlocked: true
      };
    }
    return this.appSettings;
  }
  
  updateAppSettings(settings) {
    this.appSettings = { ...this.getAppSettings(), ...settings };
    return this.appSettings;
  }
  
  // Website access control
  async checkWebsiteAccess(userId, domain) {
    // Get all rules
    const rules = this.getAllWebsiteRules();
    
    // Check for exact domain match
    let matchedRule = rules.find(rule => rule.domain === domain);
    
    // Check for wildcard domains if no exact match
    if (!matchedRule) {
      const wildcardRules = rules.filter(rule => rule.domain.startsWith('*.'));
      for (const rule of wildcardRules) {
        const baseDomain = rule.domain.substring(2); // Remove '*.'
        if (domain.endsWith(baseDomain)) {
          matchedRule = rule;
          break;
        }
      }
    }
    
    // If no rule is found, default to allowed
    if (!matchedRule) {
      return { isAllowed: true };
    }
    
    // Log the access attempt
    this.createBrowsingActivity({
      userId,
      url: `https://${domain}`,
      action: matchedRule.isAllowed ? 'ALLOWED' : 'BLOCKED',
      ruleId: matchedRule.id
    });
    
    return {
      isAllowed: matchedRule.isAllowed,
      rule: matchedRule
    };
  }
}

const storage = new ElectronStorage();
export default storage;

// Export individual methods for easier imports
export const login = storage.login.bind(storage);
export const logout = storage.logout.bind(storage);
export const getCurrentUser = storage.getCurrentUser.bind(storage);
export const getUser = storage.getUser.bind(storage);
export const getUserByUsername = storage.getUserByUsername.bind(storage);
export const createUser = storage.createUser.bind(storage);
export const updateUser = storage.updateUser.bind(storage);
export const getAllUsers = storage.getAllUsers.bind(storage);
export const deleteUser = storage.deleteUser.bind(storage);
export const getWebsiteRule = storage.getWebsiteRule.bind(storage);
export const createWebsiteRule = storage.createWebsiteRule.bind(storage);
export const updateWebsiteRule = storage.updateWebsiteRule.bind(storage);
export const getAllWebsiteRules = storage.getAllWebsiteRules.bind(storage);
export const deleteWebsiteRule = storage.deleteWebsiteRule.bind(storage);
export const getBrowsingActivity = storage.getBrowsingActivity.bind(storage);
export const createBrowsingActivity = storage.createBrowsingActivity.bind(storage);
export const getAllBrowsingActivities = storage.getAllBrowsingActivities.bind(storage);
export const getUserBrowsingActivities = storage.getUserBrowsingActivities.bind(storage);
export const getRecentBrowsingActivities = storage.getRecentBrowsingActivities.bind(storage);
export const getAppSettings = storage.getAppSettings.bind(storage);
export const updateAppSettings = storage.updateAppSettings.bind(storage);
export const checkWebsiteAccess = storage.checkWebsiteAccess.bind(storage);