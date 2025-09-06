// Email service for sending notifications to users
// This uses Resend API for email delivery

export const emailService = {
  // Send order confirmation email to user
  sendOrderConfirmationEmail: async (orderData) => {
    try {
      // In a real application, you would use an email service like Resend, SendGrid, or similar
      // For now, this is a mock implementation that logs the email content
      
      const emailContent = emailService.generateOrderConfirmationEmail(orderData)
      
      // Mock email sending - replace with actual email service
      console.log('📧 Email would be sent:')
      console.log('To:', orderData.senderEmail || orderData.senderPhone)
      console.log('Subject:', emailContent.subject)
      console.log('Content:', emailContent.html)
      
      // Simulate API call to email service
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, messageId: `msg_${Date.now()}` })
        }, 1000)
      })
      
      // Real implementation would look like this:
      /*
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TrackFlow <orders@trackflow.co.ke>',
          to: [orderData.senderEmail],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, messageId: result.id }
      } else {
        throw new Error('Failed to send email')
      }
      */
      
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message }
    }
  },

  // Generate HTML email template for order confirmation
  generateOrderConfirmationEmail: (orderData) => {
    const serviceNames = {
      'express_delivery': 'Express Delivery',
      'cold_chain': 'Cold Chain Logistics',
      'international_shipping': 'International Shipping'
    }
    
    const serviceName = serviceNames[orderData.service_type] || 'Special Delivery'
    
    const subject = `🚚 TrackFlow ${serviceName} - Order Confirmation ${orderData.order_number}`
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TrackFlow Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #374151 0%, #1f2937 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .order-info { background-color: #f8fafc; border-left: 4px solid #374151; padding: 20px; margin: 20px 0; }
        .order-info h3 { margin-top: 0; color: #374151; }
        .order-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .detail-item { }
        .detail-label { font-weight: bold; color: #374151; }
        .detail-value { color: #666; }
        .next-steps { background-color: #e8f5e8; border: 1px solid #4ade80; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .next-steps h3 { color: #15803d; margin-top: 0; }
        .office-info { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .office-info h4 { color: #d97706; margin-top: 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #374151 0%, #1f2937 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .urgent { background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .urgent h4 { color: #dc2626; margin-top: 0; }
        @media (max-width: 600px) {
            .order-details { grid-template-columns: 1fr; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🚚 TrackFlow</h1>
            <p>Order Confirmation & Next Steps</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <h2>Thank you for choosing TrackFlow!</h2>
            <p>Your ${serviceName} order has been successfully created. Please review the details below and follow the next steps to complete your shipment.</p>
            
            <!-- Order Information -->
            <div class="order-info">
                <h3>📋 Order Details</h3>
                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">Order Number:</div>
                        <div class="detail-value">${orderData.order_number}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Service Type:</div>
                        <div class="detail-value">${serviceName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Pickup Date:</div>
                        <div class="detail-value">${new Date(orderData.pickup_date).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Total Cost:</div>
                        <div class="detail-value">KSh ${orderData.total_cost}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Sender:</div>
                        <div class="detail-value">${orderData.sender_name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Recipient:</div>
                        <div class="detail-value">${orderData.recipient_name}</div>
                    </div>
                </div>
            </div>
            
            <!-- Urgent Notice -->
            <div class="urgent">
                <h4>⚠️ IMPORTANT: Bring Your Parcel to Our Office</h4>
                <p><strong>You must bring your parcel to our TrackFlow office before the pickup date.</strong> This allows us to properly prepare, weigh, and package your shipment according to ${serviceName} standards.</p>
            </div>
            
            <!-- Next Steps -->
            <div class="next-steps">
                <h3>📝 Next Steps</h3>
                <ol>
                    <li><strong>Prepare your parcel:</strong> Ensure it matches the description provided (${orderData.product_description})</li>
                    <li><strong>Visit our office:</strong> Bring your parcel and this order confirmation</li>
                    <li><strong>Payment:</strong> Complete payment of KSh ${orderData.total_cost}</li>
                    <li><strong>We handle the rest:</strong> We'll pick up from your location as scheduled</li>
                </ol>
            </div>
            
            <!-- Office Information -->
            <div class="office-info">
                <h4>🏢 TrackFlow Office Location</h4>
                <p><strong>Address:</strong> TrackFlow Logistics Center<br>
                Mombasa Road, Industrial Area<br>
                Nairobi, Kenya</p>
                
                <p><strong>Office Hours:</strong><br>
                Monday - Friday: 8:00 AM - 6:00 PM<br>
                Saturday: 9:00 AM - 4:00 PM<br>
                Sunday: Closed</p>
                
                <p><strong>Contact:</strong><br>
                Phone: +254 700 123 456<br>
                Email: office@trackflow.co.ke</p>
                
                <p><strong>What to Bring:</strong></p>
                <ul>
                    <li>Your parcel (properly packaged)</li>
                    <li>This order confirmation (print or mobile)</li>
                    <li>Valid ID</li>
                    <li>Payment for KSh ${orderData.total_cost}</li>
                </ul>
            </div>
            
            ${orderData.service_type === 'cold_chain' && orderData.temperature_controlled ? `
            <div class="urgent">
                <h4>❄️ Cold Chain Special Requirements</h4>
                <p><strong>Temperature-sensitive items:</strong> Your parcel requires temperature control (${orderData.temperature_range || 'as specified'}). Please bring it to our office as soon as possible to maintain the cold chain.</p>
            </div>
            ` : ''}
            
            <!-- Product Details -->
            <div class="order-info">
                <h3>📦 Product Information</h3>
                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">Description:</div>
                        <div class="detail-value">${orderData.product_description}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Type:</div>
                        <div class="detail-value">${orderData.product_type}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Weight:</div>
                        <div class="detail-value">${orderData.weight_kg} kg</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Fragility:</div>
                        <div class="detail-value">${orderData.fragility_level}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Distance:</div>
                        <div class="detail-value">${orderData.distance_km} km</div>
                    </div>
                    ${orderData.preferred_time ? `
                    <div class="detail-item">
                        <div class="detail-label">Preferred Time:</div>
                        <div class="detail-value">${orderData.preferred_time}</div>
                    </div>
                    ` : ''}
                </div>
                ${orderData.special_instructions ? `
                <p><strong>Special Instructions:</strong> ${orderData.special_instructions}</p>
                ` : ''}
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
                <p>Questions about your order?</p>
                <a href="tel:+254700123456" class="button">📞 Call Us Now</a>
                <a href="mailto:office@trackflow.co.ke" class="button">✉️ Email Support</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>TrackFlow Logistics</strong><br>
            Reliable • Fast • Secure</p>
            <p>This email was sent regarding order ${orderData.order_number}. Please save this email for your records.</p>
            <p>© 2025 TrackFlow. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
    
    return { subject, html }
  },

  // Send SMS notification (backup communication)
  sendSMSNotification: async (phone, orderNumber, serviceName) => {
    try {
      // Mock SMS sending - replace with actual SMS service like Twilio
      const message = `TrackFlow: Your ${serviceName} order ${orderNumber} is confirmed! Please bring your parcel to our office at Mombasa Road, Industrial Area. Office hours: Mon-Fri 8AM-6PM. Call +254 700 123 456 for directions.`
      
      console.log('📱 SMS would be sent:')
      console.log('To:', phone)
      console.log('Message:', message)
      
      return { success: true, messageId: `sms_${Date.now()}` }
    } catch (error) {
      console.error('Error sending SMS:', error)
      return { success: false, error: error.message }
    }
  }
}
