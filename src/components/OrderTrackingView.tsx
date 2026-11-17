import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  FULFILLMENT_STAGES,
  loadOrders,
  updateOrderStage,
  type OrderRecord,
} from '../data/orders';
import { EDITION_META, formatNaira, getPerfumeById } from '../data/perfumes';

interface OrderTrackingViewProps {
  initialOrderNumber?: string | null;
  onBackToStore: () => void;
}

export function OrderTrackingView({
  initialOrderNumber,
  onBackToStore,
}: OrderTrackingViewProps) {
  const [orders, setOrders] = useState<OrderRecord[]>(() => loadOrders());
  const [query, setQuery] = useState(initialOrderNumber || 'NST-4182');
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(() => {
    const all = loadOrders();
    if (initialOrderNumber) {
      return (
        all.find(
          (o) => o.orderNumber.toUpperCase() === initialOrderNumber.toUpperCase()
        ) ?? all[0]
      );
    }
    return all[0] ?? null;
  });
  const [notFoundMsg, setNotFoundMsg] = useState('');

  useEffect(() => {
    const all = loadOrders();
    setOrders(all);
    if (initialOrderNumber) {
      const match = all.find(
        (o) => o.orderNumber.toUpperCase() === initialOrderNumber.toUpperCase()
      );
      if (match) {
        setQuery(match.orderNumber);
        setActiveOrder(match);
        setNotFoundMsg('');
      }
    }
  }, [initialOrderNumber]);

  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const all = loadOrders();
    const match = all.find(
      (o) =>
        o.orderNumber.toLowerCase() === q ||
        o.email.toLowerCase() === q ||
        (o.paystackReference && o.paystackReference.toLowerCase() === q)
    );
    if (match) {
      setActiveOrder(match);
      setNotFoundMsg('');
    } else {
      setNotFoundMsg(
        `No Nostelle order found for “${query.trim()}”. Try NST-4182 or select a recent order below.`
      );
    }
  };

  const handleSelectOrder = (order: OrderRecord) => {
    setQuery(order.orderNumber);
    setActiveOrder(order);
    setNotFoundMsg('');
  };

  const handleAdvanceStage = () => {
    if (!activeOrder) return;
    const nextStage = Math.min(
      FULFILLMENT_STAGES.length - 1,
      activeOrder.currentStageIndex + 1
    );
    const updated = updateOrderStage(activeOrder.orderNumber, nextStage);
    setOrders(updated);
    const refreshed =
      updated.find((o) => o.orderNumber === activeOrder.orderNumber) ?? null;
    setActiveOrder(refreshed);
  };

  return (
    <section className="tracking-page">
      <div className="container">
        <div className="checkout-topbar">
          <button
            type="button"
            className="checkout-back-btn"
            onClick={onBackToStore}
          >
            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Return to Nostelle</span>
          </button>
          <span className="checkout-security-note">
            <Truck size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>Nostelle Dispatch & Paystack Verification</span>
          </span>
        </div>

        <div className="tracking-header">
          <div>
            <p className="eyebrow-line">Shipment Lookup · By Peejay&apos;s Luxury</p>
            <h1 className="section-title">Track Your Nostelle Order.</h1>
          </div>

          <form className="tracking-search-form" onSubmit={handleLookup}>
            <div className="tracking-input-wrap">
              <Search size={16} strokeWidth={1.7} aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Order # (e.g. NST-4182) or email"
                aria-label="Order number, email, or Paystack reference"
                className="search-input"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Track Order
            </button>
          </form>
        </div>

        {orders.length > 0 && (
          <div className="recent-orders-strip">
            <span className="recent-label">Recent orders:</span>
            {orders.slice(0, 5).map((order) => (
              <button
                key={order.orderNumber}
                type="button"
                className={`recent-order-btn${
                  activeOrder?.orderNumber === order.orderNumber ? ' is-active' : ''
                }`}
                onClick={() => handleSelectOrder(order)}
              >
                <span className="tabular-nums font-mono">{order.orderNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{FULFILLMENT_STAGES[order.currentStageIndex].title}</span>
              </button>
            ))}
          </div>
        )}

        {notFoundMsg && (
          <div className="form-error-banner" role="alert" style={{ marginBottom: 24 }}>
            {notFoundMsg}
          </div>
        )}

        {activeOrder && (
          <div className="tracking-grid">
            <div className="tracking-timeline-card">
              <div className="tracking-card-head">
                <div>
                  <span className="receipt-label">Order Reference</span>
                  <h2 className="tracking-order-num tabular-nums">
                    #{activeOrder.orderNumber}
                  </h2>
                  <p className="receipt-muted">
                    Placed {activeOrder.createdAt} · Est. Delivery{' '}
                    <strong>{activeOrder.estimatedDelivery}</strong>
                  </p>
                </div>
                <div className="tracking-courier-box">
                  <span className="receipt-label">Courier Waybill</span>
                  <span className="tabular-nums font-mono tracking-courier-code">
                    {activeOrder.courierCode}
                  </span>
                </div>
              </div>

              <div className="timeline-list" aria-label="Order fulfillment progress">
                {FULFILLMENT_STAGES.map((stage, idx) => {
                  const isDone = idx <= activeOrder.currentStageIndex;
                  const isCurrent = idx === activeOrder.currentStageIndex;
                  return (
                    <div
                      key={stage.title}
                      className={`timeline-step${isDone ? ' is-done' : ''}${
                        isCurrent ? ' is-current' : ''
                      }`}
                    >
                      <div className="timeline-marker" aria-hidden="true">
                        {isDone ? (
                          <Check size={14} strokeWidth={2.4} />
                        ) : (
                          <span className="tabular-nums">{idx + 1}</span>
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title-row">
                          <strong>{stage.title}</strong>
                          <span className="timeline-status-text">
                            {isCurrent
                              ? 'Current Stage'
                              : isDone
                                ? 'Completed'
                                : 'Pending'}
                          </span>
                        </div>
                        <p>{stage.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeOrder.currentStageIndex < FULFILLMENT_STAGES.length - 1 && (
                <div className="tracking-sim-bar">
                  <span className="receipt-muted">
                    Preview courier progression for testing:
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleAdvanceStage}
                  >
                    Advance Shipment Stage
                  </button>
                </div>
              )}
            </div>

            <aside className="tracking-dossier-card">
              <div className="dossier-section">
                <span className="receipt-label">Payment Verification</span>
                <div className="dossier-payment-row">
                  <ShieldCheck size={17} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <strong>{activeOrder.paymentStatus}</strong>
                    <p className="receipt-muted">
                      {activeOrder.paymentMethodLabel}
                      {activeOrder.paystackReference
                        ? ` · Ref ${activeOrder.paystackReference}`
                        : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="dossier-section">
                <span className="receipt-label">Destination & Courier</span>
                <p>
                  <strong>{activeOrder.fullName}</strong>
                </p>
                <p className="receipt-muted">{activeOrder.addressSummary}</p>
                <p className="receipt-muted" style={{ marginTop: 6 }}>
                  {activeOrder.shippingLabel}
                </p>
              </div>

              <div className="dossier-section">
                <span className="receipt-label">Bottles & Discovery Vials</span>
                <div className="dossier-items">
                  {activeOrder.items.map((item, idx) => {
                    const perfume = getPerfumeById(item.perfumeId);
                    return (
                      <div
                        key={`${item.perfumeId}-${item.edition}-${item.volume}-${idx}`}
                        className="dossier-item-row"
                      >
                        <div>
                          <Package size={14} strokeWidth={1.7} aria-hidden="true" />
                          <span>
                            <strong>{perfume.name}</strong> ·{' '}
                            {item.volume === '10 ml Oil'
                              ? '10 ml Roll-on Oil'
                              : `${EDITION_META[item.edition].name} · ${item.volume}`}{' '}
                            × {item.qty}
                            {item.engraving ? ` · "${item.engraving}"` : ''}
                          </span>
                        </div>
                        <span className="tabular-nums font-mono">
                          {formatNaira(item.unitPrice * item.qty)}
                        </span>
                      </div>
                    );
                  })}
                  {activeOrder.samples.length > 0 && (
                    <p className="receipt-muted">
                      Vials: {activeOrder.samples.join(' + ')}
                    </p>
                  )}
                  {activeOrder.giftNote && (
                    <p className="receipt-muted">
                      Memory Note: “{activeOrder.giftNote}”
                    </p>
                  )}
                </div>
              </div>

              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-mono">
                    {formatNaira(activeOrder.subtotal)}
                  </span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="summary-row">
                    <span>Discount</span>
                    <span className="tabular-nums font-mono">
                      -{formatNaira(activeOrder.discount)}
                    </span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Delivery</span>
                  <span className="tabular-nums font-mono">
                    {activeOrder.shippingCost === 0
                      ? 'Complimentary'
                      : formatNaira(activeOrder.shippingCost)}
                  </span>
                </div>
                <div className="summary-row summary-row-total">
                  <span>Total</span>
                  <span className="tabular-nums font-mono">
                    {formatNaira(activeOrder.total)}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
