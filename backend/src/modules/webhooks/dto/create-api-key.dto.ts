import { IsString, IsArray, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Name of the API key',
    example: 'Production API Key',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    description: 'Array of permissions for the API key',
    example: ['read:messages', 'write:messages', 'read:chatbots'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  permissions?: string[];
}
