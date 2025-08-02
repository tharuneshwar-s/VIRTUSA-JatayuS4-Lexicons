import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const {
      appointmentId,
      patientEmail,
      patientName,
      providerName,
      serviceName,
      appointmentDate,
      appointmentTime,
      appointmentPeriod,
      providerAddress,
      providerPhone
    } = await request.json();

    // Format the date for better readability
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Use the provided time and period
    const formattedTime = `${appointmentTime} ${appointmentPeriod}`;

    // Create appointment reference ID (first 8 chars of the ID)
    const appointmentRefId = appointmentId.slice(0, 8).toUpperCase();

    // Create cancellation email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Appointment Cancellation - PriceAI Healthcare</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .status-banner {
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .status-banner h2 {
      color: #dc2626;
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
    }
    .status-banner p {
      color: #7f1d1d;
      margin: 0;
      font-size: 16px;
    }
    .details-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 25px;
      margin: 20px 0;
    }
    .details-section h3 {
      color: #1e293b;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }
    .detail-row {
      display: flex;
      margin-bottom: 12px;
      align-items: flex-start;
    }
    .detail-label {
      font-weight: 600;
      color: #475569;
      min-width: 140px;
      margin-right: 15px;
    }
    .detail-value {
      color: #1e293b;
      flex: 1;
    }
    .contact-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .contact-info h3 {
      color: #1e40af;
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .action-buttons {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 30px;
      margin: 0 10px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    .btn-primary:hover {
      background: #2563eb;
    }
    .footer {
      background: #f1f5f9;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 5px 0;
      color: #64748b;
      font-size: 14px;
    }
    .footer .brand {
      font-weight: 600;
      color: #1e293b;
      font-size: 16px;
    }
    .reference-id {
      background: #f1f5f9;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #374151;
      text-align: center;
      margin: 15px 0;
    }
    @media (max-width: 600px) {
      .container {
        margin: 10px;
        border-radius: 8px;
      }
      .header, .content {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-label {
        min-width: auto;
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🚫 Appointment Cancelled</h1>
      <p>Your healthcare appointment has been successfully cancelled</p>
    </div>

    <!-- Content -->
    <div class="content">
   
      <!-- Patient Information -->
      <div class="details-section">
        <h3>👤 Patient Information</h3>
        <div class="detail-row">
          <span class="detail-label">Patient Name:</span>
          <span class="detail-value">${patientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${patientEmail}</span>
        </div>
      </div>

      <!-- Cancelled Appointment Details -->
      <div class="details-section">
        <h3>📋 Cancelled Appointment Details</h3>
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value">${serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Provider:</span>
          <span class="detail-value">${providerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${formattedTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${providerAddress}</span>
        </div>
        ${providerPhone ? `
        <div class="detail-row">
          <span class="detail-label">Provider Phone:</span>
          <span class="detail-value">${providerPhone}</span>
        </div>
        ` : ''}
      </div>

      <!-- Reference ID -->
      <div class="reference-id">
        Appointment Reference: ${appointmentRefId}
      </div>


      <!-- Action Buttons -->
      <div class="action-buttons">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://priceai.healthcare'}" class="btn btn-primary">
          Book New Appointment
        </a>
      </div>

      <!-- Important Information -->
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Information</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Your appointment has been cancelled and you will not be charged for this appointment.</li>
          <li>If you had a confirmed appointment, the time slot is now available for other patients.</li>
          <li>Please save this email for your records.</li>
          <li>If you need to reschedule, we recommend booking as soon as possible for your preferred time.</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="brand">PriceAI Healthcare Platform</p>
      <p>Making healthcare pricing transparent and accessible</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>If you have questions, please contact the healthcare provider directly.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Email options
    const mailOptions = {
      from: `"PriceAI Healthcare" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: `Appointment Cancelled - ${providerName} | Ref: ${appointmentRefId}`,
      html: emailHtml,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Cancellation email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send cancellation email' },
      { status: 500 }
    );
  }
}
