import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Search, Calendar, ChevronDown, X } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { Calendar as RNCalendar } from 'react-native-calendars';

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
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingDate, setSelectingDate] = useState('start'); // 'start' or 'end'
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(day.timestamp);
    
    if (selectingDate === 'start') {
      selectedDate.setHours(0, 0, 0, 0);
      setTempStartDate(selectedDate);
      
      // If end date exists and is before new start date, clear it
      if (tempEndDate && tempEndDate < selectedDate) {
        setTempEndDate(null);
      }
    } else {
      selectedDate.setHours(23, 59, 59, 999);
      if (tempStartDate && selectedDate < tempStartDate) {
        Alert.alert('Invalid Date Range', 'End date cannot be before start date');
        return;
      }
      setTempEndDate(selectedDate);
    }
    
    setShowCalendar(false);
  };

  const openCalendar = (type) => {
    setSelectingDate(type);
    setShowCalendar(true);
  };

  const applyDateFilter = async () => {
    if (!tempStartDate || !tempEndDate || !selectedClient) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setIsFilterActive(true);
    setLoadingClientData(true);
    setClientOrders([]); // Clear existing orders

    try {
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
        .eq('client_id', selectedClient.id)
        .gte('created_at', new Date(tempStartDate.setHours(0, 0, 0, 0)).toISOString())
        .lte('created_at', new Date(tempEndDate.setHours(23, 59, 59, 999)).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientOrders(data || []);
    } catch (error) {
      console.error('Error fetching filtered orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoadingClientData(false);
    }
  };

  const resetDateFilter = async () => {
    setIsFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    setTempStartDate(null);
    setTempEndDate(null);
    
    if (selectedClient) {
      console.log('Resetting date filter');
      await fetchClientOrders(selectedClient.id, true);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    // Ensure we're working with a Date object
    const d = new Date(date);
    
    // Get day, month, and year
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
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

  const fetchClientOrders = async (clientId, isReset = false) => {
    if (!clientId) return;
    
    setLoadingClientData(true);
    setClientOrders([]); // Clear existing orders before fetching new ones
    
    try {
      let query = supabase
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
        .order('created_at', { ascending: false });

      if (!isReset && startDate && endDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        const startDateISO = startDateTime.toISOString();

        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        const endDateISO = endDateTime.toISOString();
        
        query = query
          .gte('created_at', startDateISO)
          .lte('created_at', endDateISO);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setClientOrders(data || []);
    } catch (error) {
      console.error('Error fetching client orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
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
        <View style={styles.dateFilterContainer}>
          <View style={styles.dateSelectionGroup}>
            <TouchableOpacity 
              style={[styles.dateButton, tempStartDate && styles.activeDateButton]}
              onPress={() => openCalendar('start')}
            >
              <Calendar size={16} color="#666" />
              <Text style={[styles.dateButtonText, tempStartDate && styles.activeDateButtonText]}>
                {tempStartDate ? formatDate(tempStartDate) : 'Start Date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateSeperator}>to</Text>

            <TouchableOpacity 
              style={[styles.dateButton, tempEndDate && styles.activeDateButton]}
              onPress={() => openCalendar('end')}
            >
              <Calendar size={16} color="#666" />
              <Text style={[styles.dateButtonText, tempEndDate && styles.activeDateButtonText]}>
                {tempEndDate ? formatDate(tempEndDate) : 'End Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.applyButton,
                (!tempStartDate || !tempEndDate) && styles.applyButtonDisabled
              ]}
              onPress={applyDateFilter}
              disabled={!tempStartDate || !tempEndDate}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {isFilterActive && (
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetDateFilter}
            >
              <X size={16} color="#fff" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Status Indicator */}
        {selectedClient && isFilterActive && startDate && endDate && (
          <View style={styles.filterStatusContainer}>
            <Text style={styles.filterStatusText}>
              Showing orders from {formatDate(startDate)} to {formatDate(endDate)}
            </Text>
          </View>
        )}

        {/* Calendar Modal */}
        <Modal
          visible={showCalendar}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>
                  Select {selectingDate === 'start' ? 'Start' : 'End'} Date
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowCalendar(false)}
                >
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <RNCalendar
                onDayPress={handleDateSelect}
                markedDates={{
                  [selectingDate === 'start' 
                    ? tempStartDate?.toISOString().split('T')[0] 
                    : tempEndDate?.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#F47B20'
                  }
                }}
                maxDate={new Date().toISOString().split('T')[0]}
                theme={{
                  selectedDayBackgroundColor: '#F47B20',
                  todayTextColor: '#F47B20',
                  arrowColor: '#F47B20',
                }}
              />
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
                        {formatDate(item.created_at)}
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
    padding: 10,
    gap: 10,
  },
  dateSelectionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    gap: 5,
    flex: 1,
  },
  activeDateButton: {
    backgroundColor: '#FFF3E9',
    borderColor: '#F47B20',
    borderWidth: 1,
  },
  dateButtonText: {
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  activeDateButtonText: {
    color: '#F47B20',
  },
  dateSeperator: {
    color: '#666',
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: '#F47B20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
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
  filterStatusContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterStatusText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});