import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { formatAppointmentDate } from '@/lib/utils';

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
      insurancePlan,
      estimatedCost,
      providerAddress,
      providerPhone
    } = await request.json();

    // Format the date for better readability - avoid timezone shifts
    const formattedDate = formatAppointmentDate(appointmentDate);

    // Use the provided time and period
    const formattedTime = `${appointmentTime} ${appointmentPeriod}`;

    // Format currency if estimated cost is provided
    const formattedCost = estimatedCost ? `₹${estimatedCost.toLocaleString()}` : 'To be confirmed';

    // Create appointment reference ID (first 8 chars of the ID)
    const appointmentRefId = appointmentId.slice(0, 8).toUpperCase();

    // Create email HTML template
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4a90e2;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .appointment-details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          margin-bottom: 10px;
        }
        .detail-label {
          font-weight: bold;
          width: 120px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #777;
        }
        .button {
          display: inline-block;
          background-color: #4a90e2;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        }
          a {
          color:white;
          }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Appointment Confirmation</h1>
      </div>
      <div class="content">
        <p>Dear ${patientName},</p>
        <p>Your appointment has been successfully scheduled. Here are the details:</p>
        
        <div class="appointment-details">
          <div class="detail-row">
            <div class="detail-label">Reference ID:</div>
            <div>${appointmentRefId}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Provider:</div>
            <div>${providerName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Service:</div>
            <div>${serviceName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date:</div>
            <div>${formattedDate}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Time:</div>
            <div>${formattedTime}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div>${providerAddress}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Phone:</div>
            <div>${providerPhone}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Insurance:</div>
            <div>${insurancePlan || 'Self Pay'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Estimated Cost:</div>
            <div style="color: #2e7d32; font-weight: bold;">${formattedCost}</div>
          </div>
        </div>
        
        <p>Please arrive 15 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        
        <p>Thank you for choosing our services!</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://priceai.com'}/appointments" class="button">View Appointment</a>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} PriceAI. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;

    // Email sending options
    const mailOptions = {
      from: `"PriceAI Healthcare" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: `Appointment Confirmed - ${providerName} on ${formattedDate}`,
      html: emailHtml,
      text: `
        Dear ${patientName},
        
        Your appointment has been successfully scheduled. Here are the details:
        
        Reference ID: ${appointmentRefId}
        Provider: ${providerName}
        Service: ${serviceName}
        Date: ${formattedDate}
        Time: ${formattedTime}
        Location: ${providerAddress}
        Phone: ${providerPhone}
        
        Please arrive 15 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us at least 24 hours in advance.
        
        Thank you for choosing our services!
        
        This is an automated message. Please do not reply to this email.
        
        © ${new Date().getFullYear()} PriceAI. All rights reserved.
      `,
    };

    // Log the email attempt
    //console.log('📧 Sending appointment confirmation email to:', patientEmail);

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    //console.log('📧 Email sent successfully:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment confirmation sent successfully',
      data: { 
        id: info.messageId,
        to: patientEmail,
        status: 'sent'
      }
    });
  } catch (error) {
    console.error('Error sending appointment email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}
