/**
 * Demo data for the Home screen. When the API arrives, replace each export
 * with the matching fetch and keep the same shape — the screen reads these
 * fields and nothing else.
 */

const photo = seed => `https://picsum.photos/seed/${seed}/500/500`;

// ---- "Trusted by" stats — shown once, 4 cards ----
export const STATS = [
  { id: 's1', value: '123.8 + Lac', label: 'Happy Customer' },
  { id: 's2', value: '93212.8 Cr', label: 'Cash Given' },
  { id: 's3', value: '185.8 + Lac', label: 'Loans Approved' },
  { id: 's4', value: 'Since 2015', label: 'Year of Excellence' },
];

// ---- Quick service categories ----
export const QUICK_SERVICES = [
  { id: 'q1', label: 'Mobile Repair' },
  { id: 'q2', label: 'Laptop Repair' },
  { id: 'q3', label: 'Accessories' },
  { id: 'q4', label: 'Sell Device' },
];

// ---- FAQs — grouped by category, tap to expand ----
export const FAQ_CATEGORIES = ['Sell Smart', 'Smart Buy', 'Repair / Others'];

export const FAQS = [
  {
    id: 'f1',
    category: 'Sell Smart',
    question: 'How do I get a quote for my device?',
    answer:
      'Tell us your device brand, model and condition — you\'ll get an instant estimated price before you commit to anything.',
  },
  {
    id: 'f2',
    category: 'Sell Smart',
    question: 'When do I get paid after selling?',
    answer: 'Payment is released as soon as our team inspects and confirms the device matches what was listed.',
  },
  {
    id: 'f3',
    category: 'Smart Buy',
    question: 'Are refurbished devices covered by warranty?',
    answer: 'Yes — every refurbished device we sell includes a warranty, with the exact duration shown on its listing.',
  },
  {
    id: 'f4',
    category: 'Smart Buy',
    question: 'Can I return a device after buying it?',
    answer: 'Returns are accepted within the window shown at checkout, as long as the device is in the condition you received it.',
  },
  {
    id: 'f5',
    category: 'Repair / Others',
    question: 'How long does a typical repair take?',
    answer: 'Most common repairs — screens, batteries, charging ports — are completed same day. More complex jobs may take longer.',
  },
  {
    id: 'f6',
    category: 'Repair / Others',
    question: 'Do you offer pickup and drop-off?',
    answer: 'Yes, pickup and drop-off is available in select areas — you can request it when booking a repair.',
  },
];

// ---- Ratings / testimonials — the slider with dots ----
export const REVIEWS = [
  {
    id: 'r1',
    name: 'Daniel Wilson',
    photo: photo('cti-review-1'),
    text: 'The approval process was quick and easy, requiring minimal documentation. The team was professional, supportive, and made the entire experience smooth and stress-free.',
    date: '2/20/2021',
  },
  {
    id: 'r2',
    name: 'Sara Ahmed',
    photo: photo('cti-review-2'),
    text: 'My screen repair was done same day and the price was exactly what I was quoted upfront. Really honest service, would come back again.',
    date: '3/11/2021',
  },
  {
    id: 'r3',
    name: 'Omar Farooq',
    photo: photo('cti-review-3'),
    text: 'Sold my old phone through the app — the pickup was on time and payment landed right after inspection. Much easier than I expected.',
    date: '4/2/2021',
  },
];

// ---- Products — same card shape used for Top Products and Sponsored Products ----
const SAMPLE_PRODUCT = {
  name: 'Reebok Workout Ready',
  description: 'Experience flagship-level performance with the Vivo V40 5G featuring a stunnin...',
  rating: 4.0,
  ratingCount: 1,
  price: 990.0,
  image: photo('cti-product'),
};

export const TOP_PRODUCTS = Array.from({ length: 5 }).map((_, index) => ({
  id: `tp${index + 1}`,
  ...SAMPLE_PRODUCT,
  image: photo(`cti-top-product-${index + 1}`),
}));

export const SPONSORED_PRODUCTS = Array.from({ length: 5 }).map((_, index) => ({
  id: `sp${index + 1}`,
  ...SAMPLE_PRODUCT,
  image: photo(`cti-sponsored-product-${index + 1}`),
}));

// ---- Best Rated Stores ----
const SAMPLE_STORE = {
  name: 'Business name',
  tagline: 'Best deal everyday',
  description: 'Store description store description store description store description.',
  address: 'This is my address, this is my address, this is my address...',
};

export const STORES = Array.from({ length: 4 }).map((_, index) => ({
  id: `st${index + 1}`,
  ...SAMPLE_STORE,
  image: photo(`cti-store-${index + 1}`),
}));
