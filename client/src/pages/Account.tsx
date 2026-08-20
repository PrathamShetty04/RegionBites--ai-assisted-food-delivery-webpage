/** Mumbai Market Canopy: a private customer account surface for simulated orders only. */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, ChefHat, Clock3, MapPin, PackageCheck, ShieldCheck, Sparkles, Truck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const statusMeta = {
  payment_simulated: { label: "Practice payment approved", icon: ShieldCheck },
  accepted: { label: "Kitchen ticket accepted", icon: CheckCircle2 },
  preparing: { label: "Cooking now", icon: ChefHat },
  packed: { label: "Packed for dispatch", icon: PackageCheck },
  out_for_delivery: { label: "Simulated rider on the way", icon: Truck },
  delivered: { label: "Delivered in practice timeline", icon: CheckCircle2 },
  cancelled: { label: "Practice order cancelled", icon: Clock3 },
} as const;

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function Account() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const ordersQuery = trpc.practiceOrders.mine.useQuery(undefined, { enabled: isAuthenticated });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const selectedOrder = useMemo(
    () => ordersQuery.data?.find((order) => order.id === selectedOrderId) ?? ordersQuery.data?.[0],
    [ordersQuery.data, selectedOrderId],
  );
  const eventsQuery = trpc.practiceOrders.events.useQuery({ orderId: selectedOrder?.id ?? 1 }, { enabled: Boolean(selectedOrder?.id) });

  if (loading) return <div className="counter-loading"><span className="loading-ticket">RB / ACCOUNT</span><Sparkles /><strong>Checking your practice ticket…</strong><small>No real customer data is used in this workspace.</small></div>;

  if (!user) {
    return <main className="account-gate"><div className="gate-mark"><UserRound /></div><span className="eyebrow eyebrow-dark">Private practice access</span><h1>Sign in to keep your <em>practice orders.</em></h1><p>Accounts are only for this learning project. No real customer, payment, or delivery information is collected here.</p><button className="button button-chili" onClick={startLogin}>Sign in for practice access</button><button className="back-link" onClick={() => setLocation("/")}><ArrowLeft /> Back to RegionBites</button></main>;
  }

  const parsedLines = selectedOrder ? JSON.parse(selectedOrder.lineItems) as Array<{ id: string; name: string; price: number; quantity: number; image: string }> : [];
  const CurrentIcon = selectedOrder ? statusMeta[selectedOrder.status].icon : Sparkles;

  return (
    <main className="account-page">
      <header className="account-topbar"><button className="back-link" onClick={() => setLocation("/")}><ArrowLeft /> Storefront</button><div className="account-brand"><span>REGIONBITES</span><small>PRIVATE PRACTICE</small></div><button className="account-signout" onClick={logout}>Sign out</button></header>
      <div className="account-intro"><div><span className="eyebrow eyebrow-dark"><Sparkles /> Practice account</span><h1>Good to see you,<br /><em>{user.name?.split(" ")[0] || "guest"}.</em></h1><p>Follow your private practice orders from simulated payment to rider handoff. Nothing here is a real purchase.</p></div><div className="account-note"><ShieldCheck /><span><strong>No charge, no dispatch.</strong> This is a portfolio training workspace.</span></div></div>
      <section className="account-content" aria-label="Practice orders">
        <aside className="order-list"><div className="order-list-head"><span className="eyebrow eyebrow-dark">Your training tickets</span><button onClick={() => setLocation("/")}>New practice order</button></div>{ordersQuery.isLoading ? <p className="order-empty">Loading your practice tickets…</p> : ordersQuery.data?.length ? ordersQuery.data.map((order) => { const meta = statusMeta[order.status]; const Icon = meta.icon; return <button className={`order-list-item ${order.id === selectedOrder?.id ? "is-active" : ""}`} key={order.id} onClick={() => setSelectedOrderId(order.id)}><div><span>{order.orderNumber}</span><strong>{formatPrice(order.total)}</strong></div><p><Icon /> {meta.label}</p><small>{formatDate(order.createdAt)}</small></button> }) : <div className="order-empty"><PackageCheck /><h2>Your first training ticket is waiting.</h2><p>Choose a bite from the storefront to test the checkout and delivery timeline.</p><button className="button button-dark" onClick={() => setLocation("/")}>Go to the counter</button></div>}</aside>
        <article className="order-detail">{selectedOrder ? <><div className="detail-head"><div><span className="eyebrow eyebrow-dark">Order tracking demo</span><h2>{selectedOrder.orderNumber}</h2><p>Created {formatDate(selectedOrder.createdAt)}</p></div><div className="detail-status"><CurrentIcon /><span>{statusMeta[selectedOrder.status].label}</span></div></div><div className="practice-notice"><Sparkles /><span><strong>Simulation note:</strong> The payment, kitchen actions, rider location, and delivery status are practice events only.</span></div><div className="tracking-timeline">{eventsQuery.isLoading ? <p>Loading your practice timeline…</p> : eventsQuery.data?.slice().reverse().map((event, index) => { const Icon = statusMeta[event.status].icon; return <div className="timeline-event" key={event.id}><span className="timeline-pin"><Icon /></span><div><strong>{statusMeta[event.status].label}</strong><p>{event.note}</p><small>{formatDate(event.occurredAt)}</small></div>{index < (eventsQuery.data?.length ?? 0) - 1 && <i />}</div> })}</div><div className="detail-split"><section><span className="eyebrow eyebrow-dark">Practice receipt</span>{parsedLines.map((line) => <div className="receipt-line" key={line.id}><span>{line.quantity}× {line.name}</span><strong>{formatPrice(line.quantity * line.price)}</strong></div>)}<div className="receipt-line receipt-total"><span>Practice total</span><strong>{formatPrice(selectedOrder.total)}</strong></div><small>{selectedOrder.paymentLabel}</small></section><section><span className="eyebrow eyebrow-dark">Practice address</span><p className="address-line"><MapPin /> {selectedOrder.deliveryAddress}</p></section></div></> : <div className="detail-empty"><Sparkles /><h2>Choose a training ticket</h2><p>Your simulated payment, kitchen, and delivery status will appear here.</p></div>}</article>
      </section>
    </main>
  );
}
