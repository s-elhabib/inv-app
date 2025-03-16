import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Edit2, X, Search } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useIsFocused } from '@react-navigation/native';

const formatCurrency = (amount: number) => {
  return `${amount.toFixed(2)} MAD`;
};

export default function SalesHistoryScreen() {
  const isFocused = useIsFocused();
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit sale states
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [editSaleQuantity, setEditSaleQuantity] = useState('');
  const [editSaleClientId, setEditSaleClientId] = useState(null);
  const [isQuantityValid, setIsQuantityValid] = useState(true);
  const [quantityError, setQuantityError] = useState(null);

  useEffect(() => {
    if (isFocused) {
      fetchSales();
      fetchClients();
    }
  }, [isFocused]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          amount,
          quantity,
          created_at,
          products:product_id(id, name, sellingPrice),
          clients:client_id(id, name)
        `)
        .order('created_at', { ascending: false }); // Ensure most recent sales appear first

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert('Error', 'Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setEditSaleQuantity(sale.quantity.toString());
    setEditSaleClientId(sale.clients.id);
    setShowEditSaleModal(true);
  };

  const updateSale = async () => {
    if (!editingSale || !editSaleClientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }
    
    const newQuantity = parseInt(editSaleQuantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }
    
    try {
      // Get the product details
      const product = editingSale.products;
      
      // Calculate stock adjustment
      const stockAdjustment = editingSale.quantity - newQuantity;
      
      // Get current product stock
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', product.id)
        .single();
      
      if (productError) throw productError;
      
      const newStock = productData.stock + stockAdjustment;
      
      if (newStock < 0) {
        Alert.alert('Insufficient Stock', 'Not enough items in stock for this adjustment');
        return;
      }
      
      // 1. Update the sale record
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          client_id: editSaleClientId,
          quantity: newQuantity,
          amount: product.sellingPrice * newQuantity
        })
        .eq('id', editingSale.id);
      
      if (saleError) throw saleError;
      
      // 2. Update the product stock
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);
      
      if (productUpdateError) throw productUpdateError;
      
      // 3. Close modal and refresh sales
      setShowEditSaleModal(false);
      setEditingSale(null);
      Alert.alert('Success', 'Sale updated successfully');
      fetchSales();
      
    } catch (error) {
      console.error('Error updating sale:', error);
      Alert.alert('Error', 'Failed to update sale');
    }
  };

  const filteredSales = sales.filter(sale => {
    if (searchQuery) {
      const productNameMatch = sale.products?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const clientNameMatch = sale.clients?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return productNameMatch || clientNameMatch;
    }
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales History</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product or client..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: sale, index }) => (
          <View style={styles.saleItem}>
            {index === 0 && (
              <Text style={styles.latestSaleIndicator}>Latest Sale</Text>
            )}
            <View style={styles.saleHeader}>
              <Text style={styles.productName}>{sale.products?.name}</Text>
              <Text style={styles.saleAmount}>{formatCurrency(sale.amount)}</Text>
            </View>
            <View style={styles.saleDetails}>
              <Text style={styles.saleClient}>Client: {sale.clients?.name}</Text>
              <Text style={styles.saleQuantity}>Qty: {sale.quantity}</Text>
            </View>
            <Text style={styles.saleDate}>{formatDate(sale.created_at)}</Text>
            <View style={styles.saleActions}>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => handleEditSale(sale)}
              >
                <Edit2 size={16} color="#F47B20" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading sales...' : 'No sales found'}
            </Text>
          </View>
        }
      />

      {/* Edit Sale Modal */}
      {editingSale && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showEditSaleModal}
          onRequestClose={() => setShowEditSaleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Sale</Text>
                <TouchableOpacity onPress={() => setShowEditSaleModal(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.productName}>{editingSale.products?.name}</Text>
                
                <Text style={styles.inputLabel}>Client</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editSaleClientId}
                    onValueChange={(itemValue) => setEditSaleClientId(itemValue)}
                    style={styles.picker}
                  >
                    {clients.map((client) => (
                      <Picker.Item key={client.id} label={client.name} value={client.id} />
                    ))}
                  </Picker>
                </View>
                
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={editSaleQuantity}
                  onChangeText={(text) => {
                    setEditSaleQuantity(text);
                    const quantity = parseInt(text);
                    setIsQuantityValid(!isNaN(quantity) && quantity > 0);
                    if (isNaN(quantity) || quantity <= 0) {
                      setQuantityError("Please enter a valid quantity");
                    } else {
                      setQuantityError(null);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="Quantity"
                />
                {quantityError && <Text style={styles.errorText}>{quantityError}</Text>}
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setShowEditSaleModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.confirmButton, 
                      !isQuantityValid && styles.disabledButton
                    ]} 
                    onPress={updateSale}
                    disabled={!isQuantityValid}
                  >
                    <Text style={styles.confirmButtonText}>Update Sale</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  saleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F47B20',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleClient: {
    fontSize: 16,
    color: '#666',
  },
  saleQuantity: {
    fontSize: 16,
    color: '#666',
  },
  saleDate: {
    fontSize: 14,
    color: '#999',
  },
  saleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#FFF5EC',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#555',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#F47B20',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ffc299',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  latestSaleIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#F47B20',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
});
