const thumbnail = seed => `https://picsum.photos/seed/${seed}/300/300`;

export const ORDER_DETAIL = {
  orderId: 'ORD-20260713-6WD039',
  orderNo: 'TRB-109380',
  tags: ['Delivered', 'Paid'],
  progressStep: 4, // index into PROGRESS_STEPS — 4 = every step filled
  items: [
    {
      id: 'i1',
      name: 'Vivo V40 5G',
      variant: 'Color: Default Variant',
      qty: 1,
      price: 990.0,
      status: 'Delivered',
      image: thumbnail('vivo-v40'),
    },
  ],
  customer: {
    name: 'Customer Abbasi',
    phone: '03111309060',
    city: 'Hyderabad',
    address: 'Karachi Karachi',
  },
  date: '13 Jul 2026, 05:51 PM',
  payment: 'CARD',
  subtotal: 990.0,
  shipping: 10.0,
  total: 1000.0,
  warranty: { returnId: 'RET-396191', date: '7/13/2026' },
};

export const CONTACT_TOPICS = [
  'Tracking information',
  'Wrong item received',
  'Where is my order',
  'Product item recieved',
  'In voice request',
  'Product issue',
];
