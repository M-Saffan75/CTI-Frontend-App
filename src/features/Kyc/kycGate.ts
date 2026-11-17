import { ROLES } from '@/constants/roles';
import { AuthUser } from '@/services/authService';

export type KycStatusType = 'incomplete' | 'pending' | 'revision' | 'rejected' | 'approved';

// The status the app acts on. A repairman whose profile the backend marks incomplete cannot use the
// app (GET /repairman/profile answers 404), so that user goes to the status screen like an incomplete KYC.
export function effectiveKycStatus(role: string | null | undefined, user: AuthUser | null | undefined): KycStatusType {
  const raw = (user?.kycStatus || (user?.isKycCompleted ? 'pending' : 'incomplete')) as KycStatusType;
  if (raw === 'approved' && role === ROLES.REPAIRMAN && user?.isProfileComplete === false) {
    return 'incomplete';
  }
  return raw;
}

// Customers have no KYC. Sellers and repairmen need an approved account.
export function canUseApp(role: string | null | undefined, user: AuthUser | null | undefined): boolean {
  return role === ROLES.CUSTOMER || effectiveKycStatus(role, user) === 'approved';
}
