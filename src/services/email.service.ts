import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error: Error | null, success: boolean) => {
  if (error) {
    console.error('❌ Email server error:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('✅ Email server is ready!');
  }
});

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<void> => {
  console.log('📨 sendEmail called for:', to);
  try {
    const info: SentMessageInfo = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('✅ Email sent! MessageId:', info.messageId);
  } catch (error) {
    console.error('❌ sendMail error:', error);
  }
};

async function sendRegistrationEmail(
  userEmail: string,
  name: string
): Promise<void> {

  console.log('📧 sendRegistrationEmail called for:', userEmail);
  
  const subject = 'Welcome to Backend Ledger!';
  const text = `Hello ${name},\n\nThank you for registering!`;
  const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger!</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(
  userEmail: string,
  name: string,
  amount: number,
  toAccount: string
): Promise<void> {
  const subject = 'Transaction Successful!';
  
  const text = `Hello ${name},

Your transaction of ₹${amount} to account ${toAccount} was successful.

Best regards,
The Backend Ledger Team`;

  const html = `
    <p>Hello ${name},</p>
    <p>Your transaction of <strong>₹${amount}</strong> to account <strong>${toAccount}</strong> was successful.</p>
    <p>Best regards,<br/>The Backend Ledger Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(
  userEmail: string,
  name: string,
  amount: number,
  toAccount: string
): Promise<void> {
  const subject = 'Transaction Failed';

  const text = `Hello ${name},

Your transaction of ₹${amount} to account ${toAccount} has failed.

Please try again or contact support if the issue persists.

Best regards,
The Backend Ledger Team`;

  const html = `
    <p>Hello ${name},</p>
    <p>Your transaction of <strong>₹${amount}</strong> to account <strong>${toAccount}</strong> has <span style="color:red;">failed</span>.</p>
    <p>Please try again or contact support if the issue persists.</p>
    <p>Best regards,<br/>The Backend Ledger Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}
const emailService = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
};

export default emailService;