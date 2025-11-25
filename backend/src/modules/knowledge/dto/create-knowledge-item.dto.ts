import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeItemDto {
  @ApiProperty({
    description: 'Knowledge base ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  knowledgeBaseId: string;

  @ApiProperty({
    description: 'Title of the knowledge item',
    example: 'How to reset password',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Content of the knowledge item',
    example: 'To reset your password, go to the login page and click on "Forgot Password"...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the knowledge item',
    example: { category: 'authentication', tags: ['password', 'security'] },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
