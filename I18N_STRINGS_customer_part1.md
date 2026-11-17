# Hardcoded user-facing strings

Total fixed strings: 245. Built from pieces or plural rules: 45.
(Machine-extracted for the Language step. A few non-UI strings may appear and a few UI strings may be missed; re-run after the fixes.)

## src/roles/Customer/features/Home/screens/HomeScreen.tsx  (fixed: 31, built from pieces: 4)

**Built from pieces or plural rules (hard to translate):**
- L352: cond: "Select Brand" / "Not Found"
- L406: jsx: !isFormComplete && { opacity: 0.5 },
- L423: tpl: `Select ${selectedBrand?.name \|\| ''} Model`
- L440: tpl: `Search ${pickerType}...`

**Fixed strings:**
- L65: text: "Accessories: headphonesBold,"
- L169: placeholder: "Search order custom product"
- L229: title: "Explore Now"
- L342: label: "Service Finder"
- L343: text: "Quick  Service Finder"
- L345: text: "Select your device brand, model, color and connect with verified professionals near you."
- L350: label: "Brand"
- L361: label: "Model"
- L383: label: "Color"
- L400: title: "Find Service"
- L451: text: "No brands found"
- L494: text: "No models found"
- L529: text: "No colors available"
- L667: label: "Our Services"
- L668: text: "Our Services"
- L779: title: "Book Appointment"
- L797: label: "Our Specialists"
- L800: text: "View All →"
- L804: text: "Meet Our Verified Professional"
- L806: text: "Our certified repair experts bring years of hands-on experience and consistently high"
- L837: text: "Our Blogs"
- L851: text: "Readmore"
- L880: text: "What Our Customers Say"
- L963: text: "Sponsored"
- L994: text: "Visit Store  →"
- L1007: label: "Sponsored"
- L1008: text: "Best Rated Stores"
- L1010: text: "Discover top-rated shops handpicked for you - quality guaranteed."
- L1087: text: "Loading real-time home data..."
- L1097: text: "Data Not Available"
- L1103: title: "Try Again"

## src/roles/Customer/features/Product/screens/ProductScreen.tsx  (fixed: 8, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L80: cond: "${product.reviewCount} Reviews" / "No Reviews"
- L96: cond: "In stock" / "Out of stock"
- L423: cond: "No products match the selected filters." / "No products available right now."

**Fixed strings:**
- L183: title: "Error Loading Store"
- L210: text: "0 && price"
- L212: text: "0 && Number(p.rating \|\| 0)"
- L258: text: "0 \|\| filters.maxPrice"
- L364: text: "0 \|\| filters.maxPrice"
- L397: text: "Clear All"
- L417: text: "Loading marketplace products..."
- L426: title: "Reset Filters"

## src/roles/Customer/features/Product/screens/FilterScreen.tsx  (fixed: 10, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L340: jsx: active && { borderWidth: 3, borderColor: colors.primary },

**Fixed strings:**
- L28: title: "Electronics"
- L29: title: "Fashion & Apparel"
- L286: text: "Filter Products"
- L297: title: "Category"
- L321: title: "Colors"
- L357: title: "Storage"
- L383: title: "Price Range"
- L408: title: "Min Rating"
- L425: title: "Clear All"
- L427: title: "Apply Filters"

## src/roles/Customer/features/Product/screens/ProductDetailScreen.tsx  (fixed: 49, built from pieces: 12)

**Built from pieces or plural rules (hard to translate):**
- L660: tpl: `In Stock (${activeStock} left)`
- L660: cond: "In Stock (${activeStock} left)" / "Out of Stock"
- L792: tpl: `Max stock reached (${activeStock})`
- L793: tpl: `Max available: ${activeStock}`
- L833: cond: "Buy Now" / "Out of Stock"
- L841: cond: "Add to Cart" / "Out of Stock"
- L892: cond: "Online" / "Offline"
- L975: jsx: ({product.reviewCount \|\| 0} Reviews)
- L1114: cond: "Star" / "Stars"
- L1148: cond: "Photo added" / "Add a photo"
- L1164: cond: "Video added" / "Add a video"
- L1177: cond: "Submitting..." / "Submit Review"

**Fixed strings:**
- L332: title: "Add to Cart Failed"
- L370: title: "Checkout Error"
- L423: title: "Rating Required"
- L424: message: "Please select a star rating (1 to 5 stars) for this product."
- L434: title: "Review Message Required"
- L435: message: "Please write your review comment. Both star rating and a message are required to submit a review."
- L444: title: "Review Too Short"
- L445: message: "Please write at least a few words describing your experience with the product."
- L470: title: "Review Submitted"
- L471: message: "Thank you! Your review has been submitted successfully."
- L501: title: "Review Submission Failed"
- L520: title: "Review Deleted"
- L521: message: "Your review has been removed."
- L532: title: "Delete Failed"
- L580: text: "Loading product details..."
- L586: text: "Product Not Found"
- L589: text: "The requested product is not available or could not be loaded."
- L593: text: "Go Back"
- L596: text: "Retry"
- L744: text: "Select Option"
- L787: text: "Quantity"
- L899: title: "Visit Store"
- L910: title: "Ask Seller"
- L919: title: "Chat"
- L929: text: "Product Information"
- L935: text: "Specifications"
- L937: label: "Brand"
- L938: label: "SKU"
- L939: label: "Category"
- L940: label: "Total Variants"
- L941: label: "Total Stock"
- L942: label: "Price Range"
- L943: label: "Warranty"
- L959: text: "We stand behind every transaction on our platform. With our secure escrow system,"
- L968: text: "Rating &amp; Reviews"
- L972: text: "Our Rating"
- L1015: text: "No reviews yet. Be the first to review this product!"
- L1103: text: "Write a Review"
- L1105: text: "Share your experience with other customers"
- L1132: placeholder: "Write your review here (required)..."
- L1190: text: "Seasonal Sales"
- L1192: text: "Exclusive seasonal offers on selected items."
- L1197: text: "Money Back Guarantee"
- L1199: text: "Love it or return it within 7 days, no questions asked."
- L1204: text: "Free Shipping"
- L1206: text: "On all orders within 7 days delivery."
- L1214: text: "Related Products"
- L1247: title: "Message Sent"
- L1248: message: "Your message has been sent to the seller!"

## src/roles/Customer/features/Product/screens/SellerStoreScreen.tsx  (fixed: 5, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L222: tpl: `Search ${storeName}...`
- L231: jsx: ({filteredProducts.length} items)
- L296: cond: "Try adjusting your search terms" / "This seller has not listed any items yet."

**Fixed strings:**
- L198: text: "Products"
- L203: text: "Rating"
- L229: text: "All Store Products"
- L278: text: "Loading Store..."
- L294: text: "No products found"

## src/roles/Customer/features/Product/screens/CartScreen.tsx  (fixed: 13, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L342: tpl: `Are you sure you want to remove "${itemToDelete?.title}" from your cart?`

**Fixed strings:**
- L208: title: "Delete Failed"
- L259: text: "My Cart"
- L264: text: "Loading your cart..."
- L271: text: "Your shopping cart is currently empty."
- L274: title: "Explore Products"
- L297: text: "Order Summary"
- L306: text: "Sub total"
- L310: text: "Shipping"
- L317: text: "Total"
- L322: title: "Proceed to Checkout"
- L341: title: "Remove Item?"
- L343: confirmText: "Remove"
- L344: cancelText: "Keep"

## src/roles/Customer/features/Product/screens/CheckoutScreen.tsx  (fixed: 42, built from pieces: 5)

**Built from pieces or plural rules (hard to translate):**
- L71: tpl: `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
- L289: tpl: `${firstName} ${lastName}`
- L298: cond: "card" / "cod"
- L299: tpl: `${firstName} ${lastName}`
- L522: cond: "Placing Order..." / "Place Order Securely"

**Fixed strings:**
- L161: title: "Missing Details"
- L162: message: "Please fill in your full name, shipping address, city and phone number."
- L171: title: "Cart is Empty"
- L172: message: "Please add items to your cart before proceeding to checkout."
- L183: title: "Invalid Card Number"
- L184: message: "Card number must be exactly 16 digits."
- L193: title: "Invalid Card Number"
- L205: title: "Card Holder Required"
- L206: message: "Please enter the card holder name (at least 3 characters)."
- L215: title: "Invalid Expiry Date"
- L216: message: "Please enter expiry date in MM/YY format (e.g. 12/28)."
- L227: title: "Invalid Expiry Month"
- L228: message: "Expiry month must be between 01 and 12."
- L238: title: "Card Expired"
- L239: message: "This card has already expired. Please enter a valid future expiry date."
- L249: title: "Invalid CVV"
- L250: message: "CVV must be 3 or 4 digits."
- L320: title: "Order Failed"
- L384: text: "Shipping Address"
- L387: label: "First Name"
- L388: label: "Last Name"
- L389: label: "Email"
- L390: label: "Phone"
- L391: label: "Country"
- L392: label: "Address"
- L393: label: "City"
- L394: label: "Postal Code"
- L402: text: "Select Payment Method"
- L419: text: "Credit / Debit Card"
- L421: text: "Instant & secure online payment via Iyzico"
- L443: text: "Cash on Delivery (COD)"
- L445: text: "Pay in cash when your order is delivered"
- L456: text: "Card Information"
- L465: label: "Card Number"
- L479: label: "Name on Card"
- L483: placeholder: "Name on your card"
- L490: label: "Expiry"
- L497: placeholder: "MM/YY"
- L502: label: "CVV"
- L535: title: "Order Placed!"
- L540: cancelText: "Keep Shopping"
- L541: confirmText: "View Orders"

## src/roles/Customer/features/Product/screens/WishlistScreen.tsx  (fixed: 8, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L78: cond: "${product.reviewCount} Reviews" / "No Reviews"

**Fixed strings:**
- L65: text: "Refurbished"
- L116: message: "Failed to remove item"
- L184: text: "Items you love, saved for later"
- L190: text: "Loading your wishlist..."
- L197: text: "Nothing here yet — tap the heart on a product to save it."
- L200: title: "Explore Products"
- L229: title: "Continue Shopping"
- L241: title: "Wishlist"

## src/roles/Customer/features/Product/components/AskSellerModal.tsx  (fixed: 8, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L145: jsx: Ask {sellerName \|\| 'Seller'}

**Fixed strings:**
- L162: text: "Quick Topics:"
- L190: text: "Subject"
- L194: placeholder: "e.g. Warranty details?"
- L207: text: "Message"
- L211: placeholder: "Type your question or query for the seller..."
- L231: title: "Cancel"
- L237: title: "Send Message"
- L253: text: "Or start instant live chat with seller"

## src/roles/Customer/features/Orders/screens/OrdersScreen.tsx  (fixed: 32, built from pieces: 4)

**Built from pieces or plural rules (hard to translate):**
- L113: cond: "item" / "items"
- L262: tpl: `RET-${(ret._id \|\| '000000').slice(-6).toUpperCase()}`
- L476: cond: "No orders match your search filter." / "You have not placed any orders yet."
- L562: tpl: `Are you sure you want to cancel order ${cancellingOrder?.orderNo \|\| ''}?`

**Fixed strings:**
- L106: text: "Date"
- L111: text: "Item"
- L120: text: "Total"
- L126: text: "Payment"
- L133: text: "Order Items"
- L160: text: "Subtotal"
- L169: text: "View details & tracking →"
- L196: text: "View all  →"
- L345: title: "Order Cancelled"
- L346: message: "Your order cancellation request was processed successfully."
- L354: title: "Cancel Failed"
- L381: text: "My Orders"
- L383: text: "Track and manage all your purchases"
- L389: label: "All Orders"
- L390: label: "Marketplace"
- L391: label: "Refurbished Store"
- L434: text: "My Orders"
- L448: text: "My Returns"
- L458: placeholder: "Search order or product"
- L467: text: "Loading your orders..."
- L474: text: "No Orders Found"
- L489: text: "No Return Requests"
- L491: text: "You have not submitted any return requests yet."
- L508: text: "Shipping Address"
- L520: text: "Recent Order Summary"
- L524: text: "Subtotal"
- L531: text: "Total"
- L539: title: "Cancel Order"
- L546: title: "Returns"
- L561: title: "Cancel Order"
- L563: cancelText: "Not now"
- L564: confirmText: "Yes, Cancel Order"

## src/roles/Customer/features/Orders/screens/OrderDetailScreen.tsx  (fixed: 20, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L126: tpl: `RET-${(order?.id \|\| '396191').slice(-6).toUpperCase()}`
- L193: jsx: Order Items ({(order.items \|\| []).length})
- L217: jsx: QTY.{item.qty \|\| 1}  {money(item.price)} each

**Fixed strings:**
- L77: title: "Error Loading Order"
- L153: text: "Orders detail"
- L173: text: "Loading order details..."
- L180: text: "Order Not Found"
- L183: text: "The requested order details could not be found or loaded."
- L240: text: "Shipping Address"
- L261: text: "Order Info"
- L264: label: "Order ID"
- L265: label: "Order No."
- L266: label: "Date"
- L267: label: "Payment"
- L273: text: "Price Summary"
- L276: label: "Subtotal"
- L277: label: "Shipping"
- L279: label: "Total"
- L283: title: "Contact Seller"
- L291: title: "My Messages"
- L301: text: "Warranty Information"
- L322: title: "Message Sent"
- L323: message: "Your query has been sent to the seller successfully."

## src/roles/Customer/features/Orders/components/ContactSellerModal.tsx  (fixed: 7, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L116: cond: "padding" / "height"

**Fixed strings:**
- L123: text: "Contact Seller"
- L143: text: "Subject"
- L147: placeholder: "What would you like to ask the seller?"
- L152: text: "Message"
- L156: placeholder: "Describe your issue or question in detail..."
- L175: title: "Send Message"
- L182: title: "Cancel"

## src/roles/Customer/features/Orders/services/orderApi.ts  (fixed: 1, built from pieces: 2)

**Built from pieces or plural rules (hard to translate):**
- L109: tpl: `Item ${idx + 1}`
- L238: tpl: `RET-${(raw._id \|\| '000000').slice(-6).toUpperCase()}`

**Fixed strings:**
- L97: title: "Purchased Item"

## src/roles/Customer/features/Product/services/ecomApi.ts  (fixed: 1, built from pieces: 3)

**Built from pieces or plural rules (hard to translate):**
- L326: tpl: `${yrs} Year${yrs > 1 ? 's' : ''} Official Warranty Included`
- L328: tpl: `${m} Month${m > 1 ? 's' : ''} Official Warranty Included`
- L371: tpl: `SKU-${String(raw._id \|\| 'CTI-V1').slice(-8)}`

**Fixed strings:**
- L140: title: "Product"

## src/roles/Customer/context/CartContext.tsx  (fixed: 4, built from pieces: 1)

**Built from pieces or plural rules (hard to translate):**
- L33: tpl: `${a.name}: ${a.value}`

**Fixed strings:**
- L49: text: "Promise"
- L50: text: "Promise"
- L51: text: "Promise"
- L52: text: "Promise"

## src/roles/Customer/context/WishlistContext.tsx  (fixed: 3, built from pieces: 0)

**Fixed strings:**
- L58: text: "Promise"
- L59: text: "Promise"
- L194: title: "Favorited Product"

## src/components/AlertModal.tsx  (fixed: 1, built from pieces: 0)

**Fixed strings:**
- L40: buttonText: "Okay"

## src/components/ConfirmModal.tsx  (fixed: 2, built from pieces: 0)

**Fixed strings:**
- L28: confirmText: "Confirm"
- L29: cancelText: "Cancel"
