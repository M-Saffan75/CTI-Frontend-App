# Hardcoded user-facing strings

Total fixed strings: 699. Built from pieces or plural rules: 124.
(Machine-extracted for the Language step. A few non-UI strings may appear and a few UI strings may be missed; re-run after the fixes.)

## src/roles/Customer/features/Jobs/screens/DisputeDetailScreen.tsx  (fixed: 50, built from pieces: 6)

**Built from pieces or plural rules (hard to translate):**
- L671: jsx: {String(dispute.priority).toUpperCase()} PRIORITY
- L688: tpl: `${dispute.raisedBy?.userId?.name \|\| 'Customer'} (${dispute.raisedBy?.userType \|\| 'customer'})`
- L692: tpl: `${dispute.againstUser?.userId?.name \|\| 'Repairman'} (${dispute.againstUser?.userType \|\| 'repairman'})`
- L715: jsx: Refund Amount: {formatMoney(dispute.resolution.refundAmount)}
- L779: cond: "flex-end" / "flex-start"
- L788: cond: "You (Customer)" / "Technician"

**Fixed strings:**
- L137: title: "Technician Not Assigned"
- L138: message: "Direct chat will be available once a certified technician is assigned to this job."
- L139: buttonText: "View All Chats"
- L188: title: "Chat Notice"
- L190: buttonText: "Open Chats"
- L221: title: "Required"
- L222: message: "Please enter a message to send."
- L236: title: "Update Sent"
- L243: title: "Error"
- L251: title: "Error"
- L305: text: "Loading dispute details..."
- L311: text: "Dispute Details Not Found"
- L314: text: "The requested dispute details could not be found or loaded."
- L317: text: "Go Back"
- L359: text: "Dispute / Under Review"
- L363: text: "Services Description"
- L366: text: "Services Required"
- L386: text: "Pricing Breakdown"
- L387: label: "Estimated Price"
- L390: text: "Location & Preference"
- L391: label: "Location"
- L392: label: "Service Type"
- L405: text: "Dispute Status"
- L408: text: "Support team is reviewing the chat history, evidence, and booking records to resolve this matter."
- L470: label: "Total Jobs"
- L474: label: "City / Area"
- L478: label: "Contact"
- L490: text: "Chat with Technician"
- L499: text: "Repair technician details will be displayed once assigned to this booking."
- L513: text: "Booking Overview"
- L528: text: "Scheduled Date:"
- L546: text: "Service Type:"
- L557: text: "Pricing Breakdown"
- L560: label: "Base Price"
- L566: label: "Parts Price"
- L572: label: "Service Fee"
- L577: label: "Total Amount"
- L594: text: "Service / Pickup Address"
- L640: text: "Booking records are not currently available for this job posting."
- L682: label: "Escrow Status"
- L687: label: "Raised By"
- L691: label: "Against"
- L697: text: "Dispute Description"
- L706: text: "Dispute Resolved"
- L730: text: "Attached Evidence"
- L753: text: "Case Discussion & Updates"
- L808: text: "No discussion messages yet. You can send an update to support below."
- L818: placeholder: "Type a message to support..."
- L846: text: "No Active Dispute Found"
- L849: text: "There is no open dispute filed for this repair job. If you face any issues, you can report them through order support."

## src/roles/Customer/features/Jobs/screens/JobsScreen.tsx  (fixed: 40, built from pieces: 9)

**Built from pieces or plural rules (hard to translate):**
- L70: tpl: `${one(safeMin)} - ${one(safeMax)}`
- L119: cond: "See less" / "See more"
- L201: jsx: Completed {completedDate}
- L255: jsx: {rating} out of 5
- L411: tpl: `To submit a new repair job request with diagnostic requirements and receive bids from certified technicians, please visit our web portal:\n\n${WEB_ADD_JOB_URL}`
- L821: jsx: Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
- L822: jsx: {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} jobs
- L840: cond: "DisputeDetail" / "RepairDetail"
- L868: jsx: active && { backgroundColor: colors.primary },

**Fixed strings:**
- L55: label: "All Jobs"
- L56: label: "Open"
- L57: label: "Offer Received"
- L58: label: "Booked"
- L59: label: "In Progress"
- L60: label: "Completed"
- L61: label: "Disputed"
- L62: label: "Reviews"
- L126: text: "Required Services"
- L205: label: "Completed"
- L208: label: "Job posting"
- L230: text: "Total paid"
- L237: text: "Your Review"
- L268: text: "Review submitted successfully"
- L274: title: "Write a Review for this Job"
- L299: title: "No Open Repair Requests"
- L306: title: "No Offers Received Yet"
- L312: title: "No Booked Repairs"
- L318: title: "No Repairs In Progress"
- L324: title: "No Completed Repairs"
- L330: title: "No Disputed Jobs"
- L336: title: "No Reviews Pending"
- L342: title: "No Repair Jobs Found"
- L410: title: "New Job Request"
- L412: buttonText: "Open Web Portal"
- L422: title: "Web Portal Link"
- L424: buttonText: "Okay"
- L499: title: "Notice"
- L500: message: "Booking details are incomplete for writing a review."
- L553: title: "Review Submitted"
- L562: title: "Submission Error"
- L688: text: "Review Completed Jobs"
- L690: text: "Share your experience and help other customers"
- L696: text: "Loading completed jobs..."
- L806: text: "Loading your repair jobs..."
- L812: title: "Could not load jobs"
- L904: title: "New Job Request"
- L974: text: "My Repair Jobs"
- L976: text: "Manage and track your device repair requests"
- L1026: placeholder: "Search by brand, service, location, color..."

## src/roles/Customer/features/Jobs/screens/RepairDetailScreen.tsx  (fixed: 67, built from pieces: 13)

**Built from pieces or plural rules (hard to translate):**
- L145: tpl: `Offers (${offersCount})`
- L207: tpl: `To accept this offer of ${formatMoney(offer.finalTotal, offer.currency)} from "${offer.repairmanName}" and secure your booking with Buyer Protection, please complete checkout on the CTI website.`
- L237: tpl: `Your repair service has been successfully booked with "${selectedOfferForBooking.repairmanName}".`
- L585: cond: "Read Less" / "Read More"
- L676: jsx: isAccepted && { borderColor: colors.primary, borderWidth: 1.5 },
- L776: cond: "Read Less" / "Read More"
- L888: cond: "Chat" / "Chat with Tech"
- L953: jsx: Secure Payment:{' '}
- L1334: cond: "See Less" / "See More"
- L1374: jsx: Repair Started: {new Date(job.booking.timeline.startedAt).toLocaleDateString()}
- L1382: jsx: Repair Completed: {new Date(job.booking.timeline.completedAt).toLocaleDateString()}
- L1390: jsx: Delivered to Customer: {new Date(job.booking.timeline.deliveredAt).toLocaleDateString()}
- L1464: cond: "Closing..." / "Close Job"

**Fixed strings:**
- L134: label: "Details"
- L137: label: "Details"
- L143: label: "Selected Offer"
- L148: label: "Repairman Info"
- L152: label: "Booking"
- L175: title: "Notice"
- L176: message: "Technician contact details not found."
- L206: title: "Complete on Website"
- L234: title: "Booking Confirmed!"
- L244: title: "Booking Notice"
- L253: title: "Booking Error"
- L324: title: "Dispute Created"
- L332: title: "Dispute Error"
- L361: title: "Job Closed"
- L369: title: "Error"
- L377: title: "Error"
- L423: title: "Notice"
- L424: message: "Booking or technician details are missing for submitting a review."
- L445: title: "Review Submitted"
- L453: title: "Review Error"
- L495: text: "Loading repair job details..."
- L501: text: "Repair Job Not Found"
- L512: text: "The requested repair job details could not be found or loaded."
- L524: text: "Go Back"
- L575: text: "Description"
- L590: text: "Services Required"
- L599: text: "Location"
- L603: text: "Service Preference"
- L610: text: "Job Overview"
- L647: text: "No Offers Available Yet"
- L650: text: "Expert repair technicians are reviewing your job request. When a technician submits an offer, you will see their proposal, pricing breakdown, and warranty details right here!"
- L787: text: "Can Start:"
- L795: text: "Estimated Time:"
- L807: text: "Required Replacement Parts:"
- L838: text: "Price Breakdown"
- L843: text: "Labor Cost:"
- L853: text: "Parts Cost:"
- L864: text: "Pickup Fee:"
- L876: text: "Total Amount:"
- L909: title: "Accept Offer"
- L955: text: "You can safely complete payment and accept this offer from the CTI website."
- L1025: text: "City / Area:"
- L1034: text: "Contact:"
- L1042: title: "Chat with Technician"
- L1074: text: "Booking Overview"
- L1145: title: "Chat with Technician"
- L1169: text: "Scheduled Date:"
- L1187: text: "Estimated Completion:"
- L1203: text: "Service Type:"
- L1227: text: "Pricing Breakdown"
- L1232: text: "Base / Labor:"
- L1246: text: "Parts Cost:"
- L1261: text: "Service / Pickup Fee:"
- L1273: text: "Total Price:"
- L1284: text: "Warranty Protection:"
- L1303: text: "Service / Pickup Address:"
- L1346: text: "Service Timeline:"
- L1409: text: "Case Under Dispute / Mediation"
- L1413: text: "Payment is held securely in escrow while our customer support team reviews the case."
- L1416: title: "View Dispute Details"
- L1443: text: "Repair completed by technician. Review will unlock once the device is marked delivered."
- L1457: text: "Device Delivered"
- L1460: text: "Please inspect your device. If satisfied, confirm to close the job and release funds."
- L1487: text: "Review submitted for this repair job. Thank you!"
- L1496: title: "Write a Review"
- L1513: title: "Report a Problem"
- L1551: buttonText: "Okay"

## src/roles/Customer/features/Jobs/components/BookingModal.tsx  (fixed: 18, built from pieces: 0)

**Fixed strings:**
- L43: text: "Promise"
- L133: text: "Book Repair Service"
- L182: text: "Select Service Preference"
- L201: text: "Drop-off at Shop"
- L204: text: "Bring your device directly to the repair workshop"
- L229: text: "Technician collects the device from your address"
- L252: text: "Home Service"
- L255: text: "Technician repairs the device at your location"
- L266: text: "Pickup Address *"
- L271: placeholder: "Enter full address for device pickup..."
- L284: text: "Scheduled Service Date"
- L291: text: "Earliest available slot"
- L304: placeholder: "Any special instructions or details about device access..."
- L319: text: "Base Offer:"
- L327: text: "Pickup Fee:"
- L337: text: "Total Amount:"
- L352: text: "Cancel"
- L363: text: "Confirm Booking"

## src/roles/Customer/features/Jobs/services/customerJobApi.ts  (fixed: 11, built from pieces: 6)

**Built from pieces or plural rules (hard to translate):**
- L228: cond: "direct_message" / "job_posting"
- L296: tpl: `${val} ${unit}`
- L296: cond: "${val} ${unit}" / "Same Day"
- L389: tpl: `${formatMoney(priceMin)} - ${formatMoney(priceMax)}`
- L574: tpl: `Priority: ${raw.urgency}`
- L574: cond: "Priority: ${raw.urgency}" / "Standard priority"

**Fixed strings:**
- L462: description: "Accepted offer proposal and confirmed repair specifications."
- L551: description: "30 Days Warranty"
- L575: description: "No description provided."
- L581: label: "Total Offers"
- L582: label: "Status"
- L583: label: "Max Offers"
- L584: label: "Warranty"
- L656: label: "Booking ID"
- L657: label: "Status"
- L658: label: "Technician"
- L659: label: "Shop"

## src/features/Refurbished/screens/AllGadgetsScreen.tsx  (fixed: 8, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L230: jsx: Showing {filtered.length} premium refurbished products

**Fixed strings:**
- L157: text: "(p?.price ?? 0)"
- L227: text: "All Refurbished Gadgets"
- L239: text: "Sort By:"
- L254: text: "Loading gadgets..."
- L261: text: "No Products Found"
- L264: text: "No refurbished devices match your current selection or category."
- L365: text: "View Detail"
- L393: text: "Select Sorting"

## src/features/Refurbished/screens/ApplicationSubmittedScreen.tsx  (fixed: 11, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L207: jsx: {picCount} Pics, {vidCount} Vids

**Fixed strings:**
- L108: text: "Application Submitted"
- L112: text: "Thank you"
- L131: text: "Browse Store"
- L141: text: "Back to Home"
- L154: text: "Device Details"
- L159: text: "Brand"
- L164: text: "Model"
- L187: text: "DEVICE CONDITION"
- L205: text: "Media Uploaded"
- L221: text: "Device Detail"
- L224: text: "Get paid instantly at your doorstep. We guarantee 100% data security and professional"

## src/features/Refurbished/screens/BuyRefurbishedScreen.tsx  (fixed: 22, built from pieces: 8)

**Built from pieces or plural rules (hard to translate):**
- L266: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Laptop' })
- L302: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Laptop' })
- L317: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Speaker' })
- L332: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Gaming Console' })
- L380: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Sell Phone' })
- L404: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Laptop' })
- L431: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Smartwatches' })
- L456: jsx: navigation.navigate('AllGadgets', { initialCategory: 'Gaming Console' })

**Fixed strings:**
- L164: text: "Refurbished"
- L247: placeholder: "Search order custom product"
- L257: text: "Windows"
- L258: text: "Laptops"
- L260: text: "Starting"
- L293: text: "Sell Phone"
- L308: text: "Laptop"
- L323: text: "Speaker"
- L338: text: "Gaming"
- L349: text: "Loading refurbished devices..."
- L356: text: "No Devices Found"
- L359: text: "Currently there are no refurbished devices available."
- L366: text: "Top Selling Devices"
- L368: text: "See All"
- L377: text: "Top Selling Phone"
- L382: text: "See All"
- L401: text: "Top Selling Laptop"
- L406: text: "See All"
- L427: text: "In-Demand Smartwatches"
- L433: text: "See All"
- L452: text: "Trending Gamer Essentials"
- L458: text: "See All"

## src/features/Refurbished/screens/DeviceConditionScreen.tsx  (fixed: 7, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L268: jsx: QUESTION {currentStepIndex + 1} OF {questionsList.length}
- L349: cond: "Proceed" / "Next Question"

**Fixed strings:**
- L157: title: "Selection Required"
- L158: message: "Please select an option before proceeding to the next step."
- L224: text: "Loading condition criteria..."
- L249: text: "No Condition Assessment Required"
- L255: title: "Continue to Upload Media"
- L335: text: "Previous"
- L362: text: "Accurate answers guarantee the highest quote and instant pickup approval."

## src/features/Refurbished/screens/MySellRequestsScreen.tsx  (fixed: 30, built from pieces: 8)

**Built from pieces or plural rules (hard to translate):**
- L193: tpl: `chat_${requestId}`
- L423: jsx: Tracking ID:{' '}
- L458: jsx: {photosCount} photos attached
- L558: jsx: Est. Market Value: {formatMoney(item.offer.estimatedValue)}
- L633: jsx: This offer is {resolvedOfferStatus}.
- L653: cond: "Accept Offer?" / "Decline Offer?"
- L659: tpl: `Are you sure you want to decline this offer for request ${confirmModal.trackingId}? This decision cannot be reversed.`
- L661: cond: "Yes, Accept Offer" / "Yes, Decline"

**Fixed strings:**
- L102: title: "Authentication Required"
- L103: message: "Please sign in to view and manage your device sell requests."
- L148: title: "Offer Accepted!"
- L149: message: "You have accepted the offer. Our logistics partner will contact you soon for device pickup."
- L156: title: "Action Failed"
- L166: title: "Offer Declined"
- L167: message: "You have declined this offer. You can request a new quote at any time."
- L174: title: "Action Failed"
- L183: title: "Error"
- L205: title: "Live Chat"
- L206: message: "Support chat is being set up. You will receive an update in Messages shortly."
- L213: title: "Chat Error"
- L280: text: "Loading your sell requests..."
- L315: text: "My Sell Requests"
- L317: text: "Track & manage your device buyback requests"
- L325: text: "Sell Device"
- L344: text: "No Sell Requests Found"
- L347: text: "You haven't submitted any requests to sell your devices yet. Get an instant quote"
- L353: text: "Get Instant Valuation"
- L466: text: "Video proof attached"
- L491: text: "Chat with Platform"
- L520: text: "Under Evaluation"
- L523: text: "Our technical team is reviewing your device specifications. You will"
- L533: text: "Offer Received"
- L551: text: "GUARANTEED PAYOUT"
- L576: text: "EVALUATION NOTES:"
- L587: text: "CONDITIONS:"
- L616: text: "Accept Offer"
- L627: text: "Decline"
- L662: cancelText: "Cancel"

## src/features/Refurbished/screens/QuoteApplicationScreen.tsx  (fixed: 42, built from pieces: 7)

**Built from pieces or plural rules (hard to translate):**
- L275: tpl: `file://${uri}`
- L281: tpl: `device_pic_${index}_${Date.now()}.jpg`
- L296: tpl: `file://${uri}`
- L302: tpl: `device_vid_${index}_${Date.now()}.mp4`
- L318: tpl: `REF-${Math.floor(100000 + Math.random() * 900000)}`
- L425: jsx: {phone.length}/11 digits
- L584: jsx: {images.length} Pics, {videos.length} Vids

**Fixed strings:**
- L116: title: "Name Required"
- L117: message: "Please enter your full name."
- L126: title: "Valid Email Required"
- L127: message: "Please enter a valid email address."
- L137: title: "Telephone Required"
- L138: message: "Please enter your telephone number."
- L147: title: "Valid Telephone Required"
- L148: message: "Telephone number must be 10 or 11 digits (e.g. 05XX XXX XX XX)."
- L158: title: "TR ID Required"
- L159: message: "TR ID number must be exactly 11 digits."
- L168: title: "Address Required"
- L169: message: "Please enter your pickup / residential address."
- L179: title: "Valid IBAN Required"
- L180: message: "IBAN must start with TR and contain exactly 26 alphanumeric characters."
- L234: title: "Device Info Missing"
- L235: message: "Could not identify device configuration. Please go back and re-select your device."
- L334: title: "Submission Failed"
- L342: title: "Submission Error"
- L364: text: "Back"
- L374: text: "Complete Your Application"
- L377: text: "Please provide your details below. Our technicians will inspect your device details"
- L383: text: "Name Surname"
- L387: placeholder: "John Doe"
- L402: text: "E-mail"
- L406: placeholder: "example@mail.com"
- L423: text: "Telephone"
- L431: placeholder: "05XX XXX XX XX"
- L448: text: "Address"
- L452: placeholder: "Enter your address information"
- L467: text: "IBAN (For payment)"
- L471: placeholder: "TR00 0000 0000 0000 0000 0000 00"
- L487: text: "TR ID Number"
- L491: placeholder: "Your 11-digit TR ID number"
- L517: text: "Uploading & Submitting..."
- L520: text: "Complete application"
- L531: text: "Device Details"
- L536: text: "Brand"
- L541: text: "Model"
- L564: text: "DEVICE CONDITION"
- L582: text: "Media Uploaded"
- L598: text: "Device Detail"
- L601: text: "Get paid instantly at your doorstep. We guarantee 100% data security and professional"

## src/features/Refurbished/screens/RefurbishedProductDetailScreen.tsx  (fixed: 42, built from pieces: 12)

**Built from pieces or plural rules (hard to translate):**
- L211: tpl: `${product.name} (Qty: ${quantity}) has been added to your cart.`
- L496: tpl: `${a.name}: ${a.value}`
- L497: tpl: `Option ${vIdx + 1}`
- L525: cond: "${v.stock} in stock" / "Out of stock"
- L540: jsx: MRP {formatMoney(displayMrp)}
- L747: jsx: Overall -{' '}
- L759: jsx: Screen Glass -{' '}
- L792: jsx: Display -{' '}
- L825: jsx: Body -{' '}
- L918: cond: "Review" / "Reviews"
- L943: jsx: navigation.push('RefurbishedProductDetail', { productId: rel?.id, product: rel })
- L978: tpl: `Your query regarding "${subj}" has been forwarded to our support team.`

**Fixed strings:**
- L210: title: "Added to Cart"
- L217: title: "Error"
- L225: title: "Error"
- L276: text: "GRADE_EXPLANATIONS?.[selectedGrade] \|\|"
- L277: text: "GRADE_EXPLANATIONS?.['Superb'] \|\|"
- L370: text: "Loading refurbished product..."
- L376: text: "Product Not Found"
- L379: text: "The requested refurbished device is not available."
- L382: text: "Go Back"
- L397: text: "Refurbished"
- L486: text: "Select Variant:"
- L549: text: "Out of stock"
- L566: text: "Add To Cart"
- L577: text: "Buy Now"
- L594: text: "CTI Platform"
- L603: text: "Verified & Certified Refurbished"
- L616: text: "Ask Platform"
- L623: text: "Product Information"
- L628: text: "Build & Materials:"
- L636: text: "Display & Visuals:"
- L645: text: "Performance & Processing:"
- L654: text: "Camera System:"
- L663: text: "Battery & Connectivity:"
- L673: text: "Specifications"
- L680: text: "Brand"
- L684: text: "Category"
- L688: text: "SKU"
- L692: text: "Total Variants"
- L698: text: "Condition"
- L708: text: "Grade Explained"
- L780: text: "Micro-scratches"
- L813: text: "OLED Verified"
- L846: text: "Frame Inspection"
- L862: text: "Platform Guarantee & Buyer Protection"
- L865: text: "We stand behind every transaction on our platform. With our secure escrow system, your"
- L881: text: "Easy Returns & Refund Policy"
- L885: text: "Not satisfied with your purchase? You can return eligible items within 7 days of"
- L894: text: "Rating & Reviews"
- L903: text: "Our Rating"
- L923: text: "No reviews yet"
- L933: text: "Related Refurbished Products"
- L977: title: "Inquiry Sent"

## src/features/Refurbished/screens/SelectModelScreen.tsx  (fixed: 4, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L140: jsx: Showing models for{' '}
- L157: tpl: `No models match "${searchQuery}".`
- L157: tpl: `No active models found for ${brand}.`

**Fixed strings:**
- L112: text: "Back To Brand Selection"
- L126: placeholder: "Search device models..."
- L134: text: "Select Model"
- L155: text: "No Models Found"

## src/features/Refurbished/screens/SelectVariantScreen.tsx  (fixed: 4, built from pieces: 6)

**Built from pieces or plural rules (hard to translate):**
- L107: tpl: `Please select an option for ${currentVariant.key} before proceeding.`
- L174: cond: "Back To Previous Option" / "Back To Model Selection"
- L229: tpl: `Search ${currentVariant?.key \|\| 'options'}...`
- L241: jsx: Specification {currentVariantIndex + 1} of {variants.length}
- L246: jsx: Select {currentVariant?.key \|\| 'Specification'}
- L249: jsx: Select the {currentVariant?.key} variant for your{' '}

**Fixed strings:**
- L106: title: "Selection Required"
- L180: text: "Loading device specifications..."
- L204: text: "No Variant Selection Required"
- L210: title: "Continue to Condition Assessment"

## src/features/Refurbished/screens/SellRefurbishedScreen.tsx  (fixed: 13, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L259: cond: "Search phone model (e.g. 12 pro max)" / "Search gadget model (e.g. Galaxy Tab, PS5)"
- L387: jsx: {gadgetCategories.length} Categories
- L498: cond: "Hide Brands" / "More Brands"

**Fixed strings:**
- L223: text: "Sell Phone"
- L243: text: "Sell Gadgets"
- L315: text: "Get real-time device valuation & guaranteed doorstep pickup within 24h."
- L327: text: "Sell Now"
- L353: text: "Free Doorstep Pickup"
- L363: text: "Maximum Value"
- L373: text: "Safe & Hassle-Free"
- L384: text: "Popular Gadgets"
- L445: text: "OR CHOOSE A BRAND"
- L521: text: "All Available Brands"
- L525: text: "View All Models →"
- L567: text: "How It Works"
- L598: text: "Why Us"

## src/features/Refurbished/screens/UploadDeviceMediaScreen.tsx  (fixed: 23, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L222: jsx: {images.length}/10 Max
- L249: jsx: {videos.length}/3 Max
- L268: jsx: Attached Photos ({images.length}/10)
- L289: jsx: Attached Videos ({videos.length}/3)
- L380: jsx: {images.length} Pics, {videos.length} Vids

**Fixed strings:**
- L66: title: "Limit Reached"
- L67: message: "You can upload a maximum of 10 pictures."
- L83: title: "Media Error"
- L105: title: "Limit Reached"
- L106: message: "You can upload a maximum of 3 videos."
- L122: title: "Media Error"
- L152: title: "Pictures Required"
- L153: message: "Please upload at least 1 clear picture of your device before proceeding."
- L202: text: "Upload Device Photos & Media"
- L220: text: "Picture"
- L228: text: "Upload Pictures"
- L231: text: "PNG, JPG up to 10MB"
- L247: text: "Video"
- L255: text: "Upload Video"
- L258: text: "MP4, MOV up to 50MB"
- L328: text: "Previous Step"
- L341: text: "Get Quote"
- L354: text: "Device Details"
- L359: text: "Brand"
- L364: text: "Model"
- L378: text: "Media Uploaded"
- L394: text: "Device Detail"
- L397: text: "Get paid instantly at your doorstep. We guarantee 100% data security and professional"

## src/features/Refurbished/components/AskPlatformModal.tsx  (fixed: 8, built from pieces: 0)

**Fixed strings:**
- L88: text: "Ask the Platform"
- L104: text: "Message Sent!"
- L106: text: "CTI platform specialists will answer your question shortly in your enquiries."
- L113: text: "Quick Topics"
- L145: placeholder: "Subject"
- L161: placeholder: "Write your message here..."
- L180: text: "Cancel"
- L189: text: "Send Message"

## src/features/Refurbished/components/RefurbishedFilterModal.tsx  (fixed: 11, built from pieces: 0)

**Fixed strings:**
- L49: text: "REFURBISHED_CATEGORIES,"
- L173: text: "Filter"
- L175: text: "Reset"
- L194: text: "Product Type"
- L247: text: "PRODUCT SOURCE"
- L274: text: "Price Range"
- L288: text: "Min"
- L305: text: "Max"
- L326: text: "Ram"
- L360: text: "Storage"
- L405: text: "Apply Filters"

## src/features/Refurbished/components/RefurbishedHeader.tsx  (fixed: 0, built from pieces: 0)

## src/features/Refurbished/data/refurbishedData.ts  (fixed: 34, built from pieces: 0)

**Fixed strings:**
- L66: title: "Superb"
- L73: title: "Good"
- L80: title: "Fair"
- L87: title: "Best Value"
- L98: title: "Best Prices"
- L99: description: "Objective AI-based pricing engine ensuring top market value."
- L104: title: "Instant Payment"
- L105: description: "Instant Money Transfer in your preferred mode at time of pick up or store drop off."
- L110: title: "Simple & Convenient"
- L111: description: "Check price, schedule pickup & get paid in under 24 hours."
- L116: title: "Free Doorstep Pickup"
- L117: description: "No fees for pickup across 1500+ cities with verified field agents."
- L122: title: "Factory Grade Data Wipe"
- L123: description: "100% Safe and Data Security Guaranteed with automated wipe certificates."
- L128: title: "Valid Purchase Invoice"
- L129: description: "Genuine Bill of Sale and electronic invoice generated on spot."
- L137: title: "1. Check Price"
- L143: title: "2. Schedule Pickup"
- L149: title: "3. Get Paid"
- L156: text: "Apple: ["
- L168: text: "Samsung: ["
- L176: text: "Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7a', 'Pixel 6 Pro'],"
- L177: text: "Xiaomi: ['13 Pro', '12 Pro', 'Redmi Note 13 Pro', 'Redmi Note 12'],"
- L178: text: "OnePlus: ['OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus Nord 3'],"
- L198: label: "Flawless"
- L199: label: "Good / Minor Scratches"
- L200: label: "Cracked or Broken"
- L207: label: "Yes"
- L208: label: "No"
- L215: label: "Yes"
- L216: label: "No"
- L223: label: "Clean & Pristine"
- L224: label: "Light Scuffs"
- L225: label: "Bent or Dented"

## src/features/Refurbished/services/refurbishedApi.ts  (fixed: 3, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L367: tpl: `Bearer ${token}`

**Fixed strings:**
- L363: text: "Accept: 'application/json',"
- L399: message: "Upload timed out. Please check your internet connection or try with fewer/smaller media files."
- L590: message: "Added to cart!"

## src/features/Chat/screens/ChatDetailScreen.tsx  (fixed: 7, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L654: cond: "Quote Accepted" / "Quote Declined"
- L660: cond: "success" / "info"
- L719: tpl: `${route.params.question}${queryId ? `
- L747: jsx: This is the start of your direct conversation with {participant.name}.
- L794: cond: "Type your message..." / "Type your reply here..."

**Fixed strings:**
- L89: text: "Service Quotation"
- L101: text: "Estimated Time:"
- L109: text: "Total Amount:"
- L118: title: "Accept"
- L127: title: "Decline"
- L665: title: "Action Failed"
- L730: text: "Loading conversation..."

## src/features/Chat/screens/ChatListScreen.tsx  (fixed: 2, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L234: cond: "No chats matching search" / "No conversations yet"

**Fixed strings:**
- L220: placeholder: "Search conversations..."
- L230: text: "Loading chats..."

## src/services/chatApi.ts  (fixed: 0, built from pieces: 8)

**Built from pieces or plural rules (hard to translate):**
- L124: tpl: `query_${q._id}`
- L135: cond: "seller" / "customer"
- L343: tpl: `qmsg-${idx}`
- L344: tpl: `qmsg-${idx}`
- L347: cond: "seller" / "customer"
- L356: tpl: `qmsg-root-${q._id}`
- L357: tpl: `qmsg-root-${q._id}`
- L358: tpl: `[${q.subject}]\n${q.message \|\| ''}`

## src/features/Profile/screens/ProfileScreen.tsx  (fixed: 45, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L311: jsx: Member since {profile.memberSince}
- L330: jsx: {profile.jobsCompleted} Job Completed
- L1002: cond: "Email Verified" / "Email Pending"

**Fixed strings:**
- L352: text: "Complete Your Bank Details"
- L355: text: "Add your bank information to start receiving payments"
- L387: text: "Rating"
- L397: text: "Jobs Completed"
- L398: text: "N/A"
- L407: text: "Hours"
- L424: text: "About me"
- L442: text: "Specialization"
- L470: text: "Working Hours"
- L473: text: "Business Hours"
- L479: text: "Working Days"
- L506: text: "Education"
- L540: text: "Education certificate"
- L586: text: "Experience"
- L620: text: "Experience certificate"
- L666: text: "Certifications & Licenses"
- L739: text: "Contact Info"
- L745: text: "Phone Number"
- L756: text: "Email Address"
- L773: text: "WhatsApp"
- L791: text: "Address & Location"
- L797: text: "Country"
- L808: text: "State / Province"
- L818: text: "City"
- L828: text: "Street Address"
- L841: text: "Specific street address and city details are saved with your job orders. Country can be updated in Edit Profile."
- L859: text: "Location"
- L863: text: "Full Adress"
- L868: text: "Zip Code"
- L886: text: "Emergency Contact"
- L893: text: "Contact Person"
- L909: text: "Contact Number"
- L928: text: "Services"
- L932: text: "Pickup Service"
- L934: text: "Available"
- L951: text: "Account Information"
- L957: text: "Account Status"
- L967: text: "Member Since"
- L977: text: "Last Update"
- L1017: text: "Profile Completed"
- L1030: text: "Dispute History"
- L1064: title: "Remove Profile Photo"
- L1065: message: "Are you sure you want to remove your profile photo?"
- L1066: confirmText: "Remove"
- L1067: cancelText: "Cancel"

## src/features/Profile/screens/ChangePasswordScreen.tsx  (fixed: 11, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L186: cond: "Updating Password..." / "Update Password"

**Fixed strings:**
- L74: title: "Success"
- L85: title: "Change Password Failed"
- L108: text: "Change Password"
- L123: text: "Keep Your Account Secure"
- L125: text: "Ensure your new password has at least 8 characters with numbers, lowercase, and uppercase letters."
- L134: label: "Current Password"
- L140: placeholder: "Enter current password"
- L151: label: "New Password"
- L157: placeholder: "Enter new password"
- L169: label: "Confirm New Password"
- L175: placeholder: "Confirm new password"

## src/features/Profile/components/EditCustomerProfileModal.tsx  (fixed: 13, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L382: cond: "180deg" / "0deg"
- L423: jsx: isSelected && { fontFamily: fonts.bold },

**Fixed strings:**
- L243: text: "Edit Profile"
- L246: text: "Update your personal customer details"
- L281: text: "Profile Picture"
- L284: text: "PNG, JPG up to 5MB"
- L288: text: "Choose Photo"
- L308: placeholder: "Enter full name"
- L319: text: "Email Address"
- L337: text: "Email address cannot be changed directly."
- L355: placeholder: "e.g. +90 555 123 4567"
- L366: text: "Country"
- L397: text: "Loading countries..."
- L440: title: "Cancel"
- L450: title: "Save Changes"

## src/features/Profile/services/profileApi.ts  (fixed: 0, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L230: tpl: `${merged.firstName} ${merged.lastName \|\| ''}`
- L286: cond: "${data.rating} ★" / "No rating"

## src/roles/Customer/features/Academy/screens/AcademyScreen.tsx  (fixed: 11, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L137: jsx: Master the Skills{'\n'}You Need

**Fixed strings:**
- L104: placeholder: "Search Courses"
- L117: text: "CTI"
- L120: text: "Hundreds of training courses!"
- L126: title: "Explore Courses"
- L140: text: "Explore our comprehensive course catalog"
- L144: text: "Loading categories..."
- L177: text: "No categories available at the moment."
- L182: title: "View All Courses"
- L196: text: "Learn &amp; Grow"
- L204: text: "CTI Academy courses provide industry-grade learning modules for repair, electronics, and technical certifications."
- L209: text: "Go to Academy Courses"

## src/roles/Customer/features/Academy/screens/CourseDetailScreen.tsx  (fixed: 8, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L385: tpl: `${course.title}\n\n${getWebAcademyCourseUrl(course.slug \|\| course.id)}`
- L513: jsx: {course.views} views

**Fixed strings:**
- L396: text: "Loading course details..."
- L410: text: "Course Not Found"
- L413: text: "The requested course could not be loaded."
- L416: title: "Back to Courses"
- L475: text: "No Video Available"
- L477: text: "There is no video lecture uploaded for this course yet."
- L528: title: "Explore More Courses"
- L535: title: "Share"

## src/roles/Customer/features/Academy/screens/CoursesListScreen.tsx  (fixed: 6, built from pieces: 0)

**Fixed strings:**
- L100: title: "Start Learning"
- L235: placeholder: "Search Courses"
- L242: text: "Courses"
- L245: text: "Discover high-quality courses to grow your skills"
- L307: text: "Loading courses..."
- L313: text: "No courses found in this category."

## src/services/academyApi.ts  (fixed: 0, built from pieces: 0)

## src/roles/Customer/features/Blogs/screens/BlogDetailScreen.tsx  (fixed: 4, built from pieces: 0)

**Fixed strings:**
- L62: text: "Loading article..."
- L68: text: "Article Not Found"
- L71: text: "This blog post is not available or has been removed."
- L74: text: "Go Back"

## src/roles/Customer/features/Blogs/screens/BlogsScreen.tsx  (fixed: 5, built from pieces: 0)

**Fixed strings:**
- L116: text: "Blogs & Insights"
- L118: text: "Discover the latest stories, tips and updates from CTI"
- L124: text: "Loading latest blogs..."
- L130: text: "No Blogs Found"
- L132: text: "There are no published blog posts right now. Check back later!"

## src/services/blogApi.ts  (fixed: 0, built from pieces: 0)

## src/roles/Customer/features/Settings/screens/SettingsScreen.tsx  (fixed: 24, built from pieces: 0)

**Fixed strings:**
- L52: label: "Home"
- L53: label: "Top Expert Repairmen"
- L54: label: "About"
- L55: label: "Academy"
- L56: label: "Blogs"
- L57: label: "My Orders"
- L58: label: "My Messages"
- L59: label: "My Sell Request"
- L61: label: "Refurbished Devices"
- L64: label: "Sell Phone"
- L65: label: "Sell Gadgets"
- L69: label: "Buy Refurbished Devices"
- L72: label: "Browse Refurbished Store"
- L74: label: "Refurbished Smart Watch"
- L80: label: "Refurbished Tablet"
- L86: label: "Refurbished Gaming Console"
- L93: label: "Change Password"
- L94: label: "Privacy Policy"
- L95: label: "Terms & Conditions"
- L235: text: "Customer"
- L246: title: "Logout"
- L247: message: "Are you sure you want to logout?"
- L248: cancelText: "Not now"
- L249: confirmText: "Logout"

## src/roles/Customer/features/About/screens/AboutScreen.tsx  (fixed: 34, built from pieces: 0)

**Fixed strings:**
- L81: text: "SUSTAINABILITY & INNOVATION"
- L82: text: "Reuse & Reduce"
- L84: text: "Our grandparents lived a sustainable life — long before sustainability was even a concept."
- L87: text: "Let's mindfully bring sustainable choices back into our modern lifestyle, starting with"
- L98: text: "BUY. REPAIR. SELL. REFURBISH. REUSE. REPEAT. • BUY. REPAIR. SELL. REFURBISH. REUSE. REPEAT."
- L106: text: "OUR PASSION"
- L108: text: "Building a world where tech doesn't need to cost the pocket or the planet."
- L111: text: "To change the lifecycle of every gadget by redefining what we choose to do with it."
- L120: text: "OUR COMMITMENT"
- L121: text: "Our Promise"
- L123: text: "We promise to make sustainable technology accessible, affordable, and effortless for everyone."
- L150: text: "OUR PASSION"
- L152: text: "Adding “right way” to business for the planet and the people who live on it."
- L155: text: "To change the lifecycle of every gadget by redefining what we choose to do with it."
- L164: text: "OUR STORY"
- L165: text: "From Zero to Hero"
- L167: text: "A journey of innovation, sustainability, and commitment to changing how the world thinks about technology."
- L239: text: "OUR FOUNDATION"
- L240: text: "Our Principles"
- L242: text: "These core values guide every decision we make and shape our vision for the future."
- L265: text: "REUSE & IMPACT"
- L268: text: "Solution"
- L271: text: "When you reuse just one phone:"
- L283: text: "WATER"
- L285: text: "YOU SAVE"
- L288: text: "liters"
- L290: text: "of water"
- L306: text: "ENERGY"
- L308: text: "YOU SAVE"
- L311: text: "kWh"
- L313: text: "of energy"
- L329: text: "PLANET"
- L332: text: "toxic e-waste"
- L335: text: "Every phone reused prevents toxic waste from polluting our environment and conserves precious natural resources for future generations."

## src/roles/Customer/features/About/data/about.ts  (fixed: 25, built from pieces: 0)

**Fixed strings:**
- L3: title: "Fair Value"
- L4: text: "We guarantee the most competitive prices for your devices, ensuring you get fair market value."
- L7: title: "Sustainability First"
- L8: text: "Every device refurbished saves 61kg of CO2 emissions and prevents e-waste from landfills."
- L11: title: "Quality Assured"
- L12: text: "Rigorous testing and certification ensure every device meets our premium quality standards."
- L15: title: "Quick & Easy"
- L16: text: "Doorstep pickup, hassle-free selling, and instant payment in just 3 simple steps."
- L23: title: "The Beginning"
- L31: title: "Going Digital"
- L39: title: "Rapid Expansion"
- L47: title: "Industry Recognition"
- L55: title: "Game Changer"
- L63: title: "The Future is Now"
- L74: title: "Transparency"
- L75: text: "We believe in complete transparency. No hidden costs, no surprise charges. What you see is what you get."
- L79: title: "Responsibility"
- L80: text: "We take responsibility for every device. From collection to recycling, we ensure ethical handling."
- L84: title: "Innovation"
- L85: text: "Constantly innovating to find new ways to extend device lifespans and reduce environmental impact."
- L89: title: "Community"
- L90: text: "Building a community of conscious consumers who believe technology should be accessible and sustainable."
- L95: label: "Phones Reused"
- L96: label: "Liters Water Saved"
- L97: label: "kWh Energy Saved"

## src/roles/Customer/features/Repairmen/screens/ExpertRepairmenScreen.tsx  (fixed: 18, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L523: jsx: Expert Repairmen{' '}
- L598: tpl: `No registered technicians currently specialize in "${search.trim()}".`
- L667: cond: "${selectedRepairman.rating.toFixed(1)} Rating" / "New"

**Fixed strings:**
- L132: text: "View Details"
- L135: title: "Book & Chat"
- L149: label: "All"
- L150: label: "Mobile"
- L151: label: "Laptop"
- L152: label: "Desktop"
- L153: label: "Smartwatch"
- L154: label: "Software"
- L200: title: "Unable to Start Chat"
- L208: title: "Chat Connection Error"
- L538: placeholder: "Search by name, city, or specialization..."
- L587: text: "Loading verified repairmen..."
- L594: text: "No Expert Repairmen Found"
- L603: title: "View All Repairmen"
- L642: text: "Repairman Profile"
- L694: text: "Specializations:"
- L713: text: "Working Days:"
- L722: title: "Chat with Specialist"

## src/services/repairmanApi.ts  (fixed: 0, built from pieces: 0)

## src/components/modals/CreateDisputeModal.tsx  (fixed: 19, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L150: jsx: isSelected && { backgroundColor: colors.primary + '18' },
- L207: cond: "Submitting..." / "Submit Dispute"

**Fixed strings:**
- L29: label: "Payment Issue"
- L30: label: "Quality of Work"
- L31: label: "Service Not Provided"
- L32: label: "Damaged Property"
- L33: label: "Unprofessional Behavior"
- L34: label: "Cancellation Issue"
- L35: label: "Other"
- L39: label: "Unfair Rating"
- L40: label: "Late Payment"
- L41: label: "Rude Behavior"
- L42: label: "Cancellation After Arrival"
- L43: label: "Fake Request"
- L44: label: "Other"
- L50: text: "Promise"
- L105: text: "Report a Problem"
- L115: text: "Dispute Category *"
- L175: placeholder: "Please describe your issue in detail..."
- L195: text: "Important Notice"
- L217: title: "Cancel"

## src/components/modals/WriteReviewModal.tsx  (fixed: 5, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L225: cond: "Submitting..." / "Submit Review"

**Fixed strings:**
- L39: text: "Promise"
- L106: text: "Write a Review"
- L171: text: "Overall Rating *"
- L203: placeholder: "Share your experience with this technician and repair service..."
- L235: title: "Cancel"

## src/features/Legal/screens/PrivacyPolicyScreen.tsx  (fixed: 0, built from pieces: 0)

## src/features/Legal/screens/TermsScreen.tsx  (fixed: 0, built from pieces: 0)

## src/roles/Customer/features/Product/screens/FilterScreen.tsx  (fixed: 10, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L335: jsx: active && { borderWidth: 3, borderColor: colors.primary },

**Fixed strings:**
- L27: title: "Electronics"
- L28: title: "Fashion & Apparel"
- L281: text: "Filter Products"
- L292: title: "Category"
- L316: title: "Colors"
- L352: title: "Storage"
- L378: title: "Price Range"
- L403: title: "Min Rating"
- L420: title: "Clear All"
- L422: title: "Apply Filters"

## src/roles/Customer/navigation/CustomerTabs.tsx  (fixed: 4, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L53: jsx: focused && { fontFamily: fonts.bold },

**Fixed strings:**
- L18: label: "Home"
- L19: label: "Repair"
- L20: label: "Product"
- L21: label: "Profile"
