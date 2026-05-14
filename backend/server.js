const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for the mobile app
    methods: ['GET', 'POST', 'PATCH', 'PUT']
  }
});
app.set('io', io);

// Trust proxy for rate limiting behind load balancers/proxies
app.set('trust proxy', 1);

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const vendorRoutes = require('./routes/vendors');
const deliveryRoutes = require('./routes/delivery');
const adminRoutes = require('./routes/admin');
const pushNotificationRoutes = require('./routes/pushNotifications');
const foodRoutes = require('./routes/foods');

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// CORS configuration for multiple origins
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://192.168.1.5:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Gaon Zaika API is running',
    timestamp: new Date().toISOString()
  });
});

// API health check endpoint (for mobile app)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Gaon Zaika API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint - API information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Gaon Zaika API',
    version: '1.0.0',
    description: 'Village Food Delivery API - Connecting rural restaurants with customers',
    status: 'Active',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: {
        url: '/health',
        method: 'GET',
        description: 'API health check'
      },
      auth: {
        url: '/api/auth',
        methods: ['POST'],
        description: 'Authentication endpoints for customers, vendors, delivery, and admin'
      },
      customers: {
        url: '/api/customers',
        methods: ['GET', 'PATCH'],
        description: 'Customer profile and preferences management'
      },
      restaurants: {
        url: '/api/restaurants',
        methods: ['GET'],
        description: 'Restaurant listings and menu information'
      },
      orders: {
        url: '/api/orders',
        methods: ['GET', 'POST', 'PATCH'],
        description: 'Order management and tracking'
      },
      vendors: {
        url: '/api/vendor',
        methods: ['GET', 'PATCH'],
        description: 'Vendor dashboard and restaurant management'
      },
      delivery: {
        url: '/api/delivery',
        methods: ['GET', 'PATCH'],
        description: 'Delivery person management and order assignment'
      },
      admin: {
        url: '/api/admin',
        methods: ['GET'],
        description: 'Admin dashboard and system management'
      },
      pushNotifications: {
        url: '/api/push-notifications',
        methods: ['POST'],
        description: 'Push notification management'
      },
      foods: {
        url: '/api/foods',
        methods: ['GET'],
        description: 'Food browsing by categories, search, and restaurant listings'
      }
    },
    documentation: 'This is a mobile app backend API. Use the Gaon Zaika mobile app to interact with the platform.',
    support: {
      email: 'gaonzaika@gmail.com',
      phone: '8182838680',
      whatsapp: '8182838680'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push-notifications', pushNotificationRoutes);
app.use('/api/foods', foodRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin if not exists
    const Admin = require('./models/Admin');
    await Admin.createDefaultAdmin();
    
    // Seed sample data for testing
    // if (process.env.NODE_ENV === 'development') {
    //   const seedData = require('./seedData');
    //   await seedData();
    // }
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Client joined order room: order_${orderId}`);
  });

  socket.on('join_vendor', (vendorId) => {
    socket.join(`vendor_${vendorId}`);
    console.log(`Vendor joined room: vendor_${vendorId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Gaon Zaika API server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
    console.log(`👤 Customer routes: http://localhost:${PORT}/api/customers`);

    // ─── Self-Ping: Render free tier ko neend se bachao ───
    // Production mein har 10 minute pe khud ko ping karta hai
    // Taaki Google Play reviewer ke time server awake rahe
    if (process.env.NODE_ENV === 'production') {
      const SELF_URL = process.env.RENDER_EXTERNAL_URL || 'https://gaonzaika.onrender.com';
      const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

      const selfPing = () => {
        const https = require('https');
        const http_module = require('http');
        const pingUrl = `${SELF_URL}/health`;

        const client = pingUrl.startsWith('https') ? https : http_module;

        const req = client.get(pingUrl, (res) => {
          console.log(`🏓 Self-ping OK — Status: ${res.statusCode} | ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
        });

        req.on('error', (err) => {
          console.error(`❌ Self-ping failed: ${err.message}`);
        });

        req.setTimeout(10000, () => {
          req.destroy();
          console.warn('⚠️  Self-ping timeout (10s)');
        });
      };

      // Pehla ping 1 minute baad (server warm-up ke liye wait)
      setTimeout(selfPing, 60 * 1000);

      // Uske baad har 10 minute pe
      setInterval(selfPing, PING_INTERVAL_MS);

      console.log(`🏓 Self-ping enabled → ${SELF_URL}/health (every 10 min)`);
    } else {
      console.log('ℹ️  Self-ping disabled (development mode)');
    }
    // ─────────────────────────────────────────────────────
  });
};

startServer();

module.exports = { app, server };