import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { TabNavigator } from './TabNavigator';
import { RideComparisonScreen } from '../screens/user/RideComparisonScreen';
import { ParcelScreen } from '../screens/user/ParcelScreen';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#080C14' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="RideComparison" component={RideComparisonScreen} />
      <Stack.Screen name="Parcel" component={ParcelScreen} />
    </Stack.Navigator>
  );
};
