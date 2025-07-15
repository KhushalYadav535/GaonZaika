import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVendor } from '../../hooks/useVendor';
import BusinessHoursModal from './BusinessHoursModal';
import RestaurantLocationModal from './RestaurantLocationModal';
import apiService from '../../services/apiService';
import { formatCoordinates } from '../../services/locationService';

const VendorProfileScreen = ({ navigation }) => {
  const { vendorData, vendorName, vendorEmail, vendorPhone, restaurant, clearVendorData, loading: vendorLoading } = useVendor();
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editRestaurantVisible, setEditRestaurantVisible] = useState(false);
  const [editHoursVisible, setEditHoursVisible] = useState(false);
  const [editLocationVisible, setEditLocationVisible] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [profile, setProfile] = useState({
    name: vendorName || 'Vendor Name',
    email: vendorEmail || 'vendor@example.com',
    phone: vendorPhone || '+91 98765 43210',
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearVendorData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection' }],
            });
          },
        },
      ]
    );
  };

  // Security Settings Modal
  const [securityVisible, setSecurityVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Notifications Modal
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const mockNotifications = [
    { id: 1, text: 'Order #1234 has been placed.' },
    { id: 2, text: 'Menu item "Paneer Tikka" is out of stock.' },
    { id: 3, text: 'You received a new review.' },
  ];

  // Help & Support Modal
  const [helpVisible, setHelpVisible] = useState(false);

  // Contact Admin Modal
  const [contactVisible, setContactVisible] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleSaveLocation = async (locationData) => {
    try {
      setSavingLocation(true);
      
      if (!vendorData?.id) {
        Alert.alert('Error', 'Vendor data not found');
        return;
      }

      const response = await apiService.updateVendorRestaurantLocation(vendorData.id, locationData);
      
      if (response.data.success) {
        Alert.alert('Success', 'Restaurant location updated successfully!');
        // You might want to refresh the vendor data here
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setSavingLocation(false);
    }
  };

  const getLocationDisplay = () => {
    if (restaurant?.location?.coordinates && restaurant.location.coordinates.length === 2) {
      const [lng, lat] = restaurant.location.coordinates;
      return formatCoordinates(lat, lng);
    }
    return restaurant?.address?.fullAddress || 'Location not set';
  };

  if (vendorLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendorData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Vendor not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="restaurant" size={60} color="#FF9800" />
          </View>
          <Text style={styles.name}>{restaurant?.name || 'Restaurant'}</Text>
          <Text style={styles.owner}>Owner: {vendorName}</Text>
          <Text style={styles.email}>{vendorEmail}</Text>
          <Text style={styles.phone}>{vendorPhone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditRestaurantVisible(true)}>
            <MaterialIcons name="edit" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Restaurant Info</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Menu')}>
            <MaterialIcons name="restaurant-menu" size={24} color="#666" />
            <Text style={styles.menuText}>Manage Menu</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditHoursVisible(true)}>
            <MaterialIcons name="schedule" size={24} color="#666" />
            <Text style={styles.menuText}>Business Hours</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditLocationVisible(true)}>
            <MaterialIcons name="location-on" size={24} color="#666" />
            <Text style={styles.menuText}>Restaurant Location</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Current Location Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <View style={styles.locationDisplay}>
            <MaterialIcons name="location-on" size={20} color="#FF9800" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{getLocationDisplay()}</Text>
              {restaurant?.address?.fullAddress && (
                <Text style={styles.addressText}>{restaurant.address.fullAddress}</Text>
              )}
            </View>
          </View>
          {restaurant?.location?.coordinates && restaurant.location.coordinates.length === 2 && (
            <View style={styles.coordinatesDisplay}>
              <MaterialIcons name="gps-fixed" size={16} color="#666" />
              <Text style={styles.coordinatesText}>
                Coordinates: {getLocationDisplay()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders & Analytics</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SalesAnalytics')}>
            <MaterialIcons name="analytics" size={24} color="#666" />
            <Text style={styles.menuText}>Sales Analytics</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
            <MaterialIcons name="receipt" size={24} color="#666" />
            <Text style={styles.menuText}>Order History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ReviewsRatings')}>
            <MaterialIcons name="star" size={24} color="#666" />
            <Text style={styles.menuText}>Reviews & Ratings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditProfileVisible(true)}>
            <MaterialIcons name="person" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setNotificationsVisible(true)}>
            <MaterialIcons name="notifications" size={24} color="#666" />
            <Text style={styles.menuText}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setSecurityVisible(true)}>
            <MaterialIcons name="security" size={24} color="#666" />
            <Text style={styles.menuText}>Security Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setHelpVisible(true)}>
            <MaterialIcons name="help" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setContactVisible(true)}>
            <MaterialIcons name="contact-support" size={24} color="#666" />
            <Text style={styles.menuText}>Contact Admin</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Full Name"
            />
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder="Email"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              placeholder="Phone"
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Restaurant Modal */}
      <Modal
        visible={editRestaurantVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditRestaurantVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Restaurant Info</Text>
            <TextInput
              style={styles.input}
              value={restaurant?.name || ''}
              onChangeText={(text) => setRestaurant({ ...(restaurant || {}), name: text })}
              placeholder="Restaurant Name"
            />
            <TextInput
              style={styles.input}
              value={restaurant?.location || ''}
              onChangeText={(text) => setRestaurant({ ...(restaurant || {}), location: text })}
              placeholder="Location"
            />
            <TextInput
              style={styles.input}
              value={restaurant?.hours?.open && restaurant?.hours?.close ? 
                restaurant.hours.open + ' - ' + restaurant.hours.close : 
                'Not set'}
              editable={false}
              placeholder="Business Hours"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditRestaurantVisible(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditRestaurantVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Hours Modal */}
      <BusinessHoursModal
        visible={editHoursVisible}
        onClose={() => setEditHoursVisible(false)}
        hours={restaurant?.hours || {}}
        onSave={(hours) => setRestaurant({ ...(restaurant || {}), hours })}
      />

      {/* Restaurant Location Modal */}
      <RestaurantLocationModal
        visible={editLocationVisible}
        onClose={() => setEditLocationVisible(false)}
        onSave={handleSaveLocation}
        vendorId={vendorData?.id}
      />

      {/* Security Settings Modal */}
      <Modal
        visible={securityVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSecurityVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Current Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setSecurityVisible(false); setPassword(''); setNewPassword(''); }} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSecurityVisible(false); setPassword(''); setNewPassword(''); }} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'flex-start' }]}> 
            <Text style={styles.modalTitle}>Notifications</Text>
            {mockNotifications.map((n) => (
              <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <MaterialIcons name="notifications" size={20} color="#FF9800" />
                <Text style={{ marginLeft: 8, fontSize: 15 }}>{n.text}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => setNotificationsVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={helpVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Help & Support</Text>
            <Text style={{ fontSize: 15, marginBottom: 10 }}>For any queries or issues, contact us at:</Text>
            <Text style={{ fontWeight: 'bold', color: '#FF9800', marginBottom: 10 }}>support@gaonzaika.com</Text>
            <Text style={{ fontSize: 15, marginBottom: 10 }}>FAQs:</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to add a menu item?</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to check order status?</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to update restaurant info?</Text>
            <TouchableOpacity onPress={() => setHelpVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contact Admin Modal */}
      <Modal
        visible={contactVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setContactVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact Admin</Text>
            <TextInput
              style={styles.input}
              value={contactSubject}
              onChangeText={setContactSubject}
              placeholder="Subject"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={contactMessage}
              onChangeText={setContactMessage}
              placeholder="Message"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setContactVisible(false); setContactSubject(''); setContactMessage(''); }} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setContactVisible(false); setContactSubject(''); setContactMessage(''); }} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  owner: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationInfo: {
    marginLeft: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  coordinatesDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
});

export default VendorProfileScreen; 