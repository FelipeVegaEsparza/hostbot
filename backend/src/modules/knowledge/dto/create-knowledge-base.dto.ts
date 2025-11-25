import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeBaseDto {
  @ApiProperty({
    description: 'Name of the knowledge base',
    example: 'Product Documentation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the knowledge base',
    example: 'Knowledge base containing all product documentation and FAQs',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
