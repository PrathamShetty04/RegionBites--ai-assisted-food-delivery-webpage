/** Mumbai Market Canopy: private role-gated practice operations board using the provided dashboard shell. */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ChefHat, ClipboardList, PackageCheck, ShieldAlert, Sparkles, Truck } from "lucide-react";
import type { PracticeOrderStatus } from "../../../shared/regionbites";

const nextStates: Partial<Record<PracticeOrderStatus, { label: string; status: PracticeOrderStatus; icon: typeof ArrowRight }>> = {
  payment_simulated: { label: "Accept ticket", status: "accepted", icon: ArrowRight },
  accepted: { label: "Start prep", status: "preparing", icon: ChefHat },
  preparing: { label: "Mark packed", status: "packed", icon: PackageCheck },
  packed: { label: "Dispatch rider", status: "out_for_delivery", icon: Truck },
  out_for_delivery: { label: "Mark delivered", status: "delivered", icon: PackageCheck },
};

const statusLabels: Record<PracticeOrderStatus, string> = {
  payment_simulated: "Practice paid",
  accepted: "Accepted",
  preparing: "Preparing",
  packed: "Packed",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function Admin() {
  const { user, loading } = useAuth();
  const ordersQuery = trpc.practiceAdmin.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const utils = trpc.useUtils();
  const advanceMutation = trpc.practiceAdmin.advance.useMutation({ onSuccess: () => utils.practiceAdmin.list.invalidate() });

  if (loading) return <div className="counter-loading"><span className="loading-ticket">RB / OPS</span><Sparkles /><strong>Opening the practice counter…</strong><small>Only the project owner can move training tickets.</small></div>;
  if (!user || user.role !== "admin") return <main className="admin-denied"><ShieldAlert /><span className="eyebrow eyebrow-dark">Private role required</span><h1>Admin practice access only.</h1><p>This workspace is reserved for the project owner. Sign in with the owner account to operate practice orders.</p></main>;

  const activeOrders = ordersQuery.data?.filter(({ order }) => !["delivered", "cancelled"].includes(order.status)) ?? [];
  const completedOrders = ordersQuery.data?.filter(({ order }) => ["delivered", "cancelled"].includes(order.status)) ?? [];

  return <DashboardLayout><main className="admin-page"><section className="admin-hero"><div><span className="eyebrow eyebrow-dark"><Sparkles /> RegionBites practice ops</span><h1>Kitchen and delivery<br /><em>training board.</em></h1><p>Advance only private, no-charge practice tickets through their simulated kitchen and dispatch flow.</p></div><div className="admin-summary"><span><strong>{activeOrders.length}</strong> active tickets</span><span><strong>{completedOrders.length}</strong> finished tickets</span></div></section><section className="admin-board"><div className="admin-board-head"><div><span className="eyebrow eyebrow-dark">Live practice queue</span><h2>Orders in motion</h2></div><ClipboardList /></div>{ordersQuery.isLoading ? <p className="admin-empty">Loading practice tickets…</p> : activeOrders.length ? <div className="admin-grid">{activeOrders.map(({ order, customer }) => { const next = nextStates[order.status]; const Icon = next?.icon ?? ArrowRight; return <article className="admin-order-card" key={order.id}><div className="admin-order-card-head"><span>{order.orderNumber}</span><strong className={`status-tag status-${order.status}`}>{statusLabels[order.status]}</strong></div><h3>{customer.name || "Practice customer"}</h3><p>{order.deliveryAddress}</p><div className="admin-order-card-foot"><strong>{formatPrice(order.total)}</strong>{next && <button disabled={advanceMutation.isPending} onClick={() => advanceMutation.mutate({ orderId: order.id, nextStatus: next.status })}>{next.label} <Icon /></button>}</div></article>})}</div> : <div className="admin-empty"><ChefHat /><h3>The practice kitchen is clear.</h3><p>Sign in as a customer and create a safe training order from the storefront to populate this board.</p></div>}</section><section className="admin-completed"><span className="eyebrow eyebrow-dark">Archive</span><h2>Completed practice tickets</h2><div>{completedOrders.length ? completedOrders.map(({ order }) => <span key={order.id}>{order.orderNumber} · {statusLabels[order.status]}</span>) : <p>Completed tickets will be kept here for this practice session.</p>}</div></section></main></DashboardLayout>;
}
