# Gaon Zaika Backend API

A comprehensive Node.js/Express backend for the Gaon Zaika food delivery application with complete authentication system.

## 🚀 Features

### Authentication System
- **Multi-role Authentication**: Customer, Vendor, Delivery, Admin
- **Email/Password Login**: Secure authentication for all roles
- **PIN-based Login**: Demo login system for quick access
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt encryption
- **Input Validation**: Express-validator for all endpoints

### User Management
- **Customer Management**: Profile, addresses, preferences, order history
- **Vendor Management**: Restaurant management, order handling
- **Delivery Management**: Order assignment, location tracking, earnings
- **Admin Management**: Platform administration, user management

### Security Features
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin resource sharing
- **Helmet Security**: HTTP headers protection
- **Input Sanitization**: XSS and injection protection
- **Role-based Authorization**: Route protection

## 📁 Project Structure

```
backend/
├── models/              # Database models
│   ├── Customer.js      # Customer model
│   ├── Vendor.js        # Vendor model
│   ├── DeliveryPerson.js # Delivery person model
│   ├── Admin.js         # Admin model
│   ├── Restaurant.js    # Restaurant model
│   └── Order.js         # Order model
├── controllers/         # Business logic
│   └── authController.js # Authentication logic
├── routes/             # API routes
│   ├── auth.js         # Authentication routes
│   ├── customers.js    # Customer routes
│   ├── vendors.js      # Vendor routes
│   ├── delivery.js     # Delivery routes
│   ├── admin.js        # Admin routes
│   ├── restaurants.js  # Restaurant routes
│   └── orders.js       # Order routes
├── middleware/         # Custom middleware
│   └── auth.js         # JWT authentication
├── utils/              # Utility functions
│   └── emailService.js # Email service
├── server.js           # Main server file
├── package.json        # Dependencies
└── env.example         # Environment variables template
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
cd backend
npm install
```

2. **Environment Setup**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 🔐 Authentication Endpoints

### Customer Authentication
```http
POST /api/auth/customer/register
POST /api/auth/customer/login
```

### Vendor Authentication
```http
POST /api/auth/vendor/register
POST /api/auth/vendor/login
```

### Delivery Authentication
```http
POST /api/auth/delivery/register
POST /api/auth/delivery/login
```

### Admin Authentication
```http
POST /api/auth/admin/register
POST /api/auth/admin/login
```

### PIN-based Login (Demo)
```http
POST /api/auth/pin-login
```

## 📋 API Endpoints

### Customer Routes
```http
GET    /api/customers/profile
PATCH  /api/customers/profile
GET    /api/customers/addresses
POST   /api/customers/addresses
PATCH  /api/customers/addresses/:id
DELETE /api/customers/addresses/:id
GET    /api/customers/orders
GET    /api/customers/orders/:id
PATCH  /api/customers/preferences
```

### Restaurant Routes
```http
GET    /api/restaurants
GET    /api/restaurants/:id
GET    /api/restaurants/:id/menu
POST   /api/restaurants/search
```

### Order Routes
```http
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
```

### Vendor Routes
```http
GET    /api/vendor/:id/profile
GET    /api/vendor/:id/orders
GET    /api/vendor/:id/dashboard
PATCH  /api/vendor/:id/profile
```

### Delivery Routes
```http
GET    /api/delivery/:id/orders
PATCH  /api/delivery/:id/location
PATCH  /api/delivery/:id/availability
```

### Admin Routes
```http
GET    /api/admin/dashboard
GET    /api/admin/restaurants
GET    /api/admin/orders
GET    /api/admin/users
```

## 🔑 Default Credentials

### PIN-based Login (Demo)
- **Vendor PIN**: 1234
- **Delivery PIN**: 5678
- **Admin PIN**: 9999

### Default Admin (Auto-created)
- **Email**: admin@gaonzaika.com
- **Password**: Khushal@2003

## 🧪 Testing

Run the authentication test script:
```bash
node test-auth.js
```

This will test all authentication endpoints and verify they're working correctly.

## 🔒 Security Features

### JWT Authentication
- Tokens expire in 7 days
- Role-based access control
- Secure token verification

### Input Validation
- Email format validation
- Phone number validation (Indian format)
- Password strength requirements
- Required field validation

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable limits in environment variables

### CORS Protection
- Configurable origins
- Credentials support
- Secure cross-origin requests

## 📊 Database Models

### Customer Model
- Basic info (name, email, phone, password)
- Address management
- Preferences and settings
- Order history tracking

### Vendor Model
- Basic info (name, email, phone, password)
- Restaurant association
- Bank details and documents
- Commission tracking

### DeliveryPerson Model
- Basic info (name, email, phone, password)
- Vehicle details
- Location tracking
- Earnings and statistics

### Admin Model
- Basic info (name, email, password)
- Role and permissions
- Access control

## 🚀 Deployment

### Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=your-mongodb-connection-string

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=your-frontend-url
```

### Production Deployment
1. Set up environment variables
2. Configure MongoDB Atlas
3. Set up reverse proxy (nginx)
4. Use PM2 for process management
5. Enable HTTPS

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## 🔧 Development

### Adding New Routes
1. Create route file in `routes/` directory
2. Add validation middleware
3. Implement controller logic
4. Add to `server.js`
5. Test with Postman or test script

### Adding New Models
1. Create model file in `models/` directory
2. Define schema with validation
3. Add indexes for performance
4. Create methods for business logic
5. Update related routes

## 📞 Support

For issues and questions:
1. Check the logs for error details
2. Verify environment variables
3. Test with the provided test script
4. Check MongoDB connection

## 📄 License

MIT License - see LICENSE file for details 