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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomerProfileScreen = ({ navigation }) => {
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
  });
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [helpVisible, setHelpVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const [notifications, setNotifications] = useState([]);

  // Load customer data from AsyncStorage
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const customerData = await AsyncStorage.getItem('customerData');
        if (customerData) {
          const parsedData = JSON.parse(customerData);
          setProfile({
            name: parsedData.name || 'Customer Name',
            email: parsedData.email || 'customer@example.com',
            phone: parsedData.phone || '+91 98765 43210',
          });
          console.log('Customer profile loaded:', parsedData);
        }
      } catch (error) {
        console.error('Error loading customer data:', error);
      }
    };

    loadCustomerData();
  }, []);

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
            try {
              // Clear customer data from AsyncStorage
              await AsyncStorage.multiRemove([
                'customerData',
                'customerToken'
              ]);
              console.log('Customer data cleared on logout');
            } catch (error) {
              console.error('Error clearing customer data:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.phone}>{profile.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditProfileVisible(true)}>
            <MaterialIcons name="person" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.getParent().navigate('Addresses')}>
            <MaterialIcons name="location-on" size={24} color="#666" />
            <Text style={styles.menuText}>Delivery Addresses</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.getParent().navigate('PaymentMethods')}>
            <MaterialIcons name="payment" size={24} color="#666" />
            <Text style={styles.menuText}>Payment Methods</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setNotificationsVisible(true)}>
            <MaterialIcons name="notifications" size={24} color="#666" />
            <Text style={styles.menuText}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setLanguageVisible(true)}>
            <MaterialIcons name="language" size={24} color="#666" />
            <Text style={styles.menuText}>Language</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Help')}>
            <MaterialIcons name="help" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setAboutVisible(true)}>
            <MaterialIcons name="info" size={24} color="#666" />
            <Text style={styles.menuText}>About Gaon Zaika</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setPrivacyVisible(true)}>
            <MaterialIcons name="privacy-tip" size={24} color="#666" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setTermsVisible(true)}>
            <MaterialIcons name="description" size={24} color="#666" />
            <Text style={styles.menuText}>Terms of Service</Text>
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
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialIcons name="notifications" size={20} color="#4CAF50" />
                  <Text style={{ marginLeft: 8, fontSize: 15 }}>{n.text}</Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 15, color: '#666', textAlign: 'center' }}>
                No notifications yet
              </Text>
            )}
            <TouchableOpacity onPress={() => setNotificationsVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={languageVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLanguageVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {['English', 'Hindi', 'Marathi', 'Bengali'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                onPress={() => { setSelectedLanguage(lang); setLanguageVisible(false); }}
              >
                <MaterialIcons name={selectedLanguage === lang ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color="#4CAF50" />
                <Text style={{ marginLeft: 8, fontSize: 16 }}>{lang}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setLanguageVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
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
            <Text style={{ fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 }}>support@gaonzaika.com</Text>
            <Text style={{ fontSize: 15, marginBottom: 10 }}>FAQs:</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to place an order?</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to track my order?</Text>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>• How to add a new address?</Text>
            <TouchableOpacity onPress={() => setHelpVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={aboutVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>About Gaon Zaika</Text>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>Gaon Zaika is your village food delivery app. Enjoy delicious food from your favorite local restaurants delivered to your doorstep!</Text>
            <Text style={{ fontSize: 14, color: '#888', marginBottom: 10 }}>Version 1.0.0</Text>
            <TouchableOpacity onPress={() => setAboutVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              <Text style={{ fontSize: 14, color: '#444' }}>
                We respect your privacy. Your data is safe and will not be shared with third parties. For more details, contact support@gaonzaika.com.
              </Text>
            </ScrollView>
            <TouchableOpacity onPress={() => setPrivacyVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={termsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              <Text style={{ fontSize: 14, color: '#444' }}>
                By using Gaon Zaika, you agree to our terms and conditions. Please use the app responsibly and contact support for any issues.
              </Text>
            </ScrollView>
            <TouchableOpacity onPress={() => setTermsVisible(false)} style={[styles.modalButton, { alignSelf: 'center', marginTop: 10 }]}> 
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
    backgroundColor: '#E8F5E8',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomerProfileScreen; 