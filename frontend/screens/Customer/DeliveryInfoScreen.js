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
    houseNumber: '',
    areaOrVillage: '',
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
    if (!deliveryInfo.houseNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your house number/building name.');
      return false;
    }
    if (!deliveryInfo.areaOrVillage.trim()) {
      Alert.alert('Missing Information', 'Please enter your area or village name.');
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
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" translucent={false} />
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['#1565C0', '#2196F3', '#1976D2']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Address</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
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

        {/* Address Section - Simplified for Village Users */}
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
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          
          {/* House Number/Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MaterialIcons name="house" size={18} color="#2196F3" />
              <Text style={styles.label}>House Number/Building Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g., House No. 45, Ram Niwas Bungalow"
              value={deliveryInfo.houseNumber}
              onChangeText={(text) => updateDeliveryInfo('houseNumber', text)}
            />
          </View>

          {/* Area/Village */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MaterialIcons name="location-on" size={18} color="#2196F3" />
              <Text style={styles.label}>Area/Village Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g., Goan Village, Main Road Area"
              value={deliveryInfo.areaOrVillage}
              onChangeText={(text) => updateDeliveryInfo('areaOrVillage', text)}
            />
          </View>

          {/* Additional Instructions */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MaterialIcons name="note" size={18} color="#2196F3" />
              <Text style={styles.label}>Directions/Landmarks (Optional)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Near temple, Behind school, Next to red gate"
              value={deliveryInfo.additionalInstructions}
              onChangeText={(text) => updateDeliveryInfo('additionalInstructions', text)}
              multiline
              numberOfLines={2}
            />
          </View>
        </Animated.View>

        {/* Quick Tips Card */}
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
               <MaterialIcons name="lightbulb" size={20} color="#FF9800" />
               <Text style={styles.tipsTitle}>Delivery Tips</Text>
             </View>
             <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                  <Text style={styles.tipText}>Mention nearby landmarks for easy location</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                  <Text style={styles.tipText}>Keep your phone ready for delivery person to contact</Text>
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
    elevation: 16,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40
  },
     typeContainer: {
     backgroundColor: 'white',
     borderRadius: 18,
     padding: 20,
     marginBottom: 20,
     elevation: 4,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
   },
   typeLabel: {
     fontSize: 18,
     fontWeight: '800',
     color: '#1565C0',
     marginBottom: 14,
     letterSpacing: 0.3,
   },
   typeRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: 8
   },
     typeChip: {
     flex: 1,
     borderRadius: 16,
     overflow: 'hidden',
     elevation: 3,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.12,
     shadowRadius: 3,
   },
   typeChipGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingHorizontal: 16,
     paddingVertical: 14,
     borderRadius: 16,
   },
     typeChipSelected: {
     elevation: 4,
     shadowOpacity: 0.2,
     shadowRadius: 4
   },
     typeChipText: {
     marginLeft: 10,
     color: '#2196F3',
     fontWeight: '700',
     fontSize: 15,
   },
  typeChipTextSelected: {
    color: 'white'
  },
  content: {
    flex: 1,
    padding: 20
  },
       infoCard: {
    borderRadius: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    overflow: 'hidden'
  },
     infoCardGradient: {
    padding: 28,
    borderRadius: 24,
  },
     cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(21, 101, 192, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(21, 101, 192, 0.3)',
  },
     cardTitle: {
     fontSize: 20,
     fontWeight: '800',
     color: '#1565C0',
     marginBottom: 10,
     letterSpacing: 0.3,
   },
  cardSubtitle: {
    fontSize: 14,
    color: '#424242'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#E3F2FD',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1565C0',
    marginLeft: 10,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#555',
    marginLeft: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
     buildingCard: {
     backgroundColor: '#F8FBFF',
     borderRadius: 16,
     padding: 18,
     borderWidth: 1.5,
     borderColor: '#E3F2FD',
     elevation: 3,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
   },
   buildingRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 16
   },
   locationDetailsCard: {
     backgroundColor: '#F8FBFF',
     borderRadius: 16,
     padding: 18,
     borderWidth: 1.5,
     borderColor: '#E3F2FD',
     elevation: 3,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
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
     borderRadius: 20,
     marginBottom: 24,
     elevation: 6,
     shadowColor: '#FF9800',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.15,
     shadowRadius: 8,
     overflow: 'hidden',
   },
   tipsCardGradient: {
     padding: 24,
     borderRadius: 20,
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
     fontSize: 20,
     fontWeight: '800',
     color: '#E65100',
     marginLeft: 10,
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
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
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