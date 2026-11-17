import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Gift,
  Lock,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import {
  COMPLIMENTARY_SAMPLES,
  EDITION_META,
  formatNaira,
  getPerfumeById,
  type BagItem,
} from '../data/perfumes';
import { saveOrder, type OrderRecord } from '../data/orders';
import {
  generatePaystackReference,
  isPaystackConfigured,
  launchPaystackInline,
  type PaystackChannel,
} from '../services/paystack';
import { ImageWithFallback } from './ImageWithFallback';

interface CheckoutViewProps {
  bag: BagItem[];
  onUpdateQty: (idx: number, delta: number) => void;
  onBackToStore: () => void;
  onOrderComplete: () => void;
  onTrackOrder: (orderNumber: string) => void;
}

type PaymentMethod = 'paystack' | 'cod';
type ShippingMethod = 'standard' | 'express';

const PAYSTACK_CHANNELS: { id: PaystackChannel; label: string }[] = [
  { id: 'card', label: 'Card (Visa / Mastercard / Verve)' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'ussd', label: 'USSD' },
  { id: 'mobile_money', label: 'Mobile Money' },
];

export function CheckoutView({
  bag,
  onUpdateQty,
  onBackToStore,
  onOrderComplete,
  onTrackOrder,
}: CheckoutViewProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Nigeria');

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [paystackChannel, setPaystackChannel] = useState<PaystackChannel>('card');
  const [paystackModalOpen, setPaystackModalOpen] = useState(false);
  const [pendingOrderDraft, setPendingOrderDraft] = useState<{
    orderNumber: string;
    paystackRef: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedSamples, setSelectedSamples] = useState<string[]>([
    COMPLIMENTARY_SAMPLES[0].id,
    COMPLIMENTARY_SAMPLES[1].id,
  ]);
  const [includeGiftWrap, setIncludeGiftWrap] = useState(true);
  const [giftNote, setGiftNote] = useState('');

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [formError, setFormError] = useState('');
  const [receipt, setReceipt] = useState<OrderRecord | null>(null);

  const subtotal = bag.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const discountRate =
    appliedPromo === 'NOSTELLE10' || appliedPromo === 'NOSTALGIA10' ? 0.1 : 0;
  const discount = Math.round(subtotal * discountRate);
  const shippingCost = shippingMethod === 'express' ? 3500 : 0;
  const total = Math.max(0, subtotal - discount + shippingCost);
  const paystackReady = isPaystackConfigured();

  const toggleSample = (sampleId: string) => {
    setSelectedSamples((prev) => {
      if (prev.includes(sampleId)) {
        return prev.filter((id) => id !== sampleId);
      }
      if (prev.length >= 2) {
        return [prev[1], sampleId];
      }
      return [...prev, sampleId];
    });
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'NOSTELLE10' || code === 'NOSTALGIA10') {
      setAppliedPromo(code);
      setPromoError('');
    } else {
      setPromoError('Unrecognized code. Try NOSTELLE10 for 10% off.');
    }
  };

  const finalizeOrder = (opts: {
    orderNumber: string;
    paymentStatus: OrderRecord['paymentStatus'];
    paystackReference?: string;
    paymentMethodLabel: string;
  }) => {
    const chosenSampleNames = selectedSamples
      .map((id) => COMPLIMENTARY_SAMPLES.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    const now = new Date();
    const estDate = new Date(
      now.getTime() + (shippingMethod === 'express' ? 1 : 3) * 86400000
    );

    const record: OrderRecord = {
      orderNumber: opts.orderNumber,
      createdAt: now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      email: email.trim(),
      fullName: fullName.trim(),
      addressSummary: `${street.trim()}, ${city.trim()}${postalCode.trim() ? ` ${postalCode.trim()}` : ''}, ${country}`,
      shippingLabel:
        shippingMethod === 'express'
          ? 'Lagos Same-Day / Express Air (1–2 Days)'
          : 'Complimentary Nationwide Courier (2–4 Days)',
      paymentMethodLabel: opts.paymentMethodLabel,
      paymentStatus: opts.paymentStatus,
      paystackReference: opts.paystackReference,
      courierCode: `NST-LAG-${Math.floor(1000000 + Math.random() * 8999999)}`,
      currentStageIndex: 0,
      estimatedDelivery: estDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      samples: chosenSampleNames,
      giftNote: includeGiftWrap ? giftNote.trim() : '',
      items: [...bag],
      subtotal,
      discount,
      shippingCost,
      total,
    };

    saveOrder(record);
    setReceipt(record);
    setPaystackModalOpen(false);
    setPendingOrderDraft(null);
    setIsProcessing(false);
    onOrderComplete();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (bag.length === 0) {
      setFormError('Your bag is empty. Add a fragrance before placing an order.');
      return;
    }
    if (!email.trim() || !fullName.trim() || !street.trim() || !city.trim()) {
      setFormError('Please complete your email, name, street address, and city.');
      return;
    }
    if (paymentMethod === 'cod' && !phone.trim()) {
      setFormError('Please enter a contact phone number for Cash on Delivery handoff.');
      return;
    }

    setFormError('');
    const orderNumber = `NST-${Math.floor(4200 + Math.random() * 5700)}`;

    if (paymentMethod === 'cod') {
      finalizeOrder({
        orderNumber,
        paymentStatus: 'Cash on Delivery Pending',
        paymentMethodLabel: 'Cash on Delivery (Courier Verified)',
      });
      return;
    }

    const paystackRef = generatePaystackReference(orderNumber);
    const channelLabel =
      PAYSTACK_CHANNELS.find((c) => c.id === paystackChannel)?.label ?? 'Card';

    setIsProcessing(true);

    await launchPaystackInline({
      email: email.trim(),
      amountNgn: total,
      reference: paystackRef,
      channel: paystackChannel,
      orderNumber,
      onSuccess: (confirmedRef) => {
        finalizeOrder({
          orderNumber,
          paymentStatus: 'Paid via Paystack',
          paystackReference: confirmedRef,
          paymentMethodLabel: `Paystack · ${channelLabel}`,
        });
      },
      onCancel: () => {
        setIsProcessing(false);
        setFormError('Paystack payment window was closed before authorization.');
      },
      onUnavailable: () => {
        setIsProcessing(false);
        setPendingOrderDraft({ orderNumber, paystackRef });
        setPaystackModalOpen(true);
      },
    });
  };

  if (receipt) {
    return (
      <section className="checkout-page">
        <div className="container checkout-receipt-wrap">
          <div className="receipt-card">
            <div className="receipt-icon-badge" aria-hidden="true">
              <Check size={24} strokeWidth={2.2} />
            </div>
            <p className="eyebrow-line">
              {receipt.paymentStatus}
              {receipt.paystackReference ? ` · ${receipt.paystackReference}` : ''}
            </p>
            <h1 className="receipt-title">
              Order #{receipt.orderNumber} Confirmed — Packed with Care
            </h1>
            <p className="receipt-sub">
              Thank you for choosing Nostelle Fragrances. A confirmation dossier has been
              prepared for <strong>{receipt.email}</strong>. Track your parcel anytime
              with reference <strong>#{receipt.orderNumber}</strong>.
            </p>

            <div className="receipt-grid">
              <div className="receipt-meta-block">
                <span className="receipt-label">Recipient & Address</span>
                <p className="receipt-val">{receipt.fullName}</p>
                <p className="receipt-muted">{receipt.addressSummary}</p>
              </div>
              <div className="receipt-meta-block">
                <span className="receipt-label">Courier & Payment</span>
                <p className="receipt-val">{receipt.shippingLabel}</p>
                <p className="receipt-muted">
                  {receipt.paymentMethodLabel} · Waybill {receipt.courierCode}
                </p>
              </div>
            </div>

            <div className="receipt-items">
              {receipt.items.map((item, idx) => {
                const perfume = getPerfumeById(item.perfumeId);
                return (
                  <div
                    key={`${item.perfumeId}-${item.edition}-${item.volume}-${idx}`}
                    className="receipt-line"
                  >
                    <div>
                      <strong>{perfume.name}</strong>
                      <span className="receipt-muted">
                        {' '}
                        · {EDITION_META[item.edition].name} · {item.volume} × {item.qty}
                        {item.engraving ? ` · Monogram "${item.engraving}"` : ''}
                      </span>
                    </div>
                    <span className="tabular-nums font-mono">
                      {formatNaira(item.unitPrice * item.qty)}
                    </span>
                  </div>
                );
              })}

              {receipt.samples.length > 0 && (
                <div className="receipt-line">
                  <div>
                    <strong>Complimentary Discovery Vials</strong>
                    <span className="receipt-muted">
                      {' '}
                      · {receipt.samples.join(' + ')}
                    </span>
                  </div>
                  <span className="tabular-nums font-mono">Free</span>
                </div>
              )}

              {receipt.giftNote && (
                <div className="receipt-line">
                  <div>
                    <strong>Crimson & Ivory Gift Box</strong>
                    <span className="receipt-muted"> · “{receipt.giftNote}”</span>
                  </div>
                  <span className="tabular-nums font-mono">Included</span>
                </div>
              )}
            </div>

            <div className="receipt-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span className="tabular-nums font-mono">
                  {formatNaira(receipt.subtotal)}
                </span>
              </div>
              {receipt.discount > 0 && (
                <div className="summary-row">
                  <span>Nostelle Privilege (10%)</span>
                  <span className="tabular-nums font-mono">
                    -{formatNaira(receipt.discount)}
                  </span>
                </div>
              )}
              <div className="summary-row">
                <span>Delivery</span>
                <span className="tabular-nums font-mono">
                  {receipt.shippingCost === 0
                    ? 'Complimentary'
                    : formatNaira(receipt.shippingCost)}
                </span>
              </div>
              <div className="summary-row summary-row-total">
                <span>Total</span>
                <span className="tabular-nums font-mono">
                  {formatNaira(receipt.total)}
                </span>
              </div>
            </div>

            <div className="receipt-actions receipt-actions-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onTrackOrder(receipt.orderNumber)}
              >
                Track Order Status
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onBackToStore}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
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
            <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
            <span>Paystack Secured Checkout</span>
          </span>
        </div>

        <div className="checkout-heading">
          <p className="eyebrow-line">Nostelle Fragrances · By Peejay&apos;s Luxury</p>
          <h1 className="section-title">Checkout & Delivery</h1>
          <p className="checkout-lead">
            Complimentary nationwide delivery and two 2 ml discovery vials included with
            every order. Some feelings never fade.
          </p>
        </div>

        {bag.length === 0 ? (
          <div className="checkout-empty-card">
            <p>Your Nostelle bag currently has no fragrances selected.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onBackToStore}
            >
              Explore Fragrances
            </button>
          </div>
        ) : (
          <div className="checkout-grid">
            <form className="checkout-form" onSubmit={handleSubmit} noValidate>
              <div className="checkout-block">
                <h2 className="checkout-block-title">01. Contact & Delivery Address</h2>
                <div className="form-grid-2">
                  <label className="field-label">
                    <span>Email Address *</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tolu@domain.com"
                      className="field-input"
                    />
                  </label>
                  <label className="field-label">
                    <span>Phone / WhatsApp (for rider updates)</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="field-input"
                    />
                  </label>
                </div>

                <label className="field-label">
                  <span>Full Name *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tolu Adeyemi"
                    className="field-input"
                  />
                </label>

                <label className="field-label">
                  <span>Street Address *</span>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="14 Admiralty Way, Lekki Phase 1"
                    className="field-input"
                  />
                </label>

                <div className="form-grid-3">
                  <label className="field-label">
                    <span>City / State *</span>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lagos"
                      className="field-input"
                    />
                  </label>
                  <label className="field-label">
                    <span>Postal Code (Optional)</span>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="105102"
                      className="field-input"
                    />
                  </label>
                  <label className="field-label">
                    <span>Country</span>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="field-input"
                    >
                      <option value="Nigeria">Nigeria</option>
                      <option value="Ghana">Ghana</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="checkout-block">
                <h2 className="checkout-block-title">02. Delivery & Complimentary Vials</h2>
                <div className="radio-cards">
                  <button
                    type="button"
                    className={`radio-card${shippingMethod === 'standard' ? ' is-selected' : ''}`}
                    onClick={() => setShippingMethod('standard')}
                  >
                    <div className="radio-card-head">
                      <Truck size={17} strokeWidth={1.7} aria-hidden="true" />
                      <strong>Standard Nationwide</strong>
                      <span className="tabular-nums font-mono">Free</span>
                    </div>
                    <p>2–4 business days · Crimson tissue & insulated parcel</p>
                  </button>

                  <button
                    type="button"
                    className={`radio-card${shippingMethod === 'express' ? ' is-selected' : ''}`}
                    onClick={() => setShippingMethod('express')}
                  >
                    <div className="radio-card-head">
                      <Truck size={17} strokeWidth={1.7} aria-hidden="true" />
                      <strong>Lagos Same-Day / Express</strong>
                      <span className="tabular-nums font-mono">₦3,500</span>
                    </div>
                    <p>Same-day Lagos or 1–2 days interstate priority air</p>
                  </button>
                </div>

                <div className="sample-picker">
                  <span className="field-subhead">
                    Select 2 Complimentary Discovery Vials ({selectedSamples.length}/2 selected)
                  </span>
                  <div className="sample-grid">
                    {COMPLIMENTARY_SAMPLES.map((sample) => {
                      const active = selectedSamples.includes(sample.id);
                      return (
                        <button
                          key={sample.id}
                          type="button"
                          className={`sample-option${active ? ' is-selected' : ''}`}
                          onClick={() => toggleSample(sample.id)}
                        >
                          <span className="sample-name">{sample.name}</span>
                          <span className="sample-family">{sample.family}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="gift-box-wrap">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeGiftWrap}
                      onChange={(e) => setIncludeGiftWrap(e.target.checked)}
                    />
                    <Gift size={16} strokeWidth={1.7} aria-hidden="true" />
                    <span>Include crimson & ivory gift wrapping with memory card (Complimentary)</span>
                  </label>
                  {includeGiftWrap && (
                    <textarea
                      rows={2}
                      maxLength={140}
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      placeholder="Optional handwritten memory note..."
                      className="field-input field-textarea"
                    />
                  )}
                </div>
              </div>

              <div className="checkout-block">
                <h2 className="checkout-block-title">03. Payment via Paystack</h2>
                <div className="segmented-control payment-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === 'paystack'}
                    className={`seg-btn${paymentMethod === 'paystack' ? ' is-active' : ''}`}
                    onClick={() => setPaymentMethod('paystack')}
                  >
                    Paystack Checkout
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === 'cod'}
                    className={`seg-btn${paymentMethod === 'cod' ? ' is-active' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    Cash on Delivery
                  </button>
                </div>

                {paymentMethod === 'paystack' ? (
                  <div className="payment-panel">
                    <div className="paystack-channel-grid">
                      {PAYSTACK_CHANNELS.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          className={`sample-option${
                            paystackChannel === ch.id ? ' is-selected' : ''
                          }`}
                          onClick={() => setPaystackChannel(ch.id)}
                        >
                          <span className="sample-name">{ch.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="payment-info-panel">
                      <ShieldCheck size={18} strokeWidth={1.7} aria-hidden="true" />
                      <div>
                        <p>
                          <strong>
                            {paystackReady
                              ? 'Paystack Inline Checkout Ready'
                              : 'Paystack Checkout Ready (Preview Mode)'}
                          </strong>
                        </p>
                        <p style={{ marginTop: 4 }}>
                          {paystackReady
                            ? 'Clicking Pay with Paystack opens the encrypted Paystack modal in NGN for card, bank transfer, USSD, or mobile money.'
                            : 'Add VITE_PAYSTACK_PUBLIC_KEY in .env when ready to switch to live Paystack Inline popups. Preview mode lets you test the full Paystack flow & order tracking now.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="payment-panel payment-info-panel">
                    <Truck size={18} strokeWidth={1.7} aria-hidden="true" />
                    <p>
                      Pay <strong>{formatNaira(total)}</strong> directly to your dispatch
                      rider upon arrival. Ensure your phone number above is active.
                    </p>
                  </div>
                )}
              </div>

              {formError && (
                <div className="form-error-banner" role="alert">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isProcessing}
              >
                <CreditCard size={17} strokeWidth={1.8} aria-hidden="true" />
                <span className="tabular-nums">
                  {isProcessing
                    ? 'Connecting to Paystack...'
                    : paymentMethod === 'paystack'
                      ? `Pay with Paystack · ${formatNaira(total)}`
                      : `Complete Order · ${formatNaira(total)}`}
                </span>
              </button>
            </form>

            <aside className="checkout-summary">
              <div className="summary-card">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-items">
                  {bag.map((item, idx) => {
                    const perfume = getPerfumeById(item.perfumeId);
                    return (
                      <div
                        key={`${item.perfumeId}-${item.edition}-${item.volume}-${item.engraving}-${idx}`}
                        className="summary-item"
                      >
                        <ImageWithFallback
                          src={perfume.image}
                          alt={perfume.alt}
                          className="summary-thumb"
                          fallbackTitle={perfume.name}
                        />
                        <div className="summary-item-info">
                          <div className="summary-item-top">
                            <strong>{perfume.name}</strong>
                            <span className="tabular-nums font-mono">
                              {formatNaira(item.unitPrice * item.qty)}
                            </span>
                          </div>
                          <p className="summary-item-meta">
                            {item.volume === '10 ml Oil'
                              ? '10 ml Roll-on Oil'
                              : `${EDITION_META[item.edition].name} · ${item.volume}`}
                            {item.engraving ? ` · "${item.engraving}"` : ''}
                          </p>
                          <div className="bag-qty-row">
                            <button
                              type="button"
                              className="qty-btn"
                              aria-label={`Decrease quantity of ${perfume.name}`}
                              onClick={() => onUpdateQty(idx, -1)}
                            >
                              -
                            </button>
                            <span className="bag-qty tabular-nums">{item.qty}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              aria-label={`Increase quantity of ${perfume.name}`}
                              onClick={() => onUpdateQty(idx, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="promo-row">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code (e.g. NOSTELLE10)"
                    aria-label="Promo code"
                    className="field-input"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleApplyPromo}
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="promo-feedback error">{promoError}</p>}
                {appliedPromo && (
                  <p className="promo-feedback success">
                    Code {appliedPromo} applied (-10%)
                  </p>
                )}

                <div className="summary-breakdown">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-mono">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="summary-row">
                      <span>Nostelle Privilege (10%)</span>
                      <span className="tabular-nums font-mono">
                        -{formatNaira(discount)}
                      </span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Delivery</span>
                    <span className="tabular-nums font-mono">
                      {shippingCost === 0
                        ? 'Complimentary'
                        : formatNaira(shippingCost)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Discovery Vials (×2)</span>
                    <span className="tabular-nums font-mono">Included</span>
                  </div>
                  <div className="summary-row summary-row-total">
                    <span>Total</span>
                    <span className="tabular-nums font-mono">
                      {formatNaira(total)}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {paystackModalOpen && pendingOrderDraft && (
        <div
          className="paystack-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paystack-modal-title"
        >
          <div className="paystack-modal-card">
            <div className="paystack-modal-head">
              <div>
                <span className="receipt-label">Paystack Checkout Bridge</span>
                <h3 id="paystack-modal-title" className="paystack-modal-title">
                  Nostelle Fragrances
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Cancel Paystack authorization"
                onClick={() => setPaystackModalOpen(false)}
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="paystack-modal-amount">
              <span className="receipt-muted">{email}</span>
              <strong className="tabular-nums font-mono">
                {formatNaira(total)}
              </strong>
            </div>

            <div className="paystack-modal-details">
              <div className="summary-row">
                <span>Order Reference</span>
                <span className="tabular-nums font-mono">
                  {pendingOrderDraft.orderNumber}
                </span>
              </div>
              <div className="summary-row">
                <span>Paystack Ref</span>
                <span className="tabular-nums font-mono">
                  {pendingOrderDraft.paystackRef}
                </span>
              </div>
              <div className="summary-row">
                <span>Selected Channel</span>
                <span>
                  {PAYSTACK_CHANNELS.find((c) => c.id === paystackChannel)?.label}
                </span>
              </div>
            </div>

            <p className="paystack-modal-note">
              Live Paystack Inline launches automatically once{' '}
              <code>VITE_PAYSTACK_PUBLIC_KEY</code> is added to your environment.
              Authorize this test payment to generate your receipt and track your order.
            </p>

            <div className="paystack-modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => {
                  const chLabel =
                    PAYSTACK_CHANNELS.find((c) => c.id === paystackChannel)?.label ??
                    'Card';
                  finalizeOrder({
                    orderNumber: pendingOrderDraft.orderNumber,
                    paymentStatus: 'Paystack Test Authorized',
                    paystackReference: pendingOrderDraft.paystackRef,
                    paymentMethodLabel: `Paystack · ${chLabel}`,
                  });
                }}
              >
                Authorize Paystack Test Payment · {formatNaira(total)}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-full"
                onClick={() => setPaystackModalOpen(false)}
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
