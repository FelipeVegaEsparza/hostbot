import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Channel } from '@prisma/client';

export class CreateConversationDto {
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
    description: 'Communication channel',
    enum: Channel,
    example: 'WIDGET',
  })
  @IsEnum(Channel)
  channel: Channel;
}
