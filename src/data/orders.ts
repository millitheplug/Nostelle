import type { BagItem } from './perfumes';

export interface OrderRecord {
  orderNumber: string;
  createdAt: string;
  email: string;
  fullName: string;
  addressSummary: string;
  shippingLabel: string;
  paymentMethodLabel: string;
  paymentStatus: 'Paid via Paystack' | 'Paystack Test Authorized' | 'Cash on Delivery Pending';
  paystackReference?: string;
  courierCode: string;
  currentStageIndex: number; // 0..4
  estimatedDelivery: string;
  samples: string[];
  giftNote: string;
  items: BagItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

export const FULFILLMENT_STAGES = [
  {
    title: 'Order Confirmed',
    detail: 'Nostelle order dossier received and payment verified.',
  },
  {
    title: 'Hand-Packed with Care',
    detail: 'Flacon checked, polished, and fitted into signature crimson & ivory wrapping.',
  },
  {
    title: 'Monogram & Wax Seal',
    detail: 'Personal engraving & complimentary 2 ml sample vials enclosed.',
  },
  {
    title: 'Dispatch Rider / Courier Out',
    detail: 'Handed over to Lagos & nationwide climate-protected courier.',
  },
  {
    title: 'Delivered',
    detail: 'Signed and received at destination address.',
  },
] as const;

const STORAGE_KEY = 'nostelle_fragrances_orders_v1';

const SEED_ORDER: OrderRecord = {
  orderNumber: 'NST-4182',
  createdAt: 'Nov 15, 2026 · 14:20',
  email: 'tolu@nostelle-guest.ng',
  fullName: 'Tolu Adeyemi',
  addressSummary: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  shippingLabel: 'Lagos Same-Day / Standard Dispatch (1–3 Days)',
  paymentMethodLabel: 'Paystack · Card',
  paymentStatus: 'Paid via Paystack',
  paystackReference: 'PSK-NST-4182-7391',
  courierCode: 'NST-LAG-8841209',
  currentStageIndex: 3,
  estimatedDelivery: 'Nov 18, 2026',
  samples: ['Aura Ambrée (2 ml Vial)', 'Jardin Blanc (2 ml Vial)'],
  giftNote: 'Some feelings never fade.',
  items: [
    {
      perfumeId: 'aura-ambree',
      edition: 'gilded',
      volume: '50 ml',
      engraving: 'T.A',
      unitPrice: 30000,
      qty: 1,
    },
  ],
  subtotal: 30000,
  discount: 0,
  shippingCost: 0,
  total: 30000,
};

export function loadOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return [SEED_ORDER];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([SEED_ORDER]));
      return [SEED_ORDER];
    }
    const parsed = JSON.parse(raw) as OrderRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SEED_ORDER];
  } catch {
    return [SEED_ORDER];
  }
}

export function saveOrder(order: OrderRecord): OrderRecord[] {
  const current = loadOrders();
  const next = [order, ...current.filter((o) => o.orderNumber !== order.orderNumber)];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function updateOrderStage(orderNumber: string, stageIndex: number): OrderRecord[] {
  const current = loadOrders();
  const clamped = Math.max(0, Math.min(FULFILLMENT_STAGES.length - 1, stageIndex));
  const next = current.map((o) =>
    o.orderNumber === orderNumber ? { ...o, currentStageIndex: clamped } : o
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
