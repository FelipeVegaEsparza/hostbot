import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { WhatsAppCloudService } from './whatsapp-cloud.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock the utility functions
jest.mock('../../common/utils/webhook-signature.util', () => ({
  validateWhatsAppSignature: jest.fn(),
}));

jest.mock('../../common/utils/sanitizer.util', () => ({
  sanitizeMessageContent: jest.fn((content) => content),
}));

describe('WhatsAppCloudService', () => {
  let service: WhatsAppCloudService;
  let prismaService: PrismaService;
  let whatsappCloudQueue: any;
  let incomingMessagesQueue: any;

  const mockPrismaService = {
    chatbot: {
      findUnique: jest.fn(),
    },
    whatsAppCloudAccount: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    webhookEvent: {
      create: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppCloudService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('whatsapp-cloud-send'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('incoming-messages'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WhatsAppCloudService>(WhatsAppCloudService);
    prismaService = module.get<PrismaService>(PrismaService);
    whatsappCloudQueue = mockQueue;
    incomingMessagesQueue = mockQueue;

    jest.clearAllMocks();
    process.env.WHATSAPP_APP_SECRET = 'test-secret';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateWebhookSignature', () => {
    it('should validate webhook signature correctly', () => {
      const { validateWhatsAppSignature } = require('../../common/utils/webhook-signature.util');
      validateWhatsAppSignature.mockReturnValue(true);

      const result = service.validateWebhookSignature('payload', 'signature');

      expect(validateWhatsAppSignature).toHaveBeenCalledWith('payload', 'signature', 'test-secret');
      expect(result).toBe(true);
    });

    it('should return false if signature is invalid', () => {
      const { validateWhatsAppSignature } = require('../../common/utils/webhook-signature.util');
      validateWhatsAppSignature.mockReturnValue(false);

      const result = service.validateWebhookSignature('payload', 'invalid-signature');

      expect(result).toBe(false);
    });

    it('should return false if WHATSAPP_APP_SECRET is not configured', () => {
      delete process.env.WHATSAPP_APP_SECRET;

      const result = service.validateWebhookSignature('payload', 'signature');

      expect(result).toBe(false);
    });
  });

  describe('processIncomingMessage', () => {
    const phoneNumberId = 'phone-123';
    const message = {
      id: 'msg-123',
      from: '1234567890',
      timestamp: '1234567890',
      type: 'text',
      text: {
        body: 'Hello from WhatsApp',
      },
    };

    it('should process incoming message successfully', async () => {
      const mockAccount = {
        id: 'account-id',
        chatbotId: 'chatbot-id',
        phoneNumberId,
        isActive: true,
        chatbot: { id: 'chatbot-id' },
      };
      const mockConversation = {
        id: 'conversation-id',
        chatbotId: 'chatbot-id',
        externalUserId: message.from,
        channel: 'WHATSAPP_CLOUD',
      };
      const mockMessage = {
        id: 'saved-message-id',
        conversationId: mockConversation.id,
        content: message.text.body,
        role: 'USER',
      };

      mockPrismaService.whatsAppCloudAccount.findFirst.mockResolvedValue(mockAccount);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockPrismaService.conversation.update.mockResolvedValue(mockConversation);
      mockQueue.add.mockResolvedValue({});

      await service.processIncomingMessage(message, phoneNumberId);

      expect(mockPrismaService.whatsAppCloudAccount.findFirst).toHaveBeenCalledWith({
        where: { phoneNumberId, isActive: true },
        include: { chatbot: true },
      });
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: mockConversation.id,
          content: message.text.body,
          role: 'USER',
          deliveryStatus: 'DELIVERED',
          metadata: {
            whatsappMessageId: message.id,
            timestamp: message.timestamp,
          },
        },
      });
      expect(mockQueue.add).toHaveBeenCalledWith('process-incoming-message', expect.any(Object));
    });

    it('should use existing conversation if found', async () => {
      const mockAccount = {
        id: 'account-id',
        chatbotId: 'chatbot-id',
        phoneNumberId,
        isActive: true,
        chatbot: { id: 'chatbot-id' },
      };
      const existingConversation = {
        id: 'existing-conversation-id',
        chatbotId: 'chatbot-id',
        externalUserId: message.from,
        channel: 'WHATSAPP_CLOUD',
      };
      const mockMessage = {
        id: 'saved-message-id',
        conversationId: existingConversation.id,
        content: message.text.body,
        role: 'USER',
      };

      mockPrismaService.whatsAppCloudAccount.findFirst.mockResolvedValue(mockAccount);
      mockPrismaService.conversation.findFirst.mockResolvedValue(existingConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockPrismaService.conversation.update.mockResolvedValue(existingConversation);
      mockQueue.add.mockResolvedValue({});

      await service.processIncomingMessage(message, phoneNumberId);

      expect(mockPrismaService.conversation.create).not.toHaveBeenCalled();
      expect(mockPrismaService.message.create).toHaveBeenCalled();
    });

    it('should return early if no active account found', async () => {
      mockPrismaService.whatsAppCloudAccount.findFirst.mockResolvedValue(null);

      await service.processIncomingMessage(message, phoneNumberId);

      expect(mockPrismaService.conversation.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.message.create).not.toHaveBeenCalled();
    });

    it('should sanitize message content', async () => {
      const mockAccount = {
        id: 'account-id',
        chatbotId: 'chatbot-id',
        phoneNumberId,
        isActive: true,
        chatbot: { id: 'chatbot-id' },
      };
      const mockConversation = {
        id: 'conversation-id',
        chatbotId: 'chatbot-id',
      };

      mockPrismaService.whatsAppCloudAccount.findFirst.mockResolvedValue(mockAccount);
      mockPrismaService.conversation.findFirst.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue({});
      mockPrismaService.conversation.update.mockResolvedValue({});
      mockQueue.add.mockResolvedValue({});

      await service.processIncomingMessage(message, phoneNumberId);

      const { sanitizeMessageContent } = require('../../common/utils/sanitizer.util');
      expect(sanitizeMessageContent).toHaveBeenCalledWith(message.text.body);
    });
  });

  describe('sendMessage', () => {
    const sendDto = {
      chatbotId: 'chatbot-id',
      to: '1234567890',
      message: 'Hello from bot',
    };

    it('should enqueue message for sending', async () => {
      const mockAccount = {
        id: 'account-id',
        chatbotId: sendDto.chatbotId,
        phoneNumberId: 'phone-123',
        accessToken: 'token-123',
        isActive: true,
      };
      const mockConversation = {
        id: 'conversation-id',
        chatbotId: sendDto.chatbotId,
        externalUserId: sendDto.to,
        channel: 'WHATSAPP_CLOUD',
      };
      const mockMessage = {
        id: 'message-id',
        conversationId: mockConversation.id,
        content: sendDto.message,
        role: 'ASSISTANT',
      };

      mockPrismaService.whatsAppCloudAccount.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockQueue.add.mockResolvedValue({});

      await service.sendMessage(sendDto);

      expect(mockPrismaService.whatsAppCloudAccount.findUnique).toHaveBeenCalledWith({
        where: { chatbotId: sendDto.chatbotId },
      });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-whatsapp-message',
        {
          phoneNumberId: mockAccount.phoneNumberId,
          accessToken: mockAccount.accessToken,
          to: sendDto.to,
          message: sendDto.message,
          messageId: mockMessage.id,
          conversationId: mockConversation.id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.whatsAppCloudAccount.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage(sendDto)).rejects.toThrow(NotFoundException);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if account is not active', async () => {
      const inactiveAccount = {
        id: 'account-id',
        chatbotId: sendDto.chatbotId,
        isActive: false,
      };

      mockPrismaService.whatsAppCloudAccount.findUnique.mockResolvedValue(inactiveAccount);

      await expect(service.sendMessage(sendDto)).rejects.toThrow(BadRequestException);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('createOrUpdateAccount', () => {
    const createDto = {
      chatbotId: 'chatbot-id',
      phoneNumberId: 'phone-123',
      accessToken: 'token-123',
      webhookVerifyToken: 'verify-token',
    };

    it('should create new account if not exists', async () => {
      const mockChatbot = { id: createDto.chatbotId };
      const mockAccount = {
        id: 'account-id',
        ...createDto,
        isActive: true,
      };

      mockPrismaService.chatbot.findUnique.mockResolvedValue(mockChatbot);
      mockPrismaService.whatsAppCloudAccount.findUnique.mockResolvedValue(null);
      mockPrismaService.whatsAppCloudAccount.create.mockResolvedValue(mockAccount);

      const result = await service.createOrUpdateAccount(createDto);

      expect(mockPrismaService.whatsAppCloudAccount.create).toHaveBeenCalledWith({
        data: {
          chatbotId: createDto.chatbotId,
          phoneNumberId: createDto.phoneNumberId,
          accessToken: createDto.accessToken,
          webhookVerifyToken: createDto.webhookVerifyToken,
          isActive: true,
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should update existing account', async () => {
      const mockChatbot = { id: createDto.chatbotId };
      const existingAccount = {
        id: 'account-id',
        chatbotId: createDto.chatbotId,
        phoneNumberId: 'old-phone',
      };
      const updatedAccount = {
        ...existingAccount,
        ...createDto,
      };

      mockPrismaService.chatbot.findUnique.mockResolvedValue(mockChatbot);
      mockPrismaService.whatsAppCloudAccount.findUnique.mockResolvedValue(existingAccount);
      mockPrismaService.whatsAppCloudAccount.update.mockResolvedValue(updatedAccount);

      const result = await service.createOrUpdateAccount(createDto);

      expect(mockPrismaService.whatsAppCloudAccount.update).toHaveBeenCalledWith({
        where: { chatbotId: createDto.chatbotId },
        data: {
          phoneNumberId: createDto.phoneNumberId,
          accessToken: createDto.accessToken,
          webhookVerifyToken: createDto.webhookVerifyToken,
          isActive: true,
        },
      });
      expect(mockPrismaService.whatsAppCloudAccount.create).not.toHaveBeenCalled();
      expect(result).toEqual(updatedAccount);
    });

    it('should throw NotFoundException if chatbot not found', async () => {
      mockPrismaService.chatbot.findUnique.mockResolvedValue(null);

      await expect(service.createOrUpdateAccount(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAccountByChatbotId', () => {
    it('should return account with chatbot details', async () => {
      const chatbotId = 'chatbot-id';
      const mockAccount = {
        id: 'account-id',
        chatbotId,
        phoneNumberId: 'phone-123',
        chatbot: { id: chatbotId, name: 'Test Bot' },
      };

      mockPrismaService.whatsAppCloudAccount.findUnique.mockResolvedValue(mockAccount);

      const result = await service.getAccountByChatbotId(chatbotId);

      expect(mockPrismaService.whatsAppCloudAccount.findUnique).toHaveBeenCalledWith({
        where: { chatbotId },
        include: { chatbot: true },
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate account', async () => {
      const chatbotId = 'chatbot-id';
      const mockAccount = {
        id: 'account-id',
        chatbotId,
        isActive: false,
      };

      mockPrismaService.whatsAppCloudAccount.update.mockResolvedValue(mockAccount);

      const result = await service.deactivateAccount(chatbotId);

      expect(mockPrismaService.whatsAppCloudAccount.update).toHaveBeenCalledWith({
        where: { chatbotId },
        data: { isActive: false },
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('registerWebhookEvent', () => {
    it('should register webhook event in database', async () => {
      const event = 'message.received';
      const payload = { test: 'data' };

      mockPrismaService.webhookEvent.create.mockResolvedValue({});

      await service.registerWebhookEvent(event, payload, 'SENT');

      expect(mockPrismaService.webhookEvent.create).toHaveBeenCalledWith({
        data: {
          url: 'whatsapp-cloud-webhook',
          event,
          payload,
          status: 'SENT',
          attempts: 1,
        },
      });
    });

    it('should not throw error if registration fails', async () => {
      mockPrismaService.webhookEvent.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.registerWebhookEvent('event', {}, 'SENT')
      ).resolves.not.toThrow();
    });
  });
});
