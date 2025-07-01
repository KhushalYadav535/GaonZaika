const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send OTP email
const sendOTP = async (email, otp, orderId) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Gaon Zaika - Order Delivery OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Gaon Zaika</h1>
            <p>Village Food Delivery</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Order Delivery OTP</h2>
            <p>Hello!</p>
            <p>Your order <strong>#${orderId}</strong> is out for delivery.</p>
            <p>Please provide this OTP to the delivery person to complete your order:</p>
            
            <div style="background-color: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this OTP with anyone except the delivery person</li>
              <li>The delivery person will ask for this OTP before handing over your order</li>
            </ul>
            
            <p>Thank you for choosing Gaon Zaika!</p>
          </div>
          
          <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
            <p>&copy; 2024 Gaon Zaika. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Send order confirmation email
const sendOrderConfirmation = async (email, orderData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Gaon Zaika - Order Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Gaon Zaika</h1>
            <p>Village Food Delivery</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Order Confirmed!</h2>
            <p>Hello ${orderData.customerInfo.name}!</p>
            <p>Your order has been successfully placed.</p>
            
            <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> #${orderData.orderId}</p>
              <p><strong>Restaurant:</strong> ${orderData.restaurantName}</p>
              <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
              <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
              <p><strong>Estimated Delivery:</strong> 30-45 minutes</p>
            </div>
            
            <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3>Order Items</h3>
              ${orderData.items.map(item => `
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee;">
                  <span>${item.name} x${item.quantity}</span>
                  <span>₹${item.price * item.quantity}</span>
                </div>
              `).join('')}
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-top: 2px solid #4CAF50; font-weight: bold;">
                <span>Total</span>
                <span>₹${orderData.totalAmount}</span>
              </div>
            </div>
            
            <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3>Delivery Information</h3>
              <p><strong>Name:</strong> ${orderData.customerInfo.name}</p>
              <p><strong>Phone:</strong> ${orderData.customerInfo.phone}</p>
              <p><strong>Address:</strong> ${orderData.customerInfo.address}</p>
            </div>
            
            <p>We'll notify you when your order is ready for delivery.</p>
            <p>Thank you for choosing Gaon Zaika!</p>
          </div>
          
          <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
            <p>&copy; 2024 Gaon Zaika. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

// Send order status update email
const sendOrderStatusUpdate = async (email, orderData, newStatus) => {
  try {
    const transporter = createTransporter();
    
    const statusMessages = {
      'Accepted': 'Your order has been accepted by the restaurant and is being prepared.',
      'Preparing': 'Your order is being prepared in the kitchen.',
      'Out for Delivery': 'Your order is out for delivery! You will receive an OTP shortly.',
      'Delivered': 'Your order has been delivered successfully. Enjoy your meal!'
    };
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Gaon Zaika - Order Status Update: ${newStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Gaon Zaika</h1>
            <p>Village Food Delivery</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Order Status Update</h2>
            <p>Hello ${orderData.customerInfo.name}!</p>
            
            <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3>Order #${orderData.orderId}</h3>
              <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">${newStatus}</span></p>
              <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
            </div>
            
            <p>Thank you for choosing Gaon Zaika!</p>
          </div>
          
          <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
            <p>&copy; 2024 Gaon Zaika. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Order status update email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return false;
  }
};

module.exports = {
  sendOTP,
  sendOrderConfirmation,
  sendOrderStatusUpdate
}; 