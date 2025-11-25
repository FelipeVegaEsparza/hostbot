import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queues/queue.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

// Mock the sanitizer utility
jest.mock('../../common/utils/sanitizer.util', () => ({
  sanitizeMessageContent: jest.fn((content) => content),
}));

// Mock the queues module
jest.mock('../queues/queue-names.constant', () => ({
  QUEUE_NAMES: {
    INCOMING_MESSAGES: 'incoming-messages',
    OUTGOING_MESSAGES: 'outgoing-messages',
    AI_PROCESSING: 'ai-processing',
    WHATSAPP_CLOUD_SEND: 'whatsapp-cloud-send',
    WHATSAPP_QR_SEND: 'whatsapp-qr-send',
    WEBHOOK_DELIVERY: 'webhook-delivery',
  },
}));

describe('MessagesService', () => {
  let service: MessagesService;
  let prismaService: PrismaService;
  let queueService: QueueService;
  let conversationsService: ConversationsService;

  const mockPrismaService = {
    conversation: {
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockQueueService = {
    enqueueIncomingMessage: jest.fn(),
  };

  const mockConversationsService = {
    updateLastMessageAt: jest.fn(),
    findOrCreate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prismaService = module.get<PrismaService>(PrismaService);
    queueService = module.get<QueueService>(QueueService);
    conversationsService = module.get<ConversationsService>(ConversationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateMessageDto = {
      conversationId: 'conversation-id',
      content: 'Hello, world!',
      role: 'USER',
      deliveryStatus: 'SENT',
    };

    it('should successfully create a message', async () => {
      const mockConversation = { id: createDto.conversationId };
      const mockMessage = {
        id: 'message-id',
        ...createDto,
        createdAt: new Date(),
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockConversationsService.updateLastMessageAt.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(mockPrismaService.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.conversationId },
      });
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: createDto.conversationId,
          content: createDto.content,
          role: createDto.role,
          deliveryStatus: createDto.deliveryStatus,
          metadata: {},
        },
      });
      expect(mockConversationsService.updateLastMessageAt).toHaveBeenCalledWith(
        createDto.conversationId
      );
      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.message.create).not.toHaveBeenCalled();
    });

    it('should sanitize message content', async () => {
      const mockConversation = { id: createDto.conversationId };
      const mockMessage = { id: 'message-id', ...createDto };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockConversationsService.updateLastMessageAt.mockResolvedValue(undefined);

      await service.create(createDto);

      const { sanitizeMessageContent } = require('../../common/utils/sanitizer.util');
      expect(sanitizeMessageContent).toHaveBeenCalledWith(createDto.content);
    });

    it('should default deliveryStatus to PENDING if not provided', async () => {
      const dtoWithoutStatus = { ...createDto, deliveryStatus: undefined };
      const mockConversation = { id: createDto.conversationId };
      const mockMessage = { id: 'message-id', ...dtoWithoutStatus, deliveryStatus: 'PENDING' };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockConversationsService.updateLastMessageAt.mockResolvedValue(undefined);

      await service.create(dtoWithoutStatus);

      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deliveryStatus: 'PENDING',
        }),
      });
    });
  });

  describe('send', () => {
    const sendDto: SendMessageDto = {
      chatbotId: 'chatbot-id',
      externalUserId: 'user-123',
      content: 'Hello!',
      channel: 'WIDGET',
    };

    it('should send message and enqueue for processing', async () => {
      const mockConversation = {
        id: 'conversation-id',
        chatbotId: sendDto.chatbotId,
        chatbot: { id: sendDto.chatbotId },
      };
      const mockMessage = {
        id: 'message-id',
        conversationId: mockConversation.id,
        content: sendDto.content,
        role: 'USER',
      };

      mockConversationsService.findOrCreate.mockResolvedValue(mockConversation);
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockConversationsService.updateLastMessageAt.mockResolvedValue(undefined);
      mockQueueService.enqueueIncomingMessage.mockResolvedValue(undefined);

      const result = await service.send(sendDto);

      expect(mockConversationsService.findOrCreate).toHaveBeenCalledWith(
        sendDto.chatbotId,
        sendDto.externalUserId,
        sendDto.channel
      );
      expect(mockQueueService.enqueueIncomingMessage).toHaveBeenCalledWith({
        conversationId: mockConversation.id,
        chatbotId: sendDto.chatbotId,
        externalUserId: sendDto.externalUserId,
        content: sendDto.content,
        channel: sendDto.channel,
        metadata: undefined,
      });
      expect(result).toEqual({
        message: mockMessage,
        conversation: mockConversation,
      });
    });

    it('should use existing conversation if conversationId provided', async () => {
      const sendDtoWithConvId = { ...sendDto, conversationId: 'existing-conv-id' };
      const mockConversation = {
        id: sendDtoWithConvId.conversationId,
        chatbotId: sendDto.chatbotId,
        chatbot: { id: sendDto.chatbotId },
      };
      const mockMessage = {
        id: 'message-id',
        conversationId: mockConversation.id,
        content: sendDto.content,
        role: 'USER',
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockConversationsService.updateLastMessageAt.mockResolvedValue(undefined);
      mockQueueService.enqueueIncomingMessage.mockResolvedValue(undefined);

      await service.send(sendDtoWithConvId);

      expect(mockPrismaService.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: sendDtoWithConvId.conversationId },
        include: { chatbot: true },
      });
      expect(mockConversationsService.findOrCreate).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if conversation not found', async () => {
      const sendDtoWithConvId = { ...sendDto, conversationId: 'non-existent-id' };

      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(service.send(sendDtoWithConvId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByConversation', () => {
    const conversationId = 'conversation-id';
    const customerId = 'customer-id';

    it('should return paginated messages for conversation', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: { customerId },
      };
      const mockMessages = [
        { id: 'msg-1', content: 'Hello', role: 'USER' },
        { id: 'msg-2', content: 'Hi there', role: 'ASSISTANT' },
      ];

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);
      mockPrismaService.message.count.mockResolvedValue(2);

      const result = await service.findByConversation(conversationId, customerId, 1, 50);

      expect(mockPrismaService.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: conversationId },
        include: {
          chatbot: {
            select: {
              customerId: true,
            },
          },
        },
      });
      expect(result.data).toEqual(mockMessages);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.findByConversation(conversationId, customerId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if customer does not own conversation', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: { customerId: 'different-customer-id' },
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        service.findByConversation(conversationId, customerId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update message delivery status', async () => {
      const messageId = 'message-id';
      const status = 'DELIVERED';
      const mockMessage = {
        id: messageId,
        deliveryStatus: status,
      };

      mockPrismaService.message.update.mockResolvedValue(mockMessage);

      const result = await service.updateDeliveryStatus(messageId, status);

      expect(mockPrismaService.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          deliveryStatus: status,
        },
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe('findOne', () => {
    it('should return message with conversation details', async () => {
      const messageId = 'message-id';
      const mockMessage = {
        id: messageId,
        content: 'Hello',
        conversation: {
          id: 'conv-id',
          chatbot: {
            id: 'chatbot-id',
            name: 'Test Bot',
            customerId: 'customer-id',
          },
        },
      };

      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

      const result = await service.findOne(messageId);

      expect(mockPrismaService.message.findUnique).toHaveBeenCalledWith({
        where: { id: messageId },
        include: {
          conversation: {
            include: {
              chatbot: {
                select: {
                  id: true,
                  name: true,
                  customerId: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
