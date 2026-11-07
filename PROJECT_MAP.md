# CTI Mobile — Project Map & API Integration Blueprint

> **Status**: Phase 0 Discovery Complete (with Addendum)  
> **Target App**: React Native Bare CLI (Android & iOS) — `d:\React-Native-works\CTI`  
> **Backend Reference**: Node.js & Express / MongoDB — `D:\Next-JS-Project\tbt-server`  
> **Web App Reference**: Next.js 14 App Router — `D:\Next-JS-Project\frontend`  
> **Last Updated**: 2026-11-07  

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
     `export const WEB_LOGIN_URL = 'https://cti-frontend-zeta.vercel.app/en/auth/login';`  
     (Retaining `/en/` locale prefix for future i18n support).

---

## 3. Customer Feature Deep-Dive & Missing Screens

| Feature | Mobile Status | Where it Lives in Mobile | Web App Reference | Gap / Required Action |
|---|---|---|---|---|
| **Chat (List & Detail)** | **Exists** | `src/roles/Repairman/features/Chat/screens/ChatListScreen.tsx` & `ChatDetailScreen.tsx` (registered in `CustomerNavigator.tsx`). Header comment icon & repairman cards open chat. | `(website)/messages` (`GlobalChat.jsx`) | Reused from Repairman chat stack. Fully functional with `chatApi.ts` & `socketService.ts`. |
| **Create Repair Job Request** | **Missing Screen** | None in mobile | `(website)/(myAccount)/my-account/add-job/page.jsx` | Web has a complete multi-step job creation form (Device category, brand, model, title, description, urgency, budget range, service preference, preferred time, photo upload), calling `POST /api/repair-jobs`. Mobile currently has no screen or button to post a job. |
| **Hire / Book Repairman** | **Exists** | `src/roles/Customer/features/Jobs/components/BookingModal.tsx` in `RepairDetailScreen.tsx` | `(website)/(myAccount)/my-account/[id]/offer/[offerId]/check-out` | `BookingModal` handles accepting an offer and selecting service type, schedule date, and instructions (`customerJobApi.selectOffer`). `ExpertRepairmenScreen` provides "Book & Chat" to start direct negotiation. |
| **Write Review for Completed Job** | **Missing Screen / Modal** | Static button in `JobsScreen.tsx` without an `onPress` action | Completed booking review trigger calling `POST /api/reviews` | Mobile needs a `WriteReviewModal` or dedicated review screen collecting rating, review text, aspect ratings, and recommendation. |
| **Create Dispute** | **Missing Action / Modal for Customer** | `DisputeDetailScreen.tsx` only views and replies to an existing dispute | `(website)/(myAccount)/my-account/[id]/job-details/Disputes.jsx` | Web allows opening a dispute on a booking via `POST /api/disputes/create` (category, description, evidence). Mobile has a `CreateDisputeModal.tsx` in Repairman code that should be shared/adapted for Customer. |

---

## 4. Role Navigation & Operational Action Map

### 4.1 Seller Chat Access
- In mobile, the Seller accesses the conversation list via the **comment icon in `SellerHeader.tsx`** (`navigation.navigate('ChatList')`).
- `SellerNavigator.tsx` registers `ChatListScreen` (reusing `@/roles/Repairman/features/Chat/screens/ChatListScreen.tsx`).
- In `EnquiriesScreen.tsx`, tapping "Chat with Customer" navigates directly to `ChatDetailScreen`.

### 4.2 Repairman Parts & Service Operations
- **Parts Request Creation**:
  - In mobile, `PartsOrderScreen.tsx` is view-only (lists existing orders and tracks shipments).
  - In backend/web, parts requests are tied directly to an active booking when a technician marks status as `parts_needed` with parts info. There is no standalone customer-facing parts store for repairmen in mobile.
- **Service Catalog Create / Edit**:
  - In mobile, `ServiceCatalogScreen.tsx` currently displays static service cards with status toggle buttons.
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
TOTAL APP SCREENS: 95
========================================================================

1. SHARED & ROLE-AGNOSTIC (20 SCREENS):
   - Real API (11): NotificationsScreen, BuyRefurbishedScreen, AllGadgetsScreen, 
                    RefurbishedProductDetailScreen, SellRefurbishedScreen, 
                    SelectModelScreen, SelectVariantScreen, DeviceConditionScreen, 
                    UploadDeviceMediaScreen, QuoteApplicationScreen, 
                    MySellRequestsScreen, ChangePasswordScreen.
   - Hybrid (2):    ProfileScreen, EditProfileScreen.
   - Mock (1):      ServiceCatalogScreen.
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
   - Hybrid (3):    JobsScreen, RepairDetailScreen, Customer ProfileScreen (alias).
   - Mock (1):      DisputeDetailScreen.
   - Local (1):     SettingsScreen.
   - Clean (2):     ResetSuccessScreen, AboutScreen.

3. REPAIRMAN ROLE (23 SCREENS):
   - Real API (7):  LoginScreen, SignUpScreen, VerifyOtpScreen, ForgotPasswordScreen, 
                    ResetPasswordScreen, ChatListScreen, ChatDetailScreen.
   - Hybrid (2):    DashboardScreen, Repairman ProfileScreen (alias).
   - Mock (10):     JobBoardScreen, JobBoardDetailScreen, SendProposalScreen, 
                    MyJobsScreen, MyJobDetailScreen, MyOffersScreen, EarningsScreen, 
                    BankingInformationScreen, PartsOrderScreen, ReviewsScreen.
   - Local (1):     SettingsScreen.
   - Clean (3):     ResetSuccessScreen, DashboardTabScreen, JobsScreen (tab host).

4. SELLER ROLE (24 SCREENS):
   - Real API (16): LoginScreen, SignUpScreen, VerifyOtpScreen, ForgotPasswordScreen, 
                    ResetPasswordScreen, DashboardScreen, ProductListScreen, 
                    AddProductScreen, OrderManagementScreen, CancelledOrdersScreen, 
                    ReturnRequestsScreen, WalletScreen, AdsScreen, EnquiriesScreen, 
                    ReviewsScreen, ChatDetailScreen.
   - Hybrid (0):    None.
   - Mock (4):      ImportExportScreen, CreateCampaignScreen, ReportsScreen, InvoicesScreen.
   - Local (1):     SettingsScreen.
   - Clean (3):     ResetSuccessScreen, SellerMainScreen (tab host), HomeScreen (placeholder).

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
