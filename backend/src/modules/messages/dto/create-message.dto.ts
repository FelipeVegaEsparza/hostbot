import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageRole, DeliveryStatus } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how can I help you?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Message role',
    enum: MessageRole,
    example: 'USER',
  })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({
    description: 'Delivery status',
    enum: DeliveryStatus,
    example: 'PENDING',
    required: false,
  })
  @IsEnum(DeliveryStatus)
  @IsOptional()
  deliveryStatus?: DeliveryStatus;

  @ApiProperty({
    description: 'Optional metadata',
    example: { attachments: [] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
