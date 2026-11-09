# Project brief: CTI React Native app, API integration

Read this file together with finish-protocol.md. Follow both. This brief describes the project and the order of work. The finish protocol describes how to finish every task properly.

The final app will be delivered to a client, so the code, structure, error handling and security must be at the level of a senior MERN and React Native developer.

## 1. The three projects (folders)

- Backend (Node and MongoDB): D:\Next-JS-Project\tbt-server
- Web app (Next.js, already complete, my reference): D:\Next-JS-Project\frontend
- Mobile app (React Native, the app we are building): D:\React-Native-works\CTI

Rules for these folders:
- The backend and the web app are READ ONLY. Never edit, format, install or delete anything there. Use them only to learn the API and the business logic.
- All changes happen only in D:\React-Native-works\CTI.
- If the mobile app needs something that the backend does not provide (a missing endpoint, a wrong response shape, a bug), do not change the backend. Report it to me with the endpoint, what is missing, and what you suggest.

## 2. What the mobile app is

- This app is not a 100 percent clone of the web app. It covers micro operations and monitoring only. Some bigger operations stay on the website, and the app should say so clearly where relevant (for example a short message like "This operation is available on the website").
- Same features and flows as the web app wherever a mobile screen already exists. The mobile UI screens are already designed and built. Do not redesign them. Connect them to real data.
- There are 3 user roles: Customer, Repairman and Seller. From the backend and the web app, find the exact role values and permissions (role names in the database, middleware checks, which routes each role can reach) and write them in PROJECT_MAP.md. Every feature must respect the role: navigation, screens, buttons and API access differ per role, like in the web app.
- Check how roles work in the backend: whether a user can switch from Customer to a provider role (Repairman or Seller), how that switch and any approval or verification works, and what happens to the session and navigation after a switch. Build it the same way as the web app.
- There is also an admin panel on the web. It is not part of the mobile app. Only use admin related backend logic to understand statuses and approvals that affect the 3 mobile roles.
- Dark and light theme are already done. Do not touch the theme system. New UI must use the existing theme tokens and shared components.
- If a screen or element is not needed on mobile, or is missing, tell me and we decide together. Do not delete or add screens by yourself.

## 2b. Decision: KYC and onboarding happen on the website, not in the app

For Repairman and Seller (and any other role that needs documents), the mobile app does NOT have KYC, document upload or store profile screens. The flow is:

1. The user registers in the app (the normal registration screen and API call, then email OTP verification like today).
2. Right after the OTP is verified successfully, show one simple "Complete your verification" screen: a short text explaining that identity and business documents must be completed on the website, and one button that opens the website in the phone browser. The exact order is: registration screen, then OTP screen, then this screen. The button opens this website login page: https://cti-frontend-zeta.vercel.app/en/auth/login . The user logs in there with the same credentials and completes KYC. Keep this URL in env or config as one value (for example WEB_LOGIN_URL), never hardcoded in the screen, because the domain may change. The same screen and URL are used for every role that needs KYC. Note that the website path has a language part (/en/). Keep it as part of the config value, so it can be changed to another language path later (for example when the mobile app gets Turkish).
3. The user completes KYC on the website.
4. The user comes back to the app and logs in with the same credentials, and goes to the home or dashboard screen for their role.

Rules for this flow:
- Use the backend's real fields (for example isKycCompleted and kycStatus: pending, approved, rejected, revision) to decide what the user sees after every login and at app start (session restore). Do not guess. Check how the backend behaves when a user with incomplete or pending KYC logs in, and handle it exactly.
- If KYC is not completed, or pending, rejected or in revision: show the same kind of simple status screen (message based on the status, and the button to open the website). It must not crash, loop or show a half working dashboard. Include a logout button and a "check again" or refresh action that re fetches the profile.
- If KYC is approved: go straight to the role's dashboard or home.
- A user can close the app in the middle of this flow. Logging in again must always lead to the correct screen for their current status.
- Customer has no KYC. Customer goes straight to home after OTP verification.
- Because of this decision, do not add KYC, field review or store profile form screens to the mobile app. Remove them from the missing screens list.
- Use Linking from React Native to open the website. If it fails, show a clear message with the website address.

## 2c. Decisions after Phase 0

- Customer, the 3 missing features are decided like this (use the existing UI style, shared components and the web app's flow and fields as reference):
  1. Write a review for a completed job: BUILD IN THE APP, as a modal (not a new screen). Fields: rating, review text, aspect ratings, recommendation (POST /api/reviews). Open it from the "Write a review" button on completed jobs in JobsScreen (the button currently has no onPress) and from RepairDetailScreen.
  2. Create a dispute on a booking: BUILD IN THE APP. Reuse or adapt the existing CreateDisputeModal from the Repairman code as one shared component, do not duplicate it. Fields: category, description, photo evidence (POST /api/disputes/create). Open it with a "Report a problem" button on booked, in progress and completed jobs in RepairDetailScreen. DisputeDetailScreen stays the screen for viewing and replying, connect it to the real API.
  3. Create repair job request: NOT in the app for now, it stays on the website (the web form is long and multi step). Add a clear "Post a repair job" button on the Customer Home screen and on the Jobs screen that opens the website with Linking, using a config value for the URL (the same config file as WEB_LOGIN_URL; if the web app has a direct page for adding a job, use that path in a separate config value, otherwise use the login URL). Do not build the form. If the client later wants it in the app, we will build a short 3 step version.
  Before building the review and dispute features, show me a short plan of each (sections and fields) so I can confirm it fits the existing design.
- Repairman service catalog: create and edit stay on the website only. The app keeps the list with the status toggle and delete. Connect it to the real API (replace the mock data).
- Account deletion: postponed. Do not build it now and do not change the backend. Do not mention it again unless I ask.
- Payment (iyzico card details sent to our backend, no 3D Secure): postponed. Keep the current checkout working as it is. Do not change the payment flow. Only make sure card data is never logged or stored on the device.
- Seller HomeScreen placeholder (src/roles/Seller/features/Home/screens/HomeScreen.tsx): it is an unused placeholder, because SellerMainScreen is the real home. Search the whole project to confirm nothing imports or navigates to it. If it is really unused, delete the file and tell me. If something uses it, do not delete it and tell me where.

## 2d. UX rules for every screen (strict, apply everywhere)

- Edit and update forms: compare the current values with the original values. If nothing changed, do not call the API. Show a short message such as "Nothing changed" and stay on the screen. Disable or visually mark the save button when there is no change.
- After a successful action, show the success message that the backend returns (the message field of the response). Use a fixed fallback text only when the backend sends no message. Never hardcode a success text when the backend provides one.
- After a failed action, show the backend error message (and field errors next to the right fields). Use a generic fallback only when the backend sends nothing useful.
- Every submit button shows a loading state and is disabled while the request runs, so there are no double submits.
- After success, update the visible data everywhere it is shown (profile name and photo in headers, Settings, lists) without needing an app restart.
- Every profile picture and avatar (profile screen, edit profile, settings, headers, chat, lists) has a light colored border that follows the theme, using the theme tokens (for example the theme border color), never a hardcoded color. It must look right in both light and dark theme. If there is no photo, show the placeholder with the same border.
- Keyboard, safe area and long text must never hide or break a form.

## 3. Current priority: API integration for all 3 roles

Language support (Turkish default, English second) comes later. Do not implement translations now. Just keep new user facing text in one obvious place per screen (not duplicated or scattered) so adding translations later is easy.

Order of work:
1. Phase 0, discovery only (no feature code yet).
2. Phase 1, shared foundation.
3. Phase 2, role by role, screen by screen.
4. Phase 3, chat, notifications and other real time features.
5. Phase 4, hardening and final review.

Finish one phase completely (with the finish protocol) before starting the next. After Phase 0 and after each role, stop and show me a short summary, then wait for my "continue".

## 4. Phase 0, discovery

1. Read the backend: routes, controllers, models, middleware (auth, roles, validation), response format, error format, pagination format, file upload, sockets and push notification code.
2. Read how the web app calls the API: API client, hooks, services, state, role guards, error handling, which fields and filters each screen uses.
3. Read the mobile app: navigation, existing screens, components, state, any API code or mock data, folder structure, packages.
4. Create or update PROJECT_MAP.md in the mobile project with:
   - the 3 roles and what each can do
   - every mobile screen, its file, its sections, and for each section the endpoint(s) it needs (method, path, request, response fields used)
   - which screens already have real API code and which still use mock data
   - endpoints the backend is missing for the mobile screens
5. Show me a summary: roles, number of screens per role, endpoints needed, problems found. Do not write feature code in this phase.

## 5. Phase 1, shared foundation

Build once, reuse everywhere. Keep it simple and in the style the project already uses.

- One API client (axios or fetch, whichever the project already uses) with base URL from env or config, timeout, JSON headers, auth token added automatically.
- Response and error handling in one place: 401 logs the user out cleanly (or refreshes the token if the backend supports refresh), 403 shows a "no permission" message, 404, 422 validation errors shown per field, 5xx and network errors shown with a retry option. No raw error objects or stack traces ever shown to the user.
- Secure token storage (the project's existing secure storage, or a secure keychain based library). Never AsyncStorage for tokens. Never log tokens, passwords or personal data.
- Auth flow: login, logout, token expiry, session restore at app start, role based navigation after login.
- Reusable UI states used by every screen: loading (skeleton or spinner like the existing design), error with retry, empty state with a default message (for example "No data found"), pull to refresh, and a pagination or infinite scroll pattern.
- Reusable list and form patterns: search with debounce, filters, validation, disabled submit while loading, success and error feedback.
- Types for every API response (if the project uses TypeScript).
- Cancel requests when a screen closes. Avoid duplicate requests.

## 6. Phase 2, role by role

Do the roles in this order: Customer first, then Seller, then Repairman (change the order only if the code shows a better one, and tell me why). Shared screens used by more than one role (login, profile, chat, notifications, settings) are done once, in the first role that needs them, and then only checked for the other roles.

For each role, go screen by screen in this order: login and home, then lists, then detail screens, then create, edit and action screens, then profile and settings.

For every screen:
- Connect every section to its real endpoint using the shared foundation. Remove mock data.
- Handle every state: first load, refreshing, loading more, empty (no data found message), error with retry, no internet, and permission denied.
- Forms: validation like the web app, field errors from the backend, loading on the button, success feedback and correct navigation after success.
- Respect the role: hide or disable what the role cannot do, and never rely on hiding alone (the backend also enforces it, handle its 403).
- Check that the data on the screen matches what the web app shows for the same user and role.
- Keep screens thin: data fetching and mapping in a service or hook, UI in the component.

## 7. Phase 3, chat, messages, notifications

- Chat and messages: check how the web app and backend do it (REST, sockets, events, rooms). Implement the same on mobile with the right lifecycle: connect after login, reconnect on network change, disconnect on logout, no duplicate listeners, unread counts, message status, scroll behavior, keyboard handling, pagination of old messages.
- Push and in app notifications: check what the backend uses (FCM or another service). Handle permission request, device token registration and removal on logout, foreground, background and quit state, and opening the correct screen when a notification is tapped, for each role.

## 8. Phase 4, hardening and final review

- Every screen of every role checked against its states (loading, empty, error, offline, permission denied).
- No hardcoded URLs, keys, tokens or test data. No console.log. No unused code, files or packages.
- Release safety: debug code off for production, HTTPS only, no secrets in the app bundle beyond what is public by design.
- Performance: large lists use proper list components with stable keys, images are sized, and there are no needless re renders in busy screens.
- Accessibility basics and correct keyboard and safe area behavior on Android and iOS.
- Update README with how to run the app, env variables and how to build a release. No marketing language.
- Give me a full manual test plan per role for my physical device.

## 9. Rules that always apply

- Follow the existing code style, folder structure and naming in the mobile project. Keep the code simple and readable. No unnecessary abstraction, no new patterns, no extra files or packages that are not needed.
- Ask me before adding or upgrading any package. Give me the exact install command and let me run it.
- Never write real passwords, tokens or secrets into any file. For test accounts, tell me what you need and I will provide them through env or the app login.
- Do not change native folders (android, ios) or app config unless a task truly needs it, and tell me first.
- If something is unclear in the web app or backend, make the safest decision, tell me in one line, and continue. Do not stop for small questions.
- Never say a feature is done or tested on a device. Only I can confirm device tests.