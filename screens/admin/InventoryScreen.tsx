"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal, Alert } from "react-native"
import { Search, Plus, Edit2, Trash2, Filter, X, Camera } from "lucide-react-native"
import * as ImagePicker from 'expo-image-picker'
import { supabase } from "../../lib/supabase"
import { useFocusEffect } from "@react-navigation/native"

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

  // Fetch products from Supabase
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      fetchCategories();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `);
      
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      // Transform data to include category name
      const transformedData = data?.map(product => ({
        ...product,
        categoryName: product.categories?.name || 'Unknown'
      })) || [];
      
      setProducts(transformedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
        
        setProducts([...products, ...transformedData]);
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

  const filteredProducts = products.filter((product) => {
    if (activeCategory !== "All" && product.categoryName !== activeCategory) {
      return false;
    }
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

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

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading products...</Text>
        </View>
      ) : (
        <ScrollView style={styles.productsList}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No products found</Text>
            </View>
          ) : (
            filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <Image 
                  source={product.image.startsWith('/') 
                    ? { uri: "https://via.placeholder.com/100" } 
                    : { uri: product.image }} 
                  style={styles.productImage} 
                />
                <View style={styles.productInfo}>
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
                <View style={styles.productActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEditProduct(product)}>
                    <Edit2 size={16} color="#F47B20" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(product.id)}>
                    <Trash2 size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
    flexDirection: "row",
    marginBottom: 8,
  },
  productCostPrice: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F47B20",
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
    justifyContent: "space-around",
    paddingLeft: 10,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
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
});
