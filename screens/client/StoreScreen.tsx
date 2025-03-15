"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from "react-native"
import { Search, Filter, ShoppingCart } from "lucide-react-native"

const products = [
  {
    id: "1",
    name: "Special fried rice",
    category: "Food",
    price: 850,
    image: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Chicken Satay",
    category: "Food",
    price: 1200,
    image: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Mango Juice",
    category: "Drink",
    price: 500,
    image: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Chocolate Cake",
    category: "Dessert",
    price: 750,
    image: "/placeholder.svg",
  },
  {
    id: "5",
    name: "Spring Rolls",
    category: "Snack",
    price: 600,
    image: "/placeholder.svg",
  },
]

export default function StoreScreen() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState([])

  const categories = ["All", "Food", "Drink", "Snack", "Dessert"]

  const filteredProducts = products.filter((product) => {
    if (activeCategory !== "All" && product.category !== activeCategory) {
      return false
    }
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const addToCart = (product) => {
    const existingItem = cartItems.find((item) => item.id === product.id)
    if (existingItem) {
      setCartItems(cartItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryButton, activeCategory === category && styles.activeCategoryButton]}
            onPress={() => setActiveCategory(category)}
          >
            <Text style={[styles.categoryButtonText, activeCategory === category && styles.activeCategoryButtonText]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.productsContainer}>
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
                <View style={styles.productBottom}>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => addToCart(product)}>
                    <ShoppingCart size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {cartItems.length > 0 && (
        <TouchableOpacity style={styles.cartButton}>
          <ShoppingCart size={20} color="white" />
          <Text style={styles.cartCount}>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</Text>
          <Text style={styles.cartText}>View Cart</Text>
          <Text style={styles.cartTotal}>${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
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
  categoriesContainer: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#F5F5F5",
  },
  activeCategoryButton: {
    backgroundColor: "#F47B20",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeCategoryButtonText: {
    color: "white",
  },
  productsContainer: {
    flex: 1,
    padding: 15,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
  },
  productImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  productCategory: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#F47B20",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  cartButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#F47B20",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 5,
  },
  cartCount: {
    backgroundColor: "white",
    color: "#F47B20",
    fontSize: 12,
    fontWeight: "bold",
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: "center",
    lineHeight: 20,
    marginLeft: -10,
    marginRight: 10,
  },
  cartText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  cartTotal: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

