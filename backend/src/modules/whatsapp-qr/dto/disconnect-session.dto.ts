import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisconnectSessionDto {
  @ApiProperty({
    description: 'ID of the chatbot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  chatbotId: string;
}
