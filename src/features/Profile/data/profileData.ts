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

export interface ProfileData {
  name: string;
  role: string;
  avatarUri?: string;
  coverUri?: string;
  country?: string;
  countryId?: string;
  state?: string;
  stateId?: string;
  city: string;
  cityId?: string;
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
  status?: string;
  disputeStats?: {
    totalDisputes: number;
    disputesWon: number;
    disputesLost: number;
    warningCount: number;
  };
}

export const EMPTY_PROFILE_DATA: ProfileData = {
  name: '',
  role: '',
  city: '',
  experienceYears: '',
  jobsCompleted: 0,
  rating: '',
  aboutMe: '',
  specialization: [],
  workingHours: '',
  workingDays: [],
  phone: '',
  email: '',
  whatsapp: '',
  address: '',
  zipCode: '',
  emergencyPerson: '',
  emergencyPhone: '',
  pickupServiceAvailable: false,
  memberSince: '',
  lastUpdate: '',
  emailVerified: false,
  profileCompleted: false,
  bankDetailsCompleted: false,
  education: [],
  experience: [],
  certificates: [],
};
