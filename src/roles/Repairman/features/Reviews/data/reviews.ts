/**
 * Demo review data. When the API arrives, replace this file with the fetch
 * and keep the same shape — the screen reads these fields and nothing else.
 */

const photo = seed => `https://picsum.photos/seed/${seed}/200/200`;

export const RATING_TOTAL = 12;

export const RATING_DISTRIBUTION = [
  { stars: 5, count: 8, percent: 67 },
  { stars: 4, count: 3, percent: 25 },
  { stars: 3, count: 1, percent: 8 },
  { stars: 2, count: 0, percent: 0 },
  { stars: 1, count: 0, percent: 0 },
];

export const REVIEWS = [
  {
    id: 'r1',
    name: 'Ali Khan',
    avatar: photo('cti-rm-review-1'),
    rating: 5,
    daysAgo: 2,
    service: 'Screen Repair',
    text: 'Excellent service! My iPhone screen was shattered and they fixed it in under 30 minutes. The quality of the new screen is perfect, colors are vibrant and touch is responsive. Highly recommend CTI for any mobile repairs.',
  },
  {
    id: 'r2',
    name: 'Sara Ahmed',
    avatar: photo('cti-rm-review-2'),
    rating: 5,
    daysAgo: 3,
    service: 'Battery Replacement',
    text: 'Quick turnaround and fair pricing. My phone battery was draining fast and now it easily lasts a full day. Very professional and honest about what needed replacing.',
  },
  {
    id: 'r3',
    name: 'Omar Farooq',
    avatar: photo('cti-rm-review-3'),
    rating: 4,
    daysAgo: 5,
    service: 'Motherboard Repair',
    text: 'Fixed a tricky motherboard issue that two other shops couldn’t diagnose. Took a bit longer than expected but the result was worth it.',
  },
  {
    id: 'r4',
    name: 'Hina Sheikh',
    avatar: photo('cti-rm-review-4'),
    rating: 5,
    daysAgo: 6,
    service: 'Screen Repair',
    text: 'Great communication throughout the repair. Sent photos before and after, and the pickup/drop-off service made it super convenient.',
  },
  {
    id: 'r5',
    name: 'Bilal Chaudhry',
    avatar: photo('cti-rm-review-5'),
    rating: 4,
    daysAgo: 7,
    service: 'Charging Port Repair',
    text: 'Charging port was loose and now clicks in perfectly. Reasonable price and done the same day.',
  },
  {
    id: 'r6',
    name: 'Ayesha Malik',
    avatar: photo('cti-rm-review-6'),
    rating: 5,
    daysAgo: 8,
    service: 'Water Damage',
    text: 'Thought my phone was completely dead after a water spill. They managed to recover it and all my data was safe.',
  },
  {
    id: 'r7',
    name: 'Usman Raza',
    avatar: photo('cti-rm-review-7'),
    rating: 5,
    daysAgo: 9,
    service: 'Screen Repair',
    text: 'Second time using this repairman, both times fast and reliable. Screen quality feels exactly like original.',
  },
  {
    id: 'r8',
    name: 'Zainab Qureshi',
    avatar: photo('cti-rm-review-8'),
    rating: 3,
    daysAgo: 10,
    service: 'Battery Replacement',
    text: 'Battery works fine now but took longer than the estimate given. Would still recommend for the quality of work.',
  },
  {
    id: 'r9',
    name: 'Tariq Iqbal',
    avatar: photo('cti-rm-review-9'),
    rating: 5,
    daysAgo: 11,
    service: 'Camera Repair',
    text: 'Camera module replaced and photos are sharp again. Very transparent about pricing before starting the work.',
  },
  {
    id: 'r10',
    name: 'Mahnoor Aslam',
    avatar: photo('cti-rm-review-10'),
    rating: 5,
    daysAgo: 12,
    service: 'Screen Repair',
    text: 'Booked a pickup, got the phone back same evening. Screen looks brand new, highly satisfied.',
  },
  {
    id: 'r11',
    name: 'Faisal Anwar',
    avatar: photo('cti-rm-review-11'),
    rating: 4,
    daysAgo: 13,
    service: 'Speaker Repair',
    text: 'Speaker was crackling before, sounds clear now. Fair price for the part replaced.',
  },
  {
    id: 'r12',
    name: 'Nida Baig',
    avatar: photo('cti-rm-review-12'),
    rating: 5,
    daysAgo: 14,
    service: 'Motherboard Repair',
    text: 'Diagnosed a short circuit issue quickly that I was told elsewhere would need a full replacement. Saved me a lot of money.',
  },
];
