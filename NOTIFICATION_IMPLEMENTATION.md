# 🔔 Premium Notification System Implementation Guide

## Overview
The premium notification system is implemented like Zomato/Swiggy with:
- ✨ Beautiful gradient animations
- 📱 Auto-dismiss notifications
- 🎯 Role-based notifications (Customer, Vendor, Delivery Boy)
- 🔊 Sound and vibration
- 📡 Real-time updates via push notifications

---

## 📋 Notification Flow

### 1. **Customer Places Order**
```
Customer App → Backend POST /orders
↓
Backend finds Vendor → Sends "New Order" notification
Backend finds Online Delivery Boys → Broadcasts "Order Available"
```

### 2. **Vendor Accepts Order**
```
Vendor App → Backend PATCH /orders/:id/status (Accepted)
↓
Backend sends "Order Accepted" to Customer
Vendor App shows confirmation
```

### 3. **Vendor Marks Preparing**
```
Vendor App → Backend PATCH /orders/:id/status (Preparing)
↓
Backend sends "Order Preparing" to Customer
Customer sees real-time status update
```

### 4. **Vendor Marks Ready**
```
Vendor App → Backend PATCH /orders/:id/status (Ready for Delivery)
↓
Backend notifies ALL Online Delivery Boys with order details
Backend notifies Customer "Order Ready"
Delivery Boys race to accept
```

### 5. **Delivery Boy Accepts**
```
Delivery App → Backend (Accept Order)
↓
Backend assigns Delivery Boy → Customer notified with delivery boy details
Backend notifies Customer "Delivery Assigned"
```

### 6. **Out for Delivery**
```
Delivery App → Backend PATCH /orders/:id/status (Out for Delivery)
↓
Backend sends "Out for Delivery" with ETA to Customer
Real-time location tracking enabled
```

### 7. **Order Delivered**
```
Delivery App → Backend PATCH /orders/:id/status (Delivered)
↓
Backend sends "Order Delivered" to Customer
Customer prompted to rate & review
```

---

## 🛠️ Integration in Screens

### For Customer Screens

#### Step 1: Import hooks
```javascript
import { useNotificationHandler } from '../hooks/useNotificationHandler';
import { PremiumNotificationStack } from '../components/PremiumNotification';
```

#### Step 2: Setup in your main app/navigator
```javascript
// In your App.js or CustomerNavigator.js
export default function YourComponent() {
  const notificationHandler = useNotificationHandler();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Your app content */}
      <YourScreens />
      
      {/* Add notification stack at top level */}
      <PremiumNotificationStack
        notifications={notificationHandler.notifications}
        onDismiss={notificationHandler.removeNotification}
      />
    </SafeAreaView>
  );
}
```

#### Step 3: Listen for order updates
```javascript
// In your OrderStatusScreen.js or similar
import { useNotificationHandler } from '../hooks/useNotificationHandler';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function OrderStatusScreen() {
  const notificationHandler = useNotificationHandler();
  const { initialize } = usePushNotifications();

  useEffect(() => {
    // Initialize push notifications on app startup
    initialize();

    // Listen for order updates via socket or API polling
    const unsubscribe = subscribeToOrderUpdates((order) => {
      // Show notification via premium system
      notificationHandler.showInfo(
        `Order status: ${order.status}`,
        '📍 Order Update'
      );
    });

    return () => unsubscribe();
  }, []);

  return (
    <View>
      {/* Your order status UI */}
    </View>
  );
}
```

### For Vendor Screens

#### Example: Vendor Orders Screen
```javascript
import { useNotificationHandler } from '../hooks/useNotificationHandler';
import { PremiumNotificationStack } from '../components/PremiumNotification';

export default function VendorOrdersScreen() {
  const notificationHandler = useNotificationHandler();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Listen for new orders
    const socket = io('your-backend-url');
    
    socket.on('new_order', (order) => {
      // Show premium notification like Zomato
      notificationHandler.showNewOrder(
        `Order from ${order.customerInfo.name} - ₹${order.totalAmount}`,
        order.customerInfo.name
      );
      
      // Add to orders list
      setOrders(prev => [order, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'Accepted');
      // Notification sent automatically by backend
      notificationHandler.showSuccess('Order accepted!');
    } catch (error) {
      notificationHandler.showError('Failed to accept order');
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'Ready for Delivery');
      notificationHandler.showSuccess('Notified delivery boys');
    } catch (error) {
      notificationHandler.showError('Failed to mark ready');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onAccept={() => handleAcceptOrder(item._id)}
            onMarkReady={() => handleMarkReady(item._id)}
          />
        )}
      />
      
      {/* Premium notification display */}
      <PremiumNotificationStack
        notifications={notificationHandler.notifications}
        onDismiss={notificationHandler.removeNotification}
      />
    </View>
  );
}
```

### For Delivery Boy Screens

#### Example: Available Orders Screen
```javascript
import { useNotificationHandler } from '../hooks/useNotificationHandler';
import { PremiumNotificationStack } from '../components/PremiumNotification';

export default function AvailableOrdersScreen() {
  const notificationHandler = useNotificationHandler();
  const [availableOrders, setAvailableOrders] = useState([]);

  useEffect(() => {
    // Listen for ready orders
    const socket = io('your-backend-url');
    
    socket.on('order_ready_for_pickup', (order) => {
      // Show premium notification
      notificationHandler.showOrderReady(
        `${order.restaurantName} • ${order.totalAmount} • ${order.customerName}`
      );
      
      // Add rush/urgent timing effect
      playAlertSound(); // Optional
      
      setAvailableOrders(prev => [order, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      // Accept the order
      await assignDeliveryToOrder(orderId);
      
      // Show success notification
      notificationHandler.showSuccess('Order accepted! Pick up from restaurant');
      
      // Navigate to order details
      navigation.navigate('DeliveryDetails', { orderId });
    } catch (error) {
      notificationHandler.showError('Failed to accept order');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={availableOrders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onAccept={() => handleAcceptOrder(item._id)}
            style={styles.urgentCard}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Premium notification display */}
      <PremiumNotificationStack
        notifications={notificationHandler.notifications}
        onDismiss={notificationHandler.removeNotification}
      />
    </View>
  );
}
```

---

## 🎨 Notification Types & Styling

| Type | Icon | Colors | Use Case |
|------|------|--------|----------|
| `new_order` | 🛒 | Orange/Red | New order for vendor |
| `order_accepted` | ✅ | Green | Customer order accepted |
| `order_preparing` | 👨‍🍳 | Orange | Food being prepared |
| `order_ready_for_pickup` | 🚗 | Blue | Ready for delivery boys |
| `delivery_assigned` | 👤 | Purple | Delivery person assigned |
| `out_for_delivery` | 📍 | Cyan | On the way |
| `order_delivered` | ✨ | Green | Successfully delivered |
| `order_cancelled` | ❌ | Red | Order cancelled |
| `delivery_arrived` | 📍 | Orange | Delivery partner arrived |

---

## 🔧 Backend Integration

The backend automatically sends notifications at these points:

1. **Order Placement** (`POST /orders`)
   - ✉️ Vendor receives "New Order"
   - 📱 Delivery boys receive "Order Available"

2. **Status Updates** (`PATCH /orders/:id/status`)
   - ✅ `Accepted` → Customer gets notification
   - 👨‍🍳 `Preparing` → Customer gets notification
   - 🚗 `Ready for Delivery` → All delivery boys notified
   - 📍 `Out for Delivery` → Customer gets delivery details
   - ✨ `Delivered` → Customer gets delivery complete
   - ❌ `Cancelled` → Customer gets cancellation reason

---

## 📱 Push Token Management

### Register Device Token
On app startup, the token is automatically saved:

```javascript
// In App.js
useEffect(() => {
  const { initialize } = usePushNotifications();
  initialize(); // Registers token with backend
}, []);
```

### Backend Endpoint to Save Token
```javascript
// POST /api/auth/save-push-token
{
  "pushToken": "ExponentPushToken[...]",
  "userId": "customer_id",
  "role": "customer"
}
```

---

## 🔊 Sound & Vibration Settings

The notification service includes:
- 📢 Default alarm sound
- 📳 Vibration pattern: [0, 250, 250, 250] (buzz buzz buzz)
- ⏰ Auto-dismiss after 5 seconds
- ✨ Smooth fade-in/fade-out animations

To customize per notification:
```javascript
notificationHandler.addNotification({
  type: 'new_order',
  title: 'Custom Title',
  body: 'Custom body',
}, 7000); // 7 second duration
```

---

## 🧪 Testing Notifications

### Test from Backend
```bash
# Send test notification to a specific customer
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "customer_id",
    "title": "Test Notification",
    "body": "This is a test"
  }'
```

### Test from Frontend
```javascript
const { sendTestNotification } = usePushNotifications();

// In any screen
<Button
  title="Test Notification"
  onPress={() => sendTestNotification('Test', 'This is a test')}
/>
```

---

## 🐛 Troubleshooting

### Notifications not showing?
1. Check push token is registered: `console.log(pushToken)`
2. Verify notification permissions are granted
3. Check backend logs for notification errors
4. Ensure `useNotificationHandler` is at app root level

### Notifications showing but not going away?
1. Check notification duration: `addNotification({...}, 5000)`
2. Verify animations are completing
3. Check for console errors

### Push tokens not updating?
1. Call `initialize()` on app startup
2. Check internet connection
3. Verify backend endpoint for saving tokens

---

## 📝 Quick Checklist

- [ ] Import `usePremiumNotifications` and `PremiumNotificationStack` in root component
- [ ] Add `PremiumNotificationStack` at top level of app
- [ ] Call `useNotificationHandler()` in screens that need notifications
- [ ] Initialize push notifications at app startup
- [ ] Test notifications for each role (customer, vendor, delivery)
- [ ] Verify sound and vibration work
- [ ] Check notification tap handlers
- [ ] Test notification persistence across screen navigation

---

## 🎯 Summary

This premium notification system provides:
1. **Beautiful UI** - Gradient animations like Zomato
2. **Smart Targeting** - Send to right role at right time
3. **Auto Management** - Stack notifications, auto-dismiss
4. **Real-time** - Socket.io + Push notifications
5. **Customizable** - Easy to modify colors, sounds, behavior

Happy notifications! 🎉
