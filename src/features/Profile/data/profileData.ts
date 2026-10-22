export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  imageUri?: string;
}

export interface CatalogServiceItem {
  id: string;
  title: string;
  description: string;
  price: string;
  basePrice: string;
  partsPrice: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Approved' | 'Rejected';
  category: string;
  customerName: string;
  device: string;
  location: string;
  date: string;
}

export interface ProfileData {
  name: string;
  role: string;
  avatarUri?: string;
  coverUri?: string;
  city: string;
  experienceYears: string;
  jobsCompleted: number;
  rating: string;
  aboutMe: string;
  specialization: string[];
  workingHours: string;
  workingDays: string[];
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  zipCode: string;
  emergencyPerson: string;
  emergencyPhone: string;
  pickupServiceAvailable: boolean;
  memberSince: string;
  lastUpdate: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  bankDetailsCompleted: boolean;
  education: EducationItem[];
  experience: ExperienceItem[];
  certificates: CertificateItem[];
}

export const INITIAL_PROFILE_DATA: ProfileData = {
  name: 'Zubair Malik',
  role: 'Seller',
  city: 'City Not Set',
  experienceYears: '2 Years Experience',
  jobsCompleted: 0,
  rating: 'No rating',
  aboutMe: 'Elevate your lifestyle with a device that defines modern minimalism.',
  specialization: ['Mobile phone repair'],
  workingHours: '09:00 AM - 21:00 PM',
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  phone: '05267836521',
  email: 'Malikzubairnirban@gmail.com',
  whatsapp: '05267836521',
  address: 'Tribicx unit no 8 latifabad',
  zipCode: '34710',
  emergencyPerson: 'ahmed mustafa',
  emergencyPhone: '05267836521',
  pickupServiceAvailable: true,
  memberSince: 'June 2026',
  lastUpdate: '7/4/2024',
  emailVerified: true,
  profileCompleted: true,
  bankDetailsCompleted: false,
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelors in Software Engineering',
      institution: 'University of Karachi',
      startYear: '2018',
      endYear: '2022',
      description: 'I successfully completed my degree in Software Engineering',
    },
    {
      id: 'edu-2',
      degree: 'Bachelors in Software Engineering',
      institution: 'University of Karachi',
      startYear: '2018',
      endYear: '2022',
      description: 'I successfully completed my degree in Software Engineering',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      title: 'Mobile Repair Specialist',
      company: 'Click To Integrate',
      startYear: '2024',
      endYear: '2025',
      description: 'I am working as a mobile repair specialist at Click To Integrate since 2024',
    },
  ],
  certificates: [
    {
      id: 'cert-1',
      title: 'B.A Diploma',
      imageUri: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    },
  ],
};

export const INITIAL_CATALOG_SERVICES: CatalogServiceItem[] = [
  {
    id: 'srv-1',
    title: 'iPhone 14 Pro Screen Repair',
    description: 'Cracked screen replacement with original quality display',
    price: '$299',
    basePrice: '$199',
    partsPrice: '$100',
    status: 'Pending',
    category: 'Repair Service',
    customerName: 'John Doe',
    device: 'Apple iPhone 14 pro',
    location: 'New York',
    date: '30 Jun, 2026',
  },
  {
    id: 'srv-2',
    title: 'Samsung Galaxy S23 Battery',
    description: 'Battery draining issue, need original battery replacement',
    price: '$89',
    basePrice: '$49',
    partsPrice: '$40',
    status: 'In Progress',
    category: 'Battery Service',
    customerName: 'Jane Smith',
    device: 'Samsung Galaxy S23',
    location: 'Los Angeles',
    date: '01 Jul, 2026',
  },
  {
    id: 'srv-3',
    title: 'Google Pixel 7 Water Damage Repair',
    description: 'Phone dropped in water, need complete cleaning and repair',
    price: '$149',
    basePrice: '$99',
    partsPrice: '$50',
    status: 'Completed',
    category: 'Repair Service',
    customerName: 'Mike Johnson',
    device: 'Google Pixel 7',
    location: 'Chicago',
    date: '02 Jul, 2026',
  },
  {
    id: 'srv-4',
    title: 'OnePlus 11 Charging Port Repair',
    description: 'Charging port not working, need replacement',
    price: '$69',
    basePrice: '$39',
    partsPrice: '$30',
    status: 'Pending',
    category: 'Repair Service',
    customerName: 'Sarah Wilson',
    device: 'OnePlus 11',
    location: 'Houston',
    date: '03 Jul, 2026',
  },
  {
    id: 'srv-5',
    title: 'Xiaomi Mi 11 Software Update',
    description: 'Software issues after latest update, need downgrade',
    price: '$49',
    basePrice: '$29',
    partsPrice: '$0',
    status: 'In Progress',
    category: 'Repair Service',
    customerName: 'Alex Chen',
    device: 'Xiaomi Mi 11',
    location: 'San Francisco',
    date: '04 Jul, 2026',
  },
  {
    id: 'srv-6',
    title: 'iPhone 13 Camera Repair',
    description: 'SCamera lens broken, need replacement',
    price: '$159',
    basePrice: '$99',
    partsPrice: '$60',
    status: 'Completed',
    category: 'Repair Service',
    customerName: 'Emily Brown',
    device: 'Apple iPhone 13',
    location: 'Miami',
    date: '05 Jul, 2026',
  },
  {
    id: 'srv-7',
    title: 'Samsung Galaxy Z Fold 4 Screen',
    description: 'Inner screen cracked, need expensive replacement',
    price: '$599',
    basePrice: '$499',
    partsPrice: '$100',
    status: 'Pending',
    category: 'Screen Service',
    customerName: 'David Miller',
    device: 'Samsung Galaxy Z Fold 4',
    location: 'Seattle',
    date: '06 Jul, 2026',
  },
  {
    id: 'srv-8',
    title: 'iPad Pro Screen Repair',
    description: 'Screen cracked after drop, need replacement',
    price: '$399',
    basePrice: '$299',
    partsPrice: '$100',
    status: 'Pending',
    category: 'Screen Service',
    customerName: 'Lisa Anderson',
    device: 'Apple iPad Pro',
    location: 'Boston',
    date: '07 Jul, 2026',
  },
];
