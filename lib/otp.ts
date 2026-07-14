import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string, type: string = 'Verification'): Promise<boolean> {
  try {
    const subject = type === 'Password Reset' 
      ? 'Reset Your Binance Work Password' 
      : 'Your Binance Work OTP Code';
    
    const message = type === 'Password Reset'
      ? 'Your password reset code is:'
      : 'Your OTP code is:';

    const timeExpiry = type === 'Password Reset'
      ? '1 hour'
      : '10 minutes';

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Binance Work</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              ${type === 'Password Reset' ? 'Password Reset Request' : 'Email Verification'}
            </p>
            <p style="color: #1f2937; font-size: 14px; margin-bottom: 10px;">${message}</p>
            <h1 style="color: #f59e0b; letter-spacing: 3px; font-size: 32px; font-weight: bold; margin: 30px 0;">${otp}</h1>
            <p style="color: #999; font-size: 13px; margin-bottom: 20px;">This code will expire in ${timeExpiry}.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email or contact support.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}
