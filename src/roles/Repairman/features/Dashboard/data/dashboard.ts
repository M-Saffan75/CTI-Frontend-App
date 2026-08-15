/**
 * Demo dashboard data. When the API arrives, replace this file with the
 * fetch and keep the same shape — the screen reads these fields and nothing
 * else.
 */

export const STATS = {
  totalJobs: 11,
  activeJobs: 3,
};

export const EARNINGS_CHART = [
  { label: '2 Jul', value: 0 },
  { label: '3 Jul', value: 1.5 },
  { label: '4 Jul', value: 0.5 },
  { label: '5 Jul', value: 2.5 },
  { label: '6 Jul', value: 1 },
  { label: '7 Jul', value: 3 },
  { label: '8 Jul', value: 2 },
];

export const JOB_DISTRIBUTION = [
  { label: 'Completed', value: 112, color: '#448AFF' },
  { label: 'In Progress', value: 74, color: '#FEA620' },
  { label: 'Disputed', value: 22, color: '#00A63E' },
  { label: 'Cancelled', value: 40, color: '#EE454D' },
];
export const JOB_DISTRIBUTION_TOTAL = 248;

export const BOOKINGS = [
  {
    id: '9ef0chd',
    status: 'Confirmed',
    customer: 'Hamza Tariq',
    phone: '0318 3185 5136',
    device: 'N/A',
    schedule: 'Mar 18, 2026',
  },
  {
    id: '7bd2anx',
    status: 'Pending',
    customer: 'Sara Ahmed',
    phone: '0300 1234 567',
    device: 'iPhone 13',
    schedule: 'Mar 20, 2026',
  },
  {
    id: '4kd9wep',
    status: 'Confirmed',
    customer: 'Omar Farooq',
    phone: '0333 9988 221',
    device: 'Redmi Note 12',
    schedule: 'Mar 22, 2026',
  },
];
