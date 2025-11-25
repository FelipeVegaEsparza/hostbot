// Message handler for processing incoming WhatsApp messages

import { WAMessage, proto } from '@whiskeysockets/baileys';
import { eventNotifier } from './events';
import { logger } from './logger';

export class MessageHandler {
  /**
   * Process incoming WhatsApp message
   */
  async handleIncomingMessage(
    sessionId: string,
    message: WAMessage
  ): Promise<void> {
    try {
      // Extract message details
      const messageKey = message.key;
      const messageContent = message.message;

      if (!messageKey || !messageContent) {
        logger.debug('Skipping message without key or content');
        return;
      }

      // Skip messages from self
      if (messageKey.fromMe) {
        logger.debug('Skipping message from self');
        return;
      }

      // Extract sender
      const from = messageKey.remoteJid;
      if (!from) {
        logger.debug('Skipping message without sender');
        return;
      }

      // Extract text content
      const text = this.extractTextFromMessage(messageContent);
      if (!text) {
        logger.debug('Skipping message without text content');
        return;
      }

      // Extract message ID and timestamp
      const messageId = messageKey.id || '';
      const timestamp = message.messageTimestamp
        ? typeof message.messageTimestamp === 'number'
          ? message.messageTimestamp
          : parseInt(message.messageTimestamp.toString())
        : Date.now();

      logger.info('Processing incoming message', {
        sessionId,
        from,
        messageId,
        textLength: text.length,
      });

      // Send to backend
      await eventNotifier.sendIncomingMessage(
        sessionId,
        from,
        text,
        messageId,
        timestamp
      );
    } catch (error) {
      logger.error('Error handling incoming message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
    }
  }

  /**
   * Extract text content from WhatsApp message
   */
  private extractTextFromMessage(
    messageContent: proto.IMessage
  ): string | null {
    // Text message
    if (messageContent.conversation) {
      return messageContent.conversation;
    }

    // Extended text message
    if (messageContent.extendedTextMessage?.text) {
      return messageContent.extendedTextMessage.text;
    }

    // Image with caption
    if (messageContent.imageMessage?.caption) {
      return messageContent.imageMessage.caption;
    }

    // Video with caption
    if (messageContent.videoMessage?.caption) {
      return messageContent.videoMessage.caption;
    }

    // Document with caption
    if (messageContent.documentMessage?.caption) {
      return messageContent.documentMessage.caption;
    }

    return null;
  }
}

export const messageHandler = new MessageHandler();
