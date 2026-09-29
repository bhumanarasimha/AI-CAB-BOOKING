import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme/theme';
import { HomeScreen } from '../screens/user/HomeScreen';
import { RideComparisonScreen } from '../screens/user/RideComparisonScreen';
import { ExplainableAIScreen } from '../screens/user/ExplainableAIScreen';
import { ActivityScreen } from '../screens/user/ActivityScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.brandCyan,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Rides',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Text style={styles.iconEmoji}>🚖</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CompareTab"
        component={RideComparisonScreen}
        options={{
          tabBarLabel: 'Compare',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Text style={styles.iconEmoji}>📊</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AITab"
        component={ExplainableAIScreen}
        options={{
          tabBarLabel: 'AI Engine',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Text style={styles.iconEmoji}>🧠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Text style={styles.iconEmoji}>🕒</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Text style={styles.iconEmoji}>👤</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0A0F1D',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 26,
    borderRadius: 13,
  },
  activeIconWrap: {
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
  },
  iconEmoji: {
    fontSize: 16,
  },
});
