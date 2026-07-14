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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;">
          <!-- Outer wrapper -->
          <div style="width: 100%; background-color: #f3f4f6; padding: 20px 0;">
            <!-- Email container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header with gradient -->
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CryptoVoice</h1>
                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Secure Access Verification</p>
              </div>

              <!-- Main content -->
              <div style="padding: 40px 30px;">
                
                <!-- Greeting -->
                <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  Hello,
                </p>

                <!-- Message -->
                <p style="margin: 0 0 8px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                  ${type === 'Password Reset' 
                    ? 'We received a request to reset your CryptoVoice account password. Your verification code is below:' 
                    : 'Welcome! To verify your email and complete your CryptoVoice account setup, please use the verification code below:'}
                </p>

                <!-- OTP Code Box -->
                <div style="margin: 32px 0; text-align: center;">
                  <div style="display: inline-block; background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 24px 32px;">
                    <p style="margin: 0 0 12px 0; color: #78350f; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                    <p style="margin: 0; color: #f59e0b; font-size: 48px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                  </div>
                </div>

                <!-- Expiration notice -->
                <div style="margin: 24px 0; padding: 12px 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                    <strong>This code will expire in ${timeExpiry}</strong>
                  </p>
                </div>

                <!-- Additional info -->
                <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Never share this code with anyone. CryptoVoice staff will never ask you for this code.
                </p>

                <!-- Security info -->
                <div style="margin: 24px 0 0 0; padding: 16px; background-color: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
                  <p style="margin: 0; color: #166534; font-size: 13px; line-height: 1.6;">
                    <strong>Didn't request this code?</strong> If you didn't request this verification, you can safely ignore this email. Your account remains secure.
                  </p>
                </div>

              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                  Need help? Contact our support team at support@cryptovoice.com
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                  © ${new Date().getFullYear()} CryptoVoice. All rights reserved.
                </p>
              </div>

            </div>
          </div>
        </body>
        </html>
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
