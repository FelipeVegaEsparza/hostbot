import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ChatbotsService } from './chatbots.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { CacheService } from '../../common/cache/cache.service';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';

describe('ChatbotsService', () => {
  let service: ChatbotsService;
  let prismaService: PrismaService;
  let billingService: BillingService;
  let cacheService: CacheService;

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
    },
    chatbot: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    knowledgeBase: {
      findFirst: jest.fn(),
    },
    conversation: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
  };

  const mockBillingService = {
    validateChatbotLimit: jest.fn(),
    validateAIProvider: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ChatbotsService>(ChatbotsService);
    prismaService = module.get<PrismaService>(PrismaService);
    billingService = module.get<BillingService>(BillingService);
    cacheService = module.get<CacheService>(CacheService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const customerId = 'customer-id';
    const createDto: CreateChatbotDto = {
      name: 'Test Chatbot',
      description: 'Test Description',
      aiProvider: 'openai',
      aiModel: 'gpt-4',
      systemPrompt: 'You are a helpful assistant',
      aiConfig: {},
    };

    it('should successfully create a chatbot', async () => {
      const mockCustomer = { id: customerId };
      const mockChatbot = {
        id: 'chatbot-id',
        ...createDto,
        customerId,
        isActive: true,
        customer: mockCustomer,
      };

      mockBillingService.validateChatbotLimit.mockResolvedValue(undefined);
      mockBillingService.validateAIProvider.mockResolvedValue(undefined);
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.chatbot.create.mockResolvedValue(mockChatbot);
      mockCacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.create(customerId, createDto);

      expect(mockBillingService.validateChatbotLimit).toHaveBeenCalledWith(customerId);
      expect(mockBillingService.validateAIProvider).toHaveBeenCalledWith(customerId, createDto.aiProvider);
      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: customerId },
      });
      expect(mockPrismaService.chatbot.create).toHaveBeenCalled();
      expect(mockCacheService.delPattern).toHaveBeenCalledWith(`chatbots:customer:${customerId}:*`);
      expect(result).toEqual(mockChatbot);
    });

    it('should validate chatbot limit before creating', async () => {
      mockBillingService.validateChatbotLimit.mockRejectedValue(
        new BadRequestException('Chatbot limit exceeded')
      );

      await expect(service.create(customerId, createDto)).rejects.toThrow(BadRequestException);
      expect(mockBillingService.validateChatbotLimit).toHaveBeenCalledWith(customerId);
      expect(mockPrismaService.chatbot.create).not.toHaveBeenCalled();
    });

    it('should validate AI provider is allowed in plan', async () => {
      mockBillingService.validateChatbotLimit.mockResolvedValue(undefined);
      mockBillingService.validateAIProvider.mockRejectedValue(
        new BadRequestException('AI provider not allowed in plan')
      );

      await expect(service.create(customerId, createDto)).rejects.toThrow(BadRequestException);
      expect(mockBillingService.validateAIProvider).toHaveBeenCalledWith(customerId, createDto.aiProvider);
      expect(mockPrismaService.chatbot.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      mockBillingService.validateChatbotLimit.mockResolvedValue(undefined);
      mockBillingService.validateAIProvider.mockResolvedValue(undefined);
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(customerId, createDto)).rejects.toThrow(NotFoundException);
    });

    it('should validate knowledge base belongs to customer', async () => {
      const dtoWithKB = { ...createDto, knowledgeBaseId: 'kb-id' };
      
      mockBillingService.validateChatbotLimit.mockResolvedValue(undefined);
      mockBillingService.validateAIProvider.mockResolvedValue(undefined);
      mockPrismaService.customer.findUnique.mockResolvedValue({ id: customerId });
      mockPrismaService.knowledgeBase.findFirst.mockResolvedValue(null);

      await expect(service.create(customerId, dtoWithKB)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.knowledgeBase.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'kb-id',
          customerId,
        },
      });
    });
  });

  describe('findAll', () => {
    const customerId = 'customer-id';

    it('should return paginated chatbots for customer', async () => {
      const mockCustomer = { id: customerId };
      const mockChatbots = [
        { id: 'chatbot-1', name: 'Chatbot 1', customerId },
        { id: 'chatbot-2', name: 'Chatbot 2', customerId },
      ];

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.chatbot.count.mockResolvedValue(2);
      mockPrismaService.chatbot.findMany.mockResolvedValue(mockChatbots);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findAll(customerId, { page: 1, limit: 10 });

      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: customerId },
      });
      expect(mockPrismaService.chatbot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId },
        })
      );
      expect(result.data).toEqual(mockChatbots);
      expect(result.meta.total).toBe(2);
    });

    it('should return cached result if available', async () => {
      const cachedResult = {
        data: [{ id: 'chatbot-1' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockPrismaService.customer.findUnique.mockResolvedValue({ id: customerId });
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(customerId, { page: 1, limit: 10 });

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.chatbot.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.findAll(customerId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    const chatbotId = 'chatbot-id';
    const customerId = 'customer-id';

    it('should return chatbot if it belongs to customer', async () => {
      const mockChatbot = {
        id: chatbotId,
        name: 'Test Chatbot',
        customerId,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.chatbot.findFirst.mockResolvedValue(mockChatbot);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findOne(chatbotId, customerId);

      expect(mockPrismaService.chatbot.findFirst).toHaveBeenCalledWith({
        where: {
          id: chatbotId,
          customerId,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockChatbot);
    });

    it('should return cached chatbot if available', async () => {
      const mockChatbot = {
        id: chatbotId,
        name: 'Test Chatbot',
        customerId,
      };

      mockCacheService.get.mockResolvedValue(mockChatbot);

      const result = await service.findOne(chatbotId, customerId);

      expect(result).toEqual(mockChatbot);
      expect(mockPrismaService.chatbot.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if chatbot not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.chatbot.findFirst.mockResolvedValue(null);

      await expect(service.findOne(chatbotId, customerId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const chatbotId = 'chatbot-id';
    const customerId = 'customer-id';
    const updateDto: UpdateChatbotDto = {
      name: 'Updated Chatbot',
      aiProvider: 'anthropic',
    };

    it('should successfully update chatbot', async () => {
      const existingChatbot = {
        id: chatbotId,
        name: 'Old Name',
        customerId,
        aiProvider: 'openai',
      };
      const updatedChatbot = {
        ...existingChatbot,
        ...updateDto,
      };

      mockPrismaService.chatbot.findFirst.mockResolvedValue(existingChatbot);
      mockBillingService.validateAIProvider.mockResolvedValue(undefined);
      mockPrismaService.chatbot.update.mockResolvedValue(updatedChatbot);
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.update(chatbotId, customerId, updateDto);

      expect(mockPrismaService.chatbot.findFirst).toHaveBeenCalledWith({
        where: { id: chatbotId, customerId },
      });
      expect(mockBillingService.validateAIProvider).toHaveBeenCalledWith(customerId, updateDto.aiProvider);
      expect(mockPrismaService.chatbot.update).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalledWith(`chatbot:${chatbotId}`);
      expect(mockCacheService.delPattern).toHaveBeenCalledWith(`chatbots:customer:${customerId}:*`);
      expect(result).toEqual(updatedChatbot);
    });

    it('should throw NotFoundException if chatbot not found', async () => {
      mockPrismaService.chatbot.findFirst.mockResolvedValue(null);

      await expect(service.update(chatbotId, customerId, updateDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.chatbot.update).not.toHaveBeenCalled();
    });

    it('should validate AI provider when changed', async () => {
      const existingChatbot = {
        id: chatbotId,
        customerId,
        aiProvider: 'openai',
      };

      mockPrismaService.chatbot.findFirst.mockResolvedValue(existingChatbot);
      mockBillingService.validateAIProvider.mockRejectedValue(
        new BadRequestException('AI provider not allowed')
      );

      await expect(service.update(chatbotId, customerId, updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const chatbotId = 'chatbot-id';
    const customerId = 'customer-id';

    it('should successfully delete chatbot', async () => {
      const existingChatbot = {
        id: chatbotId,
        customerId,
      };

      mockPrismaService.chatbot.findFirst.mockResolvedValue(existingChatbot);
      mockPrismaService.chatbot.delete.mockResolvedValue(existingChatbot);
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.remove(chatbotId, customerId);

      expect(mockPrismaService.chatbot.findFirst).toHaveBeenCalledWith({
        where: { id: chatbotId, customerId },
      });
      expect(mockPrismaService.chatbot.delete).toHaveBeenCalledWith({
        where: { id: chatbotId },
      });
      expect(mockCacheService.del).toHaveBeenCalledWith(`chatbot:${chatbotId}`);
      expect(result).toEqual({ message: 'Chatbot deleted successfully' });
    });

    it('should throw NotFoundException if chatbot not found', async () => {
      mockPrismaService.chatbot.findFirst.mockResolvedValue(null);

      await expect(service.remove(chatbotId, customerId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.chatbot.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    const chatbotId = 'chatbot-id';
    const customerId = 'customer-id';

    it('should return chatbot statistics', async () => {
      const mockChatbot = { id: chatbotId, customerId };

      mockPrismaService.chatbot.findFirst.mockResolvedValue(mockChatbot);
      mockPrismaService.conversation.count
        .mockResolvedValueOnce(10) // total conversations
        .mockResolvedValueOnce(5); // active conversations
      mockPrismaService.message.count
        .mockResolvedValueOnce(100) // total messages
        .mockResolvedValueOnce(60) // user messages
        .mockResolvedValueOnce(40); // assistant messages
      mockPrismaService.conversation.groupBy.mockResolvedValue([
        { channel: 'WIDGET', _count: { id: 5 } },
        { channel: 'WHATSAPP_CLOUD', _count: { id: 3 } },
      ]);

      const result = await service.getStats(chatbotId, customerId);

      expect(result).toEqual({
        chatbotId,
        conversations: {
          total: 10,
          active: 5,
          closed: 5,
        },
        messages: {
          total: 100,
          user: 60,
          assistant: 40,
        },
        channels: {
          WIDGET: 5,
          WHATSAPP_CLOUD: 3,
        },
      });
    });

    it('should throw NotFoundException if chatbot not found', async () => {
      mockPrismaService.chatbot.findFirst.mockResolvedValue(null);

      await expect(service.getStats(chatbotId, customerId)).rejects.toThrow(NotFoundException);
    });
  });
});
