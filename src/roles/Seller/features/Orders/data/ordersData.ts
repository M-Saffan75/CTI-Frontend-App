export interface OrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: string;
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'COD';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}

export interface CancelledOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  cancelledDate: string;
  amount: string;
  reason: string;
  refundStatus: 'Refunded' | 'Pending Refund' | 'No Refund Required';
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderNumber: string;
  customerName: string;
  date: string;
  item: string;
  refundAmount: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Received' | 'Rejected';
}

export const SELLER_ORDERS_DATA: SellerOrder[] = [
  {
    id: 'ord-1',
    orderNumber: '#ORD-98421',
    customerName: 'Muhammad Bilal',
    customerPhone: '+92 321 8765432',
    customerAddress: 'Gulshan-e-Iqbal Block 5, Karachi',
    orderDate: '19 Oct 2026, 03:20 PM',
    items: [
      {
        id: 'i-1',
        name: 'iPhone 15 Pro Max 256GB Titanium',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&q=80',
        quantity: 1,
        price: '$1,199.00',
      },
    ],
    totalAmount: '$1,199.00',
    paymentMethod: 'Credit Card (Visa)',
    paymentStatus: 'Paid',
    status: 'Pending',
  },
  {
    id: 'ord-2',
    orderNumber: '#ORD-98418',
    customerName: 'Ayesha Siddiqua',
    customerPhone: '+92 300 4567890',
    customerAddress: 'DHA Phase 6, Lahore',
    orderDate: '18 Oct 2026, 11:15 AM',
    items: [
      {
        id: 'i-2',
        name: 'Samsung Galaxy S24 Ultra 512GB',
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&q=80',
        quantity: 1,
        price: '$1,299.00',
      },
      {
        id: 'i-3',
        name: 'Galaxy Buds Pro 2',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80',
        quantity: 1,
        price: '$179.00',
      },
    ],
    totalAmount: '$1,478.00',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'COD',
    status: 'Processing',
  },
  {
    id: 'ord-3',
    orderNumber: '#ORD-98402',
    customerName: 'Zain Ul Abideen',
    customerPhone: '+92 333 9876543',
    customerAddress: 'F-7/2, Islamabad',
    orderDate: '17 Oct 2026, 05:40 PM',
    items: [
      {
        id: 'i-4',
        name: 'Sony WH-1000XM5 Wireless Headphones',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
        quantity: 1,
        price: '$399.00',
      },
    ],
    totalAmount: '$399.00',
    paymentMethod: 'Debit Card (Mastercard)',
    paymentStatus: 'Paid',
    status: 'Shipped',
  },
  {
    id: 'ord-4',
    orderNumber: '#ORD-98390',
    customerName: 'Fatima Noor',
    customerPhone: '+92 312 3456789',
    customerAddress: 'North Nazimabad, Karachi',
    orderDate: '16 Oct 2026, 09:10 AM',
    items: [
      {
        id: 'i-5',
        name: 'MacBook Air M2 13-inch 256GB',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&q=80',
        quantity: 1,
        price: '$999.00',
      },
    ],
    totalAmount: '$999.00',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    status: 'Delivered',
  },
];

export const SELLER_CANCELLED_ORDERS: CancelledOrder[] = [
  {
    id: 'can-1',
    orderNumber: '#ORD-98375',
    customerName: 'Usman Ghani',
    cancelledDate: '17 Oct 2026, 01:20 PM',
    amount: '$450.00',
    reason: 'Customer placed duplicate order by mistake',
    refundStatus: 'Refunded',
  },
  {
    id: 'can-2',
    orderNumber: '#ORD-98340',
    customerName: 'Hamza Sheikh',
    cancelledDate: '15 Oct 2026, 04:10 PM',
    amount: '$890.00',
    reason: 'Item temporarily out of stock in warehouse',
    refundStatus: 'Refunded',
  },
  {
    id: 'can-3',
    orderNumber: '#ORD-98312',
    customerName: 'Sana Malik',
    cancelledDate: '13 Oct 2026, 08:45 AM',
    amount: '$120.00',
    reason: 'Payment gateway timed out during checkout',
    refundStatus: 'No Refund Required',
  },
];

export const SELLER_RETURN_REQUESTS: ReturnRequest[] = [
  {
    id: 'ret-1',
    returnNumber: '#RET-4091',
    orderNumber: '#ORD-98288',
    customerName: 'Kashif Ali',
    date: '18 Oct 2026',
    item: 'Sony WH-1000XM5 Wireless Headphones',
    refundAmount: '$399.00',
    reason: 'Left ear cup audio cuts out intermittently after 2 hours.',
    status: 'Pending',
  },
  {
    id: 'ret-2',
    returnNumber: '#RET-4082',
    orderNumber: '#ORD-98250',
    customerName: 'Maryam Tariq',
    date: '16 Oct 2026',
    item: 'Samsung Galaxy S24 Ultra Silicone Case',
    refundAmount: '$45.00',
    reason: 'Ordered wrong color variant by mistake.',
    status: 'Approved',
  },
  {
    id: 'ret-3',
    returnNumber: '#RET-4075',
    orderNumber: '#ORD-98199',
    customerName: 'Omer Farooq',
    date: '14 Oct 2026',
    item: 'Apple 20W USB-C Power Adapter',
    refundAmount: '$29.00',
    reason: 'Package seal was already torn upon courier delivery.',
    status: 'Received',
  },
];
