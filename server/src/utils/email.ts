import nodemailer, { Transporter } from 'nodemailer';

// Validate environment variables
if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
  throw new Error('Missing SMTP configuration in environment variables');
}

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendApprovalEmail = async (to: string, slotNumber: string): Promise<string> => {
  try {
    await transporter.sendMail({
      from: `"Parking System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: 'Parking Slot Request Approved',
      text: `Your request has been approved. Assigned slot: ${slotNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Slot Request Approved</h2>
          <p>Your parking slot request has been approved!</p>
          <p><strong>Slot Number:</strong> ${slotNumber}</p>
          <p style="color: #666;">Thank you for using our parking system.</p>
        </div>
      `,
    });
    console.log(`Approval email sent to ${to} for slot ${slotNumber}`);
    return 'sent';
  } catch (error) {
    console.error(`Failed to send approval email to ${to}:`, error);
    return 'failed';
  }
};

export const sendRejectionEmail = async (to: string, reason: string): Promise<string> => {
  try {
    await transporter.sendMail({
      from: `"Parking System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: 'Parking Slot Request Rejected',
      text: `Your request was rejected. Reason: ${reason}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Slot Request Rejected</h2>
          <p>Your parking slot request has been rejected.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p style="color: #666;">Please contact support if you have any questions.</p>
        </div>
      `,
    });
    console.log(`Rejection email sent to ${to} with reason: ${reason}`);
    return 'sent';
  } catch (error) {
    console.error(`Failed to send rejection email to ${to}:`, error);
    return 'failed';
  }
};

export const sendOtpEmail = async (to: string, otp: string): Promise<string> => {
  try {
    await transporter.sendMail({
      from: `"Parking System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Your OTP code is <strong>${otp}</strong>.</p>
          <p>It expires in 10 minutes.</p>
          <p style="color: #666;">Thank you for using our parking system.</p>
        </div>
      `,
    });
    console.log(`OTP email sent to ${to}`);
    return 'sent';
  } catch (error) {
    console.error(`Failed to send OTP email to ${to}:`, error);
    return 'failed';
  }
};