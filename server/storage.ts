import { users, websiteRules, browsingActivities, appSettings } from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  WebsiteRule, 
  InsertWebsiteRule,
  BrowsingActivity,
  InsertBrowsingActivity,
  AppSettings,
  InsertAppSettings
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Website rule operations
  getWebsiteRule(id: number): Promise<WebsiteRule | undefined>;
  createWebsiteRule(rule: InsertWebsiteRule): Promise<WebsiteRule>;
  updateWebsiteRule(id: number, rule: Partial<InsertWebsiteRule>): Promise<WebsiteRule | undefined>;
  getAllWebsiteRules(): Promise<WebsiteRule[]>;
  deleteWebsiteRule(id: number): Promise<boolean>;
  
  // Browsing activity operations
  getBrowsingActivity(id: number): Promise<BrowsingActivity | undefined>;
  createBrowsingActivity(activity: InsertBrowsingActivity): Promise<BrowsingActivity>;
  getAllBrowsingActivities(): Promise<BrowsingActivity[]>;
  getUserBrowsingActivities(userId: number): Promise<BrowsingActivity[]>;
  getRecentBrowsingActivities(limit: number): Promise<BrowsingActivity[]>;
  
  // App settings operations
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings>;
  
  // Session store
  sessionStore: session.SessionStore;
  
  // Check website access
  checkWebsiteAccess(userId: number, domain: string): Promise<{isAllowed: boolean, rule?: WebsiteRule}>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private websiteRules: Map<number, WebsiteRule>;
  private browsingActivities: Map<number, BrowsingActivity>;
  private appSettingsData: AppSettings | undefined;
  sessionStore: session.SessionStore;
  
  // ID counters
  private userIdCounter: number;
  private ruleIdCounter: number;
  private activityIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.websiteRules = new Map();
    this.browsingActivities = new Map();
    
    this.userIdCounter = 1;
    this.ruleIdCounter = 1;
    this.activityIdCounter = 1;
    
    // Initialize with default app settings
    this.appSettingsData = {
      id: 1,
      filteringEnabled: true,
      loggingEnabled: true,
      alertsEnabled: true,
    };
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every day
    });
    
    // Add admin user by default
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      isAdmin: true,
      fullName: "Admin User"
    });
    
    // Add a regular user
    this.createUser({
      username: "user",
      password: "user123", // In a real app, this would be hashed
      isAdmin: false,
      fullName: "Regular User"
    });
    
    // Add some sample website rules
    this.createWebsiteRule({
      domain: "*.google.com",
      isAllowed: true,
      isTimeLimited: false,
      appliedTo: "All Users",
      createdBy: 1
    });
    
    this.createWebsiteRule({
      domain: "facebook.com",
      isAllowed: false,
      isTimeLimited: false,
      appliedTo: "All Users",
      createdBy: 1
    });
    
    this.createWebsiteRule({
      domain: "*.microsoft.com",
      isAllowed: true,
      isTimeLimited: false,
      appliedTo: "All Users",
      createdBy: 1
    });
    
    this.createWebsiteRule({
      domain: "youtube.com",
      isAllowed: true,
      isTimeLimited: true,
      appliedTo: "Group: Students",
      createdBy: 1
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Website rule operations
  async getWebsiteRule(id: number): Promise<WebsiteRule | undefined> {
    return this.websiteRules.get(id);
  }
  
  async createWebsiteRule(insertRule: InsertWebsiteRule): Promise<WebsiteRule> {
    const id = this.ruleIdCounter++;
    const rule: WebsiteRule = { ...insertRule, id };
    this.websiteRules.set(id, rule);
    return rule;
  }
  
  async updateWebsiteRule(id: number, ruleData: Partial<InsertWebsiteRule>): Promise<WebsiteRule | undefined> {
    const rule = this.websiteRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule = { ...rule, ...ruleData };
    this.websiteRules.set(id, updatedRule);
    return updatedRule;
  }
  
  async getAllWebsiteRules(): Promise<WebsiteRule[]> {
    return Array.from(this.websiteRules.values());
  }
  
  async deleteWebsiteRule(id: number): Promise<boolean> {
    return this.websiteRules.delete(id);
  }
  
  // Browsing activity operations
  async getBrowsingActivity(id: number): Promise<BrowsingActivity | undefined> {
    return this.browsingActivities.get(id);
  }
  
  async createBrowsingActivity(insertActivity: InsertBrowsingActivity): Promise<BrowsingActivity> {
    const id = this.activityIdCounter++;
    const activity: BrowsingActivity = { 
      ...insertActivity, 
      id, 
      timestamp: new Date() 
    };
    this.browsingActivities.set(id, activity);
    return activity;
  }
  
  async getAllBrowsingActivities(): Promise<BrowsingActivity[]> {
    return Array.from(this.browsingActivities.values());
  }
  
  async getUserBrowsingActivities(userId: number): Promise<BrowsingActivity[]> {
    return Array.from(this.browsingActivities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getRecentBrowsingActivities(limit: number): Promise<BrowsingActivity[]> {
    return Array.from(this.browsingActivities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  // App settings operations
  async getAppSettings(): Promise<AppSettings | undefined> {
    return this.appSettingsData;
  }
  
  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    if (!this.appSettingsData) {
      this.appSettingsData = {
        id: 1,
        filteringEnabled: settings.filteringEnabled ?? true,
        loggingEnabled: settings.loggingEnabled ?? true,
        alertsEnabled: settings.alertsEnabled ?? true,
      };
    } else {
      this.appSettingsData = {
        ...this.appSettingsData,
        ...settings
      };
    }
    return this.appSettingsData;
  }
  
  // Website access checking
  async checkWebsiteAccess(userId: number, domain: string): Promise<{isAllowed: boolean, rule?: WebsiteRule}> {
    // Get app settings to check if filtering is enabled
    const settings = await this.getAppSettings();
    if (!settings?.filteringEnabled) {
      return { isAllowed: true };
    }
    
    // Check if user exists
    const user = await this.getUser(userId);
    if (!user) {
      return { isAllowed: false };
    }
    
    // Admin users have access to everything
    if (user.isAdmin) {
      return { isAllowed: true };
    }
    
    // Check domain against rules
    const rules = await this.getAllWebsiteRules();
    
    // First, check for exact domain matches
    const exactMatch = rules.find(rule => rule.domain === domain);
    if (exactMatch) {
      return { 
        isAllowed: exactMatch.isAllowed, 
        rule: exactMatch 
      };
    }
    
    // Then check for wildcard domains (*.example.com)
    for (const rule of rules) {
      if (rule.domain.startsWith('*.')) {
        const suffix = rule.domain.substring(2);
        if (domain.endsWith(suffix) || domain === suffix) {
          return { 
            isAllowed: rule.isAllowed, 
            rule: rule 
          };
        }
      }
    }
    
    // Default policy: deny if no rule matches
    return { isAllowed: false };
  }
}

export const storage = new MemStorage();
