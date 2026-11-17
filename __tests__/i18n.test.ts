import i18n from '@/i18n';
import { setCurrentLanguage } from '@/i18n/locale';
import en from '@/i18n/locales/en';
import tr from '@/i18n/locales/tr';
import { getWebLoginUrl, getWebSellerOrderUrl } from '@/constants/config';
import { formatDate } from '@/utils/dateFormat';
import { formatCount, formatMoney } from '@/utils/money';

const useLanguage = (code: 'tr' | 'en') => {
  setCurrentLanguage(code);
  return i18n.changeLanguage(code);
};

afterAll(() => useLanguage('tr'));

describe('money and numbers follow the app language', () => {
  it('Turkish: 1.234,50', async () => {
    await useLanguage('tr');
    expect(formatMoney(1234.5)).toBe('₺1.234,50');
    expect(formatMoney(-5)).toBe('-₺5,00');
    expect(formatMoney(1234567.891)).toBe('₺1.234.567,89');
    expect(formatCount(12345)).toBe('12.345');
  });

  it('English: 1,234.50', async () => {
    await useLanguage('en');
    expect(formatMoney(1234.5)).toBe('₺1,234.50');
    expect(formatMoney(-5)).toBe('-₺5.00');
    expect(formatCount(12345)).toBe('12,345');
  });
});

describe('web links use the app language', () => {
  it('switches /tr/ and /en/', async () => {
    await useLanguage('tr');
    expect(getWebLoginUrl()).toBe('https://cti-frontend-zeta.vercel.app/tr/auth/login');
    expect(getWebSellerOrderUrl('abc')).toBe('https://cti-frontend-zeta.vercel.app/tr/seller/order/abc');
    await useLanguage('en');
    expect(getWebLoginUrl()).toBe('https://cti-frontend-zeta.vercel.app/en/auth/login');
  });
});

describe('dates use the app language', () => {
  it('Turkish month names differ from English ones', async () => {
    await useLanguage('tr');
    const turkish = formatDate('2026-01-12T10:00:00Z');
    await useLanguage('en');
    const english = formatDate('2026-01-12T10:00:00Z');
    expect(english).toBe('12 Jan 2026');
    expect(turkish).toContain('2026');
    expect(turkish).not.toBe(english);
  });
});

describe('glossary', () => {
  it('has the same 20 keys in both languages', () => {
    expect(Object.keys(en.glossary)).toHaveLength(20);
    expect(Object.keys(tr.glossary).sort()).toEqual(Object.keys(en.glossary).sort());
  });

  it('switches the text and falls back to English for a missing key', async () => {
    await useLanguage('tr');
    expect(i18n.t('glossary.refund')).toBe('Para iadesi');
    expect(i18n.t('glossary.return')).toBe('Ürün iadesi');
    await useLanguage('en');
    expect(i18n.t('glossary.refund')).toBe('Refund');
    expect(i18n.t('glossary.notAKey')).toBe('glossary.notAKey');
  });
});

describe('Repairman helpers follow the app language', () => {
  it('time phrases, month and day names', async () => {
    const { timeAgo, monthShortName, weekdayLongName } = require('@/utils/dateFormat');
    const { statusLabel } = require('@/utils/labels');
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000 - 60000).toISOString();
    await useLanguage('en');
    expect(timeAgo(twoDaysAgo)).toBe('2 days ago');
    expect(statusLabel('parts_needed')).toBe('Parts needed');
    expect(monthShortName('Jan')).toBe('Jan');
    await useLanguage('tr');
    expect(timeAgo(twoDaysAgo)).toBe('2 gün önce');
    expect(statusLabel('parts_needed')).toBe('Parça gerekli');
    expect(statusLabel('some_new_word')).toBe('Some new word');
    expect(monthShortName('Jan')).toBe('Oca');
    expect(weekdayLongName('Monday')).toBe('Pazartesi');
  });
});
