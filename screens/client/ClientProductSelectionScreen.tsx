import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Minus, ShoppingCart, Check, X, ChevronDown } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const formatCurrency = (amount: number) => {
  return `${amount.toFixed(2)} MAD`;
};

export default function ClientProductSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { clientId: initialClientId, clientName: initialClientName } = route.params || {};

  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [selectedClientName, setSelectedClientName] = useState(initialClientName || '');
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')  // Keep the active filter but ensure it matches the case
        .order('name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        Alert.alert('Error', 'Failed to load clients');
        return;
      }
      
      console.log('Fetched clients:', data?.length);
      setClients(data || []);
      
      // If no client was pre-selected and we have clients, select the first one
      if (!selectedClientId && data && data.length > 0) {
        setSelectedClientId(data[0].id);
        setSelectedClientName(data[0].name);
        setSelectedProducts([]); // Clear cart when setting initial client
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    }
  };

  const refreshClients = () => {
    fetchClients();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshClients();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0) // Only show products with stock > 0
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    
    if (existingProduct) {
      // Increment quantity if already selected
      setSelectedProducts(
        selectedProducts.map(p => 
          p.id === product.id 
            ? { ...p, quantity: p.quantity + 1 } 
            : p
        )
      );
    } else {
      // Add new product with quantity 1
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    
    if (existingProduct && existingProduct.quantity > 1) {
      // Decrement quantity
      setSelectedProducts(
        selectedProducts.map(p => 
          p.id === product.id 
            ? { ...p, quantity: p.quantity - 1 } 
            : p
        )
      );
    } else {
      // Remove product completely
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    }
  };

  const handleConfirmOrder = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Error', 'Please select at least one product');
      return;
    }

    if (!selectedClientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create the order record first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: selectedClientId,
          total_amount: totalAmount,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (orderError) throw orderError;
      
      const orderId = orderData[0].id;
      
      // 2. Create sales records for each selected product
      for (const product of selectedProducts) {
        // Create sale record with order_id
        const { error: saleError } = await supabase
          .from('sales')
          .insert({
            client_id: selectedClientId,
            product_id: product.id,
            order_id: orderId, // Link to the order
            quantity: product.quantity,
            amount: product.sellingPrice * product.quantity,
            created_at: new Date().toISOString()
          });
        
        if (saleError) throw saleError;
        
        // Update product stock
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: product.stock - product.quantity })
          .eq('id', product.id);
          
        if (stockError) throw stockError;
      }
      
      // 3. Update client revenue (single update instead of multiple)
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          revenue: supabase.rpc('increment', { x: totalAmount }) 
        })
        .eq('id', selectedClientId);
        
      if (clientError) throw clientError;
      
      Alert.alert(
        'Success', 
        'Order completed successfully', 
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Error', 'Failed to process order');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const totalAmount = selectedProducts.reduce(
    (sum, product) => sum + (product.sellingPrice * product.quantity), 
    0
  );

  // Add these new functions to handle quantity changes in the confirm modal
  const handleIncreaseQuantity = (productId) => {
    setSelectedProducts(
      selectedProducts.map(p => 
        p.id === productId 
          ? { ...p, quantity: Math.min(p.quantity + 1, p.stock) } 
          : p
      )
    );
  };

  const handleDecreaseQuantity = (productId) => {
    setSelectedProducts(
      selectedProducts.map(p => 
        p.id === productId 
          ? { ...p, quantity: Math.max(p.quantity - 1, 0) } 
          : p
      ).filter(p => p.quantity > 0) // Remove products with 0 quantity
    );
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F47B20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.clientSelectContainer}>
        <Text style={styles.clientLabel}>Client:</Text>
        <TouchableOpacity 
          style={styles.clientSelectButton}
          onPress={() => setShowClientModal(true)}
        >
          <Text style={styles.clientSelectText}>
            {selectedClientName || 'Select a client'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      {/* Client Selection Modal */}
      <Modal
        visible={showClientModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowClientModal(false)}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSearchContainer}>
              <Search size={20} color="#999" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search clients..."
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
              />
            </View>
            
            <FlatList
              data={clients.filter(client => 
                client.name.toLowerCase().includes(clientSearchQuery.toLowerCase().trim())
              )}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.clientItem}
                  onPress={() => {
                    setSelectedClientId(item.id);
                    setSelectedClientName(item.name);
                    setShowClientModal(false);
                    setSelectedProducts([]);
                    setClientSearchQuery(''); // Clear search when selecting
                  }}
                >
                  <Text style={styles.clientItemText}>{item.name}</Text>
                  {selectedClientId === item.id && (
                    <Check size={20} color="#F47B20" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {clientSearchQuery ? 'No matching clients found' : 'No active clients available'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          const selectedProduct = selectedProducts.find(p => p.id === item.id);
          const quantity = selectedProduct ? selectedProduct.quantity : 0;
          
          return (
            <View style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatCurrency(item.sellingPrice)}</Text>
                <Text style={styles.productStock}>In stock: {item.stock}</Text>
              </View>
              
              <View style={styles.quantityControls}>
                {quantity > 0 && (
                  <>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleRemoveProduct(item)}
                    >
                      <Minus size={16} color="#F47B20" />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </>
                )}
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => handleAddProduct(item)}
                  disabled={quantity >= item.stock}
                >
                  <Plus size={16} color={quantity >= item.stock ? "#ccc" : "#F47B20"} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      
      {selectedProducts.length > 0 && (
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={() => setShowConfirmModal(true)}
        >
          <ShoppingCart size={20} color="#fff" />
          <Text style={styles.checkoutButtonText}>
            Checkout ({selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} items)
          </Text>
          <Text style={styles.checkoutAmount}>{formatCurrency(totalAmount)}</Text>
        </TouchableOpacity>
      )}
      
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Confirm Order</Text>
            
            <FlatList
              data={selectedProducts}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.confirmOrderItem}>
                  <Text style={styles.confirmOrderItemName}>{item.name}</Text>
                  <View style={styles.confirmOrderQuantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleDecreaseQuantity(item.id)}
                    >
                      {item.quantity === 1 ? (
                        <X size={16} color="#F44336" />
                      ) : (
                        <Minus size={16} color="#F47B20" />
                      )}
                    </TouchableOpacity>
                    
                    <Text style={styles.confirmOrderItemQuantity}>x{item.quantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleIncreaseQuantity(item.id)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={16} color={item.quantity >= item.stock ? "#ccc" : "#F47B20"} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.confirmOrderItemPrice}>
                    {formatCurrency(item.sellingPrice * item.quantity)}
                  </Text>
                </View>
              )}
              ListFooterComponent={
                <View style={styles.confirmOrderTotal}>
                  <Text style={styles.confirmOrderTotalLabel}>Total:</Text>
                  <Text style={styles.confirmOrderTotalAmount}>{formatCurrency(totalAmount)}</Text>
                </View>
              }
              contentContainerStyle={styles.confirmOrderItemsList}
            />
            
            <View style={styles.confirmModalActions}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmCancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.confirmModalButton, 
                  styles.confirmConfirmButton,
                  selectedProducts.length === 0 && styles.disabledButton
                ]}
                onPress={handleConfirmOrder}
                disabled={selectedProducts.length === 0}
              >
                <Text style={styles.confirmConfirmButtonText}>Confirm</Text>
                <Check size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  clientSelectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clientSelectText: {
    fontSize: 16,
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
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 14,
    color: '#F47B20',
    fontWeight: 'bold',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F47B20',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
  },
  checkoutAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20, // Base padding
    paddingHorizontal: 24, // More horizontal padding
    width: '100%', // Full width background
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginHorizontal: 10, // Add margin to title
  },
  orderItemsList: {
    paddingVertical: 15,
    paddingHorizontal: 16, // Increased padding
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginHorizontal: 10, // Add margin to keep content from edges
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderItemName: {
    flex: 1,
    fontSize: 16,
    paddingRight: 15,
  },
  orderItemQuantity: {
    fontSize: 16,
    marginHorizontal: 18,
    color: '#666',
    width: 45,
    textAlign: 'center',
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    width: 85,
    textAlign: 'right',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginHorizontal: 10, // Add margin to keep content from edges
    paddingTop: 18,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  orderTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F47B20',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    marginHorizontal: 10, // Add margin to keep content from edges
  },
  modalButton: {
    flex: 1,
    padding: 16, // Increased padding
    borderRadius: 12, // Increased border radius
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2, // Added elevation for shadow
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 12, // Increased margin
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#F47B20',
    marginLeft: 12, // Increased margin
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8, // Increased margin
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    padding: 8,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientItemText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
  },
  orderItemsList: {
    marginBottom: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16, // Reduced overall padding
    width: '100%',
    maxHeight: '80%',
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    marginHorizontal: 5, // Reduced from 10
  },
  confirmOrderItemsList: {
    paddingVertical: 12,
    paddingHorizontal: 6, // Reduced from 12
  },
  confirmOrderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginHorizontal: 5, // Reduced from 10
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  confirmOrderItemName: {
    flex: 1,
    fontSize: 16,
    paddingRight: 15,
  },
  confirmOrderItemQuantity: {
    fontSize: 16,
    marginHorizontal: 18,
    color: '#666',
    width: 45,
    textAlign: 'center',
  },
  confirmOrderItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    width: 85,
    textAlign: 'right',
  },
  confirmOrderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginHorizontal: 5, // Reduced from 10
    paddingTop: 16,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  confirmOrderTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmOrderTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F47B20',
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginHorizontal: 5, // Reduced from 10
  },
  confirmModalButton: {
    flex: 1,
    padding: 16, // Increased padding
    borderRadius: 12, // Increased border radius
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2, // Added elevation for shadow
  },
  confirmCancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 12, // Increased margin
  },
  confirmCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmConfirmButton: {
    backgroundColor: '#F47B20',
    marginLeft: 12, // Increased margin
  },
  confirmConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8, // Increased margin
  },
  confirmOrderQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
});