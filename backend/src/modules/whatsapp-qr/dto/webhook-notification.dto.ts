import { IsString, IsNotEmpty, IsObject, IsIn } from 'class-validator';

export class WebhookNotificationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['qr', 'connected', 'disconnected', 'message'])
  type: 'qr' | 'connected' | 'disconnected' | 'message';

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsObject()
  data: any;
}
