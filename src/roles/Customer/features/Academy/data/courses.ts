/**
 * Demo course data. When the API arrives, replace this file with the fetch and
 * keep the same shape — the screens read these fields and nothing else.
 */

const thumbnail = seed => `https://picsum.photos/seed/${seed}/600/400`;

// The big coloured cards at the top of the Academy screen.
export const FEATURED_CATEGORIES = [
  { id: 'ux', label: 'UI/UX Design', gradient: 'purple' },
  { id: 'data', label: 'Data Science', gradient: 'teal' },
  { id: 'cloud', label: 'Cloud Computing', gradient: 'blue' },
];

// The pills used to filter the course list.
export const CATEGORIES = [
  'React J.s',
  'Python',
  'Sql',
  'Git & Github',
  'Figma',
  'Photoshop',
  'Node.J.S',
  'Type Script',
];

const DEMO_DESCRIPTION = 'Manage and organize your data with ease.';

const DEMO_ABOUT =
  'Find the perfect laptop from trusted brands with powerful performance, modern features, long-lasting battery life, fast storage, and stunning displays—ideal for work, study, gaming, content creation, and everyday use, all at exceptional value to suit every budget and lifestyle.';

const course = (id, category, views) => ({
  id,
  category,
  title: 'Asdsdws',
  description: DEMO_DESCRIPTION,
  about: DEMO_ABOUT,
  views,
  thumbnail: thumbnail(`cti-course-${id}`),
});

export const COURSES = [
  course('c1', 'React J.s', 340),
  course('c2', 'React J.s', 88),
  course('c3', 'React J.s', 21),

  course('c4', 'Python', 512),
  course('c5', 'Python', 76),
  course('c6', 'Python', 12),

  course('c7', 'Sql', 44),
  course('c8', 'Sql', 205),

  course('c9', 'Git & Github', 91),
  course('c10', 'Git & Github', 17),

  course('c11', 'Figma', 130),
  course('c12', 'Figma', 48),

  course('c13', 'Photoshop', 26),
  course('c14', 'Node.J.S', 64),
  course('c15', 'Node.J.S', 3),
  course('c16', 'Type Script', 158),
  course('c17', 'Type Script', 0),
];
