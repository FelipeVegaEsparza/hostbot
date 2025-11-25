import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendWhatsAppQRMessageDto {
  @ApiProperty({
    description: 'ID of the chatbot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  chatbotId: string;

  @ApiProperty({
    description: 'WhatsApp phone number to send message to',
    example: '5491112345678',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, this is a test message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'dashboard' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
