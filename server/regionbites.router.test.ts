import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  advancePracticeOrder: vi.fn(),
  createPracticeOrder: vi.fn(),
  getAllPracticeOrders: vi.fn(),
  getPracticeOrderEvents: vi.fn(),
  getPracticeOrdersForCustomer: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function createContext(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role
      ? {
          id: 7,
          openId: "practice-user",
          name: "Practice User",
          email: "practice@example.com",
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("RegionBites private practice procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks unauthenticated customer order access", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.practiceOrders.mine()).rejects.toMatchObject({ message: UNAUTHED_ERR_MSG });
  });

  it("creates a practice order for the signed-in customer only", async () => {
    dbMocks.createPracticeOrder.mockResolvedValue({ id: 21, orderNumber: "RB-260820-ABC" });
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.practiceOrders.create({
      deliveryAddress: "12 Palm Road, Bandra West, Mumbai 400050",
      items: [{ id: "smoky-stack", quantity: 1 }],
    })).resolves.toMatchObject({ id: 21 });

    expect(dbMocks.createPracticeOrder).toHaveBeenCalledWith({
      customerId: 7,
      deliveryAddress: "12 Palm Road, Bandra West, Mumbai 400050",
      cart: [{ id: "smoky-stack", quantity: 1 }],
    });
  });

  it("returns only the signed-in customer’s practice orders", async () => {
    dbMocks.getPracticeOrdersForCustomer.mockResolvedValue([{ id: 8, customerId: 7 }]);
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.practiceOrders.mine()).resolves.toEqual([{ id: 8, customerId: 7 }]);
    expect(dbMocks.getPracticeOrdersForCustomer).toHaveBeenCalledWith(7);
  });

  it("blocks non-admin users from practice operation controls", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.practiceAdmin.advance({ orderId: 8, nextStatus: "accepted" })).rejects.toMatchObject({ message: NOT_ADMIN_ERR_MSG });
  });

  it("allows the project owner to advance a practice ticket", async () => {
    dbMocks.advancePracticeOrder.mockResolvedValue({ id: 8, status: "accepted" });
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.practiceAdmin.advance({ orderId: 8, nextStatus: "accepted" })).resolves.toMatchObject({ status: "accepted" });
    expect(dbMocks.advancePracticeOrder).toHaveBeenCalledWith({ orderId: 8, nextStatus: "accepted" });
  });
});

