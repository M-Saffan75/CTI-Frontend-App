import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomerTabs from './CustomerTabs';
import SettingsScreen from '../features/Settings/screens/SettingsScreen';
import RepairDetailScreen from '../features/Jobs/screens/RepairDetailScreen';
import DisputeDetailScreen from '../features/Jobs/screens/DisputeDetailScreen';
import OrdersScreen from '../features/Orders/screens/OrdersScreen';
import OrderDetailScreen from '../features/Orders/screens/OrderDetailScreen';
import ExpertRepairmenScreen from '../features/Repairmen/screens/ExpertRepairmenScreen';
import BlogsScreen from '../features/Blogs/screens/BlogsScreen';
import BlogDetailScreen from '../features/Blogs/screens/BlogDetailScreen';
import AboutScreen from '../features/About/screens/AboutScreen';
import AcademyScreen from '../features/Academy/screens/AcademyScreen';
import CoursesListScreen from '../features/Academy/screens/CoursesListScreen';
import CourseDetailScreen from '../features/Academy/screens/CourseDetailScreen';
import PrivacyPolicyScreen from '@/features/Legal/screens/PrivacyPolicyScreen';
import TermsScreen from '@/features/Legal/screens/TermsScreen';
import FilterScreen from '../features/Product/screens/FilterScreen';
import ProductDetailScreen from '../features/Product/screens/ProductDetailScreen';
import CartScreen from '../features/Product/screens/CartScreen';
import CheckoutScreen from '../features/Product/screens/CheckoutScreen';
import WishlistScreen from '../features/Product/screens/WishlistScreen';
import { WishlistProvider } from '../context/WishlistContext';

const Stack = createNativeStackNavigator();

// Every Customer screen gets registered here. Seller and Repairman never see them.
export default function CustomerNavigator({ onLogout }) {
  return (
    <WishlistProvider>
      <Stack.Navigator
        id="Customer"
        screenOptions={{
          headerShown: false,
          // Android ignores animationDuration on its default transition, so we pick
          // one it can actually time. simple_push still reads as a normal push.
          animation: 'simple_push',
          animationDuration: 380,
        }}>
        {/* The bottom tab bar (Home / Repair / Product / Profile) lives here.
            Everything below is pushed on top of it, which hides the tab bar. */}
        <Stack.Screen name="Home" component={CustomerTabs} />
        <Stack.Screen name="Settings">
          {props => <SettingsScreen {...props} onLogout={onLogout} />}
        </Stack.Screen>
        <Stack.Screen name="RepairDetail" component={RepairDetailScreen} />
        <Stack.Screen name="DisputeDetail" component={DisputeDetailScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="ExpertRepairmen" component={ExpertRepairmenScreen} />
        <Stack.Screen name="Blogs" component={BlogsScreen} />
        <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Academy" component={AcademyScreen} />
        <Stack.Screen name="Courses" component={CoursesListScreen} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <Stack.Screen name="ProductFilter" component={FilterScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        {/* Legal documents slide up from the bottom instead of in from the side. */}
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ animation: 'fade_from_bottom', animationDuration: 600 }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{ animation: 'fade_from_bottom', animationDuration: 600 }}
        />
      </Stack.Navigator>
    </WishlistProvider>
  );
}
