import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SellerMainScreen from '../screens/SellerMainScreen';
import AddProductScreen from '../features/Product/screens/AddProductScreen';
import ImportExportScreen from '../features/Product/screens/ImportExportScreen';
import CancelledOrdersScreen from '../features/Orders/screens/CancelledOrdersScreen';
import ReturnRequestsScreen from '../features/Orders/screens/ReturnRequestsScreen';
import CreateCampaignScreen from '../features/Ads/screens/CreateCampaignScreen';
import ChatDetailScreen from '../features/Chat/screens/ChatDetailScreen';
import SettingsScreen from '../features/Settings/screens/SettingsScreen';

// Screens shared across roles
import OrdersScreen from '@/roles/Customer/features/Orders/screens/OrdersScreen';
import OrderDetailScreen from '@/roles/Customer/features/Orders/screens/OrderDetailScreen';
import ExpertRepairmenScreen from '@/roles/Customer/features/Repairmen/screens/ExpertRepairmenScreen';
import BlogsScreen from '@/roles/Customer/features/Blogs/screens/BlogsScreen';
import BlogDetailScreen from '@/roles/Customer/features/Blogs/screens/BlogDetailScreen';
import AboutScreen from '@/roles/Customer/features/About/screens/AboutScreen';
import AcademyScreen from '@/roles/Customer/features/Academy/screens/AcademyScreen';
import CoursesListScreen from '@/roles/Customer/features/Academy/screens/CoursesListScreen';
import CourseDetailScreen from '@/roles/Customer/features/Academy/screens/CourseDetailScreen';
import FilterScreen from '@/roles/Customer/features/Product/screens/FilterScreen';
import ProductDetailScreen from '@/roles/Customer/features/Product/screens/ProductDetailScreen';
import CartScreen from '@/roles/Customer/features/Product/screens/CartScreen';
import CheckoutScreen from '@/roles/Customer/features/Product/screens/CheckoutScreen';
import WishlistScreen from '@/roles/Customer/features/Product/screens/WishlistScreen';
import { WishlistProvider } from '@/roles/Customer/context/WishlistContext';
import PrivacyPolicyScreen from '@/features/Legal/screens/PrivacyPolicyScreen';
import TermsScreen from '@/features/Legal/screens/TermsScreen';
import ProfileScreen from '@/features/Profile/screens/ProfileScreen';
import EditProfileScreen from '@/features/Profile/screens/EditProfileScreen';
import ServiceCatalogScreen from '@/features/Profile/screens/ServiceCatalogScreen';
import ChangePasswordScreen from '@/features/Profile/screens/ChangePasswordScreen';

// Refurbished Feature screens
import BuyRefurbishedScreen from '@/features/Refurbished/screens/BuyRefurbishedScreen';
import AllGadgetsScreen from '@/features/Refurbished/screens/AllGadgetsScreen';
import RefurbishedProductDetailScreen from '@/features/Refurbished/screens/RefurbishedProductDetailScreen';
import SellRefurbishedScreen from '@/features/Refurbished/screens/SellRefurbishedScreen';
import SelectModelScreen from '@/features/Refurbished/screens/SelectModelScreen';
import SelectVariantScreen from '@/features/Refurbished/screens/SelectVariantScreen';
import DeviceConditionScreen from '@/features/Refurbished/screens/DeviceConditionScreen';
import UploadDeviceMediaScreen from '@/features/Refurbished/screens/UploadDeviceMediaScreen';
import QuoteApplicationScreen from '@/features/Refurbished/screens/QuoteApplicationScreen';
import ApplicationSubmittedScreen from '@/features/Refurbished/screens/ApplicationSubmittedScreen';

const Stack = createNativeStackNavigator();

export default function SellerNavigator({ onLogout }: any) {
  return (
    <WishlistProvider>
      <Stack.Navigator
        id="Seller"
        initialRouteName="SellerMain"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="SellerMain" component={SellerMainScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="ImportExport" component={ImportExportScreen} />
        <Stack.Screen name="CancelledOrders" component={CancelledOrdersScreen} />
        <Stack.Screen name="ReturnRequests" component={ReturnRequestsScreen} />
        <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="Settings">
          {props => (
            <SettingsScreen
              {...props}
              onLogout={onLogout}
              onSelectTab={(tab: string) => {
                props.navigation.navigate('SellerMain', { initialTab: tab });
              }}
            />
          )}
        </Stack.Screen>

        {/* Shared Screens */}
        <Stack.Screen name="ExpertRepairmen" component={ExpertRepairmenScreen} />
        <Stack.Screen name="Blogs" component={BlogsScreen} />
        <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Academy" component={AcademyScreen} />
        <Stack.Screen name="Courses" component={CoursesListScreen} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />

        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="ProductFilter" component={FilterScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />

        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ServiceCatalog" component={ServiceCatalogScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

        {/* Refurbished screens */}
        <Stack.Screen name="BuyRefurbished" component={BuyRefurbishedScreen} />
        <Stack.Screen name="AllGadgets" component={AllGadgetsScreen} />
        <Stack.Screen name="RefurbishedProductDetail" component={RefurbishedProductDetailScreen} />
        <Stack.Screen name="SellRefurbished" component={SellRefurbishedScreen} />
        <Stack.Screen name="SelectModel" component={SelectModelScreen} />
        <Stack.Screen name="SelectVariant" component={SelectVariantScreen} />
        <Stack.Screen name="DeviceCondition" component={DeviceConditionScreen} />
        <Stack.Screen name="UploadDeviceMedia" component={UploadDeviceMediaScreen} />
        <Stack.Screen name="QuoteApplication" component={QuoteApplicationScreen} />
        <Stack.Screen name="ApplicationSubmitted" component={ApplicationSubmittedScreen} />

        {/* Legal documents */}
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
