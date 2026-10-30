import { demoProductPhoto } from '@/assets/images';

export interface RefurbishedProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewsCount: number;
  inStockCount: number;
  isVerified: boolean;
  tag: string;
  saveAmount: number;
  subtitle: string;
  description: string;
  image: any;
  gallery: any[];
  sku: string;
  totalVariants: number;
  condition: 'Refurbished' | 'Like New' | 'Good';
  grade: 'Superb' | 'Good' | 'Fair' | 'Best Value';
  specs: {
    buildAndMaterials: string;
    displayAndVisuals: string;
    performance: string;
    cameraSystem: string;
    batteryAndConnectivity: string;
  };
  rawId?: string;
  slug?: string;
  isRefurbished?: boolean;
  defaultVariantId?: string;
  variants?: any[];
  raw?: any;
}

export const REFURBISHED_CATEGORIES = [
  { id: 'all', name: 'All Types' },
  { id: 'phone', name: 'Sell Phone', figmaName: 'Sell Phone' },
  { id: 'laptop', name: 'Laptop', figmaName: 'Labtop' },
  { id: 'speaker', name: 'Speaker', figmaName: 'Speaker' },
  { id: 'gaming', name: 'Gaming Console', figmaName: 'Gaming Console' },
  { id: 'camera', name: 'Cameras & Lenses', figmaName: 'Cameras & Lenses' },
  { id: 'watch', name: 'Smart watches', figmaName: 'Smart watches' },
  { id: 'tablet', name: 'Tablets', figmaName: 'Tablets' },
  { id: 'earbuds', name: 'Earbuds', figmaName: 'Earbuds' },
  { id: 'ac', name: 'Air Conditioner (AC)', figmaName: 'Air Conditioner (AC)' },
];

export const REFURBISHED_BRANDS = [
  'Apple',
  'Hp',
  'Haier',
  'Audionic',
  'Samsung',
  'Huawei',
  'Canon',
  'Sony',
  'Sonos',
];

export const REFURBISHED_PRODUCTS: RefurbishedProduct[] = [
  {
    id: 'ref-1',
    name: 'Apple Iphone 15 pro',
    brand: 'Apple',
    category: 'Sell Phone',
    price: 1254,
    originalPrice: 1320,
    discountPercent: 12,
    rating: 5.0,
    reviewsCount: 42,
    inStockCount: 96,
    isVerified: true,
    tag: 'Refurbished',
    saveAmount: 427,
    subtitle: 'Experience crystal-clear sound and stunning performance with...',
    description:
      'Premium smartphone featuring high-performance processing, advanced multi-lens camera systems, and a vibrant display.',
    image: demoProductPhoto,
    gallery: [demoProductPhoto, demoProductPhoto, demoProductPhoto, demoProductPhoto],
    sku: 'REF-SEL-611-VI',
    totalVariants: 1,
    condition: 'Refurbished',
    grade: 'Superb',
    specs: {
      buildAndMaterials:
        'Crafted with high-grade aerospace-grade aluminum, stainless steel, or titanium frames for maximum structural strength. Front screen protected by ultra-tough Ceramic Shield or reinforced tempered glass.',
      displayAndVisuals:
        'Features a high-resolution Retina or AMOLED display delivering vivid colors, deep blacks, and smooth refresh rates for an immersive viewing experience.',
      performance:
        'Powered by an advanced multi-core processor and high-speed RAM, ensuring seamless multitasking, fast app switching, and lag-free mobile gaming.',
      cameraSystem:
        'Equipped with a multi-lens professional camera array (Main, Ultra-Wide, and Telephoto sensors) capable of high-definition video recording and sharp low-light photography.',
      batteryAndConnectivity:
        'Long-lasting lithium-ion battery with fast charging and wireless charging capabilities, alongside 5G and Wi-Fi connectivity.',
    },
  },
  {
    id: 'ref-2',
    name: 'Audionic Airbud Pro Wireless',
    brand: 'Audionic',
    category: 'Earbuds',
    price: 495,
    originalPrice: 550,
    discountPercent: 12,
    rating: 5.0,
    reviewsCount: 38,
    inStockCount: 45,
    isVerified: true,
    tag: 'Refurbished',
    saveAmount: 427,
    subtitle: 'Experience crystal-clear sound with active noise cancellation...',
    description:
      'Premium wireless earbuds offering deep bass, dual microphone ENC, fast wireless charging, and ergonomic comfort fit.',
    image: demoProductPhoto,
    gallery: [demoProductPhoto, demoProductPhoto, demoProductPhoto],
    sku: 'REF-AUD-992-EB',
    totalVariants: 2,
    condition: 'Refurbished',
    grade: 'Superb',
    specs: {
      buildAndMaterials:
        'Sweat & water-resistant IPX5 housing with silicone tips and magnetic charging case.',
      displayAndVisuals: 'LED battery indicator screen on front charging case.',
      performance: 'Custom dynamic audio drivers with dedicated ANC chip.',
      cameraSystem: 'Dual beamforming noise-isolating microphones.',
      batteryAndConnectivity: 'Up to 36 hours total playback with USB-C fast charging.',
    },
  },
  {
    id: 'ref-3',
    name: 'Samsung Galaxy Tab S9 Ultra',
    brand: 'Samsung',
    category: 'Tablets',
    price: 2327,
    originalPrice: 2530,
    discountPercent: 8,
    rating: 4.5,
    reviewsCount: 19,
    inStockCount: 15,
    isVerified: true,
    tag: 'Refurbished',
    saveAmount: 203,
    subtitle: 'Overview & Performance Powered by a high performance octa-core processor...',
    description:
      'Ultra-thin flagship tablet with dynamic AMOLED 2X display, S-Pen precision support, and PC-level multitasking.',
    image: demoProductPhoto,
    gallery: [demoProductPhoto, demoProductPhoto],
    sku: 'REF-SAM-883-TB',
    totalVariants: 3,
    condition: 'Refurbished',
    grade: 'Good',
    specs: {
      buildAndMaterials: 'Armor aluminum casing with IP68 water and dust resistance.',
      displayAndVisuals: '14.6-inch Dynamic AMOLED 2X, 120Hz refresh rate, HDR10+ support.',
      performance: 'Snapdragon 8 Gen 2 for Galaxy with 12GB RAM and vapour chamber cooling.',
      cameraSystem: '13MP Main + 8MP Ultra-wide rear, 12MP dual front cameras.',
      batteryAndConnectivity: '11,200 mAh massive battery with 45W fast charging and 5G.',
    },
  },
  {
    id: 'ref-4',
    name: 'HP Pavilion 15 Gaming Laptop',
    brand: 'Hp',
    category: 'Laptop',
    price: 495,
    originalPrice: 550,
    discountPercent: 12,
    rating: 5.0,
    reviewsCount: 29,
    inStockCount: 28,
    isVerified: true,
    tag: 'Refurbished',
    saveAmount: 427,
    subtitle: 'Experience crystal-clear display and high speed performance...',
    description:
      'Certified refurbished Windows laptop with Intel Core processor, NVIDIA GeForce graphics, and high-speed NVMe SSD.',
    image: demoProductPhoto,
    gallery: [demoProductPhoto, demoProductPhoto],
    sku: 'REF-HP-301-LP',
    totalVariants: 2,
    condition: 'Refurbished',
    grade: 'Superb',
    specs: {
      buildAndMaterials: 'Shadow black chassis with acid green or ghost silver accents.',
      displayAndVisuals: '15.6-inch Full HD micro-edge anti-glare display with IPS panel.',
      performance: 'Intel Core i7 12th Gen, 16GB DDR4 RAM, 512GB PCIe NVMe SSD.',
      cameraSystem: 'HP Wide Vision 720p HD camera with dual array microphones.',
      batteryAndConnectivity: 'Up to 7 hours battery life with HP Fast Charge, Wi-Fi 6.',
    },
  },
  {
    id: 'ref-5',
    name: 'Huawei Watch GT Active Edition',
    brand: 'Huawei',
    category: 'Smart watches',
    price: 2090,
    originalPrice: 2250,
    discountPercent: 7,
    rating: 4.5,
    reviewsCount: 31,
    inStockCount: 52,
    isVerified: true,
    tag: 'Refurbished',
    saveAmount: 160,
    subtitle: 'Build & Materials Crafted with high grade aerospace grade aluminum...',
    description:
      'Rugged smartwatch featuring continuous SpO2 monitoring, scientific sleep tracking, and up to 14 days of battery life.',
    image: demoProductPhoto,
    gallery: [demoProductPhoto, demoProductPhoto],
    sku: 'REF-HUA-552-WT',
    totalVariants: 1,
    condition: 'Refurbished',
    grade: 'Good',
    specs: {
      buildAndMaterials: 'Stainless steel frame with durable fluoroelastomer strap.',
      displayAndVisuals: '1.43-inch AMOLED high-contrast touch screen with sapphire glass.',
      performance: 'TruSeen 5.0+ heart rate monitoring and dual-band GPS.',
      cameraSystem: 'Remote camera shutter trigger for paired mobile device.',
      batteryAndConnectivity: '14-day battery life on typical use with wireless magnetic charging.',
    },
  },
  {
    id: 'ref-6',
    name: 'Sony PlayStation 5 & Essentials Bundle',
    brand: 'Sony',
    category: 'Gaming Console',
    price: 495,
    originalPrice: 550,
    discountPercent: 12,
    rating: 5.0,
    reviewsCount: 65,
    inStockCount: 14,
    isVerified: true,
    tag: 'Refurbished',
    saveAmount: 427,
    subtitle: 'Experience crystal-clear sound and immersive next-gen gaming...',
    description:
      'Certified refurbished gaming console bundle with DualSense wireless controller, ultra-high speed SSD, and 4K ray tracing.',
    image: demoProductPhoto,
    gallery: [demoProductPhoto, demoProductPhoto],
    sku: 'REF-SNY-702-PS',
    totalVariants: 1,
    condition: 'Refurbished',
    grade: 'Superb',
    specs: {
      buildAndMaterials: 'Custom architectural casing with dynamic liquid metal cooling.',
      displayAndVisuals: 'Up to 120fps with 120Hz output, 4K-TV gaming and 8K support.',
      performance: 'Custom 8-core AMD Zen 2 CPU, RDNA 2 GPU with 10.28 TFLOPs.',
      cameraSystem: 'Compatible with PS5 HD Camera with dual wide-angle lenses.',
      batteryAndConnectivity: 'Wi-Fi 6, Gigabit Ethernet, Bluetooth 5.1 and USB 3.2.',
    },
  },
];

export const GRADE_EXPLANATIONS = {
  Superb: {
    title: 'Superb',
    overall: 'No functional defects',
    screenGlass: 'Minimal scratches only visible when the screen is off.',
    display: 'Bright sharp panel with no dead pixels or burn-in.',
    body: 'Light cosmetic wear only, with clean edges and camera housing.',
  },
  Good: {
    title: 'Good',
    overall: 'Fully functional, thoroughly tested',
    screenGlass: 'Slight micro-scratches that disappear when screen is powered on.',
    display: 'Flawless vibrant panel with accurate touch response.',
    body: 'Minor shallow scuffs on bezel or back glass, no deep cracks or dents.',
  },
  Fair: {
    title: 'Fair',
    overall: '100% operational hardware at best price',
    screenGlass: 'Moderate surface scratches, touch digitizer fully responsive.',
    display: 'Normal brightness, no lines or screen bleeding.',
    body: 'Visible cosmetic wear on edges or casing, casing structural integrity intact.',
  },
  'Best Value': {
    title: 'Best Value',
    overall: 'Maximum savings with complete certification',
    screenGlass: 'Visible hairline scratches, zero cracks or chipping.',
    display: 'Crisp display, fully tested touch accuracy across all points.',
    body: 'Noticeable signs of handling, backed by full CTI 1-year warranty.',
  },
};

export const REFURBISHED_TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Akshy Rao',
    feedback:
      'I was not sure before buying a used phone online. But I took the chance as they have return policy and verified certification. The iPhone condition was genuinely superb!',
  },
  {
    id: 't-2',
    name: 'Sophie Turner',
    feedback:
      'Great platform with clear product details and fair pricing. The buying experience felt simple and trustworthy. Delivery was fast and doorstep pickup was seamless.',
  },
  {
    id: 't-3',
    name: 'James Walker',
    feedback:
      'The whole process was smooth and easy. I found the right device quickly, and everything was exactly as described. Battery health was 98% on my refurbished laptop!',
  },
];

export const WHY_SELL_WITH_US = [
  {
    id: 'w-1',
    title: 'Best Prices',
    description: 'Objective AI-based pricing engine ensuring top market value.',
    iconType: 'tag',
  },
  {
    id: 'w-2',
    title: 'Instant Payment',
    description: 'Instant Money Transfer in your preferred mode at time of pick up or store drop off.',
    iconType: 'card',
  },
  {
    id: 'w-3',
    title: 'Simple & Convenient',
    description: 'Check price, schedule pickup & get paid in under 24 hours.',
    iconType: 'sparkle',
  },
  {
    id: 'w-4',
    title: 'Free Doorstep Pickup',
    description: 'No fees for pickup across 1500+ cities with verified field agents.',
    iconType: 'truck',
  },
  {
    id: 'w-5',
    title: 'Factory Grade Data Wipe',
    description: '100% Safe and Data Security Guaranteed with automated wipe certificates.',
    iconType: 'shield',
  },
  {
    id: 'w-6',
    title: 'Valid Purchase Invoice',
    description: 'Genuine Bill of Sale and electronic invoice generated on spot.',
    iconType: 'invoice',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    title: '1. Check Price',
    description:
      'Tell us your device brand, model, and physical condition. Our system calculates maximum value instantly.',
  },
  {
    step: '2',
    title: '2. Schedule Pickup',
    description:
      'Book a free pickup from your home or work at a time slot that best suits your convenience.',
  },
  {
    step: '3',
    title: '3. Get Paid',
    description:
      'Receive your payment instantly as soon as our agent inspects your device right at your doorstep.',
  },
];

export const SELLER_DEVICE_MODELS: Record<string, string[]> = {
  Apple: [
    '15 pro max',
    '15 pro',
    '14 pro max',
    '14 pro',
    '13 pro max',
    '13 pro',
    '12 pro max',
    '12 pro',
    'iPhone 11',
    'iPhone XR',
  ],
  Samsung: [
    'Galaxy S24 Ultra',
    'Galaxy S23 Ultra',
    'Galaxy S22 Ultra',
    'Galaxy Z Fold 5',
    'Galaxy Z Flip 5',
    'Galaxy Tab S9',
  ],
  Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7a', 'Pixel 6 Pro'],
  Xiaomi: ['13 Pro', '12 Pro', 'Redmi Note 13 Pro', 'Redmi Note 12'],
  OnePlus: ['OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus Nord 3'],
};

export const STORAGE_VARIANTS = ['128 GB', '256 GB', '512 GB', '1 TB'];

export interface ConditionQuestion {
  id: number;
  question: string;
  options: {
    id: string;
    label: string;
    description?: string;
  }[];
}

export const CONDITION_QUESTIONS: ConditionQuestion[] = [
  {
    id: 1,
    question: 'What is the Screen Condition',
    options: [
      { id: 'opt-1', label: 'Flawless', description: 'Zero scratches, dents, or marks' },
      { id: 'opt-2', label: 'Good / Minor Scratches', description: 'Minor scratches visible only in bright light' },
      { id: 'opt-3', label: 'Cracked or Broken', description: 'Noticeable screen glass damage or cracks' },
    ],
  },
  {
    id: 2,
    question: "Is your device's touch screen working properly?",
    options: [
      { id: 'opt-4', label: 'Yes', description: 'Smooth, responsive, zero dead areas' },
      { id: 'opt-5', label: 'No', description: 'Has touch lag, ghost touch, or unresponsive zones' },
    ],
  },
  {
    id: 3,
    question: "Is your phone's screen original?",
    options: [
      { id: 'opt-6', label: 'Yes', description: 'Original factory installed display' },
      { id: 'opt-7', label: 'No', description: 'Screen was previously replaced' },
    ],
  },
  {
    id: 4,
    question: 'Body & Housing Physical Condition',
    options: [
      { id: 'opt-8', label: 'Clean & Pristine', description: 'No dents, scratches or discolouration' },
      { id: 'opt-9', label: 'Light Scuffs', description: 'Normal everyday wear around charging port' },
      { id: 'opt-10', label: 'Bent or Dented', description: 'Casing has noticeable drop impacts' },
    ],
  },
];
