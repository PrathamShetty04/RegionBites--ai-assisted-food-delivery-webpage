/** Shared practice-commerce rules. All order activity is explicitly simulated and never charges a customer. */
export const PRACTICE_MENU = [
  { id: "smoky-stack", category: "Burgers", name: "The Smoky Stack", price: 279, image: "/manus-storage/regionbites-burger_c8eeae7e.jpg" },
  { id: "tandoori-momos", category: "Momos", name: "Tandoori Gully Momos", price: 219, image: "/manus-storage/regionbites-momos_3c88ad11.jpg" },
  { id: "paneer-wrap", category: "Wraps", name: "Paneer Tikka Rumali Roll", price: 249, image: "/manus-storage/regionbites-wrap_d58cd4b4.jpg" },
  { id: "peri-fries", category: "Sides", name: "Kala Masala Fries", price: 149, image: "/manus-storage/regionbites-hero_29f34196.jpg" },
] as const;

export const PRACTICE_ORDER_STATUSES = [
  "payment_simulated",
  "accepted",
  "preparing",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type PracticeOrderStatus = (typeof PRACTICE_ORDER_STATUSES)[number];
export type PracticeCartInput = { id: string; quantity: number };
export type PracticeOrderLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export const PRACTICE_STATUS_NOTES: Record<PracticeOrderStatus, string> = {
  payment_simulated: "Practice payment approved — no charge was made.",
  accepted: "Kitchen ticket accepted for the practice queue.",
  preparing: "The simulated kitchen is preparing your order.",
  packed: "Packed in the practice dispatch queue.",
  out_for_delivery: "A simulated rider is on the way.",
  delivered: "Marked delivered in the practice timeline.",
  cancelled: "Practice order cancelled.",
};

const statusTransitions: Record<PracticeOrderStatus, PracticeOrderStatus[]> = {
  payment_simulated: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["packed", "cancelled"],
  packed: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function calculatePracticeOrder(cart: PracticeCartInput[]) {
  const compact = new Map<string, number>();
  for (const item of cart) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) continue;
    compact.set(item.id, Math.min(10, (compact.get(item.id) ?? 0) + item.quantity));
  }

  const lines: PracticeOrderLine[] = [];
  compact.forEach((quantity, id) => {
    const menuItem = PRACTICE_MENU.find((item) => item.id === id);
    if (!menuItem) return;
    lines.push({ ...menuItem, quantity });
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const deliveryFee = subtotal >= 399 ? 0 : 39;
  return { lines, subtotal, deliveryFee, total: subtotal + deliveryFee };
}

export function canAdvancePracticeOrder(from: PracticeOrderStatus, to: PracticeOrderStatus) {
  return statusTransitions[from].includes(to);
}

export function createPracticeOrderNumber(now = new Date(), random = Math.random()) {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = Math.floor(random * 36 ** 3).toString(36).toUpperCase().padStart(3, "0");
  return `RB-${date}-${suffix}`;
}
