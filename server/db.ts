import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  practiceOrderEvents,
  practiceOrders,
  users,
} from "../drizzle/schema";
import {
  canAdvancePracticeOrder,
  createPracticeOrderNumber,
  type PracticeCartInput,
  type PracticeOrderStatus,
  PRACTICE_STATUS_NOTES,
  calculatePracticeOrder,
} from "../shared/regionbites";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createPracticeOrder(input: {
  customerId: number;
  deliveryAddress: string;
  cart: PracticeCartInput[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Practice database is unavailable");

  const receipt = calculatePracticeOrder(input.cart);
  if (receipt.lines.length === 0) throw new Error("Choose at least one valid practice menu item");

  let orderNumber = createPracticeOrderNumber();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await db.select({ id: practiceOrders.id }).from(practiceOrders).where(eq(practiceOrders.orderNumber, orderNumber)).limit(1);
    if (existing.length === 0) break;
    orderNumber = createPracticeOrderNumber();
  }

  await db.insert(practiceOrders).values({
    customerId: input.customerId,
    orderNumber,
    status: "payment_simulated",
    subtotal: receipt.subtotal,
    deliveryFee: receipt.deliveryFee,
    total: receipt.total,
    deliveryAddress: input.deliveryAddress.trim(),
    lineItems: JSON.stringify(receipt.lines),
    paymentLabel: "Practice payment approved — no charge",
  });

  const [created] = await db.select().from(practiceOrders).where(eq(practiceOrders.orderNumber, orderNumber)).limit(1);
  if (!created) throw new Error("Practice order could not be created");

  await db.insert(practiceOrderEvents).values({
    orderId: created.id,
    status: "payment_simulated",
    note: PRACTICE_STATUS_NOTES.payment_simulated,
  });

  return created;
}

export async function getPracticeOrdersForCustomer(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Practice database is unavailable");
  return db.select().from(practiceOrders).where(eq(practiceOrders.customerId, customerId)).orderBy(desc(practiceOrders.createdAt));
}

export async function getPracticeOrderEvents(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Practice database is unavailable");
  return db.select().from(practiceOrderEvents).where(eq(practiceOrderEvents.orderId, orderId)).orderBy(desc(practiceOrderEvents.occurredAt));
}

export async function getAllPracticeOrders() {
  const db = await getDb();
  if (!db) throw new Error("Practice database is unavailable");
  return db
    .select({ order: practiceOrders, customer: users })
    .from(practiceOrders)
    .innerJoin(users, eq(practiceOrders.customerId, users.id))
    .orderBy(desc(practiceOrders.createdAt));
}

export async function advancePracticeOrder(input: {
  orderId: number;
  nextStatus: PracticeOrderStatus;
}) {
  const db = await getDb();
  if (!db) throw new Error("Practice database is unavailable");

  const [order] = await db.select().from(practiceOrders).where(eq(practiceOrders.id, input.orderId)).limit(1);
  if (!order) throw new Error("Practice order not found");
  if (!canAdvancePracticeOrder(order.status, input.nextStatus)) {
    throw new Error("This practice order cannot move to the selected status");
  }

  await db.update(practiceOrders).set({ status: input.nextStatus }).where(eq(practiceOrders.id, input.orderId));
  await db.insert(practiceOrderEvents).values({
    orderId: input.orderId,
    status: input.nextStatus,
    note: PRACTICE_STATUS_NOTES[input.nextStatus],
  });

  const [updated] = await db.select().from(practiceOrders).where(eq(practiceOrders.id, input.orderId)).limit(1);
  return updated;
}
