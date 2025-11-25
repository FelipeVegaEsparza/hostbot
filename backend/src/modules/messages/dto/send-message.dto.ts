import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Channel } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({
    description: 'ID of the chatbot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  chatbotId: string;

  @ApiProperty({
    description: 'External user ID (phone, email, etc.)',
    example: '+56912345678',
  })
  @IsString()
  @IsNotEmpty()
  externalUserId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I need help with my order',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Communication channel',
    enum: Channel,
    example: 'WIDGET',
  })
  @IsEnum(Channel)
  channel: Channel;

  @ApiProperty({
    description: 'Optional metadata',
    example: { attachments: [] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Optional conversation ID (if continuing existing conversation)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  conversationId?: string;
}
