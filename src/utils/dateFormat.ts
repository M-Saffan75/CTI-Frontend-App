import i18n from '@/i18n';
import { getLocaleTag } from '@/i18n/locale';

// 12 Mar 2026 (empty text when there is no valid date)
export function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleTag(), { day: '2-digit', month: 'short', year: 'numeric' });
}

// 12 Mar 2026, 02:30 PM
export function formatDateTime(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString(getLocaleTag(), { hour: '2-digit', minute: '2-digit' });
  return `${formatDate(value)}, ${time}`;
}

// "3 days", "5 hours", "Expired" (empty text when there is no valid date)
export function timeRemaining(value?: string | null): string {
  if (!value) return '';
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return '';
  const diff = end - Date.now();
  if (diff <= 0) return i18n.t('customerMsg.status.expired');
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return i18n.t(days > 1 ? 'repairmanMsg.time.remDaysMany' : 'repairmanMsg.time.remDaysOne', { count: days });
  if (hours > 0) return i18n.t(hours > 1 ? 'repairmanMsg.time.remHoursMany' : 'repairmanMsg.time.remHoursOne', { count: hours });
  return i18n.t('repairmanMsg.time.lessThanHour');
}

// "just now", "5 hours", "3 days"
export function timeAgo(value?: string | null): string {
  if (!value) return i18n.t('repairmanMsg.time.recently');
  const start = new Date(value).getTime();
  if (Number.isNaN(start)) return i18n.t('repairmanMsg.time.recently');
  const hours = Math.floor((Date.now() - start) / 3600000);
  if (hours < 1) return i18n.t('repairmanMsg.time.justNow');
  if (hours < 24) return i18n.t(hours > 1 ? 'repairmanMsg.time.agoHoursMany' : 'repairmanMsg.time.agoHoursOne', { count: hours });
  const days = Math.floor(hours / 24);
  return i18n.t(days > 1 ? 'repairmanMsg.time.agoDaysMany' : 'repairmanMsg.time.agoDaysOne', { count: days });
}

// Mar 2026 / Mar 2026 (empty text when there is no valid date)
export function formatMonthYear(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleTag(), { month: 'short', year: 'numeric' });
}

const EN_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// The backend names months in English ("Jan"); this shows the name in the app language
export function monthShortName(name?: string | null): string {
  const index = EN_MONTHS.indexOf(String(name || '').slice(0, 3).toLowerCase());
  if (index < 0) return String(name || '');
  return new Date(2021, index, 1).toLocaleDateString(getLocaleTag(), { month: 'short' });
}

export const weekdayShortName = (index: number): string =>
  new Date(2021, 0, 3 + index).toLocaleDateString(getLocaleTag(), { weekday: 'short' });

export const monthLongName = (index: number): string =>
  new Date(2021, index, 1).toLocaleDateString(getLocaleTag(), { month: 'long' });

const EN_WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// The backend names working days in English ("Monday"); this shows the name in the app language
export function weekdayLongName(name?: string | null): string {
  const index = EN_WEEKDAYS.indexOf(String(name || '').trim().toLowerCase());
  if (index < 0) return String(name || '');
  return new Date(2021, 0, 3 + index).toLocaleDateString(getLocaleTag(), { weekday: 'long' });
}
