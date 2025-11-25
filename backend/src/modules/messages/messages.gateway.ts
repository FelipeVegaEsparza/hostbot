import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { Message } from '@prisma/client';
import { MessageLogger } from '../../common/logger/message-logger.service';

/**
 * WebSocket Gateway for real-time message updates
 * Clients can subscribe to conversation rooms to receive real-time messages
 */
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3001'];
      
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[MessagesGateway] CORS rejected WebSocket connection from origin: ${origin}`);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    },
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly messageLogger = new MessageLogger();

  handleConnection(client: Socket) {
    const origin = client.handshake.headers.origin;
    const address = client.handshake.address;
    this.logger.log(`✅ WebSocket client connected: ${client.id} from origin: ${origin || 'no-origin'} (${address})`);
  }

  handleDisconnect(client: Socket) {
    const origin = client.handshake.headers.origin;
    this.logger.log(`❌ WebSocket client disconnected: ${client.id} from origin: ${origin || 'no-origin'}`);
  }

  /**
   * Subscribe to a conversation room
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    const roomName = `conversation:${conversationId}`;
    client.join(roomName);
    
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;
    
    this.logger.log(`📥 Client ${client.id} subscribed to ${roomName} (${clientCount} clients in room)`);
    return { event: 'subscribed', data: { conversationId, clientCount } };
  }

  /**
   * Unsubscribe from a conversation room
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    const roomName = `conversation:${conversationId}`;
    client.leave(roomName);
    
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;
    
    this.logger.log(`📤 Client ${client.id} unsubscribed from ${roomName} (${clientCount} clients remaining)`);
    return { event: 'unsubscribed', data: { conversationId, clientCount } };
  }

  /**
   * Emit a new message to all clients subscribed to the conversation
   */
  emitNewMessage(conversationId: string, message: Message) {
    const roomName = `conversation:${conversationId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const connectedClients = room ? room.size : 0;

    this.logger.log(`📨 Attempting to emit message ${message.id} to room: ${roomName}`);
    this.logger.log(`   Room exists: ${!!room}, Connected clients: ${connectedClients}`);
    
    // Log WebSocket emission
    this.messageLogger.logWebSocketEmit(
      conversationId,
      message.id,
      connectedClients,
      roomName,
    );

    // Emit the message
    this.server.to(roomName).emit('message', message);
    
    // Log if message was successfully emitted
    if (connectedClients > 0) {
      this.messageLogger.logMessageSent(
        message.id,
        conversationId,
        'WIDGET',
        'SENT',
      );
      this.logger.log(`✅ Emitted message ${message.id} to ${connectedClients} clients in ${roomName}`);
      this.logger.log(`   Message content: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`);
    } else {
      this.logger.warn(`⚠️  No clients connected to ${roomName}, message ${message.id} not delivered via WebSocket`);
      this.logger.warn(`   Message will be available when client connects and fetches history`);
    }
  }

  /**
   * Emit message status update to all clients subscribed to the conversation
   */
  emitMessageStatusUpdate(
    conversationId: string,
    messageId: string,
    status: string,
  ) {
    this.server.to(`conversation:${conversationId}`).emit('message:status', {
      messageId,
      status,
    });
    this.logger.log(
      `Emitted message status update for message ${messageId} in conversation ${conversationId}`,
    );
  }

  /**
   * Emit typing indicator
   */
  emitTyping(conversationId: string, isTyping: boolean) {
    this.server.to(`conversation:${conversationId}`).emit('typing', { isTyping });
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }

  /**
   * Get rooms and their client counts
   */
  getRoomsInfo(): Record<string, number> {
    const rooms: Record<string, number> = {};
    
    // Iterate through all rooms
    this.server.sockets.adapter.rooms.forEach((sockets, roomName) => {
      // Filter out socket IDs (which are also stored as rooms)
      // Only include conversation rooms
      if (roomName.startsWith('conversation:')) {
        rooms[roomName] = sockets.size;
      }
    });

    return rooms;
  }
}
