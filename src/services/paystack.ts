// Paystack Inline JS Helper for Nostelle Fragrances
// Set VITE_PAYSTACK_PUBLIC_KEY in .env (e.g. pk_test_...) to activate live Paystack Inline Checkout.

export type PaystackChannel = 'card' | 'bank_transfer' | 'ussd' | 'mobile_money';

interface PaystackSetupConfig {
  key: string;
  email: string;
  amount: number; // in kobo (NGN * 100)
  currency: string;
  ref: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
  callback: (response: { reference: string; status?: string }) => void;
  onClose: () => void;
}

interface PaystackGlobal {
  setup: (config: PaystackSetupConfig) => { openIframe: () => void };
}

declare global {
  interface Window {
    PaystackPop?: PaystackGlobal;
  }
}

export function getPaystackPublicKey(): string {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

export function isPaystackConfigured(): boolean {
  const key = getPaystackPublicKey();
  return key.startsWith('pk_');
}

export function generatePaystackReference(orderNumber: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `PSK-${orderNumber}-${suffix}`;
}

let scriptPromise: Promise<boolean> | null = null;

export function loadPaystackScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.PaystackPop) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.PaystackPop));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function launchPaystackInline(params: {
  email: string;
  amountNgn: number;
  reference: string;
  channel: PaystackChannel;
  orderNumber: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onUnavailable: () => void;
}): Promise<void> {
  const publicKey = getPaystackPublicKey();
  if (!publicKey.startsWith('pk_')) {
    params.onUnavailable();
    return;
  }

  const loaded = await loadPaystackScript();
  if (!loaded || !window.PaystackPop) {
    params.onUnavailable();
    return;
  }

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: params.email,
    amount: Math.round(params.amountNgn * 100), // kobo
    currency: 'NGN',
    ref: params.reference,
    channels: [params.channel],
    metadata: {
      order_number: params.orderNumber,
      store: 'Nostelle Fragrances',
    },
    callback: (response) => {
      params.onSuccess(response.reference || params.reference);
    },
    onClose: () => {
      params.onCancel();
    },
  });

  handler.openIframe();
}
