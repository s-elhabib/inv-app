"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal, Alert, FlatList, ActivityIndicator } from "react-native"
import { Search, Plus, Edit2, Trash2, Filter, X, Camera } from "lucide-react-native"
import * as ImagePicker from 'expo-image-picker'
import { supabase } from "../../lib/supabase"
import { useFocusEffect } from "@react-navigation/native"
import { useNavigation } from '@react-navigation/native';

// Define the Product type
interface Product {
  id: string;
  name: string;
  category_id: string;
  categoryName?: string; // For display purposes
  price: number;
  sellingPrice: number;
  stock: number;
  image: string;
}

// Define the Category type
interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    price: "",
    sellingPrice: "",
    stock: "",
    image: "/placeholder.svg",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellQuantity, setSellQuantity] = useState("1");
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [isQuantityValid, setIsQuantityValid] = useState(true);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editSaleQuantity, setEditSaleQuantity] = useState("");
  const [editSaleClientId, setEditSaleClientId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const navigation = useNavigation();

  // Fetch products from Supabase
  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setProducts([]);
      fetchProducts();
      fetchCategories();
    }, [])
  );

  const fetchProducts = async (isLoadingMore = false) => {
    try {
      if (!isLoadingMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          category_id,
          price,
          sellingPrice,
          stock,
          image,
          categories:category_id (
            id,
            name
          )
        `)
        .range(offset, offset + ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      // Apply category filter if needed
      if (activeCategory !== "All") {
        query = query.eq('categories.name', activeCategory);
      }

      // Apply search filter if needed
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      // Transform data to include category name
      const transformedData = data?.map(product => ({
        ...product,
        categoryName: product.categories?.name || 'Unknown'
      })) || [];

      setHasMore(transformedData.length === ITEMS_PER_PAGE);

      if (isLoadingMore) {
        setProducts(prevProducts => [...prevProducts, ...transformedData]);
      } else {
        setProducts(transformedData);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      if (data) {
        setCategories(data);
        
        // Set default category for new product if categories exist
        if (data.length > 0 && !newProduct.category_id) {
          setNewProduct({...newProduct, category_id: data[0].id});
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setClients(data);
        setSelectedClientId(data[0].id); // Set first client as default
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Add a new product to Supabase
  const handleAddProduct = async () => {
    console.log("Add product button clicked");
    console.log("New product data:", newProduct);
    
    if (!newProduct.name || !newProduct.price || !newProduct.sellingPrice || !newProduct.stock || !newProduct.category_id) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }
    
    try {
      const productData = {
        name: newProduct.name,
        category_id: newProduct.category_id,
        price: parseInt(newProduct.price),
        sellingPrice: parseInt(newProduct.sellingPrice),
        stock: parseInt(newProduct.stock),
        image: newProduct.image,
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `);
      
      if (error) {
        console.error('Error adding product:', error);
        Alert.alert("Error", "Failed to add product: " + error.message);
        return;
      }
      
      if (data) {
        // Transform data to include category name
        const transformedData = data.map(product => ({
          ...product,
          categoryName: product.categories?.name || 'Unknown'
        }));
        
        // Add the new product to the beginning of the products array
        setProducts([...transformedData, ...products]);
        Alert.alert("Success", "Product added successfully");
      }
      
      // Reset form with the current category_id
      const currentCategoryId = newProduct.category_id;
      setNewProduct({ 
        name: "", 
        category_id: currentCategoryId, 
        price: "", 
        sellingPrice: "", 
        stock: "", 
        image: "/placeholder.svg" 
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  // Update a product in Supabase
  const saveEditedProduct = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.price || !editingProduct.sellingPrice || !editingProduct.stock || !editingProduct.category_id) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          category_id: editingProduct.category_id,
          price: typeof editingProduct.price === 'string' ? parseInt(editingProduct.price) : editingProduct.price,
          sellingPrice: typeof editingProduct.sellingPrice === 'string' ? parseInt(editingProduct.sellingPrice) : editingProduct.sellingPrice,
          stock: typeof editingProduct.stock === 'string' ? parseInt(editingProduct.stock) : editingProduct.stock,
          image: editingProduct.image,
        })
        .eq('id', editingProduct.id);
      
      if (error) {
        console.error('Error updating product:', error);
        Alert.alert("Error", "Failed to update product");
        return;
      }
      
      // Update local state
      const updatedProducts = products.map(p => {
        if (p.id === editingProduct.id) {
          // Find category name
          const category = categories.find(c => c.id === editingProduct.category_id);
          return {
            ...editingProduct,
            categoryName: category?.name || 'Unknown',
            price: typeof editingProduct.price === 'string' ? parseInt(editingProduct.price) : editingProduct.price,
            sellingPrice: typeof editingProduct.sellingPrice === 'string' ? parseInt(editingProduct.sellingPrice) : editingProduct.sellingPrice,
            stock: typeof editingProduct.stock === 'string' ? parseInt(editingProduct.stock) : editingProduct.stock,
          };
        }
        return p;
      });
      
      setProducts(updatedProducts);
      setShowEditModal(false);
      setEditingProduct(null);
      Alert.alert("Success", "Product updated successfully");
    } catch (error) {
      console.error('Error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  // Delete a product from Supabase
  const handleDeleteProduct = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
              
              if (error) {
                console.error('Error deleting product:', error);
                return;
              }
              
              setProducts(products.filter(p => p.id !== id));
            } catch (error) {
              console.error('Error:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Handle taking a photo or selecting from gallery
  const takePhoto = async (isEditing = false) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera permission to take photos");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled) {
      if (isEditing && editingProduct) {
        setEditingProduct({...editingProduct, image: result.assets[0].uri});
      } else {
        setNewProduct({...newProduct, image: result.assets[0].uri});
      }
    }
  };
  
  // Handle selecting image from gallery
  const pickImage = async (isEditing = false) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant gallery access to select photos");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled) {
      if (isEditing && editingProduct) {
        setEditingProduct({...editingProduct, image: result.assets[0].uri});
      } else {
        setNewProduct({...newProduct, image: result.assets[0].uri});
      }
    }
  };

  // Handle editing a product
  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      ...product, 
      price: product.price.toString(), 
      sellingPrice: product.sellingPrice.toString(),
      stock: product.stock.toString()
    });
    setShowEditModal(true);
  };

  const handleSellProduct = (product: Product) => {
    setSellingProduct(product);
    setSellQuantity("1");
    setQuantityError(null);
    setIsQuantityValid(true);
    
    // Set default client if available
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
    setShowSellModal(true);
  };

  const confirmSale = async () => {
    if (!sellingProduct || !selectedClientId) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    const quantity = parseInt(sellQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity");
      return;
    }
    
    if (quantity > sellingProduct.stock) {
      Alert.alert("Insufficient Stock", "Not enough items in stock");
      return;
    }
    
    try {
      // 1. Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: sellingProduct.stock - quantity })
        .eq('id', sellingProduct.id);
      
      if (updateError) throw updateError;
      
      // 2. Record the sale with the selected client
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          product_id: sellingProduct.id,
          client_id: selectedClientId,
          amount: sellingProduct.sellingPrice * quantity,
          quantity: quantity
        }]);
      
      if (saleError) throw saleError;
      
      // 3. Update local state
      setProducts(products.map(p => 
        p.id === sellingProduct.id 
          ? {...p, stock: p.stock - quantity} 
          : p
      ));
      
      // 4. Close modal and show success message
      setShowSellModal(false);
      setSellingProduct(null);
      Alert.alert("Success", `Sale recorded. ${quantity} item${quantity > 1 ? 's' : ''} sold.`);
      
    } catch (error) {
      console.error('Error processing sale:', error);
      Alert.alert("Error", "Failed to process sale");
    }
  };

  const filteredProducts = products.filter((product) => {
    if (activeCategory !== "All" && product.categoryName !== activeCategory) {
      return false;
    }
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Create a function to validate quantity
  const validateQuantity = (value: string) => {
    const quantity = parseInt(value);
    
    if (!value.trim()) {
      setQuantityError("Quantity is required");
      setIsQuantityValid(false);
      return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      setQuantityError("Please enter a valid quantity");
      setIsQuantityValid(false);
      return;
    }
    
    if (sellingProduct && quantity > sellingProduct.stock) {
      setQuantityError(`Exceeds available stock (${sellingProduct.stock})`);
      setIsQuantityValid(false);
      return;
    }
    
    setQuantityError(null);
    setIsQuantityValid(true);
  };

  // Update the setSellQuantity handler
  const handleQuantityChange = (text: string) => {
    setSellQuantity(text);
    validateQuantity(text);
  };

  // Add this function to handle editing a sale
  const handleEditSale = async (sale: any) => {
    // Fetch the current sale details
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, clients(*)')
        .eq('id', sale.id)
        .single();
      
      if (error) {
        console.error('Error fetching sale:', error);
        Alert.alert("Error", "Failed to fetch sale details");
        return;
      }
      
      if (data) {
        setEditingSale(data);
        setEditSaleQuantity(data.quantity.toString());
        setEditSaleClientId(data.client_id);
        setShowEditSaleModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  // Add this function to update a sale
  const updateSale = async () => {
    if (!editingSale || !editSaleClientId) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    const newQuantity = parseInt(editSaleQuantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity");
      return;
    }
    
    // Get the product details
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', editingSale.product_id)
      .single();
    
    if (productError) {
      console.error('Error fetching product:', productError);
      Alert.alert("Error", "Failed to fetch product details");
      return;
    }
    
    const product = productData;
    
    // Calculate stock adjustment
    const stockAdjustment = editingSale.quantity - newQuantity;
    const newStock = product.stock + stockAdjustment;
    
    if (newStock < 0) {
      Alert.alert("Insufficient Stock", "Not enough items in stock for this adjustment");
      return;
    }
    
    try {
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
      
      // 3. Update local state if needed
      setProducts(products.map(p => 
        p.id === product.id ? {...p, stock: newStock} : p
      ));
      
      // 4. Close modal and show success message
      setShowEditSaleModal(false);
      setEditingSale(null);
      Alert.alert("Success", "Sale updated successfully");
      
    } catch (error) {
      console.error('Error updating sale:', error);
      Alert.alert("Error", "Failed to update sale");
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setOffset(prevOffset => prevOffset + ITEMS_PER_PAGE);
      fetchProducts(true);
    }
  };

  useEffect(() => {
    setOffset(0);
    setProducts([]);
    fetchProducts();
  }, [activeCategory, searchQuery]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#F47B20" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <TouchableOpacity
            key="All"
            style={[styles.categoryButton, activeCategory === "All" && styles.activeCategoryButton]}
            onPress={() => setActiveCategory("All")}
          >
            <Text style={[styles.categoryButtonText, activeCategory === "All" && styles.activeCategoryButtonText]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryButton, activeCategory === category.name && styles.activeCategoryButton]}
              onPress={() => setActiveCategory(category.name)}
            >
              <Text style={[styles.categoryButtonText, activeCategory === category.name && styles.activeCategoryButtonText]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity> */}
      </View>

      {loading && !products.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F47B20" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item: product }) => (
            <View key={product.id} style={styles.productCard}>
              <Image 
                source={product.image.startsWith('/') 
                  ? { uri: "https://via.placeholder.com/80" } 
                  : { uri: product.image }} 
                style={styles.productImage} 
              />
              <View style={styles.productInfo}>
                <View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.categoryName}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.productCostPrice}>Cost: {product.price} MAD</Text>
                    <Text style={styles.productPrice}>Sell: {product.sellingPrice} MAD</Text>
                  </View>
                  <View style={styles.stockContainer}>
                    <Text style={styles.stockLabel}>Stock:</Text>
                    <Text style={[styles.stockValue, product.stock === 0 && styles.stockValueEmpty]}>
                      {product.stock === 0 ? "Out of stock" : product.stock}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity style={styles.sellButton} onPress={() => handleSellProduct(product)}>
                  <Text style={styles.sellButtonText}>Sell</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEditProduct(product)}>
                  <Edit2 size={16} color="#F47B20" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(product.id)}>
                  <Trash2 size={16} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No matching products found' : 'No products available'}
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={() => {
            setOffset(0);
            fetchProducts();
          }}
        />
      )}

      {/* Add FAB here, before the modals */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* Add Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.imagePickerContainer}>
                <Image 
                  source={newProduct.image.startsWith('/') 
                    ? { uri: "https://via.placeholder.com/150" } 
                    : { uri: newProduct.image }} 
                  style={styles.previewImage} 
                />
                <View style={styles.imageActions}>
                  <TouchableOpacity style={styles.imageButton} onPress={() => takePhoto(false)}>
                    <Camera size={20} color="#666" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(false)}>
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({...newProduct, name: text})}
              />
              
              <View style={styles.selectContainer}>
                <Text style={styles.selectLabel}>Category:</Text>
                <View style={styles.categoryOptions}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        newProduct.category_id === category.id && styles.selectedCategoryOption
                      ]}
                      onPress={() => setNewProduct({...newProduct, category_id: category.id})}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newProduct.category_id === category.id && styles.selectedCategoryOptionText
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Cost Price"
                keyboardType="numeric"
                value={newProduct.price}
                onChangeText={(text) => setNewProduct({...newProduct, price: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Selling Price"
                keyboardType="numeric"
                value={newProduct.sellingPrice}
                onChangeText={(text) => setNewProduct({...newProduct, sellingPrice: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Stock Quantity"
                keyboardType="numeric"
                value={newProduct.stock}
                onChangeText={(text) => setNewProduct({...newProduct, stock: text})}
              />
              
              <TouchableOpacity style={styles.addProductButton} onPress={handleAddProduct}>
                <Text style={styles.addProductButtonText}>Add Product</Text>
              </TouchableOpacity>
              
              {/* Add padding at the bottom to ensure content is visible when keyboard is open */}
              <View style={styles.modalBottomPadding} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Product</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.imagePickerContainer}>
                  <Image 
                    source={editingProduct.image.startsWith('/') 
                      ? { uri: "https://via.placeholder.com/150" } 
                      : { uri: editingProduct.image }} 
                    style={styles.previewImage} 
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity style={styles.imageButton} onPress={() => takePhoto(true)}>
                      <Camera size={20} color="#666" />
                      <Text style={styles.imageButtonText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(true)}>
                      <Text style={styles.imageButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="Product Name"
                  value={editingProduct.name}
                  onChangeText={(text) => setEditingProduct({...editingProduct, name: text})}
                />
                
                <View style={styles.selectContainer}>
                  <Text style={styles.selectLabel}>Category:</Text>
                  <View style={styles.categoryOptions}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          editingProduct.category_id === category.id && styles.selectedCategoryOption
                        ]}
                        onPress={() => setEditingProduct({...editingProduct, category_id: category.id})}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          editingProduct.category_id === category.id && styles.selectedCategoryOptionText
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="Cost Price"
                  keyboardType="numeric"
                  value={editingProduct.price.toString()}
                  onChangeText={(text) => setEditingProduct({...editingProduct, price: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Selling Price"
                  keyboardType="numeric"
                  value={editingProduct.sellingPrice.toString()}
                  onChangeText={(text) => setEditingProduct({...editingProduct, sellingPrice: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Stock Quantity"
                  keyboardType="numeric"
                  value={editingProduct.stock.toString()}
                  onChangeText={(text) => setEditingProduct({...editingProduct, stock: text})}
                />
                
                <TouchableOpacity style={styles.saveButton} onPress={saveEditedProduct}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
                
                {/* Add padding at the bottom to ensure content is visible when keyboard is open */}
                <View style={styles.modalBottomPadding} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Sell Product Modal */}
      {sellingProduct && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSellModal}
          onRequestClose={() => setShowSellModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sell Product</Text>
                <TouchableOpacity onPress={() => setShowSellModal(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.sellModalContent}>
                <Text style={styles.sellProductName}>{sellingProduct.name}</Text>
                <Text style={styles.sellProductPrice}>Price: {sellingProduct.sellingPrice} MAD</Text>
                <Text style={styles.sellProductStock}>Available: {sellingProduct.stock} items</Text>
                
                <Text style={styles.sellClientLabel}>Client:</Text>
                <View style={styles.clientPickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {clients.map(client => (
                      <TouchableOpacity 
                        key={client.id}
                        style={[
                          styles.clientOption,
                          selectedClientId === client.id && styles.clientOptionSelected
                        ]}
                        onPress={() => setSelectedClientId(client.id)}
                      >
                        <Text style={[
                          styles.clientOptionText,
                          selectedClientId === client.id && styles.clientOptionTextSelected
                        ]}>
                          {client.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <Text style={styles.sellQuantityLabel}>Quantity:</Text>
                <View style={styles.quantityInputContainer}>
                  <TextInput
                    style={[styles.quantityInput, !isQuantityValid && styles.quantityInputError]}
                    keyboardType="numeric"
                    value={sellQuantity}
                    onChangeText={handleQuantityChange}
                  />
                  {quantityError && (
                    <Text style={styles.quantityErrorText}>{quantityError}</Text>
                  )}
                </View>
                
                <Text style={styles.sellTotalLabel}>Total:</Text>
                <Text style={styles.sellTotal}>
                  {sellingProduct.sellingPrice * parseInt(sellQuantity || "0")} MAD
                </Text>
                
                <View style={styles.sellModalActions}>
                  <TouchableOpacity 
                    style={styles.cancelSellButton} 
                    onPress={() => setShowSellModal(false)}
                  >
                    <Text style={styles.cancelSellButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.confirmSellButton, 
                      !isQuantityValid && styles.confirmSellButtonDisabled
                    ]} 
                    onPress={confirmSale}
                    disabled={!isQuantityValid}
                  >
                    <Text style={styles.confirmSellButtonText}>Confirm Sale</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
                <Text style={styles.productName}>{editingSale.products?.name || "Product"}</Text>
                
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
                
                <View style={styles.sellModalActions}>
                  <TouchableOpacity 
                    style={styles.cancelSellButton} 
                    onPress={() => setShowEditSaleModal(false)}
                  >
                    <Text style={styles.cancelSellButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.confirmSellButton, 
                      !isQuantityValid && styles.confirmSellButtonDisabled
                    ]} 
                    onPress={updateSale}
                    disabled={!isQuantityValid}
                  >
                    <Text style={styles.confirmSellButtonText}>Update Sale</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Removed View Sales History button */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    position: 'relative',
  },
  header: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoriesContainer: {
    flex: 1,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  activeCategoryButton: {
    backgroundColor: "#F47B20",
  },
  categoryButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  activeCategoryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F47B20",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 5,
  },
  productsList: {
    padding: 15,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    marginRight: 10, // Add margin to create space between info and actions
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  productCostPrice: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F47B20",
    marginBottom: 4,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  stockValueEmpty: {
    color: "#F44336",
  },
  productActions: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    marginLeft: 5, // Add left margin to create more separation
  },
  sellButton: {
    backgroundColor: "#F47B20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
    alignItems: "center",
    width: "100%",
  },
  sellButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  editButton: {
    marginBottom: 8,
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  imageButtonText: {
    marginLeft: 5,
    color: "#666",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  selectContainer: {
    marginBottom: 15,
  },
  selectLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  selectedCategoryOption: {
    backgroundColor: "#F47B20",
  },
  categoryOptionText: {
    color: "#666",
  },
  selectedCategoryOptionText: {
    color: "white",
  },
  addProductButton: {
    backgroundColor: "#F47B20",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  addProductButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    padding: 30,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
  },
  modalScrollView: {
    width: "100%",
  },
  modalBottomPadding: {
    height: 100, // Extra padding at the bottom to ensure visibility with keyboard open
  },
  saveButton: {
    backgroundColor: "#F47B20",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  sellModalContent: {
    padding: 10,
  },
  sellProductName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  sellProductPrice: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  sellProductStock: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  sellClientLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 8,
  },
  clientPickerContainer: {
    marginBottom: 15,
  },
  clientOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  clientOptionSelected: {
    backgroundColor: "#F47B20",
  },
  clientOptionText: {
    fontSize: 14,
    color: "#333",
  },
  clientOptionTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  sellQuantityLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  quantityInputContainer: {
    marginBottom: 20,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  quantityInputError: {
    borderColor: "#F44336",
  },
  quantityErrorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 4,
  },
  sellTotalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  sellTotal: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F47B20",
    marginBottom: 20,
  },
  sellModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelSellButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelSellButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  confirmSellButton: {
    backgroundColor: "#F47B20",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    alignItems: "center",
  },
  confirmSellButtonText: {
    color: "white",
    fontWeight: "600",
  },
  confirmSellButtonDisabled: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    marginBottom: 10,
  },
  // Removed salesHistoryButton and salesHistoryButtonText styles
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#F47B20',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
});
