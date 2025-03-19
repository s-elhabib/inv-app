import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Edit, Trash2, Plus, Search, Phone, Mail } from 'lucide-react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

export default function ManageClientsScreen({ navigation, route }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();

  // Check for new or updated client data from route params
  useEffect(() => {
    // Handle new client
    if (route.params?.newClient) {
      console.log('New client received:', route.params.newClient);
      fetchClients(); // Fetch all clients to ensure we have the latest data
      // Clear the params to prevent duplicate fetches
      navigation.setParams({ newClient: null, timestamp: null });
    }
    
    // Handle updated client
    if (route.params?.updatedClient) {
      console.log('Updated client received:', route.params.updatedClient);
      fetchClients(); // Fetch all clients to ensure we have the latest data
      // Clear the params to prevent duplicate fetches
      navigation.setParams({ updatedClient: null, timestamp: null });
    }
  }, [route.params?.newClient, route.params?.updatedClient, route.params?.timestamp]);

  // Fetch clients when screen is focused
  useEffect(() => {
    if (isFocused) {
      console.log('ManageClientsScreen is focused - fetching clients');
      fetchClients();
    }
  }, [isFocused]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('Fetching clients...');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null) // Only fetch non-deleted clients
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} clients`);
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddClient = () => {
    navigation.navigate('AddEditClient');
  };

  const handleEditClient = (client) => {
    navigation.navigate('AddEditClient', { client });
  };

  const handleDeleteClient = (client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const now = new Date().toISOString();

              // Soft delete all client's orders
              const { error: ordersError } = await supabase
                .from('orders')
                .update({ deleted_at: now })
                .eq('client_id', client.id);
            
              if (ordersError) throw ordersError;

              // Soft delete the client
              const { error: clientError } = await supabase
                .from('clients')
                .update({ 
                  deleted_at: now,
                  status: 'deleted' // Optional: also update status
                })
                .eq('id', client.id);
            
              if (clientError) throw clientError;
            
              // Update local state
              setClients(clients.filter(c => c.id !== client.id));
              Alert.alert('Success', 'Client deleted successfully');
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('Error', 'Failed to delete client');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        
        {item.email && (
          <View style={styles.contactRow}>
            <Mail size={14} color="#666" style={styles.contactIcon} />
            <Text style={styles.clientEmail}>{item.email}</Text>
          </View>
        )}
        
        {item.phone && (
          <View style={styles.contactRow}>
            <Phone size={14} color="#666" style={styles.contactIcon} />
            <Text style={styles.clientPhone}>{item.phone}</Text>
          </View>
        )}
        
        {item.status && (
          <View style={[
            styles.statusBadge, 
            item.status === 'active' ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'active' ? styles.activeText : styles.inactiveText
            ]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditClient(item)}
        >
          <Edit size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteClient(item)}
        >
          <Trash2 size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F47B20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <FlatList
        data={filteredClients}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No clients found</Text>
        }
      />
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddClient}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  clientCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactIcon: {
    marginRight: 6,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  activeBadge: {
    backgroundColor: '#e6f7ee',
  },
  inactiveBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#4CAF50',
  },
  inactiveText: {
    color: '#F44336',
  },
  actions: {
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#F47B20',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F47B20',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 24,
  },
});

