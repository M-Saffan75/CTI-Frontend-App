# Phase 2: Customer Role Integration Checklist

## 0. Decisions & Approvals
- [x] 0.1 Heavy Operation Decision: EditProfile option 2 (Simplify: role-gate form, Customer sees only Name, Avatar, Phone, WhatsApp, City, Address/Zip; hide provider-only sections).
- [x] 0.2 Heavy Operation Decision: Sell Refurbished option 1 (Keep 7-step flow in app).
- [x] 0.3 Heavy Operation Decision: Academy option 2 (Simplify: browse courses/details in app, play video lessons via external browser / YouTube).
- [x] 0.4 Heavy Operation Decision: Checkout option 1 (Keep in app as-is, ensure card data never stored/logged).
- [x] 0.5 Navigation Decision: Remove ServiceCatalogScreen from CustomerNavigator.
- [x] 0.6 Profile Decision: Hide provider-only tabs and sections from Customer profile.

## 1. Shared Screens (Profile, EditProfile, Settings, ChangePassword)
- [ ] 1.1 `CustomerNavigator.tsx`: Remove `ServiceCatalogScreen` import and route definition.
- [ ] 1.2 `profileApi.ts`:
      - Remove hardcoded mock data fallbacks (Zubair Malik, University of Karachi, etc.).
      - Use `AuthService` cached/stored role dynamically.
      - Map Customer profile data accurately from `GET /customer/profile` and `GET /auth/user-details`.
      - Wire `updateUserProfileApi` with FormData support for photo upload (`POST /customer/profile/upload-profile` or `PUT /customer/profile/update-profile`).
- [ ] 1.3 `ProfileScreen.tsx`:
      - Detect `isCustomer` role dynamically.
      - Hide provider-only sections for Customer: Bank Details alert card, Stats row (Rating, Jobs Completed, Hours), Specialization, Working Hours, Service Catalog Preview, Education, Experience, Certifications & Licenses, Pickup service, Emergency contact.
      - Display Customer-relevant sections: Avatar with edit badge, Name, "Customer" role badge, Member Since, Contact Info (Phone, Email, WhatsApp), Location (Address, City, Country, Zip Code), Account Information (Member Since, Last Update, Email Verified status).
      - Conditional back button (`canGoBack` check so tab view doesn't trap).
      - Live pull-to-refresh and loading state.
- [ ] 1.4 `EditProfileScreen.tsx`:
      - Implement Option 2 (Role-gated simplified form for Customer).
      - Customer fields: Avatar with `launchImageLibrary`, Name, Phone, WhatsApp, Country, City, Address, Zip Code, and optional About bio.
      - Hide provider fields when `isCustomer` (Father Name, CNIC, Tax Number, Shop Info, Working Hours, Bank Info, Education, Experience, Certificates, Documents).
      - Wire save to `updateUserProfileApi` with validation, loading indicator, and success alert.
- [ ] 1.5 `SettingsScreen.tsx`:
      - Replace hardcoded "Zubair Malik" and "Owner" with live user profile data (`AuthService.getCachedUser()` / `getStoredUser()`).
      - Display user avatar or fallback.
      - Confirm all customer menu routes work.
      - Verify clean logout confirmation and execution.
- [ ] 1.6 `ChangePasswordScreen.tsx`:
      - Pass effective role (`customer`) to `AuthService.changePassword`.
      - Verify validation (min 6 chars, uppercase, lowercase, number).
      - Verify error handling on invalid current password (401 exemption check).

## 2. Verification & Device Test List
- [ ] 2.1 TypeScript check (`npx tsc --noEmit`).
- [ ] 2.2 ESLint check (`npm run lint`).
- [ ] 2.3 Search touched files for console.log, unused imports, or leftover mock credentials.
- [ ] 2.4 Update `PROJECT_MAP.md` with Customer screen statuses.
- [ ] 2.5 Provide device test list for shared screens and wait for user's "continue".
