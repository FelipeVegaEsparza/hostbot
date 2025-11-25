/**
 * Queue names constants
 * Separated to avoid circular dependencies
 */

export const QUEUE_NAMES = {
  INCOMING_MESSAGES: 'incoming-messages',
  OUTGOING_MESSAGES: 'outgoing-messages',
  AI_PROCESSING: 'ai-processing',
  WHATSAPP_CLOUD_SEND: 'whatsapp-cloud-send',
  WHATSAPP_QR_SEND: 'whatsapp-qr-send',
  WEBHOOK_DELIVERY: 'webhook-delivery',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
