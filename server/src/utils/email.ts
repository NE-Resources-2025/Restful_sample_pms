import nodemailer, { Transporter } from 'nodemailer';

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
      from: process.env.SMTP_EMAIL,
      to,
      subject: 'Parking Slot Request Approved',
      text: `Your request has been approved. Assigned slot: ${slotNumber}`,
    });
    return 'sent';
  } catch (error) {
    console.error('Email error:', error);
    return 'failed';
  }
};

export const sendRejectionEmail = async (to: string, reason: string): Promise<string> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to,
      subject: 'Parking Slot Request Rejected',
      text: `Your request was rejected. Reason: ${reason}`,
    });
    return 'sent';
  } catch (error) {
    console.error('Email error:', error);
    return 'failed';
  }
};

export const sendOtpEmail = async (to: string, otp: string): Promise<string> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
    });
    return 'sent';
  } catch (error) {
    console.error('Email error:', error);
    return 'failed';
  }
};