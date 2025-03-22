import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  fullName: text("full_name").default(""),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
  fullName: true,
});

// Website rule model
export const websiteRules = pgTable("website_rules", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  isAllowed: boolean("is_allowed").default(false).notNull(),
  isTimeLimited: boolean("is_time_limited").default(false),
  appliedTo: text("applied_to").default("All Users"),
  createdBy: integer("created_by").notNull(),
});

export const insertWebsiteRuleSchema = createInsertSchema(websiteRules).pick({
  domain: true,
  isAllowed: true,
  isTimeLimited: true,
  appliedTo: true,
  createdBy: true,
});

// Browsing activity model
export const browsingActivities = pgTable("browsing_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  domain: text("domain").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").notNull(), // "Allowed", "Blocked", "Warning"
});

export const insertBrowsingActivitySchema = createInsertSchema(browsingActivities).pick({
  userId: true,
  domain: true,
  status: true,
});

// App settings model
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  filteringEnabled: boolean("filtering_enabled").default(true).notNull(),
  loggingEnabled: boolean("logging_enabled").default(true).notNull(),
  alertsEnabled: boolean("alerts_enabled").default(true).notNull(),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).pick({
  filteringEnabled: true,
  loggingEnabled: true,
  alertsEnabled: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWebsiteRule = z.infer<typeof insertWebsiteRuleSchema>;
export type WebsiteRule = typeof websiteRules.$inferSelect;

export type InsertBrowsingActivity = z.infer<typeof insertBrowsingActivitySchema>;
export type BrowsingActivity = typeof browsingActivities.$inferSelect;

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
