# Push Notifications Setup Guide - Gaon Zaika

This guide explains how to set up and use push notifications in the Gaon Zaika app without Firebase, using **Expo's free push notification service**.

## 🚀 Free Push Notification Alternatives

### 1. **Expo Push Notifications** (Recommended)
- ✅ **Completely FREE**
- ✅ No setup fees or monthly charges
- ✅ Works with Expo managed workflow
- ✅ Supports iOS and Android
- ✅ Built-in token management
- ✅ Automatic error handling

### 2. **OneSignal** (Alternative)
- ✅ Free tier available (10,000 subscribers)
- ✅ Cross-platform support
- ✅ Rich analytics
- ❌ Requires additional setup

### 3. **Web Push API** (For web notifications)
- ✅ Completely free
- ✅ Works in browsers
- ❌ Limited to web platforms

## 📱 Setup Instructions

### Step 1: Install Dependencies

**Frontend (React Native/Expo):**
```bash
cd frontend
npm install expo-notifications expo-device
```

**Backend (Node.js):**
```bash
cd backend
npm install axios
```

### Step 2: Configure Expo Project

1. **Create Expo account** (if you don't have one):
   - Go to [expo.dev](https://expo.dev)
   - Sign up for a free account

2. **Get your project ID**:
   - Run `expo login` in your project directory
   - Run `expo projects:list` to see your projects
   - Note your project ID

3. **Update the project ID** in `frontend/services/pushNotificationService.js`:
   ```javascript
   const token = await Notifications.getExpoPushTokenAsync({
     projectId: 'your-expo-project-id', // Replace with your actual project ID
   });
   ```

### Step 3: Configure App.json

Add the following to your `frontend/app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### Step 4: Build and Deploy

1. **For development testing**:
   ```bash
   cd frontend
   expo start
   ```

2. **For production**:
   ```bash
   expo build:android
   expo build:ios
   ```

## 🔧 Usage Examples

### Frontend Integration

1. **Initialize in your main App component**:
   ```javascript
   import { usePushNotifications } from './hooks/usePushNotifications';
   
   function App() {
     const { isInitialized, hasPermission } = usePushNotifications();
     
     // Your app code...
   }
   ```

2. **Send test notification**:
   ```javascript
   const { sendTestNotification } = usePushNotifications();
   
   // Send test notification
   await sendTestNotification('Hello!', 'This is a test notification');
   ```

3. **Handle notification taps**:
   ```javascript
   // The hook automatically handles navigation based on notification type
   // You can customize this in pushNotificationService.js
   ```

### Backend Integration

1. **Send order status update**:
   ```javascript
   const pushNotificationService = require('./services/pushNotificationService');
   
   await pushNotificationService.sendOrderStatusUpdate(
     pushToken,
     orderId,
     'Preparing',
     'Restaurant Name'
   );
   ```

2. **Send new order to vendor**:
   ```javascript
   await pushNotificationService.sendNewOrderToVendor(
     pushToken,
     orderId,
     'Customer Name',
     500
   );
   ```

3. **Send promotional notification**:
   ```javascript
   await pushNotificationService.sendPromotionalNotification(
     pushToken,
     'Special Offer!',
     'Get 20% off with code SAVE20',
     'SAVE20'
   );
   ```

## 🧪 Testing

### Test Screen
Use the provided `TestPushNotificationScreen.js` to test all notification types:

1. **Local notifications** - Test immediate notifications
2. **Backend notifications** - Test server-sent notifications
3. **Order updates** - Test order status changes
4. **Vendor notifications** - Test new order alerts
5. **Delivery updates** - Test delivery status changes
6. **Promotional notifications** - Test marketing messages

### Manual Testing Steps

1. **Install the app** on a physical device (not simulator)
2. **Grant notification permissions** when prompted
3. **Login to the app** with any user account
4. **Navigate to test screen** and try different notification types
5. **Test background notifications** by putting app in background
6. **Test notification taps** to verify navigation

## 📊 API Endpoints

### Save Push Token
```http
POST /api/push-notifications/save-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "pushToken": "ExponentPushToken[...]"
}
```

### Send Test Notification
```http
POST /api/push-notifications/send-test
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test Title",
  "body": "Test Body"
}
```

### Order Status Update
```http
POST /api/push-notifications/order-status-update
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "ORDER123",
  "status": "Preparing",
  "customerId": "CUSTOMER123",
  "restaurantName": "Restaurant Name"
}
```

### New Order to Vendor
```http
POST /api/push-notifications/new-order-vendor
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "ORDER123",
  "vendorId": "VENDOR123",
  "customerName": "Customer Name",
  "totalAmount": 500
}
```

### Delivery Update
```http
POST /api/push-notifications/delivery-update
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "ORDER123",
  "status": "On the way",
  "customerId": "CUSTOMER123",
  "estimatedTime": "15 minutes"
}
```

### Promotional Notification (Admin Only)
```http
POST /api/push-notifications/promotional
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Special Offer!",
  "body": "Get 20% off with code SAVE20",
  "promoCode": "SAVE20"
}
```

## 🔒 Security Considerations

1. **Token Validation**: Always validate push tokens before sending
2. **Rate Limiting**: Implement rate limiting for notification endpoints
3. **User Permissions**: Only send notifications to users who have granted permission
4. **Token Cleanup**: Remove invalid tokens from database
5. **Admin Access**: Restrict promotional notifications to admin users only

## 🐛 Troubleshooting

### Common Issues

1. **"Device not registered" error**:
   - Token is invalid or expired
   - Remove token from database
   - User needs to re-login

2. **"Message too big" error**:
   - Notification payload exceeds 4KB limit
   - Reduce message size

3. **"Message rate exceeded" error**:
   - Too many notifications sent too quickly
   - Implement rate limiting

4. **Notifications not showing**:
   - Check device permissions
   - Verify app is not in foreground (for background notifications)
   - Check notification settings in device

### Debug Steps

1. **Check console logs** for error messages
2. **Verify push token** format and validity
3. **Test with Expo's push notification tool**:
   - Go to [expo.dev](https://expo.dev)
   - Navigate to your project
   - Use the push notification tool to test

## 📈 Monitoring and Analytics

### Expo Dashboard
- Monitor notification delivery rates
- View error logs
- Track token validity

### Custom Analytics
- Track notification open rates
- Monitor user engagement
- Analyze notification effectiveness

## 💰 Cost Comparison

| Service | Free Tier | Paid Plans | Setup Cost |
|---------|-----------|------------|------------|
| **Expo Push** | ✅ Unlimited | ❌ None | $0 |
| Firebase | ✅ 1M messages/month | $25/month for 1M+ | $0 |
| OneSignal | ✅ 10K subscribers | $9/month for 10K+ | $0 |
| AWS SNS | ✅ 1M publishes/month | Pay per use | $0 |

## 🎯 Best Practices

1. **Permission Management**:
   - Request permissions at appropriate times
   - Explain why notifications are needed
   - Provide opt-out options

2. **Notification Content**:
   - Keep titles under 50 characters
   - Keep bodies under 200 characters
   - Use actionable language

3. **Timing**:
   - Send notifications at appropriate times
   - Avoid spam (max 1-2 per day)
   - Respect user preferences

4. **Testing**:
   - Test on multiple devices
   - Test in different app states
   - Test with different network conditions

## 📞 Support

For issues with:
- **Expo Push Notifications**: [Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- **React Native**: [React Native Documentation](https://reactnative.dev/)
- **Project-specific issues**: Check the project README

---

**Note**: This implementation uses Expo's free push notification service, which is perfect for most apps. If you need more advanced features or higher limits, consider upgrading to Expo's paid plans or switching to other services like OneSignal. 