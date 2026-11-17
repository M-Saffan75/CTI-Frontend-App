import i18n from '@/i18n';
import { getLocaleTag } from '@/i18n/locale';

const norm = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const humanize = (value: unknown) => {
  const text = String(value ?? '').replace(/[_-]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
};

// Status words the backend sends (pending, shipped, in_progress ...), shown in the app language.
// An unknown word is shown as it is, never hidden.
export const statusLabel = (value?: unknown): string => {
  const key = norm(value);
  return key
    ? i18n.t([`customerMsg.status.${key}`, `repairmanMsg.status.${key}`], { defaultValue: humanize(value) })
    : '';
};

// customer, repairman, seller, admin ...
export const userTypeLabel = (value?: unknown): string => {
  const key = norm(value);
  if (!key) return '';
  return i18n.t(`customerMsg.userType.${key}`, { defaultValue: humanize(value) });
};

// drop-off, pickup, onsite ...
export const serviceTypeLabel = (value?: unknown): string => {
  const key = norm(value);
  return key ? i18n.t(`customerMsg.serviceType.${key}`, { defaultValue: humanize(value) }) : '';
};

// low, medium, high, urgent ...
export const priorityLabel = (value?: unknown): string => {
  const key = norm(value);
  return key ? i18n.t(`customerMsg.priority.${key}`, { defaultValue: humanize(value) }) : '';
};

// card, cod, cash_on_delivery ...
export const paymentMethodLabel = (value?: unknown): string => {
  const key = norm(value);
  return key
    ? i18n.t([`customerMsg.payMethod.${key}`, `customerMsg.status.${key}`], { defaultValue: String(value) })
    : '';
};

// A small tag on a job card: status words, priority words, job_posting, direct_message
export const chipLabel = (value?: unknown): string => {
  const key = norm(value);
  if (!key) return '';
  return i18n.t([`customerMsg.status.${key}`, `customerMsg.priority.${key}`], { defaultValue: humanize(value) });
};

// Text a service cannot build for good: it keeps the key and the values, or the date, and the screen turns it into text
// with tx() each time it draws, so it follows the app language.
export type Msg =
  | string
  | { key: string; params?: Record<string, unknown> }
  | { date: string; style?: 'short' | 'long' };

export const tx = (message?: Msg | null): string => {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if ('date' in message) {
    const d = new Date(message.date);
    if (Number.isNaN(d.getTime())) return '';
    const options: Intl.DateTimeFormatOptions | undefined =
      message.style === 'short'
        ? { month: 'short', day: 'numeric' }
        : message.style === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : undefined;
    return d.toLocaleDateString(getLocaleTag(), options);
  }
  const params: Record<string, unknown> = { ...(message.params || {}) };
  if (typeof params.priority === 'string') params.priority = priorityLabel(params.priority);
  if (typeof params.status === 'string') params.status = statusLabel(params.status);
  if (typeof params.unit === 'string') {
    params.unit = i18n.t(`customerMsg.unit.${params.unit}`, { defaultValue: params.unit });
  }
  return i18n.t(message.key, params);
};
