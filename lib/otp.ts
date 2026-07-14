import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string, type: string = 'Verification'): Promise<boolean> {
  try {
    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('[v0] RESEND_API_KEY is not set');
      return false;
    }

    // Check if sender email is configured
    const senderEmail = process.env.SENDER_EMAIL || 'noreply@cryptovoice.app';
    console.log('[v0] Using sender email:', senderEmail);

    const subject = type === 'Password Reset' 
      ? 'Reset Your CryptoVoice Password' 
      : 'Your CryptoVoice OTP Code';
    
    const message = type === 'Password Reset'
      ? 'Your password reset code is:'
      : 'Your OTP code is:';

    const timeExpiry = type === 'Password Reset'
      ? '1 hour'
      : '10 minutes';

    console.log('[v0] Sending OTP email to:', email);

    const response = await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">CryptoVoice</h2>
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

    console.log('[v0] Email sent response:', response);

    if (response.error) {
      console.error('[v0] Resend API error:', response.error);
      return false;
    }

    console.log('[v0] OTP email sent successfully, ID:', response.data?.id);
    return true;
  } catch (error) {
    console.error('[v0] Error sending OTP email:', error);
    return false;
  }
}
