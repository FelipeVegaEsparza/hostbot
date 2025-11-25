import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    chatbot: {
      findUnique: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateConversationDto = {
      chatbotId: 'chatbot-id',
      externalUserId: 'user-123',
      channel: 'WIDGET',
    };

    it('should create a new conversation', async () => {
      const mockChatbot = { id: createDto.chatbotId };
      const mockConversation = {
        id: 'conversation-id',
        ...createDto,
        status: 'ACTIVE',
        chatbot: { id: createDto.chatbotId, name: 'Test Bot', customerId: 'customer-id' },
      };

      mockPrismaService.chatbot.findUnique.mockResolvedValue(mockChatbot);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);

      const result = await service.create(createDto);

      expect(mockPrismaService.chatbot.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.chatbotId },
      });
      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith({
        data: {
          chatbotId: createDto.chatbotId,
          externalUserId: createDto.externalUserId,
          channel: createDto.channel,
        },
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
              customerId: true,
            },
          },
        },
      });
      expect(result).toEqual(mockConversation);
    });

    it('should return existing conversation if already exists', async () => {
      const mockChatbot = { id: createDto.chatbotId };
      const existingConversation = {
        id: 'existing-conversation-id',
        ...createDto,
        status: 'ACTIVE',
      };

      mockPrismaService.chatbot.findUnique.mockResolvedValue(mockChatbot);
      mockPrismaService.conversation.findFirst.mockResolvedValue(existingConversation);

      const result = await service.create(createDto);

      expect(mockPrismaService.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          chatbotId: createDto.chatbotId,
          externalUserId: createDto.externalUserId,
          channel: createDto.channel,
          status: 'ACTIVE',
        },
      });
      expect(mockPrismaService.conversation.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingConversation);
    });

    it('should throw NotFoundException if chatbot does not exist', async () => {
      mockPrismaService.chatbot.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.conversation.create).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreate', () => {
    const chatbotId = 'chatbot-id';
    const externalUserId = 'user-123';
    const channel = 'WIDGET';

    it('should return existing conversation if found', async () => {
      const existingConversation = {
        id: 'conversation-id',
        chatbotId,
        externalUserId,
        channel,
        status: 'ACTIVE',
        chatbot: { id: chatbotId, name: 'Test Bot', customerId: 'customer-id' },
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(existingConversation);

      const result = await service.findOrCreate(chatbotId, externalUserId, channel);

      expect(mockPrismaService.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          chatbotId,
          externalUserId,
          channel,
          status: 'ACTIVE',
        },
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
              customerId: true,
            },
          },
        },
      });
      expect(result).toEqual(existingConversation);
    });

    it('should create new conversation if not found', async () => {
      const mockChatbot = { id: chatbotId };
      const newConversation = {
        id: 'new-conversation-id',
        chatbotId,
        externalUserId,
        channel,
        status: 'ACTIVE',
        chatbot: { id: chatbotId, name: 'Test Bot', customerId: 'customer-id' },
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.chatbot.findUnique.mockResolvedValue(mockChatbot);
      mockPrismaService.conversation.create.mockResolvedValue(newConversation);

      const result = await service.findOrCreate(chatbotId, externalUserId, channel);

      expect(mockPrismaService.conversation.create).toHaveBeenCalled();
      expect(result).toEqual(newConversation);
    });
  });

  describe('findAllByCustomer', () => {
    const customerId = 'customer-id';

    it('should return paginated conversations for customer', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          chatbot: { id: 'bot-1', name: 'Bot 1' },
          _count: { messages: 10 },
        },
        {
          id: 'conv-2',
          chatbot: { id: 'bot-2', name: 'Bot 2' },
          _count: { messages: 5 },
        },
      ];

      mockPrismaService.conversation.findMany.mockResolvedValue(mockConversations);
      mockPrismaService.conversation.count.mockResolvedValue(2);

      const result = await service.findAllByCustomer(customerId, 1, 20);

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith({
        where: {
          chatbot: {
            customerId,
          },
        },
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        skip: 0,
        take: 20,
      });
      expect(result.data).toEqual(mockConversations);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([]);
      mockPrismaService.conversation.count.mockResolvedValue(50);

      const result = await service.findAllByCustomer(customerId, 2, 20);

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    const conversationId = 'conversation-id';
    const customerId = 'customer-id';

    it('should return conversation if customer owns it', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: {
          id: 'chatbot-id',
          name: 'Test Bot',
          customerId,
        },
        _count: { messages: 15 },
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await service.findOne(conversationId, customerId);

      expect(mockPrismaService.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: conversationId },
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
              customerId: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });
      expect(result).toEqual(mockConversation);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(service.findOne(conversationId, customerId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if customer does not own conversation', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: {
          id: 'chatbot-id',
          name: 'Test Bot',
          customerId: 'different-customer-id',
        },
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(service.findOne(conversationId, customerId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('update', () => {
    const conversationId = 'conversation-id';
    const customerId = 'customer-id';
    const updateDto: UpdateConversationDto = {
      status: 'CLOSED',
    };

    it('should update conversation', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: {
          id: 'chatbot-id',
          name: 'Test Bot',
          customerId,
        },
      };
      const updatedConversation = {
        ...mockConversation,
        status: 'CLOSED',
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.conversation.update.mockResolvedValue(updatedConversation);

      const result = await service.update(conversationId, customerId, updateDto);

      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: updateDto,
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
              customerId: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedConversation);
    });

    it('should verify ownership before updating', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: {
          customerId: 'different-customer-id',
        },
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(service.update(conversationId, customerId, updateDto)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockPrismaService.conversation.update).not.toHaveBeenCalled();
    });
  });

  describe('updateLastMessageAt', () => {
    it('should update lastMessageAt timestamp', async () => {
      const conversationId = 'conversation-id';

      mockPrismaService.conversation.update.mockResolvedValue({});

      await service.updateLastMessageAt(conversationId);

      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: {
          lastMessageAt: expect.any(Date),
        },
      });
    });

    it('should not throw error if update fails', async () => {
      const conversationId = 'conversation-id';

      mockPrismaService.conversation.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateLastMessageAt(conversationId)).resolves.not.toThrow();
    });
  });

  describe('remove', () => {
    const conversationId = 'conversation-id';
    const customerId = 'customer-id';

    it('should delete conversation', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: {
          customerId,
        },
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.conversation.delete.mockResolvedValue(mockConversation);

      await service.remove(conversationId, customerId);

      expect(mockPrismaService.conversation.delete).toHaveBeenCalledWith({
        where: { id: conversationId },
      });
    });

    it('should verify ownership before deleting', async () => {
      const mockConversation = {
        id: conversationId,
        chatbot: {
          customerId: 'different-customer-id',
        },
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(service.remove(conversationId, customerId)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockPrismaService.conversation.delete).not.toHaveBeenCalled();
    });
  });
});
