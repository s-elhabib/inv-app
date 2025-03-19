import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Share } from 'lucide-react-native';
import { generateAndShareInvoice } from '../../utils/invoiceGenerator';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { order } = route.params;

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => generateAndShareInvoice(order)}
          >
            <Share size={20} color="#F47B20" />
          </TouchableOpacity>
        </View>
        <Text style={styles.date}>{formatDate(order.created_at)}</Text>
        <Text style={styles.clientName}>{order.clients?.name}</Text>
        <Text style={[
          styles.status,
          order.status === 'completed' ? styles.statusCompleted : styles.statusPending
        ]}>
          {order.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.sales?.map((sale) => (
          <View key={sale.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{sale.products?.name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.quantity}>x{sale.quantity}</Text>
              <Text style={styles.amount}>{formatCurrency(sale.amount)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items</Text>
          <Text style={styles.summaryValue}>
            {order.sales?.reduce((sum, sale) => sum + sale.quantity, 0)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(order.total_amount)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    padding: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  statusCompleted: {
    backgroundColor: '#e6f4ea',
    color: '#1e7e34',
  },
  statusPending: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  summary: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default OrderDetailsScreen;