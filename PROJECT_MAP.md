# CTI Mobile — Project Map & API Integration Blueprint

> **Status**: Phase 0 Discovery Complete (with Addendum)  
> **Target App**: React Native Bare CLI (Android & iOS) — `d:\React-Native-works\CTI`  
> **Backend Reference**: Node.js & Express / MongoDB — `D:\Next-JS-Project\tbt-server`  
> **Web App Reference**: Next.js 14 App Router — `D:\Next-JS-Project\frontend`  
> **Last Updated**: 2026-11-10 (Seller Phase 2, Group 4)  

---

## 1. Role System & Permission Matrix

The backend (`tbt-server`) enforces 4 roles defined in `User.model.js`: `customer`, `repairman`, `seller`, and `admin` (`admin` is web-only). The mobile application implements the three operational roles:

| Role | Database Role | Route Groups Authorized | Capabilities & Access Scope |
|---|---|---|---|
| **Customer** | `'customer'` | `/api/customer/*`<br/>`/api/repair-jobs/*`<br/>`/api/e-commerce/*`<br/>`/api/refurbished/*`<br/>`/api/public/*`<br/>`/api/chat/*`<br/>`/api/reviews/*`<br/>`/api/disputes/*` | Browse products & gadgets; create repair job requests; review repairman quotes & select offers; hire expert repairmen; make e-commerce/refurbished orders; manage cart & wishlist; open disputes; chat with repairmen/sellers; rate/review completed jobs. |
| **Repairman** | `'repairman'` | `/api/repairman/*`<br/>`/api/reviews/*`<br/>`/api/disputes/*`<br/>`/api/chat/*`<br/>`/api/public/*` | View marketplace Job Board; send repair proposals/offers; manage assigned jobs and update statuses (`in_progress`, `completed`, etc.); request spare parts; manage earnings and withdraw funds; maintain service catalog; manage bank details; KYC onboarding & review. |
| **Seller** | `'seller'` | `/api/seller/*`<br/>`/api/chat/*`<br/>`/api/public/*` | Manage product catalog & inventory (CRUD, CSV import/export, variants); fulfill orders & track shipments (Aras Cargo); handle return requests & cancellations; upload order tax invoices; manage wallet & payouts; run sponsored ad campaigns; answer customer enquiries; review sales reports. |

### Role Switching & Session Lifecycle
1. **No In-App Role Switching**: A user document in MongoDB has a single immutable `role` field. There is no backend endpoint to toggle a user between roles.
2. **Dedicated Auth Per Role**: Each role has its own registration and login stack (`CustomerAuthStack`, `RepairmanAuthStack`, `SellerAuthStack`). `authApi` passes the chosen role upon registration.
3. **Session Switching**: Switching roles requires logging out (clearing token, query cache, socket disconnect) and selecting the target role from `RoleSelectScreen`.

---

## 2. KYC Handoff Architecture (Section 2b Decision)

Per Section 2b of the project brief, **the mobile app does NOT have KYC, document upload, or store profile form screens**. All provider verification happens on the website.

### 2.1 Backend Post-Login Behavior by Role & KYC Status

| Role | KYC Status Condition | Backend Login Status & Response | Backend Routes Blocked | Mobile Handling & UI State |
|---|---|---|---|---|
| **Customer** | Any | **HTTP 200** with `token`, `isProfileComplete: true` | None | Goes straight to Customer Home / Tabs. |
| **Seller** | `kycStatus: 'pending'` AND `!isKycCompleted` | **HTTP 410** with `{ success: false, data: { userId, kycStatus, isKycCompleted }, message: "Please Complete You kyc." }` — **NO TOKEN RETURNED** | All authenticated seller routes (no token generated) | Catch HTTP 410 in login -> Show `KycStatusScreen` with "Incomplete Profile" message & "Complete on Website" button. |
| **Seller** | `isKycCompleted: true` AND `kycStatus: 'pending'` | **HTTP 200** with `token`, `user: { isKycCompleted: true, kycStatus: 'pending', sellerId }` | Access to operational actions restricted by business logic | Check user profile on login -> Route to `KycStatusScreen` ("Under Review", 12-24h notice). Prevent opening dashboard tabs. |
| **Seller** | `kycStatus: 'revision'` or `'rejected'` | **HTTP 200** with `token`, `user: { isKycCompleted: true, kycStatus }` | Access to active seller features restricted | Check user profile on login -> Route to `KycStatusScreen` ("Revision Needed" or "Application Rejected"). |
| **Repairman** | `!isKycCompleted` | **HTTP 200** with `token`, `user: { isKycCompleted: false, kycStatus: 'pending' }` | `requireCompleteProfile` middleware on offer submission | Check user profile on login -> Route to `KycStatusScreen` ("Incomplete Profile - Upload Documents on Web"). |
| **Repairman** | `isKycCompleted: true` AND `kycStatus: 'pending'` | **HTTP 200** with `token`, `user: { isKycCompleted: true, kycStatus: 'pending' }` | Gated by admin approval | Route to `KycStatusScreen` ("Profile Under Review"). |
| **Repairman** | `kycStatus: 'revision'` or `'rejected'` | **HTTP 200** with `token`, `user: { isKycCompleted: true, kycStatus }` | Gated | Route to `KycStatusScreen` ("Action Required"). |
| **Both** | `kycStatus: 'approved'` | **HTTP 200** with `token`, approved status | Full access | Navigate straight to Role Dashboard / Home tabs. |

### 2.2 KYC Handoff Screens & Flow

1. **Registration Screen** (`SignUpScreen.tsx`): Existing. Registers user via `POST /api/auth/register`.
2. **OTP Verification Screen** (`VerifyOtpScreen.tsx`): Existing. Verifies email via `POST /api/auth/verify-otp`.
3. **"Complete Verification on Website" Screen** (`KycHandoffScreen`): **Needs to be added** for Repairman and Seller right after successful OTP verification. Explains that verification must be done on the website, with a single CTA opening `WEB_LOGIN_URL` via `Linking.openURL()`.
4. **KYC Status Screen** (`KycStatusScreen`): **Needs to be added**. Rendered whenever a Repairman or Seller with non-approved KYC logs in or restores a session. Includes:
   - Status badge and contextual message (`pending`, `incomplete`, `revision`, `rejected`).
   - "Complete / Review on Website" button (`Linking.openURL(WEB_LOGIN_URL)`).
   - "Check Status" / Refresh action calling `GET /api/auth/user-details`.
   - "Log Out" action returning to `RoleSelectScreen`.
5. **Configuration**:
   - `WEB_LOGIN_URL`: Configured in a central config module as:  
     `export const getWebLoginUrl = () => webUrl('/auth/login');`  
     (Retaining `/en/` locale prefix for future i18n support).

---

## 3. Customer Feature Deep-Dive & Missing Screens

| Feature | Mobile Status | Where it Lives in Mobile | Web App Reference | Gap / Required Action |
|---|---|---|---|---|
| **Chat (List & Detail)** | **Done (shared)** | `src/features/Chat/screens/ChatListScreen.tsx` and `ChatDetailScreen.tsx`, one shared set for all 3 roles. Each navigator mounts them with a `role` prop (`customer`, `repairman`, `seller`). | `(website)/messages` (`GlobalChat.jsx`) | Customer-only parts sit behind `role === 'customer'`: enquiry threads (`/customer/queries/*`), Accept/Decline on quotations. Seller header shows enquiry question and ID. |
| **Create Repair Job Request** | **Web only (by decision)** | "New Job Request" button at the bottom of the All Jobs tab in `JobsScreen.tsx`. Opens `WEB_ADD_JOB_URL` with `Linking`. Not on Home. | `(website)/(myAccount)/my-account/add-job/page.jsx` | None. Form stays on the website. |
| **Hire / Book Repairman** | **Exists** | `src/roles/Customer/features/Jobs/components/BookingModal.tsx` in `RepairDetailScreen.tsx` | `(website)/(myAccount)/my-account/[id]/offer/[offerId]/check-out` | `BookingModal` handles accepting an offer (`customerJobApi.selectOffer`). `ExpertRepairmenScreen` provides "Book & Chat". |
| **Write Review for Completed Job** | **Done** | `src/components/modals/WriteReviewModal.tsx`, opened from `JobsScreen.tsx` (Reviews tab) and `RepairDetailScreen.tsx` (Booking tab) | `POST /api/reviews` | Backend needs booking status `delivered`; button shows only then. Device test pending. |
| **Create Dispute** | **Done** | "Report a Problem" in `RepairDetailScreen.tsx` Booking tab opens shared `src/components/modals/CreateDisputeModal.tsx`, calls `customerJobApi.createDispute`, then opens `DisputeDetailScreen`. | `POST /api/disputes/create` (`bookingId`, `category`, `description`) | Backend accepts no photo evidence, so the modal has category and description only. Device test pending. |

---

## 4. Role Navigation & Operational Action Map

### 4.1 Seller Chat Access
- In mobile, the Seller accesses the conversation list via the **comment icon in `SellerHeader.tsx`** (`navigation.navigate('ChatList')`).
- `SellerNavigator.tsx` registers the shared `ChatListScreen` and `ChatDetailScreen` from `src/features/Chat/screens/` with `role="seller"`.
- In `EnquiriesScreen.tsx`, tapping "Chat with Customer" navigates directly to `ChatDetail` (params `chatId`, `customerName`, `queryId`, `question`).
- Repairman `ServiceCatalogScreen.tsx` is a real list (`GET /repairman/services`) and has no chat button.

### 4.2 Repairman Parts & Service Operations
- **Parts Request Creation**:
  - In mobile, `PartsOrderScreen.tsx` is view-only (lists existing orders and tracks shipments).
  - In backend/web, parts requests are tied directly to an active booking when a technician marks status as `parts_needed` with parts info. There is no standalone customer-facing parts store for repairmen in mobile.
- **Service Catalog Create / Edit**:
  - In mobile, `ServiceCatalogScreen.tsx` lists the repairman's own services from `GET /repairman/services` (status filter, paged); it has no create or edit.
  - In web, `service-catalog/add` and `service-catalog/[id]/edit` allow full creation/editing (`POST` and `PUT` `/api/repairman/services`). In mobile, service creation/editing is currently omitted (web-only operational task per Section 2).

---

## 5. Payments Architecture Analysis

- **Payment Provider**: **iyzico / Iyzipay** (Turkish gateway, sandbox endpoint `https://sandbox-api.iyzipay.com`).
- **Payment Method Flow (Web & Mobile)**:
  - Both web (`checkout/page.jsx`) and mobile (`CheckoutScreen.tsx`) use **server-to-server direct payment** via backend `createIyzicoPayment`.
  - Client sends: `cardNumber`, `cardHolder`, `expireMonth`, `expireYear`, `cvc`, `paymentMethod: 'card'`.
  - Backend executes `iyzipay.payment.create` synchronously.
  - **No 3D Secure / WebView redirect** is currently enforced for standard checkout.
- **Mobile `CheckoutScreen.tsx` Status**:
  - Implements complete form inputs for Turkish/international shipping address.
  - Client-side card validation: 16-digit format, Luhn algorithm checksum, expiration date check, CVV check.
  - Calls `createCustomerOrderApi()` (`POST /api/e-commerce/orders/create` or `POST /api/refurbished/orders/create`).
  - Supports `card` and `cod` (Cash on Delivery).
  - Handles cart clearing and order success navigation.

---

## 6. Infrastructure, Base URL & Cold Start Audit

### 6.1 Base URL & Environment Config
- **Current URL**: Hardcoded as `https://tbt-backend-hwu3.onrender.com/api` in `src/services/apiClient.ts` and `src/services/socketService.ts`.
- **Environment**: There is **no `.env` file** and no runtime environment switcher in the mobile repository.
- **Staging / Local**: Staging is Render production (`tbt-backend-hwu3.onrender.com`). Local backend runs on `http://localhost:5000` or local LAN IP.
- **Recommendation**: Create a centralized config `src/constants/config.ts` reading from env or a single togglable constant so switching between local LAN and Render is one line.

### 6.2 Render Cold Start Behavior
- The Render free/starter instance spins down after 15 minutes of idle time. Cold starts take **50–90 seconds**.
- **Current Mobile Behavior**:
  - `apiClient.ts` timeout is set to `30000ms` (30s). On cold start, the first request aborts with `ECONNABORTED` before the server wakes up.
  - `authService.ts` has specific error message detection for 502/503/timeout ("The server is currently waking up..."), but no automatic retry loop.
- **Phase 1 Required Fix**:
  - Increase initial timeout or add an exponential backoff retry interceptor for cold starts.
  - Send a silent background warm-up `GET /check` ping during `SplashScreen` to wake the server early.

---

## 7. Phase 1 Foundation Architecture (Phase 1 Complete: Part A & Part B)

| Foundation Pillar | Current Implementation | Phase 1 Brief Requirement | Status |
|---|---|---|---|
| **Central Config** | `src/constants/config.ts` | Central client with base URL from config, timeout, JSON headers, dev/release switch, `LOCAL_LAN_IP` constant for physical device testing, `WEB_LOGIN_URL` | **COMPLETE** |
| **API Client** | `src/services/apiClient.ts` (Axios) | Base URL from config, 60s timeout for Render cold starts, exponential backoff on GET (502, 503, 504, ECONNABORTED), silent warm-up (`warmupApiServer`) | **COMPLETE** |
| **Error Handling & 401** | `src/services/apiError.ts`, `src/services/apiClient.ts` | Normalized `ApiError` with `status`, `message`, `fieldErrors` (422), `data` (410 KYC data retained). 401 on login and change-password shows normal error; only 401 on authenticated requests with stored tokens triggers clean logout | **COMPLETE** |
| **Token Storage** | `src/services/tokenStorage.ts` (`react-native-keychain`) | Secure Keychain storage for JWT, auto-migration from legacy AsyncStorage on first launch, unified get/set/clear helpers | **COMPLETE** |
| **Auth Session & Logout** | `src/services/authEvents.ts`, `src/services/authService.ts` | Clean logout: unassigns FCM token on backend, clears keychain tokens, clears query cache, disconnects socket, clears session storage, notifies `RootNavigator` | **COMPLETE** |
| **TanStack Query** | `src/services/queryClient.ts`, `App.tsx` | `QueryClientProvider` mounted in `App.tsx`, sensible defaults (3m staleTime, 15m gcTime, no retry on 4xx, retries on 5xx/network), connected to NetInfo via `onlineManager` | **COMPLETE** |
| **Reusable UI States** | `src/components/states/` (`LoadingState`, `EmptyState`, `ErrorState`, `OfflineBanner`, `PaginationFooter`, `usePagination`) | Small, simple, reusable UI state components styled with existing theme tokens. Applied to reference screen `NotificationsScreen.tsx` | **COMPLETE** |
| **KYC Handoff & Status** | `src/features/Kyc/screens/KycHandoffScreen.tsx`, `KycStatusScreen.tsx`, `RootNavigator.tsx` | Section 2b decision: Repairman/Seller handoff right after OTP verification; `KycStatusScreen` for incomplete, pending, revision, rejected; Seller 410 on login caught without token; live profile refresh via `GET /api/auth/user-details`; Customer goes straight to Home | **COMPLETE** |
| **Socket Service** | `src/services/socketService.ts` | Reconnects automatically on network restore via `NetInfo`, disconnects on logout, deduplicated wire listener architecture | **COMPLETE** |
| **FCM Push Service** | `src/services/fcmService.ts`, `src/services/notificationApi.ts` | Device token registered post-login (`POST /update-fcm-token`), unassigned on logout, handles permission denied gracefully without crashing | **COMPLETE** |

---

## 8. Package Audit (Required vs. Installed)

| Capability | Recommended Package | Current Status in `package.json` | Notes |
|---|---|---|---|
| **Push Notifications** | `@react-native-firebase/app`, `@react-native-firebase/messaging` | **INSTALLED** (`v27.1.0`) | Installed; wired to FCM service and clean logout. |
| **Image Picking** | `react-native-image-picker` | **INSTALLED** (`v8.2.1`) | Installed; used for avatars & refurbished media. |
| **Document / File Picker (CSV, PDF)** | `react-native-document-picker` | **NOT INSTALLED** | Required for picking CSV in `ImportExportScreen` and PDF invoices in `InvoicesScreen`. |
| **File Download & Saving** | `react-native-blob-util` or `react-native-fs` | **NOT INSTALLED** | Needed for saving exported CSV files or downloaded PDF invoices to disk. Alternatively use browser via `Linking.openURL()`. |
| **Payment WebView (3DS)** | `react-native-webview` | **NOT INSTALLED** | Not required for direct payment; only needed if iyzico 3DS redirect is introduced. |
| **Secure Token Storage** | `react-native-keychain` | **INSTALLED & ACTIVE** (`v11.0.0`) | Secure storage helper implemented in `src/services/tokenStorage.ts`. |
| **Network Status** | `@react-native-community/netinfo` | **INSTALLED & ACTIVE** (`v12.0.1`) | Integrated with TanStack Query `onlineManager`. |

---

## 9. Comprehensive Screen Inventory & Exact Counts

Every screen is classified into:
- **Real API**: Fully connected to backend REST/Socket endpoints with live data mapping.
- **Hybrid**: Real API integration exists, but screen still uses fallback mock data or dummy lists if backend returns empty/fails.
- **Mock**: Reads entirely from local static `data/*.ts` files with simulated actions.
- **Local**: Operates strictly on client-side state / AsyncStorage / theme without backend data requirements.
- **Clean / Container**: Host navigators, tab shells, or static document screens.

### Detailed Breakdown by Role

```
========================================================================
TOTAL APP SCREENS: 95 (before cleanup; 3 duplicate chat screens and the customer EditProfile route have since been removed)
========================================================================

1. SHARED & ROLE-AGNOSTIC (20 SCREENS):
   - Real API (13): NotificationsScreen, BuyRefurbishedScreen, AllGadgetsScreen, 
                    RefurbishedProductDetailScreen, SellRefurbishedScreen, 
                    SelectModelScreen, SelectVariantScreen, DeviceConditionScreen, 
                    UploadDeviceMediaScreen, QuoteApplicationScreen, 
                    MySellRequestsScreen, ChangePasswordScreen, ProfileScreen (Customer).
   - Hybrid (0):    None (Profile is Customer only).
   - Mock (0):      None (the mock ServiceCatalogScreen and EditProfileScreen were deleted).
   - Local (2):     SplashScreen, RoleSelectScreen.
   - Clean (4):     PrivacyPolicyScreen, TermsScreen, ApplicationSubmittedScreen, 
                    ProfileScreen (alias).

2. CUSTOMER ROLE (28 SCREENS):
   - Real API (21): LoginScreen, SignUpScreen, VerifyOtpScreen, ForgotPasswordScreen, 
                    ResetPasswordScreen, HomeScreen, ProductScreen, ProductDetailScreen, 
                    FilterScreen, SellerStoreScreen, CartScreen, CheckoutScreen, 
                    WishlistScreen, OrdersScreen, OrderDetailScreen, 
                    ExpertRepairmenScreen, BlogsScreen, BlogDetailScreen, 
                    AcademyScreen, CoursesListScreen, CourseDetailScreen.
   - Hybrid (0):    None. Demo job fallbacks and `Jobs/data/*` were removed; list and detail show real data, an empty state or an error state with retry.
   - Mock (0):      None. DisputeDetailScreen uses the real API.
   - Note: JobsScreen, RepairDetailScreen and DisputeDetailScreen are now counted as Real API. The per-role counts above were not recounted after the chat merge and the removed duplicates; recount in Phase 4.
   - Local (1):     SettingsScreen.
   - Clean (2):     ResetSuccessScreen, AboutScreen.

3. REPAIRMAN ROLE (23 SCREENS):
   - Real API (22): all screens of this role (auth, Dashboard, Profile, Job Board and detail, Send Proposal, My Jobs and detail, My Offers and detail, Earnings, Banking Information, Parts Orders and detail, Reviews, Service Catalog, Disputes, Notifications, chat).
   - Hybrid (0):    None.
   - Mock (0):      None (checked 2026-11-17: no mock or dummy lists in the Repairman screens).
   - Local (1):     SettingsScreen.
   - Clean (3):     ResetSuccessScreen, DashboardTabScreen, JobsScreen (tab host).

4. SELLER ROLE (24 SCREENS):
   - Real API (21): all screens of this role (auth, Dashboard, Product list, Add Product, Import/Export, Orders, Cancelled, Returns, Wallet, Ads, Create Campaign, Reports, Invoices, Enquiries and query detail, Reviews, Profile, chat).
   - Hybrid (0) and Mock (0): none. The earlier Hybrid and Mock lists (Wallet, Ads, Enquiries, Reviews, Returns, Cancelled, Reports, Invoices, Import/Export, Create Campaign) were replaced by real endpoints; details in the sections below.
   - Local (1):     SettingsScreen.
   - Clean (3):     ResetSuccessScreen, HomeScreen (placeholder).

========================================================================
FINAL VERIFIED TOTALS:
------------------------------------------------------------------------
• Real API Screens:            55 (57.9%)
• Hybrid Screens:               7  (7.4%)
• Mock Screens:                16 (16.8%)
• Local Screens:                5  (5.3%)
• Clean / Containers / Static: 12 (12.6%)
========================================================================
```

---

## 9b. Seller web links (config.ts)

- `WEB_SELLER_PRODUCTS_URL`, `WEB_SELLER_PRODUCT_ADD_URL`, `getWebSellerProductEditUrl(id)`, `getWebSellerProductVariantsUrl(id)`: web pages `/en/seller/product/...`. Opened with `openWebsite` (`src/roles/Seller/utils/sellerUtils.ts`), themed modal with the address if the phone cannot open it.
- Seller Product API facts (backend `productController.js`): list returns `variants` populated (price `sellingPrice`, `discountPrice`, `stock`), `categoryId.title`, `brandId.title`, `pagination.{currentPage,totalPages,totalItems}`; filters `isActive`, `categoryId`, `brandId`, `search`. Create needs `title`, `description`, `categoryId`, `modelNumber` and at least one image.
- Dashboard uses `GET /seller/dashboard/overview` (same as web). The web calendar section is not on mobile.

## 10. Known Static or Placeholder Content (open)

- Removed: the 3 invented testimonials, the default rating/review count/stock values, the fake reviews and rating bars on `RefurbishedProductDetailScreen`, and the local-only "Write a Review" form there (the web app does not save refurbished reviews either, there is no endpoint). The screen now shows the backend `ratings` average and count, or "No reviews yet".
- Filter modal: categories and brands come only from `GET /public/refurbished-devices/filters` (the unused built-in category, brand, model and storage lists were removed). Price range (0 to 2000), RAM and storage options are still static in the modal.
- Still static in the Refurbished data: grade texts (copied from the web, translated), condition questions. `mapBackendToProduct` fills a generic SKU and spec texts when the backend has none.
- `ServiceCatalogScreen` (Repairman only) is real data; the Seller has no service catalog.
- Repairman and Seller mock screens are listed in section 9.

## 11. Refurbished Wishlist (matches web `store/refurbishedWishlist.js`)

- Endpoints: `GET /refurbished/wishlist` (list), `POST /refurbished/wishlist/toggle` with `{ productId, variantId }` (returns the full list). No local fallback, no extra lookups.
- State: `src/roles/Customer/context/WishlistContext.tsx`. The heart flips at once, the response list replaces the refurbished items, a failed request flips the heart back, and a second tap on the same product is ignored while its request runs.
- Hearts: Buy screen cards, All Gadgets cards, product detail, Wishlist screen. Messages are the web strings, shown in a themed `AlertModal`.
- Known differences kept on purpose: the AsyncStorage cache of the list (shared with standard products), and the mobile Wishlist header counts standard and refurbished items together.

## 9c. Seller shell and orders (Phase 2, Group 2)
- Navigation: stack route `SellerMain` is now `SellerTabs.tsx` (bottom tabs `HomeTab` = `SellerHomeScreen` with Dashboard, `ProductTab` = `SellerManageScreen`, `ProfileTab` = shared Profile). `SellerManageScreen` holds the top strip (Product, OrderManagement, Wallet, Ads, Reported, Invoices, Enquiries, Reviews). Each strip tab mounts on first visit and stays mounted; screens get an `isActive` prop. Open a strip tab from anywhere with `openSellerTab(navigation, tab)` (`utils/sellerUtils.ts`). Back button: strip option -> Product, Product -> Home, Home exits.
- `utils/useRefreshOnActive.ts`: silent reload when a kept-mounted tab becomes visible and its data is older than 60 s. `utils/usePagedList.ts`: paged list state (loading, refresh, more, error) used by Orders, Cancelled Orders, Returns.
- Order endpoints (backend `orderController.js`, `returnController.js`): `GET /seller/orders` (status values pending, processing, shipping, shipped, delivered, cancelled; filters search, orderDateFrom/To, completionDateFrom/To; money field `sellerTotal`), `GET /seller/orders/:id`, `PUT /seller/orders/status` (allowed moves in `ORDER_NEXT_STATUS`; shipped and delivered need a created shipment; cancel not allowed after shipment), `GET /seller/orders/cancelled` (`cancelledBy` user|seller|system, `summary`), `GET /seller/returns` (`returnStatus`, `returnNo`, `summary`), `POST /seller/returns/approve|reject` (reject needs `rejectionReason`).
- Shipment creation stays on the website: `getWebSellerOrderUrl(id)` in `constants/config.ts`.
- Seller order detail screen: `features/Orders/screens/SellerOrderDetailScreen.tsx` (route `SellerOrderDetail`). The Seller navigator no longer registers the Customer `Orders` and `OrderDetail` screens.
- Shared `Button` now grows in height and wraps its text instead of cutting it with "...".

## 9d. Seller wallet and reports (Phase 2, Group 3)
- Wallet (`features/Wallet/screens/WalletScreen.tsx`, `components/WithdrawModal.tsx`): `GET /seller/wallet` (balances are under `data.wallet`, plus `holdDays`, `nextReleaseAt`, `activeRequest`), `GET /seller/wallet/earnings` (Payment Summary tab: `grossAmount`, `platformFee`, `shippingDeduction`, `amount`, status pending_release|available|withdrawn), `GET /seller/transactions` (type, search; direction rule copied from the web), `GET /seller/wallet/withdraw-requests`, `POST /seller/wallet/withdraw-request` `{amount}`, `DELETE /seller/wallet/withdraw-request/:id`, `GET /seller/profile/me` (`bankDetails`, read only to show the bank and block when none is saved).
- Withdrawal rules (web): minimum 500 TRY (web only, backend only checks > 0), not above available balance, one pending request at a time (backend), bank details required (backend). Bank details are edited on the website: `WEB_SELLER_PROFILE_EDIT_URL`.
- Reports (`features/Reports/screens/ReportsScreen.tsx`): `GET /seller/reports/statement?startDate&endDate` (ISO), filters like the web (today, yesterday, 7, 14, 30 days, custom). The web "Request Statement" is a PDF built in the browser with jsPDF (no API), so the app opens `WEB_SELLER_REPORTS_URL` for it.

## 9e. Seller enquiries and reviews (Phase 2, Group 4)
- Enquiries (`features/Enquiries/screens/EnquiriesScreen.tsx`, `SellerQueryDetailScreen.tsx`, route `SellerQueryDetail`): `GET /seller/queries` (`type` = `customer` for product questions or `order`; `status` open|replied|closed; `customerName` search; list has no messages), `GET /seller/queries/stats`, `GET /seller/queries/:id` (marks as read), `POST /seller/queries/:id/reply` `{message}`, `PATCH /seller/queries/:id/status` `{status: open|closed}`. These are not chat conversations, so the shared ChatDetail is no longer used for enquiries. Dashboard Order/Product Questions open the matching tab with status Open (`enquiryType`, `enquiryStatus` params).
- Reviews (`features/Reviews/screens/ReviewsScreen.tsx`): `GET /seller/reviews` (`search`, `rating`, `pagination.{total,page,pages}`, no stats), `DELETE /seller/reviews/:id`. The backend has no seller reply route, so the fake reply was removed.
- Shared Seller pieces: `components/InitialsAvatar.tsx`, `StatusPills.tsx`, `SellerScreenHeader.tsx`; `utils/usePagedList.ts` (now with `enabled`, `needsRefresh`, `removeItem`).

## 9f. Seller order status rules in the app (decision "Option B")
- In the app the seller can only Start processing (pending to processing) and Cancel (pending, processing, shipping, shipped, and only while no shipment exists, as the backend rule). No cancel reason: the backend reads only `orderId` and `status`, and the web has none. Shipping, shipped, delivered and invoice upload are done on the website: the order detail shows a "Continue on the website" card (`getWebSellerOrderUrl(id)`).
- After a confirmed change `utils/orderEvents.ts` patches the Orders list card at once (or removes it when a status filter no longer matches), and Dashboard, Wallet and the Orders list reload quietly when visible again. Cancelled Orders loads fresh each time it is opened.
- Cancel response: `message` (Iyzico refund text), `refunded`; a cancel with `refunded` 0 is shown as a warning modal.
- Invoice upload moved to the website, so no PDF picker package is needed; the Invoices tab only lists and downloads (`Linking.openURL(pdfUrl)`).

## 9g. Logic review fixes (Groups 2 to 4)
- `utils/useRefreshOnActive.ts` also reloads when the app returns from the browser (after 15 s) so website steps show up. `utils/orderEvents.ts` has `markSellerDataChanged()` for return approve/reject and enquiry reply/close/reopen, which refreshes Dashboard and Wallet numbers quietly.
- Order detail "Your earnings" subtracts the shipping fee once a shipment exists (same as the web).

## 9h. Order images and customer live order status

- `src/utils/imageUtils.ts` `pickImageUrl(...sources)`: one place that turns backend images (`[{url,isDefault}]`, string, `{url}`) into an http(s) url. Used by `sellerApi.ts` (`pickImage`) and Customer `orderApi.ts`.
- `src/components/ProductThumb.tsx`: product picture with themed border and a package icon placeholder (no image or load error). Used in Seller Order Management, Cancelled Orders, Order Detail, Return details (evidence photos) and Customer Orders and Order Detail.
- Return requests have no product image field in the backend (snapshot only: productName, barcode). Only customer evidence photos (`images: [url]`) are shown.
- `src/utils/useRefreshOnActive.ts` moved from Seller utils (now shared).
- Customer live status: `socketService.onNotification` listens to `push_notification` and `notification`. `Customer/features/Orders/utils/orderLive.ts` (`useOrderStatusLiveListener`, mounted in `CustomerNavigator`) turns socket and foreground push (`order_status_update`, `refurbished_order_status`) into one event. OrdersScreen and OrderDetailScreen reload quietly (focused), when they come back into view, and when the app returns to the foreground.

## 9i. Seller Group 5 (Ads, Invoices, Settings, Import/Export, navigator)

- Ads list `Ads/screens/AdsScreen.tsx`: `GET /seller/ads/campaigns` (status filter, pages) and `GET /seller/ads/analytics/summary` (totals). Status badges draft, pending_approval ("Under review"), active, paused, rejected, completed. Actions with confirm modal: Pause (active), Resume (paused and budget left), Submit (draft or rejected with a saved card), Delete (not active or pending_approval). Edit stays on the website (`getWebSellerAdEditUrl`). Ads tab reloads after a campaign is created (`markAdsDirty` / `consumeAdsDirty`).
- Create Campaign `Ads/screens/CreateCampaignScreen.tsx`: `GET /seller/ads/settings`, `GET /seller/product`, `GET /seller/ads/payment/methods`, then `POST /seller/ads/campaigns` (multipart, banner only for sponsored_store) and `POST /campaigns/:id/submit`. Same checks as the web form. No card form in the app: no saved card shows "Add a card on the website" (`WEB_SELLER_ADS_PAYMENT_URL`). If the submit step fails the draft id is kept and a retry only submits.
- Invoices `Invoices/screens/InvoicesScreen.tsx`: `GET /seller/invoices` (status, pages) and real counts (4 one-item requests, no counts endpoint). Upload and re-upload stay on the website. Download saves the PDF to the device with `react-native-blob-util` (`utils/invoiceDownload.ts`): Android Downloads folder through the download manager (storage permission only on Android 9 and older), iOS Documents folder with a preview; a name that exists gets `-1`, `-2`; errors show a message.
- Settings: stored user (name, photo) from `AuthService`, refreshed on focus; customer-only items removed; no console.warn.
- Import/Export `Product/screens/ImportExportScreen.tsx`: website button plus real import history (`GET /seller/product/import-history`).
- `SellerNavigator.tsx`: customer-only routes (ExpertRepairmen, Blogs, About, Academy, Courses, ProductFilter, ProductDetail, Cart, Checkout, Wishlist, refurbished) and `WishlistProvider` removed. Seller `Home/screens/HomeScreen.tsx`, `AddCardModal.tsx` and mock `adsData.ts` deleted.
- Reports Request Statement is unchanged: the web builds its PDF in the browser (jsPDF), so the app opens the web reports page.
- Invoice download uses react-native-blob-util 1.1.1: Android DownloadManager into Downloads (permission only on Android 9 and below), iOS preview sheet. Other Seller buttons only open website links (no file downloads).

### Money format (one formatter)
- src/utils/money.ts: formatMoney(amount, currency=TRY) gives ₺1,234.50, -₺5.00; formatNumber; currencySymbol. sellerUtils re-exports it. Switzer font has no ₺, system font draws it. Set USE_SYMBOLS=false in money.ts to show "TRY 1,234.50" if a device shows a box.
- Backend messages with $ or Rs. (shown as received): seller ads min budget (adCampaignController 81/84), seller withdraw insufficient balance (walletController 222), seller return approved (returnController 278), refurbished return refund note (sellerRefurbishReturnController 127, admin side only).

### Seller fixes
- Product strip has no Dashboard option; openSellerTab(Dashboard) and initialTab Dashboard go to the Home tab. Back: option -> Product -> Home -> exit.
- Reviews: request/response match web; non-list reply now throws (error state), Cache-Control no-cache. App uses the Render backend, web .env points to a local server (192.168.56.1:8000).
- Enquiries counts per tab from GET /seller/queries (type + status, limit 1); /seller/queries/stats is both types combined (used only for unread). All = Open+Replied+Closed.

### Keyboard
- src/components/KeyboardSafeView.tsx (+ useKeyboardVisible). Android 15+ is always edge to edge (targetSdk 36), adjustResize no longer resizes, so the view pads by the exact covered height (measureInWindow vs keyboard screenY). Android 14 and below: system resizes, nothing added. iOS: KeyboardAvoidingView padding.
- Used by: AuthLayout, Chat detail, ChangePassword, EditProfile, QuoteApplication, CreateCampaign, AddProduct, Seller query detail, Dispute detail. RN Modal forms not changed.

- Seller Settings menu: Home, My Products, My Orders, My Ads, Enquiries open the Seller tabs. Only Enquiries shows a count badge (unread from GET /seller/queries/stats, refreshed on focus), like the web header. The web pinging dot is on every nav link with no meaning, so the app has none.

## 9j. Seller Profile (dedicated screen)
- `roles/Seller/features/Profile/screens/SellerProfileScreen.tsx` (Seller tab `ProfileTab` and stack route `Profile`; the shared Profile and EditProfile screens are no longer used by the Seller). API in `Profile/services/sellerProfileApi.ts`.
- Read: `GET /seller/profile/me-seller` (same as the web; `/me` returns only KYC fields unless approved). Write: `PATCH /seller/profile/update` multipart (`sellerProfile` JSON, files `profilePictureOrLogo`, `coverPhoto`), reloaded after every save because the response has no country/state/city names. Places: `/public/countries`, `/public/states/country/:id`, `/public/cities/state/:id`.
- Edit modals (one per section, `components/`): Store (fullName, businessName, phone, address, country/state/city, zip, description), Bank (all five fields always sent, backend replaces the block), Social (only changed links), Schedule (days, HH:MM times). Shared `EditModalShell` (KeyboardSafeView, themed AlertModal), `FormParts`. Photo and cover: gallery, preview modal, upload. No remove photo (no endpoint on backend or web).
- Documents, business registration and KYC stay on the website: `WEB_SELLER_PROFILE_EDIT_URL` is now `/en/seller/profile`.
- `AuthService.updateStoredUser(patch)` updates the cached and stored user (name, avatar) so Settings shows it at once. Bank save calls `markSellerDataChanged()` (Wallet and Dashboard reload). Wallet "Add bank details" opens `Profile` with `editSection: 'bank'`.
- Backend notes (not changed): update has no validation and no KYC gate, `.trim()` on a non-string gives 500; update changes `Seller` only, not `User.name` or `User.profileImage`; no delete route for logo and cover.

## 12. Repairman Phase 2, Group 1 (foundation)
- `roles/Repairman/api/repairmanApi.ts` rewritten: correct routes (`/repairman/jobs`, `/repairman/my-booking`, `/repairman/offers/my-offers`, `POST /repairman/offers/jobs/:jobId/offer`, `PATCH /repairman/my-booking/:id/status`), typed responses, no swallowed errors (apiClient already throws `ApiError`). Calendar month is 0 based. Withdraw minimum `MIN_WITHDRAWAL = 500`.
- Bottom tabs: Dashboard, Jobs, Earnings, Profile (Product tab removed). Jobs strip: Job Board, My Offers, My Jobs, Reviews, Parts Order. Shop products stay reachable from Settings (`Products` route); Cart and Wishlist "Explore Products" go there for non Customer roles.
- Repairman Profile: dedicated read only screen (`GET /repairman/profile`), edit on the website (`WEB_REPAIRMAN_PROFILE_EDIT_URL`). Settings menu has Service Catalog, Advertisements (website) and Shop products, real name and photo. Disputes link comes in G8. Web links are in `constants/config.ts` (`WEB_REPAIRMAN_*`).
- Session restore refreshes the KYC status for Seller and Repairman (`GET /auth/user-details`); `KycStatusScreen` remounts when the status changes. Fallback status with `isKycCompleted` and no status is now `pending`.
- Dashboard is adapted to the real response shapes only; its mock fallback goes in G2.

## 13. Repairman Phase 2, Group 2 (Dashboard) and G1 follow ups
- Locations: `services/locationApi.ts` (backend public countries, states, cities) is the only location source. The third party key file content is gone; `roles/Repairman/api/locationApi.ts` now has `useCities()` (cities of the repairman's own state, via `GET /repairman/profile` and `/public/cities/state/:id`), used only by `JobsFilterBar`. Seller store modal uses the same service.
- KYC gate: `features/Kyc/kycGate.ts` (`effectiveKycStatus`, `canUseApp`). A repairman with `isProfileComplete === false` is treated as incomplete (the profile route answers 404 for that case) and sees `KycStatusScreen`. The splash waits up to 10 s for the status check of a stored approved Seller or Repairman (`KYC_CHECK_TIMEOUT_MS`), then keeps the stored status if the check is slow or offline.
- Dashboard (`roles/Repairman/features/Dashboard/`): same sections as the web, each loads on its own (`utils/useApiData.ts`, `components/SectionCard.tsx`): Overview (`GET /repairman/dashboard` summary: total, delivered, active jobs, total amount in TRY), Earnings Analytics (`earnings-analytics?filter=this_week|last_week|this_month|last_month`), Job Distribution (`job-distribution?filter=today|...`, web default last month), Active Bookings (`latestBookings`), Job Calendar (`calendar-jobs?month&year`, month is 0 based), Offers Performance (`offers-analytics?year`; Monthly, Quarterly (summed in the app), Last Year (real, the web fakes it with random numbers)). Pull to refresh reloads all and shows a themed error if a reload fails; the tab reloads quietly after 60 s when shown again. `data/dashboard.ts` (mock) deleted.

## 14. Repairman Phase 2, Group 3 (Job Board and Send Proposal)
- Job Board list (`Jobs/screens/JobBoardScreen.tsx`, `components/JobBoardCard.tsx`, `JobBoardFilters.tsx`): `GET /repairman/jobs` with `page`, `limit`, `search` (debounced), `priority` (low, medium, high, urgent), `state`, `city` (ids). Without state or city the backend shows the jobs of the repairman's own city. States come from the response, cities from `/public/cities/state/:id`. Infinite scroll with `usePagedList`. The backend list does not filter by status, so the card shows the status (Available, Booked, Expired...); jobs that already have an offer from this repairman are not listed (backend).
- Job detail (`JobBoardDetailScreen.tsx`): `GET /repairman/jobs/:id` (web request) plus `GET /repairman/offers/jobs/:id` (answers 404 when the job no longer takes offers). The proposal button shows only when `getProposalAccess` (`Jobs/utils/jobBoard.ts`) says the backend accepts it: job open or with offers, not expired (`expiresAt` set and in the future), offers below `maxOffers`, no offer from this repairman yet. Otherwise a notice explains why, and "View my offers" when an offer exists.
- Send Proposal (`SendProposalScreen.tsx`): `POST /repairman/offers/jobs/:id/offer`. Body: `pricing{basePrice, partsEstimate, totalPrice, currency TRY}`, `estimatedTime{value >= 0.5, unit hours|days}`, `description` 10 to 300 characters, `warranty{duration days, description, terms}`, `availability.canStartBy` (ISO, future; chips or YYYY-MM-DD at 09:00, no date picker package), `serviceOptions` (pickup and home service with optional charges). Parts picker, pickup and drop-off required rule of the web are not in the app. Backend field errors are shown next to the fields, success message from the backend.
- After sending: `utils/offerEvents.ts` `markOffersChanged()` (Job Board and job detail reload when shown again; My Offers will use `useOffersChangedChecker` in G4). Customer side: `Customer/features/Jobs/utils/jobLive.ts` listens to the push and socket types `new_offer` and `booking_status_update`; Customer Jobs list and Repair detail reload quietly.
- Removed: `Repairman/api/locationApi.ts`, mock `JOB_BOARD`, the city filter of `JobsFilterBar` (My Offers and Parts Order filters are rebuilt in G4 and G7).

## 15. Repairman Phase 2, Group 4 (My Offers) and the proposal date picker
- `components/DatePickerModal.tsx`: shared themed single day calendar (same look as the Seller `DateRangeModal`, which only does ranges). Send Proposal uses it for "Can start by" (`minDate` today, start at 09:00). No package needed.
- My Offers list (`Jobs/screens/MyOffersScreen.tsx`, `components/MyOfferCard.tsx`): `GET /repairman/offers/my-offers`. Status filter (Pending, Accepted, Confirmed, Rejected, Withdrawn) goes to the backend like the web, search and priority filter the loaded offers in the app (the backend filters one page only and always reports 1 page, so "more pages" is a full page of 10). Offers without a job and `in_progress` are hidden like the web.
- Offer detail (`MyOfferDetailScreen.tsx`, route `MyOfferDetail`): `GET /repairman/offers/my-offers/:id` (prices come as server formatted text, so numbers are taken from the list item). Not available for withdrawn offers (backend 404), so those cards have no View button.
- Actions: Withdraw (pending, not expired): modal with a required reason (max 500) -> `DELETE /repairman/offers/:id {reason}`. Confirm (status accepted, the customer picked the offer): `PATCH /repairman/offers/my-offers/:id/accept`. Reject is not shown: the backend reject only matches status pending, so for an accepted offer it answers 500. Edit stays on the website (`getWebRepairmanOfferEditUrl`), shown for pending offers.
- Consistency: `utils/offerEvents.ts` `markOffersChanged()` (send, withdraw, confirm, or push `offer_accepted`), `subscribeOffersChanged`, `useRepairmanOfferLiveListener` (mounted in `RepairmanNavigator`). Job Board, job detail, My Offers and Dashboard reload when shown again; My Offers and Job Board reload at once if open. The backend sends no notification to the customer for withdraw or confirm, so the Customer screens show those after their next reload.

## 16. Repairman Phase 2, Group 5 (My Jobs)
- List (`Jobs/screens/MyJobsScreen.tsx`, `components/MyJobCard.tsx`): `GET /repairman/my-booking?page&limit=10` (backend pages are reliable here). Tabs Active, Completed, Cancelled, Disputed, Closed are status groups applied in the app (`utils/bookings.ts`), plus search and priority like the web. Pages are loaded unfiltered because the backend `summary` (total, job postings, direct messages, active, completed, cancelled, disputed) counts only what a request returns. Closed count = total minus the other four.
- Detail (`MyJobDetailScreen.tsx`, route `MyJobDetail`, param `bookingId`): `GET /repairman/my-booking/:id/detail` and `GET .../bookings/:id/status-transitions`. The detail has no status inside `bookingDetails`; the status comes from the transitions request. Shows booking (TRY prices, service type, schedule, estimate, warranty, delay), job, customer, location, timeline, dispute notice. "Message customer" uses `POST /chat/start` like the web (`startChat`).
- Status update (`components/UpdateStatusModal.tsx`): only the steps from the transitions endpoint. Scheduled asks for a date (calendar, sent as `scheduledDate`), cancelled asks for a reason (`cancellationReason`), parts needed asks which parts (sent as `notes` and `partsInfo.partsRequired`), note optional everywhere, no photo. `timeSlot` is never sent: the backend validates it as text but its model field is an object, so any value fails. The backend ignores `partsInfo` (no field in the booking model), only the note is saved.
- After an update: `markOffersChanged()` (My Jobs, My Offers, Dashboard, Job Board reload when shown). The backend sends the customer a `booking_status_update` notification, which the Customer jobs list and repair detail already reload on. Dashboard booking cards and calendar jobs open `MyJobDetail`.
- Removed: mock `MY_JOBS`, `UPDATE_STATUSES`, `UpSellModal`.

## 17. Repairman Phase 2, Group 6 (Earnings and Banking)
- Earnings (bottom tab `EarningsTab`, `Earnings/screens/EarningsScreen.tsx`): `GET /repairman/earnings/overview` (wallet: available, released, withdrawn, pending, locked, currency; paymentInfo with bank only when complete; this month: net earning, jobs, average), `GET /repairman/earnings/withdraw-history` (status filter, pages `meta.totalPages`, `summary` over all statuses), `POST /repairman/earnings/withdraw {amount}`. Sub tabs Overview, Withdraw, Withdraw History like the web.
- Withdraw rules (same as the backend): amount above 0, at least `MIN_WITHDRAWAL` 500 TRY, not above the available balance, bank details complete (`isPaymentInformationCompleted` and an account number). Only the amount is sent; the backend pays to the saved bank. The button is disabled until all rules hold; "Withdraw all" fills the available balance. Success and error texts come from the backend.
- Top up stays on the website (`WEB_REPAIRMAN_EARNINGS_URL`, themed fallback with the address).
- Banking Information (`BankingInformationScreen.tsx`, route `BankingInformation`): prefilled from `GET /repairman/profile` (the earnings request has no account title), saved with `PUT /repairman/profile/bank-details` with all five fields. Required in the app: account title, account number (the backend needs it only for withdrawals), bank name, branch, IBAN (`^[A-Z]{2}\d{2}[A-Z0-9]+$`, the app removes spaces and uses capitals because the backend checks the raw text). Nothing-changed guard, backend field errors (`missingFields`).
- Consistency: saving bank details and every job or offer change call `markOffersChanged()`, so Earnings and the Repairman Profile (bank alert) reload when shown. Removed mock `data/earnings.ts` and `TopUpWalletModal`.

## 18. Repairman Phase 2, Group 7 (Parts Orders and Reviews)
- Parts Orders list (`PartsOrder/screens/PartsOrderScreen.tsx`, `components/PartsOrderCard.tsx`, `utils/parts.ts`): `GET /repairman/parts/orders` with page, limit 10, search (debounced), orderStatus, paymentStatus, shippingMethod, all sent to the backend. Tiles come from the backend `summary` (total, pending, delivered, total amount in TRY). Filter values are the ones the backend model accepts (payment `Partially Paid`, not the web's `Partial`).
- Detail (`PartsOrderDetailScreen.tsx`, route `PartsOrderDetail`, param `orderId`): `GET /repairman/parts/orders/:id`. "Mark as received" shows only when the order is delivered and not yet received, opens a ConfirmModal, then `PUT .../mark-as-received`. The backend sends no message here, so a fixed fallback text is used. After it: `markOffersChanged()` reloads the list and the detail.
- Reviews (`Reviews/screens/ReviewsScreen.tsx`, `components/ReplyModal.tsx`): `GET /reviews/stats/my-stats` (average, total, 1-5 distribution), `GET /reviews/received/all?page&limit=10&rating` (rating filter chips and tapping a distribution row filter on the backend). Reply and edit reply use `POST /reviews/:id/respond {responseText}` (10 to 500 characters; the web page has no working reply, the endpoint exists). The reply shows in the card at once and the backend message is shown.
- Dashboard and the Jobs strip show no parts or review numbers, so nothing changed there.
- Removed mock `PartsOrder/data`, `Reviews/data`, `Jobs/data/jobs.ts`, `JobsFilterBar`.

## 19. Repairman Phase 2, Group 8 (Service Catalog, Disputes, Settings)
- Service Catalog (`roles/Repairman/features/ServiceCatalog/*`, route `ServiceCatalog`): `GET /repairman/services?status&page&limit=10` (status chips go to the backend; search runs over the loaded pages). Card shows type, device, city, TRY total with base, parts and service, rejection reason, dates. Rules like the web: Edit and Delete only when the service is not approved; the active switch (`PATCH /repairman/services/:id/toggle-status`) only when approved (backend refuses otherwise). Delete (`DELETE /repairman/services/:id`) asks in a ConfirmModal. Create and edit open the website (`WEB_REPAIRMAN_SERVICE_ADD_URL`, `getWebRepairmanServiceEditUrl`). The service has no customer, so the old Chat button is gone. After toggle or delete `markOffersChanged()` refreshes the Profile catalog counts.
- Removed: shared `features/Profile/screens/ServiceCatalogScreen.tsx` (mock jobs list), `fetchCatalogServicesApi`, `INITIAL_CATALOG_SERVICES`, `CatalogServiceItem`, and the Seller registration of `ServiceCatalog` (the endpoint is repairman only).
- Disputes (`roles/Repairman/features/Disputes/*`, routes `Disputes`, `DisputeDetail` param `disputeId`): `GET /disputes/my-disputes?status&page&limit=10`, `GET /disputes/:id`, `POST /disputes/:id/response` (message only, no evidence upload). The Customer `DisputeDetailScreen` is built on the customer job endpoints, so the repairman has its own screens on the shared `/disputes` endpoints. Reply box only while the dispute is not resolved or closed. Opened from Settings "Disputes" and from the "View dispute" button on My Job detail.
- Settings (Repairman): removed Top expert repairman, My Sell Request, Refurbished devices (sell) and the dead Support row; added Disputes.

## 20. Delivery audit, Step 1 (Customer, Seller, shared)
- Checkout (`Customer/features/Product/screens/CheckoutScreen.tsx`): sandbox test-card button and its text removed; screen wrapped in `KeyboardSafeView`; card holder starts from the account name. Card number, expiry and CVV exist only in screen state: never logged, never stored, not in the query cache; they are cleared after every request (success or failure), when the screen loses focus, when the app goes to the background and when switching to cash on delivery. Card inputs have autofill and autocorrect off, the CVV is masked, and a ref blocks a double submit. The order request still sends the card fields to the backend as before (backend owner must confirm how it handles them).
- Keyboard: `ReasonModal` (Seller returns), `RefurbishedFilterModal` and the HomeScreen brand/model picker now use `KeyboardSafeView`. Wallet, Seller Reviews, Enquiries, SellRefurbished and ExpertRepairmen only have a search box (no change needed).
- Settings: Customer "Support" row removed (no screen). Seller menu had no such row. All other Customer rows have a registered route.
- Mock and fake data removed: `Orders/data/orders.ts`, `Repairmen/data/repairmen.ts`, `Blogs/data/blogs.ts`, most of `Orders/data/orderDetail.ts` (only `CONTACT_TOPICS` stays), `INITIAL_PROFILE_DATA` (now an empty `EMPTY_PROFILE_DATA`), the shared ProfileScreen catalog preview block, and the unreachable `EditProfileScreen`. Fake images: no more unsplash/picsum fallbacks (repairman, seller avatar, blog, certificate); a missing picture shows `dummyProfileExtra` or a plain themed box. The repairman mapper no longer invents a rating of 5.0, a Karachi/Pakistan location or a description.
- Academy: the two hero images are the web's own `assets/academy` files copied into `src/assets/images/academy` (`academyImages`); the share link now uses `getWebAcademyCourseUrl` (the web base URL).

## 21. Delivery audit, Step 2 (logs, colors, lint, image)
- Console: every `console.*` call is now inside `if (__DEV__)` (18 unguarded calls fixed, including `ErrorBoundary`, Refurbished and Orders services). Release builds print nothing.
- Colors: hardcoded light colors that broke dark themes now use theme colors (Refurbished product detail table borders and Buy Now button, Seller store image box, price slider track). White text and icons that sat on the primary (orange) colour now use `colors.onPrimary` (29 icons and 4 texts), as the theme file requires. Fixed branded or gradient banners (Seller dashboard hero, About, video player) were left as they are.
- Lint: 0 errors left (`npx eslint .`); only style warnings remain (377 inline-style, a few others). Hook-dependency errors were fixed with refs (`mountedRef`, `submitRef`, `goHomeRef`, `loadDataRef`, `searchRef`, `selectionRef`, `hasProductRef`, `initialPostRef`, `onDoneRef`) so every effect keeps running only on the same triggers as before: nothing refetches more often.
- Dead code removed: unused `VariantCard`, unused imports and variables. Refurbished "application submitted" no longer shows a made-up reference number when none is passed.
- Academy: `learn.png` (1.2 MB) replaced by `learn.jpg` (43 KB).
- Packages that nothing imports: `@gorhom/bottom-sheet`, `react-native-root-toast`, `@react-native/new-app-screen`. Removed with `npm uninstall` after approval.

## 22. Delivery audit, Steps 3 and 4 (jest, release build)
- Jest: `jest.config.js` transforms the ES-module packages (gesture handler, navigation, firebase, async-storage, `react-native-*`) and maps `@/`; `jest.setup.js` replaces the native modules (reanimated, worklets, safe-area, netinfo, async-storage, keychain, firebase, socket.io, lottie, svg-free gradient, video, image-picker, view-shot, blob-util, masked-view). Tests: `App.test.tsx` (renders and unmounts the whole app), `money.test.ts` (TRY format), `repairmanRules.test.ts` (parts, disputes, service catalog rules). `npm test` passes (3 suites, 12 tests).
- Release signing (`android/app/build.gradle`): reads `android/keystore.properties` (git ignored; template `keystore.properties.example`). Without it, `assembleRelease` signs with the debug key and prints a warning; `bundleRelease` (Play bundle) refuses to build. Version comes from `-PappVersionCode` / `-PappVersionName` (default 1 and 1.0.0). R8/minify is on for release, with extra keep rules in `proguard-rules.pro`. A full `assembleRelease` (arm64) built successfully; release merged manifest has `usesCleartextTraffic="false"`.
- iOS: `NSAllowsArbitraryLoads` was already false (only local networking is allowed); the app never opens the camera, so no camera text is needed.
- App name stays `CTI`. The package id is unchanged (`com.example.new_cti_app`); changing it needs a new `google-services.json` from Firebase first. No more release builds until the owner asks.

## 23. Plan after the delivery audit
- Step 4 (now): walkthrough audit of Customer (part 1 shopping: Home, products, cart, checkout, orders, wishlist; part 2 jobs, refurbished, chat, profile, academy, blogs, settings), then Seller. Audit first, fix after approval. Every part also lists user-facing hardcoded strings (and texts built by joining pieces) for the language work.
- Step 5 (next, after Step 4 is fixed): Language work. Turkish is the default, English the second language, for all three roles (Customer, Seller, Repairman). The owner will send the plan request; no code before that plan is agreed. Input for it: the hardcoded-string lists collected in Step 4.
- Open items kept for later: package id change (needs a new `google-services.json`), iOS Firebase wiring (needs a Mac), lint style warnings.

## 24. Customer part 1 fixes (M1-M12, S1-S16)
- Cart and checkout (like the web): the cart is grouped by seller (`CartScreen.groupCart`) plus one refurbished group; each group is checked out alone. The order request sends `cartId` (+ `sellerId` for marketplace) for cart checkouts and `items` for Buy Now (which no longer adds to the cart). The backend removes what it ordered, so the app no longer clears the whole cart. No shipping fee is added anywhere (the backend charges none); Checkout shows an order summary with the total. `CartContext` exposes `standardCartId` and `refurbishedCartId`; `CartProvider` is also mounted in `RepairmanNavigator`.
- Unknown order result (no answer from the backend): `CheckoutScreen` blocks Place Order and checks the Orders list (`getAllCustomerOrdersPage`) before allowing another try (no second charge).
- Failed loads never empty the data: `getCartApi`, `getWishlistApi`, `getProductReviewsApi`, `fetchEcomProductsPage`, `getSellerStoreApi`, `getCustomerOrdersPage`, `getCustomerReturnsApi` throw; screens show the error with a retry. Cart and wishlist keep their last items when a refresh fails. The saved wishlist is removed on logout.
- Lists are paged: products (`PAGE_SIZE` 12, search box, all filters sent to the backend, `utils/productFilters.ts` holds the filter types, the price range 0-100000 and a small bus between the filter screen and the list), seller store (20), orders (10 per store).
- Orders: cancel only for pending orders (the backend rule) with the backend message; each order knows if it is refurbished (`isRefurbished`); no invented return id, address, customer name, shipping fee or warranty; status colours per status; cancelled orders show a note instead of the progress bar.
- Products: no invented rating bars, brand, category, SKU or seller text; rating bars come from the loaded reviews; the review form shows only when `/review-eligibility` says yes; related products are from the same category; a variant choice always matches the shown price and stock.
- Home: banners open by `ctaLink`, services by `slug` (not by visible text); the colour is optional in the service finder; a failed refresh keeps the sections on screen.
- Keyboard: `KeyboardSafeView` in the product detail screen and in the AskSeller, ContactSeller and Booking modals.

## 25. Customer part 2 fixes, part A (N1-N7, N9-N11)
- Refurbished store (`Refurbished/services/refurbishedApi.ts`): `mapBackendToProduct` keeps only backend values (no invented price, MRP, discount, specs, brand, SKU, grade or "verified"). Lists load every page (`fetchAllRefurbishedProducts`, 30 per page, up to 10 pages) and a failed request throws; the screens show `LoadErrorBox` with a retry (`Buy`, `AllGadgets`, `RefurbishedProductDetail`, `SellRefurbished`, `SelectModel`, `SelectVariant`, `DeviceCondition`). The condition questions always come from the backend (no built-in questions); the filter modal has no built-in brands or categories and no hidden price limit.
- Removed claim texts (the web does not show them in this form): the platform card, "Verified and Certified", grade explained with the "OLED Verified" pictures, "Get paid instantly / 100% data security" cards, "instant cash / guaranteed pickup within 24h", "How it works" and "Why us" sell sections, "Seasonal Sales / Money Back / Free Shipping" row, "Sponsored" labels and "quality guaranteed" on Home, "certified" fallbacks. Ask Platform (it sent nothing) is gone. Note: the web does show the two guarantee cards (24/7 support, return within 7 days) on its product pages (`components/website/PlatformGuarantees.jsx`) and "Free Shipping", "1 Year Warranty", "24/7 Customer Support" in `messages/en.json`; they were removed from the app on the owner's list and can be added back from those files.
- Warranty: no invented 30 days (job stats, booking, dispute). FilterScreen has no built-in categories, colours or storage; a failed filter request shows an error with a retry. Profile (`profileApi.ts`): no invented verified/completed flags, dates or country; a failed load throws and the screen shows an error (`loadedOnce` hides the chips until a real load). ProductDetail has no invented seller name, location, SKU or category. Jobs list loads all pages; job detail, Academy, Blogs and Expert Repairmen separate "failed" from "empty" (`ErrorState` with a retry).

## 26. Web claims restored, Customer part 2 part B (N8, T1-T11)
- Rule: the app shows what the web shows. Restored from the web files, same text: platform guarantee and easy returns cards (`components/PlatformGuarantees.tsx`, on product detail and refurbished detail), the promo strip on Home (`Home/components/PromoStrip.tsx`), the "CTI Platform - Verified & Certified Refurbished" block (only when the product has `addedByRole` admin, like the web), Grade Explained (`Refurbished/components/GradeExplained.tsx`, data in `Refurbished/data/gradeData.ts` generated from the web file, without the pictures). Texts are listed in `I18N_STRINGS_web_claims.md`. Still removed (not on the web): get paid instantly, 100% data security, guaranteed pickup in 24h, 1500+ cities, Sponsored labels without data, the fixed rupee banner, Ask Platform (it never sent anything).
- Chat (shared by all three roles, `features/Chat`): `fetchChatMessages`, `fetchQueryMessages` and `fetchChatList` now throw, so the screens show an error with retry and never an empty chat/list. A sent message is a local copy with `localStatus` (`sending`/`failed`): the server echo (`new_message`) replaces it; no echo in 10 s, an HTTP failure or `chat_error` shows "Not sent" with Retry and Delete. Older messages load when scrolling to the top (`before` = id of the oldest message, `maintainVisibleContentPosition` keeps the place). After a socket drop (`socketService.onReconnect`) the chat and the chat list are fetched again. Chat list: failed refresh keeps the old list with an error line, own and open-chat messages do not raise the unread count, the list reloads on focus.
- `startChat` never throws; screens now check `success` and show the backend message (Home specialist, RepairDetail, DisputeDetail, ProductDetail). ProductDetail sent wrong params (`conversationId`), so the chat opened empty; fixed.
- T1: BookingModal and `selectOffer` removed (offers are accepted on the website). T2: production service ids and "General Repair" style names removed. Made-up rating 5.0, 98% success, 30 days warranty, "Certified ..." names removed from `customerJobApi`; ratings and success badges show only when the backend has them.
- T3: `KeyboardSafeView` in every modal with an input (CreateDispute, WriteReview, EditCustomerProfile, Seller WithdrawModal, Repairman Select). T5: no random reference number. T6: no invented course duration/lessons, blog title/author/date; list keys no longer use `Math.random()`. T7: Home review card shows the real star rating. T8: expert chips come from the repairmen's real specializations. T9: refurbished cart add/update/remove go to the server only (errors are shown, no phone-side copy). T10: provider-only code removed from the Customer `ProfileScreen`, `profileApi` and the Add Education/Experience/Certificate modals. N11: completed-jobs-for-review loads all pages and shows an error; unused `getJobOffers` and `getMyBookings` removed.
- Sell pages restored from the web as well: hero headline, "How It Works" and "Why Us" (`Refurbished/components/SellWebSections.tsx`) and the "CTI Verified Sell" card on the condition, quote and upload-media steps (`CtiVerifiedSellCard.tsx`). The old invented step texts (`HOW_IT_WORKS_STEPS`, `WHY_SELL_WITH_US`) were deleted. The web line "No fees for pickup across 1500 cities across India" is NOT copied (wrong country for Turkey); that Why Us item shows only its title.

## 27. Themes and language UI pieces
- Themes: only `white` (default), `black`, `sand` remain. Forest and Ocean are gone (colours, picker, splash images, icons). A saved `app.theme` that no longer exists falls back to `white` and the stale value is removed.
- Language: `src/i18n/LanguageContext.tsx` (`LanguageProvider`, `useLanguage`, `LANGUAGES`). Turkish `tr` is the default, English `en` the second; the choice is saved in AsyncStorage under `app.language`; an unknown saved value falls back to `tr`. No string is translated yet. `components/LanguagePicker.tsx` (Role Select, top left, same dropdown as `ThemePicker`) and `components/LanguageModal.tsx` (opened by the "Language" row in the Settings of Customer, Seller and Repairman, through `openLanguageModal()`).

## 28. Seller audit (audit only, no code changed for it)
- Strings list: `I18N_STRINGS_seller.md` (663 fixed strings, 161 built from pieces; machine-extracted, rough).
- Findings (all app side, backend untouched): categories and brands load errors are silent (Product list filter, Add Product); Wallet bank check failure is silent; Invoice counts failure is silent; Add Product double-submit guard uses state only; status labels, `cancelledBy`, payment method and similar raw values are shown without a label map; Turkish uppercase (`toUpperCase`, `textTransform`) breaks the dotted I; texts built from pieces (plural, name, count).
- Seller dates, times and counts now use the app language (see section 29).

## 29. Language step 2 (structure and formatters)
- Packages installed by the owner: `i18next` 27.1.2, `react-i18next` 18.0.1 (package.json has `^`, node_modules has the exact versions).
- `src/i18n/index.ts` (i18next init, Turkish default, English fallback), `locales/en.ts` and `locales/tr.ts` (only the 20 glossary terms so far), `locale.ts` (current language, locale tag `tr-TR` / `en-GB`, website path segment). `LanguageContext` sets `locale.ts` and i18next on every change and on app start.
- Money and numbers: `src/utils/money.ts` follows the language (`₺1.234,50` / `₺1,234.50`), new `formatCount`. Dates and times: every `toLocale*String` call in the app now passes `getLocaleTag()` (no more fixed `en-US` / `en-GB`).
- Website links: the `WEB_*_URL` constants became functions (`getWebLoginUrl()`, `getWebSellerOrdersUrl()`, ...) in `src/constants/config.ts`; the path is `/tr/` or `/en/` by language. Call them when the link is opened, never store the result at module level. `APP_CONFIG.webLoginUrl` and `webAddJobUrl` were unused and removed.
- Font: all three Switzer weights have ç ğ ı İ ö ş ü (checked in the font file); only ₺ is missing, as before (system font draws it).
- A screen only shows the new language after it redraws. Screens that use `useTranslation` redraw by themselves; plain format calls update on the next redraw. Dates built in services (`customerJobApi`, `profileApi`, `blogApi`) are text saved at fetch time and must move to the screens in the translation step.

## 30. Translation Part 1 (shared pieces)
- Texts live in `src/i18n/locales/en/*.ts` and `tr/*.ts` (glossary, common, shell, chat, profile, modals, seller). The Turkish file is typed `typeof` the English one, so a missing key is a tsc error. `__tests__/i18nKeys.test.ts` checks that every `t('...')` key written in the code exists. Screens call `useTranslation()` so they redraw on a language change; code outside components uses `i18n.t(...)`. Backend messages are never passed through `t()`. Plurals: do not use i18next plural suffixes (Hermes may have no `Intl.PluralRules`); write two keys.
- Done in Part 1: states (Empty, Error, Loading, Offline, Pagination), Alert and Confirm default buttons, DatePicker, PasswordStrength, ErrorBoundary, validators, `apiError` messages, Theme and Language pickers, Role Select, all three tab bars and the Seller top tabs, Settings of the three roles (menu text, search, logout), Chat list and detail, the Customer Profile (view, edit, change password), CreateDispute and WriteReview modals, Seller status labels (`utils/statusStyles.ts` returns translated labels; `cancelledByLabel`, `paymentMethodLabel`, `queryStatusLabel`, `transactionTypeLabel`).
- `upper()` and `lower()` in `i18n/locale.ts` keep the Turkish dotted i for display text. `textTransform: 'uppercase'` is still used in 7 Customer places (SelectModel, UploadDeviceMedia, Cart, Checkout, ProductDetail, SellerStore, Wishlist) and is changed to `upper()` when each screen is translated.
- Profile dates: `memberSince` and `lastUpdate` now hold the ISO date from the backend and the screen formats them.
- Seller: Reports tab is named "Reports" like the web; `useProductOptions` (categories and brands with error and retry), withdraw bank check retry, invoice counts retry, Add Product double-tap guard is a ref.

## 31. Translation Part 2 (Customer)
- Texts: `src/i18n/locales/{en,tr}/customerAuto.ts` (about 920 screen texts found in the code, key `customer.<words>`) and `customerMsg.ts` (hand written: texts with placeholders, singular/plural pairs, ids, status words). Sentences with a coloured word use `<Trans i18nKey=... components={{ hl: <Text .../> }} />` so each language keeps its own word order.
- Id based logic (no English words as keys): Dispute detail tabs (`details`, `repairman`, `booking`, `disputes`), Refurbished sort (`default`, `priceAsc`, `priceDesc`, `rated`, `newest`), order progress steps (API words `pending` ... `delivered`, shown with `statusLabel()`), job offer state (`offerConfirmed`), Jobs and Orders tabs (already keys), Expert Repairmen chips (empty id = all), grade tabs (ids stay, text translated), contact and ask-seller topics (keys, the sent subject is the text in the app language).
- Backend words are mapped for display in `src/utils/labels.ts` (`statusLabel`, `chipLabel`, `userTypeLabel`, `serviceTypeLabel`, `priorityLabel`, `paymentMethodLabel`); an unknown word is shown as it is.
- Text built in services at fetch time (`customerJobApi`, `ecomApi` warranty, `orderApi` dates, `refurbishedApi` fallbacks) uses `i18n.t` when the data is loaded, so it changes after the next load or pull to refresh. Names, categories, specs, reviews and descriptions come from the backend and are not translated.
- Data files use getters (`get title() { return i18n.t(...) }`) so the screens did not need to change (`about.ts`, `gradeData.ts`, `refurbishedData.ts`, `SellWebSections.tsx`). Dead code `GRADE_EXPLANATIONS` was removed.
- Password rule is 8 characters like the web; Login only checks that a password is typed (`validateLoginPassword`).
- Not in Part 2: Notifications, KYC screens, Legal texts (English on purpose), Seller and Repairman screens.

## 32. Translation Part 3 (Repairman, KYC, Notifications)
- Texts: `locales/{en,tr}/repairmanAuto.ts` (key `repairman.<words>`, found in the code) and `repairmanMsg.ts` (hand written: placeholders, singular/plural, ids, status words, notification types, resolution words). Texts that already existed in Customer or common files are reused (not Seller status words, they can mean something else).
- `src/utils/labels.ts` `statusLabel()` also looks in `repairmanMsg.status` (repairman_notified, parts_needed, quality_check, ready_for_pickup, partially_paid, accepted_by_customer ...). Repairman utils (`bookingStatus`, `offers`, `jobBoard`, `bookings`, `disputes`, `parts`, `services`, `earnings`) now return translated words; logic never compares them: `isJobAvailable(job)` and `isExpired(job)` replace the old checks on the words "Available" and "Expired".
- Id based: Earnings sub tabs (`overview`, `withdraw`, `history`), proposal warranty (days as numbers, shown with `Select format`), job board tabs and filters (already keys).
- `timeAgo()` and `timeRemaining()` in `utils/dateFormat.ts` return whole phrases ("3 days ago", "bir saatten az"); `monthShortName`, `weekdayShortName`, `monthLongName`, `weekdayLongName` show backend English month and day names in the app language. The Dashboard calendar and chart labels use them; the backend month words are still used to match data.
- Notifications: type names (`notifType`) and detail row labels (`detail`) are keys; raw values go through `statusLabel`, `chipLabel`, `serviceTypeLabel`.
- Repairman `repairmanApi.ts` builds no text, so there was nothing to move; the service lines (warranty days, time unit, working days) are built in the screens now.

## 33. Translation Part 4 (Seller) and Customer service texts
- Seller texts: `locales/{en,tr}/sellerAuto.ts` (key `sellerAuto.<words>`, found in the code) and `sellerMsg.ts` (hand written). Reuse from Customer or Repairman files only for sentences of 3 or more words; single words always get their own Seller key; `seller.status.*` words are never reused (they mean order, return, ad or withdraw states).
- Customer services no longer build language text: `customerJobApi` (warranty, time, start, notes, stats, created date) returns `Msg` values (`{ key, params }` or `{ date }`) and the screens show them with `tx()` from `utils/labels.ts`; `orderApi` returns ISO dates; `ecomApi` warranty is a `Msg`. They follow a language change on the next draw.
- Seller maps now use getters (ad done titles, order action and confirm texts, website steps), KYC words are `sellerMsg.kyc.<status>`, working days keep the English value for the backend and are shown with `weekdayLongName`.

## 34. Cleanup before release (step 1)
- Service and permission fallbacks (`usePagination`, `academyApi`, `authService`, `chatApi`, `fcmService`, `repairmanApi`) use `locales/{en,tr}/appMsg.ts` (`appMsg.*`).
- `scripts/i18n/find-hardcoded-text.js` lists English text still in the code (run with `NODE_PATH=node_modules node scripts/i18n/find-hardcoded-text.js`, output `hardcoded-text.json`). Hits that remain are data or ids (route names, brand and product names, month keys sent to the backend, list keys).
- `__tests__/i18nKeys.test.ts` also checks that Turkish uses the same `{{placeholders}}` as English and that every id turned into a key has a text.
- Lint: 0 errors; the shadow, yoda, dot-notation and undef-init warnings are fixed. Left: inline styles, 2 `no-bitwise` (colour maths in `ecomApi`), 2 `no-unstable-nested-components` (tab icons).

## 35. Layout check for longer Turkish text and legal text structure (step 2)
- `scripts/i18n/find-layout-risks.js` lists texts that can overflow (text in a row without flexShrink, texts in boxes with a fixed height or width); `fix-layout-risks.js [--write]` applies `flexShrink: 1` to the style or `numberOfLines={1} adjustsFontSizeToFit`; `length-report.js` joins the list with the Turkish text length. 142 places were fixed once; the finder now reports only the 6 boxes that already have `numberOfLines`.
- Bottom tab labels in `CustomerTabs`, `RepairmanBottomTabs`, `SellerTabs` use one line with font fit.
- Legal text: `features/Legal/content/en/*.ts` (English, in use), `content/tr/*.ts` (re-exports the English text until a translator replaces it, same shape), `content/index.ts` (`getTerms(lang)`, `getPrivacy(lang)`). `TermsScreen` and `PrivacyPolicyScreen` pick by `i18n.language`.
- Refurbished: grade tab names are translated (`GRADE_LABEL`); categories and brands come from the backend; the unused built-in `REFURBISHED_CATEGORIES` list was removed; the "All" fallback of the sell screen uses `customerMsg.all`. `hero.png` (academy, 252 KB) is kept: it has a transparent background, so it cannot become a JPG and no PNG tool is installed.

## 36. Fixes after the final audit (S1 to S8, N3 to N5)
- Refresh: Customer `DisputeDetailScreen` (pull to refresh added), Repairman `DisputeDetailScreen` and `MySellRequestsScreen` reload quietly when the screen comes back into view or the app returns (`useIsFocused` + `utils/useRefreshOnActive`). The backend sends no push or socket event for dispute replies or CTI offers (only `dispute_raised`), so there is nothing to listen to.
- Submit guards (ref, not only state): `ChangePasswordScreen`, Customer `JobsScreen` review, `RepairDetailScreen` dispute and review, `DisputeDetailScreen` reply, `ContactSellerModal`, `AskSellerModal`, Notifications delete and mark all, `KycStatusScreen` check and logout, `RootNavigator` logout.
- Keyboard: Customer `FilterScreen` is inside `KeyboardSafeView` (Android 15 and newer does not resize the window, `adjustResize` does nothing there).
- Fetch-time fallbacks: `customerJobApi` returns `Msg` for `device`, `title`, `description`, `services`, `repairmanName`, part `name` (screens show them with `tx()`); `repairman.name` is empty when missing and the screen shows the word. Academy category, chat names, "You:" prefix (`lastMessage.fromMe`), seller card brand, reviewer name, repairman name: the service saves no fallback word, the screen draws it. Error and success messages built when a call fails stay in `i18n.t` (they are shown at once).
- Seller invoice download was already built with `react-native-blob-util` (the older line in the Seller Invoices section was outdated).
- Removed: unused `REFURBISHED_BRANDS`, `SELLER_DEVICE_MODELS`, `STORAGE_VARIANTS`. Timers: Seller query detail scroll timer and the theme snapshot timer are cleared on unmount.
- Test `__tests__/i18nKeys.test.ts` also checks stored `appMsg.*` and `chat.*` keys.
