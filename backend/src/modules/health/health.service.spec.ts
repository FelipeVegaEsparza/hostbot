import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queues/queue-names.constant';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  const mockQueue = {
    getWaitingCount: jest.fn().mockResolvedValue(0),
    getActiveCount: jest.fn().mockResolvedValue(0),
    getCompletedCount: jest.fn().mockResolvedValue(0),
    getFailedCount: jest.fn().mockResolvedValue(0),
    getDelayedCount: jest.fn().mockResolvedValue(0),
    isPaused: jest.fn().mockResolvedValue(false),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    chatbot: {
      findUnique: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.INCOMING_MESSAGES),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.OUTGOING_MESSAGES),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.AI_PROCESSING),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.WHATSAPP_CLOUD_SEND),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.WHATSAPP_QR_SEND),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.WEBHOOK_DELIVERY),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDatabase', () => {
    it('should return up status when database is accessible', async () => {
      const result = await service.checkDatabase();
      
      expect(result.status).toBe('up');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return down status when database is not accessible', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(new Error('Connection failed'));
      
      const result = await service.checkDatabase();
      
      expect(result.status).toBe('down');
      expect(result.message).toBe('Connection failed');
    });
  });

  describe('getQueuesStatus', () => {
    it('should return status for all queues', async () => {
      const result = await service.getQueuesStatus();
      
      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('waiting');
      expect(result[0]).toHaveProperty('active');
      expect(result[0]).toHaveProperty('completed');
      expect(result[0]).toHaveProperty('failed');
      expect(result[0]).toHaveProperty('delayed');
      expect(result[0]).toHaveProperty('paused');
    });

    it('should handle queue errors gracefully', async () => {
      mockQueue.getWaitingCount.mockRejectedValueOnce(new Error('Queue error'));
      
      const result = await service.getQueuesStatus();
      
      expect(result).toHaveLength(6);
      expect(result[0].waiting).toBe(-1);
    });
  });

  describe('getWebSocketStatus', () => {
    it('should return empty status when gateway is not set', async () => {
      const result = await service.getWebSocketStatus();
      
      expect(result.connected).toBe(0);
      expect(result.rooms).toEqual({});
    });

    it('should return connection status when gateway is set', async () => {
      const mockGateway = {
        getConnectedClientsCount: jest.fn().mockReturnValue(5),
        getRoomsInfo: jest.fn().mockReturnValue({
          'conversation:123': 2,
          'conversation:456': 3,
        }),
      };
      
      service.setMessagesGateway(mockGateway);
      const result = await service.getWebSocketStatus();
      
      expect(result.connected).toBe(5);
      expect(result.rooms).toHaveProperty('conversation:123');
      expect(result.rooms['conversation:123']).toBe(2);
    });
  });

  describe('getAIProvidersStatus', () => {
    it('should return empty array when AI service is not set', async () => {
      const result = await service.getAIProvidersStatus();
      
      expect(result).toEqual([]);
    });

    it('should return provider statuses when AI service is set', async () => {
      const mockAIService = {
        getAllCircuitStatuses: jest.fn().mockReturnValue(
          new Map([
            ['openai', {
              state: 'CLOSED',
              failureCount: 0,
              lastFailureTime: null,
              nextAttemptTime: null,
              successCount: 10,
            }],
          ])
        ),
      };
      
      service.setAIService(mockAIService);
      const result = await service.getAIProvidersStatus();
      
      expect(result).toHaveLength(1);
      expect(result[0].provider).toBe('openai');
      expect(result[0].state).toBe('CLOSED');
    });
  });

  describe('testMessage', () => {
    it('should return error when chatbot is not found', async () => {
      mockPrismaService.chatbot.findUnique.mockResolvedValueOnce(null);
      
      const result = await service.testMessage(
        'invalid-id',
        'WIDGET',
        'test-user',
        'Hello'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chatbot not found');
      expect(result.stages).toHaveLength(1);
      expect(result.stages[0].status).toBe('failed');
    });

    it('should return error when messages service is not set', async () => {
      mockPrismaService.chatbot.findUnique.mockResolvedValueOnce({
        id: 'chatbot-id',
        name: 'Test Bot',
      });
      
      const result = await service.testMessage(
        'chatbot-id',
        'WIDGET',
        'test-user',
        'Hello'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('MessagesService not available');
    });
  });
});
