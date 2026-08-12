/**
 * Demo blog data. When the API arrives, replace this file with the fetch and
 * keep the same shape — the screens read these fields and nothing else.
 */

// Every demo article shares one body so this file stays readable.
const DEMO_BODY = {
  readTime: '8min read',
  intro:
    'Smartphones, tablets, and other electronic devices are essential in our daily lives, but they can sometimes develop issues like battery drain, screen damage, or software glitches. Understanding common problems and how to handle them can save time, prevent further damage, and even reduce repair costs. This guide covers the most frequent issues, troubleshooting steps, and maintenance tips.',
  sections: [
    {
      title: 'Battery Drain and Charging Issues',
      text: 'Fast battery drain or charging problems are common.',
      bullets: [
        'Reduce screen brightness and turn on battery saver mode',
        'Close unused apps running in the background',
        "Update your device's software regularly",
        'Use original or certified chargers',
      ],
    },
    {
      title: 'Slow Device Performance',
      text: 'Fast battery drain or charging problems are common.',
      bullets: [
        'Devices can become slow due to storage issues, too many apps, or outdated software.',
        'Delete unnecessary apps and files',
        'Clear app cache regularly',
        'Restart your device periodically',
        'Update apps and system software',
      ],
    },
    {
      title: 'Screen Problems',
      text: 'Touchscreens may become unresponsive or flicker due to damage or software issues.',
      bullets: [
        'Clean the screen with a microfiber cloth',
        'Remove damaged screen protectors',
        'Restart the device',
        'Professional screen repair if the problem persists',
      ],
    },
  ],
  conclusion:
    'Proper care and timely troubleshooting can prevent most common device problems. Regular maintenance and professional repair when necessary will keep your devices running efficiently and extend their lifespan.',
};

const image = seed => `https://picsum.photos/seed/${seed}/600/400`;

export const BLOG_SECTIONS = [
  {
    label: 'Trending Articles',
    posts: [
      {
        id: 't1',
        title: 'Problems & Fixes',
        description: 'Explore common smartphone issues...',
        date: '7 Mar 2026',
        image: image('cti-t1'),
        ...DEMO_BODY,
      },
      {
        id: 't2',
        title: 'Problems & Fixes',
        description: 'Explore common smartphone issues...',
        date: '7 Mar 2026',
        image: image('cti-t2'),
        ...DEMO_BODY,
      },
      {
        id: 't3',
        title: 'Problems & Fixes',
        description: 'Explore common smartphone issues...',
        date: '7 Mar 2026',
        image: image('cti-t3'),
        ...DEMO_BODY,
      },
      {
        id: 't4',
        title: 'Problems & Fixes',
        description: 'Explore common smartphone issues...',
        date: '7 Mar 2026',
        image: image('cti-t4'),
        ...DEMO_BODY,
      },
      {
        id: 't5',
        title: 'Problems & Fixes',
        description: 'Explore common smartphone issues...',
        date: '7 Mar 2026',
        image: image('cti-t5'),
        ...DEMO_BODY,
      },
      {
        id: 't6',
        title: 'Problems & Fixes',
        description: 'Explore common smartphone issues...',
        date: '7 Mar 2026',
        image: image('cti-t6'),
        ...DEMO_BODY,
      },
    ],
  },
  {
    label: 'Latest News',
    posts: [
      {
        id: 'n1',
        title: 'Apple iPhone 13 Mini Refurbished Deal  Limited',
        date: '7 Mar 2026',
        image: image('cti-n1'),
        ...DEMO_BODY,
      },
      {
        id: 'n2',
        title: 'Apple iPhone 13 Mini Refurbished Deal  Limited',
        date: '7 Mar 2026',
        image: image('cti-n2'),
        ...DEMO_BODY,
      },
      {
        id: 'n3',
        title: 'Apple iPhone 13 Mini Refurbished Deal  Limited',
        date: '7 Mar 2026',
        image: image('cti-n3'),
        ...DEMO_BODY,
      },
      {
        id: 'n4',
        title: 'Apple iPhone 13 Mini Refurbished Deal  Limited',
        date: '7 Mar 2026',
        image: image('cti-n4'),
        ...DEMO_BODY,
      },
    ],
  },
  {
    label: 'Blogs',
    posts: [
      {
        id: 'b1',
        title: 'Smartphone Problems & Fixes',
        description: 'Discover common issues like battery drain and slow performance...',
        date: '7 Mar 2026',
        image: image('cti-b1'),
        ...DEMO_BODY,
      },
      {
        id: 'b2',
        title: 'Smartphone Problems & Fixes',
        description: 'Discover common issues like battery drain and slow performance...',
        date: '7 Mar 2026',
        image: image('cti-b2'),
        ...DEMO_BODY,
      },
      {
        id: 'b3',
        title: 'Smartphone Problems & Fixes',
        description: 'Discover common issues like battery drain and slow performance...',
        date: '7 Mar 2026',
        image: image('cti-b3'),
        ...DEMO_BODY,
      },
      {
        id: 'b4',
        title: 'Smartphone Problems & Fixes',
        description: 'Discover common issues like battery drain and slow performance...',
        date: '7 Mar 2026',
        image: image('cti-b4'),
        ...DEMO_BODY,
      },
      {
        id: 'b5',
        title: 'Smartphone Problems & Fixes',
        description: 'Discover common issues like battery drain and slow performance...',
        date: '7 Mar 2026',
        image: image('cti-b5'),
        ...DEMO_BODY,
      },
      {
        id: 'b6',
        title: 'Smartphone Problems & Fixes',
        description: 'Discover common issues like battery drain and slow performance...',
        date: '7 Mar 2026',
        image: image('cti-b6'),
        ...DEMO_BODY,
      },
    ],
  },
];
