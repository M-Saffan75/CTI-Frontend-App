import { NotificationItem } from '@/services/notificationApi';
import { formatDate, formatDateTime } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { ROLES } from '@/constants/roles';
import { openSellerTab } from '@/roles/Seller/utils/sellerUtils';
import i18n from '@/i18n';
import { chipLabel, serviceTypeLabel, statusLabel } from '@/utils/labels';

export interface DetailRow {
  label: string;
  value: string;
}

export interface NotificationAction {
  label: string;
  run: (navigation: any) => void;
}

const TYPE_KEYS: string[] = [
  'new_job',
  'new_offer',
  'offer_accepted',
  'offer_rejected',
  'job_cancelled',
  'booking_status_update',
  'dispute_raised',
  'partOrder',
  'refurbish_offer',
  'ecom_new_order',
  'new_order',
  'order_status_update',
  'ecom_order_cancelled',
  'ecom_product_query',
  'ecom_order_query',
  'ecom_return_requested',
  'ecom_return_status',
  'new_refurbished_order',
  'refurbished_order_update',
  'refurbished_order_status',
  'refurbished_order_cancelled',
  'new_sell_request',
  'sell_request_status_update',
  'sell_request_offer_accepted',
  'sell_request_offer_rejected',
  'seller_new_product',
  'withdrawal_requested',
  'withdrawal_approved',
  'withdrawal_rejected',
];

export function notificationTypeLabel(type?: string): string {
  if (!type) return i18n.t('repairmanMsg.notifNotification');
  return TYPE_KEYS.includes(type) ? i18n.t(`repairmanMsg.notifType.${type}`) : humanize(type);
}

function humanize(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const spaced = text.replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function has(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

// The detail lines come from the data the backend saved with the notification (job, offer, order, amount...).
// Only values that make sense to the reader are shown, never ids.
export function getDetailRows(item: NotificationItem): DetailRow[] {
  const data: Record<string, any> =
    item.data && typeof item.data === 'object' ? item.data : {};
  const currency = has(data.currency) ? String(data.currency) : 'TRY';
  const rows: DetailRow[] = [];
  const add = (label: string, value: unknown, format?: (v: any) => string) => {
    if (!has(value)) return;
    rows.push({ label, value: format ? format(value) : String(value) });
  };
  const money = (v: any) => formatMoney(Number(v), currency);

  const device = [data.deviceBrand, data.deviceModel].filter(has).join(' ');
  add(i18n.t('repairmanMsg.detail.job'), data.jobTitle);
  add(i18n.t('repairmanMsg.detail.device'), device);
  add(i18n.t('repairmanMsg.detail.categoryName'), data.categoryName);
  add(i18n.t('repairmanMsg.detail.priority'), data.urgency, chipLabel);
  if (has(data.budgetMin) && has(data.budgetMax)) {
    const budgetCurrency = has(data.budgetCurrency)
      ? String(data.budgetCurrency)
      : 'TRY';
    rows.push({
      label: i18n.t('repairman.budget'),
      value: `${formatMoney(
        Number(data.budgetMin),
        budgetCurrency,
      )} - ${formatMoney(Number(data.budgetMax), budgetCurrency)}`,
    });
  }
  add(i18n.t('repairmanMsg.detail.city'), data.city);
  add(i18n.t('repairmanMsg.detail.address'), data.address);
  add(i18n.t('repairmanMsg.detail.repairman'), data.repairmanName);
  add(i18n.t('repairmanMsg.detail.shop'), data.shopName);
  add(i18n.t('repairmanMsg.detail.customer'), data.customerName);
  add(i18n.t('repairmanMsg.detail.raisedBy'), data.raisedByName);
  add(i18n.t('repairmanMsg.detail.rating'), data.rating, v =>
    Number.isNaN(Number(v)) ? String(v) : `${Number(v).toFixed(1)} / 5`,
  );
  add(i18n.t('repairmanMsg.detail.price'), data.price, money);
  add(i18n.t('repairmanMsg.detail.offerPrice'), data.offerPrice, money);
  add(i18n.t('repairmanMsg.detail.totalAmount'), data.totalAmount, money);
  add(i18n.t('repairmanMsg.detail.amount'), data.amount, money);
  add(i18n.t('repairmanMsg.detail.estimatedTime'), data.estimatedTime);
  add(i18n.t('repairmanMsg.detail.totalOffers'), data.totalOffers);
  add(i18n.t('repairmanMsg.detail.service'), data.serviceType, serviceTypeLabel);
  add(i18n.t('repairmanMsg.detail.scheduled'), data.scheduledDate, formatDateTime);
  add(i18n.t('repairmanMsg.detail.expectedBy'), data.expectedDate, formatDate);
  if (has(data.oldStatus) && has(data.newStatus)) {
    rows.push({
      label: i18n.t('customer.status'),
      value: i18n.t('repairmanMsg.statusChange', { from: statusLabel(data.oldStatus), to: statusLabel(data.newStatus) }),
    });
  } else {
    add(i18n.t('repairmanMsg.detail.status'), data.newStatus || data.status, statusLabel);
  }
  add(i18n.t('repairmanMsg.detail.category'), data.category, v => i18n.t(`dispute.categories.${v}`, { defaultValue: humanize(v) }));
  add(i18n.t('repairmanMsg.detail.orderNo'), data.orderNo);
  add(i18n.t('repairmanMsg.detail.trackingId'), data.trackingId);
  add(i18n.t('repairmanMsg.detail.reason'), data.reason);
  add(i18n.t('repairmanMsg.detail.notes'), data.notes);
  return rows;
}

const SELLER_ORDER = [
  'ecom_new_order',
  'new_order',
  'order_status_update',
  'ecom_order_cancelled',
  'new_refurbished_order',
];
const SELLER_RETURN = ['ecom_return_requested', 'ecom_return_status'];
const SELLER_ENQUIRY = ['ecom_product_query', 'ecom_order_query'];
const WITHDRAWAL = [
  'withdrawal_requested',
  'withdrawal_approved',
  'withdrawal_rejected',
];
const CUSTOMER_ORDER = [
  'order_status_update',
  'ecom_order_cancelled',
  'new_refurbished_order',
  'refurbished_order_update',
  'refurbished_order_status',
  'refurbished_order_cancelled',
  'ecom_return_status',
];
const SELL_REQUEST = [
  'new_sell_request',
  'sell_request_status_update',
  'sell_request_offer_accepted',
  'sell_request_offer_rejected',
  'refurbish_offer',
];

// Where the "open" button of the detail modal goes, for the role that is logged in
export function getNotificationAction(
  role: string | null,
  item: NotificationItem,
): NotificationAction | null {
  const type = item.type || '';
  const data: Record<string, any> =
    item.data && typeof item.data === 'object' ? item.data : {};

  if (role === ROLES.CUSTOMER) {
    if (
      has(data.jobId) &&
      [
        'new_offer',
        'booking_status_update',
        'offer_accepted',
        'offer_rejected',
        'job_cancelled',
      ].includes(type)
    ) {
      return {
        label: i18n.t('repairman.viewJob'),
        run: nav =>
          nav?.navigate('RepairDetail', { jobId: String(data.jobId) }),
      };
    }
    if (CUSTOMER_ORDER.includes(type))
      return { label: i18n.t('repairman.viewMyOrders'), run: nav => nav?.navigate('Orders') };
    if (SELL_REQUEST.includes(type))
      return {
        label: i18n.t('repairman.viewMySellRequests'),
        run: nav => nav?.navigate('MySellRequests'),
      };
  }

  if (role === ROLES.SELLER) {
    if (SELLER_ORDER.includes(type) && has(data.orderId)) {
      return {
        label: i18n.t('repairman.viewOrder'),
        run: nav =>
          nav?.navigate('SellerOrderDetail', { orderId: String(data.orderId) }),
      };
    }
    if (SELLER_RETURN.includes(type))
      return {
        label: i18n.t('repairman.viewReturns'),
        run: nav => openSellerTab(nav, 'Reported'),
      };
    if (SELLER_ENQUIRY.includes(type))
      return {
        label: i18n.t('repairman.viewEnquiries'),
        run: nav => openSellerTab(nav, 'Enquiries'),
      };
    if (WITHDRAWAL.includes(type))
      return { label: i18n.t('repairman.openWallet'), run: nav => openSellerTab(nav, 'Wallet') };
  }

  if (role === ROLES.REPAIRMAN) {
    if (type === 'new_job' && has(data.jobId)) {
      return {
        label: i18n.t('repairman.viewJob'),
        run: nav =>
          nav?.navigate('JobBoardDetail', { jobId: String(data.jobId) }),
      };
    }
    if (['offer_accepted', 'offer_rejected'].includes(type)) {
      return {
        label: i18n.t('repairman.viewMyOffers'),
        run: nav =>
          nav?.navigate('Home', {
            screen: 'JobsTab',
            params: { tab: 'MyOffers', at: Date.now() },
          }),
      };
    }
    if (type === 'booking_status_update') {
      return {
        label: i18n.t('repairman.viewMyJobs'),
        run: nav =>
          nav?.navigate('Home', {
            screen: 'JobsTab',
            params: { tab: 'MyJobs', at: Date.now() },
          }),
      };
    }
    if (WITHDRAWAL.includes(type)) {
      return {
        label: i18n.t('repairman.openEarnings'),
        run: nav => nav?.navigate('Home', { screen: 'EarningsTab' }),
      };
    }
  }

  return null;
}
