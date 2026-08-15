/**
 * Demo earnings data. When the API arrives, replace this file with the
 * fetch and keep the same shape — the screen reads these fields and nothing
 * else.
 */

// Flip this once the Banking Information form has been saved.
export const BANK_DETAILS_COMPLETE = false;

export const BALANCE = {
  available: 0,
  released: 0,
  pendingRelease: 978,
  totalWithdrawn: 0,
};

export const WITHDRAW_STATS = {
  requested: { count: 0, amount: 0 },
  processing: { count: 0, amount: 0 },
  completed: { count: 0, amount: 0 },
  rejected: { count: 0, amount: 0 },
};

export const WITHDRAW_HISTORY = [];

export const QUICK_TOPUP_AMOUNTS = [100, 500, 1000];
