import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AIRequestDto {
  @ApiProperty({ description: 'The prompt to send to the AI' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Context messages for the conversation', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  context?: string[];

  @ApiPropertyOptional({ description: 'System prompt to set AI behavior' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Temperature for response randomness (0-2)', minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Maximum tokens in response', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiProperty({ description: 'AI model to use' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'AI provider (openai, anthropic, groq, google, mistral, cohere, llama)' })
  @IsString()
  provider: string;
}
