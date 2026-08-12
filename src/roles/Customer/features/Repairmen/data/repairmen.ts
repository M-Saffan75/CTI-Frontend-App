/**
 * Demo repairman data. When the API arrives, replace this file with the
 * fetch and keep the same shape — the screens read these fields and nothing
 * else. Used by both the Expert Repairmen list and the Home screen slider,
 * so it only needs updating in one place.
 */

const photo = seed => `https://picsum.photos/seed/${seed}/400/400`;

const SAMPLE_REPAIRMAN = {
  name: 'Hammad',
  role: 'Mobile Repair Service',
  location: 'Kadıköy İstanbul',
  shortLocation: 'Latifabad',
  experience: '10+ Years',
  rating: 4.8,
  description:
    'Specializes in mobile and laptop repairs, supporting customers with fast, reliable fixes and honest pricing every time.',
  // Demo links — swap for the repairman's real profiles once accounts exist.
  social: {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
  },
};

export const REPAIRMEN = Array.from({ length: 7 }).map((_, index) => ({
  id: `rm${index + 1}`,
  photo: photo(`cti-repairman-${index + 1}`),
  ...SAMPLE_REPAIRMAN,
}));
