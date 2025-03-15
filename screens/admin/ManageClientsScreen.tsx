"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal, Alert } from "react-native"
import { Search, Plus, Edit2, Trash2, Filter, X, Mail, Phone } from "lucide-react-native"
import { supabase } from "../../lib/supabase"
import { useFocusEffect } from "@react-navigation/native"

// Define the Client type
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  revenue: number;
  image: string;
}

export default function ManageClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    revenue: "",
    image: "https://via.placeholder.com/100",
  });

  const statuses = ["All", "Active", "Inactive"];

  // Fetch clients from Supabase
  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [])
  );

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }
      
      setClients(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      if (!newClient.name || !newClient.email) {
        Alert.alert("Error", "Name and email are required");
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            name: newClient.name,
            email: newClient.email,
            phone: newClient.phone,
            address: newClient.address,
            status: newClient.status,
            revenue: parseFloat(newClient.revenue) || 0,
            image: newClient.image,
          }
        ])
        .select();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setClients([...clients, data[0]]);
      setShowAddModal(false);
      setNewClient({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "active",
        revenue: "",
        image: "https://via.placeholder.com/100",
      });
    } catch (error) {
      console.error('Error adding client:', error);
      Alert.alert("Error", "Failed to add client");
    }
  };

  const handleUpdateClient = async () => {
    try {
      if (!editingClient) return;

      const { data, error } = await supabase
        .from('clients')
        .update({
          name: editingClient.name,
          email: editingClient.email,
          phone: editingClient.phone,
          address: editingClient.address,
          status: editingClient.status,
          revenue: editingClient.revenue,
          image: editingClient.image,
        })
        .eq('id', editingClient.id)
        .select();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setClients(clients.map(client => 
        client.id === editingClient.id ? data[0] : client
      ));
      setShowEditModal(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert("Error", "Failed to update client");
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this client?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

              if (error) {
                Alert.alert("Error", error.message);
                return;
              }

              setClients(clients.filter(client => client.id !== id));
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting client:', error);
      Alert.alert("Error", "Failed to delete client");
    }
  };

  const filteredClients = clients.filter((client) => {
    if (statusFilter !== "All" && client.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery && !client.name.toLowerCase().includes(searchQuery.toLowerCase())) {
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
            placeholder="Search clients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusContainer}>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, statusFilter === status && styles.activeStatusButton]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.statusButtonText, statusFilter === status && styles.activeStatusButtonText]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add Client</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading clients...</Text>
        </View>
      ) : (
        <ScrollView style={styles.clientsList}>
          {filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No clients found</Text>
            </View>
          ) : (
            filteredClients.map((client) => (
              <View key={client.id} style={styles.clientCard}>
                <Image 
                  source={{ uri: client.image || "https://via.placeholder.com/100" }} 
                  style={styles.clientImage} 
                />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <View style={styles.contactRow}>
                    <Mail size={14} color="#666" style={styles.contactIcon} />
                    <Text style={styles.contactText}>{client.email}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Phone size={14} color="#666" style={styles.contactIcon} />
                    <Text style={styles.contactText}>{client.phone}</Text>
                  </View>
                  <View style={styles.clientFooter}>
                    <View
                      style={[styles.statusBadge, client.status === "active" ? styles.statusActive : styles.statusInactive]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          client.status === "active" ? styles.statusTextActive : styles.statusTextInactive,
                        ]}
                      >
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.revenueText}>${client.revenue}</Text>
                  </View>
                </View>
                <View style={styles.clientActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      setEditingClient(client);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit2 size={16} color="#F47B20" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleDeleteClient(client.id)}
                  >
                    <Trash2 size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Client Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Client</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={newClient.name}
                onChangeText={(text) => setNewClient({...newClient, name: text})}
                placeholder="Client name"
              />
              
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={newClient.email}
                onChangeText={(text) => setNewClient({...newClient, email: text})}
                placeholder="Email address"
                keyboardType="email-address"
              />
              
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newClient.phone}
                onChangeText={(text) => setNewClient({...newClient, phone: text})}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
              
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={newClient.address}
                onChangeText={(text) => setNewClient({...newClient, address: text})}
                placeholder="Address"
                multiline
              />
              
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusToggle}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    newClient.status === "active" && styles.statusOptionActive,
                  ]}
                  onPress={() => setNewClient({...newClient, status: "active"})}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      newClient.status === "active" && styles.statusOptionTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    newClient.status === "inactive" && styles.statusOptionActive,
                  ]}
                  onPress={() => setNewClient({...newClient, status: "inactive"})}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      newClient.status === "inactive" && styles.statusOptionTextActive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Revenue</Text>
              <TextInput
                style={styles.input}
                value={newClient.revenue}
                onChangeText={(text) => setNewClient({...newClient, revenue: text})}
                placeholder="Revenue amount"
                keyboardType="numeric"
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddClient}
              >
                <Text style={styles.saveButtonText}>Add Client</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Client</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {editingClient && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editingClient.name}
                  onChangeText={(text) => setEditingClient({...editingClient, name: text})}
                  placeholder="Client name"
                />
                
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editingClient.email}
                  onChangeText={(text) => setEditingClient({...editingClient, email: text})}
                  placeholder="Email address"
                  keyboardType="email-address"
                />
                
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={editingClient.phone}
                  onChangeText={(text) => setEditingClient({...editingClient, phone: text})}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
                
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={editingClient.address}
                  onChangeText={(text) => setEditingClient({...editingClient, address: text})}
                  placeholder="Address"
                  multiline
                />
                
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusToggle}>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      editingClient.status === "active" && styles.statusOptionActive,
                    ]}
                    onPress={() => setEditingClient({...editingClient, status: "active"})}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        editingClient.status === "active" && styles.statusOptionTextActive,
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      editingClient.status === "inactive" && styles.statusOptionActive,
                    ]}
                    onPress={() => setEditingClient({...editingClient, status: "inactive"})}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        editingClient.status === "inactive" && styles.statusOptionTextActive,
                      ]}
                    >
                      Inactive
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>Revenue</Text>
                <TextInput
                  style={styles.input}
                  value={String(editingClient.revenue)}
                  onChangeText={(text) => setEditingClient({...editingClient, revenue: parseFloat(text) || 0})}
                  placeholder="Revenue amount"
                  keyboardType="numeric"
                />
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateClient}
              >
                <Text style={styles.saveButtonText}>Update Client</Text>
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
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: "row",
    maxWidth: "70%",
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeStatusButton: {
    backgroundColor: "#F47B20",
    borderColor: "#F47B20",
  },
  statusButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  activeStatusButtonText: {
    color: "white",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F47B20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 8,
  },
  clientsList: {
    flex: 1,
  },
  clientCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactIcon: {
    marginRight: 6,
  },
  contactText: {
    fontSize: 14,
    color: "#666",
  },
  clientFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  statusInactive: {
    backgroundColor: "rgba(158, 158, 158, 0.1)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusTextActive: {
    color: "#4CAF50",
  },
  statusTextInactive: {
    color: "#9E9E9E",
  },
  revenueText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F47B20",
  },
  clientActions: {
    justifyContent: "space-between",
    paddingLeft: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(244, 123, 32, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  statusToggle: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    borderRadius: 8,
  },
  statusOptionActive: {
    backgroundColor: "#F47B20",
  },
  statusOptionText: {
    fontWeight: "500",
    color: "#666",
  },
  statusOptionTextActive: {
    color: "white",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#F47B20",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "500",
  },
});