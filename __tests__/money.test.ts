import { setCurrentLanguage } from '../src/i18n/locale';
import { currencySymbol, formatMoney, formatNumber } from '../src/utils/money';

// these tests check the English format; the app default is Turkish (see i18n.test.ts)
beforeAll(() => setCurrentLanguage('en'));

describe('formatMoney', () => {
  test('formats Turkish lira with thousands separators and two decimals', () => {
    expect(formatMoney(1234.5)).toBe('₺1,234.50');
    expect(formatMoney(0)).toBe('₺0.00');
  });

  test('keeps the minus sign in front of the symbol', () => {
    expect(formatMoney(-5)).toBe('-₺5.00');
  });

  test('treats missing or invalid amounts as zero', () => {
    expect(formatMoney(undefined)).toBe('₺0.00');
    expect(formatMoney(null)).toBe('₺0.00');
    expect(formatMoney('abc')).toBe('₺0.00');
  });

  test('uses the currency given by the backend', () => {
    expect(formatMoney(10, 'USD')).toBe('$10.00');
    expect(formatMoney(10, 'XYZ')).toBe('XYZ 10.00');
  });

  test('formatNumber and currencySymbol agree with formatMoney', () => {
    expect(formatNumber(1000)).toBe('1,000.00');
    expect(currencySymbol()).toBe('₺');
  });
});
