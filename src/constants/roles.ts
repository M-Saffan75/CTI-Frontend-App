/**
 * The three roles the app serves. Each role has its own auth screens and its own
 * navigator under src/roles/ — nothing here is used to branch UI at runtime.
 *
 * These values are what the backend expects in the `role` field. Each role's
 * authApi.ts hardcodes its own constant into the request payload.
 */
export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  REPAIRMAN: 'repairman',
};

export const ROLE_LIST = [ROLES.CUSTOMER, ROLES.SELLER, ROLES.REPAIRMAN];
