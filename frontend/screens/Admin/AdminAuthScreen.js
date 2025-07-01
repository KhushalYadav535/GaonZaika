import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AdminAuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('admin@gaonzaika.com');
  const [password, setPassword] = useState('Khushal@2003');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (email === 'admin@gaonzaika.com' && password === 'Khushal@2003') {
        Alert.alert('Success', 'Admin login successful!');
        navigation.replace('AdminTabs');
      } else {
        Alert.alert('Error', 'Invalid credentials. Please try again.');
      }
    }, 1500);
  };

  const fillDefaultCredentials = () => {
    setEmail('admin@gaonzaika.com');
    setPassword('Khushal@2003');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="admin-panel-settings" size={60} color="#9C27B0" />
        <Text style={styles.appName}>Gaon Zaika</Text>
        <Text style={styles.slogan}>Swad Gaon Ka</Text>
        <Text style={styles.roleTitle}>Admin Portal</Text>
      </View>

      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Admin Login</Text>
        <Text style={styles.authSubtitle}>
          Access the admin dashboard to manage the platform
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.defaultButton}
            onPress={fillDefaultCredentials}
          >
            <Text style={styles.defaultButtonText}>Fill Default Credentials</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Signing In...' : 'Sign In as Admin'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Default Admin Credentials:</Text>
          <Text style={styles.infoText}>Email: admin@gaonzaika.com</Text>
          <Text style={styles.infoText}>Password: Khushal@2003</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 16,
    marginBottom: 4,
  },
  slogan: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    color: '#9C27B0',
    fontWeight: 'bold',
  },
  authContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  defaultButton: {
    backgroundColor: '#E1BEE7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  defaultButtonText: {
    color: '#9C27B0',
    fontSize: 14,
    fontWeight: '600',
  },
  authButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#9C27B0',
    marginBottom: 4,
  },
});

export default AdminAuthScreen; 