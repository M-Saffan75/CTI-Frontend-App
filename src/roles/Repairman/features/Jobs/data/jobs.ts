/**
 * Demo job data. When the API arrives, replace this file with the fetch and
 * keep the same shape — the screens read these fields and nothing else.
 */

export const PRIORITIES = ['High priority', 'Medium priority', 'Low priority'];
export const MY_JOB_STATUSES = ['Active', 'Completed', 'Cancelled', 'Disputed', 'Closed'];
export const UPDATE_STATUSES = ['In Progress', 'Awaiting Parts', 'Completed', 'On Hold'];
export const DISPUTE_CATEGORIES = [
  'Payment Issue',
  'Parts Quality',
  'Customer Unresponsive',
  'Scope Disagreement',
  'Other',
];
export const WARRANTY_OPTIONS = ['7 Days', '15 Days', '30 Days', '90 Days'];
export const TIME_UNITS = ['Hours', 'Days', 'Weeks'];

const SAMPLE_JOB = {
  device: 'Vivo S1',
  priority: 'High priority',
  expiresIn: 'Expires in 2 days',
  priceMin: 145,
  priceMax: 150,
  postedDaysAgo: 4,
  description:
    'I am a technology enthusiast with an interest in digital services, online platforms, and web applications. I enjoy exploring new tools and learning about modern technologies. This profile is created for testing and demonstration purposes only',
  tag: 'Panel',
  location: 'Hyderabad, Latifabad Unit No. 7, Block 7C',
  warranty: 'Black Warranty: Active',
  status: 'Open',
  budgetRange: 'TRY 145 - TRY 150',
  preferredDate: '30 Jun 2026',
  totalOffers: 0,
  offerLimit: 10,
  views: 0,
  requestedServices: [{ name: 'Panel Replacement', description: 'This is panel service' }],
  client: { name: 'Customer', verified: true },
};

export const JOB_BOARD = Array.from({ length: 6 }).map((_, index) => ({
  id: `jb${index + 1}`,
  ...SAMPLE_JOB,
}));

export const getJobBoardById = id => JOB_BOARD.find(job => job.id === id);

export const MY_OFFERS = Array.from({ length: 4 }).map((_, index) => ({
  id: `mo${index + 1}`,
  ...SAMPLE_JOB,
  submittedDate: '6/29/2026',
  viewed: true,
}));

const SAMPLE_MY_JOB = {
  status: 'Active',
  customer: { name: 'Hamza', avatar: 'https://picsum.photos/seed/cti-repairman-customer/200/200' },
  messageStatus: 'Confirmed Message',
  priority: 'High priority',
  serviceType: 'Pickup',
  device: 'Redmi Note 12',
  price: 899.9,
  estDays: 10,
  warrantyDays: 30,
  description: 'I need a new and fresh mother board',
  part: { name: 'Mother Board' },
  partsQuality: 'Original',
  totalAmount: 5040,
  brand: 'N/A',
  model: 'N/A',
  scheduled: '3/18/2026',
  basePrice: 40,
  partsPrice: 5000,
  serviceCharge: 0,
  currentStatus: 'Confirmed',
  estCompletion: '3/9/2026, 8:29 AM',
};

export const MY_JOBS = [
  { id: 'mj1', ...SAMPLE_MY_JOB, status: 'Active' },
  { id: 'mj2', ...SAMPLE_MY_JOB, status: 'Disputed', device: 'iPhone 13' },
  { id: 'mj3', ...SAMPLE_MY_JOB, status: 'Completed', device: 'Samsung A54' },
];

export const getMyJobById = id => MY_JOBS.find(job => job.id === id);
