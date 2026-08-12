import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../features/Auth/screens/LoginScreen';
import SignUpScreen from '../features/Auth/screens/SignUpScreen';
import ForgotPasswordScreen from '../features/Auth/screens/ForgotPasswordScreen';
import VerifyOtpScreen from '../features/Auth/screens/VerifyOtpScreen';
import ResetPasswordScreen from '../features/Auth/screens/ResetPasswordScreen';
import ResetSuccessScreen from '../features/Auth/screens/ResetSuccessScreen';

const Stack = createNativeStackNavigator();

export default function CustomerAuthStack({ onLoggedIn }) {
  return (
    <Stack.Navigator
      id="CustomerAuth"
      screenOptions={{ headerShown: false, animation: 'simple_push', animationDuration: 380 }}>
      <Stack.Screen name="Login">
        {props => <LoginScreen {...props} onLoggedIn={onLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOtp">
        {props => <VerifyOtpScreen {...props} onLoggedIn={onLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen
        name="ResetSuccess"
        component={ResetSuccessScreen}
        options={{ animation: 'fade', animationDuration: 400 }}
      />
    </Stack.Navigator>
  );
}
