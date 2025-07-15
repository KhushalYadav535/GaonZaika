import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ErrorMessage = ({ 
  message, 
  onRetry, 
  onDismiss, 
  type = 'error', // 'error', 'warning', 'info'
  visible = true 
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: '#FFF3CD',
          borderColor: '#FFEAA7',
          iconColor: '#F39C12',
          textColor: '#856404',
        };
      case 'info':
        return {
          backgroundColor: '#D1ECF1',
          borderColor: '#BEE5EB',
          iconColor: '#17A2B8',
          textColor: '#0C5460',
        };
      default: // error
        return {
          backgroundColor: '#F8D7DA',
          borderColor: '#F5C6CB',
          iconColor: '#DC3545',
          textColor: '#721C24',
        };
    }
  };

  const typeStyles = getTypeStyles();

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'error';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        typeStyles,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons 
          name={getIcon()} 
          size={24} 
          color={typeStyles.iconColor} 
          style={styles.icon}
        />
        <Text style={[styles.message, { color: typeStyles.textColor }]}>
          {message}
        </Text>
      </View>
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.actionButton}>
            <MaterialIcons name="refresh" size={20} color={typeStyles.iconColor} />
            <Text style={[styles.actionText, { color: typeStyles.textColor }]}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.actionButton}>
            <MaterialIcons name="close" size={20} color={typeStyles.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ErrorMessage; 