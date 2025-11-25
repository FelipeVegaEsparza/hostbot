import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatbotDto {
  @ApiProperty({
    description: 'Name of the chatbot',
    example: 'Customer Support Bot',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the chatbot',
    example: 'A chatbot to handle customer support inquiries',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'AI provider to use',
    example: 'openai',
    enum: ['openai', 'anthropic', 'groq', 'google', 'mistral', 'cohere', 'llama'],
  })
  @IsString()
  @IsNotEmpty()
  aiProvider: string;

  @ApiProperty({
    description: 'AI model to use',
    example: 'gpt-4o',
  })
  @IsString()
  @IsNotEmpty()
  aiModel: string;

  @ApiPropertyOptional({
    description: 'AI configuration parameters',
    example: { temperature: 0.7, maxTokens: 1000 },
  })
  @IsObject()
  @IsOptional()
  aiConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'System prompt for the chatbot',
    example: 'You are a helpful customer support assistant.',
  })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiPropertyOptional({
    description: 'Knowledge base ID to associate with the chatbot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  knowledgeBaseId?: string;

  @ApiPropertyOptional({
    description: 'Whether the chatbot is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
