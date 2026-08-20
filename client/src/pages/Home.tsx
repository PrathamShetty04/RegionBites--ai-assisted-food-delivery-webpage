/**
 * Mumbai Market Canopy: editorial Indian street-food storefront with charcoal canopy, paper-cream stalls,
 * Kashmiri chili accents, quick counter-style interactions, and the supplied RegionBites seal.
 */
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  Leaf,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

const suppliedLogo = "/manus-storage/regionbites-supplied-logo_ffeb01c8.jpg";
const compactMark = "/manus-storage/regionbites-mark_e0386377.png";
const heroImage = "/manus-storage/regionbites-wrap_d58cd4b4.jpg";

const categories = ["All bites", "Burgers", "Wraps", "Momos", "Sides"] as const;
type Category = (typeof categories)[number];

type CartState = Record<string, number>;

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [activeCategory, setActiveCategory] = useState<Category>("All bites");
  const [cart, setCart] = useState<CartState>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const menuQuery = trpc.practiceCatalog.list.useQuery();
  const menuItems = menuQuery.data ?? [];

  const createPracticeOrder = trpc.practiceOrders.create.useMutation({
    onSuccess: () => {
      setCart({});
      setCartOpen(false);
      setCheckoutOpen(false);
      toast.success("Practice order created — no payment was taken.");
      setLocation("/account");
    },
    onError: (error) => toast.error(error.message),
  });

  const filteredItems = useMemo(
    () =>
      activeCategory === "All bites"
        ? menuItems
        : menuItems.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  const cartItems = useMemo(
    () => menuItems.filter((item) => cart[item.id]),
    [cart],
  );

  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * (cart[item.id] ?? 0),
    0,
  );

  const addToCart = (itemId: string) => {
    const selected = menuItems.find((item) => item.id === itemId);
    setCart((current) => ({ ...current, [itemId]: (current[itemId] ?? 0) + 1 }));
    setCartOpen(true);
    if (selected) toast.success(`${selected.name} is in your bag`);
  };

  const updateQuantity = (itemId: string, direction: 1 | -1) => {
    setCart((current) => {
      const nextQuantity = (current[itemId] ?? 0) + direction;
      if (nextQuantity <= 0) {
        const { [itemId]: _removed, ...remaining } = current;
        return remaining;
      }
      return { ...current, [itemId]: nextQuantity };
    });
  };

  const scrollToMenu = () => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });

  const openCheckout = () => {
    if (!isAuthenticated) {
      toast.info("Sign in to create a private practice order.");
      startLogin();
      return;
    }
    setCheckoutOpen(true);
  };

  const submitPracticeOrder = () => {
    const items = Object.entries(cart).map(([id, quantity]) => ({ id, quantity }));
    createPracticeOrder.mutate({ deliveryAddress, items });
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="RegionBites home">
          <img className="brand-logo" src={suppliedLogo} alt="RegionBites — Bite of Joy" />
          <span className="brand-city">Mumbai</span>
        </a>

        <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          <a href="#menu" onClick={() => setMenuOpen(false)}>The counter</a>
          <a href="#fresh" onClick={() => setMenuOpen(false)}>Kitchen notes</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>Your order</a>
        </nav>

        <div className="topbar-actions">
          <button className="location-pill" onClick={() => toast.info("RegionBites is currently serving Mumbai only.")}> 
            <MapPin aria-hidden="true" />
            <span>Mumbai</span>
            <ChevronDown aria-hidden="true" />
          </button>
          <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open order bag with ${cartCount} items`}>
            <ShoppingBag aria-hidden="true" />
            <span className="bag-label">Bag</span>
            {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
          </button>
          <button className="account-button" onClick={() => (isAuthenticated ? setLocation("/account") : startLogin())}>
            {isAuthenticated ? (user?.name?.split(" ")[0] || "Account") : "Sign in"}
          </button>
          <button className="mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation">
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main id="top">
        <div className="practice-banner"><Sparkles aria-hidden="true" /><span><strong>Private practice project.</strong> Checkout, payment, delivery, and admin actions are simulated — no real orders or charges.</span></div>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-stripe" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><Sparkles aria-hidden="true" /> Mumbai’s made-now kitchen</div>
            <h1 id="hero-title">Hot from the pan.<br /><em>Headed your way.</em></h1>
            <p className="hero-description">A full-stack practice experience for fresh, fast Mumbai food — from the counter to a simulated door-step delivery timeline.</p>
            <div className="hero-ctas">
              <button className="button button-chili" onClick={scrollToMenu}>Choose your bite <ArrowRight aria-hidden="true" /></button>
              <a className="button button-quiet" href="#how-it-works">How fresh works</a>
            </div>
            <div className="hero-facts" aria-label="Delivery highlights">
              <div><Clock3 aria-hidden="true" /><span><strong>20–35 min</strong> made-to-door</span></div>
              <div><Leaf aria-hidden="true" /><span><strong>Cooked now</strong> never held back</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-frame">
              <img src={heroImage} alt="A charred paneer tikka rumali roll with fresh chutney and spice-dusted wedges" />
            </div>
            <div className="hero-logo-seal"><img src={suppliedLogo} alt="RegionBites Bite of Joy" /></div>
            <div className="hero-callout callout-top"><Flame aria-hidden="true" /><span>Rumali hot<br />off the grill</span></div>
            <div className="hero-callout callout-bottom"><span className="callout-number">01</span><span>Chutney, char<br />Mumbai evenings</span></div>
          </div>
        </section>

        <section className="service-ribbon" aria-label="RegionBites service promise">
          <div><PackageCheck aria-hidden="true" /><span>Packed fresh for the cab ride</span></div>
          <span className="ribbon-dot" aria-hidden="true" />
          <div><UtensilsCrossed aria-hidden="true" /><span>Pan goes on after you tap</span></div>
          <span className="ribbon-dot" aria-hidden="true" />
          <div><MapPin aria-hidden="true" /><span>Mumbai counter, Mumbai only</span></div>
        </section>

        <section className="market-ticker" aria-label="RegionBites counter notes">
          <span>MADE AFTER YOUR TAP</span><i aria-hidden="true" />
          <span>CHUTNEY ON THE SIDE</span><i aria-hidden="true" />
          <span>MUMBAI COUNTER / RB</span><i aria-hidden="true" />
          <span>HOT FOR THE RIDE</span>
        </section>

        <section className="menu-section" id="menu" aria-labelledby="menu-title">
          <div className="section-heading section-heading-menu">
            <div>
              <div className="eyebrow eyebrow-dark"><span className="eyebrow-mark" /> From the RegionBites counter</div>
              <h2 id="menu-title">The bites Mumbai<br /><em>keeps coming back for.</em></h2>
            </div>
            <p>Big flavour, short wait. Pick a favourite or build a full table for home.</p>
          </div>

          <div className="category-row" role="tablist" aria-label="Menu categories">
            {categories.map((category) => (
              <button
                key={category}
                role="tab"
                aria-selected={activeCategory === category}
                className={`category-chip ${activeCategory === category ? "is-active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {menuQuery.isLoading ? <div className="menu-loading">Loading today’s counter tickets…</div> : filteredItems.map((item, index) => (
              <article className={`food-card food-card-${index + 1}`} key={item.id}>
                <div className="food-image-wrap">
                  <img src={item.image} alt={item.name} />
                  <span className="food-badge">RB counter</span>
                  <span className="food-prep"><Clock3 aria-hidden="true" /> made now</span>
                </div>
                <div className="food-card-body">
                  <div className="food-card-head">
                    <div><span className="food-ticket">{`RB · ${String(index + 1).padStart(2, "0")}`}</span><h3>{item.name}</h3></div>
                    <strong>{formatPrice(item.price)}</strong>
                  </div>
                  <p>Fresh from the practice counter — built into the private ordering workflow.</p>
                  <div className="food-card-footer">
                    <span className="made-token"><span /> pan to pack</span>
                    <button className="add-button" onClick={() => addToCart(item.id)} aria-label={`Add ${item.name} to bag`}>
                      <Plus aria-hidden="true" /> <span>Pass the plate</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="canopy-divider" aria-hidden="true"><span /><span /><span /><span /></div>
        <section className="fresh-section" id="fresh" aria-labelledby="fresh-title">
          <div className="fresh-aside">
            <div className="eyebrow eyebrow-light"><span className="eyebrow-mark" /> The RegionBites promise</div>
            <h2 id="fresh-title">No warming lamps.<br /><em>Just a good, quick kitchen.</em></h2>
            <p>Your order starts moving only after you choose it. That means bright chutneys, proper crunch, and food that reaches your door with its best bite intact.</p>
            <button className="text-link" onClick={scrollToMenu}>Find tonight’s bite <ArrowRight aria-hidden="true" /></button>
          </div>

          <div className="fresh-steps" id="how-it-works">
            <article><span className="step-number">01</span><div><h3>Pick your plate</h3><p>Choose a comfort classic or line up a little table full of bites.</p></div><Check aria-hidden="true" /></article>
            <article><span className="step-number">02</span><div><h3>Pan goes on</h3><p>The grill gets moving, the chutney gets poured, and your ticket hits the pack line.</p></div><Flame aria-hidden="true" /></article>
            <article><span className="step-number">03</span><div><h3>Doorbell, then bite</h3><p>Your RegionBites order lands ready for the first proper Mumbai evening mouthful.</p></div><ShoppingBag aria-hidden="true" /></article>
          </div>
        </section>

        <section className="city-note" aria-label="RegionBites Mumbai availability">
          <img src={compactMark} alt="" />
          <p><strong>RegionBites is a private Mumbai practice project.</strong> Customer accounts, payment receipts, kitchen activity, and rider milestones are safe simulations.</p>
          <span>RB / MUM</span>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="#top"><img src={suppliedLogo} alt="RegionBites — Bite of Joy" /></a>
        <p>From our Mumbai counter to your night in.</p>
        <div className="footer-links"><a href="#menu">The counter</a><a href="#fresh">Kitchen notes</a><button onClick={() => toast.info("This project is currently focused on Mumbai.")}>Mumbai only</button></div>
      </footer>

      {cartOpen && <div className="cart-scrim" onClick={() => setCartOpen(false)} aria-hidden="true" />}
      <aside className={`cart-drawer ${cartOpen ? "is-open" : ""}`} aria-label="Your RegionBites order bag" aria-hidden={!cartOpen}>
        <div className="cart-head">
          <div><span className="eyebrow eyebrow-dark">Your order</span><h2>The good stuff.</h2></div>
          <button className="cart-close" onClick={() => setCartOpen(false)} aria-label="Close order bag"><X aria-hidden="true" /></button>
        </div>
        {cartItems.length === 0 ? (
          <div className="empty-bag"><img src={compactMark} alt="" /><h3>Your bag is waiting.</h3><p>Choose something made-now from the counter and it will appear here.</p><button className="button button-dark" onClick={() => { setCartOpen(false); scrollToMenu(); }}>See the menu <ArrowRight aria-hidden="true" /></button></div>
        ) : (
          <>
            <div className="cart-lines">
              {cartItems.map((item) => (
                <div className="cart-line" key={item.id}>
                  <img src={item.image} alt="" />
                  <div className="cart-line-details"><h3>{item.name}</h3><p>{formatPrice(item.price)}</p><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus aria-hidden="true" /></button><span>{cart[item.id]}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}><Plus aria-hidden="true" /></button></div></div>
                  <strong>{formatPrice(item.price * (cart[item.id] ?? 0))}</strong>
                </div>
              ))}
            </div>
            <div className="cart-total"><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong><small>Practice delivery fee is calculated at simulated checkout. No payment will be taken.</small><button className="button button-chili" onClick={openCheckout}>Practice checkout <ArrowRight aria-hidden="true" /></button></div>
          </>
        )}
      </aside>

      {checkoutOpen && (
        <div className="practice-modal-scrim" role="presentation" onClick={() => setCheckoutOpen(false)}>
          <section className="practice-checkout" role="dialog" aria-modal="true" aria-labelledby="practice-checkout-title" onClick={(event) => event.stopPropagation()}>
            <button className="cart-close checkout-close" onClick={() => setCheckoutOpen(false)} aria-label="Close practice checkout"><X aria-hidden="true" /></button>
            <div className="eyebrow eyebrow-dark"><Sparkles aria-hidden="true" /> Safe practice checkout</div>
            <h2 id="practice-checkout-title">Your order, <em>simulated.</em></h2>
            <p>Use any Mumbai-style practice address. This creates a private training order, records a no-charge payment event, and unlocks its kitchen and delivery timeline.</p>
            <label htmlFor="practice-address">Practice delivery address</label>
            <textarea id="practice-address" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="e.g. 12 Palm Road, Bandra West, Mumbai 400050" rows={4} />
            <div className="practice-payment-card"><div><span>Payment method</span><strong>Practice payment approval</strong></div><span className="practice-paid">₹0 charged</span></div>
            <div className="practice-checkout-total"><span>Practice order total</span><strong>{formatPrice(cartTotal >= 399 ? cartTotal : cartTotal + 39)}</strong></div>
            <button className="button button-chili checkout-submit" disabled={createPracticeOrder.isPending} onClick={submitPracticeOrder}>{createPracticeOrder.isPending ? "Creating practice order…" : "Approve practice payment"} <ArrowRight aria-hidden="true" /></button>
          </section>
        </div>
      )}
    </div>
  );
}
