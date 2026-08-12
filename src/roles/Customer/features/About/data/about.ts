const photo = seed => `https://picsum.photos/seed/${seed}/600/400`;

export const PROMISES = [
  {
    title: 'Fair Value',
    text: 'We guarantee the most competitive prices for your devices, ensuring you get fair market value.',
  },
  {
    title: 'Sustainability First',
    text: 'Every device refurbished saves 6 kg of CO2 emissions and prevents e-waste from landfills.',
  },
  {
    title: 'Quality Assured',
    text: 'Rigorous testing and certification ensure every device meets our premium quality standards.',
  },
  {
    title: 'Quick & Easy',
    text: 'Doorstep pickup, hassle-free selling, and instant payment in just 3 simple steps.',
  },
];

export const TIMELINE = [
  { year: '2019', title: 'The Beginning', text: 'Started our journey' },
  { year: '2020', title: 'Going Digital', text: 'Launched mobile app' },
  { year: '2021', title: 'Rapid Expansion', text: '5 Physical Stores' },
  { year: '2022', title: 'Industry Recognition', text: '1M+ Devices' },
  { year: '2023', title: 'Game Changer', text: 'AI Valuation Launch' },
  { year: '2024', title: 'The Future is now', text: '2M+ Active Users' },
];

export const PRINCIPLES = [
  {
    number: '01',
    title: 'Transparency',
    text: 'We believe in complete transparency. No hidden costs, no surprise charges. What you see is what you get.',
  },
  {
    number: '02',
    title: 'Responsibility',
    text: 'We take responsibility for every device. From collection to recycling, we ensure ethical handling.',
  },
  {
    number: '03',
    title: 'Innovation',
    text: 'Constantly innovating to find new ways to extend device lifespans and reduce environmental impact.',
  },
  {
    number: '04',
    title: 'Community',
    text: 'Building a community of conscious consumers who believe technology should be accessible and sustainable.',
  },
];

export const STATS = [
  {
    highlight: '909 liters of water',
    before: 'You save ',
    after: ' & save people from staying thirsty for 100 years',
    text: null,
    image: photo('cti-about-water-1'),
  },
  {
    highlight: '909 liters of water',
    before: 'You save ',
    after: ' & save people from staying thirsty for 100 years',
    text: 'Every phone reused prevents toxic waste from polluting our environment and conserves precious natural resources for future generations.',
    image: photo('cti-about-water-2'),
  },
  {
    highlight: '72 kWh of energy',
    before: 'You save ',
    after: ' & power homes for weeks',
    text: 'Every phone reused prevents toxic waste from polluting our environment and conserves precious natural resources for future generations.',
    image: photo('cti-about-energy'),
  },
];

export const TEAM = [
  { name: 'Danie Sami', role: 'Backend Developer', photo: photo('cti-team-1') },
  { name: 'Emaily', role: 'Product Manager', photo: photo('cti-team-2') },
  { name: 'Rohan Mehta', role: 'Frontend Developer', photo: photo('cti-team-3') },
  { name: 'Sara Khan', role: 'UI/UX Designer', photo: photo('cti-team-4') },
  { name: 'Omar Sheikh', role: 'QA Engineer', photo: photo('cti-team-5') },
  { name: 'Ayesha Noor', role: 'Support Lead', photo: photo('cti-team-6') },
];
