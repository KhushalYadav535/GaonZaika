import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	TouchableOpacity,
	SafeAreaView,
	Alert,
	ActivityIndicator,
	StatusBar,
	Animated,
	Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const DeliveryInfoScreen = ({ route, navigation }) => {
  const { restaurant, cart } = route.params;
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    houseNumber: '',
    apartment: '',
    floor: '',
    landmark: '',
    area: '',
    city: '',
    pincode: '',
    state: '',
    additionalInstructions: '',
    addressType: 'Home'
  });

  useEffect(() => {
    loadSavedDeliveryInfo();
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadSavedDeliveryInfo = async () => {
    try {
      const savedInfo = await AsyncStorage.getItem('lastDeliveryInfo');
      if (savedInfo) {
        const parsedInfo = JSON.parse(savedInfo);
        setDeliveryInfo(prev => ({ ...prev, ...parsedInfo }));
      }
    } catch (error) {
      console.error('Error loading saved delivery info:', error);
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setDeliveryInfo(prev => ({
          ...prev,
          area: address.district || '',
          city: address.city || '',
          state: address.region || '',
          pincode: address.postalCode || '',
          address: `${address.street || ''} ${address.name || ''}`.trim()
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location. Please enter address manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = () => {
    if (!deliveryInfo.name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return false;
    }
    if (!deliveryInfo.phone.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number.');
      return false;
    }
    if (deliveryInfo.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return false;
    }
    if (!deliveryInfo.address.trim()) {
      Alert.alert('Missing Information', 'Please enter your address.');
      return false;
    }
    if (!deliveryInfo.area.trim()) {
      Alert.alert('Missing Information', 'Please enter your area/locality.');
      return false;
    }
    if (!deliveryInfo.city.trim()) {
      Alert.alert('Missing Information', 'Please enter your city.');
      return false;
    }
    if (!deliveryInfo.pincode.trim()) {
      Alert.alert('Missing Information', 'Please enter your pincode.');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Save delivery info for future use
      await AsyncStorage.setItem('lastDeliveryInfo', JSON.stringify(deliveryInfo));
      
      // Navigate to cart screen with enhanced delivery info
      navigation.navigate('Cart', {
        restaurant,
        cart,
        deliveryInfo
      });
    } catch (error) {
      console.error('Error saving delivery info:', error);
      Alert.alert('Error', 'Failed to save delivery information.');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryInfo = (field, value) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Information</Text>
        <View style={styles.placeholder} />
      </Animated.View>

                   <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#E3F2FD', '#F8FBFF']}
            style={styles.infoCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="location-on" size={24} color="#2196F3" />
            </View>
            <Text style={styles.cardTitle}>
              Help delivery personnel find you easily
            </Text>
            <Text style={styles.cardSubtitle}>
              Provide detailed information to ensure smooth delivery
            </Text>
          </LinearGradient>
        </Animated.View>

                         {/* Address Type Chips */}
        <Animated.View 
          style={[
            styles.typeContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.typeLabel}>Address Type</Text>
          <View style={styles.typeRow}>
            {['Home', 'Work', 'Other'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  deliveryInfo.addressType === type && styles.typeChipSelected
                ]}
                activeOpacity={0.8}
                onPress={() => updateDeliveryInfo('addressType', type)}
              >
                <LinearGradient
                  colors={deliveryInfo.addressType === type 
                    ? ['#2196F3', '#1976D2'] 
                    : ['#F8FBFF', '#E3F2FD']
                  }
                  style={styles.typeChipGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons
                    name={type === 'Home' ? 'home' : type === 'Work' ? 'work' : 'place'}
                    size={18}
                    color={deliveryInfo.addressType === type ? 'white' : '#2196F3'}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      deliveryInfo.addressType === type && styles.typeChipTextSelected
                    ]}
                  >
                    {type}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

                         <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
           
           <View style={styles.inputGroup}>
             <View style={styles.labelContainer}>
               <MaterialIcons name="person-outline" size={18} color="#2196F3" />
               <Text style={styles.label}>Full Name *</Text>
             </View>
             <TextInput
               style={styles.input}
               placeholder="Enter your full name"
               value={deliveryInfo.name}
               onChangeText={(text) => updateDeliveryInfo('name', text)}
             />
           </View>

           <View style={styles.inputGroup}>
             <View style={styles.labelContainer}>
               <MaterialIcons name="phone" size={18} color="#2196F3" />
               <Text style={styles.label}>Phone Number *</Text>
             </View>
             <TextInput
               style={styles.input}
               placeholder="Enter your phone number"
               value={deliveryInfo.phone}
               onChangeText={(text) => updateDeliveryInfo('phone', text)}
               keyboardType="phone-pad"
             />
           </View>
         </Animated.View>

        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <MaterialIcons name="home" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Address Details</Text>
          </View>
          
          <View style={styles.locationCard}>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={gettingLocation}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#E3F2FD', '#BBDEFB']}
                style={styles.locationButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="my-location" size={20} color="#2196F3" />
                <Text style={styles.locationButtonText}>
                  {gettingLocation ? 'Getting location...' : '📍 Use Current Location'}
                </Text>
                {gettingLocation && <ActivityIndicator size="small" color="#2196F3" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.addressSection}>
            <View style={styles.sectionSubtitle}>
              <MaterialIcons name="location-city" size={18} color="#666" />
              <Text style={styles.subtitleText}>Complete Address</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <MaterialIcons name="home" size={16} color="#2196F3" />
                <Text style={styles.label}>Complete Address *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your complete address"
                value={deliveryInfo.address}
                onChangeText={(text) => updateDeliveryInfo('address', text)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

                                           <View style={styles.addressSection}>
              <View style={styles.sectionSubtitle}>
                <MaterialIcons name="home" size={20} color="#666" />
                <Text style={styles.subtitleText}>House Details</Text>
              </View>
              
              <View style={styles.buildingCard}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <MaterialIcons name="house" size={18} color="#2196F3" />
                    <Text style={styles.label}>House Number/Name</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., House No. 45, Ram Niwas"
                    value={deliveryInfo.houseNumber}
                    onChangeText={(text) => updateDeliveryInfo('houseNumber', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <MaterialIcons name="place" size={18} color="#2196F3" />
                    <Text style={styles.label}>Nearby Landmark</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Near Temple, Behind School"
                    value={deliveryInfo.landmark}
                    onChangeText={(text) => updateDeliveryInfo('landmark', text)}
                  />
                </View>
              </View>
            </View>

                                           <View style={styles.addressSection}>
              <View style={styles.sectionSubtitle}>
                <MaterialIcons name="location-on" size={20} color="#666" />
                <Text style={styles.subtitleText}>Village Details</Text>
              </View>
              
              <View style={styles.locationDetailsCard}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <MaterialIcons name="map" size={18} color="#2196F3" />
                    <Text style={styles.label}>Village Name *</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your village name"
                    value={deliveryInfo.area}
                    onChangeText={(text) => updateDeliveryInfo('area', text)}
                  />
                </View>

                <View style={styles.locationRow}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <View style={styles.labelContainer}>
                      <MaterialIcons name="location-city" size={18} color="#2196F3" />
                      <Text style={styles.label}>Tehsil/Block *</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter tehsil or block"
                      value={deliveryInfo.city}
                      onChangeText={(text) => updateDeliveryInfo('city', text)}
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <View style={styles.labelContainer}>
                      <MaterialIcons name="markunread-mailbox" size={18} color="#2196F3" />
                      <Text style={styles.label}>Pincode *</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter pincode"
                      value={deliveryInfo.pincode}
                      onChangeText={(text) => updateDeliveryInfo('pincode', text)}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <MaterialIcons name="public" size={18} color="#2196F3" />
                    <Text style={styles.label}>District</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your district"
                    value={deliveryInfo.state}
                    onChangeText={(text) => updateDeliveryInfo('state', text)}
                  />
                </View>
              </View>
            </View>

          <View style={styles.addressSection}>
            <View style={styles.sectionSubtitle}>
              <MaterialIcons name="note" size={18} color="#666" />
              <Text style={styles.subtitleText}>Additional Information</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <MaterialIcons name="edit" size={16} color="#2196F3" />
                <Text style={styles.label}>Additional Instructions</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special instructions for delivery (optional)"
                value={deliveryInfo.additionalInstructions}
                onChangeText={(text) => updateDeliveryInfo('additionalInstructions', text)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.tipsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
           <LinearGradient
             colors={['#FFF3E0', '#FFE0B2']}
             style={styles.tipsCardGradient}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
           >
             <View style={styles.tipsHeader}>
               <MaterialIcons name="lightbulb" size={24} color="#FF9800" />
               <Text style={styles.tipsTitle}>Tips for accurate delivery</Text>
             </View>
                           <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.tipText}>Mention nearby landmarks like temple, school, or shop</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.tipText}>Include house name or number for easy identification</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.tipText}>Provide directions from main road or village center</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.tipText}>Ensure phone number is correct for contact</Text>
                </View>
              </View>
           </LinearGradient>
         </Animated.View>
      </ScrollView>

      <Animated.View 
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#2196F3', '#1976D2']}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue to Cart</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  placeholder: {
    width: 32
  },
     typeContainer: {
     backgroundColor: 'white',
     borderRadius: 12,
     padding: 16,
     marginBottom: 16,
     elevation: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.08,
     shadowRadius: 2
   },
   typeLabel: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#333',
     marginBottom: 12
   },
   typeRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: 8
   },
     typeChip: {
     flex: 1,
     borderRadius: 12,
     overflow: 'hidden',
     elevation: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 2
   },
   typeChipGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderRadius: 12,
   },
     typeChipSelected: {
     elevation: 4,
     shadowOpacity: 0.2,
     shadowRadius: 4
   },
     typeChipText: {
     marginLeft: 8,
     color: '#2196F3',
     fontWeight: '600',
     fontSize: 14
   },
  typeChipTextSelected: {
    color: 'white'
  },
  content: {
    flex: 1,
    padding: 20
  },
       infoCard: {
    borderRadius: 20,
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden'
  },
     infoCardGradient: {
    padding: 24,
    borderRadius: 20,
  },
     cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
     cardTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#1976D2',
     marginBottom: 8
   },
  cardSubtitle: {
    fontSize: 14,
    color: '#424242'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8
  },
  locationCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3F2FD'
  },
  locationButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  locationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
  },
  locationButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 8
  },
  inputGroup: {
    marginBottom: 16
  },
  addressSection: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  sectionSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
     buildingCard: {
     backgroundColor: '#F8FBFF',
     borderRadius: 12,
     padding: 16,
     borderWidth: 1,
     borderColor: '#E3F2FD',
     elevation: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.08,
     shadowRadius: 2
   },
   buildingRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 16
   },
   locationDetailsCard: {
     backgroundColor: '#F8FBFF',
     borderRadius: 12,
     padding: 16,
     borderWidth: 1,
     borderColor: '#E3F2FD',
     elevation: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.08,
     shadowRadius: 2
   },
   locationRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 16
   },
   row: {
     flexDirection: 'row',
     justifyContent: 'space-between'
   },
  halfWidth: {
    width: '48%'
  },
     tipsCard: {
     borderRadius: 16,
     marginBottom: 20,
     elevation: 4,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.12,
     shadowRadius: 4,
     overflow: 'hidden'
   },
   tipsCardGradient: {
     padding: 20,
     borderRadius: 16,
   },
   tipsHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 16
   },
   tipsList: {
     gap: 12
   },
   tipItem: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 12
   },
     tipsTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#E65100',
     marginLeft: 8
   },
     tipText: {
     fontSize: 14,
     color: '#424242',
     flex: 1
   },
  bottomSection: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8
  }
});

export default DeliveryInfoScreen; 