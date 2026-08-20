import { describe, expect, it } from "vitest";
import {
  calculatePracticeOrder,
  canAdvancePracticeOrder,
  createPracticeOrderNumber,
} from "../shared/regionbites";

describe("RegionBites practice order rules", () => {
  it("prices a valid practice cart from the trusted menu data", () => {
    const order = calculatePracticeOrder([
      { id: "smoky-stack", quantity: 1 },
      { id: "peri-fries", quantity: 1 },
      { id: "unknown-item", quantity: 4 },
    ]);

    expect(order.lines).toHaveLength(2);
    expect(order.subtotal).toBe(428);
    expect(order.deliveryFee).toBe(0);
    expect(order.total).toBe(428);
  });

  it("allows only forward practice order transitions", () => {
    expect(canAdvancePracticeOrder("payment_simulated", "accepted")).toBe(true);
    expect(canAdvancePracticeOrder("packed", "out_for_delivery")).toBe(true);
    expect(canAdvancePracticeOrder("delivered", "preparing")).toBe(false);
  });

  it("creates a compact human-readable practice order number", () => {
    expect(createPracticeOrderNumber(new Date("2026-08-20T12:00:00.000Z"), 0.5)).toMatch(/^RB-260820-[A-Z0-9]{3}$/);
  });
});

