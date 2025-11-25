import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { WhatsAppQRService } from './whatsapp-qr.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('WhatsAppQRService', () => {
  let service: WhatsAppQRService;
  let prismaService: PrismaService;
  let whatsappQRQueue: any;
  let incomingMessagesQueue: any;

  const mockPrismaService = {
    chatbot: {
      findUnique: jest.fn(),
    },
    whatsAppQRSession: {
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
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppQRService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('whatsapp-qr-send'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('incoming-messages'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WhatsAppQRService>(WhatsAppQRService);
    prismaService = module.get<PrismaService>(PrismaService);
    whatsappQRQueue = mockQueue;
    incomingMessagesQueue = mockQueue;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSessionByChatbotId', () => {
    const chatbotId = 'chatbot-123';

    /**
     * Feature: fix-whatsapp-qr-display, Property 7: QR returned for QR_READY sessions
     * Validates: Requirements 2.3
     */
    it('should return qrCode when status is QR_READY', async () => {
      const mockSession = {
        id: 'session-id',
        chatbotId,
        sessionId: 'session-123',
        status: 'QR_READY',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        lastConnectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        chatbot: { id: chatbotId, name: 'Test Bot' },
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSessionByChatbotId(chatbotId);

      expect(mockPrismaService.whatsAppQRSession.findUnique).toHaveBeenCalledWith({
        where: { chatbotId },
        include: { chatbot: true },
      });
      expect(result).toEqual(mockSession);
      expect(result.qrCode).toBe(mockSession.qrCode);
      expect(result.qrCode).not.toBeNull();
    });

    it('should return qrCode when status is CONNECTING', async () => {
      const mockSession = {
        id: 'session-id',
        chatbotId,
        sessionId: 'session-123',
        status: 'CONNECTING',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        lastConnectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        chatbot: { id: chatbotId, name: 'Test Bot' },
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSessionByChatbotId(chatbotId);

      expect(result.qrCode).toBe(mockSession.qrCode);
    });

    it('should return null for qrCode when status is CONNECTED', async () => {
      const mockSession = {
        id: 'session-id',
        chatbotId,
        sessionId: 'session-123',
        status: 'CONNECTED',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        lastConnectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        chatbot: { id: chatbotId, name: 'Test Bot' },
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSessionByChatbotId(chatbotId);

      expect(result.qrCode).toBeNull();
      expect(result.status).toBe('CONNECTED');
    });

    it('should return null for qrCode when status is DISCONNECTED', async () => {
      const mockSession = {
        id: 'session-id',
        chatbotId,
        sessionId: 'session-123',
        status: 'DISCONNECTED',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        lastConnectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        chatbot: { id: chatbotId, name: 'Test Bot' },
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSessionByChatbotId(chatbotId);

      expect(result.qrCode).toBeNull();
      expect(result.status).toBe('DISCONNECTED');
    });

    it('should return null when session not found', async () => {
      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(null);

      const result = await service.getSessionByChatbotId(chatbotId);

      expect(result).toBeNull();
    });
  });

  describe('handleWebhook', () => {
    const sessionId = 'session-123';
    const mockSession = {
      id: 'session-id',
      chatbotId: 'chatbot-123',
      sessionId,
      status: 'CONNECTING',
      qrCode: null,
      lastConnectedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * Feature: fix-whatsapp-qr-display, Property 5: Webhook updates session with QR
     * Validates: Requirements 2.1
     */
    it('should update session with QR code when receiving qr notification', async () => {
      const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const notification = {
        type: 'qr' as const,
        sessionId,
        data: { qrCode },
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.whatsAppQRSession.update.mockResolvedValue({
        ...mockSession,
        status: 'QR_READY',
        qrCode,
      });

      await service.handleWebhook(notification);

      expect(mockPrismaService.whatsAppQRSession.findUnique).toHaveBeenCalledWith({
        where: { sessionId },
      });
      expect(mockPrismaService.whatsAppQRSession.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: {
          status: 'QR_READY',
          qrCode,
        },
      });
    });

    /**
     * Feature: fix-whatsapp-qr-display, Property 6: Webhook validates sessionId
     * Validates: Requirements 2.2
     */
    it('should handle webhook gracefully when sessionId does not exist', async () => {
      const notification = {
        type: 'qr' as const,
        sessionId: 'non-existent-session',
        data: { qrCode: 'data:image/png;base64,test' },
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(null);

      // Should not throw an error
      await expect(service.handleWebhook(notification)).resolves.not.toThrow();

      expect(mockPrismaService.whatsAppQRSession.findUnique).toHaveBeenCalledWith({
        where: { sessionId: notification.sessionId },
      });
      expect(mockPrismaService.whatsAppQRSession.update).not.toHaveBeenCalled();
    });

    it('should update session to CONNECTED and clear QR when receiving connected notification', async () => {
      const notification = {
        type: 'connected' as const,
        sessionId,
        data: {},
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.whatsAppQRSession.update.mockResolvedValue({
        ...mockSession,
        status: 'CONNECTED',
        qrCode: null,
        lastConnectedAt: new Date(),
      });

      await service.handleWebhook(notification);

      expect(mockPrismaService.whatsAppQRSession.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: {
          status: 'CONNECTED',
          qrCode: null,
          lastConnectedAt: expect.any(Date),
        },
      });
    });

    it('should update session to DISCONNECTED and clear QR when receiving disconnected notification', async () => {
      const notification = {
        type: 'disconnected' as const,
        sessionId,
        data: {},
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.whatsAppQRSession.update.mockResolvedValue({
        ...mockSession,
        status: 'DISCONNECTED',
        qrCode: null,
      });

      await service.handleWebhook(notification);

      expect(mockPrismaService.whatsAppQRSession.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: {
          status: 'DISCONNECTED',
          qrCode: null,
        },
      });
    });

    it('should handle unknown notification types gracefully', async () => {
      const notification = {
        type: 'unknown' as any,
        sessionId,
        data: {},
      };

      mockPrismaService.whatsAppQRSession.findUnique.mockResolvedValue(mockSession);

      // Should not throw an error
      await expect(service.handleWebhook(notification)).resolves.not.toThrow();

      expect(mockPrismaService.whatsAppQRSession.update).not.toHaveBeenCalled();
    });
  });
});
