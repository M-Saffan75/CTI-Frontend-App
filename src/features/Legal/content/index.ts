import { privacyPolicy as enPrivacy } from './en/privacyPolicy';
import { termsAndConditions as enTerms } from './en/termsAndConditions';
import { privacyPolicy as trPrivacy } from './tr/privacyPolicy';
import { termsAndConditions as trTerms } from './tr/termsAndConditions';

// A translator replaces the body of content/tr/*.ts (same shape as content/en/*.ts). Nothing else changes.
export const getTerms = (language: string): typeof enTerms => (language === 'tr' ? trTerms : enTerms);
export const getPrivacy = (language: string): typeof enPrivacy => (language === 'tr' ? trPrivacy : enPrivacy);
