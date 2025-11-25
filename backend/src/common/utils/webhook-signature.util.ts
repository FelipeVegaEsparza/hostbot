import * as crypto from 'crypto';

/**
 * Validates WhatsApp Cloud API webhook signature
 * @param payload - The raw request body
 * @param signature - The signature from x-hub-signature-256 header
 * @param secret - The webhook verify token/secret
 * @returns True if signature is valid
 */
export function validateWhatsAppSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signature.split('sha256=')[1];
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(calculatedSignature),
  );
}

/**
 * Validates Flow payment webhook signature
 * @param payload - The raw request body
 * @param signature - The signature from header
 * @param secret - The Flow secret key
 * @returns True if signature is valid
 */
export function validateFlowSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature),
  );
}

/**
 * Validates PayPal webhook signature
 * @param payload - The webhook payload
 * @param headers - The request headers
 * @param webhookId - The PayPal webhook ID
 * @returns True if signature is valid (simplified version)
 */
export function validatePayPalSignature(
  payload: any,
  headers: any,
  webhookId: string,
): boolean {
  // Note: PayPal signature validation is more complex and requires
  // verifying against PayPal's certificate. This is a simplified version.
  // In production, use PayPal's SDK for proper validation.
  
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];

  // Basic validation - all required headers present
  return !!(
    transmissionId &&
    transmissionTime &&
    transmissionSig &&
    certUrl &&
    authAlgo &&
    webhookId
  );
}
