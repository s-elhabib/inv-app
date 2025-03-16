import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { BaseScreen } from '../components/BaseScreen';
import { 
  StyledText, 
  StyledCard 
} from '../components/StyledComponents';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Feather'; // Make sure to install this package

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const stats = [
    { icon: 'shopping-bag', title: 'Total Orders', value: '156' },
    { icon: 'dollar-sign', title: 'Revenue', value: '$2,354' },
    { icon: 'users', title: 'Customers', value: '43' },
    { icon: 'box', title: 'Products', value: '89' },
  ];

  const recentActivities = [
    { type: 'order', title: 'New Order #1234', time: '2 minutes ago' },
    { type: 'payment', title: 'Payment Received', time: '1 hour ago' },
    { type: 'stock', title: 'Low Stock Alert', time: '3 hours ago' },
  ];

  return (
    <BaseScreen>
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <StyledText style={styles.greeting}>Welcome back,</StyledText>
            <StyledText style={styles.userName}>{user?.name}</StyledText>
          </View>
          <StyledCard style={styles.profileCard}>
            <Icon name="user" size={24} color={colors[theme].primary} />
          </StyledCard>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StyledCard key={index} style={styles.statCard}>
              <Icon 
                name={stat.icon} 
                size={24} 
                color={colors[theme].primary} 
                style={styles.statIcon}
              />
              <StyledText style={styles.statValue}>{stat.value}</StyledText>
              <StyledText style={styles.statTitle}>{stat.title}</StyledText>
            </StyledCard>
          ))}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <StyledText style={styles.sectionTitle}>Recent Activity</StyledText>
          <StyledCard style={styles.activityCard}>
            {recentActivities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Icon 
                  name={activity.type === 'order' ? 'shopping-bag' : 
                        activity.type === 'payment' ? 'credit-card' : 'alert-circle'} 
                  size={20} 
                  color={colors[theme].primary}
                />
                <View style={styles.activityContent}>
                  <StyledText style={styles.activityTitle}>
                    {activity.title}
                  </StyledText>
                  <StyledText style={styles.activityTime}>
                    {activity.time}
                  </StyledText>
                </View>
              </View>
            ))}
          </StyledCard>
        </View>
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  profileCard: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activityCard: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.7,
  },
});