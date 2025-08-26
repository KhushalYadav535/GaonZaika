const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️ SENDGRID_API_KEY environment variable not set. Email service will use nodemailer only.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API key configured');
}

// Create nodemailer transporter as fallback
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'gaonzaika@gmail.com',
      pass: process.env.EMAIL_PASS || 'zxyfzrzpgzqkcqul',
    },
  });
};

// Send email using SendGrid (primary) with nodemailer fallback
const sendEmail = async (emailData) => {
  // Check if SendGrid API key is available
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ SendGrid API key not available, trying nodemailer only');
    // Try nodemailer directly
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully via nodemailer:', info.messageId);
      return true;
    } catch (nodemailerError) {
      console.error('Nodemailer failed:', nodemailerError.message);
      return false;
    }
  }

  try {
    // Try SendGrid first
    console.log('Attempting to send email via SendGrid...');
    await sgMail.send(emailData);
    console.log('Email sent successfully via SendGrid');
    return true;
  } catch (sendGridError) {
    console.error('SendGrid failed, trying nodemailer fallback:', sendGridError.message);
    
    // Only try nodemailer if SendGrid fails due to API issues, not rate limits
    if (sendGridError.response && sendGridError.response.statusCode === 429) {
      console.error('SendGrid rate limit exceeded, skipping nodemailer fallback');
      return false;
    }
    
    try {
      // Fallback to nodemailer
      const transporter = createTransporter();
      const mailOptions = {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully via nodemailer fallback:', info.messageId);
      return true;
    } catch (nodemailerError) {
      console.error('Both SendGrid and nodemailer failed:', nodemailerError.message);
      
      // Check if it's a Gmail rate limit error
      if (nodemailerError.code === 'EENVELOPE' && nodemailerError.responseCode === 550) {
        console.error('Gmail daily sending limit exceeded. Please try again tomorrow or use SendGrid.');
      }
      
      return false;
    }
  }
};

// Send OTP email
const sendOTP = async (email, otp, orderId) => {
  try {
    console.log('Sending OTP email...');
    
    const emailData = {
      from: 'gaonzaika@gmail.com', // Use your verified sender email
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
    
    return await sendEmail(emailData);
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Send order confirmation email
const sendOrderConfirmation = async (email, orderData) => {
  try {
    console.log('Sending order confirmation email...');
    
    const emailData = {
      from: 'gaonzaika@gmail.com', // Use your verified sender email
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
    
    return await sendEmail(emailData);
    
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

// Send order status update email
const sendOrderStatusUpdate = async (email, orderData, newStatus) => {
  try {
    console.log('Sending order status update email...');
    
    const statusMessages = {
      'Accepted': 'Your order has been accepted by the restaurant and is being prepared.',
      'Preparing': 'Your order is being prepared in the kitchen.',
      'Out for Delivery': 'Your order is out for delivery! You will receive an OTP shortly.',
      'Delivered': 'Your order has been delivered successfully. Enjoy your meal!'
    };
    
    const emailData = {
      from: 'gaonzaika@gmail.com', // Use your verified sender email
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
    
    return await sendEmail(emailData);
    
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return false;
  }
};

// Send email verification OTP
const sendVerificationOTP = async (email, otp) => {
  try {
    console.log('Sending verification OTP email...');
    
    const emailData = {
      from: 'gaonzaika@gmail.com', // Use your verified sender email
      to: email,
      subject: 'Gaon Zaika - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Gaon Zaika</h1>
            <p>Village Food Delivery</p>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Email Verification OTP</h2>
            <p>Hello!</p>
            <p>Your email verification OTP is:</p>
            <div style="background-color: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            <p>This OTP is valid for 10 minutes. Please enter it in the app to verify your email address.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Thank you for choosing Gaon Zaika!</p>
          </div>
          <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
            <p>&copy; 2024 Gaon Zaika. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    return await sendEmail(emailData);
    
  } catch (error) {
    console.error('Error sending verification OTP email:', error);
    return false;
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (email, otp) => {
  try {
    console.log('Sending password reset OTP email...');
    
    const emailData = {
      from: 'gaonzaika@gmail.com', // Use your verified sender email
      to: email,
      subject: 'Gaon Zaika - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Gaon Zaika</h1>
            <p>Village Food Delivery</p>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Password Reset OTP</h2>
            <p>Hello!</p>
            <p>You requested to reset your password. Your OTP is:</p>
            <div style="background-color: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            <p>This OTP is valid for 10 minutes. Please enter it in the app to reset your password.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Thank you for choosing Gaon Zaika!</p>
          </div>
          <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
            <p>&copy; 2024 Gaon Zaika. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    return await sendEmail(emailData);
    
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    return false;
  }
};

module.exports = {
  sendOTP,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendVerificationOTP,
  sendPasswordResetOTP
}; 