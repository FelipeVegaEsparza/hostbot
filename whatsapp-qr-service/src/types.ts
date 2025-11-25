// Type definitions for WhatsApp QR Service

export interface SessionConfig {
  sessionId: string;
  chatbotId?: string;
}

export interface QRCodeData {
  sessionId: string;
  qrCode: string; // Data URL
  status: SessionStatus;
}

export enum SessionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  QR_READY = 'QR_READY',
  CONNECTED = 'CONNECTED',
}

export interface SessionInfo {
  sessionId: string;
  status: SessionStatus;
  qrCode?: string;
  lastConnectedAt?: Date;
  phoneNumber?: string;
}

export interface SendMessageRequest {
  sessionId: string;
  to: string; // Phone number with country code
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BackendNotification {
  type: 'qr' | 'connected' | 'disconnected' | 'message';
  sessionId: string;
  data: any;
}

export interface IncomingMessage {
  sessionId: string;
  from: string;
  message: string;
  timestamp: number;
  messageId: string;
}
