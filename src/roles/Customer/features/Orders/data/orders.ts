/**
 * Demo order data. When the API arrives, replace this file with the fetch
 * and keep the same shape — the screens read these fields and nothing else.
 */

const thumbnail = seed => `https://picsum.photos/seed/${seed}/300/300`;

export const PROGRESS_STEPS = ['Panding', 'Processing', 'Shipping', 'Shipped', 'Delivered'];

// Both demo orders share the same numbers on purpose — that's what the design
// itself shows (a duplicated card), not a bug in this file.
const SAMPLE_ORDER = {
  orderId: 'ORD-20260715-UT4FDM',
  orderNo: 'TRB: 9865',
  statusTag: 'Panding',
  paymentTag: 'Paid',
  date: '15 July 2026',
  time: '04:44 PM',
  itemCount: 1,
  total: 1089.0,
  paymentStatus: 'Paid',
  items: [
    {
      id: 'i1',
      name: 'Order items',
      variant: 'Color: 4000mAh/ Blue / Titanium/8GB/ 256GB',
      qty: 1,
      price: 1089.0,
      image: thumbnail('order-1'),
    },
  ],
};

export const ORDERS = [
  { id: 'o1', ...SAMPLE_ORDER },
  { id: 'o2', ...SAMPLE_ORDER },
];

export const SHIPPING_ADDRESS = 'Hyderabad sindh Pakistan';

const SAMPLE_RETURN = {
  returnId: 'RET-396191',
  device: 'Vivo V40 5G',
  orderNo: 'TRB-109380',
  amount: 1000.0,
  date: '7/13/2026',
  note: 'this is my return Request',
  status: 'Approved',
};

export const RETURNS = [
  { id: 'r1', ...SAMPLE_RETURN },
  { id: 'r2', ...SAMPLE_RETURN },
  { id: 'r3', ...SAMPLE_RETURN },
  { id: 'r4', ...SAMPLE_RETURN },
];
