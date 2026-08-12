/**
 * Demo repair-job data. When the API arrives, replace this file with the fetch
 * and keep the same shape — the screen reads these fields and nothing else.
 *
 * `status` is what the tabs filter on. `tag` is the small pill under the title
 * ("Job Posting" for a public request, "Direct Message" once a repairman is
 * talking to the customer directly).
 */

const LONG_DESCRIPTION =
  'slike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we li';

export const JOBS = [
  {
    id: 'j1',
    device: 'Redmi  Note 20',
    service: 'Penel',
    priceMin: 45,
    priceMax: 50000,
    tag: 'job_posting',
    description:
      'Panel is cracked on the left edge and the screen flickers when the phone is tilted. Looking for a quick, reliable fix — open to offers from nearby shops.',
    requiredServices: ['Panel'],
    status: 'offer_received',
    offerLabel: 'Offers_received',
    expiresAt: 'Jul 6, 2026',
    assignedTo: null,
  },
  {
    id: 'j2',
    device: 'SAMSUNG Samsung A 73 - Mobile Repairing',
    service: null,
    priceMin: 5500,
    priceMax: 5500,
    tag: 'direct_message',
    description: 'this is my mobile repairing',
    requiredServices: ['Mobile Repairing'],
    status: 'booked',
    offerLabel: 'Confirmed',
    expiresAt: null,
    assignedTo: 'Hammad',
  },
  {
    id: 'j3',
    device: 'Redmi Note 12 - Battery, Mobile Repairing',
    service: null,
    priceMin: 5040,
    priceMax: 5040,
    tag: 'direct_message',
    description: LONG_DESCRIPTION,
    requiredServices: ['Battery', 'Mobile Repairing'],
    status: 'completed',
    offerLabel: 'Confirmed',
    expiresAt: null,
    assignedTo: 'Hammad',
  },
  {
    id: 'j4',
    device: 'Redmi Note 12 - Panel Battery Mother Board',
    service: null,
    priceMin: 4533,
    priceMax: 4533,
    tag: 'direct_message',
    description: 'this is the end',
    requiredServices: ['Panel', 'Battery', 'Mother Board'],
    status: 'disputed',
    offerLabel: 'Confirmed',
    expiresAt: null,
    assignedTo: 'Hammad',
  },
  {
    id: 'j5',
    device: 'SAMSUNG Samsung A 73 - Screen Repair, Mobile Repairing',
    service: null,
    priceMin: 3676,
    priceMax: 3676,
    tag: 'direct_message',
    description: 'this is my description',
    requiredServices: ['Screen Repair', 'Mobile Repairing'],
    status: 'disputed',
    offerLabel: 'Confirmed',
    expiresAt: null,
    assignedTo: 'Hammad',
  },
  {
    id: 'j6',
    device: 'Vivo S1 - Screen Repair',
    service: null,
    priceMin: 3676,
    priceMax: 3676,
    tag: 'direct_message',
    description: 'this is video screen description',
    requiredServices: ['Screen Repair'],
    status: 'disputed',
    offerLabel: 'Confirmed',
    expiresAt: null,
    assignedTo: 'Hammad',
  },
  {
    id: 'j7',
    device: 'SAMSUNG Samsung A 73 - Mobile Repairing',
    service: null,
    priceMin: 5033.99,
    priceMax: 5033.99,
    tag: 'direct_message',
    description: 'this is my mobile repairing',
    requiredServices: ['Mobile Repairing'],
    status: 'booked',
    offerLabel: 'Confirmed',
    expiresAt: null,
    assignedTo: 'Hammad',
  },
  {
    id: 'j8',
    device: 'Redmi Note 12 - Mother Board',
    service: null,
    priceMin: 6320,
    priceMax: 6320,
    tag: 'direct_message',
    description: 'this is my mobile repairing',
    requiredServices: ['Mobile Repairing'],
    status: 'booked',
    offerLabel: 'Confirmed',
    expiresAt: null,
    assignedTo: 'Hammad',
  },
];

// Jobs eligible for a review — separate shape from JOBS since the Reviews tab
// card looks nothing like the others.
export const REVIEWS = [
  {
    id: 'r1',
    device: 'Unknow',
    completedDate: '4/18/2026',
    tag: 'job_posting',
    repairman: 'Hammad',
    shop: "Hammad's shop",
    amountPaid: 6200,
    review: null,
  },
  {
    id: 'r2',
    device: 'Unknow',
    completedDate: '4/18/2026',
    tag: 'job_posting',
    repairman: 'Hammad',
    shop: "Hammad's shop",
    amountPaid: 5000,
    review: {
      rating: 5,
      submittedAt: '4/2/2026',
    },
  },
];
