import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const categories = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'bike', label: 'Moto', icon: '🏍️' },
  { id: 'auto', label: 'Auto', icon: '🛺' },
  { id: 'cab4', label: 'Cab (4s)', icon: '🚗' },
  { id: 'cab7', label: 'XL (6-7s)', icon: '🚙' },
  { id: 'transit', label: 'Transit AI', icon: '🚆' },
];

export const CategorySelector = ({ selectedCategory = 'all', onSelectCategory }) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.8}
              style={[
                styles.tab,
                isActive && styles.activeTab,
              ]}
            >
              <Text style={styles.tabIcon}>{cat.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
    borderColor: theme.colors.brandCyan,
    shadowColor: theme.colors.brandCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  activeTabLabel: {
    color: theme.colors.brandCyan,
    fontWeight: '700',
  },
});
