# Text restored from the web (for the language step)

Copied word for word from the web project. Turkish exists on the web only for the promo strip (`src/messages/tr.json`); the other texts have no Turkish on the web yet.

## Promo strip (Home top) - web: `messages/en.json` and `tr.json`, `Home.PromoMarquee`
File in the app: `src/roles/Customer/features/Home/components/PromoStrip.tsx`

| key | English | Turkish (from the web) |
|---|---|---|
| shipping | Free Shipping & Fast Delivery | Ücretsiz Kargo & Hızlı Teslimat |
| warranty | 1 Year Warranty | 1 Yıl Garanti |
| quality | Premium Quality Refurbished | Premium Kalite Yenilenmiş |
| support | 24/7 Customer Support | 7/24 Müşteri Desteği |
| payments | Secure Payments | Güvenli Ödemeler |

## Platform guarantee cards (product detail and refurbished detail) - web: `components/website/PlatformGuarantees.jsx`
File in the app: `src/components/PlatformGuarantees.tsx`

- Title: Platform Guarantee & Buyer Protection
- Body: We stand behind every transaction on our platform. With our secure escrow system, your payment is protected and is only released to the seller once you receive the product exactly as described. Shop with confidence knowing our 24/7 support team is here to assist you with any disputes or issues.
- Title: Easy Returns & Refund Policy
- Body: Not satisfied with your purchase? You can return eligible items within 7 days of delivery for a full refund or exchange. We provide hassle-free return shipping labels and process refunds swiftly back to your original payment method. Terms and conditions apply.

## CTI Platform block (refurbished detail, only when the platform listed the product) - web: `RefurbishedProductDetail.jsx`
- CTI Platform
- Verified & Certified Refurbished

## Grade Explained (refurbished detail) - web: `components/website/refurbish/CategoryInfoSections.jsx`
File in the app: `src/features/Refurbished/data/gradeData.ts` (tab names, "Overall", and one line per check for phone, laptop and tablet; the web pictures are not copied)
- Heading: Grade Explained
- Tabs: Superb, Good, Fair, Best Value
- Label: Overall

## Sell pages (Sell Refurbished screen) - web: `sell-devices/[categorySlug]/page.jsx`, `sell-old-phone/page.jsx`
Files in the app: `Refurbished/components/SellWebSections.tsx`, `SellRefurbishedScreen.tsx` (headline)
- Headline (phone tab): Sell Old Mobile Phone for Instant Cash. Headline (gadgets tab): Sell Your Gadgets for Instant Cash (the web puts the category name in "Sell Your {name} for Instant Cash")
- How It Works: 1. Check Price - Select your device & tell us about its current condition. Our smart system will tailor make the perfect price for you. / 2. Schedule Pickup - Book a free pickup from your home or work at a time slot that best suits your convenience. / 3. Get Paid - Receive your payment instantly as soon as our executive picks up your device. Instant payment all the way!
- Why Us: Best Prices - Objective AI-based pricing / Instant Payment - Instant Money Transfer in your preferred mode at time of pick up or store drop off / Simple & Convenient - Check price, schedule pickup & get paid / Free Doorstep Pickup (title only, the "1500 cities across India" line was removed: wrong country) / Factory Grade Data Wipe - 100% Safe and Data Security Guaranteed / Valid Purchase Invoice - Genuine Bill of Sale

## CTI Verified Sell card (condition, quote and upload-media steps) - web: the three pages under `sell-devices/.../[modelSlug]/`
File in the app: `Refurbished/components/CtiVerifiedSellCard.tsx`
- CTI Verified Sell
- Get paid instantly at your doorstep. We guarantee 100% data security and professional device assessment through the CTI platform.
