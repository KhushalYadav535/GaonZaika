# Gaon Zaika - Food Delivery App

A comprehensive food delivery application built with React Native (Expo) and Node.js, designed for village-level users with support for multiple roles.

## Project Structure

```
gaon-zaika/
├── frontend/          # React Native (Expo) application
│   ├── screens/       # All app screens organized by role
│   ├── navigation/    # Navigation configuration
│   ├── services/      # API services and utilities
│   ├── App.js         # Main app component
│   ├── package.json   # Frontend dependencies
│   ├── app.json       # Expo configuration
│   └── babel.config.js
└── backend/           # Node.js Express API server
    ├── models/        # MongoDB models
    ├── routes/        # API routes
    ├── utils/         # Utility functions
    ├── server.js      # Main server file
    ├── package.json   # Backend dependencies
    └── env.example    # Environment variables template
```

## Features

### Customer Features
- Browse restaurants and menus
- Add items to cart
- Place orders with delivery details
- Track order status
- View order history

### Vendor Features
- PIN-based login (Demo: 1234)
- View restaurant orders
- Accept/reject orders
- Manage menu items
- Update order status

### Delivery Person Features
- PIN-based login (Demo: 5678)
- View assigned orders
- Customer details and delivery address
- OTP verification for delivery completion

### Admin Features
- PIN-based login (Demo: 9999)
- Manage restaurants and vendors
- View all orders and users
- Add/edit/delete restaurants and menu items

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- MongoDB (local or Atlas)

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

## Demo PINs
- **Vendor**: 1234
- **Delivery**: 5678
- **Admin**: 9999

## Technology Stack

### Frontend
- React Native with Expo
- React Navigation
- Axios for API calls
- React Native Paper for UI components

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services
- Cloudinary for image uploads

## Development Notes

- The app uses mock data for development when backend is not available
- All PINs are static for demo purposes
- UI is optimized for low-end Android devices
- Supports offline functionality with mock data
- Role-based navigation with separate stacks for each user type

## Deployment

### Frontend
- Deploy to Expo or build standalone APK
- Configure API endpoints for production

### Backend
- Deploy to Render, Railway, or any Node.js hosting
- Set up MongoDB Atlas for database
- Configure environment variables

## License

MIT License 