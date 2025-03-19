import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Calendar } from 'lucide-react-native';

const FILTER_OPTIONS = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: '15 Days', value: 'semi-month' },
  { label: 'This Month', value: 'month' },
];

const OrdersListScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('day');

  useEffect(() => {
    fetchOrders(activeFilter);
  }, [activeFilter]);

  const getDateRange = (filter) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (filter) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'semi-month':
        startDate.setDate(now.getDate() - 15);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }
    
    return {
      start: startDate.toISOString(),
      end: now.toISOString(),
    };
  };

  const fetchOrders = async (filter) => {
    try {
      setLoading(true);
      const dateRange = getDateRange(filter);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (
            name
          ),
          sales (
            id,
            quantity,
            amount,
            products:product_id(name)
          )
        `)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)} MAD`;
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        console.log('Navigating to OrderDetails with order:', item); // Add this for debugging
        navigation.navigate('OrderDetails', { 
          order: {
            ...item,
            clients: item.clients,
            sales: item.sales
          }
        });
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.clientName}>{item.clients?.name || 'Unknown Client'}</Text>
        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
      </View>
      
      <View style={styles.orderSummary}>
        <View style={styles.orderDetails}>
          <Text style={styles.totalItems}>
            Items: {item.sales?.length || 0}
          </Text>
          <Text style={styles.orderAmount}>
            {formatCurrency(item.total_amount || 0)}
          </Text>
        </View>
        <Text style={[
          styles.orderStatus,
          item.status === 'completed' ? styles.statusCompleted : styles.statusPending
        ]}>
          {(item.status || 'pending').toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Calendar size={20} color="#666" />
          <Text style={styles.filterTitle}>Filter by:</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                activeFilter === option.value && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter(option.value)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === option.value && styles.filterButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F47B20" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#666',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#F47B20',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetails: {
    flex: 1,
  },
  totalItems: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  statusCompleted: {
    backgroundColor: '#e6f4ea',
    color: '#1e7e34',
  },
  statusPending: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  },
});

export default OrdersListScreen;



