import { Injectable, Scope } from '@nestjs/common';
import { CustomLogger } from './custom-logger.service';

export type MessageStage =
  | 'received'
  | 'queued'
  | 'processing'
  | 'ai_response'
  | 'sending'
  | 'sent'
  | 'failed';

export interface MessageLogEntry {
  timestamp: Date;
  messageId: string;
  conversationId: string;
  channel: string;
  stage: MessageStage;
  details: Record<string, any>;
  error?: string;
}

@Injectable({ scope: Scope.DEFAULT })
export class MessageLogger {
  private readonly logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger();
    this.logger.setContext('MessageLogger');
  }

  /**
   * Log when a message is received from a channel
   */
  logMessageReceived(
    messageId: string,
    conversationId: string,
    channel: string,
    content: string,
    externalUserId: string,
  ): void {
    const entry: MessageLogEntry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel,
      stage: 'received',
      details: {
        externalUserId,
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
      },
    };

    this.logger.logWithMeta('info', `Message received from ${channel}`, entry);
  }

  /**
   * Log when a message is queued for processing
   */
  logMessageQueued(
    messageId: string,
    conversationId: string,
    queueName: string,
    jobId: string | number,
  ): void {
    const entry: MessageLogEntry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel: 'N/A',
      stage: 'queued',
      details: {
        queueName,
        jobId: String(jobId),
      },
    };

    this.logger.logWithMeta('info', `Message queued in ${queueName}`, entry);
  }

  /**
   * Log when AI processing starts
   */
  logAIProcessing(
    messageId: string,
    conversationId: string,
    provider: string,
    model: string,
    promptLength: number,
  ): void {
    const entry: MessageLogEntry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel: 'N/A',
      stage: 'processing',
      details: {
        provider,
        model,
        promptLength,
      },
    };

    this.logger.logWithMeta('info', `AI processing started with ${provider}/${model}`, entry);
  }

  /**
   * Log when AI response is received
   */
  logAIResponse(
    messageId: string,
    conversationId: string,
    provider: string,
    model: string,
    tokensUsed: number,
    responseLength: number,
    processingTimeMs: number,
  ): void {
    const entry: MessageLogEntry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel: 'N/A',
      stage: 'ai_response',
      details: {
        provider,
        model,
        tokensUsed,
        responseLength,
        processingTimeMs,
      },
    };

    this.logger.logWithMeta(
      'info',
      `AI response received (${tokensUsed} tokens, ${processingTimeMs}ms)`,
      entry,
    );
  }

  /**
   * Log when a message is being sent to a channel
   */
  logMessageSending(
    messageId: string,
    conversationId: string,
    channel: string,
    destination: string,
  ): void {
    const entry: MessageLogEntry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel,
      stage: 'sending',
      details: {
        destination,
      },
    };

    this.logger.logWithMeta('info', `Sending message to ${channel}`, entry);
  }

  /**
   * Log when a message has been successfully sent
   */
  logMessageSent(
    messageId: string,
    conversationId: string,
    channel: string,
    deliveryStatus: string,
  ): void {
    const entry: MessageLogEntry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel,
      stage: 'sent',
      details: {
        deliveryStatus,
      },
    };

    this.logger.logWithMeta('info', `Message sent successfully via ${channel}`, entry);
  }

  /**
   * Log when a message processing fails
   */
  logMessageFailed(
    messageId: string,
    conversationId: string,
    channel: string,
    stage: MessageStage,
    error: Error,
  ): void {
    const entry: MessageLogEntry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel,
      stage: 'failed',
      details: {
        failedStage: stage,
        errorMessage: error.message,
      },
      error: error.stack,
    };

    this.logger.logWithMeta('error', `Message processing failed at ${stage}`, entry);
  }

  /**
   * Log WebSocket emission
   */
  logWebSocketEmit(
    conversationId: string,
    messageId: string,
    connectedClients: number,
    roomName: string,
  ): void {
    const entry = {
      timestamp: new Date(),
      messageId,
      conversationId,
      channel: 'WIDGET',
      stage: 'sending',
      details: {
        connectedClients,
        roomName,
        transport: 'websocket',
      },
    };

    this.logger.logWithMeta(
      'info',
      `WebSocket emit to ${connectedClients} clients in room ${roomName}`,
      entry,
    );
  }

  /**
   * Log processor start
   */
  logProcessorStart(
    processorName: string,
    jobId: string | number,
    jobData: Record<string, any>,
  ): void {
    this.logger.logWithMeta('info', `Processor ${processorName} started`, {
      timestamp: new Date(),
      processorName,
      jobId: String(jobId),
      jobData,
    });
  }

  /**
   * Log processor completion
   */
  logProcessorComplete(
    processorName: string,
    jobId: string | number,
    durationMs: number,
  ): void {
    this.logger.logWithMeta('info', `Processor ${processorName} completed`, {
      timestamp: new Date(),
      processorName,
      jobId: String(jobId),
      durationMs,
    });
  }

  /**
   * Log processor error
   */
  logProcessorError(
    processorName: string,
    jobId: string | number,
    error: Error,
  ): void {
    this.logger.logWithMeta('error', `Processor ${processorName} failed`, {
      timestamp: new Date(),
      processorName,
      jobId: String(jobId),
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }
}
