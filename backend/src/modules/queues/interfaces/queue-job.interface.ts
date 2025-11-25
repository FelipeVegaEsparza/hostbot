// Common interfaces for queue jobs

export interface IncomingMessageJob {
  conversationId: string;
  chatbotId: string;
  externalUserId: string;
  content: string;
  channel: 'WIDGET' | 'WHATSAPP_CLOUD' | 'WHATSAPP_QR';
  metadata?: Record<string, any>;
}

export interface AIProcessingJob {
  conversationId: string;
  chatbotId: string;
  messageId: string;
  prompt: string;
  context: string[];
  systemPrompt?: string;
  aiProvider: string;
  aiModel: string;
  aiConfig: Record<string, any>;
  knowledgeBaseId?: string;
}

export interface OutgoingMessageJob {
  conversationId: string;
  messageId: string;
  externalUserId: string;
  content: string;
  channel: 'WIDGET' | 'WHATSAPP_CLOUD' | 'WHATSAPP_QR';
  chatbotId: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppCloudSendJob {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  message: string;
  messageId: string;
  conversationId: string;
}

export interface WhatsAppQRSendJob {
  sessionId: string;
  to: string;
  message: string;
  messageId: string;
  conversationId: string;
}

export interface WebhookDeliveryJob {
  url: string;
  event: string;
  payload: Record<string, any>;
  webhookEventId: string;
}
