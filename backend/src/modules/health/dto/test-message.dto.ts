import { IsString, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Channel } from '@prisma/client';

export class TestMessageDto {
  @ApiProperty({
    description: 'ID of the chatbot to test',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  chatbotId: string;

  @ApiProperty({
    description: 'Channel to test (WIDGET or WHATSAPP_QR)',
    enum: Channel,
    example: 'WIDGET',
  })
  @IsEnum(Channel)
  @IsNotEmpty()
  channel: Channel;

  @ApiProperty({
    description: 'External user ID for testing',
    example: 'test-user-123',
  })
  @IsString()
  @IsNotEmpty()
  externalUserId: string;

  @ApiProperty({
    description: 'Test message content',
    example: 'Hello, this is a test message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
