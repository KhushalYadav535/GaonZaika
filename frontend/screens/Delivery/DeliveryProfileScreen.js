import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import apiService from '../../services/apiService';

const DeliveryProfileScreen = ({ navigation }) => {
  // Profile state
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Amit Kumar',
    email: 'amit.kumar@example.com',
    phone: '+91 98765 43210',
    vehicle: 'DL-01-AB-1234',
    address: '', // Added address field
  });
  // Vehicle
  const [vehicleVisible, setVehicleVisible] = useState(false);
  const [vehicle, setVehicle] = useState({
    number: 'DL-01-AB-1234',
    type: 'Bike',
  });
  // Service Areas
  const [areasVisible, setAreasVisible] = useState(false);
  const [areas, setAreas] = useState([
    { id: '1', name: 'Village Main Road' },
    { id: '2', name: 'City Center' },
  ]);
  const [editAreaId, setEditAreaId] = useState(null);
  const [areaName, setAreaName] = useState('');
  // Working Hours
  const [hoursVisible, setHoursVisible] = useState(false);
  const [hours, setHours] = useState({ open: '9:00 AM', close: '9:00 PM' });
  // Notifications
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const mockNotifications = [
    { id: 1, text: 'Order #1234 assigned to you.' },
    { id: 2, text: 'OTP verified for order #1234.' },
    { id: 3, text: 'You earned a 5-star rating!' },
  ];
  // Help
  const [helpVisible, setHelpVisible] = useState(false);

  // Report Issue
  const [issueVisible, setIssueVisible] = useState(false);
  const [issueSubject, setIssueSubject] = useState('');
  const [issueMessage, setIssueMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const nav = useNavigation();
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setNotLoggedIn(false);
      try {
        const data = await AsyncStorage.getItem('deliveryData');
        if (data) {
          const delivery = JSON.parse(data);
          setProfile({
            name: delivery.name || '',
            email: delivery.email || '',
            phone: delivery.phone || '',
            vehicle: delivery.vehicleDetails?.number || '',
            address: delivery.address?.fullAddress || delivery.address?.city || '', // Set address
          });
          setVehicle({
            number: delivery.vehicleDetails?.number || '',
            type: delivery.vehicleDetails?.type || '',
          });
        } else {
          setNotLoggedIn(true);
          setTimeout(() => {
            nav.reset({ index: 0, routes: [{ name: 'DeliveryAuth' }] });
          }, 2000);
        }
      } catch (e) {
        setNotLoggedIn(true);
        setTimeout(() => {
          nav.reset({ index: 0, routes: [{ name: 'DeliveryAuth' }] });
        }, 2000);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="delivery-dining" size={48} color="#2196F3" />
          <Text style={{ fontSize: 18, color: '#666', marginTop: 16 }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (notLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="error-outline" size={48} color="#FF9800" />
          <Text style={{ fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center' }}>
            Please login to view your profile.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear delivery data from AsyncStorage
              await AsyncStorage.multiRemove([
                'deliveryData',
                'deliveryToken'
              ]);
              console.log('Delivery data cleared on logout');
            } catch (error) {
              console.error('Error clearing delivery data:', error);
            }
            
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection' }],
            });
          },
        },
      ]
    );
  };

  // Service Areas handlers
  const openAddArea = () => {
    setEditAreaId(null);
    setAreaName('');
  };
  const openEditArea = (item) => {
    setEditAreaId(item.id);
    setAreaName(item.name);
  };
  const saveArea = () => {
    if (editAreaId) {
      setAreas(areas.map(a => a.id === editAreaId ? { ...a, name: areaName } : a));
    } else {
      setAreas([...areas, { id: Date.now().toString(), name: areaName }]);
    }
    setEditAreaId(null);
    setAreaName('');
  };
  const removeArea = (id) => setAreas(areas.filter(a => a.id !== id));

  // Add setLocationHandler
  const setLocationHandler = async () => {
    setLocationLoading(true);
    try {
      // Get delivery person ID
      const data = await AsyncStorage.getItem('deliveryData');
      const delivery = data ? JSON.parse(data) : null;
      if (!delivery?.id) {
        Alert.alert('Error', 'Delivery person ID not found');
        setLocationLoading(false);
        return;
      }
      // Ask for location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to set your location.');
        setLocationLoading(false);
        return;
      }
      // Get current location
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;
      // Call API to update location
      const response = await apiService.updateDeliveryLocation(delivery.id, latitude, longitude);
      if (response.data && response.data.success) {
        // Reverse geocode to get address
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        let addressString = '';
        if (geo && geo.length > 0) {
          const addr = geo[0];
          addressString = [addr.name, addr.street, addr.city, addr.region, addr.postalCode, addr.country].filter(Boolean).join(', ');
        }
        setProfile((prev) => ({ ...prev, address: addressString }));
        Alert.alert('Success', 'Location updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="delivery-dining" size={60} color="#2196F3" />
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>Delivery Partner</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.phone}>{profile.phone}</Text>
          <Text style={styles.vehicle}>Vehicle: {vehicle.number}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditProfileVisible(true)}>
            <MaterialIcons name="person" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setVehicleVisible(true)}>
            <MaterialIcons name="directions-bike" size={24} color="#666" />
            <Text style={styles.menuText}>Vehicle Details</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setAreasVisible(true)}>
            <MaterialIcons name="location-on" size={24} color="#666" />
            <Text style={styles.menuText}>Service Area</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setHoursVisible(true)}>
            <MaterialIcons name="schedule" size={24} color="#666" />
            <Text style={styles.menuText}>Working Hours</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings & Reports</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.getParent().navigate('EarningsHistory')}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#666" />
            <Text style={styles.menuText}>Earnings History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.getParent().navigate('DeliveryHistory')}>
            <MaterialIcons name="receipt" size={24} color="#666" />
            <Text style={styles.menuText}>Delivery History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.getParent().navigate('PerformanceReport')}>
            <MaterialIcons name="analytics" size={24} color="#666" />
            <Text style={styles.menuText}>Performance Report</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Help')}>
            <MaterialIcons name="help" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setIssueVisible(true)}>
            <MaterialIcons name="report-problem" size={24} color="#666" />
            <Text style={styles.menuText}>Report Issue</Text>
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
            <TextInput
              style={styles.input}
              value={profile.vehicle}
              onChangeText={(text) => setProfile({ ...profile, vehicle: text })}
              placeholder="Vehicle Number"
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

      {/* Vehicle Details Modal */}
      <Modal
        visible={vehicleVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVehicleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vehicle Details</Text>
            <TextInput
              style={styles.input}
              value={vehicle.number}
              onChangeText={(text) => setVehicle({ ...vehicle, number: text })}
              placeholder="Vehicle Number"
            />
            <TextInput
              style={styles.input}
              value={vehicle.type}
              onChangeText={(text) => setVehicle({ ...vehicle, type: text })}
              placeholder="Vehicle Type (e.g. Bike, Scooter)"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setVehicleVisible(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVehicleVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Service Areas Modal */}
      <Modal
        visible={areasVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAreasVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Service Area</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="location-on" size={20} color="#2196F3" />
              <Text style={{ fontSize: 16, color: '#333', marginLeft: 8 }}>
                {profile.address ? profile.address : 'No service area set'}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { marginLeft: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: locationLoading ? '#ccc' : '#2196F3' }]}
                onPress={setLocationHandler}
                disabled={locationLoading}
              >
                <MaterialIcons name="my-location" size={18} color="#fff" />
                <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 6 }}>{locationLoading ? 'Updating...' : 'Set My Location'}</Text>
              </TouchableOpacity>
            </View>
            {/* Edit option can be added here in future if backend supports */}
            <TouchableOpacity onPress={() => setAreasVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Working Hours Modal */}
      <Modal
        visible={hoursVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHoursVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Working Hours</Text>
            <TextInput
              style={styles.input}
              value={hours.open}
              onChangeText={(text) => setHours({ ...hours, open: text })}
              placeholder="Open Time (e.g. 9:00 AM)"
            />
            <TextInput
              style={styles.input}
              value={hours.close}
              onChangeText={(text) => setHours({ ...hours, close: text })}
              placeholder="Close Time (e.g. 9:00 PM)"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setHoursVisible(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setHoursVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={{ fontWeight: 'bold', color: '#2196F3', marginBottom: 10 }}>support@gaonzaika.com</Text>
            <Text style={{ fontSize: 15, marginBottom: 10 }}>FAQs:</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to accept a delivery?</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to mark delivery as complete?</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to update service area?</Text>
            <TouchableOpacity onPress={() => setHelpVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Report Issue Modal */}
      <Modal
        visible={issueVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIssueVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Issue</Text>
            <TextInput
              style={styles.input}
              value={issueSubject}
              onChangeText={setIssueSubject}
              placeholder="Subject"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={issueMessage}
              onChangeText={setIssueMessage}
              placeholder="Message"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setIssueVisible(false); setIssueSubject(''); setIssueMessage(''); }} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setIssueVisible(false); setIssueSubject(''); setIssueMessage(''); }} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
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
                <MaterialIcons name="notifications" size={20} color="#2196F3" />
                <Text style={{ marginLeft: 8, fontSize: 15 }}>{n.text}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => setNotificationsVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
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
    backgroundColor: '#E3F2FD',
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
  role: {
    fontSize: 16,
    color: '#2196F3',
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
    marginBottom: 4,
  },
  vehicle: {
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeliveryProfileScreen;
