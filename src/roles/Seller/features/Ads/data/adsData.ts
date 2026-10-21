export interface AdMetrics {
  totalSpend: string;
  totalImpressions: string;
  totalClicks: string;
  averageCtr: string;
  roas: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  objective: string;
  targetProduct: string;
  dailyBudget: string;
  totalSpent: string;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
  status: 'Running' | 'Paused' | 'Completed';
}

export interface PaymentCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cardType: 'Visa' | 'Mastercard';
  isDefault: boolean;
}

export const SELLER_AD_METRICS: AdMetrics = {
  totalSpend: '$1,420.00',
  totalImpressions: '184.2K',
  totalClicks: '14,890',
  averageCtr: '8.1%',
  roas: '4.8x',
};

export const SELLER_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'camp-1',
    name: 'iPhone 15 Flagship Push',
    objective: 'Conversions',
    targetProduct: 'iPhone 15 Pro Max 256GB',
    dailyBudget: '$25.00/day',
    totalSpent: '$350.00',
    clicks: 4210,
    conversions: 84,
    startDate: '10 Oct 2026',
    endDate: '25 Oct 2026',
    status: 'Running',
  },
  {
    id: 'camp-2',
    name: 'Samsung Galaxy S24 Blast',
    objective: 'Store Traffic',
    targetProduct: 'Samsung Galaxy S24 Ultra',
    dailyBudget: '$15.00/day',
    totalSpent: '$210.00',
    clicks: 2980,
    conversions: 42,
    startDate: '05 Oct 2026',
    endDate: '20 Oct 2026',
    status: 'Running',
  },
  {
    id: 'camp-3',
    name: 'Sony Audio Deals Autumn',
    objective: 'Brand Awareness',
    targetProduct: 'Sony WH-1000XM5 Headphones',
    dailyBudget: '$10.00/day',
    totalSpent: '$140.00',
    clicks: 1650,
    conversions: 21,
    startDate: '28 Sep 2026',
    endDate: '12 Oct 2026',
    status: 'Completed',
  },
];

export const SELLER_PAYMENT_CARDS: PaymentCard[] = [
  {
    id: 'card-1',
    cardNumber: '•••• •••• •••• 4242',
    cardHolder: 'Hammad Raza',
    expiry: '09/28',
    cardType: 'Visa',
    isDefault: true,
  },
  {
    id: 'card-2',
    cardNumber: '•••• •••• •••• 8821',
    cardHolder: 'Hammad Raza',
    expiry: '12/29',
    cardType: 'Mastercard',
    isDefault: false,
  },
];
