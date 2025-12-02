import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WhatsAppQRService } from './whatsapp-qr.service';
import {
  InitSessionDto,
  SendWhatsAppQRMessageDto,
  WebhookNotificationDto,
  IncomingMessageDto,
  DisconnectSessionDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('whatsapp')
@Controller('whatsapp-qr')
export class WhatsAppQRController {
  private readonly logger = new Logger(WhatsAppQRController.name);

  constructor(private readonly whatsappQRService: WhatsAppQRService) {}

  /**
   * Initialize a new WhatsApp QR session
   * POST /whatsapp-qr/init
   */
  @Post('init')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize a new WhatsApp QR session' })
  @ApiResponse({ status: 200, description: 'Session initialized successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async initSession(@Body() dto: InitSessionDto): Promise<any> {
    try {
      this.logger.log(`Init session request for chatbot: ${dto.chatbotId}`);
      const result = await this.whatsappQRService.initSession(dto);
      return result;
    } catch (error) {
      this.logger.error('Error initializing session', error);
      throw error;
    }
  }

  /**
   * Get QR code for a session
   * GET /whatsapp-qr/qr-code/:sessionId
   */
  @Get('qr-code/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR code for a WhatsApp session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'QR code retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getQRCode(@Param('sessionId') sessionId: string): Promise<any> {
    try {
      this.logger.log(`Get QR code request for session: ${sessionId}`);
      const result = await this.whatsappQRService.getQRCode(sessionId);
      return result;
    } catch (error) {
      this.logger.error('Error getting QR code', error);
      throw error;
    }
  }

  /**
   * Get session status
   * GET /whatsapp-qr/status/:sessionId
   */
  @Get('status/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WhatsApp session status' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getStatus(@Param('sessionId') sessionId: string): Promise<any> {
    try {
      this.logger.log(`Get status request for session: ${sessionId}`);
      const result = await this.whatsappQRService.getStatus(sessionId);
      return result;
    } catch (error) {
      this.logger.error('Error getting session status', error);
      throw error;
    }
  }

  /**
   * Send message via WhatsApp QR
   * POST /whatsapp-qr/send
   */
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message via WhatsApp QR' })
  @ApiResponse({ status: 202, description: 'Message enqueued for sending' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async sendMessage(@Body() dto: SendWhatsAppQRMessageDto): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Send message request for chatbot: ${dto.chatbotId}`);
      await this.whatsappQRService.sendMessage(dto);
      return {
        success: true,
        message: 'Message enqueued for sending',
      };
    } catch (error) {
      this.logger.error('Error sending message', error);
      throw error;
    }
  }

  /**
   * Disconnect a session
   * POST /whatsapp-qr/disconnect
   */
  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect WhatsApp QR session' })
  @ApiResponse({ status: 200, description: 'Session disconnected successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async disconnect(@Body() dto: DisconnectSessionDto): Promise<any> {
    try {
      this.logger.log(`Disconnect request for chatbot: ${dto.chatbotId}`);
      const result = await this.whatsappQRService.disconnect(dto);
      return result;
    } catch (error) {
      this.logger.error('Error disconnecting session', error);
      throw error;
    }
  }

  /**
   * Webhook endpoint to receive notifications from microservice
   * POST /whatsapp-qr/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook notifications from WhatsApp QR microservice' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Body() notification: WebhookNotificationDto): Promise<{ success: boolean }> {
    try {
      this.logger.log(`=== WEBHOOK RECEIVED ===`);
      this.logger.log(`Type: ${notification.type}`);
      this.logger.log(`Session ID: ${notification.sessionId}`);
      this.logger.log(`Data: ${JSON.stringify(notification.data)}`);
      this.logger.log(`========================`);
      
      await this.whatsappQRService.handleWebhook(notification);
      return { success: true };
    } catch (error) {
      this.logger.error('Error handling webhook', error);
      // Always return success to prevent microservice from retrying
      // The service already handles invalid sessionIds gracefully
      return { success: true };
    }
  }

  /**
   * Endpoint to receive incoming messages from microservice
   * POST /whatsapp-qr/incoming
   */
  @Post('incoming')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive incoming messages from WhatsApp QR microservice' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  async handleIncomingMessage(@Body() dto: IncomingMessageDto): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Incoming message received from: ${dto.from}`);
      await this.whatsappQRService.handleIncomingMessage(dto);
      return { success: true };
    } catch (error) {
      this.logger.error('Error handling incoming message', error);
      // Return success to prevent microservice from retrying
      return { success: false };
    }
  }

  /**
   * Get session by chatbot ID
   * GET /whatsapp-qr/session/:chatbotId
   */
  @Get('session/:chatbotId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WhatsApp QR session by chatbot ID' })
  @ApiParam({ name: 'chatbotId', description: 'Chatbot ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSessionByChatbotId(@Param('chatbotId') chatbotId: string): Promise<any> {
    try {
      this.logger.log(`📥 [GET_SESSION] Request for chatbot: ${chatbotId}`);
      const session = await this.whatsappQRService.getSessionByChatbotId(chatbotId);
      
      if (!session) {
        this.logger.log(`❌ [GET_SESSION] No session found for chatbot: ${chatbotId}`);
        return {
          success: false,
          message: 'Session not found',
        };
      }

      this.logger.log(`✅ [GET_SESSION] Session found for chatbot: ${chatbotId}`);
      this.logger.log(`📊 [GET_SESSION] Session status: ${session.status}`);
      this.logger.log(`📊 [GET_SESSION] Has qrCode: ${!!session.qrCode}`);
      if (session.qrCode) {
        this.logger.log(`📊 [GET_SESSION] QR Code length: ${session.qrCode.length}`);
        this.logger.log(`📊 [GET_SESSION] QR Code preview: ${session.qrCode.substring(0, 50)}...`);
      }

      const response = {
        success: true,
        data: session,
      };
      
      this.logger.log(`📤 [GET_SESSION] Sending response with keys: ${Object.keys(response)}`);
      this.logger.log(`📤 [GET_SESSION] Response.data keys: ${Object.keys(response.data)}`);
      
      return response;
    } catch (error) {
      this.logger.error('❌ [GET_SESSION] Error getting session', error);
      throw error;
    }
  }
}
