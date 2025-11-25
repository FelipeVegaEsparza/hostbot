import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { CreateKnowledgeItemDto } from './dto/create-knowledge-item.dto';
import { UpdateKnowledgeItemDto } from './dto/update-knowledge-item.dto';
import { SearchKnowledgeDto } from './dto/search-knowledge.dto';
import { PaginationDto, PaginatedResponseDto, getPaginationParams } from '../../common/dto/pagination.dto';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  // ==================== Knowledge Base CRUD ====================

  async createKnowledgeBase(
    customerId: string,
    createKnowledgeBaseDto: CreateKnowledgeBaseDto,
  ) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Create knowledge base
    const knowledgeBase = await this.prisma.knowledgeBase.create({
      data: {
        customerId,
        name: createKnowledgeBaseDto.name,
        description: createKnowledgeBaseDto.description,
      },
      include: {
        _count: {
          select: {
            items: true,
            chatbots: true,
          },
        },
      },
    });

    return knowledgeBase;
  }

  async findAllKnowledgeBases(customerId: string, paginationDto: PaginationDto = {}) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const { page = 1, limit = 10 } = paginationDto;
    const { skip, take } = getPaginationParams(page, limit);

    // Get total count
    const total = await this.prisma.knowledgeBase.count({
      where: { customerId },
    });

    // Return only knowledge bases belonging to this customer with pagination
    const knowledgeBases = await this.prisma.knowledgeBase.findMany({
      where: { customerId },
      include: {
        _count: {
          select: {
            items: true,
            chatbots: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    return new PaginatedResponseDto(knowledgeBases, total, page, limit);
  }

  async findOneKnowledgeBase(id: string, customerId: string) {
    const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        chatbots: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            items: true,
            chatbots: true,
          },
        },
      },
    });

    if (!knowledgeBase) {
      throw new NotFoundException(
        `Knowledge base with ID ${id} not found or does not belong to customer`,
      );
    }

    return knowledgeBase;
  }

  async updateKnowledgeBase(
    id: string,
    customerId: string,
    updateKnowledgeBaseDto: UpdateKnowledgeBaseDto,
  ) {
    // Verify knowledge base exists and belongs to customer
    const existingKnowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: {
        id,
        customerId,
      },
    });

    if (!existingKnowledgeBase) {
      throw new NotFoundException(
        `Knowledge base with ID ${id} not found or does not belong to customer`,
      );
    }

    // Update knowledge base
    const knowledgeBase = await this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        name: updateKnowledgeBaseDto.name,
        description: updateKnowledgeBaseDto.description,
      },
      include: {
        _count: {
          select: {
            items: true,
            chatbots: true,
          },
        },
      },
    });

    return knowledgeBase;
  }

  async removeKnowledgeBase(id: string, customerId: string) {
    // Verify knowledge base exists and belongs to customer
    const existingKnowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: {
        id,
        customerId,
      },
    });

    if (!existingKnowledgeBase) {
      throw new NotFoundException(
        `Knowledge base with ID ${id} not found or does not belong to customer`,
      );
    }

    // Check if knowledge base is associated with any chatbots
    const chatbotsCount = await this.prisma.chatbot.count({
      where: { knowledgeBaseId: id },
    });

    if (chatbotsCount > 0) {
      throw new BadRequestException(
        `Cannot delete knowledge base. It is associated with ${chatbotsCount} chatbot(s). Please remove the association first.`,
      );
    }

    // Delete knowledge base (cascade will delete items)
    await this.prisma.knowledgeBase.delete({
      where: { id },
    });

    return { message: 'Knowledge base deleted successfully' };
  }

  // ==================== Knowledge Item CRUD ====================

  async createKnowledgeItem(
    customerId: string,
    createKnowledgeItemDto: CreateKnowledgeItemDto,
  ) {
    // Verify knowledge base exists and belongs to customer
    const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: {
        id: createKnowledgeItemDto.knowledgeBaseId,
        customerId,
      },
    });

    if (!knowledgeBase) {
      throw new NotFoundException(
        'Knowledge base not found or does not belong to customer',
      );
    }

    // Create knowledge item
    const knowledgeItem = await this.prisma.knowledgeItem.create({
      data: {
        knowledgeBaseId: createKnowledgeItemDto.knowledgeBaseId,
        title: createKnowledgeItemDto.title,
        content: createKnowledgeItemDto.content,
        metadata: createKnowledgeItemDto.metadata || {},
      },
      include: {
        knowledgeBase: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return knowledgeItem;
  }

  async findAllKnowledgeItems(knowledgeBaseId: string, customerId: string, paginationDto: PaginationDto = {}) {
    // Verify knowledge base exists and belongs to customer
    const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: {
        id: knowledgeBaseId,
        customerId,
      },
    });

    if (!knowledgeBase) {
      throw new NotFoundException(
        'Knowledge base not found or does not belong to customer',
      );
    }

    const { page = 1, limit = 20 } = paginationDto;
    const { skip, take } = getPaginationParams(page, limit);

    // Get total count
    const total = await this.prisma.knowledgeItem.count({
      where: { knowledgeBaseId },
    });

    // Return all items in this knowledge base with pagination
    const items = await this.prisma.knowledgeItem.findMany({
      where: { knowledgeBaseId },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    return new PaginatedResponseDto(items, total, page, limit);
  }

  async findOneKnowledgeItem(id: string, customerId: string) {
    const knowledgeItem = await this.prisma.knowledgeItem.findFirst({
      where: {
        id,
        knowledgeBase: {
          customerId,
        },
      },
      include: {
        knowledgeBase: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    });

    if (!knowledgeItem) {
      throw new NotFoundException(
        `Knowledge item with ID ${id} not found or does not belong to customer`,
      );
    }

    return knowledgeItem;
  }

  async updateKnowledgeItem(
    id: string,
    customerId: string,
    updateKnowledgeItemDto: UpdateKnowledgeItemDto,
  ) {
    // Verify knowledge item exists and belongs to customer
    const existingItem = await this.prisma.knowledgeItem.findFirst({
      where: {
        id,
        knowledgeBase: {
          customerId,
        },
      },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Knowledge item with ID ${id} not found or does not belong to customer`,
      );
    }

    // Update knowledge item
    const knowledgeItem = await this.prisma.knowledgeItem.update({
      where: { id },
      data: {
        title: updateKnowledgeItemDto.title,
        content: updateKnowledgeItemDto.content,
        metadata: updateKnowledgeItemDto.metadata,
      },
      include: {
        knowledgeBase: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return knowledgeItem;
  }

  async removeKnowledgeItem(id: string, customerId: string) {
    // Verify knowledge item exists and belongs to customer
    const existingItem = await this.prisma.knowledgeItem.findFirst({
      where: {
        id,
        knowledgeBase: {
          customerId,
        },
      },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Knowledge item with ID ${id} not found or does not belong to customer`,
      );
    }

    // Delete knowledge item
    await this.prisma.knowledgeItem.delete({
      where: { id },
    });

    return { message: 'Knowledge item deleted successfully' };
  }

  // ==================== Search ====================

  async searchKnowledgeItems(
    knowledgeBaseId: string,
    customerId: string,
    searchDto: SearchKnowledgeDto,
  ) {
    // Verify knowledge base exists and belongs to customer
    const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
      where: {
        id: knowledgeBaseId,
        customerId,
      },
    });

    if (!knowledgeBase) {
      throw new NotFoundException(
        'Knowledge base not found or does not belong to customer',
      );
    }

    const { query, limit = 10 } = searchDto;

    // Search using full-text search on title and content
    // Note: This requires a fulltext index on the title and content columns
    const items = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id,
        knowledgeBaseId,
        title,
        content,
        metadata,
        createdAt,
        updatedAt,
        MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE) as relevance
      FROM KnowledgeItem
      WHERE knowledgeBaseId = ${knowledgeBaseId}
        AND MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE)
      ORDER BY relevance DESC
      LIMIT ${limit}
    `;

    return items;
  }

  // ==================== Helper Methods ====================

  async getKnowledgeContext(
    knowledgeBaseId: string,
    query: string,
    limit: number = 5,
  ): Promise<string[]> {
    try {
      // Try full-text search first
      const items = await this.prisma.$queryRaw<any[]>`
        SELECT 
          id,
          title,
          content,
          MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE) as relevance
        FROM KnowledgeItem
        WHERE knowledgeBaseId = ${knowledgeBaseId}
          AND MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE)
        ORDER BY relevance DESC
        LIMIT ${limit}
      `;

      if (items.length > 0) {
        return items.map((item) => `Knowledge: ${item.title}\n${item.content}`);
      }

      // Fallback to LIKE search if full-text returns no results
      const fallbackItems = await this.prisma.knowledgeItem.findMany({
        where: {
          knowledgeBaseId,
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
          ],
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return fallbackItems.map(
        (item) => `Knowledge: ${item.title}\n${item.content}`,
      );
    } catch (error) {
      // If full-text search fails (index not created yet), use LIKE search
      const items = await this.prisma.knowledgeItem.findMany({
        where: {
          knowledgeBaseId,
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
          ],
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return items.map((item) => `Knowledge: ${item.title}\n${item.content}`);
    }
  }
}
