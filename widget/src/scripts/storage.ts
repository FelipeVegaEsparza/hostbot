/**
 * Storage Manager for Widget
 * Handles localStorage operations for conversation persistence
 */

export class StorageManager {
  private storageKey: string;

  constructor(botId: string) {
    this.storageKey = `chatbot_conversation_${botId}`;
  }

  getConversationId(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.error('Failed to get conversation ID from localStorage:', error);
      return null;
    }
  }

  setConversationId(conversationId: string): void {
    try {
      localStorage.setItem(this.storageKey, conversationId);
    } catch (error) {
      console.error('Failed to set conversation ID in localStorage:', error);
    }
  }

  clearConversationId(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear conversation ID from localStorage:', error);
    }
  }
}
