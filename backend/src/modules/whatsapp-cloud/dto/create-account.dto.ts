import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWhatsAppCloudAccountDto {
  @ApiProperty({
    description: 'ID of the chatbot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  chatbotId: string;

  @ApiProperty({
    description: 'WhatsApp Business phone number ID from Meta',
    example: '123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({
    description: 'Access token for WhatsApp Cloud API',
    example: 'EAABsbCS1iHgBAOZCZCZBZC...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    description: 'Webhook verification token',
    example: 'my_secure_verify_token_123',
  })
  @IsString()
  @IsNotEmpty()
  webhookVerifyToken: string;
}
