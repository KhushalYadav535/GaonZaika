import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useVendor = () => {
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const storedVendorData = await AsyncStorage.getItem('vendorData');
      if (storedVendorData) {
        setVendorData(JSON.parse(storedVendorData));
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearVendorData = async () => {
    try {
      await AsyncStorage.removeItem('vendorData');
      await AsyncStorage.removeItem('vendorToken');
      setVendorData(null);
    } catch (error) {
      console.error('Error clearing vendor data:', error);
    }
  };

  return {
    vendorData,
    loading,
    vendorId: vendorData?.id,
    vendorName: vendorData?.name,
    vendorEmail: vendorData?.email,
    vendorPhone: vendorData?.phone,
    restaurant: vendorData?.restaurant,
    clearVendorData,
    reloadVendorData: loadVendorData
  };
}; 