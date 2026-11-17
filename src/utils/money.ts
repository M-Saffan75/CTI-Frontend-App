// The one money formatter for the whole app.
// English: formatMoney(1234.5) -> "₺1,234.50". Turkish: "₺1.234,50". Negative: "-₺5.00" / "-₺5,00".
// The separators follow the app language (src/i18n/locale.ts).
// The app font (Switzer) has no ₺ glyph, so the phone's system font draws that one character.
// If a phone ever shows a box instead of ₺, set USE_SYMBOLS to false and every amount shows "TRY 1,234.50".
import { getCurrentLanguage } from '@/i18n/locale';

const USE_SYMBOLS = true;

const SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  PKR: 'PKR ',
};

function prefixFor(currency: string): string {
  const code = (currency || 'TRY').trim().toUpperCase() || 'TRY';
  if (USE_SYMBOLS && SYMBOLS[code]) return SYMBOLS[code];
  return `${code} `;
}

function separators(): { group: string; decimal: string } {
  return getCurrentLanguage() === 'tr' ? { group: '.', decimal: ',' } : { group: ',', decimal: '.' };
}

// 1234.5 -> "1,234.50" (English) or "1.234,50" (Turkish), always 2 decimals
export function formatNumber(amount: number | string | null | undefined): string {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const fixed = (Math.round(Math.abs(safe) * 100) / 100).toFixed(2);
  const [whole, decimals] = fixed.split('.');
  const { group, decimal } = separators();
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, group)}${decimal}${decimals}`;
}

// 12345 -> "12,345" (English) or "12.345" (Turkish), for counts such as impressions and clicks
export function formatCount(value: number | string | null | undefined): string {
  const n = Number(value);
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  const { group } = separators();
  return `${safe < 0 ? '-' : ''}${String(Math.abs(safe)).replace(/\B(?=(\d{3})+(?!\d))/g, group)}`;
}

export function formatMoney(amount: number | string | null | undefined, currency: string = 'TRY'): string {
  const value = Number(amount);
  const negative = Number.isFinite(value) && Math.round(value * 100) < 0;
  return `${negative ? '-' : ''}${prefixFor(currency)}${formatNumber(amount)}`;
}

export function currencySymbol(currency: string = 'TRY'): string {
  return prefixFor(currency).trim();
}
