/**
 * API Client for Widget
 * Handles communication with the backend API
 */

export interface SendMessageRequest {
  botId: string;
  conversationId?: string;
  message: string;
}

export interface SendMessageResponse {
  conversationId: string;
  messageId: string;
  status: string;
}

export interface WidgetConfig {
  botId: string;
  name: string;
  welcomeMessage?: string;
  placeholder?: string;
  theme?: string;
  primaryColor?: string;
}

export class APIClient {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await fetch(`${this.apiUrl}/widget/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  async getConfig(botId: string): Promise<WidgetConfig> {
    const response = await fetch(`${this.apiUrl}/widget/config/${botId}`);

    if (!response.ok) {
      throw new Error(`Failed to get config: ${response.statusText}`);
    }

    return response.json();
  }
}
