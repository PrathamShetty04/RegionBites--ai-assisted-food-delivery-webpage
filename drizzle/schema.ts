import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Private learning records only. They model a food-order lifecycle but do not represent
 * financial transactions, a production dispatch service, or public customer data.
 */
export const practiceOrders = mysqlTable("practice_orders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => users.id),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", [
    "payment_simulated",
    "accepted",
    "preparing",
    "packed",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]).notNull().default("payment_simulated"),
  subtotal: int("subtotal").notNull(),
  deliveryFee: int("deliveryFee").notNull(),
  total: int("total").notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  lineItems: text("lineItems").notNull(),
  paymentLabel: varchar("paymentLabel", { length: 120 }).notNull().default("Practice payment — no charge"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const practiceOrderEvents = mysqlTable("practice_order_events", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => practiceOrders.id),
  status: mysqlEnum("status", [
    "payment_simulated",
    "accepted",
    "preparing",
    "packed",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]).notNull(),
  note: text("note").notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export type PracticeOrder = typeof practiceOrders.$inferSelect;
export type PracticeOrderEvent = typeof practiceOrderEvents.$inferSelect;
