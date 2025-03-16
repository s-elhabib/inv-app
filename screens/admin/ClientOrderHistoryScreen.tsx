import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Platform,
  Modal 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Search, Calendar, ChevronDown, X } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

export default function ClientOrderHistoryScreen() {
  const isFocused = useIsFocused();
  const [clientList, setClientList] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientOrders, setClientOrders] = useState([]);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientList, setShowClientList] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  
  // Date filter states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState('start'); // 'start' or 'end'

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Generate date options for the picker
  const generateDateOptions = () => {
    const dates = [];
    const currentDate = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  const dateOptions = generateDateOptions();

  const openDatePicker = (type) => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const handleDateSelect = (date) => {
    const selectedDate = new Date(date);
    if (datePickerType === 'start') {
      selectedDate.setHours(0, 0, 0, 0);
      setStartDate(selectedDate);
    } else {
      selectedDate.setHours(23, 59, 59, 999);
      setEndDate(selectedDate);
    }
    setShowDatePicker(false);
    
    if (selectedClient) {
      fetchClientOrders(selectedClient.id);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} MAD`;
  };

  useEffect(() => {
    if (isFocused) {
      fetchClients();
    }
  }, [isFocused]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setClientList(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientOrders = async (clientId) => {
    if (!clientId) return;
    
    setLoadingClientData(true);
    try {
      console.log('Fetching orders for client:', clientId);
      console.log('Date range:', {
        start: startDate.toISOString(),
        end: new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
      });

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          sales(
            id,
            quantity,
            amount,
            products:product_id(id, name, sellingPrice)
          )
        `)
        .eq('client_id', clientId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', new Date(endDate.setHours(23, 59, 59, 999)).toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error in fetchClientOrders:', error);
        throw error;
      }

      console.log('Fetched orders:', data?.length || 0);
      setClientOrders(data || []);
    } catch (error) {
      console.error('Error fetching client orders:', error);
    } finally {
      setLoadingClientData(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = clientList.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowClientList(true);
    } else {
      setFilteredClients([]);
      setShowClientList(false);
    }
  }, [searchQuery, clientList]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearchQuery(client.name);
    setShowClientList(false); // Hide suggestions immediately after selection
    fetchClientOrders(client.id);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedClient(null);
    setShowClientList(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Client Order History</Text>
        
        {/* Search Bar with Clear Button */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowClientList(true);
              if (!text) {
                setSelectedClient(null);
              }
            }}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <X size={18} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Client Suggestions List - Only show if not selected and has query */}
        {showClientList && !selectedClient && filteredClients.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {filteredClients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectClient(client)}
              >
                <Text style={styles.suggestionText}>{client.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Date Filter Section */}
        {selectedClient && (
          <View style={styles.dateFilterContainer}>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => openDatePicker('start')}
            >
              <Calendar size={16} color="#666" />
              <Text style={styles.dateButtonText}>
                {formatDate(startDate)}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateSeperator}>to</Text>

            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => openDatePicker('end')}
            >
              <Calendar size={16} color="#666" />
              <Text style={styles.dateButtonText}>
                {formatDate(endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Custom Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  Select {datePickerType === 'start' ? 'Start' : 'End'} Date
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={datePickerType === 'start' ? startDate.toISOString() : endDate.toISOString()}
                onValueChange={(itemValue) => handleDateSelect(itemValue)}
              >
                {dateOptions.map((date) => (
                  <Picker.Item 
                    key={date.toISOString()} 
                    label={formatDate(date)} 
                    value={date.toISOString()} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
      </View>

      {/* Add this section to display orders */}
      {selectedClient && (
        <View style={styles.ordersContainer}>
          {loadingClientData ? (
            <ActivityIndicator size="large" color="#F47B20" />
          ) : clientOrders.length > 0 ? (
            <FlatList
              data={clientOrders}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.orderItem}>
                  <TouchableOpacity 
                    style={styles.orderHeader}
                    onPress={() => toggleOrderExpansion(item.id)}
                  >
                    <View style={styles.orderHeaderLeft}>
                      <ChevronDown 
                        size={20} 
                        color="#666"
                        style={[
                          styles.chevron,
                          expandedOrders.includes(item.id) && styles.chevronExpanded
                        ]}
                      />
                      <Text style={styles.orderDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.orderHeaderRight}>
                      <Text style={styles.orderAmount}>
                        {formatCurrency(item.total_amount)}
                      </Text>
                      <Text style={[
                        styles.orderStatus,
                        item.status === 'completed' ? styles.statusCompleted : styles.statusPending
                      ]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {expandedOrders.includes(item.id) && (
                    <View style={styles.orderDetails}>
                      {item.sales.map((sale) => (
                        <View key={sale.id} style={styles.detailItem}>
                          <View style={styles.productDetails}>
                            <Text style={styles.productName}>{sale.products.name}</Text>
                            <View style={styles.quantityPrice}>
                              <Text style={styles.quantity}>x{sale.quantity}</Text>
                              <Text style={styles.price}>
                                {formatCurrency(sale.amount)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                      <View style={styles.orderSummary}>
                        <Text style={styles.totalItems}>
                          Total Items: {item.sales.reduce((sum, sale) => sum + sale.quantity, 0)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
          ) : (
            <Text style={styles.emptyText}>No orders found for this client</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 30, // Make room for clear button
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
    position: 'absolute',
    right: 10,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dateSeperator: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#F47B20',
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 110, // Adjust this value based on your layout
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  ordersContainer: {
    flex: 1,
    marginTop: 20,
  },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    overflow: 'hidden',
  },
  detailItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chevron: {
    marginRight: 10,
    transform: [{ rotate: '-90deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '0deg' }],
  },
  orderDetails: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  quantityPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    minWidth: 100,
    textAlign: 'right',
  },
  orderSummary: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalItems: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#e6f4ea',
    color: '#1e7e34',
  },
  statusPending: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});