import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertWebsiteRuleSchema, insertBrowsingActivitySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Put application routes here
  // Prefix all routes with /api

  // Website Rules CRUD
  app.get("/api/website-rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const rules = await storage.getAllWebsiteRules();
    res.json(rules);
  });

  app.post("/api/website-rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Only admins can create website rules" });
    }
    
    try {
      const validData = insertWebsiteRuleSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      const rule = await storage.createWebsiteRule(validData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.put("/api/website-rules/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Only admins can update website rules" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const rule = await storage.getWebsiteRule(id);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      const updatedRule = await storage.updateWebsiteRule(id, req.body);
      res.json(updatedRule);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/website-rules/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Only admins can delete website rules" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const success = await storage.deleteWebsiteRule(id);
      if (!success) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User Management
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Only admins can view all users" });
    }
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Browse Activity
  app.get("/api/browsing-activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    let activities;
    if (user.isAdmin) {
      // Admins can see all activities
      activities = await storage.getAllBrowsingActivities();
    } else {
      // Regular users can only see their own activities
      activities = await storage.getUserBrowsingActivities(user.id);
    }
    
    res.json(activities);
  });

  app.get("/api/recent-activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Only admins can view recent activities" });
    }
    
    const limit = parseInt(req.query.limit as string) || 5;
    const activities = await storage.getRecentBrowsingActivities(limit);
    res.json(activities);
  });

  // Check website access
  app.post("/api/check-access", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ message: "Domain is required" });
    }
    
    try {
      const user = req.user;
      const result = await storage.checkWebsiteAccess(user.id, domain);
      
      // Log the browsing activity if logging is enabled
      const settings = await storage.getAppSettings();
      if (settings?.loggingEnabled) {
        await storage.createBrowsingActivity({
          userId: user.id,
          domain: domain,
          status: result.isAllowed ? "Allowed" : "Blocked"
        });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // App Settings
  app.get("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Only admins can view settings" });
    }
    
    const settings = await storage.getAppSettings();
    res.json(settings);
  });

  app.put("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Only admins can update settings" });
    }
    
    try {
      const settings = await storage.updateAppSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
