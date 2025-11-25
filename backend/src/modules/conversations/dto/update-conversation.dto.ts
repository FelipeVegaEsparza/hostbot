import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversationStatus } from '@prisma/client';

export class UpdateConversationDto {
  @ApiProperty({
    description: 'Conversation status',
    enum: ConversationStatus,
    example: 'CLOSED',
    required: false,
  })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;
}
