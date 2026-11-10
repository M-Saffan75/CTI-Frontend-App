# Checklist: Customer Phase 2 cleanup (2026-11-10)

Status words: done = code exists and tsc/eslint pass. "needs device test" = not tested on a phone.

- [x] 1. Customer dispute: "Report a Problem" in RepairDetailScreen (Booking tab) (needs device test)
  - [x] 1.1 Shown for active booking statuses (confirmed to delivered), hidden when a dispute exists. (`RepairDetailScreen.tsx`)
  - [x] 1.2 Opens shared `CreateDisputeModal` (`role="customer"`), submits with `customerJobApi.createDispute`. (`RepairDetailScreen.tsx`)
  - [x] 1.3 Themed AlertModal shows the backend message or error, then opens `DisputeDetailScreen` with the new dispute id. (`RepairDetailScreen.tsx`)
  - [ ] 1.4 Photo evidence: not possible, backend `POST /disputes/create` takes only bookingId, category, description.
- [x] 2. Fake job fallbacks removed (needs device test)
  - [x] 2.1 `FALLBACK_CUSTOMER_JOBS` and demo `j-` job detail removed from `customerJobApi.ts`.
  - [x] 2.2 `getMyJobs` now throws on failure; `JobsScreen.tsx` shows `ErrorState` with retry when loading fails, and the empty state when there are no jobs.
  - [x] 2.3 Deleted `Customer/features/Jobs/data/jobs.ts` and `jobDetail.ts` (nothing else used them).
- [x] 3. Refurbished mock data (needs device test)
  - [x] 3.1 Related carousel uses `getRelatedRefurbishedProducts` (`refurbishedApi.ts`, `RefurbishedProductDetailScreen.tsx`), hidden when empty.
  - [x] 3.2 Removed `REFURBISHED_PRODUCTS` (data file and the unused imports in `BuyRefurbishedScreen.tsx`, `AllGadgetsScreen.tsx`).
  - [ ] 3.3 Still static, waiting for your decision: testimonials, filter category and brand lists, default rating/stock values (see PROJECT_MAP.md section 10).
- [x] 4. Customer EditProfile duplicate removed (needs device test)
  - [x] 4.1 Customer branch removed from `EditProfileScreen.tsx`; screen is Repairman and Seller only.
  - [x] 4.2 `EditProfile` route and import removed from `CustomerNavigator.tsx`. Customer edits through `EditCustomerProfileModal`.
- [x] 5. Chat merged into one shared set (needs device test)
  - [x] 5.1 `src/features/Chat/screens/ChatListScreen.tsx` and `ChatDetailScreen.tsx`, Repairman code as base, `role` prop from each navigator.
  - [x] 5.2 Customer-only: enquiry threads, quotation Accept/Decline. Seller: question and ID in the header.
  - [x] 5.3 Duplicates deleted: Customer chat list and detail, Seller chat detail, Repairman `Chat/data/chats.ts`.
- [x] 6. Docs: `PROJECT_MAP.md` updated, this file replaced.
- [x] 7. Checks
  - [x] 7.1 `npx tsc --noEmit`: 0 errors.
  - [x] 7.2 ESLint on touched files: 0 errors (one existing `exhaustive-deps` error remains in `RefurbishedProductDetailScreen.tsx`, left as is to avoid a refetch loop; many existing inline-style warnings).
  - [ ] 7.3 `npx jest`: fails before and after, `App.test.tsx` cannot import `react-native-gesture-handler` (existing).
