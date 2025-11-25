import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class IncomingMessageDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsNumber()
  timestamp: number;
}
