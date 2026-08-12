import { useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  chevronDownBold,
  commentDotsBold,
  desktopBold,
  facebookIcon,
  headphonesBold,
  linkedinIcon,
  mapPinBold,
  menuBold,
  mobileBold,
  searchBold,
  starExtra,
  tagBold,
  twitterIcon,
  usersThreeBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { BLOG_SECTIONS } from '@/roles/Customer/features/Blogs/data/blogs';
import { REPAIRMEN } from '@/roles/Customer/features/Repairmen/data/repairmen';
import {
  FAQS,
  FAQ_CATEGORIES,
  QUICK_SERVICES,
  REVIEWS,
  SPONSORED_PRODUCTS,
  STATS,
  STORES,
  TOP_PRODUCTS,
} from '../data/homeContent';

const SERVICE_ICONS = {
  'Mobile Repair': mobileBold,
  'Laptop Repair': desktopBold,
  Accessories: headphonesBold,
  'Sell Device': tagBold,
};

function Badge({ label }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { borderColor: colors.primary }]}>
      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function Header({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <Squeeze onPress={() => navigation.navigate('Settings')} scale={0.85}>
          <Icon source={menuBold} size={24} color={colors.text} />
        </Squeeze>
      </View>

      <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
        <Icon source={searchBold} size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search  order custom product"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
    </View>
  );
}

function Hero() {
  const { colors } = useTheme();

  return (
    <View style={[styles.hero, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}>
      <Image
        source={{ uri: 'https://picsum.photos/seed/cti-home-hero/700/700' }}
        style={styles.heroImage}
      />
      <View style={[styles.heroPill, { backgroundColor: colors.onPrimary }]}>
        <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.heroPillText, { color: colors.primary }]}>
          Trusted Repair Service
        </Text>
      </View>
      <Text style={[styles.heroTitle, { color: colors.text }]}>Fast &amp; Reliable Device Repairs</Text>
      <Text style={[styles.heroText, { color: colors.textMuted }]}>
        Hundreds of repairs completed every month, handled by verified professionals. Book in
        minutes and track your repair the whole way through.
      </Text>
      <Button title="Shop Now" size="lg" style={styles.heroButton} />
    </View>
  );
}

function ServiceFinder() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Badge label="Service Finder" />
      <Text style={[styles.cardTitle, { color: colors.text }]}>Quick  Service Finder</Text>
      <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
        Select your device brand, model, color and connect with verified professionals near you.
      </Text>

      <View style={styles.selectRow}>
        <SelectField label="Brand" value="Select Brand" style={styles.selectHalf} />
        <SelectField label="Model" value="Not Found" style={styles.selectHalf} />
      </View>
      <SelectField label="Color" value="Select Color" />

      <Button title="Find Service" size="lg" style={styles.findServiceButton} />
    </View>
  );
}

function SelectField({ label, value, style = null }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.select, { borderColor: colors.border }, style]}>
      <View style={styles.selectText}>
        <Text style={[styles.selectLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.selectValue, { color: colors.text }]}>{value}</Text>
      </View>
      <Icon source={chevronDownBold} size={16} color={colors.textMuted} />
    </View>
  );
}

function OurServices() {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Badge label="Our Services" />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Services</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.servicesRow}>
        {QUICK_SERVICES.map(service => (
          <Squeeze key={service.id}>
            <View style={styles.serviceItem}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Icon source={SERVICE_ICONS[service.label]} size={26} color={colors.primary} />
              </View>
              <Text style={[styles.serviceLabel, { color: colors.text }]} numberOfLines={1}>
                {service.label}
              </Text>
            </View>
          </Squeeze>
        ))}
      </ScrollView>
    </View>
  );
}

function SpecialistCard({ repairman }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.specialistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: repairman.photo }} style={styles.specialistImage} />

      <View style={styles.specialistBody}>
        <Text style={[styles.specialistName, { color: colors.text }]}>{repairman.name}</Text>
        <Text style={[styles.specialistRole, { color: colors.textMuted }]}>{repairman.role}</Text>

        <View style={styles.metaRow}>
          <Icon source={mapPinBold} size={13} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {repairman.shortLocation}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.specialistDescription, { color: colors.textMuted }]} numberOfLines={3}>
          {repairman.description}
        </Text>

        <View style={styles.socialRow}>
          <Squeeze onPress={() => Linking.openURL(repairman.social.facebook)} scale={0.85}>
            <Icon source={facebookIcon} size={22} />
          </Squeeze>
          <Squeeze onPress={() => Linking.openURL(repairman.social.twitter)} scale={0.85}>
            <Icon source={twitterIcon} size={22} />
          </Squeeze>
          <Squeeze onPress={() => Linking.openURL(repairman.social.linkedin)} scale={0.85}>
            <Icon source={linkedinIcon} size={22} />
          </Squeeze>
        </View>

        <View style={styles.specialistActions}>
          <Button title="Book Appointement" style={styles.bookButton} />
          <Squeeze style={[styles.chatButton, { borderColor: colors.border }]}>
            <Icon source={commentDotsBold} size={20} color={colors.text} />
          </Squeeze>
        </View>
      </View>
    </View>
  );
}

function OurSpecialists() {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Badge label="Our Specialists" />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Meet Our Verified Professional</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
        Our certified repair experts bring years of hands-on experience and consistently high
        customer satisfaction.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.specialistsRow}>
        {REPAIRMEN.slice(0, 4).map(repairman => (
          <SpecialistCard key={repairman.id} repairman={repairman} />
        ))}
      </ScrollView>
    </View>
  );
}

function TrustedStats() {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Trusted by 169.65 Lac+ Happy Users and Major Brands since 2015
      </Text>

      <View style={styles.statsGrid}>
        {STATS.map(stat => (
          <View key={stat.id} style={[styles.statCard, { backgroundColor: colors.primary + '14' }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
              <Icon source={usersThreeBold} size={16} color={colors.onPrimary} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.primary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function OurBlogs({ navigation }) {
  const { colors } = useTheme();
  const posts: any[] = BLOG_SECTIONS[0].posts.slice(0, 3);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Blogs</Text>

      {posts.map(post => (
        <Squeeze
          key={post.id}
          onPress={() => navigation.navigate('BlogDetail', { post })}
          style={[styles.blogCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: post.image }} style={styles.blogImage} />
          <Text style={[styles.blogTitle, { color: colors.text }]}>{post.title}</Text>
          {post.description && (
            <Text style={[styles.blogText, { color: colors.textMuted }]} numberOfLines={2}>
              {post.description}
            </Text>
          )}
          <Text style={[styles.blogReadMore, { color: colors.error }]}>Readmore</Text>
        </Squeeze>
      ))}
    </View>
  );
}

function FAQSection() {
  const { colors } = useTheme();
  const [category, setCategory] = useState(FAQ_CATEGORIES[0]);
  const [openId, setOpenId] = useState(null);

  const faqs = FAQS.filter(faq => faq.category === category);

  return (
    <View style={styles.section}>
      <Badge label="Frequently Asked Questions" />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>

      <View style={styles.faqTabs}>
        {FAQ_CATEGORIES.map(item => {
          const active = item === category;
          return (
            <Squeeze key={item} onPress={() => setCategory(item)}>
              <View
                style={[
                  styles.faqTab,
                  { backgroundColor: active ? colors.primary : colors.primary + '1A' },
                ]}>
                <Text style={[styles.faqTabText, { color: active ? colors.onPrimary : colors.primary }]}>
                  {item}
                </Text>
              </View>
            </Squeeze>
          );
        })}
      </View>

      <View style={styles.faqList}>
        {faqs.map(faq => {
          const open = faq.id === openId;
          return (
            <Squeeze
              key={faq.id}
              onPress={() => setOpenId(open ? null : faq.id)}
              style={[styles.faqItem, { borderColor: colors.border }]}>
              <View style={styles.faqQuestionRow}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                <Icon
                  source={chevronDownBold}
                  size={16}
                  color={colors.text}
                  style={open && styles.chevronFlipped}
                />
              </View>
              {open && (
                <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>{faq.answer}</Text>
              )}
            </Squeeze>
          );
        })}
      </View>

      <View style={[styles.questionCta, { backgroundColor: colors.primary }]}>
        <Text style={styles.questionCtaTitle}>Still Have a Question?</Text>
        <Text style={styles.questionCtaText}>
          Can't find what you're looking for? Our support team is happy to help with anything
          repair or order related.
        </Text>
        <Button title="Contact Support" variant="soft" size="sm" style={styles.questionCtaButton} />
      </View>
    </View>
  );
}

function RatingsSlider() {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onScrollEnd = event => {
    if (!width) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>What Our Customers Say</Text>

      <View style={styles.ratingsWrap} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}>
          {REVIEWS.map(review => (
            <View key={review.id} style={{ width, paddingHorizontal: 6 }}>
              <View
                style={[
                  styles.reviewCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.reviewHead}>
                  <Image source={{ uri: review.photo }} style={styles.reviewAvatar} />
                  <Text style={[styles.specialistName, { color: colors.text }]}>{review.name}</Text>
                </View>
                <Text style={[styles.reviewText, { color: colors.textMuted }]}>{review.text}</Text>
                <View style={styles.reviewFoot}>
                  <Icon source={starExtra} size={16} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{review.date}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {REVIEWS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function ProductCard({ product }) {
  const { colors } = useTheme();

  return (
    <Squeeze style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.productHead}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.productLogo} />
        <View style={[styles.adBadge, { backgroundColor: colors.text }]}>
          <Text style={[styles.adBadgeText, { color: colors.background }]}>AD</Text>
        </View>
      </View>

      <Image source={{ uri: product.image }} style={styles.productImage} />

      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={[styles.productDescription, { color: colors.textMuted }]} numberOfLines={2}>
        {product.description}
      </Text>

      <View style={styles.productRating}>
        {[1, 2, 3, 4, 5].map(n => (
          <Icon
            key={n}
            source={starExtra}
            size={13}
            color={n <= Math.round(product.rating) ? colors.primary : colors.border}
          />
        ))}
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          {product.rating.toFixed(1)} ({product.ratingCount})
        </Text>
      </View>

      <Text style={[styles.productPrice, { color: colors.error }]}>${product.price.toFixed(2)}</Text>
    </Squeeze>
  );
}

function ProductsSlider({ title, products }) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.productsRow}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}

function StoreCard({ store }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.storeImageWrap}>
        <Image source={{ uri: store.image }} style={styles.storeImage} />
        <View style={[styles.sponsoredBadge, { backgroundColor: colors.text }]}>
          <Text style={[styles.sponsoredBadgeText, { color: colors.background }]}>Sponsored</Text>
        </View>
      </View>

      <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
      <Text style={[styles.storeTagline, { color: colors.primary }]}>{store.tagline}</Text>
      <Text style={[styles.storeDescription, { color: colors.textMuted }]} numberOfLines={2}>
        {store.description}
      </Text>

      <View style={styles.metaRow}>
        <Icon source={mapPinBold} size={13} color={colors.textMuted} />
        <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
          {store.address}
        </Text>
      </View>

      <Text style={[styles.visitStore, { color: colors.primary }]}>Visit Store  →</Text>
    </View>
  );
}

function BestRatedStores() {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Badge label="Sponsored" />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Rated Stores</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
        Discover top-rated shops handpicked for you - quality guaranteed.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.storesRow}>
        {STORES.map(store => (
          <StoreCard key={store.id} store={store} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <FadeUp duration={500}>
          <Hero />
        </FadeUp>
        <FadeUp duration={500} delay={60}>
          <ServiceFinder />
        </FadeUp>
        <FadeUp duration={500} delay={100}>
          <OurServices />
        </FadeUp>
        <FadeUp duration={500} delay={140}>
          <OurSpecialists />
        </FadeUp>
        <FadeUp duration={500} delay={180}>
          <TrustedStats />
        </FadeUp>
        <FadeUp duration={500} delay={220}>
          <OurBlogs navigation={navigation} />
        </FadeUp>
        <FadeUp duration={500} delay={260}>
          <FAQSection />
        </FadeUp>
        <FadeUp duration={500} delay={300}>
          <RatingsSlider />
        </FadeUp>
        <FadeUp duration={500} delay={340}>
          <ProductsSlider title="Sponsored Products" products={SPONSORED_PRODUCTS} />
        </FadeUp>
        <FadeUp duration={500} delay={380}>
          <BestRatedStores />
        </FadeUp>
        <FadeUp duration={500} delay={420}>
          <ProductsSlider title="Top Products" products={TOP_PRODUCTS} />
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 110, height: 59 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },

  body: { paddingHorizontal: 20 },
  // Lets horizontal sliders bleed to the screen edge while the rest of the
  // page keeps its 20px padding.
  bleed: { marginHorizontal: -20 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontFamily: fonts.regular, fontSize: 12 },

  section: { marginTop: 28 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 27, marginTop: 10 },
  sectionSubtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },

  hero: { borderRadius: 16, padding: 18, marginTop: 18 },
  heroImage: { width: '100%', height: 170, borderRadius: 12 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
  },
  heroPillText: { fontFamily: fonts.medium, fontSize: 12 },
  heroTitle: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 29, marginTop: 12 },
  heroText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 8 },
  heroButton: { marginTop: 16 },

  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 20 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 19, marginTop: 12 },
  cardSubtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },

  selectRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  selectHalf: { flex: 1 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  selectText: { gap: 2 },
  selectLabel: { fontFamily: fonts.regular, fontSize: 11 },
  selectValue: { fontFamily: fonts.bold, fontSize: 14 },
  findServiceButton: { marginTop: 16 },

  servicesRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  serviceItem: { alignItems: 'center', gap: 8, width: 76 },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' },

  specialistsRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  specialistCard: { width: 260, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  specialistImage: { width: '100%', height: 150 },
  specialistBody: { padding: 14, gap: 4 },
  specialistName: { fontFamily: fonts.bold, fontSize: 16 },
  specialistRole: { fontFamily: fonts.regular, fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 12 },
  divider: { height: 1, marginVertical: 10 },
  specialistDescription: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  socialRow: { flexDirection: 'row', gap: 14, marginTop: 12 },
  specialistActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  bookButton: { flex: 1 },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  statCard: { width: '47%', borderRadius: 14, padding: 14, gap: 8 },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 18 },
  statLabel: { fontFamily: fonts.regular, fontSize: 12 },

  blogCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 14 },
  blogImage: { width: '100%', height: 130, borderRadius: 10 },
  blogTitle: { fontFamily: fonts.bold, fontSize: 16, marginTop: 12 },
  blogText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },
  blogReadMore: { fontFamily: fonts.bold, fontSize: 13, marginTop: 8 },

  faqTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  faqTab: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  faqTabText: { fontFamily: fonts.medium, fontSize: 12 },
  faqList: { gap: 10, marginTop: 14 },
  faqItem: { borderWidth: 1, borderRadius: 12, padding: 14 },
  faqQuestionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  faqQuestion: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  chevronFlipped: { transform: [{ rotate: '180deg' }] },
  faqAnswer: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 10 },

  questionCta: { borderRadius: 16, padding: 20, marginTop: 18 },
  questionCtaTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' },
  questionCtaText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: '#FFFFFF', marginTop: 8 },
  questionCtaButton: { alignSelf: 'flex-start', marginTop: 16 },

  reviewCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  ratingsWrap: { marginTop: 16 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 12 },
  reviewFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  productsRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  productCard: { width: 170, borderRadius: 14, borderWidth: 1, padding: 12 },
  productHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productLogo: { width: 70, height: 38 },
  adBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adBadgeText: { fontFamily: fonts.bold, fontSize: 9 },
  productImage: { width: '100%', height: 100, borderRadius: 10, marginTop: 8 },
  productName: { fontFamily: fonts.bold, fontSize: 13, marginTop: 10 },
  productDescription: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, marginTop: 4 },
  productRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  productPrice: { fontFamily: fonts.bold, fontSize: 15, marginTop: 6 },

  storesRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  storeCard: { width: 280, borderRadius: 16, borderWidth: 1, padding: 14 },
  storeImageWrap: { borderRadius: 12, overflow: 'hidden' },
  storeImage: { width: '100%', height: 140 },
  sponsoredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sponsoredBadgeText: { fontFamily: fonts.medium, fontSize: 11 },
  storeName: { fontFamily: fonts.bold, fontSize: 16, marginTop: 12 },
  storeTagline: { fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
  storeDescription: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 6 },
  visitStore: { fontFamily: fonts.bold, fontSize: 13, marginTop: 12 },
});
