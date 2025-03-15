import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AddEditClientScreen({ route, navigation }) {
  const { client } = route.params || {};
  const isEditing = !!client;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        status: client.status || 'active'
      });
    }
  }, [client]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Client name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (isEditing) {
        console.log('Updating existing client ID:', client.id);
        
        // Prepare update data
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          status: formData.status,
          updated_at: new Date().toISOString()
        };
        
        console.log('Update payload:', updateData);
        
        // Update client in database
        const { error } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', client.id);
        
        if (error) {
          console.error('Error updating client:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Success - navigate back and trigger refresh
        Alert.alert('Success', 'Client updated successfully', [
          { 
            text: 'OK', 
            onPress: () => {
              // Just navigate back and let the ManageClientsScreen handle the refresh
              navigation.goBack();
            }
          }
        ]);
      } else {
        // Add new client
        const insertData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          revenue: 0
        };

        console.log('Insert payload:', insertData);

        const { error } = await supabase
          .from('clients')
          .insert(insertData);

        if (error) {
          console.error('Error adding client:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Success - navigate back and trigger refresh
        Alert.alert('Success', 'Client added successfully', [
          { 
            text: 'OK', 
            onPress: () => {
              // Just navigate back and let the ManageClientsScreen handle the refresh
              navigation.goBack();
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error saving client:', error.message);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} client: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Edit Client' : 'Add New Client'}</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Client name"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Email address"
          keyboardType="email-address"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(value) => handleChange('phone', value)}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.address}
          onChangeText={(value) => handleChange('address', value)}
          placeholder="Address"
          multiline
          numberOfLines={3}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              formData.status === 'active' && styles.activeStatusButton
            ]}
            onPress={() => handleChange('status', 'active')}
          >
            <Text style={formData.status === 'active' ? styles.activeStatusText : styles.statusText}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              formData.status === 'inactive' && styles.inactiveStatusButton
            ]}
            onPress={() => handleChange('status', 'inactive')}
          >
            <Text style={formData.status === 'inactive' ? styles.inactiveStatusText : styles.statusText}>
              Inactive
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Update Client' : 'Add Client'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  activeStatusButton: {
    backgroundColor: '#e6f7ee',
    borderColor: '#4CAF50',
  },
  inactiveStatusButton: {
    backgroundColor: '#ffebee',
    borderColor: '#F44336',
  },
  statusText: {
    color: '#666',
  },
  activeStatusText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  inactiveStatusText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#F47B20',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});