import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Query,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { WhatsAppCloudService } from './whatsapp-cloud.service';
import { WebhookEventDto, SendWhatsAppMessageDto, CreateWhatsAppCloudAccountDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('whatsapp')
@Controller('whatsapp-cloud')
export class WhatsAppCloudController {
  private readonly logger = new Logger(WhatsAppCloudController.name);

  constructor(private readonly whatsappCloudService: WhatsAppCloudService) {}

  /**
   * Webhook verification endpoint (GET)
   * Meta sends a GET request to verify the webhook URL
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Verify WhatsApp Cloud API webhook' })
  @ApiQuery({ name: 'hub.mode', description: 'Webhook mode', example: 'subscribe' })
  @ApiQuery({ name: 'hub.verify_token', description: 'Verification token' })
  @ApiQuery({ name: 'hub.challenge', description: 'Challenge string to return' })
  @ApiResponse({ status: 200, description: 'Webhook verified successfully' })
  @ApiResponse({ status: 400, description: 'Verification failed' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    this.logger.log('Webhook verification request received');

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    throw new BadRequestException('Verification failed');
  }

  /**
   * Webhook endpoint (POST)
   * Receives incoming messages and status updates from WhatsApp
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WhatsApp Cloud API webhook events' })
  @ApiHeader({ name: 'x-hub-signature-256', description: 'Webhook signature for validation' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleWebhook(
    @Body() body: WebhookEventDto,
    @Headers('x-hub-signature-256') signature: string,
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log('Webhook event received');

      // Validate signature
      const payload = JSON.stringify(body);
      const isValid = this.whatsappCloudService.validateWebhookSignature(payload, signature);

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid signature');
      }

      // Register webhook event
      await this.whatsappCloudService.registerWebhookEvent('message.received', body);

      // Process webhook
      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.value.messages && change.value.messages.length > 0) {
                const phoneNumberId = change.value.metadata.phone_number_id;
                
                for (const message of change.value.messages) {
                  await this.whatsappCloudService.processIncomingMessage(message, phoneNumberId);
                }
              }

              // Handle status updates
              if (change.value.statuses && change.value.statuses.length > 0) {
                this.logger.log('Status update received', change.value.statuses);
                // TODO: Update message delivery status in database
              }
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error handling webhook', error);
      
      // Return 200 to prevent Meta from retrying
      // Log error for investigation
      return { success: false };
    }
  }

  /**
   * Send message via WhatsApp Cloud API
   */
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message via WhatsApp Cloud API' })
  @ApiResponse({ status: 202, description: 'Message enqueued for sending' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Chatbot or account not found' })
  async sendMessage(@Body() dto: SendWhatsAppMessageDto): Promise<{ success: boolean; message: string }> {
    try {
      await this.whatsappCloudService.sendMessage(dto);
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
   * Create or update WhatsApp Cloud account
   */
  @Post('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update WhatsApp Cloud account' })
  @ApiResponse({ status: 201, description: 'Account created/updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async createAccount(@Body() dto: CreateWhatsAppCloudAccountDto): Promise<any> {
    try {
      const account = await this.whatsappCloudService.createOrUpdateAccount(dto);
      return {
        success: true,
        data: account,
      };
    } catch (error) {
      this.logger.error('Error creating account', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp Cloud account by chatbot ID
   */
  @Get('account/:chatbotId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WhatsApp Cloud account by chatbot ID' })
  @ApiParam({ name: 'chatbotId', description: 'Chatbot ID' })
  @ApiResponse({ status: 200, description: 'Account retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Account not found' })
  async getAccount(@Param('chatbotId') chatbotId: string): Promise<any> {
    try {
      const account = await this.whatsappCloudService.getAccountByChatbotId(chatbotId);
      
      if (!account) {
        throw new BadRequestException('Account not found');
      }

      // Don't expose sensitive data
      const { accessToken, ...safeAccount } = account;
      
      return {
        success: true,
        data: safeAccount,
      };
    } catch (error) {
      this.logger.error('Error getting account', error);
      throw error;
    }
  }

  /**
   * Deactivate WhatsApp Cloud account
   */
  @Post('account/:chatbotId/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate WhatsApp Cloud account' })
  @ApiParam({ name: 'chatbotId', description: 'Chatbot ID' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deactivateAccount(@Param('chatbotId') chatbotId: string): Promise<any> {
    try {
      const account = await this.whatsappCloudService.deactivateAccount(chatbotId);
      return {
        success: true,
        data: account,
      };
    } catch (error) {
      this.logger.error('Error deactivating account', error);
      throw error;
    }
  }
}
