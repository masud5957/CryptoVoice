import QRCode from 'qrcode';

export const BEP20_ADDRESS = process.env.HOT_WALLET_ADDRESS || '';
export const HD_WALLET_ADDRESS = process.env.HD_WALLET_ADDRESS || '';

export async function generateQRCode(text: string): Promise<string> {
  try {
    const qrCode = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidBEP20Address(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
