import { IsString, IsArray, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateApiKeyDto {
  @ApiPropertyOptional({
    description: 'Name of the API key',
    example: 'Production API Key',
    minLength: 3,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    description: 'Array of permissions for the API key',
    example: ['read:messages', 'write:messages', 'read:chatbots'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Whether the API key is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
