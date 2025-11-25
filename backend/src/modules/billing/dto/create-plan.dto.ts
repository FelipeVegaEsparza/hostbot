import { IsString, IsNumber, IsArray, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Starter Plan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'USD', enum: ['USD', 'CLP'] })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  maxChatbots: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(1)
  maxMessagesPerMonth: number;

  @ApiProperty({ example: ['openai', 'anthropic', 'groq'] })
  @IsArray()
  aiProviders: string[];

  @ApiProperty({ example: { customBranding: true, prioritySupport: false } })
  @IsObject()
  @IsOptional()
  features?: Record<string, any>;
}
