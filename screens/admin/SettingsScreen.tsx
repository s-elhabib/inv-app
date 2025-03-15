import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  User, 
  Bell, 
  Moon, 
  LogOut, 
  Shield, 
  HelpCircle,
  Users,
  Lock,
  Globe,
  Plus,
  Tag,
  Edit2,
  Trash2,
  ChevronRight,
  Check,
  X
} from 'lucide-react-native'
import { useNavigation } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"

// Define the navigation type
type SettingsStackParamList = {
  SettingsMain: undefined;
  ManageClients: undefined;
}

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

export default function SettingsScreen() {
  // Use the correct type for navigation
  const navigation = useNavigation<SettingsScreenNavigationProp>()
  
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const { logout, user } = useAuth()
  const [language, setLanguage] = useState("English (US)")
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [profileData, setProfileData] = useState({ name: "", email: "" })
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" })
  
  // Categories state
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null)
  const [loading, setLoading] = useState(false)

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences()
    fetchCategories()
    fetchUserProfile()
  }, [])

  // Load saved preferences from AsyncStorage
  const loadUserPreferences = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('darkMode')
      const savedNotifications = await AsyncStorage.getItem('notifications')
      const savedLanguage = await AsyncStorage.getItem('language')
      
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true')
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true')
      if (savedLanguage !== null) setLanguage(savedLanguage)
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  // Save preferences to AsyncStorage
  const savePreference = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, value.toString())
    } catch (error) {
      console.error(`Error saving ${key}:`, error)
    }
  }

  // Toggle dark mode
  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value)
    savePreference('darkMode', value)
    // Here you would also apply the theme change to your app
  }

  // Toggle notifications
  const handleNotificationsToggle = (value: boolean) => {
    setNotifications(value)
    savePreference('notifications', value)
    // Here you would also update notification settings
  }

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user) return
    
    try {
      // For static users with non-UUID IDs
      if (user.id === "admin-uuid" || user.id === "client-uuid") {
        setProfileData({ 
          name: user.name || "", 
          email: user.email || "" 
        })
        return
      }
      
      // Only query Supabase for valid UUIDs
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      if (data) {
        setProfileData({ 
          name: data.name || "", 
          email: data.email || user.email || "" 
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Update user profile
  const handleUpdateProfile = async () => {
    if (!user) return
    
    try {
      // Skip Supabase update for static users
      if (user.id === "admin-uuid" || user.id === "client-uuid") {
        Alert.alert("Success", "Profile updated successfully (Demo Mode)")
        setShowProfileModal(false)
        return
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          name: profileData.name,
          email: profileData.email,
          updated_at: new Date()
        })
      
      if (error) {
        console.error('Error updating profile:', error)
        Alert.alert("Error", "Failed to update profile")
        return
      }
      
      Alert.alert("Success", "Profile updated successfully")
      setShowProfileModal(false)
    } catch (error) {
      console.error('Error:', error)
      Alert.alert("Error", "An unexpected error occurred")
    }
  }

  // Update password
  const handleUpdatePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      Alert.alert("Error", "New passwords don't match")
      return
    }
    
    try {
      // Skip Supabase update for static users
      if (user?.id === "admin-uuid" || user?.id === "client-uuid") {
        Alert.alert("Success", "Password updated successfully (Demo Mode)")
        setPasswordData({ current: "", new: "", confirm: "" })
        setShowPasswordModal(false)
        return
      }
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })
      
      if (error) {
        console.error('Error updating password:', error)
        Alert.alert("Error", "Failed to update password")
        return
      }
      
      Alert.alert("Success", "Password updated successfully")
      setPasswordData({ current: "", new: "", confirm: "" })
      setShowPasswordModal(false)
    } catch (error) {
      console.error('Error:', error)
      Alert.alert("Error", "An unexpected error occurred")
    }
  }

  // Set language
  const handleSetLanguage = (lang: string) => {
    setLanguage(lang)
    savePreference('language', lang)
    setShowLanguageModal(false)
    // Here you would also apply the language change to your app
  }

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
      
      if (error) {
        console.error('Error fetching categories:', error)
        return
      }
      
      setCategories(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add a new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert("Error", "Category name cannot be empty")
      return
    }

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === newCategory.toLowerCase())) {
      Alert.alert("Error", "Category already exists")
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.trim() }])
        .select()
      
      if (error) {
        console.error('Error adding category:', error)
        Alert.alert("Error", "Failed to add category")
        return
      }
      
      if (data) {
        setCategories([...categories, ...data])
        Alert.alert("Success", "Category added successfully")
      }
      
      setNewCategory("")
      setShowCategoryModal(false)
    } catch (error) {
      console.error('Error:', error)
      Alert.alert("Error", "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Start editing a category
  const startEditCategory = (category: {id: string, name: string}) => {
    setEditingCategory(category)
    setNewCategory(category.name)
    setShowCategoryModal(true)
  }

  // Update category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.trim()) {
      Alert.alert("Error", "Category name cannot be empty");
      return;
    }

    // Check if category already exists with the same name (excluding current category)
    if (categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === newCategory.toLowerCase()
    )) {
      Alert.alert("Error", "Category with this name already exists");
      return;
    }

    try {
      setLoading(true);
      
      // Update the category name
      const { error: categoryError } = await supabase
        .from('categories')
        .update({ name: newCategory.trim() })
        .eq('id', editingCategory.id);
      
      if (categoryError) {
        console.error('Error updating category:', categoryError);
        Alert.alert("Error", "Failed to update category");
        return;
      }
      
      // Update local state
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { ...cat, name: newCategory.trim() } : cat
      ));
      
      Alert.alert("Success", "Category updated successfully");
      setNewCategory("");
      setEditingCategory(null);
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (category: {id: string, name: string}) => {
    // First check if there are products using this category
    try {
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('category_id', category.id);
      
      if (error) {
        console.error('Error checking products:', error);
        Alert.alert("Error", "Failed to check if category is in use");
        return;
      }
      
      if (count && count > 0) {
        Alert.alert(
          "Category In Use",
          `This category is used by ${count} products. Please reassign these products before deleting.`,
          [{ text: "OK" }]
        );
        return;
      }
      
      // If no products use this category, proceed with deletion confirmation
      Alert.alert(
        "Confirm Delete",
        `Are you sure you want to delete the category "${category.name}"?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Delete", 
            onPress: async () => {
              try {
                setLoading(true);
                const { error } = await supabase
                  .from('categories')
                  .delete()
                  .eq('id', category.id);
                
                if (error) {
                  console.error('Error deleting category:', error);
                  Alert.alert("Error", "Failed to delete category");
                  return;
                }
                
                // Update local state
                setCategories(categories.filter(cat => cat.id !== category.id));
                Alert.alert("Success", "Category deleted successfully");
              } catch (error) {
                console.error('Error:', error);
                Alert.alert("Error", "An unexpected error occurred");
              } finally {
                setLoading(false);
              }
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const navigateToClients = () => {
    navigation.navigate('ManageClients')
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Settings</Text>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowProfileModal(true)}
        >
          <View style={styles.settingIconContainer}>
            <User size={20} color="#F47B20" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Profile Information</Text>
            <Text style={styles.settingDescription}>Update your account details</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowPasswordModal(true)}
        >
          <View style={styles.settingIconContainer}>
            <Lock size={20} color="#F47B20" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Password</Text>
            <Text style={styles.settingDescription}>Change your password</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Add Clients Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clients</Text>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={navigateToClients}
        >
          <View style={styles.settingIconContainer}>
            <Users size={20} color="#F47B20" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Manage Clients</Text>
            <Text style={styles.settingDescription}>View and edit client information</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Bell size={20} color="#F47B20" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingDescription}>Receive app notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: "#E0E0E0", true: "#F47B2080" }}
            thumbColor={notifications ? "#F47B20" : "#F5F5F5"}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Moon size={20} color="#F47B20" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Toggle dark theme</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: "#E0E0E0", true: "#F47B2080" }}
            thumbColor={darkMode ? "#F47B20" : "#F5F5F5"}
          />
        </View>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={styles.settingIconContainer}>
            <Globe size={20} color="#F47B20" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Language</Text>
            <Text style={styles.settingDescription}>{language}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* New Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Product Categories</Text>
          <TouchableOpacity 
            style={styles.addCategoryButton}
            onPress={() => {
              setEditingCategory(null)
              setNewCategory("")
              setShowCategoryModal(true)
            }}
          >
            <Plus size={18} color="#F47B20" />
            <Text style={styles.addCategoryText}>Add Category</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading categories...</Text>
        ) : categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories found</Text>
        ) : (
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Tag size={16} color="#F47B20" style={styles.categoryIcon} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => startEditCategory(category)}
                  >
                    <Edit2 size={16} color="#F47B20" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteCategory(category)}
                  >
                    <Trash2 size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Existing Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <HelpCircle size={20} color="#F47B20" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Help Center</Text>
            <Text style={styles.settingDescription}>Get help with the app</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Existing Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut size={20} color="white" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowCategoryModal(false)
                  setNewCategory("")
                  setEditingCategory(null)
                }}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Category Name"
              value={newCategory}
              onChangeText={setNewCategory}
            />

            <TouchableOpacity 
              style={[styles.saveButton, !newCategory.trim() && styles.disabledButton]}
              onPress={editingCategory ? handleUpdateCategory : handleAddCategory}
              disabled={!newCategory.trim()}
            >
              <Text style={styles.saveButtonText}>
                {editingCategory ? "Update Category" : "Add Category"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowProfileModal(false)}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={profileData.name}
              onChangeText={(text) => setProfileData({...profileData, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={profileData.email}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              keyboardType="email-address"
            />

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.saveButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={passwordData.current}
              onChangeText={(text) => setPasswordData({...passwordData, current: text})}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={passwordData.new}
              onChangeText={(text) => setPasswordData({...passwordData, new: text})}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={passwordData.confirm}
              onChangeText={(text) => setPasswordData({...passwordData, confirm: text})}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.saveButton, (!passwordData.current || !passwordData.new || !passwordData.confirm) && styles.disabledButton]}
              onPress={handleUpdatePassword}
              disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
            >
              <Text style={styles.saveButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {["English (US)", "French", "Arabic", "Spanish"].map((lang) => (
              <TouchableOpacity 
                key={lang}
                style={[styles.languageOption, language === lang && styles.selectedLanguageOption]}
                onPress={() => handleSetLanguage(lang)}
              >
                <Text style={[styles.languageOptionText, language === lang && styles.selectedLanguageOptionText]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 15,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(244, 123, 32, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 123, 32, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addCategoryText: {
    color: "#F47B20",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  categoriesList: {
    marginTop: 5,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    color: "#333",
  },
  categoryActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    padding: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    padding: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#F47B20",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedLanguageOption: {
    backgroundColor: "rgba(244, 123, 32, 0.1)",
  },
  languageOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedLanguageOptionText: {
    color: "#F47B20",
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.5,
  }
})
