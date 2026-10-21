export interface WalletSummary {
  availableBalance: string;
  pendingBalance: string;
  totalWithdrawn: string;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  orderNumber?: string;
  type: 'credit' | 'debit';
  amount: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface WithdrawalRequest {
  id: string;
  referenceId: string;
  bankName: string;
  accountNumber: string;
  amount: string;
  date: string;
  status: 'Approved' | 'Processing' | 'Rejected';
}

export const SELLER_WALLET_SUMMARY: WalletSummary = {
  availableBalance: '$14,250.00',
  pendingBalance: '$2,180.00',
  totalWithdrawn: '$38,400.00',
  currency: 'USD',
};

export const SELLER_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1',
    title: 'Order Payment Received',
    orderNumber: '#ORD-98421',
    type: 'credit',
    amount: '+$1,199.00',
    date: '19 Oct 2026, 03:22 PM',
    status: 'Completed',
  },
  {
    id: 'tx-2',
    title: 'Ad Campaign Spend (iPhone Promo)',
    type: 'debit',
    amount: '-$45.00',
    date: '19 Oct 2026, 01:00 AM',
    status: 'Completed',
  },
  {
    id: 'tx-3',
    title: 'Order Payment Received',
    orderNumber: '#ORD-98402',
    type: 'credit',
    amount: '+$399.00',
    date: '17 Oct 2026, 05:45 PM',
    status: 'Completed',
  },
  {
    id: 'tx-4',
    title: 'Bank Withdrawal Payout',
    type: 'debit',
    amount: '-$5,000.00',
    date: '15 Oct 2026, 10:30 AM',
    status: 'Completed',
  },
  {
    id: 'tx-5',
    title: 'Platform Commission Fee (3%)',
    type: 'debit',
    amount: '-$29.97',
    date: '14 Oct 2026, 12:00 PM',
    status: 'Completed',
  },
];

export const SELLER_WITHDRAWAL_HISTORY: WithdrawalRequest[] = [
  {
    id: 'wd-1',
    referenceId: '#WD-8819',
    bankName: 'Habib Bank Limited (HBL)',
    accountNumber: '**** **** **** 4821',
    amount: '$5,000.00',
    date: '15 Oct 2026',
    status: 'Approved',
  },
  {
    id: 'wd-2',
    referenceId: '#WD-8790',
    bankName: 'Meezan Bank Islamic',
    accountNumber: '**** **** **** 9102',
    amount: '$3,200.00',
    date: '08 Oct 2026',
    status: 'Approved',
  },
  {
    id: 'wd-3',
    referenceId: '#WD-8742',
    bankName: 'Standard Chartered Bank',
    accountNumber: '**** **** **** 3311',
    amount: '$7,500.00',
    date: '28 Sep 2026',
    status: 'Approved',
  },
];
