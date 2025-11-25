import { IsString, IsNumber, IsEnum, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogUsageDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: 'MESSAGE', enum: ['MESSAGE', 'AI_REQUEST', 'WHATSAPP_MESSAGE'] })
  @IsEnum(['MESSAGE', 'AI_REQUEST', 'WHATSAPP_MESSAGE'])
  type: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: { chatbotId: 'uuid', conversationId: 'uuid' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
