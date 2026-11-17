import { Linking } from 'react-native';
import { getLocaleTag } from '@/i18n/locale';
import i18n from '@/i18n';

export { formatMoney } from '@/utils/money';

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'short' });
}

export function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleTag(), { weekday: 'short', month: 'long', day: 'numeric' });
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleTag(), { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString(getLocaleTag(), { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(getLocaleTag(), { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

// Time for today, otherwise the date (enquiry lists)
export function formatListTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString(getLocaleTag(), { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(getLocaleTag(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// yyyy-mm-dd in the phone's own time zone, the format the backend date filters read
export function toApiDate(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return i18n.t('sellerMsg.greeting.morning');
  if (hour < 17) return i18n.t('sellerMsg.greeting.afternoon');
  return i18n.t('sellerMsg.greeting.evening');
}

// Returns false when the phone cannot open the link, so the screen can show a themed modal with the address
export async function openWebsite(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

// Set after a product is added so the product list reloads when it becomes visible again
let productsDirty = false;
export function markProductsDirty() {
  productsDirty = true;
}
export function consumeProductsDirty(): boolean {
  const was = productsDirty;
  productsDirty = false;
  return was;
}

// Opens one of the Seller tabs from anywhere in the Seller stack
export function openSellerTab(navigation: any, tab: string, extra: Record<string, any> = {}) {
  if (tab === 'Dashboard') {
    navigation?.navigate('SellerMain', { screen: 'HomeTab' });
    return;
  }
  navigation?.navigate('SellerMain', {
    screen: 'ProductTab',
    params: { initialTab: tab, at: Date.now(), ...extra },
  });
}

// Set when an enquiry was opened or changed so the enquiry list reloads when it is visible again
let enquiriesDirty = false;
export function markEnquiriesDirty() {
  enquiriesDirty = true;
}
export function consumeEnquiriesDirty(): boolean {
  const was = enquiriesDirty;
  enquiriesDirty = false;
  return was;
}

// Set after a campaign is created so the Ads tab reloads when it is visible again
let adsDirty = false;
export function markAdsDirty() {
  adsDirty = true;
}
export function consumeAdsDirty(): boolean {
  const was = adsDirty;
  adsDirty = false;
  return was;
}
