/**
 * Demo chat data. When the API arrives, replace this file with the fetch
 * and keep the same shape — the screens read these fields and nothing else.
 */

const photo = seed => `https://picsum.photos/seed/${seed}/200/200`;

// `date` groups messages under a separator, WhatsApp style. The screen only
// prints a separator when the date changes from the previous message.
const SAMPLE_MESSAGES = [
  { id: 'm1', fromMe: false, text: 'Hi, is this still available?', date: '29 June 2026', time: '18:42' },
  {
    id: 'm2',
    fromMe: true,
    text: 'Yes it is! I can start on it today if you like.',
    date: '29 June 2026',
    time: '18:47',
  },
  {
    id: 'm3',
    fromMe: false,
    text: 'Great, can you ship it to Karachi once it’s done?',
    date: '30 June 2026',
    time: '19:09',
  },
  {
    id: 'm4',
    fromMe: true,
    text: 'Sure, drop-off and delivery both work for this one.',
    date: '30 June 2026',
    time: '19:12',
  },
];

export const CHATS = [
  {
    id: 'c1',
    name: 'Ayesha Khan',
    avatar: photo('cti-chat-1'),
    online: true,
    lastMessage: 'Is this still available?',
    time: '19:12 AM',
    unread: 2,
    queryId: 'QRY-000001',
    messages: SAMPLE_MESSAGES,
  },
  {
    id: 'c2',
    name: 'Sana Malik',
    avatar: photo('cti-chat-2'),
    online: true,
    lastMessage: 'Can you ship it to Karachi?',
    time: '19:12 AM',
    unread: 2,
    queryId: 'QRY-000002',
    messages: SAMPLE_MESSAGES,
  },
  {
    id: 'c3',
    name: 'Bilal Ahmed',
    avatar: photo('cti-chat-3'),
    online: false,
    lastMessage: 'Thanks, see you tomorrow then.',
    time: 'Yesterday',
    unread: 0,
    queryId: 'QRY-000003',
    messages: SAMPLE_MESSAGES,
  },
  {
    id: 'c4',
    name: 'Hira Zafar',
    avatar: photo('cti-chat-4'),
    online: false,
    lastMessage: 'Perfect, that works for me.',
    time: 'Yesterday',
    unread: 0,
    queryId: 'QRY-000004',
    messages: SAMPLE_MESSAGES,
  },
  {
    id: 'c5',
    name: 'Usman Tariq',
    avatar: photo('cti-chat-5'),
    online: true,
    lastMessage: 'How much for a screen replacement?',
    time: '2 days ago',
    unread: 1,
    queryId: 'QRY-000005',
    messages: SAMPLE_MESSAGES,
  },
];

export const getChatById = id => CHATS.find(chat => chat.id === id);
