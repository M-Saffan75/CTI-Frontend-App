# Seller hardcoded user-facing strings

Total fixed strings: 663. Built from pieces or plural rules: 161.
(Machine-extracted for the Language step. A few non-UI strings may appear and a few UI strings may be missed; re-run after the fixes.)

## Count per folder
- src/roles/Seller/components/DateRangeField.tsx: 0
- src/roles/Seller/components/DateRangeModal.tsx: 3
- src/roles/Seller/components/InitialsAvatar.tsx: 0
- src/roles/Seller/components/ReasonModal.tsx: 1
- src/roles/Seller/components/SellerHeader.tsx: 0
- src/roles/Seller/components/SellerScreenHeader.tsx: 0
- src/roles/Seller/components/SellerTopTabs.tsx: 8
- src/roles/Seller/components/StatusPills.tsx: 0
- src/roles/Seller/features/Ads: 68
- src/roles/Seller/features/Auth: 48
- src/roles/Seller/features/Dashboard: 23
- src/roles/Seller/features/Enquiries: 33
- src/roles/Seller/features/Invoices: 15
- src/roles/Seller/features/Orders: 110
- src/roles/Seller/features/Product: 61
- src/roles/Seller/features/Profile: 105
- src/roles/Seller/features/Reports: 25
- src/roles/Seller/features/Reviews: 18
- src/roles/Seller/features/Settings: 20
- src/roles/Seller/features/Wallet: 45
- src/roles/Seller/navigation/SellerAuthStack.tsx: 8
- src/roles/Seller/navigation/SellerNavigator.tsx: 16
- src/roles/Seller/navigation/SellerTabs.tsx: 6
- src/roles/Seller/screens/SellerHomeScreen.tsx: 0
- src/roles/Seller/screens/SellerManageScreen.tsx: 0
- src/roles/Seller/services/sellerApi.ts: 0
- src/roles/Seller/utils/invoiceDownload.ts: 13
- src/roles/Seller/utils/sellerUtils.ts: 0
- src/roles/Seller/utils/statusStyles.ts: 35
- src/roles/Seller/utils/usePagedList.ts: 2

## src/roles/Seller/components/DateRangeField.tsx  (fixed: 0, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L18: jsx: export default function DateRangeField({ label, from, to, onPress, onClear }: Props) {

## src/roles/Seller/components/DateRangeModal.tsx  (fixed: 3, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L31: jsx: export default function DateRangeModal({ visible, title, from, to, onApply, onClose }: Props) {
- L115: jsx: inRange ? { backgroundColor: colors.primary + '25' } : null,
- L116: jsx: selected ? [styles.selectedCell, { backgroundColor: colors.primary }] : null,

**Fixed strings:**
- L108: text: "start && day"
- L137: title: "Cancel"
- L145: title: "Apply"

## src/roles/Seller/components/InitialsAvatar.tsx  (fixed: 0, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L13: jsx: export default function InitialsAvatar({ name, photo, size = 42 }: Props) {

## src/roles/Seller/components/ReasonModal.tsx  (fixed: 1, built from pieces: 0)

**Fixed strings:**
- L75: title: "Cancel"

## src/roles/Seller/components/SellerHeader.tsx  (fixed: 0, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L11: jsx: export default function SellerHeader({ navigation }) {

## src/roles/Seller/components/SellerScreenHeader.tsx  (fixed: 0, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L16: jsx: export default function SellerScreenHeader({ title, subtitle, onBack }: Props) {

## src/roles/Seller/components/SellerTopTabs.tsx  (fixed: 8, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L30: jsx: export default function SellerTopTabs({ activeTab, onChange }) {
- L43: jsx: scrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });

**Fixed strings:**
- L20: label: "Product"
- L21: label: "Order Management"
- L22: label: "Wallet"
- L23: label: "Ads"
- L24: label: "Reported"
- L25: label: "Invoices"
- L26: label: "Enquiries"
- L27: label: "Reviews"

## src/roles/Seller/components/StatusPills.tsx  (fixed: 0, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L20: jsx: export default function StatusPills({ options, selected, onSelect }: Props) {

## src/roles/Seller/features/Ads/screens/AdsScreen.tsx  (fixed: 40, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L82: jsx: function DataRow({ label, value }: { label: string; value: string }) {
- L92: jsx: export default function AdsScreen({ navigation, isActive = true }: any) {

**Fixed strings:**
- L29: label: "All"
- L30: label: "Active"
- L31: label: "Under review"
- L32: label: "Paused"
- L33: label: "Draft"
- L34: label: "Rejected"
- L35: label: "Completed"
- L42: title: "Pause campaign?"
- L43: message: "Your ads stop showing until you resume the campaign."
- L47: title: "Resume campaign?"
- L48: message: "Your ads start showing again and the remaining budget is used."
- L52: title: "Submit for approval?"
- L53: message: "The campaign goes to the admin for review. You cannot edit it while it is under review."
- L57: title: "Delete campaign?"
- L58: message: "This removes the campaign. This cannot be undone."
- L162: title: "Action failed"
- L193: label: "Runs"
- L195: label: "Total budget"
- L196: label: "Daily budget"
- L197: label: "Spent"
- L198: label: "Remaining"
- L199: label: "Bidding"
- L201: label: "Impressions"
- L202: label: "Clicks"
- L203: label: "Card"
- L215: text: "No budget left. Add budget on the website to resume."
- L226: title: "Pause"
- L237: title: "Resume"
- L247: title: "Submit for approval"
- L257: title: "Edit on the website"
- L267: title: "Delete"
- L284: label: "Impressions"
- L285: label: "Clicks"
- L286: label: "Spend"
- L287: label: "CTR"
- L294: text: "Advertisement Campaigns"
- L299: title: "Create Campaign"
- L318: text: "Loading campaigns..."
- L325: title: "No Campaigns Found"
- L378: title: "Could not load campaigns"

## src/roles/Seller/features/Ads/screens/CreateCampaignScreen.tsx  (fixed: 28, built from pieces: 12)

**Built from pieces or plural rules (hard to translate):**
- L60: jsx: export default function CreateCampaignScreen({ navigation }: any) {
- L131: jsx: setAlert({ visible: true, type: 'error', title: 'Could not load cards', message: err?.message \|\| 'Please try again.' });
- L160: jsx: setAlert({ visible: true, type: 'error', title: 'Image error', message: response.errorMessage \|\| 'Could not select the image.' });
- L164: jsx: setAlert({ visible: true, type: 'error', title: 'Banner too large', message: 'The banner must be under 2 MB.' });
- L167: jsx: setBanner({ uri: asset.uri, type: asset.type \|\| 'image/jpeg', name: asset.fileName \|\| 'banner.jpg' });
- L185: tpl: `Minimum daily budget is ${formatMoney(settings?.minDailyBudget)}`
- L189: tpl: `Minimum total budget is ${formatMoney(settings?.minTotalBudget)}`
- L247: tpl: `${err?.message \|\| 'Submit failed.'} Your campaign is saved as a draft. Tap Create again to retry the submit.`
- L359: jsx: Products{selectedIds.length > 0 ? ` (${selectedIds.length} selected)` : ''}
- L426: tpl: `Min ${formatMoney(settings.minDailyBudget)}`
- L441: tpl: `Min ${formatMoney(settings.minTotalBudget)}`
- L449: jsx: Estimated end date: {formatDate(endDate)}. Pay per click: {formatMoney(settings.costPerClick)}.

**Fixed strings:**
- L131: title: "Could not load cards"
- L160: title: "Image error"
- L164: title: "Banner too large"
- L164: message: "The banner must be under 2 MB."
- L179: name: "Campaign name is required"
- L180: name: "Name must be at least 3 characters"
- L235: title: "Campaign submitted"
- L271: text: "Loading..."
- L277: text: "Advertising is not available"
- L287: text: "Campaign type"
- L290: title: "Sponsored Products"
- L291: title: "Sponsored Store"
- L311: text: "Details"
- L312: text: "Campaign name"
- L320: placeholder: "e.g. Summer sale"
- L333: placeholder: "A short line shown with your banner"
- L338: text: "Store banner"
- L366: placeholder: "Search your products"
- L372: text: "You have no products yet. Add a product first."
- L391: text: "No product matches your search."
- L400: text: "Schedule and budget"
- L401: text: "Start date"
- L455: text: "Payment card"
- L461: title: "Add a card on the website"
- L463: title: "I added a card, check again"
- L526: title: "Create Campaign"
- L526: subtitle: "Promote your products or store"
- L533: title: "Start date"

## src/roles/Seller/features/Auth/api/authApi.ts  (fixed: 0, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L31: jsx: export async function forgotPassword({ emailOrPhone }: { emailOrPhone: string }) {

## src/roles/Seller/features/Auth/screens/ForgotPasswordScreen.tsx  (fixed: 6, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L12: jsx: export default function ForgotPasswordScreen({ navigation }: any) {
- L30: jsx: navigation.navigate('VerifyOtp', { email: emailOrPhone, next: 'ResetPassword' });

**Fixed strings:**
- L34: title: "Reset Request Failed"
- L44: title: "Forgot Password?"
- L45: subtitle: "Enter your email or phone to reset your password"
- L48: label: "Enter your Email or Phone"
- L54: placeholder: "example@gmail.com"
- L63: title: "Continue"

## src/roles/Seller/features/Auth/screens/LoginScreen.tsx  (fixed: 13, built from pieces: 4)

**Built from pieces or plural rules (hard to translate):**
- L15: jsx: export default function LoginScreen({ navigation, onLoggedIn }: any) {
- L98: jsx: if (errors.email) setErrors({ ...errors, email: '' });
- L113: jsx: if (errors.password) setErrors({ ...errors, password: '' });
- L138: jsx: Don't have an account?{' '}

**Fixed strings:**
- L28: buttonText: "Okay"
- L48: title: "Verification Required"
- L50: buttonText: "Verify Now"
- L79: title: "Login Failed"
- L81: buttonText: "Okay"
- L91: title: "Welcome Back"
- L94: label: "Email"
- L100: placeholder: "example@gmail.com"
- L109: label: "Password"
- L125: label: "Remember me"
- L127: text: "Forgot Password?"
- L133: title: "Login"
- L141: text: "Sign up"

## src/roles/Seller/features/Auth/screens/ResetPasswordScreen.tsx  (fixed: 7, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L15: jsx: export default function ResetPasswordScreen({ navigation, route }: any) {
- L61: jsx: if (errors.password) setErrors({ ...errors, password: '' });
- L77: jsx: if (errors.confirm) setErrors({ ...errors, confirm: '' });

**Fixed strings:**
- L45: title: "Reset Failed"
- L54: title: "Reset Your Password"
- L54: subtitle: "Enter a new password to secure your account"
- L57: label: "New Password"
- L73: label: "Confirm Password"
- L89: title: "Continue"
- L97: text: "Back to login"

## src/roles/Seller/features/Auth/screens/ResetSuccessScreen.tsx  (fixed: 2, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L12: jsx: export default function ResetSuccessScreen({ navigation }) {

**Fixed strings:**
- L17: name: "Login"
- L46: title: "Back to  home"

## src/roles/Seller/features/Auth/screens/SignUpScreen.tsx  (fixed: 15, built from pieces: 9)

**Built from pieces or plural rules (hard to translate):**
- L27: jsx: export default function SignUpScreen({ navigation }: any) {
- L57: jsx: navigation.navigate('VerifyOtp', { email });
- L75: jsx: Signing up as{' '}
- L87: jsx: if (errors.name) setErrors({ ...errors, name: '' });
- L101: jsx: if (errors.email) setErrors({ ...errors, email: '' });
- L117: jsx: if (errors.phone) setErrors({ ...errors, phone: '' });
- L132: jsx: if (errors.password) setErrors({ ...errors, password: '' });
- L149: jsx: if (errors.confirm) setErrors({ ...errors, confirm: '' });
- L189: jsx: Already have an account?{' '}

**Fixed strings:**
- L61: title: "Registration Error"
- L70: title: "Create an Account"
- L70: subtitle: "Create your account to get started"
- L83: label: "Full Name"
- L89: placeholder: "John Doe"
- L97: label: "Email"
- L103: placeholder: "example@gmail.com"
- L113: label: "Phone Number"
- L119: placeholder: "03xx xxxxxxx"
- L128: label: "Password"
- L145: label: "Confirm Password"
- L161: title: "Sign Up"
- L172: text: "Or"
- L177: title: "Google"
- L192: text: "Login"

## src/roles/Seller/features/Auth/screens/VerifyOtpScreen.tsx  (fixed: 5, built from pieces: 7)

**Built from pieces or plural rules (hard to translate):**
- L14: jsx: export default function VerifyOtpScreen({ navigation, route, onLoggedIn: _onLoggedIn }: any) {
- L46: jsx: message: `A new verification code was sent to ${email \|\| 'your email'}.`,
- L46: tpl: `A new verification code was sent to ${email \|\| 'your email'}.`
- L71: jsx: navigation.navigate('ResetPassword', { email, otp });
- L74: jsx: navigation.navigate('KycHandoff', { role: 'seller', email });
- L100: tpl: `Enter the 6-digit code sent to ${email ? email : 'your email'}`
- L132: tpl: `Resend OTP in ${timer}s`

**Fixed strings:**
- L45: title: "OTP Resent"
- L55: title: "Resend Failed"
- L82: title: "Verification Failed"
- L99: title: "Verify OTP"
- L115: title: "Submit"

## src/roles/Seller/features/Dashboard/components/AdvertisingBarChart.tsx  (fixed: 0, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L11: jsx: export default function AdvertisingBarChart({ data }: { data: AdBarPoint[] }) {
- L28: jsx: height: `${heightPercent}%`,

## src/roles/Seller/features/Dashboard/components/RevenueTrendChart.tsx  (fixed: 0, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L18: jsx: export default function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
- L75: jsx: Best day: {peak.tooltipValue}

## src/roles/Seller/features/Dashboard/screens/DashboardScreen.tsx  (fixed: 23, built from pieces: 4)

**Built from pieces or plural rules (hard to translate):**
- L49: jsx: export default function DashboardScreen({ onSelectTab, navigation, isActive = true }: any) {
- L175: tpl: `${growth > 0 ? '+' : ''}${growth}% vs previous week`
- L213: jsx: Welcome back{sellerName ? `, ${sellerName}` : ''}!
- L309: jsx: Last 7 days impressions, {overview.advertising.activeCampaigns} active{' '}

**Fixed strings:**
- L108: title: "Pending Orders"
- L109: subtitle: "Need to be processed"
- L115: title: "Pending Documents"
- L116: subtitle: "KYC / bank details"
- L122: title: "Order Questions"
- L123: subtitle: "Open customer order queries"
- L129: title: "Product Questions"
- L130: subtitle: "Open customer product queries"
- L136: title: "Return Requests"
- L137: subtitle: "Awaiting your response"
- L165: text: "Loading dashboard..."
- L255: text: "Today's Revenue"
- L271: text: "Last 7 Days"
- L289: text: "Revenue Trend"
- L295: text: "7 Days"
- L307: text: "Advertising Performance"
- L315: text: "7 Days →"
- L323: title: "No ad activity"
- L323: message: "No impressions in the last 7 days."
- L335: text: "Action Required"
- L348: title: "All caught up"
- L348: message: "Nothing needs your attention right now."
- L376: title: "Refresh failed"

## src/roles/Seller/features/Enquiries/screens/EnquiriesScreen.tsx  (fixed: 11, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L43: jsx: export default function EnquiriesScreen({ navigation, isActive = true, params }: any) {
- L203: tpl: `You do not have any ${type === 'order' ? 'order' : 'product'} enquiries yet.`

**Fixed strings:**
- L101: label: "All"
- L102: label: "Open"
- L103: label: "Replied"
- L104: label: "Closed"
- L154: text: "Customer Enquiries"
- L163: label: "Product Queries"
- L164: label: "Order Queries"
- L177: placeholder: "Search customers..."
- L192: text: "Loading enquiries..."
- L199: title: "No messages found"
- L239: title: "Could not load enquiries"

## src/roles/Seller/features/Enquiries/screens/SellerQueryDetailScreen.tsx  (fixed: 22, built from pieces: 4)

**Built from pieces or plural rules (hard to translate):**
- L51: jsx: export default function SellerQueryDetailScreen({ navigation, route }: any) {
- L73: jsx: setAlert({ visible: true, type, title, message });
- L155: jsx: showAlert('info', 'Open in your browser', `We could not open the file on this phone. Please open this address:\n${url}`);
- L357: jsx: function InfoRow({ label, value }: { label: string; value: string }) {

**Fixed strings:**
- L91: alert-title: "Could not refresh"
- L124: alert-title: "Reply not sent"
- L146: alert-title: "Update failed"
- L155: alert-title: "Open in your browser"
- L197: text: "Loading enquiry..."
- L220: label: "Query ID"
- L221: label: "Created"
- L222: label: "Email"
- L223: label: "Phone"
- L226: label: "Order No"
- L227: label: "Order status"
- L228: label: "Amount"
- L231: title: "View order"
- L242: title: "Reopen query"
- L250: title: "Close query"
- L262: text: "No messages yet"
- L292: title: "Enquiry"
- L314: placeholder: "Type your reply..."
- L324: title: "Send"
- L338: title: "Close this query?"
- L339: message: "The customer will not be able to reply to this thread anymore. You can reopen it at any time."
- L340: confirmText: "Close query"

## src/roles/Seller/features/Invoices/screens/InvoicesScreen.tsx  (fixed: 15, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L43: jsx: function DataRow({ label, value }: { label: string; value: string }) {
- L53: jsx: export default function InvoicesScreen({ isActive = true }: any) {
- L111: jsx: message: `Open ${WEB_SELLER_INVOICES_URL} in your browser.`,

**Fixed strings:**
- L26: label: "All"
- L27: label: "Under Review"
- L28: label: "Approved"
- L29: label: "Rejected"
- L110: title: "Could not open the website"
- L127: label: "Submitted"
- L128: label: "Approved"
- L136: title: "Download PDF"
- L146: text: "No PDF uploaded yet."
- L150: title: "Re-upload on the website"
- L167: text: "Invoices"
- L176: title: "Open invoices on the website"
- L184: text: "Loading invoices..."
- L191: title: "No Invoices Found"
- L233: title: "Could not load invoices"

## src/roles/Seller/features/Orders/screens/CancelledOrdersScreen.tsx  (fixed: 16, built from pieces: 4)

**Built from pieces or plural rules (hard to translate):**
- L31: jsx: export default function CancelledOrdersScreen({ navigation }: any) {
- L97: tpl: `${item.firstItemTitle}${item.itemsCount > 1 ? `
- L190: jsx: setRange({ from, to });
- L207: jsx: function Row({ label, value }: { label: string; value: string }) {

**Fixed strings:**
- L70: label: "All"
- L71: label: "Customer"
- L72: label: "My cancellations"
- L73: label: "System"
- L93: label: "Customer"
- L100: label: "Reason"
- L101: label: "Cancelled"
- L103: text: "Total"
- L113: title: "Cancelled Orders"
- L114: subtitle: "Orders cancelled by customers, by you or by the system"
- L123: placeholder: "Search order, customer or product"
- L133: label: "Date"
- L144: text: "Loading cancelled orders..."
- L151: title: "No Cancelled Orders"
- L186: title: "Cancelled orders date"
- L199: title: "Could not load orders"

## src/roles/Seller/features/Orders/screens/OrderManagementScreen.tsx  (fixed: 21, built from pieces: 4)

**Built from pieces or plural rules (hard to translate):**
- L46: jsx: export default function OrderManagementScreen({ navigation, isActive = true }: any) {
- L229: jsx: selected && { backgroundColor: colors.surfaceAlt },
- L266: jsx: Orders{!list.loading && !list.error ? ` (${list.total})` : ''}
- L320: jsx: else setOrderRange({ from, to });

**Fixed strings:**
- L28: label: "All statuses"
- L29: label: "Pending"
- L30: label: "Processing"
- L31: label: "Shipping"
- L32: label: "Shipped"
- L33: label: "Delivered"
- L34: label: "Cancelled"
- L122: text: "Customer"
- L141: text: "Ordered"
- L146: text: "Completed"
- L153: text: "Total"
- L165: text: "Order management"
- L166: text: "Track and update all your orders"
- L171: text: "Cancelled Order"
- L176: text: "Return Order"
- L184: placeholder: "Search order, customer or product"
- L251: label: "Order Date"
- L258: label: "Completion Date"
- L273: text: "Loading orders..."
- L280: title: "No Orders Found"
- L329: title: "Could not load orders"

## src/roles/Seller/features/Orders/screens/ReturnRequestsScreen.tsx  (fixed: 47, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L62: jsx: export default function ReturnRequestsScreen({ navigation }: any) {
- L114: jsx: setAlert({ visible: true, type, title, message });
- L175: jsx: Order {item.orderNo \|\| '-'}  \|  {formatDate(item.createdAt)}
- L301: tpl: `This deducts ${formatMoney(approveNumbers.amountToCut)} from your wallet balance. The customer is refunded ${formatMoney(approveNumbers.totalRefund)}, including ${formatMoney(approveTarget?.platformFee)} platform fee paid by admin.`
- L344: jsx: function Row({ label, value }: { label: string; value: string }) {

**Fixed strings:**
- L105: label: "All Returns"
- L106: label: "New Requests"
- L107: label: "Shipped Back"
- L108: label: "Approved"
- L109: label: "Rejected"
- L117: text: "Promise"
- L185: label: "Customer"
- L186: label: "Product"
- L187: label: "Reason"
- L188: label: "Price"
- L189: label: "Your cut"
- L191: label: "Rejected because"
- L196: title: "Details"
- L206: title: "Approve"
- L213: title: "Reject"
- L231: title: "Return Requests"
- L232: subtitle: "Review and respond to customer returns"
- L241: placeholder: "Search return, order, customer or product"
- L254: text: "Loading returns..."
- L261: title: "No Returns Found"
- L298: title: "Approve return"
- L304: placeholder: "Notes (optional)"
- L305: confirmText: "Approve"
- L313: title: "Reject return"
- L314: message: "Tell the customer why this return is rejected."
- L315: placeholder: "Explain why you are rejecting this return"
- L316: confirmText: "Reject"
- L336: title: "Could not load returns"
- L369: label: "Status"
- L370: label: "Order"
- L371: label: "Customer"
- L372: label: "Product"
- L373: label: "Barcode"
- L374: label: "Quantity"
- L375: label: "Price"
- L376: label: "Platform fee"
- L377: label: "Net earnings deduction"
- L378: label: "Customer refund"
- L379: label: "Refund status"
- L380: label: "Return tracking"
- L381: label: "Created"
- L382: label: "Approved"
- L383: label: "Rejected"
- L384: label: "Reason"
- L385: label: "Notes"
- L386: label: "Rejection reason"
- L396: title: "Close"

## src/roles/Seller/features/Orders/screens/SellerOrderDetailScreen.tsx  (fixed: 26, built from pieces: 8)

**Built from pieces or plural rules (hard to translate):**
- L57: jsx: export default function SellerOrderDetailScreen({ navigation, route }: any) {
- L73: jsx: setAlert({ visible: true, type, title, message });
- L118: jsx: showAlert('info', 'Open in your browser', `We could not open the link on this phone. Please open this address:\n${url}`);
- L130: jsx: emitOrderChanged({ id: orderKey, status: res.orderStatus, completionDate: res.completionDate });
- L172: jsx: addr.postalCode ? `Postal code: ${addr.postalCode}` : '',
- L172: tpl: `Postal code: ${addr.postalCode}`
- L263: jsx: Platform fee {formatMoney(item.platformFee)}  \|  Your earnings {formatMoney(item.sellerEarnings)}
- L387: jsx: function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {

**Fixed strings:**
- L91: alert-title: "Could not refresh"
- L118: alert-title: "Open in your browser"
- L143: alert-title: "Update failed"
- L154: text: "Loading order..."
- L179: text: "Status"
- L192: label: "Order"
- L193: label: "Ordered"
- L194: label: "Completed"
- L195: label: "Payment"
- L198: label: "Cancelled by"
- L199: label: "Reason"
- L236: text: "Next step on the website"
- L239: title: "Continue on the website"
- L274: text: "Buyer and shipping address"
- L288: text: "Summary"
- L289: label: "Sub total"
- L290: label: "Platform fee"
- L292: label: "Shipping fee"
- L294: label: "Your earnings"
- L298: text: "Shipment"
- L301: label: "Status"
- L303: label: "Tracking number"
- L306: label: "Shipping cost"
- L311: title: "Track shipment"
- L319: title: "Open shipping label"
- L358: text: "Order Details"

## src/roles/Seller/features/Product/components/OptionPickerModal.tsx  (fixed: 1, built from pieces: 0)

**Fixed strings:**
- L25: emptyText: "No options available."

## src/roles/Seller/features/Product/screens/AddProductScreen.tsx  (fixed: 31, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L62: jsx: export default function AddProductScreen({ navigation }: any) {
- L114: jsx: message: `You can add up to ${MAX_IMAGES} images here. Add more on the website.`,
- L114: tpl: `You can add up to ${MAX_IMAGES} images here. Add more on the website.`
- L136: jsx: name: a.fileName \|\| `product-${Date.now()}-${i}.jpg`,
- L222: jsx: message: `The full product form is available on the website:\n\n${WEB_SELLER_PRODUCT_ADD_URL}`,

**Fixed strings:**
- L93: title: "Could not load categories"
- L113: title: "Limit reached"
- L127: title: "Image error"
- L149: title: "Title is required"
- L151: description: "Description is required"
- L191: title: "Product created"
- L207: title: "Creation failed"
- L221: title: "Open the website"
- L263: text: "Add New Product"
- L275: text: "Basic Information"
- L279: text: "Title"
- L282: placeholder: "e.g. Premium Cotton T-shirt"
- L295: text: "Model Number"
- L298: placeholder: "e.g. MOD-1234"
- L315: placeholder: "One line summary"
- L324: text: "Description"
- L327: placeholder: "Detail product description"
- L348: text: "Categorization"
- L352: text: "Category"
- L367: name: "Select category"
- L387: name: "Select brand"
- L399: text: "Pricing and Stock"
- L403: text: "Base Price"
- L420: text: "Stock"
- L443: text: "Product Images"
- L475: text: "Add"
- L488: text: "Need more options?"
- L494: title: "Open full form on website"
- L514: title: "Cancel"
- L526: title: "Select category"
- L538: title: "Select brand"

## src/roles/Seller/features/Product/screens/ImportExportScreen.tsx  (fixed: 9, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L22: jsx: export default function ImportExportScreen({ navigation }: any) {
- L54: jsx: Products {item.totalProducts}  \|  Imported {item.imported}  \|  Skipped {item.skipped}

**Fixed strings:**
- L71: title: "Import / Export"
- L71: subtitle: "Products in CSV files"
- L76: title: "Open import and export on the website"
- L78: text: "Import history"
- L84: text: "Loading history..."
- L91: title: "No imports yet"
- L92: message: "Imports you make on the website appear here."
- L125: title: "Could not open the website"
- L132: title: "Could not load history"

## src/roles/Seller/features/Product/screens/ProductListScreen.tsx  (fixed: 20, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L73: jsx: export default function ProductListScreen({ navigation, isActive = true }: any) {
- L113: jsx: setAlert({ visible: true, type, title, message });
- L250: jsx: showAlert('info', 'Open the website', `This is available on the website:\n\n${url}`);
- L473: jsx: Showing {products.length} of {totalItems} products
- L555: tpl: `Are you sure you want to delete "${deleteTarget?.name ?? ''}"?`

**Fixed strings:**
- L148: alert-title: "Could not load products"
- L221: alert-title: "Status update failed"
- L238: alert-title: "Product deleted"
- L241: alert-title: "Delete failed"
- L250: alert-title: "Open the website"
- L336: text: "Edit on website"
- L343: text: "Variants"
- L363: text: "Products"
- L371: text: "Add"
- L380: placeholder: "Search by name, SKU, model or barcode"
- L391: placeholder: "Model number"
- L402: placeholder: "Barcode"
- L444: name: "All Categories"
- L464: name: "All Brands"
- L481: text: "Loading products..."
- L488: title: "No Products Found"
- L529: title: "Select category"
- L541: title: "Select brand"
- L554: title: "Delete product"
- L556: confirmText: "Delete"

## src/roles/Seller/features/Profile/components/BankModal.tsx  (fixed: 12, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L27: jsx: export default function BankModal({ visible, seller, onClose, onSaved }: Props) {

**Fixed strings:**
- L68: title: "Bank Details"
- L69: subtitle: "Used for your wallet withdrawals"
- L75: label: "Account Title"
- L75: placeholder: "Account title"
- L76: label: "Account Number"
- L76: placeholder: "Account number"
- L77: label: "Bank Name"
- L77: placeholder: "Bank name"
- L78: label: "Branch Name"
- L78: placeholder: "Branch name"
- L79: label: "IBAN"
- L79: placeholder: "IBAN"

## src/roles/Seller/features/Profile/components/EditModalShell.tsx  (fixed: 2, built from pieces: 0)

**Fixed strings:**
- L87: title: "Cancel"
- L95: title: "Save Changes"

## src/roles/Seller/features/Profile/components/FormParts.tsx  (fixed: 1, built from pieces: 0)

**Fixed strings:**
- L144: text: "Loading..."

## src/roles/Seller/features/Profile/components/PhotoPreviewModal.tsx  (fixed: 3, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L16: jsx: export default function PhotoPreviewModal({ visible, kind, uri, uploading, onCancel, onUpload }: Props) {

**Fixed strings:**
- L25: text: "Check the picture, then upload it."
- L35: title: "Cancel"
- L36: title: "Upload"

## src/roles/Seller/features/Profile/components/ScheduleModal.tsx  (fixed: 5, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L23: jsx: export default function ScheduleModal({ visible, seller, onClose, onSaved }: Props) {

**Fixed strings:**
- L81: title: "Working Schedule"
- L82: subtitle: "When your store is open"
- L89: text: "Working Days"
- L110: label: "Opening Time"
- L111: label: "Closing Time"

## src/roles/Seller/features/Profile/components/SocialModal.tsx  (fixed: 18, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L42: jsx: export default function SocialModal({ visible, seller, onClose, onSaved }: Props) {
- L59: tpl: `${label} must be a full link that starts with https://`

**Fixed strings:**
- L19: label: "Facebook"
- L19: placeholder: "https://facebook.com/yourpage"
- L20: label: "Instagram"
- L20: placeholder: "https://instagram.com/yourprofile"
- L21: label: "X (Twitter)"
- L21: placeholder: "https://x.com/yourhandle"
- L22: label: "LinkedIn"
- L22: placeholder: "https://linkedin.com/in/yourprofile"
- L23: label: "WhatsApp"
- L23: placeholder: "https://wa.me/905551234567"
- L24: label: "YouTube"
- L24: placeholder: "https://youtube.com/@yourchannel"
- L25: label: "TikTok"
- L25: placeholder: "https://tiktok.com/@yourprofile"
- L26: label: "Website"
- L26: placeholder: "https://yourstore.com"
- L83: title: "Social Links"
- L84: subtitle: "Shown on your store profile"

## src/roles/Seller/features/Profile/components/StoreInfoModal.tsx  (fixed: 22, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L21: jsx: export default function StoreInfoModal({ visible, seller, onClose, onSaved }: Props) {
- L122: jsx: onSaved({ name: payload.fullName, businessName: payload.businessName });

**Fixed strings:**
- L134: title: "Store Information"
- L135: subtitle: "Update your personal and store details"
- L141: label: "Full Name"
- L141: placeholder: "Your full name"
- L142: label: "Business / Store Name"
- L142: placeholder: "Store name"
- L143: label: "Phone Number"
- L144: label: "Email Address"
- L144: helper: "Email address cannot be changed here."
- L145: label: "Store Address"
- L145: placeholder: "Full store address"
- L147: label: "Country"
- L152: placeholder: "Select country"
- L153: emptyText: "No countries found"
- L162: label: "State"
- L170: emptyText: "No states found"
- L178: label: "City"
- L186: emptyText: "No cities found"
- L189: label: "ZIP / Postal Code"
- L189: placeholder: "Postal code"
- L190: label: "Store Description"
- L190: placeholder: "Describe your store..."

## src/roles/Seller/features/Profile/screens/SellerProfileScreen.tsx  (fixed: 42, built from pieces: 8)

**Built from pieces or plural rules (hard to translate):**
- L127: jsx: export default function SellerProfileScreen({ navigation, route }: any) {
- L152: jsx: AuthService.updateStoredUser({ avatar: data.profilePictureOrLogo, profileImage: data.profilePictureOrLogo });
- L187: jsx: setPending({ kind, image: { uri: asset.uri, type: asset.type, fileName: asset.fileName } });
- L190: jsx: setAlert({ type: 'error', title: 'Photo', message: 'Could not open your photo library.' });
- L203: jsx: setAlert({ type: 'success', title: 'Success', message: message \|\| 'Profile updated successfully.' });
- L206: jsx: setAlert({ type: 'error', title: 'Upload Failed', message: normalizeApiError(e).message });
- L214: jsx: navigation?.setParams?.({ editSection: undefined });
- L440: tpl: `Open this address in your browser:\n${failedLink}`

**Fixed strings:**
- L92: text: "Edit"
- L190: title: "Photo"
- L190: message: "Could not open your photo library."
- L203: title: "Success"
- L206: title: "Upload Failed"
- L228: text: "Loading profile..."
- L309: title: "Store Information"
- L310: label: "Full Name"
- L311: label: "Business Name"
- L312: label: "Phone"
- L313: label: "Email"
- L314: label: "Store Address"
- L315: label: "Country"
- L316: label: "State"
- L317: label: "City"
- L318: label: "ZIP Code"
- L319: label: "Store Description"
- L322: title: "Bank Details"
- L325: label: "Account Title"
- L326: label: "Account No."
- L327: label: "Bank"
- L328: label: "Branch"
- L329: label: "IBAN"
- L338: title: "Social Links"
- L340: text: "No social links added yet."
- L359: title: "Working Schedule"
- L360: label: "Working Days"
- L363: label: "Business Hours"
- L372: title: "Account Status"
- L373: label: "KYC Status"
- L374: label: "Account"
- L375: label: "Sells Refurbished"
- L376: label: "Commission Rate"
- L377: label: "Shipping Method"
- L379: label: "KYC Updated"
- L383: title: "KYC Documents"
- L384: label: "Profile Photo"
- L385: label: "National ID"
- L386: label: "Shop License"
- L387: label: "Proof of Address"
- L392: title: "Edit on the website"
- L439: title: "Open on the website"

## src/roles/Seller/features/Profile/services/sellerProfileApi.ts  (fixed: 0, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L27: jsx: userId?: { email?: string } \| string \| null;
- L44: jsx: workingHours?: { start?: string; end?: string };
- L69: jsx: workingHours?: { start: string; end: string };

## src/roles/Seller/features/Reports/screens/ReportsScreen.tsx  (fixed: 25, built from pieces: 8)

**Built from pieces or plural rules (hard to translate):**
- L37: jsx: function buildRange(filter: string, custom: { from: string; to: string }) {
- L67: jsx: export default function ReportsScreen({ isActive = true }: any) {
- L92: jsx: result.push({ kind: 'group', key: `g-${group.date}`, group, open });
- L97: jsx: key: `r-${group.date}-${row.id}`,
- L113: jsx: setLinkMessage(`We could not open the link on this phone. Please open this address:\n${WEB_SELLER_REPORTS_URL}`);
- L254: jsx: setCustom({ from, to });
- L278: jsx: function SummaryCard({ label, value }: { label: string; value: string }) {
- L288: jsx: function Amount({ label, value }: { label: string; value: string }) {

**Fixed strings:**
- L29: label: "Today"
- L30: label: "Yesterday"
- L31: label: "Last 7 Days"
- L32: label: "Last 14 Days"
- L33: label: "Last 30 Days"
- L34: label: "Custom"
- L155: label: "Amount"
- L156: label: "Hold"
- L157: label: "Earned"
- L166: text: "Reports & Account Statement"
- L172: title: "Download statement on the website"
- L181: label: "Custom period"
- L191: label: "Total Revenue"
- L192: label: "Total Earned (Available)"
- L193: label: "Total Pending (Hold)"
- L194: label: "Total Orders"
- L198: text: "Transaction history"
- L207: title: "Select a period"
- L208: message: "Choose the start and end day to see your statement."
- L213: text: "Loading statement..."
- L220: title: "No Transactions"
- L221: message: "There are no orders in this period."
- L250: title: "Statement period"
- L263: title: "Open in your browser"
- L270: title: "Could not refresh"

## src/roles/Seller/features/Reviews/screens/ReviewsScreen.tsx  (fixed: 18, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L47: jsx: export default function ReviewsScreen({ isActive = true }: any) {

**Fixed strings:**
- L28: label: "All"
- L29: label: "5 stars"
- L30: label: "4 stars"
- L31: label: "3 stars"
- L32: label: "2 stars"
- L33: label: "1 star"
- L98: title: "Review deleted"
- L107: title: "Delete failed"
- L117: text: "No rating"
- L162: text: "+ video"
- L169: text: "Delete review"
- L178: text: "Product Reviews"
- L188: placeholder: "Search customer, comment or product"
- L203: text: "Loading reviews..."
- L210: title: "No Reviews Found"
- L245: title: "Delete review?"
- L246: message: "This review is removed from your product and the product rating is recalculated. This cannot be undone."
- L263: title: "Could not load reviews"

## src/roles/Seller/features/Settings/screens/SettingsScreen.tsx  (fixed: 20, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L74: jsx: function MenuRow({ item, navigation, badge }: { item: MenuItem; navigation: any; badge?: number }) {
- L107: jsx: export default function SettingsScreen({ navigation, onLogout }: any) {

**Fixed strings:**
- L49: label: "Home"
- L50: label: "My Profile"
- L51: label: "My Products"
- L52: label: "My Orders"
- L53: label: "Wallet"
- L54: label: "My Ads"
- L55: label: "Reported"
- L56: label: "Invoices"
- L57: label: "Enquiries"
- L58: label: "Reviews"
- L59: label: "My Messages"
- L60: label: "Change Password"
- L61: label: "Privacy Policy"
- L62: label: "Language"
- L63: label: "Terms & Conditions"
- L163: placeholder: "Search settings"
- L211: title: "Logout"
- L212: message: "Are you sure you want to logout?"
- L213: cancelText: "Not now"
- L214: confirmText: "Logout"

## src/roles/Seller/features/Wallet/components/WithdrawModal.tsx  (fixed: 5, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L56: jsx: setError(`Minimum withdrawal amount is ${formatMoney(MIN_WITHDRAWAL)}`);
- L56: tpl: `Minimum withdrawal amount is ${formatMoney(MIN_WITHDRAWAL)}`
- L60: jsx: setError(`Amount exceeds available balance (${formatMoney(available)})`);
- L60: tpl: `Amount exceeds available balance (${formatMoney(available)})`
- L111: jsx: Withdraw all ({formatMoney(available)})

**Fixed strings:**
- L75: text: "Request Withdrawal"
- L78: text: "Available Balance"
- L120: title: "Add bank details"
- L138: title: "Cancel"
- L147: title: "Submit Request"

## src/roles/Seller/features/Wallet/screens/WalletScreen.tsx  (fixed: 40, built from pieces: 11)

**Built from pieces or plural rules (hard to translate):**
- L81: jsx: export default function WalletScreen({ navigation, isActive = true }: any) {
- L110: jsx: setAlert({ visible: true, type, title, message });
- L312: jsx: Shipping fee deducted: {formatMoney(item.shippingDeduction)}
- L440: tpl: `Next release ${formatDate(overview.nextReleaseAt)}`
- L441: tpl: `Releases after ${overview.holdDays} days`
- L455: jsx: How earnings work: once an order is delivered, your earnings are held for {overview.holdDays} days. After
- L457: jsx: Platform commission ({formatMoney(overview.totalPlatformFees)} lifetime) is deducted before crediting your
- L466: jsx: You have {formatMoney(overview.pendingBalance)} on hold. These funds do not move to your Available Balance
- L573: jsx: navigation?.navigate('Profile', { editSection: 'bank', at: Date.now() });
- L606: jsx: function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
- L617: jsx: function Metric({ label, value, bold, danger }: { label: string; value: string; bold?: boolean; danger?: boolean }) {

**Fixed strings:**
- L47: label: "Payment Summary"
- L48: label: "Transactions"
- L49: label: "Withdrawals"
- L53: label: "All"
- L54: label: "On hold"
- L55: label: "Available"
- L56: label: "Withdrawn"
- L61: label: "All types"
- L62: label: "Refund"
- L63: label: "Hold"
- L64: label: "Release"
- L65: label: "Withdrawal"
- L66: label: "Shipping fee"
- L67: label: "Platform fee"
- L138: alert-title: "Could not refresh"
- L261: alert-title: "Withdrawal requested"
- L268: alert-title: "Request failed"
- L282: alert-title: "Request cancelled"
- L287: alert-title: "Could not cancel"
- L305: label: "Gross Amount"
- L306: label: "Platform Fee"
- L307: label: "Net Earned"
- L379: title: "Cancel request"
- L415: text: "Wallet & Payouts"
- L423: text: "Withdrawal Pending Approval"
- L432: label: "Available Balance"
- L434: label: "On Hold"
- L444: label: "Total Earned"
- L445: label: "Total Withdrawn"
- L447: label: "Shipping Fees Paid"
- L464: text: "Action Required: Upload Invoices"
- L470: title: "Go to Orders"
- L478: title: "+ Request Withdrawal"
- L499: text: "Loading..."
- L521: text: "Loading wallet..."
- L579: title: "Cancel withdrawal"
- L580: message: "Cancel this withdrawal request? The amount returns to your available balance."
- L581: confirmText: "Yes, cancel it"
- L582: cancelText: "Keep it"
- L598: title: "Could not load the list"

## src/roles/Seller/navigation/SellerAuthStack.tsx  (fixed: 8, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L14: jsx: export default function SellerAuthStack({ onLoggedIn }) {

**Fixed strings:**
- L24: name: "Login"
- L27: name: "SignUp"
- L28: name: "ForgotPassword"
- L29: name: "VerifyOtp"
- L32: name: "ResetPassword"
- L34: name: "ResetSuccess"
- L38: name: "KycHandoff"
- L39: name: "KycStatus"

## src/roles/Seller/navigation/SellerNavigator.tsx  (fixed: 16, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L24: jsx: export default function SellerNavigator({ onLogout }: any) {

**Fixed strings:**
- L31: name: "SellerMain"
- L33: name: "SellerOrderDetail"
- L37: name: "SellerQueryDetail"
- L40: name: "AddProduct"
- L41: name: "ImportExport"
- L42: name: "CancelledOrders"
- L43: name: "ReturnRequests"
- L44: name: "CreateCampaign"
- L45: name: "ChatList"
- L48: name: "ChatDetail"
- L51: name: "Notifications"
- L52: name: "Settings"
- L56: name: "Profile"
- L57: name: "ChangePassword"
- L60: name: "PrivacyPolicy"
- L65: name: "Terms"

## src/roles/Seller/navigation/SellerTabs.tsx  (fixed: 6, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L37: jsx: function FloatingTabBar({ state, navigation }: any) {

**Fixed strings:**
- L18: name: "HomeTab"
- L19: label: "Home"
- L24: name: "ProductTab"
- L25: label: "Product"
- L30: name: "ProfileTab"
- L31: label: "Profile"

## src/roles/Seller/screens/SellerHomeScreen.tsx  (fixed: 0, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L9: jsx: export default function SellerHomeScreen({ navigation }: any) {
- L16: jsx: navigation.navigate('ProductTab', { initialTab: tab, at: Date.now(), ...extra });

## src/roles/Seller/screens/SellerManageScreen.tsx  (fixed: 0, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L32: jsx: export default function SellerManageScreen({ navigation, route }: any) {

## src/roles/Seller/services/sellerApi.ts  (fixed: 0, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L1198: jsx: cardLabel: card?.last4 ? `${card.brand \|\| 'Card'} ****${card.last4}` : '',
- L1253: jsx: campaign: res.data?.data ? mapCampaign({ ...res.data.data, productIds: [] }) : null,

## src/roles/Seller/utils/invoiceDownload.ts  (fixed: 13, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L41: jsx: message: text ? `The PDF could not be saved. ${text}` : 'The PDF could not be saved. Please try again.',
- L41: tpl: `The PDF could not be saved. ${text}`
- L77: tpl: `File: ${fileName}\nLocation: Downloads folder`
- L86: tpl: `The server answered with error ${status}. Please try again.`
- L89: tpl: `File: ${fileName}\nUse the share button of the preview to save it to Files.`

**Fixed strings:**
- L36: title: "No connection"
- L36: message: "The PDF could not be downloaded. Check your internet and try again."
- L40: title: "Download failed"
- L47: title: "No file"
- L47: message: "This invoice has no PDF file yet."
- L56: title: "Permission needed"
- L57: message: "Allow storage access in the phone settings to save the PDF into Downloads."
- L68: description: "Invoice PDF"
- L75: title: "Download failed"
- L75: message: "The file was not found after the download. Please try again."
- L77: title: "PDF saved"
- L86: title: "Download failed"
- L89: title: "PDF downloaded"

## src/roles/Seller/utils/sellerUtils.ts  (fixed: 0, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L3: jsx: export { formatMoney } from '@/utils/money';
- L84: jsx: navigation?.navigate('SellerMain', { screen: 'HomeTab' });

## src/roles/Seller/utils/statusStyles.ts  (fixed: 35, built from pieces: 0)

**Fixed strings:**
- L9: label: "Pending"
- L10: label: "Processing"
- L11: label: "Shipping"
- L12: label: "Shipped"
- L13: label: "Delivered"
- L14: label: "Cancelled"
- L18: label: "New Request"
- L19: label: "Shipped Back"
- L20: label: "Approved"
- L21: label: "Rejected"
- L25: label: "Paid"
- L26: label: "Payment pending"
- L27: label: "Payment failed"
- L28: label: "Refunded"
- L29: label: "No payment"
- L33: label: "On hold"
- L34: label: "Available"
- L35: label: "Withdrawn"
- L39: label: "Pending"
- L40: label: "Processing"
- L41: label: "Completed"
- L42: label: "Rejected"
- L59: label: "Draft"
- L60: label: "Under review"
- L61: label: "Active"
- L62: label: "Paused"
- L63: label: "Rejected"
- L64: label: "Completed"
- L68: label: "Waiting for PDF"
- L69: label: "Submitted"
- L70: label: "Approved"
- L71: label: "Rejected"
- L75: label: "Success"
- L76: label: "Partial"
- L77: label: "Failed"

## src/roles/Seller/utils/usePagedList.ts  (fixed: 2, built from pieces: 0)

**Fixed strings:**
- L18: text: "Promise"
- L100: text: "boolean, patch: Partial"
