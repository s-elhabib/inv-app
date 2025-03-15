"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from "react-native"
import { Search, Plus, Edit2, Trash2, Filter, Mail, Phone } from "lucide-react-native"
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

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const statuses = ["All", "Active", "Inactive"]

  // Fetch clients from Supabase
  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [])
  );

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log("Fetching clients...");
      
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }
      
      console.log("Clients fetched:", data?.length || 0);
      console.log("Client data:", JSON.stringify(data));
      setClients(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    if (statusFilter !== "All" && client.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false
    }
    if (searchQuery && !client.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const handleDeleteClient = (id) => {
    setClients(clients.filter((client) => client.id !== id))
  }

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

        <TouchableOpacity style={styles.addButton}>
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
                <Image source={{ uri: "https://via.placeholder.com/100" }} style={styles.clientImage} />
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
                  <TouchableOpacity style={styles.editButton}>
                    <Edit2 size={16} color="#F47B20" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteClient(client.id)}>
                    <Trash2 size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statusContainer: {
    flex: 1,
  },
  statusButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#F5F5F5",
  },
  activeStatusButton: {
    backgroundColor: "#F47B20",
  },
  statusButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeStatusButtonText: {
    color: "white",
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
    fontWeight: "bold",
    marginLeft: 5,
  },
  clientsList: {
    flex: 1,
    padding: 15,
  },
  clientCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  clientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  clientInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  contactIcon: {
    marginRight: 5,
  },
  contactText: {
    fontSize: 12,
    color: "#666",
  },
  clientFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  statusInactive: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusTextActive: {
    color: "#4CAF50",
  },
  statusTextInactive: {
    color: "#F44336",
  },
  revenueText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F47B20",
  },
  clientActions: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 10,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(244, 123, 32, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
})

